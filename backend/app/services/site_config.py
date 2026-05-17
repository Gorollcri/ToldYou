from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import SiteConfig
from app.schemas.site_config import SiteConfigUpdate


def list_site_configs(db: Session) -> list[SiteConfig]:
    return list(db.scalars(select(SiteConfig).order_by(SiteConfig.key.asc())))


def update_site_configs(db: Session, payload: SiteConfigUpdate) -> list[SiteConfig]:
    existing_map = {item.key: item for item in db.scalars(select(SiteConfig))}
    for item in payload.items:
        config = existing_map.get(item.key)
        if config is None:
            config = SiteConfig(key=item.key, value=item.value, description=item.description)
            db.add(config)
            existing_map[item.key] = config
        else:
            config.value = item.value
            config.description = item.description

    db.commit()
    return list_site_configs(db)
