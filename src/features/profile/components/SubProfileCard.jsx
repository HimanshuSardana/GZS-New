import { Link } from 'react-router-dom';
import {
  FiCode, FiAward, FiVideo, FiBriefcase, FiEdit2, FiFeather, FiMusic, FiChevronRight
} from 'react-icons/fi';

const DOMAIN_META = {
  dev:      { label: 'Dev',      color: '#14B8A6', Icon: FiCode },
  esports:  { label: 'Esports',  color: '#EF4444', Icon: FiAward },
  content:  { label: 'Content',  color: '#F59E0B', Icon: FiVideo },
  business: { label: 'Business', color: '#3B82F6', Icon: FiBriefcase },
  art:      { label: 'Art',      color: '#EC4899', Icon: FiEdit2 },
  writing:  { label: 'Writing',  color: '#22C55E', Icon: FiFeather },
  audio:    { label: 'Audio',    color: '#64748B', Icon: FiMusic },
};

function getStatusConfig(isActive) {
  if (isActive === true)  return { label: 'Active',   dot: '#22C55E', text: '#16A34A' };
  if (isActive === false) return { label: 'Dormant',  dot: '#94A3B8', text: '#64748B' };
  return                           { label: 'Idle',     dot: '#F59E0B', text: '#D97706' };
}

export default function SubProfileCard({ subProfile, isOwn, username, skills = [], isLocked = false }) {
  const domainKey = subProfile.type || subProfile.domain || 'dev';
  const meta = DOMAIN_META[domainKey] || DOMAIN_META.dev;
  const { Icon } = meta;
  const status = getStatusConfig(subProfile.is_active);
  const orderedSkills = [...skills].sort((a, b) => Number(b.verified ?? b.is_verified) - Number(a.verified ?? a.is_verified)).slice(0, 3);
  const verifiedCount = skills.filter(s => s.verified ?? s.is_verified).length;

  return (
    <article
      className={`domain-shard-card${isLocked ? ' blur-sm pointer-events-none' : ''}`}
      style={{ borderTop: `4px solid ${meta.color}` }}
    >
      <div className="p-[18px]">
        {/* Header row: icon + status */}
        <div className="flex justify-between items-start mb-3.5">
          <div
            className="flex items-center justify-center rounded-xl"
            style={{ width: 44, height: 44, background: `${meta.color}1A`, color: meta.color }}
          >
            <Icon size={22} />
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: status.text }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.dot }} />
            {status.label}
          </div>
        </div>

        {/* Role & handle */}
        <div className="text-lg font-extrabold tracking-tight mb-0.5" style={{ color: '#0F172A', letterSpacing: '-0.01em' }}>
          {subProfile.primary_role || subProfile.username}
        </div>
        <div className="text-xs font-medium mb-3" style={{ color: meta.color }}>
          @{subProfile.username}
        </div>

        {/* Skill chips */}
        {orderedSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3.5">
            {orderedSkills.map((skill) => (
              <span
                key={skill.id}
                className={(skill.verified ?? skill.is_verified) ? 'chip-verified' : ''}
                style={
                  !(skill.verified ?? skill.is_verified)
                    ? { display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#F1F5F9', color: '#475569' }
                    : {}
                }
              >
                {skill.name}
              </span>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div
          className="flex justify-between text-xs pt-3"
          style={{ borderTop: '1px solid #F1F5F9', color: '#64748B' }}
        >
          <span>
            <b style={{ color: '#0F172A' }}>{verifiedCount}</b> verified skills
          </span>
          <span>
            <b style={{ color: '#0F172A' }}>{subProfile.projects_count ?? 0}</b> projects
          </span>
        </div>
      </div>

      {/* Card footer */}
      <div className="domain-shard-card-footer">
        <Link
          to={isOwn ? `/profile/${domainKey}` : `/u/${username || subProfile.username}`}
          className="flex items-center gap-1 text-sm font-semibold"
          style={{ color: meta.color }}
        >
          Open Sub-Profile <FiChevronRight size={13} />
        </Link>
        {isOwn && (
          <Link
            to={`/profile/${domainKey}/edit`}
            className="flex items-center justify-center rounded-lg transition hover:bg-slate-200"
            style={{ width: 28, height: 28, color: '#64748B' }}
          >
            <FiEdit2 size={13} />
          </Link>
        )}
      </div>
    </article>
  );
}
