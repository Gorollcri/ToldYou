from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.user import UserCreate, UserDetail, UserPasswordReset, UserStatusUpdate, UserSummary, UserUpdate
from app.services.user import create_user, get_user_or_404, list_users, reset_user_password, update_user, update_user_status

router = APIRouter()


@router.get("/users", response_model=PaginatedResponse[UserSummary])
def get_users(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    total, items = list_users(db, page, page_size)
    return PaginatedResponse(total=total, page=page, page_size=page_size, items=items)


@router.get("/users/{user_id}", response_model=UserDetail)
def get_user(user_id: int, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    return get_user_or_404(db, user_id)


@router.post("/users", response_model=UserDetail, status_code=status.HTTP_201_CREATED)
def create_new_user(payload: UserCreate, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    return create_user(db, payload)


@router.put("/users/{user_id}", response_model=UserDetail)
def update_existing_user(
    user_id: int, payload: UserUpdate, db: Session = Depends(get_db), _: object = Depends(require_admin)
):
    user = get_user_or_404(db, user_id)
    return update_user(db, user, payload)


@router.put("/users/{user_id}/password", response_model=MessageResponse)
def reset_password(
    user_id: int, payload: UserPasswordReset, db: Session = Depends(get_db), _: object = Depends(require_admin)
):
    user = get_user_or_404(db, user_id)
    reset_user_password(db, user, payload.password)
    return MessageResponse(message="Password updated")


@router.put("/users/{user_id}/status", response_model=UserDetail)
def set_user_status(
    user_id: int, payload: UserStatusUpdate, db: Session = Depends(get_db), _: object = Depends(require_admin)
):
    user = get_user_or_404(db, user_id)
    return update_user_status(db, user, payload)
