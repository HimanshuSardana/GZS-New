-- 001_initial.sql
-- GzoneSphere core schema — Phase 1
-- Tables: users, games, tournaments
-- Apply first on a fresh database.
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    username      VARCHAR(50)  UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT         NOT NULL,
    trust_level   DECIMAL(3,2) DEFAULT 1.0,
    created_at    TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profiles (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    bio         TEXT,
    avatar_url  TEXT,
    banner_url  TEXT,
    facade_type VARCHAR(20) DEFAULT 'individual',
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS games (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    slug              VARCHAR(100) UNIQUE NOT NULL,
    title             VARCHAR(255) NOT NULL,
    description       TEXT,
    short_description TEXT,
    developer         VARCHAR(100),
    publisher         VARCHAR(100),
    release_date      DATE,
    status            VARCHAR(20) DEFAULT 'draft',
    is_featured       BOOLEAN     DEFAULT FALSE,
    view_count        INTEGER     DEFAULT 0,
    created_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tournaments (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id     UUID        REFERENCES games(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    prize_pool  VARCHAR(100),
    start_date  TIMESTAMPTZ,
    end_date    TIMESTAMPTZ,
    status      VARCHAR(20) DEFAULT 'upcoming',
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_games_slug      ON games(slug);
CREATE INDEX IF NOT EXISTS idx_users_username  ON users(username);
