import { useMemo, useState } from 'react';

export default function OnlineUsers({ users = [], pinnedMessages = [], rulesText = '' }) {
  const [showRules, setShowRules] = useState(false);
  const inChannel = useMemo(() => users.filter((user) => user.scope === 'channel'), [users]);
  const inBranch = useMemo(() => users.filter((user) => user.scope !== 'channel'), [users]);

  const renderUser = (user) => (
    <div key={user.id} className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-slate-800/60">
      <div className="relative">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={user.username} className="h-10 w-10 rounded-xl object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-sm font-semibold text-indigo-200">
            {user.username?.[0] || 'G'}
          </div>
        )}
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-900 ${
            user.status === 'idle' ? 'bg-amber-400' : 'bg-green-500'
          }`}
        />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-slate-100">@{user.username}</div>
        <div className="truncate text-xs text-slate-400">{user.topSkill || 'Active in community'}</div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col overflow-y-auto" style={{ height: 'calc(100dvh - 64px)', position: 'sticky', top: 64 }}>
      <div className="border-b border-slate-800 px-4 py-4">
        <h3 className="text-sm font-semibold text-white">Online - {users.length}</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div>
          <p className="px-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">In this channel</p>
          <div className="mt-1 space-y-1">{inChannel.map(renderUser)}</div>
        </div>

        <div className="mt-4">
          <p className="px-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">In this branch</p>
          <div className="mt-1 space-y-1">{inBranch.map(renderUser)}</div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
          <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Pinned Messages</h4>
          <div className="mt-2 space-y-2">
            {pinnedMessages.slice(0, 3).map((message) => (
              <div key={message.id} className="rounded-lg border border-slate-800 bg-slate-950/70 p-2">
                <p className="line-clamp-2 text-xs text-slate-300">{message.content}</p>
                <button className="mt-1 text-xs text-indigo-300 underline underline-offset-4">Jump to</button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
          <button
            type="button"
            onClick={() => setShowRules((current) => !current)}
            className="flex w-full items-center justify-between text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-300"
          >
            <span>Channel Rules</span>
            <span>{showRules ? '-' : '+'}</span>
          </button>
          {showRules ? (
            <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-400">
              {rulesText || '1. Be respectful\n2. Keep discussions relevant\n3. No spam or harassment'}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
