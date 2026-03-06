/* ═══════════════════════════════════════════════════════════════════════
   Pyodide Service — Real CPython interpreter in the browser via WASM
   Loads Pyodide (CPython compiled to WebAssembly) for full Python support
   ═══════════════════════════════════════════════════════════════════════ */

const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/';
let pyodideInstance = null;
let pyodideLoading = false;
let pyodideLoadPromise = null;
let onStatusChange = null;

/**
 * Get the current Pyodide loading status.
 */
export function getPyodideStatus() {
    if (pyodideInstance) return 'ready';
    if (pyodideLoading) return 'loading';
    return 'idle';
}

/**
 * Set a callback to be notified of loading status changes.
 */
export function onPyodideStatusChange(callback) {
    onStatusChange = callback;
}

function updateStatus(status) {
    if (onStatusChange) onStatusChange(status);
}

/**
 * Load Pyodide from CDN (only once, cached on subsequent calls).
 * Returns the Pyodide instance.
 */
export async function loadPyodide() {
    if (pyodideInstance) return pyodideInstance;

    if (pyodideLoadPromise) return pyodideLoadPromise;

    pyodideLoading = true;
    updateStatus('loading');

    pyodideLoadPromise = (async () => {
        try {
            // Dynamically load the Pyodide script from CDN
            if (!window.loadPyodide) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = PYODIDE_CDN + 'pyodide.js';
                    script.onload = resolve;
                    script.onerror = () => reject(new Error('Failed to load Pyodide script from CDN'));
                    document.head.appendChild(script);
                });
            }

            // Initialize Pyodide
            pyodideInstance = await window.loadPyodide({
                indexURL: PYODIDE_CDN,
                stdout: () => { },  // We capture output ourselves
                stderr: () => { },
            });

            // Preload useful setup
            await pyodideInstance.runPythonAsync(`
import sys
import io
import json
import ast
import traceback

# Helper to capture stdout
class OutputCapture:
    def __init__(self):
        self.outputs = []
        self.old_stdout = None
        self.old_stderr = None
    
    def start(self):
        self.outputs = []
        self.old_stdout = sys.stdout
        self.old_stderr = sys.stderr
        sys.stdout = io.StringIO()
        sys.stderr = io.StringIO()
    
    def stop(self):
        stdout_val = sys.stdout.getvalue()
        stderr_val = sys.stderr.getvalue()
        sys.stdout = self.old_stdout
        sys.stderr = self.old_stderr
        if stdout_val:
            self.outputs.extend(stdout_val.rstrip('\\n').split('\\n'))
        return self.outputs, stderr_val

_capture = OutputCapture()
            `);

            pyodideLoading = false;
            updateStatus('ready');
            console.log('✅ Pyodide loaded successfully (CPython in WASM)');
            return pyodideInstance;
        } catch (e) {
            pyodideLoading = false;
            pyodideLoadPromise = null;
            updateStatus('error');
            console.error('❌ Failed to load Pyodide:', e);
            throw e;
        }
    })();

    return pyodideLoadPromise;
}

/**
 * Execute Python code using real CPython (via Pyodide).
 * Returns: { output: string[], error: string|null, executionTime: number, variables: Object }
 */
export async function executePython(code) {
    const pyodide = await loadPyodide();
    const startTime = performance.now();

    try {
        // Start output capture
        await pyodide.runPythonAsync('_capture.start()');

        // Execute the user's code
        await pyodide.runPythonAsync(code);

        // Stop capture and get output
        const resultProxy = await pyodide.runPythonAsync(`
import json as _json
_out, _err = _capture.stop()

# Gather variables (skip private/module vars)
_user_vars = {}
for _k, _v in list(globals().items()):
    if not _k.startswith('_') and _k not in ('sys', 'io', 'json', 'ast', 'traceback', 'OutputCapture'):
        try:
            _json.dumps(_v)  # check if serializable
            _user_vars[_k] = _v
        except (TypeError, ValueError):
            _user_vars[_k] = str(_v)

_json.dumps({"output": _out, "error": _err if _err else None, "variables": _user_vars})
        `);

        const result = JSON.parse(resultProxy);
        const executionTime = performance.now() - startTime;

        return {
            output: result.output || [],
            error: result.error || null,
            executionTime,
            variables: result.variables || {}
        };
    } catch (e) {
        // Stop capture on error
        try { await pyodide.runPythonAsync('_capture.stop()'); } catch { }

        const executionTime = performance.now() - startTime;
        let errorMsg = e.message || String(e);

        // Clean up Pyodide error messages for readability
        if (errorMsg.includes('PythonError:')) {
            const lines = errorMsg.split('\n');
            const tbLine = lines.find(l => l.includes('Error:') || l.includes('Exception:'));
            if (tbLine) errorMsg = tbLine.trim();
        }

        return {
            output: [],
            error: errorMsg,
            executionTime,
            variables: {}
        };
    }
}

/**
 * Analyze Python code using real AST parsing and py_compile.
 * Returns structured analysis results.
 */
export async function analyzePythonWithAST(code) {
    const pyodide = await loadPyodide();

    try {
        const analysisCode = `
import json as _json
import ast as _ast
import sys as _sys

_code = ${JSON.stringify(code)}
_issues = []
_metrics = {
    "functions": 0,
    "classes": 0,
    "imports": 0,
    "lines": len(_code.split('\\n')),
    "blank_lines": sum(1 for l in _code.split('\\n') if not l.strip()),
    "comment_lines": sum(1 for l in _code.split('\\n') if l.strip().startswith('#')),
    "complexity": 0
}

# ─── Step 1: Syntax Check ───
_syntax_valid = True
_syntax_error = None
try:
    _tree = _ast.parse(_code)
except SyntaxError as e:
    _syntax_valid = False
    _syntax_error = {
        "line": e.lineno or 1,
        "col": e.offset or 0,
        "msg": str(e.msg),
        "text": e.text.strip() if e.text else ""
    }
    _issues.append({
        "severity": "error",
        "category": "syntax",
        "title": f"SyntaxError on line {e.lineno}",
        "description": str(e.msg),
        "line": e.lineno or 1,
        "suggestion": "Fix the syntax error before proceeding."
    })

if _syntax_valid:
    # ─── Step 2: AST Analysis ───
    
    _defined_names = set()
    _used_names = set()
    _imported_names = set()
    _function_complexities = []
    
    class _Analyzer(_ast.NodeVisitor):
        def __init__(self):
            self.current_function = None
            self.function_lines = {}
        
        def visit_FunctionDef(self, node):
            _metrics["functions"] += 1
            _defined_names.add(node.name)
            
            # Check naming convention (should be snake_case)
            if not node.name.startswith('_') and not node.name.islower() and '_' not in node.name:
                if any(c.isupper() for c in node.name[1:]):
                    _issues.append({
                        "severity": "suggestion",
                        "category": "naming",
                        "title": f"Function '{node.name}' uses camelCase",
                        "description": "PEP 8 recommends snake_case for function names.",
                        "line": node.lineno,
                        "suggestion": f"Rename to: {self._to_snake_case(node.name)}"
                    })
            
            # Check for docstring
            if not (_ast.get_docstring(node)):
                _issues.append({
                    "severity": "info",
                    "category": "readability",
                    "title": f"Function '{node.name}' missing docstring",
                    "description": "Functions should have docstrings explaining their purpose.",
                    "line": node.lineno,
                    "suggestion": f'Add: def {node.name}(...):\\n    """Description here."""'
                })
            
            # Count complexity (branches)
            complexity = 1
            for child in _ast.walk(node):
                if isinstance(child, (_ast.If, _ast.For, _ast.While, _ast.ExceptHandler,
                                     _ast.With, _ast.Assert, _ast.comprehension)):
                    complexity += 1
                elif isinstance(child, _ast.BoolOp):
                    complexity += len(child.values) - 1
            
            _function_complexities.append({"name": node.name, "complexity": complexity, "line": node.lineno})
            
            if complexity > 10:
                _issues.append({
                    "severity": "warning",
                    "category": "complexity",
                    "title": f"Function '{node.name}' has high complexity ({complexity})",
                    "description": f"Cyclomatic complexity is {complexity}. Functions with complexity > 10 are hard to test and maintain.",
                    "line": node.lineno,
                    "suggestion": "Break this function into smaller, focused functions."
                })
            
            self.function_lines[node.name] = node.end_lineno - node.lineno + 1 if node.end_lineno else 0
            if self.function_lines[node.name] > 50:
                _issues.append({
                    "severity": "warning",
                    "category": "readability",
                    "title": f"Function '{node.name}' is too long ({self.function_lines[node.name]} lines)",
                    "description": "Long functions are hard to understand and maintain.",
                    "line": node.lineno,
                    "suggestion": "Consider splitting into smaller helper functions."
                })
            
            self.generic_visit(node)
        
        def visit_AsyncFunctionDef(self, node):
            self.visit_FunctionDef(node)
        
        def visit_ClassDef(self, node):
            _metrics["classes"] += 1
            _defined_names.add(node.name)
            
            # Check class naming (should be PascalCase)
            if node.name[0].islower():
                _issues.append({
                    "severity": "suggestion",
                    "category": "naming",
                    "title": f"Class '{node.name}' should use PascalCase",
                    "description": "PEP 8 recommends PascalCase for class names.",
                    "line": node.lineno,
                    "suggestion": f"Rename to: {node.name[0].upper() + node.name[1:]}"
                })
            
            if not _ast.get_docstring(node):
                _issues.append({
                    "severity": "info",
                    "category": "readability",
                    "title": f"Class '{node.name}' missing docstring",
                    "description": "Classes should have docstrings.",
                    "line": node.lineno,
                    "suggestion": f'Add: class {node.name}:\\n    """Description here."""'
                })
            
            self.generic_visit(node)
        
        def visit_Import(self, node):
            _metrics["imports"] += 1
            for alias in node.names:
                _imported_names.add(alias.asname or alias.name)
            self.generic_visit(node)
        
        def visit_ImportFrom(self, node):
            _metrics["imports"] += 1
            for alias in node.names:
                if alias.name == '*':
                    _issues.append({
                        "severity": "warning",
                        "category": "imports",
                        "title": f"Wildcard import from '{node.module}'",
                        "description": "Wildcard imports pollute the namespace and make it unclear what's available.",
                        "line": node.lineno,
                        "suggestion": f"Import specific names: from {node.module} import name1, name2"
                    })
                else:
                    _imported_names.add(alias.asname or alias.name)
            self.generic_visit(node)
        
        def visit_Name(self, node):
            if isinstance(node.ctx, _ast.Load):
                _used_names.add(node.id)
            self.generic_visit(node)
        
        def visit_Global(self, node):
            for name in node.names:
                _issues.append({
                    "severity": "warning",
                    "category": "bestpractice",
                    "title": f"Global variable '{name}' used",
                    "description": "Global variables make code harder to test and debug.",
                    "line": node.lineno,
                    "suggestion": "Pass values as function parameters instead of using globals."
                })
            self.generic_visit(node)
        
        def visit_ExceptHandler(self, node):
            if node.type is None:
                _issues.append({
                    "severity": "warning",
                    "category": "bestpractice",
                    "title": "Bare except clause",
                    "description": "Catching all exceptions makes debugging difficult.",
                    "line": node.lineno,
                    "suggestion": "Catch specific exceptions: except ValueError as e:"
                })
            self.generic_visit(node)
        
        def visit_Compare(self, node):
            for op, comparator in zip(node.ops, node.comparators):
                if isinstance(op, (_ast.Eq, _ast.NotEq)):
                    if isinstance(comparator, _ast.Constant) and comparator.value is None:
                        _issues.append({
                            "severity": "warning",
                            "category": "bestpractice",
                            "title": "Comparison to None using == or !=",
                            "description": "Use 'is None' or 'is not None' instead.",
                            "line": node.lineno,
                            "suggestion": "Use: if x is None:  or  if x is not None:"
                        })
                    if isinstance(comparator, _ast.Constant) and isinstance(comparator.value, bool):
                        _issues.append({
                            "severity": "suggestion",
                            "category": "readability",
                            "title": "Comparison to True/False",
                            "description": "Direct boolean check is more Pythonic.",
                            "line": node.lineno,
                            "suggestion": "Use: if condition:  instead of: if condition == True:"
                        })
            self.generic_visit(node)
        
        def visit_Call(self, node):
            if isinstance(node.func, _ast.Name):
                if node.func.id == 'eval':
                    _issues.append({
                        "severity": "error",
                        "category": "security",
                        "title": "Use of eval()",
                        "description": "eval() executes arbitrary code and is a security risk.",
                        "line": node.lineno,
                        "suggestion": "Use ast.literal_eval() for safe evaluation of literals."
                    })
                elif node.func.id == 'exec':
                    _issues.append({
                        "severity": "error",
                        "category": "security",
                        "title": "Use of exec()",
                        "description": "exec() executes arbitrary code and is a security risk.",
                        "line": node.lineno,
                        "suggestion": "Avoid exec(). Use proper function calls instead."
                    })
                elif node.func.id == 'type' and len(node.args) == 1:
                    # type() for type checking
                    _issues.append({
                        "severity": "suggestion",
                        "category": "bestpractice",
                        "title": "Use isinstance() instead of type()",
                        "description": "isinstance() also checks for inheritance.",
                        "line": node.lineno,
                        "suggestion": "Use: isinstance(obj, MyClass) instead of: type(obj) == MyClass"
                    })
            self.generic_visit(node)
        
        def visit_Assign(self, node):
            # Check for mutable default assignment that shadows
            for target in node.targets:
                if isinstance(target, _ast.Name):
                    _defined_names.add(target.id)
                    # Single-char variable name (except common ones)
                    if len(target.id) == 1 and target.id not in ('i', 'j', 'k', 'x', 'y', 'z', 'e', '_'):
                        _issues.append({
                            "severity": "info",
                            "category": "readability",
                            "title": f"Single-character variable name '{target.id}' on line {node.lineno}",
                            "description": "Use descriptive names for better readability.",
                            "line": node.lineno,
                            "suggestion": f"Rename '{target.id}' to something descriptive."
                        })
            self.generic_visit(node)
        
        def visit_For(self, node):
            _metrics["complexity"] += 1
            # Check for range(len(...)) anti-pattern
            if (isinstance(node.iter, _ast.Call) and 
                isinstance(node.iter.func, _ast.Name) and 
                node.iter.func.id == 'range' and
                len(node.iter.args) == 1 and
                isinstance(node.iter.args[0], _ast.Call) and
                isinstance(node.iter.args[0].func, _ast.Name) and
                node.iter.args[0].func.id == 'len'):
                _issues.append({
                    "severity": "suggestion",
                    "category": "readability",
                    "title": "range(len(...)) pattern detected",
                    "description": "Use enumerate() instead for more Pythonic code.",
                    "line": node.lineno,
                    "suggestion": "Use: for i, item in enumerate(my_list):"
                })
            self.generic_visit(node)
        
        def visit_If(self, node):
            _metrics["complexity"] += 1
            self.generic_visit(node)
        
        def visit_While(self, node):
            _metrics["complexity"] += 1
            # Check for while True without break
            if isinstance(node.test, _ast.Constant) and node.test.value is True:
                has_break = any(isinstance(n, _ast.Break) for n in _ast.walk(node))
                if not has_break:
                    _issues.append({
                        "severity": "warning",
                        "category": "logic",
                        "title": "while True without break",
                        "description": "This loop may run forever.",
                        "line": node.lineno,
                        "suggestion": "Add a break condition inside the loop."
                    })
            self.generic_visit(node)
        
        def _to_snake_case(self, name):
            result = []
            for i, c in enumerate(name):
                if c.isupper() and i > 0:
                    result.append('_')
                result.append(c.lower())
            return ''.join(result)
    
    _analyzer = _Analyzer()
    _analyzer.visit(_tree)
    
    # Check for unused imports  
    _unused_imports = _imported_names - _used_names - _defined_names
    for _name in _unused_imports:
        _issues.append({
            "severity": "warning",
            "category": "imports",
            "title": f"Unused import: '{_name}'",
            "description": f"'{_name}' is imported but never used.",
            "line": 1,
            "suggestion": f"Remove unused import: {_name}"
        })
    
    # Check line length
    for _i, _line in enumerate(_code.split('\\n'), 1):
        if len(_line) > 100:
            _issues.append({
                "severity": "info",
                "category": "readability",
                "title": f"Line {_i} exceeds 100 characters ({len(_line)})",
                "description": "PEP 8 recommends lines be at most 79-100 characters.",
                "line": _i,
                "suggestion": "Break the line into multiple shorter lines."
            })
    
    _metrics["complexity"] = sum(fc["complexity"] for fc in _function_complexities) if _function_complexities else _metrics["complexity"]

_result = {
    "syntaxValid": _syntax_valid,
    "syntaxError": _syntax_error,
    "issues": _issues,
    "metrics": _metrics,
    "functions": _function_complexities
}
_json.dumps(_result)
`;

        const resultProxy = await pyodide.runPythonAsync(analysisCode);
        return JSON.parse(resultProxy);
    } catch (e) {
        // If AST analysis itself fails, return a basic error
        return {
            syntaxValid: false,
            syntaxError: { line: 1, msg: e.message || 'Analysis failed', text: '' },
            issues: [{
                severity: 'error',
                category: 'syntax',
                title: 'Analysis Error',
                description: e.message || 'Failed to analyze code',
                line: 1,
                suggestion: 'Check your code for syntax errors.'
            }],
            metrics: { lines: code.split('\n').length, functions: 0, classes: 0, imports: 0, complexity: 0 },
            functions: []
        };
    }
}

/**
 * Check if Pyodide is currently loaded.
 */
export function isPyodideReady() {
    return pyodideInstance !== null;
}
