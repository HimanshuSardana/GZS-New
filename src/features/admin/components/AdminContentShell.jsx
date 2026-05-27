import React from 'react';

export function AdminPageHero({ kicker, title, description, actions }) {
  return (
    <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12 md:mb-16">
      <div className="space-y-4 md:space-y-6">
        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-[var(--theme-primary)] italic opacity-80">{kicker}</span>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter italic leading-[0.9] text-[var(--theme-text)]">{title}</h1>
        {description ? <p className="text-xs md:text-sm font-bold text-[var(--theme-text-muted)] italic opacity-60 max-w-2xl leading-relaxed">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-4">{actions}</div> : null}
    </section>
  );
}

export function AdminPanel({ title, meta, children, padded = true }) {
  return (
    <section className={`bg-[var(--theme-card)] border-2 border-[var(--theme-border)] rounded-[2.5rem] md:rounded-[3rem] shadow-xl overflow-hidden mb-10 md:mb-12 ${padded ? 'p-8 md:p-12' : ''}`}>
      {(title || meta) && (
        <header className="mb-8 md:mb-10">
          <div className="space-y-2">
            {title ? <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic text-[var(--theme-text)]">{title}</h2> : null}
            {meta ? <p className="text-[10px] md:text-xs font-bold text-[var(--theme-text-muted)] italic opacity-40 uppercase tracking-widest leading-none">{meta}</p> : null}
          </div>
        </header>
      )}
      {children}
    </section>
  );
}

export function AdminMetrics({ items }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-12 md:mb-16">
      {items.map((item) => (
        <div key={item.label} className="p-8 rounded-[2rem] border-2 border-[var(--theme-border)] bg-[var(--theme-card)] shadow-sm hover:border-[var(--theme-primary)]/30 transition-all group">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic opacity-40 group-hover:text-[var(--theme-primary)] transition-colors">{item.label}</span>
          <strong className="mt-4 block text-3xl font-black italic tracking-tighter text-[var(--theme-text)] uppercase leading-none">{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

export function AdminStatusBadge({ children, tone = 'success' }) {
  const tones = {
    success: 'text-[var(--status-success)] bg-[var(--status-success-soft)] border-[var(--status-success)]/20',
    warning: 'text-[var(--status-warning)] bg-[var(--status-warning-soft)] border-[var(--status-warning)]/20',
    danger: 'text-[var(--status-error)] bg-[var(--status-error-soft)] border-[var(--status-error)]/20',
    info: 'text-[var(--theme-primary)] bg-[var(--theme-primary)]/5 border-[var(--theme-primary)]/20',
  };
  
  return (
    <span className={`inline-flex px-3 py-1 rounded-full border-2 text-[10px] font-black uppercase tracking-wider italic ${tones[tone] || tones.info}`}>
      {children}
    </span>
  );
}

export function AdminEmptyState({ title, description }) {
  return (
    <div className="p-16 text-center rounded-[2rem] border-2 border-dashed border-[var(--theme-border)] bg-[var(--theme-bg-alt)]/30">
      <strong className="text-sm font-black uppercase tracking-widest text-[var(--theme-text-muted)] opacity-30 italic">{title}</strong>
      {description ? <p className="mt-4 text-xs font-bold text-[var(--theme-text-muted)] italic opacity-20">{description}</p> : null}
    </div>
  );
}
