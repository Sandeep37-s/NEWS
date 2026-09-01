import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Source(Base):
    __tablename__ = "sources"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    website_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    rss_url: Mapped[str] = mapped_column(String(1024), unique=True, index=True, nullable=False)
    provider_type: Mapped[str] = mapped_column(String(50), default="RSS", nullable=False) # RSS, LICENSED_API, CUSTOM
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    default_category_id: Mapped[str] = mapped_column(String(36), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    
    # Copyright & Usage Policies
    usage_policy: Mapped[str] = mapped_column(String(50), default="METADATA_ONLY", nullable=False) # METADATA_ONLY, SUMMARY_ALLOWED, LICENSED_REPUBLISH
    image_policy: Mapped[str] = mapped_column(String(50), default="NOT_ALLOWED", nullable=False) # NOT_ALLOWED, LICENSED, OWNED
    attribution_required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    trust_level: Mapped[str] = mapped_column(String(50), default="MANUAL_REVIEW", nullable=False) # MANUAL_REVIEW, AUTO_PUBLISH
    
    last_fetched_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    last_error: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    default_category = relationship("Category", back_populates="sources")
    articles = relationship("Article", back_populates="source")
    jobs = relationship("ProcessingJob", back_populates="source")
