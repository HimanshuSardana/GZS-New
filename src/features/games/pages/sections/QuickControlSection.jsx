export default function QuickControlSection({ controls }) {
    if (!controls) return null;
    return (
    <section className="gp-content-section relative">
        <div className="text-center mb-16 gp-animate-in relative z-10">
            <span className="gp-section-label flex items-center justify-center gap-3">
                THE BASICS
            </span>
            <h2 className="gp-section-heading !border-b-0 mx-auto max-w-max">
                QUICK CONTROLS
            </h2>
            <div className="w-24 h-1 bg-[var(--gp-primary)] mx-auto -mt-2"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            {controls.map((c, i) => (
                <div
                    key={i}
                    className="gp-card flex gap-8 items-center gp-animate-in group relative overflow-hidden"
                    style={{ animationDelay: `${i * 100}ms` }}
                >
                    {/* Icon Container */}
                    <div className="w-16 h-16 shrink-0 flex items-center justify-center bg-[var(--theme-bg-section)] rounded-2xl group-hover:bg-[var(--gp-primary)] group-hover:scale-105 transition-all duration-[var(--transition-normal, 300ms)]">
                        <div className="w-5 h-5 border-2 border-[var(--gp-primary)] rounded rotate-45 group-hover:border-[var(--theme-text-inverse)] transition-colors duration-[var(--transition-normal, 300ms)]" />
                    </div>

                    <div>
                        <h3 className="gp-hero-title text-[20px] mb-1 tracking-tight text-[var(--theme-text)] group-hover:text-[var(--gp-primary)] transition-colors uppercase">
                            {c.qco_title}
                        </h3>
                        <p className="gzs-body text-[var(--theme-text-muted)] font-bold text-[16px] leading-snug">
                            {c.qco_title_desc}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    </section>
  );
}
