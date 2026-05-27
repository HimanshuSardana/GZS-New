from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from uuid import UUID

from database import get_db
from models import User, MasterProfile, SubProfile, UserSkill, Tool, Project, Availability, SkillsTaxonomy, SubProfileAchievement, CompanyEmployee, Post
from routes.auth import get_current_user, success_response, error_response

router = APIRouter()

# ─── MASTER PROFILE ENDPOINTS ──────────────────────────────────────────────

@router.get("/me")
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        profile = db.query(MasterProfile).filter(MasterProfile.user_id == current_user.id).first()
        if not profile:
            error_response("PROFILE_NOT_FOUND", "Master profile not found.", status=404)

        # Compute stats
        verified_count = db.query(func.count(UserSkill.id)).join(
            SubProfile, UserSkill.sub_profile_id == SubProfile.id
        ).filter(
            SubProfile.user_id == current_user.id,
            UserSkill.is_verified == True,
        ).scalar() or 0

        companies_count = db.query(func.count(func.distinct(CompanyEmployee.company_id))).filter(
            CompanyEmployee.user_id == current_user.id
        ).scalar() or 0

        sub_profiles = db.query(SubProfile).filter(SubProfile.user_id == current_user.id).all()
        
        sub_profile_summaries = [
            {
                "id": str(sp.id),
                "domain": sp.domain,
                "username": sp.username,
                "primary_role": sp.primary_role,
                "status": sp.status
            }
            for sp in sub_profiles
        ]

        return success_response({
            "profile": {
                "id": str(profile.id),
                "user_id": str(profile.user_id),
                "username": profile.username,
                "real_name": profile.real_name,
                "avatar_url": profile.avatar_url,
                "banner_url": profile.banner_url,
                "location": profile.location,
                "platform_level": profile.platform_level,
                "trust_score": float(profile.trust_score),
                "verified_checkmark": profile.verified_checkmark,
                "bio": profile.bio,
                "created_at": profile.created_at,
                "verified_skills_count": verified_count,
                "companies_worked_with_count": companies_count,
            },
            "stats": {
                "total_verified_skills": verified_count,
                "active_sub_profiles_count": len(sub_profiles),
                "companies_worked_with_count": companies_count,
            },
            "sub_profiles": sub_profile_summaries
        })
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database service unavailable.", {"details": str(e)}, status=503)

@router.patch("/me")
def update_my_profile(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        profile = db.query(MasterProfile).filter(MasterProfile.user_id == current_user.id).first()
        if not profile:
            error_response("PROFILE_NOT_FOUND", "Master profile not found.", status=404)

        allowed_fields = [
            "display_name", "bio", "location", "avatar_url",
            "banner_url", "hiring_open", "collab_open", "events_open",
            "availability_flags",
        ]
        
        for field, value in payload.items():
            if field in allowed_fields and value is not None:
                # Map display_name to real_name if that's what the model uses
                if field == "display_name":
                    setattr(profile, "real_name", value)
                else:
                    setattr(profile, field, value)

        db.commit()
        db.refresh(profile)
        
        return success_response({
            "id": str(profile.id),
            "username": profile.username,
            "real_name": profile.real_name,
            "bio": profile.bio,
            "location": profile.location,
            "avatar_url": profile.avatar_url,
            "banner_url": profile.banner_url,
            "updated_at": profile.updated_at
        })
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database service unavailable.", {"details": str(e)}, status=503)

# ─── SUB-PROFILE ENDPOINTS ──────────────────────────────────────────────────

@router.get("/me/sub")
def get_my_sub_profiles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        sub_profiles = db.query(SubProfile).filter(SubProfile.user_id == current_user.id).all()
        
        result = []
        for sp in sub_profiles:
            # Get top 3 skills
            top_skills = db.query(UserSkill).join(SkillsTaxonomy).filter(
                UserSkill.sub_profile_id == sp.id
            ).limit(3).all()
            
            skills_data = [
                {"id": str(s.id), "name": db.query(SkillsTaxonomy).filter(SkillsTaxonomy.id == s.skill_id).first().name, "verified": s.is_verified}
                for s in top_skills
            ]

            result.append({
                "id": str(sp.id),
                "domain": sp.domain,
                "username": sp.username,
                "primary_role": sp.primary_role,
                "status": sp.status,
                "top_skills": skills_data
            })
            
        return success_response(result)
    except Exception as e:
        error_response("DB_ERROR", "Database service unavailable.", {"details": str(e)}, status=503)

@router.post("/me/sub", status_code=201)
def create_sub_profile(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        domain = payload.get("domain")
        if domain not in ['dev', 'esports', 'content', 'business', 'art', 'writing', 'audio']:
            error_response("INVALID_DOMAIN", f"Invalid domain: {domain}", status=400)

        existing = db.query(SubProfile).filter(
            SubProfile.user_id == current_user.id,
            SubProfile.domain == domain
        ).first()
        
        if existing:
            error_response("SUB_PROFILE_EXISTS", f"You already have a {domain} sub-profile.", status=409)

        new_sub = SubProfile(
            user_id=current_user.id,
            domain=domain,
            username=payload.get("username", current_user.username),
            primary_role=payload.get("primary_role"),
            headline=payload.get("headline"),
            experience_level=payload.get("experience_level"),
            bio=payload.get("bio")
        )
        
        db.add(new_sub)
        db.commit()
        db.refresh(new_sub)
        
        return success_response({
            "id": str(new_sub.id),
            "domain": new_sub.domain,
            "username": new_sub.username,
            "status": new_sub.status
        })
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database service unavailable.", {"details": str(e)}, status=503)

@router.get("/me/sub/{type}")
def get_sub_profile_detail(
    type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        sp = db.query(SubProfile).filter(
            SubProfile.user_id == current_user.id,
            SubProfile.domain == type
        ).first()
        
        if not sp:
            error_response("SUB_PROFILE_NOT_FOUND", f"Sub-profile for domain {type} not found.", status=404)

        # Load related data
        skills = db.query(UserSkill).filter(UserSkill.sub_profile_id == sp.id).all()
        skills_list = []
        for s in skills:
            tax = db.query(SkillsTaxonomy).filter(SkillsTaxonomy.id == s.skill_id).first()
            skills_list.append({
                "id": str(s.id),
                "name": tax.name if tax else "Unknown",
                "category": tax.category if tax else "Unknown",
                "verified": s.is_verified
            })

        tools = db.query(Tool).filter(Tool.sub_profile_id == sp.id).all()
        projects = db.query(Project).filter(Project.sub_profile_id == sp.id).all()
        availability = db.query(Availability).filter(Availability.sub_profile_id == sp.id).first()

        return success_response({
            "profile": {
                "id": str(sp.id),
                "domain": sp.domain,
                "username": sp.username,
                "primary_role": sp.primary_role,
                "headline": sp.headline,
                "bio": sp.bio,
                "experience_level": sp.experience_level,
                "status": sp.status
            },
            "skills": skills_list,
            "tools": [{"id": str(t.id), "name": t.tool_name, "category": t.category} for t in tools],
            "projects": [{"id": str(p.id), "title": p.title, "year": p.year} for p in projects],
            "availability": {
                "timezone": availability.timezone,
                "type": availability.collaboration_type,
                "hours": availability.weekly_hours_available
            } if availability else None
        })
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database service unavailable.", {"details": str(e)}, status=503)

@router.patch("/me/sub/{type}")
def update_sub_profile(
    type: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        sp = db.query(SubProfile).filter(
            SubProfile.user_id == current_user.id,
            SubProfile.domain == type
        ).first()
        
        if not sp:
            error_response("SUB_PROFILE_NOT_FOUND", f"Sub-profile for domain {type} not found.", status=404)

        for field, value in payload.items():
            if hasattr(sp, field) and value is not None:
                setattr(sp, field, value)
        
        db.commit()
        db.refresh(sp)
        return success_response({"id": str(sp.id), "updated_at": sp.updated_at})
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database service unavailable.", {"details": str(e)}, status=503)

@router.delete("/me/sub/{type}", status_code=204)
def delete_sub_profile(
    type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        sp = db.query(SubProfile).filter(
            SubProfile.user_id == current_user.id,
            SubProfile.domain == type
        ).first()
        
        if sp:
            db.delete(sp)
            db.commit()
        return None
    except Exception as e:
        error_response("DB_ERROR", "Database service unavailable.", {"details": str(e)}, status=503)

# ─── SKILLS ENDPOINTS ────────────────────────────────────────────────────────

@router.post("/me/sub/{type}/skills")
def add_skill(
    type: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        sp = db.query(SubProfile).filter(
            SubProfile.user_id == current_user.id,
            SubProfile.domain == type
        ).first()
        
        if not sp:
            error_response("SUB_PROFILE_NOT_FOUND", f"Sub-profile for domain {type} not found.", status=404)

        skill_name = payload.get("skill_name")
        category = payload.get("category")
        
        # Check if skill exists in taxonomy
        tax = db.query(SkillsTaxonomy).filter(SkillsTaxonomy.name == skill_name).first()
        if not tax:
            # Create in taxonomy if missing (auto-categorize)
            tax = SkillsTaxonomy(name=skill_name, domain=type, category=category)
            db.add(tax)
            db.flush()

        user_skill = UserSkill(
            sub_profile_id=sp.id,
            skill_id=tax.id,
            user_id=current_user.id,
            is_verified=False
        )
        db.add(user_skill)
        db.commit()
        db.refresh(user_skill)
        
        return success_response({
            "id": str(user_skill.id),
            "name": skill_name,
            "verified": False
        })
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database service unavailable.", {"details": str(e)}, status=503)

@router.delete("/me/sub/{type}/skills/{skill_id}", status_code=204)
def remove_skill(
    type: str,
    skill_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        user_skill = db.query(UserSkill).filter(
            UserSkill.id == skill_id,
            UserSkill.user_id == current_user.id
        ).first()
        
        if user_skill:
            db.delete(user_skill)
            db.commit()
        return None
    except Exception as e:
        error_response("DB_ERROR", "Database service unavailable.", {"details": str(e)}, status=503)

# ─── ACHIEVEMENTS ENDPOINT ──────────────────────────────────────────────────

@router.get("/me/sub/{domain}/achievements")
def get_sub_achievements(
    domain: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        achievements = db.query(SubProfileAchievement).filter(
            SubProfileAchievement.user_id == current_user.id,
            SubProfileAchievement.domain == domain
        ).order_by(SubProfileAchievement.earned_at.desc()).all()
        return success_response([
            {
                "id": str(a.id),
                "label": a.label,
                "icon": a.icon,
                "earned_at": a.earned_at.isoformat() if a.earned_at else None,
            }
            for a in achievements
        ])
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database service unavailable.", {"details": str(e)}, status=503)

# ─── FEED ENDPOINT ──────────────────────────────────────────────────────────

@router.get("/me/feed")
def get_my_feed(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns a merged, chronologically sorted feed of the authenticated user's posts and achievements."""
    try:
        user_id = current_user.id

        posts = db.query(Post).filter(Post.user_id == user_id)\
            .order_by(desc(Post.created_at)).limit(20).all()

        achievements = db.query(SubProfileAchievement).filter(
            SubProfileAchievement.user_id == user_id
        ).order_by(desc(SubProfileAchievement.earned_at)).limit(10).all()

        feed_items = []
        for p in posts:
            feed_items.append({
                "id": str(p.id),
                "type": "post",
                "sub_profile_type": p.sub_profile_type,
                "content": p.content,
                "media_urls": p.media_urls or [],
                "published_at": p.created_at.isoformat() if p.created_at else None,
                "like_count": p.like_count,
                "comment_count": p.comment_count,
            })
        for a in achievements:
            feed_items.append({
                "id": str(a.id),
                "type": "achievement",
                "sub_profile_type": a.domain,
                "content": a.label,
                "media_urls": [],
                "published_at": a.earned_at.isoformat() if a.earned_at else None,
                "like_count": 0,
                "comment_count": 0,
            })

        feed_items.sort(key=lambda x: x["published_at"] or "", reverse=True)
        return success_response(feed_items[:30])
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── PUBLIC ENDPOINTS ───────────────────────────────────────────────────────

@router.get("/{username}")
def get_public_profile(
    username: str,
    db: Session = Depends(get_db)
):
    try:
        profile = db.query(MasterProfile).filter(MasterProfile.username == username).first()
        if not profile:
            error_response("USER_NOT_FOUND", "Profile not found.", status=404)

        # Get public sub-profiles
        sub_profiles = db.query(SubProfile).filter(
            SubProfile.user_id == profile.user_id,
            SubProfile.visibility == 'public'
        ).all()

        pub_verified_count = db.query(func.count(UserSkill.id)).join(
            SubProfile, UserSkill.sub_profile_id == SubProfile.id
        ).filter(
            SubProfile.user_id == profile.user_id,
            UserSkill.is_verified == True,
        ).scalar() or 0

        pub_companies_count = db.query(func.count(func.distinct(CompanyEmployee.company_id))).filter(
            CompanyEmployee.user_id == profile.user_id
        ).scalar() or 0

        return success_response({
            "username": profile.username,
            "real_name": profile.real_name,
            "avatar_url": profile.avatar_url,
            "banner_url": profile.banner_url,
            "location": profile.location,
            "platform_level": profile.platform_level,
            "trust_score": float(profile.trust_score),
            "verified": profile.verified_checkmark,
            "bio": profile.bio,
            "created_at": profile.created_at,
            "verified_skills_count": pub_verified_count,
            "companies_worked_with_count": pub_companies_count,
            "sub_profiles": [
                {"domain": sp.domain, "primary_role": sp.primary_role}
                for sp in sub_profiles
            ]
        })
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database service unavailable.", {"details": str(e)}, status=503)

@router.get("/{username}/{type}")
def get_public_sub_profile(
    username: str,
    type: str,
    db: Session = Depends(get_db)
):
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            error_response("USER_NOT_FOUND", "User not found.", status=404)

        sp = db.query(SubProfile).filter(
            SubProfile.user_id == user.id,
            SubProfile.domain == type,
            SubProfile.visibility == 'public'
        ).first()
        
        if not sp:
            error_response("SUB_PROFILE_NOT_FOUND", "Sub-profile not found or private.", status=404)

        # Minimal public data
        return success_response({
            "domain": sp.domain,
            "username": sp.username,
            "primary_role": sp.primary_role,
            "headline": sp.headline,
            "bio": sp.bio,
            "experience_level": sp.experience_level
        })
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database service unavailable.", {"details": str(e)}, status=503)
