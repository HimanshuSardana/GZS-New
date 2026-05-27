const DOMAIN_COLORS = {
  dev:       { color: '#00e5a0', bg: 'rgba(0,229,160,0.12)'    },
  esports:   { color: '#ff4d6d', bg: 'rgba(255,77,109,0.12)'  },
  content:   { color: '#ff9f2e', bg: 'rgba(255,159,46,0.12)'  },
  business:  { color: '#3b9eff', bg: 'rgba(59,158,255,0.12)'  },
  art:       { color: '#ff6eb4', bg: 'rgba(255,110,180,0.12)' },
  writing:   { color: '#4ade80', bg: 'rgba(74,222,128,0.12)'  },
  audio:     { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  general:   { color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
  newcomers: { color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
};

const LABELS = {
  dev: 'Dev', esports: 'Esports', content: 'Content', business: 'Business',
  art: 'Art', writing: 'Writing', audio: 'Audio', general: 'General', newcomers: 'Newcomers',
};

const SIZE = {
  sm: { fontSize: '10px', padding: '2px 7px' },
  md: { fontSize: '11px', padding: '3px 9px' },
  lg: { fontSize: '12px', padding: '4px 11px' },
};

const BASE = {
  borderRadius: '20px',
  fontWeight: 600,
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
  display: 'inline-block',
};

export default function DomainBadge({ domain, size = 'md', variant = 'pill', label, className }) {
  const meta = DOMAIN_COLORS[domain] ?? { color: '#818cf8', bg: 'rgba(129,140,248,0.12)' };
  const text = label ?? LABELS[domain] ?? domain;
  const sizing = SIZE[size] ?? SIZE.md;

  if (variant === 'dot') {
    return (
      <span
        className={className}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
        <span style={{ ...sizing, color: 'var(--gzs-text-secondary)', fontWeight: BASE.fontWeight, letterSpacing: BASE.letterSpacing, textTransform: BASE.textTransform }}>
          {text}
        </span>
      </span>
    );
  }

  const variantStyle = variant === 'outline'
    ? { color: meta.color, background: 'transparent', border: `1px solid ${meta.color}40` }
    : { color: meta.color, background: meta.bg, border: `1px solid ${meta.color}25` };

  return (
    <span
      className={className}
      style={{ ...BASE, ...sizing, ...variantStyle }}
    >
      {text}
    </span>
  );
}
