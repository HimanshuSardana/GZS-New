import React from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiAward, FiUsers } from 'react-icons/fi';
import { motion } from 'framer-motion';

const DOMAIN_GRADIENT = {
  esports: 'from-green-950 to-[#052005]',
  art:     'from-purple-950 to-indigo-950',
  writing: 'from-blue-950 to-sky-950',
  music:   'from-rose-950 to-pink-950',
  audio:   'from-rose-950 to-pink-950',
  dev:     'from-indigo-950 to-violet-950',
  general: 'from-gray-900 to-gray-950',
};

const STATUS_CFG = {
  live:               { label: 'LIVE', cls: 'bg-red-600 text-white', dot: true },
  registration_open:  { label: 'Open', cls: 'bg-green-600/90 text-white', dot: false },
  upcoming:           { label: 'Upcoming', cls: 'bg-gray-700/80 text-white', dot: false },
  completed:          { label: 'Completed', cls: 'bg-slate-600/70 text-white', dot: false },
  registration_closed:{ label: 'Closed', cls: 'bg-gray-600/70 text-gray-200', dot: false },
};

export default function TournamentCard({ tournament, onClick }) {
  const t = tournament;
  if (!t) return null;

  const status = (t.status || '').toLowerCase();
  const type   = (t.tournament_type || t.type || 'general').toLowerCase();
  const grad   = DOMAIN_GRADIENT[type] || DOMAIN_GRADIENT.general;
  const sCfg   = STATUS_CFG[status] || { label: status, cls: 'bg-gray-700 text-white', dot: false };
  const pct    = t.max_participants > 0
    ? Math.min(100, Math.round(((t.current_participants || 0) / t.max_participants) * 100))
    : 0;

  return (
    <Link
      to={`/tournaments/${t.slug || t.id}`}
      onClick={onClick}
      className="block group rounded-2xl overflow-hidden border border-[var(--theme-border)] bg-[var(--theme-card)] hover:border-[var(--theme-primary)]/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-[var(--theme-primary)]/5 transition-all duration-300"
    >
      {/* Banner */}
      <div className={`relative h-44 bg-gradient-to-br ${grad} flex items-end p-5`}>
        {t.banner_url && (
          <img
            src={t.banner_url}
            alt={t.name || t.title}
            className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-40 group-hover:scale-110 transition-all duration-700"
            loading="lazy"
            decoding="async"
          />
        )}

        {/* Status badge */}
        <div className="absolute top-4 left-4 flex gap-2 z-10">
          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest italic shadow-2xl ${sCfg.cls}`}>
            {sCfg.dot && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            {sCfg.label}
          </span>
        </div>

        {/* Format badge */}
        <span className="relative z-10 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md text-[9px] font-black uppercase tracking-widest text-white border border-white/10 italic">
          {(t.bracket_format || t.format || type).replace(/_/g, ' ')}
        </span>
      </div>

      {/* Info */}
      <div className="p-6">
        <h3 className="text-base font-black uppercase tracking-tight text-[var(--theme-text)] leading-tight mb-6 group-hover:text-[var(--theme-primary)] transition-colors line-clamp-2 italic">
          {t.name || t.title}
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--theme-text-muted)] mb-1 opacity-40 italic">Prize Pool</p>
            <p className="text-sm font-black text-[var(--status-success)] flex items-center gap-2 italic">
              <FiAward size={14} /> {t.prize || 'TBD'}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--theme-text-muted)] mb-1 opacity-40 italic">Start Date</p>
            <p className="text-xs font-black text-[var(--theme-text)] flex items-center gap-2 italic">
              <FiCalendar size={12} className="text-[var(--theme-primary)]" /> {t.date || '—'}
            </p>
          </div>
        </div>

        {/* Slots progress */}
        {t.max_participants > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-40">
              <span className="flex items-center gap-1.5">
                <FiUsers size={12} /> {t.current_participants || 0} Registered
              </span>
              <span>{t.max_participants} Max</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                className="h-full bg-[var(--status-success)] shadow-[0_0_10px_rgba(var(--status-success-rgb),0.5)]"
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
