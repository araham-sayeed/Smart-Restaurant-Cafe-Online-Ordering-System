import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.services.seed import DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD

client = TestClient(app)

def test_kitchen_queue_and_status_transitions():
    # 1. Admin login
    admin_login = client.post(
        "/auth/login",
        json={"identifier": DEFAULT_ADMIN_EMAIL, "password": DEFAULT_ADMIN_PASSWORD, "otp_code": "000000"},
    )
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Create Category and two items with different prep times
    unique = uuid.uuid4().hex[:6]
    cat_res = client.post(
        "/admin/menu/categories",
        headers=admin_headers,
        json={"name": f"Food {unique}", "sort_order": 1},
    )
    assert cat_res.status_code == 201
    cat_id = cat_res.json()["id"]

    # Coffee: 5 min
    coffee_res = client.post(
        "/admin/menu/items",
        headers=admin_headers,
        json={
            "category_id": cat_id,
            "name": f"Espresso {unique}",
            "price": "3.50",
            "prep_time_minutes": 5,
        },
    )
    assert coffee_res.status_code == 201
    coffee_id = coffee_res.json()["id"]

    # Pizza: 10 min
    pizza_res = client.post(
        "/admin/menu/items",
        headers=admin_headers,
        json={
            "category_id": cat_id,
            "name": f"Margherita Pizza {unique}",
            "price": "12.00",
            "prep_time_minutes": 10,
        },
    )
    assert pizza_res.status_code == 201
    pizza_id = pizza_res.json()["id"]

    # 3. Customer places order with both items (max prep = 10 min)
    order_res = client.post(
        "/public/orders",
        json={
            "customer_name": "Dave Customer",
            "customer_phone": "0505555555",
            "order_type": "dine_in",
            "payment_method": "cash",
            "items": [
                {"item_id": coffee_id, "quantity": 1},
                {"item_id": pizza_id, "quantity": 1},
            ],
        },
    )
    assert order_res.status_code == 201, order_res.text
    order_data = order_res.json()
    order_id = order_data["id"]
    public_id = order_data["public_id"]

    # Check that estimated_prep_minutes is max(5, 10) = 10
    assert order_data["estimated_prep_minutes"] == 10
    assert order_data["status"] == "received"

    # 4. Kitchen views active orders
    kitchen_orders = client.get("/kitchen/orders", headers=admin_headers)
    assert kitchen_orders.status_code == 200
    active_ids = [o["id"] for o in kitchen_orders.json()]
    assert order_id in active_ids

    # 5. Kitchen starts preparing -> status moves to "preparing", prep_started_at is set
    prep_res = client.patch(
        f"/kitchen/orders/{order_id}/status",
        headers=admin_headers,
        json={"status": "preparing"},
    )
    assert prep_res.status_code == 200
    prep_data = prep_res.json()
    assert prep_data["status"] == "preparing"
    assert prep_data["prep_started_at"] is not None

    # 6. Kitchen marks ready -> status moves to "ready", ready_at is set
    ready_res = client.patch(
        f"/kitchen/orders/{order_id}/status",
        headers=admin_headers,
        json={"status": "ready"},
    )
    assert ready_res.status_code == 200
    ready_data = ready_res.json()
    assert ready_data["status"] == "ready"
    assert ready_data["ready_at"] is not None

    # 7. Kitchen marks completed
    done_res = client.patch(
        f"/kitchen/orders/{order_id}/status",
        headers=admin_headers,
        json={"status": "completed"},
    )
    assert done_res.status_code == 200
    assert done_res.json()["status"] == "completed"

    # 8. Illegal jump test: completed -> preparing is forbidden
    bad_res = client.patch(
        f"/kitchen/orders/{order_id}/status",
        headers=admin_headers,
        json={"status": "preparing"},
    )
    assert bad_res.status_code == 400
