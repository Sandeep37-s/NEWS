import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app.core.config import settings
from app.workers.tasks import run_periodic_feed_ingestion, run_periodic_scheduled_publisher

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

def start_background_scheduler():
    if not settings.ENABLE_BACKGROUND_WORKER:
        logger.info("Background worker is disabled via ENABLE_BACKGROUND_WORKER=false.")
        return

    # Ingestion job every N minutes
    scheduler.add_job(
        run_periodic_feed_ingestion,
        trigger=IntervalTrigger(minutes=settings.RSS_FETCH_INTERVAL_MINUTES),
        id="periodic_feed_ingestion",
        name="Periodic Feed Ingestion",
        replace_existing=True
    )

    # Publisher check every 1 minute
    scheduler.add_job(
        run_periodic_scheduled_publisher,
        trigger=IntervalTrigger(minutes=1),
        id="periodic_scheduled_publisher",
        name="Scheduled Article Auto-Publisher",
        replace_existing=True
    )

    scheduler.start()
    logger.info("Background APScheduler successfully started.")

def shutdown_background_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Background APScheduler stopped.")
