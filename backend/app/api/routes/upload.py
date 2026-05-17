from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.config import get_settings
from app.db.session import get_db
from app.models import Media, User
from app.schemas.media import MediaRead

router = APIRouter()
settings = get_settings()


@router.post("/upload/image", response_model=MediaRead, status_code=status.HTTP_201_CREATED)
def upload_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if file.content_type not in settings.allowed_image_types:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported image type")

    content = file.file.read()
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File exceeds size limit")

    suffix = Path(file.filename or "upload").suffix or ".bin"
    filename = f"{uuid4().hex}{suffix}"
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / filename
    file_path.write_bytes(content)

    media = Media(
        filename=filename,
        original_name=file.filename or filename,
        url=f"/media/{filename}",
        mime_type=file.content_type or "application/octet-stream",
        size=len(content),
        uploader_id=current_user.id,
    )
    db.add(media)
    db.commit()
    db.refresh(media)
    return media
