from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.schemas.site_config import SiteConfigRead, SiteConfigUpdate
from app.services.site_config import list_site_configs, update_site_configs

public_router = APIRouter()
admin_router = APIRouter()


@public_router.get("/site/config", response_model=list[SiteConfigRead])
def get_site_config(db: Session = Depends(get_db)):
    return list_site_configs(db)


@admin_router.put("/site/config", response_model=list[SiteConfigRead])
def put_site_config(
    payload: SiteConfigUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    return update_site_configs(db, payload)
