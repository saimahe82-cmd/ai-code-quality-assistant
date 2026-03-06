import { useState } from 'react';
import { useApp } from '../context/AppContext';
import ScoreRing from './ScoreRing';
import {
    AlertCircle, AlertTriangle, Info, Lightbulb,
    ChevronDown, ChevronUp, Zap, BookOpen, Shield,
    CheckCircle2, XCircle, AlertOctagon, Download
} from 'lucide-react';
import { generatePDFReport } from '../utils/reportGenerator';

export default function AnalysisResults() {
    const { analysisResult, mode, bugPredictions, aiError, currentUser, code, language } = useApp();
    const [activeTab, setActiveTab] = useState('issues');
    const [expandedIssue, setExpandedIssue] = useState(null);

    if (!analysisResult) return null;

    const { issues, score, language: resultLanguage, codeStatus, syntaxErrors = [], styleIssues = [], aiSummary, aiScore } = analysisResult;

    const tabs = [
        { id: 'issues', label: 'Issues', count: issues.length },
        { id: 'score', label: 'Score', count: null },
        { id: 'bugs', label: 'Bug Predictions', count: bugPredictions.length },
    ];

    const severityIcons = {
        error: <AlertCircle size={14} />,
        warning: <AlertTriangle size={14} />,
        info: <Info size={14} />,
        suggestion: <Lightbulb size={14} />
    };

    const severityCounts = issues.reduce((acc, i) => {
        acc[i.severity] = (acc[i.severity] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="results-panel">
            {/* ═══ CODE STATUS BANNER ═══ */}
            {codeStatus && (
                <div className={`code-status-banner ${codeStatus}`} id="code-status-banner">
                    {codeStatus === 'correct' && (
                        <>
                            <div className="code-status-icon correct">
                                <CheckCircle2 size={28} />
                            </div>
                            <div className="code-status-info">
                                <div className="code-status-title">✅ Code is Correct!</div>
                                <div className="code-status-desc">
                                    No syntax errors found. Your code should run without errors.
                                    {styleIssues.length > 0 && (
                                        <span> However, there are {styleIssues.length} style suggestion{styleIssues.length !== 1 ? 's' : ''} to improve it.</span>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                    {codeStatus === 'has_errors' && (
                        <>
                            <div className="code-status-icon has_errors">
                                <XCircle size={28} />
                            </div>
                            <div className="code-status-info">
                                <div className="code-status-title">❌ Code has Errors!</div>
                                <div className="code-status-desc">
                                    Found <strong>{syntaxErrors.length} error{syntaxErrors.length !== 1 ? 's' : ''}</strong> that will prevent your code from running.
                                    Fix the errors highlighted below.
                                </div>
                            </div>
                        </>
                    )}
                    {codeStatus === 'has_warnings' && (
                        <>
                            <div className="code-status-icon has_warnings">
                                <AlertOctagon size={28} />
                            </div>
                            <div className="code-status-info">
                                <div className="code-status-title">⚠️ Code Works, but Has Warnings</div>
                                <div className="code-status-desc">
                                    Your code should run, but there are {issues.filter(i => i.severity === 'warning').length} warning{issues.filter(i => i.severity === 'warning').length !== 1 ? 's' : ''} that could cause problems.
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* AI Analysis Summary */}
            {aiSummary && (
                <div className="ai-analysis-banner" id="ai-analysis-banner">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span className="ai-badge-tag"><Zap size={10} /> AI Analysis</span>
                        {aiError && <span style={{ fontSize: '11px', color: 'var(--accent-warning)' }}>⚠️ Partial</span>}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {aiSummary}
                    </div>
                    {aiScore && (
                        <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
                            {Object.entries(aiScore).filter(([k]) => k !== 'overall').map(([key, val]) => (
                                <div key={key} style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                    <strong style={{ color: 'var(--accent-primary-light)' }}>{val}</strong> {key}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Summary Card */}
            <div className="card">
                <div className="card-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <div>
                            <div className="card-title">
                                <Zap size={18} style={{ color: 'var(--accent-primary)' }} />
                                Analysis Results
                            </div>
                            <div className="card-subtitle">
                                {issues.length === 0 ? 'No issues found! 🎉' : `${issues.length} issue${issues.length !== 1 ? 's' : ''} found in your ${resultLanguage} code`}
                            </div>
                        </div>
                        <button
                            className="btn btn-outline"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 12px',
                                fontSize: '13px'
                            }}
                            onClick={() => generatePDFReport({
                                code,
                                language: resultLanguage,
                                analysisResult,
                                user: currentUser
                            })}
                        >
                            <Download size={14} />
                            Download Report
                        </button>
                    </div>
                </div>

                {/* Severity Overview */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {Object.entries(severityCounts).map(([severity, count]) => (
                        <div key={severity} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 12px',
                            borderRadius: 'var(--border-radius-full)',
                            fontSize: '12px',
                            fontWeight: 600
                        }} className={`issue-tag ${severity}`}>
                            {severityIcons[severity]}
                            {count} {severity}{count !== 1 ? 's' : ''}
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                            {tab.count !== null && tab.count > 0 && (
                                <span className="tab-count">{tab.count}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Issues Tab */}
                {activeTab === 'issues' && (
                    <div>
                        {/* Show Real Errors first if any */}
                        {syntaxErrors.length > 0 && (
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    color: 'var(--accent-error)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    marginBottom: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    <XCircle size={14} />
                                    Errors — Must Fix ({syntaxErrors.length})
                                </div>
                                {syntaxErrors.map((issue, idx) => renderIssue(issue, idx, 'error'))}
                            </div>
                        )}

                        {/* Style Issues */}
                        {styleIssues.length > 0 && (
                            <div>
                                {syntaxErrors.length > 0 && (
                                    <div style={{
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        color: 'var(--accent-info)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        marginBottom: '8px',
                                        marginTop: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <Lightbulb size={14} />
                                        Style & Best Practices ({styleIssues.length})
                                    </div>
                                )}
                                {styleIssues.map((issue, idx) => renderIssue(issue, idx + syntaxErrors.length, 'style'))}
                            </div>
                        )}

                        {issues.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-state-icon">✨</div>
                                <div className="empty-state-title">Perfect Code!</div>
                                <div className="empty-state-description">
                                    No issues detected. Your code is both correct and clean!
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Score Tab */}
                {activeTab === 'score' && score && (
                    <div>
                        <div className="score-ring-container">
                            <ScoreRing score={score.overall} size={160} strokeWidth={8} />
                        </div>

                        <div style={{
                            textAlign: 'center',
                            marginBottom: '24px',
                            fontSize: '14px',
                            color: 'var(--text-secondary)'
                        }}>
                            Score = Correctness(40%) + Performance(20%) + Readability(20%) + Best Practices(20%)
                        </div>

                        <div className="score-breakdown">
                            {[
                                { label: 'Correctness', value: score.correctness, weight: '40%', color: '#6c5ce7' },
                                { label: 'Performance', value: score.performance, weight: '20%', color: '#00cec9' },
                                { label: 'Readability', value: score.readability, weight: '20%', color: '#fdcb6e' },
                                { label: 'Best Practices', value: score.bestPractices, weight: '20%', color: '#74b9ff' },
                            ].map(metric => (
                                <div key={metric.label} className="score-metric">
                                    <div className="score-metric-label">{metric.label} ({metric.weight})</div>
                                    <div className="score-metric-value" style={{ color: metric.color }}>
                                        {metric.value}
                                    </div>
                                    <div className="score-metric-bar">
                                        <div
                                            className="score-metric-fill"
                                            style={{
                                                width: `${metric.value}%`,
                                                background: metric.color
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {mode === 'expert' && (
                            <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-sm)' }}>
                                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
                                    <Shield size={14} style={{ marginRight: '6px' }} />
                                    Expert Analysis
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                    <p>• Estimated time complexity: {score.performance >= 80 ? 'O(n)' : score.performance >= 50 ? 'O(n²)' : 'O(n³) or worse'}</p>
                                    <p>• Cyclomatic complexity: {issues.length < 3 ? 'Low' : issues.length < 7 ? 'Medium' : 'High'}</p>
                                    <p>• Code maintainability index: {score.overall >= 80 ? 'High' : score.overall >= 50 ? 'Medium' : 'Low'}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Bug Predictions Tab */}
                {activeTab === 'bugs' && (
                    <div>
                        {bugPredictions.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">🛡️</div>
                                <div className="empty-state-title">No Predicted Bugs</div>
                                <div className="empty-state-description">
                                    No potential future bugs detected. Keep up the good work!
                                </div>
                            </div>
                        ) : (
                            bugPredictions.map((bug, idx) => (
                                <div key={idx} className="issue-item">
                                    <div className={`issue-severity ${bug.type}`} />
                                    <div className="issue-content">
                                        <div className="issue-title">
                                            <AlertTriangle size={14} style={{ color: 'var(--accent-warning)' }} />
                                            <span style={{ marginLeft: '6px' }}>{bug.title}</span>
                                        </div>
                                        <div className="issue-description">{bug.description}</div>
                                        <div style={{
                                            marginTop: '8px',
                                            padding: '8px 12px',
                                            background: 'rgba(0, 184, 148, 0.1)',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            color: 'var(--accent-success)',
                                            fontFamily: 'var(--font-mono)'
                                        }}>
                                            💡 {bug.suggestion}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    function renderIssue(issue, idx, group) {
        return (
            <div
                key={`${issue.id}-${idx}`}
                className={`issue-item ${issue.isRealError ? 'real-error' : ''}`}
                onClick={() => setExpandedIssue(expandedIssue === idx ? null : idx)}
            >
                <div className={`issue-severity ${issue.severity}`} />
                <div className="issue-content">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className="issue-title">
                            {issue.isRealError ? (
                                <XCircle size={14} style={{ color: 'var(--accent-error)' }} />
                            ) : (
                                severityIcons[issue.severity]
                            )}
                            <span style={{ marginLeft: '6px' }}>{issue.title}</span>
                            {issue.isAI && (
                                <span style={{
                                    marginLeft: '6px',
                                    fontSize: '9px',
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    borderRadius: 'var(--border-radius-full)',
                                    background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.2), rgba(0, 206, 201, 0.2))',
                                    color: 'var(--accent-primary-light)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                }}>
                                    <Zap size={7} /> AI
                                </span>
                            )}
                            {issue.isRealError && (
                                <span style={{
                                    marginLeft: '8px',
                                    fontSize: '9px',
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    borderRadius: 'var(--border-radius-full)',
                                    background: 'rgba(255, 107, 107, 0.2)',
                                    color: 'var(--accent-error)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Will Not Run
                                </span>
                            )}
                        </div>
                        {expandedIssue === idx ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                    <div className="issue-line">Line {issue.line}: {issue.lineContent}</div>

                    {expandedIssue === idx && (
                        <div style={{ marginTop: '12px', animation: 'fadeInUp 0.2s ease-out' }}>
                            <div style={{
                                padding: '12px',
                                background: 'var(--bg-input)',
                                borderRadius: 'var(--border-radius-sm)',
                                marginBottom: '8px'
                            }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                    {issue.description}
                                </div>

                                {mode === 'beginner' && issue.whyMatters && (
                                    <div style={{
                                        padding: '8px 12px',
                                        background: 'rgba(108, 92, 231, 0.1)',
                                        borderRadius: '6px',
                                        borderLeft: '3px solid var(--accent-primary)',
                                        marginBottom: '8px'
                                    }}>
                                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-primary-light)', marginBottom: '4px' }}>
                                            💡 Why This Matters
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                            {issue.whyMatters}
                                        </div>
                                    </div>
                                )}

                                <div style={{
                                    padding: '8px 12px',
                                    background: 'rgba(0, 184, 148, 0.1)',
                                    borderRadius: '6px',
                                    borderLeft: '3px solid var(--accent-success)'
                                }}>
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-success)', marginBottom: '4px' }}>
                                        ✅ How to Fix
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                                        {issue.suggestion}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '6px' }}>
                                <span className={`issue-tag ${issue.severity}`}>{issue.severity}</span>
                                <span className="issue-tag info">{issue.category}</span>
                                {issue.isRealError && <span className="issue-tag error">syntax error</span>}
                                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', alignSelf: 'center' }}>{issue.id}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}
