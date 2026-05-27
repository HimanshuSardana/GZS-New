import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function FinalCTASection() {
  return (
    <section className="section-dark">
      <div className="container-global text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <h2
            className="text-white mb-4 uppercase"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 5vw, 4rem)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
            }}
          >
            Your gaming universe starts here.
          </h2>

          <p className="text-lg mb-10 mx-auto max-w-[56ch] text-[var(--theme-text-inverse)]/65 leading-relaxed">
            Whether you play, create, build, or compete — GzoneSphere is the platform gaming has always deserved.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to="/signup" className="gzs-btn-dark" style={{ padding: '1rem 2rem' }}>
              Create Your Free Profile →
            </Link>
            <Link to="/about" className="gzs-btn-ghost-dark" style={{ padding: '1rem 2rem' }}>
              Learn More
            </Link>
          </div>

          <p className="text-sm mb-8 text-[var(--theme-text-inverse)]/40">
            Join 142,000+ members already building their gaming identity.
          </p>

          <div className="flex justify-center gap-4 flex-wrap">
            {['Discord for community', 'LinkedIn for careers', 'Steam for games'].map(s => (
              <span
                key={s}
                className="text-xs px-3 py-1.5 rounded-full bg-[var(--theme-bg-dark)]/10 border border-[var(--theme-border)]/20 text-[var(--theme-text-inverse)]/40"
              >
                {s}
              </span>
            ))}
            <span
              className="text-xs px-3 py-1.5 rounded-full font-semibold bg-[var(--theme-bg-dark)]/20 border border-[var(--theme-border)]/40 text-[var(--theme-text-inverse)]/80"
            >
              All of it. One platform.
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
