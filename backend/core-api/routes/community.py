"""
routes/community.py — Community branches, channels, messages, groups, LFG, showcase, events.

Model mapping (existing ORM → prompt alias):
  CommunityBranch  → branch
  CommunityMember  → membership    (BranchMembership)
  Channel          → channel       (CommunityChannel)
  Message          → msg           (CommunityMessage)
  Group            → group         (CommunityGroup)
  GroupMember      → group member
  LFGPost          → lfg post
  ShowcasePost     → showcase post
  Event            → event         (CommunityEvent)
"""
import os

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_, and_
from typing import Optional
from uuid import UUID
from datetime import datetime, timedelta, timezone

from database import get_db
from models import (
    User, MasterProfile, SubProfile,
    CommunityBranch, CommunityMember, Channel, Message,
    Group, GroupMember, LFGPost, ShowcasePost, Event, EventReminder,
    CommunityAnnouncement, Connection, UserSkill, Tournament,
)
from routes.auth import get_current_user, success_response, error_response

router = APIRouter()

# ─── SEED DATA ────────────────────────────────────────────────────────────────

BRANCH_SEEDS = [
    {"slug": "dev",      "name": "Game Creation & Development", "icon_url": "💻", "color_accent": "#6366f1"},
    {"slug": "esports",  "name": "Esports & Play",              "icon_url": "🎮", "color_accent": "#10b981"},
    {"slug": "content",  "name": "Content & Media",             "icon_url": "🎬", "color_accent": "#f59e0b"},
    {"slug": "business", "name": "Business & Strategy",         "icon_url": "💼", "color_accent": "#3b82f6"},
    {"slug": "art",      "name": "Art & Design",                "icon_url": "🎨", "color_accent": "#ec4899"},
    {"slug": "writing",  "name": "Writing & Music",             "icon_url": "✍️", "color_accent": "#8b5cf6"},
    {"slug": "audio",    "name": "Audio & Sound",               "icon_url": "🎵", "color_accent": "#14b8a6"},
]


def seed_branches(db: Session):
    """Insert default branches + channels if they don't exist yet."""
    for seed in BRANCH_SEEDS:
        existing = db.query(CommunityBranch).filter(CommunityBranch.slug == seed["slug"]).first()
        if not existing:
            branch = CommunityBranch(
                slug=seed["slug"],
                name=seed["name"],
                icon_url=seed["icon_url"],
                color_accent=seed["color_accent"],
                status="Active",
            )
            db.add(branch)
            db.flush()

            db.add(Channel(
                branch_id=branch.id,
                name="general",
                description="General discussion",
                channel_type="text",
                is_default=True,
            ))
            db.add(Channel(
                branch_id=branch.id,
                name="news",
                description="Announcements & news",
                channel_type="announcement",
            ))

    db.commit()


# ─── HELPERS ─────────────────────────────────────────────────────────────────

def _branch_dict(b: CommunityBranch, channel_list=None) -> dict:
    return {
        "id": str(b.id),
        "slug": b.slug,
        "name": b.name,
        "description": b.description,
        "icon_url": b.icon_url,
        "color_accent": b.color_accent,
        "member_count": b.member_count or 0,
        "channels": channel_list or [],
    }


def _get_member(branch_id, user_id, db: Session):
    return db.query(CommunityMember).filter(
        CommunityMember.branch_id == branch_id,
        CommunityMember.user_id == user_id,
        CommunityMember.opted_out == False,
    ).first()


def _author(user_id, db: Session) -> dict:
    mp = db.query(MasterProfile).filter(MasterProfile.user_id == user_id).first()
    return {
        "user_id": str(user_id),
        "username": mp.username if mp else "unknown",
        "display_name": mp.real_name if mp else None,
        "avatar_url": mp.avatar_url if mp else None,
    }


# ─── BRANCHES ────────────────────────────────────────────────────────────────

@router.get("/branches")
def list_branches(db: Session = Depends(get_db)):
    try:
        branches = db.query(CommunityBranch).filter(CommunityBranch.status == "Active").all()
        return success_response([_branch_dict(b) for b in branches])
    except Exception as e:
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.get("/me/joined")
def my_joined_branches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        memberships = db.query(CommunityMember).filter(
            CommunityMember.user_id == current_user.id,
            CommunityMember.opted_out == False,
        ).all()
        branch_ids = [m.branch_id for m in memberships]
        branches = db.query(CommunityBranch).filter(CommunityBranch.id.in_(branch_ids)).all()
        return success_response([_branch_dict(b) for b in branches])
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.get("/stats/live")
def live_stats(db: Session = Depends(get_db)):
    try:
        total_members = db.query(CommunityMember).filter(CommunityMember.opted_out == False).count()
        active_channels = db.query(Channel).count()
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        messages_today = db.query(Message).filter(Message.created_at >= today_start).count()
        return success_response({
            "total_members": total_members,
            "active_channels": active_channels,
            "messages_today": messages_today,
        })
    except Exception as e:
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── GAME CHAT PREVIEW ───────────────────────────────────────────────────────

@router.get("/channels/messages")
def get_game_chat_messages(
    game_slug: str = Query(..., description="Game slug to fetch messages for"),
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """Last {limit} messages for a game's community channel. Falls back to esports #general."""
    try:
        channels = db.query(Channel).filter(
            ((Channel.game_slug == game_slug) |
             func.lower(Channel.name).contains(game_slug.lower())),
            Channel.is_archived == False,
        ).all()

        if not channels:
            esports = db.query(CommunityBranch).filter(CommunityBranch.slug == "esports").first()
            if esports:
                fallback = db.query(Channel).filter(
                    Channel.branch_id == esports.id,
                    Channel.is_default == True,
                ).first()
                if fallback:
                    channels = [fallback]

        if not channels:
            return success_response([])

        channel_ids = [c.id for c in channels]
        msgs = (
            db.query(Message)
            .filter(Message.channel_id.in_(channel_ids), Message.deleted_at == None)
            .order_by(desc(Message.created_at))
            .limit(limit)
            .all()
        )

        result = []
        for m in msgs:
            author = _author(m.user_id, db)
            result.append({
                "id": str(m.id),
                "username": author["username"],
                "sub_profile_username": author["username"],
                "avatar_url": author["avatar_url"],
                "text": m.content or "",
                "created_at": m.created_at,
            })
        return success_response(result)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── GAME COMMUNITY STATS ────────────────────────────────────────────────────

@router.get("/stats")
def game_community_stats(
    game_slug: str = Query(..., description="Game slug"),
    db: Session = Depends(get_db),
):
    """Per-game community stats: members, active discussions, posts this week."""
    try:
        # TODO: refine to count only SubProfiles whose esports game list includes game_slug
        members_with_game = (
            db.query(SubProfile).filter(SubProfile.domain == "esports").count()
        )

        active_discussions = (
            db.query(Channel)
            .filter(
                (Channel.game_slug == game_slug) |
                func.lower(Channel.name).contains(game_slug.lower()),
                Channel.is_archived == False,
            )
            .count()
        )

        week_ago = datetime.now(timezone.utc) - timedelta(days=7)
        game_channel_ids = (
            db.query(Channel.id)
            .filter(
                (Channel.game_slug == game_slug) |
                func.lower(Channel.name).contains(game_slug.lower()),
            )
            .subquery()
        )
        posts_this_week = (
            db.query(Message)
            .filter(
                Message.channel_id.in_(game_channel_ids),
                Message.created_at >= week_ago,
                Message.deleted_at == None,
            )
            .count()
        )

        return success_response({
            "members_with_game": members_with_game,
            "active_discussions": active_discussions,
            "posts_this_week": posts_this_week,
        })
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── ANNOUNCEMENTS ───────────────────────────────────────────────────────────

@router.get("/announcements")
def get_announcements(db: Session = Depends(get_db)):
    try:
        rows = (
            db.query(CommunityAnnouncement)
            .filter(
                CommunityAnnouncement.is_pinned == True,
                CommunityAnnouncement.is_platform_wide == True,
            )
            .order_by(desc(CommunityAnnouncement.created_at))
            .limit(3)
            .all()
        )
        result = []
        for a in rows:
            author = _author(a.posted_by_user_id, db) if a.posted_by_user_id else {}
            result.append({
                "id": str(a.id),
                "title": a.title,
                "body": a.body,
                "link": a.link,
                "created_at": a.created_at,
                "author": author,
            })
        return success_response(result)
    except Exception as e:
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── FEATURED POST ────────────────────────────────────────────────────────────

@router.get("/featured-post")
def get_featured_post(db: Session = Depends(get_db)):
    try:
        msg = (
            db.query(Message)
            .filter(Message.is_featured_today == True, Message.deleted_at == None)
            .order_by(desc(Message.created_at))
            .first()
        )
        if not msg:
            return success_response(None)

        author = _author(msg.user_id, db)
        # Resolve branch via channel
        ch = db.query(Channel).filter(Channel.id == msg.channel_id).first()
        branch = db.query(CommunityBranch).filter(CommunityBranch.id == ch.branch_id).first() if ch else None

        return success_response({
            "id": str(msg.id),
            "title": (msg.content or "")[:80],
            "excerpt": (msg.content or "")[:200],
            "author": author,
            "branch_slug": branch.slug if branch else None,
            "branch_name": branch.name if branch else None,
            "branch_color": branch.color_accent if branch else "#6366F1",
            "likes": 0,
            "comments": 0,
            "created_at": msg.created_at,
        })
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── SHOWCASE WEEKLY WINNER ───────────────────────────────────────────────────

@router.get("/showcase/weekly-winner")
def get_weekly_winner(db: Session = Depends(get_db)):
    try:
        post = (
            db.query(ShowcasePost)
            .filter(ShowcasePost.is_weekly_winner == True)
            .order_by(desc(ShowcasePost.winner_week))
            .first()
        )
        if not post:
            return success_response(None)

        author = _author(post.user_id, db)
        sp = db.query(SubProfile).filter(SubProfile.user_id == post.user_id).first()
        return success_response({
            "id": str(post.id),
            "title": post.title,
            "description": post.description,
            "media_urls": post.media_urls or [],
            "media_type": post.media_type,
            "likes_count": post.likes_count,
            "winner_week": post.winner_week,
            "author": author,
            "author_domain": sp.domain if sp else None,
        })
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── NEW MEMBERS ─────────────────────────────────────────────────────────────

@router.get("/new-members")
def get_new_members(
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(days=7)
        # Users created in last 7 days who have at least 1 sub-profile
        rows = (
            db.query(User, SubProfile)
            .join(SubProfile, SubProfile.user_id == User.id)
            .filter(User.created_at > cutoff)
            .order_by(desc(User.created_at))
            .limit(limit)
            .all()
        )
        seen = set()
        result = []
        for user, sp in rows:
            if str(user.id) in seen:
                continue
            seen.add(str(user.id))
            mp = db.query(MasterProfile).filter(MasterProfile.user_id == user.id).first()
            result.append({
                "id": str(user.id),
                "username": user.username,
                "avatar_url": mp.avatar_url if mp else None,
                "domain": sp.domain,
                "created_at": user.created_at,
            })
        return success_response(result)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── RECOMMENDED CONNECTIONS ──────────────────────────────────────────────────

@router.get("/recommended-connections")
def get_recommended_connections(
    limit: int = Query(5, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        cutoff_30 = datetime.now(timezone.utc) - timedelta(days=30)

        # Current user's domains
        my_domains = [
            r[0] for r in
            db.query(SubProfile.domain)
            .filter(SubProfile.user_id == current_user.id)
            .all()
        ]

        # Already connected user IDs
        connected_ids = set()
        for c in db.query(Connection).filter(
            or_(
                Connection.requester_user_id == current_user.id,
                Connection.recipient_user_id == current_user.id,
            ),
            Connection.status == "accepted",
        ).all():
            connected_ids.add(str(c.requester_user_id))
            connected_ids.add(str(c.recipient_user_id))
        connected_ids.add(str(current_user.id))

        rows = (
            db.query(User, MasterProfile, SubProfile)
            .join(MasterProfile, MasterProfile.user_id == User.id)
            .join(SubProfile, SubProfile.user_id == User.id)
            .filter(
                SubProfile.domain.in_(my_domains) if my_domains else True,
                MasterProfile.trust_score > 5.0,
                User.last_active_at > cutoff_30,
            )
            .order_by(desc(MasterProfile.trust_score))
            .limit(limit * 3)
            .all()
        )

        seen = set()
        result = []
        for user, mp, sp in rows:
            uid = str(user.id)
            if uid in seen or uid in connected_ids:
                continue
            seen.add(uid)

            top_skill = (
                db.query(UserSkill)
                .filter(UserSkill.user_id == user.id, UserSkill.is_verified == True)
                .first()
            )

            result.append({
                "id": uid,
                "username": user.username,
                "avatar_url": mp.avatar_url,
                "domain": sp.domain,
                "primary_role": sp.primary_role,
                "trust_score": float(mp.trust_score or 5.0),
                "top_skill_id": str(top_skill.skill_id) if top_skill else None,
            })
            if len(result) >= limit:
                break

        return success_response(result)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── SEARCH ──────────────────────────────────────────────────────────────────

@router.get("/search")
def community_search(
    q: str = Query(..., min_length=2),
    type: str = Query("all"),
    branch: Optional[str] = Query(None),
    verified_only: bool = Query(False),
    recency: str = Query("any"),
    db: Session = Depends(get_db),
):
    try:
        pattern = f"%{q}%"

        # Recency cutoff
        recency_cutoff = None
        if recency == "today":
            recency_cutoff = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        elif recency == "week":
            recency_cutoff = datetime.now(timezone.utc) - timedelta(days=7)
        elif recency == "month":
            recency_cutoff = datetime.now(timezone.utc) - timedelta(days=30)

        # Branch filter
        branch_obj = None
        if branch and branch != "all":
            branch_obj = db.query(CommunityBranch).filter(CommunityBranch.slug == branch).first()

        people, posts, groups, events = [], [], [], []

        if type in ("all", "people"):
            q_people = (
                db.query(User, MasterProfile, SubProfile)
                .join(MasterProfile, MasterProfile.user_id == User.id)
                .outerjoin(SubProfile, SubProfile.user_id == User.id)
                .filter(
                    or_(
                        User.username.ilike(pattern),
                        MasterProfile.real_name.ilike(pattern),
                    )
                )
            )
            if verified_only:
                q_people = q_people.join(UserSkill, UserSkill.user_id == User.id).filter(UserSkill.is_verified == True)
            if recency_cutoff:
                q_people = q_people.filter(User.last_active_at > recency_cutoff)
            for user, mp, sp in q_people.limit(5).all():
                people.append({
                    "id": str(user.id),
                    "username": user.username,
                    "avatar_url": mp.avatar_url,
                    "domain": sp.domain if sp else None,
                    "trust_score": float(mp.trust_score or 5.0),
                })

        if type in ("all", "posts"):
            q_posts = db.query(Message, Channel, CommunityBranch).join(
                Channel, Channel.id == Message.channel_id
            ).join(
                CommunityBranch, CommunityBranch.id == Channel.branch_id
            ).filter(
                Message.content.ilike(pattern),
                Message.deleted_at == None,
            )
            if branch_obj:
                q_posts = q_posts.filter(Channel.branch_id == branch_obj.id)
            if recency_cutoff:
                q_posts = q_posts.filter(Message.created_at > recency_cutoff)
            for msg, ch, br in q_posts.order_by(desc(Message.created_at)).limit(5).all():
                author = _author(msg.user_id, db)
                posts.append({
                    "id": str(msg.id),
                    "text": (msg.content or "")[:120],
                    "author_username": author.get("username"),
                    "branch_slug": br.slug,
                    "created_at": msg.created_at,
                })

        if type in ("all", "groups"):
            q_groups = db.query(Group, CommunityBranch).join(
                CommunityBranch, CommunityBranch.id == Group.branch_id
            ).filter(
                Group.name.ilike(pattern),
                Group.is_public == True,
            )
            if branch_obj:
                q_groups = q_groups.filter(Group.branch_id == branch_obj.id)
            for group, br in q_groups.limit(5).all():
                groups.append({
                    "id": str(group.id),
                    "name": group.name,
                    "branch_slug": br.slug,
                    "member_count": group.member_count or 0,
                })

        if type in ("all", "events"):
            now = datetime.now(timezone.utc)
            q_events = db.query(Event, CommunityBranch).join(
                CommunityBranch, CommunityBranch.id == Event.branch_id
            ).filter(
                Event.title.ilike(pattern),
                Event.ends_at > now,
                Event.is_approved == True,
            )
            if branch_obj:
                q_events = q_events.filter(Event.branch_id == branch_obj.id)
            if recency_cutoff:
                q_events = q_events.filter(Event.starts_at > recency_cutoff)
            for event, br in q_events.order_by(Event.starts_at).limit(5).all():
                events.append({
                    "id": str(event.id),
                    "title": event.title,
                    "start_at": event.starts_at,
                    "branch_slug": br.slug,
                    "rsvp_count": event.rsvp_count or 0,
                })

        return success_response({"people": people, "posts": posts, "groups": groups, "events": events})
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── CHANNEL PINNED MESSAGES ────────────────────────────────────────────────

@router.get("/channels/{channel_id}/pinned")
def get_pinned_messages(channel_id: UUID, db: Session = Depends(get_db)):
    try:
        msgs = db.query(Message).filter(
            Message.channel_id == channel_id,
            Message.is_pinned == True,
            Message.deleted_at == None,
        ).order_by(desc(Message.pinned_at)).limit(10).all()

        result = []
        for msg in msgs:
            author = _author(msg.user_id, db)
            result.append({
                "id": str(msg.id),
                "content": (msg.content or "")[:300],
                "author_username": author.get("username"),
                "pinned_at": msg.pinned_at,
            })
        return success_response(result)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.post("/channels/{channel_id}/messages/{message_id}/pin")
def pin_message(
    channel_id: UUID,
    message_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        msg = db.query(Message).filter(Message.id == message_id, Message.channel_id == channel_id).first()
        if not msg:
            error_response("NOT_FOUND", "Message not found.", status=404)
        msg.is_pinned = not msg.is_pinned
        msg.pinned_at = datetime.now(timezone.utc) if msg.is_pinned else None
        db.commit()
        return success_response({"pinned": msg.is_pinned})
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── LFG SMART MATCH ─────────────────────────────────────────────────────────

@router.post("/lfg/smart-match")
def lfg_smart_match(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """AI-powered match ranking using Claude. payload: { lfg_post_id, branch_slug }"""
    import json

    try:
        import anthropic as _anthropic
    except ImportError:
        error_response("DEPENDENCY_MISSING", "AI matching is temporarily unavailable.", status=503)

    try:
        lfg_post_id = payload.get("lfg_post_id")
        branch_slug = payload.get("branch_slug")

        lfg_post = db.query(LFGPost).filter(LFGPost.id == lfg_post_id).first() if lfg_post_id else None

        # Fetch up to 50 sub-profiles from the branch
        branch_obj = db.query(CommunityBranch).filter(CommunityBranch.slug == branch_slug).first() if branch_slug else None
        domain_filter = branch_slug or "dev"
        candidates_q = db.query(SubProfile, MasterProfile).join(
            MasterProfile, MasterProfile.user_id == SubProfile.user_id
        ).filter(
            SubProfile.domain == domain_filter,
            SubProfile.visibility == "public",
            SubProfile.user_id != current_user.id,
        ).limit(50)

        candidates = []
        for sp, mp in candidates_q.all():
            skills = db.query(UserSkill).filter(UserSkill.sub_profile_id == sp.id).limit(6).all()
            candidates.append({
                "sub_profile_id": str(sp.id),
                "username": mp.username,
                "primary_role": sp.primary_role or "",
                "headline": sp.headline or "",
                "experience_level": sp.experience_level or "",
                "trust_score": float(mp.trust_score or 5),
                "skills": [s.skill_name for s in skills],
            })

        if not candidates:
            return success_response({"matches": [], "ai_summary": "No candidates found in this branch."})

        post_context = ""
        if lfg_post:
            post_context = (
                f"LFG Post description: {lfg_post.description}\n"
                f"Required skills: {lfg_post.required_skills}\n"
                f"Goal type: {lfg_post.goal_type}\n"
                f"Availability: {lfg_post.availability_window}\n"
            )

        prompt = (
            f"You are a talent-matching AI for a creative gaming community called GzoneSphere.\n"
            f"{post_context}"
            f"Here are {len(candidates)} candidate sub-profiles (JSON):\n"
            f"{json.dumps(candidates, default=str)}\n\n"
            f"Rank the top 5 best matches for this LFG post. "
            f"Return a JSON array with objects: "
            f'[{{"sub_profile_id": "...", "match_score": 0-100, "reason": "one sentence"}}]. '
            f"Only return the JSON array, no other text."
        )

        api_key = os.getenv("ANTHROPIC_API_KEY", "")
        if not api_key:
            # Fallback: return top 5 by trust score
            ranked = sorted(candidates, key=lambda c: c["trust_score"], reverse=True)[:5]
            matches = [
                {"sub_profile_id": c["sub_profile_id"], "username": c["username"],
                 "match_score": int(c["trust_score"] * 10), "reason": "High trust score match",
                 "primary_role": c["primary_role"], "skills": c["skills"][:3]}
                for c in ranked
            ]
            return success_response({"matches": matches, "ai_summary": "Ranked by trust score (AI key not configured)."})

        client = _anthropic.Anthropic(api_key=api_key)
        resp = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = resp.content[0].text.strip()

        try:
            ranked_ids = json.loads(raw)
        except Exception:
            ranked_ids = []

        cand_map = {c["sub_profile_id"]: c for c in candidates}
        matches = []
        for item in ranked_ids[:5]:
            sid = item.get("sub_profile_id")
            if sid in cand_map:
                c = cand_map[sid]
                matches.append({
                    "sub_profile_id": sid,
                    "username": c["username"],
                    "match_score": item.get("match_score", 50),
                    "reason": item.get("reason", ""),
                    "primary_role": c["primary_role"],
                    "skills": c["skills"][:3],
                })

        return success_response({"matches": matches, "ai_summary": f"Ranked {len(matches)} matches using GZS AI."})
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Smart match unavailable.", {"details": str(e)}, status=503)


# ─── EVENT CRUD + REMINDERS ──────────────────────────────────────────────────

@router.post("/{branch_slug}/events", status_code=201)
def create_event(
    branch_slug: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        b = db.query(CommunityBranch).filter(CommunityBranch.slug == branch_slug).first()
        if not b:
            error_response("NOT_FOUND", "Branch not found.", status=404)

        # Pro/Extreme/admin users get auto-approved; others go into pending queue
        mp = db.query(MasterProfile).filter(MasterProfile.user_id == current_user.id).first()
        level = mp.platform_level if mp else "Beginner"
        auto_approve = level in ("Pro", "Extreme")

        event = Event(
            branch_id=b.id,
            created_by_user_id=current_user.id,
            title=payload.get("title", "")[:255],
            description=payload.get("description", ""),
            event_type=payload.get("event_type", "workshop"),
            starts_at=datetime.fromisoformat(payload["start_at"]) if payload.get("start_at") else None,
            ends_at=datetime.fromisoformat(payload["end_at"]) if payload.get("end_at") else None,
            capacity=payload.get("capacity", 100),
            is_approved=auto_approve,
            status="approved" if auto_approve else "pending_approval",
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        return success_response({
            "id": str(event.id),
            "status": event.status,
            "pending_approval": not auto_approve,
        })
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.post("/events/{event_id}/reminder")
def set_event_reminder(
    event_id: UUID,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            error_response("NOT_FOUND", "Event not found.", status=404)

        minutes = int(payload.get("minutes_before", 60))
        if minutes not in (60, 180, 1440, 10080):
            error_response("INVALID_REMINDER", "Allowed values: 60, 180, 1440, 10080 minutes.", status=400)

        existing = db.query(EventReminder).filter(
            EventReminder.event_id == event_id,
            EventReminder.user_id == current_user.id,
        ).first()

        if existing:
            existing.remind_minutes_before = minutes
        else:
            db.add(EventReminder(
                event_id=event_id,
                user_id=current_user.id,
                remind_minutes_before=minutes,
            ))

        db.commit()
        return success_response({"set": True, "minutes_before": minutes})
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.post("/events/{event_id}/approve")
def approve_event(
    event_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            error_response("NOT_FOUND", "Event not found.", status=404)
        event.is_approved = True
        event.status = "approved"
        db.commit()
        return success_response({"approved": True, "id": str(event_id)})
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.post("/events/{event_id}/reject")
def reject_event(
    event_id: UUID,
    payload: dict = {},
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            error_response("NOT_FOUND", "Event not found.", status=404)
        event.is_approved = False
        event.status = "rejected"
        db.commit()
        return success_response({"rejected": True, "id": str(event_id)})
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── BRANCH (catch-all — must stay after all /community/* static routes) ─────

@router.get("/{slug}")
def get_branch(slug: str, db: Session = Depends(get_db)):
    try:
        b = db.query(CommunityBranch).filter(CommunityBranch.slug == slug).first()
        if not b:
            error_response("NOT_FOUND", "Branch not found.", status=404)
        channels = db.query(Channel).filter(Channel.branch_id == b.id).all()
        ch_list = [{"id": str(c.id), "name": c.name, "type": c.channel_type, "slug": c.name} for c in channels]
        return success_response(_branch_dict(b, ch_list))
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.post("/{slug}/join")
def join_branch(
    slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        b = db.query(CommunityBranch).filter(CommunityBranch.slug == slug).first()
        if not b:
            error_response("NOT_FOUND", "Branch not found.", status=404)

        existing = db.query(CommunityMember).filter(
            CommunityMember.branch_id == b.id,
            CommunityMember.user_id == current_user.id,
        ).first()

        if existing:
            if existing.opted_out:
                existing.opted_out = False
                b.member_count = (b.member_count or 0) + 1
                db.commit()
                return success_response({"joined": True, "branch_slug": slug})
            return success_response({"joined": True, "branch_slug": slug, "already_member": True})

        db.add(CommunityMember(branch_id=b.id, user_id=current_user.id))
        b.member_count = (b.member_count or 0) + 1
        db.commit()
        return success_response({"joined": True, "branch_slug": slug})
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── CHANNELS ────────────────────────────────────────────────────────────────

@router.get("/{branch_slug}/channels")
def list_channels(
    branch_slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        b = db.query(CommunityBranch).filter(CommunityBranch.slug == branch_slug).first()
        if not b:
            error_response("NOT_FOUND", "Branch not found.", status=404)
        channels = db.query(Channel).filter(Channel.branch_id == b.id).all()
        return success_response([
            {"id": str(c.id), "name": c.name, "slug": c.name, "type": c.channel_type, "description": c.description}
            for c in channels
        ])
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── MESSAGES ────────────────────────────────────────────────────────────────

@router.get("/{branch_slug}/{channel_slug}/messages")
def get_channel_messages(
    branch_slug: str,
    channel_slug: str,
    before: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        b = db.query(CommunityBranch).filter(CommunityBranch.slug == branch_slug).first()
        if not b:
            error_response("NOT_FOUND", "Branch not found.", status=404)

        ch = db.query(Channel).filter(Channel.branch_id == b.id, Channel.name == channel_slug).first()
        if not ch:
            error_response("NOT_FOUND", "Channel not found.", status=404)

        q = db.query(Message).filter(
            Message.channel_id == ch.id,
            Message.deleted_at == None,
        )
        if before:
            try:
                before_dt = datetime.fromisoformat(before)
                q = q.filter(Message.created_at < before_dt)
            except ValueError:
                pass

        msgs = q.order_by(desc(Message.created_at)).limit(limit).all()
        msgs.reverse()

        return success_response([
            {
                "id": str(m.id),
                "channel_id": str(m.channel_id),
                "content": m.content,
                "media_urls": m.media_urls or [],
                "created_at": m.created_at,
                "edited_at": m.edited_at,
                "sender": _author(m.user_id, db),
            }
            for m in msgs
        ])
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.post("/{branch_slug}/{channel_slug}/messages", status_code=201)
def send_channel_message(
    branch_slug: str,
    channel_slug: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        b = db.query(CommunityBranch).filter(CommunityBranch.slug == branch_slug).first()
        if not b:
            error_response("NOT_FOUND", "Branch not found.", status=404)

        membership = _get_member(b.id, current_user.id, db)
        if not membership:
            error_response("NOT_MEMBER", "You must join this branch to send messages.", status=403)

        ch = db.query(Channel).filter(Channel.branch_id == b.id, Channel.name == channel_slug).first()
        if not ch:
            error_response("NOT_FOUND", "Channel not found.", status=404)

        content = payload.get("content", "").strip()
        if not content:
            error_response("EMPTY_MESSAGE", "Message content cannot be empty.", status=400)

        # 5-message limit for non-friends: count user's messages in channel in last 24 h
        since = datetime.now(timezone.utc) - timedelta(hours=24)
        user_msg_count = db.query(func.count(Message.id)).filter(
            Message.channel_id == ch.id,
            Message.user_id == current_user.id,
            Message.deleted_at == None,
            Message.created_at > since,
        ).scalar() or 0

        if user_msg_count >= 5:
            # Check if the user has an accepted connection with any recent sender in this channel
            recent_senders = db.query(Message.user_id).filter(
                Message.channel_id == ch.id,
                Message.created_at > since,
                Message.user_id != current_user.id,
                Message.deleted_at == None,
            ).distinct().subquery()

            is_friend = db.query(Connection).filter(
                Connection.status == "accepted",
                or_(
                    and_(
                        Connection.requester_user_id == current_user.id,
                        Connection.recipient_user_id.in_(db.query(recent_senders.c.user_id)),
                    ),
                    and_(
                        Connection.recipient_user_id == current_user.id,
                        Connection.requester_user_id.in_(db.query(recent_senders.c.user_id)),
                    ),
                )
            ).first()

            if not is_friend:
                raise HTTPException(
                    status_code=429,
                    detail={
                        "data": None,
                        "error": {
                            "code": "MESSAGE_LIMIT_REACHED",
                            "message": "You can send at most 5 messages per day in channels where you have no connections.",
                            "details": {"limit": 5, "window_hours": 24},
                        },
                    },
                )

        msg = Message(
            channel_id=ch.id,
            user_id=current_user.id,
            content=content,
            media_urls=payload.get("media_urls", []),
        )
        db.add(msg)
        db.commit()
        db.refresh(msg)

        return success_response({
            "id": str(msg.id),
            "channel_id": str(msg.channel_id),
            "content": msg.content,
            "created_at": msg.created_at,
            "sender": _author(current_user.id, db),
        })
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── GROUPS ──────────────────────────────────────────────────────────────────

@router.get("/{branch_slug}/groups")
def list_groups(branch_slug: str, db: Session = Depends(get_db)):
    try:
        b = db.query(CommunityBranch).filter(CommunityBranch.slug == branch_slug).first()
        if not b:
            error_response("NOT_FOUND", "Branch not found.", status=404)
        groups = db.query(Group).filter(Group.branch_id == b.id, Group.is_public == True).all()
        return success_response([
            {"id": str(g.id), "name": g.name, "description": g.description, "member_count": g.member_count}
            for g in groups
        ])
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.post("/{branch_slug}/groups", status_code=201)
def create_group(
    branch_slug: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        b = db.query(CommunityBranch).filter(CommunityBranch.slug == branch_slug).first()
        if not b:
            error_response("NOT_FOUND", "Branch not found.", status=404)

        group = Group(
            branch_id=b.id,
            name=payload.get("name"),
            description=payload.get("description"),
            is_public=not payload.get("is_private", False),
            member_count=1,
            created_by_user_id=current_user.id,
        )
        db.add(group)
        db.flush()
        db.add(GroupMember(group_id=group.id, user_id=current_user.id, role="owner"))
        db.commit()
        db.refresh(group)
        return success_response({"id": str(group.id), "name": group.name, "branch_slug": branch_slug})
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.post("/groups/{group_id}/join")
def join_group(
    group_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        group = db.query(Group).filter(Group.id == group_id).first()
        if not group:
            error_response("NOT_FOUND", "Group not found.", status=404)
        if not group.is_public:
            error_response("PRIVATE_GROUP", "This group is private.", status=403)

        existing = db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id == current_user.id,
        ).first()
        if existing:
            return success_response({"joined": True, "already_member": True})

        db.add(GroupMember(group_id=group_id, user_id=current_user.id))
        group.member_count = (group.member_count or 0) + 1
        db.commit()
        return success_response({"joined": True, "group_id": str(group_id)})
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── SHOWCASE ────────────────────────────────────────────────────────────────

@router.get("/{branch_slug}/showcase")
def list_showcase(
    branch_slug: str,
    featured: Optional[bool] = None,
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    try:
        b = db.query(CommunityBranch).filter(CommunityBranch.slug == branch_slug).first()
        if not b:
            error_response("NOT_FOUND", "Branch not found.", status=404)
        q = db.query(ShowcasePost).filter(ShowcasePost.branch_id == b.id)
        if featured is not None:
            q = q.filter(ShowcasePost.is_featured == featured)
        posts = q.order_by(desc(ShowcasePost.created_at)).offset(offset).limit(limit).all()
        return success_response([
            {
                "id": str(p.id),
                "title": p.title,
                "description": p.description,
                "media_urls": p.media_urls,
                "media_type": p.media_type,
                "is_featured": p.is_featured,
                "likes_count": p.likes_count,
                "created_at": p.created_at,
                "author": _author(p.user_id, db),
            }
            for p in posts
        ])
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.post("/{branch_slug}/showcase", status_code=201)
def create_showcase(
    branch_slug: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        b = db.query(CommunityBranch).filter(CommunityBranch.slug == branch_slug).first()
        if not b:
            error_response("NOT_FOUND", "Branch not found.", status=404)

        post = ShowcasePost(
            branch_id=b.id,
            user_id=current_user.id,
            sub_profile_id=current_user.id,  # placeholder; frontend should pass sub_profile_id
            title=payload.get("title"),
            description=payload.get("description"),
            media_urls=payload.get("media_urls", []),
            media_type=payload.get("media_type", "image"),
            skill_tags=payload.get("skill_tags", []),
        )
        db.add(post)
        db.commit()
        db.refresh(post)
        return success_response({"id": str(post.id), "title": post.title, "created_at": post.created_at})
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── LFG ─────────────────────────────────────────────────────────────────────

@router.get("/{branch_slug}/lfg")
def list_lfg(
    branch_slug: str,
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    try:
        b = db.query(CommunityBranch).filter(CommunityBranch.slug == branch_slug).first()
        if not b:
            error_response("NOT_FOUND", "Branch not found.", status=404)
        now = datetime.now(timezone.utc)
        posts = db.query(LFGPost).filter(
            LFGPost.branch_id == b.id,
            LFGPost.is_active == True,
            (LFGPost.expires_at == None) | (LFGPost.expires_at > now),
        ).order_by(desc(LFGPost.created_at)).offset(offset).limit(limit).all()

        return success_response([
            {
                "id": str(p.id),
                "goal_type": p.goal_type,
                "description": p.description,
                "required_skills": p.required_skills,
                "platform_type": p.platform_type,
                "expires_at": p.expires_at,
                "created_at": p.created_at,
                "author": _author(p.user_id, db),
            }
            for p in posts
        ])
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.post("/{branch_slug}/lfg", status_code=201)
def create_lfg(
    branch_slug: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        b = db.query(CommunityBranch).filter(CommunityBranch.slug == branch_slug).first()
        if not b:
            error_response("NOT_FOUND", "Branch not found.", status=404)

        expires_at = datetime.now(timezone.utc) + timedelta(hours=48)
        post = LFGPost(
            branch_id=b.id,
            user_id=current_user.id,
            goal_type=payload.get("goal_type"),
            description=payload.get("description"),
            required_skills=payload.get("required_skills", []),
            platform_type=payload.get("platform_type"),
            contact_preference=payload.get("contact_preference", "dm"),
            contact_url=payload.get("contact_url"),
            timezone=payload.get("timezone", "UTC"),
            availability_window=payload.get("availability_window", "flexible"),
            expires_at=expires_at,
            auto_expire=True,
        )
        db.add(post)
        db.commit()
        db.refresh(post)
        return success_response({"id": str(post.id), "expires_at": post.expires_at})
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── EVENTS ──────────────────────────────────────────────────────────────────

@router.get("/{branch_slug}/events")
def list_events(
    branch_slug: str,
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    try:
        b = db.query(CommunityBranch).filter(CommunityBranch.slug == branch_slug).first()
        if not b:
            error_response("NOT_FOUND", "Branch not found.", status=404)
        events = db.query(Event).filter(
            Event.branch_id == b.id,
            Event.is_approved == True,
        ).order_by(Event.starts_at).offset(offset).limit(limit).all()

        return success_response([
            {
                "id": str(e.id),
                "title": e.title,
                "description": e.description,
                "event_type": e.event_type,
                "starts_at": e.starts_at,
                "ends_at": e.ends_at,
                "rsvp_count": e.rsvp_count,
                "is_featured": e.is_featured,
                "created_at": e.created_at,
            }
            for e in events
        ])
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)
