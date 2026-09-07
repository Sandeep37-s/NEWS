import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Float, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class HotNews(Base):
    __tablename__ = "hot_news"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    article_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("articles.id", ondelete="SET NULL"), nullable=True, index=True)
    
    source_url: Mapped[str] = mapped_column(String(2048), nullable=False, unique=True, index=True)
    url_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    slug: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, index=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    category_slug: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    source_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    viral_score: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    source_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, index=True)
    added_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)

    # Relationships
    article = relationship("Article", lazy="selectin")

    __table_args__ = (
        Index("ix_hot_news_score_published", "viral_score", "published_at"),
        Index("ix_hot_news_expires_score", "expires_at", "viral_score"),
    )
