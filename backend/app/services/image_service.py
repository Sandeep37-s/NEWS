import os
import uuid
from typing import Optional
from fastapi import UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.image import Image

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5MB

async def save_uploaded_image(
    db: AsyncSession,
    file: UploadFile,
    license_type: str = "OWNED",
    alt_text: Optional[str] = None,
    original_source: Optional[str] = None
) -> Image:
    # 1. Validate extension
    filename = file.filename or "image.jpg"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{ext}'. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # 2. Read content and validate size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File exceeds maximum size of 5MB")

    # 3. Create destination directory
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    storage_url = f"/uploads/{unique_filename}"

    # 4. Create Image DB record
    image_record = Image(
        id=str(uuid.uuid4()),
        storage_url=storage_url,
        original_source=original_source or "Staff Upload",
        license_type=license_type,
        alt_text=alt_text or filename,
    )
    db.add(image_record)
    await db.commit()
    await db.refresh(image_record)

    return image_record
