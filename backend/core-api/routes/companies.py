"""
routes/companies.py — Company profile management endpoints
Maps to existing CompanyProfile / CompanyEmployee / CompanyTalentPool models.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from uuid import UUID
from datetime import datetime

from database import get_db
from models import User, MasterProfile, SubProfile, CompanyProfile, CompanyEmployee, CompanyTalentPool
from routes.auth import get_current_user, success_response, error_response
from schemas import CompanyCreate, CompanyUpdate, CompanyMemberAdd

router = APIRouter()


def _is_company_owner_or_admin(company: CompanyProfile, current_user: User, db: Session) -> bool:
    """Returns True if the user is an owner, admin employee, or platform admin."""
    if getattr(current_user, "role", None) == "admin":
        return True
    if company.created_by_user_id == current_user.id:
        return True
    emp = db.query(CompanyEmployee).filter(
        CompanyEmployee.company_id == company.id,
        CompanyEmployee.user_id == current_user.id,
    ).first()
    return emp is not None and emp.role_title in ("owner", "admin")


def _company_dict(c: CompanyProfile, member_count: int = 0) -> dict:
    return {
        "id": str(c.id),
        "slug": c.slug,
        "name": c.name,
        "logo_url": c.logo_url,
        "is_verified": c.is_verified,
        "company_type": c.company_type,
        "company_size": c.company_size,
        "hq_location": c.hq_location,
        "is_remote_friendly": c.is_remote_friendly,
        "website_url": c.website_url,
        "description": c.description,
        "mission_statement": c.mission_statement,
        "created_at": c.created_at,
        "member_count": member_count,
    }


# ─── LIST ────────────────────────────────────────────────────────────────────

@router.get("")
def list_companies(
    type: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    try:
        q = db.query(CompanyProfile)
        if type:
            q = q.filter(CompanyProfile.company_type == type)
        total = q.count()
        companies = q.order_by(CompanyProfile.created_at.desc()).offset(offset).limit(limit).all()

        member_counts = {
            r.company_id: r.cnt
            for r in db.query(
                CompanyEmployee.company_id,
                func.count(CompanyEmployee.id).label("cnt"),
            ).group_by(CompanyEmployee.company_id).all()
        }

        return success_response({
            "total": total,
            "limit": limit,
            "offset": offset,
            "items": [_company_dict(c, member_counts.get(c.id, 0)) for c in companies],
        })
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── OWN COMPANY ─────────────────────────────────────────────────────────────

@router.get("/me")
def get_my_company(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        company = db.query(CompanyProfile).filter(
            CompanyProfile.created_by_user_id == current_user.id
        ).first()
        if not company:
            error_response("NOT_FOUND", "You do not have a company profile.", status=404)
        member_count = db.query(CompanyEmployee).filter(
            CompanyEmployee.company_id == company.id
        ).count()
        return success_response(_company_dict(company, member_count))
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── GET SINGLE ──────────────────────────────────────────────────────────────

@router.get("/{slug}")
def get_company(slug: str, db: Session = Depends(get_db)):
    try:
        c = db.query(CompanyProfile).filter(CompanyProfile.slug == slug).first()
        if not c:
            error_response("NOT_FOUND", "Company not found.", status=404)
        member_count = db.query(CompanyEmployee).filter(CompanyEmployee.company_id == c.id).count()
        return success_response(_company_dict(c, member_count))
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── CREATE ──────────────────────────────────────────────────────────────────

@router.post("", status_code=201)
def create_company(
    payload: CompanyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        existing_slug = db.query(CompanyProfile).filter(CompanyProfile.slug == payload.slug).first()
        if existing_slug:
            error_response("SLUG_TAKEN", f"Slug '{payload.slug}' is already taken.", status=409)

        company = CompanyProfile(
            slug=payload.slug,
            name=payload.name,
            company_type=payload.type,
            description=payload.description,
            logo_url=payload.logo_url,
            website_url=payload.website,
            created_by_user_id=current_user.id,
        )
        db.add(company)
        db.flush()

        # Add creator as owner employee
        db.add(CompanyEmployee(
            company_id=company.id,
            user_id=current_user.id,
            role_title="owner",
        ))

        db.commit()
        db.refresh(company)
        return success_response(_company_dict(company, 1))
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Could not create company.", {"details": str(e)}, status=503)


# ─── UPDATE ──────────────────────────────────────────────────────────────────

@router.patch("/{company_id}")
def update_company(
    company_id: UUID,
    payload: CompanyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        company = db.query(CompanyProfile).filter(CompanyProfile.id == company_id).first()
        if not company:
            error_response("NOT_FOUND", "Company not found.", status=404)
        if not _is_company_owner_or_admin(company, current_user, db):
            raise HTTPException(status_code=403, detail="Not authorized to update this company.")

        field_map = {
            "name": "name",
            "type": "company_type",
            "description": "description",
            "logo_url": "logo_url",
            "website": "website_url",
        }
        for field, value in payload.dict(exclude_unset=True).items():
            model_field = field_map.get(field, field)
            if value is not None and hasattr(company, model_field):
                setattr(company, model_field, value)

        company.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(company)
        member_count = db.query(CompanyEmployee).filter(CompanyEmployee.company_id == company.id).count()
        return success_response(_company_dict(company, member_count))
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── MEMBERS ─────────────────────────────────────────────────────────────────

@router.get("/{company_id}/members")
def list_members(company_id: UUID, db: Session = Depends(get_db)):
    try:
        employees = db.query(CompanyEmployee).filter(
            CompanyEmployee.company_id == company_id
        ).all()
        result = []
        for emp in employees:
            mp = db.query(MasterProfile).filter(MasterProfile.user_id == emp.user_id).first()
            result.append({
                "user_id": str(emp.user_id),
                "username": mp.username if mp else None,
                "display_name": mp.real_name if mp else None,
                "avatar_url": mp.avatar_url if mp else None,
                "role": emp.role_title,
                "joined_at": emp.linked_at,
            })
        return success_response(result)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.post("/{company_id}/members", status_code=201)
def add_member(
    company_id: UUID,
    payload: CompanyMemberAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        company = db.query(CompanyProfile).filter(CompanyProfile.id == company_id).first()
        if not company:
            error_response("NOT_FOUND", "Company not found.", status=404)
        if not _is_company_owner_or_admin(company, current_user, db):
            raise HTTPException(status_code=403, detail="Only owners/admins can add members.")

        target_user = db.query(User).filter(User.username == payload.username).first()
        if not target_user:
            error_response("USER_NOT_FOUND", f"User '{payload.username}' not found.", status=404)

        existing = db.query(CompanyEmployee).filter(
            CompanyEmployee.company_id == company_id,
            CompanyEmployee.user_id == target_user.id,
        ).first()
        if existing:
            error_response("ALREADY_MEMBER", "User is already a member.", status=409)

        emp = CompanyEmployee(
            company_id=company_id,
            user_id=target_user.id,
            role_title=payload.role or "member",
        )
        db.add(emp)
        db.commit()
        return success_response({"user_id": str(target_user.id), "role": emp.role_title})
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.delete("/{company_id}/members/{user_id}", status_code=204)
def remove_member(
    company_id: UUID,
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        company = db.query(CompanyProfile).filter(CompanyProfile.id == company_id).first()
        if not company:
            return None
        if not _is_company_owner_or_admin(company, current_user, db):
            raise HTTPException(status_code=403, detail="Only owners/admins can remove members.")

        emp = db.query(CompanyEmployee).filter(
            CompanyEmployee.company_id == company_id,
            CompanyEmployee.user_id == user_id,
        ).first()
        if emp:
            db.delete(emp)
            db.commit()
        return None
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── TALENT POOL ─────────────────────────────────────────────────────────────

@router.get("/{slug}/talent")
def get_talent_pool(
    slug: str,
    domain: Optional[str] = None,
    pipeline_status: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        company = db.query(CompanyProfile).filter(CompanyProfile.slug == slug).first()
        if not company:
            error_response("NOT_FOUND", "Company not found.", status=404)
        if not _is_company_owner_or_admin(company, current_user, db):
            raise HTTPException(status_code=403, detail="Company access required.")

        q = db.query(CompanyTalentPool).filter(CompanyTalentPool.company_id == company.id)
        if pipeline_status:
            q = q.filter(CompanyTalentPool.pipeline_status == pipeline_status)

        total = q.count()
        entries = q.offset(offset).limit(limit).all()

        result = []
        for entry in entries:
            mp = db.query(MasterProfile).filter(MasterProfile.user_id == entry.target_user_id).first()
            sub_profiles = db.query(SubProfile).filter(SubProfile.user_id == entry.target_user_id).all()
            # Domain filter applied after fetch if requested
            if domain:
                sub_profiles = [sp for sp in sub_profiles if sp.domain == domain]
            result.append({
                "user_id": str(entry.target_user_id),
                "username": mp.username if mp else None,
                "display_name": mp.real_name if mp else None,
                "avatar_url": mp.avatar_url if mp else None,
                "role_tag": entry.role_tag,
                "pipeline_status": entry.pipeline_status,
                "internal_notes": entry.internal_notes,
                "saved_at": entry.saved_at,
                "domains": [sp.domain for sp in sub_profiles],
            })

        return success_response({"total": total, "items": result})
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── ANALYTICS ───────────────────────────────────────────────────────────────

@router.get("/{slug}/analytics")
def get_analytics(
    slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        company = db.query(CompanyProfile).filter(CompanyProfile.slug == slug).first()
        if not company:
            error_response("NOT_FOUND", "Company not found.", status=404)
        if not _is_company_owner_or_admin(company, current_user, db):
            raise HTTPException(status_code=403, detail="Company access required.")

        total_members = db.query(CompanyEmployee).filter(
            CompanyEmployee.company_id == company.id
        ).count()

        pipeline_breakdown = {}
        entries = db.query(CompanyTalentPool).filter(
            CompanyTalentPool.company_id == company.id
        ).all()
        for entry in entries:
            ps = entry.pipeline_status or "unknown"
            pipeline_breakdown[ps] = pipeline_breakdown.get(ps, 0) + 1

        return success_response({
            "company_id": str(company.id),
            "total_members": total_members,
            "talent_pool_size": len(entries),
            "pipeline_breakdown": pipeline_breakdown,
            "verified": company.is_verified,
        })
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)
