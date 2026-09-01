import uuid
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.api.deps import get_current_editor, get_current_super_admin
from app.models.user import User
from app.models.article import Article
from app.models.category import Category
from app.models.source import Source
from app.models.tag import Tag
from app.models.job import ProcessingJob
from app.models.audit_log import AuditLog
from app.schemas.article import ArticleResponse, ArticleCreate, ArticleUpdate, ArticleListResponse
from app.schemas.source import SourceResponse, SourceCreate, SourceUpdate
from app.schemas.category import CategoryResponse, CategoryCreate, CategoryUpdate
from app.schemas.tag import TagResponse, TagCreate
from app.schemas.job import ProcessingJobResponse, AuditLogResponse, DashboardStats
from app.services.publishing import publish_article, reject_article, schedule_article, record_audit_log
from app.services.ingestion.normalizer import generate_slug, sanitize_rich_text
from app.services.ingestion.orchestrator import process_single_source, run_all_enabled_sources, get_or_create_tags
from app.providers.rss_provider import rss_provider

router = APIRouter()

# -----------------------------------------------------------------------------
# DASHBOARD OVERVIEW & METRICS
# -----------------------------------------------------------------------------
@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_editor),
    db: AsyncSession = Depends(get_db)
):
    now = datetime.utcnow()
    start_of_today = datetime(now.year, now.month, now.day)
    seven_days_ago = now - timedelta(days=7)

    # Counts
    total_articles = (await db.execute(select(func.count(Article.id)))).scalar() or 0
    published_today = (await db.execute(
        select(func.count(Article.id)).where(Article.status == "PUBLISHED", Article.published_at >= start_of_today)
    )).scalar() or 0
    pending_review = (await db.execute(
        select(func.count(Article.id)).where(Article.status == "PENDING_REVIEW")
    )).scalar() or 0
    drafts = (await db.execute(
        select(func.count(Article.id)).where(Article.status == "DRAFT")
    )).scalar() or 0
    scheduled = (await db.execute(
        select(func.count(Article.id)).where(Article.status == "SCHEDULED")
    )).scalar() or 0
    articles_this_week = (await db.execute(
        select(func.count(Article.id)).where(Article.created_at >= seven_days_ago)
    )).scalar() or 0

    total_sources = (await db.execute(select(func.count(Source.id)))).scalar() or 0
    failed_sources = (await db.execute(
        select(func.count(Source.id)).where(Source.last_error != None)
    )).scalar() or 0

    # Recent Activity
    logs_res = await db.execute(
        select(AuditLog).order_by(AuditLog.created_at.desc()).limit(10)
    )
    recent_logs = logs_res.scalars().all()

    return {
        "total_articles": total_articles,
        "published_today": published_today,
        "pending_review": pending_review,
        "drafts": drafts,
        "scheduled": scheduled,
        "total_sources": total_sources,
        "failed_sources": failed_sources,
        "articles_this_week": articles_this_week,
        "recent_activity": recent_logs
    }

# -----------------------------------------------------------------------------
# ADMIN ARTICLE MANAGEMENT
# -----------------------------------------------------------------------------
@router.get("/articles", response_model=ArticleListResponse)
async def list_admin_articles(
    status: Optional[str] = Query(None, description="Status filter: PENDING_REVIEW, PUBLISHED, DRAFT, REJECTED, SCHEDULED"),
    category_id: Optional[str] = Query(None),
    source_id: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_editor),
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
        .order_by(Article.created_at.desc())
    )
    count_stmt = select(func.count(Article.id))

    if status:
        stmt = stmt.where(Article.status == status)
        count_stmt = count_stmt.where(Article.status == status)
    if category_id:
        stmt = stmt.where(Article.category_id == category_id)
        count_stmt = count_stmt.where(Article.category_id == category_id)
    if source_id:
        stmt = stmt.where(Article.source_id == source_id)
        count_stmt = count_stmt.where(Article.source_id == source_id)
    if q and q.strip():
        search_filter = Article.title.ilike(f"%{q.strip()}%")
        stmt = stmt.where(search_filter)
        count_stmt = count_stmt.where(search_filter)

    total_res = await db.execute(count_stmt)
    total = total_res.scalar() or 0

    offset = (page - 1) * size
    stmt = stmt.offset(offset).limit(size)

    articles_res = await db.execute(stmt)
    items = articles_res.scalars().all()
    pages = (total + size - 1) // size if total > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": pages
    }

@router.post("/articles", response_model=ArticleResponse)
async def create_manual_article(
    article_in: ArticleCreate,
    current_user: User = Depends(get_current_editor),
    db: AsyncSession = Depends(get_db)
):
    # Verify category
    cat_res = await db.execute(select(Category).where(Category.id == article_in.category_id))
    category = cat_res.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=400, detail="Invalid Category ID")

    # Generate unique slug
    base_slug = article_in.slug or generate_slug(article_in.title)
    unique_slug = f"{base_slug}-{str(uuid.uuid4())[:6]}"

    # Resolve tags
    tags = await get_or_create_tags(db, article_in.tags or [])

    published_at = datetime.utcnow() if article_in.status == "PUBLISHED" else None

    article = Article(
        id=str(uuid.uuid4()),
        title=article_in.title,
        slug=unique_slug,
        summary=article_in.summary,
        content=sanitize_rich_text(article_in.content or ""),
        category_id=category.id,
        image_id=article_in.image_id,
        author=article_in.author or current_user.full_name,
        created_by_id=current_user.id,
        content_origin=article_in.content_origin,
        status=article_in.status,
        published_at=published_at,
        scheduled_at=article_in.scheduled_at,
        is_featured=article_in.is_featured,
        tags=tags
    )
    db.add(article)
    await record_audit_log(
        db=db,
        action="ARTICLE_CREATE_MANUAL",
        entity_type="article",
        entity_id=article.id,
        user=current_user,
        details={"title": article.title, "status": article.status}
    )
    await db.commit()
    
    # Reload with relations
    stmt = select(Article).options(
        selectinload(Article.category),
        selectinload(Article.source),
        selectinload(Article.image),
        selectinload(Article.tags)
    ).where(Article.id == article.id)
    res = await db.execute(stmt)
    return res.scalar_one()

@router.get("/articles/{id}", response_model=ArticleResponse)
async def get_admin_article(
    id: str,
    current_user: User = Depends(get_current_editor),
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
        .where(Article.id == id)
    )
    res = await db.execute(stmt)
    article = res.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@router.put("/articles/{id}", response_model=ArticleResponse)
async def update_admin_article(
    id: str,
    article_in: ArticleUpdate,
    current_user: User = Depends(get_current_editor),
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
        .where(Article.id == id)
    )
    res = await db.execute(stmt)
    article = res.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    if article_in.title is not None:
        article.title = article_in.title
    if article_in.summary is not None:
        article.summary = article_in.summary
    if article_in.content is not None:
        article.content = sanitize_rich_text(article_in.content)
    if article_in.category_id is not None:
        article.category_id = article_in.category_id
    if article_in.image_id is not None:
        article.image_id = article_in.image_id
    if article_in.author is not None:
        article.author = article_in.author
    if article_in.is_featured is not None:
        article.is_featured = article_in.is_featured
    if article_in.status is not None:
        article.status = article_in.status
        if article.status == "PUBLISHED" and not article.published_at:
            article.published_at = datetime.utcnow()
    if article_in.scheduled_at is not None:
        article.scheduled_at = article_in.scheduled_at

    if article_in.tags is not None:
        article.tags = await get_or_create_tags(db, article_in.tags)

    await record_audit_log(
        db=db,
        action="ARTICLE_UPDATE",
        entity_type="article",
        entity_id=article.id,
        user=current_user,
        details={"title": article.title}
    )
    await db.commit()
    await db.refresh(article)
    return article

@router.delete("/articles/{id}")
async def delete_admin_article(
    id: str,
    current_user: User = Depends(get_current_editor),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Article).where(Article.id == id)
    res = await db.execute(stmt)
    article = res.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    await record_audit_log(
        db=db,
        action="ARTICLE_DELETE",
        entity_type="article",
        entity_id=article.id,
        user=current_user,
        details={"title": article.title}
    )
    await db.delete(article)
    await db.commit()
    return {"message": "Article deleted successfully"}

@router.post("/articles/{id}/publish", response_model=ArticleResponse)
async def publish_article_endpoint(
    id: str,
    current_user: User = Depends(get_current_editor),
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
        .where(Article.id == id)
    )
    res = await db.execute(stmt)
    article = res.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    article = await publish_article(db, article, user=current_user)
    return article

@router.post("/articles/{id}/reject", response_model=ArticleResponse)
async def reject_article_endpoint(
    id: str,
    reason: Optional[str] = Query(None),
    current_user: User = Depends(get_current_editor),
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
        .where(Article.id == id)
    )
    res = await db.execute(stmt)
    article = res.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    article = await reject_article(db, article, reason=reason, user=current_user)
    return article

@router.post("/articles/{id}/schedule", response_model=ArticleResponse)
async def schedule_article_endpoint(
    id: str,
    scheduled_at: datetime = Query(...),
    current_user: User = Depends(get_current_editor),
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
        .where(Article.id == id)
    )
    res = await db.execute(stmt)
    article = res.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    article = await schedule_article(db, article, scheduled_at=scheduled_at, user=current_user)
    return article

# -----------------------------------------------------------------------------
# SOURCE MANAGEMENT
# -----------------------------------------------------------------------------
@router.get("/sources", response_model=List[SourceResponse])
async def list_sources(
    current_user: User = Depends(get_current_editor),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Source).order_by(Source.name.asc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/sources", response_model=SourceResponse)
async def create_source(
    source_in: SourceCreate,
    current_user: User = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db)
):
    # Check duplicate RSS URL
    existing = (await db.execute(select(Source).where(Source.rss_url == source_in.rss_url))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="A source with this RSS URL already exists")

    source = Source(
        id=str(uuid.uuid4()),
        name=source_in.name,
        website_url=source_in.website_url,
        rss_url=source_in.rss_url,
        provider_type=source_in.provider_type,
        enabled=source_in.enabled,
        default_category_id=source_in.default_category_id if source_in.default_category_id else None,
        usage_policy=source_in.usage_policy,
        image_policy=source_in.image_policy,
        attribution_required=source_in.attribution_required,
        trust_level=source_in.trust_level
    )
    db.add(source)
    await record_audit_log(
        db=db,
        action="SOURCE_CREATE",
        entity_type="source",
        entity_id=source.id,
        user=current_user,
        details={"name": source.name, "rss_url": source.rss_url}
    )
    await db.commit()
    await db.refresh(source)
    return source

@router.put("/sources/{id}", response_model=SourceResponse)
async def update_source(
    id: str,
    source_in: SourceUpdate,
    current_user: User = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Source).where(Source.id == id)
    res = await db.execute(stmt)
    source = res.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    for field, val in source_in.model_dump(exclude_unset=True).items():
        if field == "default_category_id" and not val:
            val = None
        setattr(source, field, val)

    await record_audit_log(
        db=db,
        action="SOURCE_UPDATE",
        entity_type="source",
        entity_id=source.id,
        user=current_user,
        details={"name": source.name}
    )
    await db.commit()
    await db.refresh(source)
    return source

@router.delete("/sources/{id}")
async def delete_source(
    id: str,
    current_user: User = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Source).where(Source.id == id)
    res = await db.execute(stmt)
    source = res.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    await record_audit_log(
        db=db,
        action="SOURCE_DELETE",
        entity_type="source",
        entity_id=source.id,
        user=current_user,
        details={"name": source.name}
    )
    await db.delete(source)
    await db.commit()
    return {"message": "Source deleted successfully"}

@router.post("/sources/{id}/test")
async def test_source_feed(
    id: str,
    current_user: User = Depends(get_current_editor),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Source).where(Source.id == id)
    res = await db.execute(stmt)
    source = res.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    try:
        items = await rss_provider.fetch_articles(source.rss_url, limit=5)
        return {
            "status": "success",
            "message": f"Successfully parsed feed! Found {len(items)} sample items.",
            "sample_articles": [
                {
                    "title": it.title,
                    "url": it.original_url,
                    "published_at": it.published_at,
                    "has_image": bool(it.image_url)
                } for it in items
            ]
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to test feed: {str(e)}"
        }

@router.post("/sources/{id}/fetch-now", response_model=ProcessingJobResponse)
async def fetch_source_now(
    id: str,
    current_user: User = Depends(get_current_editor),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Source).where(Source.id == id)
    res = await db.execute(stmt)
    source = res.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    job = await process_single_source(db, source)
    return job

# -----------------------------------------------------------------------------
# JOBS & AUDIT LOGS
# -----------------------------------------------------------------------------
@router.get("/jobs", response_model=List[ProcessingJobResponse])
async def list_jobs(
    limit: int = Query(30, ge=1, le=100),
    current_user: User = Depends(get_current_editor),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(ProcessingJob)
        .options(selectinload(ProcessingJob.source))
        .order_by(ProcessingJob.started_at.desc())
        .limit(limit)
    )
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/jobs/trigger-ingestion")
async def trigger_all_ingestion(
    current_user: User = Depends(get_current_editor),
    db: AsyncSession = Depends(get_db)
):
    jobs = await run_all_enabled_sources(db)
    return {
        "status": "success",
        "message": f"Ingestion executed across {len(jobs)} sources.",
        "jobs_summary": [
            {"source_id": j.source_id, "status": j.status, "processed": j.items_processed, "skipped": j.items_skipped}
            for j in jobs
        ]
    }

@router.get("/logs", response_model=List[AuditLogResponse])
async def list_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
    res = await db.execute(stmt)
    return res.scalars().all()

# -----------------------------------------------------------------------------
# CATEGORIES & TAGS ADMIN
# -----------------------------------------------------------------------------
@router.post("/categories", response_model=CategoryResponse)
async def create_category(
    category_in: CategoryCreate,
    current_user: User = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db)
):
    cat = Category(
        id=str(uuid.uuid4()),
        name=category_in.name,
        slug=category_in.slug.lower(),
        description=category_in.description,
        display_order=category_in.display_order,
        is_active=category_in.is_active
    )
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat

@router.put("/categories/{id}", response_model=CategoryResponse)
async def update_category(
    id: str,
    category_in: CategoryUpdate,
    current_user: User = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Category).where(Category.id == id)
    res = await db.execute(stmt)
    cat = res.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    for field, val in category_in.model_dump(exclude_unset=True).items():
        setattr(cat, field, val)

    await db.commit()
    await db.refresh(cat)
    return cat

@router.delete("/categories/{id}")
async def delete_category(
    id: str,
    current_user: User = Depends(get_current_super_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Category).where(Category.id == id)
    res = await db.execute(stmt)
    cat = res.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if category has articles
    has_articles = (await db.execute(select(Article.id).where(Article.category_id == id))).scalar_one_or_none()
    if has_articles:
        raise HTTPException(status_code=400, detail="Cannot delete category that contains articles.")

    await db.delete(cat)
    await db.commit()
    return {"message": "Category deleted successfully"}

@router.post("/tags", response_model=TagResponse)
async def create_tag(
    tag_in: TagCreate,
    current_user: User = Depends(get_current_editor),
    db: AsyncSession = Depends(get_db)
):
    slug = tag_in.slug.lower() or generate_slug(tag_in.name)
    tag = Tag(id=str(uuid.uuid4()), name=tag_in.name, slug=slug)
    db.add(tag)
    await db.commit()
    await db.refresh(tag)
    return tag

@router.delete("/tags/{id}")
async def delete_tag(
    id: str,
    current_user: User = Depends(get_current_editor),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Tag).where(Tag.id == id)
    res = await db.execute(stmt)
    tag = res.scalar_one_or_none()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    await db.delete(tag)
    await db.commit()
    return {"message": "Tag deleted successfully"}
