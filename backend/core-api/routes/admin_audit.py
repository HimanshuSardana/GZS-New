"""
admin_audit.py — Admin audit log read endpoints + shared write helper.

log_admin_action() is imported by every other admin route file to write audit entries.
It must never raise — failures are logged as warnings and swallowed.
"""
import logging
from typing import Optional
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db
from models import AdminAuditLog, User
from routes.auth import success_response
from auth_admin import require_admin, require_super_admin

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Shared write helper ──────────────────────────────────────────────────────

def log_admin_action(
    db: Session,
    actor: User,
    action: str,
    target_type: Optional[str] = None,
    target_id: Optional[UUID] = None,
    details: Optional[dict] = None,
    reason: Optional[str] = None,
) -> None:
    """
    Write an immutable audit entry to admin_audit_log.

    Silently swallows all exceptions — an audit write failure must never
    roll back or crash the parent transaction.
    """
    try:
        merged_details = dict(details) if details else {}
        if reason:
            merged_details["reason"] = reason

        entry = AdminAuditLog(
            admin_user_id=actor.id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=merged_details,
        )
        db.add(entry)
        db.commit()
    except Exception as exc:
        logger.warning(f"[audit] Failed to write audit log for action '{action}': {exc}")
        try:
            db.rollback()
        except Exception:
            pass


# ── Read endpoints ────────────────────────────────────────────────────────────

@router.get("/audit")
def get_audit_logs(
    actor: Optional[str] = Query(None, description="Filter by admin username"),
    action: Optional[str] = Query(None, description="Prefix match: 'user' matches 'user.suspend', 'user.ban'"),
    target_type: Optional[str] = Query(None, description="user / skill / tournament / blog / game"),
    date_from: Optional[str] = Query(None, description="ISO datetime, e.g. 2026-05-01T00:00:00Z"),
    date_to: Optional[str] = Query(None, description="ISO datetime, e.g. 2026-05-31T23:59:59Z"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Paginated audit log. Accessible by admin and super_admin."""
    query = db.query(AdminAuditLog).order_by(desc(AdminAuditLog.created_at))

    if target_type:
        query = query.filter(AdminAuditLog.target_type == target_type)
    if action:
        query = query.filter(AdminAuditLog.action.ilike(f"{action}%"))
    if date_from:
        try:
            query = query.filter(
                AdminAuditLog.created_at >= datetime.fromisoformat(date_from.replace("Z", "+00:00"))
            )
        except ValueError:
            pass
    if date_to:
        try:
            query = query.filter(
                AdminAuditLog.created_at <= datetime.fromisoformat(date_to.replace("Z", "+00:00"))
            )
        except ValueError:
            pass
    if actor:
        query = query.join(User, AdminAuditLog.admin_user_id == User.id).filter(
            User.username.ilike(f"%{actor}%")
        )

    total = query.count()
    logs = query.offset((page - 1) * page_size).limit(page_size).all()

    return success_response({
        "logs": [
            {
                "id": str(log.id),
                "admin_user_id": str(log.admin_user_id),
                "action": log.action,
                "target_type": log.target_type,
                "target_id": str(log.target_id) if log.target_id else None,
                "details": log.details or {},
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in logs
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    })


@router.get("/audit/super")
def get_super_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin),
):
    """Super-admin-only view of audit entries where the actor had role='super_admin'."""
    query = (
        db.query(AdminAuditLog)
        .join(User, AdminAuditLog.admin_user_id == User.id)
        .filter(User.role == "super_admin")
        .order_by(desc(AdminAuditLog.created_at))
    )

    total = query.count()
    logs = query.offset((page - 1) * page_size).limit(page_size).all()

    return success_response({
        "logs": [
            {
                "id": str(log.id),
                "admin_user_id": str(log.admin_user_id),
                "action": log.action,
                "target_type": log.target_type,
                "target_id": str(log.target_id) if log.target_id else None,
                "details": log.details or {},
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in logs
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    })
