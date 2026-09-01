from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class TagBase(BaseModel):
    name: str
    slug: str

class TagCreate(TagBase):
    pass

class TagResponse(TagBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ImageBase(BaseModel):
    storage_url: str
    original_source: Optional[str] = None
    license_type: str = "OWNED"
    alt_text: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None

class ImageCreate(ImageBase):
    pass

class ImageResponse(ImageBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
