from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.category import CategoryResponse
from app.schemas.source import SourceResponse
from app.schemas.tag import TagResponse, ImageResponse

class ArticleBase(BaseModel):
    title: str
    slug: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    category_id: str
    author: Optional[str] = None
    content_origin: str = "ORIGINAL"
    is_featured: bool = False

class ArticleCreate(ArticleBase):
    tags: Optional[List[str]] = []
    image_id: Optional[str] = None
    status: str = "DRAFT"
    scheduled_at: Optional[datetime] = None

class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    category_id: Optional[str] = None
    image_id: Optional[str] = None
    author: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = None
    published_at: Optional[datetime] = None
    scheduled_at: Optional[datetime] = None
    is_featured: Optional[bool] = None

class ArticleResponse(ArticleBase):
    id: str
    slug: str
    source_id: Optional[str] = None
    original_url: Optional[str] = None
    url_hash: Optional[str] = None
    external_id: Optional[str] = None
    image_id: Optional[str] = None
    status: str
    published_at: Optional[datetime] = None
    scheduled_at: Optional[datetime] = None
    view_count: int
    created_at: datetime
    updated_at: datetime
    
    category: Optional[CategoryResponse] = None
    source: Optional[SourceResponse] = None
    image: Optional[ImageResponse] = None
    tags: List[TagResponse] = []

    model_config = ConfigDict(from_attributes=True)

class ArticleListResponse(BaseModel):
    items: List[ArticleResponse]
    total: int
    page: int
    size: int
    pages: int
