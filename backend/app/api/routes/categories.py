from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.schemas.category import CategoryCreate, CategoryRead
from app.services.taxonomy import create_category, list_categories

router = APIRouter()
admin_router = APIRouter()


@router.get("/categories", response_model=list[CategoryRead])
def get_categories(db: Session = Depends(get_db)):
    return list_categories(db)


@admin_router.post("/categories", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def post_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    try:
        return create_category(db, payload)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category name or slug already exists")
