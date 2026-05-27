import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '@/app/layouts/AuthLayout';
import { usePageTheme } from '@/app/providers/ThemeProvider';
import { useAuthActions as useAuth } from '@/services/mutators/useAuthActions';
import { FiEye, FiEyeOff } from 'react-icons/fi';

export default function Signup() {
    usePageTheme('auth');

    const navigate = useNavigate();
    const { register, isRegistering } = useAuth();

    const [username, setUsername]         = useState('');
    const [email, setEmail]               = useState('');
    const [password, setPassword]         = useState('');
    const [confirmPw, setConfirmPw]       = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm]   = useState(false);
    const [agreed, setAgreed]             = useState(false);
    const [errors, setErrors]             = useState({});
    const [serverError, setServerError]   = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Local Validation
        const newErrors = {};
        if (password.length < 8) {
            newErrors.password = "Password must be at least 8 characters.";
        }
        if (confirmPw !== password) {
            newErrors.confirmPw = "Passwords do not match.";
        }
        if (!agreed) {
            newErrors.agreed = "You must agree to the terms.";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setServerError('');

        try {
            await register({ username, email, password });
            navigate('/verify-email', { state: { email } });
        } catch (err) {
            const msg = err.response?.data?.error?.message || "Registration failed. Please try again.";
            setServerError(msg);
            
            // Check for field-specific errors from server if available
            if (err.response?.data?.error?.fields) {
                setErrors(err.response.data.error.fields);
            }
        }
    };

    return (
        <AuthLayout>
            <div className="space-y-1 mb-8">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Create your account</h1>
                <p className="text-sm text-gray-500">Join the GzoneSphere gaming network.</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
                {serverError && (
                    <div className="p-4 bg-[var(--status-error-soft)] border border-[var(--status-error)] rounded-xl text-sm text-[var(--status-error)] mb-4">
                        {serverError}
                    </div>
                )}

                <div>
                    <label className="auth-label">Choose a username</label>
                    <input
                        type="text"
                        required
                        maxLength={12}
                        value={username}
                        onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
                        placeholder="gamertag_xyz"
                        className={`auth-input ${errors.username ? 'border-[var(--status-error)]' : ''}`}
                        autoComplete="username"
                    />
                    {errors.username ? (
                        <span className="text-[var(--status-error)] text-xs mt-1 block">{errors.username}</span>
                    ) : (
                        <p className="text-xs text-gray-400 mt-1.5">
                            12 characters max. No spaces. This is your public handle.
                        </p>
                    )}
                </div>

                <div>
                    <label className="auth-label">Email</label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={`auth-input ${errors.email ? 'border-[var(--status-error)]' : ''}`}
                        autoComplete="email"
                    />
                    {errors.email && <span className="text-[var(--status-error)] text-xs mt-1 block">{errors.email}</span>}
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
                            className={`auth-input pr-11 ${errors.password ? 'border-[var(--status-error)]' : ''}`}
                            autoComplete="new-password"
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
                    {errors.password && <span className="text-[var(--status-error)] text-xs mt-1 block">{errors.password}</span>}
                </div>

                <div>
                    <label className="auth-label">Confirm password</label>
                    <div className="relative">
                        <input
                            type={showConfirm ? 'text' : 'password'}
                            required
                            value={confirmPw}
                            onChange={e => setConfirmPw(e.target.value)}
                            placeholder="••••••••"
                            className={`auth-input pr-11 ${errors.confirmPw ? 'border-[var(--status-error)]' : ''}`}
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            tabIndex={-1}
                        >
                            {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                        </button>
                    </div>
                    {errors.confirmPw && <span className="text-[var(--status-error)] text-xs mt-1 block">{errors.confirmPw}</span>}
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        required
                        checked={agreed}
                        onChange={e => setAgreed(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border border-gray-300 cursor-pointer accent-[#1E6F9F] shrink-0"
                    />
                    <span className="text-xs text-gray-600 leading-relaxed">
                        I agree to the{' '}
                        <Link to="/terms" className="text-[#1E6F9F] hover:underline underline-offset-2">Terms of Service</Link>
                        {' '}and{' '}
                        <Link to="/privacy" className="text-[#1E6F9F] hover:underline underline-offset-2">Privacy Policy</Link>
                        {errors.agreed && <span className="text-[var(--status-error)] text-xs mt-1 block">{errors.agreed}</span>}
                    </span>
                </label>

                <button
                    type="submit"
                    disabled={isRegistering}
                    className="auth-btn-primary mt-1"
                >
                    {isRegistering ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            CREATING ACCOUNT...
                        </>
                    ) : 'Create Account →'}
                </button>

                <p className="text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link to="/login" className="text-[#1E6F9F] font-semibold hover:underline underline-offset-2">
                        Log In →
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}
