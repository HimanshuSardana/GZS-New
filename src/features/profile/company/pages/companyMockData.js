// ─────────────────────────────────────────────────────────────────────────────
// COMPANY MOCK DATA  —  Part 4 spec
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_COMPANY = {
  id: 'co_001',
  slug: 'nexus-interactive',
  name: 'Nexus Interactive',
  logo: null,                        // null → falls back to initial letter
  is_verified: true,
  type: 'Studio',                    // Studio | Publisher | Esports Org | Platform | Agency | Indie | Educational
  founding_year: 2018,
  size_range: '51-200',              // 1-10 | 11-50 | 51-200 | 201-500 | 500+
  hq_city: 'Bangalore',
  hq_country: 'India',
  remote_friendly: true,
  website: 'https://nexus-interactive.gg',
  social_links: {
    twitter:  'https://x.com/nexusinteractive',
    linkedin: 'https://linkedin.com/company/nexus-interactive',
    youtube:  'https://youtube.com/@nexusinteractive',
    instagram:'https://instagram.com/nexusinteractive',
    discord:  'https://discord.gg/nexusinteractive',
  },
  description:
    'Nexus Interactive is an AAA-tier game studio headquartered in Bangalore, crafting immersive digital worlds that push the boundaries of interactive storytelling. Our multidisciplinary team of over 120 specialists spans game engineering, narrative design, competitive esports, and live-service operations.',
  mission:
    'Democratise world-class game development by empowering diverse creators with verifiable skill and transparent opportunity.',
  shipped_titles: [
    { title: 'GENESIS_PRIME',  year: 2020, platforms: ['PC', 'Console'] },
    { title: 'VOID_RUNNER',    year: 2021, platforms: ['PC', 'Mobile'] },
    { title: 'ECHOES_OF_WAR',  year: 2022, platforms: ['PC', 'Console', 'VR'] },
    { title: 'NEON_DRIFT',     year: 2023, platforms: ['Mobile', 'Web'] },
    { title: 'SPECTRE_ONLINE', year: 2024, platforms: ['PC', 'Console'] },
    { title: 'ARENA_NEXUS',    year: 2024, platforms: ['PC'] },
  ],
  awards: [
    'Best Indie Studio — GDC 2022',
    'Excellence in Gameplay Design — BAFTA Games 2023',
    'Top 10 Most Innovative Studios — NASSCOM 2024',
    'Best Multiplayer Experience — IGN Awards 2024',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// OPEN ROLES  (5 roles × 5 domains)
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_OPEN_ROLES = [
  {
    id: 'role_001',
    title: 'Senior Game Engineer',
    domain: 'Development',
    skills: ['C++', 'Unreal Engine 5', 'Gameplay Systems', 'Multiplayer'],
    experience_level: 'Senior',
    location: 'Bangalore',
    is_remote: false,
    salary_disclosed: true,
    salary: '₹30L – ₹48L / yr',
    apply_url: 'https://nexus-interactive.gg/careers/senior-game-engineer',
  },
  {
    id: 'role_002',
    title: 'Lead UX Designer',
    domain: 'Art & Design',
    skills: ['Figma', 'User Research', 'HUD Design', 'Prototyping'],
    experience_level: 'Lead',
    location: 'Remote',
    is_remote: true,
    salary_disclosed: true,
    salary: '₹22L – ₹36L / yr',
    apply_url: 'https://nexus-interactive.gg/careers/lead-ux-designer',
  },
  {
    id: 'role_003',
    title: 'Esports Community Manager',
    domain: 'Esports',
    skills: ['Tournament Ops', 'Discord', 'Twitch', 'Player Relations'],
    experience_level: 'Mid',
    location: 'Remote',
    is_remote: true,
    salary_disclosed: false,
    salary: null,
    apply_url: 'https://nexus-interactive.gg/careers/esports-cm',
  },
  {
    id: 'role_004',
    title: 'Narrative Writer',
    domain: 'Writing',
    skills: ['Game Narrative', 'World Building', 'Dialogue Systems', 'Ink/Twine'],
    experience_level: 'Mid',
    location: 'Pune',
    is_remote: false,
    salary_disclosed: true,
    salary: '₹12L – ₹20L / yr',
    apply_url: 'https://nexus-interactive.gg/careers/narrative-writer',
  },
  {
    id: 'role_005',
    title: 'Audio Designer',
    domain: 'Audio',
    skills: ['FMOD', 'Wwise', 'Sound Design', 'Procedural Audio'],
    experience_level: 'Junior',
    location: 'Remote',
    is_remote: true,
    salary_disclosed: true,
    salary: '₹8L – ₹14L / yr',
    apply_url: 'https://nexus-interactive.gg/careers/audio-designer',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TEAM MEMBERS  (4 linked GZS profiles)
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_TEAM_MEMBERS = [
  {
    id: 'user_001',
    username: 'ArjunKumar',
    role_at_company: 'CTO',
    avatar: null,
    domain_badges: ['dev', 'esports'],
    is_verified_employee: true,
    profile_url: '/u/ArjunKumar',
  },
  {
    id: 'user_002',
    username: 'Priya_Designs',
    role_at_company: 'Lead UX Designer',
    avatar: null,
    domain_badges: ['art'],
    is_verified_employee: true,
    profile_url: '/u/Priya_Designs',
  },
  {
    id: 'user_003',
    username: 'Rahul_GG',
    role_at_company: 'Esports Ops Manager',
    avatar: null,
    domain_badges: ['esports', 'content'],
    is_verified_employee: true,
    profile_url: '/u/Rahul_GG',
  },
  {
    id: 'user_004',
    username: 'SoundScapeZ',
    role_at_company: 'Senior Audio Designer',
    avatar: null,
    domain_badges: ['audio'],
    is_verified_employee: false,
    profile_url: '/u/SoundScapeZ',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY FEED  (mixed types)
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_ACTIVITY_FEED = [
  {
    id: 'act_001',
    type: 'blog',
    title: 'How we built procedural audio for SPECTRE_ONLINE',
    date: '2026-04-20',
    engagement: 312,
  },
  {
    id: 'act_002',
    type: 'job',
    title: 'New role open: Senior Game Engineer',
    date: '2026-04-18',
    engagement: 87,
  },
  {
    id: 'act_003',
    type: 'tournament',
    title: 'Nexus is a gold sponsor of GZS_INVITATIONAL_S2',
    date: '2026-04-15',
    engagement: 540,
  },
  {
    id: 'act_004',
    type: 'launch',
    title: 'ARENA_NEXUS Early Access is now live on PC',
    date: '2026-04-10',
    engagement: 1204,
  },
  {
    id: 'act_005',
    type: 'blog',
    title: 'Behind the scenes: The Art Direction of Neon Drift',
    date: '2026-04-05',
    engagement: 229,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TALENT POOL  (8 candidates, various pipeline stages)
// ─────────────────────────────────────────────────────────────────────────────

export const TALENT_PIPELINE_STAGES = [
  'Saved',
  'Contacted',
  'In Review',
  'Interview',
  'Offer Sent',
  'Hired',
  'Rejected',
];

export const MOCK_TALENT_POOL = [
  {
    id: 'tp_001',
    name: 'Aditya Sharma',
    username: 'AdityaS',
    domain: 'Development',
    role: 'Game Engineer',
    verified_skills: ['C++', 'Unreal Engine 5', 'Multiplayer'],
    location: 'Bangalore',
    availability: 'Available',
    stage: 'Interview',
    notes: 'Strong Unreal background. Code test submitted. Schedule final round.',
    avatar: null,
  },
  {
    id: 'tp_002',
    name: 'Meera Nair',
    username: 'MeeraN',
    domain: 'Art & Design',
    role: 'UI/UX Designer',
    verified_skills: ['Figma', 'HUD Design', 'Prototyping'],
    location: 'Remote',
    availability: 'Available',
    stage: 'Offer Sent',
    notes: 'Portfolio is excellent. Offer sent 2026-04-22. Awaiting response.',
    avatar: null,
  },
  {
    id: 'tp_003',
    name: 'Karthik Rajan',
    username: 'KarthikR',
    domain: 'Audio',
    role: 'Audio Designer',
    verified_skills: ['FMOD', 'Wwise', 'Sound Design'],
    location: 'Chennai',
    availability: 'Open to offers',
    stage: 'In Review',
    notes: 'Sound samples reviewed. Pending team alignment.',
    avatar: null,
  },
  {
    id: 'tp_004',
    name: 'Shreya Pillai',
    username: 'ShreyaP',
    domain: 'Writing',
    role: 'Narrative Designer',
    verified_skills: ['Game Narrative', 'World Building', 'Dialogue Systems'],
    location: 'Mumbai',
    availability: 'Not available',
    stage: 'Saved',
    notes: 'Great writing sample. Currently at another studio. Follow up Q3.',
    avatar: null,
  },
  {
    id: 'tp_005',
    name: 'Dev Anand',
    username: 'DevAA',
    domain: 'Esports',
    role: 'Tournament Ops',
    verified_skills: ['Tournament Ops', 'Discord', 'Player Relations'],
    location: 'Remote',
    availability: 'Available',
    stage: 'Contacted',
    notes: 'Reached out via LinkedIn on 2026-04-17. Awaiting reply.',
    avatar: null,
  },
  {
    id: 'tp_006',
    name: 'Pooja Menon',
    username: 'PoojaMenon',
    domain: 'Development',
    role: 'Backend Engineer',
    verified_skills: ['Node.js', 'PostgreSQL', 'Microservices'],
    location: 'Hyderabad',
    availability: 'Available',
    stage: 'Hired',
    notes: 'Joined 2026-04-01. Onboarding complete.',
    avatar: null,
  },
  {
    id: 'tp_007',
    name: 'Nikhil Sinha',
    username: 'NikhilS',
    domain: 'Art & Design',
    role: 'Concept Artist',
    verified_skills: ['Blender', 'ZBrush', 'Concept Art'],
    location: 'Delhi',
    availability: 'Open to offers',
    stage: 'Rejected',
    notes: 'Portfolio great but style mismatch with current project direction.',
    avatar: null,
  },
  {
    id: 'tp_008',
    name: 'Ananya Roy',
    username: 'AnanyaRoy',
    domain: 'Content',
    role: 'Content Strategist',
    verified_skills: ['YouTube', 'Twitch', 'Community Growth'],
    location: 'Remote',
    availability: 'Available',
    stage: 'In Review',
    notes: 'Channel metrics solid. Evaluating fit for esports content division.',
    avatar: null,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS MOCK  (dashboard)
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_ANALYTICS = {
  profile_views_30d: 1_840,
  profile_views_90d: 6_210,
  views_by_day_30d: [
    { date: 'Apr 1',  views: 48 },
    { date: 'Apr 3',  views: 62 },
    { date: 'Apr 5',  views: 55 },
    { date: 'Apr 7',  views: 80 },
    { date: 'Apr 9',  views: 91 },
    { date: 'Apr 11', views: 74 },
    { date: 'Apr 13', views: 110 },
    { date: 'Apr 15', views: 98 },
    { date: 'Apr 17', views: 130 },
    { date: 'Apr 19', views: 145 },
    { date: 'Apr 21', views: 160 },
    { date: 'Apr 23', views: 122 },
    { date: 'Apr 25', views: 178 },
    { date: 'Apr 27', views: 200 },
    { date: 'Apr 29', views: 187 },
  ],
  source_breakdown: [
    { source: 'Discovery',  value: 42 },
    { source: 'Job Listing', value: 28 },
    { source: 'Direct Link', value: 18 },
    { source: 'Social',      value: 12 },
  ],
  talent_pool_by_role: [
    { role: 'Game Engineer',  count: 24 },
    { role: 'UX Designer',    count: 18 },
    { role: 'Audio Designer', count: 9  },
    { role: 'Narrative',      count: 12 },
    { role: 'Esports Ops',    count: 7  },
  ],
  applications_per_role: [
    { role: 'Senior Game Engineer', count: 31 },
    { role: 'Lead UX Designer',     count: 22 },
    { role: 'Esports CM',           count: 47 },
    { role: 'Narrative Writer',     count: 18 },
    { role: 'Audio Designer',       count: 14 },
  ],
  top_skills: [
    { skill: 'Unreal Engine 5', count: 38 },
    { skill: 'Figma',           count: 29 },
    { skill: 'C++',             count: 27 },
    { skill: 'FMOD',            count: 21 },
    { skill: 'Discord',         count: 19 },
  ],
  conversion_rate: 4.7,   // %  profile views → role page views
};

// ─────────────────────────────────────────────────────────────────────────────
// COMMUNITY BRANCH TRAFFIC SOURCES  (GET /companies/{slug}/analytics/sources)
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_BRANCH_SOURCES = [
  { branch: 'Dev',          slug: 'dev',      views: 412, color: 'var(--domain-dev,      #14B8A6)' },
  { branch: 'Esports',      slug: 'esports',  views: 338, color: 'var(--domain-esports,  #EF4444)' },
  { branch: 'Content',      slug: 'content',  views: 290, color: 'var(--domain-content,  #F59E0B)' },
  { branch: 'Art',          slug: 'art',      views: 224, color: 'var(--domain-art,       #EC4899)' },
  { branch: 'Writing',      slug: 'writing',  views: 180, color: 'var(--domain-writing,   #22C55E)' },
  { branch: 'Audio',        slug: 'audio',    views: 140, color: 'var(--domain-audio,     #64748B)' },
  { branch: 'Business',     slug: 'business', views: 118, color: 'var(--domain-business,  #3B82F6)' },
  { branch: 'General',      slug: 'general',  views:  96, color: '#94A3B8' },
  { branch: 'Direct/Other', slug: 'direct',   views:  42, color: '#CBD5E1' },
];
