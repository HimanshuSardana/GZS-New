import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '@/app/layouts/AuthLayout';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import { authService } from '@/services';
import { FiMail } from 'react-icons/fi';

export default function VerifyEmail() {
    usePageTheme('auth');

    const navigate  = useNavigate();
    const location  = useLocation();
    const email     = location.state?.email || '';

    const [resending, setResending] = useState(false);
    const [resent, setResent]       = useState(false);
    const [countdown, setCountdown] = useState(0);

    // Auto-redirect to login after 3s (no real email sending in dev)
    useEffect(() => {
        const t = setTimeout(() => navigate('/login', { replace: true }), 3000);
        return () => clearTimeout(t);
    }, [navigate]);

    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    const handleResend = async () => {
        if (countdown > 0) return;
        
        setResending(true);
        try {
            await authService.resendVerification(email);
            setResent(true);
            setCountdown(60);
        } catch (err) {
            console.error("Resend failed:", err);
        } finally {
            setResending(false);
        }
    };

    return (
        <AuthLayout>
            <div className="text-center space-y-6">

                {/* Mail icon */}
                <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-[#1E6F9F]/10 border-2 border-[#1E6F9F]/20 flex items-center justify-center">
                        <FiMail size={28} className="text-[#1E6F9F]" />
                    </div>
                </div>

                {/* Heading + body */}
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Verify your email</h2>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        We sent a verification link to{' '}
                        {email
                            ? <span className="font-semibold text-gray-700">{email}</span>
                            : 'your email address'
                        }
                        . Check your inbox and click the link to continue.
                    </p>
                </div>

                {/* Redirect notice */}
                <p className="text-xs text-gray-400 italic">
                    Redirecting you automatically in a moment…
                </p>

                {/* Resend */}
                <div className="pt-1 min-h-[40px] flex items-center justify-center">
                    {resending ? (
                        <div className="flex items-center gap-2 text-sm text-[#1E6F9F]">
                            <span className="w-3.5 h-3.5 border-2 border-[#1E6F9F] border-t-transparent rounded-full animate-spin" />
                            Sending…
                        </div>
                    ) : countdown > 0 ? (
                        <p className="text-sm text-gray-400">Resend available in {countdown}s</p>
                    ) : (
                        <button
                            type="button"
                            onClick={handleResend}
                            className="text-sm text-[#1E6F9F] hover:underline underline-offset-2 inline-flex items-center gap-2 transition-opacity font-semibold"
                        >
                            Resend verification email
                        </button>
                    )}
                </div>
                {resent && countdown > 0 && (
                    <p className="text-xs text-green-600 mt-2">Email sent! Please check your inbox.</p>
                )}

                {/* Back to login */}
                <div className="pt-4 border-t border-gray-100">
                    <Link to="/login" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                        ← Back to login
                    </Link>
                </div>

            </div>
        </AuthLayout>
    );
}
