from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from logging.handlers import RotatingFileHandler
import sys
import os
from dotenv import load_dotenv

load_dotenv()

from routes import (
    auth, profiles, users, tournaments, social, companies, community,
    messages, notifications, reading_list, progression,
    admin_dashboard, admin_users, admin_verifications, admin_audit,
)
from middleware import ErrorHandlerMiddleware, LoggingMiddleware
from database import init_db, get_db_status


def setup_logging() -> None:
    fmt = logging.Formatter('%(asctime)s %(levelname)-8s %(name)s — %(message)s')

    stream_handler = logging.StreamHandler(
        open(sys.stdout.fileno(), mode='w', encoding='utf-8', closefd=False)
    )
    stream_handler.setFormatter(fmt)

    file_handler = RotatingFileHandler(
        'core-api.log', maxBytes=5 * 1024 * 1024, backupCount=3, encoding='utf-8'
    )
    file_handler.setFormatter(fmt)

    root = logging.getLogger()
    root.setLevel(logging.INFO)
    root.addHandler(stream_handler)
    root.addHandler(file_handler)

    for noisy in ('uvicorn.access', 'sqlalchemy.engine', 'passlib'):
        logging.getLogger(noisy).setLevel(logging.WARNING)


setup_logging()
logger = logging.getLogger(__name__)

app = FastAPI(
    title="GzoneSphere Core API",
    version="2.0.0",
    description="Phase 2: Authentication, Profiles, Tournaments, Social & Companies"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(LoggingMiddleware)
app.add_middleware(ErrorHandlerMiddleware)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(profiles.router, prefix="/profiles", tags=["Profiles"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(tournaments.router, prefix="/tournaments", tags=["Tournaments"])
app.include_router(social.router, prefix="", tags=["Social"])
app.include_router(companies.router, prefix="/companies", tags=["Companies"])
app.include_router(community.router, prefix="/community", tags=["Community"])
app.include_router(messages.router, prefix="/messages", tags=["Messages"])
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
app.include_router(reading_list.router, prefix="/reading-list", tags=["Reading List"])
app.include_router(progression.router, prefix="/progression", tags=["Progression"])
app.include_router(admin_dashboard.router,     prefix="/admin", tags=["Admin — Dashboard"])
app.include_router(admin_users.router,         prefix="/admin", tags=["Admin — Users"])
app.include_router(admin_verifications.router, prefix="/admin", tags=["Admin — Verifications"])
app.include_router(admin_audit.router,         prefix="/admin", tags=["Admin — Audit"])


def _cleanup_reserved_usernames(db):
    from datetime import datetime, timezone
    from models import ReservedUsername
    try:
        db.query(ReservedUsername).filter(
            ReservedUsername.reserved_until < datetime.now(timezone.utc)
        ).delete(synchronize_session=False)
        db.commit()
        logger.info("Expired reserved usernames cleaned up")
    except Exception as exc:
        logger.warning(f"Reserved username cleanup failed: {exc}")
        db.rollback()


"""
PATCH FOR: backend/core-api/main.py

Replace the existing startup_event() function with this version.
This fixes:
  1. Seed runs ONLY when the database is genuinely empty
  2. Branch seeding is always idempotent (runs in all environments)
  3. No crash on second startup due to UniqueViolation
"""

# ─── REPLACE the existing @app.on_event("startup") block with this: ───────────

@app.on_event("startup")
async def startup_event():
    """Initialize database and seed default data on startup."""
    import os
    from sqlalchemy import func
    from database import SessionLocal
    
    db: Session = SessionLocal()
    try:
        env = os.getenv("ENV", "production")
        logger.info(f"[startup] environment: {env}")

        # ── Step 1: Always seed community branches (idempotent) ──
        # This is safe in all environments — creates branches that don't exist,
        # skips ones that do.
        from routes.community import seed_branches as seed_community_branches
        seed_community_branches(db)
        logger.info("[startup] community branches: OK")

        # ── Step 2: Seed demo data ONLY in development AND only when empty ──
        # This prevents the UniqueViolation crash on second startup.
        if env == "development":
            user_count = db.query(func.count(User.id)).scalar() or 0
            if user_count == 0:
                logger.info("[startup] empty database detected — running full seed")
                from seed_data import run_all_seeds
                result = run_all_seeds(db)
                logger.info(f"[startup] seed complete: {result}")
            else:
                logger.info(f"[startup] {user_count} users found — skipping demo seed")

    except Exception as e:
        logger.error(f"[startup] initialization error: {e}", exc_info=True)
        # Don't crash the server — log and continue
    finally:
        db.close()


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "GzoneSphere Core API v2.0 Operational",
        "status": "ONLINE",
        "version": "2.0.0",
        "phase": "Phase 2: Authentication"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    db_status = get_db_status()
    return {
        "status": "healthy" if db_status["connected"] else "degraded",
        "service": "GzoneSphere Core API",
        "version": "2.0.0",
        "db_status": db_status,
    }
