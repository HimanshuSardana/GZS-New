export default function ModesSection({ modes }) {
    // Duplicate modes array to ensure seamless infinite looping with CSS translateX(-50%)
    const carouselItems = modes ? [...modes, ...modes] : [];

    return (
        <section className="gp-content-section overflow-hidden relative">

            <div className="text-center mb-16 gp-animate-in">
                <span className="gp-section-label flex items-center justify-center gap-3">
                    CHOOSE YOUR PATH
                </span>
                <h2 className="gp-section-heading !border-b-0 mx-auto max-w-max">
                    GAME MODES
                </h2>
                <div className="w-24 h-1 bg-[var(--gp-primary)] mx-auto -mt-2"></div>
            </div>

            <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-[var(--theme-bg)] to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-[var(--theme-bg)] to-transparent z-10 pointer-events-none" />

            <div className="flex gap-8 items-stretch animate-continuous-scroll w-max hover:pause px-4 pb-8">
                {carouselItems.map((m, i) => (
                    <div
                        key={i}
                        className="gp-card w-[300px] md:w-[350px] shrink-0 text-center cursor-pointer group relative overflow-hidden"
                    >
                        <div className="w-16 h-16 mx-auto mb-8 bg-[var(--theme-bg-section)] rounded-2xl flex items-center justify-center transition-all duration-[var(--transition-normal, 300ms)] group-hover:bg-[var(--gp-primary)] group-hover:scale-110">
                            <div className="w-6 h-6 border-2 border-[var(--gp-primary)] rounded-md group-hover:border-[var(--theme-text-inverse)] transition-colors duration-[var(--transition-normal, 300ms)]" />
                        </div>

                        <h3 className="gp-hero-title text-[20px] mb-4 text-[var(--theme-text)] group-hover:text-[var(--gp-primary)] transition-colors relative z-10 uppercase tracking-tight">
                            {m.mode_title}
                        </h3>
                        <p className="gzs-body text-[var(--theme-text-muted)] text-[14px] leading-relaxed relative z-10">
                            {m.mode_desc || "Engage in this exciting game mode and prove your skills on the battlefield."}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
