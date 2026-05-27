import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import { usePublicProfile } from '@/services/mutators/useProfile';
import core from '@/services/api/core';
import { useToast } from '@/shared/components/Toast';
import IdentityBanner from '../../components/IdentityBanner';
import SubProfileGrid from '../../components/SubProfileGrid';
import SocialPanel from '../../components/SocialPanel';
import PostCard from '../../components/PostCard';
import GzsCard from '@/shared/components/GzsCard';

const TABS = [
  { id: 'domain_shards', label: 'Domain_Shards' },
  { id: 'feed_broadcast', label: 'Feed_Broadcast' },
];

const FEED_DOMAINS = [
  { key: 'all', label: 'All' },
  { key: 'dev', label: 'Dev', color: 'var(--domain-dev)' },
  { key: 'esports', label: 'Esports', color: 'var(--domain-esports)' },
  { key: 'content', label: 'Content', color: 'var(--domain-content)' },
  { key: 'art', label: 'Art', color: 'var(--domain-art)' },
  { key: 'audio', label: 'Audio', color: 'var(--domain-audio)' },
  { key: 'writing', label: 'Writing', color: 'var(--domain-writing)' },
  { key: 'business', label: 'Business', color: 'var(--domain-business)' },
];

const DOMAIN_META = {
  dev: { label: 'Game Development', color: 'var(--domain-dev)' },
  esports: { label: 'Esports', color: 'var(--domain-esports)' },
  content: { label: 'Content', color: 'var(--domain-content)' },
  business: { label: 'Business', color: 'var(--domain-business)' },
  art: { label: 'Art', color: 'var(--domain-art)' },
  writing: { label: 'Writing', color: 'var(--domain-writing)' },
  audio: { label: 'Audio', color: 'var(--domain-audio)' },
};

const AVAILABILITY_ROWS = [
  { key: 'hiring_interest',        label: 'Hire Rate'   },
  { key: 'collaboration_interest', label: 'Advisory'    },
  { key: 'co_founding_interest',   label: 'Co-founding' },
  { key: 'speaking_interest',      label: 'Speaking'    },
];

export default function PublicProfile() {
  usePageTheme('profile');
  const navigate = useNavigate();
  const { username } = useParams();
  const { showToast } = useToast();

  const { data: profileData, isLoading } = usePublicProfile(username);
  const masterProfile = profileData?.data || profileData || {};
  const subProfiles = masterProfile?.sub_profiles || [];

  const [activeTab, setActiveTab] = useState('domain_shards');
  const [isConnected, setIsConnected] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [feedDomain, setFeedDomain] = useState('all');

  const handleFollow = async () => {
    const next = !isFollowing;
    setIsFollowing(next);
    try {
      if (next) await core.post(`/social/follow/${masterProfile.id}`);
      else await core.delete(`/social/follow/${masterProfile.id}`);
    } catch {
      setIsFollowing(!next);
    }
  };

  const handleConnect = async () => {
    try {
      await core.post(`/social/friend-requests/${masterProfile.id}`);
      showToast('Connection request sent!', 'success');
    } catch {
      showToast('Could not send request.', 'error');
    }
  };

  const handleMessage = async () => {
    try {
      const res = await core.post('/messages/conversations', {
        participant_id: masterProfile.id,
      });
      const conversationId = res.data?.data?.id || res.data?.id;
      navigate(`/messages/${conversationId}`);
    } catch {
      navigate('/messages');
    }
  };

  const visibleSubProfiles = useMemo(() => {
    return subProfiles.filter((profile) => {
      if (profile.visibility === 'private') return false;
      if (profile.visibility === 'connections-only' && !isConnected) return true;
      if (profile.visibility === 'public') return true;
      return false;
    });
  }, [subProfiles, isConnected]);

  const skills = useMemo(() => masterProfile?.skills || [], [masterProfile]);

  const publicPosts = useMemo(() => {
    const posts = masterProfile?.posts || [];
    return posts.filter((post) => post.is_public !== false).map((post) => ({
      ...post,
      author: {
        ...post.author,
        display_name: masterProfile.display_name,
        username: masterProfile.username,
        avatar_url: masterProfile.avatar_url,
      },
    }));
  }, [masterProfile]);

  const masterProfileWithStats = {
    ...masterProfile,
    trust_score: masterProfile.trust_score ?? 7.8,
    platform_level: masterProfile.platform_level || 'Pro',
    has_verified_skills: skills.some((skill) => skill.verified),
    availability: masterProfile.availability || {
      hiring_interest: false,
      collaboration_interest: false,
      events_interest: false,
      co_founding_interest: false,
      speaking_interest: false,
    },
  };

  const primaryDomain = subProfiles[0]?.type ?? 'general';
  const accentColor   = `var(--domain-${primaryDomain})`;
  const accentBg      = `var(--domain-${primaryDomain}-bg)`;

  if (isLoading) {
    return (
      <div className="gzs-page-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--theme-text)', fontSize: 14 }}>Loading profile...</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{masterProfile.display_name} (@{masterProfile.username}) | GzoneSphere Profile</title>
        <meta name="description" content={`View the gaming professional profile of ${masterProfile.display_name} on GzoneSphere. Explore their skills, projects, and competitive history across the gaming ecosystem.`} />
        <meta property="og:title" content={`${masterProfile.display_name} | GzoneSphere Profile`} />
        <meta property="og:description" content={`Explore ${masterProfile.display_name}'s professional gaming identity, skills, and verified achievements.`} />
        <meta property="og:image" content={masterProfile.avatar_url} />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      <div className="gzs-page-bg">
        <IdentityBanner
          masterProfile={masterProfileWithStats}
          isOwn={false}
          actionMode="connect"
          onFollow={handleFollow}
          onConnect={handleConnect}
          onMessage={handleMessage}
          isFollowing={isFollowing}
        />

        <div className="gzs-profile-layout">
          {/* Child 1 — left sidebar */}
          <GzsCard padding="md">
            <SocialPanel
              isOwn={false}
              masterProfile={masterProfileWithStats}
              friends={masterProfile?.friends || []}
              followers={masterProfile?.followers || []}
              mutualConnections={masterProfile?.mutual_connections_count || 0}
            />
          </GzsCard>

          {/* Child 2 — main content */}
          <div>
            <div className="gzs-tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`gzs-tab ${activeTab === tab.id ? 'active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'domain_shards' && (
              <SubProfileGrid
                subProfiles={visibleSubProfiles}
                username={masterProfile.username}
                isConnected={isConnected}
              />
            )}

            {activeTab === 'feed_broadcast' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {/* Domain filter chips */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                  {FEED_DOMAINS.map(({ key, label, color }) => {
                    const isActive = feedDomain === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFeedDomain(key)}
                        style={{
                          padding: '4px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                          border: isActive && color ? `1px solid ${color}30` : '1px solid var(--theme-border)',
                          background: isActive && color ? `${color}18` : isActive ? 'rgba(167,139,250,0.18)' : 'var(--theme-card)',
                          color: isActive && color ? color : isActive ? '#a78bfa' : 'var(--theme-text)',
                          transition: 'all 0.15s',
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Posts */}
                {publicPosts.filter(p => feedDomain === 'all' || p.sub_profile_type === feedDomain).length > 0 ? (
                  publicPosts
                    .filter(p => feedDomain === 'all' || p.sub_profile_type === feedDomain)
                    .map((post) => <PostCard key={post.id} post={post} />)
                ) : (
                  <GzsCard padding="md">
                    <p style={{ fontSize: 13, color: 'var(--theme-text)' }}>No posts in this domain yet.</p>
                  </GzsCard>
                )}
              </div>
            )}
          </div>

          {/* Child 3 — right rail: availability card */}
          <GzsCard padding="md">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00e5a0', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#00e5a0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Available
                </span>
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {AVAILABILITY_ROWS.map(({ key, label }) => {
                  const on = !!masterProfileWithStats.availability?.[key];
                  return (
                    <div
                      key={key}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        fontSize: 12,
                        color: 'var(--theme-text)',
                      }}
                    >
                      <span>{label}</span>
                      <span
                        style={{
                          width: 28, height: 16, borderRadius: 8,
                          background: on ? '#a78bfa' : 'var(--theme-card)',
                          border: '1px solid var(--theme-border)',
                          display: 'inline-block', flexShrink: 0,
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              <button
                onClick={handleConnect}
                style={{
                  width: '100%', padding: '9px 0', borderRadius: 8,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: accentBg, color: accentColor,
                  marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em',
                }}
              >
                Request collaboration
              </button>
            </div>
          </GzsCard>
        </div>
      </div>
    </>
  );
}
