#!/usr/bin/env python3
"""
=============================================================================
GzoneSphere – Redis 7 Setup & Key Reference
File: 03_redis_setup.py

Run this script once after Redis is installed to verify connection
and set initial keys. It is also the living reference for every
Redis key pattern used by both backends.

Prerequisites:
    pip install redis
Run:
    python 03_redis_setup.py
=============================================================================
"""

import redis
import json

# -- Connect ---------------------------------------------------------------
# Change host/port/password to match your Redis server
r = redis.Redis(
    host="localhost",
    port=6379,
    password=None,          # set to your requirepass value if configured
    decode_responses=True
)

def check_connection():
    try:
        r.ping()
        print("✓ Redis connection OK")
        info = r.info("server")
        print(f"  Redis version : {info['redis_version']}")
        print(f"  Mode          : {info['redis_mode']}")
    except redis.ConnectionError as e:
        print(f"✗ Redis connection FAILED: {e}")
        raise

# -- Key Pattern Reference -------------------------------------------------
#
# NAMESPACE RULE:
#   core: prefix  – FastAPI backend owns these keys
#   cms:  prefix  – Golang CMS backend owns these keys
#
# Keys are NEVER the source of truth. Everything in Redis can be rebuilt
# from PostgreSQL or MongoDB if lost.
#
# =============================================================================
# CORE: NAMESPACE – FastAPI
# =============================================================================
#
# KEY: core:session:{user_id}:{device_id}
# VALUE: refresh token hash (bcrypt)
# TTL:  30 days (2592000 seconds)
# PURPOSE: Validates JWT refresh. Logout = DEL this key.
# ADMIN:   Can view/revoke via admin panel → User detail → Active sessions
#
# KEY: core:otp:{email}
# VALUE: JSON {"hash": "...", "attempts": 0}
# TTL:  600 seconds (10 minutes)
# PURPOSE: Email OTP verification. Auto-expires.
# RATE:  3 OTPs per hour per email (enforced via separate rate key)
#
# KEY: core:rate:{endpoint_hash}:{ip_address}
# VALUE: integer counter
# TTL:  60 seconds (sliding window)
# PURPOSE: Per-endpoint, per-IP rate limiting (middleware)
# ADMIN:   Can manually DEL to unblock a false-positive IP
#
# KEY: core:online:{branch_slug}:{channel_id}
# VALUE: Redis SET of user_id strings
# TTL:  None (managed by WebSocket connect/disconnect)
# PURPOSE: Real-time online presence in channels. SADD on connect, SREM on disconnect.
# READ:  SCARD = online count, SMEMBERS = list of online users
#
# KEY: core:unread:{user_id}:{channel_id}
# VALUE: integer (unread message count)
# TTL:  None
# PURPOSE: Unread badge counts per channel per user
# RESET: SET to 0 when user opens the channel
#
# KEY: core:ws:community:{branch_slug}:{channel_id}
# VALUE: Redis Pub/Sub channel (not a stored key)
# PURPOSE: WebSocket fan-out. FastAPI publishes here, all subscribers receive.
# Pattern: PUBLISH core:ws:community:dev:channel-uuid '{"type":"message","data":{...}}'
#
# KEY: core:ws:dm:{conversation_id}
# VALUE: Redis Pub/Sub channel
# PURPOSE: DM real-time delivery
#
# KEY: core:profile:{user_id}
# VALUE: JSON of master profile (public view)
# TTL:  300 seconds (5 minutes)
# PURPOSE: Cache public profile pages. Busted on PATCH /profiles/me
#
# KEY: core:feed:{user_id}:page:{cursor}
# VALUE: JSON array of feed items
# TTL:  60 seconds
# PURPOSE: Cache home feed pages
#
# KEY: core:friend_ids:{user_id}
# VALUE: JSON array of friend UUIDs
# TTL:  120 seconds
# PURPOSE: Feed builder caches friend list to avoid repeated DB calls
#
# =============================================================================
# CMS: NAMESPACE – Golang CMS
# =============================================================================
#
# KEY: cms:game:{slug}
# VALUE: Full serialised GamePost JSON (all 9 sections merged)
# TTL:  300 seconds (5 minutes)
# PURPOSE: Game page cache. Hit = serve directly. Miss = query PG, set, serve.
# BUST:  On any admin edit. GamePost edit page calls InvalidateGameCache(slug).
#
# KEY: cms:games:list:{hash_of_filter_params}
# VALUE: JSON array of game cards (filtered/paginated list)
# TTL:  60 seconds
# PURPOSE: Games browse page. Hash ensures different filter combos are cached separately.
# BUST:  On any game status/featured change (wildcard SCAN+DEL cms:games:list:*)
#
# KEY: cms:games:trending
# VALUE: JSON array of top 6 game slugs with scores
# TTL:  3600 seconds (1 hour)
# PURPOSE: Trending games widget. Recomputed by Go cron every hour.
#
# KEY: cms:games:gallery
# VALUE: JSON array of gallery game slugs (admin-curated order)
# TTL:  600 seconds
# PURPOSE: Homepage games gallery carousel
#
# KEY: cms:blog:{slug}
# VALUE: Full serialised blog article JSON
# TTL:  120 seconds (2 minutes)
# PURPOSE: Blog article cache
# BUST:  On admin edit or publish status change
#
# KEY: cms:blogs:list:{hash_of_params}
# VALUE: JSON array of blog cards
# TTL:  60 seconds
# PURPOSE: Blog listing page cache
#
# KEY: cms:views:pending:{slug}
# VALUE: integer (buffered view count increment)
# TTL:  None (flushed every 5 minutes by Go cron)
# PURPOSE: Avoids per-request DB write for view counts.
#          Go cron: GETDEL cms:views:pending:* → UPDATE blog_posts SET view_count += N
#
# KEY: cms:tournament:{slug}
# VALUE: Full tournament JSON
# TTL:  60 seconds
# PURPOSE: Tournament detail page cache
#
# KEY: cms:tournaments:list
# VALUE: JSON array of tournament cards
# TTL:  60 seconds
# PURPOSE: Tournament listing cache
#
# =============================================================================
# QUEUE KEYS – Celery (FastAPI) uses these as task queues
# =============================================================================
#
# KEY: queue:email       – Email sending tasks (OTP, notifications, digests)
# KEY: queue:ai          – Claude API calls (profile headlines, moderation)
# KEY: queue:xp          – XP calculation and trust score recalculation
# KEY: queue:cache_warm  – Pre-warming caches after admin edits
# KEY: queue:notifs      – Push notification dispatch
#
# These are standard Redis LIST keys used by Celery.
# Admin panel shows queue depths via LLEN queue:*
#
# =============================================================================

INITIAL_PLATFORM_CONFIG = {
    "cms:games:trending": json.dumps([]),       # empty until first game is added
    "cms:games:gallery":  json.dumps([]),
}

def set_initial_keys():
    """Set initial placeholder keys so backends don't crash on first run."""
    for key, value in INITIAL_PLATFORM_CONFIG.items():
        r.set(key, value, ex=3600)
        print(f"  SET {key}")
    print("✓ Initial Redis keys set")

def configure_redis():
    """
    Apply recommended Redis configuration for GzoneSphere.
    These can also be set in redis.conf instead.
    """
    configs = {
        # Memory: evict LRU keys when maxmemory is hit
        # In production set maxmemory in redis.conf instead
        "maxmemory-policy": "allkeys-lru",

        # Persistence: save snapshot every 60s if 1000 keys changed
        # Adjust in redis.conf for production
        "save": "60 1000",
    }
    for k, v in configs.items():
        try:
            r.config_set(k, v)
            print(f"  CONFIG SET {k} = {v}")
        except redis.ResponseError as e:
            print(f"  SKIP {k}: {e}")
    print("✓ Redis configured")

def verify_key_patterns():
    """Print all active key patterns – useful for debugging."""
    print("\n=== Active Redis Keys ===")
    cursor = 0
    all_keys = []
    while True:
        cursor, keys = r.scan(cursor, count=100)
        all_keys.extend(keys)
        if cursor == 0:
            break
    if not all_keys:
        print("  (no keys set yet)")
    else:
        for k in sorted(all_keys):
            ttl = r.ttl(k)
            ttl_str = f"TTL:{ttl}s" if ttl > 0 else ("no-TTL" if ttl == -1 else "expired")
            print(f"  {k}  [{ttl_str}]")

def print_key_reference():
    print("""
=============================================================================
REDIS KEY QUICK REFERENCE – paste into your .env files
=============================================================================

FastAPI (.env in backend/core-api/):
  REDIS_URL=redis://localhost:6379/0
  REDIS_KEY_PREFIX_CORE=core:
  SESSION_TTL_SECONDS=2592000
  OTP_TTL_SECONDS=600
  RATE_LIMIT_WINDOW_SECONDS=60
  PROFILE_CACHE_TTL=300
  FEED_CACHE_TTL=60

Golang CMS (.env in backend/cms-api/):
  REDIS_URL=redis://localhost:6379/0
  REDIS_KEY_PREFIX_CMS=cms:
  GAME_CACHE_TTL=300
  BLOG_CACHE_TTL=120
  TRENDING_CACHE_TTL=3600
  LIST_CACHE_TTL=60
  VIEW_FLUSH_INTERVAL=300

=============================================================================
MONITORING – run these in redis-cli or RedisInsight
=============================================================================
  DBSIZE                    – total key count
  INFO memory               – memory usage
  INFO clients              – connected client count
  LLEN queue:email          – email queue depth
  LLEN queue:ai             – AI task queue depth
  SCARD core:online:dev:*   – online users in dev branch
  KEYS cms:views:pending:*  – pending view count flushes
=============================================================================
""")

if __name__ == "__main__":
    print("=== GzoneSphere Redis Setup ===\n")
    check_connection()
    configure_redis()
    set_initial_keys()
    verify_key_patterns()
    print_key_reference()
    print("=== Redis Setup Complete ===")
