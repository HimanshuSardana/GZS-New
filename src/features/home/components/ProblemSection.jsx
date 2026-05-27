import { motion } from 'framer-motion';
import { FiGrid, FiAward, FiEyeOff } from 'react-icons/fi';
import SectionOverline from './shared/SectionOverline';
import SectionHeading from './shared/SectionHeading';

const PROBLEMS = [
  {
    Icon: FiGrid,
    title: 'Scattered Ecosystem',
    body: 'Gamers juggle 5+ platforms for chat, streaming, jobs, and community. No unified identity.',
  },
  {
    Icon: FiAward,
    title: 'No Path to Pro',
    body: 'Tournaments are hard to find. Amateurs get no visibility. There is no structured path from casual player to professional.',
  },
  {
    Icon: FiEyeOff,
    title: 'Creators Go Unnoticed',
    body: 'Niche gaming talent gets sidelined on mainstream platforms. Studios cannot find them. They cannot find studios.',
  },
];

export default function ProblemSection() {
  return (
    <section className="section-grey">
      <div className="container-global">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mb-14"
        >
          <SectionOverline>The Problem</SectionOverline>
          <SectionHeading>Gaming is fragmented. We fixed it.</SectionHeading>
          <p className="mt-4 text-base md:text-lg leading-relaxed max-w-[65ch]" style={{ color: 'var(--theme-text-muted)' }}>
            Despite being a $200B+ industry, gaming remains scattered across dozens of disconnected platforms. Your identity is fragmented. Your opportunities are invisible.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROBLEMS.map((p, i) => (
            <motion.div
              key={p.title}
              className="gzs-card-elevated"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'var(--theme-primary-soft)' }}
              >
                <p.Icon size={22} style={{ color: 'var(--theme-primary)' }} />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--theme-text)' }}>{p.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>{p.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
