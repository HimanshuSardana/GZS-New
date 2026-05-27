import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch, FiSliders, FiX, FiEye, FiSlash, FiLock, FiKey, FiBell,
  FiCopy, FiCheck, FiChevronUp, FiChevronDown,
} from 'react-icons/fi';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import { useToast } from '@/shared/components/Toast';
import { AdminPageHero, AdminPanel } from '../components/AdminContentShell';
import LevelBadge       from '@/shared/components/LevelBadge';
import TrustScoreWidget from '@/shared/components/TrustScoreWidget';
import {
  MOCK_ADMIN_USERS, LEVEL_META, STATUS_META, maskEmail, relativeTime,
} from '@/shared/data/adminData';

const DOMAINS = ['dev', 'esports', 'art', 'content', 'business', 'writing', 'audio', 'general'];
const BRANCHES = ['All', 'dev', 'esports', 'art', 'content', 'business', 'writing', 'audio'];
const SORT_COLS = ['username', 'platformLevel', 'trustScore', 'subProfiles', 'status', 'joinedAt', 'lastActiveAt'];

function CopiedId({ uuid }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(uuid).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-[10px] text-slate-500">{uuid.slice(0, 8)}…</span>
      <button onClick={copy} title="Copy UUID" className="p-0.5 text-slate-500 hover:text-white transition-colors">
        {copied ? <FiCheck size={11} className="text-emerald-400" /> : <FiCopy size={11} />}
      </button>
    </div>
  );
}

function Tooltip({ label, children }) {
  return (
    <span className="relative group/tip">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tip:block whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-200 shadow-lg z-50">
        {label}
      </span>
    </span>
  );
}
function SortBtn({ col, active, sortDir, onSort }) {
  return (
    <button onClick={() => onSort(col)} className="inline-flex items-center gap-0.5 align-middle">
      {active && sortDir === 'asc' ? (
        <FiChevronUp size={12} className="text-indigo-400" />
      ) : active && sortDir === 'desc' ? (
        <FiChevronDown size={12} className="text-indigo-400" />
      ) : (
        <FiChevronDown size={12} className="opacity-20" />
      )}
    </button>
  );
}


export default function UsersManagement() {
  usePageTheme('admin');
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilters, setStatusFilters] = useState([]);
  const [levelFilters, setLevelFilters] = useState([]);
  const [trustMin, setTrustMin] = useState(0);
  const [trustMax, setTrustMax] = useState(10);
  const [domainFilters, setDomainFilters] = useState([]);
  const [joinedFrom, setJoinedFrom] = useState('');
  const [joinedTo, setJoinedTo] = useState('');
  const [lastActiveFrom, setLastActiveFrom] = useState('');
  const [lastActiveTo, setLastActiveTo] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [sortCol, setSortCol] = useState('joinedAt');
  const [sortDir, setSortDir] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Modal state
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [suspendDuration, setSuspendDuration] = useState('1d');
  const [suspendReason, setSuspendReason] = useState('');
  const [banTarget, setBanTarget] = useState(null);
  const [banConfirmText, setBanConfirmText] = useState('');
  const [banReason, setBanReason] = useState('');
  const [notifTarget, setNotifTarget] = useState(null);
  const [notifMessage, setNotifMessage] = useState('');
  const [notifSendEmail, setNotifSendEmail] = useState(false);

  function toggleFilter(setter, value) {
    setter((prev) => prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]);
  }

  function handleSort(col) {
    if (sortCol === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }

  const users = useMemo(() => {
    let result = MOCK_ADMIN_USERS.filter((u) => {
      const q = search.toLowerCase();
      const searchMatch = !q || u.username.includes(q) || u.email.toLowerCase().includes(q) || u.uuid.includes(q);
      const statusMatch = !statusFilters.length || statusFilters.includes(u.status);
      const levelMatch = !levelFilters.length || levelFilters.includes(u.platformLevel);
      const trustMatch = u.trustScore >= trustMin && u.trustScore <= trustMax;
      const domainMatch = !domainFilters.length || domainFilters.every((d) => u.subProfiles.some((sp) => sp.domain === d));
      const joinedMatch = (!joinedFrom || new Date(u.joinedAt) >= new Date(joinedFrom)) && (!joinedTo || new Date(u.joinedAt) <= new Date(joinedTo));
      const activeMatch = (!lastActiveFrom || new Date(u.lastActiveAt) >= new Date(lastActiveFrom)) && (!lastActiveTo || new Date(u.lastActiveAt) <= new Date(lastActiveTo));
      const branchMatch = branchFilter === 'All' || u.branchMemberships.includes(branchFilter);
      return searchMatch && statusMatch && levelMatch && trustMatch && domainMatch && joinedMatch && activeMatch && branchMatch;
    });

    result = [...result].sort((a, b) => {
      let av = a[sortCol];
      let bv = b[sortCol];
      if (sortCol === 'subProfiles') { av = a.subProfiles.length; bv = b.subProfiles.length; }
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      return sortDir === 'asc' ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0);
    });

    return result;
  }, [search, statusFilters, levelFilters, trustMin, trustMax, domainFilters, joinedFrom, joinedTo, lastActiveFrom, lastActiveTo, branchFilter, sortCol, sortDir]);


  function handleSuspendSubmit() {
    showToast(`${suspendTarget.username} suspended for ${suspendDuration}.`, 'success');
    setSuspendTarget(null); setSuspendDuration('1d'); setSuspendReason('');
  }

  function handleBanSubmit() {
    if (banConfirmText !== 'I confirm this ban') return;
    showToast(`${banTarget.username} has been banned.`, 'success');
    setBanTarget(null); setBanConfirmText(''); setBanReason('');
  }

  function handleNotifSubmit() {
    showToast(`Notification sent to ${notifTarget.username}.`, 'success');
    setNotifTarget(null); setNotifMessage(''); setNotifSendEmail(false);
  }

  const activeFilterCount = statusFilters.length + levelFilters.length + domainFilters.length + (joinedFrom || joinedTo ? 1 : 0) + (lastActiveFrom || lastActiveTo ? 1 : 0) + (branchFilter !== 'All' ? 1 : 0) + (trustMin > 0 || trustMax < 10 ? 1 : 0);

  return (
    <div className="admin-page-shell admin-table-page">
      <Helmet><title>Users Management | GzoneSphere Admin</title></Helmet>

      <AdminPageHero
        kicker="Users"
        title="Users Management"
        description="Review account health, trust scores, and moderation actions across the platform."
      />

      <AdminPanel title="User Directory" meta={`${users.length} users · Search, filter, and moderate accounts`}>

        {/* Top bar */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex flex-1 min-w-[200px] items-center gap-2 admin-input px-3">
            <FiSearch size={14} className="text-[var(--theme-text-muted)] shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search username, email, or user ID…"
              className="w-full bg-transparent text-sm text-[var(--theme-text)] outline-none placeholder:text-[var(--theme-text-muted)]"
            />
            {search ? <button onClick={() => setSearch('')}><FiX size={13} className="text-[var(--theme-text-muted)]" /></button> : null}
          </div>

          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`admin-btn ${showFilters ? 'bg-[var(--theme-primary-soft)] text-[var(--theme-primary)] border-[var(--theme-primary)]' : ''}`}
          >
            <FiSliders size={14} />
            Filters
            {activeFilterCount > 0 ? <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--theme-primary)] text-[10px] text-white">{activeFilterCount}</span> : null}
          </button>

          {/* Sort col select */}
          <select
            value={sortCol}
            onChange={(e) => setSortCol(e.target.value)}
            className="admin-select text-sm"
          >
            <option value="joinedAt">Sort: Joined</option>
            <option value="lastActiveAt">Sort: Last active</option>
            <option value="trustScore">Sort: Trust score</option>
            <option value="username">Sort: Username</option>
            <option value="subProfiles">Sort: Sub-profiles</option>
          </select>
          <button
            onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')}
            className="admin-btn"
          >
            {sortDir === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>
        </div>

        {/* Expanded filter panel */}
        {showFilters ? (
          <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

              {/* Account status */}
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--theme-text-muted)]">Account status</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Active', 'Suspended', 'Banned', 'Pending verification'].map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleFilter(setStatusFilters, s)}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${statusFilters.includes(s) ? 'border-[var(--theme-primary)] bg-[var(--theme-primary-soft)] text-[var(--theme-primary)]' : 'border-[var(--theme-border)] bg-[var(--theme-card)] text-[var(--theme-text-muted)]'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform level */}
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Platform level</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Beginner', 'Hustler', 'Extreme', 'Pro'].map((l) => (
                    <button
                      key={l}
                      onClick={() => toggleFilter(setLevelFilters, l)}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${levelFilters.includes(l) ? 'border-indigo-400 bg-indigo-100 text-indigo-700' : 'border-slate-300 bg-white text-slate-500'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trust score range */}
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Trust score: {trustMin.toFixed(1)} – {trustMax.toFixed(1)}
                </p>
                <div className="space-y-1.5">
                  <input type="range" min={0} max={10} step={0.1} value={trustMin} onChange={(e) => setTrustMin(Number(e.target.value))} className="w-full accent-indigo-500" />
                  <input type="range" min={0} max={10} step={0.1} value={trustMax} onChange={(e) => setTrustMax(Number(e.target.value))} className="w-full accent-indigo-500" />
                </div>
              </div>

              {/* Branch membership */}
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Branch membership</p>
                <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="admin-select w-full text-sm">
                  {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              {/* Sub-profile type */}
              <div className="sm:col-span-2">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Has sub-profile in</p>
                <div className="flex flex-wrap gap-1.5">
                  {DOMAINS.map((d) => (
                    <label key={d} className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-600 transition-colors hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={domainFilters.includes(d)}
                        onChange={() => toggleFilter(setDomainFilters, d)}
                        className="accent-indigo-500"
                      />
                      {d}
                    </label>
                  ))}
                </div>
              </div>

              {/* Joined date range */}
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Joined between</p>
                <div className="flex gap-1.5">
                  <input type="date" value={joinedFrom} onChange={(e) => setJoinedFrom(e.target.value)} className="flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 outline-none" />
                  <input type="date" value={joinedTo} onChange={(e) => setJoinedTo(e.target.value)} className="flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 outline-none" />
                </div>
              </div>

              {/* Last active range */}
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Last active between</p>
                <div className="flex gap-1.5">
                  <input type="date" value={lastActiveFrom} onChange={(e) => setLastActiveFrom(e.target.value)} className="flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 outline-none" />
                  <input type="date" value={lastActiveTo} onChange={(e) => setLastActiveTo(e.target.value)} className="flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 outline-none" />
                </div>
              </div>
            </div>

            {activeFilterCount > 0 ? (
              <button
                onClick={() => { setStatusFilters([]); setLevelFilters([]); setDomainFilters([]); setTrustMin(0); setTrustMax(10); setJoinedFrom(''); setJoinedTo(''); setLastActiveFrom(''); setLastActiveTo(''); setBranchFilter('All'); }}
                className="text-xs text-slate-400 underline hover:text-slate-600"
              >
                Clear all filters
              </button>
            ) : null}
          </div>
        ) : null}

        {/* Table */}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="w-36">User ID <SortBtn col="username" active={sortCol === 'username'} sortDir={sortDir} onSort={handleSort} /></th>
                <th>User <SortBtn col="username" active={sortCol === 'username'} sortDir={sortDir} onSort={handleSort} /></th>
                <th>Email</th>
                <th>Level <SortBtn col="platformLevel" active={sortCol === 'platformLevel'} sortDir={sortDir} onSort={handleSort} /></th>
                <th>Trust <SortBtn col="trustScore" active={sortCol === 'trustScore'} sortDir={sortDir} onSort={handleSort} /></th>
                <th>Sub-profiles <SortBtn col="subProfiles" active={sortCol === 'subProfiles'} sortDir={sortDir} onSort={handleSort} /></th>
                <th>Status <SortBtn col="status" active={sortCol === 'status'} sortDir={sortDir} onSort={handleSort} /></th>
                <th>Joined <SortBtn col="joinedAt" active={sortCol === 'joinedAt'} sortDir={sortDir} onSort={handleSort} /></th>
                <th>Last active <SortBtn col="lastActiveAt" active={sortCol === 'lastActiveAt'} sortDir={sortDir} onSort={handleSort} /></th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const _statusMeta = STATUS_META[user.status] || STATUS_META.Active;
                return (
                  <tr key={user.id}>
                    {/* UUID */}
                    <td><CopiedId uuid={user.uuid} /></td>

                    {/* Username + avatar */}
                    <td>
                      <button onClick={() => navigate(`/admin/users/${user.id}`)} className="flex items-center gap-2.5 text-left hover:text-indigo-600 transition-colors group">
                        <img src={user.avatarUrl} alt={user.username} className="h-8 w-8 rounded-full object-cover" />
                        <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">@{user.username}</span>
                      </button>
                    </td>

                    {/* Masked email */}
                    <td className="font-mono text-xs text-slate-500">{maskEmail(user.email)}</td>

                    {/* Platform level badge — Part 11 */}
                    <td><LevelBadge level={user.platformLevel} size="sm" /></td>

                    {/* Trust score — Part 11 */}
                    <td><TrustScoreWidget score={user.trustScore} size="sm" /></td>

                    {/* Sub-profiles count */}
                    <td>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-slate-700">{user.subProfiles.length}</span>
                        <span className="text-xs text-slate-400">({user.subProfiles.map((sp) => sp.domain).join(', ') || '—'})</span>
                      </div>
                    </td>

                    {/* Account status pill */}
                    <td>
                      <span 
                        className="admin-status-badge"
                        style={
                          user.status === 'Active' 
                            ? { background: 'var(--status-success-bg)', color: 'var(--status-success-text)' }
                            : user.status === 'Suspended' || user.status === 'Banned'
                            ? { background: 'var(--status-danger-bg)', color: 'var(--status-danger-text)' }
                            : { background: 'var(--status-draft-bg)', color: 'var(--status-draft-text)' }
                        }
                      >
                        {user.status}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="tabular-nums text-xs text-slate-500">{user.joinedAt.slice(0, 10)}</td>

                    {/* Last active */}
                    <td className="text-xs text-slate-500">{relativeTime(user.lastActiveAt)}</td>

                    {/* Actions */}
                    <td>
                      <div className="flex items-center gap-1">
                        <Tooltip label="View profile">
                          <button onClick={() => navigate(`/admin/users/${user.id}`)} className="admin-btn p-1.5">
                            <FiEye size={14} />
                          </button>
                        </Tooltip>
                        <Tooltip label="Suspend">
                          <button onClick={() => setSuspendTarget(user)} className="admin-btn p-1.5 text-amber-500">
                            <FiLock size={14} />
                          </button>
                        </Tooltip>
                        <Tooltip label="Ban">
                          <button onClick={() => setBanTarget(user)} className="admin-btn--danger p-1.5">
                            <FiSlash size={14} />
                          </button>
                        </Tooltip>
                        <Tooltip label="Reset password">
                          <button onClick={() => showToast(`Password reset email sent to ${user.username}.`, 'success')} className="admin-btn p-1.5">
                            <FiKey size={14} />
                          </button>
                        </Tooltip>
                        <Tooltip label="Send notification">
                          <button onClick={() => setNotifTarget(user)} className="admin-btn p-1.5">
                            <FiBell size={14} />
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!users.length ? (
                <tr><td colSpan={10} className="admin-table-empty">No users match the active filters.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </AdminPanel>

      {/* Suspend modal */}
      {suspendTarget ? (
        <Modal title={`Suspend @${suspendTarget.username}`} onClose={() => setSuspendTarget(null)}>
          <div className="space-y-4">
            <label className="admin-field">
              <span className="admin-label">Duration</span>
              <select className="admin-select" value={suspendDuration} onChange={(e) => setSuspendDuration(e.target.value)}>
                {['1d', '3d', '7d', '30d', 'Custom'].map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
            <label className="admin-field">
              <span className="admin-label">Reason</span>
              <textarea className="admin-textarea" rows={3} value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} placeholder="Moderation context…" />
            </label>
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <button className="admin-btn admin-btn--ghost" onClick={() => setSuspendTarget(null)}>Cancel</button>
            <button className="admin-btn--danger" style={{ background: 'var(--status-danger-bg)', color: 'var(--status-danger-text)', border: 'none' }} onClick={handleSuspendSubmit} disabled={!suspendReason.trim()}>
              Confirm Suspension
            </button>
          </div>
        </Modal>
      ) : null}

      {/* Ban modal */}
      {banTarget ? (
        <Modal title={`Ban @${banTarget.username}`} onClose={() => { setBanTarget(null); setBanConfirmText(''); setBanReason(''); }}>
          <div className="space-y-4">
            <label className="admin-field">
              <span className="admin-label">Reason</span>
              <textarea className="admin-textarea" rows={3} value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="Moderation context…" />
            </label>
            <p className="text-xs text-slate-500">This user has a <strong>14-day appeal window</strong> to contest this decision.</p>
            <label className="admin-field">
              <span className="admin-label">Type "I confirm this ban" to proceed</span>
              <input className="admin-input" value={banConfirmText} onChange={(e) => setBanConfirmText(e.target.value)} placeholder="I confirm this ban" />
            </label>
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <button className="admin-btn admin-btn--ghost" onClick={() => { setBanTarget(null); setBanConfirmText(''); setBanReason(''); }}>Cancel</button>
            <button
              className="admin-btn--danger"
              onClick={handleBanSubmit}
              disabled={banConfirmText !== 'I confirm this ban' || !banReason.trim()}
            >
              Confirm Ban
            </button>
          </div>
        </Modal>
      ) : null}

      {/* Notify modal */}
      {notifTarget ? (
        <Modal title={`Notify @${notifTarget.username}`} onClose={() => { setNotifTarget(null); setNotifMessage(''); setNotifSendEmail(false); }}>
          <div className="space-y-4">
            <label className="admin-field">
              <span className="admin-label">Message</span>
              <textarea className="admin-textarea" rows={4} value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} placeholder="Platform notification text…" />
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
              <input type="checkbox" checked={notifSendEmail} onChange={(e) => setNotifSendEmail(e.target.checked)} className="accent-indigo-500" />
              Also send via email
            </label>
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <button className="admin-btn admin-btn--ghost" onClick={() => setNotifTarget(null)}>Cancel</button>
            <button className="admin-btn" onClick={handleNotifSubmit} disabled={!notifMessage.trim()}>Send</button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function Modal({ title, onClose, children }) {
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
