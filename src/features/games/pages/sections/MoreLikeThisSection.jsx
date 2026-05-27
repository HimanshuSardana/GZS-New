import { Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useRef } from 'react';

export default function MoreLikeThisSection({ games = [] }) {
    const scrollRef = useRef(null);

    const scrollLeft  = () => scrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' });
    const scrollRight = () => scrollRef.current?.scrollBy({ left: 320,  behavior: 'smooth' });

    if (games.length === 0) return null;

    return (
        <section className="gp-content-section">
            <div className="flex justify-between items-end border-b border-[var(--theme-border)] pb-6 mb-12 gp-animate-in relative">
                <div>
                    <span className="gp-section-label flex items-center gap-3">
                        SIMILAR GAMES
                    </span>
                    <h2 className="gp-section-heading !border-b-0 !mb-0 !pb-0">
                        MORE LIKE THIS
                    </h2>
                </div>
                <div className="flex gap-4 pb-1">
                    <button 
                        onClick={scrollLeft}
                        className="w-14 h-14 flex items-center justify-center bg-[var(--theme-card)] text-[var(--theme-text)] border border-[var(--theme-border)] rounded-2xl transition-all hover:bg-[var(--gp-primary)] hover:text-[var(--theme-text-inverse)] hover:border-[var(--gp-primary)] shadow-sm group hover:shadow-md"
                    >
                        <FiChevronLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <button 
                        onClick={scrollRight}
                        className="w-14 h-14 flex items-center justify-center bg-[var(--gp-primary)] text-[var(--theme-text-inverse)] rounded-2xl transition-all shadow-md hover:shadow-lg hover:scale-105 group relative overflow-hidden"
                    >
                        <FiChevronRight size={28} className="group-hover:translate-x-1 transition-transform relative z-10" />
                    </button>
                </div>
            </div>

            <div ref={scrollRef} className="flex gap-10 overflow-x-auto scrollbar-hide snap-x pt-6 items-center pb-12 px-4">
                {games.map((g, i) => (
                    <Link key={g.slug || i} to={`/games/${g.slug || g.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className={`group relative block rounded-3xl overflow-hidden shrink-0 snap-center transition-all duration-700 gp-animate-in hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]
                          ${g.active ? 'w-[320px] aspect-[4/5] border-4 border-[var(--gp-primary)] shadow-lg scale-[1.08] z-10' : 'w-[260px] aspect-[3/4] border border-[var(--theme-border)] opacity-80 hover:opacity-100 hover:scale-[1.02] hover:z-20 hover:border-[var(--gp-primary)] shadow-sm'}
                          `}
                        style={{ animationDelay: `${i * 100}ms` }}>

                        <img src={g.img} alt={g.name} className={`w-full h-full object-cover transition-transform duration-1000 ${g.active ? 'scale-105' : 'group-hover:scale-110'}`} />
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--gp-primaryDark)] via-black/20 to-transparent mix-blend-multiply opacity-80"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                        {/* Top corner accents */}
                        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/50 group-hover:border-white transition-colors"></div>
                        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/50 group-hover:border-white transition-colors"></div>

                        <div className="absolute bottom-0 left-0 w-full p-8 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                            {g.active && (
                                <span className="inline-block px-5 py-2 bg-[var(--gp-primary)] text-[var(--theme-text-inverse)] text-[11px] font-black uppercase tracking-wide rounded-md mb-5 shadow-sm">
                                    TOP PICK
                                </span>
                            )}
                            <h4 className="text-[var(--theme-text-inverse)] gp-hero-title text-[32px] tracking-widest uppercase mb-6 drop-shadow-sm">
                                {g.name}
                            </h4>
                            <div className="w-full py-4 bg-white/10 hover:bg-[var(--gp-primary)] text-[var(--theme-text-inverse)] text-[13px] font-black uppercase tracking-wide border border-white/30 hover:border-transparent rounded-xl transition-all duration-300 backdrop-blur-md text-center opacity-0 group-hover:opacity-100 shadow-lg">
                                VIEW PROFILE
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
