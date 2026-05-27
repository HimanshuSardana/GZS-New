import { useState } from 'react';

const PADDING = { none: '0', sm: '12px', md: '20px', lg: '24px' };

const BASE_STYLE = {
  background: 'var(--gzs-bg-surface)',
  border: '1px solid var(--gzs-border-default)',
  borderRadius: '12px',
  boxShadow: 'var(--gzs-shadow-sm)',
};

export default function GzsCard({ children, className, padding = 'md', hover = false, style }) {
  const [hovered, setHovered] = useState(false);

  const hoverStyle = hover && hovered
    ? { borderColor: 'var(--gzs-border-strong)', boxShadow: 'var(--gzs-shadow-md)' }
    : {};

  const transitionStyle = hover
    ? { transition: 'border-color 0.15s, box-shadow 0.15s' }
    : {};

  return (
    <div
      className={className}
      style={{
        ...BASE_STYLE,
        padding: PADDING[padding] ?? PADDING.md,
        ...transitionStyle,
        ...hoverStyle,
        ...style,
      }}
      onMouseEnter={hover ? () => setHovered(true) : undefined}
      onMouseLeave={hover ? () => setHovered(false) : undefined}
    >
      {children}
    </div>
  );
}
