import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import String, Numeric, Integer, ForeignKey, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    # random public id so customers can't guess other people's order URLs
    public_id: Mapped[str] = mapped_column(String(32), unique=True, index=True,
                                           default=lambda: uuid.uuid4().hex)
    restaurant_id: Mapped[int] = mapped_column(ForeignKey("restaurants.id"), index=True)
    customer_name: Mapped[str] = mapped_column(String(120))
    customer_phone: Mapped[str] = mapped_column(String(30))
    order_type: Mapped[str] = mapped_column(String(20))            # pickup | delivery (dine_in in Phase 6)
    delivery_address: Mapped[str | None] = mapped_column(String(300), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="received")
    payment_method: Mapped[str] = mapped_column(String(20), default="cash")
    payment_status: Mapped[str] = mapped_column(String(20), default="unpaid")
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    menu_item_id: Mapped[int | None] = mapped_column(ForeignKey("menu_items.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(120))                 # snapshot
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2))    # snapshot, base price
    quantity: Mapped[int] = mapped_column(Integer)
    note: Mapped[str | None] = mapped_column(String(200), nullable=True)
    line_total: Mapped[Decimal] = mapped_column(Numeric(10, 2))

    order = relationship("Order", back_populates="items")
    addons = relationship("OrderItemAddon", back_populates="order_item", cascade="all, delete-orphan")

class OrderItemAddon(Base):
    __tablename__ = "order_item_addons"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_item_id: Mapped[int] = mapped_column(ForeignKey("order_items.id"), index=True)
    option_id: Mapped[int | None] = mapped_column(ForeignKey("addon_options.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(100))                 # snapshot
    extra_price: Mapped[Decimal] = mapped_column(Numeric(10, 2))   # snapshot

    order_item = relationship("OrderItem", back_populates="addons")