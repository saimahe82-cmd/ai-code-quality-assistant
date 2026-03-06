import CodeEditor from '../components/CodeEditor';
import AnalysisResults from '../components/AnalysisResults';
import { useApp } from '../context/AppContext';
import { Code2, Sparkles } from 'lucide-react';

export default function AnalyzePage() {
    const { analysisResult, mode } = useApp();

    return (
        <div className="page-container">
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Code2 size={24} style={{ color: 'var(--accent-primary)' }} />
                    Code Analysis
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Paste your code, upload a file, or load a sample to get instant AI-powered feedback.
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginLeft: '8px',
                        padding: '2px 10px',
                        background: mode === 'beginner' ? 'rgba(108, 92, 231, 0.15)' : 'rgba(0, 206, 201, 0.15)',
                        borderRadius: 'var(--border-radius-full)',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: mode === 'beginner' ? 'var(--accent-primary-light)' : 'var(--accent-secondary)'
                    }}>
                        <Sparkles size={10} />
                        {mode === 'beginner' ? 'Beginner' : 'Expert'} Mode
                    </span>
                </p>
            </div>

            <div className="analysis-layout">
                {/* Left: Code Editor */}
                <div>
                    <CodeEditor />
                </div>

                {/* Right: Results */}
                <div>
                    {analysisResult ? (
                        <AnalysisResults />
                    ) : (
                        <div className="card">
                            <div className="empty-state">
                                <div className="empty-state-icon">🔍</div>
                                <div className="empty-state-title">Ready to Analyze</div>
                                <div className="empty-state-description">
                                    Write or paste your code in the editor, then click "Analyze Code" to see results.
                                    <br /><br />
                                    You can also load a sample to see how the analysis works.
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
