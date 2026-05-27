import { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { AdminPageHero, AdminPanel } from '@/features/admin/components/AdminContentShell';
import AnalyticsSubNav from '@/features/admin/components/AnalyticsSubNav';

const AXIS = '#64748b';
const TIP  = { backgroundColor: 'var(--theme-card)', border: '2px solid var(--theme-border)', borderRadius: 12, fontSize: 12, color: 'var(--theme-text)' };
const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

// TODO: GET /admin/analytics/users
function buildSignupSeries(days) {
  const base = days === 7 ? 34 : days === 30 ? 30 : 28;
  return Array.from({ length: days }, (_, i) => ({
    date: days === 7 ? `D${i + 1}` : days === 90 ? `W${Math.floor(i / 7) + 1}` : `May ${i + 1}`,
    signups: base + Math.floor(Math.random() * 15) + (i % 7 === 0 ? 20 : 0),
  }));
}

const DAU_WAU_MAU = Array.from({ length: 8 }, (_, i) => ({
  week: `W${i + 1}`,
  dau:  3800 + (i * 137 % 600),
  wau:  15200 + (i * 317 % 2000),
  mau:  51000 + (i * 431 % 4000),
}));

const LEVEL_DATA = [
  { name: 'Beginner', value: 45 },
  { name: 'Hustler',  value: 30 },
  { name: 'Extreme',  value: 18 },
  { name: 'Pro',      value: 7 },
];

const DOMAIN_DATA = [
  { name: 'Esports', count: 4820 },
  { name: 'Dev',     count: 3150 },
  { name: 'Art',     count: 2480 },
  { name: 'Content', count: 2210 },
  { name: 'Design',  count: 1890 },
  { name: 'Music',   count: 1340 },
  { name: 'Gaming',  count: 2530 },
];

const TRUST_BUCKETS = [
  { bucket: '0–2', count: 820 },
  { bucket: '2–4', count: 1540 },
  { bucket: '4–6', count: 4210 },
  { bucket: '6–8', count: 7840 },
  { bucket: '8–10', count: 4010 },
];

const COHORT_DATA = [
  { cohort: "Apr '26", w1: 72, m1: 45, m3: 28 },
  { cohort: "Mar '26", w1: 68, m1: 41, m3: 24 },
  { cohort: "Feb '26", w1: 71, m1: 44, m3: 31 },
  { cohort: "Jan '26", w1: 65, m1: 38, m3: 19 },
];

function cohortCellClass(val) {
  if (val > 50) return 'bg-emerald-500/20 text-emerald-400';
  if (val >= 20) return 'bg-amber-500/20 text-amber-400';
  return 'bg-rose-500/20 text-rose-400';
}

export default function UsersAnalytics() {
  const [range, setRange] = useState(30);

  const signupData = useMemo(() => buildSignupSeries(range), [range]);

  return (
    <div className="admin-page">
      <AdminPageHero
        kicker="Analytics"
        title="Users"
        description="Registration trends, retention, churn, and user lifecycle metrics."
      />
      <AnalyticsSubNav />

      {/* Date range tabs */}
      <div className="flex gap-2 mb-8">
        {[7, 30, 90].map(d => (
          <button
            key={d}
            onClick={() => setRange(d)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
              range === d
                ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]'
                : 'border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:border-[var(--theme-primary)]/30'
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total users',       value: '18,420' },
          { label: 'Verified users',    value: '12,840' },
          { label: 'Avg trust score',   value: '6.4' },
          { label: 'Top domain',        value: 'Esports' },
        ].map(c => (
          <div key={c.label} className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-2xl p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40 mb-2">{c.label}</p>
            <p className="text-2xl font-black italic text-[var(--theme-text)]">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Chart 1: Signups over time */}
        <AdminPanel title="Signups over time" meta={`Last ${range} days`}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={signupData}>
              <CartesianGrid stroke="#334155" strokeDasharray="4 4" vertical={false} opacity={0.4} />
              <XAxis dataKey="date" tick={{ fill: AXIS, fontSize: 10 }} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(range / 10) - 1)} />
              <YAxis tick={{ fill: AXIS, fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TIP} />
              <Line type="monotone" dataKey="signups" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </AdminPanel>

        {/* Chart 2: DAU/WAU/MAU */}
        <AdminPanel title="DAU / WAU / MAU" meta="8-week trend">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={DAU_WAU_MAU}>
              <CartesianGrid stroke="#334155" strokeDasharray="4 4" vertical={false} opacity={0.4} />
              <XAxis dataKey="week" tick={{ fill: AXIS, fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: AXIS, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={TIP} formatter={v => [v.toLocaleString(), '']} />
              <Legend wrapperStyle={{ fontSize: 11, color: AXIS }} />
              <Line type="monotone" dataKey="dau" name="DAU" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="wau" name="WAU" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="mau" name="MAU" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </AdminPanel>

        {/* Chart 3: Platform level distribution */}
        <AdminPanel title="Platform level distribution" meta="% of all users">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={LEVEL_DATA} dataKey="value" nameKey="name" innerRadius={65} outerRadius={95} paddingAngle={3}>
                {LEVEL_DATA.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={TIP} formatter={v => [`${v}%`, '']} />
              <Legend wrapperStyle={{ fontSize: 11, color: AXIS }} />
            </PieChart>
          </ResponsiveContainer>
        </AdminPanel>

        {/* Chart 4: Sub-profile by domain */}
        <AdminPanel title="Sub-profiles by domain" meta="total count per domain">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={DOMAIN_DATA} layout="vertical" margin={{ top: 4, right: 20, left: 56, bottom: 0 }}>
              <XAxis type="number" tick={{ fill: AXIS, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(1)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={56} />
              <Tooltip contentStyle={TIP} formatter={v => [v.toLocaleString(), '']} />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </AdminPanel>

        {/* Chart 5: Trust score distribution */}
        <AdminPanel title="Trust score distribution" meta="histogram of all users">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={TRUST_BUCKETS}>
              <CartesianGrid stroke="#334155" strokeDasharray="4 4" vertical={false} opacity={0.4} />
              <XAxis dataKey="bucket" tick={{ fill: AXIS, fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: AXIS, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(1)}k`} />
              <Tooltip contentStyle={TIP} formatter={v => [v.toLocaleString(), 'users']} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </AdminPanel>
      </div>

      {/* Retention cohort table */}
      <AdminPanel title="Retention cohorts" meta="% of users still active at checkpoint">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--theme-border)]">
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40">Cohort</th>
                <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40">Week 1</th>
                <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40">Month 1</th>
                <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40">Month 3</th>
              </tr>
            </thead>
            <tbody>
              {COHORT_DATA.map(row => (
                <tr key={row.cohort} className="border-b border-[var(--theme-border)]/40 last:border-0">
                  <td className="px-4 py-4 font-semibold text-[var(--theme-text)]">{row.cohort}</td>
                  {[row.w1, row.m1, row.m3].map((val, i) => (
                    <td key={i} className="px-4 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold tabular-nums ${cohortCellClass(val)}`}>
                        {val}%
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminPanel>
    </div>
  );
}
