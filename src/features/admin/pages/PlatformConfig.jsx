import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiChevronDown, FiChevronUp, FiSave, FiAlertTriangle, FiLock } from 'react-icons/fi';
import { AdminPageHero } from '@/features/admin/components/AdminContentShell';
import useAdminAuthStore from '@/store/admin/useAdminAuthStore';
import { useToast } from '@/shared/components/Toast';
import { useNavigate } from 'react-router-dom';
import { adminQueryFn } from '@/services/api/adminApi';
import adminApi from '@/services/api/adminApi';

const DEFAULT_GENERAL = {
  platform_name: 'GzoneSphere',
  maintenance_mode: false,
  registration_open: true,
  default_timezone: 'Asia/Kolkata',
  support_email: 'support@gzonesphere.com',
  platform_tagline: 'The Ultimate Gaming Platform for Creators & Competitors',
};

const DEFAULT_COMMUNITY = {
  message_limit_non_friends: 3,
  profanity_filter_enabled: true,
  ai_toxicity_threshold: 0.85,
  showcase_featured_day_of_week: 1,
  lfg_post_expiry_days: 7,
};

const DEFAULT_JOBS = {
  gig_commission_rate: 10,
  listing_fee_fulltime_standard: 49900,
  listing_fee_fulltime_featured: 99900,
  listing_fee_internship_standard: 29900,
  escrow_auto_release_days: 7,
  dispute_sla_hours: 48,
  razorpay_test_mode: true,
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

function CollapsibleSection({ title, meta, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-[2rem] overflow-hidden mb-6">
      <button
        className="w-full flex items-center justify-between px-8 py-6 text-left hover:bg-[var(--theme-bg-alt)]/20 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div>
          <h3 className="text-base font-black uppercase tracking-tight italic text-[var(--theme-text)]">{title}</h3>
          {meta && <p className="text-[10px] font-bold text-[var(--theme-text-muted)] italic opacity-40 uppercase tracking-widest mt-1">{meta}</p>}
        </div>
        {open
          ? <FiChevronUp size={18} className="text-[var(--theme-text-muted)] opacity-50" />
          : <FiChevronDown size={18} className="text-[var(--theme-text-muted)] opacity-50" />}
      </button>
      {open && <div className="px-8 pb-8 space-y-1 border-t border-[var(--theme-border)]/50">{children}</div>}
    </div>
  );
}

function FieldRow({ label, hint, children }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[280px_1fr] gap-4 items-start py-5 border-b border-[var(--theme-border)]/40 last:border-0">
      <div className="pt-1">
        <p className="text-sm font-semibold text-[var(--theme-text)]">{label}</p>
        {hint && <p className="text-xs text-[var(--theme-text-muted)] opacity-50 mt-1 leading-relaxed">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

export default function PlatformConfig() {
  const { user: adminUser } = useAdminAuthStore();
  const isSuperAdmin = adminUser?.role === 'super_admin';
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: configData } = useQuery({
    queryKey: ['admin', 'platform-config'],
    queryFn: adminQueryFn('/admin/platform-config'),
    enabled: isSuperAdmin,
    retry: 1,
  });

  const [general, setGeneral] = useState(DEFAULT_GENERAL);
  const [maintConfirmPending, setMaintConfirmPending] = useState(false);
  const [community, setCommunity] = useState(DEFAULT_COMMUNITY);
  const [jobs, setJobs] = useState(DEFAULT_JOBS);

  useEffect(() => {
    if (configData?.general) setGeneral(g => ({ ...DEFAULT_GENERAL, ...configData.general, ...g }));
    if (configData?.community) setCommunity(c => ({ ...DEFAULT_COMMUNITY, ...configData.community, ...c }));
    if (configData?.jobs) setJobs(j => ({ ...DEFAULT_JOBS, ...configData.jobs, ...j }));
  }, [configData]);

  const saveMutation = useMutation({
    mutationFn: (payload) => adminApi.patch('/admin/platform-config', payload).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'platform-config'] }),
    onError: () => {},
  });

  if (!isSuperAdmin) {
    return (
      <div className="admin-page">
        <AdminPageHero
          kicker="Platform"
          title="Platform Config"
          description="Edit global platform settings. Changes take effect immediately or after cache bust."
        />
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
            <FiLock size={28} className="text-rose-400" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight italic text-[var(--theme-text)] mb-2">Access Denied</h2>
          <p className="text-sm text-[var(--theme-text-muted)] opacity-60 max-w-xs">Platform configuration requires Super Admin access.</p>
          <button
            onClick={() => navigate('/admin')}
            className="mt-6 text-sm text-[var(--theme-primary)] hover:underline font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleMaintenanceToggle = (val) => {
    if (val === true && !maintConfirmPending) {
      setMaintConfirmPending(true);
      return;
    }
    setGeneral(g => ({ ...g, maintenance_mode: val }));
    setMaintConfirmPending(false);
    if (val) showToast('Maintenance mode enabled. All public routes returning 503.', 'warning');
  };

  const toxicityColor = community.ai_toxicity_threshold < 0.7
    ? 'text-emerald-400'
    : community.ai_toxicity_threshold <= 0.9
      ? 'text-amber-400'
      : 'text-rose-400';

  return (
    <div className="admin-page">
      <AdminPageHero
        kicker="Platform"
        title="Platform Config"
        description="Edit global platform settings. Changes take effect immediately or after cache bust."
      />

      {/* Section 1 — General Settings */}
      <CollapsibleSection title="General Settings" meta="platform identity · availability · timezone">
        <FieldRow label="Platform name">
          <input
            className="admin-input w-full max-w-sm"
            value={general.platform_name}
            onChange={e => setGeneral(g => ({ ...g, platform_name: e.target.value }))}
          />
        </FieldRow>

        <FieldRow label="Platform tagline" hint="120 characters max">
          <div className="relative max-w-lg">
            <input
              className="admin-input w-full pr-14"
              maxLength={120}
              value={general.platform_tagline}
              onChange={e => setGeneral(g => ({ ...g, platform_tagline: e.target.value }))}
            />
            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono pointer-events-none ${general.platform_tagline.length >= 100 ? 'text-amber-400' : 'text-[var(--theme-text-muted)] opacity-40'}`}>
              {general.platform_tagline.length}/120
            </span>
          </div>
        </FieldRow>

        <FieldRow label="Support email">
          <input
            className="admin-input w-full max-w-sm"
            type="email"
            value={general.support_email}
            onChange={e => setGeneral(g => ({ ...g, support_email: e.target.value }))}
          />
        </FieldRow>

        <FieldRow label="Default timezone">
          <select
            className="admin-select"
            value={general.default_timezone}
            onChange={e => setGeneral(g => ({ ...g, default_timezone: e.target.value }))}
          >
            {['Asia/Kolkata', 'UTC', 'America/New_York', 'Europe/London', 'Asia/Singapore'].map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </FieldRow>

        <FieldRow label="Registration open" hint="Allow new users to sign up">
          <ToggleSwitch
            value={general.registration_open}
            onChange={val => setGeneral(g => ({ ...g, registration_open: val }))}
          />
        </FieldRow>

        <FieldRow label="Maintenance mode" hint="Returns 503 to all public routes. Admin panel stays accessible.">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <ToggleSwitch
                value={general.maintenance_mode || maintConfirmPending}
                onChange={handleMaintenanceToggle}
              />
              {maintConfirmPending && (
                <>
                  <button
                    className="text-xs px-4 py-2 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-colors font-semibold"
                    onClick={() => handleMaintenanceToggle(true)}
                  >
                    Confirm enable maintenance
                  </button>
                  <button
                    className="text-xs px-4 py-2 rounded-lg bg-[var(--theme-bg-alt)] text-[var(--theme-text-muted)] border border-[var(--theme-border)] hover:border-[var(--theme-primary)]/30 transition-colors font-semibold"
                    onClick={() => setMaintConfirmPending(false)}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
            {(maintConfirmPending || general.maintenance_mode) && (
              <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-300 text-xs leading-relaxed max-w-lg">
                <FiAlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>
                  Enabling maintenance mode returns <strong>503</strong> to ALL public routes. The admin panel remains accessible.
                  This will immediately disconnect all active users.
                </span>
              </div>
            )}
          </div>
        </FieldRow>

        <div className="pt-4">
          <button
            className="admin-btn flex items-center gap-2"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate({ general }, {
              onSuccess: () => showToast('General settings saved.', 'success'),
              onError: () => showToast('Failed to save. Check connection.', 'error'),
            })}
          >
            <FiSave size={14} /> {saveMutation.isPending ? 'Saving…' : 'Save general settings'}
          </button>
        </div>
      </CollapsibleSection>

      {/* Section 2 — Community Settings */}
      <CollapsibleSection title="Community Settings" meta="messaging · ai moderation · content scheduling">
        <FieldRow
          label="Max messages to non-friends"
          hint="Max messages non-friends can send before a response is required"
        >
          <input
            className="admin-input w-24"
            type="number"
            min={1}
            max={50}
            value={community.message_limit_non_friends}
            onChange={e => setCommunity(c => ({ ...c, message_limit_non_friends: +e.target.value }))}
          />
        </FieldRow>

        <FieldRow label="Profanity filter">
          <ToggleSwitch
            value={community.profanity_filter_enabled}
            onChange={val => setCommunity(c => ({ ...c, profanity_filter_enabled: val }))}
          />
        </FieldRow>

        <FieldRow
          label="AI toxicity threshold"
          hint="Messages scoring above this threshold are auto-flagged for moderation review. Default: 0.85"
        >
          <div className="space-y-2 max-w-sm">
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={community.ai_toxicity_threshold}
                onChange={e => setCommunity(c => ({ ...c, ai_toxicity_threshold: parseFloat(e.target.value) }))}
                className="flex-1 accent-emerald-500 h-2"
              />
              <span className={`text-2xl font-black font-mono tabular-nums w-14 text-right ${toxicityColor}`}>
                {community.ai_toxicity_threshold.toFixed(2)}
              </span>
            </div>
            <p className="text-[11px] text-[var(--theme-text-muted)] opacity-60">
              <span className="text-emerald-400 font-semibold">Green &lt;0.7</span>
              {' · '}
              <span className="text-amber-400 font-semibold">Amber 0.7–0.9</span>
              {' · '}
              <span className="text-rose-400 font-semibold">Red &gt;0.9</span>
              {' (very aggressive — more moderation workload)'}
            </p>
          </div>
        </FieldRow>

        <FieldRow label="Showcase featured day" hint="Day of week for weekly winner selection">
          <select
            className="admin-select"
            value={community.showcase_featured_day_of_week}
            onChange={e => setCommunity(c => ({ ...c, showcase_featured_day_of_week: +e.target.value }))}
          >
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d, i) => (
              <option key={i} value={i}>{d}</option>
            ))}
          </select>
        </FieldRow>

        <FieldRow label="LFG post expiry (days)">
          <input
            className="admin-input w-24"
            type="number"
            min={1}
            max={30}
            value={community.lfg_post_expiry_days}
            onChange={e => setCommunity(c => ({ ...c, lfg_post_expiry_days: +e.target.value }))}
          />
        </FieldRow>

        <div className="pt-4">
          <button
            className="admin-btn flex items-center gap-2"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate({ community }, {
              onSuccess: () => showToast('Community settings saved.', 'success'),
              onError: () => showToast('Failed to save. Check connection.', 'error'),
            })}
          >
            <FiSave size={14} /> {saveMutation.isPending ? 'Saving…' : 'Save community settings'}
          </button>
        </div>
      </CollapsibleSection>

      {/* Section 3 — Jobs & Payments */}
      <CollapsibleSection title="Jobs & Payments" meta="commission · listing fees · escrow · razorpay">
        {jobs.razorpay_test_mode && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-amber-300 text-xs mt-2 mb-2">
            <FiAlertTriangle size={13} className="shrink-0" />
            <span>Razorpay is in <strong>test mode</strong> — no real money moves. Disable before going live.</span>
          </div>
        )}

        <FieldRow label="GZS commission rate (%)" hint="Commission on gig contracts (0–100%)">
          <input
            className="admin-input w-24"
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={jobs.gig_commission_rate}
            onChange={e => setJobs(j => ({ ...j, gig_commission_rate: +e.target.value }))}
          />
        </FieldRow>

        <FieldRow label="Full-time listing fee — standard (₹)">
          <div className="flex items-center gap-2">
            <span className="text-[var(--theme-text-muted)] text-sm">₹</span>
            <input
              className="admin-input w-32"
              type="number"
              min={0}
              value={Math.round(jobs.listing_fee_fulltime_standard / 100)}
              onChange={e => setJobs(j => ({ ...j, listing_fee_fulltime_standard: +e.target.value * 100 }))}
            />
          </div>
        </FieldRow>

        <FieldRow label="Full-time listing fee — featured (₹)">
          <div className="flex items-center gap-2">
            <span className="text-[var(--theme-text-muted)] text-sm">₹</span>
            <input
              className="admin-input w-32"
              type="number"
              min={0}
              value={Math.round(jobs.listing_fee_fulltime_featured / 100)}
              onChange={e => setJobs(j => ({ ...j, listing_fee_fulltime_featured: +e.target.value * 100 }))}
            />
          </div>
        </FieldRow>

        <FieldRow label="Internship listing fee — standard (₹)">
          <div className="flex items-center gap-2">
            <span className="text-[var(--theme-text-muted)] text-sm">₹</span>
            <input
              className="admin-input w-32"
              type="number"
              min={0}
              value={Math.round(jobs.listing_fee_internship_standard / 100)}
              onChange={e => setJobs(j => ({ ...j, listing_fee_internship_standard: +e.target.value * 100 }))}
            />
          </div>
        </FieldRow>

        <FieldRow label="Auto-release escrow after N days">
          <input
            className="admin-input w-24"
            type="number"
            min={1}
            max={30}
            value={jobs.escrow_auto_release_days}
            onChange={e => setJobs(j => ({ ...j, escrow_auto_release_days: +e.target.value }))}
          />
        </FieldRow>

        <FieldRow label="Dispute resolution SLA (hours)">
          <input
            className="admin-input w-24"
            type="number"
            min={12}
            max={168}
            value={jobs.dispute_sla_hours}
            onChange={e => setJobs(j => ({ ...j, dispute_sla_hours: +e.target.value }))}
          />
        </FieldRow>

        <FieldRow label="Razorpay test mode" hint="⚠️ Test mode: no real money moves. Disable before going live.">
          <ToggleSwitch
            value={jobs.razorpay_test_mode}
            onChange={val => setJobs(j => ({ ...j, razorpay_test_mode: val }))}
          />
        </FieldRow>

        <div className="pt-4">
          <button
            className="admin-btn flex items-center gap-2"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate({ jobs }, {
              onSuccess: () => showToast('Jobs & payment settings saved.', 'success'),
              onError: () => showToast('Failed to save. Check connection.', 'error'),
            })}
          >
            <FiSave size={14} /> {saveMutation.isPending ? 'Saving…' : 'Save payment settings'}
          </button>
        </div>
      </CollapsibleSection>
    </div>
  );
}
