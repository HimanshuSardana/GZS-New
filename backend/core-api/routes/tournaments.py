"""
routes/tournaments.py — Tournament management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from uuid import UUID
import os
import re

from database import get_db
from models import User, Tournament, TournamentRegistration
from routes.auth import get_current_user, success_response, error_response
from schemas import TournamentCreate, TournamentUpdate, RegistrationCreate

router = APIRouter()


def _require_admin(current_user: User):
    if getattr(current_user, "role", None) != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")


def _slugify(title: str) -> str:
    s = title.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s)
    return s[:110]


def _tournament_dict(t: Tournament, reg_count: int = 0) -> dict:
    return {
        "id": str(t.id),
        "slug": t.slug,
        "title": t.title,
        "game_slug": t.game_slug,
        "domain": t.domain,
        "format": t.format,
        "status": t.status,
        "prize_pool": t.prize_pool,
        "entry_fee": t.entry_fee,
        "max_participants": t.max_participants,
        "start_date": t.start_date,
        "end_date": t.end_date,
        "registration_opens": t.registration_opens,
        "registration_closes": t.registration_closes,
        "eligible_regions": t.eligible_regions,
        "rules": t.rules,
        "refund_policy": t.refund_policy,
        "banner_image": t.banner_image,
        "game_config_json": t.game_config_json,
        "created_at": t.created_at,
        "registration_count": reg_count,
        "highlights": t.highlights,
        "stages": t.stages,
        "important_notes": t.important_notes,
        "prize_distribution": t.prize_distribution,
        "prize_distribution_policy": t.prize_distribution_policy,
        "bracket_announcement": t.bracket_announcement,
        "check_in_start": t.check_in_start,
        "check_in_end": t.check_in_end,
        "expected_duration": t.expected_duration,
        "organizer_user_id": str(t.organizer_user_id) if t.organizer_user_id else None,
        "full_rules_document": t.full_rules_document,
        "custom_registration_fields": t.custom_registration_fields,
        "platforms": t.platforms,
        "estimated_match_duration": t.estimated_match_duration,
        "overtime_rules": t.overtime_rules,
        "reschedule_policy": t.reschedule_policy,
        "noshow_rule": t.noshow_rule,
    }


# ─── LIST ────────────────────────────────────────────────────────────────────

@router.get("")
def list_tournaments(
    status: Optional[str] = None,
    game_slug: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    try:
        q = db.query(Tournament)
        if status:
            q = q.filter(Tournament.status == status)
        if game_slug:
            q = q.filter(Tournament.game_slug == game_slug)
        total = q.count()
        tournaments = q.order_by(Tournament.created_at.desc()).offset(offset).limit(limit).all()

        reg_counts = {
            r.tournament_id: r.cnt
            for r in db.query(
                TournamentRegistration.tournament_id,
                func.count(TournamentRegistration.id).label("cnt"),
            ).group_by(TournamentRegistration.tournament_id).all()
        }

        return success_response({
            "total": total,
            "limit": limit,
            "offset": offset,
            "items": [_tournament_dict(t, reg_counts.get(t.id, 0)) for t in tournaments],
        })
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── GET SINGLE ──────────────────────────────────────────────────────────────

@router.get("/{slug}")
def get_tournament(slug: str, db: Session = Depends(get_db)):
    try:
        t = db.query(Tournament).filter(Tournament.slug == slug).first()
        if not t:
            error_response("NOT_FOUND", "Tournament not found.", status=404)
        reg_count = db.query(TournamentRegistration).filter(
            TournamentRegistration.tournament_id == t.id
        ).count()
        return success_response(_tournament_dict(t, reg_count))
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── CREATE ──────────────────────────────────────────────────────────────────

@router.post("", status_code=201)
def create_tournament(
    payload: TournamentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(current_user)
    try:
        slug = payload.slug or _slugify(payload.title)
        if db.query(Tournament).filter(Tournament.slug == slug).first():
            slug = f"{slug}-{str(current_user.id)[:6]}"

        t = Tournament(
            slug=slug,
            title=payload.title,
            game_slug=payload.game_slug,
            domain=payload.domain or "esports",
            format=payload.format,
            status=payload.status or "upcoming",
            prize_pool=payload.prize_pool,
            entry_fee=payload.entry_fee or 0,
            max_participants=payload.max_participants,
            start_date=payload.start_date,
            end_date=payload.end_date,
            registration_opens=payload.registration_opens,
            registration_closes=payload.registration_closes,
            eligible_regions=payload.eligible_regions or [],
            rules=payload.rules,
            refund_policy=payload.refund_policy,
            banner_image=payload.banner_image,
            game_config_json=payload.game_config_json or {},
            created_by_user_id=current_user.id,
        )
        db.add(t)
        db.commit()
        db.refresh(t)
        return success_response(_tournament_dict(t))
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Could not create tournament.", {"details": str(e)}, status=503)


# ─── UPDATE ──────────────────────────────────────────────────────────────────

@router.patch("/{tournament_id}")
def update_tournament(
    tournament_id: UUID,
    payload: TournamentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(current_user)
    try:
        t = db.query(Tournament).filter(Tournament.id == tournament_id).first()
        if not t:
            error_response("NOT_FOUND", "Tournament not found.", status=404)
        for field, value in payload.dict(exclude_unset=True).items():
            if value is not None:
                setattr(t, field, value)
        db.commit()
        db.refresh(t)
        return success_response(_tournament_dict(t))
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── DELETE ──────────────────────────────────────────────────────────────────

@router.delete("/{tournament_id}", status_code=204)
def delete_tournament(
    tournament_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(current_user)
    try:
        t = db.query(Tournament).filter(Tournament.id == tournament_id).first()
        if t:
            db.delete(t)
            db.commit()
        return None
    except Exception as e:
        db.rollback()
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── BRACKETS ────────────────────────────────────────────────────────────────

@router.get("/{tournament_id}/brackets")
def get_brackets(tournament_id: UUID, db: Session = Depends(get_db)):
    try:
        t = db.query(Tournament).filter(Tournament.id == tournament_id).first()
        if not t:
            error_response("NOT_FOUND", "Tournament not found.", status=404)
        return success_response({"brackets": t.brackets_json or {}})
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.put("/{tournament_id}/brackets")
def save_brackets(
    tournament_id: UUID,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(current_user)
    try:
        t = db.query(Tournament).filter(Tournament.id == tournament_id).first()
        if not t:
            error_response("NOT_FOUND", "Tournament not found.", status=404)
        t.brackets_json = payload.get("brackets", payload)
        db.commit()
        return success_response({"brackets": t.brackets_json})
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.post("/{tournament_id}/brackets/generate")
def generate_brackets(
    tournament_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(current_user)
    try:
        t = db.query(Tournament).filter(Tournament.id == tournament_id).first()
        if not t:
            error_response("NOT_FOUND", "Tournament not found.", status=404)

        registrations = db.query(TournamentRegistration).filter(
            TournamentRegistration.tournament_id == tournament_id,
            TournamentRegistration.status == "registered",
        ).all()

        participants = [
            {"user_id": str(r.user_id), "team_name": r.team_name or str(r.user_id)[:8]}
            for r in registrations
        ]

        # Simple single-elimination bracket generation
        import math
        n = len(participants)
        if n < 2:
            error_response("INSUFFICIENT_PARTICIPANTS", "Need at least 2 registrants.", status=400)

        rounds = math.ceil(math.log2(n))
        brackets = {"rounds": rounds, "participants": participants, "matches": []}

        # Round 1 matchups
        for i in range(0, n - 1, 2):
            brackets["matches"].append({
                "round": 1,
                "match_index": i // 2,
                "player1": participants[i],
                "player2": participants[i + 1] if i + 1 < n else None,
                "winner": None,
                "score": None,
            })

        t.brackets_json = brackets
        db.commit()
        return success_response({"brackets": brackets, "participant_count": n})
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── REGISTER ────────────────────────────────────────────────────────────────

@router.post("/{tournament_id}/register", status_code=201)
def register_for_tournament(
    tournament_id: UUID,
    payload: RegistrationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        t = db.query(Tournament).filter(Tournament.id == tournament_id).first()
        if not t:
            error_response("NOT_FOUND", "Tournament not found.", status=404)
        if t.status not in ("upcoming", "registration_open"):
            error_response("REGISTRATION_CLOSED", "Registration is not open.", status=409)

        existing = db.query(TournamentRegistration).filter(
            TournamentRegistration.tournament_id == tournament_id,
            TournamentRegistration.user_id == current_user.id,
        ).first()
        if existing:
            error_response("ALREADY_REGISTERED", "You are already registered.", status=409)

        if t.max_participants:
            count = db.query(TournamentRegistration).filter(
                TournamentRegistration.tournament_id == tournament_id
            ).count()
            if count >= t.max_participants:
                error_response("TOURNAMENT_FULL", "This tournament is full.", status=409)

        entry_fee = t.entry_fee or 0
        payment_method = (payload.game_fields or {}).get("payment_method") or "GZS Coins"

        if entry_fee > 0 and payment_method == "GZS Coins":
            balance = getattr(current_user, "gzs_coins", 0) or 0
            if balance < entry_fee:
                error_response(
                    "INSUFFICIENT_COINS",
                    f"Insufficient GZS Coins. Required: {entry_fee}, Balance: {balance}.",
                    status=402,
                )
            current_user.gzs_coins = balance - entry_fee

        reg = TournamentRegistration(
            tournament_id=tournament_id,
            user_id=current_user.id,
            team_name=payload.team_name,
            team_members_json=payload.team_members or [],
            game_fields_json=payload.game_fields or {},
        )
        db.add(reg)
        db.commit()
        db.refresh(reg)
        return success_response({
            "id": str(reg.id),
            "tournament_id": str(reg.tournament_id),
            "status": reg.status,
            "registered_at": reg.registered_at,
        })
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Registration failed.", {"details": str(e)}, status=503)


# ─── REGISTRATIONS LIST (admin) ───────────────────────────────────────────────

@router.get("/{tournament_id}/registrations")
def list_registrations(
    tournament_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(current_user)
    try:
        regs = db.query(TournamentRegistration).filter(
            TournamentRegistration.tournament_id == tournament_id
        ).all()
        return success_response([
            {
                "id": str(r.id),
                "user_id": str(r.user_id),
                "team_name": r.team_name,
                "team_members": r.team_members_json,
                "game_fields": r.game_fields_json,
                "status": r.status,
                "registered_at": r.registered_at,
            }
            for r in regs
        ])
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── RESULTS ─────────────────────────────────────────────────────────────────

@router.get("/{tournament_id}/results")
def get_results(tournament_id: UUID, db: Session = Depends(get_db)):
    try:
        t = db.query(Tournament).filter(Tournament.id == tournament_id).first()
        if not t:
            error_response("NOT_FOUND", "Tournament not found.", status=404)
        return success_response({"results": t.results_json or {}, "status": t.status})
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── ANALYTICS ───────────────────────────────────────────────────────────────

@router.get("/{tournament_id}/analytics/funnel")
def analytics_funnel(
    tournament_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(current_user)
    try:
        t = db.query(Tournament).filter(Tournament.id == tournament_id).first()
        if not t:
            error_response("NOT_FOUND", "Tournament not found.", status=404)
        reg_count = db.query(func.count(TournamentRegistration.id)).filter(
            TournamentRegistration.tournament_id == tournament_id
        ).scalar() or 0
        return success_response({
            "page_views": 0,
            "form_opens": 0,
            "form_starts": 0,
            "completions": reg_count,
        })
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.get("/{tournament_id}/analytics/registrations-over-time")
def analytics_over_time(
    tournament_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(current_user)
    try:
        from sqlalchemy import cast, Date
        rows = (
            db.query(
                cast(TournamentRegistration.registered_at, Date).label("date"),
                func.count(TournamentRegistration.id).label("count"),
            )
            .filter(TournamentRegistration.tournament_id == tournament_id)
            .group_by(cast(TournamentRegistration.registered_at, Date))
            .order_by(cast(TournamentRegistration.registered_at, Date))
            .all()
        )
        return success_response([{"date": str(r.date), "count": r.count} for r in rows])
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.get("/{tournament_id}/analytics/geo")
def analytics_geo(
    tournament_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(current_user)
    try:
        regs = db.query(TournamentRegistration).filter(
            TournamentRegistration.tournament_id == tournament_id
        ).all()
        region_counts: dict = {}
        platform_counts: dict = {}
        for r in regs:
            gf = r.game_fields_json or {}
            region = gf.get("region", "Unknown")
            platform = gf.get("platform", None)
            region_counts[region] = region_counts.get(region, 0) + 1
            if platform:
                platform_counts[platform] = platform_counts.get(platform, 0) + 1
        result = [
            {"region": region, "count": count, "platform": None}
            for region, count in sorted(region_counts.items(), key=lambda x: -x[1])
        ]
        for platform, count in platform_counts.items():
            result.append({"region": None, "count": count, "platform": platform})
        return success_response(result)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.get("/{tournament_id}/analytics/prize-status")
def analytics_prize_status(
    tournament_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(current_user)
    try:
        t = db.query(Tournament).filter(Tournament.id == tournament_id).first()
        if not t:
            error_response("NOT_FOUND", "Tournament not found.", status=404)
        distribution = t.prize_distribution or []
        results = t.results_json or {}
        placements = results.get("placements", [])
        merged = []
        for i, entry in enumerate(distribution):
            place_data = placements[i] if i < len(placements) else {}
            merged.append({
                "place": entry.get("place", f"#{i+1}"),
                "prize": entry.get("prize") or entry.get("amount"),
                "team": place_data.get("team") or place_data.get("player"),
                "status": place_data.get("prize_status", "pending"),
            })
        return success_response(merged)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── PAYMENT ORDER ────────────────────────────────────────────────────────────

@router.post("/{tournament_id}/create-payment-order")
def create_payment_order(
    tournament_id: UUID,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        t = db.query(Tournament).filter(Tournament.id == tournament_id).first()
        if not t:
            error_response("NOT_FOUND", "Tournament not found.", status=404)

        method = payload.get("payment_method", "GZS Coins")
        entry_fee = t.entry_fee or 0

        if method == "GZS Coins":
            balance = getattr(current_user, "gzs_coins", 0) or 0
            return success_response({
                "method": "GZS Coins",
                "sufficient": balance >= entry_fee,
                "balance": balance,
                "required": entry_fee,
            })

        # Razorpay order (placeholder — replace key + secret with real Razorpay SDK call)
        return success_response({
            "method": "razorpay",
            "order_id": f"order_{str(tournament_id)[:8]}_{str(current_user.id)[:8]}",
            "amount": int(entry_fee * 100),
            "currency": "INR",
            "key": os.getenv("RAZORPAY_KEY_ID", "rzp_test_placeholder"),
            "name": t.title,
        })
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Could not create payment order.", {"details": str(e)}, status=503)
