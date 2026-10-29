import asyncio
import json
import logging
from fastapi import APIRouter, Depends, HTTPException, Header, Query, status
from fastapi.responses import StreamingResponse
from jose import jwt, JWTError
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from app.api.deps import get_current_user
from app.core.config import settings
from app.core.redis_client import get_async_redis
from app.db.session import get_db
from app.models.order import Order, OrderItem
from app.models.user import User
from app.schemas.order import OrderOut, OrderStatusUpdate
from app.services.order_service import update_order_status

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/kitchen", tags=["kitchen"])

def staff_only(user: User = Depends(get_current_user)) -> User:
    if user.role not in {"admin", "owner", "staff"}:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Kitchen access required")
    return user

def get_stream_user(
    token: str | None = Query(default=None),
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    raw_token = token
    if not raw_token and authorization and authorization.startswith("Bearer "):
        raw_token = authorization.split(" ")[1]

    if not raw_token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing authentication token")

    try:
        payload = jwt.decode(raw_token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid authentication token")

    user = db.get(User, user_id)
    if not user or user.role not in {"admin", "owner", "staff"}:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Kitchen access required")
    return user

@router.get("/orders", response_model=list[OrderOut])
def get_kitchen_orders(
    include_completed: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(staff_only),
):
    query = (
        select(Order)
        .where(Order.restaurant_id == user.restaurant_id)
        .options(selectinload(Order.items).selectinload(OrderItem.addons))
        .order_by(Order.created_at.asc())
    )
    if not include_completed:
        query = query.where(Order.status.in_(["received", "preparing", "ready"]))

    return db.scalars(query).all()

@router.patch("/orders/{order_id}/status", response_model=OrderOut)
def patch_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(staff_only),
):
    return update_order_status(db, order_id, data.status, user)

@router.get("/stream")
async def kitchen_stream(user: User = Depends(get_stream_user)):
    """SSE endpoint streaming live order events to kitchen staff."""
    channel_name = f"restaurant:{user.restaurant_id}:orders"

    async def event_generator():
        redis = get_async_redis()
        pubsub = redis.pubsub()
        await pubsub.subscribe(channel_name)
        yield "data: {\"event\": \"connected\", \"channel\": \"" + channel_name + "\"}\n\n"

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
