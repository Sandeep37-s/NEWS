import logging
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func, and_

from app.core.config import settings
from app.models.hot_news import HotNews
from app.models.article import Article
from app.services.deduplication import compute_url_hash, normalize_title_for_comparison
from app.services.viral_scoring import calculate_local_viral_score, evaluate_viral_score_with_ai

logger = logging.getLogger(__name__)

async def evaluate_and_add_candidate(
    db: AsyncSession,
    candidate: Dict[str, Any],
    now: Optional[datetime] = None
) -> Tuple[bool, str, Optional[HotNews]]:
    """
    Evaluates a candidate news story for inclusion in the Rolling Viral News 30.
    1. Deduplicates against active hot news.
    2. Increments source_count and boosts score if identical event is reported.
    3. Calculates deterministic & AI score.
    4. Inserts if slots available (<30) or replaces lowest scored story if candidate score is higher.
    """
    current_time = now or datetime.utcnow()
    source_url = candidate.get("source_url") or candidate.get("original_url") or ""
    title = candidate.get("title", "").strip()
    summary = candidate.get("summary")
    image_url = candidate.get("image_url")
    category_slug = candidate.get("category_slug")
    source_name = candidate.get("source_name")
    published_at = candidate.get("published_at") or current_time
    slug = candidate.get("slug")
    article_id = candidate.get("article_id")

    if not title or not source_url:
        return False, "Missing required title or source URL", None

    url_hash = compute_url_hash(source_url)

    # 1. Check for exact URL duplicate in active hot news
    stmt = select(HotNews).where(
        and_(
            HotNews.url_hash == url_hash,
            HotNews.expires_at > current_time
        )
    )
    res = await db.execute(stmt)
    existing_by_url = res.scalar_one_or_none()
    if existing_by_url:
        return False, f"Duplicate URL already active in hot news ({existing_by_url.id})", existing_by_url

    # 2. Check for cross-source event match (same story reported by multiple wire feeds)
    norm_incoming_title = normalize_title_for_comparison(title)
    stmt_active = (
        select(HotNews)
        .where(HotNews.expires_at > current_time)
        .order_by(HotNews.viral_score.asc(), HotNews.published_at.asc())
    )
    res_active = await db.execute(stmt_active)
    active_stories = list(res_active.scalars().all())

    for active_item in active_stories:
        if normalize_title_for_comparison(active_item.title) == norm_incoming_title:
            # Multi-source confirmation detected!
            active_item.source_count += 1
            boosted_score = calculate_local_viral_score(
                title=active_item.title,
                summary=active_item.summary,
                source_name=active_item.source_name,
                published_at=active_item.published_at,
                source_count=active_item.source_count,
                now=current_time
            )
            if boosted_score > active_item.viral_score:
                active_item.viral_score = boosted_score
            
            await db.flush()
            logger.info(f"Cross-source coverage boosted story '{active_item.title}' to {active_item.source_count} sources (score: {active_item.viral_score})")
            return True, f"Cross-source match: updated source count to {active_item.source_count}", active_item

    # 3. Calculate viral score for new candidate
    local_score = calculate_local_viral_score(
        title=title,
        summary=summary,
        source_name=source_name,
        published_at=published_at,
        source_count=1,
        now=current_time
    )

    if local_score < settings.HOT_NEWS_MIN_SCORE:
        return False, f"Score {local_score} below minimum threshold {settings.HOT_NEWS_MIN_SCORE}", None

    final_score = local_score
    if local_score >= settings.HOT_NEWS_AI_THRESHOLD and settings.HOT_NEWS_USE_AI:
        ai_score, _ = await evaluate_viral_score_with_ai(
            title=title,
            summary=summary,
            source_name=source_name,
            local_score=local_score
        )
        final_score = ai_score

    if final_score < settings.HOT_NEWS_MIN_SCORE:
        return False, f"Refined score {final_score} below minimum threshold", None

    expires_at = current_time + timedelta(hours=settings.HOT_NEWS_WINDOW_HOURS)

    # 4. Check capacity (20 + 10 rolling capacity up to max 30)
    current_count = len(active_stories)

    if current_count < settings.HOT_NEWS_LIMIT:
        # Fill available slot
        hot_item = HotNews(
            id=str(uuid.uuid4()),
            article_id=article_id,
            source_url=source_url[:2048],
            url_hash=url_hash,
            title=title[:500],
            slug=slug[:500] if slug else None,
            summary=summary,
            image_url=image_url[:2048] if image_url else None,
            category_slug=category_slug[:100] if category_slug else "world",
            source_name=source_name[:200] if source_name else None,
            viral_score=final_score,
            source_count=1,
            published_at=published_at,
            added_at=current_time,
            expires_at=expires_at
        )
        db.add(hot_item)
        await db.flush()
        logger.info(f"Added candidate to rolling feed: '{title}' (score: {final_score}, slot: {current_count + 1}/{settings.HOT_NEWS_LIMIT})")
        return True, f"Added to available slot ({current_count + 1}/{settings.HOT_NEWS_LIMIT})", hot_item

    # 5. Top 30 capacity full: check if candidate beats the lowest scored active story
    lowest_story = active_stories[0]  # sorted asc by viral_score
    if final_score > lowest_story.viral_score:
        logger.info(f"Replacing lowest story '{lowest_story.title}' (score: {lowest_story.viral_score}) with candidate '{title}' (score: {final_score})")
        await db.delete(lowest_story)
        await db.flush()

        hot_item = HotNews(
            id=str(uuid.uuid4()),
            article_id=article_id,
            source_url=source_url[:2048],
            url_hash=url_hash,
            title=title[:500],
            slug=slug[:500] if slug else None,
            summary=summary,
            image_url=image_url[:2048] if image_url else None,
            category_slug=category_slug[:100] if category_slug else "world",
            source_name=source_name[:200] if source_name else None,
            viral_score=final_score,
            source_count=1,
            published_at=published_at,
            added_at=current_time,
            expires_at=expires_at
        )
        db.add(hot_item)
        await db.flush()
        return True, f"Replaced lowest scored story ({lowest_story.viral_score}) with candidate ({final_score})", hot_item

    return False, f"Score {final_score} does not exceed lowest active score {lowest_story.viral_score}", None

async def clean_expired_hot_news(db: AsyncSession, now: Optional[datetime] = None) -> int:
    """Purge expired stories where expires_at <= current_time in a single batch query."""
    current_time = now or datetime.utcnow()
    stmt = delete(HotNews).where(HotNews.expires_at <= current_time)
    res = await db.execute(stmt)
    await db.commit()
    deleted_count = res.rowcount or 0
    if deleted_count > 0:
        logger.info(f"Cleaned {deleted_count} expired hot news entries.")
    return deleted_count

async def reset_hot_news(db: AsyncSession, now: Optional[datetime] = None) -> int:
    """
    12-Hour Rolling Reset:
    1. Purges expired or stale hot news.
    2. Re-scores recent eligible published stories from the database.
    3. Batches top 30 qualified items and commits in a single transaction.
    """
    current_time = now or datetime.utcnow()
    logger.info("Executing 12-hour hot news rolling reset...")

    # 1. Clear all existing hot news records
    await db.execute(delete(HotNews))
    await db.flush()

    # 2. Fetch candidates from Article database (published within last 24h)
    cutoff = current_time - timedelta(hours=24)
    stmt = (
        select(Article)
        .where(
            and_(
                Article.status == "PUBLISHED",
                Article.created_at >= cutoff
            )
        )
        .order_by(Article.published_at.desc())
        .limit(100)
    )
    res = await db.execute(stmt)
    articles = res.scalars().all()

    candidates: List[HotNews] = []
    seen_urls = set()

    for art in articles:
        src_url = art.original_url or f"https://chronicle-news.local/article/{art.slug}"
        url_hash = compute_url_hash(src_url)
        if url_hash in seen_urls:
            continue
        seen_urls.add(url_hash)

        score = calculate_local_viral_score(
            title=art.title,
            summary=art.summary,
            source_name=art.source.name if art.source else "Editorial",
            published_at=art.published_at or art.created_at,
            source_count=1,
            view_count=art.view_count,
            now=current_time
        )

        if score >= settings.HOT_NEWS_MIN_SCORE:
            item = HotNews(
                id=str(uuid.uuid4()),
                article_id=art.id,
                source_url=src_url[:2048],
                url_hash=url_hash,
                title=art.title[:500],
                slug=art.slug[:500],
                summary=art.summary,
                image_url=art.image.storage_url if art.image else None,
                category_slug=art.category.slug if art.category else "world",
                source_name=art.source.name if art.source else "Editorial",
                viral_score=score,
                source_count=1,
                published_at=art.published_at or art.created_at,
                added_at=current_time,
                expires_at=current_time + timedelta(hours=settings.HOT_NEWS_WINDOW_HOURS)
            )
            candidates.append(item)

    # Sort candidate pool by viral score desc
    candidates.sort(key=lambda x: x.viral_score, reverse=True)
    top_30 = candidates[:settings.HOT_NEWS_LIMIT]

    # Batch insert in a single commit
    for item in top_30:
        db.add(item)

    await db.commit()
    logger.info(f"Hot news feed successfully reset and repopulated with {len(top_30)} top stories.")
    return len(top_30)

async def get_hot_news_feed(
    db: AsyncSession,
    limit: int = 30,
    category_slug: Optional[str] = None,
    now: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Retrieve active Hot News stories ordered by viral_score DESC, published_at DESC.
    Includes count, max_items (30), and remaining_slots.
    """
    current_time = now or datetime.utcnow()
    query_limit = min(settings.HOT_NEWS_LIMIT, max(1, limit))

    conditions = [HotNews.expires_at > current_time]
    if category_slug:
        conditions.append(HotNews.category_slug == category_slug.lower().strip())

    stmt = (
        select(HotNews)
        .where(and_(*conditions))
        .order_by(HotNews.viral_score.desc(), HotNews.published_at.desc())
        .limit(query_limit)
    )
    res = await db.execute(stmt)
    items = list(res.scalars().all())

    count = len(items)
    max_items = settings.HOT_NEWS_LIMIT
    remaining_slots = max(0, max_items - count)

    # Calculate reset timing windows
    # Reset window based on 12-hour boundary
    epoch_hour = current_time.hour
    last_reset_hour = (epoch_hour // settings.HOT_NEWS_WINDOW_HOURS) * settings.HOT_NEWS_WINDOW_HOURS
    last_reset_at = current_time.replace(hour=last_reset_hour, minute=0, second=0, microsecond=0)
    next_reset_at = last_reset_at + timedelta(hours=settings.HOT_NEWS_WINDOW_HOURS)

    return {
        "items": items,
        "count": count,
        "max_items": max_items,
        "remaining_slots": remaining_slots,
        "last_reset_at": last_reset_at.isoformat() + "Z",
        "next_reset_at": next_reset_at.isoformat() + "Z"
    }
