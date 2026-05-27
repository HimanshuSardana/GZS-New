import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '@/app/layouts/AuthLayout';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import { useAuthActions as useAuth } from '@/services/mutators/useAuthActions';
import useAdminAuthStore from '@/store/admin/useAdminAuthStore';
import { FiEye, FiEyeOff } from 'react-icons/fi';

export default function Login() {
    usePageTheme('auth');

    const navigate  = useNavigate();
    const location  = useLocation();
    const { login, isLoggingIn } = useAuth();
    const hydrateAdminStore = useAdminAuthStore((s) => s.hydrate);

    const [email, setEmail]               = useState('');
    const [password, setPassword]         = useState('');
    const [rememberMe, setRememberMe]     = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError]               = useState('');


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) {
            setError('Please fill in all fields.');
            return;
        }
        setError('');

        try {
            await login({ email, password });

            if (rememberMe) {
                localStorage.setItem('gzs_remember_me', 'true');
            }

            // Re-hydrate the admin store so AdminAuthGuard sees the new user immediately
            hydrateAdminStore();

                    const isAdminLogin = new URLSearchParams(location.search).get('admin') === 'true';
            const from = location.state?.from || (isAdminLogin ? '/admin' : '/profile');
            navigate(from, { replace: true });
        } catch (err) {
            const msg = err.response?.data?.error?.message || "Invalid email or password";
            setError(msg);
        }
    };

    return (
        <AuthLayout>
            <div className="space-y-1 mb-8">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Welcome back</h1>
                <p className="text-sm text-gray-500">Sign in to your GzoneSphere account.</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
                {error && (
                    <div className="p-4 bg-[var(--status-error-soft)] border border-[var(--status-error)] rounded-xl text-sm text-[var(--status-error)] mb-4">
                        {error}
                    </div>
                )}

                <div>
                    <label className="auth-label">Email or Username</label>
                    <input
                        type="text"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="auth-input"
                        autoComplete="username"
                    />
                </div>

                <div>
                    <label className="auth-label">Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="auth-input pr-11"
                            autoComplete="current-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={e => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-[#1E6F9F] focus:ring-[#1E6F9F]"
                        />
                        <span className="text-xs text-gray-600">Remember me</span>
                    </label>
                    <Link to="/forgot-password" className="text-xs text-[#1E6F9F] hover:underline underline-offset-2">
                        Forgot password?
                    </Link>
                </div>

                <button type="submit" disabled={isLoggingIn} className="auth-btn-primary mt-1">
                    {isLoggingIn ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Signing in...
                        </>
                    ) : 'Log In →'}
                </button>

                <p className="text-center text-sm text-gray-500">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-[#1E6F9F] font-semibold hover:underline underline-offset-2">
                        Sign Up →
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}
