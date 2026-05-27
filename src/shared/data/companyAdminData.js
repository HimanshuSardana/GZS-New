// ── Company Admin Mock Data ───────────────────────────────────────────────────

export const COMPANY_TYPES = ['Studio', 'Publisher', 'Esports Org', 'Platform', 'Agency', 'Indie', 'Educational'];
export const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];

export const MOCK_PENDING = [
  {
    id: 'p1', name: 'Pixel Forge Studios', type: 'Studio',
    submittedBy: 'arjun_menon', submittedDate: '2026-04-27',
    domainEmail: 'arjun@pixelforge.io', domainVerified: true,
    website: 'https://pixelforge.io',
    description: 'An indie studio focused on narrative-driven RPGs for PC and console.',
    logo: 'PF', hq: 'Bangalore, India',
    socials: { twitter: 'https://twitter.com/pixelforge', linkedin: 'https://linkedin.com/company/pixelforge' },
    size: '11-50',
  },
  {
    id: 'p2', name: 'Nova Esports', type: 'Esports Org',
    submittedBy: 'riya_sharma', submittedDate: '2026-04-26',
    domainEmail: 'riya@novaesports.gg', domainVerified: false,
    website: 'https://novaesports.gg',
    description: 'Competitive esports organization with teams in Valorant and CS2.',
    logo: 'NE', hq: 'Mumbai, India',
    socials: { twitter: 'https://twitter.com/novaesports', youtube: 'https://youtube.com/@novaesports' },
    size: '51-200',
  },
  {
    id: 'p3', name: 'Horizon Publishing', type: 'Publisher',
    submittedBy: 'dev_kapoor', submittedDate: '2026-04-25',
    domainEmail: 'dev@horizonpub.com', domainVerified: true,
    website: 'https://horizonpub.com',
    description: 'Mid-sized publisher specialising in mobile and cross-platform releases.',
    logo: 'HP', hq: 'Singapore',
    socials: { linkedin: 'https://linkedin.com/company/horizonpub' },
    size: '51-200',
  },
];

export const MOCK_ACTIVE = [
  {
    id: 'a1', name: 'Nexus Interactive', type: 'Studio', size: '51-200',
    hq: 'Hyderabad, India', country: 'India',
    verified: true, views30d: 1840, openRoles: 5, talentPool: 70,
    logo: 'NI', slug: 'nexus-interactive',
    suspendedAt: null,
  },
  {
    id: 'a2', name: 'Storm Games', type: 'Publisher', size: '201-500',
    hq: 'Dubai, UAE', country: 'UAE',
    verified: true, views30d: 3200, openRoles: 12, talentPool: 140,
    logo: 'SG', slug: 'storm-games',
    suspendedAt: null,
  },
  {
    id: 'a3', name: 'CloudPlay Platform', type: 'Platform', size: '500+',
    hq: 'Singapore', country: 'Singapore',
    verified: false, views30d: 980, openRoles: 3, talentPool: 29,
    logo: 'CP', slug: 'cloudplay',
    suspendedAt: null,
  },
  {
    id: 'a4', name: 'LevelUp Agency', type: 'Agency', size: '11-50',
    hq: 'Delhi, India', country: 'India',
    verified: true, views30d: 540, openRoles: 2, talentPool: 18,
    logo: 'LA', slug: 'levelup-agency',
    suspendedAt: null,
  },
  {
    id: 'a5', name: 'BitForge Indie', type: 'Indie', size: '1-10',
    hq: 'Chennai, India', country: 'India',
    verified: false, views30d: 210, openRoles: 1, talentPool: 7,
    logo: 'BI', slug: 'bitforge-indie',
    suspendedAt: null,
  },
];

export const MOCK_SUSPENDED = [
  {
    id: 's1', name: 'DarkNet Studios', type: 'Studio',
    suspendedDate: '2026-04-10', suspendedBy: 'admin_priya',
    reason: 'Multiple verified skill fraud reports. Pending investigation.',
    logo: 'DS',
  },
  {
    id: 's2', name: 'Ghost Agency', type: 'Agency',
    suspendedDate: '2026-03-28', suspendedBy: 'admin_raj',
    reason: 'Spam job postings — mass-applied to talent pool without consent.',
    logo: 'GA',
  },
];

export const COMPLIANCE_CHECKLIST = [
  'Logo does not contain explicit or offensive imagery',
  'Description is within 800 character limit and free of spam',
  'Website URL is reachable and matches company identity',
  'Company type is correctly classified',
  'No duplicate company profile exists on platform',
];
