import { useApp } from '../context/AppContext';
import { Shield, Code2, ArrowRight, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PlagiarismPage() {
    const { plagiarismResult, analysisResult } = useApp();
    const navigate = useNavigate();

    const getSimilarityColor = (sim) => {
        if (sim > 60) return 'var(--accent-error)';
        if (sim > 30) return 'var(--accent-warning)';
        return 'var(--accent-success)';
    };

    const getVerdictIcon = (sim) => {
        if (sim > 60) return <XCircle size={20} style={{ color: 'var(--accent-error)' }} />;
        if (sim > 30) return <AlertTriangle size={20} style={{ color: 'var(--accent-warning)' }} />;
        return <CheckCircle2 size={20} style={{ color: 'var(--accent-success)' }} />;
    };

    return (
        <div className="page-container">
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Shield size={24} style={{ color: 'var(--accent-error)' }} />
                    Plagiarism Detection
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Compare your code against a corpus to check for originality and academic integrity.
                </p>
            </div>

            {plagiarismResult && analysisResult ? (
                <div>
                    {/* Overall Result */}
                    <div className="card" style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                            {getVerdictIcon(plagiarismResult.similarity)}
                            <div>
                                <div style={{ fontSize: '16px', fontWeight: 700 }}>
                                    {plagiarismResult.verdict}
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                    Overall similarity: {plagiarismResult.similarity}%
                                </div>
                            </div>
                        </div>

                        <div className="plagiarism-meter">
                            <div
                                className="plagiarism-meter-fill"
                                style={{
                                    width: `${Math.max(plagiarismResult.similarity, 3)}%`,
                                    background: getSimilarityColor(plagiarismResult.similarity)
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                            <span>0% — Original</span>
                            <span>100% — Copied</span>
                        </div>
                    </div>

                    {/* Matches */}
                    {plagiarismResult.matches.length > 0 ? (
                        <div className="card">
                            <div className="card-title" style={{ marginBottom: '16px' }}>
                                Similarity Matches
                            </div>
                            {plagiarismResult.matches.map((match, idx) => (
                                <div key={idx} className="plagiarism-result">
                                    <div className="plagiarism-result-header">
                                        <div className="plagiarism-source">
                                            📄 {match.source}
                                        </div>
                                        <div
                                            className="plagiarism-percent"
                                            style={{ color: getSimilarityColor(match.similarity) }}
                                        >
                                            {match.similarity}%
                                        </div>
                                    </div>
                                    <div className="plagiarism-match-lines">
                                        {match.matchedLines}
                                    </div>
                                    <div className="plagiarism-meter" style={{ margin: '8px 0 0' }}>
                                        <div
                                            className="plagiarism-meter-fill"
                                            style={{
                                                width: `${match.similarity}%`,
                                                background: getSimilarityColor(match.similarity)
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
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
                                    <CheckCircle2 size={28} style={{ color: 'var(--accent-success)' }} />
                                </div>
                                <div className="empty-state-title">No Matches Found</div>
                                <div className="empty-state-description">
                                    Your code appears to be original! No significant similarities were found in our corpus.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Note */}
                    <div className="card" style={{
                        marginTop: '16px',
                        borderLeft: '3px solid var(--accent-info)',
                        background: 'rgba(116, 185, 255, 0.05)'
                    }}>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            <strong style={{ color: 'var(--accent-info)' }}>📝 About plagiarism detection:</strong>{' '}
                            This tool uses token-based similarity analysis to compare your code against a local corpus.
                            Similar code patterns may be coincidental, especially for common algorithms.
                            This is intended as an educational aid, not a definitive judgment.
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">🔍</div>
                        <div className="empty-state-title">Analyze Code First</div>
                        <div className="empty-state-description">
                            Run a code analysis to check for plagiarism.
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
