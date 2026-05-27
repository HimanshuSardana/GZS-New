"""
Database configuration and connection setup
"""
import os
import time
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://gzs_core_user:Gzone123%40@localhost:5432/GzoneSphere"
)

_db_healthy = False


def create_db_engine(retries: int = 10, delay: int = 3):
    for attempt in range(1, retries + 1):
        try:
            engine = create_engine(
                DATABASE_URL,
                poolclass=NullPool if os.getenv("ENV") == "development" else None,
                echo=os.getenv("SQL_ECHO", "false").lower() == "true",
                future=True,
                pool_pre_ping=True,
            )
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info(f"✅ PostgreSQL connected on attempt {attempt}")
            return engine
        except Exception as exc:
            logger.warning(f"⚠️  DB connect attempt {attempt}/{retries} failed: {exc}")
            if attempt < retries:
                time.sleep(delay)
    logger.critical("❌ Could not connect to PostgreSQL after all retries. Exiting.")
    raise RuntimeError("Database connection failed")


engine = create_db_engine()

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False
)


def get_db():
    """Dependency for FastAPI to inject DB session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_status() -> dict:
    global _db_healthy
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        _db_healthy = True
        return {"connected": True, "url": DATABASE_URL.split("@")[-1]}
    except Exception as exc:
        _db_healthy = False
        return {"connected": False, "error": str(exc)}


def init_db():
    """Initialize database tables and run migrations"""
    from models import Base
    Base.metadata.create_all(bind=engine)
    run_migrations()
    logger.info("✅ All tables created / verified")


def run_migrations():
    """Incremental schema migrations — safe to run on every startup"""
    migrations = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS gzs_coins FLOAT DEFAULT 0",
        "ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS highlights JSON DEFAULT '[]'",
        "ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS stages JSON DEFAULT '[]'",
        "ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS important_notes TEXT",
        "ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS prize_distribution JSON DEFAULT '[]'",
        "ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS prize_distribution_policy TEXT",
        "ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS bracket_announcement TIMESTAMP WITH TIME ZONE",
        "ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS check_in_start TIMESTAMP WITH TIME ZONE",
        "ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS check_in_end TIMESTAMP WITH TIME ZONE",
        "ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS expected_duration VARCHAR(100)",
        "ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS organizer_user_id UUID REFERENCES users(id)",
        "ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS full_rules_document TEXT",
        "ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS custom_registration_fields JSON DEFAULT '[]'",
        "ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS platforms JSON DEFAULT '[]'",
        "ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS estimated_match_duration VARCHAR(100)",
        "ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS overtime_rules TEXT",
        "ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS reschedule_policy TEXT",
        "ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS noshow_rule TEXT",
        "ALTER TABLE master_profiles ADD COLUMN IF NOT EXISTS xp_total INTEGER DEFAULT 0",
        "ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_accepted_answer BOOLEAN DEFAULT FALSE",
        "ALTER TABLE trust_score_history ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'auto_recalc'",
        "ALTER TABLE trust_score_history ADD COLUMN IF NOT EXISTS manual_adjustment NUMERIC(5,2) DEFAULT 0",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE",
        "ALTER TABLE showcase_posts ADD COLUMN IF NOT EXISTS is_weekly_winner BOOLEAN DEFAULT FALSE",
        "ALTER TABLE showcase_posts ADD COLUMN IF NOT EXISTS winner_week TIMESTAMP WITH TIME ZONE",
        "ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_featured_today BOOLEAN DEFAULT FALSE",
        "ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE",
        "ALTER TABLE messages ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP WITH TIME ZONE",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending_approval'",
        "CREATE TABLE IF NOT EXISTS event_reminders (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), event_id UUID REFERENCES events(id), user_id UUID REFERENCES users(id), remind_minutes_before INTEGER NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), UNIQUE(user_id, event_id))",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user'",
        "UPDATE users SET role = 'super_admin' WHERE username = 'gzs_admin' AND role = 'user'",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) NOT NULL DEFAULT 'active'",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_anonymised BOOLEAN NOT NULL DEFAULT FALSE",
        "CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)",
        "CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status)",
    ]
    with engine.connect() as conn:
        for sql in migrations:
            try:
                conn.execute(text(sql))
            except Exception:
                pass
        conn.commit()


def drop_all_tables():
    """Drop all tables (use with caution)"""
    from models import Base
    Base.metadata.drop_all(bind=engine)
