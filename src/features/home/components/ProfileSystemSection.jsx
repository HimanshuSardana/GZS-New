import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle } from 'react-icons/fi';
import SectionOverline from './shared/SectionOverline';
import SectionHeading from './shared/SectionHeading';
import ProfileCardStack from './shared/ProfileCardStack';

const DOMAINS = [
  { label: 'Game Dev', color: 'var(--theme-primary)', bg: 'var(--theme-primary-soft)' },
  { label: 'Esports', color: 'var(--home-tourney-accent)', bg: 'var(--home-tourney-bg)' },
  { label: 'Content', color: 'var(--home-community-accent)', bg: 'var(--home-community-bg)' },
  { label: 'Business', color: 'var(--home-games-accent)', bg: 'var(--home-games-bg)' },
  { label: 'Art', color: 'var(--home-profile-accent)', bg: 'var(--home-profile-bg)' },
  { label: 'Writing', color: 'var(--home-tourney-accent)', bg: 'var(--home-tourney-bg)' },
  { label: 'Audio', color: 'var(--theme-primary)', bg: 'var(--theme-primary-soft)' },
];

const DIFFERENTIATORS = [
  { label: 'One Unified Identity', desc: 'One profile powers everything — tournaments, content, careers, and communities.' },
  { label: 'Real Income Pathways', desc: 'Cash prizes, playtesting gigs, creator tips, and marketplace commissions.' },
  { label: 'Structured, Not Chaotic', desc: 'One organised hub instead of endless Discord servers. Smart discovery.' },
];

export default function ProfileSystemSection() {
  return (
    <section className="section-white">
      <div className="container-global">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <SectionOverline>The Identity System</SectionOverline>
            <SectionHeading>One profile. Seven dimensions.</SectionHeading>
            <p className="mt-4 text-base md:text-lg max-w-[65ch] mb-6" style={{ color: 'var(--theme-text-muted)', lineHeight: 1.65 }}>
              Your gaming life does not fit one box. GzoneSphere gives you a Master Profile and up to seven domain sub-profiles, each with verified skills and proof of work.
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              {DOMAINS.map(d => (
                <span key={d.label} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: d.bg, color: d.color }}>
                  {d.label}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mb-10">
              <Link to="/onboarding/start" className="gzs-btn-primary">Build Your Profile →</Link>
              <Link to="/profile/how-it-works" className="text-sm font-semibold flex items-center gap-1 hover:underline" style={{ color: 'var(--theme-primary)' }}>
                See How It Works →
              </Link>
            </div>

            <div className="space-y-4">
              {DIFFERENTIATORS.map(d => (
                <div key={d.label} className="flex gap-3 items-start">
                  <FiCheckCircle
                    size={20}
                    style={{ color: 'var(--theme-primary)', flexShrink: 0, marginTop: '2px' }}
                  />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>{d.label}</p>
                    <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>{d.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="hidden lg:block"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <ProfileCardStack />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
