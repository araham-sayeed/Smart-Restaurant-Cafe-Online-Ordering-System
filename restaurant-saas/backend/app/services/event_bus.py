import json
import logging
from decimal import Decimal
from datetime import datetime
from app.core.redis_client import get_redis

logger = logging.getLogger(__name__)

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def serialize_order_for_event(order) -> dict:
    """Creates a serializable dictionary representation of an Order."""
    return {
        "id": order.id,
        "public_id": order.public_id,
        "restaurant_id": order.restaurant_id,
        "customer_name": order.customer_name,
        "customer_phone": order.customer_phone,
        "order_type": order.order_type,
        "status": order.status,
        "estimated_prep_minutes": getattr(order, "estimated_prep_minutes", 5) or 5,
        "prep_started_at": order.prep_started_at.isoformat() if getattr(order, "prep_started_at", None) else None,
        "ready_at": order.ready_at.isoformat() if getattr(order, "ready_at", None) else None,
        "payment_method": order.payment_method,
        "payment_status": order.payment_status,
        "subtotal": float(order.subtotal) if order.subtotal is not None else 0.0,
        "total": float(order.total) if order.total is not None else 0.0,
        "notes": order.notes,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "items": [
            {
                "id": item.id,
                "name": item.name,
                "unit_price": float(item.unit_price),
                "quantity": item.quantity,
                "note": item.note,
                "line_total": float(item.line_total),
                "addons": [
                    {
                        "name": a.name,
                        "extra_price": float(a.extra_price)
                    }
                    for a in (item.addons or [])
                ]
            }
            for item in (order.items or [])
        ]
    }

def publish_order_event(restaurant_id: int, public_id: str, event_type: str, order_data: dict) -> None:
    """
    Publishes an order event to both:
      1) restaurant:{restaurant_id}:orders (for kitchen live queue)
      2) order:{public_id} (for customer live tracking)
    """
    message = json.dumps({"event": event_type, "data": order_data}, cls=CustomJSONEncoder)
    
    # 1. Kitchen channel
    kitchen_channel = f"restaurant:{restaurant_id}:orders"
    # 2. Customer channel
    customer_channel = f"order:{public_id}"

    try:
        r = get_redis()
        r.publish(kitchen_channel, message)
        r.publish(customer_channel, message)
    except Exception as e:
        logger.warning(f"Could not publish event to Redis: {e}")
