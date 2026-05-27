import { Link, NavLink } from 'react-router-dom';
import { FiTwitter, FiYoutube, FiInstagram, FiGlobe, FiMoon } from 'react-icons/fi';
import { FaDiscord } from 'react-icons/fa';
import { SiTiktok } from 'react-icons/si';
import GzsLogo from './GzsLogo';

/**
 * Footer Component — Production Grade
 * 5 Columns: Brand | Platform | Company | Support | Legal
 * Responsive: 1 Col (Mobile) -> 2 Col (Tablet) -> 5 Col (Desktop)
 */
function Footer() {
  const currentYear = 2026;

  const socialLinks = [
    { icon: FiTwitter, href: '#', label: 'Twitter' },
    { icon: FaDiscord, href: '#', label: 'Discord' },
    { icon: FiInstagram, href: '#', label: 'Instagram' },
    { icon: SiTiktok, href: '#', label: 'TikTok' },
    { icon: FiYoutube, href: '#', label: 'YouTube' },
  ];

  const columns = [
    {
      title: 'Platform',
      links: [
        { name: 'Home', path: '/' },
        { name: 'Games', path: '/games' },
        { name: 'Blogs', path: '/blog' },
        { name: 'Tournaments', path: '/tournaments' },
        { name: 'Discovery', path: '/discovery' },
        { name: 'Community', path: '/community' },
      ]
    },
    {
      title: 'Company',
      links: [
        { name: 'About', path: '/about' },
        { name: 'Careers', path: '/career' },
        { name: 'Press', path: '/press' },
        { name: 'Sponsors', path: '/sponsors' },
        { name: 'Partners', path: '/partners' },
      ]
    },
    {
      title: 'Support',
      links: [
        { name: 'Contact', path: '/contact' },
        { name: 'Help Center', path: '/help' },
        { name: 'Bug Report', path: '/report-bug' },
        { name: 'Community Guidelines', path: '/guidelines' },
        { name: 'Status Page', path: '/status' },
      ]
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy Policy', path: '/privacy' },
        { name: 'Terms of Service', path: '/terms' },
        { name: 'Cookie Policy', path: '/cookies' },
        { name: 'GDPR Request', path: '/gdpr' },
      ]
    }
  ];

  return (
    <footer className="w-full bg-[var(--theme-bg-section)] border-t border-[var(--theme-border)]">
      <div className="container-global py-12 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          
          {/* Column 1: Brand */}
          <div className="space-y-6 lg:col-span-1">
            <Link to="/" className="inline-block" aria-label="GzoneSphere Home">
              <GzsLogo variant="auto" size={36} showText={true} />
            </Link>
            <p className="text-sm text-[var(--theme-text-muted)] leading-relaxed">
              One platform. Every role in gaming. Join the next generation of gaming communities.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] text-[var(--theme-text-muted)] transition-all hover:border-[var(--theme-primary)] hover:text-[var(--theme-primary)]"
                    aria-label={social.label}
                  >
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Dynamic Columns 2-5 */}
          {columns.map((col) => (
            <div key={col.title} className="space-y-5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--theme-text)] opacity-40">
                {col.title}
              </h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.name}>
                    <NavLink
                      to={link.path}
                      className={({ isActive }) => 
                        `text-sm font-bold transition-colors hover:text-[var(--theme-primary)] ${
                          isActive ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-text-muted)]'
                        }`
                      }
                    >
                      {link.name}
                    </NavLink>
                  </li>
                ))}
                {col.title === 'Legal' && (
                  <li className="pt-2 text-xs font-medium text-[var(--theme-text-muted)] opacity-50">
                    © {currentYear} GzoneSphere
                  </li>
                )}
              </ul>
            </div>
          ))}

        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-[var(--theme-border)]/50 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--theme-text-muted)] opacity-60">
            Crafted for the gaming community. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            {/* Language Selector Stub */}
            <button 
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--theme-border)] text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] hover:border-[var(--theme-primary)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
              aria-label="Select Language"
            >
              <FiGlobe size={12} />
              English
            </button>
            
            {/* Theme Toggle Stub */}
            <button 
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--theme-border)] text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] hover:border-[var(--theme-primary)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
              aria-label="Toggle Theme"
            >
              <FiMoon size={12} />
              Dark
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;





