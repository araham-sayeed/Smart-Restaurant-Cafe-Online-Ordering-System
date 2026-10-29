import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.services.seed import DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD

client = TestClient(app)


def test_default_admin_login():
    res = client.post(
        "/auth/login",
        json={"identifier": DEFAULT_ADMIN_EMAIL, "password": DEFAULT_ADMIN_PASSWORD, "otp_code": "000000"},
    )
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    body = me.json()
    assert body["role"] in ("admin", "owner")
    assert body["restaurant_slug"]


def test_customer_register_and_menu_permissions():
    unique = uuid.uuid4().hex[:8]
    phone = f"050{unique[:7]}"
    pwd = "securePassword123"

    reg = client.post(
        "/auth/register",
        json={
            "full_name": "Hungry Customer",
            "phone": phone,
            "password": pwd,
            "otp_code": "000000",
        },
    )
    assert reg.status_code == 201, reg.text
    cust_token = reg.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    me = client.get("/auth/me", headers=cust_headers)
    assert me.status_code == 200
    assert me.json()["role"] == "customer"

    admin_res = client.post(
        "/auth/login",
        json={"identifier": DEFAULT_ADMIN_EMAIL, "password": DEFAULT_ADMIN_PASSWORD, "otp_code": "000000"},
    )
    admin_headers = {"Authorization": f"Bearer {admin_res.json()['access_token']}"}

    cat_res = client.post(
        "/admin/menu/categories",
        headers=admin_headers,
        json={"name": f"Drinks {unique}", "sort_order": 0},
    )
    assert cat_res.status_code == 201

    forbidden = client.post(
        "/admin/menu/categories",
        headers=cust_headers,
        json={"name": "Hacked Category", "sort_order": 99},
    )
    assert forbidden.status_code == 403

    admin_register = client.post(
        "/auth/register",
        json={
            "full_name": "Fake Admin",
            "phone": f"0509{unique[:6]}",
            "password": pwd,
            "otp_code": "000000",
        },
    )
    assert admin_register.status_code == 201
    assert client.get("/auth/me", headers={"Authorization": f"Bearer {admin_register.json()['access_token']}"}).json()["role"] == "customer"


def test_customer_passwordless_otp_auth():
    import random
    phone = f"0507{random.randint(100000, 999999)}"

    # Request OTP
    req = client.post("/auth/customer/otp/request", json={"phone": phone})
    assert req.status_code == 200, req.text
    dev_otp = req.json().get("dev_otp") or "000000"

    # Verify OTP without password (auto-creates customer)
    verify = client.post(
        "/auth/customer/otp/verify",
        json={"phone": phone, "otp_code": dev_otp, "full_name": "Alice Customer"},
    )
    assert verify.status_code == 200, verify.text
    token = verify.json()["access_token"]

    # Verify customer profile
    me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    data = me.json()
    assert data["role"] == "customer"
    assert data["full_name"] == "Alice Customer"
    assert data["phone"] == phone
