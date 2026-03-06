import { useState } from 'react';
import { Link } from 'react-router-dom';
import { loginUser } from '../data/database';
import { useApp } from '../context/AppContext';
import {
    Mail, Lock, Eye, EyeOff, Code2,
    ChevronRight, CheckCircle2, AlertCircle,
    Sparkles, Zap, Shield
} from 'lucide-react';

export default function LoginPage() {
    const { setCurrentUser } = useApp();

    const [email, setEmail] = useState(() => localStorage.getItem('codementor_rememberedEmail') || '');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiError, setApiError] = useState('');
    const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('codementor_rememberedEmail'));

    const validate = () => {
        const newErrors = {};
        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Please enter a valid email';
        }
        if (!password) {
            newErrors.password = 'Password is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setApiError('');

        if (!validate()) return;

        setIsSubmitting(true);

        setTimeout(() => {
            const result = loginUser(email, password);
            setIsSubmitting(false);

            if (result.success) {
                // Handle "Remember Me"
                if (rememberMe) {
                    localStorage.setItem('codementor_rememberedEmail', email);
                } else {
                    localStorage.removeItem('codementor_rememberedEmail');
                }

                // Save user to context & localStorage
                setCurrentUser(result.user);
            } else {
                setApiError(result.message);
            }
        }, 500);
    };

    return (
        <div className="auth-page">
            {/* Background Glow Effects */}
            <div className="signup-bg-glow signup-bg-glow-1" />
            <div className="signup-bg-glow signup-bg-glow-2" />
            <div className="signup-bg-glow signup-bg-glow-3" />

            <div className="auth-container">
                {/* Left Panel - Branding */}
                <div className="signup-branding">
                    <div className="signup-brand-content">
                        <div className="signup-logo-icon">
                            <Code2 size={28} color="white" />
                        </div>
                        <h1 className="signup-brand-title">Codewhiz</h1>
                        <p className="signup-brand-subtitle">
                            Your AI-powered code quality companion
                        </p>

                        <div className="signup-features">
                            {[
                                { icon: <Zap size={16} />, text: 'Instant code analysis & feedback' },
                                { icon: <Sparkles size={16} />, text: 'AI-powered refactoring suggestions' },
                                { icon: <Shield size={16} />, text: 'Plagiarism detection built-in' },
                                { icon: <CheckCircle2 size={16} />, text: 'Track your coding progress' },
                            ].map((feature, i) => (
                                <div key={i} className="signup-feature-item" style={{ animationDelay: `${0.2 + i * 0.15}s` }}>
                                    <span className="signup-feature-icon">{feature.icon}</span>
                                    <span>{feature.text}</span>
                                </div>
                            ))}
                        </div>

                        <div className="signup-stats-row">
                            <div className="signup-stat">
                                <span className="signup-stat-value">10K+</span>
                                <span className="signup-stat-label">Students</span>
                            </div>
                            <div className="signup-stat-divider" />
                            <div className="signup-stat">
                                <span className="signup-stat-value">50K+</span>
                                <span className="signup-stat-label">Analyses</span>
                            </div>
                            <div className="signup-stat-divider" />
                            <div className="signup-stat">
                                <span className="signup-stat-value">4.9★</span>
                                <span className="signup-stat-label">Rating</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Login Form */}
                <div className="signup-form-panel">
                    <form className="signup-form" onSubmit={handleSubmit} id="login-form">
                        <div className="signup-form-header">
                            <h2 className="signup-form-title">Welcome Back</h2>
                            <p className="signup-form-subtitle">Sign in to continue your journey</p>
                        </div>

                        {/* Error Message */}
                        {apiError && (
                            <div className="signup-alert signup-alert-error">
                                <AlertCircle size={18} />
                                <span>{apiError}</span>
                            </div>
                        )}

                        {/* Email */}
                        <div className={`signup-field ${errors.email ? 'has-error' : ''}`}>
                            <label className="signup-label" htmlFor="login-email">Email Address</label>
                            <div className="signup-input-wrapper">
                                <Mail size={16} className="signup-input-icon" />
                                <input
                                    type="email"
                                    id="login-email"
                                    className="signup-input"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); setApiError(''); }}
                                    autoComplete="email"
                                />
                            </div>
                            {errors.email && <span className="signup-error-text">{errors.email}</span>}
                        </div>

                        {/* Password */}
                        <div className={`signup-field ${errors.password ? 'has-error' : ''}`}>
                            <label className="signup-label" htmlFor="login-password">Password</label>
                            <div className="signup-input-wrapper">
                                <Lock size={16} className="signup-input-icon" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="login-password"
                                    className="signup-input"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); setApiError(''); }}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="signup-eye-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && <span className="signup-error-text">{errors.password}</span>}
                        </div>

                        {/* Remember Me & Forgot */}
                        <div className="login-options-row">
                            <label className="login-remember">
                                <input
                                    type="checkbox"
                                    className="login-checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span>Remember me</span>
                            </label>
                            <a href="#" className="login-forgot" onClick={e => e.preventDefault()}>
                                Forgot password?
                            </a>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className={`signup-submit-btn ${isSubmitting ? 'loading' : ''}`}
                            disabled={isSubmitting}
                            id="login-submit-btn"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="signup-spinner" />
                                    Signing In...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ChevronRight size={18} />
                                </>
                            )}
                        </button>

                        {/* Divider */}
                        <div className="login-divider">
                            <span>or</span>
                        </div>

                        {/* Sign Up Link */}
                        <Link to="/signup" className="login-signup-btn" id="go-to-signup">
                            Create a new account
                            <ChevronRight size={16} />
                        </Link>

                        <p className="signup-login-link">
                            Don't have an account?{' '}
                            <Link to="/signup">Sign up for free</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
