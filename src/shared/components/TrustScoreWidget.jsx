import { useState, useRef } from 'react';
import { FiShield } from 'react-icons/fi';
import { MOCK_TRUST_BREAKDOWN } from '@/shared/data/progressionData';

// ── Color logic ───────────────────────────────────────────────────────────────
function getTrustColor(score) {
  if (score < 3.0) return { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626' }; // red
  if (score < 6.1) return { bg: '#fffbeb', border: '#fcd34d', text: '#d97706' }; // amber
  return              { bg: '#f0fdf4', border: '#86efac', text: '#16a34a' };      // green
}

// ── Size tokens ───────────────────────────────────────────────────────────────
const SIZE = {
  sm: { pill: 'px-2 py-1 text-xs gap-1',    shield: 12, score: 'text-xs' },
  md: { pill: 'px-3 py-1.5 text-sm gap-1.5', shield: 15, score: 'text-sm' },
  lg: { pill: 'px-4 py-2 text-base gap-2',  shield: 20, score: 'text-base' },
};

/**
 * TrustScoreWidget
 * Props:
 *   score      – number 1.0–10.0  (uses MOCK if omitted)
 *   breakdown  – object { total, components[] } (uses MOCK if omitted)
 *   size       – 'sm' | 'md' | 'lg'
 */
export default function TrustScoreWidget({ score, breakdown, size = 'md' }) {
  const data   = breakdown || MOCK_TRUST_BREAKDOWN;
  const raw    = score     !== undefined ? score : data.total;
  const colors = getTrustColor(raw);
  const s      = SIZE[size] || SIZE.md;

  const [open, setOpen] = useState(false);
  const timer = useRef(null);

  const handleEnter = () => { clearTimeout(timer.current); setOpen(true);  };
  const handleLeave = () => { timer.current = setTimeout(() => setOpen(false), 200); };

  return (
    <span className="relative inline-flex items-center"
      onMouseEnter={handleEnter} onMouseLeave={handleLeave}
      onFocus={handleEnter} onBlur={handleLeave}
      tabIndex={0} role="button" aria-label={`Trust score: ${raw.toFixed(1)}`}>

      {/* Pill */}
      <span className={`inline-flex items-center font-bold rounded-full border cursor-pointer whitespace-nowrap ${s.pill}`}
        style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}>
        <FiShield size={s.shield} />
        <span className={`font-black ${s.score}`}>{raw.toFixed(1)}</span>
      </span>

      {/* Breakdown popover */}
      {open && (
        <span className="absolute bottom-full mb-2 left-0 z-50 w-72
          rounded-2xl border border-[var(--theme-border)]
          bg-[var(--theme-card)] shadow-2xl p-4
          text-[var(--theme-text)] pointer-events-auto"
          onMouseEnter={handleEnter} onMouseLeave={handleLeave}>

          <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-text-muted)] mb-3">
            Trust Score Breakdown
          </p>

          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--theme-border)]">
                <th className="pb-1.5 text-left font-bold text-[var(--theme-text-muted)]">Component</th>
                <th className="pb-1.5 text-center font-bold text-[var(--theme-text-muted)]">Weight</th>
                <th className="pb-1.5 text-right font-bold text-[var(--theme-text-muted)]">Score</th>
              </tr>
            </thead>
            <tbody>
              {data.components.map((c, i) => (
                <tr key={i} className="border-b border-[var(--theme-border)]/50 last:border-0">
                  <td className="py-1.5 font-medium text-[var(--theme-text)]">{c.name}</td>
                  <td className="py-1.5 text-center text-[var(--theme-text-muted)]">{c.weight}</td>
                  <td className={`py-1.5 text-right font-black ${
                    c.score > 0 ? 'text-[#16a34a]' : c.score < 0 ? 'text-[#dc2626]' : 'text-[var(--theme-text-muted)]'
                  }`}>
                    {c.score > 0 ? `+${c.score}` : c.score}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="pt-2 font-black text-[var(--theme-text)]">Total</td>
                <td className="pt-2 text-right font-black" style={{ color: colors.text }}>
                  {raw.toFixed(1)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Arrow */}
          <span className="absolute top-full left-6 w-0 h-0
            border-l-4 border-r-4 border-t-4
            border-l-transparent border-r-transparent
            border-t-[var(--theme-card)]" />
        </span>
      )}
    </span>
  );
}
