import { FiLock, FiAlertTriangle } from 'react-icons/fi';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';
import { AdminPageHero, AdminPanel } from '@/features/admin/components/AdminContentShell';
import AnalyticsSubNav from '@/features/admin/components/AnalyticsSubNav';
import useAdminAuthStore from '@/store/admin/useAdminAuthStore';

const AXIS = '#64748b';
const TIP  = { backgroundColor: 'var(--theme-card)', border: '2px solid var(--theme-border)', borderRadius: 12, fontSize: 12, color: 'var(--theme-text)' };
const PIE_COLORS = ['#f59e0b', '#8b5cf6', '#10b981'];

// TODO: GET /admin/analytics/revenue

const DAILY_REVENUE = Array.from({ length: 31 }, (_, i) => ({
  day: `May ${i + 1}`,
  revenue: 8000 + Math.floor(i * 347 % 6000) + (i > 20 ? 2000 : 0),
}));

const REVENUE_STREAMS = [
  { name: 'Listing fees',    value: 149700 },
  { name: 'Gig commission',  value: 63000 },
  { name: 'Playtesting',     value: 18400 },
];

const ESCROW_VELOCITY = Array.from({ length: 8 }, (_, i) => ({
  week: `W${i + 1}`,
  avg_days: parseFloat((2.4 + (i * 0.3 % 2.0)).toFixed(2)),
}));

const TOP_COMPANIES = [
  { name: 'Phantom Studios',  spend: 284000 },
  { name: 'ArenaX',           spend: 198000 },
  { name: 'CloudBurst Games', spend: 172000 },
  { name: 'NexaGaming',       spend: 141000 },
  { name: 'PixelForge',       spend: 118000 },
  { name: 'GameVault',        spend: 94000 },
  { name: 'DawnRift',         spend: 83000 },
  { name: 'MegaLoot Inc',     spend: 71000 },
  { name: 'BlazeMedia',       spend: 58000 },
  { name: 'FusionLabs',       spend: 47000 },
];

const TOP_WORKERS = [
  { name: 'dev_alex',      payout: 145000 },
  { name: 'unity_dev_k',   payout: 132000 },
  { name: 'art_wizard',    payout: 98000 },
  { name: 'ui_artist99',   payout: 87000 },
  { name: 'vid_creator',   payout: 76000 },
  { name: 'sound_pro',     payout: 64000 },
  { name: '3d_modeler_v',  payout: 58000 },
  { name: 'writer_anita',  payout: 42000 },
  { name: 'bgmi_coach_z',  payout: 38000 },
  { name: 'design_riya',   payout: 31000 },
];

const FAILURE_RATE = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  rate: parseFloat((1.0 + (i * 0.17 % 3.5) + (i === 14 || i === 22 ? 4.2 : 0)).toFixed(2)),
}));

const FAILURE_RATE_VALUE = 1.2;

export default function RevenueAnalytics() {
  const { user } = useAdminAuthStore();

  if (user?.role === 'analytics_viewer') {
    return (
      <div className="admin-page">
        <AdminPageHero kicker="Analytics" title="Revenue" description="Financial performance, escrow flow, and payment metrics." />
        <AnalyticsSubNav />
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-700/30 flex items-center justify-center">
            <FiLock size={28} className="text-[var(--theme-text-muted)] opacity-50" />
          </div>
          <p className="text-sm font-semibold text-[var(--theme-text-muted)]">Revenue analytics requires Admin access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminPageHero
        kicker="Analytics"
        title="Revenue"
        description="Financial performance, escrow flow, and payment metrics."
      />
      <AnalyticsSubNav />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-2xl p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40 mb-2">Total Revenue MTD</p>
          <p className="text-2xl font-black italic text-[var(--theme-text)]">₹3,64,200</p>
        </div>
        <div className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-2xl p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40 mb-2">Total Revenue YTD</p>
          <p className="text-2xl font-black italic text-[var(--theme-text)]">₹18,42,000</p>
        </div>
        <div className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-2xl p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40 mb-2">Avg escrow velocity</p>
          <p className="text-2xl font-black italic text-[var(--theme-text)]">3.2 days</p>
        </div>
        <div className={`border-2 rounded-2xl p-5 ${FAILURE_RATE_VALUE > 5 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-[var(--theme-card)] border-[var(--theme-border)]'}`}>
          <div className="flex items-center gap-1.5 mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40">Payment failure rate</p>
            {FAILURE_RATE_VALUE > 5 && <FiAlertTriangle size={12} className="text-rose-400" />}
          </div>
          <p className={`text-2xl font-black italic ${FAILURE_RATE_VALUE > 5 ? 'text-rose-400' : 'text-[var(--theme-text)]'}`}>
            {FAILURE_RATE_VALUE}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Chart 1: Daily revenue */}
        <AdminPanel title="Daily revenue — current month" meta="total ₹ per day">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={DAILY_REVENUE}>
              <CartesianGrid stroke="#334155" strokeDasharray="4 4" vertical={false} opacity={0.4} />
              <XAxis dataKey="day" tick={{ fill: AXIS, fontSize: 9 }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fill: AXIS, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={TIP} formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </AdminPanel>

        {/* Chart 2: Revenue by stream donut */}
        <AdminPanel title="Revenue by stream" meta="listing fees · gig commission · playtesting">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={REVENUE_STREAMS} dataKey="value" nameKey="name" innerRadius={65} outerRadius={95} paddingAngle={3}>
                {REVENUE_STREAMS.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={TIP} formatter={v => [`₹${v.toLocaleString('en-IN')}`, '']} />
              <Legend wrapperStyle={{ fontSize: 11, color: AXIS }} />
            </PieChart>
          </ResponsiveContainer>
        </AdminPanel>

        {/* Chart 3: Escrow velocity */}
        <AdminPanel title="Escrow velocity" meta="avg days funded → released per week">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={ESCROW_VELOCITY}>
              <CartesianGrid stroke="#334155" strokeDasharray="4 4" vertical={false} opacity={0.4} />
              <XAxis dataKey="week" tick={{ fill: AXIS, fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: AXIS, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v.toFixed(1)}d`} domain={[0, 6]} />
              <Tooltip contentStyle={TIP} formatter={v => [`${v} days`, 'Avg release time']} />
              <Line type="monotone" dataKey="avg_days" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        </AdminPanel>

        {/* Chart 4: Top 10 companies */}
        <AdminPanel title="Top 10 companies by spend" meta="total gig + listing fees paid">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={TOP_COMPANIES} layout="vertical" margin={{ top: 4, right: 20, left: 104, bottom: 0 }}>
              <XAxis type="number" tick={{ fill: AXIS, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fill: AXIS, fontSize: 10 }} tickLine={false} axisLine={false} width={104} />
              <Tooltip contentStyle={TIP} formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Spend']} />
              <Bar dataKey="spend" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </AdminPanel>

        {/* Chart 5: Top 10 workers */}
        <AdminPanel title="Top 10 workers by payout" meta="total earnings received">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={TOP_WORKERS} layout="vertical" margin={{ top: 4, right: 20, left: 96, bottom: 0 }}>
              <XAxis type="number" tick={{ fill: AXIS, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fill: AXIS, fontSize: 10 }} tickLine={false} axisLine={false} width={96} />
              <Tooltip contentStyle={TIP} formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Payout']} />
              <Bar dataKey="payout" fill="#10b981" radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </AdminPanel>

        {/* Chart 6: Payment failure rate with ReferenceLine */}
        <AdminPanel title="Payment failure rate" meta="last 30 days — 5% threshold highlighted">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={FAILURE_RATE}>
              <CartesianGrid stroke="#334155" strokeDasharray="4 4" vertical={false} opacity={0.4} />
              <XAxis dataKey="day" tick={{ fill: AXIS, fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fill: AXIS, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v.toFixed(1)}%`} domain={[0, 8]} />
              <Tooltip contentStyle={TIP} formatter={v => [`${v.toFixed(2)}%`, 'Failure rate']} />
              <ReferenceLine
                y={5}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                label={{ value: '5% threshold', fill: '#f43f5e', fontSize: 10, position: 'insideTopRight' }}
              />
              <Line type="monotone" dataKey="rate" stroke="#f97316" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </AdminPanel>
      </div>
    </div>
  );
}
