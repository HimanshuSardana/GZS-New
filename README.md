# GzoneSphere (GZS) Platform

GzoneSphere is a full-stack gaming community platform that combines player profiles, esports tournaments, social feeds, blogs, and a structured CMS for game content. It is built as three independent services — a React frontend, a Python FastAPI core service, and a Go Gin CMS service — all backed by a single PostgreSQL database.

---

## Architecture Overview

```
 ┌──────────────────────────────────────┐
 │  Frontend (React + Vite)             │
 │  http://localhost:5173               │
 │  Node 20 / React 18 / TanStack Query │
 └───────────┬──────────────────────────┘
             │ VITE_CORE_API_URL
             │                    VITE_CMS_API_URL
             ▼                              ▼
 ┌──────────────────────┐   ┌───────────────────────────┐
 │  Core API            │   │  CMS API                  │
 │  http://localhost:8000│   │  http://localhost:8081    │
 │  Python 3.11 / FastAPI│   │  Go 1.21 / Gin            │
 │  Auth, Profiles,     │   │  Games, Blogs,            │
 │  Tournaments,        │   │  GamePosts, Hub Settings  │
 │  Community, Social   │   │                           │
 └──────────┬───────────┘   └──────────────┬────────────┘
            │                              │
            └──────────────┬───────────────┘
                           ▼
              ┌─────────────────────────┐
              │  PostgreSQL 18          │
              │  localhost:5432         │
              │  DB: GzoneSphere        │
              │  core user: gzs_core_user│
              │  cms user:  gzs_cms_user │
              └─────────────────────────┘
```

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20+ | Frontend build and dev server |
| Python | 3.11+ | Core API |
| Go | 1.21+ | CMS API |
| PostgreSQL | 18 | Primary database |
| Docker + Compose | Any recent | Optional — only needed for `make dev-docker` |

---

## Quick Start (Local — No Docker)

### 1. Clone the repo

```bash
git clone https://github.com/GzoneSphere-1506/Frontend.git
cd Frontend-v1
```

### 2. Install all dependencies

```bash
make install
```

This runs:
- `npm install` for the frontend
- `pip install -r requirements.txt` for the Core API
- `go mod download` for the CMS API

### 3. Create the PostgreSQL database and users

```bash
make db-setup
```

This creates the `GzoneSphere` database, two app-scoped roles (`gzs_core_user`, `gzs_cms_user`), and enables the `uuid-ossp` and `pgcrypto` extensions. Requires `psql` in your PATH and a local `postgres` superuser.

### 4. Configure environment variables

```bash
# Frontend
cp .env.example .env.local

# Core API
cp backend/core-api/.env.example backend/core-api/.env

# CMS API
cp backend/cms-api/.env.example backend/cms-api/.env
```

Edit each `.env` file and set the correct `DATABASE_URL` and `SECRET_KEY` / `JWT_SECRET`. See [Environment Variables](#environment-variables) below.

### 5. Start all services

```bash
make dev
```

This starts the frontend dev server, Core API (uvicorn), and CMS API (go run) concurrently via `npm run dev:all`.

### 6. Open the app

- **Frontend:** http://localhost:5173
- **Core API docs:** http://localhost:8000/docs
- **CMS API stats:** http://localhost:8081/stats/ui

---

## Quick Start (Docker)

Docker runs PostgreSQL, Core API, and CMS API in containers. The frontend still runs locally for hot-reload.

```bash
# Start backend containers
make dev-docker

# This is equivalent to:
docker-compose -f backend/docker-compose.yml up --build -d
npm run dev:front
```

The CMS API container is mapped to port **8001** (not 8081) to avoid conflicts with any local Go process. Update `VITE_CMS_API_URL` in `.env.local` accordingly when using Docker:

```env
VITE_CMS_API_URL=http://localhost:8001/api/cms
```

---

## Environment Variables

### Frontend (`Frontend-v1/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_USE_MOCK` | `false` | Set to `true` to use local mock data with no backend required |
| `VITE_CORE_API_URL` | `http://localhost:8000` | Base URL for the Core API (no trailing slash) |
| `VITE_CMS_API_URL` | `http://localhost:8081/api/cms` | Base URL for the CMS API including `/api/cms` prefix |

### Core API (`backend/core-api/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL DSN: `postgresql://gzs_core_user:Gzone123%40@localhost:5432/GzoneSphere` |
| `SECRET_KEY` | — | JWT signing key — must be 64+ chars in production |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token lifetime |
| `ALLOWED_ORIGINS` | `*` | Comma-separated CORS origins |
| `ENV` | `development` | Set to `production` to disable seed data |
| `SQL_ECHO` | `false` | Set to `true` to log all SQL queries |

### CMS API (`backend/cms-api/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL DSN: `postgres://gzs_cms_user:Gzone123%40@localhost:5432/GzoneSphere?sslmode=disable` |
| `PORT` | `8081` | Port the CMS API listens on |
| `JWT_SECRET` | — | Must match `SECRET_KEY` in Core API (same signing secret) |
| `ALLOWED_ORIGINS` | `*` | Comma-separated CORS origins |
| `ENV` | `development` | Set to `production` to skip seed data |
| `CORE_API_URL` | — | Internal Core API URL (used for JWT validation proxy) |

---

## Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React app |
| Core API | http://localhost:8000 | FastAPI root |
| Core API Docs | http://localhost:8000/docs | Auto-generated Swagger UI |
| Core API Health | http://localhost:8000/health | DB connectivity check |
| Core API Stats | http://localhost:8000/stats/ui | Live monitoring dashboard |
| CMS API | http://localhost:8081 | Go Gin root |
| CMS API Health | http://localhost:8081/health | DB connectivity check |
| CMS API Stats | http://localhost:8081/stats/ui | Live monitoring dashboard |

---

## Project Structure

```
Frontend-v1/
├── Makefile                    # All dev commands (make dev, make install, …)
├── .env.example                # Frontend env template
├── package.json                # npm scripts including dev:all
│
├── src/                        # React application
│   ├── app/
│   │   └── router/             # React Router routes + protected route guards
│   ├── features/               # Feature-sliced modules
│   │   ├── games/              # Games listing + detail pages
│   │   ├── blogs/              # Blog listing + article pages
│   │   ├── tournaments/        # Tournament listing, brackets, registration
│   │   ├── profile/
│   │   │   ├── auth/           # Login / Register / OTP pages
│   │   │   └── dashboard/      # Profile, sub-profiles, skills pages
│   │   ├── admin/              # Admin panel (CMS + Core)
│   │   └── community/          # Branch pages, channels, LFG
│   ├── services/
│   │   ├── api/
│   │   │   ├── core.js         # Axios client for Core API + response unwrap
│   │   │   ├── cms.js          # Axios client for CMS API + response unwrap
│   │   │   ├── endpoints.js    # All endpoint paths (CORE.* and CMS.*)
│   │   │   ├── interceptors.js # Bearer token injection + 401 refresh logic
│   │   │   └── mockFallback.js # Network-error mock interceptor
│   │   └── features/
│   │       ├── authService.js
│   │       ├── profileService.js
│   │       ├── tournamentService.js
│   │       ├── gamesService.js
│   │       └── blogsService.js
│   ├── store/
│   │   └── profile/
│   │       └── useProfileStore.js  # Zustand: auth state + profile hydration
│   └── shared/
│       ├── components/         # Shared UI (Navbar, ProtectedRoute, etc.)
│       └── data/               # Static mock data (used when VITE_USE_MOCK=true)
│
└── backend/
    ├── docker-compose.yml      # Postgres + Core API + CMS API containers
    ├── init-db.sql             # Postgres init: creates roles + extensions
    │
    ├── core-api/               # Python FastAPI service
    │   ├── main.py             # App factory, middleware, startup hook
    │   ├── middleware.py       # LoggingMiddleware, ErrorHandlerMiddleware
    │   ├── auth.py             # JWT create/verify helpers
    │   ├── models.py           # SQLAlchemy ORM models
    │   ├── schemas.py          # Pydantic request/response schemas
    │   ├── database.py         # DB engine + SessionLocal factory
    │   ├── seed_data.py        # Development seed runner
    │   └── routes/             # One file per route group
    │       ├── auth.py         # /auth/*
    │       ├── profiles.py     # /profiles/*
    │       ├── users.py        # /users/*
    │       ├── tournaments.py  # /tournaments/*
    │       ├── social.py       # /posts/*, /follow/*, /social/*
    │       ├── community.py    # /community/*
    │       ├── companies.py    # /companies/*
    │       ├── messages.py     # /messages/*
    │       ├── notifications.py# /notifications/*
    │       ├── reading_list.py # /reading-list/*
    │       └── progression.py  # /xp/*
    │
    └── cms-api/                # Go Gin service
        ├── main.go             # Router setup, health/stats endpoints, server start
        ├── db/                 # DB connection, migrations, seed
        ├── handlers/           # HTTP handlers (games, gameposts, blogs)
        └── middleware/         # RequireAuth, RequireAdmin JWT middleware
```

---

## Database

### Connection

```
Host:     localhost
Port:     5432
Database: GzoneSphere
Core API user: gzs_core_user  (password: Gzone123@)
CMS API user:  gzs_cms_user   (password: Gzone123@)
```

### Auto-migration

Both services run migrations automatically at startup:

- **Core API** (`main.py` → `init_db()`): Uses SQLAlchemy `Base.metadata.create_all()` — creates all tables if they don't exist. Non-destructive on restart.
- **CMS API** (`main.go` → `db.RunMigrations()`): Runs `CREATE TABLE IF NOT EXISTS` statements. Non-destructive.

### Seed Data

When `ENV=development` (the default), both services seed demo data on startup:

- **Core API**: `seed_data.py` → `run_all_seeds(db)` — creates admin user, demo users, community branches, sample tournaments.
- **CMS API**: `db.SeedData()` — inserts 8 games, gameposts with full structured content, and 9+ blog posts.

Seeds are idempotent — they use `INSERT ... ON CONFLICT DO NOTHING` or existence checks, so restarting a service won't duplicate data.

---

## Mock Data vs Real Data

The frontend supports a mock mode controlled by `VITE_USE_MOCK` in `.env.local`.

| Mode | Setting | When to use |
|------|---------|-------------|
| Real APIs | `VITE_USE_MOCK=false` | Normal development — backends must be running |
| Mock data | `VITE_USE_MOCK=true` | UI-only development, no backend needed |

**How it works:**

- When `VITE_USE_MOCK=true`, `authService.login()` returns a hardcoded token and user object without hitting the API.
- `installMockFallback(client)` installs an Axios response interceptor that catches network errors (`ERR_NETWORK`) and returns data from the local mock store in `src/shared/data/`.
- When `VITE_USE_MOCK=false`, `installMockFallback` is a no-op and every request goes straight to the real API.

**To switch:**

```bash
# Edit .env.local
VITE_USE_MOCK=true

# Restart the dev server
npm run dev:front
```

---

## API Overview

### Core API (http://localhost:8000)

All responses are wrapped: `{ "data": <payload>, "meta": {}, "error": null }`

| Route Group | Prefix | Description |
|-------------|--------|-------------|
| Auth | `/auth` | Register, login, refresh, OTP, password reset |
| Profiles | `/profiles` | Master profile + sub-profiles (dev, gamer, creator…) |
| Users | `/users` | User lookup by username, avatar upload |
| Tournaments | `/tournaments` | CRUD, registration, brackets, results |
| Social | `/posts`, `/follow`, `/social` | Feed, likes, comments, follow/unfollow |
| Community | `/community` | Branches, channels, LFG, showcase, events |
| Companies | `/companies` | Company profiles, members, opportunities |
| Messages | `/messages` | DM conversations |
| Notifications | `/notifications` | Notification list + mark-read |
| Reading List | `/reading-list` | Save/unsave blog articles |
| XP / Progression | `/xp` | XP stats and leaderboard |

Full endpoint reference: [backend/core-api/README_API.md](backend/core-api/README_API.md)

### CMS API (http://localhost:8081)

All responses are wrapped: `{ "data": <payload> }`

| Route Group | Prefix | Auth |
|-------------|--------|------|
| Games | `/api/cms/games` | Public |
| GamePosts | `/api/cms/gameposts` | Public (writes require admin) |
| Blogs | `/api/cms/blogs` | Public (writes require admin) |
| Admin — Games | `/api/cms/admin/games` | Admin JWT |
| Admin — GamePosts | `/api/cms/admin/gameposts` | Admin JWT |
| Admin — Blogs | `/api/cms/admin/blogs` | Admin JWT |
| Admin — Hub Settings | `/api/cms/admin/hub-settings` | Admin JWT |

Full endpoint reference: [backend/cms-api/README_CMS_API.md](backend/cms-api/README_CMS_API.md)

---

## Running Individual Services

```bash
# Frontend only
npm run dev:front

# Core API only (from project root)
cd backend/core-api
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# CMS API only (from project root)
cd backend/cms-api
go run main.go
```

---

## Common Commands

| Command | Description |
|---------|-------------|
| `make install` | Install npm, pip, and Go dependencies |
| `make db-setup` | Create PostgreSQL DB, users, and extensions |
| `make dev` | Start all three services concurrently |
| `make dev-docker` | Start backend via Docker, frontend locally |
| `make logs` | Tail rotating log files for both APIs |
| `make clean` | Remove `.log` files and build artifacts |
| `make help` | Print this command list |

---

## Developer Notes

### Adding a new API endpoint

- **Core API:** Add a route to the relevant file in `backend/core-api/routes/`. Use `success_response()` / `error_response()` helpers. The router is registered in `main.py`.
- **CMS API:** Add a handler in `backend/cms-api/handlers/` and register it in `main.go` under the `cms` or `admin` group.
- **Frontend:** Add the endpoint path to `src/services/api/endpoints.js`, then call it via the relevant service file in `src/services/features/`.

### Auth flow

1. `POST /auth/login` → returns `access_token` (15 min) + `refresh_token` (7 days)
2. Frontend stores both tokens in `localStorage` under `gzs_access_token` / `gzs_refresh_token`
3. Every outgoing request gets `Authorization: Bearer <access_token>` injected by `interceptors.js`
4. On 401, the interceptor tries `POST /auth/refresh` with the stored refresh token — if it succeeds, the failed request is retried with the new token; if it fails, the user is logged out and redirected to `/login`

The JWT payload contains: `{ sub: userId, type: "access"|"refresh", role: "user"|"admin"|"super_admin" }`

### UI development without backend

Set `VITE_USE_MOCK=true` in `.env.local` and restart the frontend. You can log in with any email/password — the mock returns a demo admin user automatically.

### Logs

Both APIs write rotating log files in addition to stdout:

```bash
# Tail both logs live
make logs

# Or directly
tail -f backend/core-api/core-api.log backend/cms-api/cms-api.log
```

Log format: `2025-05-23 12:34:56 INFO     main — → GET /profiles/me | 200 | 8ms | 127.0.0.1`

---

## Troubleshooting

### "password authentication failed for user"

The correct credentials are `gzs_core_user` / `gzs_cms_user` with password `Gzone123@`. Run `make db-setup` to create them. Verify your `DATABASE_URL` in `.env` uses URL-encoded `%40` for the `@` in the password: `Gzone123%40`.

### "Database connection failed" / `isCoreUnavailable: true`

The backend isn't running or is on a different port. Check that `make dev` started without errors and that `VITE_CORE_API_URL` / `VITE_CMS_API_URL` match where the services are actually listening.

### CORS errors in the browser

Add your frontend origin to `ALLOWED_ORIGINS` in the backend `.env` files. Example:

```env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### "401 Unauthorized" on every request

Two common causes:
1. **Token expired** — log out and log back in, or check `ACCESS_TOKEN_EXPIRE_MINUTES`.
2. **JWT secret mismatch** — `SECRET_KEY` (Core API) and `JWT_SECRET` (CMS API) must be the same string so the CMS can validate tokens issued by the Core API.

### "Port already in use"

```bash
# Find what's using port 8000
lsof -ti:8000 | xargs kill -9   # macOS/Linux
netstat -ano | findstr :8000     # Windows
```

Or change the port in the service's `.env` and update the corresponding `VITE_*` variable in `.env.local`.

### Frontend shows mock data even though `VITE_USE_MOCK=false`

The Vite dev server caches env files. After editing `.env.local`, stop and restart with `npm run dev:front` — a hot reload is not enough.
