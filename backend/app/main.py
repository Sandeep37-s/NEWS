import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.database import engine, Base
import app.models # Register all models with Base
from app.api.v1.router import api_router
from app.api.deps import limiter
from app.workers.scheduler import start_background_scheduler, shutdown_background_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing database schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        if engine.dialect.name == "postgresql":
            try:
                from sqlalchemy import text
                await conn.execute(text("ALTER TABLE articles ALTER COLUMN external_id TYPE VARCHAR(1024);"))
                await conn.execute(text("ALTER TABLE articles ALTER COLUMN original_url TYPE VARCHAR(2048);"))
                await conn.execute(text("ALTER TABLE articles ALTER COLUMN author TYPE VARCHAR(500);"))
                await conn.execute(text("ALTER TABLE sources ALTER COLUMN website_url TYPE VARCHAR(2048);"))
                await conn.execute(text("ALTER TABLE sources ALTER COLUMN rss_url TYPE VARCHAR(2048);"))
                await conn.execute(text("ALTER TABLE images ALTER COLUMN storage_url TYPE VARCHAR(2048);"))
                await conn.execute(text("ALTER TABLE images ALTER COLUMN license_url TYPE VARCHAR(2048);"))
            except Exception as e:
                logger.info(f"Postgres column alteration status: {e}")
    logger.info("Database schema initialized.")

    # Ensure uploads directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    # Start background tasks
    start_background_scheduler()

    yield

    # Shutdown
    shutdown_background_scheduler()
    await engine.dispose()
    logger.info("Application shutdown complete.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
    lifespan=lifespan
)

# Alias main = app so both `app.main:app` and `app.main:main` start the server
main = app

# Rate limiter state
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again later."}
    )

# CORS configuration
cors_origins = settings.ALLOWED_ORIGINS
if isinstance(cors_origins, str):
    cors_origins = [cors_origins]
allow_all = "*" in cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if not allow_all else ["*"],
    allow_credentials=not allow_all,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for static image serving
if not os.path.exists(settings.UPLOAD_DIR):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include v1 API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
