from pydantic import BaseModel, EmailStr, Field, field_validator
from app.utils.identifiers import normalize_phone

class OtpRequest(BaseModel):
    identifier: str = Field(min_length=3, max_length=255)
    purpose: str = Field(pattern="^(login|register)$")

class OtpRequestResponse(BaseModel):
    message: str = "OTP sent"
    dev_otp: str | None = None

class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=120)
    phone: str = Field(min_length=5, max_length=30)
    password: str = Field(min_length=6, max_length=128)
    email: EmailStr | None = None
    otp_code: str = Field(min_length=4, max_length=8)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        digits = normalize_phone(v)
        if len(digits) < 5:
            raise ValueError("Invalid phone number")
        return digits

class LoginRequest(BaseModel):
    identifier: str = Field(min_length=3, max_length=255)
    password: str
    otp_code: str = Field(min_length=4, max_length=8)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    id: int
    email: EmailStr | None = None
    phone: str | None = None
    full_name: str
    role: str
    restaurant_id: int
    restaurant_slug: str

    model_config = {"from_attributes": True}
