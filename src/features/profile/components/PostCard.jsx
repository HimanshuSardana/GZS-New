import { useState } from 'react';
import { FiHeart, FiMessageCircle, FiRepeat, FiShare2 } from 'react-icons/fi';
import DomainBadge from '@/shared/components/DomainBadge';

function formatDate(value) {
  return new Date(value).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function PostCard({ post }) {
  const [likes, setLikes] = useState(post.like_count ?? 0);
  const [liked, setLiked] = useState(false);
  const domain = post.sub_profile_type && post.sub_profile_type !== 'master' ? post.sub_profile_type : null;

  return (
    <article
      style={{
        background: 'var(--theme-card)',
        border: '1px solid var(--theme-border)',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 12,
      }}
    >
      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <img
          src={post.author?.avatar_url}
          alt={post.author?.display_name}
          style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--theme-text)' }}>
              {post.author?.display_name}
            </span>
            <span style={{ fontSize: 12, color: 'var(--theme-text-subtle)' }}>
              @{post.author?.username}
            </span>
            {domain && <DomainBadge domain={domain} size="sm" variant="pill" />}
            <span style={{ fontSize: 11, color: 'var(--theme-text-subtle)', marginLeft: 'auto' }}>
              {formatDate(post.published_at || post.created_at)}
            </span>
          </div>
          {post.author?.primary_role && (
            <div style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>
              {post.author.primary_role}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <p style={{ marginTop: 14, fontSize: 13, color: 'var(--theme-text-muted)', lineHeight: 1.6 }}>
        {post.content}
      </p>

      {/* Media */}
      {post.media_urls?.[0] && (
        <div
          style={{
            marginTop: 12,
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid var(--theme-border)',
          }}
        >
          <img src={post.media_urls[0]} alt="Post media" style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>
      )}

      {/* Engagement row */}
      <div
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px solid var(--theme-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <button
          type="button"
          onClick={() => {
            setLiked((c) => !c);
            setLikes((c) => c + (liked ? -1 : 1));
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'transparent',
            color: liked ? '#ff4d6d' : 'var(--theme-text-subtle)',
            fontSize: 12, fontWeight: 600,
          }}
        >
          <FiHeart size={14} style={{ fill: liked ? '#ff4d6d' : 'none' }} /> {likes}
        </button>
        <button
          type="button"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'transparent', color: 'var(--theme-text-subtle)', fontSize: 12, fontWeight: 600,
          }}
        >
          <FiMessageCircle size={14} /> {post.comment_count ?? 0}
        </button>
        <button
          type="button"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'transparent', color: 'var(--theme-text-subtle)', fontSize: 12, fontWeight: 600,
          }}
        >
          <FiRepeat size={14} /> {post.share_count ?? 0}
        </button>
        <button
          type="button"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'transparent', color: 'var(--theme-text-subtle)', fontSize: 12, fontWeight: 600,
            marginLeft: 'auto',
          }}
        >
          <FiShare2 size={14} />
        </button>
      </div>
    </article>
  );
}
