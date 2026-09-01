import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Image(Base):
    __tablename__ = "images"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    storage_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    original_source: Mapped[str] = mapped_column(String(1024), nullable=True)
    license_type: Mapped[str] = mapped_column(String(50), default="OWNED", nullable=False) # PUBLIC_DOMAIN, CC_BY, LICENSED, OWNED, FAIR_USE_THUMBNAIL
    alt_text: Mapped[str] = mapped_column(String(255), nullable=True)
    width: Mapped[int] = mapped_column(Integer, nullable=True)
    height: Mapped[int] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    articles = relationship("Article", back_populates="image")
