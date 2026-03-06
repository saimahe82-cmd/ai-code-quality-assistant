import { useApp } from '../context/AppContext';
import { GitBranch, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useState } from 'react';

export default function FlowchartViewer() {
    const { flowchartData, analysisResult } = useApp();
    const [zoom, setZoom] = useState(1);

    if (!flowchartData || flowchartData.length === 0) {
        return (
            <div className="card">
                <div className="card-header">
                    <div className="card-title">
                        <GitBranch size={18} style={{ color: 'var(--accent-secondary)' }} />
                        Code Visualization
                    </div>
                </div>
                <div className="empty-state">
                    <div className="empty-state-icon">📊</div>
                    <div className="empty-state-title">No Visualization Yet</div>
                    <div className="empty-state-description">
                        Analyze some code to see a flowchart of its logic flow.
                    </div>
                </div>
            </div>
        );
    }

    const nodeStyles = {
        start: {
            background: 'var(--gradient-primary)',
            color: 'white',
            borderRadius: '30px',
            border: 'none',
            boxShadow: '0 0 15px rgba(108, 92, 231, 0.3)'
        },
        end: {
            background: 'linear-gradient(135deg, #e84393, #fd79a8)',
            color: 'white',
            borderRadius: '30px',
            border: 'none',
            boxShadow: '0 0 15px rgba(232, 67, 147, 0.3)'
        },
        process: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '2px solid var(--accent-primary)',
            borderRadius: '8px',
            boxShadow: '0 0 10px rgba(108, 92, 231, 0.1)'
        },
        decision: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '2px solid var(--accent-warning)',
            borderRadius: '4px',
            boxShadow: '0 0 10px rgba(253, 203, 110, 0.1)',
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
        },
        io: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '2px solid var(--accent-secondary)',
            borderRadius: '8px',
            boxShadow: '0 0 10px rgba(0, 206, 201, 0.1)'
        }
    };

    const getNodeIcon = (type) => {
        switch (type) {
            case 'start': return '▶';
            case 'end': return '⏹';
            case 'decision': return '◆';
            case 'io': return '⟨⟩';
            default: return '□';
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <div className="card-title">
                    <GitBranch size={18} style={{ color: 'var(--accent-secondary)' }} />
                    Code Flow Visualization
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-ghost btn-icon" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
                        <ZoomOut size={14} />
                    </button>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', alignSelf: 'center', minWidth: '40px', textAlign: 'center' }}>
                        {Math.round(zoom * 100)}%
                    </span>
                    <button className="btn btn-ghost btn-icon" onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}>
                        <ZoomIn size={14} />
                    </button>
                    <button className="btn btn-ghost btn-icon" onClick={() => setZoom(1)}>
                        <Maximize2 size={14} />
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '16px',
                flexWrap: 'wrap',
                fontSize: '11px',
                color: 'var(--text-secondary)'
            }}>
                {[
                    { type: 'start', label: 'Start/End', color: 'var(--accent-primary)' },
                    { type: 'process', label: 'Process', color: 'var(--accent-primary)' },
                    { type: 'decision', label: 'Decision', color: 'var(--accent-warning)' },
                    { type: 'io', label: 'Input/Output', color: 'var(--accent-secondary)' },
                ].map(item => (
                    <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                            width: 12,
                            height: 12,
                            borderRadius: item.type === 'start' ? '50%' : '2px',
                            border: `2px solid ${item.color}`,
                            background: item.type === 'start' ? item.color : 'transparent'
                        }} />
                        {item.label}
                    </div>
                ))}
            </div>

            <div className="viz-container" style={{ overflow: 'auto' }}>
                <div
                    className="flowchart"
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
                >
                    {flowchartData.map((node, idx) => (
                        <div key={node.id}>
                            {/* Node */}
                            <div
                                className="flow-node"
                                style={{
                                    ...nodeStyles[node.type] || nodeStyles.process,
                                    padding: node.type === 'decision' ? '30px 50px' : '12px 24px',
                                    minWidth: node.type === 'start' || node.type === 'end' ? '120px' : '200px',
                                    maxWidth: '300px',
                                    textAlign: 'center'
                                }}
                                title={node.line ? `Line ${node.line}` : ''}
                            >
                                {node.type === 'decision' ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                                        <span style={{ opacity: 0.6, fontSize: '10px' }}>◆</span>
                                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                                            {node.label}
                                        </span>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                                        <span style={{ opacity: 0.6 }}>{getNodeIcon(node.type)}</span>
                                        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                                            {node.label}
                                        </span>
                                    </div>
                                )}
                                {node.line && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '-8px',
                                        right: '-8px',
                                        background: 'var(--accent-primary)',
                                        color: 'white',
                                        fontSize: '9px',
                                        padding: '1px 6px',
                                        borderRadius: '10px',
                                        fontWeight: 600
                                    }}>
                                        L{node.line}
                                    </div>
                                )}
                            </div>

                            {/* Connector */}
                            {idx < flowchartData.length - 1 && (
                                <div className="flow-connector">
                                    <div className="flow-connector-line" />
                                    <div className="flow-connector-arrow" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
