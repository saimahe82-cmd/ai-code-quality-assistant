import { useApp } from '../context/AppContext';
import { Sparkles, Code2, ArrowRight, Check, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function RefactorPage() {
    const { refactorings } = useApp();
    const navigate = useNavigate();
    const [copiedIdx, setCopiedIdx] = useState(null);

    const handleCopy = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2000);
    };

    const categoryColors = {
        readability: { bg: 'rgba(116, 185, 255, 0.15)', color: '#74b9ff' },
        performance: { bg: 'rgba(0, 184, 148, 0.15)', color: '#00b894' },
        maintainability: { bg: 'rgba(253, 203, 110, 0.15)', color: '#fdcb6e' }
    };

    return (
        <div className="page-container">
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Sparkles size={24} style={{ color: 'var(--accent-primary-light)' }} />
                    AI Refactoring Suggestions
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Intelligent suggestions to improve your code's readability, performance, and maintainability.
                </p>
            </div>

            {refactorings.length > 0 ? (
                <div>
                    {refactorings.map((refactor, idx) => {
                        const catStyle = categoryColors[refactor.category] || categoryColors.readability;
                        return (
                            <div key={idx} className="refactor-suggestion">
                                <div className="refactor-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span
                                            className={`refactor-category ${refactor.category}`}
                                            style={{ background: catStyle.bg, color: catStyle.color }}
                                        >
                                            {refactor.category}
                                        </span>
                                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {refactor.title}
                                        </span>
                                    </div>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => handleCopy(refactor.refactored, idx)}
                                    >
                                        {copiedIdx === idx ? <Check size={14} /> : <Copy size={14} />}
                                        {copiedIdx === idx ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>

                                <div className="refactor-body">
                                    <div className="refactor-code-panel original">
                                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-error)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            Original
                                        </div>
                                        <pre>{refactor.original}</pre>
                                    </div>
                                    <div className="refactor-code-panel refactored">
                                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-success)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            Suggested
                                        </div>
                                        <pre>{refactor.refactored}</pre>
                                    </div>
                                </div>

                                <div className="refactor-explanation">
                                    <strong style={{ color: 'var(--text-primary)' }}>💡 Why this change:</strong>{' '}
                                    {refactor.explanation}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">✨</div>
                        <div className="empty-state-title">No Suggestions Yet</div>
                        <div className="empty-state-description">
                            Analyze your code to get AI-powered refactoring suggestions.
                        </div>
                        <button
                            className="btn btn-primary"
                            style={{ marginTop: '16px' }}
                            onClick={() => navigate('/analyze')}
                        >
                            <Code2 size={14} />
                            Go to Analysis
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
