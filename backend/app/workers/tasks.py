import logging
from app.core.database import AsyncSessionLocal
from app.services.ingestion.orchestrator import run_all_enabled_sources
from app.services.publishing import process_due_scheduled_articles
from app.services.hot_news_service import clean_expired_hot_news, reset_hot_news

logger = logging.getLogger(__name__)

async def run_periodic_feed_ingestion():
    logger.info("Executing scheduled periodic feed ingestion...")
    async with AsyncSessionLocal() as db:
        try:
            jobs = await run_all_enabled_sources(db)
            logger.info(f"Scheduled feed ingestion completed across {len(jobs)} sources.")
        except Exception as e:
            logger.exception(f"Error in periodic feed ingestion worker: {e}")

async def run_periodic_scheduled_publisher():
    async with AsyncSessionLocal() as db:
        try:
            published = await process_due_scheduled_articles(db)
            if published:
                logger.info(f"Auto-published {len(published)} due scheduled articles.")
        except Exception as e:
            logger.exception(f"Error in periodic scheduled publisher worker: {e}")

async def run_periodic_hot_news_refresh():
    """Lightweight periodic worker to purge expired hot news and keep feed fresh."""
    async with AsyncSessionLocal() as db:
        try:
            cleaned = await clean_expired_hot_news(db)
            if cleaned:
                logger.info(f"Hot news periodic refresh: cleaned {cleaned} expired entries.")
        except Exception as e:
            logger.exception(f"Error in periodic hot news refresh worker: {e}")

async def run_periodic_hot_news_reset():
    """12-hour full rolling reset: repopulates top 30 from freshest eligible candidate pool."""
    async with AsyncSessionLocal() as db:
        try:
            count = await reset_hot_news(db)
            logger.info(f"12-hour hot news reset completed. Rebuilt {count} top stories.")
        except Exception as e:
            logger.exception(f"Error in 12-hour hot news reset worker: {e}")
