import pytest
from datetime import datetime, timedelta
from unittest.mock import patch, AsyncMock
from app.services.viral_scoring import (
    calculate_freshness_score,
    calculate_cross_source_score,
    calculate_topic_importance,
    calculate_source_reliability,
    calculate_breaking_signal,
    calculate_local_viral_score,
    evaluate_viral_score_with_ai
)

def test_freshness_decay_scoring():
    now = datetime(2026, 9, 7, 12, 0, 0)
    
    # 15 minutes old
    score_15m = calculate_freshness_score(now - timedelta(minutes=15), now=now)
    assert score_15m >= 95.0

    # 3 hours old
    score_3h = calculate_freshness_score(now - timedelta(hours=3), now=now)
    assert 70.0 <= score_3h <= 85.0

    # 15 hours old
    score_15h = calculate_freshness_score(now - timedelta(hours=15), now=now)
    assert 10.0 <= score_15h <= 30.0

    # 48 hours old
    score_old = calculate_freshness_score(now - timedelta(hours=48), now=now)
    assert score_old <= 10.0

def test_cross_source_coverage_boost():
    assert calculate_cross_source_score(1) == 30.0
    assert calculate_cross_source_score(2) == 65.0
    assert calculate_cross_source_score(3) == 85.0
    assert calculate_cross_source_score(4) == 100.0
    assert calculate_cross_source_score(10) == 100.0

def test_breaking_and_topic_importance_signals():
    # Breaking signal
    assert calculate_breaking_signal("BREAKING: Major peace treaty signed in Geneva") == 95.0
    assert calculate_breaking_signal("Regular quarterly financial updates") == 40.0

    # Topic importance
    high_topic_score = calculate_topic_importance("Massive earthquake triggers emergency disaster relief")
    assert high_topic_score == 90.0

    mod_topic_score = calculate_topic_importance("New AI semiconductor chip released by startup")
    assert mod_topic_score == 72.0

    neutral_score = calculate_topic_importance("Local garden club hosts annual summer tea party")
    assert neutral_score == 50.0

def test_combined_local_viral_score():
    now = datetime(2026, 9, 7, 12, 0, 0)
    
    # High viral breaking story
    high_score = calculate_local_viral_score(
        title="BREAKING: Central Bank announces sudden interest rate cut amidst inflation surge",
        summary="Federal Reserve unexpected policy announcement.",
        source_name="Reuters",
        published_at=now - timedelta(minutes=10),
        source_count=3,
        now=now
    )
    assert high_score >= 80.0

    # Low viral minor story
    low_score = calculate_local_viral_score(
        title="Weekly municipal bridge maintenance schedule announced",
        summary="Routine lane closure on Tuesday.",
        source_name="Local Gazette",
        published_at=now - timedelta(days=2),
        source_count=1,
        now=now
    )
    assert low_score < 50.0

@pytest.mark.asyncio
async def test_ai_scoring_fallback_on_network_failure():
    # When OpenRouter fails or has no key, fallback to local score without throwing
    local_score = 80.0
    with patch("httpx.AsyncClient.post", side_effect=Exception("Connection timeout")):
        score, reason = await evaluate_viral_score_with_ai(
            title="BREAKING: Major diplomatic summit conclave",
            local_score=local_score
        )
        assert score == local_score
        assert reason is None
