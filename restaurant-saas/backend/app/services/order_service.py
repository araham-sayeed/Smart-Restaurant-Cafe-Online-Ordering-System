from decimal import Decimal
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from app.models.menu import MenuItem, AddonGroup
from app.models.order import Order, OrderItem, OrderItemAddon
from app.models.restaurant import Restaurant
from app.models.user import User
from app.schemas.order import OrderCreate
from app.services.event_bus import publish_order_event, serialize_order_for_event

TWO = Decimal("0.01")

VALID_TRANSITIONS = {
    "received": {"preparing", "cancelled"},
    "preparing": {"ready", "cancelled"},
    "ready": {"completed", "cancelled"},
    "completed": set(),
    "cancelled": set(),
}

def bad(msg: str):
    raise HTTPException(400, msg)

def create_order(db: Session, restaurant: Restaurant, data: OrderCreate) -> Order:
    if data.order_type == "delivery" and not (data.delivery_address or "").strip():
        bad("Delivery address is required")

    # load every requested item in ONE query, restricted to this restaurant
    item_ids = {line.item_id for line in data.items}
    items = db.scalars(
        select(MenuItem)
        .where(MenuItem.id.in_(item_ids), MenuItem.restaurant_id == restaurant.id)
        .options(selectinload(MenuItem.addon_groups).selectinload(AddonGroup.options))
    ).all()
    items_by_id = {i.id: i for i in items}

    # Calculate max prep time across all ordered items (e.g. max(pizza=10, coffee=5) = 10)
    max_prep = max((i.prep_time_minutes for i in items if getattr(i, "prep_time_minutes", None)), default=5)

    order = Order(
        restaurant_id=restaurant.id,
        customer_name=data.customer_name.strip(),
        customer_phone=data.customer_phone.strip(),
        order_type=data.order_type,
        delivery_address=data.delivery_address,
        notes=data.notes,
        payment_method=data.payment_method,
        status="received",
        estimated_prep_minutes=max_prep,
        payment_status="paid" if data.payment_method == "card" else "unpaid",
        subtotal=Decimal("0"),
        total=Decimal("0"),
    )

    subtotal = Decimal("0")

    for line in data.items:
        item = items_by_id.get(line.item_id)
        if not item:
            bad("An item in your cart no longer exists")
        if not item.is_available:
            bad(f"{item.name} is out of stock")

        if len(set(line.option_ids)) != len(line.option_ids):
            bad("Duplicate add-on selected")

        lookup = {opt.id: (group, opt) for group in item.addon_groups for opt in group.options}
        chosen = []
        for oid in line.option_ids:
            if oid not in lookup:
                bad(f"Invalid add-on for {item.name}")
            group, opt = lookup[oid]
            if not opt.is_available:
                bad(f"{opt.name} is currently unavailable")
            chosen.append((group, opt))

        # enforce each group's rules (required / min / max)
        for group in item.addon_groups:
            count = sum(1 for g, _ in chosen if g.id == group.id)
            minimum = max(group.min_select, 1 if group.is_required else 0)
            if count < minimum:
                bad(f"Please choose an option for '{group.name}' on {item.name}")
            if count > group.max_select:
                bad(f"Too many options for '{group.name}' on {item.name}")

        extras = sum((opt.extra_price for _, opt in chosen), Decimal("0"))
        line_total = ((item.price + extras) * line.quantity).quantize(TWO)
        subtotal += line_total

        order_item = OrderItem(
            menu_item_id=item.id,
            name=item.name,
            unit_price=item.price,
            quantity=line.quantity,
            note=line.note,
            line_total=line_total,
            addons=[OrderItemAddon(option_id=o.id, name=o.name, extra_price=o.extra_price)
                    for _, o in chosen],
        )
        order.items.append(order_item)

    order.subtotal = subtotal.quantize(TWO)
    order.total = order.subtotal
    db.add(order)
    db.commit()

    # Re-query with eager loading
    loaded_order = db.scalar(
        select(Order)
        .where(Order.id == order.id)
        .options(selectinload(Order.items).selectinload(OrderItem.addons))
    )

    # Publish real-time event to Redis
    try:
        publish_order_event(
            restaurant_id=loaded_order.restaurant_id,
            public_id=loaded_order.public_id,
            event_type="order.created",
            order_data=serialize_order_for_event(loaded_order)
        )
    except Exception:
        pass

    return loaded_order

def update_order_status(db: Session, order_id: int, new_status: str, user: User) -> Order:
    order = db.scalar(
        select(Order)
        .where(Order.id == order_id, Order.restaurant_id == user.restaurant_id)
        .options(selectinload(Order.items).selectinload(OrderItem.addons))
    )
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")

    allowed = VALID_TRANSITIONS.get(order.status, set())
    if new_status not in allowed:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Cannot change order status from '{order.status}' to '{new_status}'"
        )

    order.status = new_status
    now = datetime.now(timezone.utc)
    if new_status == "preparing" and not order.prep_started_at:
        order.prep_started_at = now
    elif new_status == "ready" and not order.ready_at:
        order.ready_at = now

    db.commit()
    db.refresh(order)

    # Broadcast event via Redis pub/sub
    try:
        publish_order_event(
            restaurant_id=order.restaurant_id,
            public_id=order.public_id,
            event_type="order.updated",
            order_data=serialize_order_for_event(order)
        )
    except Exception:
        pass

    return order