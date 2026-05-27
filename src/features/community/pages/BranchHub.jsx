import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiCalendar, FiHash, FiMic, FiUsers, FiVolume2 } from 'react-icons/fi';
import { FaCrown } from 'react-icons/fa6';
import { IoMdPulse } from 'react-icons/io';
import { Helmet } from 'react-helmet-async';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import { useToast } from '@/shared/components/Toast';
import { BRANCH_TAGLINES, MOCK_PINNED_ANNOUNCEMENTS } from '@/shared/data/communityData';
import { useBranch, useBranchChannels, useEvents, useShowcaseFeed } from '@/services/mutators/useCommunity';
import communityService from '@/services/features/communityService';
import core from '@/services/api/core';

const BRANCH_ORDER = ['dev', 'esports', 'content', 'business', 'art', 'writing', 'audio', 'general', 'newcomers'];
const MODULE_TABS = ['Channels', 'Groups', 'LFG', 'Showcase', 'Events'];

const BRANCH_DISPLAY = {
  dev:       { label: 'Game Creation & Development', accent: 'var(--domain-dev)' },
  esports:   { label: 'Esports & Competitive',       accent: 'var(--domain-esports)' },
  content:   { label: 'Content & Media',             accent: 'var(--domain-content)' },
  business:  { label: 'Business & Strategy',         accent: 'var(--domain-business)' },
  art:       { label: 'Art & Design',                accent: 'var(--domain-art)' },
  writing:   { label: 'Writing & Narrative',         accent: 'var(--domain-writing)' },
  audio:     { label: 'Audio & Sound',               accent: 'var(--domain-audio)' },
  general:   { label: 'General Community',           accent: 'var(--theme-text-muted)' },
  newcomers: { label: 'Newcomers & Help',            accent: 'var(--status-success)' },
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

const deterministicCount = (seed) => {
  const text = String(seed || '');
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 9973;
  }
  return (hash % 22) + 1;
};

export default function BranchHub({ slug }) {
  usePageTheme('community');
  const { showToast } = useToast();
  const { branch: routeBranch } = useParams();
  const activeSlug = slug || routeBranch || 'general';

  const branchDisplay = BRANCH_DISPLAY[activeSlug] || BRANCH_DISPLAY.general;
  const branchTagline = BRANCH_TAGLINES?.[activeSlug] || BRANCH_TAGLINES?.general || '';

  // Live API data
  const { data: branchData } = useBranch(activeSlug);
  const { data: channelsRaw } = useBranchChannels(activeSlug);
  const { data: eventsRaw } = useEvents(activeSlug);
  const { data: showcaseRaw } = useShowcaseFeed(activeSlug);
  const { data: contributorsRaw = [] } = useQuery({
    queryKey: ['community', 'top-contributors', activeSlug],
    queryFn: () => core.get(`/community/branches/${activeSlug}/top-contributors`).then(r => r.data?.data || r.data || []),
    enabled: !!activeSlug,
  });

  const channels = useMemo(
    () => (Array.isArray(channelsRaw) ? channelsRaw : channelsRaw?.data || []).slice(0, 6),
    [channelsRaw],
  );
  const events = useMemo(
    () => (Array.isArray(eventsRaw) ? eventsRaw : eventsRaw?.data || []).slice(0, 3),
    [eventsRaw],
  );
  const showcasePosts = useMemo(
    () => (Array.isArray(showcaseRaw) ? showcaseRaw : showcaseRaw?.data || []).slice(0, 4),
    [showcaseRaw],
  );
  const contributors = useMemo(
    () => (Array.isArray(contributorsRaw) ? contributorsRaw : []).slice(0, 3),
    [contributorsRaw],
  );

  const pinnedAnnouncements = (MOCK_PINNED_ANNOUNCEMENTS?.[activeSlug] || []).slice(0, 3);

  const liveStats = useMemo(() => ({
    totalMembers:   branchData?.member_count   ?? branchData?.totalMembers   ?? 0,
    postsThisWeek:  branchData?.posts_this_week ?? branchData?.postsThisWeek  ?? 0,
    activeGroups:   branchData?.active_groups   ?? branchData?.activeGroups   ?? 0,
    upcomingEvents: branchData?.upcoming_events ?? branchData?.upcomingEvents ?? events.length,
  }), [branchData, events.length]);

  const activityCounts = useMemo(() => ({
    Channels: channels.length,
    Groups:   branchData?.active_groups   || branchData?.activeGroups || 0,
    LFG:      branchData?.lfg_count       || 0,
    Showcase: showcasePosts.length,
    Events:   events.length,
  }), [channels, branchData, showcasePosts, events]);

  // Enrolled state
  const [enrolled, setEnrolled] = useState(false);
  const [enrollPending, setEnrollPending] = useState(false);

  useEffect(() => {
    core.get('/community/branches/enrolled')
      .then(r => {
        const slugs = (r.data?.data || r.data || []).map(b => b.slug || b);
        setEnrolled(slugs.includes(activeSlug));
      })
      .catch(() => {});
  }, [activeSlug]);

  const handleEnroll = async () => {
    const willJoin = !enrolled;
    setEnrolled(willJoin);
    setEnrollPending(true);
    try {
      if (willJoin) {
        await communityService.joinBranch(activeSlug);
      } else {
        await communityService.leaveBranch(activeSlug);
      }
      showToast({ type: 'success', message: willJoin ? 'Joined branch!' : 'Left branch.' });
    } catch {
      setEnrolled(!willJoin);
      showToast({ type: 'error', message: 'Could not update membership.' });
    } finally {
      setEnrollPending(false);
    }
  };

  // RSVP state
  const [rsvpSet, setRsvpSet] = useState(new Set());
  const [rsvpPending, setRsvpPending] = useState(null);

  const handleRsvp = async (event) => {
    const eventId = event.id;
    const willRsvp = !rsvpSet.has(eventId);
    setRsvpSet(prev => {
      const s = new Set(prev);
      willRsvp ? s.add(eventId) : s.delete(eventId);
      return s;
    });
    setRsvpPending(eventId);
    try {
      if (willRsvp) {
        await core.post(`/community/${activeSlug}/events/${eventId}/rsvp`);
      } else {
        await core.delete(`/community/${activeSlug}/events/${eventId}/rsvp`);
      }
      showToast({ type: 'success', message: willRsvp ? 'RSVP confirmed!' : 'RSVP cancelled.' });
    } catch {
      setRsvpSet(prev => {
        const s = new Set(prev);
        willRsvp ? s.delete(eventId) : s.add(eventId);
        return s;
      });
      showToast({ type: 'error', message: 'Could not update RSVP.' });
    } finally {
      setRsvpPending(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] pb-12 selection:bg-[var(--theme-primary)]/30">
      <Helmet>
        <title>{branchData?.name || branchDisplay.label} | GzoneSphere Hub</title>
        <meta name="description" content={`Welcome to the ${branchData?.name || branchDisplay.label} branch on GzoneSphere. Engage with specific gaming communities, access localized events, and build your reputation here.`} />
        <meta property="og:title" content={`${branchData?.name || branchDisplay.label} | GzoneSphere Hub`} />
        <meta property="og:description" content={`Official hub for the ${branchData?.name || branchDisplay.label} community on GzoneSphere. Connect, collaborate, and compete.`} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      <div className="branch-hub-layout">
        <aside className="branch-hub-left-panel">
          <section className="mb-6">
            <p className="branch-section-title">Branches</p>
            <div className="branch-channel-list">
              {BRANCH_ORDER.map((item) => {
                const branchMeta = BRANCH_DISPLAY[item] || BRANCH_DISPLAY.general;
                const isCurrent = item === activeSlug;
                return (
                  <Link
                    key={item}
                    to={`/community/${item}`}
                    className={`branch-channel-item ${isCurrent ? 'is-active' : ''}`}
                  >
                    <span className="flex-1">{branchMeta.label}</span>
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: branchMeta.accent }} />
                  </Link>
                );
              })}
            </div>
          </section>
          <section>
            <p className="branch-section-title">Channels</p>
            <div className="branch-channel-list">
              {channels.length ? (
                channels.map((channel) => (
                  <Link
                    key={channel.id}
                    to={`/community/${activeSlug}/room/${channel.slug}`}
                    className="branch-channel-item"
                  >
                    <FiHash className="text-[var(--theme-text-subtle)]" />
                    <span className="flex-1">{channel.name}</span>
                    <span className="text-xs text-[var(--theme-text-subtle)] opacity-60">{deterministicCount(channel.id)}</span>
                  </Link>
                ))
              ) : (
                <p className="px-3 text-xs text-[var(--theme-text-subtle)]">No channels yet.</p>
              )}
            </div>
          </section>
        </aside>

        <main className="branch-hub-main">
          <header className="branch-hub-header">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="branch-hub-label" style={{ color: branchDisplay.accent }}>
                  {activeSlug}
                </p>
                <h1 className="branch-hub-title">{branchDisplay.label}</h1>
                <p className="branch-hub-description">{branchTagline}</p>
                <div className="flex items-center gap-2 text-sm text-[var(--theme-text-muted)]">
                  <FiUsers />
                  <span className="font-bold text-[var(--theme-text)]">{liveStats.totalMembers.toLocaleString()}</span>
                  <span>members online</span>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                {enrolled ? (
                  <>
                    <span className="branch-enroll-btn branch-enroll-btn--enrolled">Enrolled</span>
                    <button
                      onClick={handleEnroll}
                      disabled={enrollPending}
                      className="text-sm font-semibold text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] transition underline underline-offset-4 disabled:opacity-60"
                    >
                      Opt-out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrollPending}
                    className="branch-enroll-btn branch-enroll-btn--unenrolled disabled:opacity-60"
                    style={{ background: branchDisplay.accent, color: 'white', border: 'none' }}
                  >
                    Join Branch
                  </button>
                )}
              </div>
            </div>
          </header>

          <div className="branch-module-tabs">
            {MODULE_TABS.map((tab, idx) => (
              <button
                key={tab}
                className={`branch-module-tab ${idx === 0 ? 'is-active' : ''}`}
              >
                {tab} ({activityCounts[tab]})
              </button>
            ))}
          </div>

          {pinnedAnnouncements.length > 0 && (
            <section className="mb-8">
              <h2 className="branch-section-title">Pinned Announcements</h2>
              <div className="mt-4 space-y-4">
                {pinnedAnnouncements.map((item) => (
                  <article key={item.id} className="branch-pinned-card">
                    <div className="branch-pinned-badge">
                      <FiMic style={{ color: branchDisplay.accent }} />
                      Pinned Message
                    </div>
                    <h3 className="text-sm font-bold text-[var(--theme-text)]">{item.title}</h3>
                    <p className="mt-2 text-sm text-[var(--theme-text-muted)] line-clamp-2">{item.description}</p>
                    <p className="mt-3 text-[10px] text-[var(--theme-text-subtle)] uppercase font-bold tracking-wider">
                      @{item.by} · {formatDate(item.date)}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {contributors.length > 0 && (
            <section className="rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-6">
              <h2 className="text-lg font-semibold text-[var(--theme-text)]">Top Contributors This Week</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {contributors.map((contributor, idx) => (
                  <article key={contributor.id} className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)]/70 p-4">
                    <div className="flex items-center justify-between">
                      <img src={contributor.avatar_url} alt={contributor.username} className="h-10 w-10 rounded-full border border-[var(--theme-border-strong)]" />
                      {idx === 0 ? <FaCrown className="text-amber-400" /> : null}
                    </div>
                    <p className="mt-3 text-sm font-semibold text-[var(--theme-text)]">@{contributor.username}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[var(--theme-bg-alt)] px-2 py-0.5 text-xs text-[var(--theme-text-muted)]">
                        {contributor.domain_badge || contributor.domainBadge}
                      </span>
                      <span className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: `${branchDisplay.accent}25`, color: branchDisplay.accent }}>
                        {contributor.top_skill || contributor.topSkill}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-[var(--theme-text-subtle)]">{contributor.contributions} contributions</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {showcasePosts.length > 0 && (
            <section className="rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--theme-text)]">Showcase Preview</h2>
                <Link to={`/community/${activeSlug}/showcase`} className="text-sm font-medium text-[var(--theme-text-muted)] underline underline-offset-4 hover:text-[var(--theme-text)]">
                  View all showcases
                </Link>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2" style={{ overflow: 'hidden' }}>
                {showcasePosts.map((post) => (
                  <article key={post.id} className="overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)]/70">
                    <img src={post.image || post.image_url} alt={post.title} className="h-32 w-full object-cover" />
                    <p className="px-3 py-2 text-sm text-[var(--theme-text)]">{post.title}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {events.length > 0 && (
            <section className="rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-6">
              <h2 className="text-lg font-semibold text-[var(--theme-text)]">Active Events</h2>
              <div className="mt-4 space-y-3">
                {events.map((event) => (
                  <article key={event.id} className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)]/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--theme-text)]">{event.name || event.title}</p>
                        <p className="mt-1 text-xs text-[var(--theme-text-subtle)]">
                          {formatDate(event.date || event.starts_at)} · host @{event.host || event.host_username} · {event.rsvpCount ?? event.rsvp_count ?? 0} RSVP
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${event.status === 'LIVE' ? 'bg-red-500/20 text-red-400' : 'bg-slate-100 text-[var(--theme-text-muted)]'}`}>
                          {event.status === 'LIVE' ? <IoMdPulse className="animate-pulse" /> : <FiMic />}
                          {event.status}
                        </span>
                        <button
                          onClick={() => handleRsvp(event)}
                          disabled={rsvpPending === event.id}
                          className="rounded-full border px-3 py-1 text-xs font-semibold transition disabled:opacity-60"
                          style={rsvpSet.has(event.id)
                            ? { borderColor: branchDisplay.accent, color: branchDisplay.accent, background: `${branchDisplay.accent}15` }
                            : { borderColor: '#CBD5E1', color: '#475569', background: '#fff' }}
                        >
                          {rsvpSet.has(event.id) ? 'RSVPd' : 'RSVP'}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Total members',   value: liveStats.totalMembers.toLocaleString(),   icon: FiUsers },
                { label: 'Posts this week', value: liveStats.postsThisWeek.toLocaleString(),  icon: FiHash },
                { label: 'Active groups',   value: liveStats.activeGroups.toLocaleString(),   icon: FiVolume2 },
                { label: 'Upcoming events', value: liveStats.upcomingEvents.toLocaleString(), icon: FiCalendar },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)]/60 p-3">
                    <div className="flex items-center gap-2 text-[var(--theme-text-subtle)]">
                      <Icon />
                      <span className="text-xs uppercase tracking-[0.1em]">{item.label}</span>
                    </div>
                    <p className="mt-2 text-xl font-semibold text-[var(--theme-text)]">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </main>

        <aside className="branch-hub-right-panel">
          <section>
            <h2 className="branch-section-title">Active Members</h2>
            <div className="space-y-1">
              {contributors.map((member) => (
                <div key={`active-${member.id}`} className="branch-member-item">
                  <img src={member.avatar_url} alt={member.username} className="branch-member-avatar" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[var(--theme-text)] truncate">@{member.username}</p>
                    <p className="text-[10px] text-[var(--theme-text-muted)] truncate">{member.top_skill || member.topSkill}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {pinnedAnnouncements.length > 0 && (
            <section>
              <h2 className="branch-section-title">Pinned Quick List</h2>
              <div className="space-y-3">
                {pinnedAnnouncements.map((item) => (
                  <div key={`quick-${item.id}`} className="group cursor-pointer">
                    <p className="text-xs font-semibold text-[var(--theme-text)] group-hover:text-[var(--theme-primary)] transition">{item.title}</p>
                    <p className="mt-1 text-[10px] text-[var(--theme-text-subtle)]">{formatDate(item.date)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mt-auto">
            <div className="rounded-xl bg-[var(--theme-bg)] p-4 border border-[var(--theme-border)]">
              <p className="text-[10px] font-bold text-[var(--theme-text-subtle)] uppercase mb-2">Branch Stats</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--theme-text-muted)]">Members</span>
                  <span className="font-bold text-[var(--theme-text)]">{liveStats.totalMembers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--theme-text-muted)]">Active Groups</span>
                  <span className="font-bold text-[var(--theme-text)]">{liveStats.activeGroups}</span>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
