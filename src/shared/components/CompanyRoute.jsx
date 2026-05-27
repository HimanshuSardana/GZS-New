import { Navigate, Outlet } from 'react-router-dom';
import authService from '@/services/features/authService';

export default function CompanyRoute({ children }) {
  const user = authService.getCurrentUser();
  const isOrg = user?.account_type === 'organization';

  if (!isOrg) {
    // In a real app we would trigger a toast here
    console.warn("Company access required");
    return <Navigate to="/profile" replace />;
  }

  return children || <Outlet />;
}





