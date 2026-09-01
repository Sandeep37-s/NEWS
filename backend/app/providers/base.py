from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class RawArticleItem(BaseModel):
    title: str
    original_url: str
    external_id: Optional[str] = None
    summary_raw: Optional[str] = None
    content_raw: Optional[str] = None
    author: Optional[str] = None
    published_at: Optional[datetime] = None
    image_url: Optional[str] = None
    categories: List[str] = []

class NewsProvider(ABC):
    @abstractmethod
    async def fetch_articles(self, rss_url: str, limit: int = 20) -> List[RawArticleItem]:
        """Fetch raw unnormalized articles from the data source."""
        pass
