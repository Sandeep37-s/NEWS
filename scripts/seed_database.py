import asyncio
import sys
import os
import uuid

# Add backend to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal, engine, Base
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User
from app.models.category import Category
from app.models.source import Source
from app.models.tag import Tag

INITIAL_CATEGORIES = [
    {"name": "India", "slug": "india", "description": "National news, policy, culture, and events across India.", "display_order": 1},
    {"name": "World", "slug": "world", "description": "International developments, diplomacy, and global affairs.", "display_order": 2},
    {"name": "Technology", "slug": "technology", "description": "AI, computing, semiconductors, gadgets, and software innovation.", "display_order": 3},
    {"name": "Business", "slug": "business", "description": "Markets, finance, economy, enterprise, and startup ecosystems.", "display_order": 4},
    {"name": "Sports", "slug": "sports", "description": "Cricket, football, athletics, championships, and sports analysis.", "display_order": 5},
    {"name": "Entertainment", "slug": "entertainment", "description": "Cinema, television, music, culture, and digital media.", "display_order": 6},
    {"name": "Science", "slug": "science", "description": "Space exploration, physics, climate science, and breakthrough research.", "display_order": 7},
    {"name": "Health", "slug": "health", "description": "Medicine, public health, wellness, biotechnology, and medical research.", "display_order": 8},
    {"name": "Education", "slug": "education", "description": "Academia, student opportunities, literacy, and educational reform.", "display_order": 9},
]

INITIAL_SOURCES = [
    {
        "name": "BBC News - World",
        "website_url": "https://www.bbc.com/news/world",
        "rss_url": "https://feeds.bbci.co.uk/news/world/rss.xml",
        "category_slug": "world",
        "usage_policy": "METADATA_ONLY",
        "image_policy": "LICENSED",
        "trust_level": "MANUAL_REVIEW"
    },
    {
        "name": "The Verge",
        "website_url": "https://www.theverge.com",
        "rss_url": "https://www.theverge.com/rss/index.xml",
        "category_slug": "technology",
        "usage_policy": "METADATA_ONLY",
        "image_policy": "NOT_ALLOWED",
        "trust_level": "MANUAL_REVIEW"
    },
    {
        "name": "Nature News",
        "website_url": "https://www.nature.com",
        "rss_url": "https://www.nature.com/nature.rss",
        "category_slug": "science",
        "usage_policy": "METADATA_ONLY",
        "image_policy": "NOT_ALLOWED",
        "trust_level": "MANUAL_REVIEW"
    },
    {
        "name": "TechCrunch",
        "website_url": "https://techcrunch.com",
        "rss_url": "https://techcrunch.com/feed/",
        "category_slug": "technology",
        "usage_policy": "METADATA_ONLY",
        "image_policy": "NOT_ALLOWED",
        "trust_level": "MANUAL_REVIEW"
    },
    {
        "name": "Google News India",
        "website_url": "https://news.google.com",
        "rss_url": "https://news.google.com/rss/search?q=India&hl=en-IN&gl=IN&ceid=IN:en",
        "category_slug": "india",
        "usage_policy": "METADATA_ONLY",
        "image_policy": "NOT_ALLOWED",
        "trust_level": "MANUAL_REVIEW"
    }
]

async def seed():
    print("Connecting to database...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # 1. Seed Super Admin
        admin_res = await db.execute(select(User).where(User.email == settings.SUPERADMIN_EMAIL))
        admin = admin_res.scalar_one_or_none()
        if not admin:
            admin = User(
                id=str(uuid.uuid4()),
                email=settings.SUPERADMIN_EMAIL,
                hashed_password=get_password_hash(settings.SUPERADMIN_PASSWORD),
                full_name=settings.SUPERADMIN_NAME,
                role="SUPER_ADMIN",
                is_active=True
            )
            db.add(admin)
            print(f"Created Super Admin: {settings.SUPERADMIN_EMAIL}")
        else:
            print("Super Admin already exists.")

        # 2. Seed Categories
        category_map = {}
        for cat_data in INITIAL_CATEGORIES:
            res = await db.execute(select(Category).where(Category.slug == cat_data["slug"]))
            existing_cat = res.scalar_one_or_none()
            if not existing_cat:
                category = Category(
                    id=str(uuid.uuid4()),
                    name=cat_data["name"],
                    slug=cat_data["slug"],
                    description=cat_data["description"],
                    display_order=cat_data["display_order"],
                    is_active=True
                )
                db.add(category)
                category_map[cat_data["slug"]] = category.id
                print(f"Created Category: {cat_data['name']}")
            else:
                category_map[cat_data["slug"]] = existing_cat.id

        await db.commit()

        # 3. Seed Sources
        for src_data in INITIAL_SOURCES:
            res = await db.execute(select(Source).where(Source.rss_url == src_data["rss_url"]))
            existing_src = res.scalar_one_or_none()
            if not existing_src:
                target_cat_id = category_map.get(src_data["category_slug"])
                source = Source(
                    id=str(uuid.uuid4()),
                    name=src_data["name"],
                    website_url=src_data["website_url"],
                    rss_url=src_data["rss_url"],
                    provider_type="RSS",
                    enabled=True,
                    default_category_id=target_cat_id,
                    usage_policy=src_data["usage_policy"],
                    image_policy=src_data["image_policy"],
                    attribution_required=True,
                    trust_level=src_data["trust_level"]
                )
                db.add(source)
                print(f"Created Source: {src_data['name']}")

        await db.commit()
        print("Database seed completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed())
