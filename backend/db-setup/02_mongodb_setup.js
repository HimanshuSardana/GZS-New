// =============================================================================
// GzoneSphere – MongoDB 7 Setup Script
// File: 02_mongodb_setup.js
// Run this in MongoDB Compass – "Open MongoDB Shell" (bottom bar)
// Or paste into mongosh in terminal: mongosh "mongodb://localhost:27017" < 02_mongodb_setup.js
// =============================================================================

// – Connect to / create the database –
use gzs_content;

print("=== GzoneSphere MongoDB Setup Starting ===");

// =============================================================================
// COLLECTION 1: community_messages
// Stores all chat messages from community branch channels.
// Full content lives here. PostgreSQL community.messages_meta holds the pointer.
// =============================================================================

db.createCollection("community_messages", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["channel_id", "author_id", "content", "message_type", "created_at"],
      properties: {
        channel_id: {
          bsonType: "string",
          description: "UUID of channel from PostgreSQL community.channels"
        },
        author_id: {
          bsonType: "string",
          description: "UUID of user from PostgreSQL core.users"
        },
        sub_profile_type: {
          bsonType: ["string", "null"],
          enum: ["dev", "esports", "content", "business", "art", "writing", "audio", null]
        },
        content: {
          bsonType: "string",
          maxLength: 4000
        },
        message_type: {
          bsonType: "string",
          enum: ["text", "image", "video", "audio", "sticker", "system", "gif"]
        },
        is_deleted: {
          bsonType: "bool"
        },
        created_at: {
          bsonType: "date"
        }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

// Indexes for community_messages
db.community_messages.createIndex(
  { channel_id: 1, created_at: -1 },
  { name: "idx_channel_timeline", background: true }
);
db.community_messages.createIndex(
  { author_id: 1, created_at: -1 },
  { name: "idx_author_messages", background: true }
);
db.community_messages.createIndex(
  { "moderation_flags.status": 1 },
  { name: "idx_moderation_status", background: true, sparse: true }
);
db.community_messages.createIndex(
  { toxicity_score: -1 },
  { name: "idx_toxicity_score", background: true, sparse: true }
);
db.community_messages.createIndex(
  { is_deleted: 1, created_at: -1 },
  { name: "idx_active_messages", background: true }
);
db.community_messages.createIndex(
  { thread_parent_id: 1 },
  { name: "idx_thread_parent", background: true, sparse: true }
);
// TTL index: auto-delete soft-deleted messages after 30 days
db.community_messages.createIndex(
  { deleted_at: 1 },
  { name: "idx_ttl_deleted", expireAfterSeconds: 2592000, sparse: true }
);

print("✓ community_messages collection created");

// Sample document structure (for your reference – do NOT insert this):
/*
{
  _id: ObjectId("..."),
  channel_id: "uuid-from-postgres",      // FK to PostgreSQL community.channels.id
  author_id: "uuid-from-postgres",       // FK to PostgreSQL core.users.id
  sub_profile_type: "dev",               // which identity posted
  content: "Hello everyone!",
  content_filtered: "Hello everyone!",   // profanity-filtered version
  message_type: "text",
  media_attachments: [
    {
      url: "https://...",
      cdn_url: "https://cdn.gzs.io/...",
      type: "image",
      size_bytes: 204800,
      filename: "screenshot.webp"
    }
  ],
  reactions: [
    { emoji: "👍", user_ids: ["uuid1", "uuid2"], count: 2 },
    { emoji: "🔥", user_ids: ["uuid3"],           count: 1 }
  ],
  thread_parent_id: null,                // ObjectId if this is a thread reply
  thread_count: 0,
  edit_history: [],
  is_deleted: false,
  deleted_at: null,
  deleted_by: null,
  moderation_flags: [],
  toxicity_score: 0.01,                  // AI classifier output 0.0–1.0
  created_at: ISODate("2025-06-01T10:00:00Z"),
  updated_at: ISODate("2025-06-01T10:00:00Z")
}
*/

// =============================================================================
// COLLECTION 2: dm_messages
// Direct messages between users (one-to-one).
// PostgreSQL social.direct_messages_meta holds the metadata shell.
// =============================================================================

db.createCollection("dm_messages", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["conversation_id", "sender_id", "content", "created_at"],
      properties: {
        conversation_id: { bsonType: "string" },
        sender_id:       { bsonType: "string" },
        recipient_id:    { bsonType: "string" },
        content:         { bsonType: "string", maxLength: 2000 },
        is_read:         { bsonType: "bool" },
        is_deleted:      { bsonType: "bool" },
        created_at:      { bsonType: "date" }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

db.dm_messages.createIndex(
  { conversation_id: 1, created_at: -1 },
  { name: "idx_dm_conversation_timeline", background: true }
);
db.dm_messages.createIndex(
  { sender_id: 1 },
  { name: "idx_dm_sender", background: true }
);
db.dm_messages.createIndex(
  { is_read: 1, recipient_id: 1 },
  { name: "idx_dm_unread", background: true }
);

print("✓ dm_messages collection created");

// =============================================================================
// COLLECTION 3: game_reviews
// User-submitted reviews on GamePost pages.
// =============================================================================

db.createCollection("game_reviews", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["game_slug", "author_id", "star_rating", "created_at"],
      properties: {
        game_slug:    { bsonType: "string" },
        author_id:    { bsonType: "string" },
        star_rating: {
          bsonType: "number",
          minimum: 1,
          maximum: 5
        },
        review_text: { bsonType: ["string", "null"], maxLength: 300 },
        moderation_status: {
          bsonType: "string",
          enum: ["approved", "pending", "rejected"]
        },
        created_at:   { bsonType: "date" }
      }
    }
  }
});

db.game_reviews.createIndex(
  { game_slug: 1, created_at: -1 },
  { name: "idx_reviews_game_timeline", background: true }
);
db.game_reviews.createIndex(
  { game_slug: 1, helpful_votes: -1 },
  { name: "idx_reviews_helpful", background: true }
);
db.game_reviews.createIndex(
  { author_id: 1 },
  { name: "idx_reviews_author", background: true }
);
db.game_reviews.createIndex(
  { moderation_status: 1 },
  { name: "idx_reviews_moderation", background: true }
);
// Prevent duplicate reviews: one user → one review per game
db.game_reviews.createIndex(
  { game_slug: 1, author_id: 1 },
  { name: "idx_reviews_unique", unique: true, background: true }
);

print("✓ game_reviews collection created");

// Sample document:
/*
{
  _id: ObjectId("..."),
  game_slug: "valorant",
  author_id: "uuid-from-postgres",
  sub_profile_type: "esports",
  star_rating: 4.5,
  review_text: "Great tactical shooter. High learning curve but very rewarding.",
  helpful_votes: 42,
  unhelpful_votes: 3,
  helpful_voter_ids: ["uuid1", "uuid2"],
  is_verified_player: true,       // has game in Esports sub-profile
  is_flagged: false,
  moderation_status: "approved",
  admin_note: null,
  created_at: ISODate("2025-06-01T10:00:00Z")
}
*/

// =============================================================================
// COLLECTION 4: blog_comments
// Threaded comments on blog articles.
// =============================================================================

db.createCollection("blog_comments", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["blog_slug", "author_id", "content", "created_at"],
      properties: {
        blog_slug:   { bsonType: "string" },
        author_id:   { bsonType: "string" },
        content:     { bsonType: "string", maxLength: 1000 },
        is_deleted:  { bsonType: "bool" },
        created_at:  { bsonType: "date" }
      }
    }
  }
});

db.blog_comments.createIndex(
  { blog_slug: 1, created_at: -1 },
  { name: "idx_comments_blog_timeline", background: true }
);
db.blog_comments.createIndex(
  { blog_slug: 1, like_count: -1 },
  { name: "idx_comments_liked", background: true }
);
db.blog_comments.createIndex(
  { parent_comment_id: 1 },
  { name: "idx_comments_thread", background: true, sparse: true }
);
db.blog_comments.createIndex(
  { author_id: 1 },
  { name: "idx_comments_author", background: true }
);
db.blog_comments.createIndex(
  { moderation_status: 1 },
  { name: "idx_comments_moderation", background: true }
);

print("✓ blog_comments collection created");

// Sample document:
/*
{
  _id: ObjectId("..."),
  blog_slug: "valorant-patch-notes-analysis",
  author_id: "uuid-from-postgres",
  sub_profile_type: "esports",
  username: "esports_player42",
  avatar_url: "https://cdn.gzs.io/avatars/...",
  domain_badge: "esports",
  content: "Great breakdown! The Jett nerfs are finally here.",
  parent_comment_id: null,         // ObjectId if this is a reply
  like_count: 7,
  liker_ids: ["uuid1", "uuid2"],
  is_deleted: false,
  moderation_status: "approved",
  toxicity_score: 0.02,
  created_at: ISODate("2025-06-01T10:00:00Z")
}
*/

// =============================================================================
// COLLECTION 5: showcase_content
// Rich media content for community showcase posts (extended data).
// Metadata lives in PostgreSQL community.showcase_posts.
// =============================================================================

db.createCollection("showcase_content", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["showcase_post_id", "author_id", "created_at"],
      properties: {
        showcase_post_id: { bsonType: "string" },   // FK to PG showcase_posts.id
        author_id:        { bsonType: "string" },
        created_at:       { bsonType: "date" }
      }
    }
  }
});

db.showcase_content.createIndex(
  { showcase_post_id: 1 },
  { name: "idx_showcase_post_id", unique: true, background: true }
);
db.showcase_content.createIndex(
  { author_id: 1, created_at: -1 },
  { name: "idx_showcase_author", background: true }
);
db.showcase_content.createIndex(
  { moderation_status: 1 },
  { name: "idx_showcase_moderation", background: true }
);

print("✓ showcase_content collection created");

// =============================================================================
// COLLECTION 6: admin_content_actions
// Admin moderation actions on MongoDB documents (separate from PG audit log).
// =============================================================================

db.createCollection("admin_content_actions");

db.admin_content_actions.createIndex(
  { target_collection: 1, target_id: 1 },
  { name: "idx_action_target", background: true }
);
db.admin_content_actions.createIndex(
  { admin_id: 1, created_at: -1 },
  { name: "idx_action_admin", background: true }
);
// TTL: keep admin action logs for 2 years
db.admin_content_actions.createIndex(
  { created_at: 1 },
  { name: "idx_action_ttl", expireAfterSeconds: 63072000, background: true }
);

print("✓ admin_content_actions collection created");

// =============================================================================
// Create application user with restricted access
// =============================================================================

db.createUser({
  user: "gzs_app_user",
  pwd:  "CHANGE_ME_MONGO_STRONG_PASSWORD",
  roles: [
    { role: "readWrite", db: "gzs_content" }
  ]
});

print("✓ gzs_app_user created");

// =============================================================================
// Verify setup
// =============================================================================

print("\n=== Collections in gzs_content ===");
db.getCollectionNames().forEach(function(name) {
  var count = db[name].countDocuments();
  print("  " + name + " – " + db[name].getIndexes().length + " indexes");
});

print("\n=== GzoneSphere MongoDB Setup Complete ===");
print("Database: gzs_content");
print("App user: gzs_app_user");
print("Connection string for .env:");
print("MONGO_URL=mongodb://gzs_app_user:CHANGE_ME_MONGO_STRONG_PASSWORD@localhost:27017/gzs_content");
