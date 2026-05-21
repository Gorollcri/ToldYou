from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User
from app.schemas.article import ArticleCreate, ArticleDetail, ArticleListItem, ArticleUpdate
from app.schemas.common import MessageResponse, PaginatedResponse
from app.services.article import (
    can_manage_article,
    create_article,
    get_article_by_id,
    list_articles,
    soft_delete_article,
    update_article,
)

router = APIRouter()


@router.get("/articles", response_model=PaginatedResponse[ArticleListItem])
def get_my_articles(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total, items = list_articles(
        db,
        page=page,
        page_size=page_size,
        status=status_filter,
        admin_mode=True,
        current_user=current_user,
        owner_only=True,
    )
    return PaginatedResponse(total=total, page=page, page_size=page_size, items=items)


@router.get("/articles/{article_id}", response_model=ArticleDetail)
def get_my_article(article_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    article = get_article_by_id(db, article_id)
    if article is None or not can_manage_article(current_user, article):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    return article


@router.post("/articles", response_model=ArticleDetail, status_code=status.HTTP_201_CREATED)
def create_my_article(payload: ArticleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_article(db, payload, author_id=current_user.id)


@router.put("/articles/{article_id}", response_model=ArticleDetail)
def update_my_article(
    article_id: int,
    payload: ArticleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article = get_article_by_id(db, article_id)
    if article is None or not can_manage_article(current_user, article):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    return update_article(db, article, payload)


@router.delete("/articles/{article_id}", response_model=MessageResponse)
def delete_my_article(article_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    article = get_article_by_id(db, article_id)
    if article is None or not can_manage_article(current_user, article):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    soft_delete_article(db, article)
    return MessageResponse(message="Article deleted")
