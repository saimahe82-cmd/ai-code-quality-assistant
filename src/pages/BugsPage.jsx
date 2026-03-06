import { useApp } from '../context/AppContext';
import { Bug, Code2, ArrowRight, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BugsPage() {
    const { bugPredictions, analysisResult } = useApp();
    const navigate = useNavigate();

    return (
        <div className="page-container">
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Bug size={24} style={{ color: 'var(--accent-warning)' }} />
                    Bug Prediction
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Identify potential future bugs that may not be immediately evident.
                </p>
            </div>

            {analysisResult ? (
                <div>
                    {bugPredictions.length > 0 ? (
                        <>
                            <div className="card" style={{ marginBottom: '16px', borderLeft: '3px solid var(--accent-warning)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                                    <AlertTriangle size={16} style={{ color: 'var(--accent-warning)' }} />
                                    {bugPredictions.length} Potential Bug{bugPredictions.length !== 1 ? 's' : ''} Detected
                                </div>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                                    These are potential future issues that could cause problems under certain conditions.
                                </p>
                            </div>

                            {bugPredictions.map((bug, idx) => (
                                <div key={idx} className="card" style={{ marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: 'var(--border-radius-sm)',
                                            background: bug.type === 'warning'
                                                ? 'rgba(253, 203, 110, 0.15)'
                                                : 'rgba(116, 185, 255, 0.15)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <Bug size={18} style={{
                                                color: bug.type === 'warning' ? 'var(--accent-warning)' : 'var(--accent-info)'
                                            }} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>
                                                {bug.title}
                                            </div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>
                                                {bug.description}
                                            </div>
                                            <div style={{
                                                padding: '10px 14px',
                                                background: 'rgba(0, 184, 148, 0.08)',
                                                borderRadius: 'var(--border-radius-sm)',
                                                borderLeft: '3px solid var(--accent-success)',
                                                fontSize: '13px',
                                                color: 'var(--text-primary)',
                                                fontFamily: 'var(--font-mono)',
                                                lineHeight: 1.6
                                            }}>
                                                <span style={{ color: 'var(--accent-success)', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                                                    Fix: </span>
                                                {bug.suggestion}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="card">
                            <div className="empty-state">
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '50%',
                                    background: 'rgba(0, 184, 148, 0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 16px'
                                }}>
                                    <ShieldCheck size={28} style={{ color: 'var(--accent-success)' }} />
                                </div>
                                <div className="empty-state-title">No Predicted Bugs!</div>
                                <div className="empty-state-description">
                                    Your code looks good! No potential future bugs were detected.
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">🔮</div>
                        <div className="empty-state-title">Analyze Code First</div>
                        <div className="empty-state-description">
                            Run a code analysis to get bug predictions.
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
