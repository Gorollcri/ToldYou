from fastapi import APIRouter

from app.api.routes import admin_articles, auth, categories, me_articles, site_config, tags, upload, users

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(admin_articles.public_router, tags=["articles"])
api_router.include_router(me_articles.router, prefix="/me", tags=["me-articles"])
api_router.include_router(categories.router, tags=["categories"])
api_router.include_router(tags.router, tags=["tags"])
api_router.include_router(site_config.public_router, tags=["site-config"])
api_router.include_router(admin_articles.admin_router, prefix="/admin", tags=["admin-articles"])
api_router.include_router(users.router, prefix="/admin", tags=["admin-users"])
api_router.include_router(categories.admin_router, prefix="/admin", tags=["admin-categories"])
api_router.include_router(tags.admin_router, prefix="/admin", tags=["admin-tags"])
api_router.include_router(site_config.admin_router, prefix="/admin", tags=["admin-site-config"])
api_router.include_router(upload.router, prefix="/admin", tags=["admin-upload"])
