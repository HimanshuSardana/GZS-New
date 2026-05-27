import { AdminPageHero, AdminPanel } from '@/features/admin/components/AdminContentShell';

export default function SuperAuditLog() {
  return (
    <div className="admin-page">
      <AdminPageHero kicker="Audit" title="Super Admin Logs" description="Full audit trail of super admin actions, role changes, and system overrides." />
      <AdminPanel title="Super Admin Audit Log" meta="restricted — super admin only">
        <p className="text-sm italic text-[var(--theme-text-muted)] opacity-60">This module is under development.</p>
      </AdminPanel>
    </div>
  );
}
