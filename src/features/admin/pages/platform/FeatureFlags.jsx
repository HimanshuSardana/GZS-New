import { useState } from 'react';
import { FiLock } from 'react-icons/fi';
import { AdminPageHero } from '@/features/admin/components/AdminContentShell';
import useAdminAuthStore from '@/store/admin/useAdminAuthStore';
import { useToast } from '@/shared/components/Toast';

const MOCK_FLAGS = [
  { key: 'user_blog_submissions', description: 'Enable user-generated blog submissions (Phase 2)', enabled: false, phase: 2 },
  { key: 'ai_profile_headline', description: 'Enable AI headline generator in sub-profile creation. Calls Claude API.', enabled: true, phase: 1 },
  { key: 'ai_skill_suggester', description: 'Enable AI role taxonomy suggester in sub-profile creation.', enabled: true, phase: 1 },
  { key: 'ai_smart_match', description: 'Enable AI-powered LFG matching and job matching.', enabled: false, phase: 2 },
  { key: 'jobs_individual_gig_posting', description: 'Enable individual-to-individual gig posting (Phase 2).', enabled: false, phase: 2 },
  { key: 'skill_auto_approve', description: 'Enable AI-assisted skill auto-approval for high-reputation users (Phase 2).', enabled: false, phase: 2 },
  { key: 'gaming_dating', description: 'Enable dating module (Phase 4). Shows "Coming Soon" in UI when off.', enabled: false, phase: 4 },
  { key: 'marketplace', description: 'Enable marketplace module (Phase 3). Shows "Coming Soon" in UI when off.', enabled: false, phase: 3 },
];

const PHASE_COLOURS = {
  1: 'bg-teal-500/15 text-teal-400 border-teal-500/20',
  2: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  3: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  4: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
};

function ToggleSwitch({ value, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      disabled={disabled}
      onClick={() => !disabled && onChange(!value)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:ring-offset-2 focus:ring-offset-[var(--theme-card)] ${
        value ? 'bg-emerald-500' : 'bg-slate-600'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function FeatureFlags() {
  const { user: adminUser } = useAdminAuthStore();
  const isSuperAdmin = adminUser?.role === 'super_admin';
  const { showToast } = useToast();
  const [flags, setFlags] = useState(MOCK_FLAGS);

  const toggleFlag = (key) => {
    if (!isSuperAdmin) return;
    setFlags(prev =>
      prev.map(f => {
        if (f.key !== key) return f;
        const next = { ...f, enabled: !f.enabled };
        // TODO: PATCH /admin/feature-flags/:key
        showToast(`Flag '${key}' ${next.enabled ? 'enabled' : 'disabled'}.`, 'success');
        return next;
      })
    );
  };

  return (
    <div className="admin-page">
      <AdminPageHero
        kicker="Platform"
        title="Feature Flags"
        description="Toggle features on or off for users, cohorts, or the entire platform."
      />

      <div className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-[2rem] p-8 mb-8">
        <p className="text-sm text-[var(--theme-text-muted)] opacity-70 italic">
          Toggling flags takes effect immediately. Disabled phase features show "Coming Soon" to users.
          {!isSuperAdmin && (
            <span className="ml-2 inline-flex items-center gap-1 text-amber-400">
              <FiLock size={12} /> View-only — Super Admin required to toggle.
            </span>
          )}
        </p>
      </div>

      <div className="space-y-3">
        {flags.map(flag => (
          <div
            key={flag.key}
            className={`flex items-center gap-4 bg-[var(--theme-card)] border-2 rounded-2xl px-6 py-5 transition-all ${
              flag.enabled
                ? 'border-emerald-500/20 hover:border-emerald-500/40'
                : 'border-[var(--theme-border)] hover:border-[var(--theme-border)]/80'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <span className="text-xs font-mono text-[var(--theme-text)] bg-[var(--theme-bg-alt)] px-2 py-0.5 rounded border border-[var(--theme-border)]">
                  {flag.key}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${PHASE_COLOURS[flag.phase]}`}>
                  Phase {flag.phase}
                </span>
              </div>
              <p className="text-sm text-[var(--theme-text-muted)] opacity-60 leading-snug">{flag.description}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!isSuperAdmin && <FiLock size={13} className="text-[var(--theme-text-muted)] opacity-40" />}
              <ToggleSwitch
                value={flag.enabled}
                onChange={() => toggleFlag(flag.key)}
                disabled={!isSuperAdmin}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
