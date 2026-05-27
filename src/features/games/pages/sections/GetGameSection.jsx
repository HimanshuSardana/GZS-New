import { FiMonitor } from 'react-icons/fi';
import { FaXbox, FaPlaystation, FaSteam, FaWindows } from 'react-icons/fa';

export default function GetGameSection({ getGame }) {
    if (!getGame) return null;
    const platformIcons = {
        PC: <FiMonitor />,
        Steam: <FaSteam />,
        PlayStation: <FaPlaystation />,
        PS4: <FaPlaystation />,
        PS5: <FaPlaystation />,
        Xbox: <FaXbox />,
        'Xbox One': <FaXbox />,
        'Xbox Series X': <FaXbox />,
        Windows: <FaWindows />,
    };
    const platforms = Array.isArray(getGame.platforms) && getGame.platforms.length > 0
        ? getGame.platforms
        : ['PC'];
    const primaryOffer = getGame.primaryOffer || {};
    return (
        <section className="gp-content-section relative">
            <div className="space-y-12 relative z-10">
                {/* Main Get Game Bar */}
                <div className="gp-card py-12 px-12 flex flex-col md:flex-row items-center justify-between text-[var(--theme-text)] relative overflow-hidden gp-animate-in">
                    {/* Subtle background decoration */}
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-[var(--theme-bg-section)] skew-x-[-15deg] translate-x-12 origin-top-right pointer-events-none" />

                    <h2 className="gp-section-heading !border-0 !mb-0 !pb-0 text-[32px] md:text-[36px] relative z-10">
                        GET GAME
                    </h2>

                    <div className="flex flex-col sm:flex-row items-center gap-12 relative z-10 w-full md:w-auto mt-8 md:mt-0">
                        <div className="flex gap-8 text-[26px] text-[var(--theme-text-subtle)]">
                            {platforms.map((platform) => (
                                <span
                                    key={platform}
                                    className="hover:text-[var(--gp-primary)] transition-all cursor-pointer hover:scale-110"
                                    title={platform}
                                >
                                    {platformIcons[platform] || <FiMonitor />}
                                </span>
                            ))}
                        </div>
                        <a
                            href={getGame.ctaHref || '#'}
                            target={getGame.ctaHref?.startsWith('http') ? '_blank' : undefined}
                            rel={getGame.ctaHref?.startsWith('http') ? 'noreferrer' : undefined}
                            className="relative w-full sm:w-auto px-12 py-5 bg-[var(--gp-primary)] text-[var(--theme-text-inverse)] text-[13px] font-black uppercase tracking-wide rounded-xl transition-all hover:scale-[1.02] shadow-md hover:shadow-lg flex items-center justify-center gap-3 no-underline"
                        >
                            {getGame.ctaLabel || 'PLAY NOW'}
                            <span className="w-2 h-2 bg-white/80 rounded-full animate-ping"></span>
                        </a>
                    </div>
                </div>

                {/* Purchase Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="gp-card bg-[var(--gp-primary)] border-transparent text-[var(--theme-text-inverse)] gp-animate-in relative group">
                        <span className="relative z-10 inline-block px-3 py-1 bg-white/10 text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-inverse)] rounded mb-6 border border-white/10">{primaryOffer.eyebrow || 'OFFICIAL ACCESS'}</span>
                        <h3 className="relative z-10 gp-hero-title text-[32px] mb-6 tracking-wide drop-shadow-sm uppercase text-[var(--theme-text-inverse)]">{primaryOffer.title || 'PLAY THE LATEST BUILD'}</h3>
                        <p className="relative z-10 gzs-body text-[var(--theme-text-inverse)] opacity-90 mb-10 text-[16px] leading-relaxed font-bold">{primaryOffer.description || 'Access the game from the official source or the storefront your profile already uses.'}</p>
                        <button className="relative z-10 text-[11px] font-black uppercase tracking-widest border-b-2 border-white/40 pb-1 hover:border-white hover:text-[var(--theme-text-inverse)] transition-all">SHOP PACKS →</button>
                    </div>

                    <div className="gp-card gp-animate-in relative group">
                        <span className="relative z-10 inline-block px-3 py-1 bg-[var(--theme-bg-section)] text-[10px] font-black uppercase tracking-widest text-[var(--gp-primary)] rounded mb-6 border border-[var(--theme-border)]">UPGRADE YOUR GAME</span>
                        <h3 className="relative z-10 gp-hero-title text-[32px] mb-6 text-[var(--theme-text)] tracking-wide group-hover:text-[var(--gp-primary)] transition-colors uppercase">DELUXE BUNDLE</h3>
                        <p className="relative z-10 gzs-body text-[var(--theme-text-muted)] mb-10 text-[16px] leading-relaxed font-bold">The ultimate collection of skins and accessories to dominate the battlefield in style.</p>
                        <button className="relative z-10 text-[11px] font-black uppercase tracking-widest border-b-2 border-[var(--gp-primary)]/40 pb-1 text-[var(--gp-primary)] hover:border-[var(--gp-primary)] transition-all">VIEW BUNDLE →</button>
                    </div>
                </div>
            </div>
        </section>
    );
}
