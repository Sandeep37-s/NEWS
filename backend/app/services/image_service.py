import os
import io
import uuid
import logging
from typing import Optional
from fastapi import UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from PIL import Image as PILImage, ImageOps

from app.core.config import settings
from app.models.image import Image

logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif"
}

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10MB limit
MAX_DIMENSION_PX = 2560  # Maximum dimension before downscaling for web performance

async def save_uploaded_image(
    db: AsyncSession,
    file: UploadFile,
    license_type: str = "OWNED",
    alt_text: Optional[str] = None,
    caption: Optional[str] = None,
    credit: Optional[str] = None,
    original_source: Optional[str] = None,
    license_url: Optional[str] = None
) -> Image:
    """
    Validates, optimizes, and persists an uploaded image with full editorial copyright metadata.
    Uses Pillow to verify image byte integrity and generate web-optimized assets.
    """
    raw_filename = file.filename or "uploaded_image.jpg"
    ext = os.path.splitext(raw_filename)[1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file extension '{ext}'. Allowed extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # Read binary content
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File exceeds maximum allowable size of 10MB.")

    # Validate image bytes with Pillow (reject fake extensions and malicious executables)
    try:
        pil_image = PILImage.open(io.BytesIO(content))
        pil_image.verify()  # Verifies file integrity and header
        
        # Re-open after verify() as recommended in PIL documentation
        pil_image = PILImage.open(io.BytesIO(content))
        
        # Auto-orient based on EXIF tags
        pil_image = ImageOps.exif_transpose(pil_image)
    except Exception as e:
        logger.error(f"Image validation failed for '{raw_filename}': {e}")
        raise HTTPException(
            status_code=400,
            detail="Corrupted or invalid image file. Please upload a standard JPEG, PNG, or WebP image."
        )

    orig_width, orig_height = pil_image.size
    image_format = (pil_image.format or "JPEG").upper()

    # Determine optimal output format and extension (convert PNG/JPEG to WebP when appropriate)
    output_ext = ".webp" if image_format in ["JPEG", "PNG", "WEBP"] else (ALLOWED_MIME_TYPES.get(file.content_type, ext) if file.content_type in ALLOWED_MIME_TYPES else ext)
    mime_type = "image/webp" if output_ext == ".webp" else (file.content_type or "image/jpeg")

    # Resize if oversized for web publishing
    target_width, target_height = orig_width, orig_height
    if target_width > MAX_DIMENSION_PX or target_height > MAX_DIMENSION_PX:
        pil_image.thumbnail((MAX_DIMENSION_PX, MAX_DIMENSION_PX), PILImage.Resampling.LANCZOS)
        target_width, target_height = pil_image.size

    # Prepare storage directory
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    unique_filename = f"{uuid.uuid4()}{output_ext}"
    dest_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    try:
        # Save optimized image
        if output_ext == ".webp":
            if pil_image.mode in ("RGBA", "LA") or (pil_image.mode == "P" and "transparency" in pil_image.info):
                pil_image.save(dest_path, "WEBP", quality=85, method=4)
            else:
                rgb_im = pil_image.convert("RGB")
                rgb_im.save(dest_path, "WEBP", quality=85, method=4)
        else:
            pil_image.save(dest_path)
    except Exception as e:
        # Fallback to direct raw write if format save fails
        logger.warning(f"PIL save fallback for '{unique_filename}': {e}")
        with open(dest_path, "wb") as f:
            f.write(content)

    final_file_size = os.path.getsize(dest_path)
    storage_url = f"/uploads/{unique_filename}"

    # Create database record
    image_record = Image(
        id=str(uuid.uuid4()),
        filename=raw_filename,
        storage_url=storage_url,
        mime_type=mime_type,
        file_size=final_file_size,
        width=target_width,
        height=target_height,
        alt_text=alt_text or raw_filename,
        caption=caption,
        credit=credit,
        original_source=original_source or "Staff Upload",
        license_type=license_type or "OWNED",
        license_url=license_url
    )

    db.add(image_record)
    await db.commit()
    await db.refresh(image_record)

    return image_record
