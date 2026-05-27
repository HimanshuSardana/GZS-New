"""
admin_dashboard.py — Dashboard stat, queue-count, and health endpoints.

All queries are wrapped in try/except with 0/null fallbacks.
Tables not yet built (disputes, escrow, jobs) return 0 silently.
The dashboard always loads even during incremental backend development.
"""
import time
import logging
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from database import get_db
from models import User, Tournament, VerificationQueue, ModerationQueue, Event
from routes.auth import success_response
from auth_admin import require_admin

logger = logging.getLogger(__name__)
router = APIRouter()


def _safe(fn, fallback=0):
    """Execute fn(), return fallback on any exception."""
    try:
        result = fn()
        return result if result is not None else fallback
    except Exception as exc:
        logger.debug(f"[dashboard] safe query failed: {exc}")
        return fallback


@router.get("/dashboard/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Platform-wide stat counters for the dashboard hero row."""
    today = date.today()
    yesterday = today - timedelta(days=1)

    signups_today = _safe(lambda: db.query(func.count(User.id)).filter(
        func.date(User.created_at) == today
    ).scalar())

    signups_yesterday = _safe(lambda: db.query(func.count(User.id)).filter(
        func.date(User.created_at) == yesterday
    ).scalar())

    active_tournaments = _safe(lambda: db.query(func.count(Tournament.id)).filter(
        Tournament.status == "live"
    ).scalar())

    pending_verifications = _safe(lambda: db.query(func.count(VerificationQueue.id)).filter(
        VerificationQueue.status == "pending"
    ).scalar())

    flagged_community = _safe(lambda: db.query(func.count(ModerationQueue.id)).filter(
        ModerationQueue.status == "pending"
    ).scalar())

    return success_response({
        "online_now": 0,                                          # TODO: Redis SCARD core:online:* keys
        "signups_today": signups_today,
        "signups_yesterday": signups_yesterday,
        "active_tournaments": active_tournaments,
        "moderation_queue": pending_verifications + flagged_community,
        "open_disputes": 0,                                       # TODO: disputes table (Phase 2)
        "escrow_held_inr": 0,                                     # TODO: escrow table (Phase 2)
        "_meta": {
            "pending_skill_verifications": pending_verifications,
            "flagged_community_content": flagged_community,
        },
    })


@router.get("/dashboard/queues")
def get_dashboard_queues(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Queue counts for the 5 action-queue widgets on the dashboard."""
    skill_verifications_count = _safe(lambda: db.query(func.count(VerificationQueue.id)).filter(
        VerificationQueue.status == "pending"
    ).scalar())

    pending_verifications_list = _safe(lambda: [
        {
            "id": str(vq.id),
            "user_skill_id": str(vq.user_skill_id),
            "submitted_at": vq.submitted_at.isoformat() if vq.submitted_at else None,
            "status": vq.status,
        }
        for vq in db.query(VerificationQueue)
        .filter(VerificationQueue.status == "pending")
        .order_by(VerificationQueue.submitted_at.asc())
        .limit(5)
        .all()
    ], fallback=[])

    flagged_messages_count = _safe(lambda: db.query(func.count(ModerationQueue.id)).filter(
        ModerationQueue.status == "pending",
        ModerationQueue.ai_confidence_score >= 0.85,
    ).scalar())

    pending_events_count = _safe(lambda: db.query(func.count(Event.id)).filter(
        Event.status == "pending_approval"
    ).scalar())

    return success_response({
        "skill_verifications": skill_verifications_count,
        "skill_verifications_list": pending_verifications_list,
        "job_listings": 0,       # TODO: Phase 2 Jobs module
        "job_listings_list": [], # TODO: Phase 2 Jobs module
        "disputes": 0,           # TODO: Phase 2 Jobs module
        "disputes_list": [],     # TODO: Phase 2 Jobs module
        "flagged_messages": flagged_messages_count,
        "pending_events": pending_events_count,
    })


@router.get("/dashboard/health")
def get_dashboard_health(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Connectivity and latency check for each platform service."""
    pg_start = time.monotonic()
    try:
        db.execute(text("SELECT 1"))
        pg_latency_ms = round((time.monotonic() - pg_start) * 1000, 2)
        pg_status = "healthy" if pg_latency_ms < 200 else "degraded"
    except Exception as exc:
        pg_latency_ms = None
        pg_status = "unreachable"
        logger.error(f"[health] PostgreSQL check failed: {exc}")

    return success_response({
        "postgresql":        {"status": pg_status,         "latency_ms": pg_latency_ms},
        "mongodb":           {"status": "unconfigured",    "latency_ms": None},
        "redis":             {"status": "unconfigured",    "latency_ms": None},
        "celery":            {"status": "unconfigured",    "pending_tasks": None},
        "razorpay_webhook":  {"status": "unconfigured",    "last_received_minutes_ago": None},
        "cloudflare_r2":     {"status": "unconfigured",    "last_upload_minutes_ago": None},
    })
