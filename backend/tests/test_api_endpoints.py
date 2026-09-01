import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_public_categories_and_articles_endpoints(client: AsyncClient):
    # 1. List Categories
    res = await client.get("/api/v1/categories")
    assert res.status_code == 200
    cats = res.json()
    assert len(cats) >= 1
    assert any(c["slug"] == "technology" for c in cats)

    # 2. List Articles
    res_art = await client.get("/api/v1/articles")
    assert res_art.status_code == 200
    data = res_art.json()
    assert "items" in data
    assert "total" in data

@pytest.mark.asyncio
async def test_admin_protected_routes_unauthenticated(client: AsyncClient):
    # Unauthenticated access should fail with 401
    res = await client.get("/api/v1/admin/dashboard")
    assert res.status_code == 401

@pytest.mark.asyncio
async def test_admin_article_creation_and_review(client: AsyncClient):
    # 1. Login as editor
    login_res = await client.post("/api/v1/auth/login", json={
        "email": "editor@test.com",
        "password": "TestPassword123!"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Access dashboard
    dash_res = await client.get("/api/v1/admin/dashboard", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert "total_articles" in dash_data

    # 3. Create manual article
    create_res = await client.post("/api/v1/admin/articles", headers=headers, json={
        "title": "Quantum Computing Milestone Reached",
        "summary": "Scientists achieve quantum supremacy on new error-corrected chip.",
        "content": "<p>Full editorial report on quantum milestones.</p>",
        "category_id": "test-tech-cat-uuid",
        "author": "Science Reporter",
        "status": "PENDING_REVIEW",
        "tags": ["Quantum", "Physics"]
    })
    assert create_res.status_code == 200
    art = create_res.json()
    assert art["title"] == "Quantum Computing Milestone Reached"
    assert art["status"] == "PENDING_REVIEW"
    art_id = art["id"]

    # 4. Publish article
    pub_res = await client.post(f"/api/v1/admin/articles/{art_id}/publish", headers=headers)
    assert pub_res.status_code == 200
    assert pub_res.json()["status"] == "PUBLISHED"

    # 5. Public lookup
    public_res = await client.get(f"/api/v1/articles/{art['slug']}")
    assert public_res.status_code == 200
    assert public_res.json()["title"] == "Quantum Computing Milestone Reached"
