from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.category import CategoryRead
from app.schemas.common import ORMModel
from app.schemas.tag import TagRead
from app.schemas.user import ArticleAuthor


class ArticleBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    slug: str | None = Field(default=None, max_length=255)
    summary: str | None = None
    content: str = Field(min_length=1)
    cover_image: str | None = None
    status: str = Field(default="draft", pattern="^(draft|published|hidden|deleted)$")
    is_top: bool = False
    is_featured: bool = False
    category_id: int | None = None
    tag_ids: list[int] = Field(default_factory=list)


class ArticleCreate(ArticleBase):
    pass


class ArticleUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(default=None, max_length=255)
    summary: str | None = None
    content: str | None = Field(default=None, min_length=1)
    cover_image: str | None = None
    status: str | None = Field(default=None, pattern="^(draft|published|hidden|deleted)$")
    is_top: bool | None = None
    is_featured: bool | None = None
    category_id: int | None = None
    tag_ids: list[int] | None = None


class ArticleListItem(ORMModel):
    id: int
    title: str
    slug: str
    summary: str | None = None
    cover_image: str | None = None
    status: str
    is_top: bool
    is_featured: bool
    view_count: int
    author: ArticleAuthor
    category: CategoryRead | None = None
    tags: list[TagRead] = Field(default_factory=list)
    created_at: datetime
    published_at: datetime | None = None


class ArticleDetail(ArticleListItem):
    content: str
    author_id: int
    updated_at: datetime
