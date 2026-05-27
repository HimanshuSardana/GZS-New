import { NavLink } from 'react-router-dom';
import { FiLock } from 'react-icons/fi';
import useAdminAuthStore from '@/store/admin/useAdminAuthStore';

const ANALYTICS_TABS = [
  { label: 'Overview',  to: '/admin/analytics' },
  { label: 'Users',     to: '/admin/analytics/users' },
  { label: 'Content',   to: '/admin/analytics/content' },
  { label: 'Revenue',   to: '/admin/analytics/revenue', adminOnly: true },
  { label: 'Community', to: '/admin/analytics/community' },
];

export default function AnalyticsSubNav() {
  const { user } = useAdminAuthStore();
  const isViewer = user?.role === 'analytics_viewer';

  return (
    <div className="flex flex-wrap gap-1 mb-8 p-1 bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-2xl w-fit">
      {ANALYTICS_TABS.map(tab => {
        const locked = tab.adminOnly && isViewer;

        if (locked) {
          return (
            <span
              key={tab.to}
              title="Revenue analytics requires Admin access"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-[var(--theme-text-muted)] opacity-30 cursor-not-allowed select-none"
            >
              <FiLock size={11} />
              {tab.label}
            </span>
          );
        }

        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/admin/analytics'}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-[var(--theme-primary)]/15 text-[var(--theme-primary)] border border-[var(--theme-primary)]/30'
                  : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-bg-alt)]/50'
              }`
            }
          >
            {tab.label}
          </NavLink>
        );
      })}
    </div>
  );
}
