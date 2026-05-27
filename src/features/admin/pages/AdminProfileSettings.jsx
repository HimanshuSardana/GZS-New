import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    FiUser, FiLock, FiBell, FiGlobe, FiShield, FiSave,
    FiSettings, FiActivity, FiKey, FiMail, FiMonitor, FiTerminal, FiDatabase, FiHash, FiZap, FiCpu, FiShieldOff, FiTarget, FiChevronDown
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";

const TABS = [
    { id: "profile", label: "IDENTITY", Icon: FiUser, sub: "CORE_BIOMETRICS" },
    { id: "security", label: "ENCRYPTION", Icon: FiLock, sub: "ACCESS_LOGIC" },
    { id: "notifications", label: "DIRECTIVES", Icon: FiBell, sub: "SYST_ALERTS" },
    { id: "site", label: "PLATFORM", Icon: FiGlobe, sub: "GLOBAL_VARS" },
    { id: "permissions", label: "AUTHORITY", Icon: FiShield, sub: "ACCESS_CONTROL" },
];

export default function AdminProfileSettings() {
    const [activeTab, setActiveTab] = useState("profile");

    const { data: profile = {}, isLoading } = useQuery({
        queryKey: ['admin', 'profile'],
        queryFn: async () => {
            return {
                firstName: "Admin",
                lastName: "User",
                email: "admin@gzonesphere.com",
                role: "Super Admin",
                siteName: "GzoneSphere",
                tagline: "The Ultimate Gaming Oracle",
                language: "English",
                theme: "Dark"
            };
        }
    });

    const inputClass = "w-full bg-[var(--theme-bg-alt)]/50 border-2 border-[var(--theme-border)] rounded-2xl px-6 py-4 text-sm font-black italic text-[var(--theme-text)] outline-none focus:border-[var(--theme-primary)] focus:ring-4 focus:ring-[var(--theme-primary)]/10 transition-all placeholder:text-[var(--theme-text-muted)] placeholder:opacity-20 uppercase tracking-widest";
    const labelClass = "block text-xs  uppercase tracking-widest text-[var(--theme-text-muted)] mb-2.5 italic opacity-40 leading-none";

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-10">
                <div className="w-24 h-24 border-4 border-dashed border-[var(--theme-primary)] rounded-full animate-spin-slow border-t-transparent shadow-[0_0_30px_rgba(var(--theme-primary-rgb),0.2)]" />
                <p className="text-sm font-black uppercase tracking-widest text-[var(--theme-primary)] italic animate-pulse">ACCESSING_CONFIGURATION_CORE...</p>
            </div>
        );
    }

    return (
        <div className="space-y-16 pb-40 relative min-h-screen">
            <Helmet><title>Core Config Nexus | GzoneSphere Admin</title></Helmet>
            
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[10%] right-[-5%] w-[60%] h-[60%] bg-[var(--theme-primary)]/5 blur-[180px] rounded-full" />
                <div className="absolute bottom-[5%] left-[-10%] w-[50%] h-[50%] bg-[var(--theme-secondary)]/5 blur-3xl rounded-full" />
            </div>

            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 md:gap-12 relative z-10 px-2">
                <div className="space-y-6 md:space-y-8">
                    <div className="flex items-center gap-4 md:gap-6 group">
                        <div className="w-12 md:w-16 h-1 bg-[var(--theme-primary)] rounded-full animate-pulse shadow-[0_0_15px_rgba(var(--theme-primary-rgb),0.5)]" />
                        <span className="text-[10px] md:text-sm font-black uppercase tracking-widest text-[var(--theme-primary)] italic leading-none opacity-80">v4.08_CORE_CONFIGURATION</span>
                    </div>
                    <div className="flex items-center gap-6 md:gap-10">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-[var(--theme-card)]/80 backdrop-blur-3xl rounded-xl md:rounded-2xl border-2 border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text)] shadow-2xl group-hover:rotate-90 transition-transform">
                            <FiSettings size={28} md:size={32} strokeWidth={2.5} />
                        </div>
                        <h1 className="text-4xl md:text-7xl lg:text-9xl font-black uppercase tracking-tighter italic leading-[0.9] md:leading-[0.8] text-[var(--theme-text)]">System <br/><span className="text-transparent opacity-20">PARAMETERS</span></h1>
                    </div>
                </div>

                <div className="flex bg-[var(--theme-card)]/80 backdrop-blur-3xl p-2 md:p-3 rounded-2xl md:rounded-3xl border-2 border-[var(--theme-border)] shadow-2xl gap-3 md:gap-4 relative z-10 w-fit">
                    <div className="bg-[var(--theme-bg-alt)]/50 px-5 md:px-8 py-3 md:py-5 rounded-xl md:rounded-[1.8rem] text-[10px] md:text-xs font-black uppercase tracking-wider text-[var(--theme-text-muted)] italic leading-none flex items-center gap-3 md:gap-4">
                        <FiCpu size={14} md:size={16} strokeWidth={3} className="text-[var(--theme-primary)]" /> KERNEL_v4.2.0_STABLE
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 md:gap-12 relative z-10 mx-2">
                {/* Navigation Sidebar */}
                <div className="space-y-3 md:space-y-4">
                    <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible scrollbar-none gap-3 md:gap-4 pb-4 lg:pb-0">
                        {TABS.map(({ id, label, Icon, sub }, idx) => (
                            <motion.button
                                key={id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => setActiveTab(id)}
                                className={`flex items-center gap-4 md:gap-8 min-w-[200px] lg:w-full p-5 md:p-8 rounded-2xl md:rounded-3xl transition-all group relative overflow-hidden border-2 flex-shrink-0 ${activeTab === id
                                    ? "bg-[var(--theme-text)] text-[var(--theme-bg)] border-[var(--theme-text)] shadow-6xl lg:translate-x-4"
                                    : "bg-[var(--theme-card)]/80 backdrop-blur-3xl text-[var(--theme-text-muted)] border-[var(--theme-border)] hover:border-[var(--theme-primary)]/30"}`}
                            >
                                {activeTab === id && (
                                    <motion.div layoutId="active-bg" className="absolute inset-0 bg-[var(--theme-primary)] opacity-10 pointer-events-none" />
                                )}
                                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] flex items-center justify-center transition-all border-2 ${activeTab === id ? "bg-[var(--theme-bg)] text-[var(--theme-text)] border-transparent" : "bg-[var(--theme-bg-alt)]/50 text-[var(--theme-text-muted)] border-[var(--theme-border)] group-hover:text-[var(--theme-primary)]"}`}>
                                    <Icon size={20} md:size={24} strokeWidth={2.5} />
                                </div>
                                <div className="text-left relative z-10">
                                    <span className="text-sm md:text-base font-black uppercase tracking-wide block italic leading-none mb-1">{label}</span>
                                    <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest opacity-40 block italic leading-none ${activeTab === id ? "text-[var(--theme-bg)]" : "text-[var(--theme-text-muted)]"}`}>{sub}</span>
                                </div>
                            </motion.button>
                        ))}
                    </div>

                    <div className="hidden lg:flex mt-16 p-10 bg-[var(--theme-bg-alt)]/50 backdrop-blur-3xl rounded-full border-2 border-[var(--theme-border)] flex-col items-center text-center shadow-inner relative overflow-hidden group/kernel">
                        <FiTerminal size={200} className="absolute bottom-[-100px] left-[-80px] text-[var(--theme-text)] opacity-[0.03] group-hover/kernel:rotate-12 transition-transform duration-[10s]" />
                        <div className="w-20 h-20 rounded-full bg-[var(--theme-card)] border-2 border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-primary)] shadow-2xl mb-8 font-black text-xl italic group-hover:scale-110 transition-transform">GZ</div>
                        <p className="text-xs font-black text-[var(--theme-text-muted)] leading-[2] uppercase tracking-widest italic opacity-40 relative z-10">
                            KERNEL_VERSION_4.2.0<br />LAST_BUILD: MAR_05_2026
                        </p>
                    </div>
                </div>

                {/* Content Area */}
                <main className="bg-[var(--theme-card)]/80 backdrop-blur-3xl rounded-[2.5rem] md:rounded-[4rem] border-2 border-[var(--theme-border)] p-8 md:p-16 shadow-2xl relative overflow-hidden group/forge min-h-[600px] md:min-h-[800px]">
                    <FiTerminal size={600} className="absolute bottom-[-150px] right-[-250px] text-[var(--theme-text)] opacity-[0.01] rotate-12 group-hover/forge:rotate-0 transition-transform duration-[20s] pointer-events-none" />
                    
                    <AnimatePresence mode="wait">
                        {activeTab === "profile" && (
                            <motion.div 
                                key="identity"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-8 md:space-y-12 relative z-10"
                            >
                                <div className="flex items-center gap-4 md:gap-6 mb-4">
                                    <FiActivity size={20} md:size={24} className="text-[var(--theme-primary)] animate-pulse" />
                                    <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic text-[var(--theme-text)]">BIOMETRIC_IDENTIFICATION</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                                    <div className="space-y-3 md:space-y-4">
                                        <label className={labelClass}>FORENAME_STAMP</label>
                                        <div className="relative group/input">
                                            <FiUser className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] opacity-20 group-focus-within/input:text-[var(--theme-primary)] group-focus-within/input:opacity-100 transition-all" size={20} />
                                            <input className={`${inputClass} !pl-16`} defaultValue={profile.firstName} />
                                        </div>
                                    </div>
                                    <div className="space-y-3 md:space-y-4">
                                        <label className={labelClass}>SURNAME_REGISTRY</label>
                                        <input className={inputClass} defaultValue={profile.lastName} />
                                    </div>
                                    <div className="space-y-3 md:space-y-4 md:col-span-2">
                                        <label className={labelClass}>VERIFIED_EMAIL_UPLINK</label>
                                        <div className="relative group/input">
                                            <FiMail className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] opacity-20 group-focus-within/input:text-[var(--theme-primary)] group-focus-within/input:opacity-100 transition-all" size={20} />
                                            <input className={`${inputClass} !pl-16 font-mono tracking-normal normal-case`} type="email" defaultValue={profile.email} />
                                        </div>
                                    </div>
                                    <div className="space-y-3 md:space-y-4">
                                        <label className={labelClass}>AUTHORITY_TIER</label>
                                        <div className="relative group/input">
                                            <FiKey className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] opacity-20 transition-all" size={20} />
                                            <input className={`${inputClass} !pl-16 bg-[var(--theme-bg-alt)]/20 border-dashed opacity-50 cursor-not-allowed`} defaultValue={profile.role?.toUpperCase()} disabled />
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-8 md:pt-12">
                                    <button className="w-full sm:w-auto bg-[var(--theme-text)] text-[var(--theme-bg)] rounded-2xl px-8 md:px-12 py-5 md:py-6 text-[10px] md:text-xs font-black uppercase tracking-widest italic flex items-center justify-center gap-4 md:gap-6 shadow-2xl hover:bg-[var(--theme-primary)] hover:text-white hover:scale-105 active:scale-95 transition-all border-4 border-white/5 group/save">
                                        <FiSave size={18} md:size={20} strokeWidth={3} className="group-hover/save:scale-110" /> COMMIT_SYNC_CHANGES
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "site" && (
                            <motion.div 
                                key="platform"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-8 md:space-y-12 relative z-10"
                            >
                                <div className="flex items-center gap-4 md:gap-6 mb-4">
                                    <FiGlobe size={20} md:size={24} className="text-[var(--theme-primary)] animate-pulse" />
                                    <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic text-[var(--theme-text)]">ENVIRONMENT_VARIABLES</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                                    <div className="space-y-3 md:space-y-4">
                                        <label className={labelClass}>BRAND_SIGNATURE</label>
                                        <input className={inputClass} defaultValue={profile.siteName} />
                                    </div>
                                    <div className="space-y-3 md:space-y-4">
                                        <label className={labelClass}>MISSION_ORACLE_TAGLINE</label>
                                        <input className={inputClass} defaultValue={profile.tagline} />
                                    </div>
                                    <div className="space-y-3 md:space-y-4">
                                        <label className={labelClass}>LNG_CORE_SELECTOR</label>
                                        <div className="relative group/input">
                                            <FiGlobe className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] opacity-20" size={20} />
                                            <select className={`${inputClass} !pl-16 appearance-none cursor-pointer`}>
                                                <option className="bg-[var(--theme-card)]">ENGLISH (GLOBAL)</option>
                                                <option className="bg-[var(--theme-card)]">JAPANESE (JP)</option>
                                                <option className="bg-[var(--theme-card)]">HINDI (IN)</option>
                                            </select>
                                            <FiChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] opacity-30 pointer-events-none" size={20} />
                                        </div>
                                    </div>
                                    <div className="space-y-3 md:space-y-4">
                                        <label className={labelClass}>VISUAL_VECTOR_THEME</label>
                                        <div className="relative group/input">
                                            <FiMonitor className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] opacity-20" size={20} />
                                            <select className={`${inputClass} !pl-16 appearance-none cursor-pointer`}>
                                                <option className="bg-[var(--theme-card)]">DEEP_SPACE (DARK)</option>
                                                <option className="bg-[var(--theme-card)]">SOLAR_FLARE (LIGHT)</option>
                                                <option className="bg-[var(--theme-card)]">SYSTEM_DYNAMIC</option>
                                            </select>
                                            <FiChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] opacity-30 pointer-events-none" size={20} />
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-8 md:pt-12">
                                    <button className="w-full sm:w-auto bg-[var(--theme-text)] text-[var(--theme-bg)] rounded-2xl px-8 md:px-12 py-5 md:py-6 text-[10px] md:text-xs font-black uppercase tracking-widest italic flex items-center justify-center gap-4 md:gap-6 shadow-2xl hover:bg-[var(--theme-primary)] hover:text-white hover:scale-105 active:scale-95 transition-all border-4 border-white/5 group/auth">
                                        <FiSave size={18} md:size={20} strokeWidth={3} className="group-hover/auth:rotate-12" /> AUTHORIZE_SYST_UPDATE
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {["security", "notifications", "permissions"].includes(activeTab) && (
                            <motion.div 
                                key="locked"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="h-full flex flex-col items-center justify-center text-center space-y-8 md:space-y-12 opacity-40 p-8 md:p-20 border-4 border-dashed border-[var(--theme-border)] rounded-[2.5rem] md:rounded-[4rem]"
                            >
                                <div className="relative">
                                     <FiLock size={80} md:size={120} strokeWidth={1} className="text-[var(--theme-text-muted)] mb-4 md:mb-8" />
                                     <FiShieldOff size={24} md:size={40} className="absolute bottom-3 md:bottom-6 right-0 text-[var(--status-error)] animate-pulse" />
                                </div>
                                <div className="space-y-3 md:space-y-4">
                                    <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic text-[var(--theme-text)]">ENCRYPTED_BLOCK</h3>
                                    <p className="text-xs md:text-sm font-black text-[var(--theme-text-muted)] uppercase tracking-widest max-w-lg mx-auto leading-relaxed italic">
                                        THIS_MODULE_IS_PROTECTED_BY_SECONDARY_BIOMETRIC_VERIFICATION_NODES._INITIATE_UPLINK_TO_PROCEED.
                                    </p>
                                </div>
                                <button className="px-6 md:px-10 py-4 md:py-5 bg-[var(--theme-bg-alt)] border-2 border-[var(--theme-border)] rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-wider italic text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] hover:border-[var(--theme-primary)]/30 transition-all flex items-center gap-3 md:gap-4">
                                    <FiTarget /> INITIATE_CHALLENGE_SYNC
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10 mx-2 relative z-10">
                 <TelemetryCard label="CORE_SYST_HEALTH" value="OPTIMAL" icon={<FiActivity />} color="var(--status-success)" />
                 <TelemetryCard label="RESOURCE_LOAD" value="12%" icon={<FiHash />} color="var(--theme-primary)" />
                 <TelemetryCard label="SECURITY_THREATS" value="ZERO" icon={<FiShield />} color="var(--status-warning)" />
                 <TelemetryCard label="REGISTRY_STAMP" value="v4.0_STABLE" icon={<FiZap />} color="var(--theme-secondary)" />
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








