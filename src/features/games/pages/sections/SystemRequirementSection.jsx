export default function SystemRequirementSection({ sys }) {
  if (!sys) return null;

  const rows = [
    { label: 'OS',        min: sys.os_min,        rec: sys.os_rec },
    { label: 'Processor', min: sys.processor_min, rec: sys.processor_rec },
    { label: 'Memory',    min: sys.memory_min,    rec: sys.memory_rec },
    { label: 'Graphics',  min: sys.graphics_min,  rec: sys.graphics_rec },
    { label: 'Storage',   min: sys.storage_min,   rec: sys.storage_rec },
    { label: 'DirectX',   min: sys.directx_min,   rec: sys.directx_rec },
  ].filter(r => r.min || r.rec);

  return (
    <section className="gp-content-section gp-section-alt relative overflow-hidden">
      <div className="relative z-10">
        <div className="text-center mb-16 gp-animate-in">
          <span className="gp-section-label flex items-center justify-center gap-3">
            THE SPECS
          </span>
          <h2 className="gp-section-heading !border-b-0 mx-auto max-w-max">
            SYSTEM REQUIREMENTS
          </h2>
          <div className="w-24 h-1 bg-[var(--gp-primary)] mx-auto -mt-2"></div>
        </div>

        <div className="gp-card !p-0 overflow-hidden bg-[var(--theme-card)]">
          {/* Desktop Table Header */}
          <div className="hidden md:grid grid-cols-[200px_1fr_1fr] bg-[var(--gp-primary)] text-[var(--theme-text-inverse)]">
            <div className="text-[11px] font-black px-8 py-6 tracking-widest uppercase border-r border-white/10">
              Component
            </div>
            <div className="text-[11px] font-black px-8 py-6 tracking-widest uppercase border-r border-white/10">Minimum</div>
            <div className="text-[11px] font-black px-8 py-6 tracking-widest uppercase">Recommended</div>
          </div>

          {/* Requirements Content */}
          <div>
            {rows.map(row => (
              <div
                key={row.label}
                className="flex flex-col md:grid md:grid-cols-[200px_1fr_1fr] border-b border-[var(--theme-border)] last:border-0 hover:bg-[var(--theme-bg-section)] transition-all group"
              >
                {/* Component Label */}
                <div className="px-6 py-4 md:px-8 md:py-6 font-black text-[var(--theme-text)] text-[11px] uppercase tracking-widest border-b md:border-b-0 border-[var(--theme-border)] flex items-center bg-[var(--theme-bg-section)] md:bg-transparent">
                  {row.label}
                </div>

                {/* Minimum Spec */}
                <div className="px-6 py-4 md:px-8 md:py-6 text-[var(--theme-text-muted)] text-[13px] font-bold md:border-l border-[var(--theme-border)] uppercase leading-relaxed font-mono">
                  <span className="block md:hidden text-[10px] text-[var(--gp-primary)] mb-1 font-black">MINIMUM</span>
                  {row.min || '—'}
                </div>

                {/* Recommended Spec */}
                <div className="px-6 py-4 md:px-8 md:py-6 text-[var(--theme-text)] text-[13px] font-black md:border-l border-[var(--theme-border)] uppercase leading-relaxed font-mono">
                  <span className="block md:hidden text-[10px] text-[var(--gp-primary)] mb-1 font-black">RECOMMENDED</span>
                  {row.rec || '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
