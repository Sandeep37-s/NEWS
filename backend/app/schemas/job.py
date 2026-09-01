from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict
from app.schemas.source import SourceResponse

class ProcessingJobResponse(BaseModel):
    id: str
    job_type: str
    status: str
    source_id: Optional[str] = None
    items_fetched: int
    items_processed: int
    items_skipped: int
    error_message: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    source: Optional[SourceResponse] = None

    model_config = ConfigDict(from_attributes=True)

class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    details: Optional[Any] = None
    ip_address: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DashboardStats(BaseModel):
    total_articles: int
    published_today: int
    pending_review: int
    drafts: int
    scheduled: int
    total_sources: int
    failed_sources: int
    articles_this_week: int
    recent_activity: List[AuditLogResponse]
