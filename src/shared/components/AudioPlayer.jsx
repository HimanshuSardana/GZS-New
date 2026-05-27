import { useState, useRef } from 'react';
import { FiPlay, FiPause, FiVolume2 } from 'react-icons/fi';

export default function AudioPlayer({ src, title }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setPlaying((p) => !p);
  };

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  return (
    <div style={{ background: 'var(--gzs-bg-elevated)', border: '1px solid var(--gzs-border-default)', borderRadius: 10, padding: '10px 14px', marginTop: 10 }}>
      {title && (
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--gzs-text-secondary)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </p>
      )}
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setPlaying(false)}
        style={{ display: 'none' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={togglePlay}
          style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--gzs-bg-surface)', border: '1px solid var(--gzs-border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--gzs-text-primary)', flexShrink: 0 }}
        >
          {playing ? <FiPause size={14} /> : <FiPlay size={14} />}
        </button>
        <div
          onClick={handleProgressClick}
          style={{ flex: 1, height: 4, background: 'var(--gzs-border-subtle)', borderRadius: 2, position: 'relative', cursor: 'pointer' }}
        >
          <div style={{ height: '100%', width: `${duration ? (currentTime / duration) * 100 : 0}%`, background: 'var(--gzs-text-primary)', borderRadius: 2, transition: 'width 0.1s linear' }} />
        </div>
        <span style={{ fontSize: 11, color: 'var(--gzs-text-muted)', flexShrink: 0, minWidth: 68, textAlign: 'right' }}>
          {fmt(currentTime)} / {fmt(duration)}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <FiVolume2 size={12} style={{ color: 'var(--gzs-text-muted)' }} />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setVolume(v);
              if (audioRef.current) audioRef.current.volume = v;
            }}
            style={{ width: 50, cursor: 'pointer' }}
          />
        </div>
      </div>
    </div>
  );
}
