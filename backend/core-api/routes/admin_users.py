"""
admin_users.py — Admin endpoints for user management.

Endpoints:
    GET    /admin/users                     Paginated list (masked email)
    GET    /admin/users/{user_id}           Full user detail
    POST   /admin/users/{user_id}/suspend   Suspend (admin+)
    POST   /admin/users/{user_id}/ban       Permanent ban (super_admin only)
    POST   /admin/users/{user_id}/unban     Lift ban (super_admin only)
    POST   /admin/users/{user_id}/notify    Send in-app notification (admin+)
    DELETE /admin/users/{user_id}/soft      Anonymise / soft-delete (admin+)
"""
import logging
from typing import Optional
from uuid import UUID
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, validator
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from database import get_db
from models import (
    User, MasterProfile, SubProfile, UserSkill,
    UserViolation, Notification, VerificationQueue,
)
from routes.auth import success_response, error_response
from auth_admin import require_admin, require_super_admin
from routes.admin_audit import log_admin_action

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Request schemas ──────────────────────────────────────────────────────────

class SuspendRequest(BaseModel):
    duration: str  # "1d", "3d", "7d", "30d", or ISO date string
    reason: str

    @validator("reason")
    def reason_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("reason is required and cannot be empty")
        return v.strip()

    @validator("duration")
    def duration_valid(cls, v):
        valid = {"1d", "3d", "7d", "30d"}
        if v not in valid:
            try:
                datetime.fromisoformat(v)
            except ValueError:
                raise ValueError(f"duration must be one of {valid} or an ISO date string")
        return v


class BanRequest(BaseModel):
    reason: str

    @validator("reason")
    def reason_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("reason is required")
        return v.strip()


class NotifyRequest(BaseModel):
    message: str
    send_email: bool = False

    @validator("message")
    def message_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("message is required")
        return v.strip()


# ── Helpers ──────────────────────────────────────────────────────────────────

def _mask_email(email: str) -> str:
    try:
        local, domain = email.split("@", 1)
        return f"{local[0]}***@{domain}"
    except Exception:
        return "***@***.***"


def _parse_suspension_expiry(duration: str) -> datetime:
    now = datetime.now(timezone.utc)
    mapping = {"1d": 1, "3d": 3, "7d": 7, "30d": 30}
    if duration in mapping:
        return now + timedelta(days=mapping[duration])
    dt = datetime.fromisoformat(duration)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/users")
def list_users(
    search: Optional[str] = Query(None),
    account_status: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    platform_level: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Paginated user list. Emails are masked. Joins MasterProfile for level and trust score."""
    query = db.query(User, MasterProfile).outerjoin(
        MasterProfile, User.id == MasterProfile.user_id
    )

    if search:
        s = f"%{search.lower()}%"
        query = query.filter(or_(User.username.ilike(s), User.email.ilike(s)))
    if account_status:
        query = query.filter(User.account_status == account_status)
    if role:
        query = query.filter(User.role == role)
    if platform_level:
        query = query.filter(MasterProfile.platform_level == platform_level)

    total = query.count()
    rows = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return success_response({
        "users": [
            {
                "id": str(u.id),
                "username": u.username,
                "email_masked": _mask_email(u.email),
                "role": getattr(u, "role", "user"),
                "account_status": getattr(u, "account_status", "active"),
                "platform_level": m.platform_level if m else None,
                "trust_score": float(m.trust_score) if m else None,
                "avatar_url": m.avatar_url if m else None,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "last_active_at": u.last_active_at.isoformat() if u.last_active_at else None,
            }
            for u, m in rows
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    })


@router.get("/users/{user_id}")
def get_user_detail(
    user_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Full user detail including sub-profiles with skill counts, recent violations."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return error_response("USER_NOT_FOUND", "User not found.", status=404)

    master = db.query(MasterProfile).filter(MasterProfile.user_id == user_id).first()
    sub_profiles = db.query(SubProfile).filter(SubProfile.user_id == user_id).all()
    violations = (
        db.query(UserViolation)
        .filter(UserViolation.user_id == user_id)
        .order_by(UserViolation.created_at.desc())
        .limit(10)
        .all()
    )

    sub_profiles_data = []
    for sp in sub_profiles:
        total_skills = db.query(func.count(UserSkill.id)).filter(
            UserSkill.sub_profile_id == sp.id
        ).scalar() or 0
        verified_skills = db.query(func.count(UserSkill.id)).filter(
            UserSkill.sub_profile_id == sp.id, UserSkill.is_verified == True
        ).scalar() or 0
        sub_profiles_data.append({
            "id": str(sp.id),
            "domain": sp.domain,
            "username": sp.username,
            "primary_role": sp.primary_role,
            "experience_level": sp.experience_level,
            "status": sp.status,
            "total_skills": total_skills,
            "verified_skills": verified_skills,
            "created_at": sp.created_at.isoformat() if sp.created_at else None,
        })

    return success_response({
        "user": {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "role": getattr(user, "role", "user"),
            "account_status": getattr(user, "account_status", "active"),
            "suspended_until": (
                getattr(user, "suspended_until", None).isoformat()
                if getattr(user, "suspended_until", None) else None
            ),
            "is_anonymised": getattr(user, "is_anonymised", False),
            "gzs_coins": user.gzs_coins,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_active_at": user.last_active_at.isoformat() if user.last_active_at else None,
        },
        "master_profile": {
            "platform_level": master.platform_level if master else None,
            "trust_score": float(master.trust_score) if master else None,
            "verified_checkmark": master.verified_checkmark if master else False,
            "avatar_url": master.avatar_url if master else None,
            "real_name": master.real_name if master else None,
            "location": master.location if master else None,
            "xp_total": master.xp_total if master else 0,
        } if master else None,
        "sub_profiles": sub_profiles_data,
        "violations": [
            {
                "id": str(v.id),
                "violation_type": v.violation_type,
                "duration_days": v.duration_days,
                "reason": v.reason,
                "expires_at": v.expires_at.isoformat() if v.expires_at else None,
                "created_at": v.created_at.isoformat() if v.created_at else None,
            }
            for v in violations
        ],
        "active_sessions": [],  # TODO: query Redis keys core:session:{user_id}:*
    })


@router.post("/users/{user_id}/suspend")
def suspend_user(
    user_id: UUID,
    payload: SuspendRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Suspend a user for a defined duration. Creates UserViolation + audit log entry."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return error_response("USER_NOT_FOUND", "User not found.", status=404)
    if getattr(user, "account_status", "active") == "banned":
        return error_response("USER_BANNED", "Cannot suspend a banned user.", status=409)

    expires_at = _parse_suspension_expiry(payload.duration)
    duration_days = (expires_at - datetime.now(timezone.utc)).days + 1
    before_status = getattr(user, "account_status", "active")

    violation = UserViolation(
        user_id=user_id,
        violation_type="suspend",
        duration_days=duration_days,
        reason=payload.reason,
        given_by_admin_id=admin.id,
        expires_at=expires_at,
    )
    db.add(violation)
    user.account_status = "suspended"
    user.suspended_until = expires_at
    db.commit()

    log_admin_action(
        db, admin, "user.suspend",
        target_type="user", target_id=user_id,
        details={
            "before": {"account_status": before_status},
            "after": {"account_status": "suspended", "suspended_until": expires_at.isoformat()},
        },
        reason=payload.reason,
    )
    return success_response({
        "user_id": str(user_id),
        "suspended_until": expires_at.isoformat(),
        "duration_days": duration_days,
    })


@router.post("/users/{user_id}/ban")
def ban_user(
    user_id: UUID,
    payload: BanRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin),
):
    """Permanently ban a user. Super admin only."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return error_response("USER_NOT_FOUND", "User not found.", status=404)

    before_status = getattr(user, "account_status", "active")
    violation = UserViolation(
        user_id=user_id, violation_type="ban", duration_days=None,
        reason=payload.reason, given_by_admin_id=admin.id, expires_at=None,
    )
    db.add(violation)
    user.account_status = "banned"
    user.suspended_until = None
    db.commit()

    log_admin_action(
        db, admin, "user.ban",
        target_type="user", target_id=user_id,
        details={"before": {"account_status": before_status}, "after": {"account_status": "banned"}},
        reason=payload.reason,
    )
    return success_response({"user_id": str(user_id), "banned": True})


@router.post("/users/{user_id}/unban")
def unban_user(
    user_id: UUID,
    payload: BanRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin),
):
    """Lift a ban and restore the account to active. Super admin only."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return error_response("USER_NOT_FOUND", "User not found.", status=404)

    before_status = getattr(user, "account_status", "active")
    user.account_status = "active"
    user.suspended_until = None
    db.commit()

    log_admin_action(
        db, admin, "user.unban",
        target_type="user", target_id=user_id,
        details={"before": {"account_status": before_status}, "after": {"account_status": "active"}},
        reason=payload.reason,
    )
    return success_response({"user_id": str(user_id), "restored_to": "active"})


@router.post("/users/{user_id}/notify")
def notify_user(
    user_id: UUID,
    payload: NotifyRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Send a platform in-app notification to a user. Creates a Notification record."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return error_response("USER_NOT_FOUND", "User not found.", status=404)

    notification = Notification(
        user_id=user_id,
        type="admin_message",
        title="Message from GzoneSphere Team",
        body=payload.message,
        link=None,
        is_read=False,
    )
    db.add(notification)
    db.commit()

    log_admin_action(
        db, admin, "user.notify",
        target_type="user", target_id=user_id,
        details={"message_preview": payload.message[:100], "send_email": payload.send_email},
    )
    return success_response({
        "notification_id": str(notification.id),
        "send_email_queued": False,  # TODO: Celery email task when send_email=True
    })


@router.delete("/users/{user_id}/soft")
def soft_delete_user(
    user_id: UUID,
    payload: BanRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Soft-delete (anonymise) a user account.
    Replaces PII with anonymised values. Account recoverable by super_admin within 30 days.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return error_response("USER_NOT_FOUND", "User not found.", status=404)
    if getattr(user, "is_anonymised", False):
        return error_response("ALREADY_DELETED", "Account already anonymised.", status=409)

    uid_prefix = str(user_id).replace("-", "")[:8]
    original_username = user.username
    original_email = user.email

    user.email = f"deleted_{uid_prefix}@gzs.invalid"
    user.username = f"deleted_{uid_prefix}"
    user.account_status = "deleted"
    user.is_anonymised = True

    master = db.query(MasterProfile).filter(MasterProfile.user_id == user_id).first()
    if master:
        master.username = f"deleted_{uid_prefix}"
        master.real_name = None
        master.bio = None
        master.avatar_url = None
        master.banner_url = None
        master.location = None

    db.commit()

    log_admin_action(
        db, admin, "user.soft_delete",
        target_type="user", target_id=user_id,
        details={
            "before": {"username": original_username, "email": original_email},
            "after": {"username": user.username, "email": user.email, "is_anonymised": True},
            "recovery_window_days": 30,
        },
        reason=payload.reason,
    )
    return success_response({"user_id": str(user_id), "anonymised": True, "recovery_window_days": 30})
