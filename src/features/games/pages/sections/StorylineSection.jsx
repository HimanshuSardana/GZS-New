function Meta({ label, value }) {
    return (
        <div className="flex justify-between items-center gap-6 group border-b border-[var(--theme-border)] pb-4 last:border-0 last:pb-0 transition-all hover:pl-2">
            <span className="text-[10px] font-black text-[var(--theme-text-muted)] tracking-widest uppercase opacity-60">{label}</span>
            <span className="text-xs font-black text-[var(--theme-text)] text-right uppercase group-hover:text-[var(--gp-primary)] transition-colors">{value}</span>
        </div>
    );
}

export default function StorylineSection({ storyline, info }) {
    if (!storyline || !info) return null;
    const paragraphs = storyline.paragraphs || storyline.summary || "";
    
    return (
        <section className="gp-content-section grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-20 lg:gap-32">

            {/* Storyline */}
            <div className="gp-animate-in">
                <span className="gp-section-label">
                    THE WORLD
                </span>
                <h2 className="gp-section-heading">
                    STORYLINE
                </h2>
                
                <div className="relative mt-12">
                    <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[var(--gp-primary)] via-[var(--theme-border)] to-transparent rounded-full opacity-40"></div>
                    
                    <div className="space-y-10 pl-16">
                        {paragraphs.split('\n').map((p, i) => (
                            <p key={i} className={`gzs-body leading-relaxed text-[var(--theme-text)] opacity-90 ${i === 0 ? 'text-[20px] font-heading uppercase tracking-tight !leading-snug mb-10 font-black' : 'text-[15px] font-medium leading-relaxed'}`}>
                                {p}
                            </p>
                        ))}
                    </div>
                    
                    {/* Floating Accent */}
                    <div className="absolute -left-12 top-0 text-[120px] font-heading font-black text-[var(--gp-primary)] opacity-5 select-none leading-none">
                        S
                    </div>
                </div>
            </div>

            {/* Metadata card - Sticky & Premium */}
            <div className="relative">
                <div className="sticky top-40 gp-card !p-12 overflow-hidden bg-white border-2 border-[var(--theme-border)] shadow-2xl">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--gp-primary)] opacity-[0.03] blur-[60px] rounded-full -mr-16 -mt-16" />
                    
                    <div className="flex items-center gap-4 mb-10 border-b-2 border-[var(--gp-primary)] pb-6">
                        <div className="w-3 h-3 rounded-full bg-[var(--gp-primary)] animate-pulse" />
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-[var(--gp-primary)]">TECHNICAL INTEL</h4>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <Meta label="DEVELOPER" value={info.developer} />
                        <Meta label="RELEASE DATE" value="MARCH 04, 2024" />
                        <Meta label="PUBLISHER" value={info.publisher} />
                        <Meta label="GENRES" value={info.genres} />
                        <Meta label="PLATFORMS" value={info.platforms} />
                    </div>

                    <div className="mt-12 pt-10 border-t border-[var(--theme-border)] opacity-60">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] text-center">
                            OFFICIAL LICENSED CONTENT
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
