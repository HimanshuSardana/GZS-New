import placeholderWhite from '@assets/images/placeholderWhite.svg';

export default function HeroSection({ hero, genres = [], platforms = [] }) {
  if (!hero) return null;

  return (
    <section className="relative h-[var(--gp-hero-height,680px)] bg-[var(--theme-bg)] overflow-hidden flex items-end pb-32">

      {/* Background Image with subtle zoom */}
      <div className="absolute inset-0 z-0">
        <img
          src={hero.background_img || placeholderWhite}
          alt="hero"
          className="w-full h-full object-cover scale-105 animate-[hero-zoom_20s_infinite_alternate]"
        />
        <div className="gp-hero-overlay" />
      </div>

      {/* Content Container */}
      <div className="container-global relative z-10 w-full px-6">
        <div className="max-w-5xl gp-animate-in">

          <div className="flex items-center gap-4 mb-8">
            <span className="gp-section-label !mb-0">
              NOW PLAYING
            </span>
            <div className="h-[1px] w-12 bg-[var(--gp-primary)] opacity-40"></div>
            {genres.slice(0, 2).map(g => (
                <span key={g} className="text-[10px] font-black uppercase tracking-widest text-[var(--gp-primary)]">
                    {g}
                </span>
            ))}
          </div>

          <h1 className="gp-hero-title mb-8">
            {hero.game_title}
          </h1>

          <div className="flex flex-wrap gap-3 mb-10">
            {platforms.map(p => (
              <span
                key={p}
                className="text-[10px] font-black px-4 py-2 rounded-xl bg-white/40 border border-white/20 text-[var(--theme-text)] backdrop-blur-xl uppercase tracking-widest shadow-sm"
              >
                {p}
              </span>
            ))}
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-12 mt-12">
            <p className="gzs-body max-w-xl text-[var(--theme-text)] opacity-80 text-[18px] font-medium leading-relaxed border-l-4 border-[var(--gp-primary)] pl-8 py-2">
              {hero.game_desc_short}
            </p>

            <div className="flex flex-wrap gap-4 shrink-0">
              <button
                className="gp-btn-primary"
                onClick={() => document.getElementById('gp-section-get-game')?.scrollIntoView({ behavior: 'smooth' })}
              >
                GET ACCESS
                <span className="font-serif text-2xl leading-none">→</span>
              </button>
              
              <button
                className="h-20 px-12 rounded-2xl bg-white/60 border border-[var(--theme-border)] text-[var(--theme-text)] font-black uppercase tracking-widest hover:bg-white transition-all backdrop-blur-lg flex items-center gap-3 shadow-sm hover:shadow-md"
              >
                TRAILER
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Aesthetic Bottom Border Decoration */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--theme-border)] to-transparent" />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes hero-zoom {
          from { transform: scale(1); }
          to { transform: scale(1.1); }
        }
      `}} />
    </section>
  );
}
