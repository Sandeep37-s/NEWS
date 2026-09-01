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

# Re-export Image schemas from media.py for backward compatibility
from app.schemas.media import ImageBase, ImageCreate, ImageResponse, ImageUpdate, MediaListResponse
