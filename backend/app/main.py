import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal
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

    # Seed initial superadmin & categories
    async with AsyncSessionLocal() as db:
        try:
            import uuid
            from sqlalchemy import select
            from app.models.user import User
            from app.models.category import Category
            from app.core.security import get_password_hash

            # 1. Superadmin User
            clean_admin_email = settings.SUPERADMIN_EMAIL.strip().lower()
            stmt_user = select(User).where(User.email == clean_admin_email)
            res_user = await db.execute(stmt_user)
            existing_user = res_user.scalar_one_or_none()
            if not existing_user:
                logger.info(f"Creating default superadmin user: {clean_admin_email}")
                superadmin = User(
                    id=str(uuid.uuid4()),
                    email=clean_admin_email,
                    hashed_password=get_password_hash(settings.SUPERADMIN_PASSWORD),
                    full_name=settings.SUPERADMIN_NAME,
                    role="SUPER_ADMIN",
                    is_active=True
                )
                db.add(superadmin)
            else:
                # Ensure existing admin record has the configured password hash, active status, and SUPER_ADMIN role
                existing_user.role = "SUPER_ADMIN"
                existing_user.is_active = True
                existing_user.hashed_password = get_password_hash(settings.SUPERADMIN_PASSWORD)

            # 2. Default Categories
            default_categories = [
                ("India", "india", "National news from across India", 1),
                ("World", "world", "International stories and global headlines", 2),
                ("Technology", "technology", "Tech innovation, AI, and computing", 3),
                ("Business", "business", "Markets, economy, and finance", 4),
                ("Sports", "sports", "Live matches, cricket, football and athletics", 5),
                ("Entertainment", "entertainment", "Cinema, television, music, and pop culture", 6),
                ("Science", "science", "Scientific discoveries, space and research", 7),
                ("Health", "health", "Wellness, medical news, and healthcare", 8),
                ("Education", "education", "Academic updates, exams, and career news", 9),
            ]
            for cat_name, cat_slug, cat_desc, cat_order in default_categories:
                stmt_cat = select(Category).where(Category.slug == cat_slug)
                res_cat = await db.execute(stmt_cat)
                if not res_cat.scalar_one_or_none():
                    db.add(Category(
                        id=str(uuid.uuid4()),
                        name=cat_name,
                        slug=cat_slug,
                        description=cat_desc,
                        display_order=cat_order,
                        is_active=True
                    ))

            await db.commit()
            logger.info("Default superadmin and categories verified/seeded successfully.")
        except Exception as seed_err:
            logger.warning(f"Database seed note: {seed_err}")

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

# CORS configuration - Allow all valid web origins (localhost, Vercel, Azure, custom domains) with credentials support
cors_origins = settings.ALLOWED_ORIGINS
if isinstance(cors_origins, str):
    cors_origins = [cors_origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if "*" not in cors_origins else [],
    allow_origin_regex=r"^https?://.*$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
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
