import uuid
from decimal import Decimal
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_menu_crud_and_public_endpoint():
    unique = uuid.uuid4().hex[:8]
    email = f"chef_{unique}@example.com"
    pwd = "secretpassword"
    rname = f"Bistro {unique}"

    # 1. Register owner
    reg_res = client.post(
        "/auth/register",
        json={"restaurant_name": rname, "full_name": "Head Chef", "email": email, "password": pwd},
    )
    assert reg_res.status_code == 201
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Category
    cat_res = client.post(
        "/admin/menu/categories",
        headers=headers,
        json={"name": "Espresso Bar", "sort_order": 1},
    )
    assert cat_res.status_code == 201, cat_res.text
    cat = cat_res.json()
    cat_id = cat["id"]

    # 3. Create Menu Item
    item_res = client.post(
        "/admin/menu/items",
        headers=headers,
        json={
            "category_id": cat_id,
            "name": "Oat Flat White",
            "description": "Double shot with creamy oat milk",
            "price": "4.50",
            "is_available": True,
            "sort_order": 1,
        },
    )
    assert item_res.status_code == 201, item_res.text
    item = item_res.json()
    item_id = item["id"]

    # 4. Create Addon Group
    group_res = client.post(
        "/admin/menu/items/{item_id}/addon-groups".format(item_id=item_id),
        headers=headers,
        json={"name": "Milk Choice", "is_required": True, "min_select": 1, "max_select": 1},
    )
    assert group_res.status_code == 201, group_res.text
    group = group_res.json()
    group_id = group["id"]

    # 5. Create Addon Option
    opt_res = client.post(
        "/admin/menu/addon-groups/{group_id}/options".format(group_id=group_id),
        headers=headers,
        json={"name": "Almond Milk", "extra_price": "0.75", "is_available": True},
    )
    assert opt_res.status_code == 201, opt_res.text
    opt = opt_res.json()
    assert opt["name"] == "Almond Milk"

    # 6. Test Availability Toggle
    avail_res = client.patch(
        f"/admin/menu/items/{item_id}/availability",
        headers=headers,
        json={"is_available": False},
    )
    assert avail_res.status_code == 200
    assert avail_res.json()["is_available"] is False

    # 7. Test Admin Categories with nested items
    admin_cats_res = client.get("/admin/menu/categories", headers=headers)
    assert admin_cats_res.status_code == 200
    admin_cats = admin_cats_res.json()
    created_cat = next((c for c in admin_cats if c["id"] == cat_id), None)
    assert created_cat is not None
    assert created_cat["items"][0]["name"] == "Oat Flat White"
    assert len(created_cat["items"][0]["addon_groups"]) == 1

    # 8. Test Public Menu Endpoint (slug-based)
    # Get restaurant slug via /auth/me
    me_res = client.get("/auth/me", headers=headers)
    assert me_res.status_code == 200
    
    # Check public endpoint
    pub_res = client.get("/public/menu")
    assert pub_res.status_code == 200, pub_res.text
    pub_data = pub_res.json()
    assert any(c["id"] == cat_id for c in pub_data["categories"])
