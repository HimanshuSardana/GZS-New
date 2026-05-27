export default function GameplaySection({ gameplay = [], screenshots = [] }) {
  const overviewText = gameplay[0]?.paragraph
    || gameplay[0]?.gameplay_title_desc
    || null;

  return (
    <section className="gp-content-section gp-section-alt">
      <div className="gp-animate-in">

        <span className="gp-section-label">
          THE EXPERIENCE
        </span>
        <h2 className="gp-section-heading">
          GAMEPLAY
        </h2>

        {/* Overview paragraph from data */}
        {overviewText && (
          <p className="text-[16px] md:text-[18px] leading-snug max-w-4xl mb-16 text-[var(--theme-text)] font-medium opacity-90 border-l-4 border-[var(--gp-primary)] pl-8 py-3">
            {overviewText}
          </p>
        )}

        {/* Key mechanics grid */}
        {gameplay.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-32">
            {gameplay.map((g, i) => (
              <div
                key={i}
                className="gp-card group relative gp-animate-in overflow-hidden border-none shadow-[0_20px_60px_-20px_rgba(0,0,0,0.1)] hover:shadow-[0_40px_100px_-30px_rgba(0,0,0,0.15)]"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Massive Watermark Number */}
                <span className="absolute -right-8 -bottom-12 text-[160px] md:text-[220px] font-heading font-black text-[var(--gp-primary)] opacity-[0.03] group-hover:opacity-10 group-hover:scale-110 transition-all duration-700 select-none leading-none">
                  0{i + 1}
                </span>

                <div className="relative z-10">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-16 h-[2px] bg-[var(--gp-primary)] group-hover:w-24 transition-all duration-500" />
                    <h3 className="text-[22px] md:text-[26px] font-heading tracking-tight text-[var(--theme-text)] group-hover:text-[var(--gp-primary)] transition-colors duration-300 uppercase leading-tight">
                      {g.gameplay_title}
                    </h3>
                  </div>
                  <p className="gzs-body text-[var(--theme-text)] opacity-70 leading-relaxed font-bold text-lg md:text-xl group-hover:opacity-100 transition-opacity duration-300">
                    {g.gameplay_title_desc}
                  </p>
                </div>
                
                {/* Hover Accent */}
                <div className="absolute top-0 left-0 w-2 h-0 bg-[var(--gp-primary)] group-hover:h-full transition-all duration-500" />
              </div>
            ))}
          </div>
        )}

        {/* Video & Media Section */}
        <div className="grid lg:grid-cols-[1fr_400px] gap-12 items-start">
            <div className="space-y-12">
                <div className="flex items-center gap-6">
                   <h3 className="text-[11px] font-black uppercase tracking-widest text-[var(--gp-primary)]">WATCH REVEAL</h3>
                   <div className="h-[1px] flex-1 bg-[var(--theme-border)] opacity-30" />
                </div>
                
                {gameplay[0]?.video_url ? (
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-[var(--gp-primary)]/10 blur-2xl rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        <div
                            className="relative w-full rounded-[32px] overflow-hidden border-8 border-white shadow-2xl"
                            style={{ aspectRatio: '16/9' }}
                        >
                            <iframe
                                src={gameplay[0].video_url.replace('watch?v=', 'embed/')}
                                title="Gameplay video"
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </div>
                ) : (
                    <div className="relative w-full rounded-[32px] overflow-hidden flex items-center justify-center bg-white border border-[var(--theme-border)] shadow-xl" style={{ aspectRatio: '16/9' }}>
                        <p className="text-[var(--theme-text-muted)] text-sm font-black uppercase tracking-widest">Feed Not Available</p>
                    </div>
                )}
            </div>

            <div className="space-y-12">
                <div className="flex items-center gap-6">
                   <h3 className="text-[11px] font-black uppercase tracking-widest text-[var(--gp-primary)]">SCREENSHOTS</h3>
                   <div className="h-[1px] flex-1 bg-[var(--theme-border)] opacity-30" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {screenshots.slice(0, 4).map((src, i) => (
                        <div
                            key={i}
                            className={`relative rounded-2xl overflow-hidden aspect-square bg-black/20 group cursor-pointer border-2 border-white shadow-lg transition-all duration-500 hover:scale-[1.05] hover:z-10 hover:shadow-2xl ${i % 2 === 0 ? 'mt-8' : ''}`}
                        >
                            <img
                                src={typeof src === 'string' ? src : src.url || src.image}
                                alt={`Shot ${i + 1}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-[var(--gp-primary)]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </section>
  );
}
