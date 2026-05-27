import { motion } from 'framer-motion';
import SectionOverline from './shared/SectionOverline';
import SectionHeading from './shared/SectionHeading';

const STATS = [
  { value: '280', label: 'Members online now', color: 'var(--home-tourney-accent)' },
  { value: '12', label: 'Tournaments active today', color: 'var(--home-community-accent)' },
  { value: '47', label: 'Skills verified this week', color: 'var(--home-profile-accent)' },
  { value: '1.2k', label: 'Community posts today', color: 'var(--home-games-accent)' },
];

const ACTIVITY = [
  'Riya verified her Concept Art skill · 2m ago',
  'viper_pro registered for Winter Showdown · 5m ago',
  'devkumar posted in Dev branch · 8m ago',
  'New blog: Top 10 Valorant Agents 2026 · 12m ago',
  'Art contest winner announced · 15m ago',
  'gamedev_raj completed a collaboration · 20m ago',
  'New tournament: BGMI Summer Open · 25m ago',
];

export default function LiveActivitySection() {
  return (
    <section className="section-grey">
      <div className="container-global">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <SectionOverline>Right Now</SectionOverline>
          <SectionHeading>It's already happening.</SectionHeading>
          <p className="mt-4 text-base" style={{ color: 'var(--theme-text-muted)' }}>
            Real activity. Real members. The platform is live and growing.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              className="bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl p-6 text-center"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <p
                className="mb-1"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2.25rem',
                  fontWeight: 900,
                  lineHeight: 1,
                  color: s.color,
                }}
              >
                {s.value}
              </p>
              <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="overflow-x-auto pb-2 scroll-strip">
          <div className="flex gap-3" style={{ width: 'max-content' }}>
            {ACTIVITY.map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-lg px-3 py-2 whitespace-nowrap"
              >
                <span className="w-2 h-2 rounded-full bg-[var(--status-success)] shadow-[0_0_8px_var(--status-success)] shrink-0" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
                <span className="text-xs" style={{ color: 'var(--theme-text)' }}>{a}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
