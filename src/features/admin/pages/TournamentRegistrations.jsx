import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    FiUsers, FiArrowLeft, FiCheck, FiX, FiFilter, FiSearch, 
    FiTerminal, FiActivity, FiGlobe, FiLayers, FiHash, FiZap, FiExternalLink, FiCpu, FiShield
} from 'react-icons/fi';
import { MOCK_REGISTRATIONS } from '@/shared/data/tournamentData';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CONFIG = {
    approved: { label: 'PROV_CERTIFIED', classes: 'bg-[var(--status-success-soft)] text-[var(--status-success)] border-[var(--status-success)]/10 shadow-2xl' },
    pending: { label: 'PENDING_AUDIT', classes: 'bg-[var(--status-warning-soft)] text-[var(--status-warning)] border-[var(--status-warning)]/10 shadow-inner' },
    rejected: { label: 'ENTRY_DENIED', classes: 'bg-[var(--status-error-soft)] text-[var(--status-error)] border-[var(--status-error)]/10 opacity-60' },
    withdrawn: { label: 'MANUAL_WITHDRAW', classes: 'bg-[var(--theme-bg-alt)] text-[var(--theme-text-muted)] border-[var(--theme-border)] opacity-40 italic' },
    disqualified: { label: 'DQ_VIOLATION', classes: 'bg-[var(--status-error-soft)] text-[var(--status-error)] border-[var(--status-error)]/20 shadow-[0_0_20px_rgba(var(--status-error-rgb),0.3)] animate-pulse' },
};

export default function TournamentRegistrations() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [registrations, setRegistrations] = useState(
        MOCK_REGISTRATIONS.filter(r => r.tournament_id === id || MOCK_REGISTRATIONS.length > 0)
    );
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    const filtered = registrations.filter(r => {
        const matchesFilter = filter === 'all' || r.status === filter;
        const matchesSearch = !search ||
            (r.team_name || '').toLowerCase().includes(search.toLowerCase()) ||
            r.user_id.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const updateStatus = (regId, newStatus) => {
        setRegistrations(prev =>
            prev.map(r => r.id === regId ? { ...r, status: newStatus } : r)
        );
    };

    const counts = {
        all: registrations.length,
        pending: registrations.filter(r => r.status === 'pending').length,
        approved: registrations.filter(r => r.status === 'approved').length,
        rejected: registrations.filter(r => r.status === 'rejected').length,
    };

    return (
        <div className="space-y-16 pb-32 relative min-h-screen">
            {/* Cinematic Background Artifacts */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] bg-[var(--theme-primary)]/5 blur-[180px] rounded-full" />
                <div className="absolute bottom-[10%] left-[-5%] w-[40%] h-[40%] bg-[var(--theme-secondary)]/5 blur-[100px] rounded-full" />
            </div>

            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 md:gap-12 relative z-10 px-2">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10">
                    <button
                        onClick={() => navigate('/admin/tournaments')}
                        className="w-12 h-12 md:w-16 md:h-16 bg-[var(--theme-card)]/80 backdrop-blur-3xl rounded-2xl md:rounded-[1.8rem] border-2 border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] hover:border-[var(--theme-primary)]/30 transition-all shadow-2xl hover:scale-110 active:scale-95 group"
                    >
                        <FiArrowLeft size={20} md:size={24} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="space-y-4 md:space-y-8">
                        <div className="flex items-center gap-4 md:gap-6 group">
                            <div className="w-12 md:w-16 h-1 bg-[var(--status-success)] rounded-full animate-pulse shadow-[0_0_15px_rgba(var(--status-success-rgb),0.5)]" />
                            <span className="text-[10px] md:text-sm font-black uppercase tracking-widest text-[var(--status-success)] italic leading-none opacity-80">v4.08_ATHLETE_AUDIT</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl lg:text-9xl font-black uppercase tracking-tighter italic leading-[0.9] md:leading-[0.8] text-[var(--theme-text)]">Registrar <br/><span className="text-transparent opacity-20">ENROLLMENT</span></h1>
                    </div>
                </div>

                <div className="bg-[var(--theme-bg-alt)]/60 rounded-3xl p-6 md:p-10 border-2 border-[var(--theme-border)] shadow-inner space-y-4 text-left lg:text-right min-w-[240px] md:min-w-[280px] relative z-10 overflow-hidden">
                    <p className="text-[10px] md:text-xs font-black text-[var(--theme-text-muted)] uppercase tracking-widest italic opacity-30 leading-none flex justify-between items-center gap-4">CIRCUIT_UUID: <span className="text-[var(--theme-text)] opacity-60 tabular-nums">0X_{id?.toUpperCase()}</span></p>
                    <div className="h-[1px] bg-gradient-to-r from-transparent via-[var(--theme-border)] to-transparent" />
                    <p className="text-[10px] md:text-xs font-black text-[var(--theme-text-muted)] uppercase tracking-widest italic opacity-30 leading-none flex justify-between items-center gap-4">TOTAL_ENTRY: <span className="text-[var(--theme-text)] opacity-60 tabular-nums">{counts.all}</span></p>
                    <FiLayers size={150} className="absolute bottom-[-40px] left-[-40px] text-[var(--theme-text)] opacity-[0.03] -rotate-12" />
                </div>
            </header>

            {/* Tactical Navigation Sub-Bridge */}
            <div className="bg-[var(--theme-bg-alt)]/50 backdrop-blur-xl rounded-3xl md:rounded-full p-4 md:p-6 border-2 border-[var(--theme-border)] shadow-inner relative z-10 mx-2 flex flex-col xl:flex-row gap-6">
                <div className="flex flex-wrap gap-4 flex-1">
                    {Object.entries(counts).map(([status, count]) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`flex-1 min-w-[120px] md:min-w-[150px] flex flex-col items-center justify-center gap-2 py-4 md:py-6 rounded-2xl md:rounded-[2.2rem] text-[10px] md:text-xs font-black uppercase tracking-wider transition-all italic leading-none ${
                                filter === status
                                    ? 'bg-[var(--theme-card)] text-[var(--theme-primary)] shadow-2xl border-2 border-[var(--theme-border)]'
                                    : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] opacity-40 hover:opacity-100'
                            }`}
                        >
                            <span className="text-xl md:text-2xl font-black tabular-nums">{count}</span>
                            {status}_ENTRIES
                        </button>
                    ))}
                </div>
                
                <div className="flex items-center gap-4 md:gap-6 bg-[var(--theme-card)]/80 border-2 border-[var(--theme-border)] rounded-2xl md:rounded-3xl px-6 md:px-10 py-3 md:py-4 shadow-2xl group/search xl:min-w-[400px]">
                    <FiSearch size={20} md:size={24} strokeWidth={3} className="text-[var(--theme-primary)] opacity-40 group-focus-within/search:opacity-100 group-focus-within/search:scale-110 transition-all duration-500" />
                    <input
                        type="text"
                        placeholder="TRACE_ATHLETE_SIGNATURE..."
                        className="py-2 md:py-4 bg-transparent text-xs md:text-sm font-black italic text-[var(--theme-text)] outline-none flex-1 placeholder:text-[var(--theme-text-muted)] placeholder:opacity-20 uppercase tracking-wide"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Audit Manifest */}
            <div className="bg-[var(--theme-card)]/80 backdrop-blur-3xl rounded-[2rem] md:rounded-full border-2 border-[var(--theme-border)] overflow-hidden shadow-2xl relative z-10 mx-2 group/manifest">
                <div className="p-8 md:p-16 border-b-2 border-dashed border-[var(--theme-border)] flex items-center justify-between">
                     <div className="flex items-center gap-6 md:gap-8">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-[1.5rem] bg-[var(--theme-bg-alt)] border-2 border-[var(--theme-border)] flex items-center justify-center text-[var(--status-success)] shadow-inner"><FiShield size={24} md:size={28} strokeWidth={3} /></div>
                        <h3 className="text-xs md:text-base font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic leading-none opacity-40">ENROLLMENT_AUDIT_LEDGER_v4</h3>
                     </div>
                </div>

                <div className="overflow-x-auto scrollbar-none">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="border-b-2 border-dashed border-[var(--theme-border)]/50">
                                <th className="pl-8 md:pl-16 py-8 md:py-12 text-[10px] md:text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-30 italic">ATHLETE_SHARD</th>
                                <th className="py-8 md:py-12 text-[10px] md:text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-30 italic">OPERATIVE_ROSTER</th>
                                <th className="py-8 md:py-12 text-[10px] md:text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-30 italic">DATA_PAYLOAD</th>
                                <th className="py-8 md:py-12 text-[10px] md:text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-30 italic text-center">PROTOCOL_STATUS</th>
                                <th className="py-8 md:py-12 text-[10px] md:text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-30 italic">SYNC_STAMP</th>
                                <th className="pr-8 md:pr-16 py-8 md:py-12 text-right text-[10px] md:text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-30 italic">AUDIT_ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-dashed divide-[var(--theme-border)]/30">
                            <AnimatePresence mode="popLayout">
                                {filtered.length === 0 ? (
                                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <td colSpan="6" className="text-center py-24 md:py-40 space-y-6 md:space-y-8">
                                            <FiActivity size={60} md:size={80} className="mx-auto text-[var(--theme-primary)] opacity-10 animate-pulse" />
                                            <p className="text-base md:text-[18px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-20 italic ">MANIFEST_RECORDS_NULL</p>
                                        </td>
                                    </motion.tr>
                                ) : filtered.map((reg, idx) => {
                                    const cfg = STATUS_CONFIG[reg.status] || STATUS_CONFIG.pending;
                                    return (
                                        <motion.tr 
                                            key={reg.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.04 }}
                                            className="group hover:bg-[var(--theme-bg-alt)]/50 transition-all cursor-crosshair"
                                        >
                                            <td className="pl-16 py-12">
                                                <div className="space-y-4">
                                                    <div className="text-2xl font-black text-[var(--theme-text)] italic tracking-tighter uppercase leading-none group-hover:text-[var(--theme-primary)] transition-colors line-clamp-1">{reg.team_name || 'MASTER_INDIVIDUAL'}</div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-xs font-black text-[var(--theme-text-muted)] font-mono opacity-20 group-hover:opacity-60 transition-opacity">NODE_0X_{reg.id.slice(0, 12).toUpperCase()}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-12">
                                                {reg.team_members ? (
                                                    <div className="flex flex-wrap gap-3 max-w-xs">
                                                        {reg.team_members.map((m, i) => (
                                                            <span key={i} className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-40 italic border-b border-dashed border-[var(--theme-border)]">{m.name.split(' ')[0]}</span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs font-black text-[var(--theme-text-muted)] opacity-10 italic">N/A_SINGLE_NODE</span>
                                                )}
                                            </td>
                                            <td className="py-12">
                                                {reg.submission_url ? (
                                                    <a href={reg.submission_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-xs text-[var(--theme-primary)] font-black uppercase tracking-wide italic hover:scale-110 active:scale-95 transition-all">
                                                        <FiExternalLink strokeWidth={3} /> LINK_SOURCE
                                                    </a>
                                                ) : (
                                                    <span className="text-xs font-black text-[var(--theme-text-muted)] opacity-10 italic">EMPTY_PAYLOAD</span>
                                                )}
                                            </td>
                                            <td className="py-12 text-center">
                                                <span className={`px-8 py-3 text-xs font-black uppercase tracking-wider rounded-[1.5rem] border-2 italic shadow-inner inline-block ${cfg.classes}`}>
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="py-12 text-sm font-black text-[var(--theme-text-muted)] font-mono opacity-40 italic tabular-nums leading-none tracking-widest">
                                                {new Date(reg.registered_at).toLocaleDateString().replace(/\//g, '.')}
                                            </td>
                                            <td className="pr-16 py-12">
                                                <div className="flex items-center justify-end gap-3">
                                                    {reg.status === 'pending' && (
                                                        <>
                                                            <ActionButton 
                                                                onClick={() => updateStatus(reg.id, 'approved')}
                                                                icon={<FiCheck />}
                                                                label="CERTIFY_NODE"
                                                                color="var(--status-success)"
                                                            />
                                                            <ActionButton 
                                                                onClick={() => updateStatus(reg.id, 'rejected')}
                                                                icon={<FiX />}
                                                                label="REJECT_SIGNAL"
                                                                color="var(--status-error)"
                                                            />
                                                        </>
                                                    )}
                                                    {reg.status === 'approved' && (
                                                        <ActionButton 
                                                            onClick={() => updateStatus(reg.id, 'disqualified')}
                                                            icon={<FiZap />}
                                                            label="DISQUALIFY_ENTITY"
                                                            color="var(--status-error)"
                                                            pulse
                                                        />
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>
                        </tbody>
                    </table>
                    <FiTerminal size={500} className="absolute bottom-[-150px] left-[-150px] text-[var(--theme-text)] opacity-[0.015] -rotate-12 pointer-events-none group-hover/manifest:rotate-0 transition-transform duration-[20s]" />
                </div>
            </div>

            {/* Global Telemetry Artifacts */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mx-2 relative z-10">
                 <TelemetryCard label="AUDIT_HEALTH" value="SECURE" icon={<FiCpu />} color="var(--status-success)" />
                 <TelemetryCard label="NODE_RELIABILITY" value="99.8%" icon={<FiGlobe />} color="var(--theme-primary)" />
                 <TelemetryCard label="DATA_INTEGRITY" value="FORENSIC" icon={<FiShield />} color="var(--status-warning)" />
                 <TelemetryCard label="THROUGHPUT_MBPS" value="2.4K" icon={<FiHash />} color="var(--theme-secondary)" />
            </div>
        </div>
    );
}

function ActionButton({ onClick, icon, label, color, pulse }) {
    return (
        <button
            onClick={onClick}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all border-2 shadow-inner group/btn relative overflow-hidden ${pulse ? 'animate-pulse' : ''}`}
            style={{ 
                borderColor: `${color}20`, 
                backgroundColor: `${color}05`,
                color: color 
            }}
        >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
            {React.cloneElement(icon, { size: 20, strokeWidth: 3, className: 'group-hover/btn:scale-125 transition-transform relative z-10' })}
            
            <div className="absolute bottom-full mb-3 right-0 px-4 py-2 bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-xl text-xs font-black uppercase tracking-widest text-[var(--theme-text)] opacity-0 group-hover/btn:opacity-100 transition-all pointer-events-none translate-y-2 group-hover/btn:translate-y-0 shadow-3xl whitespace-nowrap z-[100] italic">
                 {label}
            </div>
        </button>
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








