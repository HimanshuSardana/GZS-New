import { useState, useEffect } from 'react';
import { FiMessageCircle, FiMoreVertical, FiUserPlus, FiUserCheck } from 'react-icons/fi';
import coreApi from '@/services/api/core';

const DOMAIN_COLORS = {
  dev:      '#14B8A6',
  esports:  '#EF4444',
  content:  '#F59E0B',
  business: '#3B82F6',
  art:      '#EC4899',
  writing:  '#22C55E',
  audio:    '#64748B',
};

const ONLINE_DOT = {
  online:  '#22C55E',
  away:    '#F59E0B',
  offline: 'transparent',
};

function UserRow({ user, platformLevel, onlineStatus = 'offline', onAction, actionLabel }) {
  const domainColor = DOMAIN_COLORS[user?.primary_domain] || '#64748B';
  const initials = (user?.display_name || user?.username || '?')[0]?.toUpperCase();
  const showDot = onlineStatus === 'online' || onlineStatus === 'away';

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex-shrink-0">
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt={user.display_name} className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <div
            className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ background: domainColor }}
          >
            {initials}
          </div>
        )}
        {showDot && (
          <span
            className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white"
            style={{ background: ONLINE_DOT[onlineStatus] }}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: '#0F172A' }}>
          {user?.display_name || user?.username}
        </p>
        <p className="text-xs truncate" style={{ color: '#94A3B8' }}>
          {platformLevel}
        </p>
      </div>
      {onAction && (
        <button
          type="button"
          onClick={() => onAction(user)}
          className="rounded-lg border px-2 py-1 text-xs font-medium transition"
          style={{ borderColor: '#E2E8F0', color: '#475569' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default function SocialPanel({
  isOwn = false,
  masterProfile,
  friends = [],
  followers = [],
  following = [],
  friendRequests = [],
  mutualConnections = 0,
}) {
  const [activeSection, setActiveSection] = useState('friends');
  const [visibility, setVisibility] = useState('Connections');
  const [openMenu, setOpenMenu] = useState(null);

  const [localFriends,   setLocalFriends]   = useState(friends);
  const [localFollowers, setLocalFollowers] = useState(followers);
  const [localFollowing, setLocalFollowing] = useState(following);
  const [localRequests,  setLocalRequests]  = useState(friendRequests);

  useEffect(() => { setLocalFriends(friends); },     [friends]);
  useEffect(() => { setLocalFollowers(followers); }, [followers]);
  useEffect(() => { setLocalFollowing(following); }, [following]);
  useEffect(() => { setLocalRequests(friendRequests); }, [friendRequests]);

  const handleDecline = async (requestId) => {
    try {
      await coreApi.delete(`/social/friend-requests/${requestId}`);
    } catch { /* optimistic */ }
    setLocalRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const handleBlock = async (userId) => {
    try {
      await coreApi.post(`/social/block/${userId}`);
    } catch { /* optimistic */ }
    setLocalFriends(prev => prev.filter(f => f.user?.id !== userId));
    setLocalFollowers(prev => prev.filter(f => f.user?.id !== userId));
    setLocalFollowing(prev => prev.filter(f => f.user?.id !== userId));
    setOpenMenu(null);
  };

  const handleRemoveFriend = async (userId) => {
    setLocalFriends(prev => prev.filter(f => f.user?.id !== userId));
    setOpenMenu(null);
  };

  const followingCount = masterProfile?.following_count ?? localFollowing.length ?? Math.max(2, Math.round(localFriends.length * 0.8));

  const counts = [
    { label: 'Friends',   value: localFriends.length || 142,    section: 'friends' },
    { label: 'Followers', value: localFollowers.length || 89,   section: 'followers' },
    { label: 'Following', value: followingCount || 53,           section: 'following' },
  ];

  return (
    <div
      className="rounded-2xl border p-4"
      style={{ background: '#fff', borderColor: '#E2E8F0' }}
    >
      {/* Section title */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold" style={{ color: '#0F172A' }}>Social Graph</h3>
        <span className="text-xs" style={{ color: '#94A3B8' }}>{counts[0].value + counts[1].value} total</span>
      </div>

      {/* Counts grid */}
      <div className="grid grid-cols-3 gap-1.5 mb-4">
        {counts.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => setActiveSection(item.section)}
            className="rounded-lg py-2.5 text-center transition"
            style={{
              background: activeSection === item.section ? '#EFF6FF' : '#F8FAFC',
              border: activeSection === item.section ? '1px solid #BFDBFE' : '1px solid transparent',
            }}
          >
            <p className="text-lg font-extrabold" style={{ color: '#0F172A' }}>{item.value}</p>
            <p className="text-[11px]" style={{ color: '#64748B' }}>{item.label}</p>
          </button>
        ))}
      </div>

      {/* Friend list */}
      <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto">
        {activeSection === 'friends' && (
          localFriends.length > 0 ? (
            localFriends.map((f) => {
              const domainColor = DOMAIN_COLORS[f.user?.primary_domain] || '#64748B';
              const initials = (f.user?.display_name || f.user?.username || '?')[0]?.toUpperCase();
              const showDot = f.online_status === 'online' || f.online_status === 'away';
              return (
                <div key={f.user?.id || f.user?.username} className="flex items-center gap-2.5">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {f.user?.avatar_url ? (
                      <img src={f.user.avatar_url} alt={f.user.display_name} className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: domainColor }}>{initials}</div>
                    )}
                    {showDot && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white" style={{ background: ONLINE_DOT[f.online_status] }} />
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#0F172A' }}>{f.user?.display_name || f.user?.username}</p>
                    <p className="text-xs truncate" style={{ color: '#94A3B8' }}>
                      {`${f.user?.platform_level || 'Hustler'} · ${f.user?.primary_domain ? (f.user.primary_domain[0].toUpperCase() + f.user.primary_domain.slice(1)) : 'Dev'}`}
                    </p>
                  </div>
                  {/* Message */}
                  <button type="button" className="rounded-lg border px-2 py-1 text-xs font-medium transition" style={{ borderColor: '#E2E8F0', color: '#475569' }}
                    onClick={() => console.log('Message', f.user)}>
                    Message
                  </button>
                  {/* ⋯ menu */}
                  <div className="relative">
                    <button type="button" className="p-1 rounded" style={{ color: '#94A3B8' }}
                      onClick={() => setOpenMenu(openMenu === f.user?.id ? null : f.user?.id)}>
                      <FiMoreVertical size={14} />
                    </button>
                    {openMenu === f.user?.id && (
                      <div className="absolute right-0 top-full mt-1 z-20 rounded-xl border shadow-lg py-1 w-36" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
                        <button type="button" className="w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-red-50" style={{ color: '#EF4444' }}
                          onClick={() => handleBlock(f.user?.id)}>
                          Block user
                        </button>
                        <button type="button" className="w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-slate-50" style={{ color: '#475569' }}
                          onClick={() => handleRemoveFriend(f.user?.id)}>
                          Remove friend
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-center py-3" style={{ color: '#94A3B8' }}>No friends yet</p>
          )
        )}
        {activeSection === 'followers' && (
          localFollowers.length > 0 ? (
            localFollowers.map((f) => (
              <UserRow
                key={f.user?.id || f.user?.username}
                user={f.user}
                platformLevel={f.user?.platform_level || 'Hustler'}
                onlineStatus={f.online_status}
                actionLabel={isOwn ? 'Follow back' : 'Follow'}
                onAction={(u) => console.log('Follow', u)}
              />
            ))
          ) : (
            <p className="text-sm text-center py-3" style={{ color: '#94A3B8' }}>No followers yet</p>
          )
        )}
        {activeSection === 'following' && (
          localFollowing.length > 0 ? (
            localFollowing.map((f) => (
              <UserRow
                key={f.user?.id || f.user?.username}
                user={f.user}
                platformLevel={f.user?.platform_level || 'Hustler'}
                onlineStatus={f.online_status}
                actionLabel="Unfollow"
                onAction={(u) => console.log('Unfollow', u)}
              />
            ))
          ) : (
            <p className="text-sm text-center py-3" style={{ color: '#94A3B8' }}>Not following anyone</p>
          )
        )}
      </div>

      {/* Friend requests */}
      {isOwn && localRequests.length > 0 && (
        <div className="mt-4 rounded-xl p-3" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
          <p className="text-xs font-bold mb-2.5" style={{ color: '#0F172A' }}>
            Friend Requests · {localRequests.length}
          </p>
          <div className="flex flex-col gap-2">
            {localRequests.slice(0, 3).map((req) => (
              <div key={req.id} className="flex items-center gap-2">
                {req.user?.avatar_url ? (
                  <img src={req.user.avatar_url} alt={req.user.display_name} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: '#64748B' }}
                  >
                    {(req.user?.display_name || '?')[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: '#0F172A' }}>{req.user?.display_name}</p>
                  <p className="text-[11px]" style={{ color: '#94A3B8' }}>{req.user?.primary_role}</p>
                </div>
                <button
                  type="button"
                  className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-white"
                  style={{ background: '#1D6ADB' }}
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => handleDecline(req.id)}
                  className="rounded-lg px-2.5 py-1 text-[11px] font-semibold"
                  style={{ background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0' }}
                >
                  Decline
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visibility controls (own profile) */}
      {isOwn && (
        <div className="mt-4 rounded-xl p-3" style={{ background: '#F8FAFC' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: '#0F172A' }}>Friends list visibility</p>
          <div className="flex gap-1.5">
            {['Everyone', 'Connections', 'Only me'].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setVisibility(opt)}
                className="flex-1 rounded-lg py-1.5 text-xs font-medium transition"
                style={
                  visibility === opt
                    ? { background: '#1D6ADB', color: '#fff' }
                    : { background: '#fff', border: '1px solid #E2E8F0', color: '#475569' }
                }
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mutual connections (public view) */}
      {!isOwn && mutualConnections > 0 && (
        <div className="mt-4 rounded-xl p-3" style={{ background: '#F8FAFC' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: '#0F172A' }}>{mutualConnections} mutual connections</p>
          <div className="flex -space-x-2 mb-2">
            {friends.slice(0, 5).map((f, i) => (
              <img
                key={f.user?.id || i}
                src={f.user?.avatar_url}
                alt={f.user?.display_name}
                className="h-7 w-7 rounded-full border-2 border-white object-cover"
                style={{ zIndex: 5 - i }}
              />
            ))}
          </div>
          <p className="text-xs" style={{ color: '#64748B' }}>People in your network who can vouch.</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-4 flex gap-2">
        {isOwn ? (
          <>
            <button
              className="flex-1 rounded-xl py-2 text-sm font-semibold text-white"
              style={{ background: '#1D6ADB' }}
            >
              View all {localFriends.length || counts[0].value} friends
            </button>
          </>
        ) : (
          <>
            <button
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold text-white"
              style={{ background: '#1D6ADB' }}
            >
              <FiUserPlus size={14} /> Connect
            </button>
            <button
              className="flex-1 rounded-xl py-2 text-sm font-semibold"
              style={{ background: '#fff', border: '1px solid #E2E8F0', color: '#334155' }}
            >
              Follow
            </button>
          </>
        )}
      </div>
    </div>
  );
}
