import pytest
from app.services.ai.openrouter import OpenRouterAIService

def test_json_extraction_from_markdown():
    service = OpenRouterAIService()
    
    markdown_wrapped = """Here is your response:
```json
{
  "title": "Cleaned Headline",
  "summary": "This is an objective executive summary.",
  "category_slug": "technology",
  "tags": ["AI", "Innovation"],
  "sentiment": "neutral"
}
```
"""
    result = service._extract_json_from_text(markdown_wrapped)
    assert result is not None
    assert result["title"] == "Cleaned Headline"
    assert result["category_slug"] == "technology"
    assert "AI" in result["tags"]

@pytest.mark.asyncio
async def test_ai_fallback_generation():
    service = OpenRouterAIService()
    # Force empty key to test fallback
    service.api_key = ""
    
    result = await service.process_article_content(
        title="India Launches New Solar Mission",
        content_snippet="ISRO has successfully launched a groundbreaking solar observatory into orbit.",
        source_name="Science Wire",
        category_hint="science"
    )
    assert result is not None
    assert result["title"] == "India Launches New Solar Mission"
    assert "ISRO" in result["summary"]
    assert result["category_slug"] == "science"
    assert len(result["tags"]) > 0
    assert result["is_ai_fallback"] is True
