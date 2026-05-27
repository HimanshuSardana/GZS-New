import { FiCheckCircle, FiClock, FiMapPin, FiShare2, FiEdit2, FiMessageCircle, FiUserPlus } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import DomainBadge from '@/shared/components/DomainBadge';
import { MOCK_SUB_PROFILES, MOCK_FOLLOWERS } from '@/shared/data/profileData';
import profileService from '@/services/features/profileService';

const LEVEL_COLOURS = {
  Beginner: { bg: '#E2E8F0', text: '#475569', border: '#CBD5E1' },
  Hustler:  { bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD' },
  Extreme:  { bg: '#FEF3C7', text: '#B45309', border: '#FCD34D' },
  Pro:      { bg: '#F0FDF4', text: '#15803D', border: '#86EFAC' },
};

export default function IdentityBanner({ masterProfile, isOwn = false, onEditClick, actionMode = 'edit', onFollow, onConnect, onMessage, isFollowing = false }) {
  const displayName = masterProfile?.display_name || masterProfile?.username || 'GZS User';
  const username    = masterProfile?.username || 'user';
  const trustScore  = masterProfile?.trust_score ?? 7.4;
  const levelLabel  = masterProfile?.platform_level || 'Hustler';
  const hasVerifiedSkill = (masterProfile?.verified_skills_count ?? 0) > 0;

  const { data: xpData } = useQuery({ queryKey: ['xp-me'], queryFn: profileService.getMyXP });

  const domains = [...new Set(MOCK_SUB_PROFILES.map(sp => sp.type).filter(Boolean))];
  const visibleSubProfiles = MOCK_SUB_PROFILES.filter(p => p.visibility !== 'private');

  return (
    <section style={{ background: 'var(--theme-bg)' }}>

      {/* 1. Banner */}
      <div
        className="relative overflow-hidden"
        style={{ height: 200, background: 'linear-gradient(120deg, #1a1060 0%, #3b1fa8 40%, #0d6e6e 100%)' }}
      >
        {masterProfile?.banner_url && (
          <img
            src={masterProfile.banner_url}
            alt="banner"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 0.6 }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 25% 60%, rgba(167,139,250,0.18), transparent 60%)' }}
        />
        {isOwn && (
          <div className="absolute top-4 right-6">
            <button
              onClick={onEditClick}
              className="flex items-center gap-1.5 rounded-lg text-xs font-semibold text-white"
              style={{
                padding: '6px 12px',
                background: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <FiEdit2 size={12} /> Edit Profile
            </button>
          </div>
        )}
      </div>

      {/* 2. Identity row */}
      <div
        style={{
          padding: '0 24px 20px',
          background: 'var(--theme-card)',
          borderBottom: '1px solid var(--theme-border)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>

          {/* LEFT — avatar + info */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: 16, marginTop: -40 }}>
            {/* Avatar */}
            <div
              style={{
                width: 80, height: 80, borderRadius: '50%',
                border: '3px solid var(--theme-card)',
                overflow: 'hidden', flexShrink: 0,
                background: masterProfile?.avatar_url ? undefined : '#E2E8F0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {masterProfile?.avatar_url ? (
                <img src={masterProfile.avatar_url} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 28, color: '#64748B', fontWeight: 700 }}>
                  {displayName[0]?.toUpperCase()}
                </span>
              )}
            </div>

            {/* Info */}
            <div style={{ paddingBottom: 4 }}>
              {/* Row 1 — name + badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--theme-text)', margin: 0, lineHeight: 1 }}>
                  {displayName}
                </h1>
                {hasVerifiedSkill && (
                  <FiCheckCircle size={15} style={{ color: '#22C55E' }} title="Has verified skills" />
                )}
                {(() => {
                  const colours = LEVEL_COLOURS[xpData?.level || levelLabel] || LEVEL_COLOURS.Beginner;
                  return (
                    <span style={{
                      background: colours.bg,
                      color: colours.text,
                      border: `1px solid ${colours.border}`,
                      borderRadius: 20,
                      padding: '2px 10px',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}>
                      {xpData?.level || levelLabel}
                    </span>
                  );
                })()}
                <span style={{ fontSize: 11, padding: '2px 8px', background: '#DCFCE7', color: '#16A34A', borderRadius: 20, fontWeight: 700 }}>
                  {trustScore} Trust
                </span>
              </div>
              {/* XP Progress */}
              {xpData && (
                <div style={{ marginBottom: 4 }}>
                  <div style={{
                    width: 200, height: 4, borderRadius: 2,
                    background: 'var(--theme-border)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, (xpData.current_xp / xpData.xp_to_next_level) * 100)}%`,
                      background: 'var(--theme-primary)',
                      borderRadius: 2,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--theme-text-subtle)', margin: '2px 0 0' }}>
                    {xpData.current_xp} / {xpData.xp_to_next_level} XP
                  </p>
                </div>
              )}
              {/* Row 2 — username */}
              <div style={{ fontSize: 13, color: 'var(--theme-text-subtle)', marginBottom: 4 }}>@{username}</div>
              {/* Row 3 — bio */}
              {masterProfile?.bio && (
                <div style={{ fontSize: 13, color: 'var(--theme-text-muted)', maxWidth: 460, lineHeight: 1.5, marginBottom: 4 }}>
                  {masterProfile.bio}
                </div>
              )}
              {/* Row 4 — location */}
              {(masterProfile?.location_city || masterProfile?.location_country) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--theme-text-subtle)', marginBottom: 4 }}>
                  <FiMapPin size={11} />
                  {[masterProfile.location_city, masterProfile.location_country].filter(Boolean).join(', ')}
                </div>
              )}
              {/* Row 5 — member since */}
              {masterProfile?.created_at && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--theme-text-subtle)', marginBottom: 4 }}>
                  <FiClock size={12} />
                  <span>Member since {new Date(masterProfile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
              )}
              {/* Row 6 — domain badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {domains.map(domain => (
                  <DomainBadge key={domain} domain={domain} size="sm" variant="pill" />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — action buttons */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
            {actionMode === 'edit' ? (
              <button
                onClick={onEditClick}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: '#F1F5F9', border: '1px solid #E2E8F0',
                  color: '#475569',
                }}
              >
                <FiEdit2 size={13} /> Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={onMessage}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: 'transparent', border: '1px solid #E2E8F0',
                    color: '#475569',
                  }}
                >
                  <FiMessageCircle size={13} /> Message
                </button>
                <button
                  onClick={onFollow}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: isFollowing ? '#F1F5F9' : '#a78bfa',
                    color: isFollowing ? '#475569' : '#ffffff',
                    border: isFollowing ? '1px solid #E2E8F0' : 'none',
                  }}
                >
                  <FiUserPlus size={13} /> {isFollowing ? 'Following' : 'Follow'}
                </button>
              </>
            )}
            <button
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 34, height: 34, borderRadius: 8, cursor: 'pointer',
                background: 'transparent', border: '1px solid #E2E8F0',
                color: 'var(--theme-text-subtle)',
              }}
            >
              <FiShare2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Stats row */}
      <div className="profile-stats-row">
        <div className="profile-stat-cell">
          <span className="profile-stat-value">{visibleSubProfiles.length}</span>
          <span className="profile-stat-label">Sub-Profiles</span>
        </div>
        <div className="profile-stat-cell">
          <span className="profile-stat-value">{MOCK_FOLLOWERS.length}</span>
          <span className="profile-stat-label">Followers</span>
        </div>
        <div className="profile-stat-cell">
          <span className="profile-stat-value">3</span>
          <span className="profile-stat-label">Following</span>
        </div>
        <div className="profile-stat-cell">
          <span className="profile-stat-value">7</span>
          <span className="profile-stat-label">Collaborators</span>
        </div>
        <div className="profile-stat-cell">
          <span className="profile-stat-value">{trustScore}</span>
          <span className="profile-stat-label">Trust Score</span>
        </div>
      </div>
    </section>
  );
}
