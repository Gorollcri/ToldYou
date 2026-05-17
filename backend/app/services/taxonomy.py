from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Category, Tag
from app.schemas.category import CategoryCreate
from app.schemas.tag import TagCreate
from app.utils.slug import make_slug


def create_category(db: Session, payload: CategoryCreate) -> Category:
    slug = payload.slug or make_slug(payload.name)
    category = Category(
        name=payload.name,
        slug=slug,
        description=payload.description,
        sort_order=payload.sort_order,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def create_tag(db: Session, payload: TagCreate) -> Tag:
    slug = payload.slug or make_slug(payload.name)
    tag = Tag(name=payload.name, slug=slug)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


def list_categories(db: Session) -> list[Category]:
    return list(db.scalars(select(Category).order_by(Category.sort_order.asc(), Category.id.asc())))


def list_tags(db: Session) -> list[Tag]:
    return list(db.scalars(select(Tag).order_by(Tag.id.asc())))
