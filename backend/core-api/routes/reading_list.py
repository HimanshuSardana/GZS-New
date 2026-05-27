"""
routes/reading_list.py — User reading list (saved blog articles).
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database import get_db
from models import ReadingListItem, User
from routes.auth import get_current_user, success_response, error_response

router = APIRouter()


@router.post("/{blog_slug}")
def save_blog(
    blog_slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(ReadingListItem).filter(
        ReadingListItem.user_id == current_user.id,
        ReadingListItem.blog_slug == blog_slug,
    ).first()

    if existing:
        return success_response({"saved": True, "already_saved": True})

    item = ReadingListItem(user_id=current_user.id, blog_slug=blog_slug)
    try:
        db.add(item)
        db.commit()
    except IntegrityError:
        db.rollback()
        return success_response({"saved": True, "already_saved": True})

    return success_response({"saved": True})


@router.delete("/{blog_slug}")
def unsave_blog(
    blog_slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deleted = db.query(ReadingListItem).filter(
        ReadingListItem.user_id == current_user.id,
        ReadingListItem.blog_slug == blog_slug,
    ).delete()
    db.commit()

    if deleted == 0:
        error_response("NOT_FOUND", "Item not in reading list.", status=404)

    return success_response({"saved": False})


@router.get("")
def get_reading_list(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = db.query(ReadingListItem).filter(
        ReadingListItem.user_id == current_user.id,
    ).order_by(ReadingListItem.saved_at.desc()).all()

    slugs = [item.blog_slug for item in items]
    return success_response({"items": slugs})
