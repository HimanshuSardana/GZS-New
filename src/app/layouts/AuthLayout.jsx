import GzsLogo from '@/shared/components/GzsLogo';
import { FiCheck } from 'react-icons/fi';

const VALUE_PROPS = [
    'Verified Gaming Identity',
    'Compete in Real Tournaments',
    'Connect with Studios & Talent',
];

/**
 * AuthLayout — Two-panel auth layout. No Navbar/Footer.
 * Left (white): logo + form content (children)
 * Right (dark navy gradient): brand panel, hidden on mobile
 */
export default function AuthLayout({ children }) {
    return (
        <div className="min-h-screen flex bg-white">

            {/* ── Left panel — form ──────────────────────────── */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 bg-white">
                <div className="w-full max-w-[420px]">
                    <div className="mb-10">
                        <GzsLogo variant="dark" size={36} />
                    </div>
                    {children}
                </div>
            </div>

            {/* ── Right panel — brand (lg+, hidden on mobile) ── */}
            <div
                className="hidden lg:flex w-1/2 shrink-0 flex-col items-center justify-center px-16"
                style={{ background: 'linear-gradient(135deg, var(--slate-900) 0%, var(--color-bg-auth-end) 100%)' }}
            >
                <div className="w-full max-w-sm space-y-12">
                    <div className="flex justify-center">
                        <GzsLogo variant="light" size={64} />
                    </div>

                    <p className="text-[1.625rem] font-black text-white text-center leading-snug tracking-tight">
                        The Future of Gaming, Unified
                    </p>

                    <div className="space-y-5">
                        {VALUE_PROPS.map((vp) => (
                            <div key={vp} className="flex items-center gap-4">
                                <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                    style={{
                                        backgroundColor: 'color-mix(in srgb, var(--color-border-auth) 20%, transparent)',
                                        border: '1px solid color-mix(in srgb, var(--color-border-auth) 50%, transparent)',
                                    }}
                                >
                                    <FiCheck size={12} style={{ color: 'var(--color-border-auth)' }} />
                                </div>
                                <span className="text-white/80 text-sm font-medium leading-snug">{vp}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
}
