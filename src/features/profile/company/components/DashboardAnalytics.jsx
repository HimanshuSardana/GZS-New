import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { FiEye, FiTrendingUp, FiUsers, FiPercent } from 'react-icons/fi';
import { MOCK_ANALYTICS, MOCK_BRANCH_SOURCES } from '../pages/companyMockData';

const PIE_COLORS = ['#7C3AED', '#06B6D4', '#F59E0B', '#EC4899'];

const StatTile = ({ label, value, sub, icon: Icon, color }) => (
  <div className="bg-[var(--theme-card)] rounded-2xl border border-[var(--theme-border)] p-6 flex flex-col gap-3 hover:border-[var(--theme-primary)]/30 transition-all">
    <div className="flex items-center justify-between">
      <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic">{label}</p>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
        {Icon && <Icon size={16} style={{ color }} />}
      </div>
    </div>
    <p className="text-4xl font-black italic tracking-tighter text-[var(--theme-text)] leading-none">{value}</p>
    {sub && <p className="text-xs text-[var(--theme-text-muted)]">{sub}</p>}
  </div>
);

const DashboardAnalytics = ({ analytics }) => {
  const data = analytics || MOCK_ANALYTICS;

  return (
    <div className="space-y-10">
      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatTile label="Profile Views (30d)" value={data.profile_views_30d.toLocaleString()}
          Icon={FiEye} color="#7C3AED" />
        <StatTile label="Profile Views (90d)" value={data.profile_views_90d.toLocaleString()}
          Icon={FiTrendingUp} color="#06B6D4" />
        <StatTile label="Talent Pool Size" value={data.talent_pool_by_role.reduce((s, r) => s + r.count, 0)}
          Icon={FiUsers} color="#F59E0B" />
        <StatTile label="View→Role Conversion" value={`${data.conversion_rate}%`}
          Icon={FiPercent} color="#10B981" sub="Profile views → role page visits" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bar: 30-day views */}
        <div className="lg:col-span-2 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-2xl p-6 space-y-4">
          <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic">Profile Views — Last 30 Days</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.views_by_day_30d} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--theme-text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} interval={2} />
              <YAxis tick={{ fill: 'var(--theme-text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: 'var(--theme-text)', fontWeight: 700 }}
                itemStyle={{ color: '#7C3AED' }}
              />
              <Bar dataKey="views" fill="#7C3AED" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie: source breakdown */}
        <div className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-2xl p-6 space-y-4">
          <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic">View Source Breakdown</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data.source_breakdown} dataKey="value" nameKey="source" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3}>
                {data.source_breakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Legend iconType="circle" iconSize={8}
                formatter={v => <span style={{ color: 'var(--theme-text-muted)', fontSize: 11 }}>{v}</span>} />
              <Tooltip
                contentStyle={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: 12, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Traffic Sources by Community Branch */}
      <div className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic">Traffic Sources by Community Branch</p>
          <span className="text-[10px] font-bold text-[var(--theme-text-muted)] opacity-60">
            {MOCK_BRANCH_SOURCES.reduce((s, b) => s + b.views, 0).toLocaleString()} total views
          </span>
        </div>
        <div className="space-y-2.5">
          {MOCK_BRANCH_SOURCES.map((branch) => {
            const maxViews = Math.max(...MOCK_BRANCH_SOURCES.map((b) => b.views));
            const pct = (branch.views / maxViews) * 100;
            return (
              <div key={branch.slug} className="flex items-center gap-3">
                <span className="w-20 text-right text-xs font-bold shrink-0" style={{ color: 'var(--theme-text-muted)' }}>
                  {branch.branch}
                </span>
                <div className="flex-1 h-5 rounded-lg overflow-hidden" style={{ background: 'var(--theme-bg-alt)' }}>
                  <div
                    className="h-full rounded-lg transition-all duration-500"
                    style={{ width: `${pct}%`, background: branch.color, opacity: 0.85 }}
                  />
                </div>
                <span className="w-10 text-xs font-black shrink-0" style={{ color: 'var(--theme-text)' }}>
                  {branch.views}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-[var(--theme-text-muted)] opacity-50">
          Views originating from GzoneSphere community branch profiles · Last 30 days · GET /companies/&#123;slug&#125;/analytics/sources
        </p>
      </div>

      {/* Bottom row: Applications per role + Top skills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Applications per role */}
        <div className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-2xl p-6 space-y-4">
          <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic">Applications per Role</p>
          <div className="space-y-3">
            {data.applications_per_role.map((r, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-[var(--theme-text)] truncate pr-2">{r.role}</span>
                  <span className="font-black text-[var(--theme-primary)] shrink-0">{r.count}</span>
                </div>
                <div className="h-1.5 bg-[var(--theme-bg-alt)] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--theme-primary)]"
                    style={{ width: `${(r.count / Math.max(...data.applications_per_role.map(x => x.count))) * 100}%`, opacity: 0.85 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top skills */}
        <div className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-2xl p-6 space-y-4">
          <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic">Top Skills in Talent Pool</p>
          <div className="flex flex-wrap gap-3">
            {data.top_skills.map((s, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] rounded-xl">
                <span className="text-xs font-bold text-[var(--theme-text)]">{s.skill}</span>
                <span className="text-xs font-black text-white px-2 py-0.5 rounded-lg"
                  style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}>
                  {s.count}
                </span>
              </div>
            ))}
          </div>

          {/* Talent pool by role mini-list */}
          <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic pt-2">Talent Pool by Role</p>
          <div className="space-y-2">
            {data.talent_pool_by_role.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-[var(--theme-text-muted)]">{r.role}</span>
                <span className="font-black text-[var(--theme-text)]">{r.count} profiles</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAnalytics;
