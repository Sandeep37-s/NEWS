from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.article import ArticleListResponse
from app.services.search_service import search_published_articles

router = APIRouter()

@router.get("", response_model=ArticleListResponse)
async def search(
    q: str = Query("", description="Search keywords"),
    category: Optional[str] = Query(None, description="Category filter slug"),
    tag: Optional[str] = Query(None, description="Tag filter slug"),
    sort: str = Query("latest", regex="^(latest|popular|oldest)$"),
    page: int = Query(1, ge=1),
    size: int = Query(12, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    items, total = await search_published_articles(
        db=db,
        query=q,
        category_slug=category,
        tag_slug=tag,
        sort_by=sort,
        page=page,
        size=size
    )
    pages = (total + size - 1) // size if total > 0 else 1
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": pages
    }
