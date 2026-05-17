from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ToldYou Blog API"
    app_env: str = "development"
    debug: bool = True
    api_prefix: str = "/api"

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 120

    admin_username: str = "admin"
    admin_password: str = "Admin123456"
    admin_nickname: str = "Site Admin"

    database_url: str = "sqlite:///./blog.db"
    upload_dir: str = "./media"
    max_upload_size_mb: int = 5
    allowed_image_types_raw: str = Field(
        default="image/jpeg,image/png,image/webp,image/gif",
        alias="ALLOWED_IMAGE_TYPES",
    )

    site_title: str = "ToldYou Blog"
    site_subtitle: str = "Backend / AI / Web Design"
    home_intro: str = "专注于后端工程、AI Agent 与系统设计"
    github_url: str = "https://github.com/example"
    email: str = "hello@example.com"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def allowed_image_types(self) -> List[str]:
        return [item.strip() for item in self.allowed_image_types_raw.split(",") if item.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
