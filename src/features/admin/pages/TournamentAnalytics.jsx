import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiBarChart2, FiTrendingUp, FiGlobe, FiCpu, FiAward } from 'react-icons/fi';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
    useTournament,
    useTournamentAnalyticsFunnel,
    useTournamentAnalyticsOverTime,
    useTournamentAnalyticsGeo,
    useTournamentAnalyticsPrizeStatus,
} from '@/services/mutators/useTournaments';

const COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f43f5e', '#a78bfa'];

const FUNNEL_FALLBACK = [
    { label: 'Page Views', value: 0, key: 'page_views' },
    { label: 'Form Opens', value: 0, key: 'form_opens' },
    { label: 'Form Starts', value: 0, key: 'form_starts' },
    { label: 'Completions', value: 0, key: 'completions' },
];

export default function TournamentAnalytics() {
    const { id } = useParams();

    const { data: tournament } = useTournament(id);
    const { data: funnelRaw, isLoading: funnelLoading }     = useTournamentAnalyticsFunnel(id);
    const { data: overTimeRaw, isLoading: overTimeLoading }  = useTournamentAnalyticsOverTime(id);
    const { data: geoRaw, isLoading: geoLoading }            = useTournamentAnalyticsGeo(id);
    const { data: prizeRaw, isLoading: prizeLoading }        = useTournamentAnalyticsPrizeStatus(id);

    const funnelData = FUNNEL_FALLBACK.map(f => ({
        name: f.label,
        value: funnelRaw?.[f.key] ?? f.value,
    }));

    const overTimeData = Array.isArray(overTimeRaw) ? overTimeRaw : [];
    const geoData      = Array.isArray(geoRaw) ? geoRaw : [];
    const prizeData    = Array.isArray(prizeRaw) ? prizeRaw : [];

    const platformData = geoData.reduce((acc, entry) => {
        if (entry.platform) {
            const existing = acc.find(a => a.name === entry.platform);
            if (existing) existing.value += entry.count || 1;
            else acc.push({ name: entry.platform, value: entry.count || 1 });
        }
        return acc;
    }, []);

    const name = tournament?.title || tournament?.name || `Tournament ${id}`;

    return (
        <div className="space-y-16 pb-32 relative min-h-screen">
            {/* Cinematic artifacts */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[var(--theme-primary)]/5 blur-3xl rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[var(--theme-primary)]/3 blur-3xl rounded-full" />
            </div>

            {/* Header */}
            <div className="relative z-10">
                <div className="flex items-center gap-6 mb-4">
                    <Link
                        to="/admin/tournaments"
                        className="w-10 h-10 bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-xl flex items-center justify-center hover:text-[var(--theme-primary)] hover:border-[var(--theme-primary)]/40 transition-all"
                    >
                        <FiArrowLeft size={18} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-1 h-3 bg-[var(--theme-primary)] rounded-full" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-primary)] italic">Tournament Analytics</span>
                        </div>
                        <h1 className="text-2xl font-black uppercase tracking-tighter italic text-[var(--theme-text)]">
                            {name}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Panel 1: Registration Funnel */}
            <AnalyticsPanel
                icon={<FiBarChart2 />}
                title="Registration Funnel"
                loading={funnelLoading}
            >
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={funnelData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" strokeOpacity={0.4} />
                        <XAxis dataKey="name" tick={{ fill: 'var(--theme-text-muted)', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'var(--theme-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip
                            contentStyle={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: 12, fontSize: 12 }}
                            labelStyle={{ fontWeight: 700, color: 'var(--theme-text)' }}
                            itemStyle={{ color: 'var(--theme-primary)' }}
                        />
                        <Bar dataKey="value" fill="var(--theme-primary)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-4 gap-4 mt-6">
                    {funnelData.map((d, i) => (
                        <div key={d.name} className="text-center p-4 bg-[var(--theme-bg-alt)] rounded-2xl border border-[var(--theme-border)]">
                            <p className="text-xl font-black text-[var(--theme-primary)]">{d.value.toLocaleString()}</p>
                            <p className="text-[10px] font-black uppercase tracking-wider text-[var(--theme-text-muted)] opacity-60 mt-1">{d.name}</p>
                        </div>
                    ))}
                </div>
            </AnalyticsPanel>

            {/* Panel 2: Registrations Over Time */}
            <AnalyticsPanel
                icon={<FiTrendingUp />}
                title="Registrations Over Time"
                loading={overTimeLoading}
            >
                {overTimeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={overTimeData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" strokeOpacity={0.4} />
                            <XAxis dataKey="date" tick={{ fill: 'var(--theme-text-muted)', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'var(--theme-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: 12, fontSize: 12 }}
                                labelStyle={{ fontWeight: 700, color: 'var(--theme-text)' }}
                                itemStyle={{ color: 'var(--theme-primary)' }}
                            />
                            <Line type="monotone" dataKey="count" stroke="var(--theme-primary)" strokeWidth={2.5} dot={{ fill: 'var(--theme-primary)', r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <EmptyState message="No registration timeline data yet." />
                )}
            </AnalyticsPanel>

            {/* Panel 3 + 4 side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Geographic Distribution */}
                <AnalyticsPanel
                    icon={<FiGlobe />}
                    title="Geographic Distribution"
                    loading={geoLoading}
                    compact
                >
                    {geoData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={geoData} layout="vertical" margin={{ top: 0, right: 20, left: 60, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" strokeOpacity={0.4} horizontal={false} />
                                <XAxis type="number" tick={{ fill: 'var(--theme-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="region" tick={{ fill: 'var(--theme-text-muted)', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} width={55} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: 12, fontSize: 12 }}
                                    labelStyle={{ fontWeight: 700, color: 'var(--theme-text)' }}
                                    itemStyle={{ color: 'var(--theme-primary)' }}
                                />
                                <Bar dataKey="count" fill="var(--theme-primary)" radius={[0, 8, 8, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState message="No geographic data yet." />
                    )}
                </AnalyticsPanel>

                {/* Platform Distribution */}
                <AnalyticsPanel
                    icon={<FiCpu />}
                    title="Platform Distribution"
                    loading={geoLoading}
                    compact
                >
                    {platformData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie data={platformData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                    {platformData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: 12, fontSize: 12 }}
                                    itemStyle={{ color: 'var(--theme-text)' }}
                                />
                                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState message="No platform data yet." />
                    )}
                </AnalyticsPanel>
            </div>

            {/* Panel 5: Prize Status */}
            <AnalyticsPanel
                icon={<FiAward />}
                title="Prize Status"
                loading={prizeLoading}
            >
                {prizeData.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs font-bold">
                            <thead>
                                <tr className="border-b-2 border-[var(--theme-border)]">
                                    <th className="text-left py-3 px-4 text-[var(--theme-text-muted)] uppercase tracking-widest font-black opacity-60">Place</th>
                                    <th className="text-left py-3 px-4 text-[var(--theme-text-muted)] uppercase tracking-widest font-black opacity-60">Team / Player</th>
                                    <th className="text-left py-3 px-4 text-[var(--theme-text-muted)] uppercase tracking-widest font-black opacity-60">Prize</th>
                                    <th className="text-left py-3 px-4 text-[var(--theme-text-muted)] uppercase tracking-widest font-black opacity-60">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {prizeData.map((row, i) => (
                                    <motion.tr
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="border-b border-[var(--theme-border)] hover:bg-[var(--theme-bg-alt)] transition-colors"
                                    >
                                        <td className="py-3 px-4 font-black uppercase italic text-[var(--theme-primary)]">{row.place ?? `#${i + 1}`}</td>
                                        <td className="py-3 px-4 text-[var(--theme-text)]">{row.team || row.player || '—'}</td>
                                        <td className="py-3 px-4 text-[var(--theme-text)]">{row.prize || '—'}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                row.status === 'paid' ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                : row.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                : 'bg-[var(--theme-bg-alt)] text-[var(--theme-text-muted)] border border-[var(--theme-border)]'
                                            }`}>
                                                {row.status || 'TBD'}
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState message="Prize data will appear once the tournament completes." />
                )}
            </AnalyticsPanel>
        </div>
    );
}

function AnalyticsPanel({ icon, title, loading, compact, children }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-[2rem] p-8"
        >
            <div className="flex items-center gap-3 mb-8">
                <div className="w-9 h-9 bg-[var(--theme-primary)]/10 rounded-xl flex items-center justify-center text-[var(--theme-primary)] text-lg">
                    {icon}
                </div>
                <h2 className="text-sm font-black uppercase tracking-widest italic text-[var(--theme-text)]">{title}</h2>
                {loading && (
                    <span className="ml-auto text-[10px] font-black uppercase tracking-wider text-[var(--theme-text-muted)] opacity-50 animate-pulse">Loading…</span>
                )}
            </div>
            {children}
        </motion.div>
    );
}

function EmptyState({ message }) {
    return (
        <div className="flex items-center justify-center h-40 text-[var(--theme-text-muted)] opacity-40">
            <p className="text-xs font-black uppercase tracking-widest italic">{message}</p>
        </div>
    );
}
