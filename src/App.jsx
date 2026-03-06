import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Chatbot from './components/Chatbot';
import Dashboard from './pages/Dashboard';
import AnalyzePage from './pages/AnalyzePage';
import VisualizePage from './pages/VisualizePage';
import RefactorPage from './pages/RefactorPage';
import BugsPage from './pages/BugsPage';
import PlagiarismPage from './pages/PlagiarismPage';
import ProgressPage from './pages/ProgressPage';
import LearnPage from './pages/LearnPage';
import HistoryPage from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import { Menu } from 'lucide-react';

/* ─── Authenticated App Layout (Sidebar + Pages) ─── */
function AppLayout() {
  const { setSidebarOpen } = useApp();

  return (
    <div className="app-layout">
      {/* Mobile menu toggle */}
      <button
        className="mobile-menu-toggle"
        onClick={() => setSidebarOpen(prev => !prev)}
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>

      <Sidebar />

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analyze" element={<AnalyzePage />} />
          <Route path="/visualize" element={<VisualizePage />} />
          <Route path="/refactor" element={<RefactorPage />} />
          <Route path="/bugs" element={<BugsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/plagiarism" element={<PlagiarismPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/learn" element={<LearnPage />} />
          {/* Redirect auth pages to dashboard if already logged in */}
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/signup" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Chatbot />
    </div>
  );
}

/* ─── Auth Layout (Login / SignUp — no sidebar) ─── */
function AuthLayout() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      {/* Any other route redirects to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

/* ─── Root App — decides which layout to show ─── */
function AppRoot() {
  const { currentUser } = useApp();

  return currentUser ? <AppLayout /> : <AuthLayout />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoot />
      </AppProvider>
    </BrowserRouter>
  );
}
