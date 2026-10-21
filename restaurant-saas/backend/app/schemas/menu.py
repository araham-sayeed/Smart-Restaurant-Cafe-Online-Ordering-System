from decimal import Decimal
from pydantic import BaseModel, Field

# ---------- Categories ----------
class CategoryIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    sort_order: int = 0

class CategoryOut(CategoryIn):
    id: int
    model_config = {"from_attributes": True}

# ---------- Items ----------
class ItemIn(BaseModel):
    category_id: int
    name: str = Field(min_length=1, max_length=120)
    description: str | None = None
    price: Decimal = Field(ge=0, max_digits=10, decimal_places=2)
    image_url: str | None = None
    is_available: bool = True
    sort_order: int = 0

class AvailabilityIn(BaseModel):
    is_available: bool

# ---------- Add-ons ----------
class AddonOptionIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    extra_price: Decimal = Field(default=0, ge=0)
    is_available: bool = True

class AddonOptionOut(AddonOptionIn):
    id: int
    model_config = {"from_attributes": True}

class AddonGroupIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    is_required: bool = False
    min_select: int = Field(default=0, ge=0)
    max_select: int = Field(default=1, ge=1)

class AddonGroupOut(AddonGroupIn):
    id: int
    options: list[AddonOptionOut] = []
    model_config = {"from_attributes": True}

# ---------- Full item / nested menu ----------
class ItemOut(BaseModel):
    id: int
    category_id: int
    name: str
    description: str | None
    price: Decimal
    image_url: str | None
    is_available: bool
    sort_order: int
    addon_groups: list[AddonGroupOut] = []
    model_config = {"from_attributes": True}

class CategoryWithItems(CategoryOut):
    items: list[ItemOut] = []