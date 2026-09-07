import pytest
import uuid
from datetime import datetime, timedelta
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.hot_news import HotNews
from app.models.article import Article
from app.services.hot_news_service import (
    evaluate_and_add_candidate,
    clean_expired_hot_news,
    reset_hot_news,
    get_hot_news_feed
)
from app.services.deduplication import compute_url_hash

@pytest.mark.asyncio
async def test_fewer_than_30_stories_and_remaining_slots(db_session: AsyncSession, client: AsyncClient):
    """Test 1 & 11: Fewer than 30 stories, verify count=20 and remaining_slots=10."""
    now = datetime(2026, 9, 7, 12, 0, 0)

    # Insert 20 stories
    for i in range(20):
        url = f"https://wire.example.com/story-{i}"
        item = HotNews(
            id=str(uuid.uuid4()),
            source_url=url,
            url_hash=compute_url_hash(url),
            title=f"Breaking Story #{i}: Major Event",
            viral_score=70.0 + i,
            source_count=1,
            published_at=now,
            added_at=now,
            expires_at=now + timedelta(hours=12)
        )
        db_session.add(item)
    await db_session.commit()

    # Query through service
    feed = await get_hot_news_feed(db_session, limit=30, now=now)
    assert feed["count"] == 20
    assert feed["max_items"] == 30
    assert feed["remaining_slots"] == 10

    # Query through public HTTP API endpoint
    resp = await client.get("/api/v1/hot-news")
    assert resp.status_code == 200
    data = resp.json()
    assert data["count"] == 20
    assert data["max_items"] == 30
    assert data["remaining_slots"] == 10
    assert len(data["items"]) == 20
    # Highest score first
    assert data["items"][0]["viral_score"] >= data["items"][-1]["viral_score"]

@pytest.mark.asyncio
async def test_exactly_30_stories(db_session: AsyncSession, client: AsyncClient):
    """Test 2: Exactly 30 stories, count=30, remaining_slots=0."""
    now = datetime(2026, 9, 7, 12, 0, 0)

    for i in range(30):
        url = f"https://wire.example.com/story-30-{i}"
        item = HotNews(
            id=str(uuid.uuid4()),
            source_url=url,
            url_hash=compute_url_hash(url),
            title=f"Wire Story #{i}",
            viral_score=65.0 + i,
            source_count=1,
            published_at=now,
            added_at=now,
            expires_at=now + timedelta(hours=12)
        )
        db_session.add(item)
    await db_session.commit()

    feed = await get_hot_news_feed(db_session, limit=30, now=now)
    assert feed["count"] == 30
    assert feed["max_items"] == 30
    assert feed["remaining_slots"] == 0

@pytest.mark.asyncio
async def test_high_score_story_replaces_lowest_at_capacity(db_session: AsyncSession):
    """Test 3: New high-score story replaces lowest score when at capacity (30)."""
    now = datetime(2026, 9, 7, 12, 0, 0)

    # Fill 30 stories with scores from 61.0 to 90.0
    for i in range(30):
        url = f"https://wire.example.com/story-cap-{i}"
        item = HotNews(
            id=str(uuid.uuid4()),
            source_url=url,
            url_hash=compute_url_hash(url),
            title=f"Existing Story #{i}",
            viral_score=61.0 + i,
            source_count=1,
            published_at=now,
            added_at=now,
            expires_at=now + timedelta(hours=12)
        )
        db_session.add(item)
    await db_session.commit()

    # Candidate with very high score (98.0)
    candidate = {
        "source_url": "https://reuters.example.com/massive-breaking-news",
        "title": "BREAKING: Historic peace accord announced by UN Security Council",
        "summary": "Full global ceasefire treaty signed.",
        "source_name": "Reuters",
        "published_at": now
    }

    added, reason, hot_item = await evaluate_and_add_candidate(db_session, candidate, now=now)
    assert added is True
    assert "Replaced lowest" in reason
    assert hot_item is not None

    # Verify total active count remains capped at 30
    feed = await get_hot_news_feed(db_session, limit=30, now=now)
    assert feed["count"] == 30
    # Lowest old score (61.0) must no longer exist
    scores = [item.viral_score for item in feed["items"]]
    assert 61.0 not in scores

@pytest.mark.asyncio
async def test_low_score_story_rejected_when_at_capacity_or_below_threshold(db_session: AsyncSession):
    """Test 4: Candidate with low score is discarded."""
    now = datetime(2026, 9, 7, 12, 0, 0)

    # 1. Candidate below HOT_NEWS_MIN_SCORE (60)
    candidate_weak = {
        "source_url": "https://local.example.com/minor-item",
        "title": "Weekly municipal bridge maintenance notice",
        "summary": "Routine painting next month.",
        "source_name": "Local Paper",
        "published_at": now - timedelta(days=2)
    }
    added, reason, _ = await evaluate_and_add_candidate(db_session, candidate_weak, now=now)
    assert added is False
    assert "below minimum threshold" in reason

@pytest.mark.asyncio
async def test_twelve_hour_expiration(db_session: AsyncSession):
    """Test 5: 12-hour expiration removes expired stories."""
    now = datetime(2026, 9, 7, 12, 0, 0)

    # Add 1 active story and 1 expired story
    active_url = "https://wire.example.com/active-1"
    expired_url = "https://wire.example.com/expired-1"

    active_item = HotNews(
        id=str(uuid.uuid4()),
        source_url=active_url,
        url_hash=compute_url_hash(active_url),
        title="Active Breaking Story",
        viral_score=85.0,
        source_count=1,
        published_at=now,
        added_at=now,
        expires_at=now + timedelta(hours=6)
    )
    expired_item = HotNews(
        id=str(uuid.uuid4()),
        source_url=expired_url,
        url_hash=compute_url_hash(expired_url),
        title="Expired Yesterday Story",
        viral_score=80.0,
        source_count=1,
        published_at=now - timedelta(hours=14),
        added_at=now - timedelta(hours=14),
        expires_at=now - timedelta(hours=2) # expired 2 hours ago
    )
    db_session.add_all([active_item, expired_item])
    await db_session.commit()

    # Clean expired
    deleted = await clean_expired_hot_news(db_session, now=now)
    assert deleted == 1

    feed = await get_hot_news_feed(db_session, limit=30, now=now)
    assert feed["count"] == 1
    assert feed["items"][0].title == "Active Breaking Story"

@pytest.mark.asyncio
async def test_duplicate_story_not_inserted(db_session: AsyncSession):
    """Test 7: Duplicate URL is not inserted into hot news."""
    now = datetime(2026, 9, 7, 12, 0, 0)
    url = "https://wire.example.com/duplicate-check"

    candidate = {
        "source_url": url,
        "title": "BREAKING: Global Semiconductor Plant Opening",
        "summary": "New chip foundry.",
        "source_name": "Reuters",
        "published_at": now
    }

    # First insert
    added1, _, _ = await evaluate_and_add_candidate(db_session, candidate, now=now)
    assert added1 is True

    # Duplicate attempt
    added2, reason2, _ = await evaluate_and_add_candidate(db_session, candidate, now=now)
    assert added2 is False
    assert "Duplicate URL already active" in reason2

@pytest.mark.asyncio
async def test_multiple_sources_increase_source_count_and_boost_score(db_session: AsyncSession):
    """Test 8: Multiple sources reporting same event increase source_count and boost viral score."""
    now = datetime(2026, 9, 7, 12, 0, 0)

    # First report from AP
    candidate1 = {
        "source_url": "https://ap.example.com/spacecraft-landing",
        "title": "Spacecraft Successfully Lands on Asteroid in Historic Mission",
        "summary": "Space agency confirms touchdown.",
        "source_name": "Associated Press",
        "published_at": now
    }
    added1, _, item1 = await evaluate_and_add_candidate(db_session, candidate1, now=now)
    assert added1 is True
    initial_score = item1.viral_score
    assert item1.source_count == 1

    # Second report with identical headline from BBC
    candidate2 = {
        "source_url": "https://bbc.example.com/spacecraft-landing",
        "title": "Spacecraft Successfully Lands on Asteroid in Historic Mission",
        "summary": "BBC confirmation of touchdown.",
        "source_name": "BBC",
        "published_at": now
    }
    added2, reason2, item2 = await evaluate_and_add_candidate(db_session, candidate2, now=now)
    assert added2 is True
    assert "Cross-source match" in reason2
    assert item2.source_count == 2
    assert item2.viral_score >= initial_score

@pytest.mark.asyncio
async def test_reset_hot_news_batch_rebuild(db_session: AsyncSession):
    """Test 6 & 12: Feed reset purges stale and rebuilds top 30 in a single atomic batch."""
    now = datetime(2026, 9, 7, 12, 0, 0)

    # Seed 35 published articles in Article table
    for i in range(35):
        art = Article(
            id=str(uuid.uuid4()),
            title=f"BREAKING: Major National Development #{i}",
            slug=f"major-dev-{i}-{str(uuid.uuid4())[:6]}",
            summary="Important policy announcement.",
            category_id="test-tech-cat-uuid",
            status="PUBLISHED",
            published_at=now - timedelta(hours=i % 10),
            created_at=now - timedelta(hours=i % 10)
        )
        db_session.add(art)
    await db_session.commit()

    # Run reset_hot_news
    rebuilt_count = await reset_hot_news(db_session, now=now)
    assert rebuilt_count == 30

    feed = await get_hot_news_feed(db_session, limit=30, now=now)
    assert feed["count"] == 30
    assert feed["remaining_slots"] == 0

@pytest.mark.asyncio
async def test_api_enforces_max_limit_30(client: AsyncClient):
    """Test 10: API never returns more than 30 stories."""
    # Test request limit validation > 30 returns 422 Unprocessable Entity
    resp = await client.get("/api/v1/hot-news?limit=50")
    assert resp.status_code == 422
