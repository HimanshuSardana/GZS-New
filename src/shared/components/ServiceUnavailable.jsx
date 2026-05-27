import { FiWifiOff, FiRefreshCw } from 'react-icons/fi';

/**
 * ServiceUnavailable — inline section-level error placeholder.
 * Used as the `fallback` prop on ErrorBoundary wrapping data-fetching sections.
 *
 * Props:
 *   service  — human-readable service name shown in the message (e.g. "Games", "Blog")
 *   onRetry  — optional callback; when provided shows a retry button
 *   compact  — renders a smaller single-line variant (default false)
 */
export default function ServiceUnavailable({ service = 'This section', onRetry, compact = false }) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-[var(--status-error)]/20 bg-[var(--status-error-soft)] px-4 py-3 text-sm text-[var(--status-error-text)]">
        <FiWifiOff size={16} className="shrink-0" />
        <span className="font-semibold">{service} is temporarily unavailable.</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-[var(--status-error)]/30 bg-white/60 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--status-error-text)] hover:bg-white transition-colors"
          >
            <FiRefreshCw size={12} /> Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-[var(--status-error)]/20 bg-[var(--status-error-soft)] px-8 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[var(--status-error)]/20 bg-white/60 text-[var(--status-error)]">
        <FiWifiOff size={24} />
      </div>
      <div>
        <p className="text-base font-black uppercase tracking-tight text-[var(--status-error-text)]">
          {service} Unavailable
        </p>
        <p className="mt-1.5 text-sm text-[var(--theme-text-muted)]">
          We couldn&apos;t load this section. Check your connection and try again.
        </p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-2 rounded-xl border border-[var(--status-error)]/30 bg-white px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[var(--status-error-text)] shadow-sm hover:bg-[var(--status-error-soft)] transition-colors"
        >
          <FiRefreshCw size={14} /> Try Again
        </button>
      )}
    </div>
  );
}
