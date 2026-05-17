from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.schemas.tag import TagCreate, TagRead
from app.services.taxonomy import create_tag, list_tags

router = APIRouter()
admin_router = APIRouter()


@router.get("/tags", response_model=list[TagRead])
def get_tags(db: Session = Depends(get_db)):
    return list_tags(db)


@admin_router.post("/tags", response_model=TagRead, status_code=status.HTTP_201_CREATED)
def post_tag(
    payload: TagCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    try:
        return create_tag(db, payload)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Tag name or slug already exists")
