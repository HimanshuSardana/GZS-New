import { useState } from 'react';
import {
  FiEye, FiEyeOff, FiSettings, FiStar, FiTrash2, FiX,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/shared/components/Toast';
import { Helmet } from 'react-helmet-async';
import { AdminPageHero } from '@/features/admin/components/AdminContentShell';
import { MOCK_GROUPS_EXTENDED } from '@/shared/data/communityData';

const fmtDate = (iso) =>
  new Intl.DateTimeFormat('en-IN', { day:'numeric', month:'short', year:'numeric' }).format(new Date(iso));

const _activityScores = [84,120,201,66,45,19,87,33,55,12,78,41,29,93,56,38];
const _weekPosts      = [14, 22, 38, 9, 6, 2,15, 5, 8, 1,11, 7, 4,17, 9, 6];
const _owners         = ['sync_master','khali_gaming','rapid_fire','artisan_flux','nova_stream','strategy_mind','lore_smith','quest_quill','echo_beat','tone_architect','community_pulse','welcome_guide','rapid_fire','artisan_flux','rapid_fire','mesh_verse'];
const GROUPS_ADMIN = MOCK_GROUPS_EXTENDED.map((g, i) => ({
  ...g,
  activityScore: _activityScores[i] ?? 10,
  weekPosts: _weekPosts[i] ?? 1,
  featured: i === 0 || i === 2,
  ownerUsername: _owners[i] ?? 'admin',
}));

export default function CommunityGroups() {
  const { showToast } = useToast();

  const [groups, setGroups] = useState(GROUPS_ADMIN);
  const [activeGroup, setActiveGroup] = useState(null);
  const [panelNote, setPanelNote] = useState('');
  const [modal, setModal] = useState(null);

  const closePanel = () => { setActiveGroup(null); setPanelNote(''); };

  const dissolveGroup = (id) => {
    setGroups(p => p.filter(g => g.id !== id));
    setActiveGroup(null); setModal(null); setPanelNote('');
    showToast('Group dissolved — owner notified, content archived 30 days', 'success');
  };
  const toggleFeatureGroup = (id) => {
    setGroups(p => p.map(g => g.id===id ? { ...g, featured:!g.featured } : g));
    const grp = groups.find(g => g.id===id);
    setActiveGroup(p => p ? { ...p, featured:!p.featured } : null);
    showToast(grp?.featured ? 'Group unfeatured' : 'Group featured — Recommended badge applied', 'success');
  };
  const toggleGroupVisibility = (id) => {
    setGroups(p => p.map(g => g.id===id ? { ...g, visibility:g.visibility==='public'?'private':'public' } : g));
    setActiveGroup(p => p ? { ...p, visibility:p.visibility==='public'?'private':'public' } : null);
    setModal(null); setPanelNote('');
    showToast('Visibility overridden — reason sent to owner', 'success');
  };
  const overrideGroupMod = () => {
    setModal(null); setPanelNote('');
    showToast('Group moderator replaced — notification sent', 'success');
  };

  const labelCls = 'admin-label';

  return (
    <div className="admin-page space-y-10 pb-20 relative min-h-screen">
      <Helmet><title>Community Groups | GzoneSphere Admin</title></Helmet>

      <AdminPageHero kicker="Community" title="Groups" description="Manage user-created groups, visibility overrides, and moderator assignments." />

      <motion.div initial={{opacity:0,scale:0.98}} animate={{opacity:1,scale:1}}>
        <div className="bg-[var(--theme-card)]/80 backdrop-blur-3xl rounded-[4rem] border-2 border-[var(--theme-border)] overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-dashed border-[var(--theme-border)]/50">
                {['Group name','Branch','Members','Activity (wk)','Created','Owner','Visibility'].map(h => (
                  <th key={h} className="px-6 py-8 text-xs font-black uppercase tracking-wider text-[var(--theme-text-muted)] opacity-35 italic whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-dashed divide-[var(--theme-border)]/30">
              {groups.map(g => (
                <tr key={g.id} onClick={() => { setActiveGroup(g); setPanelNote(''); }}
                  className={`cursor-pointer transition-all hover:bg-[var(--theme-bg-alt)]/50 ${activeGroup?.id===g.id ? 'bg-[var(--theme-primary)]/5' : ''}`}>
                  <td className="px-6 py-5">
                    <div className="font-black italic uppercase text-[var(--theme-text)] flex items-center gap-2">
                      {g.name}
                      {g.featured && <FiStar size={12} className="text-amber-400 fill-amber-400"/>}
                    </div>
                  </td>
                  <td className="px-6 py-5"><span className="text-xs px-2 py-0.5 rounded-lg bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] text-[var(--theme-text-muted)] font-black uppercase">{g.branch_slug}</span></td>
                  <td className="px-6 py-5">
                    <span className="admin-status-badge" style={{ background: 'var(--theme-primary-soft)', color: 'var(--theme-primary)' }}>{g.member_count}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`font-black tabular-nums ${g.activityScore > 100 ? 'text-emerald-500' : g.activityScore > 50 ? 'text-amber-500' : 'text-slate-400'}`}>{g.weekPosts} posts</span>
                  </td>
                  <td className="px-6 py-5 text-xs text-[var(--theme-text-muted)] opacity-60">{fmtDate(g.created_at)}</td>
                  <td className="px-6 py-5 text-xs text-[var(--theme-primary)] italic font-black">@{g.ownerUsername}</td>
                  <td className="px-6 py-5">
                    <span className="admin-status-badge" style={
                      g.visibility === 'public'
                        ? { background: 'var(--status-success-bg)', color: 'var(--status-success-text)' }
                        : { background: 'var(--status-warning-bg)', color: 'var(--status-warning-text)' }
                    }>{g.visibility}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Slide panel ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeGroup && (
          <>
            <motion.div className="fixed inset-0 z-[79] bg-black/40 backdrop-blur-sm"
              initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              onClick={closePanel}/>
            <motion.div className="fixed right-0 top-0 bottom-0 z-[80] w-full max-w-md bg-[var(--theme-card)] border-l-2 border-[var(--theme-border)] shadow-2xl overflow-y-auto"
              initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}} transition={{type:'spring',damping:28,stiffness:280}}>
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-[var(--theme-primary)] italic opacity-60">GROUP_PROTOCOL</span>
                  <button onClick={closePanel} className="p-2 rounded-xl hover:bg-[var(--theme-bg-alt)] transition-colors"><FiX size={18}/></button>
                </div>

                <div className="space-y-5">
                  <div className="p-5 bg-[var(--theme-bg-alt)]/50 border-2 border-[var(--theme-border)] rounded-2xl space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-black italic uppercase text-[var(--theme-text)]">{activeGroup.name}</span>
                      {activeGroup.featured && <FiStar size={13} className="text-amber-400 fill-amber-400"/>}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-lg bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] text-[var(--theme-text-muted)] font-black uppercase">{activeGroup.branch_slug}</span>
                      <span>{activeGroup.member_count} members</span>
                      <span className="opacity-40">@{activeGroup.ownerUsername}</span>
                    </div>
                    <p className="text-xs text-[var(--theme-text-muted)] opacity-60 line-clamp-2">{activeGroup.description}</p>
                  </div>

                  <div className="space-y-2">
                    <button onClick={()=>toggleFeatureGroup(activeGroup.id)} className="admin-btn admin-btn--secondary !justify-start">
                      <FiStar size={14}/> {activeGroup.featured ? 'Unfeature group' : 'Feature group (Recommended badge)'}
                    </button>
                    <button onClick={()=>setModal({type:'visOverride',item:activeGroup})} className="admin-btn admin-btn--secondary !justify-start">
                      {activeGroup.visibility==='public' ? <FiEyeOff size={14}/> : <FiEye size={14}/>}
                      Override visibility to {activeGroup.visibility==='public'?'private':'public'}
                    </button>
                    <button onClick={()=>setModal({type:'overrideMod',item:activeGroup})} className="admin-btn admin-btn--secondary !justify-start">
                      <FiSettings size={14}/> Override group moderator
                    </button>
                    <a href={`/community/${activeGroup.branch_slug}/groups/${activeGroup.id}`} target="_blank" rel="noreferrer"
                      className="admin-btn admin-btn--secondary !justify-start">
                      <FiEye size={14}/> View group page
                    </a>
                    <button onClick={()=>setModal({type:'dissolve',item:activeGroup})} className="admin-btn admin-btn--danger !justify-start">
                      <FiTrash2 size={14}/> Dissolve group
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

              {modal.type==='dissolve' && (
                <>
                  <h3 className="text-xl font-black italic uppercase text-rose-500">Dissolve Group</h3>
                  <p className="text-sm text-[var(--theme-text-muted)]">
                    Dissolving <strong className="text-[var(--theme-text)]">{modal.item.name}</strong> will notify the owner, archive all content for 30 days, and remove the group from all listings.
                  </p>
                  <div><label className={labelCls}>Reason (sent to owner)</label><textarea rows={3} className="admin-input" placeholder="Reason..." value={panelNote} onChange={e=>setPanelNote(e.target.value)}/></div>
                  <div className="flex gap-3 justify-end">
                    <button onClick={()=>setModal(null)} className="admin-btn admin-btn--secondary">Cancel</button>
                    <button onClick={()=>dissolveGroup(modal.item.id)} disabled={!panelNote.trim()} className="admin-btn admin-btn--danger">Dissolve</button>
                  </div>
                </>
              )}

              {modal.type==='visOverride' && (
                <>
                  <h3 className="text-xl font-black italic uppercase text-indigo-400">Override Visibility</h3>
                  <p className="text-sm text-[var(--theme-text-muted)]">
                    Override <strong className="text-[var(--theme-text)]">{modal.item.name}</strong> from <strong>{modal.item.visibility}</strong> to <strong>{modal.item.visibility==='public'?'private':'public'}</strong>. Owner will be notified.
                  </p>
                  <div><label className={labelCls}>Reason (shown to owner)</label><textarea rows={2} className="admin-input" placeholder="Reason..." value={panelNote} onChange={e=>setPanelNote(e.target.value)}/></div>
                  <div className="flex gap-3 justify-end">
                    <button onClick={()=>setModal(null)} className="admin-btn admin-btn--secondary">Cancel</button>
                    <button onClick={()=>toggleGroupVisibility(modal.item.id)} disabled={!panelNote.trim()} className="admin-btn">Override</button>
                  </div>
                </>
              )}

              {modal.type==='overrideMod' && (
                <>
                  <h3 className="text-xl font-black italic uppercase text-purple-400">Override Moderator</h3>
                  <p className="text-sm text-[var(--theme-text-muted)]">Replace or remove the current moderator of <strong className="text-[var(--theme-text)]">{modal.item.name}</strong>.</p>
                  <div><label className={labelCls}>Reason</label><textarea rows={2} className="admin-input" placeholder="Reason..." value={panelNote} onChange={e=>setPanelNote(e.target.value)}/></div>
                  <div className="flex gap-3 justify-end">
                    <button onClick={()=>setModal(null)} className="admin-btn admin-btn--secondary">Cancel</button>
                    <button onClick={()=>overrideGroupMod(modal.item.id)} disabled={!panelNote.trim()} className="admin-btn">Override</button>
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
