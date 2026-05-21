from datetime import datetime, timezone

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models import Article, Category, Tag, User
from app.schemas.article import ArticleCreate, ArticleUpdate
from app.utils.slug import make_slug


def _generate_unique_slug(db: Session, title: str, slug: str | None, article_id: int | None = None) -> str:
    base_slug = make_slug(slug or title)
    candidate = base_slug
    suffix = 1

    while True:
        stmt = select(Article).where(Article.slug == candidate)
        if article_id is not None:
            stmt = stmt.where(Article.id != article_id)
        existing = db.scalar(stmt)
        if existing is None:
            return candidate
        suffix += 1
        candidate = f"{base_slug}-{suffix}"


def _resolve_tags(db: Session, tag_ids: list[int]) -> list[Tag]:
    if not tag_ids:
        return []
    tags = list(db.scalars(select(Tag).where(Tag.id.in_(tag_ids)).order_by(Tag.id.asc())))
    if len(tags) != len(set(tag_ids)):
        raise ValueError("Some tags do not exist")
    return tags


def _validate_category(db: Session, category_id: int | None) -> Category | None:
    if category_id is None:
        return None
    category = db.get(Category, category_id)
    if category is None:
        raise ValueError("Category does not exist")
    return category


def create_article(db: Session, payload: ArticleCreate, author_id: int) -> Article:
    _validate_category(db, payload.category_id)
    article = Article(
        title=payload.title,
        slug=_generate_unique_slug(db, payload.title, payload.slug),
        summary=payload.summary,
        content=payload.content,
        cover_image=payload.cover_image,
        status=payload.status,
        is_top=payload.is_top,
        is_featured=payload.is_featured,
        author_id=author_id,
        category_id=payload.category_id,
        published_at=datetime.now(timezone.utc) if payload.status == "published" else None,
    )
    article.tags = _resolve_tags(db, payload.tag_ids)
    db.add(article)
    db.commit()
    db.refresh(article)
    return get_article_by_id(db, article.id)


def update_article(db: Session, article: Article, payload: ArticleUpdate) -> Article:
    data = payload.model_dump(exclude_unset=True)
    if "category_id" in data:
        _validate_category(db, data["category_id"])
    if "title" in data or "slug" in data:
        title = data.get("title", article.title)
        slug = data.get("slug", article.slug)
        article.slug = _generate_unique_slug(db, title, slug, article_id=article.id)
    for field, value in data.items():
        if field not in {"tag_ids", "slug"}:
            setattr(article, field, value)
    if "status" in data and data["status"] == "published" and article.published_at is None:
        article.published_at = datetime.now(timezone.utc)
    if "tag_ids" in data and data["tag_ids"] is not None:
        article.tags = _resolve_tags(db, data["tag_ids"])
    db.commit()
    return get_article_by_id(db, article.id)


def soft_delete_article(db: Session, article: Article) -> None:
    article.status = "deleted"
    db.commit()


def can_manage_article(current_user: User, article: Article) -> bool:
    return current_user.role == "admin" or article.author_id == current_user.id


def get_article_by_id(db: Session, article_id: int) -> Article | None:
    stmt = (
        select(Article)
        .options(joinedload(Article.author), joinedload(Article.category), joinedload(Article.tags))
        .where(Article.id == article_id)
    )
    return db.execute(stmt).unique().scalar_one_or_none()


def get_article_by_slug(db: Session, slug: str, include_unpublished: bool = False) -> Article | None:
    stmt = (
        select(Article)
        .options(joinedload(Article.author), joinedload(Article.category), joinedload(Article.tags))
        .where(Article.slug == slug)
    )
    if not include_unpublished:
        stmt = stmt.where(Article.status == "published")
    article = db.execute(stmt).unique().scalar_one_or_none()
    if article and not include_unpublished:
        article.view_count += 1
        db.commit()
        db.refresh(article)
    return article


def list_articles(
    db: Session,
    page: int,
    page_size: int,
    status: str | None = None,
    category_slug: str | None = None,
    tag_slug: str | None = None,
    keyword: str | None = None,
    admin_mode: bool = False,
    current_user: User | None = None,
    owner_only: bool = False,
) -> tuple[int, list[Article]]:
    stmt = select(Article).options(joinedload(Article.author), joinedload(Article.category), joinedload(Article.tags))
    count_stmt = select(func.count(Article.id))

    if not admin_mode:
        stmt = stmt.where(Article.status == "published")
        count_stmt = count_stmt.where(Article.status == "published")
    elif status:
        stmt = stmt.where(Article.status == status)
        count_stmt = count_stmt.where(Article.status == status)

    if category_slug:
        stmt = stmt.join(Article.category).where(Category.slug == category_slug)
        count_stmt = count_stmt.join(Article.category).where(Category.slug == category_slug)

    if tag_slug:
        stmt = stmt.join(Article.tags).where(Tag.slug == tag_slug)
        count_stmt = count_stmt.join(Article.tags).where(Tag.slug == tag_slug)

    if keyword:
        keyword_expr = f"%{keyword}%"
        filters = or_(Article.title.ilike(keyword_expr), Article.summary.ilike(keyword_expr))
        stmt = stmt.where(filters)
        count_stmt = count_stmt.where(filters)

    if owner_only and current_user is not None:
        stmt = stmt.where(Article.author_id == current_user.id)
        count_stmt = count_stmt.where(Article.author_id == current_user.id)

    total = db.scalar(count_stmt) or 0
    items = list(
        db.scalars(
            stmt.order_by(Article.is_top.desc(), Article.published_at.desc(), Article.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).unique()
    )
    return total, items
