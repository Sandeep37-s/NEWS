import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.ingestion.normalizer import clean_url, clean_html_to_text, generate_slug
from app.services.deduplication import compute_url_hash, is_duplicate_article
from app.models.article import Article

def test_clean_url_tracking_removal():
    dirty = "https://example.com/news/article-1?utm_source=twitter&utm_medium=social&utm_campaign=launch&ref=homepage#comments"
    clean = clean_url(dirty)
    assert clean == "https://example.com/news/article-1"

def test_html_cleaning():
    dirty_html = "<p>This is <b>bold</b> text with <script>alert('xss')</script> and &nbsp; extra spaces.</p>"
    clean = clean_html_to_text(dirty_html)
    assert clean == "This is bold text with and extra spaces."

def test_slug_generation():
    title = "New AI Model Launched in India: 10x Faster & Smarter!"
    slug = generate_slug(title)
    assert slug == "new-ai-model-launched-in-india-10x-faster-smarter"

@pytest.mark.asyncio
async def test_deduplication_engine(db_session: AsyncSession):
    url = "https://example.com/news/item-1"
    url_hash = compute_url_hash(url)
    
    # Insert initial article
    article = Article(
        id="art-test-1",
        title="Revolutionary AI Architecture Announced",
        slug="revolutionary-ai-architecture-announced",
        summary="A breakthrough in neural networks.",
        original_url=url,
        url_hash=url_hash,
        category_id="test-tech-cat-uuid",
        status="PUBLISHED"
    )
    db_session.add(article)
    await db_session.commit()

    # Test exact URL duplicate
    is_dup, reason = await is_duplicate_article(
        db=db_session,
        original_url="https://example.com/news/item-1?utm_source=rss",
        external_id=None,
        title="Different headline but same clean URL"
    )
    assert is_dup is True
    assert "Exact URL duplicate" in reason

    # Test title duplicate
    is_dup_title, reason_title = await is_duplicate_article(
        db=db_session,
        original_url="https://another-outlet.com/story-99",
        external_id=None,
        title="Revolutionary AI Architecture Announced"
    )
    assert is_dup_title is True
    assert "Identical headline duplicate" in reason_title

    # Test non-duplicate
    is_new, _ = await is_duplicate_article(
        db=db_session,
        original_url="https://unique.com/story-123",
        external_id=None,
        title="Completely Unrelated Space Discovery"
    )
    assert is_new is False

    # Test long external_id GUID (Google News style > 255 characters)
    long_guid = "CBMinAFBVV95cUxQbVFUUzlab1o2WlFMRVFWUzg4V09qWDRMVHdjSng4b0hOZFE5T3dWclNrY0toU3FfRW0xaHhERTJrS1pwel9fTExJUFNERFA4TWhNSVpWaEsxUmJjbmxVWkM3b2FMUHUyTmNrbUZPdUhQcE4tZ1A3S1dZYzk1eHdlOUZPd0UxLXc5VUZKY1dmOWFQcmZkTVNtNTdBR2I" * 2
    article_long = Article(
        id="art-test-long-guid",
        title="Article With Long External GUID",
        slug="article-with-long-external-guid",
        summary="Testing long guid storage.",
        original_url="https://news.google.com/rss/articles/long-guid-test",
        url_hash=compute_url_hash("https://news.google.com/rss/articles/long-guid-test"),
        external_id=long_guid[:1024],
        source_id="test-source-id",
        category_id="test-tech-cat-uuid",
        status="PUBLISHED"
    )
    db_session.add(article_long)
    await db_session.commit()

    is_guid_dup, reason_guid = await is_duplicate_article(
        db=db_session,
        original_url=None,
        external_id=long_guid[:1024],
        title="Different Title",
        source_id="test-source-id"
    )
    assert is_guid_dup is True
    assert "Source GUID duplicate" in reason_guid

