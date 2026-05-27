from datetime import datetime, timedelta, timezone
import random
import re

from fastapi import APIRouter, Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from auth import create_access_token, create_refresh_token, hash_password, verify_password, verify_token
from database import get_db
from models import MasterProfile, ReservedUsername, User
from schemas import (
    ForgotPasswordRequest,
    OtpSendRequest,
    OtpVerifyRequest,
    RefreshTokenRequest,
    ResetPasswordRequest,
    UserLogin,
    UserSignUp,
)

router = APIRouter()
security = HTTPBearer()
OTP_STORE = {}


def success_response(data, meta=None):
    return {"data": data, "meta": meta or {}, "error": None}


def error_response(code, message, details=None, status=400):
    raise HTTPException(
        status_code=status,
        detail={
            "data": None,
            "error": {
                "code": code,
                "message": message,
                "details": details or {},
            },
        },
    )


def validate_password_strength(password: str) -> None:
    if len(password) < 8:
        error_response(
            "PASSWORD_TOO_SHORT",
            "Password must be at least 8 characters long.",
            {"min_length": 8},
            status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    if not re.search(r"[A-Z]", password):
        error_response(
            "PASSWORD_MISSING_UPPERCASE",
            "Password must include at least one uppercase letter.",
            status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    if not re.search(r"[a-z]", password):
        error_response(
            "PASSWORD_MISSING_LOWERCASE",
            "Password must include at least one lowercase letter.",
            status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    if not re.search(r"\d", password):
        error_response(
            "PASSWORD_MISSING_NUMBER",
            "Password must include at least one number.",
            status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials

    try:
        payload = verify_token(token)
    except Exception as exc:
        error_response(
            "INVALID_TOKEN",
            "Authentication token is invalid or expired.",
            {"reason": str(exc)},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if payload.get("type") not in (None, "access"):
        error_response(
            "INVALID_TOKEN_TYPE",
            "Access token required.",
            {"token_type": payload.get("type")},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    user_id = payload.get("sub")
    if not user_id:
        error_response(
            "TOKEN_SUBJECT_MISSING",
            "Token subject is missing.",
            status=status.HTTP_401_UNAUTHORIZED,
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        error_response(
            "USER_NOT_FOUND",
            "Authenticated user could not be found.",
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # Throttled last_active_at stamp — update at most once per 5 minutes
    now = datetime.now(timezone.utc)
    if user.last_active_at is None or (now - user.last_active_at.replace(tzinfo=timezone.utc)).total_seconds() > 300:
        user.last_active_at = now
        try:
            db.commit()
        except Exception:
            db.rollback()

    return user


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: UserSignUp, db: Session = Depends(get_db)):
    existing_email = db.query(User).filter(User.email == payload.email).first()
    if existing_email:
        error_response(
            "EMAIL_TAKEN",
            "An account with this email already exists.",
            {"email": payload.email},
            status=status.HTTP_409_CONFLICT,
        )

    existing_username = db.query(User).filter(User.username == payload.username).first()
    if existing_username:
        error_response(
            "USERNAME_TAKEN",
            "This username is already in use.",
            {"username": payload.username},
            status=status.HTTP_409_CONFLICT,
        )

    reserved = (
        db.query(ReservedUsername)
        .filter(
            ReservedUsername.username == payload.username,
            ReservedUsername.reserved_until > datetime.now(timezone.utc),
        )
        .first()
    )
    if reserved:
        error_response(
            "USERNAME_RESERVED",
            "This username is temporarily unavailable.",
            {"username": payload.username},
            status=status.HTTP_409_CONFLICT,
        )

    validate_password_strength(payload.password)

    new_user = User(
        email=payload.email,
        username=payload.username,
        password_hash=hash_password(payload.password),
    )
    db.add(new_user)
    db.flush()

    master_profile = MasterProfile(
        user_id=new_user.id,
        username=payload.username,
    )
    db.add(master_profile)
    db.commit()
    db.refresh(new_user)

    return success_response(
        {
            "user_id": str(new_user.id),
            "username": new_user.username,
            "email": new_user.email,
            "message": "Account created. Check email for OTP.",
        }
    )


@router.post("/login")
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        error_response(
            "INVALID_CREDENTIALS",
            "Invalid email or password.",
            status=status.HTTP_401_UNAUTHORIZED,
        )

    token_payload = {"sub": str(user.id), "type": "access", "role": getattr(user, "role", "user")}
    access_token = create_access_token(token_payload, expires_delta=timedelta(minutes=15))
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return success_response(
        {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "username": user.username,
                "email": user.email,
                "role": getattr(user, "role", "user"),
            },
        }
    )


@router.post("/refresh")
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    try:
        token_data = verify_token(payload.refresh_token)
    except Exception as exc:
        error_response(
            "INVALID_REFRESH_TOKEN",
            "Refresh token is invalid or expired.",
            {"reason": str(exc)},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if token_data.get("type") != "refresh":
        error_response(
            "INVALID_TOKEN_TYPE",
            "Refresh token required.",
            {"token_type": token_data.get("type")},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    user_id = token_data.get("sub")
    if not user_id:
        error_response(
            "TOKEN_SUBJECT_MISSING",
            "Refresh token subject is missing.",
            status=status.HTTP_401_UNAUTHORIZED,
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        error_response(
            "USER_NOT_FOUND",
            "User for this refresh token no longer exists.",
            status=status.HTTP_401_UNAUTHORIZED,
        )

    access_token = create_access_token(
        {"sub": str(user.id), "type": "access", "role": getattr(user, "role", "user")},
        expires_delta=timedelta(minutes=15),
    )

    return success_response(
        {
            "access_token": access_token,
            "token_type": "bearer",
        }
    )


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    print(f"User logged out: {current_user.id}")
    return success_response({"message": "Logged out successfully"})


@router.post("/otp/send")
def send_otp(payload: OtpSendRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        error_response(
            "USER_NOT_FOUND",
            "No account exists for this email.",
            {"email": payload.email},
            status=status.HTTP_404_NOT_FOUND,
        )

    code = str(random.randint(100000, 999999))
    OTP_STORE[payload.email] = {
        "code": code,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
    }

    # TODO: add Redis rate limiting in Phase E
    print(f"OTP for {payload.email}: {code}")

    return success_response({"message": "OTP sent", "expires_in": 600})


@router.post("/otp/verify")
def verify_otp(payload: OtpVerifyRequest, db: Session = Depends(get_db)):
    otp_record = OTP_STORE.get(payload.email)
    if not otp_record:
        error_response(
            "OTP_NOT_FOUND",
            "OTP not found for this email.",
            {"email": payload.email},
        )

    if otp_record["expires_at"] < datetime.now(timezone.utc):
        OTP_STORE.pop(payload.email, None)
        error_response(
            "OTP_EXPIRED",
            "OTP code has expired.",
            {"email": payload.email},
        )

    if otp_record["code"] != payload.code:
        error_response(
            "OTP_INVALID",
            "OTP code is incorrect.",
            {"email": payload.email},
        )

    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        OTP_STORE.pop(payload.email, None)
        error_response(
            "USER_NOT_FOUND",
            "No account exists for this email.",
            {"email": payload.email},
            status=status.HTTP_404_NOT_FOUND,
        )

    # The current User model does not yet persist an email_verified column in Phase B.
    if hasattr(user, "email_verified"):
        user.email_verified = True

    db.commit()
    OTP_STORE.pop(payload.email, None)

    return success_response({"message": "Email verified", "verified": True})


@router.post("/password/forgot")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        print(f"Password reset requested for {payload.email}")

    return success_response(
        {"message": "If that email exists, a reset link has been sent."}
    )


@router.post("/password/reset")
def reset_password(payload: ResetPasswordRequest):
    validate_password_strength(payload.new_password)
    print(f"Password reset stub called with token: {payload.token}")
    return success_response({"message": "Password reset successfully"})
