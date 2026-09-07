from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.hot_news import HotNewsResponse
from app.services.hot_news_service import get_hot_news_feed

router = APIRouter()

@router.get("", response_model=HotNewsResponse)
async def get_rolling_hot_news(
    limit: int = Query(30, ge=1, le=30, description="Max stories to return (capped at 30)"),
    category: Optional[str] = Query(None, description="Optional category filter slug"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current Rolling Viral News 30 stories.
    Ordered by viral_score DESC, published_at DESC.
    Includes remaining available slots and 12-hour rolling reset window timing.
    """
    return await get_hot_news_feed(
        db=db,
        limit=limit,
        category_slug=category
    )
