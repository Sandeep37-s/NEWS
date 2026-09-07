from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class HotNewsItemResponse(BaseModel):
    id: str
    article_id: Optional[str] = None
    source_url: str
    title: str
    slug: Optional[str] = None
    summary: Optional[str] = None
    image_url: Optional[str] = None
    category_slug: Optional[str] = None
    source_name: Optional[str] = None
    viral_score: float
    source_count: int = 1
    published_at: Optional[datetime] = None
    added_at: datetime
    expires_at: datetime

    model_config = ConfigDict(from_attributes=True)

class HotNewsResponse(BaseModel):
    items: List[HotNewsItemResponse]
    count: int
    max_items: int = 30
    remaining_slots: int
    last_reset_at: Optional[str] = None
    next_reset_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
