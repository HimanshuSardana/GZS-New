import { useState } from 'react';
import {
  FiCalendar, FiCheck, FiDownload, FiEdit2, FiStar, FiTrash2, FiX,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/shared/components/Toast';
import { Helmet } from 'react-helmet-async';
import { AdminPageHero } from '@/features/admin/components/AdminContentShell';

const fmtDate = (iso) =>
  new Intl.DateTimeFormat('en-IN', { day:'numeric', month:'short', year:'numeric' }).format(new Date(iso));

const EVENTS_ADMIN_INIT = [
  { id:'ea1', title:'UE5 Optimization Workshop',       type:'workshop',    branch:'dev',      host:'viper_dev',     date:'2026-04-15T18:00:00Z', rsvpCount:84,  status:'Approved',  featured:false },
  { id:'ea2', title:'VCT Pacific Finals Watch Party',  type:'watch_party', branch:'esports',  host:'rapid_fire',    date:'2026-04-20T12:00:00Z', rsvpCount:312, status:'Approved',  featured:true  },
  { id:'ea3', title:'AMA with GzoneSphere Founders',   type:'ama',         branch:'general',  host:'viper_dev',     date:'2026-04-25T20:00:00Z', rsvpCount:520, status:'Live',      featured:true  },
  { id:'ea4', title:'Game Art Jam — 48hr Challenge',   type:'jam',         branch:'art',      host:'artisan_flux',  date:'2026-05-03T10:00:00Z', rsvpCount:47,  status:'Pending',   featured:false },
  { id:'ea5', title:'Narrative Design Sprint Vol. 2',  type:'workshop',    branch:'writing',  host:'lore_smith',    date:'2026-05-08T16:00:00Z', rsvpCount:29,  status:'Pending',   featured:false },
  { id:'ea6', title:'CS2 Internal Monthly Tournament', type:'tournament',  branch:'esports',  host:'rapid_fire',    date:'2026-05-12T11:00:00Z', rsvpCount:64,  status:'Pending',   featured:false },
  { id:'ea7', title:'Audio Collab Jam Session',        type:'collab',      branch:'audio',    host:'echo_beat',     date:'2026-05-15T18:00:00Z', rsvpCount:33,  status:'Approved',  featured:false },
  { id:'ea8', title:'Indie Pitch Bootcamp',            type:'workshop',    branch:'business', host:'strategy_mind', date:'2026-05-20T14:00:00Z', rsvpCount:18,  status:'Cancelled', featured:false },
];

const EV_STATUS_META = {
  Pending:   { color:'text-amber-500',   bg:'bg-amber-500/15 border-amber-500/30'    },
  Approved:  { color:'text-emerald-500', bg:'bg-emerald-500/15 border-emerald-500/30'},
  Live:      { color:'text-indigo-500',  bg:'bg-indigo-500/15 border-indigo-500/30'  },
  Cancelled: { color:'text-rose-500',    bg:'bg-rose-500/15 border-rose-500/30'      },
  Rejected:  { color:'text-rose-400',    bg:'bg-rose-400/15 border-rose-400/30'      },
};

export default function CommunityEvents() {
  const { showToast } = useToast();

  const [events, setEvents] = useState(EVENTS_ADMIN_INIT);
  const [activeEvent, setActiveEvent] = useState(null);
  const [eventsSubTab, setEventsSubTab] = useState('all');
  const [panelNote, setPanelNote] = useState('');
  const [modal, setModal] = useState(null);

  const closePanel = () => { setActiveEvent(null); setPanelNote(''); };

  const approveEvent = (id) => {
    setEvents(p => p.map(e => e.id===id ? { ...e, status:'Approved' } : e));
    setActiveEvent(p => p ? { ...p, status:'Approved' } : null);
    showToast('Event approved', 'success');
  };
  const rejectEvent = (id) => {
    setEvents(p => p.map(e => e.id===id ? { ...e, status:'Rejected' } : e));
    setActiveEvent(null); setModal(null); setPanelNote('');
    showToast('Event rejected — host notified', 'success');
  };
  const cancelEvent = (id) => {
    setEvents(p => p.map(e => e.id===id ? { ...e, status:'Cancelled' } : e));
    setActiveEvent(null); setModal(null); setPanelNote('');
    showToast('Event cancelled — all RSVPs notified', 'success');
  };
  const toggleFeatureEvent = (id) => {
    setEvents(p => p.map(e => e.id===id ? { ...e, featured:!e.featured } : e));
    const ev = events.find(e => e.id===id);
    setActiveEvent(p => p ? { ...p, featured:!p.featured } : null);
    showToast(ev?.featured ? 'Event unfeatured' : 'Event featured on Community Hub', 'success');
  };

  const labelCls = 'admin-label';
  const pendingCount = events.filter(e => e.status === 'Pending').length;

  return (
    <div className="admin-page space-y-10 pb-20 relative min-h-screen">
      <Helmet><title>Community Events | GzoneSphere Admin</title></Helmet>

      <AdminPageHero kicker="Community" title="Events" description="Approve, feature, and manage community events across all branches." />

      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="space-y-6">
        {/* Sub-tabs */}
        <div className="flex items-center gap-3">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'pending', label: `Pending Approval (${pendingCount})` },
          ].map(t => (
            <button key={t.id} onClick={() => setEventsSubTab(t.id)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider italic border-2 transition-all ${
                eventsSubTab === t.id
                  ? 'bg-[var(--theme-text)] text-[var(--theme-bg)] border-transparent'
                  : 'border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:border-[var(--theme-primary)]/40'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Pending queue */}
        {eventsSubTab === 'pending' && (
          <div className="space-y-4">
            {events.filter(e => e.status === 'Pending').length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-[var(--theme-border)] p-16 text-center">
                <FiCheck size={40} className="mx-auto mb-4 text-emerald-500 opacity-30" />
                <p className="text-lg font-black italic uppercase tracking-tighter text-[var(--theme-text-muted)] opacity-40">No events awaiting approval</p>
              </div>
            ) : (
              events.filter(e => e.status === 'Pending').map(ev => (
                <div key={ev.id} className="bg-[var(--theme-card)]/80 backdrop-blur-xl border-2 border-amber-500/30 rounded-3xl p-8 flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="admin-status-badge" style={{ background: 'var(--status-warning-bg)', color: 'var(--status-warning-text)' }}>Pending</span>
                      <span className="text-xs text-[var(--theme-text-muted)] opacity-50 uppercase font-black">{ev.branch} · {ev.type?.replace('_',' ')}</span>
                    </div>
                    <p className="text-lg font-black italic uppercase tracking-tight text-[var(--theme-text)] truncate">{ev.title}</p>
                    <p className="text-xs text-[var(--theme-text-muted)] mt-1 opacity-50">Host: @{ev.host} · {fmtDate(ev.date)} · {ev.rsvpCount} RSVPs</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button onClick={() => approveEvent(ev.id)}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider italic hover:bg-emerald-500/30 transition-all">
                      <FiCheck size={13} strokeWidth={3} /> Approve
                    </button>
                    <button onClick={() => rejectEvent(ev.id)}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-black uppercase tracking-wider italic hover:bg-rose-500/30 transition-all">
                      <FiX size={13} strokeWidth={3} /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* All events table */}
        {eventsSubTab === 'all' && (
          <div className="bg-[var(--theme-card)]/80 backdrop-blur-3xl rounded-[4rem] border-2 border-[var(--theme-border)] overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-dashed border-[var(--theme-border)]/50">
                  {['Title','Type','Branch','Host','Date','RSVPs','Status','Featured'].map(h => (
                    <th key={h} className="px-6 py-8 text-xs font-black uppercase tracking-wider text-[var(--theme-text-muted)] opacity-35 italic whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-dashed divide-[var(--theme-border)]/30">
                {events.map(ev => (
                  <tr key={ev.id} onClick={() => { setActiveEvent(ev); setPanelNote(''); }}
                    className={`cursor-pointer transition-all hover:bg-[var(--theme-bg-alt)]/50 ${activeEvent?.id===ev.id ? 'bg-[var(--theme-primary)]/5' : ''}`}>
                    <td className="px-6 py-5 font-black italic text-[var(--theme-text)] max-w-[200px] truncate">{ev.title}</td>
                    <td className="px-6 py-5 text-xs text-[var(--theme-text-muted)] capitalize">{ev.type?.replace('_',' ')}</td>
                    <td className="px-6 py-5"><span className="text-xs px-2 py-0.5 rounded-lg bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] text-[var(--theme-text-muted)] font-black uppercase">{ev.branch}</span></td>
                    <td className="px-6 py-5 text-xs text-[var(--theme-primary)] italic font-black">@{ev.host}</td>
                    <td className="px-6 py-5 text-xs text-[var(--theme-text-muted)] whitespace-nowrap">{fmtDate(ev.date)}</td>
                    <td className="px-6 py-5 font-black tabular-nums text-[var(--theme-text)]">{ev.rsvpCount}</td>
                    <td className="px-6 py-5">
                      <span className="admin-status-badge" style={
                        ev.status === 'Approved'
                          ? { background: 'var(--status-success-bg)', color: 'var(--status-success-text)' }
                          : ev.status === 'Live'
                          ? { background: 'var(--theme-primary-soft)', color: 'var(--theme-primary)' }
                          : ev.status === 'Cancelled'
                          ? { background: 'var(--status-danger-bg)', color: 'var(--status-danger-text)' }
                          : { background: 'var(--status-warning-bg)', color: 'var(--status-warning-text)' }
                      }>{ev.status}</span>
                    </td>
                    <td className="px-6 py-5 text-center">{ev.featured && <FiStar size={14} className="text-amber-400 fill-amber-400 mx-auto"/>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* ── Slide panel ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeEvent && (
          <>
            <motion.div className="fixed inset-0 z-[79] bg-black/40 backdrop-blur-sm"
              initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              onClick={closePanel}/>
            <motion.div className="fixed right-0 top-0 bottom-0 z-[80] w-full max-w-md bg-[var(--theme-card)] border-l-2 border-[var(--theme-border)] shadow-2xl overflow-y-auto"
              initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}} transition={{type:'spring',damping:28,stiffness:280}}>
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-[var(--theme-primary)] italic opacity-60">EVENT_PROTOCOL</span>
                  <button onClick={closePanel} className="p-2 rounded-xl hover:bg-[var(--theme-bg-alt)] transition-colors"><FiX size={18}/></button>
                </div>

                <div className="space-y-5">
                  <div className="p-5 bg-[var(--theme-bg-alt)]/50 border-2 border-[var(--theme-border)] rounded-2xl space-y-2">
                    <div className="font-black italic uppercase text-[var(--theme-text)]">{activeEvent.title}</div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={`px-2 py-0.5 rounded-full border font-black uppercase ${(EV_STATUS_META[activeEvent.status]||EV_STATUS_META.Pending).bg} ${(EV_STATUS_META[activeEvent.status]||EV_STATUS_META.Pending).color}`}>{activeEvent.status}</span>
                      <span className="text-[var(--theme-text-muted)] opacity-60">{activeEvent.type.replace('_',' ')} · {activeEvent.branch}</span>
                      <span className="text-[var(--theme-text-muted)] opacity-60">@{activeEvent.host}</span>
                    </div>
                    <div className="text-xs text-[var(--theme-text-muted)] opacity-50 flex items-center gap-2">
                      <FiCalendar size={12}/> {fmtDate(activeEvent.date)} · {activeEvent.rsvpCount} RSVPs
                    </div>
                  </div>

                  <div className="space-y-2">
                    {activeEvent.status==='Pending' && (
                      <button onClick={()=>approveEvent(activeEvent.id)} className="admin-btn !justify-start">
                        <FiCheck size={14}/> Approve event
                      </button>
                    )}
                    {activeEvent.status==='Pending' && (
                      <button onClick={()=>setModal({type:'rejectEvent',item:activeEvent})} className="admin-btn admin-btn--danger !justify-start">
                        <FiX size={14}/> Reject event
                      </button>
                    )}
                    <button onClick={()=>toggleFeatureEvent(activeEvent.id)} className="admin-btn admin-btn--secondary !justify-start">
                      <FiStar size={14}/> {activeEvent.featured ? 'Unfeature' : 'Feature on Community Hub'}
                    </button>
                    <button onClick={()=>setModal({type:'editEvent',item:activeEvent})} className="admin-btn admin-btn--secondary !justify-start">
                      <FiEdit2 size={14}/> Edit event details
                    </button>
                    {activeEvent.status !== 'Cancelled' && (
                      <button onClick={()=>setModal({type:'cancelEvent',item:activeEvent})} className="admin-btn admin-btn--danger !justify-start">
                        <FiTrash2 size={14}/> Cancel event (notify RSVPs)
                      </button>
                    )}
                    <button onClick={()=>showToast('RSVP export initiated — CSV ready in 30s','info')} className="admin-btn admin-btn--secondary !justify-start">
                      <FiDownload size={14}/> Export RSVP list (.csv)
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Confirmation modals ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {modal && (
          <motion.div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <motion.div className="bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-3xl p-8 shadow-2xl w-full max-w-md space-y-6"
              initial={{scale:0.92,y:20}} animate={{scale:1,y:0}} exit={{scale:0.92,y:20}}>

              {modal.type==='rejectEvent' && (
                <>
                  <h3 className="text-xl font-black italic uppercase text-rose-400">Reject Event</h3>
                  <p className="text-sm text-[var(--theme-text-muted)]">Reject <strong className="text-[var(--theme-text)]">{modal.item.title}</strong> — host will be notified with your reason.</p>
                  <div><label className={labelCls}>Rejection reason</label><textarea rows={3} className="admin-input" placeholder="Reason..." value={panelNote} onChange={e=>setPanelNote(e.target.value)}/></div>
                  <div className="flex gap-3 justify-end">
                    <button onClick={()=>setModal(null)} className="admin-btn admin-btn--secondary">Cancel</button>
                    <button onClick={()=>rejectEvent(modal.item.id)} disabled={!panelNote.trim()} className="admin-btn admin-btn--danger">Reject</button>
                  </div>
                </>
              )}

              {modal.type==='cancelEvent' && (
                <>
                  <h3 className="text-xl font-black italic uppercase text-rose-500">Cancel Event</h3>
                  <p className="text-sm text-[var(--theme-text-muted)]">Cancel <strong className="text-[var(--theme-text)]">{modal.item.title}</strong>. All <strong>{modal.item.rsvpCount}</strong> RSVPs will be notified.</p>
                  <div><label className={labelCls}>Cancellation reason</label><textarea rows={3} className="admin-input" placeholder="Reason..." value={panelNote} onChange={e=>setPanelNote(e.target.value)}/></div>
                  <div className="flex gap-3 justify-end">
                    <button onClick={()=>setModal(null)} className="admin-btn admin-btn--secondary">Cancel</button>
                    <button onClick={()=>cancelEvent(modal.item.id)} disabled={!panelNote.trim()} className="admin-btn admin-btn--danger">Cancel event</button>
                  </div>
                </>
              )}

              {modal.type==='editEvent' && (
                <>
                  <h3 className="text-xl font-black italic uppercase text-indigo-400">Edit Event Details</h3>
                  <p className="text-sm text-[var(--theme-text-muted)]">Editing <strong className="text-[var(--theme-text)]">{modal.item.title}</strong>. Changes will display a "last updated" label to attendees.</p>
                  <div className="space-y-3">
                    <div><label className={labelCls}>Title</label><input className="admin-input" defaultValue={modal.item.title}/></div>
                    <div><label className={labelCls}>Host</label><input className="admin-input" defaultValue={modal.item.host}/></div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button onClick={()=>setModal(null)} className="admin-btn admin-btn--secondary">Cancel</button>
                    <button onClick={()=>{setModal(null);showToast('Event updated — "last updated" label applied','success');}} className="admin-btn">Save changes</button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
