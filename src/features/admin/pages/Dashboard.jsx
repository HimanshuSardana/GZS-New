import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  FiAlertCircle, FiAlertTriangle, FiAward,
  FiDollarSign, FiFlag, FiUsers, FiUserPlus,
} from 'react-icons/fi';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import { AdminPageHero, AdminPanel } from '../components/AdminContentShell';
import DomainBadge from '@/shared/components/DomainBadge';
import { adminQueryFn } from '@/services/api/adminApi';

// ─────────────────────────────────────────────────────────────────────────────
// Fallback data — shown while loading or when endpoints are unavailable
// ─────────────────────────────────────────────────────────────────────────────

const FALLBACK_STATS = {
  online_now: 0,
  signups_today: 0,
  signups_yesterday: 0,
  active_tournaments: 0,
  moderation_queue: 0,
  open_disputes: 0,
  escrow_held_inr: 0,
};

const FALLBACK_QUEUES = {
  skill_verifications: [],
  job_listings: [],
  disputes: [],
  flagged_messages: 0,
  pending_events: 0,
};

const FALLBACK_HEALTH = {
  postgresql:       { status: 'unknown', latency_ms: null },
  mongodb:          { status: 'unknown', latency_ms: null },
  redis:            { status: 'unknown', latency_ms: null },
  celery:           { status: 'unknown', pending_tasks: null },
  razorpay_webhook: { status: 'unknown', last_received_minutes_ago: null },
  cloudflare_r2:    { status: 'unknown', last_upload_minutes_ago: null },
};

// ─────────────────────────────────────────────────────────────────────────────
// Chart data builders
// ─────────────────────────────────────────────────────────────────────────────

function buildSignupSeries() {
  const out = [];
  const base = new Date('2026-04-26');
  for (let i = 0; i < 30; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    out.push({
      day: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: Math.round(18 + i * 0.6 + (i % 7 === 5 ? 22 : 0) + Math.floor(i * 1.3 % 12)),
    });
  }
  return out;
}

function buildActivitySeries() {
  return Array.from({ length: 8 }, (_, i) => ({
    week: `W${i + 1}`,
    dau:  Math.round(840  + i * 90  + (i * 37 % 80)),
    wau:  Math.round(3400 + i * 210 + (i * 73 % 350)),
    mau:  Math.round(12200 + i * 520 + (i * 157 % 900)),
  }));
}

function buildRevenueSeries() {
  return Array.from({ length: 25 }, (_, i) => ({
    day: `May ${i + 1}`,
    listing_fees:   Math.round(820  + (i * 137 % 580)),
    gig_commission: Math.round(1250 + (i * 211 % 760)),
  }));
}

function buildContentSeries() {
  return [
    { name: 'Messages',   value: 18420 },
    { name: 'Posts',      value: 7340  },
    { name: 'Showcases',  value: 3120  },
    { name: 'Comments',   value: 12680 },
  ];
}

const FALLBACK_CHARTS = {
  signups:  buildSignupSeries(),
  activity: buildActivitySeries(),
  revenue:  buildRevenueSeries(),
  content:  buildContentSeries(),
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function relativeTime(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return `${Math.round(diff)}s ago`;
  if (diff < 3600)  return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

const PRIORITY_PILL = {
  High:   'bg-rose-500/15 text-rose-400 border border-rose-500/25',
  Urgent: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  Normal: 'bg-slate-500/15 text-slate-400 border border-slate-500/25',
};

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

const CHART_AXIS   = '#64748b';
const CHART_GRID   = '#334155';
const CHART_TIP    = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, color: '#f1f5f9' };

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, accent, value, subtitle, to, pulse, variant }) {
  const variantClass = variant ? `admin-stat-card--${variant}` : '';
  const inner = (
    <div className={[
      'admin-stat-card h-full',
      variantClass,
      to ? 'cursor-pointer' : '',
      pulse ? 'ring-2 ring-rose-500/50 animate-pulse' : '',
    ].filter(Boolean).join(' ')}>
      <Icon size={18} className={`${accent} mb-1`} />
      <strong className="admin-stat-number">{value}</strong>
      <span className="admin-stat-label">{subtitle}</span>
    </div>
  );
  return to ? <Link to={to} className="block h-full">{inner}</Link> : inner;
}

function SlaCountdown({ deadline }) {
  const [now] = useState(Date.now);
  const hoursLeft = (new Date(deadline) - now) / 3_600_000;
  const colour = hoursLeft > 36
    ? 'text-emerald-400'
    : hoursLeft > 12
    ? 'text-amber-400'
    : hoursLeft > 0
    ? 'text-rose-400'
    : 'text-rose-400 animate-pulse';
  const label = hoursLeft > 0 ? `${Math.floor(hoursLeft)}h left` : 'OVERDUE';
  return <span className={`${colour} text-xs font-bold`}>{label}</span>;
}

function CompletenessBar({ score }) {
  const fill = score > 85 ? 'bg-emerald-400' : score >= 70 ? 'bg-amber-400' : 'bg-rose-400';
  return (
    <div className="mt-1.5 h-1 w-full rounded-full bg-slate-700/60 overflow-hidden">
      <div className={`h-full ${fill} rounded-full`} style={{ width: `${score}%` }} />
    </div>
  );
}

function ServiceIndicator({ label, status, metricLabel, metricValue, greenMax, amberMax }) {
  let dot = 'text-slate-400';
  if (status === 'healthy') {
    dot = 'text-emerald-400';
    if (metricValue != null) {
      if (metricValue > amberMax)      dot = 'text-rose-400';
      else if (metricValue > greenMax) dot = 'text-amber-400';
    }
  } else if (status === 'error' || status === 'degraded') {
    dot = 'text-rose-400';
  } else if (status === 'warning') {
    dot = 'text-amber-400';
  }
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] px-3 py-2.5 flex-1 min-w-[130px]">
      <span className={`text-base leading-none shrink-0 ${dot}`}>●</span>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-wider text-[var(--theme-text)] truncate">{label}</p>
        <p className="text-[10px] text-[var(--theme-text-muted)] opacity-60">{metricLabel}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  usePageTheme('admin');

  const { data: stats = FALLBACK_STATS } = useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: adminQueryFn('/admin/dashboard/stats'),
    refetchInterval: 30_000,
    placeholderData: FALLBACK_STATS,
    retry: 1,
  });

  const { data: chartData = FALLBACK_CHARTS } = useQuery({
    queryKey: ['admin', 'dashboard', 'charts'],
    queryFn: adminQueryFn('/admin/dashboard/charts'),
    placeholderData: FALLBACK_CHARTS,
    retry: 1,
  });

  const { data: queues = FALLBACK_QUEUES } = useQuery({
    queryKey: ['admin', 'dashboard', 'queues'],
    queryFn: adminQueryFn('/admin/dashboard/queues'),
    refetchInterval: 60_000,
    placeholderData: FALLBACK_QUEUES,
    retry: 1,
  });

  const { data: health = FALLBACK_HEALTH } = useQuery({
    queryKey: ['admin', 'dashboard', 'health'],
    queryFn: adminQueryFn('/admin/health'),
    refetchInterval: 60_000,
    placeholderData: FALLBACK_HEALTH,
    retry: 1,
  });

  const delta = (stats.signups_today ?? 0) - (stats.signups_yesterday ?? 0);
  const sortedDisputes = [...(queues.disputes ?? [])].sort(
    (a, b) => new Date(a.sla_deadline) - new Date(b.sla_deadline)
  );
  const anyHealthRed = Object.values(health).some(
    s => s.status === 'error' || s.status === 'degraded'
  );

  return (
    <div className="admin-page space-y-8 pb-20">
      <Helmet><title>Dashboard | GzoneSphere Admin</title></Helmet>

      <AdminPageHero
        kicker="Admin Overview"
        title="Dashboard"
        description="Platform health, moderation pressure, and queue status in one command centre."
      />

      {/* ── 6 Stat Cards ──────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={FiUsers}
          accent="text-emerald-400"
          value={(stats.online_now ?? 0).toLocaleString()}
          subtitle="Live · updates every 30s"
          variant="success"
        />
        <StatCard
          icon={FiUserPlus}
          accent="text-blue-400"
          value={stats.signups_today ?? 0}
          subtitle={
            <span className={delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {delta >= 0 ? '+' : ''}{delta} vs yesterday
            </span>
          }
          variant="info"
        />
        <StatCard
          icon={FiAward}
          accent="text-violet-400"
          value={stats.active_tournaments ?? 0}
          subtitle="Live now"
        />
        <StatCard
          icon={FiFlag}
          accent="text-amber-400"
          value={stats.moderation_queue ?? 0}
          subtitle="Messages + listings"
          to="/admin/community/moderation"
          variant="warning"
        />
        <StatCard
          icon={FiAlertCircle}
          accent="text-rose-400"
          value={stats.open_disputes ?? 0}
          subtitle="48h SLA per dispute"
          to="/admin/jobs/disputes"
          pulse={(stats.open_disputes ?? 0) > 0}
          variant="error"
        />
        <StatCard
          icon={FiDollarSign}
          accent="text-teal-400"
          value={`₹${(stats.escrow_held_inr ?? 0).toLocaleString('en-IN')}`}
          subtitle="Updated every 5 min"
          variant="success"
        />
      </section>

      {/* ── 4 Charts ──────────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <AdminPanel title="Daily Signups" meta="Last 30 days">
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.signups} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" stroke={CHART_AXIS} tickLine={false} axisLine={false} fontSize={10} interval={5} tick={{ fill: CHART_AXIS }} />
                <YAxis stroke={CHART_AXIS} tickLine={false} axisLine={false} fontSize={10} tick={{ fill: CHART_AXIS }} />
                <Tooltip contentStyle={CHART_TIP} />
                <Line type="monotone" dataKey="count" stroke="var(--theme-primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </AdminPanel>

        <AdminPanel title="User Activity" meta="DAU / WAU / MAU by week">
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.activity} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" stroke={CHART_AXIS} tickLine={false} axisLine={false} fontSize={10} tick={{ fill: CHART_AXIS }} />
                <YAxis stroke={CHART_AXIS} tickLine={false} axisLine={false} fontSize={10} tick={{ fill: CHART_AXIS }} />
                <Tooltip contentStyle={CHART_TIP} />
                <Legend wrapperStyle={{ fontSize: '11px', color: CHART_AXIS }} />
                <Bar dataKey="dau" name="DAU" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="wau" name="WAU" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="mau" name="MAU" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminPanel>

        <AdminPanel title="Revenue" meta="May 2026 — listing fees + gig commissions">
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.revenue} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" stroke={CHART_AXIS} tickLine={false} axisLine={false} fontSize={10} interval={4} tick={{ fill: CHART_AXIS }} />
                <YAxis stroke={CHART_AXIS} tickLine={false} axisLine={false} fontSize={10} tick={{ fill: CHART_AXIS }} />
                <Tooltip contentStyle={CHART_TIP} />
                <Bar dataKey="listing_fees"   name="Listing fees" stackId="a" fill="#f59e0b" />
                <Bar dataKey="gig_commission" name="Commission"   stackId="a" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminPanel>

        <AdminPanel title="Content Mix" meta="All-time distribution">
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.content}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={90}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {chartData.content.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CHART_TIP} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
            {chartData.content.map((entry, i) => (
              <li key={entry.name} className="flex items-center gap-1.5 text-xs text-[var(--theme-text-muted)]">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {entry.name}
                <span className="opacity-50">({entry.value.toLocaleString()})</span>
              </li>
            ))}
          </ul>
        </AdminPanel>

      </section>

      {/* ── Action Queues ─────────────────────────────────────────────────────── */}

      {/* Queue 1 + Queue 2 */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <AdminPanel title="Skill verification queue" meta={`${queues.skill_verifications?.length ?? 0} pending`}>
          <div className="space-y-2">
            {(queues.skill_verifications ?? []).map(v => (
              <div key={v.id} className="flex items-center gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] px-3 py-2">
                <DomainBadge domain={v.domain} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[var(--theme-text)] truncate">
                    <span className="text-[var(--theme-primary)]">@{v.username}</span>
                    {' · '}{v.skill}
                  </p>
                  <p className="text-[10px] text-[var(--theme-text-muted)] opacity-60">{relativeTime(v.submitted_at)}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${PRIORITY_PILL[v.priority] || PRIORITY_PILL.Normal}`}>
                  {v.priority}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-[var(--theme-border)]/40">
            <Link to="/admin/verifications" className="text-xs text-[var(--theme-primary)] hover:underline">
              View all verifications →
            </Link>
          </div>
        </AdminPanel>

        <AdminPanel title="Job listings pending review" meta={`${queues.job_listings?.length ?? 0} pending`}>
          <div className="space-y-2">
            {(queues.job_listings ?? []).map(l => (
              <div key={l.id} className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[var(--theme-text)] truncate">{l.title}</p>
                    <p className="text-[10px] text-[var(--theme-text-muted)] opacity-60">
                      {l.company} · {relativeTime(l.submitted_at)}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold text-[var(--theme-text-muted)]">
                    {l.completeness_score}%
                  </span>
                </div>
                <CompletenessBar score={l.completeness_score} />
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-[var(--theme-border)]/40">
            <Link to="/admin/jobs/moderation" className="text-xs text-[var(--theme-primary)] hover:underline">
              View all listings →
            </Link>
          </div>
        </AdminPanel>

      </section>

      {/* Queue 3 — Open Disputes (full-width) */}
      <AdminPanel title="Open disputes · SLA" meta="Sorted by deadline">
        <div className="space-y-2">
          {sortedDisputes.map(d => (
            <div key={d.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] px-4 py-2.5">
              <code className="shrink-0 text-xs font-mono text-[var(--theme-text-muted)] opacity-70">
                {d.contract_ref}
              </code>
              <span className="shrink-0 rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-400">
                {d.type}
              </span>
              <span className="text-xs font-bold text-[var(--theme-text)]">
                ₹{d.escrow_inr.toLocaleString('en-IN')}
              </span>
              <div className="ml-auto">
                <SlaCountdown deadline={d.sla_deadline} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-[var(--theme-border)]/40">
          <Link to="/admin/jobs/disputes" className="text-xs text-[var(--theme-primary)] hover:underline">
            Manage all disputes →
          </Link>
        </div>
      </AdminPanel>

      {/* Queue 4 + Queue 5 */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <AdminPanel title="Flagged messages">
          <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
            <strong className="text-6xl font-black text-rose-400">{queues.flagged_messages ?? 0}</strong>
            <p className="text-xs text-[var(--theme-text-muted)] max-w-[220px] leading-relaxed">
              messages with toxicity score &gt; 0.85 awaiting review
            </p>
            <Link to="/admin/community/moderation" className="admin-btn admin-btn--danger mt-1">
              Review now
            </Link>
          </div>
        </AdminPanel>

        <AdminPanel title="Pending events">
          <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
            <strong className="text-6xl font-black text-amber-400">{queues.pending_events ?? 0}</strong>
            <p className="text-xs text-[var(--theme-text-muted)] max-w-[220px] leading-relaxed">
              community events awaiting approval
            </p>
            <Link to="/admin/community/events" className="admin-btn admin-btn--secondary mt-1">
              Review events
            </Link>
          </div>
        </AdminPanel>

      </section>

      {/* ── System Health Bar ──────────────────────────────────────────────────── */}
      <AdminPanel title="System health" meta="All services">
        <div className="flex flex-wrap gap-3">
          <ServiceIndicator
            label="PostgreSQL"
            status={health.postgresql?.status}
            metricValue={health.postgresql?.latency_ms}
            metricLabel={health.postgresql?.latency_ms != null ? `${health.postgresql.latency_ms}ms latency` : 'checking…'}
            greenMax={50} amberMax={200}
          />
          <ServiceIndicator
            label="MongoDB"
            status={health.mongodb?.status}
            metricValue={health.mongodb?.latency_ms}
            metricLabel={health.mongodb?.latency_ms != null ? `${health.mongodb.latency_ms}ms latency` : 'checking…'}
            greenMax={50} amberMax={200}
          />
          <ServiceIndicator
            label="Redis"
            status={health.redis?.status}
            metricValue={health.redis?.latency_ms}
            metricLabel={health.redis?.latency_ms != null ? `${health.redis.latency_ms}ms latency` : 'checking…'}
            greenMax={5} amberMax={20}
          />
          <ServiceIndicator
            label="Celery"
            status={health.celery?.status}
            metricValue={health.celery?.pending_tasks}
            metricLabel={health.celery?.pending_tasks != null ? `${health.celery.pending_tasks} pending tasks` : 'checking…'}
            greenMax={20} amberMax={100}
          />
          <ServiceIndicator
            label="Razorpay"
            status={health.razorpay_webhook?.status}
            metricValue={health.razorpay_webhook?.last_received_minutes_ago}
            metricLabel={health.razorpay_webhook?.last_received_minutes_ago != null ? `${health.razorpay_webhook.last_received_minutes_ago}m ago` : 'checking…'}
            greenMax={30} amberMax={60}
          />
          <ServiceIndicator
            label="Cloudflare R2"
            status={health.cloudflare_r2?.status}
            metricValue={health.cloudflare_r2?.last_upload_minutes_ago}
            metricLabel={health.cloudflare_r2?.last_upload_minutes_ago != null ? `${health.cloudflare_r2.last_upload_minutes_ago}m ago` : 'checking…'}
            greenMax={30} amberMax={60}
          />
          {anyHealthRed && (
            <div className="flex items-center gap-2 self-center px-2">
              <FiAlertTriangle size={16} className="text-rose-400 shrink-0" />
              <span className="text-xs font-bold text-rose-400">Degraded service detected</span>
            </div>
          )}
        </div>
      </AdminPanel>

    </div>
  );
}
