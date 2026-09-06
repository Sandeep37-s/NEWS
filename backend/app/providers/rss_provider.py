import logging
import time
from datetime import datetime
from typing import List, Optional
import feedparser
import httpx

from app.providers.base import NewsProvider, RawArticleItem
from app.services.ingestion.normalizer import clean_url, clean_html_to_text

logger = logging.getLogger(__name__)

class RSSProvider(NewsProvider):
    def __init__(self, timeout: float = 15.0):
        self.timeout = timeout
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (ChronicleNewsBot/1.0)",
            "Accept": "application/rss+xml, application/xml, application/atom+xml, text/xml, */*"
        }

    def _parse_date(self, entry: dict) -> Optional[datetime]:
        time_struct = getattr(entry, "published_parsed", None) or getattr(entry, "updated_parsed", None)
        if time_struct:
            try:
                return datetime.fromtimestamp(time.mktime(time_struct))
            except Exception:
                pass
        return None

    def _extract_image_url(self, entry: dict) -> Optional[str]:
        # 1. Check media_content
        media_content = getattr(entry, "media_content", [])
        if media_content and isinstance(media_content, list):
            for m in media_content:
                if isinstance(m, dict) and "url" in m:
                    return m["url"]
        
        # 2. Check media_thumbnail
        media_thumbnail = getattr(entry, "media_thumbnail", [])
        if media_thumbnail and isinstance(media_thumbnail, list):
            for t in media_thumbnail:
                if isinstance(t, dict) and "url" in t:
                    return t["url"]

        # 3. Check enclosures
        enclosures = getattr(entry, "enclosures", [])
        if enclosures and isinstance(enclosures, list):
            for enc in enclosures:
                if hasattr(enc, "type") and enc.type.startswith("image/") and hasattr(enc, "href"):
                    return enc.href
                elif isinstance(enc, dict) and enc.get("type", "").startswith("image/") and "href" in enc:
                    return enc["href"]
        return None

    async def fetch_articles(self, rss_url: str, limit: int = 20) -> List[RawArticleItem]:
        items: List[RawArticleItem] = []
        try:
            async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
                response = await client.get(rss_url, headers=self.headers)
                if response.status_code != 200:
                    logger.warning(f"Failed to fetch RSS from {rss_url}, status code: {response.status_code}")
                    return items
                
                content = response.content
        except Exception as e:
            logger.error(f"HTTP error fetching feed {rss_url}: {e}")
            raise

        try:
            feed = feedparser.parse(content)
            if feed.bozo and not feed.entries:
                logger.warning(f"Feed parser reported error for {rss_url}: {feed.bozo_exception}")

            for entry in feed.entries[:limit]:
                title = getattr(entry, "title", "").strip()
                link = getattr(entry, "link", "").strip()
                if not title or not link:
                    continue

                clean_link = clean_url(link)
                guid = getattr(entry, "id", None) or clean_link
                
                # Raw summary / description
                summary_raw = getattr(entry, "summary", "") or getattr(entry, "description", "")
                
                # Content if available
                content_raw = ""
                if hasattr(entry, "content"):
                    for c in entry.content:
                        if isinstance(c, dict) and "value" in c:
                            content_raw += c["value"]
                        elif hasattr(c, "value"):
                            content_raw += c.value

                author = getattr(entry, "author", None)
                pub_date = self._parse_date(entry)
                image_url = self._extract_image_url(entry)

                # Categories / tags
                categories = []
                tags_attr = getattr(entry, "tags", [])
                if tags_attr:
                    for t in tags_attr:
                        term = getattr(t, "term", None) if hasattr(t, "term") else t.get("term") if isinstance(t, dict) else None
                        if term:
                            categories.append(term.strip())

                items.append(RawArticleItem(
                    title=clean_html_to_text(title)[:500],
                    original_url=clean_link[:2048],
                    external_id=str(guid)[:1024],
                    summary_raw=clean_html_to_text(summary_raw),
                    content_raw=clean_html_to_text(content_raw) if content_raw else clean_html_to_text(summary_raw),
                    author=author.strip()[:500] if author else None,
                    published_at=pub_date or datetime.utcnow(),
                    image_url=image_url[:2048] if image_url else None,
                    categories=[c[:100] for c in categories]
                ))

        except Exception as e:
            logger.error(f"Error parsing feed content from {rss_url}: {e}")
            raise

        return items

rss_provider = RSSProvider()
