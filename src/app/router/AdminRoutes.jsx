import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, useLocation } from 'react-router-dom';
import AdminAuthGuard from '@/features/admin/components/AdminAuthGuard';
import AdminLayout from '@/features/admin/components/AdminLayout';
import ErrorBoundary from '@/shared/components/ErrorBoundary';

// ── Core pages ────────────────────────────────────────────────────────────────
const Dashboard               = lazy(() => import('@/features/admin/pages/Dashboard'));
const GamesManagement         = lazy(() => import('@/features/admin/pages/GamesManagement'));
const GameCreate              = lazy(() => import('@/features/admin/pages/GameCreate'));
const GameEdit                = lazy(() => import('@/features/admin/pages/GameEdit'));
const GamesHubSettings        = lazy(() => import('@/features/admin/pages/GamesHubSettings'));
const TournamentsManagement   = lazy(() => import('@/features/admin/pages/TournamentsManagement'));
const TournamentCreate        = lazy(() => import('@/features/admin/pages/TournamentCreate'));
const TournamentEdit          = lazy(() => import('@/features/admin/pages/TournamentEdit'));
const TournamentBrackets      = lazy(() => import('@/features/admin/pages/TournamentBrackets'));
const TournamentResults       = lazy(() => import('@/features/admin/pages/TournamentResults'));
const TournamentRegistrations = lazy(() => import('@/features/admin/pages/TournamentRegistrations'));
const TournamentAnalytics     = lazy(() => import('@/features/admin/pages/TournamentAnalytics'));
const BlogsManagement         = lazy(() => import('@/features/admin/pages/BlogsManagement'));
const BlogCreate              = lazy(() => import('@/features/admin/pages/BlogCreate'));
const BlogEdit                = lazy(() => import('@/features/admin/pages/BlogEdit'));
const BlogFeaturedContent     = lazy(() => import('@/features/admin/pages/BlogFeaturedContent'));
const UsersManagement         = lazy(() => import('@/features/admin/pages/UsersManagement'));
const UserDetail              = lazy(() => import('@/features/admin/pages/UserDetail'));
const VerificationQueue       = lazy(() => import('@/features/admin/pages/VerificationQueue'));
const CompanyManagement       = lazy(() => import('@/features/admin/pages/CompanyManagement'));
const MediaLibrary            = lazy(() => import('@/features/admin/pages/MediaLibrary'));
const Analytics               = lazy(() => import('@/features/admin/pages/Analytics'));
const AuditLogs               = lazy(() => import('@/features/admin/pages/AuditLogs'));
const AdminRoles              = lazy(() => import('@/features/admin/pages/AdminRoles'));
const PlatformConfig          = lazy(() => import('@/features/admin/pages/PlatformConfig'));

// ── Community sub-pages ───────────────────────────────────────────────────────
const BranchesManagement  = lazy(() => import('@/features/admin/pages/community/BranchesManagement'));
const CommunityModeration = lazy(() => import('@/features/admin/pages/community/CommunityModeration'));
const CommunityEvents     = lazy(() => import('@/features/admin/pages/community/CommunityEvents'));
const CommunityGroups     = lazy(() => import('@/features/admin/pages/community/CommunityGroups'));

// ── Jobs & Hiring ─────────────────────────────────────────────────────────────
const JobListings         = lazy(() => import('@/features/admin/pages/jobs/JobListings'));
const JobsModeration      = lazy(() => import('@/features/admin/pages/jobs/JobsModeration'));
const FinancialLedger     = lazy(() => import('@/features/admin/pages/jobs/FinancialLedger'));
const DisputesQueue       = lazy(() => import('@/features/admin/pages/jobs/DisputesQueue'));
const ContractsManagement = lazy(() => import('@/features/admin/pages/jobs/ContractsManagement'));

// ── Platform ──────────────────────────────────────────────────────────────────
const NotificationsAdmin  = lazy(() => import('@/features/admin/pages/platform/NotificationsAdmin'));
const FeatureFlags        = lazy(() => import('@/features/admin/pages/platform/FeatureFlags'));
const AnnouncementBanners = lazy(() => import('@/features/admin/pages/platform/AnnouncementBanners'));

// ── Analytics sub-pages ───────────────────────────────────────────────────────
const UsersAnalytics     = lazy(() => import('@/features/admin/pages/analytics/UsersAnalytics'));
const ContentAnalytics   = lazy(() => import('@/features/admin/pages/analytics/ContentAnalytics'));
const RevenueAnalytics   = lazy(() => import('@/features/admin/pages/analytics/RevenueAnalytics'));
const CommunityAnalytics = lazy(() => import('@/features/admin/pages/analytics/CommunityAnalytics'));

// ── Audit ─────────────────────────────────────────────────────────────────────
const SuperAuditLog = lazy(() => import('@/features/admin/pages/audit/SuperAuditLog'));

function AdminLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />
    </div>
  );
}

function SuspenseOutlet() {
  const { pathname } = useLocation();
  return (
    <Suspense fallback={<AdminLoadingScreen />}>
      {/* key resets the boundary on every navigation, giving per-page isolation */}
      <ErrorBoundary key={pathname}>
        <Outlet />
      </ErrorBoundary>
    </Suspense>
  );
}

const AdminRoutes = () => (
  <>
    <Route element={<AdminAuthGuard />}>
      <Route element={<AdminLayout />}>
        {/* Suspense wrapper for all lazy-loaded admin pages */}
        <Route element={<SuspenseOutlet />}>

          {/* ── Dashboard ───────────────────────────────────────────────── */}
          <Route path="/admin" element={<Dashboard />} />

          {/* ── Games ───────────────────────────────────────────────────── */}
          <Route path="/admin/games" element={<GamesManagement />} />
          <Route path="/admin/games/create" element={<GameCreate />} />
          <Route path="/admin/games/:id/edit" element={<GameEdit />} />
          <Route path="/admin/games/hub-settings" element={<GamesHubSettings />} />

          {/* ── Tournaments ─────────────────────────────────────────────── */}
          <Route path="/admin/tournaments" element={<TournamentsManagement />} />
          <Route path="/admin/tournaments/create" element={<TournamentCreate />} />
          <Route path="/admin/tournaments/:id/edit" element={<TournamentEdit />} />
          <Route path="/admin/tournaments/:id/brackets" element={<TournamentBrackets />} />
          <Route path="/admin/tournaments/:id/results" element={<TournamentResults />} />
          <Route path="/admin/tournaments/:id/registrations" element={<TournamentRegistrations />} />
          <Route path="/admin/tournaments/:id/analytics" element={<TournamentAnalytics />} />

          {/* ── Blogs ───────────────────────────────────────────────────── */}
          <Route path="/admin/blogs" element={<BlogsManagement />} />
          <Route path="/admin/blogs/create" element={<BlogCreate />} />
          <Route path="/admin/blogs/:id/edit" element={<BlogEdit />} />
          <Route path="/admin/blogs/featured" element={<BlogFeaturedContent />} />

          {/* ── Users & Identity ────────────────────────────────────────── */}
          <Route path="/admin/users" element={<UsersManagement />} />
          <Route path="/admin/users/:id" element={<UserDetail />} />
          <Route path="/admin/companies" element={<CompanyManagement />} />
          <Route path="/admin/verifications" element={<VerificationQueue />} />
          <Route path="/admin/verification" element={<Navigate to="/admin/verifications" replace />} />
          {/*
            Leaf-guard pattern: AdminAuthGuard receives the page as children instead
            of relying on <Outlet />. This enforces a stricter requiredRole on a single
            route without adding a layout layer. See AdminAuthGuard.jsx for full docs.
          */}
          <Route
            path="/admin/roles"
            element={
              <AdminAuthGuard requiredRole="super_admin">
                <AdminRoles />
              </AdminAuthGuard>
            }
          />

          {/* ── Community ───────────────────────────────────────────────── */}
          <Route path="/admin/community" element={<Navigate to="/admin/community/branches" replace />} />
          <Route path="/admin/community/branches" element={<BranchesManagement />} />
          <Route path="/admin/community/moderation" element={<CommunityModeration />} />
          <Route path="/admin/community/events" element={<CommunityEvents />} />
          <Route path="/admin/community/groups" element={<CommunityGroups />} />

          {/* ── Jobs & Hiring ────────────────────────────────────────────── */}
          <Route path="/admin/jobs/listings" element={<JobListings />} />
          <Route path="/admin/jobs/moderation" element={<JobsModeration />} />
          <Route
            path="/admin/jobs/finance"
            element={
              <AdminAuthGuard requiredRole="super_admin">
                <FinancialLedger />
              </AdminAuthGuard>
            }
          />
          <Route path="/admin/jobs/disputes" element={<DisputesQueue />} />
          <Route path="/admin/jobs/contracts" element={<ContractsManagement />} />

          {/* ── Platform ────────────────────────────────────────────────── */}
          <Route path="/admin/notifications" element={<NotificationsAdmin />} />
          <Route path="/admin/feature-flags" element={<FeatureFlags />} />
          <Route path="/admin/announcements" element={<AnnouncementBanners />} />
          <Route
            path="/admin/settings"
            element={
              <AdminAuthGuard requiredRole="super_admin">
                <PlatformConfig />
              </AdminAuthGuard>
            }
          />

          {/* ── Media ───────────────────────────────────────────────────── */}
          <Route path="/admin/media" element={<MediaLibrary />} />

          {/* ── Analytics ───────────────────────────────────────────────── */}
          <Route path="/admin/analytics" element={<Analytics />} />
          <Route path="/admin/analytics/users" element={<UsersAnalytics />} />
          <Route path="/admin/analytics/content" element={<ContentAnalytics />} />
          <Route path="/admin/analytics/revenue" element={<RevenueAnalytics />} />
          <Route path="/admin/analytics/community" element={<CommunityAnalytics />} />

          {/* ── Audit ───────────────────────────────────────────────────── */}
          <Route path="/admin/audit" element={<AuditLogs />} />
          <Route path="/admin/audit-logs" element={<Navigate to="/admin/audit" replace />} />
          <Route
            path="/admin/audit/super"
            element={
              <AdminAuthGuard requiredRole="super_admin">
                <SuperAuditLog />
              </AdminAuthGuard>
            }
          />

        </Route>
      </Route>
    </Route>
  </>
);

export default AdminRoutes;
