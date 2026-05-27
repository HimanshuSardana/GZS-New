-- =============================================================
-- GzoneSphere — GamePost Complete Database Schema
-- Combines & upgrades GAMEPOST.sql + GAMEPOST Admin DATABASE.sql
-- Schema: gamepost + admin_gamepost
-- =============================================================

-- Enable required extensions (run once per DB)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- SCHEMA SETUP
-- =============================================================
CREATE SCHEMA IF NOT EXISTS gamepost;
CREATE SCHEMA IF NOT EXISTS admin_gamepost;

-- =============================================================
-- 1. GAME POSTS (root table — every section FKs here)
-- =============================================================
CREATE TABLE IF NOT EXISTS gamepost.game_posts (
    game_post_id  SERIAL      PRIMARY KEY,
    slug          VARCHAR(120) UNIQUE NOT NULL,          -- URL slug e.g. "valorant"
    status        VARCHAR(20)  NOT NULL DEFAULT 'draft', -- draft | published | scheduled | archived
    brand_color   VARCHAR(7)   DEFAULT '#E53935',        -- hex, drives GameThemeProvider
    is_featured   BOOLEAN      NOT NULL DEFAULT FALSE,
    view_count    INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gp_slug   ON gamepost.game_posts(slug);
CREATE INDEX IF NOT EXISTS idx_gp_status ON gamepost.game_posts(status);

-- =============================================================
-- 2. HERO SECTION
-- =============================================================
CREATE TABLE IF NOT EXISTS gamepost.hero (
    game_post_id     INT         PRIMARY KEY,
    game_title       TEXT        NOT NULL,
    game_desc_short  TEXT,                       -- tagline, max ~160 chars
    background_img   TEXT,                       -- URL for cinematic hero bg
    logo_img         TEXT,                       -- profile-size square logo
    cta_label        VARCHAR(60) DEFAULT 'Get Access',
    cta_href         TEXT,
    trailer_url      TEXT,                       -- YouTube/Vimeo embed URL

    FOREIGN KEY (game_post_id)
        REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
);

-- =============================================================
-- 3. GAME INFO (metadata panel — right column of storyline)
-- =============================================================
CREATE TABLE IF NOT EXISTS gamepost.game_info (
    game_post_id      INT     PRIMARY KEY,
    developer         TEXT,
    publisher         TEXT,
    release_date      DATE,
    genres            TEXT,   -- comma-separated e.g. "Tactical, Shooter"
    platforms         TEXT,   -- comma-separated e.g. "PC, PS5"
    profile_size_photo TEXT,  -- small square cover art

    FOREIGN KEY (game_post_id)
        REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
);

-- =============================================================
-- 4. STORYLINE / OVERVIEW (Section 1)
-- =============================================================
CREATE TABLE IF NOT EXISTS gamepost.storyline (
    game_post_id  INT  PRIMARY KEY,
    paragraphs    TEXT,  -- full narrative, stored as plain text (newline-separated)
    summary       TEXT,  -- short 1–2 sentence summary for SEO/meta

    FOREIGN KEY (game_post_id)
        REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
);

-- =============================================================
-- 5. CAROUSEL (media gallery — images + video)
-- =============================================================
CREATE TABLE IF NOT EXISTS gamepost.carousel (
    carousel_id   SERIAL  PRIMARY KEY,
    game_post_id  INT     NOT NULL,
    media_type    VARCHAR(10) NOT NULL DEFAULT 'image', -- image | video | youtube
    yt_url        TEXT,    -- YouTube/Vimeo URL (video type)
    upload_url    TEXT,    -- stored image URL
    caption       TEXT,
    display_order INT      NOT NULL DEFAULT 0,

    FOREIGN KEY (game_post_id)
        REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_carousel_gp ON gamepost.carousel(game_post_id, display_order);

-- =============================================================
-- 6. GAMEPLAY (Section 2)
-- =============================================================
CREATE TABLE IF NOT EXISTS gamepost.gameplay (
    game_post_id        INT  PRIMARY KEY,
    paragraph           TEXT,  -- overview paragraph (400–800 words)
    gameplay_title      TEXT,  -- bold label e.g. "Precision Gameplay"
    gameplay_title_desc TEXT,  -- description under the title

    FOREIGN KEY (game_post_id)
        REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
);

-- Gameplay mechanics (sub-list — repeating rows)
CREATE TABLE IF NOT EXISTS gamepost.gameplay_mechanics (
    mechanic_id   SERIAL  PRIMARY KEY,
    game_post_id  INT     NOT NULL,
    title         TEXT    NOT NULL,
    description   TEXT,
    display_order INT     NOT NULL DEFAULT 0,

    FOREIGN KEY (game_post_id)
        REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
);

-- =============================================================
-- 7. QUICK CONTROL OVERVIEW (Section 3)
-- =============================================================
CREATE TABLE IF NOT EXISTS gamepost.quick_control_overview (
    game_post_id   INT  PRIMARY KEY,
    qco_title      TEXT,
    qco_title_desc TEXT,  -- intro paragraph for control system

    FOREIGN KEY (game_post_id)
        REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
);

-- Control cards (2×2 grid: Movement, Combat, Abilities, Interface)
CREATE TABLE IF NOT EXISTS gamepost.control_cards (
    card_id       SERIAL  PRIMARY KEY,
    game_post_id  INT     NOT NULL,
    category      VARCHAR(60) NOT NULL,  -- e.g. "Movement"
    description   TEXT,
    display_order INT     NOT NULL DEFAULT 0,

    FOREIGN KEY (game_post_id)
        REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
);

-- =============================================================
-- 8. GAME MODES (Section 3 sub-block)
-- =============================================================
CREATE TABLE IF NOT EXISTS gamepost.modes (
    modes_id      SERIAL  PRIMARY KEY,
    game_post_id  INT     NOT NULL,
    mode_title    TEXT    NOT NULL,
    mode_titledesc TEXT,
    display_order INT     NOT NULL DEFAULT 0,

    FOREIGN KEY (game_post_id)
        REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
);

-- =============================================================
-- 9. SYSTEM REQUIREMENTS (Section 4)
-- =============================================================
CREATE TABLE IF NOT EXISTS gamepost.system_requirement (
    game_post_id   INT  PRIMARY KEY,
    show_section   BOOLEAN NOT NULL DEFAULT TRUE, -- admin toggle for console-only games

    os_min         TEXT,
    os_rec         TEXT,
    processor_min  TEXT,
    processor_rec  TEXT,
    memory_min     TEXT,
    memory_rec     TEXT,
    graphics_min   TEXT,
    graphics_rec   TEXT,
    storage_min    TEXT,
    storage_rec    TEXT,
    directx_min    TEXT,
    directx_rec    TEXT,

    FOREIGN KEY (game_post_id)
        REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
);

-- =============================================================
-- 10. EXPERT REVIEWS (Section 5)
-- =============================================================
CREATE TABLE IF NOT EXISTS gamepost.expert_reviews (
    review_id     SERIAL  PRIMARY KEY,
    game_post_id  INT     NOT NULL,
    reviewer_name TEXT    NOT NULL,
    outlet        TEXT,            -- e.g. "IGN"
    rating        NUMERIC(4,1),    -- e.g. 9.0
    max_rating    NUMERIC(4,1) DEFAULT 10,
    quote         TEXT,            -- max 150 chars (enforced by app)
    review_url    TEXT,
    display_order INT     NOT NULL DEFAULT 0,

    FOREIGN KEY (game_post_id)
        REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
);

-- =============================================================
-- 11. GET GAME / STORE LINKS (Section 6)
-- =============================================================
CREATE TABLE IF NOT EXISTS gamepost.get_game (
    get_game_id    SERIAL  PRIMARY KEY,
    game_post_id   INT     NOT NULL,
    platform_name  VARCHAR(60),  -- e.g. "Steam", "PS Store"
    affiliate_link TEXT,
    price_label    VARCHAR(60) DEFAULT 'Free to Play',
    display_order  INT     NOT NULL DEFAULT 0,

    FOREIGN KEY (game_post_id)
        REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
);

-- =============================================================
-- 12. DLCs (Section 6 sub-block)
-- =============================================================
CREATE TABLE IF NOT EXISTS gamepost.dlcs (
    dlc_id        SERIAL  PRIMARY KEY,
    game_post_id  INT     NOT NULL,
    dlc_title     TEXT    NOT NULL,
    dlc_type      VARCHAR(20) DEFAULT 'DLC',  -- DLC | Update | Season
    release_date  DATE,
    description   TEXT,
    price_label   VARCHAR(60),
    store_link    TEXT,
    display_order INT     NOT NULL DEFAULT 0,

    FOREIGN KEY (game_post_id)
        REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
);

-- =============================================================
-- 13. AWARDS & ACHIEVEMENTS (Section 6 sub-block)
-- =============================================================
CREATE TABLE IF NOT EXISTS gamepost.awards_and_achievements (
    aa_id         SERIAL  PRIMARY KEY,
    game_post_id  INT     NOT NULL,
    aa_title      TEXT    NOT NULL,
    aa_type       VARCHAR(20) DEFAULT 'Award',  -- Award | Achievement
    year          INT,
    organisation  TEXT,
    display_order INT     NOT NULL DEFAULT 0,

    -- OLD column kept for migration compatibility
    aa_pt         TEXT,   -- legacy plain-text bullet; migrate into aa_title + aa_type

    FOREIGN KEY (game_post_id)
        REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
);

-- =============================================================
-- 14. MORE LIKE THIS — related game links (Section 7)
-- =============================================================
CREATE TABLE IF NOT EXISTS gamepost.related_games (
    related_id         SERIAL  PRIMARY KEY,
    game_post_id       INT     NOT NULL,
    related_slug       VARCHAR(120) NOT NULL,  -- FK into gamepost.game_posts.slug
    display_order      INT     NOT NULL DEFAULT 0,

    FOREIGN KEY (game_post_id)
        REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
);

-- =============================================================
-- 15. COMMUNITY HUB CONFIG (Section 8)
-- =============================================================
CREATE TABLE IF NOT EXISTS gamepost.community_hub (
    game_post_id         INT  PRIMARY KEY,
    community_branch_slug TEXT,  -- links to GZS community branch
    show_live_chat        BOOLEAN DEFAULT TRUE,
    show_tournament_widget BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (game_post_id)
        REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
);

-- =============================================================
-- 16. JOIN OUR COMMUNITY — social links (Section 10)
-- =============================================================
CREATE TABLE IF NOT EXISTS gamepost.join_our_community (
    community_id   SERIAL  PRIMARY KEY,
    game_post_id   INT     NOT NULL,
    platform_name  VARCHAR(60) NOT NULL,  -- Discord, Twitter, etc.
    platform_link  TEXT    NOT NULL,
    display_order  INT     NOT NULL DEFAULT 0,

    FOREIGN KEY (game_post_id)
        REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
);

-- =============================================================
-- 17. CRITIC RATING (Section 9 — aggregate score)
-- =============================================================
CREATE TABLE IF NOT EXISTS gamepost.critic_rating (
    game_post_id  INT     PRIMARY KEY,
    score         NUMERIC(4,1),
    label         VARCHAR(40),   -- Outstanding / Excellent / etc.
    signup_href   TEXT DEFAULT '/signup',

    FOREIGN KEY (game_post_id)
        REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
);

-- =============================================================
-- 18. ADMIN GAMEPOST TABLE (publish/schedule/draft control)
-- =============================================================
CREATE TABLE IF NOT EXISTS admin_gamepost.admin (
    game_post_id    INT         PRIMARY KEY,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at    TIMESTAMPTZ,
    scheduled_at    TIMESTAMPTZ,
    saved_as_draft  BOOLEAN     NOT NULL DEFAULT TRUE,
    last_edited_by  TEXT,       -- username of admin who last saved

    CONSTRAINT fk_admin_game_post
        FOREIGN KEY (game_post_id)
        REFERENCES gamepost.game_posts(game_post_id)
        ON DELETE CASCADE
);

-- =============================================================
-- UTILITY: auto-update updated_at
-- =============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_game_posts_updated
    BEFORE UPDATE ON gamepost.game_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_admin_updated
    BEFORE UPDATE ON admin_gamepost.admin
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================
-- VIEWS: full game post for the Go API to query easily
-- =============================================================
CREATE OR REPLACE VIEW gamepost.v_full_game_post AS
SELECT
    gp.game_post_id,
    gp.slug,
    gp.status,
    gp.brand_color,
    gp.is_featured,
    gp.view_count,
    gp.created_at,
    gp.updated_at,

    -- hero
    h.game_title,
    h.game_desc_short,
    h.background_img,
    h.logo_img,
    h.cta_label,
    h.cta_href,
    h.trailer_url,

    -- game_info
    gi.developer,
    gi.publisher,
    gi.release_date,
    gi.genres,
    gi.platforms,
    gi.profile_size_photo,

    -- storyline
    sl.paragraphs   AS storyline_paragraphs,
    sl.summary      AS storyline_summary,

    -- gameplay
    ga.paragraph    AS gameplay_paragraph,
    ga.gameplay_title,
    ga.gameplay_title_desc,

    -- qco
    qco.qco_title,
    qco.qco_title_desc,

    -- system requirements
    sr.show_section AS sysreq_show,
    sr.os_min, sr.os_rec,
    sr.processor_min, sr.processor_rec,
    sr.memory_min, sr.memory_rec,
    sr.graphics_min, sr.graphics_rec,
    sr.storage_min, sr.storage_rec,
    sr.directx_min, sr.directx_rec,

    -- critic rating
    cr.score        AS critic_score,
    cr.label        AS critic_label,

    -- admin
    adm.published_at,
    adm.scheduled_at,
    adm.saved_as_draft

FROM gamepost.game_posts gp
LEFT JOIN gamepost.hero               h    ON h.game_post_id   = gp.game_post_id
LEFT JOIN gamepost.game_info          gi   ON gi.game_post_id  = gp.game_post_id
LEFT JOIN gamepost.storyline          sl   ON sl.game_post_id  = gp.game_post_id
LEFT JOIN gamepost.gameplay           ga   ON ga.game_post_id  = gp.game_post_id
LEFT JOIN gamepost.quick_control_overview qco ON qco.game_post_id = gp.game_post_id
LEFT JOIN gamepost.system_requirement sr   ON sr.game_post_id  = gp.game_post_id
LEFT JOIN gamepost.critic_rating      cr   ON cr.game_post_id  = gp.game_post_id
LEFT JOIN admin_gamepost.admin        adm  ON adm.game_post_id = gp.game_post_id;

-- =============================================================
-- SEED: Valorant sample (matches existing mock data shape)
-- =============================================================
DO $$
DECLARE v_id INT;
BEGIN
    -- Only seed if table is empty
    IF (SELECT COUNT(*) FROM gamepost.game_posts) = 0 THEN

        INSERT INTO gamepost.game_posts (slug, status, brand_color, is_featured)
        VALUES ('valorant', 'published', '#E53935', TRUE)
        RETURNING game_post_id INTO v_id;

        -- Admin row
        INSERT INTO admin_gamepost.admin (game_post_id, saved_as_draft, published_at)
        VALUES (v_id, FALSE, NOW());

        -- Hero
        INSERT INTO gamepost.hero (game_post_id, game_title, game_desc_short, background_img, trailer_url, cta_href)
        VALUES (v_id,
                'Valorant',
                'A 5v5 character-based tactical shooter where precise gunplay meets unique agent abilities.',
                'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=1400',
                'https://www.youtube.com/embed/e_E96Yy1v6Y',
                'https://playvalorant.com');

        -- Game Info
        INSERT INTO gamepost.game_info (game_post_id, developer, publisher, release_date, genres, platforms, profile_size_photo)
        VALUES (v_id, 'Riot Games', 'Riot Games', '2020-06-02', 'Tactical, Shooter, Multiplayer', 'PC', 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=200');

        -- Storyline
        INSERT INTO gamepost.storyline (game_post_id, summary, paragraphs)
        VALUES (v_id,
                'Valorant is a 5v5 tactical hero shooter set in the near future.',
                E'In the near future, Earth is changed by an event called First Light.\nThis brings Radiant individuals with preternatural powers and Radianite technology.\nValorant agents battle across the globe to control this dangerous resource.');

        -- Gameplay
        INSERT INTO gamepost.gameplay (game_post_id, paragraph, gameplay_title, gameplay_title_desc)
        VALUES (v_id,
                'Each round, attackers plant the Spike while defenders try to stop them. Agents bring unique abilities that complement precise gunplay.',
                'Precision Gameplay',
                'Gunplay is lethal and consistent — abilities supplement but never replace aiming skill.');

        -- Gameplay Mechanics
        INSERT INTO gamepost.gameplay_mechanics (game_post_id, title, description, display_order) VALUES
        (v_id, 'Precision Gameplay', 'Gunplay is primary — abilities enhance but cannot substitute raw aim.', 1),
        (v_id, 'Agent Abilities', 'Each agent brings unique utility — smoke, flash, heal, or recon.', 2),
        (v_id, 'Round-Based Economy', 'Buy weapons and abilities at the start of each round using earned credits.', 3),
        (v_id, 'Objective-Driven', 'Attack: plant the Spike. Defend: defuse or eliminate attackers.', 4);

        -- QCO
        INSERT INTO gamepost.quick_control_overview (game_post_id, qco_title, qco_title_desc)
        VALUES (v_id, 'Controls & Modes', 'Valorant uses standard FPS WASD controls with ability binds on Q, E, C, and X.');

        -- Control Cards
        INSERT INTO gamepost.control_cards (game_post_id, category, description, display_order) VALUES
        (v_id, 'Movement', 'WASD to move, Shift to walk silently, Ctrl to crouch.', 1),
        (v_id, 'Combat', 'Left Click to fire, Right Click to ADS, R to reload.', 2),
        (v_id, 'Abilities', 'Q = Signature, E = Skill, C = Basic, X = Ultimate.', 3),
        (v_id, 'Interface', 'Tab = Scoreboard, B = Buy Menu, M = Map.', 4);

        -- Modes
        INSERT INTO gamepost.modes (game_post_id, mode_title, mode_titledesc, display_order) VALUES
        (v_id, 'Competitive',  'Ranked play. Win to climb the leaderboard.', 1),
        (v_id, 'Unrated',      'Standard match with no rank at stake.', 2),
        (v_id, 'Spike Rush',   'Fast 4-round mode. Everyone gets the same random weapon.', 3),
        (v_id, 'Deathmatch',   'Free-for-all warm-up mode. First to 40 kills wins.', 4);

        -- System Requirements
        INSERT INTO gamepost.system_requirement (game_post_id, os_min, os_rec, processor_min, processor_rec, memory_min, memory_rec, graphics_min, graphics_rec, storage_min, storage_rec, directx_min, directx_rec)
        VALUES (v_id,
                'Windows 10 64-bit', 'Windows 11 64-bit',
                'Intel Core 2 Duo E8400', 'Intel i5-4460 / AMD Ryzen 5',
                '4 GB RAM', '8 GB RAM',
                'Intel HD 4000', 'NVIDIA GTX 1050 Ti',
                '20 GB', '20 GB SSD',
                'DirectX 11', 'DirectX 12');

        -- Expert Reviews
        INSERT INTO gamepost.expert_reviews (game_post_id, reviewer_name, outlet, rating, max_rating, quote, review_url, display_order) VALUES
        (v_id, 'Luke Reilly', 'IGN', 9.0, 10, 'Takes the best of CS:GO and Overwatch and fuses them brilliantly.', 'https://ign.com', 1),
        (v_id, 'Michael Higham', 'GameSpot', 8.0, 10, 'A brilliant blend of precision and unique agent power.', 'https://gamespot.com', 2),
        (v_id, 'Tyler Colp', 'PC Gamer', 8.5, 10, 'The best new competitive shooter in years.', 'https://pcgamer.com', 3);

        -- Get Game
        INSERT INTO gamepost.get_game (game_post_id, platform_name, affiliate_link, price_label, display_order) VALUES
        (v_id, 'PC (Riot Games)', 'https://playvalorant.com', 'Free to Play', 1);

        -- DLCs
        INSERT INTO gamepost.dlcs (game_post_id, dlc_title, dlc_type, description, price_label, display_order) VALUES
        (v_id, 'Champions 2024 Bundle', 'Season', 'Exclusive skins from the 2024 World Championship.', '6200 VP', 1),
        (v_id, 'Prime 2.0 Bundle', 'DLC', 'Premium weapon skin collection.', '7100 VP', 2);

        -- Awards
        INSERT INTO gamepost.awards_and_achievements (game_post_id, aa_title, aa_type, year, organisation, display_order) VALUES
        (v_id, 'Best Competitive Game', 'Award', 2022, 'The Game Awards', 1),
        (v_id, 'Most Played PC Game', 'Award', 2023, 'Steam Charts', 2);

        -- Community
        INSERT INTO gamepost.community_hub (game_post_id, community_branch_slug, show_live_chat, show_tournament_widget)
        VALUES (v_id, 'esports', TRUE, TRUE);

        -- Join Our Community
        INSERT INTO gamepost.join_our_community (game_post_id, platform_name, platform_link, display_order) VALUES
        (v_id, 'Discord', 'https://discord.gg/valorant', 1),
        (v_id, 'Twitter', 'https://twitter.com/VALORANT', 2),
        (v_id, 'YouTube', 'https://youtube.com/valorant', 3),
        (v_id, 'Twitch', 'https://twitch.tv/valorant', 4);

        -- Critic Rating
        INSERT INTO gamepost.critic_rating (game_post_id, score, label)
        VALUES (v_id, 8.5, 'Excellent');

        RAISE NOTICE 'Valorant game post seeded with ID %', v_id;
    END IF;
END $$;
