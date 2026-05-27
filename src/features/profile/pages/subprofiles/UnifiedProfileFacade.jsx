import { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import profileService from '@/services/features/profileService';
import socialService from '@/services/features/socialService';
import communityService from '@/services/features/communityService';
import tournamentService from '@/services/features/tournamentService';
import core from '@/services/api/core';
import { useSubProfileByType, useUpdateSubProfile, useMasterFeed } from '@/services/mutators/useProfile';
import { useToast } from '@/shared/components/Toast';
import Skeleton from '@/shared/components/Skeleton';
import AudioPlayer from '@/shared/components/AudioPlayer';
import PostCard from '@/features/profile/components/PostCard';
import {
  FiGithub, FiImage, FiEdit3, FiMusic, FiTrendingUp, FiExternalLink,
  FiLinkedin, FiTwitter, FiYoutube, FiInstagram, FiGlobe, FiSearch,
  FiClock, FiCheck, FiDollarSign, FiPlus, FiX, FiChevronDown,
  FiChevronUp, FiEye, FiEyeOff, FiMoreHorizontal, FiActivity,
  FiTerminal, FiRadio, FiCpu, FiFeather, FiHeadphones, FiPlusCircle,
  FiLayers, FiBriefcase, FiChevronRight, FiCode, FiAward, FiVideo,
  FiLock, FiEdit2, FiZap, FiMessageSquare, FiHeart, FiShare2, FiRepeat, FiLink
} from 'react-icons/fi';
import { SiItchdotio, SiSteam, SiTiktok, SiArtstation, SiBehance, SiDeviantart, SiSoundcloud, SiBandcamp, SiSpotify, SiFiverr, SiSubstack, SiMedium } from 'react-icons/si';
import AIFeaturePlaceholder from '@/shared/components/AIFeaturePlaceholder';
import DomainBadge from '@/shared/components/DomainBadge';
import GzsCard from '@/shared/components/GzsCard';
import { motion, AnimatePresence } from 'framer-motion';

const DOMAIN_META = {
  dev:      { label: 'Game Development', shortLabel: 'Dev',      color: '#14B8A6', Icon: FiCode },
  esports:  { label: 'Esports',          shortLabel: 'Esports',  color: '#EF4444', Icon: FiAward },
  content:  { label: 'Content',          shortLabel: 'Content',  color: '#F59E0B', Icon: FiVideo },
  business: { label: 'Business',         shortLabel: 'Business', color: '#3B82F6', Icon: FiBriefcase },
  art:      { label: 'Art',              shortLabel: 'Art',      color: '#EC4899', Icon: FiEdit2 },
  writing:  { label: 'Writing',          shortLabel: 'Writing',  color: '#22C55E', Icon: FiFeather },
  audio:    { label: 'Audio',            shortLabel: 'Audio',    color: '#64748B', Icon: FiMusic },
};

const TIMEZONES = ['IST', 'EST', 'PST', 'GMT', 'CET', 'SGT', 'JST', 'AEST', 'UTC', 'MSK'];

const DOMAIN_MEDIA_FIELDS = {
  dev: [
    { key: 'github', label: 'GitHub', icon: FiGithub, placeholder: 'github.com/username' },
    { key: 'itchio', label: 'itch.io', icon: SiItchdotio, placeholder: 'username.itch.io' },
    { key: 'steam', label: 'Steam Developer', icon: SiSteam, placeholder: 'store.steampowered.com/dev/...' },
    { key: 'portfolio', label: 'Portfolio Website', icon: FiGlobe, placeholder: 'www.portfolio.com' },
    { key: 'linkedin', label: 'LinkedIn', icon: FiLinkedin, placeholder: 'linkedin.com/in/username' },
  ],
  esports: [
    { key: 'tracker', label: 'Tracker.gg', icon: FiActivity, placeholder: 'tracker.gg/profile/...' },
    { key: 'opgg', label: 'OP.GG', icon: FiTrendingUp, placeholder: 'op.gg/summoners/...' },
    { key: 'twitch', label: 'Twitch', icon: FiRadio, placeholder: 'twitch.tv/channel' },
    { key: 'youtube', label: 'YouTube Highlights', icon: FiYoutube, placeholder: 'youtube.com/@channel' },
    { key: 'liquipedia', label: 'Liquipedia', icon: FiLayers, placeholder: 'liquipedia.net/...' },
  ],
  content: [
    { key: 'twitch', label: 'Twitch Channel', icon: FiRadio, placeholder: 'twitch.tv/username' },
    { key: 'youtube', label: 'YouTube Channel', icon: FiYoutube, placeholder: 'youtube.com/@username' },
    { key: 'tiktok', label: 'TikTok', icon: SiTiktok, placeholder: 'tiktok.com/@username' },
    { key: 'instagram', label: 'Instagram', icon: FiInstagram, placeholder: 'instagram.com/username' },
    { key: 'podcast', label: 'Podcast RSS', icon: FiMusic, placeholder: 'anchor.fm/s/...' },
    { key: 'website', label: 'Personal Website', icon: FiGlobe, placeholder: 'www.username.com' },
  ],
  business: [
    { key: 'linkedin', label: 'LinkedIn (Prominent)', icon: FiLinkedin, placeholder: 'linkedin.com/in/username', prominent: true },
    { key: 'portfolio', label: 'Portfolio/Case Study', icon: FiBriefcase, placeholder: 'www.cases.com' },
    { key: 'conference', label: 'Conference Talks', icon: FiRadio, placeholder: 'youtube.com/watch?v=...' },
    { key: 'website', label: 'Personal Website', icon: FiGlobe, placeholder: 'www.business.com' },
  ],
  art: [
    { key: 'artstation', label: 'ArtStation', icon: SiArtstation, placeholder: 'artstation.com/username' },
    { key: 'behance', label: 'Behance', icon: SiBehance, placeholder: 'behance.net/username' },
    { key: 'deviantart', label: 'DeviantArt', icon: SiDeviantart, placeholder: 'deviantart.com/username' },
    { key: 'instagram', label: 'Instagram (Portfolio)', icon: FiInstagram, placeholder: 'instagram.com/username' },
    { key: 'website', label: 'Personal Website', icon: FiGlobe, placeholder: 'www.artsite.com' },
    { key: 'gumroad', label: 'Gumroad', icon: FiShoppingBag, placeholder: 'gumroad.com/username' },
  ],
  writing: [
    { key: 'medium', label: 'Medium', icon: SiMedium, placeholder: 'medium.com/@username' },
    { key: 'substack', label: 'Substack', icon: SiSubstack, placeholder: 'username.substack.com' },
    { key: 'blog', label: 'Personal Blog', icon: FiFeather, placeholder: 'www.blog.com' },
    { key: 'published', label: 'Published Book/Game Credit', icon: FiGlobe, placeholder: 'www.credits.com' },
  ],
  audio: [
    { key: 'soundcloud', label: 'SoundCloud', icon: SiSoundcloud, placeholder: 'soundcloud.com/username' },
    { key: 'bandcamp', label: 'Bandcamp', icon: SiBandcamp, placeholder: 'username.bandcamp.com' },
    { key: 'spotify', label: 'Spotify Artist', icon: SiSpotify, placeholder: 'open.spotify.com/artist/...' },
    { key: 'youtube', label: 'YouTube Audio', icon: FiYoutube, placeholder: 'youtube.com/@channel' },
    { key: 'fiverr', label: 'Fiverr Gigs', icon: SiFiverr, placeholder: 'fiverr.com/username' },
  ],
};

function FiShoppingBag(props) {
  return (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}

const SECTIONS = [
  { id: 'header', label: 'Header' },
  { id: 'focus', label: 'Focus' },
  { id: 'skills', label: 'Skill Matrix' },
  { id: 'tools', label: 'Tools & Stack' },
  { id: 'projects', label: 'Projects / Proof' },
  { id: 'activity', label: 'Activity' },
  { id: 'availability', label: 'Availability' },
  { id: 'media', label: 'Media' },
];

const DOMAIN_SKILL_CATEGORIES = {
  dev: ['Core programming', 'Game design', 'Engine proficiency', 'Networking & multiplayer', 'AI & machine learning', 'DevOps & tooling', 'Performance optimisation'],
  esports: ['Game titles', 'Competitive strategy', 'Coaching', 'Analysis', 'Casting'],
  content: ['Production', 'Platform expertise', 'Audience growth', 'Brand partnerships', 'Community management'],
  business: ['Production management', 'Publishing', 'Legal', 'Finance', 'Strategy'],
  art: ['2D art', '3D art', 'Animation', 'VFX', 'Concept art', 'UI/UX'],
  writing: ['Narrative', 'Technical', 'Editorial', 'Creative', 'Worldbuilding'],
  audio: ['Composition', 'Sound design', 'Voice acting', 'Mixing', 'DAW expertise'],
};


export default function UnifiedProfileFacade() {
  usePageTheme('profile');

  const { type } = useParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: subProfile, isLoading: spLoading } = useSubProfileByType(type);
  const updateSubProfile = useUpdateSubProfile();
  const meta = DOMAIN_META[type] || DOMAIN_META.dev;

  const [isOwnProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState('focus');

  const [gameTitles, setGameTitles] = useState([]);
  const [contentPlatforms, setContentPlatforms] = useState([]);
  const [brandCollabs, setBrandCollabs] = useState([]);

  useEffect(() => {
    if (subProfile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGameTitles(subProfile.game_titles || []);
      setContentPlatforms(subProfile.content_platforms || []);
      setBrandCollabs(subProfile.brand_collabs || []);
    }
  }, [subProfile]);

  const handleSave = async (sectionData) => {
    try {
      await updateSubProfile.mutateAsync({ type, data: sectionData });
      showToast({ type: 'success', message: 'Saved successfully' });
    } catch {
      showToast({ type: 'error', message: 'Failed to save. Try again.' });
    }
  };

  const { data: gameLibrary = [] } = useQuery({
    queryKey: ['cms-games'],
    queryFn: () => fetch('/api/cms/games').then(r => r.json()).then(r => r.data || r || []).catch(() => []),
    enabled: type === 'esports',
    staleTime: 10 * 60 * 1000,
  });

  const { data: writingBlogs = [] } = useQuery({
    queryKey: ['writing-blogs', subProfile?.user_id],
    queryFn: () =>
      fetch(`/api/cms/blogs?author_id=${subProfile?.user_id}&status=published`)
        .then(r => r.json()).then(r => r.data || r || []).catch(() => []),
    enabled: type === 'writing' && !!subProfile?.user_id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: writingStats = null } = useQuery({
    queryKey: ['writing-stats', subProfile?.user_id],
    queryFn: () =>
      fetch(`/api/cms/blogs/stats?author_id=${subProfile?.user_id}`)
        .then(r => r.json()).catch(() => null),
    enabled: type === 'writing' && !!subProfile?.user_id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: masterProfile } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: profileService.getMasterProfile,
    enabled: isOwnProfile,
  });
  const username = masterProfile?.username || '';

  const { data: feedItems = [] } = useMasterFeed('me');
  const subFeedItems = feedItems.filter(item => item.sub_profile_type === type || item.domain === type);

  const activeDomain = type;
  const domainColor = DOMAIN_META[activeDomain]?.color || '#1D6ADB';
  const DomainIcon  = DOMAIN_META[activeDomain]?.Icon  || FiCode;

  const skills = subProfile?.skills || [];
  const projects = subProfile?.projects || [];

  const groupedSkills = useMemo(() => {
    const groups = new Map();
    skills.forEach((skill) => {
      const key = skill.category;
      groups.set(key, [...(groups.get(key) || []), skill]);
    });
    return Array.from(groups.entries());
  }, [skills]);

  const mediaFields = (DOMAIN_MEDIA_FIELDS[activeDomain] || []).filter(
    (f) => subProfile?.media_links?.[f.key],
  );

  const settingsToggles = [
    { key: 'public_rate',  label: 'Show rate publicly', on: !!subProfile?.availability?.public_rate },
    { key: 'open_hire',    label: 'Open for hire',      on: !!subProfile?.availability?.available_from },
    { key: 'visible',      label: 'Profile visible',    on: subProfile?.visibility === 'public' },
  ];

  if (spLoading || !subProfile) {
    return (
      <div className="gzs-page-bg min-h-screen p-8">
        <Skeleton height="400px" rounded="lg" animate="shimmer" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{subProfile.display_name} — {meta.label} | GzoneSphere Profile</title>
        <meta name="description" content={`Explore the ${meta.label} professional profile of ${subProfile.display_name} on GzoneSphere. Specialized skills: ${skills.slice(0, 5).map(s => s.name).join(', ')}.`} />
        <meta property="og:title" content={`${subProfile.display_name} | ${meta.label} Specialist`} />
        <meta property="og:description" content={`Verified skills and projects in ${meta.label} from the GzoneSphere community.`} />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      <div className="gzs-page-bg" style={{ minHeight: '100vh' }}>
        {/* Sub-profile header bar */}
        <div style={{ background: 'var(--theme-card)', borderBottom: '1px solid var(--theme-border)', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--theme-text-subtle)' }}>
            <Link to="/profile" style={{ color: 'var(--theme-text-subtle)', textDecoration: 'none' }}>
              ← Profile
            </Link>
            <span>/</span>
            <span style={{ color: domainColor, fontWeight: 600 }}>{meta.label}</span>
          </div>
          {isOwnProfile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, padding: '2px 10px', background: 'rgba(16,185,129,0.1)', color: '#059669', borderRadius: 20, border: '1px solid rgba(16,185,129,0.2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Public
              </span>
              <button
                onClick={() => setIsEditing((e) => !e)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'var(--theme-bg-section)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}
              >
                <FiEdit2 size={12} /> {isEditing ? 'Done' : 'Edit Sub-Profile'}
              </button>
            </div>
          )}
        </div>

        {/* 3-column layout */}
        <div className="gzs-profile-layout">

          {/* ── COLUMN 1: Left sidebar ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Card 1 — Domain Identity */}
            <GzsCard padding="md">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: `${domainColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: domainColor, flexShrink: 0 }}>
                  <DomainIcon size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--theme-text)', marginBottom: 4 }}>{meta.label}</div>
                  <DomainBadge domain={activeDomain} size="sm" variant="pill" />
                </div>
              </div>
              {subProfile.headline && (
                <p style={{ fontSize: 13, color: 'var(--theme-text-muted)', lineHeight: 1.6, marginBottom: 12 }}>
                  {subProfile.headline}
                </p>
              )}
              {subProfile.secondary_roles?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {subProfile.secondary_roles.map((tag) => (
                    <span key={tag} style={{ padding: '2px 8px', background: 'var(--theme-bg-section)', border: '1px solid var(--theme-border)', borderRadius: 20, fontSize: 11, color: 'var(--theme-text-subtle)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </GzsCard>

            {/* Card 2 — Quick Stats */}
            <GzsCard padding="md">
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Quick Stats
              </div>
              {[
                { label: 'Profile views',   value: '1,247' },
                { label: 'Trust score',     value: masterProfile?.trust_score ?? subProfile?.trust_score ?? '—' },
                { label: 'Skills verified', value: skills.filter((s) => s.verified).length },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--theme-border)', padding: '6px 0' }}>
                  <span style={{ fontSize: 12, color: 'var(--theme-text-subtle)' }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--theme-text)' }}>{value}</span>
                </div>
              ))}
            </GzsCard>

            {/* Card 3 — Media Links (only filled) */}
            {mediaFields.length > 0 && (
              <GzsCard padding="md">
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  Links
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {mediaFields.map((field) => (
                    <a
                      key={field.key}
                      href={subProfile.media_links[field.key]}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: 8, fontSize: 12, color: 'var(--theme-text-muted)', textDecoration: 'none', transition: 'border-color 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--theme-border-strong)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--theme-border)'; }}
                    >
                      <field.icon size={14} style={{ color: domainColor, flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{field.label}</span>
                      <FiExternalLink size={11} style={{ flexShrink: 0, opacity: 0.4 }} />
                    </a>
                  ))}
                </div>
              </GzsCard>
            )}
          </div>

          {/* ── COLUMN 2: Main content ── */}
          <div>
            {/* Section tabs */}
            <div className="gzs-tabs">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSection(s.id)}
                  className={`gzs-tab ${activeSection === s.id ? 'active' : ''}`}
                  style={activeSection === s.id ? { background: `${domainColor}18`, color: domainColor, borderColor: `${domainColor}30` } : {}}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Writing: own specialized view for non-meta sections */}
            {subProfile.type === 'writing' && activeSection !== 'availability' && activeSection !== 'media' && activeSection !== 'header' ? (
              <WritingSubProfileView
                subProfile={subProfile}
                isEditing={isEditing}
                writingBlogs={writingBlogs}
                writingStats={writingStats}
                writingSamples={subProfile?.writing_samples || []}
                subFeedPosts={subFeedItems}
              />
            ) : (
              <>
                {/* Header */}
                {activeSection === 'header' && (
                  <>
                    <GzsCard padding="md">
                      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        <div style={{ width: 64, height: 64, borderRadius: 12, background: `${domainColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: domainColor, flexShrink: 0 }}>
                          <DomainIcon size={32} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--theme-text)', marginBottom: 4 }}>{subProfile.primary_role || subProfile.display_name}</h2>
                          <p style={{ fontSize: 13, color: domainColor, marginBottom: 8, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <span>@{subProfile.username} · {subProfile.experience_level} · {subProfile.years_experience ?? 0} yrs</span>
                            {subProfile.type === 'business' && subProfile.verified_linkedin && subProfile.linkedin_url && (
                              <a
                                href={subProfile.linkedin_url}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: '#0A66C2', color: '#fff', borderRadius: 12, fontSize: 11, fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}
                              >
                                <FiLinkedin size={10} /> LinkedIn
                              </a>
                            )}
                          </p>
                          <p style={{ fontSize: 13, color: 'var(--theme-text-muted)', lineHeight: 1.6, maxWidth: 540 }}>{subProfile.headline}</p>
                          {subProfile.type === 'writing' && writingStats?.total_words > 0 && (
                            <p style={{ fontSize: 12, color: 'var(--theme-text-subtle)', marginTop: 4, marginBottom: 4 }}>
                              {writingStats.total_words.toLocaleString()} words published
                            </p>
                          )}
                          {subProfile.type === 'audio' && !isOwnProfile && subProfile.samples_available && (
                            <button
                              onClick={() => core.post(`/profiles/${subProfile.id}/sample-request`).catch(() => {})}
                              style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: `${domainColor}18`, color: domainColor, border: `1px solid ${domainColor}30`, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                            >
                              <FiHeadphones size={13} /> Request Sample
                            </button>
                          )}
                          {subProfile.secondary_roles?.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                              {subProfile.secondary_roles.map((role) => (
                                <span key={role} style={{ padding: '2px 8px', background: 'var(--theme-bg-section)', border: '1px solid var(--theme-border)', borderRadius: 20, fontSize: 11, color: 'var(--theme-text-subtle)' }}>{role}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </GzsCard>
                    {subProfile.type === 'esports' && (
                      <GameTitlesEditor
                        gameTitles={gameTitles}
                        setGameTitles={setGameTitles}
                        gameLibrary={gameLibrary}
                        isEditing={isEditing}
                        domainColor={domainColor}
                      />
                    )}
                    {subProfile.type === 'content' && (
                      <ContentPlatformsEditor
                        contentPlatforms={contentPlatforms}
                        setContentPlatforms={setContentPlatforms}
                        isEditing={isEditing}
                        domainColor={domainColor}
                      />
                    )}
                  </>
                )}

                {/* Focus */}
                {activeSection === 'focus' && (
                  <GzsCard padding="md">
                    <div style={{ marginBottom: 16 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Active Roles</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {subProfile.active_roles?.map((role) => (
                          <span key={role} style={{ padding: '4px 10px', background: `${domainColor}18`, color: domainColor, border: `1px solid ${domainColor}30`, borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{role}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Current Work Focus</p>
                      <p style={{ fontSize: 13, color: 'var(--theme-text-muted)', lineHeight: 1.6 }}>{subProfile.current_work_focus}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Open To</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {subProfile.open_to?.map((item) => (
                          <span key={item} style={{ padding: '4px 10px', background: 'var(--theme-bg-section)', border: '1px solid var(--theme-border)', borderRadius: 20, fontSize: 12, color: 'var(--theme-text-muted)' }}>{item}</span>
                        ))}
                      </div>
                    </div>
                  </GzsCard>
                )}

                {/* Skill Matrix */}
                {activeSection === 'skills' && (
                  subProfile.type === 'esports' ? (
                    <GzsCard padding="md">
                      <EsportsSkillMatrix subProfile={subProfile} isEditing={isEditing} />
                    </GzsCard>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {groupedSkills.map(([category, categorySkills]) => (
                        <div key={category}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>{category}</p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
                            {categorySkills.map((skill) => (
                              <GzsCard key={skill.id} padding="sm" hover>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--theme-text)' }}>{skill.name}</span>
                                  {skill.verified ? (
                                    <span style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12, fontWeight: 700 }}>VERIFIED</span>
                                  ) : isEditing ? (
                                    <button
                                      onClick={async () => {
                                        try {
                                          await core.post(`/profiles/me/skills/${skill.id}/verify-request`, { proof_type: 'portfolio', proof_url: '' });
                                          showToast({ type: 'success', message: 'Verification request sent!' });
                                        } catch {
                                          showToast({ type: 'error', message: 'Failed to submit. Try again.' });
                                        }
                                      }}
                                      style={{ fontSize: 10, padding: '2px 8px', background: `${domainColor}12`, color: domainColor, border: `1px solid ${domainColor}30`, borderRadius: 12, fontWeight: 600, cursor: 'pointer' }}
                                    >
                                      Request verify
                                    </button>
                                  ) : (
                                    <span style={{ fontSize: 10, padding: '2px 6px', background: 'var(--theme-bg-section)', color: 'var(--theme-text-subtle)', border: '1px solid var(--theme-border)', borderRadius: 12 }}>—</span>
                                  )}
                                </div>
                              </GzsCard>
                            ))}
                          </div>
                        </div>
                      ))}
                      {groupedSkills.length === 0 && (
                        <GzsCard padding="md"><p style={{ fontSize: 13, color: 'var(--theme-text-subtle)' }}>No skills added yet.</p></GzsCard>
                      )}
                      {isEditing && (
                        <button
                          onClick={async () => {
                            const name = window.prompt('Enter skill name:');
                            if (!name?.trim()) return;
                            try {
                              await core.post(`/profiles/me/${type}/skills`, { name: name.trim(), category: DOMAIN_SKILL_CATEGORIES[type]?.[0] || 'General' });
                              queryClient.invalidateQueries({ queryKey: ['profile', 'me', 'sub', type] });
                            } catch {
                              showToast({ type: 'error', message: 'Failed to add skill. Try again.' });
                            }
                          }}
                          style={{ alignSelf: 'flex-start', padding: '7px 16px', background: `${domainColor}18`, color: domainColor, border: `1px solid ${domainColor}30`, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          + Add Skill
                        </button>
                      )}
                    </div>
                  )
                )}

                {/* Tools & Stack */}
                {activeSection === 'tools' && (
                  <GzsCard padding="md">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {[
                        { key: 'engines',              label: 'Engines'             },
                        { key: 'languages',            label: 'Languages'           },
                        { key: 'platforms',            label: 'Platforms'           },
                        { key: 'other',                label: 'Other Tools'         },
                        { key: 'software_proficiency', label: 'Software'            },
                        { key: 'daw_proficiency',      label: 'DAW Proficiency'     },
                      ].map(({ key, label }) => {
                        const items = key === 'software_proficiency' ? subProfile.software_proficiency
                                    : key === 'daw_proficiency'      ? subProfile.daw_proficiency
                                    : subProfile.tools?.[key];
                        if (!items?.length) return null;
                        return (
                          <div key={key}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {items.map((tool) => (
                                <span key={tool} style={{ padding: '3px 10px', background: 'var(--theme-bg-section)', border: '1px solid var(--theme-border)', borderRadius: 20, fontSize: 12, color: 'var(--theme-text-muted)' }}>{tool}</span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {subProfile.game_profiles?.length > 0 && (
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Game Profiles</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {subProfile.game_profiles.map((game) => (
                              <div key={game.game} style={{ padding: '10px 12px', background: 'var(--theme-bg-section)', borderRadius: 8, border: '1px solid var(--theme-border)' }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--theme-text)', marginBottom: 2 }}>{game.game}</p>
                                <p style={{ fontSize: 12, color: 'var(--theme-text-subtle)' }}>{game.username} · {game.peak_mmr} · {game.region} · {game.platform}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {subProfile.platforms?.length > 0 && (
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Content Platforms</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {subProfile.platforms.map((platform) => (
                              <div key={platform.platform} style={{ padding: '10px 12px', background: 'var(--theme-bg-section)', borderRadius: 8, border: '1px solid var(--theme-border)' }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--theme-text)', marginBottom: 2 }}>{platform.platform}</p>
                                <p style={{ fontSize: 12, color: 'var(--theme-text-subtle)' }}>{platform.followers} · {platform.posting_frequency} · Avg: {platform.avg_viewers}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {subProfile.type === 'esports' && (
                        <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--theme-border)' }}>
                          <AIFeaturePlaceholder title="Performance Trend Analyser" description="Link your tracker stats API and AI generates a monthly performance summary — rank trajectory, win rate trends, peak vs current gap, and plain-English improvement insights." phase="Phase 3" icon={FiTrendingUp} inputLabel="Tracker.gg profile URL" inputType="url" actionLabel="Connect tracker" />
                        </div>
                      )}
                    </div>
                  </GzsCard>
                )}

                {/* Projects / Proof */}
                {activeSection === 'projects' && (
                  subProfile.type === 'art' ? (
                    <ArtPortfolioGallery
                      projects={projects}
                      isEditing={isEditing}
                      isOwn={isOwnProfile}
                      masterProfile={masterProfile}
                      subProfile={subProfile}
                    />
                  ) : (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                        {projects.map((project) => (
                          <article key={project.id} style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${domainColor}20`, background: `linear-gradient(135deg, ${domainColor}22, ${domainColor}08)` }}>
                            <div style={{ height: 160, overflow: 'hidden' }}>
                              <img src={project.thumbnail_url} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div style={{ padding: '14px 16px' }}>
                              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--theme-text)', marginBottom: 6 }}>{project.title}</h3>
                              <p style={{ fontSize: 12, color: 'var(--theme-text-muted)', lineHeight: 1.5, marginBottom: 10 }}>{project.description}</p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {project.skill_tags.map((tag) => {
                                  const skill = skills.find((item) => item.id === tag);
                                  return (
                                    <span key={tag} style={{ padding: '2px 7px', background: 'var(--theme-bg-section)', border: '1px solid var(--theme-border)', borderRadius: 8, fontSize: 11, color: 'var(--theme-text-subtle)' }}>
                                      {skill?.name || tag}
                                    </span>
                                  );
                                })}
                              </div>
                              {subProfile.type === 'audio' && (project.audio_url || project.demo_url) && (
                                <AudioPlayer src={project.audio_url || project.demo_url} title={null} />
                              )}
                            </div>
                          </article>
                        ))}
                        {isEditing && (
                          <div
                            onClick={async () => {
                              const title = window.prompt('Project title:');
                              if (!title?.trim()) return;
                              try {
                                await core.post(`/profiles/me/${type}/projects`, { title: title.trim() });
                                queryClient.invalidateQueries({ queryKey: ['profile', 'me', 'sub', type] });
                              } catch {
                                showToast({ type: 'error', message: 'Failed to add project. Try again.' });
                              }
                            }}
                            style={{ border: '2px dashed var(--theme-border)', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 160, cursor: 'pointer', color: 'var(--theme-text-subtle)', gap: 6 }}>
                            <FiPlusCircle size={22} />
                            <span style={{ fontSize: 12, fontWeight: 600 }}>Add Project</span>
                          </div>
                        )}
                      </div>
                      {subProfile.type === 'content' && (
                        <BrandCollabsSection
                          brandCollabs={brandCollabs}
                          setBrandCollabs={setBrandCollabs}
                          isEditing={isEditing}
                          domainColor={domainColor}
                        />
                      )}
                    </>
                  )
                )}

                {/* Activity */}
                {activeSection === 'activity' && (
                  <ActivityFeed
                    username={username}
                    subProfileType={activeDomain}
                    isOwnProfile={isOwnProfile}
                    domainColor={domainColor}
                  />
                )}

                {/* Availability */}
                {activeSection === 'availability' && (
                  <GzsCard padding="md">
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--theme-text)', marginBottom: 16 }}>Availability</h2>
                    <AvailabilityPanel data={subProfile.availability} isEditing={isEditing} />
                  </GzsCard>
                )}

                {/* Media */}
                {activeSection === 'media' && (
                  <GzsCard padding="md">
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--theme-text)', marginBottom: 16 }}>Media & External Links</h2>
                    <MediaLinkPanel domain={subProfile.type} links={subProfile.media_links} isEditing={isEditing} />
                  </GzsCard>
                )}
              </>
            )}
          </div>

          {/* ── COLUMN 3: Right rail ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Card 1 — Availability / CTA */}
            <GzsCard padding="md" style={{ border: `1px solid ${domainColor}30` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Availability</span>
                <span style={{ fontSize: 11, padding: '2px 8px', background: `${domainColor}18`, color: domainColor, borderRadius: 12, fontWeight: 600 }}>Open</span>
              </div>
              <div>
                {[
                  { label: 'Rate',      value: subProfile.availability?.rate_min ? `${subProfile.availability.rate_currency ?? ''} ${subProfile.availability.rate_min}–${subProfile.availability.rate_max} / ${subProfile.availability.rate_type ?? 'hr'}` : 'On request' },
                  { label: 'Type',      value: subProfile.availability?.contract_preference },
                  { label: 'Duration',  value: subProfile.availability?.weekly_hours },
                  { label: 'Languages', value: 'English, Hindi' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--theme-border)', padding: '7px 0', fontSize: 12 }}>
                    <span style={{ color: 'var(--theme-text-subtle)' }}>{label}</span>
                    <span style={{ color: 'var(--theme-text)', fontWeight: 600 }}>{value || '—'}</span>
                  </div>
                ))}
              </div>
              <button style={{ width: '100%', marginTop: 14, padding: '9px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', background: domainColor, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Reach out
              </button>
            </GzsCard>

            {/* Card 2 — Settings (owner only) */}
            {isOwnProfile && (
              <GzsCard padding="md">
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Settings</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {settingsToggles.map(({ key, label, on }) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--theme-text-muted)' }}>
                      <span>{label}</span>
                      <div style={{ position: 'relative', width: 36, height: 20, borderRadius: 10, background: on ? domainColor : 'var(--theme-bg-section)', border: '1px solid var(--theme-border)', cursor: 'pointer', flexShrink: 0 }}>
                        <div style={{ position: 'absolute', top: 2, left: on ? 16 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </GzsCard>
            )}

            {/* Card 3 — Media links (mirrored) */}
            {mediaFields.length > 0 && (
              <GzsCard padding="md">
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Links</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {mediaFields.map((field) => (
                    <a
                      key={field.key}
                      href={subProfile.media_links[field.key]}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: 8, fontSize: 12, color: 'var(--theme-text-muted)', textDecoration: 'none', transition: 'border-color 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--theme-border-strong)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--theme-border)'; }}
                    >
                      <field.icon size={14} style={{ color: domainColor, flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{field.label}</span>
                      <FiExternalLink size={11} style={{ flexShrink: 0, opacity: 0.4 }} />
                    </a>
                  ))}
                </div>
              </GzsCard>
            )}

            {/* Domain-specific panel (art commissions, esports coaching) */}
            {(subProfile.type === 'art' || subProfile.type === 'esports') && (
              <DomainRightPanel
                subProfile={subProfile}
                meta={meta}
                isOwn={isOwnProfile}
                masterProfile={masterProfile}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Achievement icon map ────────────────────────────────────────────────────
const ACHIEVEMENT_ICON_MAP = {
  FiAward: FiAward, FiZap: FiZap, FiCheck: FiCheck, FiStar: FiActivity,
  FiCode: FiCode, FiMusic: FiMusic, FiVideo: FiVideo, FiFeather: FiFeather,
};

function AchievementIconComponent({ iconKey, color }) {
  const Icon = ACHIEVEMENT_ICON_MAP[iconKey] || FiAward;
  return <Icon size={16} style={{ color }} />;
}

function formatTimeAgo(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

const ACTIVITY_TYPE_ICON = {
  event: FiActivity,
  showcase: FiImage,
  lfg: FiSearch,
};

// ─── ActivityFeed ────────────────────────────────────────────────────────────
function ActivityFeed({ username, subProfileType, isOwnProfile, domainColor }) {
  const [postsShown, setPostsShown] = useState(5);

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['user-sub-posts', username, subProfileType],
    queryFn: () => socialService.getSubProfilePosts(username, subProfileType),
    enabled: !!username,
  });

  const { data: achievements = [], isLoading: achievementsLoading } = useQuery({
    queryKey: ['sub-achievements', subProfileType],
    queryFn: () => profileService.getSubProfileAchievements(subProfileType),
  });

  const { data: activity = [], isLoading: activityLoading } = useQuery({
    queryKey: ['user-community-activity', username],
    queryFn: () => communityService.getUserActivity(username),
    enabled: !!username,
  });

  const { data: writingActivityBlogs = [] } = useQuery({
    queryKey: ['writing-activity-blogs', username],
    queryFn: () =>
      fetch(`/api/cms/blogs?author=${username}&status=published`)
        .then(r => r.json())
        .then(r => r.data || r || [])
        .catch(() => []),
    enabled: subProfileType === 'writing',
    staleTime: 5 * 60 * 1000,
  });

  const sectionLabel = (label) => (
    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
      {label}
    </p>
  );

  const skeletonStack = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Skeleton height={80} rounded="lg" />
      <Skeleton height={80} rounded="lg" />
      <Skeleton height={80} rounded="lg" />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── Posts ── */}
      <div>
        {sectionLabel('Posts')}
        {postsLoading ? skeletonStack : posts.length === 0 ? (
          <div style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: 12, padding: '20px 18px' }}>
            <p style={{ fontSize: 13, color: 'var(--theme-text-subtle)', margin: 0 }}>
              No posts yet. Share your work with the community.
            </p>
            {isOwnProfile && (
              <Link
                to="/community"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, padding: '7px 14px', background: domainColor, color: '#FFFFFF', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
              >
                <FiPlusCircle size={13} /> Create your first post
              </Link>
            )}
          </div>
        ) : (
          <>
            {posts.slice(0, postsShown).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {posts.length > postsShown && (
              <button
                type="button"
                onClick={() => setPostsShown((n) => n + 5)}
                style={{ width: '100%', marginTop: 8, padding: '9px 0', background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: 10, fontSize: 12, fontWeight: 600, color: 'var(--theme-text-subtle)', cursor: 'pointer' }}
              >
                Load more ({posts.length - postsShown} remaining)
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Achievements ── */}
      <div>
        {sectionLabel('Achievements')}
        {achievementsLoading ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <Skeleton width={100} height={36} rounded="full" />
            <Skeleton width={100} height={36} rounded="full" />
            <Skeleton width={100} height={36} rounded="full" />
          </div>
        ) : achievements.length === 0 ? (
          <div style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: 12, padding: '16px 18px' }}>
            <p style={{ fontSize: 13, color: 'var(--theme-text-subtle)', margin: 0 }}>
              No achievements yet. Keep building your profile.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {achievements.map((ach) => (
              <div
                key={ach.id}
                title={ach.earned_at ? `Earned ${formatTimeAgo(ach.earned_at)}` : ''}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: `${domainColor}18`, border: `1px solid ${domainColor}30`, borderRadius: 20, fontSize: 12, fontWeight: 600, color: domainColor, cursor: 'default' }}
              >
                <AchievementIconComponent iconKey={ach.icon} color={domainColor} />
                {ach.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Tournament History (esports only) ── */}
      {subProfileType === 'esports' && (
        <div>
          {sectionLabel('Tournament History')}
          <TournamentHistoryTable username={username} />
        </div>
      )}

      {/* ── GZS Blog Posts (writing only) ── */}
      {subProfileType === 'writing' && writingActivityBlogs.length > 0 && (
        <div>
          {sectionLabel('GZS Blog Posts')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {writingActivityBlogs.map((blog, i) => (
              <div key={blog.id ?? i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: 'var(--theme-bg-section)', borderRadius: 10, border: '1px solid var(--theme-border)' }}>
                <FiFeather size={14} style={{ color: domainColor, flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--theme-text)', marginBottom: 4 }}>{blog.title}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--theme-text-subtle)' }}>
                    {blog.published_at && (
                      <span>{new Date(blog.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    )}
                    {blog.view_count != null && <span>👁 {blog.view_count}</span>}
                    {blog.like_count != null && <span>♥ {blog.like_count}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Community Contributions ── */}
      <div>
        {sectionLabel('Community Contributions')}
        {activityLoading ? skeletonStack : activity.length === 0 ? (
          <div style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: 12, padding: '16px 18px' }}>
            <p style={{ fontSize: 13, color: 'var(--theme-text-subtle)', margin: 0 }}>
              No community activity yet.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {activity.slice(0, 10).map((item, i) => {
              const TypeIcon = ACTIVITY_TYPE_ICON[item.type] || FiActivity;
              return (
                <div key={item.id ?? i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--theme-border)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--theme-bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <TypeIcon size={13} style={{ color: 'var(--theme-text-subtle)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, color: 'var(--theme-text-muted)', margin: 0, lineHeight: 1.5 }}>{item.description}</p>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--theme-text-subtle)', whiteSpace: 'nowrap', flexShrink: 0 }}>{formatTimeAgo(item.created_at)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

// ─── TournamentHistoryTable ──────────────────────────────────────────────────
function TournamentHistoryTable({ username }) {
  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ['user-tournaments', username],
    queryFn: () => tournamentService.getUserTournaments(username),
    enabled: !!username,
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Skeleton height={44} rounded="lg" />
        <Skeleton height={44} rounded="lg" />
        <Skeleton height={44} rounded="lg" />
      </div>
    );
  }

  if (tournaments.length === 0) {
    return (
      <div style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: 12, padding: '16px 18px' }}>
        <p style={{ fontSize: 13, color: 'var(--theme-text-subtle)', margin: 0 }}>No tournament history yet.</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: 12, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: 'var(--theme-bg-section)' }}>
            {['Tournament', 'Game', 'Placement', 'Date', 'Prize'].map((h) => (
              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--theme-text-subtle)', borderBottom: '1px solid var(--theme-border)' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tournaments.map((t, i) => (
            <tr key={t.id ?? i} style={{ borderBottom: '1px solid var(--theme-border)' }}>
              <td style={{ padding: '9px 12px', color: 'var(--theme-text)', fontWeight: 600 }}>
                <Link to={`/tournaments/${t.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {t.name || t.title}
                </Link>
              </td>
              <td style={{ padding: '9px 12px', color: 'var(--theme-text-muted)' }}>{t.game || '—'}</td>
              <td style={{ padding: '9px 12px' }}>
                <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: t.placement === 1 ? '#fef9c3' : 'var(--theme-bg-section)', color: t.placement === 1 ? '#92400e' : 'var(--theme-text-muted)' }}>
                  {t.placement === 1 ? '🥇 1st' : t.placement === 2 ? '🥈 2nd' : t.placement === 3 ? '🥉 3rd' : t.placement ? `Top ${t.placement}` : 'Participant'}
                </span>
              </td>
              <td style={{ padding: '9px 12px', color: 'var(--theme-text-subtle)' }}>{t.date ? new Date(t.date).toLocaleDateString([], { month: 'short', year: 'numeric' }) : '—'}</td>
              <td style={{ padding: '9px 12px', color: 'var(--theme-text-subtle)' }}>{t.prize || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Domain Right Panel ---
function DomainRightPanel({ subProfile, meta, isOwn = true, masterProfile = null }) {
  if (subProfile.type === 'esports') {
    return (
      <>
        {/* Coaching card */}
        <div className="rounded-2xl border p-4" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-bold px-2 py-0.5 rounded-full" style={{ background: '#DCFCE7', color: '#16A34A' }}>Open</span>
            <span className="text-xs" style={{ color: '#64748B' }}>5 days / week</span>
          </div>
          <div className="text-2xl font-black mb-1" style={{ color: meta.color }}>
            ₹2,500 <span className="text-xs font-semibold text-slate-400">/hr</span>
          </div>
          <div className="space-y-1.5 mt-3 text-xs" style={{ color: '#64748B' }}>
            <p><b style={{ color: '#0F172A' }}>Specialty:</b> Valorant 1v1 coaching</p>
            <p><b style={{ color: '#0F172A' }}>Min level:</b> Diamond +</p>
            <p><b style={{ color: '#0F172A' }}>Languages:</b> English, Hindi</p>
            <p><b style={{ color: '#0F172A' }}>Sessions:</b> 17 completed (19★)</p>
          </div>
          <button className="mt-4 w-full py-2 rounded-xl text-sm font-semibold text-white" style={{ background: meta.color }}>
            Book a session
          </button>
        </div>
        {/* Streaming links */}
        <div className="rounded-2xl border p-4" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#94A3B8' }}>Streaming</p>
          {['Twitch · @karenDP', 'YouTube · @spectate_k', 'Liquipedia · karenDP'].map((link) => (
            <div key={link} className="flex items-center gap-2 py-1.5 border-b last:border-0" style={{ borderColor: '#F1F5F9' }}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.color }} />
              <span className="text-xs" style={{ color: '#475569' }}>{link}</span>
              <FiExternalLink size={10} className="ml-auto flex-shrink-0" style={{ color: '#94A3B8' }} />
            </div>
          ))}
        </div>
      </>
    );
  }

  if (subProfile.type === 'art') {
    const canViewRates = isOwn || subProfile.commission_rates_public || masterProfile?.is_connected;
    const commissions = [
      { name: 'Half body color', price: '₹10,800', time: '7 days' },
      { name: 'Full body color', price: '₹20,000', time: '12 days' },
      { name: 'Character sheet', price: 'On request', time: null },
      { name: 'Sticker pack', price: '₹5,800', time: '2 days' },
    ];
    return (
      <>
        <div className="rounded-2xl border p-4" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#FDF2F8', color: meta.color }}>
              ✓ 4/6 slots filled
            </span>
            <FiEdit2 size={12} style={{ color: '#94A3B8' }} />
          </div>
          <div className="space-y-2.5">
            {commissions.map(({ name, price, time }) => (
              <div key={name} className="flex items-center justify-between">
                <span className="text-xs" style={{ color: '#475569' }}>{name}</span>
                <div className="text-right">
                  {canViewRates ? (
                    <>
                      <span className="text-xs font-bold" style={{ color: '#0F172A' }}>{price}</span>
                      {time && <span className="text-[10px] ml-1" style={{ color: '#94A3B8' }}>· {time}</span>}
                    </>
                  ) : (
                    <span className="text-xs" style={{ color: '#94A3B8', fontStyle: 'italic' }}>Connect to view rates</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full py-2 rounded-xl text-sm font-semibold text-white" style={{ background: meta.color }}>
            Request commission
          </button>
        </div>
        {/* Style tags */}
        <div className="rounded-2xl border p-4" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#94A3B8' }}>Style Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {['Stylized', 'Fantasy', 'High contrast', 'Painterly', 'Character art'].map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${meta.color}15`, color: meta.color }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </>
    );
  }

  // Dev / default availability panel
  return (
    <div className="rounded-2xl border p-4" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#94A3B8' }}>Available · Hire</p>
      <div className="space-y-2 text-xs mb-4">
        {[
          { label: 'Available', value: subProfile.availability?.available_from || 'Jan 25 · 35 hrs/week' },
          { label: 'Type', value: subProfile.availability?.contract_preference || 'Contract / Freelance' },
          { label: 'Engagement', value: subProfile.availability?.weekly_hours || '6 months' },
          { label: 'Start', value: '2 weeks notice' },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between gap-2">
            <span style={{ color: '#94A3B8' }}>{label}</span>
            <span className="font-semibold text-right" style={{ color: '#0F172A' }}>{value}</span>
          </div>
        ))}
      </div>
      <button className="w-full py-2 rounded-xl text-sm font-semibold text-white" style={{ background: meta.color }}>
        Book Session
      </button>
      {/* Links */}
      <div className="mt-4 pt-3 border-t space-y-1.5" style={{ borderColor: '#F1F5F9' }}>
        {['github.com/kunal.dev', 'itch.io/karendil', 'sidereal.dev', 'karendil.io'].map((link) => (
          <div key={link} className="flex items-center gap-1.5 text-xs" style={{ color: '#64748B' }}>
            <FiExternalLink size={10} style={{ flexShrink: 0 }} />
            <span className="truncate">{link}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- TASK A: Availability Panel ---
function AvailabilityPanel({ data, isEditing }) {
  const [showRate, setShowRate] = useState(false);
  
  if (!isEditing) {
    return (
      <div className="mt-5 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <AvailabilityStat label="Timezone" value={data?.timezone} />
        <AvailabilityStat label="Collaboration" value={data?.collaboration_type} />
        <AvailabilityStat label="Contract" value={data?.contract_preference} />
        <AvailabilityStat label="Weekly Hours" value={data?.weekly_hours} />
        {data?.public_rate && (
          <AvailabilityStat 
            label="Base Rate" 
            value={`${data?.rate_currency} ${data?.rate_min}-${data?.rate_max} / ${data?.rate_type}`} 
          />
        )}
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">Timezone</label>
          <select className="w-full bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--theme-primary)] outline-none">
            {TIMEZONES.map(tz => <option key={tz} selected={tz === data?.timezone}>{tz}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">Weekly Hours</label>
          <select className="w-full bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--theme-primary)] outline-none">
            {['<10h', '10-20h', '20-30h', '30-40h', '40h+'].map(h => <option key={h} selected={h === data?.weekly_hours}>{h}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">Collaboration Preference</label>
        <div className="flex flex-wrap gap-2">
          {['Remote', 'Hybrid', 'In-person', 'Online-only'].map(type => (
            <button key={type} className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${data?.collaboration_type?.includes(type) ? 'bg-[var(--theme-primary)] text-white border-transparent shadow-lg' : 'bg-[var(--theme-bg-alt)] text-[var(--theme-text-muted)] border-[var(--theme-border)]'}`}>
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">Contract Preference</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {['Freelance', 'Contract', 'Full-time', 'Part-time', 'Internship'].map(type => (
            <label key={type} className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] hover:bg-[var(--theme-primary)]/5 transition-colors">
              <input type="checkbox" className="rounded text-[var(--theme-primary)] focus:ring-0" defaultChecked={data?.contract_preference?.includes(type)} />
              <span className="text-xs font-bold text-[var(--theme-text-muted)]">{type}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-[var(--theme-border)]/50">
        <button 
          onClick={() => setShowRate(!showRate)}
          className="flex items-center gap-2 text-sm font-bold text-[var(--theme-primary)] hover:underline"
        >
          {showRate ? <FiEyeOff /> : <FiEye />} {showRate ? 'Hide Rate Configuration' : 'Configure Rate Range'}
        </button>
        
        <AnimatePresence>
          {showRate && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-6 p-6 rounded-2xl bg-[var(--theme-bg-alt)] border border-[var(--theme-border)]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[var(--theme-text)]">Show my rate publicly</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked={data?.public_rate} />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--theme-primary)]"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-[var(--theme-text-muted)]">Min Rate</label>
                    <div className="relative">
                      <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)]" />
                      <input type="number" defaultValue={data?.rate_min} className="w-full bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl pl-8 pr-4 py-2 text-sm outline-none focus:border-[var(--theme-primary)]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-[var(--theme-text-muted)]">Max Rate</label>
                    <div className="relative">
                      <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)]" />
                      <input type="number" defaultValue={data?.rate_max} className="w-full bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl pl-8 pr-4 py-2 text-sm outline-none focus:border-[var(--theme-primary)]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-[var(--theme-text-muted)]">Currency</label>
                    <select className="w-full bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--theme-primary)]">
                      {['USD', 'INR', 'GBP', 'EUR'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-[var(--theme-text-muted)]">Rate Type</label>
                  <div className="flex gap-4">
                    {['Hourly', 'Project-based', 'Monthly retainer'].map(type => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="rate_type" className="text-[var(--theme-primary)]" defaultChecked={type === data?.rate_type} />
                        <span className="text-xs font-bold text-[var(--theme-text-muted)]">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <button className="gzs-btn-primary w-full py-4 text-xs">Save Availability Settings</button>
    </div>
  );
}

function AvailabilityStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-[var(--theme-bg-alt)] p-4 border border-[var(--theme-border)]">
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-primary)] mb-1">{label}</p>
      <p className="text-sm font-bold text-[var(--theme-text)]">{value || 'Not set'}</p>
    </div>
  );
}

// --- TASK B: Media & External Links ---
function MediaLinkPanel({ domain, links, isEditing }) {
  const fields = DOMAIN_MEDIA_FIELDS[domain] || DOMAIN_MEDIA_FIELDS.dev;
  const [commissionStatus, setCommissionStatus] = useState('Open');

  return (
    <div className="mt-5 space-y-8">
      {domain === 'art' && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--theme-primary)]/5 border border-[var(--theme-primary)]/20 mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full animate-pulse ${commissionStatus === 'Open' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
            <span className="text-sm font-black uppercase tracking-widest italic">Commission Status: {commissionStatus}</span>
          </div>
          {isEditing && (
            <select 
              value={commissionStatus} 
              onChange={(e) => setCommissionStatus(e.target.value)}
              className="bg-white border border-[var(--theme-border)] rounded-lg px-3 py-1 text-xs font-bold outline-none"
            >
              <option>Open</option>
              <option>Closed</option>
              <option>Limited slots</option>
            </select>
          )}
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key} className={`rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] p-4 flex flex-col justify-between group/link transition-all hover:border-[var(--theme-primary)]/40 ${field.prominent ? 'sm:col-span-2 border-2 border-[var(--theme-primary)]/20' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-white shadow-sm text-lg ${field.prominent ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-text-muted)]'}`}>
                  <field.icon />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">{field.label}</span>
              </div>
              <a href={links?.[field.key]} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-white text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] shadow-sm transition-all">
                <FiExternalLink />
              </a>
            </div>
            
            {isEditing ? (
              <input 
                type="url" 
                placeholder={field.placeholder} 
                defaultValue={links?.[field.key]}
                className="w-full bg-white border border-[var(--theme-border)] rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
              />
            ) : (
              <p className="truncate text-sm font-bold text-[var(--theme-text)] opacity-80">{links?.[field.key] || 'Not linked'}</p>
            )}
          </div>
        ))}
      </div>

      {domain === 'audio' && (
        <div className="mt-8 pt-8 border-t border-[var(--theme-border)]/50">
          <div className="section-label mb-4"><FiMusic className="text-[var(--theme-primary)]" /> <span>Upload Track Sample</span></div>
          <div className="p-8 rounded-3xl border-2 border-dashed border-[var(--theme-border)] bg-[var(--theme-bg-alt)]/30 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-[var(--theme-primary)]/5 transition-all">
            <FiHeadphones className="text-4xl text-[var(--theme-text-muted)] mb-4 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-[var(--theme-text)] mb-1">Drag & Drop Audio Sample</p>
            <p className="text-xs text-[var(--theme-text-muted)] mb-4">WAV, MP3 or OGG (Max 20MB)</p>
            <input type="file" className="hidden" />
            <button className="px-6 py-2 bg-white border border-[var(--theme-border)] rounded-full text-xs font-black uppercase tracking-widest hover:border-[var(--theme-primary)] transition-all">Select File</button>
            
            {/* Mock progress bar for visual feedback */}
            <div className="w-full max-w-xs mt-6 space-y-2 opacity-0 group-active:opacity-100 transition-opacity">
               <div className="h-2 bg-white rounded-full overflow-hidden">
                 <div className="h-full bg-[var(--theme-primary)] w-[45%] animate-pulse" />
               </div>
               <p className="text-[9px] font-black uppercase tracking-widest text-[var(--theme-primary)]">Syncing Shard... 45%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- TASK C: Esports Skill Matrix ---
function EsportsSkillMatrix({ subProfile, isEditing }) {
  const [selectedGames] = useState([
    { id: 'valorant', name: 'Valorant', username: 'GzoneGhost#001', rank: 'Ascendant 2', region: 'EUW', platform: 'PC' },
    { id: 'cs2', name: 'Counter-Strike 2', username: 'Ghost_GZS', rank: 'Faceit 10', region: 'Global', platform: 'PC' }
  ]);
  const [openGame, setOpenGame] = useState(null);

  return (
    <div className="mt-6 space-y-8 animate-in fade-in duration-500">
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--theme-text-muted)] mb-3">Game Titles</h3>
        <div className="grid gap-3">
          {selectedGames.map((game, idx) => (
            <div key={game.id} className="border border-[var(--theme-border)] rounded-2xl bg-[var(--theme-bg-alt)] overflow-hidden">
              <button 
                onClick={() => setOpenGame(openGame === idx ? null : idx)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-[var(--theme-primary)]/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl text-[var(--theme-primary)]">
                    <FiTerminal />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black uppercase italic tracking-tight text-[var(--theme-text)]">{game.name}</p>
                    <p className="text-[10px] font-bold text-[var(--theme-text-muted)] opacity-60">{game.rank} • {game.region}</p>
                  </div>
                </div>
                {openGame === idx ? <FiChevronUp /> : <FiChevronDown />}
              </button>
              
              <AnimatePresence>
                {openGame === idx && (
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden border-t border-[var(--theme-border)]/50"
                  >
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 bg-white/30">
                       <GameSubField label="In-game Username" value={game.username} isEditing={isEditing} />
                       <GameSubField label="Peak Rank/MMR" value={game.rank} isEditing={isEditing} />
                       <GameSubField label="Region/Server" value={game.region} isEditing={isEditing} />
                       <GameSubField label="Platform" value={game.platform} isEditing={isEditing} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
        {isEditing && (
          <div className="relative mt-4">
             <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)]" />
             <input type="text" placeholder="Search for games to add..." className="w-full bg-[var(--theme-bg-alt)] border-2 border-dashed border-[var(--theme-border)] rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:border-[var(--theme-primary)] outline-none" />
          </div>
        )}
      </div>

      <div className="pt-8 border-t border-[var(--theme-border)]/50">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--theme-text-muted)] mb-4">Coaching Protocols</h3>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-4">
             <p className="text-[10px] font-black uppercase text-[var(--theme-text-muted)] opacity-60">Availability</p>
             <div className="flex items-center gap-4">
                <span className="text-sm font-bold italic">Open for sessions</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked={subProfile.coaching_availability} disabled={!isEditing} />
                  <div className="w-10 h-5 bg-slate-300 rounded-full peer peer-checked:bg-[var(--theme-primary)] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                </label>
             </div>
          </div>
          <div className="space-y-2">
             <p className="text-[10px] font-black uppercase text-[var(--theme-text-muted)] opacity-60">Hourly Rate</p>
             {isEditing ? (
               <div className="flex items-center gap-2">
                 <FiDollarSign size={14} className="text-[var(--theme-primary)]" />
                 <input type="number" defaultValue={subProfile.hourly_rate} className="bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] rounded-lg px-3 py-1 text-sm font-bold w-20" />
                 <span className="text-xs font-bold">/ hr</span>
               </div>
             ) : (
               <p className="text-xl font-black italic text-[var(--theme-primary)]">${subProfile.hourly_rate} <span className="text-[10px] text-gray-400">/ HOUR</span></p>
             )}
          </div>
          <div className="space-y-2">
             <p className="text-[10px] font-black uppercase text-[var(--theme-text-muted)] opacity-60">Specialty Games</p>
             <div className="flex flex-wrap gap-2">
               {subProfile.specialty_games?.map(game => (
                 <span key={game} className="px-3 py-1 rounded-lg bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] text-xs font-bold">{game}</span>
               ))}
               {isEditing && <button className="p-1 rounded-lg bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] hover:bg-[var(--theme-primary)] hover:text-white transition-all"><FiPlus size={14} /></button>}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GameSubField({ label, value, isEditing }) {
  return (
    <div className="space-y-2">
      <p className="text-[9px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40">{label}</p>
      {isEditing ? (
        <input type="text" defaultValue={value} className="w-full bg-white border border-[var(--theme-border)] rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-[var(--theme-primary)]" />
      ) : (
        <p className="text-xs font-black uppercase italic tracking-tight">{value}</p>
      )}
    </div>
  );
}

// --- TASK D: Art Domain Portfolio ---
function ArtPortfolioGallery({ projects, isEditing, isOwn, masterProfile, subProfile }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="mt-6 space-y-8">
      {isEditing && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full py-10 border-2 border-dashed border-[var(--theme-border)] rounded-[2.5rem] bg-[var(--theme-bg-alt)]/30 flex flex-col items-center justify-center group hover:border-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/5 transition-all"
        >
          <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center text-[var(--theme-primary)] text-2xl mb-4 group-hover:rotate-90 transition-transform duration-500">
            <FiPlus />
          </div>
          <p className="text-sm font-black uppercase tracking-widest italic">Initialize_New_Project</p>
          <p className="text-[10px] text-[var(--theme-text-muted)] opacity-40 mt-1">UPLOAD_VISUAL_SHARD_v4</p>
        </button>
      )}

      {/* Masonry grid: 3 col desktop, responsive via column-width */}
      <div style={{ columns: '220px 3', columnGap: 16 }}>
        {projects.map((project) => (
          <motion.article
            key={project.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            style={{ breakInside: 'avoid', marginBottom: 16, borderRadius: '1.5rem', overflow: 'hidden', position: 'relative', cursor: 'zoom-in', border: '4px solid transparent', transition: 'border-color 0.2s' }}
            className="group hover:border-[var(--theme-primary)]"
          >
            <img
              src={project.thumbnail_url || project.media_url || project.image_url}
              alt={project.title}
              style={{ width: '100%', display: 'block', objectFit: 'cover' }}
            />

            {/* Platform badge */}
            {(project.media_url || project.image_url)?.includes('artstation.com') && (
              <div style={{ position: 'absolute', top: 10, right: 10, background: '#13AFF0', borderRadius: 6, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <SiArtstation size={12} style={{ color: '#fff' }} />
              </div>
            )}
            {(project.media_url || project.image_url)?.includes('behance.net') && (
              <div style={{ position: 'absolute', top: 10, right: 10, background: '#1769FF', borderRadius: 6, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <SiBehance size={12} style={{ color: '#fff' }} />
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6">
              <div className="space-y-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <h3 className="text-xl font-black uppercase tracking-tighter text-white italic leading-none">{project.title}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {project.skill_tags?.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-white/10 backdrop-blur-md rounded text-[10px] font-bold uppercase text-white/80 border border-white/20">{tag}</span>
                  ))}
                </div>
                {project.url && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, fontSize: 11, color: '#fff', fontWeight: 600, textDecoration: 'none' }}
                  >
                    <FiExternalLink size={11} /> View
                  </a>
                )}
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      <ProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

function ProjectModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-4xl bg-[var(--theme-bg)] rounded-[3rem] border-4 border-[var(--theme-border)] shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh] scrollbar-none"
      >
        <div className="p-8 md:p-12 space-y-10">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black uppercase tracking-tighter italic">Upload_Visual_Artifact</h2>
            <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] flex items-center justify-center text-xl hover:rotate-90 transition-transform"><FiX /></button>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic ml-4">Project_Title</label>
                <input type="text" placeholder="Enter project designation..." className="w-full bg-[var(--theme-bg-alt)] border-2 border-[var(--theme-border)] rounded-2xl px-6 py-4 text-sm font-bold focus:border-[var(--theme-primary)] outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic ml-4">Description</label>
                <textarea rows="4" placeholder="Brief metadata summary..." className="w-full bg-[var(--theme-bg-alt)] border-2 border-[var(--theme-border)] rounded-2xl px-6 py-4 text-sm font-bold focus:border-[var(--theme-primary)] outline-none resize-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic ml-4">Art Style Tags</label>
                <div className="flex flex-wrap gap-2">
                   {['Stylized', 'Realistic', 'Cyberpunk', 'Fantasy', 'Low Poly', 'Concept'].map(tag => (
                     <button key={tag} className="px-4 py-2 bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] rounded-xl text-[10px] font-black uppercase hover:bg-[var(--theme-primary)] hover:text-white transition-all">{tag}</button>
                   ))}
                </div>
              </div>
            </div>

            <div className="space-y-8">
               <div className="aspect-video rounded-3xl border-2 border-dashed border-[var(--theme-border)] bg-[var(--theme-bg-alt)] flex flex-col items-center justify-center text-center p-8 group cursor-pointer hover:bg-[var(--theme-primary)]/5 transition-all">
                  <FiImage className="text-5xl text-[var(--theme-text-muted)] mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest italic opacity-60">Upload_Hero_Asset</p>
                  <p className="text-[9px] text-[var(--theme-text-muted)] mt-2">PNG, JPG or WebP (Max 10MB)</p>
               </div>
               <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic ml-4">External Source (ArtStation/Behance)</label>
                <input type="url" placeholder="https://..." className="w-full bg-[var(--theme-bg-alt)] border-2 border-[var(--theme-border)] rounded-2xl px-6 py-4 text-sm font-bold focus:border-[var(--theme-primary)] outline-none" />
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[var(--theme-border)]/50 flex gap-4">
             <button onClick={onClose} className="flex-1 py-5 bg-[var(--theme-bg-alt)] rounded-2xl text-xs font-black uppercase tracking-widest italic hover:bg-[var(--theme-card)] transition-all">Abort_Process</button>
             <button className="flex-[2] py-5 bg-[var(--theme-text)] text-[var(--theme-bg)] rounded-2xl text-xs font-black uppercase tracking-widest italic hover:bg-[var(--theme-primary)] hover:text-white transition-all shadow-2xl">Deploy_Artifact</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// --- TASK E: Writing Sub-Profile Specialized View ---
function WritingSubProfileView({ subProfile, isEditing, writingBlogs = [], writingStats = null, writingSamples = [], subFeedPosts = [] }) {
  const [activeFeedTab, setActiveFeedTab] = useState('posts');

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Main Column */}
      <div className="space-y-8">
        {/* Writing Samples Section */}
        <section id="samples" className="gzs-profile-card relative group/section">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[var(--theme-text)]">Writing Samples</h2>
            {isEditing && (
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] text-xs font-bold text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] transition-all">
                <FiPlus /> Add Sample
              </button>
            )}
          </div>
          
          {/* GZS Published Blogs — auto-populated above manual samples */}
          {writingBlogs.length > 0 && (
            <div className="space-y-4 mb-6">
              {writingBlogs.map((blog) => (
                <div key={blog.id} className="p-5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)]/20">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" style={{ background: 'rgba(16,185,129,0.1)', color: '#059669' }}>
                      Published on GzoneSphere
                    </span>
                    {blog.category && (
                      <span className="px-2 py-0.5 rounded bg-[var(--theme-bg)] border border-[var(--theme-border)] text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest">
                        {blog.category}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-[var(--theme-text)] mb-2">{blog.title}</h3>
                  <p className="text-sm leading-6 text-[var(--theme-text-muted)] font-medium line-clamp-3">
                    {blog.excerpt || (blog.content_plain || '').split(' ').slice(0, 30).join(' ')}
                    {(blog.content_plain || '').split(' ').length > 30 ? '…' : ''}
                  </p>
                  {blog.url && (
                    <a href={blog.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-[var(--theme-primary)] hover:underline">
                      Read more <FiArrowRight size={11} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-6">
            {writingSamples.map((sample) => (
              <div key={sample.id} className="group/sample relative p-6 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)]/20 hover:border-[var(--theme-primary)]/30 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--theme-text)] group-hover/sample:text-[var(--theme-primary)] transition-colors">{sample.title}</h3>
                    <p className="text-xs text-[var(--theme-text-muted)] mt-1">{sample.word_count} words • {sample.branches ? `${sample.branches} branches` : sample.genre}</p>
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-white border border-[var(--theme-border)] text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest">{sample.genre}</span>
                </div>
                
                <p className="text-sm leading-7 text-[var(--theme-text-muted)] font-medium bg-white/40 p-4 rounded-xl border border-dashed border-[var(--theme-border)] italic">
                  {sample.excerpt}
                </p>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {sample.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded bg-[var(--theme-primary)]/10 text-[10px] font-bold text-[var(--theme-primary)] uppercase tracking-wider">{tag}</span>
                    ))}
                  </div>
                  <a href={sample.link} className="flex items-center gap-1.5 text-xs font-bold text-[var(--theme-primary)] hover:underline">
                    Read full <FiArrowRight />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Style Analyser Section */}
        <section id="analyzer" className="gzs-profile-card relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
             <FiZap size={120} />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-[var(--theme-primary)]/10 flex items-center justify-center text-[var(--theme-primary)]">
               <FiZap />
            </div>
            <div>
               <h2 className="text-xl font-bold text-[var(--theme-text)]">Style Analyser · AI summary</h2>
               <p className="text-xs text-[var(--theme-text-muted)]">Generated from 3 samples • 6,592 words</p>
            </div>
            <button className="ml-auto text-[10px] font-bold text-[var(--theme-primary)] uppercase tracking-widest hover:underline">Refresh</button>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-[var(--theme-primary)]/5 to-transparent border border-[var(--theme-primary)]/10">
             <p className="text-sm leading-7 text-[var(--theme-text-muted)] font-medium">
               {subProfile.style_analysis.summary}
             </p>
             <div className="mt-6 flex flex-wrap gap-3">
               {subProfile.style_analysis.traits.map(trait => (
                 <span key={trait} className="px-4 py-2 rounded-xl bg-white border border-[var(--theme-border)] text-xs font-bold text-[var(--theme-text-muted)] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--theme-primary)]" />
                    {trait}
                 </span>
               ))}
             </div>
          </div>
        </section>

        {/* Feed Section */}
        <section id="feed" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--theme-text-muted)]">Posts under this sub-profile</h2>
            <div className="flex bg-[var(--theme-bg-alt)] rounded-xl p-1 border border-[var(--theme-border)]">
              {['posts', 'showcase', 'replies'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveFeedTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${activeFeedTab === tab ? 'bg-white shadow-sm text-[var(--theme-text)]' : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Composer Mockup */}
          <div className="gzs-profile-card">
            <div className="flex gap-4">
              <img src={subProfile.avatar_url} className="w-10 h-10 rounded-xl" alt="" />
              <div className="flex-1 space-y-4">
                <textarea 
                  placeholder={`Share something as @${subProfile.username}...`}
                  className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium placeholder:text-gray-400 resize-none"
                  rows="2"
                />
                <div className="flex items-center justify-between pt-2">
                  <div className="flex gap-2">
                    <ComposerAction icon={<FiLink />} label="Media" />
                    <ComposerAction icon={<FiZap />} label="Showcase" />
                    <ComposerAction icon={<FiExternalLink />} label="Link" />
                    <ComposerAction icon={<FiAward />} label="Achievement" />
                  </div>
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] text-gray-400 font-bold">Post to <span className="text-[var(--theme-primary)]">writing</span> branch · 2 post min. quota</span>
                     <button className="px-6 py-2 bg-[var(--theme-primary)] text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-[var(--theme-primary)]/20">Post</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {subFeedPosts.map(post => (
              <div key={post.id} className="gzs-profile-card">
                <div className="flex gap-4">
                  <img src={post.author.avatar_url} className="w-10 h-10 rounded-xl" alt="" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold">{post.author.username}</span>
                      <FiCheck className="text-blue-500" />
                      <span className="text-[10px] px-1.5 rounded bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] font-bold">writing</span>
                      <span className="text-[10px] text-gray-400 font-bold">· {post.published_at}</span>
                    </div>
                    <p className="text-sm leading-7 text-[var(--theme-text-muted)] font-medium">{post.content}</p>
                    <div className="mt-4 flex gap-4 text-gray-400">
                      <PostStat icon={<FiMessageSquare />} count={post.comments} />
                      <PostStat icon={<FiRepeat />} count={post.shares} />
                      <PostStat icon={<FiHeart />} count={post.likes} />
                      <PostStat icon={<FiShare2 />} count={post.replies} />
                      <button className="ml-auto"><FiMoreHorizontal /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Sidebar Column */}
      <div className="space-y-6">
        {/* Hiring / Freelance Sidebar Module */}
        <section className="gzs-profile-card !p-6 bg-emerald-50/30 border-emerald-100">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-xs font-black uppercase tracking-widest text-emerald-700">Hiring / Freelance</h3>
             <FiBriefcase className="text-emerald-500" />
          </div>
          <div className="p-4 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-200 mb-6">
             <div className="flex items-center gap-2 mb-1">
               <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
               <span className="text-xs font-black uppercase italic">Open to projects</span>
             </div>
             <p className="text-[10px] font-bold opacity-90">{subProfile.availability.weekly_hours} hrs/week availability</p>
          </div>
          
          <div className="space-y-4">
            <SidebarStat label="Rate (game)" value={`$${subProfile.availability.rates.game_rate} / word`} />
            <SidebarStat label="Rate (editorial)" value={`$${subProfile.availability.rates.editorial_rate} / word`} />
            <SidebarStat label="Max projects" value={subProfile.availability.max_projects} />
            <SidebarStat label="Genres" value="RPG, roguelike, horror" />
          </div>
        </section>

        {/* Level Artifacts Section */}
        <section className="gzs-profile-card !p-6">
           <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Skill Profile · Genre Artifacts</h3>
           <div className="space-y-6">
             {subProfile.skill_artifacts.map(skill => (
               <div key={skill.name} className="space-y-2">
                 <div className="flex justify-between items-end">
                   <span className="text-xs font-bold text-gray-700">{skill.name}</span>
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{skill.label}</span>
                 </div>
                 <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                   <div 
                    className="h-full bg-[var(--theme-primary)] transition-all duration-1000 ease-out" 
                    style={{ width: `${skill.level}%` }} 
                   />
                 </div>
               </div>
             ))}
           </div>
        </section>

        {/* Published On Section */}
        <section className="gzs-profile-card !p-6">
           <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Published on</h3>
           <div className="space-y-3">
             {subProfile.published_on.map(pub => (
               <div key={pub.platform} className="flex items-center justify-between p-3 rounded-xl bg-[var(--theme-bg-alt)] border border-[var(--theme-border)]">
                 <div className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full" style={{ background: pub.color }} />
                   <span className="text-xs font-bold">{pub.platform}</span>
                 </div>
                 <span className="text-[10px] font-black text-gray-400">{pub.count} posts</span>
               </div>
             ))}
           </div>
        </section>
      </div>
    </div>
  );
}

function SidebarStat({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-emerald-100/50 last:border-0">
      <span className="text-xs font-bold text-emerald-800/60">{label}</span>
      <span className="text-xs font-black text-emerald-900">{value}</span>
    </div>
  );
}

function ComposerAction({ icon, label }) {
  return (
    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--theme-border)] text-gray-400 hover:text-[var(--theme-primary)] hover:border-[var(--theme-primary)]/30 transition-all">
       {icon}
       <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

function PostStat({ icon, count }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-bold">
      {icon}
      <span>{count}</span>
    </div>
  );
}

function FiArrowRight(props) {
  return (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" {...props}>
      <line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  );
}

// ─── GameTitlesEditor (esports header) ──────────────────────────────────────
function GameTitlesEditor({ gameTitles, setGameTitles, gameLibrary, isEditing, domainColor }) {
  const addGame = () => setGameTitles(prev => [...prev, { title: '', username: '', peak_rank: '', region: '', platform: '' }]);
  const removeGame = (i) => setGameTitles(prev => prev.filter((_, idx) => idx !== i));
  const updateGame = (i, key, val) => setGameTitles(prev => prev.map((g, idx) => idx === i ? { ...g, [key]: val } : g));

  const fieldStyle = { width: '100%', padding: '6px 10px', background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: 6, fontSize: 12, color: 'var(--theme-text)', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { fontSize: 10, fontWeight: 700, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', marginBottom: 4, display: 'block' };

  return (
    <GzsCard padding="md">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Game Titles</p>
        {isEditing && (
          <button onClick={addGame} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: `${domainColor}18`, color: domainColor, border: `1px solid ${domainColor}30`, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
            <FiPlus size={12} /> Add Game
          </button>
        )}
      </div>
      {gameTitles.length === 0 && !isEditing && (
        <p style={{ fontSize: 12, color: 'var(--theme-text-subtle)' }}>No games added yet.</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isEditing ? gameTitles.map((game, i) => (
          <div key={i} style={{ padding: 14, background: 'var(--theme-bg-section)', borderRadius: 10, border: '1px solid var(--theme-border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div>
                <label style={labelStyle}>Game Title</label>
                <input list={`game-list-${i}`} value={game.title} onChange={e => updateGame(i, 'title', e.target.value)} placeholder="Search game..." style={fieldStyle} />
                <datalist id={`game-list-${i}`}>
                  {gameLibrary.map(g => <option key={g.id || g.slug} value={g.title || g.name} />)}
                </datalist>
              </div>
              <div>
                <label style={labelStyle}>In-game Username</label>
                <input value={game.username} onChange={e => updateGame(i, 'username', e.target.value)} placeholder="Your in-game ID" style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Peak Rank / MMR</label>
                <input value={game.peak_rank} onChange={e => updateGame(i, 'peak_rank', e.target.value)} placeholder="Radiant, Conqueror, Global Elite..." style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Region / Server</label>
                <select value={game.region} onChange={e => updateGame(i, 'region', e.target.value)} style={fieldStyle}>
                  <option value="">Select region</option>
                  {['Asia', 'Europe', 'NA', 'SA', 'OCE', 'ME', 'Global'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Platform</label>
                <select value={game.platform} onChange={e => updateGame(i, 'platform', e.target.value)} style={fieldStyle}>
                  <option value="">Select platform</option>
                  {['PC', 'PlayStation', 'Xbox', 'Mobile', 'Cross-platform'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <button onClick={() => removeGame(i)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <FiX size={12} /> Remove
            </button>
          </div>
        )) : gameTitles.map((game, i) => (
          <div key={i} style={{ padding: '12px 14px', background: 'var(--theme-bg-section)', borderRadius: 10, border: '1px solid var(--theme-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--theme-text)' }}>{game.title}</p>
              {game.peak_rank && (
                <span style={{ padding: '2px 8px', background: `${domainColor}18`, color: domainColor, border: `1px solid ${domainColor}30`, borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                  {game.peak_rank}
                </span>
              )}
            </div>
            <p style={{ fontSize: 12, color: 'var(--theme-text-subtle)' }}>
              {[game.username, game.region, game.platform].filter(Boolean).join(' · ')}
            </p>
          </div>
        ))}
      </div>
    </GzsCard>
  );
}

// ─── ContentPlatformsEditor (content header) ────────────────────────────────
function ContentPlatformsEditor({ contentPlatforms, setContentPlatforms, isEditing, domainColor }) {
  const PLATFORM_OPTIONS = ['Twitch', 'YouTube', 'TikTok', 'Instagram', 'X/Twitter', 'Facebook Gaming', 'Kick', 'Loco', 'Rooter'];
  const FREQ_OPTIONS = ['Daily', '3-5x per week', 'Weekly', 'Bi-weekly', 'Monthly'];
  const SIZE_OPTIONS = ['<1K', '1K-10K', '10K-100K', '100K-1M', '1M+'];

  const addPlatform = () => setContentPlatforms(prev => [...prev, { platform: '', url: '', followers: '', avg_viewers: '', posting_frequency: '' }]);
  const removePlatform = (i) => setContentPlatforms(prev => prev.filter((_, idx) => idx !== i));
  const updatePlatform = (i, key, val) => setContentPlatforms(prev => prev.map((p, idx) => idx === i ? { ...p, [key]: val } : p));

  const fieldStyle = { width: '100%', padding: '6px 10px', background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: 6, fontSize: 12, color: 'var(--theme-text)', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { fontSize: 10, fontWeight: 700, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', marginBottom: 4, display: 'block' };

  return (
    <GzsCard padding="md">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Content Platforms</p>
        {isEditing && (
          <button onClick={addPlatform} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: `${domainColor}18`, color: domainColor, border: `1px solid ${domainColor}30`, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
            <FiPlus size={12} /> Add Platform
          </button>
        )}
      </div>
      {contentPlatforms.length === 0 && !isEditing && (
        <p style={{ fontSize: 12, color: 'var(--theme-text-subtle)' }}>No platforms added yet.</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isEditing ? contentPlatforms.map((p, i) => (
          <div key={i} style={{ padding: 14, background: 'var(--theme-bg-section)', borderRadius: 10, border: '1px solid var(--theme-border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div>
                <label style={labelStyle}>Platform</label>
                <select value={p.platform} onChange={e => updatePlatform(i, 'platform', e.target.value)} style={fieldStyle}>
                  <option value="">Select</option>
                  {PLATFORM_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Profile URL</label>
                <input value={p.url} onChange={e => updatePlatform(i, 'url', e.target.value)} placeholder="https://..." style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Subscribers / Followers</label>
                <select value={p.followers} onChange={e => updatePlatform(i, 'followers', e.target.value)} style={fieldStyle}>
                  <option value="">Select</option>
                  {SIZE_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Avg Viewership</label>
                <select value={p.avg_viewers} onChange={e => updatePlatform(i, 'avg_viewers', e.target.value)} style={fieldStyle}>
                  <option value="">Select</option>
                  {SIZE_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Posting Frequency</label>
                <select value={p.posting_frequency} onChange={e => updatePlatform(i, 'posting_frequency', e.target.value)} style={fieldStyle}>
                  <option value="">Select</option>
                  {FREQ_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
            <button onClick={() => removePlatform(i)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <FiX size={12} /> Remove
            </button>
          </div>
        )) : contentPlatforms.map((p, i) => (
          <div key={i} style={{ padding: '12px 14px', background: 'var(--theme-bg-section)', borderRadius: 10, border: '1px solid var(--theme-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--theme-text)' }}>{p.platform}</p>
              {p.followers && (
                <span style={{ padding: '2px 8px', background: `${domainColor}18`, color: domainColor, border: `1px solid ${domainColor}30`, borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{p.followers}</span>
              )}
            </div>
            <p style={{ fontSize: 12, color: 'var(--theme-text-subtle)' }}>
              {[p.posting_frequency, p.avg_viewers ? `Avg: ${p.avg_viewers}` : null].filter(Boolean).join(' · ')}
            </p>
          </div>
        ))}
      </div>
    </GzsCard>
  );
}

// ─── BrandCollabsSection (content projects tab) ──────────────────────────────
function BrandCollabsSection({ brandCollabs, setBrandCollabs, isEditing, domainColor }) {
  const COLLAB_TYPES = ['Sponsored video', 'Product review', 'Brand ambassador', 'Affiliate', 'Event appearance', 'Other'];
  const currentYear = new Date().getFullYear();

  const addCollab = () => setBrandCollabs(prev => [...prev, { brand: '', type: '', year: currentYear }]);
  const removeCollab = (i) => setBrandCollabs(prev => prev.filter((_, idx) => idx !== i));
  const updateCollab = (i, key, val) => setBrandCollabs(prev => prev.map((c, idx) => idx === i ? { ...c, [key]: val } : c));

  const fieldStyle = { width: '100%', padding: '5px 8px', background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: 6, fontSize: 12, color: 'var(--theme-text)', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Brand Collaborations</p>
        {isEditing && (
          <button onClick={addCollab} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: `${domainColor}18`, color: domainColor, border: `1px solid ${domainColor}30`, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
            <FiPlus size={12} /> Add Collab
          </button>
        )}
      </div>
      {brandCollabs.length === 0 && !isEditing && (
        <p style={{ fontSize: 12, color: 'var(--theme-text-subtle)' }}>No brand collaborations added yet.</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {isEditing ? brandCollabs.map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', padding: '10px 12px', background: 'var(--theme-bg-section)', borderRadius: 8, border: '1px solid var(--theme-border)' }}>
            <div style={{ flex: 2 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', marginBottom: 4 }}>Brand / Company</p>
              <input value={c.brand} onChange={e => updateCollab(i, 'brand', e.target.value)} placeholder="Company or brand name" style={fieldStyle} />
            </div>
            <div style={{ flex: 2 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', marginBottom: 4 }}>Type</p>
              <select value={c.type} onChange={e => updateCollab(i, 'type', e.target.value)} style={fieldStyle}>
                <option value="">Select</option>
                {COLLAB_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--theme-text-subtle)', textTransform: 'uppercase', marginBottom: 4 }}>Year</p>
              <input type="number" value={c.year} onChange={e => updateCollab(i, 'year', e.target.value)} min={2015} max={currentYear + 1} style={fieldStyle} />
            </div>
            <button onClick={() => removeCollab(i)} style={{ padding: '5px 8px', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
              <FiX size={14} />
            </button>
          </div>
        )) : brandCollabs.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--theme-bg-section)', borderRadius: 8, border: '1px solid var(--theme-border)' }}>
            <FiBriefcase size={14} style={{ color: domainColor, flexShrink: 0 }} />
            <p style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--theme-text)', margin: 0 }}>
              Brand: {c.brand} · Type: {c.type} · {c.year}
            </p>
            <span style={{ padding: '2px 8px', background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: 20, fontSize: 10, color: 'var(--theme-text-subtle)', flexShrink: 0 }}>
              Verified ✓
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
