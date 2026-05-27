import { motion } from 'framer-motion';
import { FiBriefcase } from 'react-icons/fi';

const STAT_COLORS = {
  skills:      '#1D6ADB',
  subProfiles: '#7C3AED',
  network:     '#14B8A6',
  collabs:     '#F59E0B',
  companies:   '#3B82F6',
  reputation:  '#22C55E',
};

function StatTile({ label, value, color, icon: Icon, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      className="stats-tile-lg"
    >
      {Icon && <Icon size={14} style={{ color, marginBottom: 2 }} />}
      <div className="stats-tile-lg-value" style={{ color }}>{value}</div>
      <div className="stats-tile-lg-label">{label}</div>
    </motion.div>
  );
}

export default function AggregateStatsRow({
  masterProfile,
  subProfiles = [],
  skills = [],
  friends = [],
  followers = [],
  vertical = false,
}) {
  const stats = [
    {
      key: 'skills',
      label: 'Verified Skills',
      value: masterProfile?.verified_skills_count ?? skills.filter((s) => s.verified ?? s.is_verified).length ?? 0,
    },
    {
      key: 'subProfiles',
      label: 'Active Sub-Profiles',
      value: subProfiles?.length ?? masterProfile?.sub_profiles?.length ?? 0,
    },
    {
      key: 'network',
      label: 'Network Reach',
      value: (masterProfile?.friends_count ?? friends?.length ?? 0) + (masterProfile?.followers_count ?? followers?.length ?? 0),
    },
    {
      key: 'collabs',
      label: 'Collaborations',
      value: masterProfile?.collaborations_count ?? 0,
    },
    {
      key: 'companies',
      icon: FiBriefcase,
      label: 'Companies',
      value: masterProfile?.companies_count ?? 0,
      color: '#3B82F6',
    },
    {
      key: 'reputation',
      label: 'Reputation',
      value: masterProfile?.reputation_score ?? masterProfile?.trust_score ?? 0,
    },
  ];

  return (
    <section className={vertical ? 'space-y-3' : 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6'}>
      {stats.map((stat, index) => (
        <StatTile
          key={stat.key}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          color={stat.color || STAT_COLORS[stat.key]}
          delay={index * 0.07}
        />
      ))}
    </section>
  );
}
