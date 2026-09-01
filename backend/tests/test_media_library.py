import io
import pytest
from PIL import Image as PILImage
from httpx import AsyncClient

def generate_test_image_bytes(format="PNG", size=(1200, 800), color="green") -> bytes:
    """Generate in-memory image bytes for API testing."""
    buf = io.BytesIO()
    img = PILImage.new("RGB", size, color=color)
    img.save(buf, format=format)
    buf.seek(0)
    return buf.getvalue()

@pytest.mark.asyncio
async def test_admin_media_upload_and_optimization(client: AsyncClient):
    """Test valid image upload with PIL validation and dimension/size extraction."""
    # 1. Login as editor
    login_res = await client.post("/api/v1/auth/login", json={
        "email": "editor@test.com",
        "password": "TestPassword123!"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Upload image
    img_bytes = generate_test_image_bytes(format="PNG", size=(1200, 800), color="green")
    files = {
        "file": ("test_nature.png", img_bytes, "image/png")
    }
    data = {
        "license_type": "CC_BY",
        "alt_text": "Green landscape scenery",
        "caption": "A scenic view captured in the valley",
        "credit": "Jane Doe / Photography",
        "original_source": "Staff Field Work",
        "license_url": "https://creativecommons.org/licenses/by/4.0/"
    }

    response = await client.post(
        "/api/v1/admin/media/upload",
        files=files,
        data=data,
        headers=headers
    )

    assert response.status_code == 200
    res_data = response.json()
    assert res_data["alt_text"] == "Green landscape scenery"
    assert res_data["caption"] == "A scenic view captured in the valley"
    assert res_data["credit"] == "Jane Doe / Photography"
    assert res_data["license_type"] == "CC_BY"
    assert res_data["width"] == 1200
    assert res_data["height"] == 800
    assert res_data["mime_type"] == "image/webp"
    assert res_data["storage_url"].startswith("/uploads/")

    image_id = res_data["id"]

    # 3. Test GET Media List with search query
    list_res = await client.get(
        "/api/v1/admin/media?q=landscape",
        headers=headers
    )
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["total"] >= 1
    assert any(item["id"] == image_id for item in list_data["items"])

    # 4. Test UPDATE Media Metadata
    update_res = await client.put(
        f"/api/v1/admin/media/{image_id}",
        json={
            "caption": "Updated caption description",
            "credit": "Jane Doe, Senior Photojournalist"
        },
        headers=headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["caption"] == "Updated caption description"
    assert update_res.json()["credit"] == "Jane Doe, Senior Photojournalist"

    # 5. Test DELETE Media Item
    delete_res = await client.delete(
        f"/api/v1/admin/media/{image_id}",
        headers=headers
    )
    assert delete_res.status_code == 200

    # 6. Verify deleted
    get_res = await client.get(
        f"/api/v1/admin/media/{image_id}",
        headers=headers
    )
    assert get_res.status_code == 404

@pytest.mark.asyncio
async def test_admin_media_upload_invalid_bytes(client: AsyncClient):
    """Test rejection of fake/corrupted images with malicious executable payloads."""
    # Login as editor
    login_res = await client.post("/api/v1/auth/login", json={
        "email": "editor@test.com",
        "password": "TestPassword123!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    fake_bytes = b"MZ\x90\x00\x03\x00\x00\x00this is a disguised executable binary"
    files = {
        "file": ("malware.jpg", fake_bytes, "image/jpeg")
    }
    
    response = await client.post(
        "/api/v1/admin/media/upload",
        files=files,
        data={"license_type": "OWNED"},
        headers=headers
    )
    assert response.status_code == 400
    assert "Corrupted or invalid image" in response.json()["detail"]
