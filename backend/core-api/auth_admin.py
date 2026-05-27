"""
auth_admin.py — Role-based access control dependency factory for admin routes.

Usage:
    from auth_admin import require_admin, require_super_admin, require_moderator, require_analytics

    @router.get("/admin/users")
    def list_users(admin: User = Depends(require_admin)):
        ...
"""
from fastapi import Depends, HTTPException, status
from models import User
from routes.auth import get_current_user


def require_role(*allowed_roles: str):
    """
    Returns a FastAPI dependency that enforces role-based access.
    Resolves to the authenticated User object on success.
    Returns 403 with structured error on failure.
    """
    async def _dependency(current_user: User = Depends(get_current_user)) -> User:
        user_role = getattr(current_user, "role", "user") or "user"
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "data": None,
                    "error": {
                        "code": "INSUFFICIENT_ROLE",
                        "message": (
                            f"This endpoint requires one of: {list(allowed_roles)}. "
                            f"Your role: '{user_role}'."
                        ),
                        "details": {
                            "required_roles": list(allowed_roles),
                            "current_role": user_role,
                        },
                    },
                },
            )
        account_status = getattr(current_user, "account_status", "active") or "active"
        if account_status in ("banned", "deleted"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "data": None,
                    "error": {
                        "code": "ACCOUNT_INACTIVE",
                        "message": f"Account is '{account_status}' and cannot perform admin actions.",
                        "details": {},
                    },
                },
            )
        return current_user
    return _dependency


require_admin       = require_role("admin", "super_admin")
require_super_admin = require_role("super_admin")
require_moderator   = require_role("admin", "super_admin", "moderator")
require_analytics   = require_role("admin", "super_admin", "analytics_viewer")
