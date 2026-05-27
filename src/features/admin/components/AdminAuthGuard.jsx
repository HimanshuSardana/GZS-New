import { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import useAdminAuthStore from '@/store/admin/useAdminAuthStore';

const ALLOWED_ROLES = ['admin', 'super_admin', 'moderator', 'analytics_viewer'];

function AdminAccessDenied() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl p-8 max-w-sm w-full text-center shadow-xl">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="text-slate-100 text-xl font-semibold mb-2">Access Restricted</h2>
        <p className="text-slate-400 text-sm mb-6">Access restricted to Super Admins</p>
        <button
          onClick={() => navigate('/admin')}
          className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
        >
          ← Back to Admin
        </button>
      </div>
    </div>
  );
}

// AdminAuthGuard has two usage modes:
//
//   1. Layout guard (no children) — wraps a <Route element={<AdminAuthGuard />}> so that
//      all child routes render through <Outlet />.
//
//   2. Leaf guard (with children) — wraps a single page component to enforce a stricter
//      requiredRole without introducing a layout layer:
//        <AdminAuthGuard requiredRole="super_admin"><AdminRoles /></AdminAuthGuard>
//      In this mode `children ?? <Outlet />` returns the page directly.
//      Do NOT convert to <Outlet /> — these are leaf routes with no sub-routes.
export default function AdminAuthGuard({ children, requiredRole = 'admin' }) {
  const { user, isHydrated, hydrate } = useAdminAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Hydrate the store from localStorage on first mount. Calling this here (not
    // inside Zustand's create()) avoids a module-load side-effect and keeps the
    // store pure. The Zustand store is a singleton, so nested AdminAuthGuard
    // instances skip re-hydration once isHydrated is already true.
    if (!isHydrated) hydrate();
  }, [hydrate, isHydrated]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-slate-600 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm mt-4">Verifying access…</p>
        </div>
      </div>
    );
  }

  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return <Navigate to="/login?admin=true" state={{ from: location.pathname }} replace />;
  }

  if (requiredRole === 'super_admin' && user.role !== 'super_admin') {
    return <AdminAccessDenied />;
  }

  // See usage-mode comment above for why children takes precedence over <Outlet />.
  return children ?? <Outlet />;
}
