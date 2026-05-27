# GzoneSphere — Database Schema Reference

## Two independent migration tracks

GzoneSphere runs two separate backend services that share one PostgreSQL instance but
own distinct schemas. Their migrations are applied by different mechanisms.

```
PostgreSQL (shared instance)
├── public schema           ← core-api (Python/FastAPI)
│   ├── users, master_profiles, sub_profiles
│   ├── user_skills, verification_queue, tools, projects
│   ├── community_branches, channels, messages, groups, lfg_posts
│   ├── showcase_posts, events, connections, follows
│   ├── xp_ledger, trust_score_history, company_profiles
│   └── admin_audit_log, moderation_queue
│
├── cms schema              ← cms-api (Go/Gin)  — hub_settings
├── gamepost schema         ← cms-api (Go/Gin)  — game pages
├── admin_gamepost schema   ← cms-api (Go/Gin)  — publish control
└── public (shared tables)
    ├── games               ← cms-api owns writes
    ├── blog_posts          ← cms-api owns writes
    ├── blog_comments       ← cms-api owns writes
    └── user_reviews        ← cms-api owns writes
```

---

## Track A — core-api (Python) migrations

### Apply order

| File | Run order | What it creates |
|------|-----------|-----------------|
| `001_initial.sql` | 1st | `users`, `games` (legacy flat), `tournaments`, `profiles` |
| `002_phase2.sql`  | 2nd | Renames `profiles` → `master_profiles`; adds sub-profiles, skills, community, admin, social, trust, companies |

These are **additive sequential migrations**, not snapshots. Apply `001` before `002`.
Both files are idempotent (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`).

In production run them once at initial setup:

```bash
psql $DATABASE_URL -f backend/sql/001_initial.sql
psql $DATABASE_URL -f backend/sql/002_phase2.sql
```

The core-api does **not** run migrations automatically — you must apply these manually
or via your deploy pipeline.

---

## Track B — cms-api (Go) migrations

The Go CMS service runs **`db/migrations.go`** automatically at startup via `RunMigrations()`.
It uses `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` throughout — fully
idempotent, safe to re-run on every restart.

`migrations.go` creates:

| Table / Schema | Notes |
|----------------|-------|
| `cms.hub_settings` | Per-section CMS config (not in any SQL file) |
| `games` | Flat game catalogue (overlaps 001_initial; see conflict note below) |
| `blog_posts` | CMS blog content |
| `blog_comments` | Comment threads on blog posts |
| `gamepost.*` (14 tables) | Structured game-page sections |
| `admin_gamepost.admin` | Publish/schedule control per game-page |
| `user_reviews` | Player reviews linked to gamepost slugs |

### `003_gamepost.sql` — reference snapshot

`003_gamepost.sql` is a **standalone snapshot** of the `gamepost` + `admin_gamepost`
schemas with Valorant seed data and triggers/views. It can be used for:

- Bootstrapping a dev database before the Go service is running
- Applying the `gamepost.v_full_game_post` view and `updated_at` triggers that
  `migrations.go` does **not** include

Run it before `migrations.go` starts (or after, since both are idempotent for tables):

```bash
psql $DATABASE_URL -f backend/sql/003_gamepost.sql
```

---

## Known conflicts and resolutions

### `games` table — column type mismatch

| Source | `release_date` column |
|--------|-----------------------|
| `001_initial.sql` | `DATE` |
| `migrations.go` | `TIMESTAMP WITH TIME ZONE` |

**Resolution:** `migrations.go` wins — it's the authoritative runtime migration.
If you run `001_initial.sql` first, the `games` table is created with `DATE`.
The Go migration then hits `CREATE TABLE IF NOT EXISTS games (...)` — a no-op since
the table already exists. The `ALTER TABLE games ADD COLUMN IF NOT EXISTS` statements
in `migrations.go` add the trending columns safely.

The `release_date` type difference is benign in current usage (no JOINs depend on it),
but should be aligned in a future explicit ALTER:

```sql
-- TODO: align release_date column type
ALTER TABLE games ALTER COLUMN release_date TYPE TIMESTAMPTZ
  USING release_date::TIMESTAMPTZ;
```

### Triggers and view — only in `003_gamepost.sql`

`migrations.go` omits the `update_updated_at_column()` trigger and
`gamepost.v_full_game_post` view. Apply `003_gamepost.sql` to add them.

### `blog_comments.status` — referenced but not defined

`dashboard.go` queries `user_reviews WHERE status='flagged'` and counts drafts in
`gamepost.game_posts`. The `blog_comments` table created by `migrations.go` has no
`status` column. If moderation flagging on comments is needed, add:

```sql
ALTER TABLE blog_comments ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
```

---

## Full fresh-database setup order

```bash
# 1. Core-api tables (run once)
psql $DATABASE_URL -f backend/sql/001_initial.sql
psql $DATABASE_URL -f backend/sql/002_phase2.sql

# 2. GamePost snapshot + seed (optional; cms-api RunMigrations() covers the tables)
psql $DATABASE_URL -f backend/sql/003_gamepost.sql

# 3. Start cms-api — RunMigrations() creates remaining cms/blog tables automatically
```

---

## Superseded files

The original files below are kept for reference but replaced by the numbered versions:

| Original file | Replaced by |
|---------------|-------------|
| `GzoneSphere_Phase1_Database.sql` | `001_initial.sql` (indexes now idempotent) |
| `GzoneSphere_Phase2_Schema.sql`   | `002_phase2.sql` (indexes now idempotent) |
| `GAMEPOST_COMPLETE_SCHEMA.sql`    | `003_gamepost.sql` (identical copy) |
