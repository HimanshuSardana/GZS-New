import { motion } from 'framer-motion';

/**
 * Skeleton — Structural Placeholder with Tactical Shimmer
 * 
 * Props:
 * @param {string|number} width - CSS width
 * @param {string|number} height - CSS height
 * @param {'none'|'sm'|'md'|'lg'|'full'} rounded - Border radius variant
 * @param {'pulse'|'shimmer'} animate - Animation style
 * @param {string} className - Additional classes
 */
const Skeleton = ({
  width = '100%',
  height = '1rem',
  rounded = 'md',
  animate = 'pulse',
  className = '',
}) => {
  const radiusMap = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-2xl',
    full: 'rounded-full',
  };

  const variants = {
    pulse: {
      opacity: [0.4, 0.7, 0.4],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    shimmer: {
      backgroundPosition: ['200% 0', '-200% 0'],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  return (
    <motion.div
      className={`
        relative overflow-hidden bg-[var(--theme-bg-section)] border border-[var(--theme-border)]/50
        ${radiusMap[rounded] || radiusMap.md}
        ${animate === 'shimmer' ? 'shimmer-effect' : ''}
        ${className}
      `}
      style={{ width, height }}
      animate={animate === 'pulse' ? variants.pulse : {}}
    >
      {animate === 'shimmer' && (
        <motion.div
          className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          animate={variants.shimmer}
        />
      )}
      <style>{`
        .shimmer-effect {
          background-size: 200% 100%;
        }
      `}</style>
    </motion.div>
  );
};

export default Skeleton;
