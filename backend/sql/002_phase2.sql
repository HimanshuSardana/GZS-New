-- 002_phase2.sql
-- GzoneSphere core schema — Phase 2
-- Tables: master_profiles, sub_profiles, skills, community, admin, social, trust, companies
-- Requires: 001_initial.sql already applied.
-- Idempotent: safe to re-run.

-- ── Rename legacy table (no-op if already renamed) ─────────────────────────
ALTER TABLE IF EXISTS profiles RENAME TO master_profiles;

-- ── Master profile (one per user) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS master_profiles (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID        UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    username              VARCHAR(50) UNIQUE NOT NULL,
    real_name             VARCHAR(100),
    avatar_url            TEXT,
    banner_url            TEXT,
    location              VARCHAR(100),
    platform_level        VARCHAR(20) DEFAULT 'Beginner',
    trust_score           DECIMAL(3,1) DEFAULT 5.0,
    verified_checkmark    BOOLEAN     DEFAULT FALSE,
    bio                   TEXT,
    created_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    username_changed_at   TIMESTAMPTZ,
    username_change_count INT         DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sub_profiles (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID        REFERENCES users(id) ON DELETE CASCADE,
    domain           VARCHAR(20) NOT NULL,
    username         VARCHAR(50) NOT NULL,
    primary_role     VARCHAR(100),
    featured_roles   TEXT[],
    headline         VARCHAR(80),
    experience_level VARCHAR(20),
    bio              TEXT,
    avatar_url       TEXT,
    visibility       VARCHAR(20) DEFAULT 'public',
    status           VARCHAR(20) DEFAULT 'Active',
    created_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, domain)
);

-- ── Skills & verification ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skills_taxonomy (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) UNIQUE NOT NULL,
    domain      VARCHAR(20) NOT NULL,
    category    VARCHAR(100),
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_skills (
    id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    sub_profile_id           UUID        REFERENCES sub_profiles(id) ON DELETE CASCADE,
    skill_id                 UUID        REFERENCES skills_taxonomy(id),
    is_verified              BOOLEAN     DEFAULT FALSE,
    verification_method      VARCHAR(50),
    verification_proof_url   TEXT,
    verification_proof_text  TEXT,
    verified_by_user_id      UUID        REFERENCES users(id),
    verified_at              TIMESTAMPTZ,
    created_at               TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS verification_queue (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_skill_id        UUID        REFERENCES user_skills(id) ON DELETE CASCADE,
    submitted_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    reviewed_by_user_id  UUID        REFERENCES users(id),
    status               VARCHAR(20) DEFAULT 'pending',
    reviewer_notes       TEXT,
    reviewed_at          TIMESTAMPTZ,
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ── Profile content ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tools (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    sub_profile_id   UUID        REFERENCES sub_profiles(id) ON DELETE CASCADE,
    tool_name        VARCHAR(100),
    category         VARCHAR(50),
    proficiency_level VARCHAR(20),
    created_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    sub_profile_id    UUID        REFERENCES sub_profiles(id) ON DELETE CASCADE,
    title             VARCHAR(255),
    description       TEXT,
    media_urls        TEXT[],
    skills_demonstrated TEXT[],
    team_size         VARCHAR(50),
    year              INT,
    demo_url          TEXT,
    source_code_url   TEXT,
    genre             VARCHAR(50),
    engine_used       VARCHAR(100),
    platforms         TEXT[],
    created_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS availability (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    sub_profile_id          UUID        UNIQUE REFERENCES sub_profiles(id) ON DELETE CASCADE,
    timezone                VARCHAR(50),
    collaboration_type      VARCHAR(50),
    weekly_hours_available  VARCHAR(50),
    rate_range_start        INT,
    rate_range_end          INT,
    rate_currency           VARCHAR(10),
    visible_to_others       BOOLEAN     DEFAULT FALSE,
    created_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ── Community ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_branches (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    slug             VARCHAR(50) UNIQUE NOT NULL,
    name             VARCHAR(100),
    description      TEXT,
    icon_url         TEXT,
    color_accent     VARCHAR(20),
    status           VARCHAR(20) DEFAULT 'Active',
    moderation_level VARCHAR(20) DEFAULT 'Standard',
    member_count     INT         DEFAULT 0,
    created_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS community_members (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id      UUID        REFERENCES community_branches(id) ON DELETE CASCADE,
    user_id        UUID        REFERENCES users(id) ON DELETE CASCADE,
    sub_profile_id UUID        REFERENCES sub_profiles(id),
    joined_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    opted_out      BOOLEAN     DEFAULT FALSE,
    role           VARCHAR(20) DEFAULT 'member',
    UNIQUE(branch_id, user_id)
);

CREATE TABLE IF NOT EXISTS channels (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID        REFERENCES community_branches(id) ON DELETE CASCADE,
    name            VARCHAR(100),
    description     TEXT,
    channel_type    VARCHAR(20) DEFAULT 'text',
    slowmode_seconds INT        DEFAULT 0,
    min_level_to_post VARCHAR(20) DEFAULT 'Beginner',
    is_default      BOOLEAN     DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id     UUID        REFERENCES channels(id) ON DELETE CASCADE,
    user_id        UUID        REFERENCES users(id) ON DELETE SET NULL,
    sub_profile_id UUID        REFERENCES sub_profiles(id),
    content        TEXT,
    media_urls     TEXT[],
    edited_at      TIMESTAMPTZ,
    deleted_at     TIMESTAMPTZ,
    created_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS message_reactions (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID        REFERENCES messages(id) ON DELETE CASCADE,
    user_id    UUID        REFERENCES users(id) ON DELETE CASCADE,
    emoji_name VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id, emoji_name)
);

CREATE TABLE IF NOT EXISTS groups (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id          UUID        REFERENCES community_branches(id) ON DELETE CASCADE,
    name               VARCHAR(100),
    description        TEXT,
    is_public          BOOLEAN     DEFAULT TRUE,
    max_members        INT         DEFAULT 100,
    member_count       INT         DEFAULT 0,
    cover_image_url    TEXT,
    created_by_user_id UUID        REFERENCES users(id),
    created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS group_members (
    id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id  UUID        REFERENCES groups(id) ON DELETE CASCADE,
    user_id   UUID        REFERENCES users(id) ON DELETE CASCADE,
    role      VARCHAR(20) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS lfg_posts (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id           UUID        REFERENCES community_branches(id) ON DELETE CASCADE,
    user_id             UUID        REFERENCES users(id) ON DELETE CASCADE,
    sub_profile_id      UUID        REFERENCES sub_profiles(id),
    goal_type           VARCHAR(50),
    description         TEXT,
    required_skills     TEXT[],
    availability_window VARCHAR(50),
    availability_date   TIMESTAMPTZ,
    timezone            VARCHAR(50),
    platform_type       VARCHAR(50),
    contact_preference  VARCHAR(50),
    contact_url         TEXT,
    auto_expire         BOOLEAN     DEFAULT TRUE,
    expires_at          TIMESTAMPTZ,
    is_active           BOOLEAN     DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS showcase_posts (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id      UUID        REFERENCES community_branches(id) ON DELETE CASCADE,
    user_id        UUID        REFERENCES users(id) ON DELETE CASCADE,
    sub_profile_id UUID        REFERENCES sub_profiles(id),
    title          VARCHAR(80),
    description    VARCHAR(500),
    media_urls     TEXT[],
    media_type     VARCHAR(20),
    skill_tags     TEXT[],
    likes_count    INT         DEFAULT 0,
    comments_count INT         DEFAULT 0,
    shares_count   INT         DEFAULT 0,
    is_featured    BOOLEAN     DEFAULT FALSE,
    featured_at    TIMESTAMPTZ,
    created_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS showcase_likes (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id    UUID        REFERENCES showcase_posts(id) ON DELETE CASCADE,
    user_id    UUID        REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS events (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id            UUID        REFERENCES community_branches(id) ON DELETE CASCADE,
    created_by_user_id   UUID        REFERENCES users(id),
    title                VARCHAR(255),
    description          TEXT,
    event_type           VARCHAR(50),
    starts_at            TIMESTAMPTZ,
    ends_at              TIMESTAMPTZ,
    timezone             VARCHAR(50),
    capacity             INT,
    rsvp_count           INT         DEFAULT 0,
    host_sub_profile_id  UUID        REFERENCES sub_profiles(id),
    registration_url     TEXT,
    is_approved          BOOLEAN     DEFAULT FALSE,
    is_featured          BOOLEAN     DEFAULT FALSE,
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_rsvps (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id    UUID        REFERENCES events(id) ON DELETE CASCADE,
    user_id     UUID        REFERENCES users(id) ON DELETE CASCADE,
    rsvp_status VARCHAR(20) DEFAULT 'going',
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

-- ── Admin & moderation ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS moderation_queue (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type            VARCHAR(50),
    content_id              UUID,
    branch_id               UUID        REFERENCES community_branches(id),
    reported_by_user_id     UUID        REFERENCES users(id),
    report_reason           VARCHAR(100),
    report_description      TEXT,
    ai_confidence_score     DECIMAL(3,1) DEFAULT 0,
    status                  VARCHAR(20) DEFAULT 'pending',
    priority                VARCHAR(20) DEFAULT 'low',
    assigned_to_moderator_id UUID       REFERENCES users(id),
    action_taken            VARCHAR(50),
    moderator_notes         TEXT,
    actioned_at             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_violations (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID        REFERENCES users(id) ON DELETE CASCADE,
    violation_type   VARCHAR(50),
    duration_days    INT,
    reason           TEXT,
    given_by_admin_id UUID       REFERENCES users(id),
    expires_at       TIMESTAMPTZ,
    created_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID        REFERENCES users(id),
    action        VARCHAR(100),
    target_type   VARCHAR(50),
    target_id     UUID,
    details       JSONB,
    created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ── Social ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS connections (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_user_id    UUID        REFERENCES users(id) ON DELETE CASCADE,
    recipient_user_id    UUID        REFERENCES users(id) ON DELETE CASCADE,
    status               VARCHAR(20) DEFAULT 'pending',
    requested_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    responded_at         TIMESTAMPTZ,
    UNIQUE(requester_user_id, recipient_user_id)
);

CREATE TABLE IF NOT EXISTS follows (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_user_id UUID        REFERENCES users(id) ON DELETE CASCADE,
    followed_user_id UUID        REFERENCES users(id) ON DELETE CASCADE,
    followed_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_user_id, followed_user_id)
);

CREATE TABLE IF NOT EXISTS collaborations (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    initiator_user_id     UUID        REFERENCES users(id),
    collaborator_user_id  UUID        REFERENCES users(id),
    lfg_post_id           UUID        REFERENCES lfg_posts(id),
    status                VARCHAR(20) DEFAULT 'active',
    started_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at          TIMESTAMPTZ,
    created_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ── Progression & trust ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS xp_ledger (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        REFERENCES users(id) ON DELETE CASCADE,
    xp_amount   INT,
    source_type VARCHAR(50),
    source_id   UUID,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS level_history (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        REFERENCES users(id) ON DELETE CASCADE,
    old_level  VARCHAR(20),
    new_level  VARCHAR(20),
    reason     TEXT,
    changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trust_score_history (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID        REFERENCES users(id) ON DELETE CASCADE,
    verified_skills_score   DECIMAL(5,2),
    community_quality_score DECIMAL(5,2),
    reports_penalty         DECIMAL(5,2),
    account_age_score       DECIMAL(5,2),
    collaboration_score     DECIMAL(5,2),
    referral_score          DECIMAL(5,2),
    total_trust_score       DECIMAL(3,1),
    calculated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ── Company profiles ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_profiles (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    slug               VARCHAR(100) UNIQUE NOT NULL,
    name               VARCHAR(255),
    logo_url           TEXT,
    is_verified        BOOLEAN     DEFAULT FALSE,
    company_type       VARCHAR(50),
    company_size       VARCHAR(50),
    founded_year       INT,
    hq_location        VARCHAR(100),
    is_remote_friendly BOOLEAN     DEFAULT FALSE,
    website_url        TEXT,
    description        TEXT,
    mission_statement  VARCHAR(200),
    created_by_user_id UUID        REFERENCES users(id),
    created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company_employees (
    id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id             UUID        REFERENCES company_profiles(id) ON DELETE CASCADE,
    user_id                UUID        REFERENCES users(id) ON DELETE CASCADE,
    role_title             VARCHAR(100),
    is_visible_on_profile  BOOLEAN     DEFAULT FALSE,
    linked_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, user_id)
);

CREATE TABLE IF NOT EXISTS company_talent_pool (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID        REFERENCES company_profiles(id) ON DELETE CASCADE,
    target_user_id  UUID        REFERENCES users(id) ON DELETE CASCADE,
    role_tag        VARCHAR(50),
    pipeline_status VARCHAR(50),
    internal_notes  TEXT,
    saved_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email                  ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username               ON users(username);
CREATE INDEX IF NOT EXISTS idx_master_profiles_user_id      ON master_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_master_profiles_username     ON master_profiles(username);
CREATE INDEX IF NOT EXISTS idx_sub_profiles_user_id         ON sub_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_profiles_domain          ON sub_profiles(domain);
CREATE INDEX IF NOT EXISTS idx_sub_profiles_user_domain     ON sub_profiles(user_id, domain);
CREATE INDEX IF NOT EXISTS idx_user_skills_sub_profile_id   ON user_skills(sub_profile_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_verified         ON user_skills(is_verified);
CREATE INDEX IF NOT EXISTS idx_community_members_branch_user ON community_members(branch_id, user_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel_id          ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id             ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at          ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_groups_branch_id             ON groups(branch_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id       ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_lfg_posts_branch_id          ON lfg_posts(branch_id);
CREATE INDEX IF NOT EXISTS idx_lfg_posts_active             ON lfg_posts(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_showcase_posts_branch_id     ON showcase_posts(branch_id);
CREATE INDEX IF NOT EXISTS idx_showcase_posts_featured      ON showcase_posts(is_featured);
CREATE INDEX IF NOT EXISTS idx_events_branch_id             ON events(branch_id);
CREATE INDEX IF NOT EXISTS idx_events_approved              ON events(is_approved);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status      ON moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_created_at  ON moderation_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_xp_ledger_user_id            ON xp_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_ledger_created_at         ON xp_ledger(created_at);
CREATE INDEX IF NOT EXISTS idx_company_profiles_slug        ON company_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_company_employees_company_id ON company_employees(company_id);
CREATE INDEX IF NOT EXISTS idx_company_talent_pool_company_id ON company_talent_pool(company_id);
