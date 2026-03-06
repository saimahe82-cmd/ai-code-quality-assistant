import { useState } from 'react';
import { Link } from 'react-router-dom';
import { registerUser } from '../data/database';
import { useApp } from '../context/AppContext';
import {
    User, Mail, Lock, Eye, EyeOff, Code2,
    GraduationCap, Briefcase, ChevronRight,
    CheckCircle2, AlertCircle, Sparkles, Zap
} from 'lucide-react';

export default function SignUpPage() {
    const { setCurrentUser } = useApp();

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',
        experience: 'beginner',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [apiError, setApiError] = useState('');

    const roles = [
        { value: 'student', label: 'Student', icon: <GraduationCap size={18} />, desc: 'Learning to code' },
        { value: 'developer', label: 'Developer', icon: <Code2 size={18} />, desc: 'Building projects' },
        { value: 'instructor', label: 'Instructor', icon: <Briefcase size={18} />, desc: 'Teaching others' },
    ];

    const experienceLevels = [
        { value: 'beginner', label: 'Beginner', color: '#00cec9' },
        { value: 'intermediate', label: 'Intermediate', color: '#6c5ce7' },
        { value: 'advanced', label: 'Advanced', color: '#fdcb6e' },
        { value: 'expert', label: 'Expert', color: '#ff6b6b' },
    ];

    const passwordStrength = (pwd) => {
        let score = 0;
        if (pwd.length >= 6) score++;
        if (pwd.length >= 10) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        return score;
    };

    const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
    const strengthColors = ['', '#ff6b6b', '#fdcb6e', '#ffa502', '#00cec9', '#00b894'];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error on field change
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        setApiError('');
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        } else if (formData.fullName.trim().length < 2) {
            newErrors.fullName = 'Name must be at least 2 characters';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSuccessMessage('');
        setApiError('');

        if (!validate()) return;

        setIsSubmitting(true);

        // Simulate a slight network delay for UX
        setTimeout(() => {
            const result = registerUser({
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                experience: formData.experience,
            });

            setIsSubmitting(false);

            if (result.success) {
                setSuccessMessage(result.message);

                // Auto-login the user after successful sign-up
                setTimeout(() => {
                    setCurrentUser(result.user);
                }, 1500);
            } else {
                setApiError(result.message);
            }
        }, 600);
    };

    const pwdScore = passwordStrength(formData.password);

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
                        <h1 className="signup-brand-title">CodeMentor AI</h1>
                        <p className="signup-brand-subtitle">
                            Your AI-powered code quality companion
                        </p>

                        <div className="signup-features">
                            {[
                                { icon: <Zap size={16} />, text: 'Instant code analysis & feedback' },
                                { icon: <Sparkles size={16} />, text: 'AI-powered refactoring suggestions' },
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

                {/* Right Panel - Form */}
                <div className="signup-form-panel">
                    <form className="signup-form" onSubmit={handleSubmit} id="signup-form">
                        <div className="signup-form-header">
                            <h2 className="signup-form-title">Create Account</h2>
                            <p className="signup-form-subtitle">Start your coding journey today</p>
                        </div>

                        {/* Success Message */}
                        {successMessage && (
                            <div className="signup-alert signup-alert-success">
                                <CheckCircle2 size={18} />
                                <span>{successMessage} Redirecting...</span>
                            </div>
                        )}

                        {/* Error Message */}
                        {apiError && (
                            <div className="signup-alert signup-alert-error">
                                <AlertCircle size={18} />
                                <span>{apiError}</span>
                            </div>
                        )}

                        {/* Full Name */}
                        <div className={`signup-field ${errors.fullName ? 'has-error' : ''}`}>
                            <label className="signup-label" htmlFor="fullName">Full Name</label>
                            <div className="signup-input-wrapper">
                                <User size={16} className="signup-input-icon" />
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    className="signup-input"
                                    placeholder="John Doe"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    autoComplete="name"
                                />
                            </div>
                            {errors.fullName && <span className="signup-error-text">{errors.fullName}</span>}
                        </div>

                        {/* Email */}
                        <div className={`signup-field ${errors.email ? 'has-error' : ''}`}>
                            <label className="signup-label" htmlFor="email">Email Address</label>
                            <div className="signup-input-wrapper">
                                <Mail size={16} className="signup-input-icon" />
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    className="signup-input"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    autoComplete="email"
                                />
                            </div>
                            {errors.email && <span className="signup-error-text">{errors.email}</span>}
                        </div>

                        {/* Password */}
                        <div className={`signup-field ${errors.password ? 'has-error' : ''}`}>
                            <label className="signup-label" htmlFor="password">Password</label>
                            <div className="signup-input-wrapper">
                                <Lock size={16} className="signup-input-icon" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    className="signup-input"
                                    placeholder="Min. 6 characters"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="new-password"
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
                            {formData.password && (
                                <div className="signup-password-strength">
                                    <div className="signup-strength-bar">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div
                                                key={i}
                                                className={`signup-strength-segment ${i <= pwdScore ? 'active' : ''}`}
                                                style={{ background: i <= pwdScore ? strengthColors[pwdScore] : undefined }}
                                            />
                                        ))}
                                    </div>
                                    <span className="signup-strength-label" style={{ color: strengthColors[pwdScore] }}>
                                        {strengthLabels[pwdScore]}
                                    </span>
                                </div>
                            )}
                            {errors.password && <span className="signup-error-text">{errors.password}</span>}
                        </div>

                        {/* Confirm Password */}
                        <div className={`signup-field ${errors.confirmPassword ? 'has-error' : ''}`}>
                            <label className="signup-label" htmlFor="confirmPassword">Confirm Password</label>
                            <div className="signup-input-wrapper">
                                <Lock size={16} className="signup-input-icon" />
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    className="signup-input"
                                    placeholder="Re-enter your password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="signup-eye-btn"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    tabIndex={-1}
                                    aria-label="Toggle confirm password visibility"
                                >
                                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.confirmPassword && <span className="signup-error-text">{errors.confirmPassword}</span>}
                        </div>

                        {/* Role Selection */}
                        <div className="signup-field">
                            <label className="signup-label">I am a...</label>
                            <div className="signup-role-grid">
                                {roles.map(role => (
                                    <button
                                        key={role.value}
                                        type="button"
                                        className={`signup-role-card ${formData.role === role.value ? 'selected' : ''}`}
                                        onClick={() => setFormData(prev => ({ ...prev, role: role.value }))}
                                    >
                                        <span className="signup-role-icon">{role.icon}</span>
                                        <span className="signup-role-label">{role.label}</span>
                                        <span className="signup-role-desc">{role.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Experience Level */}
                        <div className="signup-field">
                            <label className="signup-label">Experience Level</label>
                            <div className="signup-exp-row">
                                {experienceLevels.map(exp => (
                                    <button
                                        key={exp.value}
                                        type="button"
                                        className={`signup-exp-chip ${formData.experience === exp.value ? 'selected' : ''}`}
                                        onClick={() => setFormData(prev => ({ ...prev, experience: exp.value }))}
                                        style={formData.experience === exp.value ? {
                                            background: `${exp.color}22`,
                                            borderColor: exp.color,
                                            color: exp.color,
                                        } : {}}
                                    >
                                        {exp.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className={`signup-submit-btn ${isSubmitting ? 'loading' : ''}`}
                            disabled={isSubmitting}
                            id="signup-submit-btn"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="signup-spinner" />
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    Create Account
                                    <ChevronRight size={18} />
                                </>
                            )}
                        </button>

                        <p className="signup-login-link">
                            Already have an account?{' '}
                            <Link to="/login">Sign in</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
