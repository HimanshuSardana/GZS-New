import { NavLink } from 'react-router-dom';
import { FiHash, FiLock, FiVolume2, FiMic, FiPlus } from 'react-icons/fi';
import { MOCK_CHANNELS_BY_BRANCH } from '@/shared/data/communityData';

const BRANCH_ACCENTS = {
  dev:       '#14B8A6',
  esports:   '#EF4444',
  content:   '#F59E0B',
  business:  '#3B82F6',
  art:       '#EC4899',
  writing:   '#22C55E',
  audio:     '#9CA3AF',
  general:   '#64748B',
  newcomers: '#A78BFA',
};

const MOCK_VOICE_ROOMS = {
  dev:      [{ name: 'Code Jam Room', active: 4, max: 8 }, { name: 'Office Hours', active: 0, max: 10 }],
  esports:  [{ name: 'Scrimmage Room', active: 6, max: 10 }, { name: 'VOD Review', active: 0, max: 6 }],
  art:      [{ name: 'Art Critique', active: 2, max: 8 }, { name: 'Live Sketch', active: 0, max: 6 }],
  general:  [{ name: 'General Voice', active: 3, max: 12 }],
  newcomers:[{ name: 'Welcome Lounge', active: 5, max: 20 }],
};

export default function ChannelSidebar({ branch }) {
  const channels = MOCK_CHANNELS_BY_BRANCH[branch?.slug] || MOCK_CHANNELS_BY_BRANCH.general || [];
  const accent = BRANCH_ACCENTS[branch?.slug] || BRANCH_ACCENTS.general;
  const voiceRooms = MOCK_VOICE_ROOMS[branch?.slug] || MOCK_VOICE_ROOMS.general || [];

  return (
    <aside
      className="hidden w-[240px] shrink-0 lg:flex lg:flex-col overflow-y-auto"
      style={{ borderRight: '1px solid #E2E8F0', background: '#FAFBFC' }}
    >
      <div className="px-4 py-4" style={{ borderBottom: '1px solid #E2E8F0' }}>
        <p className="text-sm font-bold" style={{ color: '#0F172A' }}>{branch?.name || 'Community Branch'}</p>
      </div>

      <div className="flex-1 px-3 py-4 space-y-4">
        {/* TEXT CHANNELS */}
        <div>
          <div className="channel-section-label mb-2">TEXT CHANNELS</div>
          <div className="space-y-0.5">
            {channels.map((channel) => (
              <NavLink
                key={`${branch?.slug}-${channel.name}`}
                to={`/community/${branch?.slug}/channels/${channel.name}`}
                className={({ isActive }) =>
                  `flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm transition ${
                    isActive ? 'font-bold' : 'font-medium'
                  }`
                }
                style={({ isActive }) => ({
                  background: isActive ? `${accent}15` : 'transparent',
                  color: isActive ? accent : '#475569',
                })}
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  {channel.is_announcement
                    ? <FiVolume2 size={14} style={{ color: '#F59E0B' }} />
                    : <FiHash size={14} />}
                  <span className="truncate">{channel.name}</span>
                  {channel.min_level > 1 ? <FiLock size={11} style={{ color: '#94A3B8' }} /> : null}
                </span>
                {channel.unread_count > 0 ? (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                    style={{ background: '#EF4444' }}
                  >
                    {channel.unread_count}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </div>
        </div>

        {/* VOICE ROOMS */}
        <div>
          <div className="channel-section-label mb-2">VOICE ROOMS</div>
          <div className="space-y-0.5">
            {voiceRooms.map((room) => (
              <div key={room.name} className="voice-room-row">
                <FiMic size={12} style={{ color: '#94A3B8', flexShrink: 0 }} />
                <span className="flex-1 truncate text-sm" style={{ color: '#475569' }}>{room.name}</span>
                {room.active > 0 ? (
                  <span className="text-[10px] font-bold" style={{ color: '#22C55E' }}>
                    {room.active}/{room.max}
                  </span>
                ) : (
                  <span className="text-[10px]" style={{ color: '#94A3B8' }}>idle</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add channel button */}
        <button
          className="flex items-center gap-1.5 w-full rounded-lg px-2.5 py-2 text-xs font-semibold transition hover:bg-slate-100"
          style={{ color: '#94A3B8', border: '1px solid #E2E8F0' }}
        >
          <FiPlus size={12} /> New channel
        </button>
      </div>
    </aside>
  );
}
