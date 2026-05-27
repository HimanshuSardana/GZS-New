import { useState } from 'react';
import {
  FiAlertTriangle, FiCheck, FiChevronRight, FiFlag, FiLock,
  FiMessageSquare, FiTrash2, FiVolumeX, FiX,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/shared/components/Toast';
import { Helmet } from 'react-helmet-async';
import { AdminPageHero } from '@/features/admin/components/AdminContentShell';

const PRIORITY_META = {
  High:   { dot:'bg-rose-500',  text:'text-rose-600',  bg:'bg-rose-500/15 border-rose-500/30'   },
  Medium: { dot:'bg-amber-500', text:'text-amber-600', bg:'bg-amber-500/15 border-amber-500/30' },
  Low:    { dot:'bg-slate-400', text:'text-slate-500', bg:'bg-slate-400/15 border-slate-400/30' },
};

const REPORTS_INIT = [
  { id:'r1', contentType:'Message', branch:'esports', channel:'general',  reportedUser:'toxic123',      reporter:'artisan_flux',    reason:'Harassment',            message:'kys noob get out of this server',                    aiConfidence:'--', status:'Pending',      priority:'High',   warnCount:0 },
  { id:'r2', contentType:'Message', branch:'dev',     channel:'general',  reportedUser:'spammer_bot',   reporter:'sync_master',     reason:'Spam',                  message:'BUY CHEAP SKINS @ best-skins.ru',                    aiConfidence:'--', status:'Pending',      priority:'High',   warnCount:0 },
  { id:'r3', contentType:'Message', branch:'dev',     channel:'showcase', reportedUser:'hateful_user',  reporter:'rapid_fire',      reason:'Toxic behaviour',       message:'This community is trash full of amateurs',           aiConfidence:'--', status:'Pending',      priority:'Medium', warnCount:1 },
  { id:'r4', contentType:'Post',    branch:'art',     channel:'critique', reportedUser:'art_troll_99',  reporter:'artisan_flux',    reason:'Impersonation',         message:'Pretending to be artisan_flux — posting fake critiques', aiConfidence:'--', status:'Under review', priority:'High',   warnCount:0 },
  { id:'r5', contentType:'Profile', branch:'general', channel:'N/A',      reportedUser:'nsfwprofile22', reporter:'community_pulse', reason:'Inappropriate content', message:'Profile avatar violates community guidelines',        aiConfidence:'--', status:'Pending',      priority:'Low',    warnCount:0 },
];

export default function CommunityModeration() {
  const { showToast } = useToast();

  const [reports, setReports] = useState(REPORTS_INIT);
  const [activeReport, setActiveReport] = useState(null);
  const [panelNote, setPanelNote] = useState('');
  const [panelExpand, setPanelExpand] = useState(null);

  const pendingReports = reports.filter(r => r.status === 'Pending' || r.status === 'Under review').length;

  const handleReportAction = (id, action) => {
    const msgs = {
      dismiss:'Report dismissed — content stays', remove:'Content removed — user notified',
      silent:'Content removed silently', warn:'Official warning sent to user',
      mute_ch_1h:'User muted in channel for 1h', mute_ch_24h:'User muted in channel for 24h',
      mute_ch_7d:'User muted in channel for 7 days', mute_br_1h:'User muted in branch for 1h',
      mute_br_24h:'User muted in branch for 24h', mute_br_7d:'User muted in branch for 7 days',
      escalate:'Escalated to super admin', note:'Internal note added',
    };
    const newStatus = action==='dismiss' ? 'Dismissed' : action==='escalate' ? 'Escalated' : 'Actioned';
    setReports(p => p.map(r => r.id===id ? { ...r, status:newStatus } : r));
    setActiveReport(p => p ? { ...p, status:newStatus } : null);
    if (action !== 'note') { setActiveReport(null); setPanelNote(''); setPanelExpand(null); }
    showToast(msgs[action] || 'Action taken', 'success');
  };

  const closePanel = () => { setActiveReport(null); setPanelNote(''); setPanelExpand(null); };

  return (
    <div className="admin-page space-y-10 pb-20 relative min-h-screen">
      <Helmet><title>Moderation Queue | GzoneSphere Admin</title></Helmet>

      <AdminPageHero
        kicker="Community"
        title="Moderation Queue"
        description="Review and action reported content, messages, and profiles."
        actions={pendingReports > 0 ? (
          <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-black uppercase italic animate-pulse">
            <FiAlertTriangle size={16}/> {pendingReports} threats detected
          </div>
        ) : null}
      />

      <motion.div key="moderation" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
        {reports.length === 0 ? (
          <div className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-[4rem] p-32 text-center shadow-2xl">
            <FiCheck size={80} strokeWidth={1} className="mx-auto mb-10 text-[var(--status-success)] opacity-20"/>
            <p className="text-4xl font-black italic uppercase tracking-tighter text-[var(--theme-text)]">THREAT_LEVEL: <span className="text-[var(--status-success)]">ZERO</span></p>
          </div>
        ) : (
          <div className="bg-[var(--theme-card)]/80 backdrop-blur-3xl rounded-[4rem] border-2 border-[var(--theme-border)] overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-dashed border-[var(--theme-border)]/50">
                  {['Content type','Branch / Channel','Reported by','Reason','AI conf.','Status','Priority'].map(h => (
                    <th key={h} className="px-6 py-8 text-xs font-black uppercase tracking-wider text-[var(--theme-text-muted)] opacity-35 italic whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-dashed divide-[var(--theme-border)]/30">
                {reports.map(r => (
                  <tr key={r.id} onClick={() => { setActiveReport(r); setPanelExpand(null); setPanelNote(''); }}
                    className={`cursor-pointer transition-all hover:bg-[var(--theme-bg-alt)]/50 ${activeReport?.id===r.id ? 'bg-[var(--theme-primary)]/5' : ''}`}>
                    <td className="px-6 py-5 text-sm font-black italic text-[var(--theme-text)]">{r.contentType}</td>
                    <td className="px-6 py-5"><code className="text-xs text-[var(--theme-text-muted)] opacity-60">#{r.branch}/{r.channel}</code></td>
                    <td className="px-6 py-5 text-xs text-[var(--theme-primary)] font-black italic">@{r.reporter}</td>
                    <td className="px-6 py-5 text-xs text-[var(--theme-text-muted)]">{r.reason}</td>
                    <td className="px-6 py-5 text-xs font-mono text-[var(--theme-text-muted)] opacity-50">{r.aiConfidence}</td>
                    <td className="px-6 py-5">
                      <span className="admin-status-badge" style={
                        r.status === 'Pending'
                          ? { background: 'var(--status-review-bg)', color: 'var(--status-review-text)' }
                          : r.status === 'Actioned'
                          ? { background: 'var(--status-success-bg)', color: 'var(--status-success-text)' }
                          : { background: 'var(--status-draft-bg)', color: 'var(--status-draft-text)' }
                      }>{r.status}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="admin-status-badge" style={
                        r.priority === 'High'
                          ? { background: 'var(--status-danger-bg)', color: 'var(--status-danger-text)' }
                          : r.priority === 'Medium'
                          ? { background: 'var(--status-warning-bg)', color: 'var(--status-warning-text)' }
                          : { background: 'var(--status-draft-bg)', color: 'var(--status-draft-text)' }
                      }>{r.priority}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* ── Slide panel ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeReport && (
          <>
            <motion.div className="fixed inset-0 z-[79] bg-black/40 backdrop-blur-sm"
              initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              onClick={closePanel}/>
            <motion.div className="fixed right-0 top-0 bottom-0 z-[80] w-full max-w-md bg-[var(--theme-card)] border-l-2 border-[var(--theme-border)] shadow-2xl overflow-y-auto"
              initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}} transition={{type:'spring',damping:28,stiffness:280}}>
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-[var(--theme-primary)] italic opacity-60">THREAT_ANALYSIS</span>
                  <button onClick={closePanel} className="p-2 rounded-xl hover:bg-[var(--theme-bg-alt)] transition-colors"><FiX size={18}/></button>
                </div>

                <div className="space-y-5">
                  <div className="p-5 bg-rose-500/5 border-2 border-rose-500/15 rounded-2xl space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black uppercase tracking-widest text-rose-500">@{activeReport.reportedUser}</span>
                      <span className="text-xs opacity-40">reported by @{activeReport.reporter}</span>
                    </div>
                    <p className="text-sm font-black italic text-[var(--theme-text)]">"{activeReport.message}"</p>
                    <div className="flex gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-black uppercase ${(PRIORITY_META[activeReport.priority]||PRIORITY_META.Low).bg} ${(PRIORITY_META[activeReport.priority]||PRIORITY_META.Low).text}`}>{activeReport.priority}</span>
                      <code className="text-xs text-[var(--theme-text-muted)] opacity-50">#{activeReport.branch}/{activeReport.channel}</code>
                      <span className="text-xs text-[var(--theme-text-muted)] opacity-50">Warns: {activeReport.warnCount}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {[
                      { key:'dismiss', label:'Dismiss',                   cls:'admin-btn admin-btn--secondary !justify-start', icon:<FiCheck size={14}/> },
                      { key:'remove',  label:'Remove content',             cls:'admin-btn admin-btn--danger !justify-start',    icon:<FiTrash2 size={14}/> },
                      { key:'silent',  label:'Silent remove (spam bots)',  cls:'admin-btn admin-btn--danger !justify-start',    icon:<FiVolumeX size={14}/> },
                      { key:'warn',    label:'Warn user',                  cls:'admin-btn admin-btn--danger !justify-start',    icon:<FiAlertTriangle size={14}/> },
                      { key:'escalate',label:'Escalate to super admin',    cls:'admin-btn admin-btn--secondary !justify-start', icon:<FiFlag size={14}/> },
                    ].map(a => (
                      <button key={a.key} onClick={()=>handleReportAction(activeReport.id,a.key)} className={a.cls}>
                        {a.icon} {a.label}
                      </button>
                    ))}

                    <div>
                      <button onClick={()=>setPanelExpand(p=>p==='mute'?null:'mute')} className="admin-btn admin-btn--secondary !justify-between">
                        <span className="flex items-center gap-3"><FiLock size={14}/> Mute</span>
                        <FiChevronRight size={14} className={`transition-transform ${panelExpand==='mute'?'rotate-90':''}`}/>
                      </button>
                      {panelExpand==='mute' && (
                        <div className="mt-1 ml-4 space-y-1">
                          {['ch_1h','ch_24h','ch_7d','br_1h','br_24h','br_7d'].map(d => (
                            <button key={d} onClick={()=>handleReportAction(activeReport.id,`mute_${d}`)}
                              className="w-full text-left px-4 py-2 rounded-xl text-xs font-black italic text-indigo-400 hover:bg-indigo-400/10 transition-colors">
                              {d.startsWith('ch') ? '📍 Channel' : '🌿 Branch'} — {d.split('_')[1]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <button onClick={()=>setPanelExpand(p=>p==='note'?null:'note')} className="admin-btn admin-btn--secondary !justify-between">
                        <span className="flex items-center gap-3"><FiMessageSquare size={14}/> Add internal note</span>
                        <FiChevronRight size={14} className={`transition-transform ${panelExpand==='note'?'rotate-90':''}`}/>
                      </button>
                      {panelExpand==='note' && (
                        <div className="mt-2 ml-4 space-y-2">
                          <textarea rows={3} className="admin-input" placeholder="Note visible only to moderators..." value={panelNote} onChange={e=>setPanelNote(e.target.value)}/>
                          <button onClick={()=>handleReportAction(activeReport.id,'note')} disabled={!panelNote.trim()} className="admin-btn">
                            Save note
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
