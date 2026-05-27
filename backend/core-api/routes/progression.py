import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from database import get_db
from models import (
    Collaboration,
    Event,
    LevelHistory,
    MasterProfile,
    Message,
    ModerationQueue,
    Notification,
    ShowcasePost,
    Tournament,
    TrustScoreHistory,
    User,
    UserSkill,
    UserViolation,
    XPLedger,
)
from routes.auth import error_response, success_response

router = APIRouter()

XP_TABLE = {
    'daily_login':            {'amount': 10,  'daily_cap': 10},
    'message_reaction':       {'amount': 5,   'daily_cap': 50},
    'showcase_save':          {'amount': 20,  'daily_cap': 100},
    'help_answer_accepted':   {'amount': 30,  'daily_cap': 90},
    'event_attend':           {'amount': 50,  'daily_cap': 100},
    'collaboration_complete': {'amount': 100, 'daily_cap': None},
    'skill_verified':         {'amount': 150, 'daily_cap': None},
    'blog_featured':          {'amount': 200, 'daily_cap': None},
    'referral_active':        {'amount': 75,  'daily_cap': 750},
}

_INTERNAL_TOKEN = os.getenv('INTERNAL_SERVICE_TOKEN', '')


def _verify_service_token(x_service_token: Optional[str] = Header(None, alias='X-Service-Token')):
    if not _INTERNAL_TOKEN or x_service_token != _INTERNAL_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                'data': None,
                'error': {'code': 'FORBIDDEN', 'message': 'Invalid or missing service token.', 'details': {}},
            },
        )


def _create_notification(db: Session, user_id, notif_type: str, title: str, body: str, link: str = None):
    db.add(Notification(user_id=user_id, type=notif_type, title=title, body=body, link=link))


def _midnight_utc() -> datetime:
    now = datetime.now(timezone.utc)
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


# ── Level helper ─────────────────────────────────────────────────────────────

def check_and_update_level(user_id: UUID, db: Session) -> bool:
    master = db.query(MasterProfile).filter(MasterProfile.user_id == user_id).first()
    if not master:
        return False

    current_level = master.platform_level

    def _qualifying_days(interval_days: int) -> int:
        cutoff = datetime.now(timezone.utc) - timedelta(days=interval_days)
        subq = (
            db.query(func.date(XPLedger.created_at).label('day'))
            .filter(XPLedger.user_id == user_id, XPLedger.created_at > cutoff)
            .group_by(func.date(XPLedger.created_at))
            .having(func.count(func.distinct(XPLedger.source_type)) >= 3)
            .subquery()
        )
        return db.query(func.count()).select_from(subq).scalar() or 0

    new_level = None
    if current_level == 'Beginner' and _qualifying_days(30) >= 20:
        new_level = 'Hustler'
    elif current_level == 'Hustler' and _qualifying_days(45) >= 37:
        new_level = 'Extreme'

    if new_level:
        db.add(LevelHistory(user_id=user_id, old_level=current_level, new_level=new_level, reason='activity_threshold'))
        master.platform_level = new_level
        _create_notification(
            db, user_id,
            notif_type='level_up',
            title=f'Level Up! You are now {new_level}',
            body=f'Your consistent activity has earned you the {new_level} rank.',
        )
        return True

    return False


# ── XP endpoint ───────────────────────────────────────────────────────────────

@router.post('/award-xp')
def award_xp(
    payload: dict,
    db: Session = Depends(get_db),
    _: None = Depends(_verify_service_token),
):
    user_id = payload.get('user_id')
    action = payload.get('action')
    source_id = payload.get('source_id')

    if not user_id or not action:
        error_response('MISSING_FIELDS', 'user_id and action are required.', status=400)

    rule = XP_TABLE.get(action)
    if not rule:
        error_response('UNKNOWN_ACTION', f'Action "{action}" is not a recognized XP action.', status=400)

    amount = rule['amount']
    daily_cap = rule['daily_cap']

    if daily_cap is not None:
        today_count = (
            db.query(XPLedger)
            .filter(
                XPLedger.user_id == user_id,
                XPLedger.source_type == action,
                XPLedger.created_at >= _midnight_utc(),
            )
            .count()
        )
        if today_count * amount >= daily_cap:
            return success_response({'awarded': 0, 'reason': 'daily_cap_reached'})

    # Anti-farm: reactions on own messages award no XP
    if action == 'message_reaction' and source_id:
        msg = db.query(Message).filter(Message.id == source_id).first()
        if not msg or str(msg.user_id) == str(user_id):
            return success_response({'awarded': 0, 'reason': 'self_reaction_blocked'})

    db.add(XPLedger(user_id=user_id, xp_amount=amount, source_type=action, source_id=source_id))

    master = db.query(MasterProfile).filter(MasterProfile.user_id == user_id).first()
    if master:
        master.xp_total = (master.xp_total or 0) + amount

    db.flush()
    level_changed = check_and_update_level(user_id, db)
    db.commit()

    return success_response({
        'awarded': amount,
        'new_total': master.xp_total if master else amount,
        'level_changed': level_changed,
    })


# ── Pro status endpoint ───────────────────────────────────────────────────────

@router.post('/award-pro-status')
def award_pro_status(
    payload: dict,
    db: Session = Depends(get_db),
    _: None = Depends(_verify_service_token),
):
    user_id = payload.get('user_id')
    tournament_id = payload.get('tournament_id')

    if not user_id or not tournament_id:
        error_response('MISSING_FIELDS', 'user_id and tournament_id are required.', status=400)

    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        error_response('TOURNAMENT_NOT_FOUND', 'Tournament not found.', status=404)
    if tournament.status != 'completed':
        error_response('TOURNAMENT_NOT_COMPLETED', 'Tournament has not been completed yet.', status=409)

    results = tournament.results_json or {}
    winner_id = str(results.get('winner_id', results.get('winner', '')))
    if winner_id != str(user_id):
        error_response('NOT_WINNER', 'User did not win this tournament.', status=403)

    master = db.query(MasterProfile).filter(MasterProfile.user_id == user_id).first()
    if not master:
        error_response('PROFILE_NOT_FOUND', 'Master profile not found.', status=404)

    old_level = master.platform_level
    master.platform_level = 'Pro'
    db.add(LevelHistory(user_id=user_id, old_level=old_level, new_level='Pro', reason='tournament_win'))
    _create_notification(
        db, user_id,
        notif_type='level_up',
        title='You are now Pro!',
        body='Your tournament victory has earned you Pro status on GzoneSphere.',
    )
    db.commit()

    return success_response({'promoted': True})


# ── Trust score endpoint ──────────────────────────────────────────────────────

@router.post('/recalculate-trust-scores')
def recalculate_trust_scores(
    payload: dict = None,
    db: Session = Depends(get_db),
    _: None = Depends(_verify_service_token),
):
    payload = payload or {}
    target_user_id = payload.get('user_id')

    if target_user_id:
        users = db.query(User).filter(User.id == target_user_id).all()
    else:
        users = db.query(User).all()

    for user in users:
        _recalculate_one(user, db)

    db.commit()
    return success_response({
        'recalculated': len(users),
        'timestamp': datetime.now(timezone.utc).isoformat(),
    })


def _recalculate_one(user: User, db: Session):
    user_id = user.id

    verified_skills = (
        db.query(UserSkill)
        .filter(UserSkill.user_id == user_id, UserSkill.is_verified == True)
        .count()
    )
    verified_skills_score = min(3.0, verified_skills * 0.3)

    accepted_answers = (
        db.query(Message)
        .filter(Message.user_id == user_id, Message.is_accepted_answer == True)
        .count()
    )
    featured_showcases = (
        db.query(ShowcasePost)
        .filter(ShowcasePost.user_id == user_id, ShowcasePost.is_featured == True)
        .count()
    )
    event_hosting = db.query(Event).filter(Event.created_by_user_id == user_id).count()
    community_quality_score = min(2.5, accepted_answers * 0.1 + featured_showcases * 0.2 + event_hosting * 0.3)

    valid_reports = db.query(UserViolation).filter(UserViolation.user_id == user_id).count()
    reports_penalty = -min(2.0, valid_reports * 0.15)

    created_at = user.created_at
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    days_old = (datetime.now(timezone.utc) - created_at).days
    account_age_score = min(1.0, days_old / 365.0)

    completed_collabs = (
        db.query(Collaboration)
        .filter(
            or_(
                Collaboration.initiator_user_id == user_id,
                Collaboration.collaborator_user_id == user_id,
            ),
            Collaboration.status == 'completed',
        )
        .count()
    )
    started_collabs = (
        db.query(Collaboration)
        .filter(
            or_(
                Collaboration.initiator_user_id == user_id,
                Collaboration.collaborator_user_id == user_id,
            )
        )
        .count()
    )
    rate = completed_collabs / started_collabs if started_collabs > 0 else 0
    collaboration_score = min(1.5, rate * 1.5)

    active_referrals = (
        db.query(func.count(func.distinct(XPLedger.source_id)))
        .filter(XPLedger.user_id == user_id, XPLedger.source_type == 'referral_active')
        .scalar()
        or 0
    )
    referral_score = min(1.0, active_referrals * 0.1)

    latest_manual = (
        db.query(TrustScoreHistory)
        .filter(TrustScoreHistory.user_id == user_id, TrustScoreHistory.source == 'admin_manual')
        .order_by(TrustScoreHistory.calculated_at.desc())
        .first()
    )
    manual_adjustment = float(latest_manual.manual_adjustment) if latest_manual and latest_manual.manual_adjustment else 0.0

    total = (
        verified_skills_score
        + community_quality_score
        + reports_penalty
        + account_age_score
        + collaboration_score
        + referral_score
        + manual_adjustment
    )
    trust_score = max(1.0, min(10.0, total + 5.0))

    db.add(TrustScoreHistory(
        user_id=user_id,
        verified_skills_score=round(verified_skills_score, 2),
        community_quality_score=round(community_quality_score, 2),
        reports_penalty=round(reports_penalty, 2),
        account_age_score=round(account_age_score, 2),
        collaboration_score=round(collaboration_score, 2),
        referral_score=round(referral_score, 2),
        manual_adjustment=round(manual_adjustment, 2),
        total_trust_score=round(trust_score, 1),
        source='auto_recalc',
    ))

    master = db.query(MasterProfile).filter(MasterProfile.user_id == user_id).first()
    if master:
        master.trust_score = round(trust_score, 1)
