import { useEffect, useState } from 'react';

export default function ScoreRing({ score, size = 160, strokeWidth = 8, label = 'Quality Score' }) {
    const [offset, setOffset] = useState(0);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    useEffect(() => {
        const timer = setTimeout(() => {
            setOffset(circumference - (score / 100) * circumference);
        }, 100);
        return () => clearTimeout(timer);
    }, [score, circumference]);

    const getColor = (score) => {
        if (score >= 80) return '#00b894';
        if (score >= 60) return '#fdcb6e';
        if (score >= 40) return '#ffa502';
        return '#ff6b6b';
    };

    const getGrade = (score) => {
        if (score >= 90) return 'A+';
        if (score >= 80) return 'A';
        if (score >= 70) return 'B';
        if (score >= 60) return 'C';
        if (score >= 50) return 'D';
        return 'F';
    };

    const color = getColor(score);

    return (
        <div className="score-ring" style={{ width: size, height: size }}>
            <svg width={size} height={size}>
                <circle
                    className="score-ring-bg"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                <circle
                    className="score-ring-fill"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    stroke={color}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
                />
            </svg>
            <div className="score-ring-text">
                <div className="score-value" style={{ color }}>{score}</div>
                <div className="score-label">{label}</div>
                <div style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color,
                    marginTop: '2px',
                    letterSpacing: '1px'
                }}>
                    {getGrade(score)}
                </div>
            </div>
        </div>
    );
}
