import { motion } from 'framer-motion';
import SectionOverline from './shared/SectionOverline';
import SectionHeading from './shared/SectionHeading';

const PILLARS = [
  { title: 'Competitive Esports', desc: 'Tournaments, leagues, and ranking systems for every level', coming: false },
  { title: 'Vibrant Communities', desc: 'Structured branches that replace Discord chaos with organised engagement', coming: false },
  { title: 'Career Opportunities', desc: 'Job boards, playtesting gigs, and professional pathways for gaming careers', coming: false },
  { title: 'Universal Profiles', desc: 'One identity that follows you everywhere, showcasing achievements and verified skills', coming: false },
  { title: 'Creator Economy', desc: 'Publish blogs, share clips, create music, and monetise your content', coming: false },
  { title: 'Brand Partnerships', desc: 'Direct connections between companies and engaged gaming audiences', coming: false },
  { title: 'Dynamic Marketplace', desc: 'Buy, sell, and discover gaming products, art, and accessories', coming: true },
  { title: 'Gaming Dating', desc: 'Matchmaking that celebrates gaming culture and connects people through shared passions', coming: true },
];

export default function SolutionSection() {
  return (
    <section className="section-white">
      <div className="container-global">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mb-14"
        >
          <SectionOverline>The Solution</SectionOverline>
          <SectionHeading>One platform. Everything gaming.</SectionHeading>
          <p className="mt-4 text-base md:text-lg leading-relaxed max-w-[65ch]" style={{ color: 'var(--theme-text-muted)' }}>
            GzoneSphere ends gaming fragmentation by uniting every part of the gaming experience into one seamless ecosystem.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.title}
              className="relative gzs-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              {p.coming && (
                <span
                  className="absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded bg-[var(--status-warning-soft)] text-[var(--status-warning)]"
                >
                  Coming Soon
                </span>
              )}
              <h3 className="text-base font-bold mb-1" style={{ color: 'var(--theme-text)' }}>{p.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
