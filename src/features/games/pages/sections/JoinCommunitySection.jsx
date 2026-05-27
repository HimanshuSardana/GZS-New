export default function JoinCommunitySection({ community, criticRating }) {
  if (!community) return null;

  const score = criticRating?.score ?? null;
  const label = criticRating?.label ?? null;

  return (
    <section className="gp-content-section !pt-0 pb-32">

      {/* Critic score strip */}
      {score !== null && (
        <div className="gp-card mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 gp-animate-in">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] mb-1">
              GzoneSphere Critic Score
            </p>
            <p className="text-[13px] font-bold text-[var(--theme-text)]">
              Aggregated from expert reviews and community feedback
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="gp-score-badge">{score}</span>
            <div className="text-left">
              <span className="text-[13px] font-bold text-[var(--theme-text-muted)] block">/10</span>
              {label && (
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--gp-primary)]">
                  {label}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Join CTA banner */}
      <div className="relative bg-[var(--theme-bg-section)] rounded-3xl px-12 py-16 flex flex-col md:flex-row items-center justify-between gap-8 gp-animate-in overflow-hidden border border-[var(--theme-border)] group">

        {/* Decorative background */}
        <div className="absolute inset-0 bg-[radial-gradient(var(--theme-border)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-20" />

        {/* Left: title */}
        <div className="relative z-10 text-center md:text-left">
          <span className="text-[var(--gp-primary)] text-[13px] font-black uppercase tracking-wide mb-2 block border-l-2 border-[var(--gp-primary)] pl-3 ml-1">
            STAY CONNECTED
          </span>
          <h2 className="gp-section-heading !border-0 !mb-0 !pb-0 text-[36px] md:text-[44px]">
            {community.title || 'JOIN OUR COMMUNITY'}
          </h2>
          {community.subtitle && (
            <p className="text-[var(--theme-text-muted)] text-[14px] font-bold mt-6 max-w-xl">
              {community.subtitle}
            </p>
          )}
          {/* GZS Community CTA */}
          <a
            href="/community"
            className="inline-flex items-center gap-2 mt-8 px-8 py-4 rounded-xl bg-[var(--gp-primary)] text-[var(--theme-text-inverse)] text-[13px] font-black uppercase tracking-wide transition-all hover:scale-105 shadow-md hover:shadow-xl"
          >
            Join on GzoneSphere <span className="font-serif text-[16px] leading-none">→</span>
          </a>
        </div>

        {/* Right: social icons */}
        <div className="flex items-center gap-4 md:gap-6 relative z-10 flex-wrap justify-center">
          {(community.links || []).map((social, idx) => (
            <a
              key={social.key}
              href={social.href}
              title={social.key}
              className="gp-card !p-0 w-16 h-16 flex items-center justify-center group/icon relative overflow-hidden bg-[var(--theme-card)]"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <span
                className="relative z-10 text-[11px] font-black group-hover/icon:scale-110 transition-transform"
                style={{ color: social.color || 'var(--gp-primary)' }}
              >
                {social.label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
