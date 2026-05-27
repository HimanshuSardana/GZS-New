# GzoneSphere — Integration Test Checklist

Use this checklist after first setup, after major merges, or whenever debugging a cross-service issue. Work through each section in order — later sections depend on earlier ones passing.

| Symbol | Meaning |
|--------|---------|
| ✅ | Passed |
| ❌ | Failed — note the error |

---

## Seed Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@gzonesphere.com` | `GZS@admin2025` |
| Demo user 1 | `nx_zero@gzs.com` | `GZS@demo2025` |
| Demo user 2 | `echo_fx@gzs.com` | `GZS@demo2025` |

> These are seeded by the Core API on first startup when `ENV=development`.

---

## 1. Prerequisites Check

| # | Check | Result |
|---|-------|--------|
| 1.1 | PostgreSQL is running on port 5432: `pg_isready -h localhost -p 5432` | |
| 1.2 | `make dev` starts without errors in all three panels | |
| 1.3 | Terminal shows Core API listening on `:8000` | |
| 1.4 | Terminal shows CMS API listening on `:8081` | |
| 1.5 | Terminal shows Vite dev server at `http://localhost:5173` | |
| 1.6 | No crash logs (`FATAL`, `panic`, `Traceback`) in any panel | |

---

## 2. Database Connection

| # | Check | URL | Expected | Result |
|---|-------|-----|----------|--------|
| 2.1 | Core API health | http://localhost:8000/health | `"connected": true` | |
| 2.2 | CMS API health | http://localhost:8081/health | `"connected": true` | |
| 2.3 | Core API stats UI | http://localhost:8000/stats/ui | Page loads, shows uptime | |
| 2.4 | CMS API stats UI | http://localhost:8081/stats/ui | Page loads, shows DB pool | |

**Quick check:**
```bash
curl -s http://localhost:8000/health | jq '.db_status.connected'
curl -s http://localhost:8081/health | jq '.database.connected'
```

---

## 3. Seed Data Verification

| # | Check | Result |
|---|-------|--------|
| 3.1 | `GET /api/cms/games` returns 8 games | |
| 3.2 | `GET /api/cms/gameposts` returns at least 1 gamepost | |
| 3.3 | `GET /api/cms/gameposts/valorant` returns full Valorant gamepost with `sections.mechanics`, `sections.characters`, `sections.modes`, `sections.system_requirements` | |
| 3.4 | `GET /api/cms/blogs` returns 9+ blog posts | |
| 3.5 | `GET /community/branches` returns 7 community branches | |
| 3.6 | `GET /tournaments` returns seeded tournaments | |

**curl commands:**
```bash
# 3.1
curl -s http://localhost:8081/api/cms/games | jq '.data | length'
# Expected: 8

# 3.3
curl -s http://localhost:8081/api/cms/gameposts/valorant | jq '.data.sections | keys'
# Expected: ["characters","mechanics","modes","system_requirements"]

# 3.4
curl -s http://localhost:8081/api/cms/blogs | jq '.data | length'
# Expected: 9 or more

# 3.5
curl -s http://localhost:8000/community/branches | jq '.data | length'
# Expected: 7

# 3.6
curl -s http://localhost:8000/tournaments | jq '.data | length'
```

---

## 4. Auth Flow

| # | Check | Result |
|---|-------|--------|
| 4.1 | `POST /auth/register` with a fresh username/email returns 201 + `user_id` | |
| 4.2 | `POST /auth/login` with demo credentials returns `access_token` + `refresh_token` | |
| 4.3 | `GET /users/me` with Bearer token returns user object | |
| 4.4 | `GET /profiles/me` with Bearer token returns master profile + sub-profiles | |
| 4.5 | `POST /auth/refresh` with refresh token returns new `access_token` | |
| 4.6 | `GET /users/me` with expired/invalid token returns 401 | |
| 4.7 | `POST /auth/login` with wrong password returns 401 + `INVALID_CREDENTIALS` | |

**curl commands:**
```bash
# 4.1 — register a fresh account
curl -s -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test_runner","email":"test_runner@gzs.com","password":"GZS@test2025"}' \
  | jq '.data.user_id'

# 4.2 — login
export TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nx_zero@gzs.com","password":"GZS@demo2025"}' \
  | jq -r '.data.access_token')
echo "Token: $TOKEN"

export REFRESH=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nx_zero@gzs.com","password":"GZS@demo2025"}' \
  | jq -r '.data.refresh_token')

# 4.3
curl -s http://localhost:8000/users/me \
  -H "Authorization: Bearer $TOKEN" | jq '.data.username'

# 4.4
curl -s http://localhost:8000/profiles/me \
  -H "Authorization: Bearer $TOKEN" | jq '.data.profile.username'

# 4.5
curl -s -X POST http://localhost:8000/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH\"}" | jq '.data.access_token' | cut -c1-20

# 4.6
curl -s http://localhost:8000/users/me \
  -H "Authorization: Bearer invalid_token" | jq '.detail.error.code'
# Expected: "INVALID_TOKEN"
```

---

## 5. Admin Auth (CMS)

| # | Check | Result |
|---|-------|--------|
| 5.1 | Log in as admin, get access token | |
| 5.2 | `GET /api/cms/admin/gameposts` with admin token returns 200 | |
| 5.3 | `GET /api/cms/admin/gameposts` without token returns 401 | |
| 5.4 | `GET /api/cms/admin/hub-settings?section=games` with admin token returns 200 | |

```bash
# 5.1
export ADMIN_TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gzonesphere.com","password":"GZS@admin2025"}' \
  | jq -r '.data.access_token')
echo "Admin token starts with: ${ADMIN_TOKEN:0:20}"

# 5.2
curl -s http://localhost:8081/api/cms/admin/gameposts \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data | length'

# 5.3
curl -s -o /dev/null -w "%{http_code}" \
  http://localhost:8081/api/cms/admin/gameposts
# Expected: 401

# 5.4
curl -s "http://localhost:8081/api/cms/admin/hub-settings?section=games" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data.section'
```

---

## 6. Frontend Integration

| # | Check | Result |
|---|-------|--------|
| 6.1 | `http://localhost:5173` loads without console errors | |
| 6.2 | `/games` page shows real game data (8 cards, with slugs like `valorant`, `cs2`) | |
| 6.3 | Clicking a game card navigates to the game detail page with real content | |
| 6.4 | `/blog` page shows 9+ real blog posts | |
| 6.5 | Clicking a blog article opens the full article with content | |
| 6.6 | `/login` page — log in with `nx_zero@gzs.com` / `GZS@demo2025` — redirects to dashboard | |
| 6.7 | After login, navbar shows username (not "Login" button) | |
| 6.8 | `/profile` page loads without `notifications.filter is not a function` error | |
| 6.9 | `/tournaments` page shows seeded tournament cards | |
| 6.10 | Logging out clears the session and redirects to `/` or `/login` | |

---

## 7. Mock Mode Toggle

| # | Check | Result |
|---|-------|--------|
| 7.1 | Set `VITE_USE_MOCK=true` in `.env.local`, restart frontend (`npm run dev:front`) | |
| 7.2 | `/games` page still loads (data comes from mock store) | |
| 7.3 | Login with any email/password succeeds (mock bypasses API) | |
| 7.4 | No network requests to `localhost:8000` or `localhost:8081` in browser DevTools Network tab | |
| 7.5 | Set `VITE_USE_MOCK=false`, restart frontend, verify real API data returns | |

---

## 8. Log Files

| # | Check | Result |
|---|-------|--------|
| 8.1 | `backend/core-api/core-api.log` exists after starting Core API | |
| 8.2 | `backend/cms-api/cms-api.log` exists after starting CMS API | |
| 8.3 | `make logs` tails both files without error | |
| 8.4 | Core API log shows request lines in format `→ GET /profiles/me \| 200 \| 12ms \| 127.0.0.1` | |

```bash
# 8.1-8.2
ls -lh backend/core-api/core-api.log backend/cms-api/cms-api.log

# 8.3
make logs   # Ctrl+C to exit

# 8.4
tail -5 backend/core-api/core-api.log
```

---

## Quick API Test — All Key Endpoints

Copy-paste this block to smoke-test everything in one shot. Requires `jq`.

```bash
#!/usr/bin/env bash
set -euo pipefail

CORE="http://localhost:8000"
CMS="http://localhost:8081/api/cms"

echo "=== CMS: Games ==="
curl -sf "$CMS/games" | jq '.data | length'

echo "=== CMS: GamePosts ==="
curl -sf "$CMS/gameposts" | jq '.data | length'

echo "=== CMS: Valorant gamepost ==="
curl -sf "$CMS/gameposts/valorant" | jq '.data.title'

echo "=== CMS: Blogs ==="
curl -sf "$CMS/blogs" | jq '.data | length'

echo "=== CMS: Featured blogs ==="
curl -sf "$CMS/blogs/featured" | jq '[.data[] | .title]'

echo "=== CMS: Trending games ==="
curl -sf "$CMS/games/trending" | jq '[.data[] | .slug]'

echo "=== Core: Health ==="
curl -sf "$CORE/health" | jq '{status, db: .db_status.connected}'

echo "=== Core: Community branches ==="
curl -sf "$CORE/community/branches" | jq '.data | length'

echo "=== Core: Tournaments ==="
curl -sf "$CORE/tournaments" | jq '.data | length'

echo "=== Core: Auth login ==="
TOKEN=$(curl -sf -X POST "$CORE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"nx_zero@gzs.com","password":"GZS@demo2025"}' \
  | jq -r '.data.access_token')
echo "Got token: ${TOKEN:0:20}..."

echo "=== Core: Users/me ==="
curl -sf "$CORE/users/me" -H "Authorization: Bearer $TOKEN" | jq '.data.username'

echo "=== Core: Profile ==="
curl -sf "$CORE/profiles/me" -H "Authorization: Bearer $TOKEN" | jq '.data.profile.username'

echo "=== Core: Notifications ==="
curl -sf "$CORE/notifications" -H "Authorization: Bearer $TOKEN" | jq '{unread: .data.unread_count}'

echo ""
echo "All checks passed."
```

Save as `scripts/smoke_test.sh` and run:

```bash
bash scripts/smoke_test.sh
```

---

## Troubleshooting Failed Checks

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Check 2.1/2.2 fail: `"connected": false` | PostgreSQL not running | `sudo service postgresql start` or start via pgAdmin |
| Check 3.x fail: empty arrays `[]` | Seed didn't run | Check `ENV=development` in backend `.env`; restart service |
| Check 4.2 fail: `INVALID_CREDENTIALS` | Seed user not created | Restart Core API; check startup logs for seed errors |
| Check 5.3 passes (no 401) | `JWT_SECRET` not set in CMS `.env` | Add `JWT_SECRET=<same value as SECRET_KEY>` in `backend/cms-api/.env` |
| Check 6.2: mock data shows | `VITE_USE_MOCK=true` still set | Edit `.env.local`, restart frontend |
| Check 6.8: `notifications.filter` error | Old code — profileService not updated | Pull latest; ensure `getNotifications` returns `.data?.items ?? []` |
| `make logs` shows no file | Services started but crashed before writing | Check terminal for startup errors |
