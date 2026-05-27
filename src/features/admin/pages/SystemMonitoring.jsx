import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
    FiActivity, FiCpu, FiHardDrive, FiServer, 
    FiShield, FiGlobe, FiClock, FiZap,
    FiArrowUp, FiArrowDown, FiChevronRight, FiAlertCircle, FiTarget, FiTerminal, FiHash, FiZapOff
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';

const MOCK_METRICS = Array.from({ length: 20 }, (_, i) => ({
    time: `${i}:00`,
    cpu: Math.floor(Math.random() * 30) + 10,
    memory: Math.floor(Math.random() * 20) + 40,
    latency: Math.floor(Math.random() * 50) + 20,
}));

const SYSTEM_NODES = [
    { id: 'CORE-01', name: 'Identity Engine', type: 'Microservice', status: 'Online', load: '12%', region: 'US-EAST' },
    { id: 'SOCIAL-02', name: 'Sphere Lobby', type: 'WebSocket', status: 'Online', load: '45%', region: 'AP-SOUTH' },
    { id: 'ARENA-03', name: 'Tournament Node', type: 'Compute', status: 'Standby', load: '0%', region: 'EU-WEST' },
    { id: 'TRUTH-04', name: 'Blockchain Sync', type: 'Validator', status: 'Online', load: '28%', region: 'US-WEST' },
    { id: 'MEDIA-05', name: 'Edge CDN', type: 'Storage', status: 'Degraded', load: '89%', region: 'GLOBAL' },
];

const MetricCard = ({ label, value, subvalue, icon, trend, color, delay = 0 }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.8 }}
        className="admin-stat-card group"
    >
        <div className="flex justify-between items-start mb-6 md:mb-8 relative z-10">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-2xl group-hover:rotate-12 transition-transform duration-700 border-2 border-white/5" style={{ backgroundColor: color }}>
                {React.cloneElement(icon, { size: 28, strokeWidth: 2.5 })}
            </div>
            <div className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-black italic border-2 shadow-inner tabular-nums ${trend >= 0 ? 'text-[var(--status-success)] bg-[var(--status-success-soft)] border-[var(--status-success)]/10' : 'text-[var(--status-error)] bg-[var(--status-error-soft)] border-[var(--status-error)]/10'}`}>
                {trend >= 0 ? <FiArrowUp strokeWidth={4} /> : <FiArrowDown strokeWidth={4} />} {Math.abs(trend)}%
            </div>
        </div>
        
        <div className="space-y-2 md:space-y-3 relative z-10">
            <p className="admin-stat-label group-hover:text-[var(--theme-primary)] transition-colors">{label}</p>
            <h3 className="admin-stat-number">{value}</h3>
            <p className="text-[10px] md:text-xs font-black italic uppercase tracking-wider opacity-40 flex items-center gap-2 md:gap-3">
                 <FiHash className="text-[var(--theme-primary)]" /> {subvalue}
            </p>
        </div>
    </motion.div>
);

const SystemMonitoring = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="space-y-12 md:space-y-16 pb-24 md:pb-32 relative min-h-screen">
            <Helmet><title>Nexus Telemetry | Admin Nexus</title></Helmet>
            
            {/* Cinematic Backdrop */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] bg-[var(--theme-primary)]/5 blur-[180px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[80%] h-[80%] bg-[var(--theme-secondary)]/5 blur-[180px] rounded-full" />
            </div>

            {/* Header: Global Pulse */}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 md:gap-12 relative z-10 px-2">
                <div className="space-y-6 md:space-y-8 text-left">
                    <div className="flex items-center gap-4 md:gap-6 group">
                        <div className="w-12 md:w-16 h-1 bg-[var(--theme-primary)] rounded-full animate-pulse shadow-[0_0_10px_rgba(var(--theme-primary-rgb),0.5)]" />
                        <span className="text-[10px] md:text-sm font-black uppercase tracking-widest text-[var(--theme-primary)] italic leading-none opacity-80">v4.08_PULSE_COMMAND</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter italic leading-[0.9] md:leading-[0.8] text-[var(--theme-text)]">Telemetry <br/><span className="text-transparent opacity-20">CONTROL_NODE</span></h1>
                </div>

                <div className="bg-[var(--theme-card)]/80 backdrop-blur-3xl p-6 md:p-8 rounded-3xl md:rounded-full border-2 border-[var(--theme-border)] shadow-2xl flex flex-col sm:flex-row items-start sm:items-center gap-6 md:gap-12 relative overflow-hidden group grow-0">
                    <div className="flex items-center gap-4 md:gap-6 relative z-10">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] bg-[var(--theme-bg-alt)] flex items-center justify-center border-2 border-[var(--theme-border)] group-hover:rotate-[360deg] transition-transform duration-[2s]">
                            <FiClock className="text-[var(--theme-primary)]" size={28} strokeWidth={2.5} />
                        </div>
                        <div className="space-y-1 md:space-y-2">
                            <p className="text-[10px] md:text-xs font-black text-[var(--theme-text-muted)] uppercase tracking-wider opacity-40 italic leading-none">MASTER_CLOCK_v4</p>
                            <p className="text-lg md:text-xl font-black text-[var(--theme-text)] italic tracking-wide tabular-nums leading-none">{currentTime.toLocaleTimeString()}</p>
                        </div>
                    </div>
                    <div className="w-full sm:w-[2px] h-[2px] sm:h-12 bg-gradient-to-r sm:bg-gradient-to-b from-transparent via-[var(--theme-border)] to-transparent relative z-10" />
                    <div className="flex items-center gap-4 md:gap-6 relative z-10">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] bg-[var(--status-success-soft)] flex items-center justify-center border-2 border-[var(--status-success)]/10 shadow-inner">
                            <FiZap className="text-[var(--status-success)] animate-pulse" size={28} strokeWidth={2.5} />
                        </div>
                        <div className="space-y-1 md:space-y-2">
                            <p className="text-[10px] md:text-xs font-black text-[var(--theme-text-muted)] uppercase tracking-wider opacity-40 italic leading-none">REGISTRY_SYNC</p>
                            <p className="text-lg md:text-xl font-black text-[var(--status-success)] italic tracking-wider leading-none animate-pulse">NOMINAL_v4</p>
                        </div>
                    </div>
                    <FiTarget size={200} className="absolute bottom-[-50px] left-[-50px] text-[var(--theme-primary)] opacity-[0.03] group-hover:scale-125 transition-transform duration-[10s] pointer-events-none" />
                </div>
            </header>

            {/* Hardware Transmission Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 relative z-10 px-2 md:px-0">
                <MetricCard label="CPU_VELOCITY_v4" value="24.8%" subvalue="CLUSTER_NODE_01_08" icon={<FiCpu />} trend={-2} color="var(--theme-primary)" delay={0.1} />
                <MetricCard label="MEMORY_DENSITY_SYNC" value="5.2 GB" subvalue="DOMAIN_BUFFER_TOTAL" icon={<FiHardDrive />} trend={1} color="var(--theme-secondary)" delay={0.2} />
                <MetricCard label="UPLINK_STREAM_BURST" value="ACTIVE" subvalue="PULSE_PORT_8080_SYNK" icon={<FiServer />} trend={0} color="var(--theme-primary)" delay={0.3} />
                <MetricCard label="ENCRYPTION_FABRIC" value="AES-256" subvalue="SHA_GCM_ARCHITECTURE" icon={<FiShield />} trend={0} color="var(--status-warning)" delay={0.4} />
            </div>

            {/* Performance Visualization Hub */}
            <div className="grid xl:grid-cols-12 gap-10 md:gap-12 items-start relative z-10 px-2 md:px-0">
                <div className="xl:col-span-8 space-y-10 md:space-y-12">
                    <div className="p-8 md:p-12 bg-[var(--theme-card)]/80 backdrop-blur-3xl border-2 border-[var(--theme-border)] rounded-[2.5rem] md:rounded-full shadow-2xl relative overflow-hidden group">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-16 border-b-2 border-dashed border-[var(--theme-border)]/50 pb-8 md:pb-12 gap-6 md:gap-8">
                            <div className="space-y-2 md:space-y-3">
                                <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tighter italic text-[var(--theme-text)] group-hover:text-[var(--theme-primary)] transition-colors leading-none">Node_Load_Projections</h3>
                                <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-30 italic leading-none flex items-center gap-3 md:gap-4">
                                    <FiActivity className="text-[var(--theme-primary)] animate-pulse" /> GLOBAL_DISTRIBUTION_EFFICIENCY
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-4 md:gap-8 px-6 md:px-8 py-2 md:py-3 bg-[var(--theme-bg-alt)]/50 rounded-full border-2 border-[var(--theme-border)] shadow-inner">
                                <LegendItem color="var(--theme-primary)" label="NETWORK_PULSE" />
                                <LegendItem color="var(--status-success)" label="CORE_VELOCITY" />
                            </div>
                        </div>

                        <div className="h-[300px] md:h-[450px] w-full relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={MOCK_METRICS}>
                                    <defs>
                                        <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--theme-primary)" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="var(--theme-primary)" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--status-success)" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="var(--status-success)" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="var(--theme-border)" opacity={0.3} />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: 'var(--theme-text-muted)', textTransform: 'uppercase', fontStyle: 'italic', opacity: 0.5 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: 'var(--theme-text-muted)', fontStyle: 'italic', opacity: 0.5 }} />
                                    <Tooltip 
                                        cursor={{ stroke: 'var(--theme-primary)', strokeWidth: 2, strokeDasharray: '5 5' }}
                                        contentStyle={{ backgroundColor: 'var(--theme-card)', borderRadius: '1.5rem', border: '2px solid var(--theme-border)', boxShadow: '0 40px 80px rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)' }}
                                        itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', color: 'var(--theme-text)' }}
                                        labelStyle={{ fontSize: '9px', fontWeight: '900', color: 'var(--theme-primary)', marginBottom: '8px', letterSpacing: '2px' }}
                                    />
                                    <Area type="monotone" dataKey="cpu" stroke="var(--theme-primary)" strokeWidth={4} md:strokeWidth={6} fillOpacity={1} fill="url(#colorCpu)" animationDuration={2000} />
                                    <Area type="monotone" dataKey="memory" stroke="var(--status-success)" strokeWidth={4} md:strokeWidth={6} fillOpacity={1} fill="url(#colorMem)" animationDuration={2500} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <FiTerminal size={400} className="absolute bottom-[-100px] left-[-100px] opacity-[0.01] text-[var(--theme-text)] pointer-events-none rotate-12" />
                    </div>

                    <div className="p-8 md:p-16 bg-[var(--theme-bg-alt)]/40 border-2 border-[var(--theme-border)] rounded-[2.5rem] md:rounded-full shadow-inner relative overflow-hidden group/latency">
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--theme-primary)]/[0.02] to-transparent pointer-events-none" />
                        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-10 md:gap-16">
                            <div className="space-y-10 md:space-y-12 xl:w-1/2">
                                <div className="space-y-3 md:space-y-4">
                                    <h4 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic text-[var(--theme-text)] group-hover/latency:text-[var(--theme-primary)] transition-colors leading-none">MILLISECOND_SYNC</h4>
                                    <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-30 leading-none flex items-center gap-3 md:gap-4">
                                        <FiGlobe className="text-[var(--theme-primary)]" /> SECURE_UPLINK_DIAGNOSTIC
                                    </p>
                                </div>
                                <div className="space-y-4 md:space-y-6">
                                    {[
                                        { node: 'GATEWAY_NODE_01', latency: '42ms', status: 'PEAK_SYNC', color: 'var(--theme-primary)' },
                                        { node: 'SOCIAL_EDGE_SYNC', latency: '12ms', status: 'NOMINAL', color: 'var(--status-success)' },
                                        { node: 'IDENTITY_SHARD_DB', latency: '8ms', status: 'OPTIMAL', color: 'var(--status-success)' },
                                    ].map(n => (
                                        <div key={n.node} className="p-6 md:p-8 bg-[var(--theme-card)]/80 backdrop-blur-xl rounded-2xl border-2 border-[var(--theme-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between group/line hover:translate-x-0 md:hover:translate-x-4 hover:border-[var(--theme-primary)]/40 transition-all shadow-2xl cursor-crosshair gap-4 sm:gap-0">
                                            <div className="flex items-center gap-4 md:gap-6">
                                                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full animate-pulse shadow-2xl" style={{ backgroundColor: n.color }} />
                                                <span className="text-xs md:text-sm font-black uppercase italic tracking-tighter text-[var(--theme-text-muted)] group-hover/line:text-[var(--theme-text)] transition-colors">{n.node}</span>
                                            </div>
                                            <div className="flex items-center gap-6 md:gap-8 w-full sm:w-auto justify-between sm:justify-end">
                                                <span className="text-base md:text-[18px] font-black italic tracking-widest tabular-nums tabular-nums leading-none" style={{ color: n.color }}>{n.latency}</span>
                                                <span className={`text-[10px] font-black uppercase px-3 md:px-4 py-1.5 md:py-2 rounded-full border-2 italic tracking-tight shadow-inner`} style={{ color: n.color, borderColor: `${n.color}20`, backgroundColor: `${n.color}08` }}>{n.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 min-h-[250px] md:min-h-[300px] bg-[var(--theme-card)] rounded-[2.5rem] md:rounded-full border-2 border-[var(--theme-border)] p-8 md:p-12 shadow-2xl relative overflow-hidden group/graph">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--theme-primary)]/[0.02] to-transparent pointer-events-none" />
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={MOCK_METRICS}>
                                        <Line type="stepAfter" dataKey="latency" stroke="var(--theme-primary)" strokeWidth={4} md:strokeWidth={5} dot={false} strokeDasharray="10 10" animationDuration={3000} />
                                        <XAxis dataKey="time" hide />
                                        <YAxis hide />
                                        <Tooltip 
                                            cursor={{ stroke: 'var(--theme-primary)', strokeWidth: 2 }}
                                            contentStyle={{ backgroundColor: 'var(--theme-text)', color: 'var(--theme-bg)', borderRadius: '1.5rem', border: 'none', padding: '15px' }}
                                            labelStyle={{ display: 'none' }}
                                            itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                                <div className="absolute top-6 md:top-8 right-8 md:right-10 text-[10px] md:text-xs font-black uppercase tracking-widest text-[var(--theme-primary)] animate-pulse italic leading-none opacity-40">LIVE_BYTESTREAM_V4</div>
                            </div>
                        </div>
                    </div>
                </div>

                <aside className="xl:col-span-4 space-y-12">
                    {/* Active Node Registry (Dark Forensic Mode) */}
                    <div className="p-12 bg-[var(--theme-text)] rounded-full text-[var(--theme-bg)] shadow-2xl relative overflow-hidden group/registry border-4 border-white/5">
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[var(--theme-primary)] opacity-10 rounded-full blur-[120px] -mr-48 -mt-48 group-hover/registry:scale-150 transition-transform duration-[15s] pointer-events-none" />
                        <div className="relative z-10 space-y-12">
                            <div className="flex items-center justify-between border-b-2 border-dashed border-white/10 pb-10">
                                <h3 className="font-black uppercase tracking-widest text-sm opacity-30 italic flex items-center gap-6"><FiTerminal className="text-[var(--theme-primary)]" /> SECURE_UPLINK_INDEX</h3>
                                <FiActivity className="text-[var(--theme-primary)] animate-pulse" size={32} strokeWidth={3} />
                            </div>
                            <div className="space-y-6">
                                {SYSTEM_NODES.map((node, _idx) => (
                                    <div key={node.id} className="p-8 bg-white/[0.03] rounded-3xl border-2 border-white/5 group/node hover:bg-white/[0.08] transition-all cursor-crosshair relative overflow-hidden">
                                        <div className="flex justify-between items-center mb-6 relative z-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: node.status === 'Degraded' ? 'var(--status-error)' : 'var(--status-success)' }} />
                                                <span className="text-xs font-black uppercase tracking-wider text-[var(--theme-primary)] italic opacity-60 group-hover/node:opacity-100 transition-opacity">{node.region}</span>
                                            </div>
                                            <span className={`text-xs font-black uppercase px-6 py-2 rounded-full border-2 italic tracking-wide shadow-2xl transition-all group-hover/node:scale-110 ${node.status === 'Degraded' ? 'bg-[var(--status-error)] text-white border-white/10' : 'bg-[var(--status-success)] text-white border-white/10'}`}>
                                                {node.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <h4 className="text-2xl font-black uppercase tracking-tighter italic mb-4 group-hover/node:text-[var(--theme-primary)] transition-colors leading-none relative z-10">{node.name.toUpperCase()}</h4>
                                        <div className="flex justify-between items-end border-t-2 border-dashed border-white/5 pt-6 mt-4 relative z-10">
                                            <span className="text-xs font-black text-white/20 uppercase tracking-wide italic">{node.type.toUpperCase()}</span>
                                            <div className="text-right space-y-1">
                                                <div className="text-xl font-black italic tabular-nums text-white/90">{node.load}</div>
                                                <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        whileInView={{ width: node.load }}
                                                        className="h-full bg-[var(--theme-primary)] rounded-full shadow-[0_0_10px_rgba(var(--theme-primary-rgb),0.8)]"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <FiCpu className="absolute bottom-[-20px] right-[-20px] opacity-[0.05] text-[var(--theme-primary)] group-hover/node:scale-125 transition-transform duration-[5s] pointer-events-none" size={100} />
                                    </div>
                                ))}
                            </div>
                            <button className="w-full py-8 bg-[var(--theme-primary)] text-white rounded-[2.2rem] text-sm font-black uppercase tracking-widest italic hover:scale-[1.05] transition-all shadow-2xl shadow-[var(--theme-primary)]/40 active:scale-95 group/btn border-4 border-white/5  flex items-center justify-center gap-8 group/deploy">
                                <span className="relative z-10 flex items-center justify-center gap-6">
                                    <FiZap size={22} strokeWidth={3} className="group-hover/deploy:animate-bounce" /> REDEPLOY_GLOBAL_CLUSTER_v4
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Threat Detection (Tactical Forensic Look) */}
                    <div className="p-12 bg-[var(--theme-card)]/80 backdrop-blur-3xl border-2 border-[var(--theme-border)] rounded-full shadow-2xl space-y-12 relative overflow-hidden group/anomalies">
                        <div className="flex items-center gap-8 border-b-2 border-dashed border-[var(--theme-border)] pb-10">
                            <div className="w-20 h-20 rounded-2xl bg-[var(--theme-bg-alt)]/50 flex items-center justify-center border-2 border-[var(--theme-border)] shadow-inner text-[var(--status-error)] group-hover/anomalies:rotate-[360deg] transition-transform duration-[2s]">
                                <FiAlertCircle size={36} strokeWidth={2.5} className="animate-pulse" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black uppercase tracking-tighter text-[var(--theme-text)] italic leading-none group-hover/anomalies:text-[var(--status-error)] transition-colors">THREAT_MATRI_x4</h3>
                                <p className="text-xs font-black uppercase tracking-wider text-[var(--status-error)] opacity-40 italic leading-none animate-pulse">LIVE_INTREUSION_BUFFER</p>
                            </div>
                        </div>
                        <div className="space-y-8">
                            {[
                                { msg: 'UNRECOGNIZED_HANDSHAKE_TRACE_AP_SOUTH_02', time: '2M_AGO', type: 'CRITICAL', color: 'var(--status-error)' },
                                { msg: 'CREDENTIAL_ROTATION_BUFFER_EXCEEDED_SYNC_FAIL', time: '14M_AGO', type: 'WARNING', color: 'var(--status-warning)' },
                                { msg: 'MITIGATION_THRESHOLD_REACHED_AUTO_PURGE', time: '1H_AGO', type: 'INFO', color: 'var(--theme-primary)' },
                            ].map((alert, i) => (
                                <div 
                                    key={i} 
                                    className="admin-card !p-8 flex gap-8 group/alert"
                                    style={{ 
                                        borderLeft: alert.type === 'CRITICAL' ? '3px solid var(--status-error)' : 
                                                    alert.type === 'WARNING' ? '3px solid var(--status-warning)' : 'none' 
                                    }}
                                >
                                     <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.02] -mr-8 -mt-8 rotate-12 transition-transform group-hover/alert:scale-150" style={{ color: alert.color }}>
                                        <FiZapOff size={64} />
                                     </div>
                                    <div className={`w-3 h-3 rounded-full mt-3 shrink-0 animate-pulse shadow-2xl`} style={{ backgroundColor: alert.color, boxShadow: `0 0 15px ${alert.color}80` }} />
                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center justify-between gap-6">
                                            <span className={`text-xs font-black uppercase tracking-wider italic leading-none`} style={{ color: alert.color }}>{alert.type}</span>
                                            <span className="text-xs font-black uppercase text-[var(--theme-text-muted)] opacity-20 italic tabular-nums tracking-widest leading-none">{alert.time}</span>
                                        </div>
                                        <p className="text-base font-black text-[var(--theme-text)] italic tracking-tighter leading-[1.3] group-hover/alert:text-[var(--theme-primary)] transition-colors uppercase">{alert.msg}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <FiHash size={300} className="absolute bottom-[-100px] right-[-100px] opacity-[0.015] text-[var(--theme-text)] pointer-events-none -rotate-12" />
                    </div>
                </aside>
            </div>
        </div>
    );
};

const LegendItem = ({ color, label }) => (
    <div className="flex items-center gap-4 group">
        <div className="w-3 h-3 rounded-full animate-pulse shadow-2xl" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}80` }} />
        <span className="text-xs font-black uppercase tracking-wider text-[var(--theme-text-muted)] italic opacity-40 group-hover:opacity-100 transition-opacity leading-none">{label}</span>
    </div>
);

export default SystemMonitoring;








