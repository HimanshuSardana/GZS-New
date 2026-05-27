import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowUpRight } from 'react-icons/fi';

export default function TournamentTicker({ tournaments = [] }) {
  const live = tournaments.filter(t => (t.status || '').toLowerCase() === 'live');
  const open = tournaments.filter(t => (t.status || '').toLowerCase() === 'registration_open');

  const items = live.length > 0 ? live : open;

  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setVisible(false);
      const swap = setTimeout(() => {
        setIdx(prev => (prev + 1) % items.length);
        setVisible(true);
      }, 300);
      return () => clearTimeout(swap);
    }, 4000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) return null;

  const current = items[idx] || items[0];
  const isLiveMode = live.length > 0;

  const formattedClose = current.registration_closes
    ? new Date(current.registration_closes).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : null;

  return (
    <div style={{
      width: '100%', background: '#0A1628', height: 36,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
      flexShrink: 0, gap: 16,
    }}>
      {/* Left badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: isLiveMode ? '#ef4444' : '#22c55e',
          display: 'inline-block',
          animation: isLiveMode ? 'pulse 1.2s infinite' : 'none',
        }} />
        <span style={{
          fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
          letterSpacing: '0.15em', color: isLiveMode ? '#ef4444' : '#22c55e',
        }}>
          {isLiveMode ? 'LIVE' : 'REG OPEN'}
        </span>
      </div>

      {/* Centre: fade-swap info */}
      <div style={{
        flex: 1, textAlign: 'center', overflow: 'hidden',
        opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease',
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
          {isLiveMode
            ? `${current.name || current.title}${current.current_participants != null ? ` · ${current.current_participants} participants` : ''}${current.game_slug || current.game ? ` · ${current.game_slug || current.game}` : ''}`
            : `Registration Open: ${current.name || current.title}${formattedClose ? ` · Closes ${formattedClose}` : ''}`
          }
        </span>
      </div>

      {/* Right CTA */}
      <Link
        to={`/tournaments/${current.slug}`}
        style={{
          display: 'flex', alignItems: 'center', gap: 3,
          fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
          letterSpacing: '0.1em', color: isLiveMode ? '#ef4444' : '#22c55e',
          textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap',
        }}
      >
        {isLiveMode ? 'Watch Now' : 'Register'} <FiArrowUpRight size={11} />
      </Link>
    </div>
  );
}
