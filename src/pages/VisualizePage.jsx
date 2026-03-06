import FlowchartViewer from '../components/FlowchartViewer';
import { useApp } from '../context/AppContext';
import { GitBranch, Code2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function VisualizePage() {
    const { flowchartData } = useApp();
    const navigate = useNavigate();

    return (
        <div className="page-container">
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <GitBranch size={24} style={{ color: 'var(--accent-secondary)' }} />
                    Code Visualization
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Visualize your code's control flow as interactive flowcharts.
                </p>
            </div>

            {flowchartData && flowchartData.length > 0 ? (
                <FlowchartViewer />
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">📊</div>
                        <div className="empty-state-title">No Code Analyzed Yet</div>
                        <div className="empty-state-description">
                            Analyze some code first to generate a flowchart visualization.
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
