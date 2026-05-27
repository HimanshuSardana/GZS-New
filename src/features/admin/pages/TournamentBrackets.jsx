import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    FiGitBranch, FiCheck, FiEdit2, FiAlertCircle, FiArrowLeft, FiRefreshCw, 
    FiTerminal, FiActivity, FiGlobe, FiLayers, FiHash, FiZap, FiCpu, FiGrid
} from 'react-icons/fi';
import { MOCK_BRACKETS, MOCK_MATCHES } from '@/shared/data/tournamentData';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_BADGE = {
    completed: 'bg-[var(--status-success-soft)] text-[var(--status-success)] border-[var(--status-success)]/10 shadow-2xl',
    pending: 'bg-[var(--status-warning-soft)] text-[var(--status-warning)] border-[var(--status-warning)]/10 shadow-inner',
    live: 'bg-[var(--theme-primary-soft)] text-[var(--theme-primary)] border-[var(--theme-primary)]/20 shadow-2xl animate-pulse',
};

export default function TournamentBrackets() {
    const navigate = useNavigate();
    const [matches, setMatches] = useState(MOCK_MATCHES || []);
    const [editingMatch, setEditingMatch] = useState(null);
    const [scoreA, setScoreA] = useState('');
    const [scoreB, setScoreB] = useState('');

    const bracket = MOCK_BRACKETS[0];
    const rounds = [...new Set(matches.map(m => m.round_number))].sort();

    const openEdit = (match) => {
        setEditingMatch(match.id);
        setScoreA(match.score_a || '');
        setScoreB(match.score_b || '');
    };

    const saveResult = (matchId) => {
        const sA = parseInt(scoreA);
        const sB = parseInt(scoreB);
        const winner = sA > sB
            ? matches.find(m => m.id === matchId)?.participant_a_name
            : matches.find(m => m.id === matchId)?.participant_b_name;

        setMatches(prev => prev.map(m =>
            m.id === matchId
                ? { ...m, score_a: scoreA, score_b: scoreB, winner_name: winner, is_completed: true }
                : m
        ));
        setEditingMatch(null);
    };

    return (
        <div className="space-y-16 pb-32 relative min-h-screen">
            {/* Cinematic Background Artifacts */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[5%] right-[-10%] w-[70%] h-[70%] bg-[var(--theme-primary)]/5 blur-[180px] rounded-full" />
                <div className="absolute bottom-[-5%] left-[-5%] w-[50%] h-[50%] bg-[var(--theme-secondary)]/5 blur-3xl rounded-full" />
            </div>

            <header className="flex flex-col md:flex-row md:items-end justify-between gap-12 relative z-10 px-2">
                <div className="flex items-center gap-10">
                    <button
                        onClick={() => navigate('/admin/tournaments')}
                        className="w-16 h-16 bg-[var(--theme-card)]/80 backdrop-blur-3xl rounded-[1.8rem] border-2 border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] hover:border-[var(--theme-primary)]/30 transition-all shadow-2xl hover:scale-110 active:scale-95 group"
                    >
                        <FiArrowLeft size={24} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="space-y-8">
                        <div className="flex items-center gap-6 group">
                            <div className="w-16 h-1 bg-[var(--theme-primary)] rounded-full animate-pulse shadow-[0_0_15px_rgba(var(--theme-primary-rgb),0.5)]" />
                            <span className="text-sm font-black uppercase tracking-widest text-[var(--theme-primary)] italic leading-none opacity-80">v4.08_BRACKET_SHARD</span>
                        </div>
                        <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter italic leading-[0.8] text-[var(--theme-text)]">Tree <br/><span className="text-transparent opacity-20">ORCHESTRAL</span></h1>
                    </div>
                </div>

                <div className="flex items-center gap-6 relative z-10">
                    {bracket && (
                        <div className={`px-8 py-5 rounded-2xl border-2 text-xs font-black uppercase tracking-widest italic leading-none shadow-2xl ${
                            bracket.status === 'active' ? STATUS_BADGE.live :
                            bracket.status === 'completed' ? STATUS_BADGE.completed :
                            STATUS_BADGE.pending
                        }`}>{bracket.status === 'active' ? 'CIRCUIT_LIVE' : bracket.status.toUpperCase()}</div>
                    )}
                    <button className="bg-[var(--theme-text)] text-[var(--theme-bg)] px-10 py-5 rounded-[1.5rem] text-xs font-black uppercase tracking-wider italic hover:bg-[var(--theme-primary)] hover:text-white hover:scale-105 active:scale-95 transition-all flex items-center gap-4 shadow-2xl border-4 border-white/5  group/gen">
                        <FiRefreshCw size={18} strokeWidth={3} className="group-hover/gen:rotate-180 transition-transform duration-1000" /> RE_GENERATE_MATRIX
                    </button>
                </div>
            </header>

            {!bracket ? (
                <div className="bg-[var(--theme-card)]/40 backdrop-blur-3xl rounded-full border-4 border-dashed border-[var(--theme-border)] p-40 text-center flex flex-col items-center justify-center group hover:border-[var(--theme-primary)]/40 transition-all shadow-inner relative z-10 mx-2">
                    <div className="w-32 h-32 rounded-full bg-[var(--theme-bg-alt)]/50 flex items-center justify-center mb-10 group-hover:rotate-12 transition-all shadow-2xl relative overflow-hidden">
                         <FiAlertCircle size={50} className="text-[var(--theme-primary)] opacity-20 relative z-10 animate-pulse" strokeWidth={3} />
                         <div className="absolute inset-0 bg-gradient-to-tr from-[var(--theme-primary)]/10 to-transparent" />
                    </div>
                    <h3 className="text-[20px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-20 italic  mb-4 leading-none">BRACKET_TREE_NULL</h3>
                    <button className="mt-8 bg-[var(--theme-text)] text-[var(--theme-bg)] px-12 py-6 rounded-full text-sm font-black uppercase tracking-widest italic hover:bg-[var(--theme-primary)] hover:text-white transition-all shadow-2xl border-4 border-white/5 ">
                        INITIATE_TREE_SHARDING
                    </button>
                </div>
            ) : (
                <div className="space-y-16 relative z-10 mx-2">
                    {/* Tactical Shard Ledger */}
                    <div className="bg-[var(--theme-card)]/80 backdrop-blur-3xl rounded-[4rem] border-2 border-[var(--theme-border)] p-12 grid grid-cols-2 md:grid-cols-4 gap-12 shadow-2xl relative overflow-hidden group/ledger">
                        {[
                            { label: 'CIRCUIT_FORMAT', value: bracket.format.toUpperCase().replace('_', ' ') },
                            { label: 'NODE_QUOTA', value: `${bracket.size} NODES` },
                            { label: 'ACTIVE_TIER', value: `ROUND_0${bracket.current_round}` },
                            { label: 'MATRIX_DEPTH', value: bracket.total_rounds || '—' },
                        ].map(({ label, value }) => (
                            <div key={label} className="space-y-4 group/item">
                                <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-30 leading-none group-hover/item:text-[var(--theme-primary)] transition-colors">{label}</p>
                                <p className="text-2xl font-black text-[var(--theme-text)] italic tracking-tighter uppercase leading-none">{value}</p>
                            </div>
                        ))}
                        <FiGrid size={300} className="absolute bottom-[-100px] right-[-100px] text-[var(--theme-text)] opacity-[0.015] -rotate-12 group-hover/ledger:rotate-0 transition-transform duration-[15s] pointer-events-none" />
                    </div>

                    {/* Rounds Transmission Logs */}
                    {rounds.map((round, rIdx) => (
                        <div key={round} className="space-y-10">
                            <div className="flex items-center gap-8">
                                <div className="w-14 h-14 bg-[var(--theme-text)] text-[var(--theme-bg)] rounded-2xl flex items-center justify-center text-xl font-black italic shadow-2xl relative overflow-hidden group/num">
                                    <span className="relative z-10">{round}</span>
                                    <div className="absolute inset-0 bg-gradient-to-tr from-[var(--theme-primary)]/40 to-transparent" />
                                </div>
                                <h3 className="text-4xl font-black uppercase tracking-tighter text-[var(--theme-text)] italic leading-none opacity-80">Round_0{round} <span className="text-transparent opacity-20 ml-4 font-black">TRANSMISSION_TIER</span></h3>
                                <div className="flex-1 h-[2px] bg-gradient-to-r from-[var(--theme-border)] to-transparent opacity-30" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {matches.filter(m => m.round_number === round).map((match, mIdx) => (
                                    <motion.div 
                                        key={match.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: (rIdx * 0.1) + (mIdx * 0.05) }}
                                        className="bg-[var(--theme-card)]/80 backdrop-blur-3xl border-2 border-[var(--theme-border)] rounded-3xl overflow-hidden shadow-2xl group/match hover:border-[var(--theme-primary)]/40 transition-all"
                                    >
                                        {/* Match Header Artifact */}
                                        <div className="px-8 py-5 bg-[var(--theme-bg-alt)]/50 flex items-center justify-between border-b-2 border-dashed border-[var(--theme-border)]">
                                            <span className="text-xs font-black uppercase tracking-wider text-[var(--theme-text-muted)] opacity-30 italic leading-none">
                                                MATCH_ID: 0X_{match.match_number}
                                            </span>
                                            <span className={`px-4 py-1.5 text-xs font-black uppercase tracking-wide rounded-full italic border-2 shadow-inner ${
                                                match.is_completed ? STATUS_BADGE.completed : STATUS_BADGE.pending
                                            }`}>
                                                {match.is_completed ? 'SYNCED' : 'PENDING'}
                                            </span>
                                        </div>

                                        {/* Node Transmission Shards */}
                                        <div className="p-8 space-y-4">
                                            {[
                                                { name: match.participant_a_name, score: match.score_a, isWinner: match.winner_name === match.participant_a_name },
                                                { name: match.participant_b_name, score: match.score_b, isWinner: match.winner_name === match.participant_b_name },
                                            ].map(({ name, score, isWinner }, i) => (
                                                <div key={i} className={`flex items-center justify-between px-6 py-4 rounded-[1.5rem] border-2 transition-all ${
                                                    isWinner && match.is_completed ? 'bg-[var(--status-success-soft)] border-[var(--status-success)]/10 shadow-inner' : 'bg-[var(--theme-bg-alt)]/50 border-[var(--theme-border)]/50'
                                                }`}>
                                                    <div className="flex items-center gap-4">
                                                        {isWinner && match.is_completed && <FiCheck size={18} strokeWidth={3} className="text-[var(--status-success)] animate-pulse" />}
                                                        <span className={`text-sm font-black uppercase italic tracking-tighter ${isWinner && match.is_completed ? 'text-[var(--status-success)]' : 'text-[var(--theme-text)] opacity-60'}`}>
                                                            {name || 'NULL_NODE'}
                                                        </span>
                                                    </div>
                                                    <span className={`text-xl font-black tabular-nums italic ${isWinner && match.is_completed ? 'text-[var(--status-success)]' : 'text-[var(--theme-text)] opacity-40'}`}>{score ?? '__'}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Operational Controls */}
                                        {editingMatch === match.id ? (
                                            <div className="px-8 pb-8 space-y-6">
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="p-5 bg-[var(--theme-bg-alt)] rounded-2xl border-2 border-[var(--theme-border)] shadow-inner">
                                                        <label className="text-xs font-black text-[var(--theme-primary)] uppercase tracking-wide block mb-2 italic opacity-40">SIGNAL_A</label>
                                                        <input
                                                            type="number"
                                                            className="w-full bg-transparent text-xl font-black italic outline-none text-[var(--theme-text)] tabular-nums"
                                                            value={scoreA}
                                                            onChange={e => setScoreA(e.target.value)}
                                                            autoFocus
                                                        />
                                                    </div>
                                                    <div className="p-5 bg-[var(--theme-bg-alt)] rounded-2xl border-2 border-[var(--theme-border)] shadow-inner">
                                                        <label className="text-xs font-black text-[var(--theme-primary)] uppercase tracking-wide block mb-2 italic opacity-40">SIGNAL_B</label>
                                                        <input
                                                            type="number"
                                                            className="w-full bg-transparent text-xl font-black italic outline-none text-[var(--theme-text)] tabular-nums"
                                                            value={scoreB}
                                                            onChange={e => setScoreB(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex gap-4">
                                                    <button onClick={() => saveResult(match.id)} className="flex-1 bg-[var(--theme-text)] text-[var(--theme-bg)] py-4 rounded-2xl text-xs font-black uppercase tracking-wider italic hover:bg-[var(--status-success)] hover:text-white transition-all shadow-2xl">SYNC_LOGS</button>
                                                    <button onClick={() => setEditingMatch(null)} className="flex-1 bg-[var(--theme-bg-alt)] text-[var(--theme-text-muted)] py-4 rounded-2xl text-xs font-black uppercase tracking-wider italic border-2 border-[var(--theme-border)] hover:bg-[var(--status-error-soft)] hover:text-[var(--status-error)] transition-all">ABORT</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="px-8 pb-8">
                                                <button
                                                    onClick={() => openEdit(match)}
                                                    className="w-full py-4 text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] border-2 border-dashed border-[var(--theme-border)] rounded-[1.5rem] hover:border-[var(--theme-primary)]/40 transition-all flex items-center justify-center gap-4 italic group/entry"
                                                >
                                                    <FiEdit2 size={16} strokeWidth={3} className="group-hover/entry:scale-125 transition-transform" /> {match.is_completed ? 'OVERRIDE_LOGS' : 'ENTER_RESULT_STREAM'}
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                    <FiTerminal size={500} className="absolute bottom-[-150px] right-[-150px] text-[var(--theme-text)] opacity-[0.01] rotate-12 pointer-events-none group-hover/manifest:rotate-0 transition-transform duration-[20s]" />
                </div>
            )}

            {/* Global Telemetry Artifacts */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mx-2 relative z-10">
                 <TelemetryCard label="TREE_STABILITY" value="OPTIMAL" icon={<FiCpu />} color="var(--status-success)" />
                 <TelemetryCard label="NODE_TRANSMISSION" value="ACTIVE" icon={<FiActivity />} color="var(--theme-primary)" />
                 <TelemetryCard label="GLOBAL_GZONESPHERE_SYNC" value="SECURE" icon={<FiGlobe />} color="var(--status-warning)" />
                 <TelemetryCard label="MATRIX_DEP_0X" value="SHARD_v4" icon={<FiHash />} color="var(--theme-secondary)" />
            </div>
        </div>
    );
}

function TelemetryCard({ label, value, icon, color }) {
    return (
        <div className="bg-[var(--theme-card)]/80 backdrop-blur-3xl rounded-3xl border-2 border-[var(--theme-border)] p-10 shadow-2xl space-y-4 hover:border-[var(--theme-primary)]/40 hover:-translate-y-2 transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--theme-primary)] opacity-5 rounded-full blur-[40px] -mr-16 -mt-16" />
            <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-30 leading-none group-hover:text-[var(--theme-primary)] transition-colors group-hover:opacity-60">
                 {React.cloneElement(icon, { size: 16, strokeWidth: 3, className: 'animate-pulse' })} {label}
            </div>
            <p className="text-3xl font-black uppercase tracking-tighter italic text-[var(--theme-text)] leading-none relative z-10" style={{ color: color }}>{value}</p>
        </div>
    );
}








