-- =============================================================================
-- GzoneSphere – PostgreSQL 16 Master Setup Script
-- File: 01_postgresql_setup.sql
-- Run this ONCE as the postgres superuser to build the entire database.
-- =============================================================================

-- =============================================================================
-- STEP 0: Create the database and connect to it
-- Run these two lines first in pgAdmin Query Tool while connected to "postgres"
-- =============================================================================
CREATE DATABASE gzs_db
    ENCODING    'UTF8'
    LC_COLLATE  'en_US.UTF-8'
    LC_CTYPE    'en_US.UTF-8'
    TEMPLATE    template0;

-- After running the line above, switch the connection in pgAdmin to "gzs_db"
-- then run everything below.

-- =============================================================================
-- STEP 1: Enable Required Extensions
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- crypt(), digest()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- trigram full-text search
CREATE EXTENSION IF NOT EXISTS "citext";      -- case-insensitive text type

-- =============================================================================
-- STEP 2: Create Database Roles (users for the two backends)
-- =============================================================================

-- Role for the FastAPI Core backend
CREATE ROLE gzs_core_user WITH
    LOGIN
    PASSWORD 'CHANGE_ME_CORE_STRONG_PASSWORD'
    NOSUPERUSER
    NOCREATEDB
    NOCREATEROLE;

-- Role for the Golang CMS backend
CREATE ROLE gzs_cms_user WITH
    LOGIN
    PASSWORD 'CHANGE_ME_CMS_STRONG_PASSWORD'
    NOSUPERUSER
    NOCREATEDB
    NOCREATEROLE;

-- =============================================================================
-- STEP 3: Create Schemas
-- =============================================================================
CREATE SCHEMA IF NOT EXISTS core;          -- Users, auth, profiles, skills
CREATE SCHEMA IF NOT EXISTS community;     -- Branches, channels, groups, LFG
CREATE SCHEMA IF NOT EXISTS social;        -- Friends, follows, notifications
CREATE SCHEMA IF NOT EXISTS gamepost;      -- GamePost 9-section CMS data
CREATE SCHEMA IF NOT EXISTS cms;           -- Blogs, hub settings
CREATE SCHEMA IF NOT EXISTS tournaments;   -- Tournament system
CREATE SCHEMA IF NOT EXISTS payments;      -- Transactions, escrow
CREATE SCHEMA IF NOT EXISTS admin_audit;   -- Audit logs, platform config

-- Grant schema usage
GRANT USAGE ON SCHEMA core, community, social, tournaments, payments, admin_audit
    TO gzs_core_user;
GRANT USAGE ON SCHEMA gamepost, cms, admin_audit
    TO gzs_cms_user;
-- CMS backend needs to read core.users for author display names
GRANT USAGE ON SCHEMA core TO gzs_cms_user;

-- =============================================================================
-- STEP 4: CORE SCHEMA – Users & Authentication
-- =============================================================================

CREATE TABLE core.users (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    username            CITEXT      UNIQUE NOT NULL,
    email               CITEXT      UNIQUE NOT NULL,
    password_hash       TEXT        NOT NULL,
    role                VARCHAR(20) NOT NULL DEFAULT 'user',
                        -- values: user | moderator | admin | super_admin | analytics_viewer
    email_verified      BOOLEAN     NOT NULL DEFAULT FALSE,
    gzs_coins           NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
    is_banned           BOOLEAN     NOT NULL DEFAULT FALSE,
    last_active_at      TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_role CHECK (role IN ('user','moderator','admin','super_admin','analytics_viewer'))
);
CREATE INDEX idx_users_email    ON core.users(email);
CREATE INDEX idx_users_username ON core.users(username);
CREATE INDEX idx_users_role     ON core.users(role);

CREATE TABLE core.refresh_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    device_id   VARCHAR(100) NOT NULL,
    token_hash  TEXT        NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, device_id)
);
CREATE INDEX idx_refresh_tokens_user ON core.refresh_tokens(user_id);

CREATE TABLE core.otp_codes (
    email       CITEXT      PRIMARY KEY,
    otp_hash    TEXT        NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    attempts    SMALLINT    NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- STEP 5: CORE SCHEMA – Master & Sub Profiles
-- =============================================================================

CREATE TABLE core.master_profiles (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID        UNIQUE NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    username                CITEXT      UNIQUE NOT NULL,
    real_name               VARCHAR(100),
    avatar_url              TEXT,
    banner_url              TEXT,
    bio                     TEXT,
    location                VARCHAR(100),
    platform_level          VARCHAR(20) NOT NULL DEFAULT 'Beginner',
                            -- Beginner | Hustler | Extreme | Pro
    trust_score             NUMERIC(3,1) NOT NULL DEFAULT 5.0
                            CHECK (trust_score BETWEEN 1.0 AND 10.0),
    verified_checkmark      BOOLEAN     NOT NULL DEFAULT FALSE,
    xp_total                INTEGER     NOT NULL DEFAULT 0,
    availability_flags      JSONB       NOT NULL DEFAULT '{"hiring":false,"collaboration":false,"events":false}',
    username_changed_at     TIMESTAMPTZ,
    username_change_count   SMALLINT    NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_master_profiles_username ON core.master_profiles(username);
CREATE INDEX idx_master_profiles_level    ON core.master_profiles(platform_level);
CREATE INDEX idx_master_profiles_trust    ON core.master_profiles(trust_score DESC);

CREATE TABLE core.sub_profiles (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID        NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    domain              VARCHAR(20) NOT NULL,
                        -- dev | esports | content | business | art | writing | audio
    username            CITEXT      NOT NULL,
    primary_role        VARCHAR(100),
    featured_roles      JSONB,          -- array of up to 3 secondary roles
    headline            VARCHAR(80),
    experience_level    VARCHAR(20),    -- Beginner | Intermediate | Advanced | Expert
    bio                 TEXT,
    avatar_url          TEXT,
    visibility          VARCHAR(20) NOT NULL DEFAULT 'public',
                        -- public | connections_only | private
    status              VARCHAR(20) NOT NULL DEFAULT 'Active',
                        -- Active | Idle | Dormant
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, domain),
    CONSTRAINT chk_domain CHECK (domain IN ('dev','esports','content','business','art','writing','audio'))
);
CREATE INDEX idx_sub_profiles_user_domain ON core.sub_profiles(user_id, domain);
CREATE INDEX idx_sub_profiles_domain      ON core.sub_profiles(domain);

CREATE TABLE core.sub_profile_achievements (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    domain      VARCHAR(20) NOT NULL,
    label       VARCHAR(100) NOT NULL,
    icon        VARCHAR(50),
    earned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sub_achievements ON core.sub_profile_achievements(user_id, domain);

-- =============================================================================
-- STEP 6: CORE SCHEMA – Skills & Verification
-- =============================================================================

CREATE TABLE core.skills_taxonomy (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) UNIQUE NOT NULL,
    domain      VARCHAR(20) NOT NULL,
    category    VARCHAR(100),
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_skills_taxonomy_domain ON core.skills_taxonomy(domain);

CREATE TABLE core.user_skills (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    sub_profile_id          UUID        NOT NULL REFERENCES core.sub_profiles(id) ON DELETE CASCADE,
    skill_id                UUID        NOT NULL REFERENCES core.skills_taxonomy(id),
    user_id                 UUID        NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    is_verified             BOOLEAN     NOT NULL DEFAULT FALSE,
    verification_method     VARCHAR(50),
    -- project_demo | github_code | cert | employer_letter | live_test | portfolio | peer_review
    verification_proof_url  TEXT,
    verification_proof_text TEXT,
    verified_by_user_id     UUID        REFERENCES core.users(id),
    verified_at             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (sub_profile_id, skill_id)
);
CREATE INDEX idx_user_skills_sub_profile ON core.user_skills(sub_profile_id);
CREATE INDEX idx_user_skills_verified    ON core.user_skills(is_verified);

CREATE TABLE core.verification_queue (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_skill_id           UUID        NOT NULL REFERENCES core.user_skills(id) ON DELETE CASCADE,
    status                  VARCHAR(30) NOT NULL DEFAULT 'pending',
    -- pending | approved | rejected | requesting_more_info
    submitted_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_by_user_id     UUID        REFERENCES core.users(id),
    reviewer_notes          TEXT,
    reviewed_at             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_verification_queue_status ON core.verification_queue(status);

-- =============================================================================
-- STEP 7: CORE SCHEMA – Sub-Profile Content Sections
-- =============================================================================

CREATE TABLE core.tools (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    sub_profile_id      UUID        NOT NULL REFERENCES core.sub_profiles(id) ON DELETE CASCADE,
    tool_name           VARCHAR(100) NOT NULL,
    category            VARCHAR(50),   -- engine | language | platform | software
    proficiency_level   VARCHAR(20),   -- Beginner | Intermediate | Advanced | Expert
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tools_sub_profile ON core.tools(sub_profile_id);

CREATE TABLE core.projects (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    sub_profile_id          UUID        NOT NULL REFERENCES core.sub_profiles(id) ON DELETE CASCADE,
    title                   VARCHAR(255),
    description             TEXT,
    media_urls              JSONB,      -- array of CDN URLs
    skills_demonstrated     JSONB,      -- array of skill_taxonomy UUIDs
    team_size               VARCHAR(50),-- Solo | 2-5 | 6-15 | 16-50 | 50+
    year                    SMALLINT,
    demo_url                TEXT,
    source_code_url         TEXT,
    genre                   VARCHAR(50),
    engine_used             VARCHAR(100),
    platforms               JSONB,      -- ["PC","Console","Mobile","VR"]
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_projects_sub_profile ON core.projects(sub_profile_id);

CREATE TABLE core.availability (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    sub_profile_id          UUID        UNIQUE NOT NULL REFERENCES core.sub_profiles(id) ON DELETE CASCADE,
    timezone                VARCHAR(50),
    collaboration_type      VARCHAR(50),-- full_time | contract | freelance | open_to_offers
    weekly_hours_available  VARCHAR(50),-- part_time | full_time | flexible
    rate_range_start        INTEGER,
    rate_range_end          INTEGER,
    rate_currency           VARCHAR(10) DEFAULT 'INR',
    visible_to_others       BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- STEP 8: CORE SCHEMA – Progression & Trust
-- =============================================================================

CREATE TABLE core.xp_ledger (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    xp_amount   INTEGER     NOT NULL,
    source_type VARCHAR(50),
    -- daily_login | message_reaction | showcase_save | skill_verified | tournament_win | etc.
    source_id   UUID,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_xp_ledger_user       ON core.xp_ledger(user_id);
CREATE INDEX idx_xp_ledger_created_at ON core.xp_ledger(created_at DESC);

CREATE TABLE core.level_history (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    old_level   VARCHAR(20),
    new_level   VARCHAR(20),
    reason      TEXT,
    changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_level_history_user ON core.level_history(user_id);

CREATE TABLE core.trust_score_history (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID        NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    verified_skills_score   NUMERIC(5,2),
    community_quality_score NUMERIC(5,2),
    reports_penalty         NUMERIC(5,2),
    account_age_score       NUMERIC(5,2),
    collaboration_score     NUMERIC(5,2),
    referral_score          NUMERIC(5,2),
    manual_adjustment       NUMERIC(5,2) DEFAULT 0,
    total_trust_score       NUMERIC(3,1),
    source                  VARCHAR(50) DEFAULT 'auto_recalc',
    -- auto_recalc | admin_manual
    calculated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_trust_score_history_user ON core.trust_score_history(user_id);

-- =============================================================================
-- STEP 9: COMMUNITY SCHEMA – Branches, Channels, Messages
-- =============================================================================

CREATE TABLE community.branches (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                VARCHAR(50) UNIQUE NOT NULL,
    name                VARCHAR(100) NOT NULL,
    description         TEXT,
    icon_url            TEXT,
    color_accent        VARCHAR(20),
    status              VARCHAR(20) NOT NULL DEFAULT 'Active',
    moderation_level    VARCHAR(20) NOT NULL DEFAULT 'Standard',
    member_count        INTEGER     NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE community.branch_members (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID        NOT NULL REFERENCES community.branches(id) ON DELETE CASCADE,
    user_id         UUID        NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    sub_profile_id  UUID        REFERENCES core.sub_profiles(id),
    role            VARCHAR(20) NOT NULL DEFAULT 'member',
    -- member | moderator | admin
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    opted_out       BOOLEAN     NOT NULL DEFAULT FALSE,
    UNIQUE (branch_id, user_id)
);
CREATE INDEX idx_branch_members ON community.branch_members(branch_id, user_id);

CREATE TABLE community.channels (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id           UUID        NOT NULL REFERENCES community.branches(id) ON DELETE CASCADE,
    name                VARCHAR(100) NOT NULL,
    description         TEXT,
    channel_type        VARCHAR(20) NOT NULL DEFAULT 'text',
    -- text | announcement | resource
    slowmode_seconds    INTEGER     NOT NULL DEFAULT 0,
    min_level_to_post   VARCHAR(20) NOT NULL DEFAULT 'Beginner',
    is_default          BOOLEAN     NOT NULL DEFAULT FALSE,
    game_slug           VARCHAR(100),
    is_archived         BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_channels_branch   ON community.channels(branch_id);
CREATE INDEX idx_channels_game_slug ON community.channels(game_slug);

-- messages table: stores metadata only. Full content lives in MongoDB.
CREATE TABLE community.messages_meta (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id      UUID        NOT NULL REFERENCES community.channels(id) ON DELETE CASCADE,
    user_id         UUID        NOT NULL REFERENCES core.users(id),
    sub_profile_id  UUID        REFERENCES core.sub_profiles(id),
    mongo_id        TEXT,       -- MongoDB ObjectId string for the full document
    is_deleted      BOOLEAN     NOT NULL DEFAULT FALSE,
    is_pinned       BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_messages_meta_channel ON community.messages_meta(channel_id, created_at DESC);
CREATE INDEX idx_messages_meta_user    ON community.messages_meta(user_id);

CREATE TABLE community.groups (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id           UUID        NOT NULL REFERENCES community.branches(id),
    name                VARCHAR(100) NOT NULL,
    description         TEXT,
    is_public           BOOLEAN     NOT NULL DEFAULT TRUE,
    max_members         INTEGER     NOT NULL DEFAULT 100,
    member_count        INTEGER     NOT NULL DEFAULT 0,
    cover_image_url     TEXT,
    created_by_user_id  UUID        NOT NULL REFERENCES core.users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_groups_branch ON community.groups(branch_id);

CREATE TABLE community.group_members (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id    UUID        NOT NULL REFERENCES community.groups(id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    role        VARCHAR(20) NOT NULL DEFAULT 'member',
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (group_id, user_id)
);
CREATE INDEX idx_group_members ON community.group_members(group_id, user_id);

CREATE TABLE community.lfg_posts (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id               UUID        NOT NULL REFERENCES community.branches(id),
    user_id                 UUID        NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    sub_profile_id          UUID        REFERENCES core.sub_profiles(id),
    goal_type               VARCHAR(50),
    description             TEXT,
    required_skills         JSONB,      -- array of skill_taxonomy UUIDs
    availability_window     VARCHAR(50),
    availability_date       TIMESTAMPTZ,
    timezone                VARCHAR(50),
    platform_type           VARCHAR(50),
    contact_preference      VARCHAR(50),
    contact_url             TEXT,
    auto_expire             BOOLEAN     NOT NULL DEFAULT TRUE,
    expires_at              TIMESTAMPTZ,
    is_active               BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_lfg_posts_active  ON community.lfg_posts(is_active, expires_at);
CREATE INDEX idx_lfg_posts_branch  ON community.lfg_posts(branch_id);

CREATE TABLE community.showcase_posts (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID        NOT NULL REFERENCES community.branches(id),
    user_id         UUID        NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    sub_profile_id  UUID        NOT NULL REFERENCES core.sub_profiles(id),
    title           VARCHAR(80),
    description     VARCHAR(500),
    media_urls      JSONB,
    media_type      VARCHAR(20),    -- image | video | audio | text
    skill_tags      JSONB,
    likes_count     INTEGER     NOT NULL DEFAULT 0,
    comments_count  INTEGER     NOT NULL DEFAULT 0,
    is_featured     BOOLEAN     NOT NULL DEFAULT FALSE,
    featured_at     TIMESTAMPTZ,
    is_weekly_winner BOOLEAN    NOT NULL DEFAULT FALSE,
    winner_week     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_showcase_posts_branch   ON community.showcase_posts(branch_id);
CREATE INDEX idx_showcase_posts_featured ON community.showcase_posts(is_featured);

CREATE TABLE community.showcase_likes (
    post_id     UUID NOT NULL REFERENCES community.showcase_posts(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

CREATE TABLE community.events (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id           UUID        NOT NULL REFERENCES community.branches(id),
    created_by_user_id  UUID        NOT NULL REFERENCES core.users(id),
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    event_type          VARCHAR(50),
    starts_at           TIMESTAMPTZ,
    ends_at             TIMESTAMPTZ,
    timezone            VARCHAR(50),
    capacity            INTEGER,
    rsvp_count          INTEGER     NOT NULL DEFAULT 0,
    host_sub_profile_id UUID        REFERENCES core.sub_profiles(id),
    registration_url    TEXT,
    is_approved         BOOLEAN     NOT NULL DEFAULT FALSE,
    is_featured         BOOLEAN     NOT NULL DEFAULT FALSE,
    status              VARCHAR(30) NOT NULL DEFAULT 'pending_approval',
    -- pending_approval | approved | rejected | live | cancelled
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_events_branch  ON community.events(branch_id);
CREATE INDEX idx_events_status  ON community.events(status);
CREATE INDEX idx_events_starts  ON community.events(starts_at);

CREATE TABLE community.event_rsvps (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id    UUID        NOT NULL REFERENCES community.events(id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    rsvp_status VARCHAR(20) NOT NULL DEFAULT 'going',
    -- going | interested | not_going
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, user_id)
);
CREATE INDEX idx_event_rsvps_event ON community.event_rsvps(event_id);

CREATE TABLE community.event_reminders (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id                UUID        NOT NULL REFERENCES community.events(id) ON DELETE CASCADE,
    user_id                 UUID        NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    remind_minutes_before   INTEGER     NOT NULL,   -- 60 | 180 | 1440
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, event_id)
);

CREATE TABLE community.announcements (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    title               VARCHAR(80) NOT NULL,
    body                VARCHAR(120),
    link                VARCHAR(500),
    is_pinned           BOOLEAN     NOT NULL DEFAULT TRUE,
    is_platform_wide    BOOLEAN     NOT NULL DEFAULT TRUE,
    posted_by_user_id   UUID        REFERENCES core.users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_announcements_pinned ON community.announcements(is_pinned, created_at DESC);

CREATE TABLE community.moderation_queue (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type            VARCHAR(50),-- message | post | showcase | comment | review
    content_id              UUID,       -- ID in Mongo (stored as text in mongo_id)
    mongo_content_id        TEXT,       -- MongoDB ObjectId string
    branch_id               UUID        REFERENCES community.branches(id),
    reported_by_user_id     UUID        REFERENCES core.users(id),
    report_reason           VARCHAR(100),
    report_description      TEXT,
    ai_confidence_score     NUMERIC(3,1) DEFAULT 0,
    status                  VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- pending | reviewed | dismissed | actioned
    priority                VARCHAR(20) NOT NULL DEFAULT 'low',
    assigned_to_moderator_id UUID       REFERENCES core.users(id),
    action_taken            VARCHAR(50),
    moderator_notes         TEXT,
    actioned_at             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_modq_status   ON community.moderation_queue(status);
CREATE INDEX idx_modq_priority ON community.moderation_queue(priority);

-- =============================================================================
-- STEP 10: SOCIAL SCHEMA – Friends, Follows, Blocks, Notifications
-- =============================================================================

CREATE TABLE social.connections (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_user_id   UUID        NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    recipient_user_id   UUID        NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    status              VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- pending | accepted | blocked | rejected
    requested_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at        TIMESTAMPTZ,
    UNIQUE (requester_user_id, recipient_user_id)
);
CREATE INDEX idx_connections_requester ON social.connections(requester_user_id);
CREATE INDEX idx_connections_recipient ON social.connections(recipient_user_id);
CREATE INDEX idx_connections_status    ON social.connections(status);

CREATE TABLE social.follows (
    follower_user_id    UUID        NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    followed_user_id    UUID        NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    followed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_user_id, followed_user_id)
);
CREATE INDEX idx_follows_followed ON social.follows(followed_user_id);

CREATE TABLE social.user_blocks (
    blocker_id  UUID        NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    blocked_id  UUID        NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id)
);
CREATE INDEX idx_blocks_blocker ON social.user_blocks(blocker_id);

CREATE TABLE social.collaborations (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    initiator_user_id       UUID        NOT NULL REFERENCES core.users(id),
    collaborator_user_id    UUID        NOT NULL REFERENCES core.users(id),
    lfg_post_id             UUID        REFERENCES community.lfg_posts(id),
    status                  VARCHAR(20) NOT NULL DEFAULT 'active',
    -- active | completed | failed | cancelled
    started_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE social.direct_conversations (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id        UUID        NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    user2_id        UUID        NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user1_id, user2_id)
);
CREATE INDEX idx_dm_conversations_users ON social.direct_conversations(user1_id, user2_id);

-- DMs: only metadata in PG, full content in MongoDB dm_messages collection
CREATE TABLE social.direct_messages_meta (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id     UUID        NOT NULL REFERENCES social.direct_conversations(id) ON DELETE CASCADE,
    sender_id           UUID        NOT NULL REFERENCES core.users(id),
    mongo_id            TEXT,       -- MongoDB ObjectId for full content
    is_read             BOOLEAN     NOT NULL DEFAULT FALSE,
    is_deleted          BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_dm_meta_conversation ON social.direct_messages_meta(conversation_id, created_at DESC);

CREATE TABLE social.notifications (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    type        VARCHAR(50),
    -- friend_request | comment | like | tournament_update | achievement | skill_verified
    title       VARCHAR(200) NOT NULL,
    body        TEXT,
    link        VARCHAR(500),
    is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_user   ON social.notifications(user_id);
CREATE INDEX idx_notifications_unread ON social.notifications(user_id, is_read) WHERE is_read = FALSE;

CREATE TABLE social.posts (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID        NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    sub_profile_type    VARCHAR(50),
    content             TEXT        NOT NULL,
    media_urls          JSONB       NOT NULL DEFAULT '[]',
    like_count          INTEGER     NOT NULL DEFAULT 0,
    comment_count       INTEGER     NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_posts_user       ON social.posts(user_id);
CREATE INDEX idx_posts_created_at ON social.posts(created_at DESC);

CREATE TABLE social.post_likes (
    post_id     UUID NOT NULL REFERENCES social.posts(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, user_id)
);

CREATE TABLE social.post_comments (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id             UUID        NOT NULL REFERENCES social.posts(id) ON DELETE CASCADE,
    user_id             UUID        NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    content             TEXT        NOT NULL,
    parent_comment_id   UUID        REFERENCES social.post_comments(id),
    like_count          INTEGER     NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_post_comments_post ON social.post_comments(post_id);

CREATE TABLE social.company_profiles (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                VARCHAR(100) UNIQUE NOT NULL,
    name                VARCHAR(255) NOT NULL,
    logo_url            TEXT,
    is_verified         BOOLEAN     NOT NULL DEFAULT FALSE,
    company_type        VARCHAR(50),-- studio | publisher | esports_org | agency
    company_size        VARCHAR(50),-- 1_10 | 11_50 | 51_200 | 201_500 | 500_plus
    founded_year        SMALLINT,
    hq_location         VARCHAR(100),
    is_remote_friendly  BOOLEAN     NOT NULL DEFAULT FALSE,
    website_url         TEXT,
    description         TEXT,
    mission_statement   VARCHAR(200),
    created_by_user_id  UUID        NOT NULL REFERENCES core.users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_company_profiles_slug ON social.company_profiles(slug);

CREATE TABLE social.company_employees (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id              UUID        NOT NULL REFERENCES social.company_profiles(id) ON DELETE CASCADE,
    user_id                 UUID        NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    role_title              VARCHAR(100),
    is_visible_on_profile   BOOLEAN     NOT NULL DEFAULT FALSE,
    linked_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, user_id)
);

CREATE TABLE social.company_talent_pool (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID        NOT NULL REFERENCES social.company_profiles(id) ON DELETE CASCADE,
    target_user_id  UUID        NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    role_tag        VARCHAR(50),
    pipeline_status VARCHAR(50) NOT NULL DEFAULT 'saved',
    -- saved | contacted | in_review | interview | offer_sent | hired | rejected
    internal_notes  TEXT,
    saved_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, target_user_id)
);

CREATE TABLE social.reading_list (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    blog_slug   VARCHAR(200) NOT NULL,
    saved_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, blog_slug)
);
CREATE INDEX idx_reading_list_user ON social.reading_list(user_id);

CREATE TABLE social.reserved_usernames (
    username            VARCHAR(50) PRIMARY KEY,
    reserved_by_user_id UUID        REFERENCES core.users(id),
    reserved_until      TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- STEP 11: TOURNAMENTS SCHEMA
-- =============================================================================

CREATE TABLE tournaments.tournaments (
    id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                        VARCHAR(120) UNIQUE NOT NULL,
    title                       VARCHAR(200) NOT NULL,
    game_slug                   VARCHAR(100),
    domain                      VARCHAR(50) NOT NULL DEFAULT 'esports',
    format                      VARCHAR(50),-- single_elimination | double_elimination | round_robin
    status                      VARCHAR(30) NOT NULL DEFAULT 'upcoming',
    -- upcoming | live | completed | cancelled
    prize_pool                  VARCHAR(100),
    entry_fee                   NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    max_participants            INTEGER,
    start_date                  TIMESTAMPTZ,
    end_date                    TIMESTAMPTZ,
    registration_opens          TIMESTAMPTZ,
    registration_closes         TIMESTAMPTZ,
    bracket_announcement        TIMESTAMPTZ,
    check_in_start              TIMESTAMPTZ,
    check_in_end                TIMESTAMPTZ,
    eligible_regions            JSONB       NOT NULL DEFAULT '[]',
    rules                       TEXT,
    full_rules_document         TEXT,
    refund_policy               TEXT,
    reschedule_policy           TEXT,
    noshow_rule                 TEXT,
    overtime_rules              TEXT,
    estimated_match_duration    VARCHAR(100),
    expected_duration           VARCHAR(100),
    important_notes             TEXT,
    highlights                  JSONB       NOT NULL DEFAULT '[]',
    stages                      JSONB       NOT NULL DEFAULT '[]',
    prize_distribution          JSONB       NOT NULL DEFAULT '[]',
    prize_distribution_policy   TEXT,
    brackets_json               JSONB       NOT NULL DEFAULT '{}',
    game_config_json            JSONB       NOT NULL DEFAULT '{}',
    results_json                JSONB       NOT NULL DEFAULT '{}',
    platforms                   JSONB       NOT NULL DEFAULT '[]',
    custom_registration_fields  JSONB       NOT NULL DEFAULT '[]',
    banner_image                VARCHAR(500),
    created_by_user_id          UUID        REFERENCES core.users(id),
    organizer_user_id           UUID        REFERENCES core.users(id),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tournaments_status    ON tournaments.tournaments(status);
CREATE INDEX idx_tournaments_game_slug ON tournaments.tournaments(game_slug);
CREATE INDEX idx_tournaments_start     ON tournaments.tournaments(start_date);

CREATE TABLE tournaments.registrations (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id       UUID        NOT NULL REFERENCES tournaments.tournaments(id) ON DELETE CASCADE,
    user_id             UUID        NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    team_name           VARCHAR(100),
    team_members_json   JSONB       NOT NULL DEFAULT '[]',
    game_fields_json    JSONB       NOT NULL DEFAULT '{}',
    status              VARCHAR(30) NOT NULL DEFAULT 'registered',
    -- registered | checked_in | disqualified | withdrawn
    registered_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tournament_id, user_id)
);
CREATE INDEX idx_registrations_tournament ON tournaments.registrations(tournament_id);

-- =============================================================================
-- STEP 12: PAYMENTS SCHEMA
-- =============================================================================

CREATE TABLE payments.transactions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES core.users(id),
    amount          NUMERIC(12,2) NOT NULL,
    currency        VARCHAR(10) NOT NULL DEFAULT 'INR',
    transaction_type VARCHAR(50) NOT NULL,
    -- tournament_entry | gzs_coins_purchase | prize_payout | refund
    status          VARCHAR(30) NOT NULL DEFAULT 'pending',
    -- pending | completed | failed | refunded
    gateway         VARCHAR(20),-- razorpay | stripe
    gateway_txn_id  TEXT,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_transactions_user   ON payments.transactions(user_id);
CREATE INDEX idx_transactions_status ON payments.transactions(status);

CREATE TABLE payments.escrow (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id       UUID        REFERENCES tournaments.tournaments(id),
    total_amount        NUMERIC(12,2) NOT NULL,
    currency            VARCHAR(10) NOT NULL DEFAULT 'INR',
    status              VARCHAR(30) NOT NULL DEFAULT 'held',
    -- held | released | refunded | disputed
    released_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- STEP 13: GAMEPOST SCHEMA (Golang CMS manages this)
-- =============================================================================

CREATE TABLE gamepost.game_posts (
    game_post_id    SERIAL          PRIMARY KEY,
    slug            VARCHAR(120)    UNIQUE NOT NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'draft',
    -- draft | published | archived
    brand_color     VARCHAR(7)      DEFAULT '#E53935',
    is_featured     BOOLEAN         NOT NULL DEFAULT FALSE,
    view_count      INTEGER         NOT NULL DEFAULT 0,
    tournament_participants_7d  INTEGER NOT NULL DEFAULT 0,
    community_activity_7d       INTEGER NOT NULL DEFAULT 0,
    trending_score  NUMERIC(10,2)   NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_gp_slug    ON gamepost.game_posts(slug);
CREATE INDEX idx_gp_status  ON gamepost.game_posts(status);
CREATE INDEX idx_gp_trending ON gamepost.game_posts(trending_score DESC);

CREATE TABLE gamepost.hero (
    game_post_id    INT         PRIMARY KEY REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE,
    game_title      TEXT        NOT NULL,
    game_desc_short TEXT,
    background_img  TEXT,
    logo_img        TEXT,
    cta_label       VARCHAR(60) DEFAULT 'Get Access',
    cta_href        TEXT,
    trailer_url     TEXT
);

CREATE TABLE gamepost.game_info (
    game_post_id        INT     PRIMARY KEY REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE,
    developer           TEXT,
    publisher           TEXT,
    release_date        DATE,
    genres              TEXT,   -- comma-separated or JSON
    platforms           TEXT,   -- comma-separated
    profile_size_photo  TEXT
);

CREATE TABLE gamepost.storyline (
    game_post_id    INT     PRIMARY KEY REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE,
    paragraphs      TEXT,
    summary         TEXT
);

CREATE TABLE gamepost.carousel (
    carousel_id     SERIAL      PRIMARY KEY,
    game_post_id    INT         NOT NULL REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE,
    media_type      VARCHAR(10) NOT NULL DEFAULT 'image',
    yt_url          TEXT,
    upload_url      TEXT,
    caption         TEXT,
    display_order   INT         NOT NULL DEFAULT 0
);
CREATE INDEX idx_carousel_game ON gamepost.carousel(game_post_id);

CREATE TABLE gamepost.gameplay (
    game_post_id        INT     PRIMARY KEY REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE,
    paragraph           TEXT,
    gameplay_title      TEXT,
    gameplay_title_desc TEXT
);

CREATE TABLE gamepost.gameplay_mechanics (
    mechanic_id     SERIAL  PRIMARY KEY,
    game_post_id    INT     NOT NULL REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE,
    title           TEXT    NOT NULL,
    description     TEXT,
    display_order   INT     NOT NULL DEFAULT 0
);
CREATE INDEX idx_mechanics_game ON gamepost.gameplay_mechanics(game_post_id);

CREATE TABLE gamepost.quick_control_overview (
    game_post_id    INT     PRIMARY KEY REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE,
    qco_title       TEXT,
    qco_title_desc  TEXT
);

CREATE TABLE gamepost.control_cards (
    card_id         SERIAL      PRIMARY KEY,
    game_post_id    INT         NOT NULL REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE,
    category        VARCHAR(60) NOT NULL,
    description     TEXT,
    display_order   INT         NOT NULL DEFAULT 0
);
CREATE INDEX idx_control_cards_game ON gamepost.control_cards(game_post_id);

CREATE TABLE gamepost.modes (
    modes_id        SERIAL  PRIMARY KEY,
    game_post_id    INT     NOT NULL REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE,
    mode_title      TEXT    NOT NULL,
    mode_titledesc  TEXT,
    display_order   INT     NOT NULL DEFAULT 0
);
CREATE INDEX idx_modes_game ON gamepost.modes(game_post_id);

CREATE TABLE gamepost.system_requirements (
    req_id          SERIAL      PRIMARY KEY,
    game_post_id    INT         NOT NULL REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE,
    req_type        VARCHAR(20) NOT NULL,   -- minimum | recommended
    os              TEXT,
    processor       TEXT,
    memory          TEXT,
    graphics        TEXT,
    storage         TEXT,
    directx         TEXT,
    network         TEXT,
    additional      TEXT
);
CREATE INDEX idx_sysreq_game ON gamepost.system_requirements(game_post_id);

CREATE TABLE gamepost.expert_reviews (
    review_id       SERIAL  PRIMARY KEY,
    game_post_id    INT     NOT NULL REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE,
    reviewer_name   TEXT    NOT NULL,
    outlet          TEXT,
    star_rating     NUMERIC(2,1),
    review_quote    VARCHAR(150),
    full_review_url TEXT,
    display_order   INT     NOT NULL DEFAULT 0
);
CREATE INDEX idx_expert_reviews_game ON gamepost.expert_reviews(game_post_id);

CREATE TABLE gamepost.get_game (
    game_post_id    INT     PRIMARY KEY REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE,
    store_links     JSONB   NOT NULL DEFAULT '{}',
    -- {"pc":"https://...", "ps5":"https://..."}
    dlc_updates     JSONB   NOT NULL DEFAULT '[]',
    awards          JSONB   NOT NULL DEFAULT '[]'
);

CREATE TABLE gamepost.social_links (
    game_post_id    INT     PRIMARY KEY REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE,
    discord_url     TEXT,
    twitter_url     TEXT,
    instagram_url   TEXT,
    tiktok_url      TEXT,
    youtube_url     TEXT,
    twitch_url      TEXT,
    website_url     TEXT
);

CREATE TABLE gamepost.related_games (
    game_post_id            INT NOT NULL REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE,
    related_game_post_id    INT NOT NULL REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE,
    display_order           INT NOT NULL DEFAULT 0,
    PRIMARY KEY (game_post_id, related_game_post_id)
);

-- =============================================================================
-- STEP 14: CMS SCHEMA – Blogs (Golang CMS)
-- =============================================================================

CREATE TABLE cms.blog_posts (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                VARCHAR(200) UNIQUE NOT NULL,
    title               VARCHAR(255) NOT NULL,
    content             TEXT,
    content_plain       TEXT,       -- stripped for search
    excerpt             VARCHAR(300),
    category            VARCHAR(50),
    blog_type           VARCHAR(50),
    author_id           UUID        REFERENCES core.users(id),
    author_username     VARCHAR(50),
    author_domain       VARCHAR(20),
    hero_image_url      TEXT,
    is_featured         BOOLEAN     NOT NULL DEFAULT FALSE,
    view_count          INTEGER     NOT NULL DEFAULT 0,
    views_24h           INTEGER     NOT NULL DEFAULT 0,
    like_count          INTEGER     NOT NULL DEFAULT 0,
    likes_24h           INTEGER     NOT NULL DEFAULT 0,
    comment_count       INTEGER     NOT NULL DEFAULT 0,
    read_time_minutes   SMALLINT    NOT NULL DEFAULT 5,
    status              VARCHAR(20) NOT NULL DEFAULT 'draft',
    -- draft | published | archived
    game_slug           VARCHAR(200),
    tags                TEXT[],
    published_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_blog_posts_slug     ON cms.blog_posts(slug);
CREATE INDEX idx_blog_posts_category ON cms.blog_posts(category);
CREATE INDEX idx_blog_posts_status   ON cms.blog_posts(status);
CREATE INDEX idx_blog_posts_game     ON cms.blog_posts(game_slug);
CREATE INDEX idx_blog_posts_featured ON cms.blog_posts(is_featured);
CREATE INDEX idx_blog_posts_tags     ON cms.blog_posts USING GIN(tags);

CREATE TABLE cms.blog_likes (
    blog_slug   VARCHAR(200) NOT NULL,
    user_id     UUID        NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    liked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (blog_slug, user_id)
);
CREATE INDEX idx_blog_likes_slug ON cms.blog_likes(blog_slug);

CREATE TABLE cms.featured_blogs (
    id          SERIAL      PRIMARY KEY,
    blog_slug   VARCHAR(200) NOT NULL,
    position    SMALLINT    NOT NULL DEFAULT 1,
    added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cms.hub_settings (
    id              SERIAL      PRIMARY KEY,
    section         VARCHAR(50) UNIQUE NOT NULL,
    settings_json   JSONB       NOT NULL DEFAULT '{}',
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- STEP 15: ADMIN_AUDIT SCHEMA
-- =============================================================================

CREATE TABLE admin_audit.audit_logs (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id   UUID        NOT NULL REFERENCES core.users(id),
    action          VARCHAR(100) NOT NULL,
    target_type     VARCHAR(50),
    target_id       TEXT,       -- UUID or string identifier
    details         JSONB,
    ip_address      INET,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_admin   ON admin_audit.audit_logs(admin_user_id);
CREATE INDEX idx_audit_logs_action  ON admin_audit.audit_logs(action);
CREATE INDEX idx_audit_logs_created ON admin_audit.audit_logs(created_at DESC);

CREATE TABLE admin_audit.super_audit_logs (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    super_admin_id  UUID        NOT NULL REFERENCES core.users(id),
    action          VARCHAR(100) NOT NULL,
    target_type     VARCHAR(50),
    target_id       TEXT,
    details         JSONB,
    confirmed_by    UUID        REFERENCES core.users(id),
    ip_address      INET,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_super_audit_created ON admin_audit.super_audit_logs(created_at DESC);

CREATE TABLE admin_audit.moderator_scopes (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES core.users(id),
    scope_type      VARCHAR(20) NOT NULL,
    -- community_branch | content | jobs
    scope_value     VARCHAR(50),-- e.g. branch slug
    granted_by      UUID        REFERENCES core.users(id),
    granted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admin_audit.platform_config (
    key         VARCHAR(100) PRIMARY KEY,
    value       JSONB        NOT NULL,
    description TEXT,
    updated_by  UUID         REFERENCES core.users(id),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE admin_audit.feature_flags (
    flag_key    VARCHAR(100) PRIMARY KEY,
    is_enabled  BOOLEAN      NOT NULL DEFAULT FALSE,
    description TEXT,
    updated_by  UUID         REFERENCES core.users(id),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- STEP 16: GRANT PERMISSIONS – per schema, per role
-- =============================================================================

-- FastAPI (gzs_core_user) gets full CRUD on its schemas
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA
    core, community, social, tournaments, payments, admin_audit
    TO gzs_core_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA
    core, community, social, tournaments, payments, admin_audit
    TO gzs_core_user;

-- Golang CMS (gzs_cms_user) gets full CRUD on CMS schemas
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA
    gamepost, cms, admin_audit
    TO gzs_cms_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA
    gamepost, cms
    TO gzs_cms_user;
-- CMS needs to read user info for author display
GRANT SELECT ON core.users, core.master_profiles TO gzs_cms_user;

-- Future tables also get the same grants automatically
ALTER DEFAULT PRIVILEGES IN SCHEMA core, community, social, tournaments, payments, admin_audit
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO gzs_core_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA gamepost, cms
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO gzs_cms_user;

-- =============================================================================
-- STEP 17: Seed Initial Data
-- =============================================================================

-- Platform config defaults
INSERT INTO admin_audit.platform_config (key, value, description) VALUES
    ('maintenance_mode',        'false',                                    'Enable/disable maintenance page'),
    ('user_registration_open',  'true',                                     'Allow new user registrations'),
    ('max_sub_profiles',        '7',                                        'Maximum sub-profiles per user'),
    ('min_password_length',     '8',                                        'Minimum password length'),
    ('otp_expiry_seconds',      '600',                                      'OTP expiry time in seconds'),
    ('session_ttl_days',        '30',                                       'Refresh token TTL in days'),
    ('gzs_coin_exchange_rate',  '{"INR":1.0,"USD":0.012}',                  'Coin to currency rates'),
    ('trust_score_weights',     '{"skills":0.30,"community":0.25,"age":0.10,"collab":0.15,"referral":0.10}', 'Trust score formula weights');

-- Feature flags
INSERT INTO admin_audit.feature_flags (flag_key, is_enabled, description) VALUES
    ('user_blog_writing',       FALSE,  'Phase 2: Allow Hustler+ users to write blogs'),
    ('ai_profile_headlines',    FALSE,  'AI-generated profile headlines'),
    ('ai_smart_matching',       FALSE,  'AI-powered LFG smart matching'),
    ('payment_gateway_live',    FALSE,  'Enable real payment processing'),
    ('websocket_presence',      TRUE,   'Show online/offline status in channels'),
    ('trending_games_algo',     TRUE,   'Enable trending score algorithm');

-- Community branches (9 branches)
INSERT INTO community.branches (slug, name, description, color_accent) VALUES
    ('dev',       'Game Development',      'Developers, designers, and technical creators', '#14B8A6'),
    ('esports',   'Esports & Competitive', 'Players, coaches, analysts, and teams',         '#EF4444'),
    ('content',   'Content Creation',      'Streamers, YouTubers, and content creators',     '#F59E0B'),
    ('business',  'Business & Industry',   'Founders, producers, and business professionals','#8B5CF6'),
    ('art',       'Art & Visual Design',   'Artists, animators, and visual creators',        '#EC4899'),
    ('writing',   'Writing & Narrative',   'Writers, journalists, and narrative designers',  '#3B82F6'),
    ('audio',     'Audio & Music',         'Composers, sound designers, and audio engineers','#10B981'),
    ('general',   'General',              'Open community for all GzoneSphere members',     '#6B7280'),
    ('news',      'Gaming News',           'Industry news, announcements, and updates',      '#F97316');

-- Hub settings placeholders
INSERT INTO cms.hub_settings (section, settings_json) VALUES
    ('games_gallery',   '{"auto_scroll":false,"scroll_speed":3000,"items_per_view":4}'),
    ('trending_games',  '{"count":6,"algorithm":"weighted","cache_ttl":3600}'),
    ('featured_blogs',  '{"count":3,"sidebar_count":3}'),
    ('platform_social', '{"discord":"","twitter":"","instagram":"","youtube":"","tiktok":""}');

-- Skills taxonomy seed (sample – add all via admin panel)
INSERT INTO core.skills_taxonomy (name, domain, category) VALUES
    ('Unity',                   'dev',      'Engine proficiency'),
    ('Unreal Engine',           'dev',      'Engine proficiency'),
    ('Godot',                   'dev',      'Engine proficiency'),
    ('C++',                     'dev',      'Core programming'),
    ('C#',                      'dev',      'Core programming'),
    ('Python',                  'dev',      'Core programming'),
    ('Game Design',             'dev',      'Game design'),
    ('Level Design',            'dev',      'Game design'),
    ('Valorant',                'esports',  'Game titles'),
    ('CS2',                     'esports',  'Game titles'),
    ('League of Legends',       'esports',  'Game titles'),
    ('Video Editing',           'content',  'Production'),
    ('Live Streaming',          'content',  'Streaming'),
    ('YouTube Strategy',        'content',  'Growth'),
    ('Photoshop',               'art',      'Software'),
    ('Blender',                 'art',      'Software'),
    ('Concept Art',             'art',      'Specialisation'),
    ('Game Narrative',          'writing',  'Specialisation'),
    ('Esports Journalism',      'writing',  'Specialisation'),
    ('Sound Design',            'audio',    'Specialisation'),
    ('Music Composition',       'audio',    'Specialisation'),
    ('Business Development',    'business', 'Specialisation'),
    ('Esports Management',      'business', 'Specialisation');

-- =============================================================================
-- END OF SETUP SCRIPT
-- =============================================================================
