from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.models import User
from app.schemas.article import ArticleCreate, ArticleDetail, ArticleListItem, ArticleUpdate
from app.schemas.common import MessageResponse, PaginatedResponse
from app.services.article import (
    create_article,
    get_article_by_id,
    get_article_by_slug,
    list_articles,
    soft_delete_article,
    update_article,
)

public_router = APIRouter()
admin_router = APIRouter()


@public_router.get("/articles", response_model=PaginatedResponse[ArticleListItem])
def get_articles(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    category: str | None = None,
    tag: str | None = None,
    keyword: str | None = None,
    db: Session = Depends(get_db),
):
    total, items = list_articles(
        db,
        page=page,
        page_size=page_size,
        category_slug=category,
        tag_slug=tag,
        keyword=keyword,
    )
    return PaginatedResponse(total=total, page=page, page_size=page_size, items=items)


@public_router.get("/articles/{slug}", response_model=ArticleDetail)
def get_article(slug: str, db: Session = Depends(get_db)):
    article = get_article_by_slug(db, slug)
    if article is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    return article


@admin_router.get("/articles", response_model=PaginatedResponse[ArticleListItem])
def get_admin_articles(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    total, items = list_articles(db, page=page, page_size=page_size, status=status_filter, admin_mode=True)
    return PaginatedResponse(total=total, page=page, page_size=page_size, items=items)


@admin_router.get("/articles/{article_id}", response_model=ArticleDetail)
def get_admin_article(article_id: int, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    article = get_article_by_id(db, article_id)
    if article is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    return article


@admin_router.post("/articles", response_model=ArticleDetail, status_code=status.HTTP_201_CREATED)
def post_article(
    payload: ArticleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    try:
        return create_article(db, payload, current_user.id)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Article slug already exists")
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@admin_router.put("/articles/{article_id}", response_model=ArticleDetail)
def put_article(
    article_id: int,
    payload: ArticleUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    article = get_article_by_id(db, article_id)
    if article is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    try:
        updated = update_article(db, article, payload)
        if updated is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
        return updated
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Article slug already exists")
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@admin_router.delete("/articles/{article_id}", response_model=MessageResponse)
def delete_article(article_id: int, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    article = get_article_by_id(db, article_id)
    if article is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    soft_delete_article(db, article)
    return MessageResponse(message="Article deleted")
