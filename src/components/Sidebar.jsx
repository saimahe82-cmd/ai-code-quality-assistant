import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
    Code2, BarChart3, MessageSquare, Shield, BookOpen,
    Home, Settings, Sparkles, Bug, GitBranch, Eye, LogOut, History
} from 'lucide-react';

export default function Sidebar() {
    const { mode, setMode, sidebarOpen, setSidebarOpen, currentUser, logout } = useApp();
    const location = useLocation();

    const navItems = [
        { path: '/', icon: <Home size={18} />, label: 'Dashboard', section: 'main' },
        { path: '/analyze', icon: <Code2 size={18} />, label: 'Code Analysis', section: 'main', badge: 'NEW' },
        { path: '/history', icon: <History size={18} />, label: 'Analysis History', section: 'tools' },
        { path: '/visualize', icon: <GitBranch size={18} />, label: 'Visualization', section: 'tools' },
        { path: '/refactor', icon: <Sparkles size={18} />, label: 'Refactoring', section: 'tools' },
        { path: '/bugs', icon: <Bug size={18} />, label: 'Bug Prediction', section: 'tools' },
        { path: '/plagiarism', icon: <Shield size={18} />, label: 'Plagiarism Check', section: 'tools' },
        { path: '/progress', icon: <BarChart3 size={18} />, label: 'Progress', section: 'learn' },
        { path: '/learn', icon: <BookOpen size={18} />, label: 'Learning Hub', section: 'learn' },
    ];

    const sections = {
        main: 'Navigation',
        tools: 'Analysis Tools',
        learn: 'Learning'
    };

    const grouped = {};
    navItems.forEach(item => {
        if (!grouped[item.section]) grouped[item.section] = [];
        grouped[item.section].push(item);
    });

    return (
        <>
            <div className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
                onClick={() => setSidebarOpen(false)} />
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <Code2 size={22} color="white" />
                    </div>
                    <div className="sidebar-logo-text">
                        <span className="sidebar-logo-title">CodeMentor AI</span>
                        <span className="sidebar-logo-subtitle">Quality Assistant</span>
                    </div>
                </div>

                {/* User Profile Mini */}
                {currentUser && (
                    <div className="sidebar-user-profile">
                        <div className="sidebar-user-avatar">
                            {currentUser.profileAvatar || currentUser.fullName?.charAt(0)}
                        </div>
                        <div className="sidebar-user-info">
                            <span className="sidebar-user-name">{currentUser.fullName}</span>
                            <span className="sidebar-user-role">{currentUser.role} · {currentUser.experience}</span>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {Object.entries(grouped).map(([section, items]) => (
                        <div key={section}>
                            <div className="sidebar-section-title">{sections[section]}</div>
                            {items.map(item => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `sidebar-nav-item ${isActive ? 'active' : ''}`
                                    }
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <span className="sidebar-nav-icon">{item.icon}</span>
                                    {item.label}
                                    {item.badge && (
                                        <span className="sidebar-badge">{item.badge}</span>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                        Learning Mode
                    </div>
                    <div className="sidebar-mode-toggle">
                        <button
                            className={`sidebar-mode-btn ${mode === 'beginner' ? 'active' : ''}`}
                            onClick={() => setMode('beginner')}
                        >
                            <Eye size={12} style={{ marginRight: 4 }} />
                            Beginner
                        </button>
                        <button
                            className={`sidebar-mode-btn ${mode === 'expert' ? 'active' : ''}`}
                            onClick={() => setMode('expert')}
                        >
                            <Sparkles size={12} style={{ marginRight: 4 }} />
                            Expert
                        </button>
                    </div>

                    {/* Logout Button */}
                    <button
                        className="sidebar-logout-btn"
                        onClick={logout}
                        id="logout-btn"
                    >
                        <LogOut size={14} />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}
