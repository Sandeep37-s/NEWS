import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Boolean, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.tag import article_tags

class Article(Base):
    __tablename__ = "articles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(500), unique=True, index=True, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=True)
    
    # Source & Aggregation Details
    source_id: Mapped[str] = mapped_column(String(36), ForeignKey("sources.id", ondelete="SET NULL"), nullable=True)
    original_url: Mapped[str] = mapped_column(String(1024), nullable=True)
    url_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=True) # SHA256 deduplication
    external_id: Mapped[str] = mapped_column(String(255), nullable=True, index=True)
    content_origin: Mapped[str] = mapped_column(String(50), default="ORIGINAL", nullable=False) # ORIGINAL, AGGREGATED, AI_ASSISTED, LICENSED
    
    # Media & Classification
    image_id: Mapped[str] = mapped_column(String(36), ForeignKey("images.id", ondelete="SET NULL"), nullable=True)
    author: Mapped[str] = mapped_column(String(255), nullable=True)
    category_id: Mapped[str] = mapped_column(String(36), ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False)
    created_by_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Workflow Status
    status: Mapped[str] = mapped_column(String(50), default="DRAFT", index=True, nullable=False) # DRAFT, PENDING_REVIEW, PUBLISHED, REJECTED, SCHEDULED, ARCHIVED
    published_at: Mapped[datetime] = mapped_column(DateTime, nullable=True, index=True)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime, nullable=True, index=True)
    
    # Metrics & Flags
    view_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    category = relationship("Category", back_populates="articles")
    source = relationship("Source", back_populates="articles")
    image = relationship("Image", back_populates="articles")
    creator = relationship("User", back_populates="articles")
    tags = relationship("Tag", secondary=article_tags, back_populates="articles")

    __table_args__ = (
        Index("ix_articles_status_published_at", "status", "published_at"),
        Index("ix_articles_category_status", "category_id", "status"),
    )
