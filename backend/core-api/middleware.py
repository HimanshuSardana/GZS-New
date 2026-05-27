"""
FastAPI middleware for authentication, error handling, and logging
"""
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp, Receive, Scope, Send
import logging
import time
from typing import Optional
from uuid import UUID

from auth import get_user_from_token, verify_token

logger = logging.getLogger(__name__)

class AuthMiddleware(BaseHTTPMiddleware):
    """Middleware to extract and validate JWT tokens from Authorization header"""
    
    async def dispatch(self, request: Request, call_next):
        # Skip auth check for public endpoints
        public_paths = ["/", "/health", "/docs", "/openapi.json", "/auth/signup", "/auth/login", "/auth/refresh"]
        if request.url.path in public_paths:
            return await call_next(request)
        
        # Extract token from Authorization header
        auth_header = request.headers.get("Authorization")
        
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing or invalid Authorization header"
            )
        
        token = auth_header[7:]  # Remove "Bearer " prefix
        
        try:
            user_id = get_user_from_token(token)
            if user_id is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token"
                )
            # Store in request state for later access
            request.state.user_id = user_id
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=str(e)
            )
        
        return await call_next(request)

class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """Global error handling middleware"""
    
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except HTTPException:
            raise
        except Exception as e:
            logger.exception(f"Unhandled exception: {e}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "success": False,
                    "message": "Internal server error",
                    "errors": [str(e)]
                }
            )

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        response = await call_next(request)
        duration_ms = int((time.time() - start) * 1000)
        client_ip = request.headers.get('x-forwarded-for', request.client.host if request.client else '-')
        logger.info(f"→ {request.method} {request.url.path} | {response.status_code} | {duration_ms}ms | {client_ip}")
        return response

def get_current_user(request: Request) -> Optional[UUID]:
    """Dependency to get current authenticated user"""
    user_id = getattr(request.state, "user_id", None)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    return user_id

def require_admin(request: Request):
    """Dependency to enforce admin role (will be expanded with DB checks)"""
    # TODO: Check user role in database
    user_id = get_current_user(request)
    return user_id

def require_superadmin(request: Request):
    """Dependency to enforce super-admin role"""
    # TODO: Check user role in database
    user_id = get_current_user(request)
    return user_id
