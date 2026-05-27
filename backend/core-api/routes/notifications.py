"""
routes/notifications.py — User notification management.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from uuid import UUID
from datetime import datetime

from database import get_db
from models import User, Notification
from routes.auth import get_current_user, success_response, error_response

router = APIRouter()


# ─── LIST ────────────────────────────────────────────────────────────────────

@router.get("")
def list_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return last 50 notifications for the authenticated user, newest first."""
    try:
        notifications = db.query(Notification).filter(
            Notification.user_id == current_user.id
        ).order_by(desc(Notification.created_at)).limit(50).all()

        unread_count = sum(1 for n in notifications if not n.is_read)

        return success_response({
            "unread_count": unread_count,
            "items": [
                {
                    "id": str(n.id),
                    "type": n.type,
                    "title": n.title,
                    "body": n.body,
                    "link": n.link,
                    "is_read": n.is_read,
                    "created_at": n.created_at,
                }
                for n in notifications
            ],
        })
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── MARK SINGLE AS READ ──────────────────────────────────────────────────────

@router.post("/{notification_id}/read")
def mark_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        notif = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        ).first()

        if not notif:
            error_response("NOT_FOUND", "Notification not found.", status=404)

        if not notif.is_read:
            notif.is_read = True
            db.commit()

        return success_response({"id": str(notif.id), "is_read": True})
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── MARK ALL AS READ ─────────────────────────────────────────────────────────

@router.post("/read-all")
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        updated = db.query(Notification).filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False,
        ).update({"is_read": True})
        db.commit()
        return success_response({"marked_read": updated})
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)
