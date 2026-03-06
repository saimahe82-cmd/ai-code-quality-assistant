import { useApp } from '../context/AppContext';
import { sampleProgressData } from '../data/sampleData';
import {
    BarChart3, TrendingUp, ArrowRight, BookOpen, Target,
    AlertTriangle, CheckCircle2, ExternalLink
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Area, AreaChart
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '10px 14px',
            boxShadow: 'var(--shadow-md)',
            fontSize: '12px'
        }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>{label}</div>
            {payload.map((entry, idx) => (
                <div key={idx} style={{ color: entry.color, display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, display: 'inline-block' }} />
                    {entry.name}: <strong>{entry.value}</strong>
                </div>
            ))}
        </div>
    );
}

export default function ProgressPage() {
    const { analysisHistory } = useApp();

    // Use saved history or sample data
    const displayData = analysisHistory.length > 3
        ? analysisHistory.map((h, i) => ({
            date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            score: h.score,
            issues: h.issueCount
        }))
        : sampleProgressData.sessions.map(s => ({
            date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            score: s.score,
            issues: s.issues
        }));

    const usingRealData = analysisHistory.length > 3;
    const mistakeCategories = sampleProgressData.mistakeCategories;
    const maxMistakes = Math.max(...mistakeCategories.map(c => c.count));
    const recommendations = sampleProgressData.recommendations;

    const latestScore = displayData[displayData.length - 1]?.score || 0;
    const earliestScore = displayData[0]?.score || 0;
    const improvement = latestScore - earliestScore;

    return (
        <div className="page-container">
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <BarChart3 size={24} style={{ color: 'var(--accent-info)' }} />
                    Learning Progress
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Track your coding improvement over time with personalized insights.
                    {!usingRealData && (
                        <span style={{ fontSize: '11px', marginLeft: '8px', color: 'var(--text-tertiary)' }}>
                            (Showing sample data — analyze more code to see your real progress!)
                        </span>
                    )}
                </p>
            </div>

            {/* Stats Row */}
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: 'rgba(108, 92, 231, 0.15)', color: '#6c5ce7' }}>
                        <Target size={18} />
                    </div>
                    <div className="stat-card-value">{latestScore}</div>
                    <div className="stat-card-label">Current Score</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: 'rgba(0, 184, 148, 0.15)', color: '#00b894' }}>
                        <TrendingUp size={18} />
                    </div>
                    <div className="stat-card-value" style={{ color: improvement >= 0 ? 'var(--accent-success)' : 'var(--accent-error)' }}>
                        {improvement >= 0 ? '+' : ''}{improvement}
                    </div>
                    <div className="stat-card-label">Overall Improvement</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: 'rgba(116, 185, 255, 0.15)', color: '#74b9ff' }}>
                        <CheckCircle2 size={18} />
                    </div>
                    <div className="stat-card-value">{displayData.length}</div>
                    <div className="stat-card-label">Sessions Tracked</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: 'rgba(253, 203, 110, 0.15)', color: '#fdcb6e' }}>
                        <AlertTriangle size={18} />
                    </div>
                    <div className="stat-card-value">{displayData[displayData.length - 1]?.issues || 0}</div>
                    <div className="stat-card-label">Latest Issues</div>
                </div>
            </div>

            {/* Score Trend Chart */}
            <div className="progress-chart-container">
                <div className="card-title" style={{ marginBottom: '16px' }}>
                    <TrendingUp size={16} style={{ color: 'var(--accent-primary)' }} />
                    Score Trend Over Time
                </div>
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={displayData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <defs>
                            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6c5ce7" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6c5ce7" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(108, 92, 231, 0.1)" />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: '#5a6b8a', fontSize: 11 }}
                            axisLine={{ stroke: 'rgba(108, 92, 231, 0.1)' }}
                        />
                        <YAxis
                            domain={[0, 100]}
                            tick={{ fill: '#5a6b8a', fontSize: 11 }}
                            axisLine={{ stroke: 'rgba(108, 92, 231, 0.1)' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="score"
                            stroke="#6c5ce7"
                            strokeWidth={2.5}
                            fill="url(#scoreGradient)"
                            name="Score"
                            dot={{ fill: '#6c5ce7', strokeWidth: 0, r: 3 }}
                            activeDot={{ fill: '#6c5ce7', strokeWidth: 2, stroke: 'white', r: 5 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Issues Over Time */}
            <div className="progress-chart-container" style={{ marginTop: '0' }}>
                <div className="card-title" style={{ marginBottom: '16px' }}>
                    <AlertTriangle size={16} style={{ color: 'var(--accent-warning)' }} />
                    Issues Per Session
                </div>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={displayData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(108, 92, 231, 0.1)" />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: '#5a6b8a', fontSize: 11 }}
                            axisLine={{ stroke: 'rgba(108, 92, 231, 0.1)' }}
                        />
                        <YAxis
                            tick={{ fill: '#5a6b8a', fontSize: 11 }}
                            axisLine={{ stroke: 'rgba(108, 92, 231, 0.1)' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="issues" fill="#ff6b6b" name="Issues" radius={[4, 4, 0, 0]} barSize={24} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Two Column Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '0' }}>
                {/* Common Mistakes */}
                <div className="card">
                    <div className="card-title" style={{ marginBottom: '16px' }}>
                        🔍 Common Mistake Categories
                    </div>
                    {mistakeCategories.map((cat, idx) => (
                        <div key={idx} className="mistake-category">
                            <div className="mistake-category-label">{cat.name}</div>
                            <div className="mistake-category-bar">
                                <div
                                    className="mistake-category-fill"
                                    style={{
                                        width: `${(cat.count / maxMistakes) * 100}%`,
                                        background: cat.color
                                    }}
                                />
                            </div>
                            <div className="mistake-category-count">{cat.count}</div>
                        </div>
                    ))}
                </div>

                {/* Recommendations */}
                <div className="card">
                    <div className="card-title" style={{ marginBottom: '16px' }}>
                        💡 Personalized Recommendations
                    </div>
                    {recommendations.map((rec, idx) => (
                        <div key={idx} style={{
                            padding: '12px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: 'var(--border-radius-sm)',
                            marginBottom: '8px',
                            borderLeft: `3px solid ${rec.priority === 'high' ? 'var(--accent-error)' :
                                    rec.priority === 'medium' ? 'var(--accent-warning)' : 'var(--accent-info)'
                                }`
                        }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                                {rec.title}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '6px' }}>
                                {rec.description}
                            </div>
                            <a
                                href={rec.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    fontSize: '11px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontWeight: 600
                                }}
                            >
                                Learn more <ExternalLink size={10} />
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
