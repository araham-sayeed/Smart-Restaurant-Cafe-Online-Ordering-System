import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_register_and_login_flow():
    unique_suffix = uuid.uuid4().hex[:8]
    email = f"owner_{unique_suffix}@example.com"
    password = "securePassword123"
    restaurant_name = f"Cafe {unique_suffix}"

    # 1. Register restaurant + owner
    reg_response = client.post(
        "/auth/register",
        json={
            "restaurant_name": restaurant_name,
            "full_name": "Test Owner",
            "email": email,
            "password": password,
        },
    )
    assert reg_response.status_code == 201, reg_response.text
    token_data = reg_response.json()
    assert "access_token" in token_data
    access_token = token_data["access_token"]

    # 2. Access /auth/me with Bearer token
    me_response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert me_response.status_code == 200, me_response.text
    user_info = me_response.json()
    assert user_info["email"] == email
    assert user_info["role"] == "owner"

    # 3. Login with credentials
    login_response = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )
    assert login_response.status_code == 200, login_response.text
    assert "access_token" in login_response.json()
