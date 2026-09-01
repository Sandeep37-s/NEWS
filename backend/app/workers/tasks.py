import logging
from app.core.database import AsyncSessionLocal
from app.services.ingestion.orchestrator import run_all_enabled_sources
from app.services.publishing import process_due_scheduled_articles

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
