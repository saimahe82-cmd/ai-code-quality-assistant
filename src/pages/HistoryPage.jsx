import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { History, Search, Filter, Download, Code, Trash2, Calendar, FileCode, ChevronRight, BarChart } from 'lucide-react';
import { generatePDFReport } from '../utils/reportGenerator';
import { clearCodeHistory } from '../data/database';

export default function HistoryPage() {
    const { analysisHistory, currentUser, setAnalysisHistory, setCode, setLanguage, runAnalysis } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLang, setFilterLang] = useState('all');
    const [selectedEntry, setSelectedEntry] = useState(null);

    const filteredHistory = useMemo(() => {
        return analysisHistory
            .filter(entry => {
                const matchesSearch = entry.codeSnippet.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    entry.language.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesLang = filterLang === 'all' || entry.language === filterLang;
                return matchesSearch && matchesLang;
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [analysisHistory, searchTerm, filterLang]);

    const languages = ['all', ...new Set(analysisHistory.map(h => h.language))];

    const handleDeleteHistory = () => {
        if (window.confirm('Are you sure you want to clear your entire history? This cannot be undone.')) {
            const res = clearCodeHistory(currentUser.id);
            if (res.success) {
                setAnalysisHistory([]);
            }
        }
    };

    const handleLoadEntry = (entry) => {
        setCode(entry.code);
        setLanguage(entry.language);
        // Optionally run analysis again to populate the current state
        window.location.href = '/analyze';
    };

    return (
        <div className="page-container">
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <History size={24} style={{ color: 'var(--accent-primary)' }} />
                        Analysis History
                    </h1>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Review your past code quality reports and track your progress.
                    </p>
                </div>
                {analysisHistory.length > 0 && (
                    <button className="btn btn-outline" onClick={handleDeleteHistory} style={{ color: 'var(--accent-error)', borderColor: 'rgba(255, 107, 107, 0.2)' }}>
                        <Trash2 size={16} style={{ marginRight: '8px' }} />
                        Clear All
                    </button>
                )}
            </div>

            {/* Filters and Search */}
            <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                        <input
                            type="text"
                            placeholder="Search in code history..."
                            className="input"
                            style={{ paddingLeft: '40px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div style={{ width: '150px' }}>
                        <select
                            className="input"
                            value={filterLang}
                            onChange={(e) => setFilterLang(e.target.value)}
                        >
                            {languages.map(lang => (
                                <option key={lang} value={lang}>
                                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* History List */}
            <div className="history-grid">
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        {filteredHistory.length === 0 ? (
                            <div className="empty-state" style={{ padding: '60px 0' }}>
                                <div className="empty-state-icon">📂</div>
                                <div className="empty-state-title">No History Found</div>
                                <div className="empty-state-description">
                                    {searchTerm || filterLang !== 'all'
                                        ? 'No entries match your search filters.'
                                        : 'You haven\'t analyzed any code yet. Go to the Analysis page to get started!'}
                                </div>
                            </div>
                        ) : (
                            <table className="history-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'var(--bg-tertiary)', position: 'sticky', top: 0, zIndex: 1 }}>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Session</th>
                                        <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Language</th>
                                        <th style={{ textAlign: 'center', padding: '12px 20px', fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Score</th>
                                        <th style={{ textAlign: 'center', padding: '12px 20px', fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Issues</th>
                                        <th style={{ textAlign: 'right', padding: '12px 20px', fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredHistory.map((entry) => (
                                        <tr key={entry.id} className="history-row" style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }} onClick={() => setSelectedEntry(entry)}>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '8px',
                                                        background: 'var(--bg-tertiary)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'var(--accent-primary)'
                                                    }}>
                                                        <FileCode size={18} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{new Date(entry.date).toLocaleDateString()}</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <span className="badge" style={{ textTransform: 'uppercase', fontSize: '10px' }}>{entry.language}</span>
                                            </td>
                                            <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                                                <div style={{
                                                    fontWeight: 700,
                                                    fontSize: '16px',
                                                    color: entry.score >= 80 ? 'var(--accent-success)' : entry.score >= 50 ? 'var(--accent-warning)' : 'var(--accent-error)'
                                                }}>
                                                    {entry.score}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                    {Object.entries(entry.issueTypes || {}).map(([type, count]) => (
                                                        count > 0 && (
                                                            <div key={type} style={{
                                                                width: '20px',
                                                                height: '20px',
                                                                borderRadius: '4px',
                                                                background: type === 'syntax' ? 'var(--accent-error-light)' : 'var(--bg-tertiary)',
                                                                fontSize: '10px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontWeight: 700,
                                                                color: type === 'syntax' ? 'white' : 'var(--text-secondary)'
                                                            }} title={`${count} ${type} issues`}>
                                                                {count}
                                                            </div>
                                                        )
                                                    ))}
                                                    {entry.issueCount === 0 && <span style={{ color: 'var(--accent-success)', fontSize: '12px' }}>None</span>}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <button
                                                        className="icon-btn"
                                                        title="Download PDF"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // We need to fetch the original result to generate PDF
                                                            // For now, use the compressed info in history
                                                            generatePDFReport({
                                                                code: entry.code,
                                                                language: entry.language,
                                                                analysisResult: {
                                                                    codeStatus: entry.score >= 80 ? 'correct' : 'has_warnings',
                                                                    score: {
                                                                        overall: entry.score,
                                                                        correctness: entry.score, // simplified
                                                                        performance: 100,
                                                                        readability: 100,
                                                                        bestPractices: 100
                                                                    },
                                                                    issues: entry.issues || []
                                                                },
                                                                user: currentUser
                                                            });
                                                        }}
                                                    >
                                                        <Download size={16} />
                                                    </button>
                                                    <button className="icon-btn" title="Open in Editor" onClick={(e) => { e.stopPropagation(); handleLoadEntry(entry); }}>
                                                        <ChevronRight size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Selected Entry Preview */}
            {selectedEntry && (
                <div className="card" style={{ marginTop: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Code size={18} style={{ color: 'var(--accent-primary)' }} />
                            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Code Preview - {new Date(selectedEntry.date).toLocaleDateString()}</h2>
                        </div>
                        <button className="btn btn-outline" onClick={() => setSelectedEntry(null)}>Close</button>
                    </div>
                    <pre style={{
                        background: 'var(--bg-tertiary)',
                        padding: '16px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontFamily: 'var(--font-mono)',
                        overflowX: 'auto',
                        maxHeight: '400px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <code>{selectedEntry.code}</code>
                    </pre>
                </div>
            )}
        </div>
    );
}
