import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { AdminPageHero, AdminPanel } from '@/features/admin/components/AdminContentShell';
import AnalyticsSubNav from '@/features/admin/components/AnalyticsSubNav';

const AXIS = '#64748b';
const TIP  = { backgroundColor: 'var(--theme-card)', border: '2px solid var(--theme-border)', borderRadius: 12, fontSize: 12, color: 'var(--theme-text)' };

const BRANCHES      = ['Esports', 'Dev', 'Art', 'Design', 'Music', 'Content', 'General'];
const BRANCH_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#f97316', '#64748b'];

// TODO: GET /admin/analytics/content

const TOP_GAMES = [
  { name: 'Valorant',     views: 142000 },
  { name: 'Minecraft',    views: 118000 },
  { name: 'BGMI',         views: 97000 },
  { name: 'GTA V',        views: 84000 },
  { name: 'FIFA 25',      views: 76000 },
  { name: 'CS2',          views: 71000 },
  { name: 'Fortnite',     views: 64000 },
  { name: 'Apex Legends', views: 59000 },
  { name: 'Overwatch 2',  views: 47000 },
  { name: 'The Finals',   views: 38000 },
];

const BLOG_CATEGORIES = [
  { category: 'Esports', views: 14200, likes: 3100, comments: 820 },
  { category: 'Dev Tips', views: 9800, likes: 2400, comments: 560 },
  { category: 'Art',      views: 7200, likes: 1900, comments: 340 },
  { category: 'Career',   views: 11400, likes: 2800, comments: 690 },
  { category: 'Gaming',   views: 18200, likes: 4200, comments: 1100 },
];

const MSG_SERIES = Array.from({ length: 30 }, (_, i) => {
  const obj = { day: `${i + 1}` };
  BRANCHES.forEach((b, j) => { obj[b] = 60 + Math.floor(i * (j + 1) * 11 % 140) + j * 25; });
  return obj;
});

const TOURNAMENT_DATA = [
  { name: 'GZS Open #1',   regs: 64,  max: 64 },
  { name: 'Dev Cup',        regs: 28,  max: 32 },
  { name: 'Art Battle',     regs: 41,  max: 64 },
  { name: 'GZS Open #2',   regs: 64,  max: 64 },
  { name: 'Esports Pro',    regs: 120, max: 128 },
  { name: 'Music Jam',      regs: 19,  max: 32 },
  { name: 'GZS Open #3',   regs: 52,  max: 64 },
  { name: 'Content Slam',   regs: 38,  max: 64 },
  { name: 'Dev Cup 2',      regs: 31,  max: 32 },
  { name: 'Esports Pro 2',  regs: 118, max: 128 },
];

const LFG_SERIES = Array.from({ length: 8 }, (_, i) => ({
  week: `W${i + 1}`,
  posts_created: 240 + Math.floor(i * 37 % 120),
  posts_matched: 110 + Math.floor(i * 29 % 80),
}));

const SHOWCASE_POSTS = [
  { rank: 1,  title: 'My Valorant highlight reel — clutch round',     author: 'ace_shots',    branch: 'Esports', likes: 842, saves: 312, comments: 94,  featured: true  },
  { rank: 2,  title: 'Built a full MMORPG in 48h — how I did it',    author: 'dev_rapid',    branch: 'Dev',     likes: 780, saves: 450, comments: 127, featured: true  },
  { rank: 3,  title: 'Character concept art for my indie RPG',        author: 'art_wizard',   branch: 'Art',     likes: 694, saves: 387, comments: 61,  featured: false },
  { rank: 4,  title: '5 Minecraft builds that broke my PC',           author: 'block_guru',   branch: 'Gaming',  likes: 631, saves: 201, comments: 88,  featured: false },
  { rank: 5,  title: 'Career in esports — honest guide',              author: 'coach_k',      branch: 'Esports', likes: 580, saves: 342, comments: 73,  featured: true  },
  { rank: 6,  title: 'Designing the GZS tournament bracket UI',       author: 'ui_artist99',  branch: 'Design',  likes: 511, saves: 289, comments: 55,  featured: false },
  { rank: 7,  title: 'Original lo-fi track for gaming streams',       author: 'sound_pro',    branch: 'Music',   likes: 478, saves: 193, comments: 42,  featured: false },
  { rank: 8,  title: 'BGMI ranked tips — top 0.1% player secrets',    author: 'bgmi_god',     branch: 'Esports', likes: 444, saves: 177, comments: 66,  featured: false },
  { rank: 9,  title: 'Writing lore for your indie game world',        author: 'writer_anita', branch: 'Content', likes: 392, saves: 210, comments: 49,  featured: false },
  { rank: 10, title: 'My first game jam submission — post-mortem',    author: 'unity_dev_k',  branch: 'Dev',     likes: 361, saves: 154, comments: 38,  featured: false },
];

export default function ContentAnalytics() {
  return (
    <div className="admin-page">
      <AdminPageHero
        kicker="Analytics"
        title="Content"
        description="Blog views, message volume, tournament participation, and showcase performance."
      />
      <AnalyticsSubNav />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Blog views MTD',     value: '284,600' },
          { label: 'Messages (30d)',     value: '1.2M' },
          { label: 'Most active branch', value: 'Esports' },
          { label: 'Top game (week)',    value: 'Valorant' },
        ].map(c => (
          <div key={c.label} className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-2xl p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40 mb-2">{c.label}</p>
            <p className="text-2xl font-black italic text-[var(--theme-text)]">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Chart 1: Top 10 games */}
        <AdminPanel title="Top 10 games by views" meta="all-time">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={TOP_GAMES} layout="vertical" margin={{ top: 4, right: 20, left: 80, bottom: 0 }}>
              <XAxis type="number" tick={{ fill: AXIS, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fill: AXIS, fontSize: 10 }} tickLine={false} axisLine={false} width={80} />
              <Tooltip contentStyle={TIP} formatter={v => [v.toLocaleString(), 'views']} />
              <Bar dataKey="views" fill="#10b981" radius={[0, 4, 4, 0]} barSize={14}>
                {TOP_GAMES.map((_, i) => <Cell key={i} fill={`hsl(${152 + i * 8}, 70%, ${55 - i * 2}%)`} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </AdminPanel>

        {/* Chart 2: Blog performance */}
        <AdminPanel title="Blog performance by category" meta="views / likes / comments stacked">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={BLOG_CATEGORIES}>
              <CartesianGrid stroke="#334155" strokeDasharray="4 4" vertical={false} opacity={0.4} />
              <XAxis dataKey="category" tick={{ fill: AXIS, fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: AXIS, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={TIP} formatter={v => [v.toLocaleString(), '']} />
              <Legend wrapperStyle={{ fontSize: 11, color: AXIS }} />
              <Bar dataKey="views"    name="Views"    stackId="a" fill="#3b82f6" />
              <Bar dataKey="likes"    name="Likes"    stackId="a" fill="#10b981" />
              <Bar dataKey="comments" name="Comments" stackId="a" fill="#f59e0b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </AdminPanel>

        {/* Chart 3: Message volume per branch */}
        <AdminPanel title="Message volume per branch" meta="last 30 days">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={MSG_SERIES}>
              <CartesianGrid stroke="#334155" strokeDasharray="4 4" vertical={false} opacity={0.4} />
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

        {/* Chart 4: Tournament participation */}
        <AdminPanel title="Tournament participation" meta="registrations vs capacity">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={TOURNAMENT_DATA} margin={{ left: 0, right: 8 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="4 4" vertical={false} opacity={0.4} />
              <XAxis dataKey="name" tick={{ fill: AXIS, fontSize: 9 }} tickLine={false} axisLine={false} angle={-18} textAnchor="end" height={40} interval={0} />
              <YAxis tick={{ fill: AXIS, fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TIP} />
              <Legend wrapperStyle={{ fontSize: 11, color: AXIS }} />
              <Bar dataKey="regs" name="Registrations" fill="#10b981" radius={[4,4,0,0]} barSize={12} />
              <Bar dataKey="max"  name="Capacity"      fill="#334155" radius={[4,4,0,0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </AdminPanel>

        {/* Chart 5: LFG activity */}
        <AdminPanel title="LFG activity" meta="posts created vs matched — 8 weeks">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={LFG_SERIES}>
              <CartesianGrid stroke="#334155" strokeDasharray="4 4" vertical={false} opacity={0.4} />
              <XAxis dataKey="week" tick={{ fill: AXIS, fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: AXIS, fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TIP} />
              <Legend wrapperStyle={{ fontSize: 11, color: AXIS }} />
              <Line type="monotone" dataKey="posts_created" name="Created" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="posts_matched" name="Matched" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </AdminPanel>
      </div>

      {/* Top Showcase Posts table */}
      <AdminPanel title="Top 10 showcase posts" meta="sorted by likes">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--theme-border)]">
                {['#', 'Post', 'Author', 'Branch', 'Likes', 'Saves', 'Comments', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SHOWCASE_POSTS.map(p => (
                <tr key={p.rank} className="border-b border-[var(--theme-border)]/40 last:border-0 hover:bg-[var(--theme-bg-alt)]/20 transition-colors">
                  <td className="px-4 py-3 text-[var(--theme-text-muted)] font-bold">{p.rank}</td>
                  <td className="px-4 py-3 text-[var(--theme-text)] max-w-xs">
                    <span className="line-clamp-1">{p.title.length > 48 ? p.title.slice(0, 48) + '…' : p.title}</span>
                  </td>
                  <td className="px-4 py-3 text-[var(--theme-text-muted)] text-xs font-mono">{p.author}</td>
                  <td className="px-4 py-3 text-xs text-[var(--theme-text-muted)] opacity-70">{p.branch}</td>
                  <td className="px-4 py-3 text-emerald-400 font-semibold">{p.likes.toLocaleString()}</td>
                  <td className="px-4 py-3 text-[var(--theme-text-muted)]">{p.saves.toLocaleString()}</td>
                  <td className="px-4 py-3 text-[var(--theme-text-muted)]">{p.comments}</td>
                  <td className="px-4 py-3">
                    {p.featured && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                        Featured
                      </span>
                    )}
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
