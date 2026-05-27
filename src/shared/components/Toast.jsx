/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX, FiCpu, FiAlertTriangle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Toast — Command Nexus Protocol
 */

const ToastContext = createContext(undefined);

const ICONS = {
    success: FiCheckCircle,
    error: FiAlertCircle,
    warning: FiAlertTriangle,
    info: FiInfo,
};

const COLORS = {
    success: {
        bg: 'bg-[var(--theme-card)] border-[var(--status-success)]/40 shadow-[var(--status-success)]/10',
        icon: 'text-[var(--status-success)]',
        text: 'text-[var(--theme-text)]',
        progress: 'bg-[var(--status-success)]',
        label: 'Nexus Synced'
    },
    error: {
        bg: 'bg-[var(--theme-card)] border-[var(--status-error)]/40 shadow-[var(--status-error)]/10',
        icon: 'text-[var(--status-error)]',
        text: 'text-[var(--theme-text)]',
        progress: 'bg-[var(--status-error)]',
        label: 'Fatal Error'
    },
    warning: {
        bg: 'bg-[var(--theme-card)] border-[var(--status-warning)]/40 shadow-[var(--status-warning)]/10',
        icon: 'text-[var(--status-warning)]',
        text: 'text-[var(--theme-text)]',
        progress: 'bg-[var(--status-warning)]',
        label: 'System Alert'
    },
    info: {
        bg: 'bg-[var(--theme-card)] border-[var(--theme-primary)]/40 shadow-[var(--theme-primary)]/10',
        icon: 'text-[var(--theme-primary)]',
        text: 'text-[var(--theme-text)]',
        progress: 'bg-[var(--theme-primary)]',
        label: 'System Notice'
    },
};

function ToastItem({ id, message, type = 'info', onDismiss, duration = 4000 }) {
    const [progress, setProgress] = useState(100);
    const colors = COLORS[type] || COLORS.info;
    const Icon = ICONS[type] || ICONS.info;

    useEffect(() => {
        const start = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - start;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);
            if (remaining <= 0) {
                clearInterval(interval);
                onDismiss(id);
            }
        }, 50);

        return () => clearInterval(interval);
    }, [id, duration, onDismiss]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`
                flex items-start gap-4 px-6 py-4 rounded-2xl border-2 shadow-2xl backdrop-blur-xl relative overflow-hidden group w-[320px] sm:w-[400px]
                ${colors.bg}
            `}
            role="alert"
        >
            <div className={`shrink-0 p-2.5 rounded-xl bg-[var(--theme-bg-alt)] border border-[var(--theme-border)] shadow-inner transition-all duration-500 group-hover:rotate-12`}>
                 <Icon className={`w-5 h-5 ${colors.icon}`} strokeWidth={3} />
            </div>
            
            <div className="flex-1 space-y-1">
                <p className={`text-[9px] font-black uppercase tracking-[0.3em] italic flex items-center gap-3 ${colors.icon} leading-none`}>
                    {colors.label}
                </p>
                <p className={`text-xs font-bold italic leading-tight uppercase tracking-widest ${colors.text} opacity-80`}>{message}</p>
            </div>

            <button
                onClick={() => onDismiss(id)}
                className={`shrink-0 text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] transition-all p-1`}
                aria-label="Dismiss"
            >
                <FiX className="w-4 h-4" strokeWidth={3} />
            </button>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--theme-bg-alt)]/50 overflow-hidden">
                <div
                    className={`h-full ${colors.progress} transition-[width] duration-100 ease-linear`}
                    style={{ width: `${progress}%` }}
                />
            </div>
            
            <FiCpu className="absolute top-[-10px] right-[-10px] w-12 h-12 text-[var(--theme-text-muted)] opacity-[0.05] rotate-45 pointer-events-none" />
        </motion.div>
    );
}

let toastIdCounter = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = ++toastIdCounter;
        setToasts(prev => {
            const next = [...prev, { id, message, type, duration }];
            if (next.length > 3) return next.slice(1);
            return next;
        });
    }, []);

    const dismissToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 right-6 sm:bottom-12 sm:right-12 z-[99999] flex flex-col items-center sm:items-end gap-4 pointer-events-none w-full sm:w-auto px-6 sm:px-0">
                <AnimatePresence mode="popLayout">
                    {toasts.map(toast => (
                        <div key={toast.id} className="pointer-events-auto">
                            <ToastItem
                                {...toast}
                                onDismiss={dismissToast}
                            />
                        </div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
