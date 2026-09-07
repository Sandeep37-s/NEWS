import logging
import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.models.source import Source
from app.models.category import Category
from app.models.tag import Tag
from app.models.image import Image
from app.models.article import Article
from app.models.job import ProcessingJob
from app.models.audit_log import AuditLog
from app.providers.rss_provider import rss_provider
from app.services.deduplication import is_duplicate_article, compute_url_hash
from app.services.ai.openrouter import ai_service
from app.services.ingestion.normalizer import generate_slug
from app.services.hot_news_service import evaluate_and_add_candidate

logger = logging.getLogger(__name__)

async def get_or_create_category(db: AsyncSession, slug: str, name: Optional[str] = None) -> Category:
    clean_slug = (slug.lower().strip() or "world")[:100]
    stmt = select(Category).where(Category.slug == clean_slug)
    res = await db.execute(stmt)
    cat = res.scalar_one_or_none()
    if not cat:
        display_name = (name or clean_slug.capitalize())[:100]
        cat = Category(
            id=str(uuid.uuid4()),
            name=display_name,
            slug=clean_slug,
            description=f"Articles categorized under {display_name}"
        )
        db.add(cat)
        await db.flush()
    return cat

async def get_or_create_tags(db: AsyncSession, tag_names: List[str]) -> List[Tag]:
    tags: List[Tag] = []
    for name in tag_names:
        clean_name = name.strip()[:100]
        if not clean_name:
            continue
        slug = generate_slug(clean_name)[:100]
        stmt = select(Tag).where(Tag.slug == slug)
        res = await db.execute(stmt)
        tag = res.scalar_one_or_none()
        if not tag:
            tag = Tag(id=str(uuid.uuid4()), name=clean_name, slug=slug)
            db.add(tag)
            await db.flush()
        tags.append(tag)
    return tags

async def process_single_source(db: AsyncSession, source: Source, limit: int = 15) -> ProcessingJob:
    source_id = str(source.id)
    source_name = str(source.name)
    source_rss_url = str(source.rss_url)
    source_trust_level = source.trust_level
    source_usage_policy = source.usage_policy
    source_image_policy = source.image_policy
    source_default_category_id = source.default_category_id

    job = ProcessingJob(
        id=str(uuid.uuid4()),
        job_type="RSS_FETCH",
        status="RUNNING",
        source_id=source_id,
        started_at=datetime.utcnow()
    )
    job_id = job.id
    db.add(job)
    await db.commit()

    items_fetched = 0
    items_processed = 0
    items_skipped = 0

    try:
        raw_items = await rss_provider.fetch_articles(source_rss_url, limit=limit)
        items_fetched = len(raw_items)

        # Get default category
        default_cat = None
        if source_default_category_id:
            res = await db.execute(select(Category).where(Category.id == source_default_category_id))
            default_cat = res.scalar_one_or_none()
        category_hint = default_cat.slug if default_cat else "world"

        for item in raw_items:
            try:
                async with db.begin_nested():
                    # 1. Deduplication check
                    is_dup, dup_reason = await is_duplicate_article(
                        db=db,
                        original_url=item.original_url,
                        external_id=item.external_id,
                        title=item.title,
                        source_id=source_id
                    )
                    if is_dup:
                        logger.info(f"Skipping duplicate article '{item.title}': {dup_reason}")
                        items_skipped += 1
                        continue

                    # 2. Copyright rule filter
                    content_to_process = ""
                    if source_usage_policy == "METADATA_ONLY":
                        content_to_process = item.summary_raw[:200] if item.summary_raw else ""
                    elif source_usage_policy in ["SUMMARY_ALLOWED", "LICENSED_REPUBLISH"]:
                        content_to_process = item.summary_raw or item.content_raw or ""

                    # 3. AI Processing (Summarize, Classify, Tag)
                    ai_result = await ai_service.process_article_content(
                        title=item.title,
                        content_snippet=content_to_process,
                        source_name=source_name,
                        category_hint=category_hint
                    )

                    # 4. Resolve Category
                    target_cat_slug = ai_result.get("category_slug", category_hint)
                    category = await get_or_create_category(db, target_cat_slug)

                    # 5. Resolve Tags
                    tags = await get_or_create_tags(db, ai_result.get("tags", []))

                    # 6. Image Policy Check
                    image_obj = None
                    if source_image_policy != "NOT_ALLOWED" and item.image_url:
                        image_obj = Image(
                            id=str(uuid.uuid4()),
                            storage_url=str(item.image_url)[:2048],
                            original_source=source_name[:1024],
                            license_type="LICENSED" if source_image_policy == "LICENSED" else "FAIR_USE_THUMBNAIL",
                            alt_text=f"Editorial thumbnail for {ai_result.get('title', item.title)}"[:500]
                        )
                        db.add(image_obj)
                        await db.flush()

                    # 7. Generate unique slug
                    final_title = (ai_result.get("title") or item.title or "Untitled")[:500]
                    base_slug = generate_slug(final_title)[:400]
                    article_slug = f"{base_slug}-{str(uuid.uuid4())[:8]}"

                    # 8. Status determination
                    initial_status = "PUBLISHED" if source_trust_level == "AUTO_PUBLISH" else "PENDING_REVIEW"
                    published_date = datetime.utcnow() if initial_status == "PUBLISHED" else None

                    # 9. Create Article Record
                    final_external_id = item.external_id[:1024] if item.external_id else None
                    final_original_url = item.original_url[:2048] if item.original_url else None
                    final_author = (item.author or source_name)[:500]
                    final_summary = ai_result.get("summary") or item.summary_raw

                    article = Article(
                        id=str(uuid.uuid4()),
                        title=final_title,
                        slug=article_slug,
                        summary=final_summary,
                        content=f"<p>{final_summary}</p>" if final_summary else "",
                        source_id=source_id,
                        original_url=final_original_url,
                        url_hash=compute_url_hash(item.original_url) if item.original_url else None,
                        external_id=final_external_id,
                        content_origin="AI_ASSISTED" if not ai_result.get("is_ai_fallback") else "AGGREGATED",
                        image_id=image_obj.id if image_obj else None,
                        author=final_author,
                        category_id=category.id,
                        status=initial_status,
                        published_at=published_date,
                        tags=tags,
                        created_at=datetime.utcnow()
                    )
                    db.add(article)
                    await db.flush()

                    # 10. Evaluate candidate for Rolling Viral News 30 Feed
                    try:
                        await evaluate_and_add_candidate(
                            db=db,
                            candidate={
                                "article_id": article.id,
                                "source_url": item.original_url or article.original_url,
                                "title": final_title,
                                "summary": final_summary,
                                "image_url": item.image_url,
                                "category_slug": category.slug,
                                "source_name": source_name,
                                "published_at": published_date or datetime.utcnow(),
                                "slug": article.slug
                            }
                        )
                    except Exception as hot_err:
                        logger.warning(f"Error evaluating hot news candidate '{final_title}': {hot_err}")
                items_processed += 1
            except Exception as item_err:
                logger.warning(f"Failed to process individual feed article '{item.title}' from source {source_name}: {item_err}")
                items_skipped += 1
                continue

        # Update source status and job
        await db.execute(
            update(Source)
            .where(Source.id == source_id)
            .values(last_fetched_at=datetime.utcnow(), last_error=None)
        )
        await db.execute(
            update(ProcessingJob)
            .where(ProcessingJob.id == job_id)
            .values(
                status="SUCCESS",
                items_fetched=items_fetched,
                items_processed=items_processed,
                items_skipped=items_skipped,
                completed_at=datetime.utcnow()
            )
        )
        await db.commit()

        job.status = "SUCCESS"
        job.items_fetched = items_fetched
        job.items_processed = items_processed
        job.items_skipped = items_skipped
        job.completed_at = datetime.utcnow()

    except Exception as e:
        logger.exception(f"Error executing ingestion job for source {source_name}: {e}")
        try:
            await db.rollback()
            await db.execute(
                update(Source)
                .where(Source.id == source_id)
                .values(last_error=str(e)[:2000])
            )
            await db.execute(
                update(ProcessingJob)
                .where(ProcessingJob.id == job_id)
                .values(
                    status="FAILED",
                    error_message=str(e)[:2000],
                    items_fetched=items_fetched,
                    items_processed=items_processed,
                    items_skipped=items_skipped,
                    completed_at=datetime.utcnow()
                )
            )
            await db.commit()
        except Exception as rollback_err:
            logger.error(f"Failed to record job failure state in database: {rollback_err}")
        
        job.status = "FAILED"
        job.error_message = str(e)
        job.items_fetched = items_fetched
        job.items_processed = items_processed
        job.items_skipped = items_skipped
        job.completed_at = datetime.utcnow()

    return job

async def run_all_enabled_sources(db: AsyncSession) -> List[ProcessingJob]:
    stmt = select(Source).where(Source.enabled == True)
    res = await db.execute(stmt)
    sources = res.scalars().all()
    
    jobs = []
    for source in sources:
        job = await process_single_source(db, source)
        jobs.append(job)
    return jobs
