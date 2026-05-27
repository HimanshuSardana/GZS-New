import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiGitBranch, FiUsers, FiAward, FiZap, FiTarget, FiCpu, FiActivity, FiTerminal, FiCheck } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import { useTournament, useTournamentBracket } from '@/services/mutators/useTournaments';

const MOCK_BRACKET = {
    rounds: [
        {
            title: 'QUARTER_FINALS',
            matches: [
                { id: 'NODE_01', t1: 'ALPHA_SQUAD', t2: 'BETA_KNIGHTS', s1: 2, s2: 1, win: 1 },
                { id: 'NODE_02', t1: 'DELTA_FORCE', t2: 'GAMMA_RAY', s1: 0, s2: 2, win: 2 },
                { id: 'NODE_03', t1: 'EPSILON_PRO', t2: 'ZETA_GZONE', s1: 2, s2: 0, win: 1 },
                { id: 'NODE_04', t1: 'THETA_ELITE', t2: 'SIGMA_PLAY', s1: null, s2: null, win: null },
            ]
        },
        {
            title: 'SEMI_FINALS',
            matches: [
                { id: 'NODE_05', t1: 'ALPHA_SQUAD', t2: 'GAMMA_RAY', s1: null, s2: null, win: null },
                { id: 'NODE_06', t1: 'EPSILON_PRO', t2: 'TBD_NODE', s1: null, s2: null, win: null },
            ]
        },
        {
            title: 'GRAND_FINALS',
            matches: [
                { id: 'NODE_07', t1: 'TBD_NODE_A', t2: 'TBD_NODE_B', s1: null, s2: null, win: null },
            ]
        }
    ]
};

export default function TournamentBrackets() {
    const { slug } = useParams();
    const navigate = useNavigate();
    usePageTheme('tournaments-page');

    const { data: tournament } = useTournament(slug);
    const { data: bracketData, refetch: refetchBracket } = useTournamentBracket(slug);
    const isLive = (tournament?.status || '').toLowerCase() === 'live';
    const [flashedMatches, setFlashedMatches] = useState(new Set());
    const prevBracketRef = useRef(null);

    useEffect(() => {
        if (!isLive) return;
        const interval = setInterval(() => {
            refetchBracket().then(({ data: fresh }) => {
                if (!fresh || !prevBracketRef.current) { prevBracketRef.current = fresh; return; }
                const changed = new Set();
                const prevMatches = prevBracketRef.current?.rounds?.flatMap(r => r.matches) || [];
                const freshMatches = fresh?.rounds?.flatMap(r => r.matches) || [];
                freshMatches.forEach((m, i) => {
                    const p = prevMatches[i];
                    if (!p || JSON.stringify(m) !== JSON.stringify(p)) changed.add(m.id || i);
                });
                if (changed.size > 0) {
                    setFlashedMatches(changed);
                    setTimeout(() => setFlashedMatches(new Set()), 1000);
                }
                prevBracketRef.current = fresh;
            });
        }, 15000);
        return () => clearInterval(interval);
    }, [isLive, refetchBracket]);

    const displayBracket = bracketData?.rounds ? bracketData : MOCK_BRACKET;

    return (
        <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] font-body selection:bg-[var(--theme-primary)]/30 theme-tournaments pb-32">
            <Helmet>
                <title>Tournament Brackets | GzoneSphere Competitive Hierarchy</title>
                <meta name="description" content="Track live progress and match pairings in GzoneSphere tournament brackets. Visualize the road to the finals and monitor your favorite teams." />
                <meta property="og:title" content="Tournament Brackets | GzoneSphere Competitive Hierarchy" />
                <meta property="og:description" content="Live progress and match pairings for GzoneSphere competitive events." />
                <link rel="canonical" href={window.location.href} />
            </Helmet>

            {/* Cinematic Background Artifacts */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[var(--theme-primary)]/5 blur-3xl rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-[var(--theme-primary)]/5 blur-3xl rounded-full" />
            </div>

            {/* Header */}
            <header className="pt-32 pb-16 border-b-2 border-[var(--theme-border)]/50 border-dashed relative z-10 bg-[var(--theme-bg)]/80 backdrop-blur-md sticky top-0">
                <div className="max-w-[1600px] mx-auto px-8 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex items-center gap-10">
                        <button 
                            onClick={() => navigate(-1)}
                            className="w-16 h-16 bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-2xl flex items-center justify-center hover:text-[var(--theme-primary)] hover:border-[var(--theme-primary)]/40 transition-all shadow-xl group"
                        >
                            <FiChevronLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-4 mb-3">
                                <div className="w-1.5 h-4 bg-[var(--theme-primary)] rounded-full animate-pulse" />
                                <span className="text-xs font-black uppercase tracking-widest text-[var(--theme-primary)] italic leading-none">Tournament_Brackets v4.08</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic leading-none text-[var(--theme-text)]">Mission <span className="text-[var(--theme-text-muted)] opacity-20">HEIRARCHY</span></h1>
                            <p className="text-xs font-black text-[var(--theme-text-muted)] opacity-40 uppercase tracking-wider italic mt-2 leading-none">{slug?.replace(/-/g, ' ')} // BRACKET_TRACE</p>
                        </div>
                    </div>
                    
                    <div className="hidden md:flex items-center gap-6">
                        {/* Legend */}
                        <div className="flex items-center gap-5 px-8 py-4 bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-3xl shadow-sm">
                            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-[var(--theme-text-muted)]">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" /> Live
                            </span>
                            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-[var(--theme-text-muted)]">
                                <span className="w-2 h-2 rounded-full bg-[var(--theme-primary)] inline-block" /> Completed
                            </span>
                            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-[var(--theme-text-muted)]">
                                <span className="w-2 h-2 rounded-full bg-gray-500 inline-block" /> Upcoming
                            </span>
                        </div>
                        <div className="px-10 py-5 bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-3xl flex items-center gap-4 italic group hover:border-[var(--theme-primary)]/40 transition-all shadow-sm">
                            <FiUsers className="text-[var(--theme-primary)] group-hover:rotate-12 transition-transform" />
                            <span className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)]">32 OPERATORS</span>
                        </div>
                        {isLive ? (
                            <div className="px-10 py-5 bg-red-600/10 border-2 border-red-500/30 rounded-3xl flex items-center gap-4 italic shadow-2xl shadow-red-600/10">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                                <span className="text-xs font-black uppercase tracking-widest text-red-400">LIVE · Updates every 15s</span>
                            </div>
                        ) : (
                            <div className="px-10 py-5 bg-[var(--theme-primary)]/10 border-2 border-[var(--theme-primary)]/20 rounded-3xl flex items-center gap-4 italic shadow-2xl shadow-[var(--theme-primary)]/10">
                                <FiZap className="text-[var(--theme-primary)] animate-pulse" />
                                <span className="text-xs font-black uppercase tracking-widest text-[var(--theme-primary)]">LIVE_PROTOCOL</span>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            
            {/* Bracket Area */}
            <main className="pt-24 pb-20 overflow-x-auto min-h-[80vh] flex items-start hide-scrollbar relative z-10">
                <div className="flex gap-24 px-12 lg:px-32 min-w-max mx-auto h-[800px] items-center">
                    {displayBracket.rounds.map((round, rIndex) => (
                        <div key={round.title} className="flex flex-col gap-20 relative">
                            <div className="text-center space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-30 italic leading-none">{round.title}</h3>
                                <div className="h-1 w-16 bg-[var(--theme-primary)]/20 mx-auto rounded-full" />
                            </div>

                            <div className={`flex flex-col justify-around h-full gap-16`}>
                                {round.matches.map((match, mIndex) => (
                                    <div key={match.id} className="relative group">
                                        <MatchNode match={match} isFlashing={flashedMatches.has(match.id || mIndex)} />
                                        
                                        {/* Dynamic Connectors (Forensic Lines) */}
                                        {rIndex < displayBracket.rounds.length - 1 && (
                                            <div 
                                                className={`absolute left-[100%] top-1/2 w-24 flex items-center`}
                                                style={{ height: 'calc(100% + 64px)' }}
                                            >
                                                <div className="w-12 h-0.5 bg-[var(--theme-border)] group-hover:bg-[var(--theme-primary)]/40 transition-all duration-500" />
                                                <div className={`
                                                    w-0.5 h-full bg-[var(--theme-border)] group-hover:bg-[var(--theme-primary)]/40 transition-all duration-500 absolute left-12
                                                    ${mIndex % 2 === 0 ? 'top-1/2' : 'bottom-1/2'}
                                                `} />
                                                <div className={`
                                                    w-12 h-0.5 bg-[var(--theme-border)] group-hover:bg-[var(--theme-primary)]/40 transition-all duration-500 absolute left-12
                                                    ${mIndex % 2 === 0 ? 'top-[100%]' : 'top-0'}
                                                `} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Trophy Node - The Apex Terminal */}
                    <div className="flex flex-col items-center gap-12 pl-12">
                         <div className="text-center space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-widest text-[var(--status-success)] italic leading-none">GRAND_APEX</h3>
                                <div className="h-1.5 w-24 bg-[var(--status-success)]/30 mx-auto rounded-full shadow-[0_0_10px_rgba(var(--status-success-rgb),0.5)] animate-pulse" />
                            </div>
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 1, type: "spring", damping: 12 }}
                            className="w-64 h-80 rounded-[4rem] bg-[var(--theme-card)] border-2 border-[var(--status-success)]/40 flex flex-col items-center justify-center p-10 text-center relative shadow-2xl shadow-[var(--status-success)]/20 group hover:border-[var(--status-success)] transition-all duration-700 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--status-success)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-24 h-24 bg-[var(--status-success)]/10 rounded-3xl flex items-center justify-center text-[var(--status-success)] mb-8 shadow-inner border border-[var(--status-success)]/20 group-hover:rotate-12 transition-transform duration-700">
                                    <FiAward size={56} strokeWidth={2.5} className="animate-pulse" />
                                </div>
                                <p className="text-xs font-black uppercase tracking-wider text-[var(--status-success)] mb-4 italic opacity-80 leading-none">APEX_OPERATOR</p>
                                <h4 className="text-2xl font-black uppercase italic tracking-tighter text-[var(--theme-text)] leading-none">SYNC_WAITING...</h4>
                            </div>
                            <FiActivity size={150} className="absolute bottom-[-40px] right-[-40px] text-[var(--status-success)] opacity-[0.05] group-hover:scale-125 transition-transform duration-[5s] pointer-events-none" />
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function MatchNode({ match, isFlashing }) {
    return (
        <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="w-80 bg-[var(--theme-card)] border-2 rounded-3xl overflow-hidden shadow-2xl transition-all relative"
            style={{
                borderColor: isFlashing ? '#4ade80' : undefined,
                boxShadow: isFlashing ? '0 0 20px rgba(74,222,128,0.35)' : undefined,
                transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
            }}
        >
            <div className="px-6 py-2.5 bg-[var(--theme-bg-alt)] border-b-2 border-dashed border-[var(--theme-border)] flex items-center justify-between">
                <span className="text-xs font-black text-[var(--theme-text-muted)] tracking-wider italic uppercase opacity-40">{match.id}</span>
                <FiTerminal size={12} className="text-[var(--theme-primary)] opacity-20 group-hover:opacity-100 transition-opacity" />
            </div>
            
            <div className="p-8 space-y-4">
                <TeamSlot team={match.t1} score={match.s1} winner={match.win === 1} />
                
                <div className="flex items-center gap-6 px-6 h-6">
                    <div className="flex-1 h-0.5 bg-[var(--theme-border)] opacity-30" />
                    <span className="text-xs font-black text-[var(--theme-text-muted)] opacity-20 uppercase italic tracking-widest">VERSUS_STRENGTH</span>
                    <div className="flex-1 h-0.5 bg-[var(--theme-border)] opacity-30" />
                </div>

                <TeamSlot team={match.t2} score={match.s2} winner={match.win === 2} />
            </div>
            
            {match.win && (
                <div className="px-6 py-3 bg-[var(--status-success)]/10 border-t-2 border-dashed border-[var(--status-success)]/30 flex items-center justify-center gap-4">
                    <div className="w-1.5 h-1.5 bg-[var(--status-success)] rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--status-success-rgb),0.8)]" />
                    <span className="text-xs font-black text-[var(--status-success)] uppercase tracking-widest italic">SYNC_FINALIZED</span>
                </div>
            )}
        </motion.div>
    );
}

function TeamSlot({ team, score, winner }) {
    return (
        <div className={`flex items-center justify-between p-4 rounded-[1.8rem] transition-all border-2 ${winner ? 'bg-[var(--theme-primary)]/[0.08] border-[var(--theme-primary)]/40 shadow-inner' : 'bg-transparent border-transparent opacity-60 hover:opacity-100 hover:bg-[var(--theme-bg-alt)]'}`}>
            <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base italic tracking-tighter transition-all duration-700 ${winner ? 'bg-[var(--theme-primary)] text-white shadow-2xl shadow-[var(--theme-primary)]/30 scale-110 rotate-6' : 'bg-[var(--theme-bg-alt)] border-2 border-[var(--theme-border)] text-[var(--theme-text-muted)] opacity-50'}`}>
                    {team[0]}
                </div>
                <div className="space-y-1">
                    <span className={`text-sm font-black uppercase tracking-widest italic leading-none ${winner ? 'text-[var(--theme-text)]' : 'text-[var(--theme-text-muted)]'}`}>
                        {team}
                    </span>
                    <p className="text-xs font-black text-[var(--theme-text-muted)] opacity-30 uppercase tracking-wider italic leading-none">NODE_LINK</p>
                </div>
            </div>
            <span className={`text-2xl font-black italic tracking-tighter leading-none ${winner ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-text-muted)] opacity-20'}`}>{score ?? '—'}</span>
        </div>
    );
}








