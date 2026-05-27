import React, { useState } from 'react';
import { FiList, FiColumns, FiFilter, FiChevronDown, FiEdit3 } from 'react-icons/fi';
import { MOCK_TALENT_POOL, TALENT_PIPELINE_STAGES } from '../pages/companyMockData';

// ── Stage colours ────────────────────────────────────────────────────────────
const STAGE_COLORS = {
  'Saved':      { bg: '#7C3AED18', border: '#7C3AED40', text: '#7C3AED' },
  'Contacted':  { bg: '#06B6D418', border: '#06B6D440', text: '#06B6D4' },
  'In Review':  { bg: '#F59E0B18', border: '#F59E0B40', text: '#F59E0B' },
  'Interview':  { bg: '#8B5CF618', border: '#8B5CF640', text: '#8B5CF6' },
  'Offer Sent': { bg: '#EC489918', border: '#EC489940', text: '#EC4899' },
  'Hired':      { bg: '#10B98118', border: '#10B98140', text: '#10B981' },
  'Rejected':   { bg: '#6B728018', border: '#6B728040', text: '#6B7280' },
};

const StageBadge = ({ stage }) => {
  const c = STAGE_COLORS[stage] || STAGE_COLORS['Saved'];
  return (
    <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wide border"
      style={{ backgroundColor: c.bg, borderColor: c.border, color: c.text }}>
      {stage}
    </span>
  );
};

// ── Note editor ──────────────────────────────────────────────────────────────
const NoteCell = ({ note, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(note || '');
  return editing ? (
    <div className="flex gap-2 items-start">
      <textarea value={val} onChange={e => setVal(e.target.value)} rows={2}
        className="flex-1 bg-[var(--theme-bg-alt)] border border-[var(--theme-primary)]/40 rounded-lg p-2 text-xs text-[var(--theme-text)] resize-none focus:outline-none" />
      <button onClick={() => { onSave(val); setEditing(false); }}
        className="text-xs font-black text-[var(--theme-primary)] px-2 py-1 rounded-lg border border-[var(--theme-primary)]/30 hover:bg-[var(--theme-primary)]/10">
        Save
      </button>
    </div>
  ) : (
    <div className="flex items-start gap-1.5 group cursor-pointer" onClick={() => setEditing(true)}>
      <span className="text-xs text-[var(--theme-text-muted)] line-clamp-2 flex-1">{val || '—'}</span>
      <FiEdit3 size={11} className="text-[var(--theme-text-muted)] opacity-0 group-hover:opacity-60 mt-0.5 flex-shrink-0" />
    </div>
  );
};

// ── TABLE VIEW ───────────────────────────────────────────────────────────────
const TableView = ({ candidates, onStageChange, onNoteChange }) => (
  <div className="overflow-x-auto rounded-2xl border border-[var(--theme-border)]">
    <table className="w-full text-xs">
      <thead>
        <tr className="bg-[var(--theme-bg-alt)] border-b border-[var(--theme-border)]">
          {['Name', 'Domain', 'Role', 'Verified Skills', 'Location', 'Availability', 'Status', 'Notes'].map(h => (
            <th key={h} className="px-4 py-3 text-left font-black uppercase tracking-widest text-[var(--theme-text-muted)] whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {candidates.map(c => (
          <tr key={c.id} className="border-b border-[var(--theme-border)] bg-[var(--theme-card)] hover:bg-[var(--theme-bg-alt)] transition-colors">
            {/* Name */}
            <td className="px-4 py-3 font-bold text-[var(--theme-text)] whitespace-nowrap">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#4c1d95] flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                  {c.name[0]}
                </div>
                <div>
                  <p className="font-black">{c.name}</p>
                  <p className="text-[var(--theme-text-muted)] text-[0.65rem]">@{c.username}</p>
                </div>
              </div>
            </td>
            {/* Domain */}
            <td className="px-4 py-3 text-[var(--theme-text-muted)] whitespace-nowrap">{c.domain}</td>
            {/* Role */}
            <td className="px-4 py-3 text-[var(--theme-text)] whitespace-nowrap">{c.role}</td>
            {/* Verified skills */}
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-1">
                {c.verified_skills.slice(0, 3).map(s => (
                  <span key={s} className="px-1.5 py-0.5 bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] rounded-md text-[0.6rem] font-bold text-[var(--theme-text-muted)] whitespace-nowrap">{s}</span>
                ))}
              </div>
            </td>
            {/* Location */}
            <td className="px-4 py-3 text-[var(--theme-text-muted)] whitespace-nowrap">{c.location}</td>
            {/* Availability */}
            <td className="px-4 py-3 whitespace-nowrap">
              <span className={`text-[0.65rem] font-black uppercase tracking-wide ${
                c.availability === 'Available' ? 'text-[var(--status-success)]' :
                c.availability === 'Open to offers' ? 'text-[#F59E0B]' : 'text-[var(--theme-text-muted)]'
              }`}>{c.availability}</span>
            </td>
            {/* Status */}
            <td className="px-4 py-3 whitespace-nowrap">
              <select value={c.stage} onChange={e => onStageChange(c.id, e.target.value)}
                className="bg-transparent border-0 text-[0.65rem] font-black uppercase cursor-pointer focus:outline-none"
                style={{ color: STAGE_COLORS[c.stage]?.text || '#7C3AED' }}>
                {TALENT_PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </td>
            {/* Notes */}
            <td className="px-4 py-3 min-w-[160px] max-w-[220px]">
              <NoteCell note={c.notes} onSave={v => onNoteChange(c.id, v)} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ── KANBAN VIEW ──────────────────────────────────────────────────────────────
const KanbanView = ({ candidates, onStageChange }) => (
  <div className="flex gap-4 overflow-x-auto pb-4">
    {TALENT_PIPELINE_STAGES.map(stage => {
      const cols = candidates.filter(c => c.stage === stage);
      const sc = STAGE_COLORS[stage];
      return (
        <div key={stage} className="flex-shrink-0 w-56 space-y-3">
          {/* Column header */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[0.65rem] font-black uppercase tracking-widest" style={{ color: sc.text }}>{stage}</span>
            <span className="text-[0.65rem] font-black px-1.5 py-0.5 rounded-md" style={{ backgroundColor: sc.bg, color: sc.text }}>{cols.length}</span>
          </div>
          {/* Cards */}
          <div className="space-y-2 min-h-[80px] rounded-2xl p-2"
            style={{ backgroundColor: `${sc.bg}`, border: `1px dashed ${sc.border}` }}>
            {cols.map(c => (
              <div key={c.id} className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl p-3 space-y-2 shadow-sm hover:border-[var(--theme-primary)]/30 transition-all cursor-grab">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#4c1d95] flex items-center justify-center text-white text-[0.6rem] font-black flex-shrink-0">
                    {c.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-[var(--theme-text)] truncate">{c.name}</p>
                    <p className="text-[0.6rem] text-[var(--theme-text-muted)] truncate">{c.role}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {c.verified_skills.slice(0, 2).map(s => (
                    <span key={s} className="px-1 py-0.5 bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] rounded text-[0.55rem] font-bold text-[var(--theme-text-muted)]">{s}</span>
                  ))}
                </div>
                {/* Stage mover buttons */}
                <div className="flex gap-1 pt-1 border-t border-dashed border-[var(--theme-border)]">
                  {TALENT_PIPELINE_STAGES.filter(s => s !== stage).slice(0, 2).map(s => (
                    <button key={s} onClick={() => onStageChange(c.id, s)}
                      className="text-[0.55rem] font-black uppercase px-1.5 py-0.5 rounded border"
                      style={{ borderColor: STAGE_COLORS[s].border, color: STAGE_COLORS[s].text, backgroundColor: STAGE_COLORS[s].bg }}>
                      → {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

// ── Root export ──────────────────────────────────────────────────────────────
// Declared outside component to avoid re-creating on every render
const TalentSelect = ({ value, onChange, options, label }) => (
  <div className="relative">
    <select value={value} onChange={e => onChange(e.target.value)}
      className="appearance-none bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl pl-3 pr-7 py-2 text-xs font-bold text-[var(--theme-text-muted)] cursor-pointer focus:outline-none">
      <option value="All">{label}: All</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <FiChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--theme-text-muted)]" />
  </div>
);

const TalentPool = () => {
  const [view,       setView]       = useState('table');   // 'table' | 'kanban'
  const [candidates, setCandidates] = useState(MOCK_TALENT_POOL);
  const [skillFilter, setSkillFilter] = useState('All');
  const [locFilter,   setLocFilter]   = useState('All');
  const [availFilter, setAvailFilter] = useState('All');

  const updateStage = (id, stage) =>
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, stage } : c));
  const updateNote  = (id, notes) =>
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, notes } : c));

  const allSkills = [...new Set(candidates.flatMap(c => c.verified_skills))];
  const allLocs   = [...new Set(candidates.map(c => c.location))];
  const allAvails = [...new Set(candidates.map(c => c.availability))];

  const filtered = candidates.filter(c =>
    (skillFilter === 'All' || c.verified_skills.includes(skillFilter)) &&
    (locFilter   === 'All' || c.location === locFilter) &&
    (availFilter === 'All' || c.availability === availFilter)
  );

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FiFilter size={14} className="text-[var(--theme-text-muted)]" />
          <TalentSelect value={skillFilter} onChange={setSkillFilter} options={allSkills} label="Skill" />
          <TalentSelect value={locFilter}   onChange={setLocFilter}   options={allLocs}   label="Location" />
          <TalentSelect value={availFilter} onChange={setAvailFilter} options={allAvails} label="Availability" />
        </div>
        {/* View toggle */}
        <div className="flex rounded-xl overflow-hidden border border-[var(--theme-border)]">
          {[['table','table'],['kanban','kanban']].map(([v, label]) => (
            <button key={v} onClick={() => setView(v)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wide transition-all ${
                view === v
                  ? 'bg-[var(--theme-primary)] text-white'
                  : 'bg-[var(--theme-card)] text-[var(--theme-text-muted)] hover:bg-[var(--theme-bg-alt)]'
              }`}>
              {v === 'table' ? <FiList size={13} /> : <FiColumns size={13} />} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-[var(--theme-text-muted)]">
        Showing <span className="font-black text-[var(--theme-text)]">{filtered.length}</span> of {candidates.length} candidates
      </p>

      {view === 'table'
        ? <TableView  candidates={filtered} onStageChange={updateStage} onNoteChange={updateNote} />
        : <KanbanView candidates={filtered} onStageChange={updateStage} />
      }
    </div>
  );
};

export default TalentPool;
