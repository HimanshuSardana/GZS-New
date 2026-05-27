import React, { useEffect } from 'react';
import { useParams, Outlet } from 'react-router-dom';
import { FiSearch, FiEdit2, FiCheck, FiMoreHorizontal, FiZap, FiPlusCircle, FiActivity, FiGlobe, FiShield, FiUser, FiTerminal, FiCpu, FiHash } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme, usePageTheme } from '@/app/providers/ThemeProvider';
import ConversationsList from './ConversationsList';

export default function MessagingHub() {
    usePageTheme('profile');
    const { userId } = useParams();
    const { setThemeVariant } = useTheme();

    useEffect(() => {
        setThemeVariant('profile');
    }, [setThemeVariant]);

    return (
        <div className="bg-[var(--theme-bg)] min-h-screen text-[var(--theme-text)] font-body flex overflow-hidden fixed inset-0 top-[var(--header-height,64px)] selection:bg-[var(--theme-primary)]/30">
            
            {/* Sidebar: Synchronicity Manifest */}
            <aside className={`
                w-full md:w-[450px] lg:w-[480px] bg-[var(--theme-card)] border-r-2 border-[var(--theme-border)] flex flex-col shrink-0 transition-all duration-700 z-30 shadow-2xl relative overflow-hidden
                ${userId ? '-translate-x-full md:translate-x-0 absolute md:relative' : 'translate-x-0'}
            `}>
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[var(--theme-primary)]/5 blur-[100px] rounded-full pointer-events-none -mr-48 -mt-48" />
                
                <header className="p-5 border-b border-[var(--theme-border)] space-y-12 bg-[var(--theme-card)]/80 backdrop-blur-3xl sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <div className="space-y-6">
                            <div className="flex items-center gap-5">
                                <div className="w-3 h-3 bg-[var(--theme-primary)] rounded-full animate-ping" />
                                <span className="text-xs font-bold uppercase tracking-widest text-[var(--theme-text-muted)]">Messages</span>
                            </div>
                            <h1 className="text-2xl font-black uppercase tracking-tight text-[var(--theme-text)]">Conversations</h1>
                        </div>
                        <button className="group w-10 h-10 bg-[var(--theme-primary)] text-white rounded-xl flex items-center justify-center hover:bg-[var(--theme-primary-dark)] transition-colors">
                            <FiPlusCircle size={20} />
                        </button>
                    </div>

                    <div className="flex gap-4 p-2 bg-[var(--theme-bg-alt)]/50 backdrop-blur-md rounded-3xl border-2 border-[var(--theme-border)] h-20 shadow-inner">
                        <button className="flex-1 flex items-center justify-center gap-4 bg-[var(--theme-card)] shadow-2xl border-2 border-[var(--theme-border)] rounded-2xl text-xs font-black uppercase tracking-wider italic text-[var(--theme-primary)] hover:scale-102 transition-transform">
                             <FiUser size={18} strokeWidth={3} /> DIRECT_SYNC
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-4 text-[var(--theme-text-muted)] text-xs font-black uppercase tracking-wider italic hover:text-[var(--theme-text)] transition-all opacity-40 hover:opacity-100">
                             <FiActivity size={18} strokeWidth={3} /> GROUP_NODE
                        </button>
                    </div>

                    <div className="relative group">
                        <div className="absolute left-8 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] group-focus-within:text-[var(--theme-primary)] transition-colors z-10 opacity-40 group-focus-within:opacity-100">
                             <FiSearch size={22} strokeWidth={3} />
                        </div>
                        <input 
                            type="text" 
                            placeholder="TRACE CONVERSATION_SIGNATURE..."
                            className="w-full bg-[var(--theme-bg-alt)]/50 border-2 border-[var(--theme-border)] rounded-2xl pl-20 pr-10 py-6 text-sm font-black uppercase tracking-widest focus:ring-8 focus:ring-[var(--theme-primary)]/5 focus:border-[var(--theme-primary)]/40 outline-none transition-all placeholder:text-[var(--theme-text-muted)] placeholder:opacity-20 shadow-inner italic"
                        />
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto scrollbar-thin bg-transparent relative z-10">
                    <ConversationsList activeId={userId} />
                </div>
                
                <footer className="p-10 border-t-2 border-dashed border-[var(--theme-border)] bg-[var(--theme-bg-alt)]/40 flex items-center justify-between relative z-10 backdrop-blur-xl">
                    <div className="flex items-center gap-6 text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-40 hover:opacity-100 transition-opacity cursor-help group">
                        <FiGlobe size={18} className="group-hover:rotate-180 transition-transform duration-1000" /> ONLINE_STATUS: ACTIVE
                    </div>
                    <div className="flex items-center gap-6 text-xs font-black uppercase tracking-widest text-[var(--status-success)] italic animate-pulse">
                        <FiShield size={18} strokeWidth={3} /> E2E_CRYPTO_LOCK
                    </div>
                </footer>
                
                <FiTerminal size={400} className="absolute bottom-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 opacity-[0.01] text-[var(--theme-text)] pointer-events-none rotate-12" />
            </aside>

            {/* Main Chat Area: The Synergy Deck */}
            <main className="flex-1 flex flex-col bg-[var(--theme-bg)] overflow-hidden relative">
                <Outlet context={{ isMobile: true }} />
            </main>
        </div>
    );
}








