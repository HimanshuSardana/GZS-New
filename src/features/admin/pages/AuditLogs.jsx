import { Fragment, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { FiChevronDown, FiChevronUp, FiDownload } from 'react-icons/fi';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import { AdminPageHero, AdminPanel } from '../components/AdminContentShell';
import { adminQueryFn } from '@/services/api/adminApi';

const ACTION_TYPES = [
  'all',
  'user.suspend',
  'skill.verify',
  'skill.reject',
  'tournament.create',
  'tournament.result',
  'content.publish',
  'content.archive',
];

const ENTITY_TYPES = ['all', 'user', 'skill', 'tournament', 'blog', 'game', 'contract'];
const SEVERITIES = ['all', 'INFO', 'WARN', 'ERROR'];

const LOGS = [
  {
    id: 'log-1',
    timestamp: '2026-04-26T09:10:00+05:30',
    actor: 'admin_jaya',
    role: 'Moderator',
    action: 'skill.verify',
    entity: 'proof:P1',
    before: { status: 'Pending', reviewer: null },
    after: { status: 'Approved', reviewer: 'admin_jaya' },
    severity: 'INFO',
  },
  {
    id: 'log-2',
    timestamp: '2026-04-25T18:22:00+05:30',
    actor: 'admin_ryan',
    role: 'Admin',
    action: 'user.suspend',
    entity: 'user:U3',
    before: { status: 'Active', strikeCount: 1 },
    after: { status: 'Suspended', duration: '7d', strikeCount: 2 },
    severity: 'WARN',
  },
  {
    id: 'log-3',
    timestamp: '2026-04-24T14:05:00+05:30',
    actor: 'admin_maya',
    role: 'Admin',
    action: 'tournament.create',
    entity: 'tournament:T99',
    before: { exists: false },
    after: { exists: true, title: 'Gzone Open Spring Cup' },
    severity: 'INFO',
  },
  {
    id: 'log-4',
    timestamp: '2026-04-23T11:45:00+05:30',
    actor: 'admin_jaya',
    role: 'Moderator',
    action: 'content.archive',
    entity: 'blog:203',
    before: { status: 'Published' },
    after: { status: 'Archived', reason: 'Outdated information' },
    severity: 'INFO',
  },
  {
    id: 'log-5',
    timestamp: '2026-04-22T16:30:00+05:30',
    actor: 'admin_ryan',
    role: 'Super Admin',
    action: 'user.ban',
    entity: 'user:U7',
    before: { account_status: 'active' },
    after: { account_status: 'banned' },
    severity: 'ERROR',
  },
  {
    id: 'log-6',
    timestamp: '2026-04-22T10:00:00+05:30',
    actor: 'admin_maya',
    role: 'Admin',
    action: 'content.publish',
    entity: 'blog:204',
    before: { status: 'Draft' },
    after: { status: 'Published' },
    severity: 'INFO',
  },
  {
    id: 'log-7',
    timestamp: '2026-04-21T14:00:00+05:30',
    actor: 'system',
    role: 'System',
    action: 'user.soft_delete',
    entity: 'user:U12',
    before: { account_status: 'active', username: 'test_user' },
    after: { account_status: 'deleted', username: 'deleted_a1b2c3d4', is_anonymised: true },
    severity: 'WARN',
  },
  {
    id: 'log-8',
    timestamp: '2026-04-20T09:00:00+05:30',
    actor: 'admin_jaya',
    role: 'Moderator',
    action: 'skill.request_info',
    entity: 'skill:S44',
    before: { status: 'pending' },
    after: { status: 'requesting_more_info', notes: 'Portfolio link is broken' },
    severity: 'INFO',
  },
];

function withinDateRange(timestamp, range) {
  if (range === 'all') {
    return true;
  }

  const now = new Date('2026-04-26T12:00:00+05:30').getTime();
  const target = new Date(timestamp).getTime();
  const diff = now - target;

  if (range === '24h') {
    return diff <= 24 * 60 * 60 * 1000;
  }

  if (range === '7d') {
    return diff <= 7 * 24 * 60 * 60 * 1000;
  }

  return diff <= 30 * 24 * 60 * 60 * 1000;
}

function getActionPillClass(action) {
  if (!action) return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  const a = action.toLowerCase();
  if (/\.(delete|ban|suspend|force_|hard_|soft_delete)/.test(a))
    return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
  if (/\.(create|publish|add|submit|register)/.test(a))
    return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
  if (/\.(update|adjust|edit|patch|change|request_info)/.test(a))
    return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  if (/\.(verify|approve|accept|unban)/.test(a))
    return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  if (/\.(reject|decline|deny)/.test(a))
    return 'bg-rose-500/10 text-rose-300 border border-rose-500/10';
  if (/\.(view|get|list|fetch)/.test(a))
    return 'bg-slate-500/10 text-slate-300 border border-slate-500/10';
  return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
}

function DiffPanel({ label, data, tone }) {
  const bgClass = tone === 'before'
    ? 'bg-rose-950/30 border-rose-500/20'
    : 'bg-emerald-950/30 border-emerald-500/20';
  const labelClass = tone === 'before' ? 'text-rose-400' : 'text-emerald-400';

  return (
    <div className={`rounded-2xl border p-4 ${bgClass}`}>
      <p className={`mb-3 text-[10px] font-black uppercase tracking-[0.18em] ${labelClass}`}>{label}</p>
      <dl className="space-y-1.5">
        {Object.entries(data || {}).map(([key, value]) => (
          <div key={key} className="grid grid-cols-[140px_1fr] gap-2 text-xs">
            <dt className="font-semibold text-[var(--theme-text-muted)] truncate">{key}</dt>
            <dd className="font-mono text-[var(--theme-text)] break-all">
              {value === null
                ? <span className="italic opacity-40">null</span>
                : value === false
                ? <span className="text-rose-400">false</span>
                : value === true
                ? <span className="text-emerald-400">true</span>
                : String(value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function AuditLogs() {
  usePageTheme('admin');

  const [actionFilter, setActionFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [actorFilter, setActorFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  const { data: apiLogs } = useQuery({
    queryKey: ['admin', 'audit-logs', { actionFilter, dateRange, actorFilter, entityFilter, severityFilter }],
    queryFn: adminQueryFn('/admin/audit', {
      action: actionFilter !== 'all' ? actionFilter : undefined,
      range: dateRange,
      actor: actorFilter || undefined,
      entity_type: entityFilter !== 'all' ? entityFilter : undefined,
      severity: severityFilter !== 'all' ? severityFilter : undefined,
    }),
    placeholderData: { logs: LOGS },
    retry: 1,
  });

  const allLogs = apiLogs?.logs ?? LOGS;

  const filteredLogs = useMemo(() => {
    if (apiLogs?.logs) return allLogs;
    const query = actorFilter.trim().toLowerCase();
    return LOGS.filter((log) => {
      const actionMatch = actionFilter === 'all' || log.action === actionFilter;
      const dateMatch = withinDateRange(log.timestamp, dateRange);
      const actorMatch = !query || log.actor.toLowerCase().includes(query);
      const entityMatch = entityFilter === 'all' || log.entity.startsWith(entityFilter);
      const severityMatch = severityFilter === 'all' || log.severity === severityFilter;
      return actionMatch && dateMatch && actorMatch && entityMatch && severityMatch;
    });
  }, [apiLogs, allLogs, actionFilter, actorFilter, dateRange, entityFilter, severityFilter]);

  function handleExport() {
    const header = ['Timestamp', 'Actor', 'Role', 'Action', 'Entity'];
    const lines = filteredLogs.map((log) => [log.timestamp, log.actor, log.role, log.action, log.entity].join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'audit-logs.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="admin-page-shell admin-table-page">
      <Helmet>
        <title>Audit Logs | GzoneSphere Admin</title>
      </Helmet>

      <AdminPageHero
        kicker="Platform"
        title="Audit Logs"
        description="Track admin actions, compare before and after payloads, and export the active audit slice to CSV."
        actions={(
          <button type="button" className="admin-btn" onClick={handleExport}>
            <FiDownload size={16} />
            Export to CSV
          </button>
        )}
      />

      <AdminPanel title="Audit Trail" meta="Filter by action type, date range, and actor">
        <div className="admin-filter-bar" style={{ gridTemplateColumns: 'repeat(5, minmax(150px, 1fr))' }}>
          <select className="admin-select" value={actionFilter} onChange={(event) => setActionFilter(event.target.value)}>
            {ACTION_TYPES.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <select className="admin-select" value={dateRange} onChange={(event) => setDateRange(event.target.value)}>
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7d</option>
            <option value="30d">Last 30d</option>
            <option value="all">All time</option>
          </select>
          <input className="admin-input" value={actorFilter} onChange={(event) => setActorFilter(event.target.value)} placeholder="Filter by actor" />
          <select className="admin-select" value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)}>
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>{t === 'all' ? 'All entities' : t}</option>
            ))}
          </select>
          <select className="admin-select" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
            {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="admin-table-wrapper mt-5">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Severity</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <Fragment key={log.id}>
                  <tr
                    key={log.id}
                    className={
                      log.severity === 'ERROR' ? 'border-l-2 border-l-rose-500' :
                      log.severity === 'WARN'  ? 'border-l-2 border-l-amber-400' : ''
                    }
                  >
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>{log.actor}</td>
                    <td>
                      <span
                        className="admin-status-badge"
                        style={
                          log.severity === 'ERROR'
                            ? { background: 'var(--status-danger-bg)', color: 'var(--status-danger-text)' }
                            : log.severity === 'WARN'
                            ? { background: 'var(--status-warning-bg)', color: 'var(--status-warning-text)' }
                            : { background: 'var(--status-draft-bg)', color: 'var(--status-draft-text)' }
                        }
                      >
                        {log.severity || 'INFO'}
                      </span>
                    </td>
                    <td>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${getActionPillClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>{log.entity}</td>
                    <td>
                      <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setExpanded((value) => (value === log.id ? null : log.id))}>
                        {expanded === log.id ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                        Details
                      </button>
                    </td>
                  </tr>
                  {expanded === log.id ? (
                    <tr key={`${log.id}-details`}>
                      <td colSpan={6}>
                        <div className="grid gap-4 bg-[var(--theme-bg-alt)] p-4 md:grid-cols-2">
                          <DiffPanel label="Before" data={log.before} tone="before" />
                          <DiffPanel label="After" data={log.after} tone="after" />
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
              {!filteredLogs.length ? (
                <tr>
                  <td colSpan={6} className="admin-table-empty">No audit entries match the current filters.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </AdminPanel>
    </div>
  );
}
