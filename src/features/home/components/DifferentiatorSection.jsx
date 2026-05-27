import { motion } from 'framer-motion';
import { FiShield, FiGrid, FiDollarSign, FiLayout } from 'react-icons/fi';
import SectionHeading from './shared/SectionHeading';

const CARDS = [
  {
    Icon: FiShield,
    title: 'One Unified Gaming Identity',
    body: 'A single profile powers tournaments, content, careers, and communities. No more fragmented presence.',
    accent: false,
  },
  {
    Icon: FiGrid,
    title: 'All-in-One Ecosystem',
    body: 'Esports, careers, marketplace, content, art, music, and chat — with cross-feature intelligence that compounds value with every action.',
    accent: false,
  },
  {
    Icon: FiDollarSign,
    title: 'Real Income Pathways',
    body: 'Cash prizes, playtesting gigs, creator tips, marketplace commissions — built to earn, not just engage.',
    accent: true,
  },
  {
    Icon: FiLayout,
    title: 'Structured, Not Chaotic',
    body: 'One organised community hub instead of endless Discord servers. Smart discovery. One identity — no server hopping.',
    accent: false,
  },
];

export default function DifferentiatorSection() {
  return (
    <section className="section-dark">
      <div className="container-global">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <SectionHeading light>What makes GzoneSphere different.</SectionHeading>
          <p className="mt-4 text-base md:text-lg text-[var(--theme-text-inverse)]/65">
            We did not build another app. We built the infrastructure gaming was always missing.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {CARDS.map((c, i) => (
            <motion.div
              key={c.title}
              className="gzs-card-dark rounded-2xl p-7"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{
                  background: c.accent ? 'var(--status-success-soft)' : 'var(--theme-bg-dark)/10',
                }}
              >
                <c.Icon size={20} style={{ color: c.accent ? 'var(--status-success)' : 'var(--theme-text-inverse)' }} />
              </div>
              <h3 className="text-base font-bold mb-2" style={{ color: c.accent ? 'var(--status-success)' : 'var(--theme-text-inverse)' }}>
                {c.title}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--theme-text-inverse)]/60">{c.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
