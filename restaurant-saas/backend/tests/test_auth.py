import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_single_restaurant_register_and_roles():
    unique = uuid.uuid4().hex[:8]
    admin_email = f"admin_{unique}@example.com"
    customer_email = f"cust_{unique}@example.com"
    pwd = "securePassword123"

    # 1. Register Admin without specifying restaurant_name
    admin_res = client.post(
        "/auth/register",
        json={
            "full_name": "Restaurant Admin",
            "email": admin_email,
            "password": pwd,
            "role": "admin",
        },
    )
    assert admin_res.status_code == 201, admin_res.text
    admin_token = admin_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Verify admin role via /auth/me
    me_res = client.get("/auth/me", headers=admin_headers)
    assert me_res.status_code == 200
    assert me_res.json()["role"] == "admin"

    # Admin CAN create category
    cat_res = client.post(
        "/admin/menu/categories",
        headers=admin_headers,
        json={"name": f"Drinks {unique}", "sort_order": 0},
    )
    assert cat_res.status_code == 201

    # 2. Register Customer without restaurant_name
    cust_res = client.post(
        "/auth/register",
        json={
            "full_name": "Hungry Customer",
            "email": customer_email,
            "password": pwd,
            "role": "customer",
        },
    )
    assert cust_res.status_code == 201, cust_res.text
    cust_token = cust_res.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # Verify customer role
    cust_me = client.get("/auth/me", headers=cust_headers)
    assert cust_me.status_code == 200
    assert cust_me.json()["role"] == "customer"

    # Customer CANNOT create or edit menu categories (403 Forbidden)
    forbidden_res = client.post(
        "/admin/menu/categories",
        headers=cust_headers,
        json={"name": "Hacked Category", "sort_order": 99},
    )
    assert forbidden_res.status_code == 403, "Customer must not be allowed to modify menu"
