from datetime import datetime
from decimal import Decimal
from typing import Literal
from pydantic import BaseModel, Field

class OrderLineIn(BaseModel):
    item_id: int
    quantity: int = Field(ge=1, le=50)
    option_ids: list[int] = []
    note: str | None = Field(default=None, max_length=200)

class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=1, max_length=120)
    customer_phone: str = Field(min_length=5, max_length=30)
    order_type: Literal["pickup", "delivery", "dine_in", "takeaway"]
    delivery_address: str | None = Field(default=None, max_length=300)
    notes: str | None = Field(default=None, max_length=500)
    payment_method: Literal["cash", "card"] = "cash"
    items: list[OrderLineIn] = Field(min_length=1, max_length=50)

class OrderAddonOut(BaseModel):
    name: str
    extra_price: Decimal
    model_config = {"from_attributes": True}

class OrderItemOut(BaseModel):
    name: str
    unit_price: Decimal
    quantity: int
    note: str | None
    line_total: Decimal
    addons: list[OrderAddonOut] = []
    model_config = {"from_attributes": True}

class OrderOut(BaseModel):
    public_id: str
    id: int
    customer_name: str
    customer_phone: str
    order_type: str
    status: str
    estimated_prep_minutes: int = 5
    prep_started_at: datetime | None = None
    ready_at: datetime | None = None
    payment_method: str
    payment_status: str
    subtotal: Decimal
    total: Decimal
    notes: str | None
    created_at: datetime
    items: list[OrderItemOut] = []
    model_config = {"from_attributes": True}

class OrderStatusUpdate(BaseModel):
    status: Literal["received", "preparing", "ready", "completed", "cancelled"]