export const DOMAINS = {
  dev:      { label:'Game Dev',    colour:'#00e5a0', icon:'Code',     route:'dev'      },
  esports:  { label:'Esports',     colour:'#ff4d6d', icon:'Trophy',   route:'esports'  },
  content:  { label:'Content',     colour:'#ff9f2e', icon:'Camera',   route:'content'  },
  business: { label:'Business',    colour:'#3b9eff', icon:'Briefcase',route:'business' },
  art:      { label:'Art',         colour:'#ff6eb4', icon:'Brush',    route:'art'      },
  writing:  { label:'Writing',     colour:'#4ade80', icon:'Edit',     route:'writing'  },
  audio:    { label:'Audio',       colour:'#a78bfa', icon:'Music',    route:'audio'    },
};

export const COMMUNITY_BRANCHES = [
  ...Object.entries(DOMAINS).map(([key, v]) => ({ slug: key, ...v })),
  { slug:'general',   label:'General',   colour:'#818cf8', icon:'Globe'  },
  { slug:'newcomers', label:'Newcomers', colour:'#34d399', icon:'UserPlus'},
];

export const PLATFORM_LEVELS = ['Beginner','Hustler','Extreme','Pro'];

export const ACCOUNT_STATUS = ['Active','Suspended','Banned','Pending'];
