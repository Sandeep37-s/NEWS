import asyncio
import os
import sys
import pytest
import pytest_asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models.user import User
from app.models.category import Category
from app.models.source import Source
from app.main import app

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

@pytest_asyncio.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        # Seed test admin & test category
        admin = User(
            id="test-admin-uuid",
            email="admin@test.com",
            hashed_password=get_password_hash("TestPassword123!"),
            full_name="Test SuperAdmin",
            role="SUPER_ADMIN",
            is_active=True
        )
        editor = User(
            id="test-editor-uuid",
            email="editor@test.com",
            hashed_password=get_password_hash("TestPassword123!"),
            full_name="Test Editor",
            role="EDITOR",
            is_active=True
        )
        tech_cat = Category(
            id="test-tech-cat-uuid",
            name="Technology",
            slug="technology",
            description="Tech news"
        )
        source = Source(
            id="test-source-uuid",
            name="Tech Source",
            website_url="https://tech.example.com",
            rss_url="https://tech.example.com/rss.xml",
            usage_policy="METADATA_ONLY",
            image_policy="NOT_ALLOWED",
            trust_level="MANUAL_REVIEW"
        )
        session.add_all([admin, editor, tech_cat, source])
        await session.commit()
        
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
