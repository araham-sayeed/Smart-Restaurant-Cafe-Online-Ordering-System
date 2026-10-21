from decimal import Decimal
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from app.models.menu import MenuItem, AddonGroup
from app.models.order import Order, OrderItem, OrderItemAddon
from app.models.restaurant import Restaurant
from app.schemas.order import OrderCreate

TWO = Decimal("0.01")

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

    order = Order(
        restaurant_id=restaurant.id,
        customer_name=data.customer_name.strip(),
        customer_phone=data.customer_phone.strip(),
        order_type=data.order_type,
        delivery_address=data.delivery_address,
        notes=data.notes,
        payment_method=data.payment_method,
        status="received",
        payment_status="unpaid",
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
    order.total = order.subtotal       # tax/fees can be added later
    db.add(order)
    db.commit()

    # Re-query with eager loading so OrderOut can serialise items → addons.
    # db.refresh() only refreshes scalar columns, not relationships.
    order = db.scalar(
        select(Order)
        .where(Order.id == order.id)
        .options(selectinload(Order.items).selectinload(OrderItem.addons))
    )
    return order