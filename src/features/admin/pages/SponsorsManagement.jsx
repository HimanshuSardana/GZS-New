import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { 
    FiAward, FiPlus, FiX, FiCheck, FiExternalLink, FiTerminal, FiActivity, FiGlobe, 
    FiHash, FiZap, FiCpu, FiShield, FiBriefcase, FiZapOff
} from 'react-icons/fi';
import { mockApiService } from '@services/mockApiService';
import { useToast } from '@/shared/components/Toast';
import { motion, AnimatePresence } from 'framer-motion';

const TIER_OPTIONS = ['Title Sponsor', 'Gold Partner', 'Silver Partner', 'Technology Partner', 'Media Partner'];

const TIER_CONFIG = {
    'Title Sponsor': { label: 'DOMAIN_MASTER', color: 'var(--status-warning)', soft: 'var(--status-warning-soft)' },
    'Gold Partner': { label: 'GOLD_NODE', color: 'var(--status-success)', soft: 'var(--status-success-soft)' },
    'Silver Partner': { label: 'SILVER_SHARD', color: 'var(--theme-secondary)', soft: 'var(--theme-secondary-soft)' },
    'Technology Partner': { label: 'TECH_UPLINK', color: 'var(--theme-primary)', soft: 'var(--theme-primary-soft)' },
    'Media Partner': { label: 'BROADCAST_HUB', color: 'var(--status-info)', soft: 'var(--status-info-soft)' },
};

const defaultModal = { name: '', logo_url: '', website_url: '', tier: 'Gold Partner', status: 'Active' };

export default function SponsorsManagement() {
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [modalForm, setModalForm] = useState(defaultModal);
    const [saving, setSaving] = useState(false);

    const { data: sponsors = [], isLoading } = useQuery({
        queryKey: ['admin', 'sponsors'],
        queryFn: mockApiService.getAllSponsors,
    });

    const handleOpenModal = () => {
        setModalForm(defaultModal);
        setShowModal(true);
    };

    const handleModalSave = async () => {
        if (!modalForm.name) { showToast('Sponsor name is required', 'error'); return; }
        setSaving(true);
        try {
            await mockApiService.updateSponsor('new-' + Date.now(), modalForm);
            queryClient.invalidateQueries({ queryKey: ['admin', 'sponsors'] });
            showToast('Sponsor added successfully!', 'success');
            setShowModal(false);
        } catch {
            showToast('Failed to add sponsor', 'error');
        } finally {
            setSaving(false);
        }
    };

    const inputClass = "admin-input";
    const labelClass = "admin-label";

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-10">
                <div className="w-24 h-24 border-4 border-dashed border-[var(--theme-primary)] rounded-full animate-spin-slow border-t-transparent shadow-[0_0_30px_rgba(var(--theme-primary-rgb),0.2)]" />
                <p className="text-sm font-black uppercase tracking-widest text-[var(--theme-primary)] italic animate-pulse">EXTRACTING_PARTNER_DATA...</p>
            </div>
        );
    }

    return (
        <div className="space-y-16 pb-40 relative min-h-screen">
            <Helmet><title>Partner Registry | GzoneSphere Admin</title></Helmet>
            
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[10%] right-[-5%] w-[60%] h-[60%] bg-[var(--theme-primary)]/5 blur-[180px] rounded-full" />
                <div className="absolute bottom-[5%] left-[-10%] w-[50%] h-[50%] bg-[var(--theme-secondary)]/5 blur-3xl rounded-full" />
            </div>

            <header className="flex flex-col md:flex-row md:items-end justify-between gap-12 relative z-10 px-2">
                <div className="space-y-8">
                    <div className="flex items-center gap-6 group">
                        <div className="w-16 h-1 bg-[var(--theme-primary)] rounded-full animate-pulse shadow-[0_0_15px_rgba(var(--theme-primary-rgb),0.5)]" />
                        <span className="text-sm font-black uppercase tracking-widest text-[var(--theme-primary)] italic leading-none opacity-80">v4.08_STRATEGIC_REGISTRY</span>
                    </div>
                    <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter italic leading-[0.8] text-[var(--theme-text)]">Partner <br/><span className="text-transparent opacity-20">COMMAND</span></h1>
                </div>

                <div className="flex flex-col items-end gap-6 relative z-10">
                    <div className="bg-[var(--theme-card)]/80 backdrop-blur-3xl px-8 py-4 rounded-2xl border-2 border-[var(--theme-border)] shadow-2xl flex items-center gap-10">
                         <div className="flex flex-col">
                             <span className="text-xs font-black uppercase tracking-wider text-[var(--theme-primary)] italic opacity-60">ACTIVE_RESOURCES</span>
                             <span className="text-3xl font-black text-[var(--theme-text)] italic tracking-tighter leading-none">{sponsors.length}</span>
                         </div>
                    </div>
                    <button
                        onClick={handleOpenModal}
                        className="admin-btn !px-12 !py-6 group"
                    >
                        <FiPlus size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform" /> INTEGRATE_NEW_PARTNER
                    </button>
                </div>
            </header>

            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10 mx-2">
                <AnimatePresence>
                    {sponsors.map((s, idx) => {
                        const cfg = TIER_CONFIG[s.tier] || TIER_CONFIG['Gold Partner'];
                        return (
                            <motion.div 
                                key={s.id || idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="admin-card !p-10 group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--theme-primary)] opacity-5 rounded-full blur-[40px] -mr-16 -mt-16" />
                                <div className="flex items-start justify-between mb-10">
                                    <div className="w-20 h-20 rounded-[1.8rem] bg-[var(--theme-bg-alt)] border-2 border-[var(--theme-border)] flex items-center justify-center text-3xl font-black text-[var(--theme-text)] italic shadow-inner group-hover:bg-[var(--theme-card)] transition-colors">
                                        {s.name[0]}
                                    </div>
                                    <span 
                                        className="admin-status-badge"
                                        style={
                                          s.status === 'Active' 
                                            ? { background: 'var(--status-success-bg)', color: 'var(--status-success-text)' }
                                            : { background: 'var(--status-draft-bg)', color: 'var(--status-draft-text)' }
                                        }
                                    >
                                        {s.status?.toUpperCase() || 'ACTIVE'}
                                    </span>
                                </div>
                                <h3 className="font-black text-3xl text-[var(--theme-text)] italic uppercase tracking-tighter mb-4 leading-none group-hover:text-[var(--theme-primary)] transition-colors">{s.name}</h3>
                                <div className={`inline-flex items-center gap-4 px-6 py-2 rounded-full border-2 text-xs font-black uppercase tracking-wider italic mb-8`} style={{ borderColor: `${cfg.color}33`, color: cfg.color, backgroundColor: `${cfg.color}11` }}>
                                    <FiAward /> {cfg.label}
                                </div>
                                
                                {s.website_url && (
                                    <a href={s.website_url} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-4 text-xs font-black uppercase tracking-wider text-[var(--theme-primary)] hover:text-[var(--theme-text)] transition-all italic mt-4 opacity-40 hover:opacity-100 group/link">
                                        <FiExternalLink size={14} strokeWidth={3} className="group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" /> {s.website_url.replace('https://', '')}
                                    </a>
                                )}
                                
                                <div className="mt-10 pt-10 border-t-2 border-dashed border-[var(--theme-border)]/50 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-30 italic">SCOPE_COMMITMENT</span>
                                        <span className="text-sm font-black text-[var(--theme-text)] italic uppercase tracking-tighter">{s.commitment || s.event || 'GLOBAL_ARENA'}</span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </main>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mx-2 relative z-10">
                 <TelemetryCard label="RESOURCE_LOAD" value="84%" icon={<FiActivity />} color="var(--theme-primary)" />
                 <TelemetryCard label="PARTNER_SYST_HEALTH" value="OPTIMAL" icon={<FiCpu />} color="var(--status-success)" />
                 <TelemetryCard label="CONTRACT_RELIABILITY" value="100%" icon={<FiShield />} color="var(--status-warning)" />
                 <TelemetryCard label="REGISTRY_STAMP" value="v4.0_MOD" icon={<FiHash />} color="var(--theme-secondary)" />
            </div>

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 backdrop-blur-2xl">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            className="bg-[var(--theme-card)] rounded-[4rem] w-full max-w-2xl shadow-6xl border-4 border-[var(--theme-border)] overflow-hidden relative"
                        >
                            <div className="flex items-center justify-between p-12 border-b-4 border-dashed border-[var(--theme-border)]">
                                <h2 className="text-3xl font-black uppercase tracking-tighter italic text-[var(--theme-text)]">New <span className="text-[var(--theme-primary)]">PARTNER_INTEGRATION</span></h2>
                                <button onClick={() => setShowModal(false)} className="w-16 h-16 bg-[var(--theme-bg-alt)] rounded-2xl flex items-center justify-center text-[var(--theme-text-muted)] hover:text-[var(--status-error)] transition-all border-2 border-[var(--theme-border)] shadow-inner">
                                    <FiX size={24} strokeWidth={3} />
                                </button>
                            </div>
                            <div className="p-12 space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <label className={labelClass}>ENTITY_SIGNATURE *</label>
                                        <input className={inputClass} value={modalForm.name} onChange={e => setModalForm(prev => ({ ...prev, name: e.target.value }))} placeholder="RED_BULL_NODE" />
                                    </div>
                                    <div className="space-y-4">
                                        <label className={labelClass}>DOMAIN_DOMAIN_SYNC</label>
                                        <select className={inputClass} value={modalForm.tier} onChange={e => setModalForm(prev => ({ ...prev, tier: e.target.value }))}>
                                            {TIER_OPTIONS.map(t => <option key={t} className="bg-[var(--theme-card)]">{t.toUpperCase()}_NODE</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className={labelClass}>VISUAL_LOGO_UPLINK (URL)</label>
                                    <input className={inputClass} value={modalForm.logo_url} onChange={e => setModalForm(prev => ({ ...prev, logo_url: e.target.value }))} placeholder="HTTPS://LOGO_SHARD_LINK" />
                                </div>
                                <div className="space-y-4">
                                    <label className={labelClass}>EXTERNAL_DOMAIN_LINK (URL)</label>
                                    <input className={inputClass} value={modalForm.website_url} onChange={e => setModalForm(prev => ({ ...prev, website_url: e.target.value }))} placeholder="HTTPS://PARTNER_PORTAL.COM" />
                                </div>
                            </div>
                             <div className="p-12 pt-0 flex gap-6">
                                <button onClick={() => setShowModal(false)} className="admin-btn flex-1">CANCEL_PROC</button>
                                <button onClick={handleModalSave} disabled={saving}
                                    className="admin-btn flex-[2]">
                                    {saving ? 'SYNCING...' : <><FiCheck size={18} strokeWidth={3} /> EXECUTE_INTEGRATION</>}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function TelemetryCard({ label, value, icon, color }) {
    return (
        <div className="admin-card !p-10 group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--theme-primary)] opacity-5 rounded-full blur-[40px] -mr-16 -mt-16" />
            <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-30 leading-none group-hover:text-[var(--theme-primary)] transition-colors group-hover:opacity-60">
                 {React.cloneElement(icon, { size: 16, strokeWidth: 3, className: 'animate-pulse' })} {label}
            </div>
            <p className="text-3xl font-black uppercase tracking-tighter italic text-[var(--theme-text)] leading-none relative z-10" style={{ color: color }}>{value}</p>
        </div>
    );
}








