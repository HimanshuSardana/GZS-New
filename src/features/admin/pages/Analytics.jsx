import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import { AdminPageHero, AdminPanel } from '../components/AdminContentShell';
import AnalyticsSubNav from '@/features/admin/components/AnalyticsSubNav';

const RANGE_OPTIONS = ['Last 7d', '30d', '90d', 'All time'];

// Resolve CSS variables for charts
const getAdminVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#ccc';

const PIE_COLORS = ['#10B981', '#2563EB', '#F59E0B', '#7C3AED'];

function generateActivityData(length, base) {
  return Array.from({ length }, (_, index) => ({
    label: length === 7 ? `D${index + 1}` : `P${index + 1}`,
    users: base + ((index % 7) * 28) + (index * 5),
  }));
}

export default function Analytics() {
  usePageTheme('admin');

  const [range, setRange] = useState('30d');

  const activitySeries = useMemo(() => {
    if (range === 'Last 7d') {
      return generateActivityData(7, 320);
    }
    if (range === '90d') {
      return generateActivityData(12, 540);
    }
    if (range === 'All time') {
      return generateActivityData(16, 680);
    }
    return generateActivityData(10, 420);
  }, [range]);

  const verificationSeries = useMemo(() => (
    [
      { week: 'W1', verifications: 24 },
      { week: 'W2', verifications: 31 },
      { week: 'W3', verifications: 27 },
      { week: 'W4', verifications: 39 },
      { week: 'W5', verifications: 42 },
      { week: 'W6', verifications: 36 },
    ]
  ), []);

  const tournamentSeries = useMemo(() => (
    [
      { domain: 'Esports', tournaments: 18 },
      { domain: 'Dev', tournaments: 9 },
      { domain: 'Art', tournaments: 6 },
      { domain: 'Writing', tournaments: 4 },
      { domain: 'Content', tournaments: 7 },
    ]
  ), []);

  const contentDistribution = useMemo(() => (
    [
      { name: 'Games', value: 38 },
      { name: 'Blogs', value: 24 },
      { name: 'Media', value: 18 },
      { name: 'Community', value: 20 },
    ]
  ), []);

  const kpis = [
    { label: 'DAU', value: '4,280' },
    { label: 'WAU', value: '16,420' },
    { label: 'MAU', value: '52,900' },
    { label: 'Active Tournaments', value: '18' },
  ];

  const CHART_COLORS = {
    grid: getAdminVar('--theme-border'),
    axis: getAdminVar('--theme-text-muted'),
    line: getAdminVar('--status-success'),
    bar:  getAdminVar('--theme-primary'),
  };

  return (
    <div className="admin-page-shell">
      <Helmet>
        <title>Analytics | GzoneSphere Admin</title>
      </Helmet>

      <AdminPageHero
        kicker="Platform"
        title="Analytics"
        description="Core product metrics across users, content, tournaments, and skill verification activity."
        actions={(
          <div className="flex flex-wrap gap-2">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={`admin-btn ${range === option ? '' : 'admin-btn--ghost'}`}
                onClick={() => setRange(option)}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      />

      <AnalyticsSubNav />

      <section className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 px-2 md:px-0">
        {kpis.map((item) => (
          <article key={item.label} className="admin-stat-card group">
            <p className="admin-stat-label group-hover:text-[var(--theme-primary)] transition-colors">{item.label}</p>
            <strong className="admin-stat-number">{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="grid gap-10 md:gap-12 xl:grid-cols-2 px-2 md:px-0">
        <AdminPanel title="30-Day User Activity" meta="Trend line for engagement — Users sub-page">
          <div className="admin-card h-[300px] md:h-[400px] w-full pt-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activitySeries}>
                <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="5 5" vertical={false} opacity={0.3} />
                <XAxis dataKey="label" stroke={CHART_COLORS.axis} tick={{ fontSize: 10, fontWeight: 800, opacity: 0.5 }} tickLine={false} axisLine={false} />
                <YAxis stroke={CHART_COLORS.axis} tick={{ fontSize: 10, fontWeight: 800, opacity: 0.5 }} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--theme-card)', borderRadius: '1.5rem', border: '2px solid var(--theme-border)', boxShadow: '0 40px 80px rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)' }}
                  itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', color: 'var(--theme-text)' }}
                />
                <Line type="monotone" dataKey="users" stroke={CHART_COLORS.bar} strokeWidth={4} dot={{ r: 4, fill: CHART_COLORS.bar, strokeWidth: 2, stroke: 'var(--theme-card)' }} activeDot={{ r: 8, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <Link to="/admin/analytics/users" className="block text-right text-xs text-[var(--theme-primary)] hover:underline mt-2 font-semibold">View detailed →</Link>
        </AdminPanel>

        <AdminPanel title="Content Distribution" meta="Share of platform content — Content sub-page">
          <div className="admin-card h-[300px] md:h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={contentDistribution} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="85%" paddingAngle={8} stroke="none">
                  {contentDistribution.map((entry, index) => (
                    <Cell key={entry.name} fill={`var(--theme-primary${index > 0 ? '-' + index : ''})`} style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--theme-card)', borderRadius: '1.5rem', border: '2px solid var(--theme-border)', boxShadow: '0 40px 80px rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', opacity: 0.6 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <Link to="/admin/analytics/content" className="block text-right text-xs text-[var(--theme-primary)] hover:underline mt-2 font-semibold">View detailed →</Link>
        </AdminPanel>
      </section>

      <section className="grid gap-10 md:gap-12 xl:grid-cols-2 px-2 md:px-0 pb-24 md:pb-32">
        <AdminPanel title="Tournaments by Domain" meta="Current programming mix — Community sub-page">
          <div className="admin-card h-[300px] md:h-[400px] w-full pt-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tournamentSeries}>
                <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="5 5" vertical={false} opacity={0.3} />
                <XAxis dataKey="domain" stroke={CHART_COLORS.axis} tick={{ fontSize: 10, fontWeight: 800, opacity: 0.5 }} tickLine={false} axisLine={false} />
                <YAxis stroke={CHART_COLORS.axis} tick={{ fontSize: 10, fontWeight: 800, opacity: 0.5 }} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'var(--theme-bg-alt)', opacity: 0.5 }}
                  contentStyle={{ backgroundColor: 'var(--theme-card)', borderRadius: '1.5rem', border: '2px solid var(--theme-border)', boxShadow: '0 40px 80px rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)' }}
                />
                <Bar dataKey="tournaments" fill={CHART_COLORS.bar} radius={[12, 12, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Link to="/admin/analytics/community" className="block text-right text-xs text-[var(--theme-primary)] hover:underline mt-2 font-semibold">View detailed →</Link>
        </AdminPanel>

        <AdminPanel title="Skill Verifications" meta="Approval and review volume — Users sub-page">
          <div className="admin-card h-[300px] md:h-[400px] w-full pt-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={verificationSeries}>
                <defs>
                  <linearGradient id="colorVerif" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.line} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={CHART_COLORS.line} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="5 5" vertical={false} opacity={0.3} />
                <XAxis dataKey="week" stroke={CHART_COLORS.axis} tick={{ fontSize: 10, fontWeight: 800, opacity: 0.5 }} tickLine={false} axisLine={false} />
                <YAxis stroke={CHART_COLORS.axis} tick={{ fontSize: 10, fontWeight: 800, opacity: 0.5 }} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--theme-card)', borderRadius: '1.5rem', border: '2px solid var(--theme-border)', boxShadow: '0 40px 80px rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)' }}
                />
                <Area type="monotone" dataKey="verifications" stroke={CHART_COLORS.line} strokeWidth={4} fillOpacity={1} fill="url(#colorVerif)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <Link to="/admin/analytics/users" className="block text-right text-xs text-[var(--theme-primary)] hover:underline mt-2 font-semibold">View detailed →</Link>
        </AdminPanel>
      </section>
    </div>
  );
}
