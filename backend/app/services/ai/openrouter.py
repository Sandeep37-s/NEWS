import json
import logging
import re
from typing import Dict, Any, Optional
import httpx

from app.core.config import settings
from app.services.ai.prompts import SYSTEM_SUMMARY_PROMPT, USER_SUMMARY_TEMPLATE

logger = logging.getLogger(__name__)

class OpenRouterAIService:
    def __init__(self):
        self.api_key = settings.OPENROUTER_API_KEY
        self.base_url = settings.OPENROUTER_BASE_URL
        self.model = settings.OPENROUTER_MODEL
        self.max_tokens = settings.OPENROUTER_MAX_TOKENS
        self.temperature = settings.OPENROUTER_TEMPERATURE

    def _extract_json_from_text(self, text: str) -> Optional[Dict[str, Any]]:
        """Extract and parse JSON object from model response text safely."""
        text = text.strip()
        # Strip markdown code blocks if present
        json_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if json_match:
            text = json_match.group(1).strip()
        
        try:
            data = json.loads(text)
            if isinstance(data, dict):
                return data
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}. Raw text: {text[:200]}")
        return None

    def _generate_fallback_summary(self, title: str, content_snippet: str, category_hint: str) -> Dict[str, Any]:
        """Deterministic local fallback summary when API key is missing or service is offline."""
        clean_snippet = content_snippet[:250].strip()
        summary = f"{clean_snippet}..." if len(content_snippet) > 250 else clean_snippet
        if not summary:
            summary = f"Summary report on: {title}"

        # Clean tags from title
        words = [w.capitalize() for w in re.findall(r'\b[A-Za-z]{4,}\b', title)]
        tags = list(dict.fromkeys(words))[:3]
        if not tags:
            tags = ["General", "News"]

        valid_slugs = ["india", "world", "technology", "business", "sports", "entertainment", "science", "health", "education"]
        cat = category_hint.lower() if category_hint.lower() in valid_slugs else "world"

        return {
            "title": title.strip(),
            "summary": summary,
            "category_slug": cat,
            "tags": tags,
            "sentiment": "neutral",
            "is_ai_fallback": True
        }

    async def process_article_content(
        self,
        title: str,
        content_snippet: str,
        source_name: str,
        category_hint: str = "world"
    ) -> Dict[str, Any]:
        """
        Process permitted article metadata through OpenRouter to generate
        a clean objective summary, categorization, and topical tags.
        """
        # If API key is not configured, gracefully use the fallback synthesizer
        if not self.api_key or self.api_key.startswith("your_"):
            logger.info("OpenRouter API key not configured or set to placeholder. Using fallback summarizer.")
            return self._generate_fallback_summary(title, content_snippet, category_hint)

        user_content = USER_SUMMARY_TEMPLATE.format(
            source_name=source_name,
            title=title,
            content_snippet=content_snippet,
            category_hint=category_hint
        )

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://chronicle-news.local",
            "X-Title": "Chronicle News Aggregator",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": SYSTEM_SUMMARY_PROMPT},
                {"role": "user", "content": user_content}
            ],
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "response_format": {"type": "json_object"}
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )

                if response.status_code != 200:
                    logger.error(f"OpenRouter API error {response.status_code}: {response.text}")
                    return self._generate_fallback_summary(title, content_snippet, category_hint)

                response_data = response.json()
                raw_message = response_data["choices"][0]["message"]["content"]
                parsed = self._extract_json_from_text(raw_message)

                if parsed and "summary" in parsed and "title" in parsed:
                    # Sanitize returned values
                    return {
                        "title": str(parsed.get("title", title)).strip(),
                        "summary": str(parsed.get("summary", "")).strip(),
                        "category_slug": str(parsed.get("category_slug", category_hint)).lower().strip(),
                        "tags": [str(t).strip() for t in parsed.get("tags", []) if isinstance(t, str)],
                        "sentiment": str(parsed.get("sentiment", "neutral")),
                        "is_ai_fallback": False
                    }
                else:
                    logger.warning("OpenRouter returned unparseable JSON structure. Falling back.")
                    return self._generate_fallback_summary(title, content_snippet, category_hint)

        except Exception as e:
            logger.exception(f"Exception during OpenRouter AI processing: {e}")
            return self._generate_fallback_summary(title, content_snippet, category_hint)

ai_service = OpenRouterAIService()
