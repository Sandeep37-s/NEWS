import pytest
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.article import Article
from app.services.publishing import (
    publish_article,
    reject_article,
    schedule_article,
    process_due_scheduled_articles
)

@pytest.mark.asyncio
async def test_publishing_lifecycle(db_session: AsyncSession):
    article = Article(
        id="art-lifecycle-1",
        title="Draft Article for Lifecycle Testing",
        slug="draft-article-lifecycle",
        summary="A draft article awaiting review.",
        category_id="test-tech-cat-uuid",
        status="PENDING_REVIEW"
    )
    db_session.add(article)
    await db_session.commit()

    # 1. Publish
    await publish_article(db_session, article)
    assert article.status == "PUBLISHED"
    assert article.published_at is not None

    # 2. Reject
    await reject_article(db_session, article, reason="Editorial non-compliance")
    assert article.status == "REJECTED"

    # 3. Schedule for future
    future_time = datetime.utcnow() + timedelta(hours=2)
    await schedule_article(db_session, article, scheduled_at=future_time)
    assert article.status == "SCHEDULED"
    assert article.scheduled_at == future_time

@pytest.mark.asyncio
async def test_due_scheduled_publishing_worker(db_session: AsyncSession):
    past_time = datetime.utcnow() - timedelta(minutes=5)
    article = Article(
        id="art-scheduled-past",
        title="Due Scheduled Article",
        slug="due-scheduled-article",
        summary="Should be auto-published by worker.",
        category_id="test-tech-cat-uuid",
        status="SCHEDULED",
        scheduled_at=past_time
    )
    db_session.add(article)
    await db_session.commit()

    published_items = await process_due_scheduled_articles(db_session)
    assert len(published_items) == 1
    assert published_items[0].id == "art-scheduled-past"
    assert published_items[0].status == "PUBLISHED"
