import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FiChevronLeft, FiAward, FiDownload, FiStar, FiZap,
    FiTarget, FiShield, FiCpu, FiTrendingUp, FiActivity, FiTerminal, FiHash
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import { MOCK_RESULTS } from '@/shared/data/tournamentData';

const STANDINGS = MOCK_RESULTS.map((r, i) => ({
    rank: r.placement,
    name: r.winner_name,
    reward: r.prize_awarded,
    score: r.stats_snapshot?.maps_won != null
        ? `${r.stats_snapshot.maps_won}-${r.stats_snapshot.maps_lost}-0`
        : '—',
    xp: ['+2500', '+1200', '+800', '+400', '+200'][i] || '+100',
    trend: ['up', 'stable', 'down', 'up', 'stable'][i] || 'stable',
}));

export default function TournamentResults() {
    const { slug } = useParams();
    const navigate = useNavigate();
    usePageTheme('tournaments-page');
    
    return (
        <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] font-body selection:bg-[var(--theme-primary)]/30 pb-48">
            <Helmet>
                <title>Tournament Results | GzoneSphere Hall of Fame</title>
                <meta name="description" content="Relive the greatest moments and final standings from GzoneSphere tournaments. View winners, prize distributions, and performance metrics." />
                <meta property="og:title" content="Tournament Results | GzoneSphere Hall of Fame" />
                <meta property="og:description" content="Official results and final standings for GzoneSphere competitive events." />
                <link rel="canonical" href={window.location.href} />
            </Helmet>

            {/* Cinematic Background Artifacts */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[var(--theme-primary)]/5 blur-[180px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-[var(--theme-primary)]/5 blur-[180px] rounded-full" />
            </div>

            {/* ── HEADER ── */}
            <header className="pt-40 pb-20 border-b-4 border-[var(--theme-border)] border-dashed relative z-10 bg-[var(--theme-bg)]/80 backdrop-blur-3xl sticky top-0 border-opacity-20 shadow-2xl">
                <div className="max-w-[1600px] mx-auto px-8 lg:px-20 flex flex-col md:flex-row items-center justify-between gap-16">
                    <div className="flex items-center gap-14 w-full md:w-auto">
                        <button 
                            onClick={() => navigate(-1)}
                            className="w-20 h-20 bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-3xl flex items-center justify-center hover:text-[var(--theme-primary)] hover:border-[var(--theme-primary)]/40 transition-all shadow-2xl group"
                        >
                            <FiChevronLeft size={36} strokeWidth={3} className="group-hover:-translate-x-3 transition-transform duration-500" />
                        </button>
                        <div className="space-y-4">
                            <div className="flex items-center gap-6">
                                <span className="px-8 py-3 bg-[var(--status-success-soft)] text-[var(--status-success)] text-sm font-black uppercase tracking-widest rounded-full border-2 border-[var(--status-success)]/10 italic animate-pulse">MISSION_COMPLETED_v4</span>
                                <div className="w-3 h-3 bg-[var(--status-success)] rounded-full shadow-[0_0_15px_rgba(var(--status-success-rgb),0.8)]" />
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic leading-none text-[var(--theme-text)]">FORCE <span className="opacity-10">STANDINGS</span></h1>
                            <p className="text-sm text-[var(--theme-text-muted)] font-black uppercase tracking-widest italic opacity-40 mt-4">{slug?.replace(/-/g, ' ')} // BOUNTY_SYNC_ARCHIVE_v4.08</p>
                        </div>
                    </div>
                    
                    <button className="w-full md:w-auto px-12 py-8 bg-[var(--theme-text)] text-[var(--theme-bg)] rounded-3xl text-sm font-black uppercase tracking-widest shadow-2xl hover:bg-[var(--theme-primary)] hover:text-white hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-8 italic group border-4 border-white/5 ">
                        <FiDownload size={28} strokeWidth={4} className="group-hover:translate-y-3 transition-transform duration-500" /> EXPORT_RECON_DATA
                    </button>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto px-8 lg:px-20 pt-32 space-y-32 relative z-10">
                
                {/* ── MVP SHARD (Task 4 Enhancement) ── */}
                <section className="grid lg:grid-cols-3 gap-16">
                    <div className="lg:col-span-2 relative group overflow-hidden rounded-full border-4 border-[var(--theme-border)] bg-[var(--theme-card)] shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-r from-[var(--theme-card)] via-[var(--theme-card)]/40 to-transparent z-10" />
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070')] bg-cover bg-center grayscale opacity-10 group-hover:scale-105 transition-transform duration-[12s]" />
                        
                        <div className="relative z-20 p-20 space-y-12">
                            <div className="flex items-center gap-8">
                                <div className="w-16 h-16 bg-[var(--theme-primary)] text-white rounded-3xl flex items-center justify-center shadow-2xl border-2 border-white/10 group-hover:rotate-12 transition-transform duration-700">
                                    <FiStar className="fill-white" size={32} strokeWidth={2.5} />
                                </div>
                                <span className="text-sm font-black uppercase tracking-widest text-[var(--theme-primary)] italic leading-none">ALPHA_ENTITY_OF_MATCH_v4</span>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-30">OPERATOR_ID_TRACE</h3>
                                <h2 className="text-7xl md:text-[10rem] font-black uppercase tracking-tighter italic leading-[0.8] text-[var(--theme-text)] opacity-95 group-hover:text-[var(--theme-primary)] transition-colors duration-700">GHOST_SNIPER-01</h2>
                            </div>
                            <div className="flex flex-wrap gap-20 pt-10 border-t-2 border-dashed border-[var(--theme-border)]/50">
                                <MVPStat label="K/D_RATIO" value="4.2" />
                                <MVPStat label="ACCURACY_RATE_SYNC" value="98%" />
                                <MVPStat label="OBJECTIVES_SECURED" value="12" />
                            </div>
                        </div>
                    </div>

                    <div className="p-20 bg-[var(--theme-text)] rounded-[5.5rem] text-[var(--theme-bg)] space-y-16 flex flex-col justify-center relative overflow-hidden shadow-2xl group cursor-default border-4 border-[var(--theme-primary)]/10">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--theme-primary)] opacity-[0.15] rounded-full blur-[120px] -mr-64 -mt-64 group-hover:scale-150 transition-transform duration-[15s]" />
                        <FiAward size={300} className="absolute -right-32 -bottom-32 text-black/5 rotate-12 group-hover:rotate-[360deg] transition-transform duration-[10s] pointer-events-none" />
                        
                        <div className="space-y-8 relative z-10">
                           <h3 className="text-sm font-black uppercase tracking-widest italic mb-4 leading-none opacity-40 text-[var(--theme-bg)]">ENGAGEMENT_BOUNTY_RESERVE</h3>
                           <p className="text-8xl font-black uppercase tracking-tighter italic leading-none text-[var(--theme-primary)] shadow-2xl">₹50,000</p>
                        </div>
                        <div className="space-y-10 relative z-10">
                            <p className="text-sm font-black uppercase tracking-wider leading-relaxed italic opacity-60 text-[var(--theme-bg)]">ALLOCATED_TO_ALPHA_SQUAD_CENTRAL. <br /> TRUTH_PROTOCOL_VERIFICATION: <span className="text-[var(--theme-primary)]">ACTIVE</span></p>
                            <button className="w-full py-8 bg-[var(--theme-primary)] text-white rounded-3xl text-base font-black uppercase tracking-widest italic hover:scale-105 active:scale-95 transition-all shadow-2xl  border-4 border-white/5">SECURE_BOUNTY_CREDIT</button>
                        </div>
                    </div>
                </section>

                {/* ── DYNAMIC STANDINGS ── */}
                <section className="space-y-20 relative z-10">
                    <div className="flex items-center justify-between px-12 pb-4 border-b-2 border-dashed border-[var(--theme-border)]/50">
                        <h3 className="text-4xl font-black uppercase tracking-tighter italic text-[var(--theme-text)] flex items-center gap-10">
                            <FiTarget className="text-[var(--theme-primary)] animate-pulse" size={32} strokeWidth={3} /> FINAL_MISSION_RANKINGS
                        </h3>
                        <div className="flex items-center gap-6 text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-30">
                            SORT: PERFORMANCE_DESC <FiCpu className="animate-spin-slow" />
                        </div>
                    </div>

                    <div className="w-full overflow-hidden border-4 border-[var(--theme-border)] rounded-[6rem] bg-[var(--theme-card)] shadow-2xl group/table">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1200px]">
                                <thead>
                                    <tr className="border-b-4 border-[var(--theme-border)]/50 bg-[var(--theme-bg-alt)]/50">
                                        <th className="px-14 py-12 text-sm font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic leading-none opacity-40">RANK</th>
                                        <th className="px-14 py-12 text-sm font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic leading-none opacity-40">DOMAIN_OPERATOR_SIGNATURE</th>
                                        <th className="px-14 py-12 text-sm font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic leading-none opacity-40">SYNC_RECORD (W/L/D)</th>
                                        <th className="px-14 py-12 text-sm font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic leading-none opacity-40">BOUNTY_SYNC_v4</th>
                                        <th className="px-14 py-12 text-sm font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic leading-none opacity-40">XP_ALLOCATION_MATRIX</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y-4 divide-dashed divide-[var(--theme-border)]/20">
                                    {STANDINGS.map((res, i) => (
                                        <motion.tr 
                                            key={res.rank}
                                            initial={{ opacity: 0, scale: 0.98, x: -20 }}
                                            whileInView={{ opacity: 1, scale: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.08, duration: 0.6 }}
                                            className="group/row hover:bg-[var(--theme-bg-alt)]/40 transition-all cursor-crosshair relative"
                                        >
                                            <td className="px-14 py-12">
                                                <div className={`w-18 h-18 rounded-2xl flex items-center justify-center font-black text-3xl italic tracking-tighter transition-all duration-700 shadow-xl ${
                                                    res.rank === 1 ? 'bg-[var(--theme-text)] text-[var(--theme-bg)] group-hover/row:bg-[var(--theme-primary)] group-hover/row:text-white shadow-[var(--theme-primary)]/20' : 
                                                    res.rank === 2 ? 'bg-[var(--theme-card)] text-[var(--theme-text)] border-2 border-[var(--theme-border)]' :
                                                    'bg-[var(--theme-bg-alt)] text-[var(--theme-text-muted)] opacity-40'
                                                }`}>
                                                    {res.rank}
                                                </div>
                                            </td>
                                            <td className="px-14 py-12">
                                                <div className="flex items-center gap-10">
                                                    <div className="w-16 h-16 rounded-[1.8rem] bg-[var(--theme-bg-alt)] border-4 border-[var(--theme-border)] flex items-center justify-center text-xl font-black italic shadow-inner group-hover/row:bg-[var(--theme-primary)] group-hover/row:scale-110 group-hover/row:text-white transition-all shadow-xl group-hover/row:rotate-12 duration-700">
                                                        {res.name[0]}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <span className="text-3xl font-black uppercase tracking-tighter text-[var(--theme-text)] group-hover/row:text-[var(--theme-primary)] transition-colors italic leading-none">
                                                            {res.name}
                                                        </span>
                                                        <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-30 italic leading-none">NODE_SIGNATURE_STABLE</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-14 py-12 font-black text-xl text-[var(--theme-text-muted)] italic tracking-wider opacity-60">[{res.score}]</td>
                                            <td className="px-14 py-12 font-black text-4xl text-[var(--theme-primary)] italic tracking-tighter leading-none group-hover/row:scale-110 transition-transform origin-left">{res.reward}</td>
                                            <td className="px-14 py-12">
                                                <div className="flex items-center gap-8">
                                                    <span className="px-10 py-4 bg-[var(--theme-text)] text-[var(--theme-bg)] rounded-[1.5rem] text-sm font-black uppercase tracking-widest italic group-hover/row:bg-[var(--status-success)] group-hover/row:text-white transition-all shadow-2xl shadow-black/30">{res.xp} XP</span>
                                                    <FiTrendingUp className="text-[var(--status-success)] opacity-0 group-hover/row:opacity-100 group-hover/row:translate-x-4 transition-all duration-500 scale-150" strokeWidth={4} />
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* ── CORE TELEMETRY CLUSTERS ── */}
                <section className="grid md:grid-cols-4 gap-12 relative z-10">
                    <SmallStat icon={<FiTarget className="text-[var(--theme-primary)]" />} label="DATA_PACKETS_v4" value="1.2M+" />
                    <SmallStat icon={<FiShield className="text-[var(--status-success)]" />} label="INTEGRITY_SHARD" value="99.8%" />
                    <SmallStat icon={<FiZap className="text-[var(--status-warning)] animate-pulse" />} label="CORE_LATENCY_SYNC" value="24ms" />
                    <SmallStat icon={<FiCpu className="text-[var(--theme-secondary)]" />} label="PEAK_NODES_ACTIVE" value="2,400" />
                </section>
            </main>
        </div>
    );
}

function MVPStat({ label, value }) {
    return (
        <div className="space-y-4">
            <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-30 leading-none">{label}</p>
            <p className="text-5xl font-black uppercase tracking-tighter italic text-[var(--theme-text)] leading-none opacity-80">{value}</p>
        </div>
    );
}

function SmallStat({ icon, label, value }) {
    return (
        <div className="p-14 rounded-full bg-[var(--theme-card)] border-4 border-[var(--theme-border)] flex flex-col gap-10 group hover:border-[var(--theme-primary)]/40 transition-all shadow-sm relative overflow-hidden group/stat">
            <div className="w-20 h-20 rounded-2xl bg-[var(--theme-bg-alt)] border-2 border-[var(--theme-border)] flex items-center justify-center text-4xl transition-all group-hover:rotate-12 group-hover:scale-110 shadow-inner group-hover/stat:bg-[var(--theme-text)] group-hover/stat:text-[var(--theme-bg)] group-hover/stat:border-transparent duration-700">
                {React.cloneElement(icon, { size: 40, strokeWidth: 3 })}
            </div>
            <div className="space-y-4 relative z-10">
                <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-30 italic leading-none">{label}</p>
                <p className="text-4xl font-black uppercase tracking-tighter italic text-[var(--theme-text)] leading-none group-hover/stat:text-[var(--theme-primary)] transition-colors duration-500">{value}</p>
            </div>
            <FiActivity size={180} className="absolute bottom-[-40px] right-[-40px] opacity-[0.015] text-[var(--theme-text)] pointer-events-none group-hover:rotate-45 transition-transform duration-[4s]" />
        </div>
    );
}








