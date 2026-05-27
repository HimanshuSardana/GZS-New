import { AdminPageHero, AdminPanel } from '@/features/admin/components/AdminContentShell';

export default function AdminRoles() {
  return (
    <div className="admin-page">
      <AdminPageHero kicker="Users & Identity" title="Admin Roles" description="Assign and manage admin, moderator, and analyst roles across the platform." />
      <AdminPanel title="Role Management" meta="restricted — super admin only">
        <p className="text-sm italic text-[var(--theme-text-muted)] opacity-60">This module is under development.</p>
      </AdminPanel>
    </div>
  );
}
