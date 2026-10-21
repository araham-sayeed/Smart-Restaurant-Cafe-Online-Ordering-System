from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "admin"  # "admin" | "customer"
    restaurant_name: str | None = None  # Optional for backwards compatibility

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    restaurant_id: int

    model_config = {"from_attributes": True}