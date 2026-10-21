from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from app.db.session import get_db
from app.models.restaurant import Restaurant
from app.models.menu import Category, MenuItem, AddonGroup
from app.schemas.menu import CategoryWithItems
from pydantic import BaseModel

router = APIRouter(prefix="/public", tags=["public"])

class PublicMenu(BaseModel):
    restaurant_name: str
    slug: str
    categories: list[CategoryWithItems]

@router.get("/menu", response_model=PublicMenu)
@router.get("/{slug}/menu", response_model=PublicMenu)
def get_menu(slug: str | None = None, db: Session = Depends(get_db)):
    restaurant = None
    if slug:
        restaurant = db.scalar(select(Restaurant).where(Restaurant.slug == slug))

    # Single-restaurant fallback
    if not restaurant:
        restaurant = db.scalar(select(Restaurant).order_by(Restaurant.id))

    if not restaurant:
        raise HTTPException(404, "Restaurant not found")

    categories = db.scalars(
        select(Category)
        .where(Category.restaurant_id == restaurant.id)
        .options(selectinload(Category.items)
                 .selectinload(MenuItem.addon_groups)
                 .selectinload(AddonGroup.options))
        .order_by(Category.sort_order, Category.id)
    ).all()

    return PublicMenu(restaurant_name=restaurant.name, slug=restaurant.slug, categories=categories)