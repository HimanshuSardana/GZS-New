import { Component } from 'react';
import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';
import GzsLogo from './GzsLogo';

/**
 * ErrorBoundary — Catches JavaScript errors in the component tree,
 * logs the error, and displays a fallback UI instead of crashing the page.
 *
 * Props:
 *   fallback — optional inline fallback element (e.g. <ServiceUnavailable />).
 *              When omitted, renders the full-page crash screen.
 *   onReset  — optional callback fired when the user clicks retry.
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('[ErrorBoundary] Caught an error:', error, info);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        this.props.onReset?.();
    };

    render() {
        if (this.state.hasError) {
            // Inline fallback supplied by caller
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-[var(--theme-bg)] px-6 py-24 relative overflow-hidden">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--status-error)] to-transparent opacity-20" />
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none mesh-pattern" />

                    <div className="text-center max-w-xl relative z-10">
                        <div className="flex justify-center mb-12">
                            <GzsLogo className="w-24 h-24 opacity-20 grayscale" />
                        </div>
                        
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[var(--status-error-soft)] border-2 border-[var(--status-error)]/20 text-[var(--status-error)] mb-8 shadow-2xl">
                            <FiAlertTriangle size={32} />
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-[var(--theme-text)] mb-6 italic">
                            SOMETHING_WENT_WRONG
                        </h1>
                        
                        <p className="text-[var(--theme-text-muted)] mb-10 leading-relaxed font-medium italic opacity-70">
                            The system encountered a critical exception. Connection to the current node has been interrupted. 
                            Please attempt a manual resync or return to the main hub.
                        </p>

                        {import.meta.env.DEV && this.state.error && (
                            <div className="mb-10 text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--status-error)] mb-2 italic">DEBUG_TRACE // ERROR_STRING</p>
                                <pre className="bg-[var(--theme-bg-alt)] border-2 border-[var(--status-error)]/20 text-[var(--status-error)] text-[10px] font-black p-8 rounded-[2rem] overflow-auto max-h-60 shadow-inner italic uppercase tracking-widest scrollbar-thin">
                                    {this.state.error.toString()}
                                </pre>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => window.location.reload()}
                                className="gzs-btn-primary !px-10 !py-4 flex items-center gap-3"
                            >
                                <FiRefreshCw size={18} /> TRY_AGAIN
                            </button>
                            <Link
                                to="/"
                                onClick={this.handleReset}
                                className="px-10 py-4 rounded-full border-2 border-[var(--theme-text)] text-[var(--theme-text)] font-black uppercase tracking-widest text-xs hover:bg-[var(--theme-text)] hover:text-[var(--theme-bg)] transition-all flex items-center gap-3 italic"
                            >
                                <FiHome size={18} /> GO_HOME
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
