import { useMemo, useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { FiCode, FiAward, FiVideo, FiBriefcase, FiEdit2, FiFeather, FiMusic, FiLayers, FiPlus, FiLock, FiChevronRight, FiCalendar, FiTrendingUp, FiZap, FiEye, FiEyeOff } from 'react-icons/fi';
import { SiX, SiDiscord, SiLinkedin, SiInstagram, SiYoutube, SiTwitch, SiArtstation, SiSoundcloud } from 'react-icons/si';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import IdentityBanner from '../components/IdentityBanner';
import AggregateStatsRow from '../components/AggregateStatsRow';
import SubProfileCard from '../components/SubProfileCard';
import SocialPanel from '../components/SocialPanel';
import PostComposer from '../components/PostComposer';
import PostCard from '../components/PostCard';
import GlobalAvailabilitySwitches from '../components/GlobalAvailabilitySwitches';
import { useMasterProfile, useSubProfiles, useMasterFeed } from '@/services/mutators/useProfile';
import core from '@/services/api/core';
import Skeleton from '@/shared/components/Skeleton';

const ALL_DOMAINS = [
  { key: 'dev',      label: 'Dev',      role: 'Game Developer',    color: '#14B8A6', Icon: FiCode },
  { key: 'esports',  label: 'Esports',  role: 'Pro Player',        color: '#EF4444', Icon: FiAward },
  { key: 'content',  label: 'Content',  role: 'Streamer',          color: '#F59E0B', Icon: FiVideo },
  { key: 'business', label: 'Business', role: 'Producer',          color: '#3B82F6', Icon: FiBriefcase },
  { key: 'art',      label: 'Art',      role: 'Concept Artist',    color: '#EC4899', Icon: FiEdit2 },
  { key: 'writing',  label: 'Writing',  role: 'Game Writer',       color: '#22C55E', Icon: FiFeather },
  { key: 'audio',    label: 'Audio',    role: 'Sound Designer',    color: '#64748B', Icon: FiMusic },
];

const TABS = [
  { id: 'domain_shards',   label: 'Domain_Shards' },
  { id: 'feed_broadcast',  label: 'Feed_Broadcast' },
  { id: 'identity_core',   label: 'Identity_Core' },
];

const FEED_DOMAIN_FILTERS = [
  { key: 'All' },
  { key: 'Dev',      color: '#14B8A6' },
  { key: 'Esports',  color: '#EF4444' },
  { key: 'Content',  color: '#F59E0B' },
  { key: 'Business', color: '#3B82F6' },
  { key: 'Art',      color: '#EC4899' },
  { key: 'Posts' },
  { key: 'Showcase' },
  { key: 'Achievements' },
  { key: 'Live' },
];

const CONNECTED_PLATFORMS = [
  { name: 'Twitter / X',  handle: '@kunal_gzs',      Icon: SiX,          color: '#000', connected: true },
  { name: 'Discord',      handle: 'user#2250',        Icon: SiDiscord,    color: '#5865F2', connected: true },
  { name: 'LinkedIn',     handle: 'in/kunaldev',      Icon: SiLinkedin,   color: '#0A66C2', connected: true },
  { name: 'Instagram',    handle: '@kunaldevelops',   Icon: SiInstagram,  color: '#E1306C', connected: true },
  { name: 'YouTube',      handle: '@kunelGZS',        Icon: SiYoutube,    color: '#FF0000', connected: true },
  { name: 'Twitch',       handle: '@kunelGZS',        Icon: SiTwitch,     color: '#9146FF', connected: true },
  { name: 'ArtStation',   handle: 'TA/kunal_art',     Icon: SiArtstation, color: '#13AFF0', connected: true },
  { name: 'SoundCloud',   handle: 'SC/kunal',         Icon: SiSoundcloud, color: '#FF5500', connected: false },
];

const ROLLUP_STATS = [
  { label: 'Posts',        value: '28',   color: '#1D6ADB' },
  { label: 'Reach',        value: '62k',  color: '#7C3AED' },
  { label: 'Engagements',  value: '3.4k', color: '#14B8A6' },
  { label: 'Cross-posts',  value: '142',  color: '#F59E0B' },
];

const SETTINGS_SECTIONS = [
  {
    title: 'Master profile settings',
    description: 'Update account-level preferences, privacy defaults, and identity details in the settings area.',
  },
  {
    title: 'Sub-profile maintenance',
    description: 'Keep each domain profile current so collaborators and recruiters see the right signals.',
  },
];

export default function MyProfile() {
  usePageTheme('profile');

  const { data: masterProfile, isLoading: profileLoading } = useMasterProfile();
  const { data: subProfilesRaw = [], isLoading: subsLoading } = useSubProfiles();

  const [activeTab, setActiveTab] = useState('domain_shards');
  const [posts, setPosts] = useState([]);
  const [feedDomainFilter, setFeedDomainFilter] = useState('All');
  const [companyVisibility, setCompanyVisibility] = useState({});
  const [visibilityPending, setVisibilityPending] = useState(null);
  const [linkedCompanies, setLinkedCompanies] = useState([]);

  useEffect(() => {
    core.get('/profiles/me/companies')
      .then(r => {
        const list = r.data?.data || r.data || [];
        setLinkedCompanies(list);
        setCompanyVisibility(Object.fromEntries(list.map(c => [c.id, c.show_on_company_page ?? true])));
      })
      .catch(() => {});
  }, []);

  const statsProfile = useMemo(() => ({
    ...(masterProfile || {}),
    trust_score: masterProfile?.trust_score ?? 7.4,
    verified_skills_count: masterProfile?.verified_skills_count ?? 0,
    sub_profiles: subProfilesRaw,
    friends_count: masterProfile?.friends_count ?? 0,
    followers_count: masterProfile?.followers_count ?? 0,
    platform_level: masterProfile?.platform_level || 'Beginner',
    has_verified_skills: (masterProfile?.verified_skills_count ?? 0) > 0,
    show_real_name: masterProfile?.show_real_name ?? false,
    real_name: masterProfile?.real_name || masterProfile?.display_name || '',
    collaborations_count: masterProfile?.collaborations_count ?? 0,
    companies_count: masterProfile?.companies_count ?? 0,
    reputation_score: masterProfile?.reputation_score ?? masterProfile?.trust_score ?? 0,
    last_active: masterProfile?.last_active || 'recently',
  }), [masterProfile, subProfilesRaw]);

  const { data: apiFeedItems = [], isLoading: feedLoading } = useMasterFeed('me');

  const feedItems = useMemo(() => {
    const all = [...posts, ...apiFeedItems].sort(
      (a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at),
    );
    if (feedDomainFilter === 'All') return all;
    return all.filter(
      (item) =>
        item.sub_profile_type?.toLowerCase() === feedDomainFilter.toLowerCase() ||
        item.post_type?.toLowerCase() === feedDomainFilter.toLowerCase(),
    );
  }, [posts, apiFeedItems, feedDomainFilter]);

  const handleCreatePost = (newPost) => setPosts((c) => [newPost, ...c]);

  const handleVisibilityToggle = async (company) => {
    const next = !companyVisibility[company.id];
    setCompanyVisibility((prev) => ({ ...prev, [company.id]: next }));
    setVisibilityPending(company.id);
    try {
      await core.patch(`/companies/${company.slug}/members/me/visibility`, {
        show_on_company_page: next,
      });
    } catch {
      // Revert on failure
      setCompanyVisibility((prev) => ({ ...prev, [company.id]: !next }));
    } finally {
      setVisibilityPending(null);
    }
  };

  // Claimed and unclaimed domains
  const claimedKeys = new Set(subProfilesRaw.map((sp) => sp.type));
  const unclaimedDomains = ALL_DOMAINS.filter((d) => !claimedKeys.has(d.key));

  return (
    <>
      <Helmet>
        <title>My Profile | GzoneSphere</title>
      </Helmet>

      <div className="min-h-screen pb-12" style={{ background: '#F1F5F9' }}>
        {/* Banner + identity card */}
        <IdentityBanner masterProfile={statsProfile} isOwn />

        <div className="px-8 mt-6">
          {/* Aggregate stats — full width, 6 columns */}
          <AggregateStatsRow
            masterProfile={statsProfile}
            subProfiles={subProfilesRaw}
            skills={[]}
            friends={[]}
            followers={[]}
          />

          {/* Tab nav */}
          <div className="mt-6 flex gap-1" style={{ borderBottom: '1px solid #E2E8F0' }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-[18px] py-3 text-[13px] font-semibold transition"
                style={{
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  color: activeTab === tab.id ? '#1D6ADB' : '#64748B',
                  borderBottom: activeTab === tab.id ? '2px solid #1D6ADB' : '2px solid transparent',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            ))}
            <span className="ml-auto self-center text-xs" style={{ color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
              {subProfilesRaw.length} of {ALL_DOMAINS.length} sub-profiles claimed
            </span>
          </div>

          {/* Two-column layout: main + sidebar */}
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <main className="space-y-4 min-w-0">

              {/* ── DOMAIN SHARDS ── */}
              {activeTab === 'domain_shards' && (
                <>
                  <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#94A3B8' }}>
                    Domain Shards · Click any to enter sub-profile
                  </p>

                  {/* Claimed sub-profile cards — 3 columns */}
                  {(profileLoading || subsLoading) ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {[1, 2, 3].map(i => <Skeleton key={i} height="180px" rounded="lg" animate="shimmer" />)}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {subProfilesRaw.map((sp) => (
                        <div key={sp.id} className="relative">
                          <SubProfileCard
                            subProfile={sp}
                            isOwn
                            skills={sp.skills || []}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Claim unclaimed domains */}
                  {unclaimedDomains.length > 0 && (
                    <div className="domain-claim-card mt-2">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-sm font-bold" style={{ color: '#0F172A' }}>
                            Claim {unclaimedDomains.length} more domain identities
                          </p>
                          <p className="text-xs mt-1" style={{ color: '#64748B' }}>
                            Each sub-profile is its own verified professional face. One person, multiple roles.
                          </p>
                        </div>
                        <span className="text-xs" style={{ color: '#94A3B8' }}>
                          {unclaimedDomains.length} / {ALL_DOMAINS.length} unclaimed
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {unclaimedDomains.map(({ key, label, role, color, Icon }) => (
                          <Link
                            key={key}
                            to="/profile/create-sub"
                            className="rounded-xl border p-3 flex items-center gap-2.5 transition hover:shadow-sm"
                            style={{ background: '#fff', borderColor: '#E2E8F0' }}
                          >
                            <div
                              className="flex items-center justify-center rounded-lg flex-shrink-0"
                              style={{ width: 36, height: 36, background: `${color}1A`, color }}
                            >
                              <Icon size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold" style={{ color: '#0F172A' }}>+ {label}</p>
                              <p className="text-[10px]" style={{ color: '#94A3B8' }}>{role}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Identity model explainer */}
                  <div
                    className="rounded-xl border p-4 mt-2"
                    style={{ background: 'linear-gradient(135deg, #EFF6FF, #fff)', borderColor: '#BFDBFE' }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <FiLayers size={16} style={{ color: '#1D6ADB' }} />
                      <p className="text-sm font-bold" style={{ color: '#0F172A' }}>How GzoneSphere identity works</p>
                    </div>
                    <p className="text-sm" style={{ color: '#475569', lineHeight: 1.6 }}>
                      Your <b>Master Profile</b> is who you are. Each <b>Sub-Profile</b> is what you do — verified
                      independently, posted under its own handle, never tied to your real name unless you choose.
                    </p>
                  </div>
                </>
              )}

              {/* ── FEED BROADCAST ── */}
              {activeTab === 'feed_broadcast' && (
                <>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h2 className="text-xl font-black tracking-tight" style={{ color: '#0F172A', fontFamily: 'var(--font-mono)' }}>
                        Feed_Broadcast
                      </h2>
                      <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
                        Posts and showcase items from every active sub-profile · cross-platform amplification
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569' }}>
                        <FiCalendar size={12} /> Schedule
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: '#1D6ADB' }}>
                        <FiPlus size={12} /> New post
                      </button>
                    </div>
                  </div>

                  {/* Sub-profile filter pills */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {FEED_DOMAIN_FILTERS.map(({ key, color }) => (
                      <button
                        key={key}
                        onClick={() => setFeedDomainFilter(key)}
                        className="px-3 py-1 rounded-full text-xs font-semibold transition"
                        style={
                          feedDomainFilter === key
                            ? { background: color || '#1D6ADB', color: '#fff', border: `1px solid ${color || '#1D6ADB'}` }
                            : { background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' }
                        }
                      >
                        {key === 'All' ? `All · ${feedItems.length}` : `· ${key}`}
                      </button>
                    ))}
                  </div>

                  {/* Composer */}
                  <PostComposer
                    masterProfile={statsProfile}
                    subProfiles={subProfilesRaw}
                    onCreatePost={handleCreatePost}
                  />

                  {/* Pinned achievement */}
                  <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#F59E0B', color: '#fff' }}>PINNED</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#EFF6FF', color: '#1D6ADB' }}>ACHIEVEMENT</span>
                    <p className="text-sm font-semibold flex-1" style={{ color: '#0F172A' }}>
                      Won Valorant Winter Showdown 2026 · ₹25,000 prize
                    </p>
                    <span className="text-xs font-bold" style={{ color: '#22C55E' }}>+850 XP</span>
                  </div>

                  {/* Feed */}
                  <div className="space-y-4">
                    {feedLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} height="120px" rounded="lg" animate="shimmer" />
                      ))
                    ) : feedItems.length > 0 ? (
                      feedItems.map((post) => <PostCard key={post.id} post={post} />)
                    ) : (
                      <div className="text-center py-16 rounded-2xl border-2 border-dashed" style={{ borderColor: '#E2E8F0' }}>
                        <p className="text-sm" style={{ color: '#94A3B8' }}>Your activity across all domains will appear here</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── IDENTITY CORE ── */}
              {activeTab === 'identity_core' && (
                <div className="space-y-4">
                  {SETTINGS_SECTIONS.map((section) => (
                    <div
                      key={section.title}
                      className="rounded-2xl border p-5"
                      style={{ background: '#fff', borderColor: '#E2E8F0' }}
                    >
                      <h2 className="text-base font-bold" style={{ color: '#0F172A' }}>{section.title}</h2>
                      <p className="mt-1.5 text-sm" style={{ color: '#64748B' }}>{section.description}</p>
                      <div className="mt-4">
                        <Link
                          to="/settings"
                          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold"
                          style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155' }}
                        >
                          Open settings <FiChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  ))}

                  {/* Company Visibility */}
                  <div className="rounded-2xl border p-5" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <FiBriefcase size={15} style={{ color: '#1D6ADB' }} />
                      <h2 className="text-base font-bold" style={{ color: '#0F172A' }}>Company Visibility</h2>
                    </div>
                    <p className="text-sm mb-4" style={{ color: '#64748B' }}>
                      Control whether you appear on each company's public team page.
                    </p>
                    <div className="space-y-3">
                      {linkedCompanies.map((company) => {
                        const isVisible = companyVisibility[company.id];
                        const isPending = visibilityPending === company.id;
                        return (
                          <div
                            key={company.id}
                            className="flex items-center gap-4 rounded-xl border px-4 py-3"
                            style={{ borderColor: '#E2E8F0', background: '#F8FAFC' }}
                          >
                            {/* Logo placeholder */}
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black italic flex-shrink-0"
                              style={{ background: '#EFF6FF', color: '#1D6ADB' }}
                            >
                              {company.name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate" style={{ color: '#0F172A' }}>{company.name}</p>
                              <p className="text-[11px] truncate" style={{ color: '#94A3B8' }}>{company.role}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span
                                className="text-[10px] font-bold flex items-center gap-1"
                                style={{ color: isVisible ? '#16A34A' : '#94A3B8' }}
                              >
                                {isVisible ? <FiEye size={12} /> : <FiEyeOff size={12} />}
                                {isVisible ? 'Visible' : 'Hidden'}
                              </span>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleVisibilityToggle(company)}
                                className={`relative w-10 h-5 rounded-full transition-colors disabled:opacity-60 ${isVisible ? 'bg-[#1D6ADB]' : 'bg-[#CBD5E1]'}`}
                                title={`Show me on ${company.name}'s team page`}
                              >
                                <span
                                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isVisible ? 'translate-x-5' : 'translate-x-0.5'}`}
                                />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-[10px]" style={{ color: '#94A3B8' }}>
                      Changes apply immediately. Company admins are not notified.
                    </p>
                  </div>
                </div>
              )}
            </main>

            {/* Sidebar */}
            <aside className="space-y-4">
              {activeTab === 'feed_broadcast' ? (
                <>
                  {/* 28-day rollup */}
                  <div className="rounded-2xl border p-4" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#94A3B8' }}>
                      28-Day Rollup · All Profiles
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {ROLLUP_STATS.map(({ label, value, color }) => (
                        <div key={label} className="rounded-xl p-3" style={{ background: '#F8FAFC' }}>
                          <p className="text-xl font-black" style={{ color }}>{value}</p>
                          <p className="text-xs" style={{ color: '#64748B' }}>{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Connected platforms */}
                  <div className="rounded-2xl border p-4" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#94A3B8' }}>
                      Connected Platforms
                    </p>
                    <div className="space-y-2.5">
                      {CONNECTED_PLATFORMS.map(({ name, handle, Icon, color, connected }) => (
                        <div key={name} className="flex items-center gap-2.5">
                          <Icon size={14} style={{ color, flexShrink: 0 }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate" style={{ color: '#0F172A' }}>{name}</p>
                            <p className="text-[10px] truncate" style={{ color: '#94A3B8' }}>{handle}</p>
                          </div>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{
                            background: connected ? '#DCFCE7' : '#F1F5F9',
                            color: connected ? '#16A34A' : '#94A3B8',
                          }}>
                            {connected ? 'sync' : 'link'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button className="mt-3 w-full text-xs font-semibold py-1.5 rounded-lg" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569' }}>
                      + Connect more
                    </button>
                  </div>

                  {/* Post-time optimizer */}
                  <div className="rounded-2xl border p-4" style={{ background: '#EFF6FF', borderColor: '#BFDBFE' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <FiZap size={14} style={{ color: '#1D6ADB' }} />
                      <p className="text-xs font-bold" style={{ color: '#0F172A' }}>Post-time optimiser</p>
                    </div>
                    <p className="text-xs mb-3" style={{ color: '#475569' }}>
                      Best engagement window for your audience: <b>21:00–23:00 IST</b>
                    </p>
                    <button className="w-full text-xs font-semibold py-1.5 rounded-lg text-white" style={{ background: '#1D6ADB' }}>
                      Schedule for peak
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <GlobalAvailabilitySwitches />
                  <SocialPanel
                    isOwn
                    masterProfile={statsProfile}
                    friends={[]}
                    followers={[]}
                  />
                </>
              )}
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
