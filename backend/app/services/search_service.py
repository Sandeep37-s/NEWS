from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, desc, asc
from sqlalchemy.orm import selectinload

from app.models.article import Article
from app.models.category import Category
from app.models.tag import Tag

async def search_published_articles(
    db: AsyncSession,
    query: Optional[str] = None,
    category_slug: Optional[str] = None,
    tag_slug: Optional[str] = None,
    sort_by: str = "latest", # latest, popular, oldest
    page: int = 1,
    size: int = 12
) -> Tuple[List[Article], int]:
    stmt = (
        select(Article)
        .options(
            selectinload(Article.category),
            selectinload(Article.source),
            selectinload(Article.image),
            selectinload(Article.tags)
        )
        .where(Article.status == "PUBLISHED")
    )

    count_stmt = select(func.count(Article.id)).where(Article.status == "PUBLISHED")

    # Category Filter
    if category_slug:
        cat_res = await db.execute(select(Category.id).where(Category.slug == category_slug.lower()))
        cat_id = cat_res.scalar_one_or_none()
        if cat_id:
            stmt = stmt.where(Article.category_id == cat_id)
            count_stmt = count_stmt.where(Article.category_id == cat_id)
        else:
            return [], 0

    # Tag Filter
    if tag_slug:
        stmt = stmt.join(Article.tags).where(Tag.slug == tag_slug.lower())
        count_stmt = count_stmt.join(Article.tags).where(Tag.slug == tag_slug.lower())

    # Text Search Filter
    if query and query.strip():
        term = f"%{query.strip()}%"
        search_filter = or_(
            Article.title.ilike(term),
            Article.summary.ilike(term),
            Article.author.ilike(term)
        )
        stmt = stmt.where(search_filter)
        count_stmt = count_stmt.where(search_filter)

    # Sorting
    if sort_by == "popular":
        stmt = stmt.order_by(desc(Article.view_count), desc(Article.published_at))
    elif sort_by == "oldest":
        stmt = stmt.order_by(asc(Article.published_at))
    else:
        stmt = stmt.order_by(desc(Article.published_at))

    # Pagination
    offset = (page - 1) * size
    stmt = stmt.offset(offset).limit(size)

    total_res = await db.execute(count_stmt)
    total = total_res.scalar() or 0

    articles_res = await db.execute(stmt)
    articles = articles_res.scalars().all()

    return articles, total
