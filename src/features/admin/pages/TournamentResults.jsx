import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    FiAward, FiArrowLeft, FiEdit2, FiCheck, FiPlus, 
    FiTerminal, FiActivity, FiGlobe, FiLayers, FiHash, FiZap, FiTarget, FiCpu, FiX
} from 'react-icons/fi';
import { MOCK_RESULTS } from '@/shared/data/tournamentData';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CONFIG = {
    finalized: { label: 'RESULT_LOCKED', classes: 'bg-[var(--status-success-soft)] text-[var(--status-success)] border-[var(--status-success)]/10 shadow-2xl' },
    pending: { label: 'PENDING_ADJUDICATION', classes: 'bg-[var(--status-warning-soft)] text-[var(--status-warning)] border-[var(--status-warning)]/10 shadow-inner' },
    disputed: { label: 'ANOMALY_DISPUTED', classes: 'bg-[var(--status-error-soft)] text-[var(--status-error)] border-[var(--status-error)]/10 shadow-[0_0_20px_rgba(var(--status-error-rgb),0.3)] animate-pulse' },
};

const PLACEMENT_MEDAL = { 1: '🏆', 2: '🥈', 3: '🥉' };

export default function TournamentResults() {
    const navigate = useNavigate();
    const [results, setResults] = useState(MOCK_RESULTS);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [finalized, setFinalized] = useState(false);

    const openEdit = (result) => {
        setEditingId(result.id);
        setEditForm({
            winner_name: result.winner_name || '',
            prize_awarded: result.prize_awarded || '',
            notes: result.notes || '',
        });
    };

    const saveEdit = (resultId) => {
        setResults(prev => prev.map(r =>
            r.id === resultId ? { ...r, ...editForm } : r
        ));
        setEditingId(null);
    };

    return (
        <div className="space-y-16 pb-32 relative min-h-screen">
            {/* Cinematic Background Artifacts */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[10%] left-[-5%] w-[70%] h-[70%] bg-[var(--theme-primary)]/5 blur-[180px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[var(--status-warning)]/5 blur-3xl rounded-full" />
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
                            <div className="w-16 h-1 bg-[var(--status-warning)] rounded-full animate-pulse shadow-[0_0_15px_rgba(var(--status-warning-rgb),0.5)]" />
                            <span className="text-sm font-black uppercase tracking-widest text-[var(--status-warning)] italic leading-none opacity-80">v4.08_GZONESPHERE_OUTCOME</span>
                        </div>
                        <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter italic leading-[0.8] text-[var(--theme-text)]">Victor <br/><span className="text-transparent opacity-20">ENSHRINEMENT</span></h1>
                    </div>
                </div>

                <div className="flex items-center gap-6 relative z-10">
                    {finalized && (
                        <div className="bg-[var(--status-success-soft)] border-2 border-[var(--status-success)]/10 px-8 py-5 rounded-2xl shadow-2xl animate-[fadeIn_0.5s_ease-out] flex items-center gap-4">
                             <FiCheck size={18} className="text-[var(--status-success)]" strokeWidth={3} />
                             <span className="text-xs font-black uppercase tracking-widest text-[var(--status-success)] italic leading-none">PROTOCOL_FINALIZED</span>
                        </div>
                    )}
                    <div className="flex bg-[var(--theme-card)]/80 backdrop-blur-3xl p-3 rounded-3xl border-2 border-[var(--theme-border)] shadow-2xl gap-4">
                        <button className="flex items-center gap-4 px-8 py-5 rounded-[1.5rem] text-xs font-black uppercase tracking-wider text-[var(--theme-text-muted)] hover:bg-[var(--theme-bg-alt)] hover:text-[var(--theme-text)] transition-all italic leading-none group/add">
                            <FiPlus size={16} strokeWidth={3} className="group-hover/add:rotate-90 transition-transform" /> ADD_PLACEMENT
                        </button>
                        {!finalized && (
                            <button
                                onClick={() => setFinalized(true)}
                                className="bg-[var(--theme-text)] text-[var(--theme-bg)] px-10 py-5 rounded-[1.5rem] text-xs font-black uppercase tracking-wider italic hover:bg-[var(--status-success)] hover:text-white hover:scale-105 active:scale-95 transition-all flex items-center gap-4 shadow-2xl border-4 border-white/5  group/fin"
                            >
                                <FiCheck size={18} strokeWidth={3} className="group-hover/fin:scale-125" /> EXEC_FINALIZE
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="relative z-10 mx-2">
                {results.length === 0 ? (
                    <div className="bg-[var(--theme-card)]/40 backdrop-blur-3xl rounded-full border-4 border-dashed border-[var(--theme-border)] p-40 text-center flex flex-col items-center justify-center group hover:border-[var(--theme-primary)]/40 transition-all shadow-inner">
                        <div className="w-32 h-32 rounded-full bg-[var(--theme-bg-alt)]/50 flex items-center justify-center mb-10 group-hover:rotate-12 transition-all shadow-2xl relative overflow-hidden">
                             <FiAward size={50} className="text-[var(--status-warning)] opacity-20 relative z-10 animate-pulse" strokeWidth={3} />
                             <div className="absolute inset-0 bg-gradient-to-tr from-[var(--status-warning)]/10 to-transparent" />
                        </div>
                        <h3 className="text-[20px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-20 italic  mb-4 leading-none">PODIUM_REGISTRY_NULL</h3>
                        <p className="text-sm font-black uppercase tracking-wider text-[var(--theme-text-muted)] opacity-30 italic leading-none mt-4">AWAITING_CIRCUIT_COMPLETION_LINK_v4</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8">
                        {results.sort((a, b) => a.placement - b.placement).map((result, idx) => {
                            const cfg = STATUS_CONFIG[result.status] || STATUS_CONFIG.pending;
                            const isEditing = editingId === result.id;

                            return (
                                <motion.div 
                                    key={result.id} 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`bg-[var(--theme-card)]/80 backdrop-blur-3xl rounded-full border-2 border-[var(--theme-border)] overflow-hidden shadow-2xl transition-all relative group/card ${isEditing ? 'border-[var(--theme-primary)] scale-[1.01]' : 'hover:border-[var(--theme-primary)]/40'}`}
                                >
                                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[var(--status-warning)] opacity-[0.03] rounded-full blur-[100px] -mr-48 -mt-48 group-hover/card:scale-150 transition-transform duration-[10s] pointer-events-none" />
                                    
                                    <div className="flex flex-col xl:flex-row items-stretch gap-10 p-12 relative z-10">
                                        {/* Placement Shard */}
                                        <div className="text-center min-w-[120px] bg-[var(--theme-bg-alt)]/50 rounded-3xl border-2 border-[var(--theme-border)] p-8 flex flex-col items-center justify-center shadow-inner group/shard">
                                            <span className="text-5xl mb-4 group-hover/shard:scale-125 transition-transform duration-500">{PLACEMENT_MEDAL[result.placement] || <FiTarget className="text-[var(--theme-primary)] opacity-40" />}</span>
                                            <div className="text-4xl font-black text-[var(--theme-primary)] italic tracking-tighter leading-none">#{result.placement}</div>
                                            <div className="text-xs font-black text-[var(--theme-text-muted)] uppercase tracking-wide opacity-30 mt-4 italic">{result.placement_label?.toUpperCase().split(' ')[0]}</div>
                                        </div>

                                        {/* Data Matrix */}
                                        {isEditing ? (
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8">
                                                <div className="p-8 bg-[var(--theme-bg-alt)]/40 rounded-3xl border-2 border-[var(--theme-border)] shadow-inner">
                                                    <label className="text-xs font-black text-[var(--theme-primary)] uppercase tracking-wider block mb-4 italic opacity-40">WINNER_IDENTIFIER</label>
                                                    <input
                                                        className="w-full bg-transparent text-base font-black italic outline-none text-[var(--theme-text)] placeholder:text-[var(--theme-text-muted)] placeholder:opacity-20 tracking-tighter uppercase tabular-nums"
                                                        value={editForm.winner_name}
                                                        onChange={e => setEditForm(p => ({ ...p, winner_name: e.target.value }))}
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="p-8 bg-[var(--theme-bg-alt)]/40 rounded-3xl border-2 border-[var(--theme-border)] shadow-inner">
                                                    <label className="text-xs font-black text-[var(--theme-primary)] uppercase tracking-wider block mb-4 italic opacity-40">PRIZE_PAYLOAD</label>
                                                    <input
                                                        className="w-full bg-transparent text-base font-black italic outline-none text-[var(--status-warning)] placeholder:text-[var(--theme-text-muted)] placeholder:opacity-20 tracking-widest uppercase tabular-nums"
                                                        value={editForm.prize_awarded}
                                                        onChange={e => setEditForm(p => ({ ...p, prize_awarded: e.target.value }))}
                                                    />
                                                </div>
                                                <div className="p-8 bg-[var(--theme-bg-alt)]/40 rounded-3xl border-2 border-[var(--theme-border)] shadow-inner">
                                                    <label className="text-xs font-black text-[var(--theme-primary)] uppercase tracking-wider block mb-4 italic opacity-40">FORENSIC_NOTES</label>
                                                    <input
                                                        className="w-full bg-transparent text-sm font-black italic outline-none text-[var(--theme-text)] opacity-60 placeholder:text-[var(--theme-text-muted)] placeholder:opacity-20 tracking-wider uppercase"
                                                        value={editForm.notes}
                                                        onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-10">
                                                <div className="space-y-4">
                                                    <p className="text-xs font-black text-[var(--theme-text-muted)] uppercase tracking-widest mb-1 italic opacity-30 leading-none">VICTOR_SIGNATURE</p>
                                                    <p className="text-3xl font-black text-[var(--theme-text)] italic tracking-tighter uppercase leading-none group-hover/card:text-[var(--theme-primary)] transition-colors">{result.winner_name || 'NULL_NODE'}</p>
                                                    <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-20 group-hover/card:opacity-60 transition-opacity">0X_{result.id.slice(0, 12).toUpperCase()} <FiHash size={10} /></div>
                                                </div>
                                                <div className="space-y-4">
                                                    <p className="text-xs font-black text-[var(--theme-text-muted)] uppercase tracking-widest mb-1 italic opacity-30 leading-none">PRIZE_ALLOCATION</p>
                                                    <p className="text-3xl font-black text-[var(--status-warning)] italic tracking-tighter uppercase leading-none shadow-[0_0_20px_rgba(var(--status-warning-rgb),0.1)]">{result.prize_awarded || '—'}</p>
                                                    <div className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-20 italic">TRANSFER_READY_v4</div>
                                                </div>
                                                <div className="space-y-4">
                                                    <p className="text-xs font-black text-[var(--theme-text-muted)] uppercase tracking-widest mb-1 italic opacity-30 leading-none">PROTOCOL_STATE</p>
                                                    <span className={`px-8 py-3 text-xs font-black uppercase tracking-wide rounded-[1.5rem] border-2 italic shadow-inner inline-block ${cfg.classes}`}>
                                                        {cfg.label}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Operations */}
                                        <div className="flex xl:flex-col items-center justify-center gap-4 border-l-2 border-dashed border-[var(--theme-border)]/50 xl:pl-10">
                                            {isEditing ? (
                                                <>
                                                    <button onClick={() => saveEdit(result.id)} className="w-14 h-14 rounded-2xl bg-[var(--status-success-soft)] text-[var(--status-success)] border-2 border-[var(--status-success)]/10 flex items-center justify-center hover:bg-[var(--status-success)] hover:text-white transition-all shadow-2xl group/save">
                                                        <FiCheck size={24} strokeWidth={3} />
                                                        <span className="absolute bottom-full mb-3 right-0 px-4 py-2 bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-xl text-xs font-black uppercase tracking-widest text-[var(--theme-text)] opacity-0 group-hover/save:opacity-100 transition-all shadow-3xl italic pointer-events-none">SYNC_DATA</span>
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="w-14 h-14 rounded-2xl bg-[var(--status-error-soft)] text-[var(--status-error)] border-2 border-[var(--status-error)]/10 flex items-center justify-center hover:bg-[var(--status-error)] hover:text-white transition-all shadow-2xl group/cancel">
                                                        <FiX size={24} strokeWidth={3} />
                                                        <span className="absolute bottom-full mb-3 right-0 px-4 py-2 bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-xl text-xs font-black uppercase tracking-widest text-[var(--theme-text)] opacity-0 group-hover/cancel:opacity-100 transition-all shadow-3xl italic pointer-events-none">ABORT_MOD</span>
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => openEdit(result)}
                                                    className="w-14 h-14 bg-[var(--theme-bg-alt)] border-2 border-[var(--theme-border)] rounded-2xl flex items-center justify-center text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] hover:border-[var(--theme-primary)]/30 hover:scale-110 active:scale-95 transition-all shadow-inner group/mod disabled:opacity-20"
                                                    disabled={finalized}
                                                >
                                                    <FiEdit2 size={24} strokeWidth={3} />
                                                    <span className="absolute bottom-full mb-3 right-0 px-4 py-2 bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-xl text-xs font-black uppercase tracking-widest text-[var(--theme-text)] opacity-0 group-hover/mod:opacity-100 transition-all shadow-3xl italic pointer-events-none">MOD_RECORDS</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <FiTerminal size={300} className="absolute bottom-[-80px] left-[-80px] text-[var(--theme-text)] opacity-[0.015] -rotate-12 pointer-events-none group-hover/card:rotate-0 transition-transform duration-[15s]" />
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Global Telemetry Artifacts */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mx-2 relative z-10">
                 <TelemetryCard label="ADJUDICATION_SYNC" value="OPTIMAL" icon={<FiCpu />} color="var(--status-success)" />
                 <TelemetryCard label="PRIZE_VAULT_UPLINK" value="SECURE" icon={<FiGlobe />} color="var(--theme-primary)" />
                 <TelemetryCard label="VICTOR_TRUST_SCORE" value="A+" icon={<FiAward />} color="var(--status-warning)" />
                 <TelemetryCard label="SYNC_STAMP_ID" value="0X_OUT" icon={<FiHash />} color="var(--theme-secondary)" />
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








