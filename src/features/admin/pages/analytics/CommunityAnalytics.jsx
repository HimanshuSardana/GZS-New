import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { AdminPageHero, AdminPanel } from '@/features/admin/components/AdminContentShell';
import AnalyticsSubNav from '@/features/admin/components/AnalyticsSubNav';
import DomainBadge from '@/shared/components/DomainBadge';

const AXIS = '#64748b';
const TIP  = { backgroundColor: 'var(--theme-card)', border: '2px solid var(--theme-border)', borderRadius: 12, fontSize: 12, color: 'var(--theme-text)' };

const BRANCHES      = ['Esports', 'Dev', 'Art', 'Design', 'Music', 'Content', 'General'];
const BRANCH_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#f97316', '#64748b'];
const BASE_MEMBERS  = [5200, 3400, 2800, 1900, 1200, 2100, 3600];
const BASE_MSGS     = [180, 120, 90, 70, 45, 110, 60];

// TODO: GET /admin/analytics/community

const MEMBER_SERIES = Array.from({ length: 30 }, (_, i) => {
  const obj = { day: `${i + 1}` };
  BRANCHES.forEach((b, j) => { obj[b] = BASE_MEMBERS[j] + Math.floor(i * (j + 1) * 7 % 300); });
  return obj;
});

const MSG_SERIES = Array.from({ length: 30 }, (_, i) => {
  const obj = { day: `${i + 1}` };
  BRANCHES.forEach((b, j) => { obj[b] = BASE_MSGS[j] + Math.floor(i * (j + 1) * 11 % 120); });
  return obj;
});

const MOD_ACTIONS = [
  { name: 'Dismissed',         value: 412 },
  { name: 'Removed',           value: 187 },
  { name: 'Warned',            value: 234 },
  { name: 'Muted in channel',  value: 98 },
  { name: 'Muted in branch',   value: 54 },
];
const MOD_COLORS = ['#64748b', '#f43f5e', '#f59e0b', '#3b82f6', '#8b5cf6'];

const EVENTS_DATA = [
  { name: 'Esports Cup',    rsvp: 84,  attended: 71 },
  { name: 'Art Battle',     rsvp: 52,  attended: 44 },
  { name: 'Dev Hackday',    rsvp: 38,  attended: 29 },
  { name: 'Music Jam',      rsvp: 27,  attended: 21 },
  { name: 'GZS Meetup',     rsvp: 120, attended: 98 },
  { name: 'LFG Night',      rsvp: 64,  attended: 51 },
  { name: 'Design Crit',    rsvp: 31,  attended: 28 },
  { name: 'Esports Cup 2',  rsvp: 92,  attended: 79 },
  { name: 'Writing Wksp',   rsvp: 22,  attended: 19 },
  { name: 'Community Q&A',  rsvp: 48,  attended: 40 },
];

const FLAGS_SERIES = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  raised:   8 + Math.floor(i * 13 % 22),
  resolved: 6 + Math.floor(i * 11 % 18),
}));

const TOP_CONTRIBUTORS = [
  { rank: 1,  username: 'ace_shots',     domain: 'esports', posts: 284, reactions: 4210, events: 12, trust: 9.2 },
  { rank: 2,  username: 'dev_rapid',     domain: 'dev',     posts: 241, reactions: 3870, events: 8,  trust: 8.7 },
  { rank: 3,  username: 'art_wizard',    domain: 'art',     posts: 198, reactions: 3140, events: 15, trust: 8.9 },
  { rank: 4,  username: 'sound_pro',     domain: 'music',   posts: 176, reactions: 2580, events: 6,  trust: 8.1 },
  { rank: 5,  username: 'vid_creator',   domain: 'content', posts: 162, reactions: 2340, events: 9,  trust: 7.8 },
  { rank: 6,  username: 'ui_artist99',   domain: 'design',  posts: 148, reactions: 2100, events: 7,  trust: 8.3 },
  { rank: 7,  username: 'bgmi_god',      domain: 'esports', posts: 134, reactions: 1980, events: 11, trust: 7.6 },
  { rank: 8,  username: 'unity_dev_k',   domain: 'dev',     posts: 121, reactions: 1740, events: 4,  trust: 8.5 },
  { rank: 9,  username: 'coach_k',       domain: 'esports', posts: 118, reactions: 1650, events: 14, trust: 9.0 },
  { rank: 10, username: 'writer_anita',  domain: 'content', posts: 109, reactions: 1480, events: 5,  trust: 7.9 },
];

export default function CommunityAnalytics() {
  return (
    <div className="admin-page">
      <AdminPageHero
        kicker="Analytics"
        title="Community"
        description="Branch membership, message volume, moderation activity, and top contributors."
      />
      <AnalyticsSubNav />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active members',       value: '22,293' },
          { label: 'Most active branch',   value: 'Esports' },
          { label: 'Flags resolved today', value: '14' },
          { label: 'Avg toxicity score',   value: '0.12' },
        ].map(c => (
          <div key={c.label} className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-2xl p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40 mb-2">{c.label}</p>
            <p className="text-2xl font-black italic text-[var(--theme-text)]">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Chart 1: Stacked area — member count */}
        <AdminPanel title="Member count per branch" meta="stacked area — 30 days">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={MEMBER_SERIES}>
              <CartesianGrid stroke="#334155" strokeDasharray="4 4" vertical={false} opacity={0.3} />
              <XAxis dataKey="day" tick={{ fill: AXIS, fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fill: AXIS, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={TIP} formatter={v => [v.toLocaleString(), '']} />
              <Legend wrapperStyle={{ fontSize: 10, color: AXIS }} />
              {BRANCHES.map((b, i) => (
                <Area key={b} type="monotone" dataKey={b} stackId="a" stroke={BRANCH_COLORS[i]} fill={BRANCH_COLORS[i]} fillOpacity={0.5} strokeWidth={1} dot={false} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </AdminPanel>

        {/* Chart 2: Multi-line — messages per branch */}
        <AdminPanel title="Messages per branch" meta="7 branches — last 30 days">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={MSG_SERIES}>
              <CartesianGrid stroke="#334155" strokeDasharray="4 4" vertical={false} opacity={0.3} />
              <XAxis dataKey="day" tick={{ fill: AXIS, fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fill: AXIS, fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TIP} />
              <Legend wrapperStyle={{ fontSize: 10, color: AXIS }} />
              {BRANCHES.map((b, i) => (
                <Line key={b} type="monotone" dataKey={b} stroke={BRANCH_COLORS[i]} strokeWidth={1.5} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </AdminPanel>

        {/* Chart 3: Moderation actions donut */}
        <AdminPanel title="Moderation action distribution" meta="all-time breakdown">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={MOD_ACTIONS} dataKey="value" nameKey="name" innerRadius={65} outerRadius={95} paddingAngle={3}>
                {MOD_ACTIONS.map((_, i) => <Cell key={i} fill={MOD_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={TIP} />
              <Legend wrapperStyle={{ fontSize: 11, color: AXIS }} />
            </PieChart>
          </ResponsiveContainer>
        </AdminPanel>

        {/* Chart 4: Events RSVP vs attendance */}
        <AdminPanel title="Event RSVP vs actual attendance" meta="last 10 events">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={EVENTS_DATA} margin={{ left: 0, right: 8 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="4 4" vertical={false} opacity={0.4} />
              <XAxis dataKey="name" tick={{ fill: AXIS, fontSize: 9 }} tickLine={false} axisLine={false} angle={-18} textAnchor="end" height={40} interval={0} />
              <YAxis tick={{ fill: AXIS, fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TIP} />
              <Legend wrapperStyle={{ fontSize: 11, color: AXIS }} />
              <Bar dataKey="rsvp"     name="RSVP"     fill="#3b82f6" radius={[4,4,0,0]} barSize={12} />
              <Bar dataKey="attended" name="Attended" fill="#10b981" radius={[4,4,0,0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </AdminPanel>

        {/* Chart 5: Flagged content */}
        <AdminPanel title="Flagged content" meta="raised vs resolved — 30 days">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={FLAGS_SERIES}>
              <CartesianGrid stroke="#334155" strokeDasharray="4 4" vertical={false} opacity={0.4} />
              <XAxis dataKey="day" tick={{ fill: AXIS, fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fill: AXIS, fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TIP} />
              <Legend wrapperStyle={{ fontSize: 11, color: AXIS }} />
              <Line type="monotone" dataKey="raised"   name="Raised"   stroke="#f43f5e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </AdminPanel>
      </div>

      {/* Top Contributors table */}
      <AdminPanel title="Top contributors" meta="sorted by post count">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[650px]">
            <thead>
              <tr className="border-b border-[var(--theme-border)]">
                {['#', 'Username', 'Domain', 'Posts', 'Reactions', 'Events', 'Trust'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TOP_CONTRIBUTORS.map(c => (
                <tr key={c.rank} className="border-b border-[var(--theme-border)]/40 last:border-0 hover:bg-[var(--theme-bg-alt)]/20 transition-colors">
                  <td className="px-4 py-3 text-[var(--theme-text-muted)] font-bold">{c.rank}</td>
                  <td className="px-4 py-3 font-mono text-sm text-[var(--theme-text)]">{c.username}</td>
                  <td className="px-4 py-3"><DomainBadge domain={c.domain} /></td>
                  <td className="px-4 py-3 text-[var(--theme-text)] font-semibold">{c.posts}</td>
                  <td className="px-4 py-3 text-[var(--theme-text-muted)]">{c.reactions.toLocaleString()}</td>
                  <td className="px-4 py-3 text-[var(--theme-text-muted)]">{c.events}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold text-sm ${c.trust >= 9 ? 'text-emerald-400' : c.trust >= 8 ? 'text-blue-400' : 'text-[var(--theme-text-muted)]'}`}>
                      {c.trust.toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminPanel>
    </div>
  );
}
