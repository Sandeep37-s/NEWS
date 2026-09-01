from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class ImageBase(BaseModel):
    storage_url: str
    filename: Optional[str] = None
    mime_type: Optional[str] = "image/jpeg"
    file_size: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    alt_text: Optional[str] = None
    caption: Optional[str] = None
    credit: Optional[str] = None
    original_source: Optional[str] = None
    license_type: str = "OWNED" # OWNED, LICENSED, CC_BY, PUBLIC_DOMAIN, FAIR_USE_THUMBNAIL
    license_url: Optional[str] = None

class ImageCreate(ImageBase):
    pass

class ImageUpdate(BaseModel):
    alt_text: Optional[str] = None
    caption: Optional[str] = None
    credit: Optional[str] = None
    original_source: Optional[str] = None
    license_type: Optional[str] = None
    license_url: Optional[str] = None

class ImageResponse(ImageBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class MediaListResponse(BaseModel):
    items: List[ImageResponse]
    total: int
    page: int
    size: int
    pages: int
