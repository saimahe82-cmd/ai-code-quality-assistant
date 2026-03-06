import { useRef, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import {
    Upload, Play, Trash2, FileCode, Copy, Check, Terminal, X,
    RotateCcw, Eye, Loader
} from 'lucide-react';
import { sampleCodes } from '../data/sampleData';
import { detectLanguage } from '../utils/analysisEngine';
import { interpretCode } from '../utils/codeRunner';

export default function CodeEditor() {
    const { code, setCode, language, setLanguage, runAnalysis, clearAnalysis, isAnalyzing } = useApp();
    const fileInputRef = useRef(null);
    const [copied, setCopied] = useState(false);
    const [lineCount, setLineCount] = useState(0);

    // ─── Compiler State ───
    const [compileResult, setCompileResult] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [showOutput, setShowOutput] = useState(false);
    const [showVars, setShowVars] = useState(false);
    const [pyStatus, setPyStatus] = useState('idle'); // idle | loading | ready | error

    const handleCodeChange = (e) => {
        const newCode = e.target.value;
        setCode(newCode);
        setLineCount(newCode.split('\n').length);
        if (newCode.length > 30) {
            const detected = detectLanguage(newCode);
            setLanguage(detected);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            setCode(content);
            setLineCount(content.split('\n').length);
            const detected = detectLanguage(content, file.name);
            setLanguage(detected);
        };
        reader.readAsText(file);
    };

    const loadSample = (lang, level = 'beginner') => {
        const sample = sampleCodes[lang]?.[level] || sampleCodes[lang]?.beginner;
        if (sample) {
            setCode(sample);
            setLanguage(lang);
            setLineCount(sample.split('\n').length);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleAnalyze = () => {
        if (code.trim()) runAnalysis();
    };

    const handleClear = () => {
        setCode('');
        setLineCount(0);
        clearAnalysis();
        setCompileResult(null);
        setShowOutput(false);
    };

    // ─── Compile & Run ───
    const handleRunCode = useCallback(async () => {
        if (!code.trim()) return;

        setIsRunning(true);
        setShowOutput(true);
        setCompileResult(null);

        try {
            if (language === 'python') {
                // ── Use Pyodide for real Python execution ──
                setPyStatus('loading');
                const { executePython } = await import('../utils/pyodideService.js');
                setPyStatus('ready');

                const startTime = performance.now();
                const pyResult = await executePython(code);
                const elapsed = performance.now() - startTime;

                setCompileResult({
                    output: pyResult.output || [],
                    errors: pyResult.error ? [pyResult.error] : [],
                    error: pyResult.error,
                    executionTime: pyResult.executionTime || elapsed,
                    variables: pyResult.variables || {},
                    exitCode: pyResult.error ? 1 : 0,
                });
            } else {
                // ── Use local interpreter for JS/Java/C ──
                let result;
                try {
                    result = interpretCode(code, language);
                } catch (e) {
                    result = {
                        steps: [{ line: 1, code: '', type: 'error', error: 'Compilation error: ' + (e.message || 'Unknown') }],
                        output: [], error: e.message, executionTime: 0, variables: {}
                    };
                }

                if (!result) result = { steps: [], output: [], error: 'No result', executionTime: 0, variables: {} };
                if (!result.steps) result.steps = [];
                if (!result.output) result.output = [];
                if (!result.variables) result.variables = {};
                if (result.executionTime === undefined) result.executionTime = 0;

                const allOutput = result.steps
                    .filter(s => s.type === 'output' && s.output)
                    .map(s => s.output);
                const allErrors = result.steps
                    .filter(s => s.type === 'error')
                    .map(s => s.error);

                setCompileResult({
                    output: allOutput,
                    errors: allErrors,
                    error: result.error,
                    executionTime: result.executionTime,
                    variables: result.variables || {},
                    exitCode: allErrors.length > 0 ? 1 : 0,
                });
            }
        } catch (e) {
            setPyStatus('error');
            setCompileResult({
                output: [],
                errors: [e.message || 'Failed to run code'],
                error: e.message,
                executionTime: 0,
                variables: {},
                exitCode: 1,
            });
        }

        setIsRunning(false);
    }, [code, language]);

    const handleKeyDown = (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            const newCode = code.substring(0, start) + '    ' + code.substring(end);
            setCode(newCode);
            setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = start + 4; }, 0);
        }
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleAnalyze();
        }
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            handleRunCode();
        }
    };

    const getRunButtonText = () => {
        if (!isRunning) return 'Run Code';
        if (language === 'python') {
            if (pyStatus === 'loading') return 'Loading Python...';
            return 'Running...';
        }
        return 'Compiling...';
    };

    return (
        <div className="code-editor-wrapper">
            {/* Header */}
            <div className="code-editor-header">
                <div className="code-editor-dots">
                    <span className="code-editor-dot red" />
                    <span className="code-editor-dot yellow" />
                    <span className="code-editor-dot green" />
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                        className="input select"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        style={{ padding: '4px 28px 4px 10px', fontSize: '12px', background: 'var(--bg-input)', minWidth: '110px' }}
                    >
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                        <option value="java">Java</option>
                        <option value="c">C/C++</option>
                    </select>
                    <button className="btn btn-ghost btn-sm" onClick={handleCopy} title="Copy code">
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                </div>
            </div>

            {/* Line Numbers + Editor */}
            <div className="code-editor-body">
                <div className="code-line-numbers">
                    {Array.from({ length: Math.max(lineCount, code.split('\n').length, 1) }, (_, i) => (
                        <span key={i + 1} className="code-line-num">
                            {i + 1}
                        </span>
                    ))}
                </div>
            </div>

            {/* Editor */}
            <div style={{ position: 'relative' }}>
                <textarea
                    className="code-textarea"
                    value={code}
                    onChange={handleCodeChange}
                    onKeyDown={handleKeyDown}
                    placeholder={`// Paste your ${language} code here...\n// Press Ctrl+Enter to analyze | Shift+Enter to run\n\n${language === 'python'
                        ? 'x = 10\ny = 20\nresult = x + y\nprint("Sum:", result)'
                        : 'let x = 10;\nlet y = 20;\nlet result = x + y;\nconsole.log("Sum:", result);'
                        }`}
                    spellCheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                />
                {isAnalyzing && (
                    <div className="loading-overlay">
                        <div className="loading-spinner" />
                        <div className="loading-text">Analyzing your code...</div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="code-editor-footer">
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <FileCode size={12} />
                    <span>{lineCount} lines</span>
                    <span style={{ margin: '0 6px', opacity: 0.3 }}>|</span>
                    <span>{language}</span>
                    <span style={{ margin: '0 6px', opacity: 0.3 }}>|</span>
                    <span>UTF-8</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', opacity: 0.5 }}>Ctrl+Enter: analyze · Shift+Enter: run</span>
                    {language === 'python' && pyStatus === 'ready' && (
                        <span style={{
                            fontSize: '10px', padding: '1px 7px', borderRadius: '10px',
                            background: 'rgba(0,184,148,0.12)', color: '#55efc4'
                        }}>🐍 CPython Ready</span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div style={{
                padding: '12px 16px', background: 'var(--bg-tertiary)',
                borderTop: '1px solid var(--border-color)',
                display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={handleAnalyze} disabled={!code.trim() || isAnalyzing}>
                        <Play size={14} />
                        Analyze Code
                    </button>
                    <button
                        className="btn btn-success"
                        onClick={handleRunCode}
                        disabled={!code.trim() || isRunning}
                        id="run-code-btn"
                    >
                        {isRunning ? (
                            <><Loader size={14} className="spin-icon" /> {getRunButtonText()}</>
                        ) : (
                            <><Terminal size={14} /> Run Code</>
                        )}
                    </button>
                    <button className="btn btn-secondary" onClick={() => fileInputRef.current.click()}>
                        <Upload size={14} />
                        Upload
                    </button>
                    <input ref={fileInputRef} type="file"
                        accept=".py,.js,.jsx,.ts,.tsx,.java,.c,.cpp,.cs,.rb,.go,.rs,.php,.txt"
                        onChange={handleFileUpload} style={{ display: 'none' }} />
                    {code && (
                        <button className="btn btn-ghost btn-sm" onClick={handleClear}>
                            <Trash2 size={14} /> Clear
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ fontSize: '11px', opacity: 0.4 }}>Load Sample:</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => loadSample('python', 'beginner')}>🐍 Python</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => loadSample('javascript', 'beginner')}>⚡ JS</button>
                </div>
            </div>

            {/* ═══ COMPILER OUTPUT PANEL ═══ */}
            {showOutput && (
                <div className="code-output-panel" id="code-output-panel">
                    {/* Header */}
                    <div className="code-output-header">
                        <div className="code-output-header-left">
                            <Terminal size={14} />
                            <span className="code-output-header-title">
                                {language === 'python' ? 'Python Output' : 'Output'}
                            </span>
                            {compileResult && compileResult.executionTime !== undefined && (
                                <span className="code-output-time">
                                    {(compileResult.executionTime || 0).toFixed(1)}ms
                                </span>
                            )}
                            {compileResult && compileResult.exitCode === 0 && (
                                <span className="code-output-success-badge">✓ Exit Code: 0</span>
                            )}
                            {compileResult && compileResult.exitCode !== 0 && (
                                <span className="code-output-error-badge">Exit Code: 1</span>
                            )}
                            {language === 'python' && pyStatus === 'ready' && (
                                <span style={{
                                    fontSize: '10px', padding: '1px 7px', borderRadius: '10px',
                                    background: 'rgba(0,184,148,0.12)', color: '#55efc4', marginLeft: '4px'
                                }}>🐍 Pyodide</span>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                                className={`code-output-action-btn ${showVars ? 'active-var' : ''}`}
                                onClick={() => setShowVars(!showVars)}
                                title="Toggle variable watch"
                            >
                                <Eye size={12} />
                            </button>
                            <button className="code-output-action-btn" onClick={handleRunCode} title="Re-run">
                                <RotateCcw size={12} />
                            </button>
                            <button className="code-output-action-btn"
                                onClick={() => { setCompileResult(null); setShowOutput(false); }}
                                title="Close">
                                <X size={12} />
                            </button>
                        </div>
                    </div>

                    {/* Output Body */}
                    <div className="interpreter-body">
                        {/* ─── Console Output ─── */}
                        <div className="interpreter-console" style={{ flex: 1 }}>
                            <div className="interpreter-steps-header console-header">
                                <span>Console</span>
                                {compileResult && (
                                    <span className="interpreter-output-count">
                                        {(compileResult.output || []).length} line{(compileResult.output || []).length !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                            <div className="interpreter-console-body" style={{ minHeight: '120px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                                {isRunning ? (
                                    <div className="code-output-empty" style={{ flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                        <div className="loading-spinner" style={{ width: 24, height: 24 }} />
                                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            {language === 'python' && pyStatus === 'loading'
                                                ? 'Loading Python runtime (first time may take a few seconds)...'
                                                : 'Running code...'}
                                        </span>
                                        {language === 'python' && pyStatus === 'loading' && (
                                            <div style={{
                                                fontSize: '11px', color: 'var(--text-tertiary)',
                                                background: 'rgba(108,92,231,0.08)', padding: '8px 14px',
                                                borderRadius: '8px', maxWidth: '300px', textAlign: 'center'
                                            }}>
                                                Downloading CPython via Pyodide (~6MB). This is cached after the first load.
                                            </div>
                                        )}
                                    </div>
                                ) : compileResult && compileResult.errors && compileResult.errors.length > 0 ? (
                                    <>
                                        {compileResult.output && compileResult.output.length > 0 && (
                                            compileResult.output.map((line, i) => (
                                                <div key={`out-${i}`} className="code-output-line">
                                                    <span className="code-output-line-text" style={{ color: 'var(--text-primary)' }}>{line}</span>
                                                </div>
                                            ))
                                        )}
                                        {compileResult.errors.map((err, i) => (
                                            <div key={`err-${i}`} className="code-output-error" style={{ marginTop: compileResult.output && compileResult.output.length > 0 ? '8px' : 0 }}>
                                                <span className="code-output-error-icon">❌</span>
                                                <div>
                                                    <div style={{ color: '#ff7675', fontWeight: 600 }}>Error</div>
                                                    <div style={{ color: '#fab1a0', marginTop: '4px', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{err}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                ) : compileResult && compileResult.output && compileResult.output.length > 0 ? (
                                    compileResult.output.map((line, i) => (
                                        <div key={i} className="code-output-line">
                                            <span className="code-output-line-num">{i + 1}</span>
                                            <span className="code-output-line-text" style={{ color: '#55efc4' }}>{line}</span>
                                        </div>
                                    ))
                                ) : compileResult ? (
                                    <div className="code-output-empty">
                                        <span style={{ color: 'var(--text-secondary)' }}>Program executed successfully with no output.</span>
                                        <span className="code-output-hint">
                                            {language === 'python' ? 'Add print() to see output.' :
                                                language === 'javascript' ? 'Add console.log() to see output.' :
                                                    'Add System.out.println() to see output.'}
                                        </span>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {/* ─── Variable Watch ─── */}
                        {showVars && compileResult && compileResult.variables && (
                            <div className="interpreter-vars">
                                <div className="interpreter-steps-header vars-header">
                                    <span>Variables</span>
                                    <span className="interpreter-output-count">{Object.keys(compileResult.variables).length}</span>
                                </div>
                                <div className="interpreter-vars-body">
                                    {Object.keys(compileResult.variables).length > 0 ? (
                                        Object.entries(compileResult.variables).map(([name, val]) => (
                                            <div key={name} className="interpreter-var-row">
                                                <span className="interpreter-var-name">{name}</span>
                                                <span className="interpreter-var-eq">=</span>
                                                <span className="interpreter-var-value">
                                                    {typeof val === 'string' ? `"${val}"` : JSON.stringify(val)}
                                                </span>
                                                <span className="interpreter-var-type">
                                                    {Array.isArray(val) ? 'list' : typeof val}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="code-output-empty">
                                            <span>No variables tracked.</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
