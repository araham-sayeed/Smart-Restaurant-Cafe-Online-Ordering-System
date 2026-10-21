from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from app.api.deps import require_role
from app.db.session import get_db
from app.models.menu import Category, MenuItem, AddonGroup, AddonOption
from app.models.user import User
from app.schemas.menu import *

router = APIRouter(prefix="/admin/menu", tags=["admin-menu"])
admin_only = require_role("owner", "admin")

def get_owned(db: Session, model, obj_id: int, user: User):
    obj = db.get(model, obj_id)
    if not obj or obj.restaurant_id != user.restaurant_id:
        raise HTTPException(404, "Not found")   # 404, not 403: don't reveal other tenants' data
    return obj

# ---------- Categories ----------
@router.get("/categories", response_model=list[CategoryWithItems])
def list_categories(db: Session = Depends(get_db), user: User = Depends(admin_only)):
    stmt = (select(Category)
            .where(Category.restaurant_id == user.restaurant_id)
            .options(selectinload(Category.items)
                     .selectinload(MenuItem.addon_groups)
                     .selectinload(AddonGroup.options))
            .order_by(Category.sort_order, Category.id))
    return db.scalars(stmt).all()

@router.post("/categories", response_model=CategoryOut, status_code=201)
def create_category(data: CategoryIn, db: Session = Depends(get_db), user: User = Depends(admin_only)):
    cat = Category(**data.model_dump(), restaurant_id=user.restaurant_id)
    db.add(cat); db.commit(); db.refresh(cat)
    return cat

@router.put("/categories/{cat_id}", response_model=CategoryOut)
def update_category(cat_id: int, data: CategoryIn, db: Session = Depends(get_db), user: User = Depends(admin_only)):
    cat = get_owned(db, Category, cat_id, user)
    for k, v in data.model_dump().items():
        setattr(cat, k, v)
    db.commit(); db.refresh(cat)
    return cat

@router.delete("/categories/{cat_id}", status_code=204)
def delete_category(cat_id: int, db: Session = Depends(get_db), user: User = Depends(admin_only)):
    db.delete(get_owned(db, Category, cat_id, user)); db.commit()

# ---------- Items ----------
@router.post("/items", response_model=ItemOut, status_code=201)
def create_item(data: ItemIn, db: Session = Depends(get_db), user: User = Depends(admin_only)):
    get_owned(db, Category, data.category_id, user)   # category must be yours
    item = MenuItem(**data.model_dump(), restaurant_id=user.restaurant_id)
    db.add(item); db.commit(); db.refresh(item)
    return item

@router.put("/items/{item_id}", response_model=ItemOut)
def update_item(item_id: int, data: ItemIn, db: Session = Depends(get_db), user: User = Depends(admin_only)):
    item = get_owned(db, MenuItem, item_id, user)
    get_owned(db, Category, data.category_id, user)
    for k, v in data.model_dump().items():
        setattr(item, k, v)
    db.commit(); db.refresh(item)
    return item

@router.patch("/items/{item_id}/availability", response_model=ItemOut)
def set_availability(item_id: int, data: AvailabilityIn, db: Session = Depends(get_db), user: User = Depends(admin_only)):
    item = get_owned(db, MenuItem, item_id, user)
    item.is_available = data.is_available
    db.commit(); db.refresh(item)
    return item

@router.delete("/items/{item_id}", status_code=204)
def delete_item(item_id: int, db: Session = Depends(get_db), user: User = Depends(admin_only)):
    db.delete(get_owned(db, MenuItem, item_id, user)); db.commit()

# ---------- Add-on groups and options ----------
@router.post("/items/{item_id}/addon-groups", response_model=AddonGroupOut, status_code=201)
def create_group(item_id: int, data: AddonGroupIn, db: Session = Depends(get_db), user: User = Depends(admin_only)):
    get_owned(db, MenuItem, item_id, user)
    if data.min_select > data.max_select:
        raise HTTPException(400, "min_select cannot exceed max_select")
    group = AddonGroup(**data.model_dump(), item_id=item_id, restaurant_id=user.restaurant_id)
    db.add(group); db.commit(); db.refresh(group)
    return group

@router.delete("/addon-groups/{group_id}", status_code=204)
def delete_group(group_id: int, db: Session = Depends(get_db), user: User = Depends(admin_only)):
    db.delete(get_owned(db, AddonGroup, group_id, user)); db.commit()

@router.post("/addon-groups/{group_id}/options", response_model=AddonOptionOut, status_code=201)
def create_option(group_id: int, data: AddonOptionIn, db: Session = Depends(get_db), user: User = Depends(admin_only)):
    get_owned(db, AddonGroup, group_id, user)
    opt = AddonOption(**data.model_dump(), group_id=group_id, restaurant_id=user.restaurant_id)
    db.add(opt); db.commit(); db.refresh(opt)
    return opt

@router.put("/addon-options/{opt_id}", response_model=AddonOptionOut)
def update_option(opt_id: int, data: AddonOptionIn, db: Session = Depends(get_db), user: User = Depends(admin_only)):
    opt = get_owned(db, AddonOption, opt_id, user)
    for k, v in data.model_dump().items():
        setattr(opt, k, v)
    db.commit(); db.refresh(opt)
    return opt

@router.delete("/addon-options/{opt_id}", status_code=204)
def delete_option(opt_id: int, db: Session = Depends(get_db), user: User = Depends(admin_only)):
    db.delete(get_owned(db, AddonOption, opt_id, user)); db.commit()