import { Outlet, useLocation, useParams, NavLink } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';
import { FiMenu, FiX, FiCode, FiAward, FiVideo, FiBriefcase, FiEdit3, FiFeather, FiMusic, FiGlobe, FiBookOpen, FiBell, FiUserCheck, FiPlus } from 'react-icons/fi';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import BranchNavSidebar from '../components/BranchNavSidebar';
import ChannelSidebar from '../components/ChannelSidebar';
import OnlineUsers from '../components/Chat/OnlineUsers';
import { COMMUNITY_BRANCHES, MOCK_CHAT_MESSAGES, MOCK_ONLINE_USERS_BY_BRANCH } from '@/shared/data/communityData';
import communityService from '@/services/features/communityService';
import core from '@/services/api/core';
import { useToast } from '@/shared/components/Toast';

const BRANCH_ORDER = ['dev', 'esports', 'content', 'business', 'art', 'writing', 'audio', 'general', 'newcomers'];

const BRANCH_META = {
  dev:       { label: 'Game Creation',    icon: FiCode,       color: '#14B8A6' },
  esports:   { label: 'Esports',          icon: FiAward,      color: '#EF4444' },
  content:   { label: 'Content',          icon: FiVideo,      color: '#F59E0B' },
  business:  { label: 'Business',         icon: FiBriefcase,  color: '#3B82F6' },
  art:       { label: 'Art',              icon: FiEdit3,      color: '#EC4899' },
  writing:   { label: 'Writing',          icon: FiFeather,    color: '#22C55E' },
  audio:     { label: 'Audio',            icon: FiMusic,      color: '#64748B' },
  general:   { label: 'General',          icon: FiGlobe,      color: '#6366F1' },
  newcomers: { label: 'Newcomers',        icon: FiBookOpen,   color: '#0EA5E9' },
};

const BRANCH_TABS = ['Channels', 'Groups', 'LFG', 'Showcase', 'Events', 'Members'];

export default function CommunityLayout() {
  usePageTheme('community');
  const { showToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { slug } = useParams();
  const location = useLocation();

  const [joinedBranches, setJoinedBranches] = useState(new Set());
  const [notifBranches, setNotifBranches] = useState(new Set());
  const [joinPending, setJoinPending] = useState(false);

  useEffect(() => {
    core.get('/community/branches/enrolled')
      .then(r => {
        const slugs = (r.data?.data || r.data || []).map(b => b.slug || b);
        setJoinedBranches(new Set(slugs));
      })
      .catch(() => {});
  }, []);

  const branches = useMemo(
    () => BRANCH_ORDER.map((s) => COMMUNITY_BRANCHES.find((b) => b.slug === s)).filter(Boolean),
    [],
  );

  const activeBranch = branches.find((b) => b.slug === slug) || branches[0];
  const branchSlug = activeBranch?.slug || slug;
  const meta = BRANCH_META[branchSlug] || BRANCH_META.general;
  const Icon = meta.icon;

  const onlineUsers = useMemo(
    () => MOCK_ONLINE_USERS_BY_BRANCH[branchSlug || 'general'] || MOCK_ONLINE_USERS_BY_BRANCH.general || [],
    [branchSlug],
  );
  const pinnedMessages = useMemo(() => MOCK_CHAT_MESSAGES.slice(-3).reverse(), []);
  const rulesText = `1. Respect all members.\n2. Keep discussions in the right channel.\n3. No spam, hate, or harassment.\n4. Use @mentions responsibly.`;
  const showChannelSidebar = !location.pathname.endsWith(`/${slug}`);
  const onlineCount = Math.max(12, Math.round((activeBranch?.member_count || 1000) * 0.08));

  const handleJoin = async () => {
    const willJoin = !joinedBranches.has(branchSlug);
    setJoinedBranches(prev => {
      const s = new Set(prev);
      willJoin ? s.add(branchSlug) : s.delete(branchSlug);
      return s;
    });
    setJoinPending(true);
    try {
      if (willJoin) {
        await communityService.joinBranch(branchSlug);
      } else {
        await communityService.leaveBranch(branchSlug);
      }
    } catch {
      setJoinedBranches(prev => {
        const s = new Set(prev);
        willJoin ? s.delete(branchSlug) : s.add(branchSlug);
        return s;
      });
      showToast({ type: 'error', message: 'Could not update membership.' });
    } finally {
      setJoinPending(false);
    }
  };

  const handleNotif = async () => {
    const willEnable = !notifBranches.has(branchSlug);
    setNotifBranches(prev => {
      const s = new Set(prev);
      willEnable ? s.add(branchSlug) : s.delete(branchSlug);
      return s;
    });
    try {
      if (willEnable) {
        await core.post(`/community/branches/${branchSlug}/notifications`);
      } else {
        await core.delete(`/community/branches/${branchSlug}/notifications`);
      }
      showToast({ type: 'success', message: willEnable ? 'Notifications enabled.' : 'Notifications muted.' });
    } catch {
      setNotifBranches(prev => {
        const s = new Set(prev);
        willEnable ? s.delete(branchSlug) : s.add(branchSlug);
        return s;
      });
      showToast({ type: 'error', message: 'Could not update notifications.' });
    }
  };

  const tabPath = (tab) => {
    const tabSlug = tab.toLowerCase();
    if (tabSlug === 'channels') return `/community/${slug}`;
    return `/community/${slug}/${tabSlug}`;
  };

  return (
    <div className="min-h-screen" style={{ background: '#F1F5F9' }}>
      {/* Mobile Branch Nav Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[110] lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative h-full w-[280px] shadow-2xl animate-in slide-in-from-left duration-300" style={{ background: '#fff' }}>
            <button
              className="absolute top-4 right-[-3rem] flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <FiX size={24} />
            </button>
            <BranchNavSidebar branches={branches} activeSlug={activeBranch?.slug} onItemClick={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-h-screen relative">
        {/* Desktop Branch Nav */}
        <div className="hidden lg:block">
          <BranchNavSidebar branches={branches} activeSlug={activeBranch?.slug} />
        </div>

        <div className="flex min-h-screen flex-1 flex-col lg:pl-[240px]">
          {/* Branch header */}
          <div
            className="branch-view-header px-8 pt-6 pb-0"
            style={{ borderTop: `6px solid ${meta.color}`, background: `linear-gradient(180deg, ${meta.color}10, transparent)` }}
          >
            {/* Breadcrumb */}
            <p className="text-xs mb-3" style={{ color: '#94A3B8' }}>
              <span>Community</span>
              <span className="mx-1.5" style={{ color: '#CBD5E1' }}>›</span>
              <span className="font-semibold" style={{ color: meta.color }}>{meta.label}</span>
            </p>

            <div className="flex items-center gap-4 mb-4">
              <div
                className="flex items-center justify-center rounded-2xl flex-shrink-0"
                style={{ width: 64, height: 64, background: `${meta.color}1A`, color: meta.color }}
              >
                <Icon size={32} />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#0F172A', letterSpacing: '-0.02em' }}>
                  {activeBranch?.name || meta.label}
                </h1>
                <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>
                  {(activeBranch?.member_count || 0).toLocaleString()} members · {onlineCount} online
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={handleNotif}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition"
                  style={notifBranches.has(branchSlug)
                    ? { background: `${meta.color}15`, border: `1px solid ${meta.color}`, color: meta.color }
                    : { background: '#fff', border: '1px solid #E2E8F0', color: '#475569' }}
                >
                  <FiBell size={14} /> Notifs
                </button>
                <button
                  onClick={handleJoin}
                  disabled={joinPending}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-60"
                  style={joinedBranches.has(branchSlug)
                    ? { background: '#F0FDF4', border: '1px solid #86EFAC', color: '#16A34A' }
                    : { background: meta.color, border: `1px solid ${meta.color}`, color: '#fff' }}
                >
                  <FiUserCheck size={14} /> {joinedBranches.has(branchSlug) ? 'Joined' : 'Join'}
                </button>
                <button
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ background: meta.color }}
                >
                  <FiPlus size={14} /> New post
                </button>
              </div>
            </div>

            {/* Branch tabs */}
            <div className="flex gap-0" style={{ borderBottom: 'none' }}>
              {BRANCH_TABS.map((tab) => (
                <NavLink
                  key={tab}
                  to={tabPath(tab)}
                  end={tab === 'Channels'}
                  className="px-[18px] py-2.5 text-[13px] font-semibold transition"
                  style={({ isActive }) => ({
                    color: isActive ? meta.color : '#64748B',
                    borderBottom: isActive ? `2px solid ${meta.color}` : '2px solid transparent',
                    textDecoration: 'none',
                  })}
                >
                  {tab}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Content row */}
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {showChannelSidebar && (
              <div className="hidden md:block w-[220px] shrink-0 overflow-y-auto" style={{ borderRight: '1px solid #E2E8F0', height: '100%' }}>
                <ChannelSidebar branch={activeBranch} />
              </div>
            )}

            <main className="min-w-0 flex-1 overflow-y-auto relative" style={{ background: '#fff' }}>
              {/* Mobile Hamburger Toggle */}
              <button
                className="fixed bottom-20 right-6 z-[90] flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg lg:hidden"
                style={{ background: meta.color }}
                onClick={() => setMobileMenuOpen(true)}
              >
                <FiMenu size={24} />
              </button>
              <Outlet />
            </main>

            <aside className="hidden w-[280px] shrink-0 xl:block overflow-y-auto overflow-x-hidden" style={{ borderLeft: '1px solid #E2E8F0', background: '#FAFBFC', height: 'calc(100dvh - 64px)', position: 'sticky', top: 64 }}>
              <OnlineUsers users={onlineUsers} pinnedMessages={pinnedMessages} rulesText={rulesText} />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
