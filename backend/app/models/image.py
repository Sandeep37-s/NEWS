import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Image(Base):
    __tablename__ = "images"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename: Mapped[str] = mapped_column(String(255), nullable=True)
    storage_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), default="image/jpeg", nullable=True)
    file_size: Mapped[int] = mapped_column(Integer, nullable=True) # size in bytes
    width: Mapped[int] = mapped_column(Integer, nullable=True)
    height: Mapped[int] = mapped_column(Integer, nullable=True)
    
    # Copyright, Editorial Attribution & Licensing
    alt_text: Mapped[str] = mapped_column(String(500), nullable=True)
    caption: Mapped[str] = mapped_column(Text, nullable=True)
    credit: Mapped[str] = mapped_column(String(255), nullable=True)
    original_source: Mapped[str] = mapped_column(String(1024), nullable=True)
    license_type: Mapped[str] = mapped_column(String(50), default="OWNED", nullable=False) # PUBLIC_DOMAIN, CC_BY, LICENSED, OWNED, FAIR_USE_THUMBNAIL
    license_url: Mapped[str] = mapped_column(String(2048), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    articles = relationship("Article", back_populates="image")

