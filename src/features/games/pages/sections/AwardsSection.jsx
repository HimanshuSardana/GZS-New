import { FiAward } from 'react-icons/fi';

export default function AwardsSection({ awards }) {
  if (!awards || awards.length === 0) return null;

  return (
    <section className="gp-content-section">
      <div className="gp-animate-in">
        <span className="gp-section-label flex items-center gap-3">
          <span className="w-8 h-[2px] bg-[var(--gp-primary)]" />
          RECOGNITION
        </span>
        <h2 className="gp-section-heading">
          AWARDS
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {awards.map((a, i) => (
          <div
            key={`award-${i}`}
            className="gp-card flex items-start gap-5 group gp-animate-in"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="w-12 h-12 shrink-0 flex items-center justify-center rounded-xl bg-[var(--theme-bg-section)] group-hover:bg-[var(--gp-primary)] transition-colors duration-300">
              <FiAward
                size={20}
                className="text-[var(--gp-primary)] group-hover:text-white transition-colors duration-300"
              />
            </div>
            <p className="text-base font-bold text-[var(--theme-text)] leading-relaxed pt-1">
              {a.aa_pt}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
