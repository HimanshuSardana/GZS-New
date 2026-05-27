"""
seed_data.py — FIXED VERSION
- All inserts are wrapped with existence checks (upsert guards)
- run_all_seeds() is safe to call multiple times — idempotent
- Called from main.py startup ONLY when user count is 0

Changes from original:
  1. All user/profile/tournament inserts use _upsert_* helpers
  2. Branches seed is always idempotent (moved to seed_branches in community route)
  3. Skills taxonomy seeded with upsert guards
"""
import logging
from datetime import datetime
from typing import Optional, Dict, Any

from sqlalchemy.orm import Session
from sqlalchemy import func

from auth import hash_password
from models import (
    CommunityBranch,
    MasterProfile,
    SubProfile,
    Tournament,
    User,
    SkillsTaxonomy,
)

logger = logging.getLogger(__name__)


# ── helpers ───────────────────────────────────────────────────────────────────

def _parse_dt(s: Optional[str]) -> Optional[datetime]:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return None


def _upsert_user(db: Session, data: Dict[str, Any]) -> User:
    """Get existing user by username, or create if not present."""
    existing = db.query(User).filter_by(username=data["username"]).first()
    if existing:
        logger.debug(f"[seed] user '{data['username']}' already exists — skipping")
        return existing

    user = User(
        username=data["username"],
        email=data["email"],
        password_hash=hash_password(data["password"]),
        role=data.get("role", "user"),
        account_status="active",
    )
    db.add(user)
    db.flush()  # get the ID without committing
    logger.info(f"[seed] created user '{data['username']}'")
    return user


def _upsert_master_profile(db: Session, user: User, data: Dict[str, Any]) -> MasterProfile:
    """Get existing master profile for user, or create."""
    existing = db.query(MasterProfile).filter_by(user_id=user.id).first()
    if existing:
        return existing

    profile = MasterProfile(
        user_id=user.id,
        username=data.get("username", user.username),
        real_name=data.get("real_name"),
        bio=data.get("bio"),
        location=data.get("location"),
        platform_level=data.get("platform_level", "Beginner"),
        trust_score=data.get("trust_score", 5.0),
        verified_checkmark=data.get("verified", False),
        avatar_url=data.get("avatar_url"),
        availability_flags={"hiring": False, "collaboration": True, "events": True},
    )
    db.add(profile)
    db.flush()
    return profile


def _upsert_sub_profile(db: Session, user: User, sp_data: Dict[str, Any]) -> Optional[SubProfile]:
    """Get existing sub profile for user+domain, or create."""
    existing = db.query(SubProfile).filter_by(
        user_id=user.id, domain=sp_data["domain"]
    ).first()
    if existing:
        return existing

    sp = SubProfile(
        user_id=user.id,
        domain=sp_data["domain"],
        username=sp_data["username"],
        primary_role=sp_data.get("primary_role"),
        featured_roles=sp_data.get("featured_roles", []),
        headline=sp_data.get("headline"),
        experience_level=sp_data.get("experience_level", "Intermediate"),
        bio=sp_data.get("bio", ""),
        visibility="public",
        status="Active",
    )
    db.add(sp)
    db.flush()
    return sp


def _upsert_tournament(db: Session, data: Dict[str, Any]) -> Tournament:
    """Get existing tournament by slug, or create."""
    existing = db.query(Tournament).filter_by(slug=data["slug"]).first()
    if existing:
        return existing

    t = Tournament(
        slug=data["slug"],
        title=data["title"],
        game_slug=data.get("game_slug"),
        domain=data.get("domain", "esports"),
        format=data.get("format", "single_elimination"),
        status=data.get("status", "upcoming"),
        prize_pool=data.get("prize_pool"),
        entry_fee=data.get("entry_fee", 0),
        max_participants=data.get("max_participants", 64),
        start_date=_parse_dt(data.get("start_date")),
        end_date=_parse_dt(data.get("end_date")),
        registration_opens=_parse_dt(data.get("registration_opens")),
        registration_closes=_parse_dt(data.get("registration_closes")),
        eligible_regions=data.get("eligible_regions", ["India", "Global"]),
        rules=data.get("rules", "Standard rules apply."),
        banner_image=data.get("banner_image"),
        prize_distribution=data.get("prize_distribution", []),
        stages=data.get("stages", []),
    )
    db.add(t)
    db.flush()
    logger.info(f"[seed] created tournament '{data['slug']}'")
    return t


def _upsert_skill(db: Session, name: str, domain: str, category: str = "") -> SkillsTaxonomy:
    """Get existing skill by name, or create."""
    existing = db.query(SkillsTaxonomy).filter_by(name=name).first()
    if existing:
        return existing
    skill = SkillsTaxonomy(name=name, domain=domain, category=category)
    db.add(skill)
    db.flush()
    return skill


# ── seed user data ────────────────────────────────────────────────────────────

_USERS = [
    {
        "username": "gzs_admin",
        "email": "admin@gzonesphere.com",
        "password": "GZS@admin2025",
        "role": "super_admin",
        "real_name": "GZS Admin",
        "bio": "Platform administrator for GzoneSphere.",
        "location": "India",
        "platform_level": "Pro",
        "trust_score": 10.0,
        "verified": True,
        "avatar_url": "https://i.pravatar.cc/300?u=gzs_admin",
        "sub_profiles": [
            {
                "domain": "dev",
                "username": "gzs_admin_dev",
                "primary_role": "Game Developer / Programmer",
                "featured_roles": ["Game Systems Designer", "Network Engineer"],
                "headline": "Platform administrator and lead developer at GzoneSphere.",
                "experience_level": "Expert",
            }
        ],
    },
    {
        "username": "priya_dev",
        "email": "priya@example.com",
        "password": "TestUser@2025",
        "role": "user",
        "real_name": "Priya Sharma",
        "bio": "Unity developer and indie game maker from Bangalore.",
        "location": "Bangalore, India",
        "platform_level": "Hustler",
        "trust_score": 7.5,
        "verified": True,
        "avatar_url": "https://i.pravatar.cc/300?u=priya_dev",
        "sub_profiles": [
            {
                "domain": "dev",
                "username": "priya_gamedev",
                "primary_role": "Unity Developer",
                "headline": "Building mobile games that 10 million people love.",
                "experience_level": "Advanced",
            }
        ],
    },
    {
        "username": "arjun_esports",
        "email": "arjun@example.com",
        "password": "TestUser@2025",
        "role": "user",
        "real_name": "Arjun Mehta",
        "bio": "Professional Valorant player, IGL for Team Phantom.",
        "location": "Mumbai, India",
        "platform_level": "Pro",
        "trust_score": 9.0,
        "verified": True,
        "avatar_url": "https://i.pravatar.cc/300?u=arjun_esports",
        "sub_profiles": [
            {
                "domain": "esports",
                "username": "phantom_igl",
                "primary_role": "In-Game Leader",
                "headline": "Pro Valorant IGL — 3x national finalist.",
                "experience_level": "Expert",
            }
        ],
    },
]

_TOURNAMENTS = [
    {
        "slug": "valorant-summer-open-2026",
        "title": "Valorant Summer Open 2026",
        "game_slug": "valorant",
        "domain": "esports",
        "format": "single_elimination",
        "status": "upcoming",
        "prize_pool": "₹1,00,000",
        "entry_fee": 200,
        "max_participants": 64,
        "start_date": "2026-06-15T10:00:00Z",
        "end_date": "2026-06-22T20:00:00Z",
        "registration_opens": "2026-06-01T00:00:00Z",
        "registration_closes": "2026-06-12T23:59:00Z",
        "eligible_regions": ["India", "South Asia"],
        "rules": "5v5 standard competitive format. No boosting.",
        "prize_distribution": [
            {"place": 1, "amount": "₹50,000"},
            {"place": 2, "amount": "₹25,000"},
            {"place": 3, "amount": "₹15,000"},
            {"place": 4, "amount": "₹10,000"},
        ],
        "stages": [
            {"name": "Group Stage", "date": "2026-06-15"},
            {"name": "Quarterfinals", "date": "2026-06-18"},
            {"name": "Semifinals", "date": "2026-06-21"},
            {"name": "Grand Final", "date": "2026-06-22"},
        ],
    },
    {
        "slug": "bgmi-pro-league-2026",
        "title": "BGMI Pro League — Season 3",
        "game_slug": "bgmi",
        "domain": "esports",
        "format": "round_robin",
        "status": "live",
        "prize_pool": "₹50,000",
        "entry_fee": 0,
        "max_participants": 32,
        "start_date": "2026-05-20T10:00:00Z",
        "end_date": "2026-06-10T20:00:00Z",
        "eligible_regions": ["India"],
        "rules": "Squad format, 4 players per team.",
        "prize_distribution": [
            {"place": 1, "amount": "₹25,000"},
            {"place": 2, "amount": "₹15,000"},
            {"place": 3, "amount": "₹10,000"},
        ],
        "stages": [
            {"name": "League Stage", "date": "2026-05-20"},
            {"name": "Finals", "date": "2026-06-10"},
        ],
    },
]

_SKILLS = [
    ("Unity", "dev", "Engine"),
    ("Unreal Engine 5", "dev", "Engine"),
    ("C++", "dev", "Language"),
    ("C#", "dev", "Language"),
    ("Python", "dev", "Language"),
    ("Game Design", "dev", "Design"),
    ("Level Design", "dev", "Design"),
    ("Valorant", "esports", "Game"),
    ("BGMI", "esports", "Game"),
    ("In-Game Leadership", "esports", "Role"),
    ("Tournament Strategy", "esports", "Skill"),
    ("YouTube Growth", "content", "Platform"),
    ("Video Editing", "content", "Skill"),
    ("Twitch Streaming", "content", "Platform"),
    ("3D Modeling", "art", "Skill"),
    ("Character Design", "art", "Skill"),
    ("Concept Art", "art", "Skill"),
    ("Blender", "art", "Tool"),
    ("Audio Design", "audio", "Skill"),
    ("Sound Effects", "audio", "Skill"),
    ("Music Composition", "audio", "Skill"),
    ("Game Narrative", "writing", "Skill"),
    ("Lore Writing", "writing", "Skill"),
    ("Business Development", "business", "Skill"),
    ("Publishing Deals", "business", "Skill"),
]


# ── community branches ────────────────────────────────────────────────────────

_BRANCHES = [
    {"slug": "dev",       "name": "Game Dev",          "description": "Game developers, programmers, and engineers.",        "icon": "FiCode",    "accent_color": "#3B82F6"},
    {"slug": "esports",   "name": "Esports",           "description": "Competitive players, teams, and tournament orgs.",    "icon": "FiAward",   "accent_color": "#16A34A"},
    {"slug": "content",   "name": "Content Creators",  "description": "Streamers, YouTubers, and content marketers.",        "icon": "FiCamera",  "accent_color": "#EA580C"},
    {"slug": "business",  "name": "Business",          "description": "Publishers, investors, and game industry leaders.",   "icon": "FiBriefcase","accent_color": "#7C3AED"},
    {"slug": "art",       "name": "Art & Design",      "description": "Artists, animators, and UI/UX designers.",            "icon": "FiFeather", "accent_color": "#EC4899"},
    {"slug": "writing",   "name": "Writing & Narrative","description": "Game writers, narrative designers, and journalists.", "icon": "FiEdit",    "accent_color": "#10B981"},
    {"slug": "audio",     "name": "Audio",             "description": "Sound designers, composers, and voice actors.",       "icon": "FiMusic",   "accent_color": "#F59E0B"},
    {"slug": "general",   "name": "General",           "description": "Open discussion for everyone.",                       "icon": "FiGlobe",   "accent_color": "#64748B"},
    {"slug": "news",      "name": "GZS News",          "description": "Official GzoneSphere platform announcements.",        "icon": "FiBell",    "accent_color": "#1D6ADB"},
]


def seed_branches(db: Session) -> int:
    """Idempotent: create community branches that don't yet exist."""
    created = 0
    for b in _BRANCHES:
        existing = db.query(CommunityBranch).filter_by(slug=b["slug"]).first()
        if not existing:
            branch = CommunityBranch(
                slug=b["slug"],
                name=b["name"],
                description=b["description"],
                icon=b.get("icon", ""),
                accent_color=b.get("accent_color", "#64748B"),
            )
            db.add(branch)
            created += 1
    db.commit()
    logger.info(f"[seed] branches: {created} created")
    return created


# ── main entry point ──────────────────────────────────────────────────────────

def run_all_seeds(db: Session) -> dict:
    """
    Run all seed operations. Idempotent — safe to call multiple times.
    Returns a summary dict with counts of created records.
    """
    summary = {"users": 0, "profiles": 0, "sub_profiles": 0, "skills": 0, "tournaments": 0, "branches": 0}

    try:
        # ── Skills taxonomy ──
        for skill_name, domain, category in _SKILLS:
            _upsert_skill(db, skill_name, domain, category)
            summary["skills"] += 1
        db.commit()

        # ── Community branches ──
        summary["branches"] = seed_branches(db)

        # ── Users → Profiles → Sub-profiles ──
        for user_data in _USERS:
            user = _upsert_user(db, user_data)
            if not db.query(MasterProfile).filter_by(user_id=user.id).first():
                summary["users"] += 1
                _upsert_master_profile(db, user, user_data)
                summary["profiles"] += 1
            for sp_data in user_data.get("sub_profiles", []):
                before = db.query(SubProfile).filter_by(user_id=user.id, domain=sp_data["domain"]).first()
                _upsert_sub_profile(db, user, sp_data)
                after = db.query(SubProfile).filter_by(user_id=user.id, domain=sp_data["domain"]).first()
                if before is None and after is not None:
                    summary["sub_profiles"] += 1
        db.commit()

        # ── Tournaments ──
        for t_data in _TOURNAMENTS:
            before = db.query(Tournament).filter_by(slug=t_data["slug"]).first()
            _upsert_tournament(db, t_data)
            after = db.query(Tournament).filter_by(slug=t_data["slug"]).first()
            if before is None and after is not None:
                summary["tournaments"] += 1
        db.commit()

        logger.info(f"[seed] complete: {summary}")
    except Exception as exc:
        db.rollback()
        logger.error(f"[seed] failed: {exc}", exc_info=True)
        summary["error"] = str(exc)

    return summary