package db

import (
	"log"
)

// RunMigrations creates necessary tables if they don't exist
func RunMigrations() {
	queries := []string{
		// ── Extensions ──────────────────────────────────────────────────────
		`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
		`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,

		// ── Schemas ─────────────────────────────────────────────────────────
		`CREATE SCHEMA IF NOT EXISTS cms`,
		`CREATE SCHEMA IF NOT EXISTS gamepost`,
		`CREATE SCHEMA IF NOT EXISTS admin_gamepost`,

		// ── Hub Settings ─────────────────────────────────────────────────────
		`CREATE TABLE IF NOT EXISTS cms.hub_settings (
			id            SERIAL       PRIMARY KEY,
			section       VARCHAR(50)  UNIQUE NOT NULL,
			settings_json JSONB        NOT NULL DEFAULT '{}',
			updated_at    TIMESTAMP    DEFAULT NOW()
		)`,

		// ── Legacy flat games table ─────────────────────────────────────────
		`CREATE TABLE IF NOT EXISTS games (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			slug VARCHAR(100) UNIQUE NOT NULL,
			title VARCHAR(255) NOT NULL,
			description TEXT,
			short_description VARCHAR(500),
			developer VARCHAR(100),
			publisher VARCHAR(100),
			release_date TIMESTAMP WITH TIME ZONE,
			status VARCHAR(20) DEFAULT 'published',
			is_featured BOOLEAN DEFAULT FALSE,
			view_count INTEGER DEFAULT 0,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_games_slug ON games(slug)`,
		`ALTER TABLE games ADD COLUMN IF NOT EXISTS tournament_participants_7d INTEGER DEFAULT 0`,
		`ALTER TABLE games ADD COLUMN IF NOT EXISTS community_activity_7d INTEGER DEFAULT 0`,
		`ALTER TABLE games ADD COLUMN IF NOT EXISTS trending_score NUMERIC(10,2) DEFAULT 0`,

		// ── Blog posts ──────────────────────────────────────────────────────
		`CREATE TABLE IF NOT EXISTS blog_posts (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			slug VARCHAR(200) UNIQUE NOT NULL,
			title VARCHAR(255) NOT NULL,
			content TEXT,
			content_plain TEXT,
			excerpt VARCHAR(300),
			category VARCHAR(50),
			blog_type VARCHAR(50),
			author_id UUID,
			author_username VARCHAR(50),
			author_domain VARCHAR(20),
			hero_image_url TEXT,
			is_featured BOOLEAN DEFAULT FALSE,
			view_count INTEGER DEFAULT 0,
			like_count INTEGER DEFAULT 0,
			read_time_minutes INTEGER DEFAULT 5,
			status VARCHAR(20) DEFAULT 'draft',
			game_slug VARCHAR(200),
			tags TEXT[],
			published_at TIMESTAMP WITH TIME ZONE,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_blog_posts_slug     ON blog_posts(slug)`,
		`CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category)`,
		`CREATE INDEX IF NOT EXISTS idx_blog_posts_status   ON blog_posts(status)`,
		`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS views_24h INTEGER DEFAULT 0`,
		`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS likes_24h INTEGER DEFAULT 0`,

		// ── Blog Comments ────────────────────────────────────────────────────
		`CREATE TABLE IF NOT EXISTS blog_comments (
			id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
			blog_slug        TEXT         NOT NULL REFERENCES blog_posts(slug) ON DELETE CASCADE,
			user_id          UUID         NOT NULL,
			username         TEXT         NOT NULL,
			avatar_url       TEXT,
			sub_profile_type TEXT,
			domain_badge     TEXT,
			text             TEXT         NOT NULL CHECK (char_length(text) BETWEEN 1 AND 1000),
			parent_id        UUID         REFERENCES blog_comments(id) ON DELETE CASCADE,
			like_count       INTEGER      DEFAULT 0,
			is_reported      BOOLEAN      DEFAULT FALSE,
			report_reason    TEXT,
			created_at       TIMESTAMPTZ  DEFAULT NOW(),
			updated_at       TIMESTAMPTZ  DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_blog_comments_slug ON blog_comments(blog_slug, created_at DESC)`,

		// ── GamePost root ────────────────────────────────────────────────────
		`CREATE TABLE IF NOT EXISTS gamepost.game_posts (
			game_post_id SERIAL      PRIMARY KEY,
			slug         VARCHAR(120) UNIQUE NOT NULL,
			status       VARCHAR(20)  NOT NULL DEFAULT 'draft',
			brand_color  VARCHAR(7)   DEFAULT '#E53935',
			is_featured  BOOLEAN      NOT NULL DEFAULT FALSE,
			view_count   INTEGER      NOT NULL DEFAULT 0,
			created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
			updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_gp_slug   ON gamepost.game_posts(slug)`,
		`CREATE INDEX IF NOT EXISTS idx_gp_status ON gamepost.game_posts(status)`,

		// ── Hero ─────────────────────────────────────────────────────────────
		`CREATE TABLE IF NOT EXISTS gamepost.hero (
			game_post_id    INT PRIMARY KEY,
			game_title      TEXT NOT NULL,
			game_desc_short TEXT,
			background_img  TEXT,
			logo_img        TEXT,
			cta_label       VARCHAR(60) DEFAULT 'Get Access',
			cta_href        TEXT,
			trailer_url     TEXT,
			FOREIGN KEY (game_post_id) REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
		)`,

		// ── Game Info ────────────────────────────────────────────────────────
		`CREATE TABLE IF NOT EXISTS gamepost.game_info (
			game_post_id       INT PRIMARY KEY,
			developer          TEXT,
			publisher          TEXT,
			release_date       DATE,
			genres             TEXT,
			platforms          TEXT,
			profile_size_photo TEXT,
			FOREIGN KEY (game_post_id) REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
		)`,

		// ── Storyline ────────────────────────────────────────────────────────
		`CREATE TABLE IF NOT EXISTS gamepost.storyline (
			game_post_id INT  PRIMARY KEY,
			paragraphs   TEXT,
			summary      TEXT,
			FOREIGN KEY (game_post_id) REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
		)`,

		// ── Carousel ─────────────────────────────────────────────────────────
		`CREATE TABLE IF NOT EXISTS gamepost.carousel (
			carousel_id   SERIAL PRIMARY KEY,
			game_post_id  INT    NOT NULL,
			media_type    VARCHAR(10) NOT NULL DEFAULT 'image',
			yt_url        TEXT,
			upload_url    TEXT,
			caption       TEXT,
			display_order INT NOT NULL DEFAULT 0,
			FOREIGN KEY (game_post_id) REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
		)`,

		// ── Gameplay ─────────────────────────────────────────────────────────
		`CREATE TABLE IF NOT EXISTS gamepost.gameplay (
			game_post_id        INT PRIMARY KEY,
			paragraph           TEXT,
			gameplay_title      TEXT,
			gameplay_title_desc TEXT,
			FOREIGN KEY (game_post_id) REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS gamepost.gameplay_mechanics (
			mechanic_id   SERIAL PRIMARY KEY,
			game_post_id  INT    NOT NULL,
			title         TEXT   NOT NULL,
			description   TEXT,
			display_order INT    NOT NULL DEFAULT 0,
			FOREIGN KEY (game_post_id) REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
		)`,

		// ── Quick Control Overview ────────────────────────────────────────────
		`CREATE TABLE IF NOT EXISTS gamepost.quick_control_overview (
			game_post_id   INT PRIMARY KEY,
			qco_title      TEXT,
			qco_title_desc TEXT,
			FOREIGN KEY (game_post_id) REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS gamepost.control_cards (
			card_id       SERIAL PRIMARY KEY,
			game_post_id  INT    NOT NULL,
			category      VARCHAR(60) NOT NULL,
			description   TEXT,
			display_order INT    NOT NULL DEFAULT 0,
			FOREIGN KEY (game_post_id) REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
		)`,

		// ── Game Modes ────────────────────────────────────────────────────────
		`CREATE TABLE IF NOT EXISTS gamepost.modes (
			modes_id       SERIAL PRIMARY KEY,
			game_post_id   INT    NOT NULL,
			mode_title     TEXT   NOT NULL,
			mode_titledesc TEXT,
			display_order  INT    NOT NULL DEFAULT 0,
			FOREIGN KEY (game_post_id) REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
		)`,

		// ── System Requirements ────────────────────────────────────────────────
		`CREATE TABLE IF NOT EXISTS gamepost.system_requirement (
			game_post_id  INT     PRIMARY KEY,
			show_section  BOOLEAN NOT NULL DEFAULT TRUE,
			os_min        TEXT, os_rec        TEXT,
			processor_min TEXT, processor_rec TEXT,
			memory_min    TEXT, memory_rec    TEXT,
			graphics_min  TEXT, graphics_rec  TEXT,
			storage_min   TEXT, storage_rec   TEXT,
			directx_min   TEXT, directx_rec   TEXT,
			FOREIGN KEY (game_post_id) REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
		)`,

		// ── Expert Reviews ────────────────────────────────────────────────────
		`CREATE TABLE IF NOT EXISTS gamepost.expert_reviews (
			review_id     SERIAL PRIMARY KEY,
			game_post_id  INT    NOT NULL,
			reviewer_name TEXT   NOT NULL,
			outlet        TEXT,
			rating        NUMERIC(4,1),
			max_rating    NUMERIC(4,1) DEFAULT 10,
			quote         TEXT,
			review_url    TEXT,
			display_order INT    NOT NULL DEFAULT 0,
			FOREIGN KEY (game_post_id) REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
		)`,

		// ── Get Game ─────────────────────────────────────────────────────────
		`CREATE TABLE IF NOT EXISTS gamepost.get_game (
			get_game_id    SERIAL PRIMARY KEY,
			game_post_id   INT    NOT NULL,
			platform_name  VARCHAR(60),
			affiliate_link TEXT,
			price_label    VARCHAR(60) DEFAULT 'Free to Play',
			display_order  INT    NOT NULL DEFAULT 0,
			FOREIGN KEY (game_post_id) REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
		)`,

		// ── DLCs ─────────────────────────────────────────────────────────────
		`CREATE TABLE IF NOT EXISTS gamepost.dlcs (
			dlc_id        SERIAL PRIMARY KEY,
			game_post_id  INT    NOT NULL,
			dlc_title     TEXT   NOT NULL,
			dlc_type      VARCHAR(20) DEFAULT 'DLC',
			release_date  DATE,
			description   TEXT,
			price_label   VARCHAR(60),
			store_link    TEXT,
			display_order INT    NOT NULL DEFAULT 0,
			FOREIGN KEY (game_post_id) REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
		)`,

		// ── Awards & Achievements ─────────────────────────────────────────────
		`CREATE TABLE IF NOT EXISTS gamepost.awards_and_achievements (
			aa_id         SERIAL PRIMARY KEY,
			game_post_id  INT    NOT NULL,
			aa_title      TEXT   NOT NULL,
			aa_type       VARCHAR(20) DEFAULT 'Award',
			year          INT,
			organisation  TEXT,
			display_order INT    NOT NULL DEFAULT 0,
			aa_pt         TEXT,
			FOREIGN KEY (game_post_id) REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
		)`,

		// ── Related Games ─────────────────────────────────────────────────────
		`CREATE TABLE IF NOT EXISTS gamepost.related_games (
			related_id    SERIAL PRIMARY KEY,
			game_post_id  INT    NOT NULL,
			related_slug  VARCHAR(120) NOT NULL,
			display_order INT    NOT NULL DEFAULT 0,
			FOREIGN KEY (game_post_id) REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
		)`,

		// ── Community Hub ─────────────────────────────────────────────────────
		`CREATE TABLE IF NOT EXISTS gamepost.community_hub (
			game_post_id           INT PRIMARY KEY,
			community_branch_slug  TEXT,
			show_live_chat         BOOLEAN DEFAULT TRUE,
			show_tournament_widget BOOLEAN DEFAULT TRUE,
			FOREIGN KEY (game_post_id) REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
		)`,

		// ── Join Our Community ────────────────────────────────────────────────
		`CREATE TABLE IF NOT EXISTS gamepost.join_our_community (
			community_id  SERIAL PRIMARY KEY,
			game_post_id  INT    NOT NULL,
			platform_name VARCHAR(60) NOT NULL,
			platform_link TEXT        NOT NULL,
			display_order INT    NOT NULL DEFAULT 0,
			FOREIGN KEY (game_post_id) REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
		)`,

		// ── Critic Rating ─────────────────────────────────────────────────────
		`CREATE TABLE IF NOT EXISTS gamepost.critic_rating (
			game_post_id INT     PRIMARY KEY,
			score        NUMERIC(4,1),
			label        VARCHAR(40),
			signup_href  TEXT DEFAULT '/signup',
			FOREIGN KEY (game_post_id) REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
		)`,

		// ── User Reviews ─────────────────────────────────────────────────────────
		`CREATE TABLE IF NOT EXISTS user_reviews (
			id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
			gamepost_slug    VARCHAR(120) NOT NULL REFERENCES gamepost.game_posts(slug) ON DELETE CASCADE,
			user_id          UUID         NOT NULL,
			username         TEXT         NOT NULL,
			sub_profile_type TEXT,
			rating           INTEGER      NOT NULL CHECK (rating BETWEEN 1 AND 5),
			text             TEXT         NOT NULL,
			status           TEXT         NOT NULL DEFAULT 'pending',
			flag_reason      TEXT,
			helpful_votes    INTEGER      DEFAULT 0,
			created_at       TIMESTAMPTZ  DEFAULT NOW(),
			updated_at       TIMESTAMPTZ  DEFAULT NOW(),
			UNIQUE(gamepost_slug, user_id)
		)`,
		`CREATE INDEX IF NOT EXISTS idx_user_reviews_slug   ON user_reviews(gamepost_slug)`,
		`CREATE INDEX IF NOT EXISTS idx_user_reviews_status ON user_reviews(status)`,

		// ── Admin GamePost ────────────────────────────────────────────────────
		`CREATE TABLE IF NOT EXISTS admin_gamepost.admin (
			game_post_id   INT         PRIMARY KEY,
			created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			published_at   TIMESTAMPTZ,
			scheduled_at   TIMESTAMPTZ,
			saved_as_draft BOOLEAN     NOT NULL DEFAULT TRUE,
			last_edited_by TEXT,
			CONSTRAINT fk_admin_game_post
				FOREIGN KEY (game_post_id)
				REFERENCES gamepost.game_posts(game_post_id) ON DELETE CASCADE
		)`,
	}

	for _, q := range queries {
		if _, err := DB.Exec(q); err != nil {
			log.Fatalf("Migration error: %v\nQuery: %s", err, q[:min(len(q), 120)])
		}
	}

	log.Println("✅ Database migrations completed successfully")
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
