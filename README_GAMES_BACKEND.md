# GzoneSphere — Games Backend Connection Guide

## Architecture at a Glance

```
Browser (React + Vite :5173)
  │
  ├─ /api/v1/*        → FastAPI Core (Python :8000)  — Auth, Profiles, Users
  └─ /api/cms/*       → Go CMS API         (:8080)  — Games, GamePosts, Blogs
                                │
                           PostgreSQL :5432
                           ├── public schema       (users, games flat table)
                           ├── gamepost schema     (all GamePost sections)
                           └── admin_gamepost      (publish/draft/schedule)
```

---

## 1. Database Schemas Explained

### `gamepost` schema (NEW — what you built)
| Table | Purpose |
|---|---|
| `game_posts` | Root table — slug, status, brand_color |
| `hero` | Cinematic hero section content |
| `game_info` | Developer, publisher, release date, genres, platforms |
| `storyline` | Lore paragraphs + summary |
| `carousel` | Images + YouTube embeds |
| `gameplay` | Overview paragraph + key title/desc |
| `gameplay_mechanics` | Repeating rows (Precision Gameplay, Agent Abilities…) |
| `quick_control_overview` | Title + intro for controls section |
| `control_cards` | 2×2 grid cards (Movement, Combat, Abilities, Interface) |
| `modes` | Game mode list (Competitive, Spike Rush…) |
| `system_requirement` | Min/Rec PC specs |
| `expert_reviews` | IGN, GameSpot, PC Gamer reviews |
| `get_game` | Store links per platform |
| `dlcs` | DLC / Season Pass entries |
| `awards_and_achievements` | GOTY etc. |
| `related_games` | More Like This slugs |
| `community_hub` | Branch slug config |
| `join_our_community` | Discord, Twitter, YouTube links |
| `critic_rating` | Aggregate score + label |

### `admin_gamepost` schema
| Table | Purpose |
|---|---|
| `admin` | Draft/publish/schedule state per game post |

---

## 2. API Endpoints (Go CMS API)

### Public
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/cms/gameposts` | List all published game posts (lightweight) |
| GET | `/api/cms/gameposts/:slug` | Full game post with ALL sections |
| GET | `/api/cms/games` | Legacy flat game list |
| GET | `/api/cms/games/trending` | Top 6 by view count |

### Admin (requires JWT admin token)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/cms/admin/gameposts` | All posts with draft/publish status |
| POST | `/api/cms/admin/gameposts` | Create new game post (full payload) |
| PUT | `/api/cms/admin/gameposts/:id/publish` | Publish a draft |
| DELETE | `/api/cms/admin/gameposts/:id` | Delete game post (cascades all sections) |

---

## 3. How to Run Everything

### Step 1 — Start the Backend (Docker)
```bash
cd backend
docker compose up -d
```

This starts:
- **PostgreSQL** on `localhost:5432`
- **FastAPI Core API** on `localhost:8000`
- **Go CMS API** on `localhost:8080`

The Go CMS API automatically runs `RunMigrations()` on startup, which creates:
- All `gamepost.*` tables
- All `admin_gamepost.*` tables
- Legacy `games` and `blog_posts` tables

### Step 2 — Seed the Database
The Go CMS API seeds Valorant automatically on first run (if `gamepost.game_posts` is empty).

To seed additional games, run the full SQL file:
```bash
docker exec -i gzs_postgres psql -U gzone_user -d gzonesphere < GAMEPOST_COMPLETE_SCHEMA.sql
```

### Step 3 — Connect Frontend to Backend
Edit `.env.local` in the project root:
```env
VITE_USE_MOCK=false
VITE_CORE_API_URL=http://localhost:8000/api/v1
VITE_CMS_API_URL=http://localhost:8080/api/cms
```

### Step 4 — Start Frontend
```bash
npm install   # first time only
npm run dev
```

Frontend runs at `http://localhost:5173`.

---

## 4. Data Flow: GamePostPage

```
User visits /games/valorant
      │
GamePostPage.jsx
      │
useGame('valorant')       ← alias for useGamePost (updated)
      │
gamesService.getGamePost('valorant')
      │
safeApiCall(
  real: GET /api/cms/gameposts/valorant,
  mock: MOCK_GAMES_LIST.find(slug)      ← fallback while backend is down
)
      │
contentAdapters.adaptGameRecord(data)
      ├── DB shape bridge (game_post_id detected → normalises DB arrays)
      └── Section components receive normalised props
```

---

## 5. Adding a New Game Post

### Via Admin Panel (UI)
Go to `/admin/games/create` — uses `GamePostWizard.jsx`

### Via API (direct)
```bash
curl -X POST http://localhost:8080/api/cms/admin/gameposts \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "elden-ring",
    "status": "draft",
    "brand_color": "#C0A060",
    "hero": {
      "game_title": "Elden Ring",
      "game_desc_short": "Become Elden Lord in the Lands Between.",
      "background_img": "https://...",
      "cta_href": "https://store.steampowered.com/app/1245620/"
    },
    "game_info": {
      "developer": "FromSoftware",
      "publisher": "Bandai Namco",
      "release_date": "2022-02-25",
      "genres": "Action, RPG, Open World",
      "platforms": "PC, PS5, Xbox Series X"
    },
    "storyline": {
      "paragraphs": "In the Lands Between...",
      "summary": "An epic open-world RPG from FromSoftware."
    },
    "modes": [
      { "mode_title": "Story", "mode_titledesc": "Single player journey.", "display_order": 1 },
      { "mode_title": "Invasion", "mode_titledesc": "PvP invasion mechanics.", "display_order": 2 }
    ],
    "system_requirement": {
      "show_section": true,
      "os_min": "Windows 10/11",
      "os_rec": "Windows 11",
      "processor_min": "Intel Core i5-8600K",
      "processor_rec": "Intel Core i7-8700K",
      "memory_min": "12 GB RAM",
      "memory_rec": "16 GB RAM",
      "graphics_min": "NVIDIA GeForce GTX 1060 3 GB",
      "graphics_rec": "NVIDIA GeForce GTX 1070 8 GB",
      "storage_min": "60 GB SSD",
      "storage_rec": "60 GB NVMe SSD",
      "directx_min": "DirectX 12",
      "directx_rec": "DirectX 12"
    },
    "get_game": [
      { "platform_name": "Steam", "affiliate_link": "https://store.steampowered.com/app/1245620/", "price_label": "₹4,999", "display_order": 1 }
    ],
    "join_our_community": [
      { "platform_name": "Discord", "platform_link": "https://discord.gg/eldenring", "display_order": 1 }
    ],
    "critic_rating": { "score": 9.6, "label": "Outstanding" }
  }'
```

Then publish it:
```bash
curl -X PUT http://localhost:8080/api/cms/admin/gameposts/2/publish \
  -H "Authorization: Bearer YOUR_ADMIN_JWT"
```

---

## 6. Useful Docker Commands

```bash
# View all service logs
cd backend && docker compose logs -f

# View just CMS API logs
docker compose logs -f cms-api

# Connect to Postgres directly
docker exec -it gzs_postgres psql -U gzone_user -d gzonesphere

# Check gamepost tables
docker exec -it gzs_postgres psql -U gzone_user -d gzonesphere -c "\dt gamepost.*"

# Reset everything (warning: wipes data)
docker compose down -v && docker compose up -d

# Rebuild after code changes
docker compose up --build -d cms-api
```

---

## 7. Troubleshooting

### Frontend shows mock data even with `VITE_USE_MOCK=false`
→ Backend is not running. Check: `docker compose ps` and `docker compose logs cms-api`

### Go CMS fails to start
→ Usually PostgreSQL isn't ready yet. Docker compose has a healthcheck, but if it fails:
```bash
docker compose restart cms-api
```

### `gamepost schema does not exist` error
→ Migrations didn't run. Restart cms-api: `docker compose restart cms-api`

### CORS errors in browser
→ Check `ALLOWED_ORIGINS` in `docker-compose.yml` includes `http://localhost:5173`
