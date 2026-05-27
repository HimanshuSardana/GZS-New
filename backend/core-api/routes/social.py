"""
routes/social.py — Social feed, posts, likes, comments, follows, friends
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from uuid import UUID
from datetime import datetime

from database import get_db
from models import (
    User, MasterProfile, SubProfile,
    Post, PostLike, PostComment,
    Follow, Connection, FriendRequest, UserBlock,
)
from routes.auth import get_current_user, success_response, error_response
from schemas import PostCreate, PostCommentCreate

router = APIRouter()


def _post_dict(post: Post, liked_by_me: bool = False, author: dict = None) -> dict:
    return {
        "id": str(post.id),
        "user_id": str(post.user_id),
        "sub_profile_type": post.sub_profile_type,
        "content": post.content,
        "media_urls": post.media_urls or [],
        "like_count": post.like_count,
        "comment_count": post.comment_count,
        "created_at": post.created_at,
        "liked_by_me": liked_by_me,
        "author": author,
    }


def _get_author(user_id, db: Session) -> dict:
    mp = db.query(MasterProfile).filter(MasterProfile.user_id == user_id).first()
    if not mp:
        return {"username": "unknown", "avatar_url": None, "display_name": None}
    return {
        "username": mp.username,
        "display_name": mp.real_name,
        "avatar_url": mp.avatar_url,
    }


# ─── POSTS ───────────────────────────────────────────────────────────────────

@router.post("/posts", status_code=201)
def create_post(
    payload: PostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        post = Post(
            user_id=current_user.id,
            sub_profile_type=payload.sub_profile_type,
            content=payload.content,
            media_urls=payload.media_urls or [],
        )
        db.add(post)
        db.commit()
        db.refresh(post)
        return success_response(_post_dict(post, author=_get_author(current_user.id, db)))
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Could not create post.", {"details": str(e)}, status=503)


@router.get("/posts/feed")
def get_feed(
    cursor: Optional[str] = None,
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns posts from followed users + own posts, cursor paginated."""
    try:
        # Get followed user IDs
        followed_ids = [
            f.followed_user_id
            for f in db.query(Follow).filter(Follow.follower_user_id == current_user.id).all()
        ]
        feed_user_ids = list(set(followed_ids + [current_user.id]))

        q = db.query(Post).filter(Post.user_id.in_(feed_user_ids))
        if cursor:
            try:
                cursor_dt = datetime.fromisoformat(cursor)
                q = q.filter(Post.created_at < cursor_dt)
            except ValueError:
                pass

        posts = q.order_by(desc(Post.created_at)).limit(limit).all()

        # Get liked post IDs for current user
        liked_ids = {
            str(pl.post_id)
            for pl in db.query(PostLike).filter(PostLike.user_id == current_user.id).all()
        }

        items = [
            _post_dict(p, liked_by_me=str(p.id) in liked_ids, author=_get_author(p.user_id, db))
            for p in posts
        ]

        next_cursor = posts[-1].created_at.isoformat() if posts else None
        return success_response({"items": items, "next_cursor": next_cursor, "count": len(items)})
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.get("/posts/user/{username}")
def get_user_posts(
    username: str,
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            error_response("NOT_FOUND", "User not found.", status=404)
        posts = db.query(Post).filter(Post.user_id == user.id)\
            .order_by(desc(Post.created_at)).offset(offset).limit(limit).all()
        author = _get_author(user.id, db)
        return success_response([_post_dict(p, author=author) for p in posts])
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.get("/posts/user/{username}/{sub_type}")
def get_user_posts_by_domain(
    username: str,
    sub_type: str,
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            error_response("NOT_FOUND", "User not found.", status=404)
        posts = db.query(Post).filter(
            Post.user_id == user.id,
            Post.sub_profile_type == sub_type,
        ).order_by(desc(Post.created_at)).offset(offset).limit(limit).all()
        author = _get_author(user.id, db)
        return success_response([_post_dict(p, author=author) for p in posts])
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.post("/posts/{post_id}/like")
def toggle_like(
    post_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            error_response("NOT_FOUND", "Post not found.", status=404)

        existing = db.query(PostLike).filter(
            PostLike.post_id == post_id,
            PostLike.user_id == current_user.id,
        ).first()

        if existing:
            db.delete(existing)
            post.like_count = max(0, (post.like_count or 0) - 1)
            liked = False
        else:
            db.add(PostLike(post_id=post_id, user_id=current_user.id))
            post.like_count = (post.like_count or 0) + 1
            liked = True

        db.commit()
        return success_response({"liked": liked, "like_count": post.like_count})
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.post("/posts/{post_id}/comment", status_code=201)
def add_comment(
    post_id: UUID,
    payload: PostCommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            error_response("NOT_FOUND", "Post not found.", status=404)

        comment = PostComment(
            post_id=post_id,
            user_id=current_user.id,
            content=payload.content,
            parent_comment_id=payload.parent_comment_id,
        )
        db.add(comment)
        post.comment_count = (post.comment_count or 0) + 1
        db.commit()
        db.refresh(comment)
        return success_response({
            "id": str(comment.id),
            "post_id": str(comment.post_id),
            "user_id": str(comment.user_id),
            "content": comment.content,
            "parent_comment_id": str(comment.parent_comment_id) if comment.parent_comment_id else None,
            "like_count": comment.like_count,
            "created_at": comment.created_at,
        })
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.delete("/posts/{post_id}", status_code=204)
def delete_post(
    post_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            return None
        if post.user_id != current_user.id and getattr(current_user, "role", None) != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to delete this post.")
        db.delete(post)
        db.commit()
        return None
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


# ─── SOCIAL / FRIENDS ────────────────────────────────────────────────────────

@router.get("/social/friends")
def get_friends(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        accepted = db.query(Connection).filter(
            (
                (Connection.requester_user_id == current_user.id) |
                (Connection.recipient_user_id == current_user.id)
            ),
            Connection.status == "accepted",
        ).all()

        friend_ids = [
            c.recipient_user_id if c.requester_user_id == current_user.id else c.requester_user_id
            for c in accepted
        ]

        friends = []
        for fid in friend_ids:
            mp = db.query(MasterProfile).filter(MasterProfile.user_id == fid).first()
            if mp:
                friends.append({
                    "user_id": str(fid),
                    "username": mp.username,
                    "display_name": mp.real_name,
                    "avatar_url": mp.avatar_url,
                })

        return success_response(friends)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.post("/social/friends/{user_id}/request", status_code=201)
def send_friend_request(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        if user_id == current_user.id:
            error_response("INVALID_REQUEST", "Cannot send friend request to yourself.", status=400)

        existing = db.query(FriendRequest).filter(
            FriendRequest.from_user_id == current_user.id,
            FriendRequest.to_user_id == user_id,
            FriendRequest.status == "pending",
        ).first()
        if existing:
            error_response("ALREADY_SENT", "Friend request already pending.", status=409)

        req = FriendRequest(from_user_id=current_user.id, to_user_id=user_id)
        db.add(req)
        db.commit()
        db.refresh(req)
        return success_response({
            "id": str(req.id),
            "to_user_id": str(req.to_user_id),
            "status": req.status,
            "created_at": req.created_at,
        })
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.post("/social/friends/{request_id}/accept")
def accept_friend_request(
    request_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        req = db.query(FriendRequest).filter(
            FriendRequest.id == request_id,
            FriendRequest.to_user_id == current_user.id,
            FriendRequest.status == "pending",
        ).first()
        if not req:
            error_response("NOT_FOUND", "Friend request not found.", status=404)

        req.status = "accepted"

        # Create connection record
        conn = Connection(
            requester_user_id=req.from_user_id,
            recipient_user_id=req.to_user_id,
            status="accepted",
            responded_at=datetime.utcnow(),
        )
        db.add(conn)
        db.commit()
        return success_response({"message": "Friend request accepted.", "request_id": str(req.id)})
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.post("/social/follow/{user_id}")
def toggle_follow(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        if user_id == current_user.id:
            error_response("INVALID_REQUEST", "Cannot follow yourself.", status=400)

        existing = db.query(Follow).filter(
            Follow.follower_user_id == current_user.id,
            Follow.followed_user_id == user_id,
        ).first()

        if existing:
            db.delete(existing)
            db.commit()
            return success_response({"following": False, "user_id": str(user_id)})
        else:
            db.add(Follow(follower_user_id=current_user.id, followed_user_id=user_id))
            db.commit()
            return success_response({"following": True, "user_id": str(user_id)})
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.delete("/social/friend-requests/{request_id}")
def decline_friend_request(
    request_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Decline an incoming friend request."""
    try:
        req = db.query(FriendRequest).filter(
            FriendRequest.id == request_id,
            FriendRequest.to_user_id == current_user.id,
        ).first()
        if req:
            db.delete(req)
            db.commit()
        return success_response({"declined": True})
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.post("/social/block/{user_id}")
def block_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Block a user and remove all mutual friend/follow relationships."""
    try:
        if user_id == current_user.id:
            error_response("INVALID_REQUEST", "Cannot block yourself.", status=400)

        # Create block record (ignore if already exists)
        existing = db.query(UserBlock).filter(
            UserBlock.blocker_id == current_user.id,
            UserBlock.blocked_id == user_id,
        ).first()
        if not existing:
            db.add(UserBlock(blocker_id=current_user.id, blocked_id=user_id))

        # Remove any Connection between the two users
        db.query(Connection).filter(
            (
                (Connection.requester_user_id == current_user.id) & (Connection.recipient_user_id == user_id)
            ) | (
                (Connection.requester_user_id == user_id) & (Connection.recipient_user_id == current_user.id)
            )
        ).delete(synchronize_session=False)

        # Remove Follow records in both directions
        db.query(Follow).filter(
            (
                (Follow.follower_user_id == current_user.id) & (Follow.followed_user_id == user_id)
            ) | (
                (Follow.follower_user_id == user_id) & (Follow.followed_user_id == current_user.id)
            )
        ).delete(synchronize_session=False)

        # Remove pending FriendRequests in both directions
        db.query(FriendRequest).filter(
            (
                (FriendRequest.from_user_id == current_user.id) & (FriendRequest.to_user_id == user_id)
            ) | (
                (FriendRequest.from_user_id == user_id) & (FriendRequest.to_user_id == current_user.id)
            )
        ).delete(synchronize_session=False)

        db.commit()
        return success_response({"blocked": True})
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        db.rollback()
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.get("/social/blocked")
def get_blocked_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all users blocked by the current user."""
    try:
        blocks = db.query(UserBlock).filter(UserBlock.blocker_id == current_user.id).all()
        result = []
        for block in blocks:
            mp = db.query(MasterProfile).filter(MasterProfile.user_id == block.blocked_id).first()
            result.append({
                "user_id": str(block.blocked_id),
                "username": mp.username if mp else None,
                "display_name": mp.real_name if mp else None,
                "avatar_url": mp.avatar_url if mp else None,
                "blocked_at": block.created_at,
            })
        return success_response(result)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)


@router.get("/social/suggestions")
def get_suggestions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Suggest users to follow based on shared sub-profile domains."""
    try:
        my_domains = [
            sp.domain
            for sp in db.query(SubProfile).filter(SubProfile.user_id == current_user.id).all()
        ]

        already_followed = {
            str(f.followed_user_id)
            for f in db.query(Follow).filter(Follow.follower_user_id == current_user.id).all()
        }

        candidates = db.query(SubProfile).filter(
            SubProfile.domain.in_(my_domains),
            SubProfile.user_id != current_user.id,
        ).limit(50).all()

        seen = set()
        suggestions = []
        for sp in candidates:
            uid = str(sp.user_id)
            if uid in already_followed or uid in seen:
                continue
            seen.add(uid)
            mp = db.query(MasterProfile).filter(MasterProfile.user_id == sp.user_id).first()
            if mp:
                suggestions.append({
                    "user_id": uid,
                    "username": mp.username,
                    "display_name": mp.real_name,
                    "avatar_url": mp.avatar_url,
                    "shared_domain": sp.domain,
                    "primary_role": sp.primary_role,
                })
            if len(suggestions) >= 10:
                break

        return success_response(suggestions)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_response("DB_ERROR", "Database unavailable.", {"details": str(e)}, status=503)
