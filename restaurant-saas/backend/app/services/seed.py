import re
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.security import hash_password
from app.models.restaurant import Restaurant
from app.models.user import User

DEFAULT_ADMIN_EMAIL = "arham@gmail.com"
DEFAULT_ADMIN_PHONE = "0501111111"
DEFAULT_ADMIN_PASSWORD = "123456@"
DEFAULT_ADMIN_NAME = "Arham Admin"
DEFAULT_RESTAURANT_NAME = "Smart Restaurant & Cafe"

def _slugify(name: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "restaurant"
    return base

def ensure_default_restaurant(db: Session) -> Restaurant:
    restaurant = db.scalar(select(Restaurant).order_by(Restaurant.id))
    if restaurant:
        return restaurant
    slug = _slugify(DEFAULT_RESTAURANT_NAME)
    restaurant = Restaurant(name=DEFAULT_RESTAURANT_NAME, slug=slug)
    db.add(restaurant)
    db.flush()
    return restaurant

def ensure_default_admin(db: Session) -> User:
    restaurant = ensure_default_restaurant(db)
    admin = db.scalar(select(User).where(User.email == DEFAULT_ADMIN_EMAIL))
    if not admin:
        admin = db.scalar(select(User).where(User.phone == DEFAULT_ADMIN_PHONE))
    if not admin:
        admin = User(
            email=DEFAULT_ADMIN_EMAIL,
            phone=DEFAULT_ADMIN_PHONE,
            hashed_password=hash_password(DEFAULT_ADMIN_PASSWORD),
            full_name=DEFAULT_ADMIN_NAME,
            role="admin",
            restaurant_id=restaurant.id,
        )
        db.add(admin)
    else:
        admin.email = DEFAULT_ADMIN_EMAIL
        admin.phone = DEFAULT_ADMIN_PHONE
        admin.hashed_password = hash_password(DEFAULT_ADMIN_PASSWORD)
        admin.full_name = DEFAULT_ADMIN_NAME
        admin.role = "admin"
        admin.restaurant_id = restaurant.id
    db.commit()
    db.refresh(admin)
    return admin
