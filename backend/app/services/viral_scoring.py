import json
import logging
import re
from datetime import datetime
from typing import Optional, Tuple, Dict, Any
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# High-impact global and national keyword indicators
HIGH_IMPACT_TOPICS = [
    r"\b(war|conflict|ceasefire|missile|attack|treaty|sanctions|embargo)\b",
    r"\b(election|parliament|prime minister|president|supreme court|verdict|referendum)\b",
    r"\b(inflation|interest rate|central bank|rbi|federal reserve|recession|gdp|bailout|market crash)\b",
    r"\b(earthquake|tsunami|cyclone|hurricane|wildfire|flood|disaster|emergency|epidemic)\b",
    r"\b(breakthrough|superconductor|fusion|quantum|spacecraft|mars|moon landing|cure|vaccine)\b",
    r"\b(world cup|olympics|championship|gold medal|grand slam|finals)\b",
]

MODERATE_IMPACT_TOPICS = [
    r"\b(merger|acquisition|quarterly profit|revenue|ipo|startup|funding)\b",
    r"\b(ai|artificial intelligence|semiconductor|chip|gpu|smartphone|tech launch)\b",
    r"\b(budget|policy|regulation|reform|infrastructure|tax)\b",
    r"\b(trade deal|summit|g20|un|bilateral)\b",
]

BREAKING_PATTERNS = [
    r"\b(breaking|urgent|just in|flash|alert|bulletin)\b",
    r"\b(developing story|live updates|death toll|surges to|plunges|crashes)\b",
    r"\b(declared|resigns|assassinated|arrested|state of emergency)\b",
]

HIGH_RELIABILITY_SOURCES = [
    "reuters", "associated press", "ap", "bbc", "bbc news",
    "nature", "the hindu", "bloomberg", "financial times", "wall street journal",
    "the verge", "techcrunch", "pti", "ani", "afp"
]

def calculate_freshness_score(published_at: Optional[datetime], now: Optional[datetime] = None) -> float:
    """Calculate freshness score from 0 to 100 based on publication age."""
    if not published_at:
        return 80.0  # Default assume moderately recent if unstated

    current_time = now or datetime.utcnow()
    # Handle future or negative delta safely
    diff = current_time - published_at
    hours = diff.total_seconds() / 3600.0

    if hours <= 0.5:
        return 100.0
    elif hours <= 1.0:
        return 95.0
    elif hours <= 2.0:
        return 90.0
    elif hours <= 4.0:
        return 80.0
    elif hours <= 8.0:
        return 65.0
    elif hours <= 12.0:
        return 45.0
    elif hours <= 24.0:
        return 20.0
    else:
        return 5.0

def calculate_cross_source_score(source_count: int) -> float:
    """Calculate coverage score from 0 to 100 based on independent reporting sources."""
    if source_count <= 1:
        return 30.0
    elif source_count == 2:
        return 65.0
    elif source_count == 3:
        return 85.0
    else:
        return 100.0

def calculate_topic_importance(title: str, summary: Optional[str] = None) -> float:
    """Determine topic importance score from 0 to 100 based on domain keyword matches."""
    text = f"{title} {summary or ''}".lower()
    
    # Check for tier 1 high impact topics
    for pattern in HIGH_IMPACT_TOPICS:
        if re.search(pattern, text, re.IGNORECASE):
            return 90.0

    # Check for tier 2 moderate impact topics
    for pattern in MODERATE_IMPACT_TOPICS:
        if re.search(pattern, text, re.IGNORECASE):
            return 72.0

    return 50.0

def calculate_source_reliability(source_name: Optional[str]) -> float:
    """Assess publisher reliability score from 0 to 100."""
    if not source_name:
        return 65.0
    
    clean_src = source_name.lower().strip()
    for trusted in HIGH_RELIABILITY_SOURCES:
        if trusted in clean_src:
            return 95.0

    return 75.0

def calculate_breaking_signal(title: str) -> float:
    """Evaluate breaking-news linguistic indicators."""
    text = title.lower()
    for pattern in BREAKING_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return 95.0
    return 40.0

def calculate_engagement_signal(view_count: int = 0) -> float:
    """Scale engagement score based on initial signals or view velocity."""
    if view_count <= 0:
        return 50.0
    bonus = min(50.0, (view_count / 100.0) * 50.0)
    return 50.0 + bonus

def calculate_local_viral_score(
    title: str,
    summary: Optional[str] = None,
    source_name: Optional[str] = None,
    published_at: Optional[datetime] = None,
    source_count: int = 1,
    view_count: int = 0,
    now: Optional[datetime] = None
) -> float:
    """
    Deterministic viral scoring model combining recency, coverage, importance,
    source reliability, breaking signals, and engagement weights.
    Returns score clamped to [0.0, 100.0].
    """
    freshness = calculate_freshness_score(published_at, now=now)
    coverage = calculate_cross_source_score(source_count)
    topic = calculate_topic_importance(title, summary)
    reliability = calculate_source_reliability(source_name)
    breaking = calculate_breaking_signal(title)
    engagement = calculate_engagement_signal(view_count)

    score = (
        (freshness * settings.HOT_NEWS_WEIGHT_FRESHNESS) +
        (coverage * settings.HOT_NEWS_WEIGHT_COVERAGE) +
        (topic * settings.HOT_NEWS_WEIGHT_TOPIC) +
        (reliability * settings.HOT_NEWS_WEIGHT_RELIABILITY) +
        (breaking * settings.HOT_NEWS_WEIGHT_BREAKING) +
        (engagement * settings.HOT_NEWS_WEIGHT_ENGAGEMENT)
    )

    return round(max(0.0, min(100.0, score)), 1)

async def evaluate_viral_score_with_ai(
    title: str,
    summary: Optional[str] = None,
    source_name: Optional[str] = None,
    local_score: float = 0.0
) -> Tuple[float, Optional[str]]:
    """
    Conditionally query OpenRouter LLM to refine viral score for high-potential candidates.
    Falls back gracefully to local deterministic score on any network, schema, or API error.
    """
    # Guard: only call AI if enabled, configured, and local score meets threshold
    if not settings.HOT_NEWS_USE_AI:
        return local_score, None

    if local_score < settings.HOT_NEWS_AI_THRESHOLD:
        return local_score, None

    api_key = settings.OPENROUTER_API_KEY
    if not api_key or api_key.startswith("your_") or api_key.startswith("sk-or-v1-placeholder"):
        return local_score, None

    prompt_system = (
        "You are an expert news editor. Evaluate the viral and public interest potential "
        "of the given news headline and summary. Output a JSON object with: "
        "'viral_score' (number 0-100), 'importance' (number 0-100), 'breaking' (boolean), "
        "and 'reason' (short 1-sentence explanation)."
    )

    user_content = f"Source: {source_name or 'Wire'}\nTitle: {title}\nSummary: {summary or 'N/A'}"

    payload = {
        "model": settings.OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": prompt_system},
            {"role": "user", "content": user_content}
        ],
        "max_tokens": 120,
        "temperature": 0.2,
        "response_format": {"type": "json_object"}
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "https://chronicle-news.local",
        "X-Title": "Chronicle News Hot Ranker",
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{settings.OPENROUTER_BASE_URL}/chat/completions",
                headers=headers,
                json=payload
            )
            if resp.status_code != 200:
                logger.warning(f"OpenRouter viral scoring error {resp.status_code}: {resp.text[:150]}")
                return local_score, None

            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            # Clean markdown codeblocks if present
            clean_json = re.sub(r"```(?:json)?\s*([\s\S]*?)\s*```", r"\1", content).strip()
            parsed = json.loads(clean_json)

            ai_score = float(parsed.get("viral_score", local_score))
            reason = str(parsed.get("reason", ""))[:200]
            
            # Blend 60% AI evaluation with 40% local deterministic metrics for stability
            blended = round(0.6 * ai_score + 0.4 * local_score, 1)
            clamped = max(0.0, min(100.0, blended))
            return clamped, reason

    except Exception as e:
        logger.warning(f"OpenRouter viral scoring fallback triggered: {e}")
        return local_score, None
