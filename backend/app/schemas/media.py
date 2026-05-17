from datetime import datetime

from app.schemas.common import ORMModel


class MediaRead(ORMModel):
    id: int
    filename: str
    original_name: str
    url: str
    mime_type: str
    size: int
    uploader_id: int
    created_at: datetime
