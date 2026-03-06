import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { analyzeCode, generateRefactorings, generateFlowchart, predictBugs, checkPlagiarism } from '../utils/analysisEngine';
import { sampleCorpus } from '../data/sampleData';
import { saveCodeHistory, getCodeHistory, getUserById } from '../data/database';
import { hasApiKey, getAICodeAnalysis } from '../utils/openaiService';

const AppContext = createContext();

export function AppProvider({ children }) {
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('python');
    const [mode, setMode] = useState('beginner'); // beginner | expert
    const [analysisResult, setAnalysisResult] = useState(null);
    const [refactorings, setRefactorings] = useState([]);
    const [flowchartData, setFlowchartData] = useState([]);
    const [bugPredictions, setBugPredictions] = useState([]);
    const [plagiarismResult, setPlagiarismResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // ─── OpenAI API Key State ───
    const [apiKeyConfigured, setApiKeyConfigured] = useState(() => hasApiKey());
    const refreshApiKeyStatus = useCallback(() => setApiKeyConfigured(hasApiKey()), []);

    // ─── AI Analysis Result (separate from local) ───
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [aiError, setAiError] = useState('');

    // ─── Authentication State ───
    const [currentUser, setCurrentUserState] = useState(() => {
        try {
            const saved = localStorage.getItem('codementor_currentUser');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    const setCurrentUser = useCallback((user) => {
        setCurrentUserState(user);
        if (user) {
            localStorage.setItem('codementor_currentUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('codementor_currentUser');
        }
    }, []);

    const syncCurrentUser = useCallback(() => {
        if (currentUser?.id) {
            const freshUser = getUserById(currentUser.id);
            if (freshUser) {
                setCurrentUser(freshUser);
            }
        }
    }, [currentUser?.id, setCurrentUser]);

    const logout = useCallback(() => {
        setCurrentUser(null);
        setAnalysisResult(null);
        setRefactorings([]);
        setFlowchartData([]);
        setBugPredictions([]);
        setPlagiarismResult(null);
        setCode('');
        setAnalysisHistory([]);
        setAiAnalysis(null);
        setAiError('');
    }, [setCurrentUser]);

    // ─── Per-User Analysis History ───
    const [analysisHistory, setAnalysisHistory] = useState([]);

    useEffect(() => {
        if (currentUser?.id) {
            const userHistory = getCodeHistory(currentUser.id);
            setAnalysisHistory(userHistory);
        } else {
            setAnalysisHistory([]);
        }
    }, [currentUser?.id]);

    // ─── Run Analysis (local + optional AI) ───
    const runAnalysis = useCallback(async (codeInput = null, lang = null) => {
        const codeToAnalyze = codeInput || code;
        const langToUse = lang || language;

        if (!codeToAnalyze.trim()) return;

        setIsAnalyzing(true);
        setAiError('');

        // 1. Run local analysis immediately (fast)
        const result = analyzeCode(codeToAnalyze, langToUse);
        setAnalysisResult(result);
        setLanguage(result.language);

        const refactors = generateRefactorings(codeToAnalyze, result.issues, result.language);
        setRefactorings(refactors);

        const flowchart = generateFlowchart(codeToAnalyze, result.language);
        setFlowchartData(flowchart);

        const bugs = predictBugs(codeToAnalyze, result.language);
        setBugPredictions(bugs);

        const plagiarism = checkPlagiarism(codeToAnalyze, sampleCorpus);
        setPlagiarismResult(plagiarism);

        // 2. Run AST Analysis for Python (Deep Analysis)
        if (result.language === 'python') {
            try {
                const { analyzePythonWithAST } = await import('../utils/pyodideService.js');
                const astResult = await analyzePythonWithAST(codeToAnalyze);

                if (astResult) {
                    setAnalysisResult(prev => ({
                        ...prev,
                        issues: [...(prev?.issues || []), ...(astResult.issues || [])],
                        metrics: { ...prev.metrics, ...astResult.metrics },
                        functions: astResult.functions || []
                    }));
                }
            } catch (err) {
                console.warn('AST Analysis for Python failed or not ready:', err);
            }
        }


        // 2. If OpenAI key is configured, also run AI analysis
        if (hasApiKey()) {
            try {
                const aiResult = await getAICodeAnalysis(codeToAnalyze, langToUse, mode);
                setAiAnalysis(aiResult);

                // Merge AI insights into the analysis result
                if (aiResult?.score) {
                    setAnalysisResult(prev => ({
                        ...prev,
                        aiScore: aiResult.score,
                        aiSummary: aiResult.summary,
                        aiCodeStatus: aiResult.codeStatus,
                    }));
                }

                // Merge AI issues (mark them as AI-found)
                if (aiResult?.issues?.length > 0) {
                    const aiIssues = aiResult.issues.map((issue, i) => ({
                        ...issue,
                        id: `AI${String(i + 1).padStart(3, '0')}`,
                        isAI: true,
                        line: issue.line || 0,
                        lineContent: issue.line ? codeToAnalyze.split('\n')[issue.line - 1] || '' : '',
                    }));
                    setAnalysisResult(prev => ({
                        ...prev,
                        issues: [...(prev?.issues || []), ...aiIssues],
                        syntaxErrors: [
                            ...(prev?.syntaxErrors || []),
                            ...aiIssues.filter(i => i.severity === 'error' && i.category === 'syntax')
                        ],
                        styleIssues: [
                            ...(prev?.styleIssues || []),
                            ...aiIssues.filter(i => i.severity !== 'error' || i.category !== 'syntax')
                        ]
                    }));
                }

                // AI refactoring suggestions
                if (aiResult?.refactoringSuggestions?.length > 0) {
                    setRefactorings(prev => [
                        ...prev,
                        ...aiResult.refactoringSuggestions.map(r => ({
                            ...r,
                            isAI: true
                        }))
                    ]);
                }

                // AI bug risks
                if (aiResult?.bugRisks?.length > 0) {
                    setBugPredictions(prev => [
                        ...prev,
                        ...aiResult.bugRisks.map(b => ({
                            title: b.title,
                            description: b.description,
                            suggestion: b.suggestion,
                            type: b.probability === 'high' ? 'error' : 'warning',
                            isAI: true
                        }))
                    ]);
                }
            } catch (err) {
                console.error('AI analysis failed:', err);
                setAiError(err.message);
            }
        }

        // Final Save to per-user history (after local + AST + optional AI)
        // Note: For simplicity, we use the values available at this point in the function
        const currentResult = analyzeCode(codeToAnalyze, langToUse); // Recalculate or use reactive state? 
        // Recalculating is safer than relying on state which hasn't updated yet.

        if (currentUser?.id) {
            const historyEntry = {
                code: codeToAnalyze,
                language: currentResult.language || langToUse,
                score: currentResult.score.overall,
                issueCount: currentResult.issues.length,
                issues: currentResult.issues,
                issueTypes: currentResult.issues.reduce((acc, issue) => {
                    acc[issue.category] = (acc[issue.category] || 0) + 1;
                    return acc;
                }, {})
            };
            const updatedHistory = saveCodeHistory(currentUser.id, historyEntry);
            setAnalysisHistory(updatedHistory);
            syncCurrentUser(); // Sync user data (e.g. analysisCount)
        }

        setIsAnalyzing(false);
    }, [code, language, currentUser?.id, mode]);

    const clearAnalysis = useCallback(() => {
        setAnalysisResult(null);
        setRefactorings([]);
        setFlowchartData([]);
        setBugPredictions([]);
        setPlagiarismResult(null);
        setAiAnalysis(null);
        setAiError('');
    }, []);

    const value = {
        code, setCode,
        language, setLanguage,
        mode, setMode,
        analysisResult, setAnalysisResult,
        refactorings,
        flowchartData,
        bugPredictions,
        plagiarismResult,
        isAnalyzing,
        runAnalysis,
        clearAnalysis,
        analysisHistory,
        sidebarOpen, setSidebarOpen,
        // Auth
        currentUser, setCurrentUser, logout,
        // OpenAI
        apiKeyConfigured, refreshApiKeyStatus,
        aiAnalysis, aiError
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
