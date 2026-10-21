from decimal import Decimal
from sqlalchemy import String, Numeric, Boolean, Integer, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    restaurant_id: Mapped[int] = mapped_column(ForeignKey("restaurants.id"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    items = relationship("MenuItem", back_populates="category", cascade="all, delete-orphan",
                         order_by="MenuItem.sort_order")

class MenuItem(Base):
    __tablename__ = "menu_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    restaurant_id: Mapped[int] = mapped_column(ForeignKey("restaurants.id"), index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    category = relationship("Category", back_populates="items")
    addon_groups = relationship("AddonGroup", back_populates="item", cascade="all, delete-orphan")

class AddonGroup(Base):
    """e.g. 'Milk choice' (required, pick 1) or 'Extras' (optional, pick up to 3)"""
    __tablename__ = "addon_groups"

    id: Mapped[int] = mapped_column(primary_key=True)
    restaurant_id: Mapped[int] = mapped_column(ForeignKey("restaurants.id"), index=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("menu_items.id"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    is_required: Mapped[bool] = mapped_column(Boolean, default=False)
    min_select: Mapped[int] = mapped_column(Integer, default=0)
    max_select: Mapped[int] = mapped_column(Integer, default=1)

    item = relationship("MenuItem", back_populates="addon_groups")
    options = relationship("AddonOption", back_populates="group", cascade="all, delete-orphan")

class AddonOption(Base):
    __tablename__ = "addon_options"

    id: Mapped[int] = mapped_column(primary_key=True)
    restaurant_id: Mapped[int] = mapped_column(ForeignKey("restaurants.id"), index=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("addon_groups.id"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    extra_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)

    group = relationship("AddonGroup", back_populates="options")