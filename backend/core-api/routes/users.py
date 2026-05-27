from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import MasterProfile, ReservedUsername, User
from routes.auth import error_response, get_current_user, success_response

router = APIRouter()


@router.get("/me")
def get_user_me(current_user: User = Depends(get_current_user)):
    return success_response({
        "id": str(current_user.id),
        "email": current_user.email,
        "username": current_user.username,
        "created_at": current_user.created_at,
        "role": getattr(current_user, "role", "user"),
    })


@router.patch("/me")
def update_user_me(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        if "username" in payload:
            new_username = payload["username"]
            if new_username != current_user.username:
                # Check availability
                existing = db.query(User).filter(User.username == new_username).first()
                if existing:
                    error_response("USERNAME_TAKEN", "This username is already in use.", status=409)

                reserved = (
                    db.query(ReservedUsername)
                    .filter(
                        ReservedUsername.username == new_username,
                        ReservedUsername.reserved_until > datetime.now(timezone.utc),
                    )
                    .first()
                )
                if reserved:
                    error_response(
                        "USERNAME_RESERVED",
                        "This username is temporarily unavailable.",
                        status=409,
                    )

                master = (
                    db.query(MasterProfile)
                    .filter(MasterProfile.user_id == current_user.id)
                    .first()
                )

                # 30-day lock
                if master and master.username_changed_at is not None:
                    changed_at = master.username_changed_at
                    if changed_at.tzinfo is None:
                        changed_at = changed_at.replace(tzinfo=timezone.utc)
                    days_since = (datetime.now(timezone.utc) - changed_at).days
                    if days_since < 30:
                        error_response(
                            "USERNAME_CHANGE_LOCKED",
                            f"Username can be changed again in {30 - days_since} days.",
                            status=409,
                        )

                # Coin cost (first change is free)
                has_changed_before = master and master.username_changed_at is not None
                if has_changed_before:
                    if (current_user.gzs_coins or 0) < 500:
                        error_response(
                            "INSUFFICIENT_COINS",
                            "Username change costs 500 GZS Coins.",
                            status=402,
                        )
                    current_user.gzs_coins = (current_user.gzs_coins or 0) - 500

                # Reserve the old username for 14 days
                old_username = current_user.username
                if not db.query(ReservedUsername).filter(ReservedUsername.username == old_username).first():
                    db.add(ReservedUsername(
                        username=old_username,
                        reserved_by_user_id=current_user.id,
                        reserved_until=datetime.now(timezone.utc) + timedelta(days=14),
                    ))

                current_user.username = new_username
                if master:
                    master.username = new_username
                    master.username_changed_at = datetime.now(timezone.utc)

        if "email" in payload:
            new_email = payload["email"]
            if new_email != current_user.email:
                existing = db.query(User).filter(User.email == new_email).first()
                if existing:
                    error_response("EMAIL_TAKEN", "An account with this email already exists.", status=409)
                current_user.email = new_email

        db.commit()
        db.refresh(current_user)

        return success_response({
            "username": current_user.username,
            "email": current_user.email,
            "updated_at": current_user.updated_at,
        })
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        error_response("DB_ERROR", "Database service unavailable.", {"details": str(e)}, status=503)
