from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class CategoryBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    slug: str | None = Field(default=None, max_length=120)
    description: str | None = None
    sort_order: int = 0


class CategoryCreate(CategoryBase):
    pass


class CategoryRead(ORMModel):
    id: int
    name: str
    slug: str
    description: str | None = None
    sort_order: int
