import pytest
from httpx import AsyncClient
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token

@pytest.mark.asyncio
async def test_password_hashing():
    raw = "MySecretPass123"
    hashed = get_password_hash(raw)
    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

@pytest.mark.asyncio
async def test_jwt_token_flow():
    user_id = "test-user-12345"
    token = create_access_token(subject=user_id)
    assert token is not None
    
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == user_id

@pytest.mark.asyncio
async def test_login_api_success_and_failure(client: AsyncClient):
    # 1. Valid login
    res = await client.post("/api/v1/auth/login", json={
        "email": "admin@test.com",
        "password": "TestPassword123!"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "admin@test.com"
    assert data["user"]["role"] == "SUPER_ADMIN"
    assert "access_token" in res.cookies

    # 2. Invalid password
    res_bad = await client.post("/api/v1/auth/login", json={
        "email": "admin@test.com",
        "password": "WrongPassword"
    })
    assert res_bad.status_code == 401
