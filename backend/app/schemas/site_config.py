from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class SiteConfigRead(ORMModel):
    key: str
    value: str
    description: str | None = None


class SiteConfigItemUpdate(BaseModel):
    key: str = Field(min_length=1, max_length=100)
    value: str
    description: str | None = Field(default=None, max_length=255)


class SiteConfigUpdate(BaseModel):
    items: list[SiteConfigItemUpdate]
