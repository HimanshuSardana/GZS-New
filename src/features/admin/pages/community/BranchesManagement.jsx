import { useState } from 'react';
import {
  FiAlertCircle, FiCheck, FiEye, FiEyeOff, FiLayers, FiMapPin,
  FiPlus, FiSearch, FiTrash2, FiX, FiZap,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/shared/components/Toast';
import { Helmet } from 'react-helmet-async';
import { AdminPageHero } from '@/features/admin/components/AdminContentShell';

// ── Constants ─────────────────────────────────────────────────────────────────
const LEVELS = ['Beginner', 'Hustler', 'Extreme', 'Pro'];
const SLOWMODES = ['off', '5s', '15s', '30s', '1min', '5min', '1hr'];
const CHANNEL_TYPES = ['text', 'announcement', 'resource'];
const BRANCH_STATUSES = ['Active', 'Read-only', 'Archived'];
const MOD_STRICTNESS_OPTS = ['Lenient', 'Standard', 'Strict'];
const BRANCH_SLUGS = ['dev', 'esports', 'content', 'business', 'art', 'writing', 'audio'];

const BRANCH_COLORS = {
  dev:      'var(--domain-dev)',
  esports:  'var(--domain-esports)',
  content:  'var(--domain-content)',
  business: 'var(--domain-business)',
  art:      'var(--domain-art)',
  writing:  'var(--domain-writing)',
  audio:    'var(--domain-audio)',
};

const BRANCHES_INIT = [
  { slug: 'dev',      name: 'Game Development',      icon: '⚙️', members: 4821, status: 'Active',     showMemberCount: true,  autoEnroll: 'dev',      colorAccent: '#6366f1', minLevel: 'Beginner', modStrictness: 'Standard', description: 'The home branch for game developers building commercial and indie titles.' },
  { slug: 'esports',  name: 'Esports & Competitive',  icon: '🏆', members: 8342, status: 'Active',     showMemberCount: true,  autoEnroll: 'esports',  colorAccent: '#ef4444', minLevel: 'Beginner', modStrictness: 'Strict',   description: 'Competitive gaming, team recruitment, and tournament organisation.' },
  { slug: 'content',  name: 'Content & Media',        icon: '🎬', members: 3100, status: 'Active',     showMemberCount: true,  autoEnroll: 'content',  colorAccent: '#f59e0b', minLevel: 'Beginner', modStrictness: 'Standard', description: 'Content creators, streamers, and media professionals.' },
  { slug: 'business', name: 'Business & Strategy',    icon: '📊', members: 1890, status: 'Active',     showMemberCount: false, autoEnroll: 'business', colorAccent: '#10b981', minLevel: 'Hustler',  modStrictness: 'Lenient',  description: 'Business strategy, publishing, and investor relations.' },
  { slug: 'art',      name: 'Art & Design',           icon: '🎨', members: 2740, status: 'Active',     showMemberCount: true,  autoEnroll: 'art',      colorAccent: '#8b5cf6', minLevel: 'Beginner', modStrictness: 'Standard', description: 'Concept artists, 3D artists, and visual designers.' },
  { slug: 'writing',  name: 'Writing & Narrative',    icon: '✍️',  members: 1420, status: 'Read-only', showMemberCount: true,  autoEnroll: 'writing',  colorAccent: '#06b6d4', minLevel: 'Beginner', modStrictness: 'Standard', description: 'Narrative designers, writers, and storytellers.' },
  { slug: 'audio',    name: 'Music & Audio',          icon: '🎵', members:  980, status: 'Active',     showMemberCount: true,  autoEnroll: 'audio',    colorAccent: '#f97316', minLevel: 'Beginner', modStrictness: 'Standard', description: 'Audio engineers, composers, and sound designers.' },
];

const CHANNELS_INIT = [
  { id:'c1',  branch:'dev',      name:'general',       type:'text',         slowmode:'off',  minLevel:'Beginner', isArchived:false, isAnnouncement:false },
  { id:'c2',  branch:'dev',      name:'showcase',      type:'resource',     slowmode:'5s',   minLevel:'Beginner', isArchived:false, isAnnouncement:false },
  { id:'c3',  branch:'dev',      name:'help',          type:'text',         slowmode:'off',  minLevel:'Beginner', isArchived:false, isAnnouncement:false },
  { id:'c4',  branch:'dev',      name:'lfg',           type:'text',         slowmode:'15s',  minLevel:'Beginner', isArchived:false, isAnnouncement:false },
  { id:'c5',  branch:'dev',      name:'announcements', type:'announcement', slowmode:'off',  minLevel:'Hustler',  isArchived:false, isAnnouncement:true  },
  { id:'c6',  branch:'esports',  name:'general',       type:'text',         slowmode:'off',  minLevel:'Beginner', isArchived:false, isAnnouncement:false },
  { id:'c7',  branch:'esports',  name:'recruitment',   type:'text',         slowmode:'30s',  minLevel:'Beginner', isArchived:false, isAnnouncement:false },
  { id:'c8',  branch:'esports',  name:'vods',          type:'resource',     slowmode:'off',  minLevel:'Beginner', isArchived:false, isAnnouncement:false },
  { id:'c9',  branch:'esports',  name:'tournaments',   type:'announcement', slowmode:'off',  minLevel:'Hustler',  isArchived:false, isAnnouncement:true  },
  { id:'c10', branch:'esports',  name:'announcements', type:'announcement', slowmode:'off',  minLevel:'Pro',      isArchived:false, isAnnouncement:true  },
  { id:'c11', branch:'content',  name:'general',       type:'text',         slowmode:'off',  minLevel:'Beginner', isArchived:false, isAnnouncement:false },
  { id:'c12', branch:'content',  name:'collab',        type:'text',         slowmode:'5s',   minLevel:'Beginner', isArchived:false, isAnnouncement:false },
  { id:'c13', branch:'content',  name:'feedback',      type:'text',         slowmode:'15s',  minLevel:'Beginner', isArchived:false, isAnnouncement:false },
  { id:'c14', branch:'content',  name:'events',        type:'announcement', slowmode:'off',  minLevel:'Beginner', isArchived:false, isAnnouncement:true  },
  { id:'c15', branch:'art',      name:'general',       type:'text',         slowmode:'off',  minLevel:'Beginner', isArchived:false, isAnnouncement:false },
  { id:'c16', branch:'art',      name:'showcase',      type:'resource',     slowmode:'off',  minLevel:'Beginner', isArchived:false, isAnnouncement:false },
  { id:'c17', branch:'art',      name:'critique',      type:'text',         slowmode:'30s',  minLevel:'Beginner', isArchived:false, isAnnouncement:false },
  { id:'c18', branch:'art',      name:'tutorials',     type:'resource',     slowmode:'off',  minLevel:'Beginner', isArchived:false, isAnnouncement:false },
  { id:'c19', branch:'business', name:'general',       type:'text',         slowmode:'off',  minLevel:'Beginner', isArchived:false, isAnnouncement:false },
  { id:'c20', branch:'business', name:'jobs',          type:'text',         slowmode:'1min', minLevel:'Hustler',  isArchived:false, isAnnouncement:false },
  { id:'c21', branch:'business', name:'pitches',       type:'text',         slowmode:'5min', minLevel:'Hustler',  isArchived:false, isAnnouncement:false },
  { id:'c22', branch:'business', name:'networking',    type:'text',         slowmode:'30s',  minLevel:'Beginner', isArchived:false, isAnnouncement:false },
  { id:'c23', branch:'writing',  name:'general',       type:'text',         slowmode:'off',  minLevel:'Beginner', isArchived:false, isAnnouncement:false },
  { id:'c24', branch:'writing',  name:'workshop',      type:'text',         slowmode:'30s',  minLevel:'Beginner', isArchived:false, isAnnouncement:false },
  { id:'c25', branch:'writing',  name:'showcase',      type:'resource',     slowmode:'off',  minLevel:'Beginner', isArchived:false, isAnnouncement:false },
  { id:'c26', branch:'writing',  name:'resources',     type:'resource',     slowmode:'off',  minLevel:'Beginner', isArchived:false, isAnnouncement:false },
  { id:'c27', branch:'audio',    name:'general',       type:'text',         slowmode:'off',  minLevel:'Beginner', isArchived:false, isAnnouncement:false },
  { id:'c28', branch:'audio',    name:'showcase',      type:'resource',     slowmode:'off',  minLevel:'Beginner', isArchived:false, isAnnouncement:false },
  { id:'c29', branch:'audio',    name:'collab',        type:'text',         slowmode:'15s',  minLevel:'Beginner', isArchived:false, isAnnouncement:false },
  { id:'c30', branch:'audio',    name:'resources',     type:'resource',     slowmode:'off',  minLevel:'Beginner', isArchived:false, isAnnouncement:false },
];

const INIT_PINNED = {
  c1: [
    { id:'pin-c1-1', text:'Welcome to the Dev general channel! Please read the rules before posting.', author:'sync_master', date:'2026-04-20' },
    { id:'pin-c1-2', text:'Weekly game jam submissions due every Friday at midnight.', author:'viper_dev', date:'2026-04-26' },
  ],
  c6: [
    { id:'pin-c6-1', text:'GzoneSphere Esports Code of Conduct — zero toxicity policy.', author:'rapid_fire', date:'2026-04-18' },
  ],
  c16: [
    { id:'pin-c16-1', text:'Art showcase rules: original work only, please tag your tools.', author:'artisan_flux', date:'2026-04-22' },
  ],
};

const TABS = ['Branches', 'Channels'];

export default function BranchesManagement() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState(0);

  // Branches state
  const [branches, setBranches] = useState(BRANCHES_INIT);
  const [selBranch, setSelBranch] = useState('dev');
  const [branchDraft, setBranchDraft] = useState({});

  // Channels state
  const [channels, setChannels] = useState(CHANNELS_INIT);
  const [chBranch, setChBranch] = useState('dev');
  const [newCh, setNewCh] = useState({ name:'', description:'', type:'text', slowmode:'off', minLevel:'Beginner' });
  const [expandedChannel, setExpandedChannel] = useState(null);
  const [pinnedMessages, setPinnedMessages] = useState(INIT_PINNED);
  const [pinInput, setPinInput] = useState('');

  const inputCls = 'admin-input';
  const selectCls = 'admin-select';
  const labelCls = 'admin-label';

  // ── Branch handlers ─────────────────────────────────────────────────────────
  const selBranchObj = branches.find(b => b.slug === selBranch) || {};
  const draft = { ...selBranchObj, ...branchDraft };
  const updDraft = (k, v) => setBranchDraft(p => ({ ...p, [k]: v }));
  const saveBranch = () => {
    setBranches(p => p.map(b => b.slug === selBranch ? { ...b, ...branchDraft } : b));
    setBranchDraft({});
    showToast('Branch settings saved', 'success');
  };
  const switchSelBranch = (slug) => { setSelBranch(slug); setBranchDraft({}); };

  // ── Channel handlers ────────────────────────────────────────────────────────
  const branchChannels = channels.filter(c => c.branch === chBranch);
  const addChannel = () => {
    if (!newCh.name.trim()) return;
    const slug = newCh.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    setChannels(p => [...p, { id:`c${Date.now()}`, branch:chBranch, ...newCh, name:slug, isArchived:false, isAnnouncement:newCh.type==='announcement' }]);
    setNewCh({ name:'', description:'', type:'text', slowmode:'off', minLevel:'Beginner' });
    showToast('Channel created', 'success');
  };
  const archiveChannel = (id) => {
    setChannels(p => p.map(c => c.id===id ? { ...c, isArchived:!c.isArchived } : c));
    showToast('Channel archive status toggled', 'info');
  };
  const deleteChannel = (id) => {
    setChannels(p => p.filter(c => c.id !== id));
    showToast('Channel deleted', 'success');
  };
  const setSlowmode = (id, slowmode) => {
    setChannels(p => p.map(c => c.id===id ? { ...c, slowmode } : c));
    showToast('Slowmode updated', 'success');
  };
  const toggleAnnouncement = (id) => {
    setChannels(p => p.map(c => c.id===id ? { ...c, isAnnouncement:!c.isAnnouncement } : c));
    showToast('Channel type updated', 'success');
  };

  // ── Pin handlers ────────────────────────────────────────────────────────────
  const pinMessage = (channelId) => {
    if (!pinInput.trim()) return;
    const existing = pinnedMessages[channelId] || [];
    if (existing.length >= 5) { showToast('Maximum 5 pinned messages per channel.', 'error'); return; }
    const newPin = {
      id: `pin-${Date.now()}`,
      text: `Message #${pinInput.trim()} — pinned by admin.`,
      author: 'admin',
      date: new Date().toISOString().split('T')[0],
    };
    setPinnedMessages(p => ({ ...p, [channelId]: [...(p[channelId] || []), newPin] }));
    setPinInput('');
    showToast('Message pinned', 'success');
  };
  const unpinMessage = (channelId, pinId) => {
    setPinnedMessages(p => ({ ...p, [channelId]: (p[channelId] || []).filter(m => m.id !== pinId) }));
    showToast('Message unpinned', 'success');
  };

  return (
    <div className="admin-page space-y-10 pb-20 relative min-h-screen">
      <Helmet><title>Branches & Channels | GzoneSphere Admin</title></Helmet>

      <AdminPageHero kicker="Community" title="Branches & Channels" description="Configure branch settings, member access levels, and channel structure." />

      {/* Tab bar */}
      <div className="flex gap-2 border-b-2 border-[var(--theme-border)] pb-0">
        {TABS.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)}
            className="px-8 py-4 text-xs font-black uppercase tracking-wider italic transition-all"
            style={activeTab === i
              ? { borderBottom: '2px solid var(--theme-primary)', color: 'var(--theme-text)' }
              : { color: 'var(--theme-text-muted)' }
            }>
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ═══ BRANCHES ══════════════════════════════════════════════════════ */}
        {activeTab === 0 && (
          <motion.div key="branches" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="admin-panel admin-panel--padded space-y-3">
              <p className="admin-panel-title">BRANCH_NODES</p>
              {branches.map(b => (
                <button key={b.slug} onClick={() => switchSelBranch(b.slug)}
                  className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-tight italic text-left transition-all border-2"
                  style={selBranch === b.slug
                    ? { background: 'var(--theme-bg-alt)', borderColor: 'var(--theme-primary)' }
                    : { background: 'var(--theme-card)', borderColor: 'var(--theme-border)' }
                  }>
                  <span className="w-3 h-3 rounded-full" style={{ background: BRANCH_COLORS[b.slug] }} />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-[var(--theme-text)]">{b.name}</div>
                    <div className="text-xs text-[var(--theme-text-muted)] font-normal normal-case tracking-normal">{b.members.toLocaleString()} members</div>
                  </div>
                  <span className="admin-status-badge" style={
                    b.status === 'Active'
                      ? { background: 'var(--status-success-bg)', color: 'var(--status-success-text)' }
                      : b.status === 'Read-only'
                      ? { background: 'var(--status-draft-bg)', color: 'var(--status-draft-text)' }
                      : { background: 'var(--status-danger-bg)', color: 'var(--status-danger-text)' }
                  }>{b.status}</span>
                </button>
              ))}
            </div>

            <div className="lg:col-span-2 bg-[var(--theme-card)]/80 backdrop-blur-3xl rounded-[4rem] border-2 border-[var(--theme-border)] p-12 shadow-2xl space-y-8">
              <div className="flex items-center gap-6 pb-6 border-b-2 border-dashed border-[var(--theme-border)]/40">
                <span className="text-5xl">{selBranchObj.icon}</span>
                <div>
                  <h3 className="text-3xl font-black italic uppercase tracking-tighter text-[var(--theme-text)]">{selBranchObj.name} <span className="text-[var(--theme-primary)]">SETTINGS</span></h3>
                  <p className="text-xs opacity-40 font-black uppercase tracking-widest italic">/community/{selBranch}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className={labelCls}>Branch name</label><input className={inputCls} value={draft.name||''} onChange={e=>updDraft('name',e.target.value)} /></div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select className={selectCls} value={draft.status||'Active'} onChange={e=>updDraft('status',e.target.value)}>
                    {BRANCH_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div><label className={labelCls}>Description</label><textarea className={inputCls} rows={2} value={draft.description||''} onChange={e=>updDraft('description',e.target.value)} /></div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Auto-enrollment (sub-profile type)</label>
                  <select className={selectCls} value={draft.autoEnroll||'disabled'} onChange={e=>updDraft('autoEnroll',e.target.value)}>
                    <option value="disabled">Disabled</option>
                    {BRANCH_SLUGS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Member count visibility</label>
                  <button onClick={() => updDraft('showMemberCount', !draft.showMemberCount)}
                    className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 text-sm font-black uppercase tracking-wider italic transition-all ${draft.showMemberCount ? 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10' : 'border-[var(--theme-border)] text-[var(--theme-text-muted)] opacity-60'}`}>
                    {draft.showMemberCount ? <FiEye size={16}/> : <FiEyeOff size={16}/>}
                    {draft.showMemberCount ? 'Shown publicly' : 'Hidden'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelCls}>Branch colour accent</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={draft.colorAccent||'#6366f1'} onChange={e=>updDraft('colorAccent',e.target.value)}
                      className="w-12 h-10 rounded-lg cursor-pointer border-2 border-[var(--theme-border)] bg-transparent" />
                    <code className="text-xs font-mono text-[var(--theme-text-muted)] opacity-60">{draft.colorAccent||'#6366f1'}</code>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Min level to post</label>
                  <select className={selectCls} value={draft.minLevel||'Beginner'} onChange={e=>updDraft('minLevel',e.target.value)}>
                    {LEVELS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Moderation strictness</label>
                  <select className={selectCls} value={draft.modStrictness||'Standard'} onChange={e=>updDraft('modStrictness',e.target.value)}>
                    {MOD_STRICTNESS_OPTS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t-2 border-dashed border-[var(--theme-border)]/40">
                <button onClick={saveBranch} disabled={Object.keys(branchDraft).length === 0} className="admin-btn !px-10">
                  <FiCheck className="inline mr-2" size={14} />COMMIT_CHANGES
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ CHANNELS ═══════════════════════════════════════════════════════ */}
        {activeTab === 1 && (
          <motion.div key="channels" initial={{opacity:0,scale:0.98}} animate={{opacity:1,scale:1}} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="admin-panel admin-panel--padded space-y-3">
              <p className="admin-panel-title">DOMAIN_SELECTOR</p>
              <select className="admin-select" value={chBranch} onChange={e => setChBranch(e.target.value)}>
                {branches.map(b => <option key={b.slug} value={b.slug}>{b.name}</option>)}
              </select>
            </div>

            <div className="lg:col-span-2 bg-[var(--theme-card)]/80 backdrop-blur-3xl rounded-[4rem] border-2 border-[var(--theme-border)] p-12 shadow-2xl space-y-8 relative overflow-hidden">
              <h3 className="text-3xl font-black italic uppercase tracking-tighter text-[var(--theme-text)] relative z-10">
                {branches.find(b=>b.slug===chBranch)?.name} <span className="text-[var(--theme-primary)]">CHANNELS</span>
              </h3>

              <div className="space-y-2 relative z-10">
                {branchChannels.map(ch => {
                  const chPins = pinnedMessages[ch.id] || [];
                  const isOpen = expandedChannel === ch.id;
                  const atCap  = chPins.length >= 5;
                  return (
                    <div key={ch.id}>
                      <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl border-2 transition-all group/ch ${ch.isArchived ? 'opacity-40 border-[var(--theme-border)]/30 bg-[var(--theme-bg-alt)]/20' : isOpen ? 'border-[var(--theme-primary)]/50 bg-[var(--theme-bg-alt)]/60' : 'border-[var(--theme-border)] bg-[var(--theme-bg-alt)]/50 hover:border-[var(--theme-primary)]/30'}`}>
                        <span className="text-[var(--theme-primary)] font-black text-lg opacity-50 group-hover/ch:opacity-100">#</span>
                        <span className="text-sm font-black italic uppercase tracking-widest text-[var(--theme-text)] flex-1">{ch.name}</span>
                        {chPins.length > 0 && (
                          <span className="text-[10px] font-black text-amber-500 flex items-center gap-1">
                            <FiMapPin size={10}/> {chPins.length}/5
                          </span>
                        )}
                        {ch.isArchived && <span className="admin-status-badge" style={{ background: 'var(--status-danger-bg)', color: 'var(--status-danger-text)' }}>ARCHIVED</span>}
                        {ch.isAnnouncement && <span className="admin-status-badge" style={{ background: 'var(--status-review-bg)', color: 'var(--status-review-text)' }}>ANNOUNCEMENT</span>}
                        <select value={ch.slowmode} onChange={e=>setSlowmode(ch.id,e.target.value)} className="admin-select !w-auto !py-1 !text-xs">
                          {SLOWMODES.map(s => <option key={s} value={s}>{s==='off'?'No slowmode':s}</option>)}
                        </select>
                        <span className="text-xs text-[var(--theme-text-muted)] opacity-40">{ch.minLevel}</span>
                        <div className="flex gap-1 opacity-0 group-hover/ch:opacity-100 transition-opacity">
                          <button onClick={() => setExpandedChannel(isOpen ? null : ch.id)} title="Pinned messages"
                            className={`admin-btn admin-btn--secondary !p-2 ${isOpen ? '!border-[var(--theme-primary)] text-[var(--theme-primary)]' : ''}`}>
                            <FiMapPin size={13}/>
                          </button>
                          <button onClick={() => toggleAnnouncement(ch.id)} title={ch.isAnnouncement?'Unset announcement':'Set announcement'}
                            className="admin-btn admin-btn--secondary !p-2">
                            <FiZap size={13}/>
                          </button>
                          <button onClick={() => archiveChannel(ch.id)} title={ch.isArchived?'Unarchive':'Archive'}
                            className="admin-btn admin-btn--secondary !p-2">
                            <FiLayers size={13}/>
                          </button>
                          <button onClick={() => deleteChannel(ch.id)} title="Delete"
                            className="admin-btn admin-btn--danger !p-2">
                            <FiTrash2 size={13}/>
                          </button>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="mx-2 mt-1 mb-2 p-6 rounded-2xl border-2 border-[var(--theme-primary)]/20 bg-[var(--theme-bg-alt)]/30 space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-primary)] opacity-70 flex items-center gap-2">
                            <FiMapPin size={11}/> Pinned Messages ({chPins.length}/5)
                          </p>
                          {chPins.length === 0 ? (
                            <p className="text-xs text-[var(--theme-text-muted)] opacity-40 italic">No pinned messages in #{ch.name}</p>
                          ) : (
                            <div className="space-y-2">
                              {chPins.map(pin => (
                                <div key={pin.id} className="flex items-start gap-3 p-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)]/60">
                                  <FiMapPin size={12} className="text-amber-500 shrink-0 mt-0.5"/>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-[var(--theme-text)] leading-relaxed">{pin.text}</p>
                                    <p className="text-[10px] text-[var(--theme-text-muted)] opacity-50 mt-1">@{pin.author} · {pin.date}</p>
                                  </div>
                                  <button onClick={() => unpinMessage(ch.id, pin.id)}
                                    className="admin-btn admin-btn--danger !p-1.5 !text-[10px] shrink-0">
                                    <FiX size={11}/>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          {atCap ? (
                            <p className="text-[10px] font-black text-amber-500 flex items-center gap-1.5">
                              <FiAlertCircle size={11}/> Max 5 pinned messages reached — unpin one to add more.
                            </p>
                          ) : (
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <FiSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] opacity-50"/>
                                <input
                                  className="admin-input !pl-8 !py-2 !text-xs"
                                  placeholder="Paste message ID or search term to pin…"
                                  value={pinInput}
                                  onChange={e => setPinInput(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && pinMessage(ch.id)}
                                />
                              </div>
                              <button onClick={() => pinMessage(ch.id)} disabled={!pinInput.trim()}
                                className="admin-btn !px-4 !py-2 text-xs disabled:opacity-30">
                                <FiMapPin size={13}/> Pin
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="relative z-10 border-t-2 border-dashed border-[var(--theme-border)]/40 pt-8 space-y-4">
                <p className={labelCls}>CREATE_NEW_CHANNEL</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className={labelCls}>Name (#prefix auto)</label>
                    <input className={inputCls} placeholder="channel-name" value={newCh.name} onChange={e=>setNewCh(p=>({...p,name:e.target.value}))} />
                  </div>
                  <div>
                    <label className={labelCls}>Type</label>
                    <select className={selectCls} value={newCh.type} onChange={e=>setNewCh(p=>({...p,type:e.target.value}))}>
                      {CHANNEL_TYPES.map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Slowmode</label>
                    <select className={selectCls} value={newCh.slowmode} onChange={e=>setNewCh(p=>({...p,slowmode:e.target.value}))}>
                      {SLOWMODES.map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Min level to post</label>
                    <select className={selectCls} value={newCh.minLevel} onChange={e=>setNewCh(p=>({...p,minLevel:e.target.value}))}>
                      {LEVELS.map(l=><option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Description</label>
                    <input className={inputCls} placeholder="Short description..." value={newCh.description} onChange={e=>setNewCh(p=>({...p,description:e.target.value}))} />
                  </div>
                </div>
                <button onClick={addChannel} disabled={!newCh.name.trim()} className="admin-btn">
                  <FiPlus size={14} strokeWidth={3}/> ADD_CHANNEL
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
