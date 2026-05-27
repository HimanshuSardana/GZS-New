import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/app/providers/useAuth';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

  // Wait for useProfileStore's initial fetch to finish before deciding whether
  // to redirect. Without this guard a hard-refresh races: isLoading=true,
  // isAuthenticated=false → premature logout redirect.
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const loginPath = adminOnly ? '/login?admin=true' : '/login';
    return <Navigate to={loginPath} state={{ from: location.pathname }} replace />;
  }

  return children ?? <Outlet />;
}
