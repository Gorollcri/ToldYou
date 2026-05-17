from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class TagBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    slug: str | None = Field(default=None, max_length=120)


class TagCreate(TagBase):
    pass


class TagRead(ORMModel):
    id: int
    name: str
    slug: str
