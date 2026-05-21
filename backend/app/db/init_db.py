from sqlalchemy import select

from app.core.config import get_settings
from app.core.security import get_password_hash
from app.db.base import Base
from app.db.session import engine, with_session
from app.models import Article, Category, Media, SiteConfig, Tag, User

DEFAULT_SITE_CONFIGS = {
    "site_title": "ToldYou Blog",
    "site_subtitle": "Backend / AI / Web Design",
    "home_intro": "专注于后端工程、AI Agent 与系统设计",
    "github_url": "https://github.com/example",
    "email": "hello@example.com",
}


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    settings = get_settings()

    with with_session() as db:
        admin = db.scalar(select(User).where(User.username == settings.admin_username))
        if admin is None:
            admin = User(
                username=settings.admin_username,
                password_hash=get_password_hash(settings.admin_password),
                nickname=settings.admin_nickname,
                bio="System administrator",
                role="admin",
                status="active",
            )
            db.add(admin)
        else:
            admin.role = "admin"
            admin.status = "active"

        for key, fallback in DEFAULT_SITE_CONFIGS.items():
            existing = db.scalar(select(SiteConfig).where(SiteConfig.key == key))
            if existing is None:
                value = getattr(settings, key, fallback)
                db.add(SiteConfig(key=key, value=value, description=f"Default config for {key}"))

        db.commit()
