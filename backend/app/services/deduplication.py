import hashlib
import re
from datetime import datetime, timedelta
from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.article import Article
from app.services.ingestion.normalizer import clean_url

def compute_url_hash(url: str) -> str:
    """Compute deterministic SHA256 hash of normalized URL."""
    cleaned = clean_url(url).lower()
    return hashlib.sha256(cleaned.encode("utf-8")).hexdigest()

def normalize_title_for_comparison(title: str) -> str:
    """Strip punctuation and whitespace for fuzzy title comparison."""
    clean = re.sub(r'[^\w\s]', '', title.lower())
    return " ".join(clean.split())

async def is_duplicate_article(
    db: AsyncSession,
    original_url: Optional[str],
    external_id: Optional[str],
    title: str,
    source_id: Optional[str] = None
) -> Tuple[bool, Optional[str]]:
    """
    Check if an article is already present in the database.
    Returns (is_duplicate: bool, reason: Optional[str]).
    """
    # 1. Check Exact Normalized URL Hash
    if original_url:
        url_hash = compute_url_hash(original_url)
        stmt = select(Article.id).where(Article.url_hash == url_hash)
        res = await db.execute(stmt)
        if res.scalar_one_or_none():
            return True, f"Exact URL duplicate: {url_hash}"

    # 2. Check Source-Specific External ID (GUID)
    if external_id and source_id:
        stmt = select(Article.id).where(
            Article.source_id == source_id,
            Article.external_id == external_id
        )
        res = await db.execute(stmt)
        if res.scalar_one_or_none():
            return True, f"Source GUID duplicate: {external_id}"

    # 3. Check Exact Title match in recent articles (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    stmt = select(Article.id, Article.title).where(Article.created_at >= seven_days_ago)
    res = await db.execute(stmt)
    existing_articles = res.all()

    norm_incoming_title = normalize_title_for_comparison(title)
    if norm_incoming_title:
        for art_id, art_title in existing_articles:
            if normalize_title_for_comparison(art_title) == norm_incoming_title:
                return True, f"Identical headline duplicate: {art_id}"

    return False, None
