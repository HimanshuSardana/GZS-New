# GzoneSphere CMS API — Reference

Base URL: `http://localhost:8081`  
All CMS routes are prefixed with `/api/cms`.  
Stats dashboard: `http://localhost:8081/stats/ui`

---

## Response Envelope

All CMS endpoints return:

```json
{
  "data": { ... }
}
```

The frontend Axios client (`src/services/api/cms.js`) detects this envelope (presence of `data` key, absence of `error` key) and automatically unwraps it, so service files receive the inner payload directly via `r.data`.

Error responses from route handlers return a plain HTTP error:

```json
{ "error": "description of what went wrong" }
```

---

## Authentication

**Public endpoints** require no token.

**Admin endpoints** (under `/api/cms/admin/*`) require a valid admin JWT:

```
Authorization: Bearer <access_token>
```

The JWT is issued by the **Core API** (`POST /auth/login`) and validated by the CMS API using the same `JWT_SECRET` / `SECRET_KEY` that both services share.

### Getting an admin JWT for testing

```bash
# Log in as admin (seeded in development)
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gzonesphere.com","password":"GZS@admin2025"}'

# Copy access_token from the response, then:
export TOKEN="eyJ..."
```

---

## Seeded Data (development)

When `ENV=development`, the CMS seeds the following data on first startup.

### Seeded game slugs (flat games table)

| Slug | Title |
|------|-------|
| `valorant` | Valorant |
| `cs2` | Counter-Strike 2 |
| `bgmi` | Battlegrounds Mobile India |
| `league-of-legends` | League of Legends |
| `cyberpunk-2077` | Cyberpunk 2077 |
| `hollow-knight` | Hollow Knight |
| `elden-ring` | Elden Ring |
| `minecraft` | Minecraft |

### Seeded gameposts (rich structured content)

At minimum, a `valorant` gamepost is seeded with the full child table data (mechanics, agents/characters, modes, system requirements). Additional gameposts may be seeded — check `db/seed.go` → `SeedGamePosts()`.

### Seeded blog posts

9+ blog posts with various categories (`esports`, `game-reviews`, `community`), hero images, and featured flags.

---

## GamePost Schema

A *gamepost* is the primary structured content type for game pages. It is normalised across multiple child tables:

```
game_posts           ← parent row (one per game)
 ├── gp_mechanics    ← ordered list of gameplay mechanics
 ├── gp_characters   ← agents / champions / characters with roles + abilities
 ├── gp_modes        ← game modes (competitive, casual, ranked, etc.)
 └── gp_system_req   ← PC system requirements (min + recommended)
```

The `GET /api/cms/gameposts/:slug` endpoint joins all child tables and returns them under the `sections` key.

---

## /api/cms/games — Games (Flat)

The games table is a simpler listing model (no child tables) used for the Games hub listing view.

### GET /api/cms/games

List all published games.

**Auth:** No

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "valorant",
      "title": "Valorant",
      "short_description": "Tactical character-based shooter.",
      "description": "A 5v5 character-based tactical shooter...",
      "developer": "Riot Games",
      "publisher": "Riot Games",
      "release_date": "2020-06-02T00:00:00Z",
      "status": "published",
      "is_featured": true,
      "view_count": 45200
    }
  ]
}
```

**curl:**
```bash
curl http://localhost:8081/api/cms/games
```

---

### GET /api/cms/games/trending

Get trending games (sorted by view_count, is_featured).

**Auth:** No

**curl:**
```bash
curl http://localhost:8081/api/cms/games/trending
```

---

### GET /api/cms/games/{slug}

Get a single game by slug.

**Auth:** No

**curl:**
```bash
curl http://localhost:8081/api/cms/games/valorant
```

---

### GET /api/cms/games/{slug}/reviews

Get community reviews for a game.

**Auth:** No

---

### POST /api/cms/admin/games

Create a game (admin).

**Auth:** Yes (admin)

**Request:**
```json
{
  "slug": "apex-legends",
  "title": "Apex Legends",
  "short_description": "Battle Royale hero shooter.",
  "description": "Free-to-play battle royale hero shooter...",
  "developer": "Respawn Entertainment",
  "publisher": "EA",
  "release_date": "2019-02-04",
  "is_featured": false
}
```

**curl:**
```bash
curl -X POST http://localhost:8081/api/cms/admin/games \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"slug":"apex-legends","title":"Apex Legends","developer":"Respawn Entertainment","publisher":"EA"}'
```

---

### PATCH /api/cms/admin/games/{id}

Update a game (admin).

**Auth:** Yes (admin)

---

### PATCH /api/cms/admin/games/{id}/trending-signals

Update trending signals (view count boosts, featured flag) for a game.

**Auth:** Yes (admin)

**Request:**
```json
{
  "view_count": 50000,
  "is_featured": true
}
```

---

## /api/cms/gameposts — Rich Game Pages

GamePosts are the full structured content pages — deeper than the flat games table.

### GET /api/cms/gameposts

List all published gameposts (summary view).

**Auth:** No

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "valorant",
      "title": "Valorant",
      "tagline": "Tactical precision meets agent abilities.",
      "genre": "Tactical Shooter",
      "developer": "Riot Games",
      "hero_image_url": "...",
      "status": "published",
      "published_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

**curl:**
```bash
curl http://localhost:8081/api/cms/gameposts
```

---

### GET /api/cms/gameposts/{slug}

Get a full gamepost with all child data (mechanics, characters, modes, system requirements).

**Auth:** No

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "slug": "valorant",
    "title": "Valorant",
    "tagline": "Tactical precision meets agent abilities.",
    "genre": "Tactical Shooter",
    "developer": "Riot Games",
    "publisher": "Riot Games",
    "release_date": "2020-06-02T00:00:00Z",
    "hero_image_url": "...",
    "description": "...",
    "sections": {
      "mechanics": [
        {
          "id": "uuid",
          "title": "Gunplay",
          "description": "Precise, recoil-based shooting...",
          "order": 1
        }
      ],
      "characters": [
        {
          "id": "uuid",
          "name": "Jett",
          "role": "Duelist",
          "description": "...",
          "image_url": "...",
          "abilities": ["Cloudburst", "Updraft", "Tailwind", "Blade Storm"]
        }
      ],
      "modes": [
        {
          "id": "uuid",
          "name": "Competitive",
          "description": "Ranked 5v5 mode...",
          "player_count": "5v5"
        }
      ],
      "system_requirements": {
        "minimum": {
          "os": "Windows 7/8/10 64-bit",
          "cpu": "Intel Core 2 Duo E8400",
          "ram": "4 GB",
          "gpu": "Intel HD 4000",
          "storage": "8 GB"
        },
        "recommended": {
          "os": "Windows 10 64-bit",
          "cpu": "Intel i3-4150",
          "ram": "4 GB",
          "gpu": "GeForce GT 730",
          "storage": "8 GB"
        }
      }
    },
    "status": "published",
    "published_at": "2025-01-01T00:00:00Z"
  }
}
```

**curl:**
```bash
curl http://localhost:8081/api/cms/gameposts/valorant
```

---

### GET /api/cms/gameposts/{slug}/user-reviews

Get user-submitted reviews for a gamepost.

**Auth:** No

**Query params:** `limit` (default 20), `page`

---

### POST /api/cms/gameposts/{slug}/user-reviews

Submit a user review.

**Auth:** Yes

**Request:**
```json
{
  "rating": 9,
  "review": "Best tactical shooter available. The agent abilities add real depth."
}
```

---

### GET /api/cms/admin/gameposts

Admin view of all gameposts (includes drafts).

**Auth:** Yes (admin)

---

### POST /api/cms/admin/gameposts

Create a new gamepost.

**Auth:** Yes (admin)

**Request:**
```json
{
  "slug": "apex-legends",
  "title": "Apex Legends",
  "tagline": "Outplay. Outlast.",
  "genre": "Battle Royale",
  "developer": "Respawn Entertainment",
  "publisher": "EA",
  "release_date": "2019-02-04",
  "description": "...",
  "hero_image_url": "...",
  "mechanics": [
    { "title": "Legends", "description": "Choose from unique hero legends.", "order": 1 }
  ],
  "characters": [],
  "modes": [],
  "system_requirements": {}
}
```

**curl:**
```bash
curl -X POST http://localhost:8081/api/cms/admin/gameposts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"slug":"apex-legends","title":"Apex Legends","genre":"Battle Royale"}'
```

---

### PUT /api/cms/admin/gameposts/{id}

Update a gamepost.

**Auth:** Yes (admin)

---

### PUT /api/cms/admin/gameposts/{id}/publish

Publish a draft gamepost.

**Auth:** Yes (admin)

**Response (200):** `{ "data": { "status": "published", "published_at": "..." } }`

---

### DELETE /api/cms/admin/gameposts/{id}

Delete a gamepost (and all child rows via CASCADE).

**Auth:** Yes (admin)

---

## /api/cms/blogs — Blog Posts

### GET /api/cms/blogs

List all published blog posts ordered by `published_at DESC`.

**Auth:** No

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "valorant-patch-9-0-breakdown",
      "title": "Valorant Patch 9.0 Breakdown",
      "excerpt": "Here's what changed...",
      "category": "esports",
      "author_username": "editor_gzs",
      "hero_image_url": "...",
      "is_featured": false,
      "view_count": 1240,
      "read_time_minutes": 6,
      "published_at": "2025-04-15T10:00:00Z"
    }
  ]
}
```

**curl:**
```bash
curl http://localhost:8081/api/cms/blogs
```

---

### GET /api/cms/blogs/featured

Get featured blog posts (up to 3).

**Auth:** No

**curl:**
```bash
curl http://localhost:8081/api/cms/blogs/featured
```

---

### GET /api/cms/blogs/most-read

Get most-read blogs (sorted by view_count).

**Auth:** No

---

### GET /api/cms/blogs/trending

Get trending blogs (sorted by recent view velocity + featured flag).

**Auth:** No

---

### GET /api/cms/blogs/{slug}

Get a full blog post including body content.

**Auth:** No

**curl:**
```bash
curl http://localhost:8081/api/cms/blogs/valorant-patch-9-0-breakdown
```

---

### POST /api/cms/blogs/{slug}/like

Increment the like count for a blog post. No auth required to allow anonymous likes.

**Auth:** No

**Response (200):** `{ "data": { "likes": 42 } }`

---

### GET /api/cms/blogs/{slug}/comments

Get top-level comments for a blog post.

**Auth:** No

**Query params:** `limit`, `page`

---

### POST /api/cms/blogs/{slug}/comments

Post a comment.

**Auth:** Yes

**Request:** `{ "content": "Great breakdown of the patch!" }`

---

### POST /api/cms/blogs/{slug}/comments/{commentId}/like

Like a comment.

**Auth:** Yes

---

### POST /api/cms/blogs/{slug}/comments/{commentId}/report

Report a comment.

**Auth:** Yes

**Request:** `{ "reason": "spam" }`

---

### POST /api/cms/admin/blogs

Create a blog post (admin).

**Auth:** Yes (admin)

**Request:**
```json
{
  "slug": "top-10-esports-moments-2025",
  "title": "Top 10 Esports Moments of 2025",
  "excerpt": "The plays that defined the year.",
  "category": "esports",
  "author_username": "editor_gzs",
  "hero_image_url": "...",
  "content": "<p>...</p>",
  "is_featured": true,
  "read_time_minutes": 8,
  "status": "published"
}
```

**curl:**
```bash
curl -X POST http://localhost:8081/api/cms/admin/blogs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"slug":"test-blog","title":"Test Blog","category":"esports","status":"published"}'
```

---

### PATCH /api/cms/admin/blogs/{id}

Update a blog post.

**Auth:** Yes (admin)

---

### PATCH /api/cms/admin/blogs/{id}/signals

Update engagement signals (view count, featured flag).

**Auth:** Yes (admin)

**Request:**
```json
{
  "view_count": 5000,
  "is_featured": true
}
```

---

## /api/cms/admin/hub-settings — Hub Configuration

Hub settings control the Games hub and Blog hub display configuration (hero content, featured sections, etc.).

### GET /api/cms/admin/hub-settings

Get current hub settings. Pass `?section=games` or `?section=blogs`.

**Auth:** Yes (admin)

**curl:**
```bash
curl "http://localhost:8081/api/cms/admin/hub-settings?section=games" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (200):**
```json
{
  "data": {
    "section": "games",
    "settings": { ... }
  }
}
```

---

### PUT /api/cms/admin/hub-settings

Update hub settings.

**Auth:** Yes (admin)

**Request:**
```json
{
  "section": "games",
  "settings": {
    "hero_game_slug": "valorant",
    "featured_slugs": ["valorant", "cs2", "bgmi"]
  }
}
```

---

## /health — Health Check

### GET /health

Check service and database status.

**Auth:** No

**Response (200):**
```json
{
  "status": "healthy",
  "service": "GzoneSphere CMS API",
  "version": "1.0.0",
  "database": {
    "connected": true,
    "open_connections": 3,
    "in_use": 1,
    "idle": 2
  }
}
```

**Response (503)** when database is down:
```json
{
  "status": "degraded",
  "database": { "connected": false, "error": "connection refused" }
}
```

**curl:**
```bash
curl http://localhost:8081/health
```

---

## /stats — Service Stats

### GET /stats

JSON stats including uptime, request counts, and all registered routes.

**Auth:** No

### GET /stats/ui

Browser-rendered HTML stats dashboard with live DB pool metrics. Auto-refreshes every 5 seconds.

**Auth:** No

URL: http://localhost:8081/stats/ui

---

## Common curl Patterns

```bash
# Set your token once
export TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gzonesphere.com","password":"GZS@admin2025"}' \
  | jq -r '.data.access_token')

# List games
curl http://localhost:8081/api/cms/games | jq '.data | length'

# Get full Valorant gamepost
curl http://localhost:8081/api/cms/gameposts/valorant | jq '.data.sections | keys'

# List blogs
curl http://localhost:8081/api/cms/blogs | jq '[.data[] | .title]'

# Create a blog (admin)
curl -X POST http://localhost:8081/api/cms/admin/blogs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"slug":"my-test","title":"My Test Blog","category":"esports","status":"published","content":"<p>Hello</p>"}'
```
