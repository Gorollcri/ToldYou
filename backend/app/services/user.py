from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.models import User
from app.schemas.user import SelfPasswordUpdate, SelfProfileUpdate, UserCreate, UserStatusUpdate, UserUpdate


def list_users(db: Session, page: int, page_size: int) -> tuple[int, list[User]]:
    total = db.scalar(select(func.count(User.id))) or 0
    items = list(
        db.scalars(
            select(User).order_by(User.created_at.desc(), User.id.desc()).offset((page - 1) * page_size).limit(page_size)
        )
    )
    return total, items


def get_user_or_404(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def get_user_by_username(db: Session, username: str) -> User | None:
    return db.scalar(select(User).where(User.username == username))


def create_user(db: Session, payload: UserCreate) -> User:
    if get_user_by_username(db, payload.username) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists")

    user = User(
        username=payload.username,
        password_hash=get_password_hash(payload.password),
        nickname=payload.nickname,
        avatar=payload.avatar,
        bio=payload.bio,
        role=payload.role,
        status=payload.status,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user: User, payload: UserUpdate) -> User:
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


def reset_user_password(db: Session, user: User, password: str) -> User:
    user.password_hash = get_password_hash(password)
    db.commit()
    db.refresh(user)
    return user


def update_user_status(db: Session, user: User, payload: UserStatusUpdate) -> User:
    user.status = payload.status
    db.commit()
    db.refresh(user)
    return user


def update_self_profile(db: Session, user: User, payload: SelfProfileUpdate) -> User:
    user.nickname = payload.nickname
    user.avatar = payload.avatar
    user.bio = payload.bio
    db.commit()
    db.refresh(user)
    return user


def update_self_password(db: Session, user: User, payload: SelfPasswordUpdate) -> None:
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    user.password_hash = get_password_hash(payload.new_password)
    db.commit()


def mark_user_logged_in(db: Session, user: User) -> User:
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return user
