// ─────────────────────────────────────────────────────────────────────────────
// PROGRESSION, LEVELS & TRUST SYSTEM — Part 11 mock data
// Display-only. No backend calculations.
// ─────────────────────────────────────────────────────────────────────────────

// ── Level definitions ────────────────────────────────────────────────────────
export const LEVEL_DEFINITIONS = [
  {
    id: 'Beginner',
    label: 'Beginner',
    tooltip: 'Default level on signup. Keep engaging to level up!',
    xpRequired: 0,
    color: { bg: '#64748b', text: '#ffffff' },          // slate
  },
  {
    id: 'Hustler',
    label: 'Hustler',
    tooltip: 'Active 60+ min/day for 20 consecutive days',
    xpRequired: 500,
    color: { bg: '#10b981', text: '#ffffff' },          // emerald
  },
  {
    id: 'Extreme',
    label: 'Extreme',
    tooltip: 'Active 97+ min/day for 37 consecutive days after Hustler',
    xpRequired: 2_000,
    color: { bg: '#f97316', text: '#ffffff' },          // orange
  },
  {
    id: 'Pro',
    label: 'Pro',
    tooltip: 'Win a monthly platform tournament — max 12 Pros per year per game',
    xpRequired: 6_000,
    color: { bg: 'linear-gradient(135deg,#f59e0b,#eab308)', text: '#1c1917' }, // gold gradient
    hasStar: true,
  },
];

// ── XP Sources table ─────────────────────────────────────────────────────────
export const XP_SOURCES = [
  { action: 'Daily login',                               xp: 10,  cap: 'Once per day'      },
  { action: 'Message receives reaction',                 xp: 5,   cap: 'Max 50 XP/day'     },
  { action: 'Showcase post gets saves',                  xp: 20,  cap: 'Max 100 XP/day'    },
  { action: 'Answer marked helpful in #help',            xp: 30,  cap: 'Max 90 XP/day'     },
  { action: 'Host or attend platform event',             xp: 50,  cap: 'Max 2 events/day'  },
  { action: 'Complete verified collaboration',           xp: 100, cap: 'No cap'             },
  { action: 'Get a skill verified',                      xp: 150, cap: 'No cap'             },
  { action: 'Blog post gets featured',                   xp: 200, cap: 'No cap'             },
  { action: 'Refer new user (creates sub-profile)',      xp: 75,  cap: 'Max 10/month'       },
];

// ── Trust score breakdown ─────────────────────────────────────────────────────
export const MOCK_TRUST_BREAKDOWN = {
  total: 7.4,
  components: [
    { name: 'Verified skills',          weight: '30%', score: 8.2  },
    { name: 'Community contributions',  weight: '25%', score: 7.8  },
    { name: 'Report history',           weight: '−15%', score: -0.3 },
    { name: 'Account age',              weight: '10%', score: 6.5  },
    { name: 'Collaboration rate',       weight: '15%', score: 9.0  },
    { name: 'Referral quality',         weight: '10%', score: 7.1  },
    { name: 'Admin adjustments',        weight: '—',   score: 0.0  },
  ],
};

// ── XP history / activity log ─────────────────────────────────────────────────
export const MOCK_XP_HISTORY = [
  { id: 'xp_01', date: '2026-04-29', action: 'Daily login',                     xp: +10,  type: 'gain'   },
  { id: 'xp_02', date: '2026-04-28', action: 'Skill verified: Unreal Engine 5', xp: +150, type: 'gain'   },
  { id: 'xp_03', date: '2026-04-27', action: 'Answer marked helpful in #help',  xp: +30,  type: 'gain'   },
  { id: 'xp_04', date: '2026-04-26', action: 'Verified collaboration completed', xp: +100, type: 'gain'   },
  { id: 'xp_05', date: '2026-04-25', action: 'Daily login',                     xp: +10,  type: 'gain'   },
  { id: 'xp_06', date: '2026-04-24', action: 'Blog post featured',              xp: +200, type: 'gain'   },
  { id: 'xp_07', date: '2026-04-23', action: 'Attended platform event',         xp: +50,  type: 'gain'   },
  { id: 'xp_08', date: '2026-04-22', action: 'Referred new user (ArjunKumar)',  xp: +75,  type: 'gain'   },
  { id: 'xp_09', date: '2026-04-20', action: 'Report filed by another user',   xp: -20,  type: 'loss'   },
  { id: 'xp_10', date: '2026-04-18', action: 'Message received 5 reactions',   xp: +25,  type: 'gain'   },
  { id: 'xp_11', date: '2026-04-15', action: 'Showcase post saved 3×',         xp: +60,  type: 'gain'   },
  { id: 'xp_12', date: '2026-04-10', action: 'Admin trust adjustment',         xp: +0,   type: 'system' },
];

// ── Current user XP snapshot ──────────────────────────────────────────────────
export const MOCK_USER_XP = {
  totalXP:      1_240,
  currentLevel: 'Hustler',
  nextLevel:    'Extreme',
  xpForNext:    2_000,
  xpProgress:   1_240,   // out of xpForNext
};
