import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload
from app.api.deps import get_current_user
from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token
from app.db.session import get_db
from app.models.restaurant import Restaurant
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserOut,
    OtpRequest,
    OtpRequestResponse,
    CustomerOtpRequest,
    CustomerVerifyOtpRequest,
)
from app.services.otp_service import issue_otp, verify_otp
from app.utils.identifiers import normalize_identifier, normalize_phone

router = APIRouter(prefix="/auth", tags=["auth"])

ADMIN_ROLES = {"admin", "owner"}


def find_user_by_identifier(db: Session, identifier: str) -> User | None:
    kind, normalized = normalize_identifier(identifier)
    if kind == "email":
        return db.scalar(select(User).where(User.email == normalized))
    return db.scalar(select(User).where(User.phone == normalized))


def otp_identifier_for_user(user: User) -> str:
    if user.email:
        return user.email.lower()
    if user.phone:
        return user.phone
    raise HTTPException(status.HTTP_400_BAD_REQUEST, "User has no login identifier")


def user_to_out(user: User) -> UserOut:
    slug = user.restaurant.slug if user.restaurant else ""
    return UserOut(
        id=user.id,
        email=user.email,
        phone=user.phone,
        full_name=user.full_name,
        role=user.role,
        restaurant_id=user.restaurant_id,
        restaurant_slug=slug,
    )


@router.post("/otp/request", response_model=OtpRequestResponse)
def request_otp(data: OtpRequest, db: Session = Depends(get_db)):
    kind, normalized = normalize_identifier(data.identifier)

    if data.purpose == "login":
        user = find_user_by_identifier(db, data.identifier)
        if not user:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Account not found")
        otp_id = otp_identifier_for_user(user)
    else:
        if kind == "phone":
            if db.scalar(select(User).where(User.phone == normalized)):
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "Phone already registered")
        else:
            if db.scalar(select(User).where(User.email == normalized)):
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")
        otp_id = normalized

    code = issue_otp(data.purpose, otp_id)
    dev_otp = code if settings.EXPOSE_DEV_OTP else None
    return OtpRequestResponse(dev_otp=dev_otp, phone=normalized)


@router.post("/customer/otp/request", response_model=OtpRequestResponse)
def customer_request_otp(data: CustomerOtpRequest, db: Session = Depends(get_db)):
    digits = normalize_phone(data.phone)
    code = issue_otp("customer_auth", digits)
    dev_otp = code if settings.EXPOSE_DEV_OTP else None
    return OtpRequestResponse(
        message="Verification code sent",
        phone=digits,
        dev_otp=dev_otp,
    )


@router.post("/customer/otp/verify", response_model=TokenResponse)
def customer_verify_otp(data: CustomerVerifyOtpRequest, db: Session = Depends(get_db)):
    digits = normalize_phone(data.phone)
    if not verify_otp("customer_auth", digits, data.otp_code):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired verification code")

    user = db.scalar(select(User).where(User.phone == digits))
    if not user:
        restaurant = db.scalar(select(Restaurant).order_by(Restaurant.id))
        if not restaurant:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Restaurant not configured")

        name = (data.full_name or "").strip() or f"Customer {digits[-4:]}"
        user = User(
            email=None,
            phone=digits,
            hashed_password=hash_password(secrets.token_hex(16)),
            full_name=name,
            role="customer",
            restaurant_id=restaurant.id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif data.full_name and data.full_name.strip() and user.full_name.startswith("Customer "):
        user.full_name = data.full_name.strip()
        db.commit()
        db.refresh(user)

    return TokenResponse(access_token=create_access_token(user.id, user.role, user.restaurant_id))


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    if not verify_otp("register", data.phone, data.otp_code):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired OTP")

    if db.scalar(select(User).where(User.phone == data.phone)):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Phone already registered")

    email = data.email.lower() if data.email else None
    if email and db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")

    restaurant = db.scalar(select(Restaurant).order_by(Restaurant.id))
    if not restaurant:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Restaurant not configured")

    user = User(
        email=email,
        phone=data.phone,
        hashed_password=hash_password(data.password),
        full_name=data.full_name.strip(),
        role="customer",
        restaurant_id=restaurant.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenResponse(access_token=create_access_token(user.id, user.role, user.restaurant_id))


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = find_user_by_identifier(db, data.identifier)
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect phone/email or password")

    otp_id = otp_identifier_for_user(user)
    if not verify_otp("login", otp_id, data.otp_code):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired OTP")

    return TokenResponse(access_token=create_access_token(user.id, user.role, user.restaurant_id))


@router.post("/login-form", response_model=TokenResponse, include_in_schema=False)
def login_form(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    return login(LoginRequest(identifier=form.username, password=form.password, otp_code="000000"), db)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    loaded = db.scalar(
        select(User)
        .where(User.id == user.id)
        .options(joinedload(User.restaurant))
    )
    return user_to_out(loaded or user)
