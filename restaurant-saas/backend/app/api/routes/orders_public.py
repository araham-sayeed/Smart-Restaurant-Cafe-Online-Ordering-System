import asyncio
import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from app.core.redis_client import get_async_redis
from app.db.session import get_db
from app.models.order import Order, OrderItem
from app.models.restaurant import Restaurant
from app.schemas.order import OrderCreate, OrderOut
from app.services.order_service import create_order

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/public", tags=["public-orders"])

def get_restaurant(db: Session, slug: str | None = None) -> Restaurant:
    if slug:
        r = db.scalar(select(Restaurant).where(Restaurant.slug == slug))
        if r:
            return r
    # Single-restaurant fallback
    r = db.scalar(select(Restaurant).order_by(Restaurant.id))
    if not r:
        raise HTTPException(404, "Restaurant not found")
    return r

@router.post("/orders", response_model=OrderOut, status_code=201)
@router.post("/{slug}/orders", response_model=OrderOut, status_code=201)
def place_order(data: OrderCreate, slug: str | None = None, db: Session = Depends(get_db)):
    restaurant = get_restaurant(db, slug)
    return create_order(db, restaurant, data)

@router.get("/orders/{public_id}", response_model=OrderOut)
@router.get("/{slug}/orders/{public_id}", response_model=OrderOut)
def get_order(public_id: str, slug: str | None = None, db: Session = Depends(get_db)):
    restaurant = get_restaurant(db, slug)
    order = db.scalar(
        select(Order)
        .where(Order.public_id == public_id, Order.restaurant_id == restaurant.id)
        .options(selectinload(Order.items).selectinload(OrderItem.addons))
    )
    if not order:
        raise HTTPException(404, "Order not found")
    return order

@router.get("/orders/{public_id}/stream")
@router.get("/{slug}/orders/{public_id}/stream")
async def customer_order_stream(public_id: str, slug: str | None = None):
    """Real-time SSE stream for customer live order tracking."""
    channel_name = f"order:{public_id}"

    async def event_generator():
        redis = get_async_redis()
        pubsub = redis.pubsub()
        await pubsub.subscribe(channel_name)
        yield "data: {\"event\": \"connected\", \"order_id\": \"" + public_id + "\"}\n\n"

        try:
            while True:
                try:
                    message = await asyncio.wait_for(
                        pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0),
                        timeout=15.0,
                    )
                    if message and message.get("type") == "message":
                        data = message["data"]
                        yield f"data: {data}\n\n"
                    else:
                        yield ": ping\n\n"
                except asyncio.TimeoutError:
                    yield ": ping\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            await pubsub.unsubscribe(channel_name)
            await pubsub.close()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
