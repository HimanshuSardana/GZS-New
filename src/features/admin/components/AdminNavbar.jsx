import { Link } from 'react-router-dom';
import { FiBell, FiChevronDown, FiChevronRight, FiSearch } from 'react-icons/fi';
import useAdminAuthStore from '@/store/admin/useAdminAuthStore';

const ROLE_PILL_CLASS = {
  user: 'bg-slate-500/20 text-slate-300',
  moderator: 'bg-blue-500/20 text-blue-400',
  admin: 'bg-amber-500/20 text-amber-400',
  super_admin: 'bg-rose-500/20 text-rose-400',
  analytics_viewer: 'bg-violet-500/20 text-violet-400',
};

const ROLE_LABELS = {
  user: 'User',
  moderator: 'Moderator',
  admin: 'Admin',
  super_admin: 'Super Admin',
  analytics_viewer: 'Analytics Viewer',
};

const SEG_LABELS = {
  games: 'Games',
  blogs: 'Blogs',
  tournaments: 'Tournaments',
  users: 'Users',
  companies: 'Companies',
  verifications: 'Verifications',
  verification: 'Verifications',
  roles: 'Roles',
  community: 'Community',
  branches: 'Branches',
  moderation: 'Moderation',
  events: 'Events',
  groups: 'Groups',
  jobs: 'Jobs',
  listings: 'Listings',
  finance: 'Financial Ledger',
  disputes: 'Disputes',
  contracts: 'Contracts',
  analytics: 'Analytics',
  content: 'Content',
  revenue: 'Revenue',
  audit: 'Audit',
  super: 'Super Admin Logs',
  media: 'Media Library',
  settings: 'Settings',
  notifications: 'Notifications',
  announcements: 'Banners',
  'feature-flags': 'Feature Flags',
  create: 'Create',
  edit: 'Edit',
  brackets: 'Brackets',
  results: 'Results',
  registrations: 'Registrations',
  featured: 'Featured Content',
  'hub-settings': 'Hub Settings',
  profile: 'Profile',
};

const ID_LABELS = {
  games: 'Game Detail',
  blogs: 'Blog Detail',
  tournaments: 'Tournament Detail',
  users: 'User Detail',
};

const isIdSegment = (s) =>
  /^[a-f0-9]{8}-[a-f0-9]{4}/.test(s) || /^[A-Za-z0-9_-]{8,}$/.test(s);

function resolveBreadcrumb(pathname) {
  if (pathname === '/admin') {
    return [{ label: 'Dashboard', to: null }];
  }

  const crumbs = [{ label: 'Dashboard', to: '/admin' }];
  const inner = pathname.replace(/^\/admin\/?/, '');
  if (!inner) return crumbs;

  const parts = inner.split('/');
  let builtPath = '/admin';
  let prevSeg = null;

  for (let i = 0; i < parts.length; i++) {
    const seg = parts[i];
    builtPath += `/${seg}`;
    const isLast = i === parts.length - 1;

    let label;
    if (isIdSegment(seg) && prevSeg) {
      label = ID_LABELS[prevSeg] || 'Detail';
    } else {
      label = SEG_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);
    }

    crumbs.push({ label, to: isLast ? null : builtPath });
    prevSeg = seg;
  }

  return crumbs;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const shortcutHint = isMac ? '⌘K' : 'Ctrl+K';

const AdminNavbar = ({ pathname }) => {
  const { user } = useAdminAuthStore();
  const role = user?.role || 'user';
  const pillClass = ROLE_PILL_CLASS[role] || ROLE_PILL_CLASS.user;
  const roleLabel = ROLE_LABELS[role] || 'User';
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'AD';
  const breadcrumbs = resolveBreadcrumb(pathname);

  return (
    <header className="admin-navbar">
      <nav aria-label="breadcrumb" className="flex min-w-0 items-center gap-1">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && (
              <FiChevronRight size={12} className="flex-shrink-0 text-slate-500" />
            )}
            {crumb.to ? (
              <Link
                to={crumb.to}
                className="max-w-[120px] truncate text-sm text-slate-400 transition-colors hover:text-slate-200"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="max-w-[160px] truncate text-sm font-semibold text-slate-100">
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      {/* centre slot — keeps 3-column grid balanced */}
      <div />

      <div className="admin-navbar-actions">
        <button
          type="button"
          className="hidden h-9 items-center gap-2 rounded-full border border-slate-600 bg-slate-700/60 px-3 text-xs font-semibold text-slate-100 md:inline-flex"
          aria-label={`Quick search (${shortcutHint})`}
          onClick={() => window.dispatchEvent(new CustomEvent('admin:open-search'))}
        >
          <FiSearch size={14} />
          Search
          <kbd className="ml-1 rounded border border-slate-500 px-1 py-0.5 text-[10px] font-mono text-slate-400">
            {shortcutHint}
          </kbd>
        </button>
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-600 bg-slate-700/60 text-slate-100"
          aria-label="Notifications"
        >
          <FiBell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-400" />
        </button>
        <Link
          to="/admin/profile"
          className="flex items-center gap-2 rounded-full border border-slate-600 bg-slate-700/60 px-2 py-1 text-left text-slate-100"
          aria-label="Admin account"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
            {initials}
          </span>
          <span className="hidden md:block">
            <span className="block text-xs font-semibold leading-tight">
              {user?.username || 'Admin'}
            </span>
            <span
              className={`mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${pillClass}`}
            >
              {roleLabel}
            </span>
          </span>
          <FiChevronDown size={14} className="hidden text-slate-300 md:block" />
        </Link>
      </div>
    </header>
  );
};

export default AdminNavbar;
