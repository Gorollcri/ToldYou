from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel

ROLE_PATTERN = "^(admin|member)$"
STATUS_PATTERN = "^(active|disabled)$"


class UserSummary(ORMModel):
    id: int
    username: str
    nickname: str
    avatar: str | None = None
    bio: str | None = None
    role: str
    status: str
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime | None = None


class UserDetail(UserSummary):
    pass


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6, max_length=128)
    nickname: str = Field(min_length=1, max_length=100)
    avatar: str | None = Field(default=None, max_length=255)
    bio: str | None = Field(default=None, max_length=500)
    role: str = Field(default="member", pattern=ROLE_PATTERN)
    status: str = Field(default="active", pattern=STATUS_PATTERN)


class UserUpdate(BaseModel):
    nickname: str | None = Field(default=None, min_length=1, max_length=100)
    avatar: str | None = Field(default=None, max_length=255)
    bio: str | None = Field(default=None, max_length=500)
    role: str | None = Field(default=None, pattern=ROLE_PATTERN)
    status: str | None = Field(default=None, pattern=STATUS_PATTERN)


class UserPasswordReset(BaseModel):
    password: str = Field(min_length=6, max_length=128)


class UserStatusUpdate(BaseModel):
    status: str = Field(pattern=STATUS_PATTERN)


class SelfProfileUpdate(BaseModel):
    nickname: str = Field(min_length=1, max_length=100)
    avatar: str | None = Field(default=None, max_length=255)
    bio: str | None = Field(default=None, max_length=500)


class SelfPasswordUpdate(BaseModel):
    current_password: str = Field(min_length=6, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)


class ArticleAuthor(ORMModel):
    id: int
    username: str
    nickname: str
    avatar: str | None = None
