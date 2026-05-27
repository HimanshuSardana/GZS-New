import React, { useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMessages } from '@/services/mutators/useMessages';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';
import { 
    FiChevronLeft, FiPhone, FiVideo, FiMoreVertical, 
    FiZap, FiTarget, FiShield, FiGlobe, FiActivity, FiTerminal, FiHash, FiCpu, FiMoreHorizontal
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { usePageTheme } from '@/app/providers/ThemeProvider';

export default function ConversationView() {
    usePageTheme('profile');
    const { userId } = useParams();
    const navigate = useNavigate();
    const { useGetConversation, useSendMessage } = useMessages();
    const { data: messages } = useGetConversation(userId);
    const { mutate: sendMessage } = useSendMessage();
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (content) => {
        sendMessage({ userId, data: { content } });
    };

    const mockMessages = [
        { id: 1, content: "UPLINK ESTABLISHED. OPERATIONAL_STATUS_v4?", timestamp: "10:30 AM", isMe: false, status: 'synced' },
        { id: 2, content: "SYNCING_DATA_SHARDS. 85%_COMPLETE_V.4.08.", timestamp: "10:32 AM", isMe: true, status: 'synced' },
        { id: 3, content: "ACKNOWLEDGED. PROCEED_TO_GZONESPHERE_HUB_FOR_ENGAGEMENT.", timestamp: "10:33 AM", isMe: false, status: 'synced' },
    ];

    const displayMessages = messages?.length > 0 ? messages : mockMessages;

    return (
        <div className="flex-1 flex flex-col bg-[var(--theme-bg)] overflow-hidden relative selection:bg-[var(--theme-primary)]/30">
            {/* Cinematic Background Artifacts */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-[var(--theme-primary)]/[0.03] blur-3xl rounded-full animate-pulse" />
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[var(--theme-primary)]/5 blur-[120px] rounded-full -mr-32 -mt-32" />
            </div>

            {/* Chat Header: Forensic Uplink Matrix */}
            <header className="px-12 py-10 border-b-2 border-dashed border-[var(--theme-border)] flex items-center justify-between bg-[var(--theme-card)]/80 backdrop-blur-3xl z-20 shadow-2xl relative group">
                <div className="flex items-center gap-10">
                    <button 
                        onClick={() => navigate('/messages')}
                        className="md:hidden w-16 h-16 bg-[var(--theme-text)] text-[var(--theme-bg)] rounded-[1.8rem] flex items-center justify-center shadow-2xl hover:bg-[var(--theme-primary)] hover:text-white transition-all border-2 border-white/5"
                    >
                        <FiChevronLeft size={28} strokeWidth={3} />
                    </button>
                    
                    <div className="relative group/avatar">
                        <div className="w-20 h-20 rounded-2xl bg-[var(--theme-text)] text-[var(--theme-bg)] flex items-center justify-center text-3xl font-black shadow-2xl transition-all duration-700 group-hover/avatar:rotate-12 group-hover/avatar:scale-110 italic border-4 border-white/5 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-[var(--theme-primary)]/20 to-transparent" />
                            {userId?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[var(--theme-card)] rounded-[1.2rem] flex items-center justify-center shadow-2xl border-2 border-[var(--theme-border)]">
                            <div className="w-4 h-4 bg-[var(--status-success)] rounded-full animate-pulse shadow-[0_0_15px_rgba(var(--status-success-rgb),0.8)]" />
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="flex items-center gap-6">
                            <h2 className="text-3xl font-black uppercase tracking-tighter text-[var(--theme-text)] leading-none italic group-hover:text-[var(--theme-primary)] transition-colors">@{userId || 'SYNERGY_UNIT'}</h2>
                            <div className="px-4 py-1.5 bg-[var(--theme-primary)]/10 border-2 border-[var(--theme-primary)]/10 rounded-full flex items-center gap-3">
                                <FiZap size={14} className="text-[var(--theme-primary)] animate-pulse" strokeWidth={3} />
                                <span className="text-xs font-black uppercase tracking-widest text-[var(--theme-primary)]">v4.08_SYNC</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-5">
                             <div className="flex items-center gap-3">
                                 <FiShield size={14} className="text-[var(--status-success)]" strokeWidth={3} />
                                 <span className="text-xs font-black uppercase text-[var(--theme-text-muted)] tracking-wider italic opacity-40">ENCRYPTED_TRACE</span>
                             </div>
                             <div className="w-1.5 h-1.5 bg-[var(--theme-border)] rounded-full opacity-30" />
                             <span className="text-xs font-black uppercase text-[var(--status-success)] tracking-widest italic animate-pulse">OPERATIONAL_STATION</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-6">
                    <HeaderAction icon={<FiPhone size={22} />} />
                    <HeaderAction icon={<FiVideo size={22} />} />
                    <div className="w-[2px] h-12 bg-gradient-to-b from-transparent via-[var(--theme-border)] to-transparent mx-4 opacity-50" />
                    <HeaderAction icon={<FiMoreHorizontal size={22} />} />
                </div>
                
                <div className="absolute bottom-[-1px] left-10 right-10 h-[1.5px] bg-gradient-to-r from-transparent via-[var(--theme-primary)]/30 to-transparent" />
            </header>
            
            {/* Messages Area: Forensic Transmission Log */}
            <div className="flex-1 overflow-y-auto px-12 py-16 space-y-12 hide-scrollbar relative z-10 bg-transparent">
                {/* Visual Artifact: Matrix Rain Stub */}
                <div className="absolute inset-0 opacity-[0.015] pointer-events-none select-none flex flex-wrap gap-12 p-10 font-mono text-xs items-center justify-center overflow-hidden">
                    {Array.from({ length: 40 }).map((_, i) => (
                        <span key={i} className="animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>
                            {Math.random().toString(36).substring(7).toUpperCase()}
                        </span>
                    ))}
                </div>

                <AnimatePresence>
                    {displayMessages.map((msg, i) => (
                        <motion.div
                            key={msg.id || i}
                            initial={{ opacity: 0, y: 30, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
                        >
                            <MessageBubble message={msg} isMe={msg.isMe} />
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={bottomRef} className="h-4" />
            </div>
            
            {/* Input Overlay: Tactics Terminal Control */}
            <div className="p-10 bg-[var(--theme-card)]/80 backdrop-blur-3xl border-t-2 border-dashed border-[var(--theme-border)] relative z-20 shadow-[0_-20px_60px_-10px_rgba(0,0,0,0.1)]">
                <div className="max-w-[1200px] mx-auto space-y-8">
                    <MessageInput onSend={handleSend} />
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-10 opacity-30 hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-6">
                            <div className="w-2 h-2 bg-[var(--status-success)] rounded-full animate-pulse shadow-[0_0_10px_rgba(var(--status-success-rgb),0.6)]" />
                            <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic">END_TO_END_ENCRYPTED_NEXUS_LINK_STABLE</p>
                        </div>
                        <div className="flex items-center gap-8 text-xs font-black uppercase tracking-wider italic text-[var(--theme-text-muted)]">
                            <span className="flex items-center gap-3 text-[var(--status-success)]"><FiShield strokeWidth={3} /> PROTOCOL_SECURED</span>
                            <div className="w-px h-6 bg-[var(--theme-border)] border-dashed border" />
                            <span className="flex items-center gap-3 group cursor-help"><FiGlobe className="group-hover:rotate-180 transition-transform duration-[2s]" strokeWidth={3} /> GEODATA_SYNC_v4</span>
                        </div>
                    </div>
                </div>
                
                {/* Background ID traces */}
                <FiTerminal size={300} className="absolute top-1/2 left-[-100px] -translate-y-1/2 opacity-[0.01] text-[var(--theme-text)] pointer-events-none" />
                <FiCpu size={300} className="absolute top-1/2 right-[-100px] -translate-y-1/2 opacity-[0.01] text-[var(--theme-text)] pointer-events-none" />
            </div>
        </div>
    );
}

function HeaderAction({ icon }) {
    return (
        <button className="w-16 h-16 bg-[var(--theme-bg-alt)] border-2 border-[var(--theme-border)] rounded-[1.5rem] flex items-center justify-center text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] hover:border-[var(--theme-primary)]/30 transition-all shadow-inner group relative overflow-hidden active:scale-95">
            <div className="relative z-10 group-hover:scale-125 transition-transform duration-500">{icon}</div>
            <div className="absolute inset-0 bg-gradient-to-tr from-[var(--theme-primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
    );
}








