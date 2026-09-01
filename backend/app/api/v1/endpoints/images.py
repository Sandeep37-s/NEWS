from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_editor
from app.models.user import User
from app.models.image import Image
from app.schemas.tag import ImageResponse
from app.services.image_service import save_uploaded_image

router = APIRouter()

@router.post("/upload", response_model=ImageResponse)
async def upload_image(
    file: UploadFile = File(...),
    license_type: str = Form("OWNED"), # PUBLIC_DOMAIN, CC_BY, LICENSED, OWNED, FAIR_USE_THUMBNAIL
    alt_text: str = Form(""),
    caption: str = Form(""),
    credit: str = Form(""),
    original_source: str = Form("Editorial Team"),
    license_url: str = Form(""),
    current_user: User = Depends(get_current_editor),
    db: AsyncSession = Depends(get_db)
):
    image_record = await save_uploaded_image(
        db=db,
        file=file,
        license_type=license_type,
        alt_text=alt_text or None,
        caption=caption or None,
        credit=credit or None,
        original_source=original_source or None,
        license_url=license_url or None
    )
    return image_record

