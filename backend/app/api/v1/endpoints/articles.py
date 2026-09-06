from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.article import Article
from app.schemas.article import ArticleResponse, ArticleListResponse
from app.services.search_service import search_published_articles

router = APIRouter()

@router.get("", response_model=ArticleListResponse)
async def list_published_articles(
    category: Optional[str] = Query(None, description="Category slug"),
    tag: Optional[str] = Query(None, description="Tag slug"),
    page: int = Query(1, ge=1),
    size: int = Query(12, ge=1, le=50),
    sort: str = Query("latest", pattern="^(latest|popular|oldest)$"),
    db: AsyncSession = Depends(get_db)
):
    items, total = await search_published_articles(
        db=db,
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

@router.get("/latest", response_model=ArticleListResponse)
async def get_latest_articles(
    limit: int = Query(10, ge=1, le=30),
    db: AsyncSession = Depends(get_db)
):
    items, total = await search_published_articles(
        db=db,
        sort_by="latest",
        page=1,
        size=limit
    )
    return {
        "items": items,
        "total": total,
        "page": 1,
        "size": limit,
        "pages": 1
    }

@router.get("/featured", response_model=ArticleListResponse)
async def get_featured_articles(
    limit: int = Query(5, ge=1, le=10),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Article)
        .options(
            selectinload(Article.category),
            selectinload(Article.source),
            selectinload(Article.image),
            selectinload(Article.tags)
        )
        .where(Article.status == "PUBLISHED", Article.is_featured == True)
        .order_by(Article.published_at.desc())
        .limit(limit)
    )
    res = await db.execute(stmt)
    items = res.scalars().all()
    # Fallback to latest if no featured items
    if not items:
        return await get_latest_articles(limit=limit, db=db)

    return {
        "items": items,
        "total": len(items),
        "page": 1,
        "size": limit,
        "pages": 1
    }

@router.get("/{slug}", response_model=ArticleResponse)
async def get_article_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Article)
        .options(
            selectinload(Article.category),
            selectinload(Article.source),
            selectinload(Article.image),
            selectinload(Article.tags)
        )
        .where(Article.slug == slug, Article.status == "PUBLISHED")
    )
    res = await db.execute(stmt)
    article = res.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    # Increment view count
    await db.execute(
        update(Article)
        .where(Article.id == article.id)
        .values(view_count=Article.view_count + 1)
    )
    await db.commit()
    await db.refresh(article)

    return article
