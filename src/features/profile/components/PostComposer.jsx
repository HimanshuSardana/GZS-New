import { useMemo, useState } from 'react';
import { FiImage, FiLink, FiAtSign } from 'react-icons/fi';

export default function PostComposer({ masterProfile, subProfiles = [], onCreatePost }) {
  const [content, setContent] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(subProfiles[0]?.id || 'master');

  const selectedAuthor = useMemo(() => {
    if (selectedProfile === 'master') {
      return {
        sub_profile_type: 'master',
        author: {
          username: masterProfile.username,
          display_name: masterProfile.display_name,
          avatar_url: masterProfile.avatar_url,
          primary_role: 'Master Profile',
        },
      };
    }
    const subProfile = subProfiles.find((profile) => profile.id === selectedProfile);
    return {
      sub_profile_type: subProfile?.type || 'master',
      sub_profile_id: subProfile?.id,
      author: {
        username: subProfile?.username || masterProfile.username,
        display_name: subProfile?.display_name || masterProfile.display_name,
        avatar_url: subProfile?.avatar_url || masterProfile.avatar_url,
        primary_role: subProfile?.primary_role || 'Creator',
      },
    };
  }, [masterProfile, selectedProfile, subProfiles]);

  const handleSubmit = () => {
    if (!content.trim()) return;
    onCreatePost?.({
      id: `draft-${Date.now()}`,
      user_id: masterProfile.id,
      content: content.trim(),
      media_urls: [],
      like_count: 0,
      comment_count: 0,
      share_count: 0,
      view_count: 0,
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      ...selectedAuthor,
    });
    setContent('');
  };

  const avatarUrl = selectedAuthor?.author?.avatar_url;
  const displayName = selectedAuthor?.author?.display_name;

  return (
    <div
      style={{
        background: 'var(--theme-card)',
        border: '1px solid var(--theme-border)',
        borderRadius: 12,
        padding: '14px 16px',
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div
          style={{
            width: 32, height: 32, borderRadius: '50%', overflow: 'hidden',
            flexShrink: 0, background: 'var(--theme-bg-section)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 13, color: 'var(--theme-text-subtle)', fontWeight: 700 }}>
              {displayName?.[0]?.toUpperCase()}
            </span>
          )}
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, 500))}
          placeholder="What are you building, learning, shipping, or planning next?"
          rows={3}
          style={{
            flex: 1, resize: 'none', minHeight: 68, fontSize: 13,
            background: 'var(--theme-bg-section)', border: '1px solid var(--theme-border)',
            borderRadius: 8, padding: '8px 12px', color: 'var(--theme-text)',
            outline: 'none', lineHeight: 1.5, width: '100%',
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {[FiImage, FiLink, FiAtSign].map((Icon, i) => (
            <button
              key={i}
              type="button"
              style={{
                width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'transparent', color: 'var(--theme-text-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon size={15} />
            </button>
          ))}
          <select
            value={selectedProfile}
            onChange={(e) => setSelectedProfile(e.target.value)}
            style={{
              marginLeft: 8, height: 32, borderRadius: 8, border: '1px solid var(--theme-border)',
              background: 'var(--theme-bg-section)', color: 'var(--theme-text-muted)',
              fontSize: 11, padding: '0 8px', outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="master">Master Profile</option>
            {subProfiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.display_name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--theme-text-subtle)' }}>{content.length}/500</span>
          <button
            type="button"
            onClick={handleSubmit}
            style={{
              padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: 'none',
              background: content.trim() ? '#a78bfa' : 'var(--theme-bg-section)',
              color: content.trim() ? '#ffffff' : 'var(--theme-text-subtle)',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
