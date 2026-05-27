import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiAlertCircle,
  FiAward,
  FiBarChart2,
  FiBell,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiCodepen,
  FiDollarSign,
  FiEdit,
  FiFileText,
  FiFlag,
  FiGrid,
  FiImage,
  FiLayers,
  FiLock,
  FiMessageSquare,
  FiMonitor,
  FiPlus,
  FiSettings,
  FiShield,
  FiToggleLeft,
  FiUsers,
} from 'react-icons/fi';
import GzsLogo from '@/shared/components/GzsLogo';
import useAdminAuthStore from '@/store/admin/useAdminAuthStore';
import useAdminBadgeStore from '@/store/admin/useAdminBadgeStore';

const COLLAPSED_KEY = 'gzs_admin_nav_collapsed';

const NAV_SECTIONS = [
  {
    heading: 'Overview',
    items: [{ label: 'Dashboard', to: '/admin', icon: FiGrid, end: true }],
  },
  {
    heading: 'Users & Identity',
    items: [
      { label: 'Users Management', to: '/admin/users', icon: FiUsers },
      { label: 'Companies', to: '/admin/companies', icon: FiBriefcase },
      { label: 'Skill Verifications', to: '/admin/verifications', icon: FiCheckCircle, badge: 'pendingVerifications' },
      { label: 'Admin Roles', to: '/admin/roles', icon: FiShield, superAdminOnly: true },
    ],
  },
  {
    heading: 'Content',
    items: [
      { label: 'Games', to: '/admin/games', icon: FiCodepen },
      { label: 'Add Game', to: '/admin/games/create', icon: FiPlus },
      { label: 'Blogs', to: '/admin/blogs', icon: FiBookOpen },
      { label: 'Write Blog', to: '/admin/blogs/create', icon: FiEdit },
      { label: 'Media Library', to: '/admin/media', icon: FiImage },
    ],
  },
  {
    heading: 'Community',
    items: [
      { label: 'Branches', to: '/admin/community/branches', icon: FiLayers },
      { label: 'Moderation Queue', to: '/admin/community/moderation', icon: FiFlag, badge: 'flaggedCount' },
      { label: 'Events', to: '/admin/community/events', icon: FiCalendar },
      { label: 'Groups', to: '/admin/community/groups', icon: FiUsers },
    ],
  },
  {
    heading: 'Competition',
    items: [
      { label: 'Tournaments', to: '/admin/tournaments', icon: FiAward },
      { label: 'Create Tournament', to: '/admin/tournaments/create', icon: FiPlus },
    ],
  },
  {
    heading: 'Jobs & Hiring',
    items: [
      { label: 'Listings', to: '/admin/jobs/listings', icon: FiBriefcase },
      { label: 'Moderation Queue', to: '/admin/jobs/moderation', icon: FiFlag, badge: 'pendingListings' },
      { label: 'Financial Ledger', to: '/admin/jobs/finance', icon: FiDollarSign },
      { label: 'Disputes', to: '/admin/jobs/disputes', icon: FiAlertCircle, badge: 'openDisputes' },
      { label: 'Contracts', to: '/admin/jobs/contracts', icon: FiFileText },
    ],
  },
  {
    heading: 'Platform',
    items: [
      { label: 'Notifications', to: '/admin/notifications', icon: FiBell },
      { label: 'Platform Config', to: '/admin/settings', icon: FiSettings },
      { label: 'Feature Flags', to: '/admin/feature-flags', icon: FiToggleLeft },
      { label: 'Banners', to: '/admin/announcements', icon: FiMonitor },
    ],
  },
  {
    heading: 'Analytics',
    items: [
      { label: 'Overview', to: '/admin/analytics', icon: FiBarChart2 },
      { label: 'Users', to: '/admin/analytics/users', icon: FiUsers },
      { label: 'Content', to: '/admin/analytics/content', icon: FiFileText },
      { label: 'Revenue', to: '/admin/analytics/revenue', icon: FiDollarSign },
      { label: 'Community', to: '/admin/analytics/community', icon: FiMessageSquare },
    ],
  },
  {
    heading: 'Audit',
    items: [
      { label: 'Audit Logs', to: '/admin/audit', icon: FiShield },
      { label: 'Super Admin Logs', to: '/admin/audit/super', icon: FiLock, superAdminOnly: true },
    ],
  },
];

function loadCollapsed() {
  try {
    return JSON.parse(localStorage.getItem(COLLAPSED_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCollapsed(collapsed) {
  localStorage.setItem(COLLAPSED_KEY, JSON.stringify(collapsed));
}

const AdminSidebar = () => {
  const { user } = useAdminAuthStore();
  const { pendingVerifications, flaggedCount, pendingListings, openDisputes, fetchBadges } =
    useAdminBadgeStore();
  const badges = { pendingVerifications, flaggedCount, pendingListings, openDisputes };

  const [collapsedSections, setCollapsedSections] = useState(() => loadCollapsed());
  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    fetchBadges();
    const id = setInterval(fetchBadges, 60_000);
    return () => clearInterval(id);
  }, [fetchBadges]);

  const toggleSection = (heading) => {
    setCollapsedSections((prev) => {
      const next = prev.includes(heading)
        ? prev.filter((h) => h !== heading)
        : [...prev, heading];
      saveCollapsed(next);
      return next;
    });
  };

  return (
    <aside className="admin-sidebar">
      <div className="mb-6 flex items-center gap-3 px-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
          <GzsLogo variant="light" size={26} showText={false} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-white">Admin Panel</p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">GzoneSphere</p>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto pr-1">
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter(
            (item) => !item.superAdminOnly || isSuperAdmin
          );
          if (visibleItems.length === 0) return null;

          const isCollapsed = collapsedSections.includes(section.heading);

          return (
            <div key={section.heading}>
              <button
                type="button"
                onClick={() => toggleSection(section.heading)}
                className="flex w-full items-center justify-between px-3 pb-2 text-left"
              >
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  {section.heading}
                </span>
                <FiChevronDown
                  size={12}
                  className={`text-slate-500 transition-transform duration-200 ${
                    isCollapsed ? '' : 'rotate-180'
                  }`}
                />
              </button>
              <div
                className={`space-y-1 overflow-hidden transition-all duration-200 ${
                  isCollapsed ? 'max-h-0' : 'max-h-[600px]'
                }`}
              >
                {visibleItems.map(({ label, to, icon: Icon, end, badge }) => {
                  const count = badge ? (badges[badge] ?? 0) : 0;
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        `admin-nav-link ${isActive ? 'active' : ''}`
                      }
                    >
                      <Icon size={16} />
                      <span className="truncate">{label}</span>
                      {count > 0 && (
                        <span className="ml-auto min-w-[18px] rounded-full bg-[var(--status-error)] px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                          {count}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default AdminSidebar;
