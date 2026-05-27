"""
admin_verifications.py — Admin endpoints for the skill verification queue.

Uses the existing VerificationQueue and UserSkill models from models.py.
"""
import logging
from typing import Optional
from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, validator
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import User, UserSkill, VerificationQueue, SubProfile, SkillsTaxonomy
from routes.auth import success_response, error_response
from auth_admin import require_admin
from routes.admin_audit import log_admin_action

logger = logging.getLogger(__name__)
router = APIRouter()


class VerificationActionRequest(BaseModel):
    action: str           # "approve", "reject", "request_info"
    reason: Optional[str] = None
    notes: Optional[str] = None

    @validator("action")
    def action_must_be_valid(cls, v):
        if v not in {"approve", "reject", "request_info"}:
            raise ValueError("action must be: approve, reject, or request_info")
        return v

    @validator("reason", always=True)
    def reason_required_for_reject(cls, v, values):
        action = values.get("action")
        if action in ("reject", "request_info") and (not v or not v.strip()):
            raise ValueError(f"reason is required when action is '{action}'")
        return v.strip() if v else v


def _build_row(vq: VerificationQueue, db: Session) -> dict:
    skill = db.query(UserSkill).filter(UserSkill.id == vq.user_skill_id).first()
    user = db.query(User).filter(User.id == skill.user_id).first() if skill else None
    sp = db.query(SubProfile).filter(SubProfile.id == skill.sub_profile_id).first() if skill else None
    skill_tax = db.query(SkillsTaxonomy).filter(SkillsTaxonomy.id == skill.skill_id).first() if skill else None

    return {
        "id": str(vq.id),
        "status": vq.status,
        "submitted_at": vq.submitted_at.isoformat() if vq.submitted_at else None,
        "reviewed_at": vq.reviewed_at.isoformat() if vq.reviewed_at else None,
        "reviewer_notes": vq.reviewer_notes,
        "user_skill_id": str(vq.user_skill_id),
        "skill": {
            "id": str(skill.id),
            "name": skill_tax.name if skill_tax else None,
            "category": skill_tax.category if skill_tax else None,
            "is_verified": skill.is_verified,
            "verification_method": skill.verification_method,
            "verification_proof_url": skill.verification_proof_url,
            "verification_proof_text": skill.verification_proof_text,
        } if skill else None,
        "user": {"id": str(user.id), "username": user.username} if user else None,
        "sub_profile": {
            "id": str(sp.id), "domain": sp.domain, "username": sp.username
        } if sp else None,
    }


@router.get("/verifications")
def list_verifications(
    status_filter: Optional[str] = Query("pending", alias="status"),
    domain: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Paginated verification queue. Default: pending, oldest-first."""
    query = (
        db.query(VerificationQueue)
        .filter(VerificationQueue.status == (status_filter or "pending"))
        .order_by(VerificationQueue.submitted_at.asc())
    )
    if domain:
        query = (
            query.join(UserSkill, VerificationQueue.user_skill_id == UserSkill.id)
            .join(SubProfile, UserSkill.sub_profile_id == SubProfile.id)
            .filter(SubProfile.domain == domain)
        )

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return success_response({
        "verifications": [_build_row(vq, db) for vq in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    })


@router.get("/verifications/{verification_id}")
def get_verification_detail(
    verification_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    vq = db.query(VerificationQueue).filter(VerificationQueue.id == verification_id).first()
    if not vq:
        return error_response("NOT_FOUND", "Verification queue item not found.", status=404)
    return success_response(_build_row(vq, db))


@router.patch("/verifications/{verification_id}")
def action_verification(
    verification_id: UUID,
    payload: VerificationActionRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Process a skill verification request.
    approve     → sets status='approved', UserSkill.is_verified=True
    reject      → sets status='rejected', requires reason
    request_info → sets status='requesting_more_info', requires reason
    """
    vq = db.query(VerificationQueue).filter(VerificationQueue.id == verification_id).first()
    if not vq:
        return error_response("NOT_FOUND", "Verification queue item not found.", status=404)
    if vq.status not in ("pending", "requesting_more_info"):
        return error_response(
            "INVALID_STATE",
            f"Cannot action a verification with status '{vq.status}'.",
            status=409,
        )

    skill = db.query(UserSkill).filter(UserSkill.id == vq.user_skill_id).first()
    now = datetime.now(timezone.utc)
    before_status = vq.status

    vq.reviewed_by_user_id = admin.id
    vq.reviewed_at = now
    if payload.notes:
        vq.reviewer_notes = payload.notes

    if payload.action == "approve":
        vq.status = "approved"
        if skill:
            skill.is_verified = True
            skill.verified_by_user_id = admin.id
            skill.verified_at = now
        audit_action = "skill.verify"

    elif payload.action == "reject":
        vq.status = "rejected"
        vq.reviewer_notes = payload.reason
        if skill:
            skill.is_verified = False
        audit_action = "skill.reject"

    else:  # request_info
        vq.status = "requesting_more_info"
        vq.reviewer_notes = payload.reason
        audit_action = "skill.request_info"

    db.commit()

    log_admin_action(
        db, admin, audit_action,
        target_type="skill", target_id=vq.user_skill_id,
        details={
            "before": {"status": before_status},
            "after": {"status": vq.status},
            "verification_queue_id": str(verification_id),
        },
        reason=payload.reason,
    )

    return success_response({
        "verification_id": str(verification_id),
        "new_status": vq.status,
        "skill_verified": skill.is_verified if skill else None,
    })
