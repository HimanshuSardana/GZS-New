import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMonitor, FiBookOpen, FiAward, FiUser, FiUsers, FiBriefcase } from 'react-icons/fi';
import SectionOverline from './shared/SectionOverline';
import SectionHeading from './shared/SectionHeading';

const SECTIONS = [
  {
    title: 'Games',
    desc: 'Every game, one hub. Detailed GamePost pages with storylines, guides, specs, and community.',
    stat: '340+ games',
    link: '/games',
    accent: 'var(--home-games-accent)',
    iconBg: 'var(--home-games-bg)',
    Icon: FiMonitor,
  },
  {
    title: 'Blogs & Guides',
    desc: 'The editorial layer. Reviews, analysis, health guides, industry news — written for gamers.',
    stat: '850+ articles',
    link: '/blog',
    accent: 'var(--blog-amber)',
    iconBg: 'var(--theme-primary-soft)',
    Icon: FiBookOpen,
  },
  {
    title: 'Tournaments',
    desc: 'Compete for real. From casual brackets to championship cups. Esports, art, writing, and more.',
    stat: '12 active tournaments',
    link: '/tournaments',
    accent: 'var(--home-tourney-accent)',
    iconBg: 'var(--home-tourney-bg)',
    Icon: FiAward,
  },
  {
    title: 'Profiles',
    desc: 'Your verified gaming identity. One master profile. Seven domain sub-profiles. Skills that prove themselves.',
    stat: 'How it works →',
    link: '/profile/how-it-works',
    accent: 'var(--home-profile-accent)',
    iconBg: 'var(--home-profile-bg)',
    Icon: FiUser,
  },
  {
    title: 'Community',
    desc: 'Find your people. Nine domain branches. Real-time chat, LFG boards, showcase, events.',
    stat: '280 members online',
    link: '/community',
    accent: 'var(--home-community-accent)',
    iconBg: 'var(--home-community-bg)',
    Icon: FiUsers,
  },
  {
    title: 'Career',
    desc: 'Turn passion into profession. Jobs, playtesting, mentorship — all gaming-focused.',
    stat: 'Coming Phase 2 →',
    link: '#',
    accent: 'var(--theme-text-muted)',
    iconBg: 'var(--theme-bg-alt)',
    Icon: FiBriefcase,
    comingSoon: true,
  },
];

export default function PlatformSections() {
  return (
    <section className="section-grey">
      <div className="container-global">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <SectionOverline>What's on GzoneSphere</SectionOverline>
          <SectionHeading>Everything you need. All in one place.</SectionHeading>
          <p className="mt-4 text-base md:text-lg" style={{ color: 'var(--theme-text-muted)' }}>
            Six interconnected sections, all connected through your profile.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SECTIONS.map((s, i) => (
            <motion.div
              key={s.title}
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
            >
              <Link to={s.link} className="gzs-card-elevated block cursor-pointer h-full">
                {s.comingSoon && (
                  <span
                    className="absolute top-4 right-4 text-xs font-semibold px-2 py-0.5 rounded bg-[var(--status-warning-soft)] text-[var(--status-warning)]"
                  >
                    Phase 2
                  </span>
                )}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: s.iconBg }}
                >
                  <s.Icon size={26} style={{ color: s.accent }} />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--theme-text)' }}>{s.title}</h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--theme-text-muted)' }}>{s.desc}</p>
                <span className="text-xs font-semibold" style={{ color: s.accent }}>{s.stat}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
