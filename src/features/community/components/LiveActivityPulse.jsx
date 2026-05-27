import { useState, useEffect } from 'react';
import { MOCK_ROLLING_TICKER } from '@/shared/data/communityData';

const TOTAL_ONLINE = 4128;

export default function LiveActivityPulse() {
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((i) => (i + 1) % MOCK_ROLLING_TICKER.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const item = MOCK_ROLLING_TICKER[tickerIndex];

  return (
    <div className="live-ticker">
      <span className="live-ticker-badge">LIVE</span>

      <span
        key={tickerIndex}
        className="flex-1 truncate text-xs transition-opacity duration-300"
        style={{ color: '#94A3B8' }}
      >
        {item?.text || ''}
      </span>

      <span
        className="hidden md:block flex-shrink-0 text-[10px] font-bold"
        style={{ color: '#475569' }}
      >
        {TOTAL_ONLINE.toLocaleString()} online
      </span>
    </div>
  );
}
