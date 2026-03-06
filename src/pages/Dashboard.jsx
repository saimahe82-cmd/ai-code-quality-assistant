import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
    Code2, Sparkles, BarChart3, Shield, Bug, GitBranch,
    BookOpen, MessageSquare, Zap, ArrowRight, TrendingUp,
    CheckCircle2, AlertTriangle, Star
} from 'lucide-react';

export default function Dashboard() {
    const navigate = useNavigate();
    const { analysisHistory, analysisResult } = useApp();

    const lastScore = analysisHistory.length > 0
        ? analysisHistory[analysisHistory.length - 1].score
        : null;

    const avgScore = analysisHistory.length > 0
        ? Math.round(analysisHistory.reduce((a, b) => a + b.score, 0) / analysisHistory.length)
        : 0;

    const totalSessions = analysisHistory.length;

    const features = [
        {
            icon: <Code2 size={22} />,
            title: 'Smart Code Analysis',
            description: 'Paste your code or upload files for instant static analysis with detailed explanations.',
            color: '#6c5ce7',
            path: '/analyze'
        },
        {
            icon: <Sparkles size={22} />,
            title: 'AI Refactoring',
            description: 'Get intelligent suggestions to improve readability, performance, and maintainability.',
            color: '#a855f7',
            path: '/refactor'
        },
        {
            icon: <GitBranch size={22} />,
            title: 'Code Visualization',
            description: 'See your code logic as interactive flowcharts and control flow graphs.',
            color: '#00cec9',
            path: '/visualize'
        },
        {
            icon: <Bug size={22} />,
            title: 'Bug Prediction',
            description: 'Identify potential future bugs like infinite loops, null access, and edge cases.',
            color: '#fdcb6e',
            path: '/bugs'
        },
        {
            icon: <BarChart3 size={22} />,
            title: 'Quality Scoring',
            description: 'Get a comprehensive 0-100 score broken down by correctness, performance, and style.',
            color: '#74b9ff',
            path: '/analyze'
        },
        {
            icon: <Shield size={22} />,
            title: 'Plagiarism Detection',
            description: 'Compare your code against a corpus to ensure academic integrity.',
            color: '#ff6b6b',
            path: '/plagiarism'
        },
        {
            icon: <MessageSquare size={22} />,
            title: 'AI Debugging Chatbot',
            description: 'Ask questions about errors, get explanations, and learn debugging techniques.',
            color: '#e84393',
            path: null
        },
        {
            icon: <TrendingUp size={22} />,
            title: 'Progress Tracking',
            description: 'Track your improvement over time with personalized learning recommendations.',
            color: '#00b894',
            path: '/progress'
        },
    ];

    return (
        <div className="page-container">
            {/* Hero Section */}
            <div className="hero-section" style={{ borderRadius: 'var(--border-radius-xl)', marginBottom: '32px' }}>
                <div className="hero-badge">
                    <Zap size={14} />
                    AI-Powered Analysis Engine
                </div>

                <h1 className="hero-title">
                    Write Better Code with{' '}
                    <span className="hero-title-gradient">AI-Powered Feedback</span>
                </h1>

                <p className="hero-subtitle">
                    Get instant, educational code analysis with explanations, visualizations,
                    and personalized improvement suggestions designed for learners.
                </p>

                <div className="hero-actions">
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={() => navigate('/analyze')}
                        id="start-analyzing"
                    >
                        <Code2 size={18} />
                        Start Analyzing
                        <ArrowRight size={16} />
                    </button>
                    <button
                        className="btn btn-secondary btn-lg"
                        onClick={() => navigate('/learn')}
                    >
                        <BookOpen size={18} />
                        Learning Hub
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            {totalSessions > 0 && (
                <div className="stats-grid" style={{ marginBottom: '32px' }}>
                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: 'rgba(108, 92, 231, 0.15)', color: '#6c5ce7' }}>
                            <BarChart3 size={18} />
                        </div>
                        <div className="stat-card-value">{lastScore || '—'}</div>
                        <div className="stat-card-label">Latest Score</div>
                        {analysisHistory.length >= 2 && (
                            <div className={`stat-card-change ${lastScore >= analysisHistory[analysisHistory.length - 2].score ? 'positive' : 'negative'
                                }`}>
                                {lastScore >= analysisHistory[analysisHistory.length - 2].score ? '↑' : '↓'}
                                {Math.abs(lastScore - analysisHistory[analysisHistory.length - 2].score)} pts
                            </div>
                        )}
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: 'rgba(0, 206, 201, 0.15)', color: '#00cec9' }}>
                            <TrendingUp size={18} />
                        </div>
                        <div className="stat-card-value">{avgScore}</div>
                        <div className="stat-card-label">Average Score</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: 'rgba(0, 184, 148, 0.15)', color: '#00b894' }}>
                            <CheckCircle2 size={18} />
                        </div>
                        <div className="stat-card-value">{totalSessions}</div>
                        <div className="stat-card-label">Analyses Run</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: 'rgba(253, 203, 110, 0.15)', color: '#fdcb6e' }}>
                            <Star size={18} />
                        </div>
                        <div className="stat-card-value">
                            {lastScore >= 80 ? 'A' : lastScore >= 60 ? 'B' : lastScore >= 40 ? 'C' : '—'}
                        </div>
                        <div className="stat-card-label">Current Grade</div>
                    </div>
                </div>
            )}

            {/* Features Grid */}
            <div style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>
                    <Sparkles size={20} style={{ marginRight: '8px', color: 'var(--accent-primary)' }} />
                    Features
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Everything you need to learn coding best practices
                </p>
            </div>

            <div className="features-grid">
                {features.map((feature, idx) => (
                    <div
                        key={idx}
                        className="feature-card"
                        style={{ cursor: feature.path ? 'pointer' : 'default' }}
                        onClick={() => feature.path && navigate(feature.path)}
                    >
                        <div
                            className="feature-card-icon"
                            style={{ background: `${feature.color}20`, color: feature.color }}
                        >
                            {feature.icon}
                        </div>
                        <div className="feature-card-title">{feature.title}</div>
                        <div className="feature-card-description">{feature.description}</div>
                        {feature.path && (
                            <div style={{
                                marginTop: '12px',
                                fontSize: '12px',
                                color: feature.color,
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                Explore <ArrowRight size={12} />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Quick Start */}
            <div className="card" style={{ marginTop: '32px', background: 'var(--gradient-card)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                            Ready to improve your code? 🚀
                        </h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            Paste your code or upload a file to get started with AI-powered analysis.
                        </p>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/analyze')}
                    >
                        <Code2 size={16} />
                        Go to Code Editor
                        <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
