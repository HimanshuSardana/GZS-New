const DESCRIPTOR_COLORS = {
  outstanding: '#22C55E',
  excellent: '#22C55E',
  great: '#3B82F6',
  good: '#3B82F6',
  mixed: '#F59E0B',
  poor: '#EF4444',
};

function StarRating({ score }) {
  const raw = (score / 10) * 5;
  const filled = Math.floor(raw);
  const half = raw - filled >= 0.5 ? 1 : 0;
  const empty = 5 - filled - half;

  return (
    <div className="flex gap-0.5 justify-center">
      {Array.from({ length: filled }, (_, i) => (
        <span key={`f${i}`} style={{ color: 'var(--gp-primary)', fontSize: '1.25rem' }}>★</span>
      ))}
      {half === 1 && (
        <span
          style={{
            background: 'linear-gradient(90deg, var(--gp-primary) 50%, var(--gp-border, #E2E8F0) 50%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '1.25rem',
          }}
        >★</span>
      )}
      {Array.from({ length: empty }, (_, i) => (
        <span key={`e${i}`} style={{ color: 'var(--gp-border, #E2E8F0)', fontSize: '1.25rem' }}>★</span>
      ))}
    </div>
  );
}

export default function CriticRatingSection({ score, descriptor, expertReviews = [], gameSlug }) {
  const descriptorColor = descriptor
    ? (DESCRIPTOR_COLORS[descriptor.toLowerCase()] ?? '#6B7280')
    : '#6B7280';

  const writeReviewHref = `/write-blog${gameSlug ? `?game=${gameSlug}` : ''}`;

  return (
    <section className="gp-content-section">
      <div
        className="rounded-3xl border overflow-hidden"
        style={{ borderColor: 'var(--gp-border, #E2E8F0)', background: 'var(--theme-card, #fff)' }}
      >
        {/* Score block */}
        <div className="flex flex-col items-center gap-4 px-8 py-10">
          {score != null ? (
            <>
              <p
                className="text-xs font-black uppercase tracking-wider opacity-60"
                style={{ color: 'var(--gp-primary)' }}
              >
                GZS Score
              </p>

              <div className="flex items-end gap-2 justify-center">
                <span className="gp-score-badge">{score}</span>
                <span className="text-2xl mb-2" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
                  /&nbsp;10
                </span>
              </div>

              <StarRating score={Number(score)} />

              {descriptor && (
                <span
                  className="px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider text-white"
                  style={{ backgroundColor: descriptorColor }}
                >
                  {descriptor}
                </span>
              )}

              <p className="text-sm" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
                GZS Score — based on {expertReviews.length} expert review{expertReviews.length !== 1 ? 's' : ''}
              </p>
            </>
          ) : (
            <p className="text-lg font-semibold" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
              No score yet
            </p>
          )}
        </div>

        {/* CTA block */}
        <div
          className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-6 border-t"
          style={{ borderColor: 'var(--gp-border, #E2E8F0)' }}
        >
          <div>
            <p className="font-bold text-base" style={{ color: 'var(--theme-text, #0F172A)' }}>
              Want to write the critics review?
            </p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--theme-text-muted, #9ca3af)' }}>
              Publish a review blog on GzoneSphere and get featured.
            </p>
          </div>
          <a
            href={writeReviewHref}
            className="shrink-0 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--gp-primary, #E53935)' }}
          >
            Write a Review
          </a>
        </div>
      </div>
    </section>
  );
}
