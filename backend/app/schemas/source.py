from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class SourceBase(BaseModel):
    name: str
    website_url: str
    rss_url: str
    provider_type: str = "RSS"
    enabled: bool = True
    default_category_id: Optional[str] = None
    usage_policy: str = "METADATA_ONLY" # METADATA_ONLY, SUMMARY_ALLOWED, LICENSED_REPUBLISH
    image_policy: str = "NOT_ALLOWED" # NOT_ALLOWED, LICENSED, OWNED
    attribution_required: bool = True
    trust_level: str = "MANUAL_REVIEW" # MANUAL_REVIEW, AUTO_PUBLISH

class SourceCreate(SourceBase):
    pass

class SourceUpdate(BaseModel):
    name: Optional[str] = None
    website_url: Optional[str] = None
    rss_url: Optional[str] = None
    provider_type: Optional[str] = None
    enabled: Optional[bool] = None
    default_category_id: Optional[str] = None
    usage_policy: Optional[str] = None
    image_policy: Optional[str] = None
    attribution_required: Optional[bool] = None
    trust_level: Optional[str] = None

class SourceResponse(SourceBase):
    id: str
    last_fetched_at: Optional[datetime] = None
    last_error: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
