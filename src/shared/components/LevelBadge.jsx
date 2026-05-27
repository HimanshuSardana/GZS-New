import { useState, useRef } from 'react';
import { FiStar } from 'react-icons/fi';
import { LEVEL_DEFINITIONS } from '@/shared/data/progressionData';

// ── Size tokens ───────────────────────────────────────────────────────────────
const SIZE = {
  sm: { badge: 'px-2 py-0.5 text-[0.6rem] gap-1',  star: 9  },
  md: { badge: 'px-2.5 py-1 text-xs gap-1.5',       star: 11 },
  lg: { badge: 'px-3.5 py-1.5 text-sm gap-2',       star: 14 },
};

// ── LevelBadge ────────────────────────────────────────────────────────────────
/**
 * Props:
 *   level  – 'Beginner' | 'Hustler' | 'Extreme' | 'Pro'
 *   size   – 'sm' | 'md' | 'lg'   (default 'md')
 */
export default function LevelBadge({ level = 'Beginner', size = 'md' }) {
  const def = LEVEL_DEFINITIONS.find((l) => l.id === level) || LEVEL_DEFINITIONS[0];
  const s   = SIZE[size] || SIZE.md;

  const [open, setOpen] = useState(false);
  const timer = useRef(null);

  const handleEnter = () => {
    clearTimeout(timer.current);
    setOpen(true);
  };
  const handleLeave = () => {
    timer.current = setTimeout(() => setOpen(false), 150);
  };

  const isGradient = def.color.bg.startsWith('linear');

  const badgeStyle = isGradient
    ? { background: def.color.bg, color: def.color.text }
    : { backgroundColor: def.color.bg, color: def.color.text };

  return (
    <span className="relative inline-flex items-center"
      onMouseEnter={handleEnter} onMouseLeave={handleLeave}
      onFocus={handleEnter} onBlur={handleLeave}
      tabIndex={0} role="img" aria-label={`Level: ${def.label}`}>

      {/* Badge pill */}
      <span
        className={`inline-flex items-center font-black uppercase tracking-wider rounded-full cursor-default select-none whitespace-nowrap ${s.badge}`}
        style={badgeStyle}>
        {def.hasStar && <FiStar size={s.star} className="fill-current" />}
        {def.label}
      </span>

      {/* Tooltip */}
      {open && (
        <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50
          w-max max-w-[220px] px-3 py-2 rounded-xl text-xs font-medium
          bg-[var(--theme-card)] border border-[var(--theme-border)]
          text-[var(--theme-text)] shadow-xl text-center leading-snug
          pointer-events-none">
          {def.tooltip}
          {/* Arrow */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
            border-l-4 border-r-4 border-t-4
            border-l-transparent border-r-transparent
            border-t-[var(--theme-card)]" />
        </span>
      )}
    </span>
  );
}
