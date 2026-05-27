import { Outlet, useLocation } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from "./AdminSidebar";
import AdminGlobalSearch from './AdminGlobalSearch';

const AdminLayout = () => {
  const location = useLocation();

  return (
    <div className="theme-admin min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <AdminNavbar pathname={location.pathname} />
      <div className="admin-layout">
        <AdminSidebar />
        <main className="admin-main">
          <div className="admin-content">
            <Outlet />
          </div>
        </main>
      </div>
      <AdminGlobalSearch />
    </div>
  );
};

export default AdminLayout;
