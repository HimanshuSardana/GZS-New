# GzoneSphere Core API — Reference

Base URL: `http://localhost:8000`  
Documentation (Swagger UI): `http://localhost:8000/docs`

---

## Response Envelope

Every endpoint returns responses in this shape:

```json
// Success
{
  "data": { ... },
  "meta": {},
  "error": null
}

// Error
{
  "data": null,
  "error": {
    "code": "SOME_ERROR_CODE",
    "message": "Human-readable description.",
    "details": {}
  }
}
```

The frontend Axios client (`src/services/api/core.js`) automatically unwraps the envelope, so every `.then(r => r.data)` call in service files receives the inner `data` payload directly.

---

## JWT Token Structure

Tokens are HS256 JWTs signed with the `SECRET_KEY` env variable.

**Access token payload:**
```json
{
  "sub": "<user-uuid>",
  "type": "access",
  "role": "user | admin | super_admin",
  "exp": "<unix-timestamp>"
}
```

**Refresh token payload:**
```json
{
  "sub": "<user-uuid>",
  "type": "refresh",
  "exp": "<unix-timestamp>"
}
```

Lifetime: access tokens expire in `ACCESS_TOKEN_EXPIRE_MINUTES` (default 15 min), refresh tokens in `REFRESH_TOKEN_EXPIRE_DAYS` (default 7 days).

---

## Authentication

Endpoints marked **Auth: Yes** require the header:

```
Authorization: Bearer <access_token>
```

---

## /auth — Authentication

### POST /auth/register

Create a new user account. Also creates a master profile automatically.

**Auth:** No

**Request:**
```json
{
  "username": "nx_zero",
  "email": "nx_zero@gzs.com",
  "password": "GZS@demo2025"
}
```

Password rules: min 8 chars, at least one uppercase, one lowercase, one number.

**Response (201):**
```json
{
  "data": {
    "user_id": "uuid",
    "username": "nx_zero",
    "email": "nx_zero@gzs.com",
    "message": "Account created. Check email for OTP."
  }
}
```

**Errors:** `EMAIL_TAKEN` (409), `USERNAME_TAKEN` (409), `USERNAME_RESERVED` (409), `PASSWORD_TOO_SHORT` (422)

**curl:**
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"nx_zero","email":"nx_zero@gzs.com","password":"GZS@demo2025"}'
```

---

### POST /auth/login

**Auth:** No

**Request:**
```json
{
  "email": "nx_zero@gzs.com",
  "password": "GZS@demo2025"
}
```

**Response (200):**
```json
{
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "token_type": "bearer",
    "user": {
      "id": "uuid",
      "username": "nx_zero",
      "email": "nx_zero@gzs.com",
      "role": "user"
    }
  }
}
```

**Errors:** `INVALID_CREDENTIALS` (401)

**curl:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nx_zero@gzs.com","password":"GZS@demo2025"}'
```

---

### POST /auth/refresh

Exchange a valid refresh token for a new access token.

**Auth:** No

**Request:**
```json
{
  "refresh_token": "eyJ..."
}
```

**Response (200):**
```json
{
  "data": {
    "access_token": "eyJ...",
    "token_type": "bearer"
  }
}
```

**Errors:** `INVALID_REFRESH_TOKEN` (401), `INVALID_TOKEN_TYPE` (401)

**curl:**
```bash
curl -X POST http://localhost:8000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"eyJ..."}'
```

---

### POST /auth/logout

Invalidates the current session server-side.

**Auth:** Yes

**Response (200):**
```json
{ "data": { "message": "Logged out successfully" } }
```

---

### POST /auth/otp/send

Send a 6-digit OTP to the user's email for verification.

**Auth:** No

**Request:** `{ "email": "nx_zero@gzs.com" }`

**Response (200):** `{ "data": { "message": "OTP sent", "expires_in": 600 } }`

> In development the OTP is printed to the Core API console log.

---

### POST /auth/otp/verify

Verify the OTP code received by email.

**Auth:** No

**Request:** `{ "email": "nx_zero@gzs.com", "code": "123456" }`

**Response (200):** `{ "data": { "message": "Email verified", "verified": true } }`

**Errors:** `OTP_NOT_FOUND` (400), `OTP_EXPIRED` (400), `OTP_INVALID` (400)

---

### POST /auth/password/forgot

Trigger a password reset email (always returns 200 to prevent enumeration).

**Auth:** No

**Request:** `{ "email": "nx_zero@gzs.com" }`

**Response (200):** `{ "data": { "message": "If that email exists, a reset link has been sent." } }`

---

### POST /auth/password/reset

Reset password using a token from the reset email.

**Auth:** No

**Request:** `{ "token": "<reset-token>", "new_password": "GZS@newpass1" }`

**Response (200):** `{ "data": { "message": "Password reset successfully" } }`

---

## /users — User Lookup

### GET /users/me

Fetch the authenticated user's account row.

**Auth:** Yes

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "username": "nx_zero",
    "email": "nx_zero@gzs.com",
    "role": "user",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

**curl:**
```bash
curl http://localhost:8000/users/me \
  -H "Authorization: Bearer <token>"
```

---

### GET /users/u/{username}

Look up a user by their public username.

**Auth:** No

**curl:**
```bash
curl http://localhost:8000/users/u/nx_zero
```

---

## /profiles — Master & Sub-Profiles

GZS uses a two-level profile system:
- **Master profile** — one per user; stores identity, avatar, bio, trust score
- **Sub-profiles** — domain-specific pages (e.g., `dev`, `gamer`, `creator`), linked to the master

### GET /profiles/me

Get the authenticated user's master profile with stats and sub-profile summary list.

**Auth:** Yes

**Response (200):**
```json
{
  "data": {
    "profile": {
      "id": "uuid",
      "user_id": "uuid",
      "username": "nx_zero",
      "real_name": null,
      "avatar_url": null,
      "banner_url": null,
      "location": null,
      "platform_level": "Hustler",
      "trust_score": 85.0,
      "verified_checkmark": false,
      "bio": null,
      "verified_skills_count": 3,
      "companies_worked_with_count": 1
    },
    "stats": {
      "total_verified_skills": 3,
      "active_sub_profiles_count": 2,
      "companies_worked_with_count": 1
    },
    "sub_profiles": [
      {
        "id": "uuid",
        "domain": "gamer",
        "username": "nx_zero_gamer",
        "primary_role": "FPS Pro",
        "status": "active"
      }
    ]
  }
}
```

**curl:**
```bash
curl http://localhost:8000/profiles/me \
  -H "Authorization: Bearer <token>"
```

---

### PATCH /profiles/me

Update master profile fields.

**Auth:** Yes

**Request (any subset):**
```json
{
  "real_name": "Alex Chen",
  "bio": "Competitive FPS player.",
  "location": "Singapore",
  "avatar_url": "https://..."
}
```

---

### GET /profiles/{username}

Public master profile for any user.

**Auth:** No

---

### GET /profiles/me/sub

List all sub-profiles for the current user.

**Auth:** Yes

**Response (200):** `{ "data": [ { sub-profile objects } ] }`

---

### POST /profiles/me/sub

Create a new sub-profile.

**Auth:** Yes

**Request:**
```json
{
  "domain": "gamer",
  "username": "nx_zero_gamer",
  "primary_role": "FPS Pro"
}
```

---

### GET /profiles/me/sub/{type}

Get a specific sub-profile by domain type (e.g., `gamer`, `dev`, `creator`).

**Auth:** Yes

---

### PATCH /profiles/me/sub/{type}

Update a specific sub-profile.

**Auth:** Yes

---

### DELETE /profiles/me/sub/{type}

Delete a sub-profile.

**Auth:** Yes

---

### POST /profiles/me/sub/{type}/skills

Add a skill to a sub-profile.

**Auth:** Yes

**Request:**
```json
{
  "name": "Valorant",
  "category": "FPS",
  "proficiency": "expert"
}
```

---

### DELETE /profiles/me/sub/{type}/skills/{skill_id}

Remove a skill from a sub-profile.

**Auth:** Yes

---

### GET /profiles/{username}/{type}

Public sub-profile view for a given user and domain.

**Auth:** No

---

## /tournaments — Tournaments

### GET /tournaments

List all tournaments. Supports filtering.

**Auth:** No

**Query params:**

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | `upcoming`, `ongoing`, `completed` |
| `game_slug` | string | e.g., `valorant`, `csgo` |
| `domain` | string | e.g., `esports` |
| `participant_user_id` | uuid | Tournaments a specific user is registered for |

**curl:**
```bash
curl "http://localhost:8000/tournaments?status=upcoming&game_slug=valorant"
```

---

### GET /tournaments/{slug}

Get a single tournament by slug.

**Auth:** No

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "slug": "gzs-valorant-open-2025",
    "title": "GZS Valorant Open 2025",
    "game_slug": "valorant",
    "status": "upcoming",
    "prize_pool": 10000,
    "entry_fee": 0,
    "max_participants": 128,
    "start_date": "2025-07-01T00:00:00Z",
    "registration_count": 47,
    "format": "single_elimination",
    "rules": "...",
    "stages": [],
    "prize_distribution": {}
  }
}
```

---

### POST /tournaments/{id}/register

Register the current user for a tournament.

**Auth:** Yes

**Request (optional fields):**
```json
{
  "team_name": "NX Zero Squad",
  "payment_reference": "ref_abc123"
}
```

**Response (200):** `{ "data": { "registration_id": "uuid", "status": "registered" } }`

---

### GET /tournaments/{id}/registrations

List registered participants.

**Auth:** Yes

---

### GET /tournaments/{slug}/brackets

Get bracket structure.

**Auth:** No

---

### PUT /tournaments/{id}/brackets

Update brackets (admin).

**Auth:** Yes (admin)

---

### POST /tournaments/{id}/brackets/generate

Auto-generate brackets from registrations (admin).

**Auth:** Yes (admin)

---

### GET /tournaments/{slug}/results

Get match results.

**Auth:** No

---

### POST /tournaments

Create a tournament (admin).

**Auth:** Yes (admin)

**Request:**
```json
{
  "title": "GZS Valorant Open 2025",
  "game_slug": "valorant",
  "domain": "esports",
  "format": "single_elimination",
  "status": "upcoming",
  "max_participants": 128,
  "prize_pool": 10000,
  "entry_fee": 0,
  "start_date": "2025-07-01T00:00:00Z",
  "end_date": "2025-07-07T00:00:00Z",
  "registration_opens": "2025-06-01T00:00:00Z",
  "registration_closes": "2025-06-28T00:00:00Z"
}
```

---

### PUT /tournaments/{id}

Update a tournament (admin).

**Auth:** Yes (admin)

---

### DELETE /tournaments/{id}

Delete a tournament (admin).

**Auth:** Yes (admin)

---

## /community — Branches & Channels

### GET /community/branches

List all community branches.

**Auth:** No

**Response (200):** `{ "data": [ { "id", "slug", "name", "game_slug", "member_count" } ] }`

**curl:**
```bash
curl http://localhost:8000/community/branches
```

---

### GET /community/{branch_slug}

Get a single branch detail.

**Auth:** No

---

### POST /community/{branch_slug}/join

Join a branch.

**Auth:** Yes

---

### GET /community/{branch}/channels

List channels in a branch.

**Auth:** No

---

### GET /community/{branch}/{channel}/messages

Get messages in a channel. Supports cursor-based pagination with `before_id`.

**Auth:** No (read) / Yes (write)

---

### POST /community/{branch}/{channel}/messages

Send a message.

**Auth:** Yes

**Request:** `{ "content": "gg wp everyone" }`

---

### GET /community/{branch}/lfg

List LFG (Looking for Group) posts.

**Auth:** No

---

### POST /community/{branch}/lfg

Create an LFG post.

**Auth:** Yes

---

### GET /community/{branch}/showcase

Get showcase entries for a branch.

**Auth:** No

---

### GET /community/{branch}/events

List events for a branch.

**Auth:** No

---

### POST /community/{branch}/events

Create an event (subject to admin approval).

**Auth:** Yes

---

### GET /community/me/joined

Branches the current user has joined.

**Auth:** Yes

---

### GET /community/stats/live

Platform-wide live community stats.

**Auth:** No

---

## /social — Posts, Follow, Friends

### POST /posts

Create a social post.

**Auth:** Yes

**Request:**
```json
{
  "content": "Just hit Radiant rank!",
  "sub_profile_type": "gamer",
  "media_urls": []
}
```

---

### GET /posts/feed

Get the current user's social feed.

**Auth:** Yes

**Query params:** `page`, `limit`

---

### GET /posts/user/{username}

Get posts by a specific user.

**Auth:** No

---

### POST /posts/{id}/like

Like a post.

**Auth:** Yes

---

### POST /posts/{id}/comment

Comment on a post.

**Auth:** Yes

**Request:** `{ "content": "Congrats!" }`

---

### DELETE /posts/{id}

Delete own post.

**Auth:** Yes

---

### POST /follow/{username}/{sub_profile_type}

Follow a user's sub-profile.

**Auth:** Yes

**curl:**
```bash
curl -X POST http://localhost:8000/follow/nx_zero/gamer \
  -H "Authorization: Bearer <token>"
```

---

### DELETE /follow/{username}/{sub_profile_type}

Unfollow.

**Auth:** Yes

---

### POST /social/friends/{user_id}/request

Send a friend request.

**Auth:** Yes

---

### POST /social/friends/{user_id}/accept

Accept a friend request.

**Auth:** Yes

---

### GET /social/suggestions

Get suggested people to connect with.

**Auth:** Yes

---

## /companies — Company Profiles

### GET /companies

List all companies.

**Auth:** No

---

### GET /companies/{slug}

Get a company by slug.

**Auth:** No

---

### POST /companies

Create a company (verified account required).

**Auth:** Yes

**Request:**
```json
{
  "name": "Nexus Labs",
  "slug": "nexus-labs",
  "domain": "esports",
  "description": "Esports org based in Singapore."
}
```

---

### GET /companies/{slug}/team

List team members.

**Auth:** No

---

### GET /companies/{slug}/roles

List open roles.

**Auth:** No

---

### GET /companies/{slug}/talent

Talent pool applicants (company members only).

**Auth:** Yes (company member)

---

### GET /companies/{slug}/analytics

Company analytics dashboard data.

**Auth:** Yes (company member)

---

## /messages — Direct Messages

### GET /messages/conversations

List all DM conversations.

**Auth:** Yes

---

### GET /messages/{conversation_id}

Get messages in a conversation.

**Auth:** Yes

---

### POST /messages/{conversation_id}

Send a message.

**Auth:** Yes

**Request:** `{ "content": "Hey, want to team up?" }`

---

## /notifications — Notifications

### GET /notifications

Get all notifications.

**Auth:** Yes

**Response (200):**
```json
{
  "data": {
    "unread_count": 3,
    "items": [
      {
        "id": "uuid",
        "type": "friend_request",
        "message": "nx_zero sent you a friend request.",
        "read": false,
        "created_at": "2025-05-23T10:00:00Z"
      }
    ]
  }
}
```

> The frontend's `profileService.getNotifications()` extracts `r.data?.items ?? []`.

**curl:**
```bash
curl http://localhost:8000/notifications \
  -H "Authorization: Bearer <token>"
```

---

### POST /notifications/{id}/read

Mark one notification read.

**Auth:** Yes

---

### POST /notifications/read-all

Mark all notifications read.

**Auth:** Yes

---

## /reading-list — Saved Articles

### GET /reading-list

Get the current user's saved articles.

**Auth:** Yes

---

### POST /reading-list/{slug}

Save an article by slug.

**Auth:** Yes

---

### DELETE /reading-list/{slug}

Remove from reading list.

**Auth:** Yes

---

## /xp — Progression

### GET /xp/me

Get current user's XP and level.

**Auth:** Yes

**Response (200):**
```json
{
  "data": {
    "level": "Hustler",
    "current_xp": 450,
    "xp_to_next_level": 550,
    "total_xp": 4450,
    "rank": "Hustler"
  }
}
```

---

### GET /xp/leaderboard

Get the platform XP leaderboard.

**Auth:** No

---

## Error Code Reference

| Code | HTTP | Meaning |
|------|------|---------|
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `INVALID_TOKEN` | 401 | Token malformed or expired |
| `INVALID_TOKEN_TYPE` | 401 | Access token used where refresh expected |
| `TOKEN_SUBJECT_MISSING` | 401 | JWT `sub` claim is absent |
| `USER_NOT_FOUND` | 401/404 | No user for the given ID/email |
| `EMAIL_TAKEN` | 409 | Email already registered |
| `USERNAME_TAKEN` | 409 | Username already in use |
| `USERNAME_RESERVED` | 409 | Username temporarily locked |
| `PROFILE_NOT_FOUND` | 404 | No master profile found |
| `PASSWORD_TOO_SHORT` | 422 | Password under 8 characters |
| `PASSWORD_MISSING_UPPERCASE` | 422 | No uppercase letter in password |
| `OTP_EXPIRED` | 400 | OTP code TTL exceeded (10 min) |
| `OTP_INVALID` | 400 | OTP code is wrong |
| `DB_ERROR` | 503 | Database unreachable |

---

## Pagination

List endpoints accept:

| Param | Default | Description |
|-------|---------|-------------|
| `page` | `1` | Page number (1-indexed) |
| `limit` | `20` | Items per page (max 100) |
| `before_id` | — | Cursor paging for messages — fetch before this ID |

Paginated responses include:

```json
{
  "data": [ ... ],
  "meta": { "page": 1, "limit": 20, "total": 143 },
  "error": null
}
```
