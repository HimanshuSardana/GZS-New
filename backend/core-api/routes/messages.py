"""
routes/messages.py — Direct messaging between users.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, and_
from typing import Optional
from uuid import UUID
from datetime import datetime

from database import get_db
from models import User, MasterProfile, DirectConversation, DirectMessage
from routes.auth import get_current_user, success_response, error_response

router = APIRouter()


def _author(user_id, db: Session) -> dict:
    mp = db.query(MasterProfile).filter(MasterProfile.user_id == user_id).first()
    return {
        "user_id": str(user_id),
        "username": mp.username if mp else "unknown",
        "display_name": mp.real_name if mp else None,
        "avatar_url": mp.avatar_url if mp else None,
    }


def _conversation_dict(conv: DirectConversation, current_user_id, db: Session, last_msg=None) -> dict:
    other_id = conv.user2_id if conv.user1_id == current_user_id else conv.user1_id
    return {
        "id": str(conv.id),
        "other_user": _author(other_id, db),
        "created_at": conv.created_at,
        "last_message_at": conv.last_message_at,
        "last_message": last_msg,
    }


def _get_or_none(conv_id, user_id, db: Session):
    """Returns conversation only if the user is a participant."""
    return db.query(DirectConversation).filter(
        DirectConversation.id == conv_id,
        or_(
            DirectConversation.user1_id == user_id,
            DirectConversation.user2_id == user_id,
        ),
    ).first()


# ─── CONVERSATIONS ────────────────────────────────────────────────────────────

@router.get("/conversations")
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        convs = db.query(DirectConversation).filter(
            or_(
                DirectConversation.user1_id == current_user.id,
                DirectConversation.user2_id == current_user.id,
            )
        ).order_by(desc(DirectConversation.last_message_at)).all()

        result = []
        for conv in convs:
            last_msg = db.query(DirectMessage).filter(
                DirectMessage.conversation_id == conv.id
            ).order_by(desc(DirectMessage.created_at)).first()

            last_msg_data = None
            if last_msg:
                last_msg_data = {
                    "content": last_msg.content,
                    "sender_id": str(last_msg.sender_id),
                    "created_at": last_msg.created_at,
                    "read_at": last_msg.read_at,
                }

            result.append(_conversation_dict(conv, current_user.id, db, last_msg_data))

        return success_response(result)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── MESSAGE HISTORY ─────────────────────────────────────────────────────────

@router.get("/{conversation_id}")
def get_conversation_messages(
    conversation_id: UUID,
    before: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        conv = _get_or_none(conversation_id, current_user.id, db)
        if not conv:
            error_response("NOT_FOUND", "Conversation not found or access denied.", status=404)

        q = db.query(DirectMessage).filter(DirectMessage.conversation_id == conversation_id)
        if before:
            try:
                before_dt = datetime.fromisoformat(before)
                q = q.filter(DirectMessage.created_at < before_dt)
            except ValueError:
                pass

        msgs = q.order_by(desc(DirectMessage.created_at)).limit(limit).all()
        msgs.reverse()

        # Mark unread messages from the other user as read
        other_id = conv.user2_id if conv.user1_id == current_user.id else conv.user1_id
        db.query(DirectMessage).filter(
            DirectMessage.conversation_id == conversation_id,
            DirectMessage.sender_id == other_id,
            DirectMessage.read_at == None,
        ).update({"read_at": datetime.utcnow()})
        db.commit()

        return success_response({
            "conversation_id": str(conversation_id),
            "other_user": _author(other_id, db),
            "messages": [
                {
                    "id": str(m.id),
                    "sender_id": str(m.sender_id),
                    "content": m.content,
                    "created_at": m.created_at,
                    "read_at": m.read_at,
                }
                for m in msgs
            ],
        })
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── SEND MESSAGE ─────────────────────────────────────────────────────────────

@router.post("/{conversation_id}", status_code=201)
def send_message(
    conversation_id: UUID,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        conv = _get_or_none(conversation_id, current_user.id, db)
        if not conv:
            error_response("NOT_FOUND", "Conversation not found or access denied.", status=404)

        content = (payload.get("content") or "").strip()
        if not content:
            error_response("EMPTY_MESSAGE", "Message content cannot be empty.", status=400)

        msg = DirectMessage(
            conversation_id=conversation_id,
            sender_id=current_user.id,
            content=content,
        )
        db.add(msg)
        conv.last_message_at = datetime.utcnow()
        db.commit()
        db.refresh(msg)

        return success_response({
            "id": str(msg.id),
            "conversation_id": str(msg.conversation_id),
            "sender_id": str(msg.sender_id),
            "content": msg.content,
            "created_at": msg.created_at,
        })
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── START CONVERSATION ───────────────────────────────────────────────────────

@router.post("/start/{username}", status_code=201)
def start_conversation(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        target_user = db.query(User).filter(User.username == username).first()
        if not target_user:
            error_response("NOT_FOUND", f"User '{username}' not found.", status=404)
        if target_user.id == current_user.id:
            error_response("INVALID_REQUEST", "Cannot start a conversation with yourself.", status=400)

        # Check if conversation already exists (either direction)
        existing = db.query(DirectConversation).filter(
            or_(
                and_(
                    DirectConversation.user1_id == current_user.id,
                    DirectConversation.user2_id == target_user.id,
                ),
                and_(
                    DirectConversation.user1_id == target_user.id,
                    DirectConversation.user2_id == current_user.id,
                ),
            )
        ).first()

        if existing:
            return success_response({
                "conversation_id": str(existing.id),
                "existing": True,
                "other_user": _author(target_user.id, db),
            })

        conv = DirectConversation(user1_id=current_user.id, user2_id=target_user.id)
        db.add(conv)
        db.commit()
        db.refresh(conv)

        return success_response({
            "conversation_id": str(conv.id),
            "existing": False,
            "other_user": _author(target_user.id, db),
        })
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)
