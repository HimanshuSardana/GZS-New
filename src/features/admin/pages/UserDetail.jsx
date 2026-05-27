import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  FiArrowLeft, FiUser, FiShield, FiActivity, FiLayers,
  FiCheckCircle, FiAlertCircle, FiX, FiEdit2, FiFlag, FiDownload,
  FiEye, FiLock, FiSlash, FiKey, FiBell, FiRefreshCw, FiTrash2,
  FiGitMerge, FiMonitor, FiSmartphone, FiTablet,
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer,
} from 'recharts';
import { useToast } from '@/shared/components/Toast';
import LevelBadge       from '@/shared/components/LevelBadge';
import TrustScoreWidget from '@/shared/components/TrustScoreWidget';
import useAdminAuthStore from '@/store/admin/useAdminAuthStore';
import core from '@/services/api/core';
import {
  MOCK_ADMIN_USERS, STATUS_META, LEVEL_META, relativeTime, maskEmail, generateLoginData,
} from '@/shared/data/adminData';

const TABS = [
  { id: 'identity',    label: 'Identity',        icon: FiUser     },
  { id: 'platform',   label: 'Platform Status',  icon: FiShield   },
  { id: 'subprofiles',label: 'Sub-Profiles',     icon: FiLayers   },
  { id: 'activity',   label: 'Activity',         icon: FiActivity },
];

const DOMAIN_META = {
  dev:      { label: 'Game Dev',  color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
  esports:  { label: 'Esports',   color: 'bg-rose-500/15 text-rose-400 border-rose-500/30'       },
  content:  { label: 'Content',   color: 'bg-pink-500/15 text-pink-400 border-pink-500/30'       },
  business: { label: 'Business',  color: 'bg-sky-500/15 text-sky-400 border-sky-500/30'          },
  art:      { label: 'Art',       color: 'bg-amber-500/15 text-amber-400 border-amber-500/30'    },
  writing:  { label: 'Writing',   color: 'bg-teal-500/15 text-teal-400 border-teal-500/30'       },
  audio:    { label: 'Audio',     color: 'bg-violet-500/15 text-violet-400 border-violet-500/30' },
};

const TRUST_COMPONENTS = [
  { key: 'verifiedSkills',         label: 'Verified skills',              weight: '30%',  maxPts: 30 },
  { key: 'communityContributions', label: 'Community contributions',      weight: '25%',  maxPts: 25 },
  { key: 'reportHistory',          label: 'Report history',               weight: '-15%', maxPts: 15, penalty: true },
  { key: 'accountAge',             label: 'Account age',                  weight: '10%',  maxPts: 10 },
  { key: 'collabCompletion',       label: 'Collaboration completion rate',weight: '15%',  maxPts: 15 },
  { key: 'referralQuality',        label: 'Referral quality',             weight: '10%',  maxPts: 10 },
];

// TODO: replace with useQuery calling GET /admin/users/:id/sessions
const MOCK_SESSIONS = [
  { session_id: 'sess_a1b2c3', device_type: 'Desktop', browser: 'Chrome 124',  ip: '103.49.21.15', country: 'IN', last_activity: '2026-05-21T09:30:00Z' },
  { session_id: 'sess_d4e5f6', device_type: 'Mobile',  browser: 'Safari 17',   ip: '202.65.83.41', country: 'IN', last_activity: '2026-05-20T22:00:00Z' },
  { session_id: 'sess_g7h8i9', device_type: 'Tablet',  browser: 'Firefox 125', ip: '49.36.140.22', country: 'IN', last_activity: '2026-05-19T14:00:00Z' },
];

function countryFlag(code) {
  if (!code || code.length !== 2) return '🌐';
  return code.toUpperCase().split('').map(c => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('');
}

const DEVICE_ICON = { Desktop: FiMonitor, Mobile: FiSmartphone, Tablet: FiTablet };

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {title ? <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">{title}</h3> : null}
      {children}
    </div>
  );
}

function Field({ label, value, mono }) {
  return (
    <div className="grid gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      <span className={`text-sm text-slate-800 ${mono ? 'font-mono' : 'font-medium'}`}>{value || '—'}</span>
    </div>
  );
}

function VerifyRow({ label, verified, onTrigger }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2 text-sm text-slate-700">
        {verified
          ? <FiCheckCircle size={14} className="text-emerald-500" />
          : <FiAlertCircle size={14} className="text-slate-400" />}
        {label}
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-[11px] font-semibold ${verified ? 'text-emerald-600' : 'text-slate-400'}`}>
          {verified ? 'Verified' : 'Not verified'}
        </span>
        <button
          onClick={onTrigger}
          className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-100 transition-colors"
        >
          Re-verify
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function UserDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast } = useToast();
  const { user: adminUser } = useAdminAuthStore();
  const isSuperAdmin = adminUser?.role === 'super_admin';

  const [activeTab, setActiveTab] = useState('identity');

  // Action modal state
  const [notifOpen, setNotifOpen]           = useState(false);
  const [notifMessage, setNotifMessage]     = useState('');
  const [notifEmail, setNotifEmail]         = useState(false);
  const [suspendOpen, setSuspendOpen]       = useState(false);
  const [suspendDuration, setSuspendDuration] = useState('1d');
  const [suspendReason, setSuspendReason]   = useState('');
  const [banOpen, setBanOpen]               = useState(false);
  const [banConfirmText, setBanConfirmText] = useState('');
  const [banReason, setBanReason]           = useState('');
  const [reset2FAOpen, setReset2FAOpen]     = useState(false);
  const [deleteOpen, setDeleteOpen]         = useState(false);
  const [deleteMode, setDeleteMode]         = useState('soft');
  const [hardDeleteConfirm, setHardDeleteConfirm] = useState('');
  const [gdprOpen, setGdprOpen]             = useState(false);
  const [mergeOpen, setMergeOpen]           = useState(false);
  const [mergeTarget, setMergeTarget]       = useState('');
  const [mergeConfirm, setMergeConfirm]     = useState('');
  const [revokeAllOpen, setRevokeAllOpen]   = useState(false);

  // Trust adjustment (role-gated)
  const [trustAdjustValue, setTrustAdjustValue]   = useState('');
  const [trustAdjustReason, setTrustAdjustReason] = useState('');
  const [isRecalculating, setIsRecalculating]     = useState(false);

  // Flag reason per sub-profile
  const [flagReasons, setFlagReasons] = useState({});

  // Impersonation
  const IMPERSONATION_DURATION = 15 * 60;
  const [impersonating, setImpersonating]                 = useState(false);
  const [impersonationSecsLeft, setImpersonationSecsLeft] = useState(0);
  const [impersonateWarnOpen, setImpersonateWarnOpen]     = useState(false);
  const impersonationTimerRef = useRef(null);

  // Level override
  const [levelOverrideOpen, setLevelOverrideOpen]     = useState(false);
  const [levelOverrideValue, setLevelOverrideValue]   = useState('');
  const [levelOverrideReason, setLevelOverrideReason] = useState('');

  useEffect(() => {
    if (!impersonating) return;
    impersonationTimerRef.current = setInterval(() => {
      setImpersonationSecsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(impersonationTimerRef.current);
          setImpersonating(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(impersonationTimerRef.current);
  }, [impersonating]);

  const user = MOCK_ADMIN_USERS.find((u) => u.id === id);
  const loginData = useMemo(() => generateLoginData(30), []);

  if (!user) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <FiUser size={48} className="text-slate-300" />
        <h2 className="text-xl font-bold text-slate-700">User not found</h2>
        <p className="text-sm text-slate-400">No user with ID <code className="font-mono">{id}</code> exists in the system.</p>
        <button onClick={() => navigate('/admin/users')} className="admin-btn admin-btn--ghost mt-2">
          <FiArrowLeft size={14} /> Back to Users
        </button>
      </div>
    );
  }

  const levelMeta   = LEVEL_META[user.platformLevel] || LEVEL_META.Beginner;
  const statusMeta  = STATUS_META[user.status] || STATUS_META.Active;
  const xpPct       = Math.round((user.xp.current / user.xp.next) * 100);
  const totalTrust  = Object.values(user.trustBreakdown).reduce((sum, v) => sum + v, 0);
  const maxAdjust   = isSuperAdmin ? 2.0 : 0.5;

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsRecalculating(false);
    showToast('Trust score recalculated and updated.', 'success');
  };

  const handleImpersonate = () => {
    setImpersonateWarnOpen(true);
  };

  const handleConfirmImpersonate = () => {
    // eslint-disable-next-line react-hooks/purity
    const mockToken = `imp_${user.id}_${Date.now()}`;
    sessionStorage.setItem('gzs_impersonation', JSON.stringify({ token: mockToken, userId: user.id, username: user.username }));
    window.open(`/u/${user.username}`, '_blank');
    setImpersonating(true);
    setImpersonationSecsLeft(IMPERSONATION_DURATION);
    setImpersonateWarnOpen(false);
  };

  const handleExport = async () => {
    try {
      await core.post(`/admin/users/${id}/export-data`);
      showToast("Export requested. Will be sent to user's email within 72 hours.", 'success');
    } catch {
      showToast('Export request failed.', 'error');
    }
  };

  const exitImpersonation = () => {
    clearInterval(impersonationTimerRef.current);
    sessionStorage.removeItem('gzs_impersonation');
    setImpersonating(false);
    setImpersonationSecsLeft(0);
    showToast('Impersonation session ended.', 'success');
  };

  const fmtCountdown = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="admin-page-shell">
      <Helmet><title>User Detail — @{user.username} | GzoneSphere Admin</title></Helmet>

      {/* Impersonation Banner */}
      {impersonating && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-400 bg-amber-50 px-4 py-3 shadow-sm">
          <span className="text-lg">⚠️</span>
          <p className="flex-1 text-sm font-semibold text-amber-800">
            You are viewing as <span className="font-black">@{user.username}</span>. All admin write operations are blocked.
            {' '}Impersonation expires in{' '}
            <span className="font-mono font-black text-amber-900">{fmtCountdown(impersonationSecsLeft)}</span>
          </p>
          <button onClick={exitImpersonation} className="rounded-xl border border-amber-400 bg-amber-100 px-3 py-1.5 text-xs font-black text-amber-800 transition hover:bg-amber-200">
            Exit
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/users')} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 transition-colors">
            <FiArrowLeft size={16} />
          </button>
          <img src={user.avatarUrl} alt={user.username} className="h-12 w-12 rounded-full object-cover border border-slate-200" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">@{user.username}</h1>
              <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusMeta.color}`}>{user.status}</span>
              <LevelBadge level={user.platformLevel} size="sm" />
              <TrustScoreWidget score={user.trustScore} size="sm" />
            </div>
            <p className="mt-0.5 text-sm text-slate-400">{user.displayName} · {maskEmail(user.email)}</p>
          </div>
        </div>
      </div>

      {/* 2-column layout */}
      <div className="flex gap-6 items-start">

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Tab bar */}
          <div className="flex gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {TABS.map(({ id: tabId, label, icon: Icon }) => (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${activeTab === tabId ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* ── TAB 1 — Identity ──────────────────────────────────────────── */}
          {activeTab === 'identity' ? (
            <div className="space-y-4">
              <Section title="Account Identity">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Field label="Username"         value={`@${user.username}`} />
                  <Field label="Display name"     value={user.displayName} />
                  <Field label="Email"            value={user.email} mono />
                  <Field label="User ID"          value={user.id} mono />
                  <Field label="UUID"             value={user.uuid} mono />
                  <Field label="Account creation" value={user.creationMethod} />
                  <Field label="Joined"           value={user.joinedAt.slice(0, 10)} />
                  <Field label="Last active"      value={relativeTime(user.lastActiveAt)} />
                  <Field label="Last login IP"    value={user.lastLoginIp} mono />
                  <Field label="Device type"      value={user.deviceType} />
                </div>
              </Section>

              <Section title="Avatar & banner preview">
                <div className="flex items-center gap-4">
                  <img src={user.avatarUrl} alt="avatar" className="h-20 w-20 rounded-2xl object-cover border border-slate-200" />
                  <div className="flex-1 h-20 rounded-2xl bg-gradient-to-r from-indigo-500/20 to-violet-500/20 border border-slate-200 flex items-center justify-center text-xs text-slate-400">
                    Banner not set
                  </div>
                </div>
              </Section>

              <Section title="Verification status">
                <VerifyRow label="Email verified" verified={user.emailVerified} onTrigger={() => showToast('Email re-verification triggered.', 'success')} />
                <VerifyRow label="Phone verified" verified={user.phoneVerified} onTrigger={() => showToast('Phone re-verification triggered.', 'success')} />
                <VerifyRow label="ID verified"    verified={user.idVerified}    onTrigger={() => showToast('ID re-verification triggered.', 'success')} />
              </Section>

              {/* Active Sessions */}
              <Section title={`Active sessions (${MOCK_SESSIONS.length})`}>
                <div className="space-y-2">
                  {MOCK_SESSIONS.map((sess) => {
                    const DevIcon = DEVICE_ICON[sess.device_type] || FiMonitor;
                    return (
                      <div key={sess.session_id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                        <DevIcon size={15} className="shrink-0 text-slate-400" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-700">
                            {sess.browser}
                            <span className="ml-2 font-mono text-[10px] text-slate-400">{sess.ip}</span>
                            <span className="ml-1 text-[11px]">{countryFlag(sess.country)}</span>
                          </p>
                          <p className="text-[10px] text-slate-400">Last active {relativeTime(sess.last_activity)}</p>
                        </div>
                        <button
                          onClick={() => showToast('Session revoked.', 'success')}
                          className="shrink-0 rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-500 hover:bg-rose-100 transition-colors"
                          title="Revoke session"
                        >
                          <FiX size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setRevokeAllOpen(true)}
                    className="rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    Revoke all sessions
                  </button>
                </div>
              </Section>
            </div>
          ) : null}

          {/* ── TAB 2 — Platform Status ────────────────────────────────────── */}
          {activeTab === 'platform' ? (
            <div className="space-y-4">
              <Section title="Platform level">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <LevelBadge level={user.platformLevel} size="md" />
                    <span className="text-sm text-slate-400">{user.xp.current.toLocaleString()} / {user.xp.next.toLocaleString()} XP</span>
                  </div>
                  <button
                    onClick={() => isSuperAdmin && setLevelOverrideOpen(true)}
                    disabled={!isSuperAdmin}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FiEdit2 size={12} className="inline mr-1" /> Override level
                    <span className="ml-1 text-[10px] text-amber-500">(super admin)</span>
                  </button>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 border border-slate-200">
                  <div className={`h-2.5 rounded-full transition-all ${levelMeta.dot}`} style={{ width: `${xpPct}%` }} />
                </div>
                <p className="mt-1 text-xs text-slate-400">{xpPct}% to next level</p>
              </Section>

              <Section title="Trust score">
                <div className="flex items-center gap-4 mb-4">
                  <TrustScoreWidget score={user.trustScore} size="lg" />
                  <div className="flex-1 h-3 rounded-full bg-slate-100 border border-slate-200">
                    <div
                      className={`h-3 rounded-full ${user.trustScore < 3 ? 'bg-rose-400' : user.trustScore <= 6 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                      style={{ width: `${(user.trustScore / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">/ 10.0</span>
                </div>

                <div className="space-y-3">
                  {TRUST_COMPONENTS.map((comp) => {
                    const val     = user.trustBreakdown[comp.key] ?? 0;
                    const absVal  = Math.abs(val);
                    const fillPct = (absVal / comp.maxPts) * 100;
                    const barColor = comp.penalty
                      ? (val !== 0 ? '#F43F5E' : '#CBD5E1')
                      : (fillPct >= 80 ? '#10B981' : fillPct >= 50 ? '#6366F1' : '#F59E0B');
                    return (
                      <div key={comp.key}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-700">{comp.label}</span>
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md border ${comp.penalty ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                              {comp.weight}
                            </span>
                          </div>
                          <span className={`text-xs font-black tabular-nums ${comp.penalty && val !== 0 ? 'text-rose-500' : 'text-slate-800'}`}>
                            {comp.penalty && val !== 0 ? `−${absVal}` : `+${val}`} / {comp.maxPts}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${fillPct}%`, background: barColor }} />
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between border-t border-slate-200 pt-3 mt-1">
                    <span className="text-sm font-bold text-slate-700">Total score</span>
                    <span className={`text-lg font-black tabular-nums ${totalTrust < 30 ? 'text-rose-500' : totalTrust <= 60 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {totalTrust} pts
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleRecalculate}
                  disabled={isRecalculating || impersonating}
                  className="mt-3 flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiRefreshCw size={12} className={isRecalculating ? 'animate-spin' : ''} />
                  {isRecalculating ? 'Recalculating…' : 'Recalculate Trust Score'}
                </button>
              </Section>

              {/* Manual Trust Adjustment */}
              <Section title="Manual trust adjustment">
                <p className="text-xs text-slate-500 mb-3">
                  Adjustments are logged in the audit trail.{' '}
                  {isSuperAdmin
                    ? 'Super Admin: ±2.0 max per action.'
                    : 'Admin: ±0.5 max per action.'}
                </p>
                <div className="flex gap-3 items-start">
                  <div className="admin-field flex-shrink-0 w-32">
                    <span className="admin-label">Adjustment</span>
                    <input
                      type="number"
                      step="0.1"
                      min={-maxAdjust}
                      max={maxAdjust}
                      className="admin-input"
                      value={trustAdjustValue}
                      onChange={e => setTrustAdjustValue(e.target.value)}
                      placeholder="e.g. +0.5"
                    />
                  </div>
                  <div className="admin-field flex-1">
                    <span className="admin-label">Reason (required)</span>
                    <input
                      className="admin-input"
                      value={trustAdjustReason}
                      onChange={e => setTrustAdjustReason(e.target.value)}
                      placeholder="Explain the reason for adjustment…"
                    />
                  </div>
                </div>
                <button
                  className="admin-btn mt-3"
                  disabled={
                    !trustAdjustReason.trim() ||
                    !trustAdjustValue ||
                    Math.abs(parseFloat(trustAdjustValue)) > maxAdjust
                  }
                  onClick={async () => {
                    try {
                      await core.patch(`/admin/users/${id}/trust`, { adjustment: parseFloat(trustAdjustValue), reason: trustAdjustReason });
                      showToast(`Trust score adjusted by ${trustAdjustValue}. Logged in audit.`, 'success');
                    } catch {
                      showToast('Trust adjustment failed.', 'error');
                    }
                    setTrustAdjustValue('');
                    setTrustAdjustReason('');
                  }}
                >
                  Apply adjustment
                </button>
              </Section>

              <Section title="Account status">
                <div className="flex flex-wrap gap-2">
                  {['Active', 'Suspended', 'Banned'].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        if (s === 'Suspended') { setSuspendOpen(true); return; }
                        if (s === 'Banned')    { setBanOpen(true); return; }
                        showToast(`Account set to ${s}.`, 'success');
                      }}
                      className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${user.status === s ? (STATUS_META[s]?.color || '') + ' ring-2 ring-offset-1 ring-current' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </Section>
            </div>
          ) : null}

          {/* ── TAB 3 — Sub-Profiles ──────────────────────────────────────── */}
          {activeTab === 'subprofiles' ? (
            <div className="space-y-3">
              {user.subProfiles.length === 0 ? (
                <Section>
                  <p className="text-sm text-slate-400 py-4 text-center">No sub-profiles created for this user.</p>
                </Section>
              ) : (
                user.subProfiles.map((sp) => {
                  const meta = DOMAIN_META[sp.domain] || { label: sp.domain, color: 'bg-slate-100 text-slate-500 border-slate-200' };
                  return (
                    <div key={sp.domain} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${meta.color}`}>{meta.label}</span>
                          <span className="font-semibold text-slate-800">@{sp.username}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{sp.skillCount} skills · {sp.verifiedSkills} verified</span>
                          <span>· Edited {sp.lastEdited.slice(0, 10)}</span>
                          <button className="rounded-lg border border-slate-200 px-2.5 py-1 text-indigo-600 hover:bg-indigo-50 transition-colors font-medium">
                            <FiEye size={11} className="inline mr-1" /> View
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <input
                          value={flagReasons[sp.domain] || ''}
                          onChange={(e) => setFlagReasons((prev) => ({ ...prev, [sp.domain]: e.target.value }))}
                          placeholder="Flag reason…"
                          className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-rose-400"
                        />
                        <button
                          onClick={() => { showToast('Sub-profile flagged for review.', 'success'); setFlagReasons((p) => ({ ...p, [sp.domain]: '' })); }}
                          disabled={!flagReasons[sp.domain]?.trim()}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-40"
                        >
                          <FiFlag size={11} className="inline mr-1" /> Flag for review
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : null}

          {/* ── TAB 4 — Activity ──────────────────────────────────────────── */}
          {activeTab === 'activity' ? (
            <div className="space-y-4">
              <Section title="Activity summary">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {[
                    { label: 'Posts',             value: user.stats.posts             },
                    { label: 'Reports filed',     value: user.stats.reportsFiled      },
                    { label: 'Reports received',  value: user.stats.reportsReceived   },
                    { label: 'Events attended',   value: user.stats.eventsAttended    },
                    { label: 'Collabs completed', value: user.stats.collabsCompleted  },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                      <p className="text-2xl font-black text-slate-800">{stat.value}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400 uppercase tracking-wide">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Login frequency — last 30 days">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={loginData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} interval={4} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} allowDecimals={false} />
                    <ReTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} />
                    <Bar dataKey="logins" fill="#6366f1" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            </div>
          ) : null}

        </div>{/* end main content */}

        {/* ── Sticky actions panel ──────────────────────────────────────────── */}
        <aside className="w-64 shrink-0 sticky top-6 space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Admin actions</p>
            <div className="space-y-1.5">

              <ActionBtn icon={<FiBell size={14} />} label="Send notification" onClick={() => setNotifOpen(true)} blocked={impersonating} />
              <ActionBtn icon={<FiLock size={14} />} label="Suspend account" onClick={() => setSuspendOpen(true)} tone="warning" blocked={impersonating} />

              {/* Ban — Super Admin only */}
              {isSuperAdmin ? (
                <ActionBtn icon={<FiSlash size={14} />} label="Ban account" onClick={() => setBanOpen(true)} tone="danger" blocked={impersonating} />
              ) : (
                <ActionBtn icon={<FiSlash size={14} />} label="Ban account" sub="Super Admin required" blocked={true} />
              )}

              <ActionBtn icon={<FiKey size={14} />} label="Reset 2FA" onClick={() => setReset2FAOpen(true)} blocked={impersonating} />

              {/* Impersonate — Super Admin only */}
              {isSuperAdmin && (
                <ActionBtn
                  icon={<FiEye size={14} />}
                  label={impersonating ? 'Impersonating…' : 'View as this user'}
                  onClick={impersonating ? exitImpersonation : handleImpersonate}
                  sub={impersonating ? `Expires in ${fmtCountdown(impersonationSecsLeft)}` : '15-min session'}
                  tone={impersonating ? 'warning' : undefined}
                />
              )}

              <ActionBtn
                icon={<FiDownload size={14} />}
                label="Generate GDPR export"
                onClick={() => setGdprOpen(true)}
                sub="72h SLA"
                blocked={impersonating}
              />

              {/* Merge Accounts — Super Admin only */}
              {isSuperAdmin && (
                <ActionBtn
                  icon={<FiGitMerge size={14} />}
                  label="Merge accounts"
                  sub="Super Admin only"
                  onClick={() => setMergeOpen(true)}
                  blocked={impersonating}
                />
              )}

              <ActionBtn icon={<FiTrash2 size={14} />} label="Delete account" onClick={() => setDeleteOpen(true)} tone="danger" blocked={impersonating} />
            </div>
          </div>
        </aside>

      </div>{/* end 2-column layout */}

      {/* ── Send Notification modal ──────────────────────────────────────────── */}
      {notifOpen && (
        <AdminModal title="Send Platform Notification" onClose={() => setNotifOpen(false)}>
          <textarea rows={4} value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} placeholder="Notification message…" className="admin-textarea" />
          <label className="mt-3 flex items-center gap-2 cursor-pointer text-sm text-slate-600">
            <input type="checkbox" checked={notifEmail} onChange={(e) => setNotifEmail(e.target.checked)} className="accent-indigo-500" />
            Also send via email
          </label>
          <div className="mt-4 flex justify-end gap-2">
            <button className="admin-btn admin-btn--ghost" onClick={() => setNotifOpen(false)}>Cancel</button>
            <button className="admin-btn" disabled={!notifMessage.trim()} onClick={async () => {
              try {
                await core.post(`/admin/users/${id}/notify`, { message: notifMessage, send_email: notifEmail });
                showToast('Notification sent.', 'success');
              } catch { showToast('Notification failed.', 'error'); }
              setNotifOpen(false); setNotifMessage('');
            }}>Send</button>
          </div>
        </AdminModal>
      )}

      {/* ── Suspend modal ────────────────────────────────────────────────────── */}
      {suspendOpen && (
        <AdminModal title={`Suspend @${user.username}`} onClose={() => setSuspendOpen(false)}>
          <div className="space-y-3">
            <div className="admin-field">
              <span className="admin-label">Duration</span>
              <select className="admin-select" value={suspendDuration} onChange={(e) => setSuspendDuration(e.target.value)}>
                {['1d', '3d', '7d', '30d', 'Custom'].map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="admin-field">
              <span className="admin-label">Reason</span>
              <textarea className="admin-textarea" rows={3} value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} placeholder="Moderation context…" />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button className="admin-btn admin-btn--ghost" onClick={() => setSuspendOpen(false)}>Cancel</button>
            <button className="admin-btn !border-amber-500 !bg-amber-500 disabled:opacity-40" disabled={!suspendReason.trim()} onClick={async () => {
              const days = { '1d': 1, '3d': 3, '7d': 7, '30d': 30 }[suspendDuration] || 1;
              try {
                await core.post(`/admin/users/${id}/suspend`, { duration_days: days, reason: suspendReason });
                showToast(`Suspended for ${suspendDuration}.`, 'success');
              } catch { showToast('Suspension failed.', 'error'); }
              setSuspendOpen(false); setSuspendReason('');
            }}>Confirm</button>
          </div>
        </AdminModal>
      )}

      {/* ── Ban modal ────────────────────────────────────────────────────────── */}
      {banOpen && (
        <AdminModal title={`Ban @${user.username}`} onClose={() => { setBanOpen(false); setBanConfirmText(''); setBanReason(''); }}>
          <div className="space-y-3">
            <div className="admin-field">
              <span className="admin-label">Reason</span>
              <textarea className="admin-textarea" rows={3} value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="Moderation context…" />
            </div>
            <p className="text-xs text-slate-500">This user has a <strong>14-day appeal window</strong>.</p>
            <div className="admin-field">
              <span className="admin-label">Type "I confirm this ban" to proceed</span>
              <input className="admin-input" value={banConfirmText} onChange={(e) => setBanConfirmText(e.target.value)} placeholder="I confirm this ban" />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button className="admin-btn admin-btn--ghost" onClick={() => { setBanOpen(false); setBanConfirmText(''); setBanReason(''); }}>Cancel</button>
            <button className="admin-btn !border-rose-600 !bg-rose-600 disabled:opacity-40" disabled={banConfirmText !== 'I confirm this ban' || !banReason.trim()} onClick={async () => {
              try {
                await core.post(`/admin/users/${id}/ban`, { reason: banReason });
                showToast('User banned.', 'success');
              } catch { showToast('Ban failed.', 'error'); }
              setBanOpen(false); setBanConfirmText(''); setBanReason('');
            }}>
              Confirm Ban
            </button>
          </div>
        </AdminModal>
      )}

      {/* ── Reset 2FA modal ──────────────────────────────────────────────────── */}
      {reset2FAOpen && (
        <AdminModal title="Reset 2FA" onClose={() => setReset2FAOpen(false)}>
          <p className="text-sm text-slate-600">This will force @{user.username} to re-enroll their two-factor authentication on next login. Continue?</p>
          <div className="mt-4 flex justify-end gap-2">
            <button className="admin-btn admin-btn--ghost" onClick={() => setReset2FAOpen(false)}>Cancel</button>
            <button className="admin-btn" onClick={async () => {
              try {
                await core.post(`/admin/users/${id}/reset-2fa`);
                showToast('2FA reset. User will re-enroll on next login.', 'success');
              } catch { showToast('2FA reset failed.', 'error'); }
              setReset2FAOpen(false);
            }}>Confirm Reset</button>
          </div>
        </AdminModal>
      )}

      {/* ── Delete account modal ─────────────────────────────────────────────── */}
      {deleteOpen && (
        <AdminModal title="Delete Account" onClose={() => { setDeleteOpen(false); setHardDeleteConfirm(''); }}>
          <div className="space-y-3">
            <div className="flex gap-2">
              <button onClick={() => setDeleteMode('soft')} className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition-colors ${deleteMode === 'soft' ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500'}`}>
                Soft delete
                <p className="text-[10px] font-normal text-slate-400 mt-0.5">Anonymise · 30-day recovery</p>
              </button>
              {/* Hard delete — Super Admin only */}
              {isSuperAdmin && (
                <button onClick={() => setDeleteMode('hard')} className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition-colors ${deleteMode === 'hard' ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-500'}`}>
                  Hard delete
                  <p className="text-[10px] font-normal text-slate-400 mt-0.5">Super admin · Permanent</p>
                </button>
              )}
            </div>
            {deleteMode === 'hard' && isSuperAdmin && (
              <div className="admin-field">
                <span className="admin-label">Type username to confirm hard delete</span>
                <input className="admin-input" value={hardDeleteConfirm} onChange={(e) => setHardDeleteConfirm(e.target.value)} placeholder={user.username} />
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button className="admin-btn admin-btn--ghost" onClick={() => { setDeleteOpen(false); setHardDeleteConfirm(''); }}>Cancel</button>
            <button
              className="admin-btn !border-rose-600 !bg-rose-600 disabled:opacity-40"
              disabled={deleteMode === 'hard' && hardDeleteConfirm !== user.username}
              onClick={() => { showToast(`Account ${deleteMode === 'hard' ? 'permanently deleted' : 'anonymised — recoverable for 30 days'}.`, 'success'); setDeleteOpen(false); navigate('/admin/users'); }}
            >
              {deleteMode === 'hard' ? 'Permanently Delete' : 'Soft Delete'}
            </button>
          </div>
        </AdminModal>
      )}

      {/* ── GDPR confirmation modal ───────────────────────────────────────────── */}
      {gdprOpen && (
        <AdminModal title={`Trigger GDPR data export for @${user.username}?`} onClose={() => setGdprOpen(false)}>
          <p className="text-sm text-slate-600">
            A ZIP containing all their data will be sent to{' '}
            <strong className="text-slate-800">{user.email}</strong> within 72 hours.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button className="admin-btn admin-btn--ghost" onClick={() => setGdprOpen(false)}>Cancel</button>
            <button className="admin-btn" onClick={() => { handleExport(); setGdprOpen(false); }}>
              Confirm export
            </button>
          </div>
        </AdminModal>
      )}

      {/* ── Merge Accounts modal ─────────────────────────────────────────────── */}
      {mergeOpen && (
        <AdminModal title={`Merge @${user.username} into another account`} onClose={() => { setMergeOpen(false); setMergeTarget(''); setMergeConfirm(''); }}>
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-xs font-semibold text-rose-700">
              ⚠ This is irreversible. The current account's username will be flagged as merged. All data migrates to the target account.
            </p>
          </div>
          <div className="space-y-3">
            <div className="admin-field">
              <span className="admin-label">Target username (merge INTO)</span>
              <input className="admin-input" value={mergeTarget} onChange={e => setMergeTarget(e.target.value)} placeholder="@username" />
            </div>
            <div className="admin-field">
              <span className="admin-label">Type "MERGE" to confirm</span>
              <input className="admin-input" value={mergeConfirm} onChange={e => setMergeConfirm(e.target.value)} placeholder="MERGE" />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button className="admin-btn admin-btn--ghost" onClick={() => { setMergeOpen(false); setMergeTarget(''); setMergeConfirm(''); }}>Cancel</button>
            <button
              className="admin-btn !border-rose-600 !bg-rose-600 disabled:opacity-40"
              disabled={!mergeTarget.trim() || mergeConfirm !== 'MERGE'}
              onClick={() => { showToast('Merge queued. This may take several minutes.', 'success'); setMergeOpen(false); setMergeTarget(''); setMergeConfirm(''); }}
            >
              Confirm merge
            </button>
          </div>
        </AdminModal>
      )}

      {/* ── Revoke all sessions confirmation ─────────────────────────────────── */}
      {revokeAllOpen && (
        <AdminModal title="Revoke all sessions?" onClose={() => setRevokeAllOpen(false)}>
          <p className="text-sm text-slate-600">
            Are you sure? All devices will be signed out immediately.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button className="admin-btn admin-btn--ghost" onClick={() => setRevokeAllOpen(false)}>Cancel</button>
            <button className="admin-btn !border-rose-600 !bg-rose-600" onClick={() => { showToast('All sessions revoked.', 'success'); setRevokeAllOpen(false); }}>
              Revoke all
            </button>
          </div>
        </AdminModal>
      )}

      {/* ── Impersonation warning modal ───────────────────────────────────────── */}
      {impersonateWarnOpen && (
        <AdminModal title="Enter Impersonation Mode?" onClose={() => setImpersonateWarnOpen(false)}>
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-800">
              ⚠ You are entering read-only impersonation mode for @{user.username}. No actions can be taken on their behalf. All activity is logged and audited.
            </p>
          </div>
          <p className="text-xs text-slate-500">Session expires automatically after 15 minutes.</p>
          <div className="mt-4 flex justify-end gap-2">
            <button className="admin-btn admin-btn--ghost" onClick={() => setImpersonateWarnOpen(false)}>Cancel</button>
            <button className="admin-btn !border-amber-500 !bg-amber-500" onClick={handleConfirmImpersonate}>
              Confirm — Enter Read-Only Mode
            </button>
          </div>
        </AdminModal>
      )}

      {/* ── Platform Level Override modal ─────────────────────────────────────── */}
      {levelOverrideOpen && (
        <AdminModal title="Override Platform Level" onClose={() => { setLevelOverrideOpen(false); setLevelOverrideValue(''); setLevelOverrideReason(''); }}>
          <div className="space-y-3">
            <div className="admin-field">
              <span className="admin-label">New Level</span>
              <select className="admin-select" value={levelOverrideValue} onChange={(e) => setLevelOverrideValue(e.target.value)}>
                <option value="">Select level…</option>
                {['Beginner', 'Casual', 'Hustler', 'Pro', 'Extreme', 'Legend'].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <span className="admin-label">Override reason (logged in audit)</span>
              <textarea className="admin-textarea" rows={2} value={levelOverrideReason} onChange={(e) => setLevelOverrideReason(e.target.value)} placeholder="Reason for manual override…" />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button className="admin-btn admin-btn--ghost" onClick={() => { setLevelOverrideOpen(false); setLevelOverrideValue(''); setLevelOverrideReason(''); }}>Cancel</button>
            <button
              className="admin-btn disabled:opacity-40"
              disabled={!levelOverrideValue || !levelOverrideReason.trim()}
              onClick={async () => {
                try {
                  await core.patch(`/admin/users/${id}`, { platform_level: levelOverrideValue, override_reason: levelOverrideReason });
                  showToast(`Level overridden to ${levelOverrideValue}.`, 'success');
                } catch { showToast('Level override failed.', 'error'); }
                setLevelOverrideOpen(false); setLevelOverrideValue(''); setLevelOverrideReason('');
              }}
            >
              Apply Override
            </button>
          </div>
        </AdminModal>
      )}

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared modal wrapper
// ─────────────────────────────────────────────────────────────────────────────

function AdminModal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
            <FiX size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Action button
// ─────────────────────────────────────────────────────────────────────────────

function ActionBtn({ icon, label, onClick, tone, sub, blocked }) {
  const toneClass = tone === 'danger'
    ? 'text-rose-600 hover:bg-rose-50 hover:border-rose-200'
    : tone === 'warning'
    ? 'text-amber-600 hover:bg-amber-50 hover:border-amber-200'
    : 'text-slate-600 hover:bg-slate-50 hover:border-slate-300';
  return (
    <button
      onClick={blocked ? undefined : onClick}
      disabled={blocked}
      title={blocked ? 'Write operations are blocked during impersonation' : undefined}
      className={`flex w-full items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium transition-colors ${toneClass} disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 text-left leading-tight">
        {label}
        {sub ? <span className="block text-[10px] text-slate-400">{sub}</span> : null}
      </span>
    </button>
  );
}
