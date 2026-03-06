/* ═══════════════════════════════════════════════════════════════════════
   Code Interpreter — Line-by-line execution with step tracking
   Executes code like an interpreter, tracking each line's effect
   ═══════════════════════════════════════════════════════════════════════ */

import { executePython, isPyodideReady } from './pyodideService.js';

/**
 * @typedef {Object} ExecStep
 * @property {number} line      - 1-indexed line number being executed
 * @property {string} code      - The source code on that line
 * @property {string} type      - 'exec'|'output'|'assign'|'skip'|'error'|'return'
 * @property {string} [output]  - Text output produced by this line (if any)
 * @property {string} [varName] - Variable assigned (if any)
 * @property {string} [varValue]- Value of the variable (if any)
 * @property {string} [error]   - Error message (if any)
 */

// ═══════════════════════════════════════════════════════════════════════
//  JAVASCRIPT INTERPRETER (Secure Sandbox)
// ═══════════════════════════════════════════════════════════════════════

function interpretJavaScript(code) {
    const lines = code.split('\n');
    const steps = [];
    const output = [];
    const startTime = performance.now();
    const variables = {};
    let errorOccurred = null;

    // ─── Build fake console to capture output ───
    const fakeConsole = {
        log: (...args) => { const t = args.map(formatArg).join(' '); output.push(t); return t; },
        warn: (...args) => { const t = '⚠️ ' + args.map(formatArg).join(' '); output.push(t); return t; },
        error: (...args) => { const t = '❌ ' + args.map(formatArg).join(' '); output.push(t); return t; },
        info: (...args) => { const t = 'ℹ️ ' + args.map(formatArg).join(' '); output.push(t); return t; },
        table: (data) => { const t = Array.isArray(data) ? JSON.stringify(data, null, 2) : formatArg(data); output.push(t); return t; },
    };

    const fakeAlert = (msg) => { const t = '🔔 Alert: ' + String(msg); output.push(t); return t; };
    const fakePrompt = (msg) => { output.push('📝 Prompt: ' + String(msg)); return 'user_input'; };

    // ─── Execute code ONCE in a secure sandbox ───
    // Block dangerous globals to prevent DOM manipulation
    try {
        const wrappedCode = `"use strict";\n${code}`;

        const fn = new Function(
            'console', 'alert', 'prompt', 'confirm',
            'setTimeout', 'setInterval', 'fetch',
            // Block DOM/Window access — these are passed as undefined
            'document', 'window', 'globalThis', 'self', 'top', 'parent', 'frames',
            'localStorage', 'sessionStorage', 'navigator', 'location', 'history',
            'XMLHttpRequest', 'WebSocket', 'Worker', 'eval',
            wrappedCode
        );

        fn(
            fakeConsole, fakeAlert, fakePrompt, fakeAlert,
            () => { }, () => { },                              // setTimeout, setInterval disabled
            () => Promise.reject('fetch disabled in sandbox'), // fetch disabled
            // All dangerous globals are set to undefined
            undefined, undefined, undefined, undefined, undefined, undefined, undefined,
            undefined, undefined, undefined, undefined, undefined,
            undefined, undefined, undefined, undefined
        );
    } catch (e) {
        errorOccurred = e.message;

        // Try to find error line number
        const lineMatch = e.stack?.match(/<anonymous>:(\d+)/);
        const errorLine = lineMatch ? Math.max(1, parseInt(lineMatch[1]) - 1) : null; // -1 for "use strict"

        if (errorLine && errorLine <= lines.length) {
            // Mark all lines up to the error
            for (let i = 0; i < Math.min(errorLine - 1, lines.length); i++) {
                const trimmed = lines[i].trim();
                if (!trimmed) {
                    steps.push({ line: i + 1, code: lines[i], type: 'skip' });
                } else {
                    steps.push({ line: i + 1, code: lines[i], type: 'exec' });
                }
            }
            steps.push({
                line: errorLine, code: lines[errorLine - 1] || '',
                type: 'error', error: e.message
            });

            const executionTime = performance.now() - startTime;
            return { steps, output, error: errorOccurred, executionTime, variables };
        }
    }

    // ─── Build step trace from source lines ───
    const outputCopy = [...output];
    let outputIdx = 0;

    for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1;
        const rawLine = lines[i];
        const trimmed = rawLine.trim();

        // Skip empty lines and comments
        if (!trimmed) { steps.push({ line: lineNum, code: rawLine, type: 'skip' }); continue; }
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
            steps.push({ line: lineNum, code: rawLine, type: 'skip' }); continue;
        }

        // Variable assignment
        const varMatch = trimmed.match(/^(?:let|const|var)\s+(\w+)\s*=\s*(.+?)(?:;?\s*)$/);
        if (varMatch) {
            const [, name, val] = varMatch;
            let evaluated = val.replace(/;$/, '').trim();
            try { evaluated = safeEvalExpr(evaluated, variables); variables[name] = evaluated; }
            catch { variables[name] = evaluated; }
            steps.push({ line: lineNum, code: rawLine, type: 'assign', varName: name, varValue: String(evaluated) });
            continue;
        }

        // Console.log / warn / error / info
        const consoleMatch = trimmed.match(/^console\.(log|warn|error|info)\s*\((.*)?\)\s*;?\s*$/);
        if (consoleMatch && outputIdx < outputCopy.length) {
            steps.push({ line: lineNum, code: rawLine, type: 'output', output: outputCopy[outputIdx] });
            outputIdx++;
            continue;
        }

        // alert()
        const alertMatch = trimmed.match(/^alert\s*\((.*)?\)\s*;?\s*$/);
        if (alertMatch && outputIdx < outputCopy.length) {
            steps.push({ line: lineNum, code: rawLine, type: 'output', output: outputCopy[outputIdx] });
            outputIdx++;
            continue;
        }

        // Function definitions
        if (trimmed.startsWith('function ') || trimmed.match(/^(?:const|let|var)\s+\w+\s*=\s*(?:\(|function)/)) {
            steps.push({ line: lineNum, code: rawLine, type: 'exec' }); continue;
        }

        // return
        if (trimmed.startsWith('return ')) {
            steps.push({ line: lineNum, code: rawLine, type: 'return' }); continue;
        }

        // Closing braces, opening braces
        if (trimmed === '{' || trimmed === '}' || trimmed === '};') {
            steps.push({ line: lineNum, code: rawLine, type: 'skip' }); continue;
        }

        // Everything else
        steps.push({ line: lineNum, code: rawLine, type: 'exec' });
    }

    // If there was an error but we didn't find the line, add it at the end
    if (errorOccurred && !steps.find(s => s.type === 'error')) {
        steps.push({
            line: lines.length, code: '',
            type: 'error', error: errorOccurred
        });
    }

    const executionTime = performance.now() - startTime;
    return { steps, output, error: errorOccurred, executionTime, variables };
}

// ═══════════════════════════════════════════════════════════════════════
//  PYTHON INTERPRETER — with input(), if/elif/else, while, for support
// ═══════════════════════════════════════════════════════════════════════

function interpretPython(code) {
    const lines = code.split('\n');
    const steps = [];
    const output = [];
    const startTime = performance.now();
    const variables = {};
    const functions = {}; // store user-defined functions

    // ─── Collect all input() calls upfront via prompt ───
    const inputValues = [];
    const inputRegex = /input\s*\(\s*(?:['"](.+?)['"]|([^)]*))?\s*\)/g;
    let inputMatch;
    const tempCode = code;
    while ((inputMatch = inputRegex.exec(tempCode)) !== null) {
        const promptMsg = inputMatch[1] || inputMatch[2] || 'Enter input:';
        const userVal = window.prompt(promptMsg.trim()) || '';
        inputValues.push(userVal);
    }
    let inputIdx = 0;

    // ─── Helper: Get indentation level ───
    function getIndent(line) {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
    }

    // ─── Helper: Find block end (lines with greater indent) ───
    function findBlockEnd(startIdx, baseIndent) {
        let j = startIdx;
        while (j < lines.length) {
            const line = lines[j];
            if (line.trim() === '') { j++; continue; }
            if (getIndent(line) <= baseIndent) break;
            j++;
        }
        return j;
    }

    // ─── Helper: Evaluate a Python expression ───
    function evalExpr(expr) {
        if (expr === undefined || expr === null) return '';
        let e = expr.trim();
        if (!e) return '';

        // String literals
        const strMatch = e.match(/^['"](.*)['"]$/);
        if (strMatch) return strMatch[1];

        // Numbers
        if (/^-?\d+(\.\d+)?$/.test(e)) return Number(e);

        // Booleans & None
        if (e === 'True') return true;
        if (e === 'False') return false;
        if (e === 'None') return null;

        // List literal
        if (e.startsWith('[') && e.endsWith(']')) {
            try {
                const inner = e.slice(1, -1).trim();
                if (!inner) return [];
                const items = splitTopLevel(inner, ',');
                return items.map(it => evalExpr(it.trim()));
            } catch { return e; }
        }

        // Dict literal
        if (e.startsWith('{') && e.endsWith('}')) return e;

        // Tuple literal
        if (e.startsWith('(') && e.endsWith(')')) return e;

        // F-string
        const fstrMatch = e.match(/^f['"](.*)['"]$/);
        if (fstrMatch) {
            return fstrMatch[1].replace(/\{([^}]+)\}/g, (_, innerExpr) => {
                return String(evalExpr(innerExpr.trim()));
            });
        }

        // input() call
        const inputCallMatch = e.match(/^input\s*\(.*\)$/);
        if (inputCallMatch) {
            return inputIdx < inputValues.length ? inputValues[inputIdx++] : '';
        }

        // int(), float(), str() conversions
        const intMatch = e.match(/^int\s*\(\s*(.+)\s*\)$/);
        if (intMatch) { const v = evalExpr(intMatch[1]); return parseInt(v) || 0; }
        const floatMatch = e.match(/^float\s*\(\s*(.+)\s*\)$/);
        if (floatMatch) { const v = evalExpr(floatMatch[1]); return parseFloat(v) || 0; }
        const strCastMatch = e.match(/^str\s*\(\s*(.+)\s*\)$/);
        if (strCastMatch) return String(evalExpr(strCastMatch[1]));

        // len()
        const lenMatch = e.match(/^len\s*\(\s*(.+)\s*\)$/);
        if (lenMatch) {
            const val = evalExpr(lenMatch[1]);
            if (typeof val === 'string') return val.length;
            if (Array.isArray(val)) return val.length;
            return 0;
        }

        // type()
        const typeMatch = e.match(/^type\s*\(\s*(.+)\s*\)$/);
        if (typeMatch) {
            const val = evalExpr(typeMatch[1]);
            if (typeof val === 'number') return Number.isInteger(val) ? "<class 'int'>" : "<class 'float'>";
            if (typeof val === 'string') return "<class 'str'>";
            if (typeof val === 'boolean') return "<class 'bool'>";
            if (val === null) return "<class 'NoneType'>";
            if (Array.isArray(val)) return "<class 'list'>";
            return "<class 'object'>";
        }

        // abs(), min(), max(), round()
        const absMatch = e.match(/^abs\s*\(\s*(.+)\s*\)$/);
        if (absMatch) return Math.abs(evalExpr(absMatch[1]));
        const roundMatch = e.match(/^round\s*\(\s*(.+)\s*\)$/);
        if (roundMatch) return Math.round(evalExpr(roundMatch[1]));

        // .upper(), .lower(), .strip(), .split(), .replace(), .startswith(), .endswith()
        const methodMatch = e.match(/^(.+)\.(upper|lower|strip|title|capitalize|lstrip|rstrip)\s*\(\s*\)$/);
        if (methodMatch) {
            const obj = evalExpr(methodMatch[1]);
            const method = methodMatch[2];
            if (typeof obj === 'string') {
                if (method === 'upper') return obj.toUpperCase();
                if (method === 'lower') return obj.toLowerCase();
                if (method === 'strip') return obj.trim();
                if (method === 'lstrip') return obj.trimStart();
                if (method === 'rstrip') return obj.trimEnd();
                if (method === 'title') return obj.replace(/\b\w/g, c => c.toUpperCase());
                if (method === 'capitalize') return obj.charAt(0).toUpperCase() + obj.slice(1).toLowerCase();
            }
            return obj;
        }

        // .append() for lists
        const appendMatch = e.match(/^(\w+)\.append\s*\(\s*(.+)\s*\)$/);
        if (appendMatch && Array.isArray(variables[appendMatch[1]])) {
            variables[appendMatch[1]].push(evalExpr(appendMatch[2]));
            return undefined;
        }

        // Variable lookup
        if (variables[e] !== undefined) return variables[e];

        // Boolean operators: not, and, or
        if (e.startsWith('not ')) {
            return !isTruthy(evalExpr(e.slice(4)));
        }

        // Handle 'and' and 'or' (simple top-level split)
        const andParts = splitTopLevel(e, ' and ');
        if (andParts.length > 1) {
            for (const part of andParts) {
                const val = evalExpr(part.trim());
                if (!isTruthy(val)) return val;
            }
            return evalExpr(andParts[andParts.length - 1].trim());
        }
        const orParts = splitTopLevel(e, ' or ');
        if (orParts.length > 1) {
            for (const part of orParts) {
                const val = evalExpr(part.trim());
                if (isTruthy(val)) return val;
            }
            return evalExpr(orParts[orParts.length - 1].trim());
        }

        // Comparisons: ==, !=, >=, <=, >, <, in, not in, is, is not
        const cmpOps = [' not in ', ' in ', ' is not ', ' is ', '!=', '==', '>=', '<=', '>', '<'];
        for (const op of cmpOps) {
            const idx = e.indexOf(op);
            if (idx > 0) {
                const left = evalExpr(e.substring(0, idx));
                const right = evalExpr(e.substring(idx + op.length));
                switch (op.trim()) {
                    case '==': case 'is': return left == right;
                    case '!=': case 'is not': return left != right;
                    case '>': return left > right;
                    case '<': return left < right;
                    case '>=': return left >= right;
                    case '<=': return left <= right;
                    case 'in': return typeof right === 'string' ? right.includes(String(left)) : false;
                    case 'not in': return typeof right === 'string' ? !right.includes(String(left)) : true;
                }
            }
        }

        // String concatenation with +
        if (e.includes('+')) {
            const parts = splitTopLevel(e, '+');
            if (parts.length > 1) {
                const evaluated = parts.map(p => evalExpr(p.trim()));
                // If any part is a string, concatenate as strings
                if (evaluated.some(v => typeof v === 'string')) {
                    return evaluated.map(v => String(v)).join('');
                }
                // Otherwise numeric addition
                if (evaluated.every(v => typeof v === 'number')) {
                    return evaluated.reduce((a, b) => a + b, 0);
                }
                return evaluated.map(v => String(v)).join('');
            }
        }

        // Arithmetic: -, *, /, //, %, **
        try {
            const mathExpr = e.replace(/\b(\w+)\b/g, (match) => {
                if (variables[match] !== undefined && typeof variables[match] === 'number') return String(variables[match]);
                if (match === 'True') return '1';
                if (match === 'False') return '0';
                return match;
            }).replace(/\/\//g, '//INTDIV//');

            // Handle ** (power)
            let processedExpr = mathExpr.replace(/\*\*/g, '**');
            processedExpr = processedExpr.replace(/\/\/INTDIV\/\//g, '/');

            if (/^[\d\s+\-*/().%]+$/.test(processedExpr)) {
                const result = eval(processedExpr);
                if (mathExpr.includes('//INTDIV//')) return Math.floor(result);
                return result;
            }
        } catch { /* ignore */ }

        // String multiplication: "x" * 3
        const strMulMatch = e.match(/^['"](.+)['"]\s*\*\s*(\d+)$/);
        if (strMulMatch) return strMulMatch[1].repeat(parseInt(strMulMatch[2]));
        const strMulMatch2 = e.match(/^(\w+)\s*\*\s*(\d+)$/);
        if (strMulMatch2 && typeof variables[strMulMatch2[1]] === 'string') {
            return variables[strMulMatch2[1]].repeat(parseInt(strMulMatch2[2]));
        }

        return e;
    }

    // ─── Helper: Python truthiness ───
    function isTruthy(val) {
        if (val === null || val === undefined || val === 'None') return false;
        if (val === false || val === 0 || val === '') return false;
        if (Array.isArray(val) && val.length === 0) return false;
        if (val === '0' || val === 'False') return false;
        return true;
    }

    // ─── Helper: Split string at top level (respecting quotes/parens) ───
    function splitTopLevel(str, delimiter) {
        const results = [];
        let current = '';
        let depth = 0;
        let inStr = false;
        let strChar = '';

        for (let i = 0; i < str.length; i++) {
            const ch = str[i];

            if (inStr) {
                current += ch;
                if (ch === strChar && str[i - 1] !== '\\') inStr = false;
                continue;
            }

            if (ch === '"' || ch === "'") { inStr = true; strChar = ch; current += ch; continue; }
            if (ch === '(' || ch === '[' || ch === '{') { depth++; current += ch; continue; }
            if (ch === ')' || ch === ']' || ch === '}') { depth--; current += ch; continue; }

            if (depth === 0 && str.substring(i).startsWith(delimiter)) {
                results.push(current);
                current = '';
                i += delimiter.length - 1;
                continue;
            }
            current += ch;
        }
        if (current) results.push(current);
        return results;
    }

    // ─── Main execution loop ───
    function executeBlock(startIdx, endIdx, baseIndent) {
        let i = startIdx;

        while (i < endIdx) {
            const lineNum = i + 1;
            const rawLine = lines[i];
            const trimmed = rawLine.trim();
            const indent = getIndent(rawLine);

            // Safety limit
            if (steps.length > 500) {
                steps.push({ line: lineNum, code: '...', type: 'error', error: 'Execution limit reached (500 steps)' });
                return i;
            }

            // Skip empty/comments
            if (!trimmed || trimmed.startsWith('#')) {
                steps.push({ line: lineNum, code: rawLine, type: 'skip' });
                i++; continue;
            }

            // Skip lines not at our indentation level
            if (indent < baseIndent) return i;
            if (indent > baseIndent) { i++; continue; }

            // ── def (function definition) ──
            if (trimmed.startsWith('def ')) {
                const defMatch = trimmed.match(/^def\s+(\w+)\s*\(([^)]*)\)\s*:/);
                if (defMatch) {
                    const funcName = defMatch[1];
                    const params = defMatch[2].split(',').map(p => p.trim()).filter(Boolean);
                    const bodyStart = i + 1;
                    const bodyEnd = findBlockEnd(bodyStart, indent);
                    functions[funcName] = { params, bodyStart, bodyEnd, indent };
                    steps.push({ line: lineNum, code: rawLine, type: 'exec' });
                    i = bodyEnd;
                    continue;
                }
            }

            // ── class (skip block) ──
            if (trimmed.startsWith('class ')) {
                steps.push({ line: lineNum, code: rawLine, type: 'exec' });
                i = findBlockEnd(i + 1, indent);
                continue;
            }

            // ── import ──
            if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
                steps.push({ line: lineNum, code: rawLine, type: 'exec' });
                i++; continue;
            }

            // ── if / elif / else ──
            if (trimmed.startsWith('if ') && trimmed.endsWith(':')) {
                const condStr = trimmed.slice(3, -1).trim();
                const condVal = evalExpr(condStr);
                const condTrue = isTruthy(condVal);
                steps.push({ line: lineNum, code: rawLine, type: 'exec' });

                const ifBodyStart = i + 1;
                const ifBodyEnd = findBlockEnd(ifBodyStart, indent);

                if (condTrue) {
                    executeBlock(ifBodyStart, ifBodyEnd, indent + 4);
                }

                // Skip to elif/else chains
                i = ifBodyEnd;
                let branchTaken = condTrue;

                while (i < endIdx) {
                    const nextTrimmed = lines[i]?.trim();
                    const nextIndent = getIndent(lines[i] || '');
                    if (nextIndent !== indent) break;

                    if (nextTrimmed?.startsWith('elif ') && nextTrimmed.endsWith(':')) {
                        steps.push({ line: i + 1, code: lines[i], type: 'exec' });
                        const elifBodyStart = i + 1;
                        const elifBodyEnd = findBlockEnd(elifBodyStart, indent);

                        if (!branchTaken) {
                            const elifCond = nextTrimmed.slice(5, -1).trim();
                            const elifTrue = isTruthy(evalExpr(elifCond));
                            if (elifTrue) {
                                executeBlock(elifBodyStart, elifBodyEnd, indent + 4);
                                branchTaken = true;
                            }
                        }
                        i = elifBodyEnd;
                    } else if (nextTrimmed === 'else:') {
                        steps.push({ line: i + 1, code: lines[i], type: 'exec' });
                        const elseBodyStart = i + 1;
                        const elseBodyEnd = findBlockEnd(elseBodyStart, indent);

                        if (!branchTaken) {
                            executeBlock(elseBodyStart, elseBodyEnd, indent + 4);
                        }
                        i = elseBodyEnd;
                        break;
                    } else {
                        break;
                    }
                }
                continue;
            }

            // ── for loop ──
            if (trimmed.startsWith('for ') && trimmed.endsWith(':')) {
                steps.push({ line: lineNum, code: rawLine, type: 'exec' });

                const bodyStart = i + 1;
                const bodyEnd = findBlockEnd(bodyStart, indent);

                // for x in range(...)
                const rangeMatch = trimmed.match(/^for\s+(\w+)\s+in\s+range\s*\((.+)\)\s*:$/);
                if (rangeMatch) {
                    const varName = rangeMatch[1];
                    const rangeArgs = rangeMatch[2].split(',').map(a => Number(evalExpr(a.trim())));
                    let start = 0, stop, step = 1;
                    if (rangeArgs.length === 1) { stop = rangeArgs[0]; }
                    else if (rangeArgs.length === 2) { start = rangeArgs[0]; stop = rangeArgs[1]; }
                    else { start = rangeArgs[0]; stop = rangeArgs[1]; step = rangeArgs[2] || 1; }

                    const maxIter = Math.min(Math.abs((stop - start) / step), 100);
                    let iterCount = 0;
                    for (let iter = start; step > 0 ? iter < stop : iter > stop; iter += step) {
                        if (iterCount++ > maxIter) break;
                        variables[varName] = iter;
                        executeBlock(bodyStart, bodyEnd, indent + 4);
                    }
                }

                // for x in list
                const listMatch = trimmed.match(/^for\s+(\w+)\s+in\s+(\w+)\s*:$/);
                if (listMatch && !rangeMatch) {
                    const varName = listMatch[1];
                    const listVal = variables[listMatch[2]];
                    if (Array.isArray(listVal)) {
                        for (const item of listVal.slice(0, 100)) {
                            variables[varName] = item;
                            executeBlock(bodyStart, bodyEnd, indent + 4);
                        }
                    } else if (typeof listVal === 'string') {
                        for (const ch of listVal.slice(0, 100)) {
                            variables[varName] = ch;
                            executeBlock(bodyStart, bodyEnd, indent + 4);
                        }
                    }
                }

                i = bodyEnd;
                continue;
            }

            // ── while loop ──
            if (trimmed.startsWith('while ') && trimmed.endsWith(':')) {
                steps.push({ line: lineNum, code: rawLine, type: 'exec' });
                const condStr = trimmed.slice(6, -1).trim();
                const bodyStart = i + 1;
                const bodyEnd = findBlockEnd(bodyStart, indent);

                let maxIter = 100;
                while (maxIter-- > 0 && isTruthy(evalExpr(condStr))) {
                    executeBlock(bodyStart, bodyEnd, indent + 4);
                }

                i = bodyEnd;
                continue;
            }

            // ── Variable assignment ──
            const assignMatch = trimmed.match(/^(\w+)\s*=\s*(.+)$/);
            if (assignMatch && !trimmed.startsWith('if ') && !trimmed.startsWith('for ') &&
                !trimmed.startsWith('while ') && !trimmed.startsWith('def ') && !trimmed.startsWith('class ')) {
                const [, name, rawVal] = assignMatch;
                const val = evalExpr(rawVal.trim());
                variables[name] = val;
                const displayVal = val === null ? 'None' : typeof val === 'string' ? `"${val}"` : String(val);
                steps.push({ line: lineNum, code: rawLine, type: 'assign', varName: name, varValue: displayVal });
                i++; continue;
            }

            // ── Augmented assignment: +=, -=, *=, /= ──
            const augMatch = trimmed.match(/^(\w+)\s*(\+=|-=|\*=|\/=|%=|\/\/=|\*\*=)\s*(.+)$/);
            if (augMatch) {
                const [, name, op, rawVal] = augMatch;
                const rightVal = evalExpr(rawVal.trim());
                const leftVal = variables[name] !== undefined ? variables[name] : 0;
                let result;
                switch (op) {
                    case '+=': result = (typeof leftVal === 'string') ? leftVal + String(rightVal) : leftVal + rightVal; break;
                    case '-=': result = leftVal - rightVal; break;
                    case '*=': result = leftVal * rightVal; break;
                    case '/=': result = leftVal / rightVal; break;
                    case '%=': result = leftVal % rightVal; break;
                    case '//=': result = Math.floor(leftVal / rightVal); break;
                    case '**=': result = Math.pow(leftVal, rightVal); break;
                    default: result = leftVal;
                }
                variables[name] = result;
                steps.push({ line: lineNum, code: rawLine, type: 'assign', varName: name, varValue: String(result) });
                i++; continue;
            }

            // ── print() ──
            const printMatch = trimmed.match(/^print\s*\((.+)\)\s*$/);
            if (printMatch) {
                const text = parsePrintArgs(printMatch[1], variables, evalExpr);
                output.push(text);
                steps.push({ line: lineNum, code: rawLine, type: 'output', output: text });
                i++; continue;
            }

            // ── Function call: funcName(...) ──
            const funcCallMatch = trimmed.match(/^(\w+)\s*\(([^)]*)\)$/);
            if (funcCallMatch && functions[funcCallMatch[1]]) {
                const func = functions[funcCallMatch[1]];
                const args = funcCallMatch[2] ? funcCallMatch[2].split(',').map(a => evalExpr(a.trim())) : [];
                // Bind params
                const savedVars = {};
                func.params.forEach((p, idx) => {
                    savedVars[p] = variables[p];
                    variables[p] = args[idx] !== undefined ? args[idx] : null;
                });
                executeBlock(func.bodyStart, func.bodyEnd, func.indent + 4);
                // Restore
                func.params.forEach(p => {
                    if (savedVars[p] !== undefined) variables[p] = savedVars[p];
                    else delete variables[p];
                });
                steps.push({ line: lineNum, code: rawLine, type: 'exec' });
                i++; continue;
            }

            // ── Method calls like list.append(), etc. ──
            if (trimmed.includes('.')) {
                evalExpr(trimmed);
                steps.push({ line: lineNum, code: rawLine, type: 'exec' });
                i++; continue;
            }

            // ── return ──
            if (trimmed.startsWith('return ')) {
                const retVal = evalExpr(trimmed.slice(7).trim());
                steps.push({ line: lineNum, code: rawLine, type: 'return' });
                i++; return i;
            }

            // ── break, continue, pass ──
            if (trimmed === 'break' || trimmed === 'continue' || trimmed === 'pass') {
                steps.push({ line: lineNum, code: rawLine, type: 'exec' });
                i++; continue;
            }

            // Default: exec
            steps.push({ line: lineNum, code: rawLine, type: 'exec' });
            i++;
        }
        return i;
    }

    // Override parsePrintArgs to use our evalExpr
    function parsePrintArgs(argsStr, vars, evalFn) {
        const parts = splitTopLevel(argsStr, ',');
        return parts.map(p => {
            const val = evalFn(p.trim());
            if (val === null) return 'None';
            if (val === true) return 'True';
            if (val === false) return 'False';
            return String(val);
        }).join(' ');
    }

    // Execute from the top
    try {
        executeBlock(0, lines.length, 0);
    } catch (e) {
        steps.push({ line: steps.length + 1, code: '', type: 'error', error: e.message || String(e) });
    }

    const executionTime = performance.now() - startTime;
    return { steps, output, error: null, executionTime, variables };
}


// ═══════════════════════════════════════════════════════════════════════
//  JAVA INTERPRETER
// ═══════════════════════════════════════════════════════════════════════

function interpretJava(code) {
    const lines = code.split('\n');
    const steps = [];
    const output = [];
    const startTime = performance.now();
    const variables = {};

    for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1;
        const rawLine = lines[i];
        const trimmed = rawLine.trim();

        if (!trimmed) { steps.push({ line: lineNum, code: rawLine, type: 'skip' }); continue; }
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
            steps.push({ line: lineNum, code: rawLine, type: 'skip' }); continue;
        }

        // import / package
        if (trimmed.startsWith('import ') || trimmed.startsWith('package ')) {
            steps.push({ line: lineNum, code: rawLine, type: 'exec' }); continue;
        }

        // Typed variable declaration
        const varMatch = trimmed.match(/^(?:int|double|float|long|String|boolean|char)\s+(\w+)\s*=\s*(.+?)\s*;/);
        if (varMatch) {
            const val = evaluateJavaExpr(varMatch[2], variables);
            variables[varMatch[1]] = val;
            steps.push({ line: lineNum, code: rawLine, type: 'assign', varName: varMatch[1], varValue: String(val) });
            continue;
        }

        // class/method/modifier definitions
        if (trimmed.match(/^(public|private|protected|static|class|void|int|String|double|float|boolean|long)\s/)) {
            steps.push({ line: lineNum, code: rawLine, type: 'exec' }); continue;
        }

        // System.out.println
        const printlnMatch = trimmed.match(/System\.out\.println\s*\(\s*(.+?)\s*\)\s*;?\s*$/);
        if (printlnMatch) {
            const text = evaluateJavaExpr(printlnMatch[1], variables);
            output.push(text);
            steps.push({ line: lineNum, code: rawLine, type: 'output', output: text });
            continue;
        }

        // System.out.print
        const printMatch = trimmed.match(/System\.out\.print\s*\(\s*(.+?)\s*\)\s*;?\s*$/);
        if (printMatch && !printlnMatch) {
            const text = evaluateJavaExpr(printMatch[1], variables);
            output.push(text);
            steps.push({ line: lineNum, code: rawLine, type: 'output', output: text });
            continue;
        }

        // Variable assignment (no type)
        const assignMatch = trimmed.match(/^(\w+)\s*=\s*(.+?)\s*;/);
        if (assignMatch) {
            const val = evaluateJavaExpr(assignMatch[2], variables);
            variables[assignMatch[1]] = val;
            steps.push({ line: lineNum, code: rawLine, type: 'assign', varName: assignMatch[1], varValue: String(val) });
            continue;
        }

        if (trimmed.startsWith('return ')) { steps.push({ line: lineNum, code: rawLine, type: 'return' }); continue; }
        if (trimmed === '{' || trimmed === '}') { steps.push({ line: lineNum, code: rawLine, type: 'skip' }); continue; }

        steps.push({ line: lineNum, code: rawLine, type: 'exec' });
    }

    const executionTime = performance.now() - startTime;
    return { steps, output, error: null, executionTime, variables };
}

// ═══════════════════════════════════════════════════════════════════════
//  HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

function formatArg(arg) {
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';
    if (typeof arg === 'object') {
        try { return JSON.stringify(arg, null, 2); }
        catch { return String(arg); }
    }
    return String(arg);
}

function safeEvalExpr(expr, vars = {}) {
    const trimmed = expr.trim().replace(/;$/, '');
    const strMatch = trimmed.match(/^["'`](.*?)["'`]$/);
    if (strMatch) return strMatch[1];
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (trimmed === 'null') return null;
    if (trimmed === 'undefined') return undefined;
    if (vars[trimmed] !== undefined) return vars[trimmed];
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
        try { return JSON.parse(trimmed); } catch { return trimmed; }
    }
    // Simple math
    try {
        const mathExpr = trimmed.replace(/\b(\w+)\b/g, (match) => {
            if (vars[match] !== undefined && typeof vars[match] === 'number') return String(vars[match]);
            return match;
        });
        if (/^[\d\s+\-*/().%]+$/.test(mathExpr)) return eval(mathExpr);
    } catch { /* ignore */ }
    return trimmed;
}

function evaluatePythonValue(expr, variables = {}) {
    const trimmed = expr.trim();
    const strMatch = trimmed.match(/^['"](.*?)['"]$/);
    if (strMatch) return strMatch[1];
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
    if (trimmed === 'True') return true;
    if (trimmed === 'False') return false;
    if (trimmed === 'None') return 'None';
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) return trimmed;
    if (variables[trimmed] !== undefined) return variables[trimmed];

    // F-string
    const fstrMatch = trimmed.match(/^f['"](.*?)['"]$/);
    if (fstrMatch) {
        return fstrMatch[1].replace(/\{(\w+)\}/g, (_, name) =>
            variables[name] !== undefined ? String(variables[name]) : `{${name}}`
        );
    }

    // String concat
    if (trimmed.includes('+')) {
        const parts = trimmed.split('+').map(p => {
            const pt = p.trim();
            const sm = pt.match(/^['"](.*?)['"]$/);
            if (sm) return sm[1];
            if (variables[pt] !== undefined) return String(variables[pt]);
            return pt;
        });
        if (parts.every(p => typeof p === 'string')) return parts.join('');
    }

    // Math
    try {
        const mathExpr = trimmed.replace(/\b(\w+)\b/g, (match) => {
            if (variables[match] !== undefined && typeof variables[match] === 'number') return String(variables[match]);
            return match;
        });
        if (/^[\d\s+\-*/().%]+$/.test(mathExpr)) return eval(mathExpr);
    } catch { /* ignore */ }

    return trimmed;
}

function evaluatePythonExpr(expr, variables = {}) {
    const parts = [];
    let current = '';
    let inString = false;
    let stringChar = '';
    let parenDepth = 0;

    for (let i = 0; i < expr.length; i++) {
        const ch = expr[i];
        if (inString) { current += ch; if (ch === stringChar) inString = false; }
        else if (ch === '"' || ch === "'") { inString = true; stringChar = ch; current += ch; }
        else if (ch === '(') { parenDepth++; current += ch; }
        else if (ch === ')') { parenDepth--; current += ch; }
        else if (ch === ',' && parenDepth === 0) { parts.push(current.trim()); current = ''; }
        else { current += ch; }
    }
    if (current.trim()) parts.push(current.trim());

    return parts.map(p => String(evaluatePythonValue(p, variables))).join(' ');
}

function parsePrintArgs(argsStr, variables = {}) {
    return evaluatePythonExpr(argsStr, variables);
}

function evaluateJavaExpr(expr, variables = {}) {
    const strMatch = expr.match(/^"(.*)"$/);
    if (strMatch) return strMatch[1];
    if (/^-?\d+(\.\d+)?$/.test(expr.trim())) return expr.trim();
    if (variables[expr.trim()] !== undefined) return String(variables[expr.trim()]);

    const parts = expr.split(/\s*\+\s*/);
    return parts.map(p => {
        const sm = p.trim().match(/^"(.*)"$/);
        if (sm) return sm[1];
        if (variables[p.trim()] !== undefined) return String(variables[p.trim()]);
        if (/^-?\d+(\.\d+)?$/.test(p.trim())) return p.trim();
        return p.trim();
    }).join('');
}

// ═══════════════════════════════════════════════════════════════════════
//  MAIN EXPORT — INTERPRETER (with crash protection)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Interpret code line-by-line and return execution steps.
 * Wrapped in try-catch to never crash the UI.
 */
export function interpretCode(code, language) {
    if (!code || !code.trim()) {
        return { steps: [], output: [], error: null, executionTime: 0, language, variables: {} };
    }

    try {
        switch (language) {
            case 'javascript':
                return { ...interpretJavaScript(code), language };
            case 'python':
                return { ...interpretPython(code), language };
            case 'java':
                return { ...interpretJava(code), language };
            default:
                return {
                    steps: [{ line: 1, code: '', type: 'error', error: 'Interpreter not supported for ' + language + ' yet.' }],
                    output: [],
                    error: 'Interpreter not supported for ' + language + ' yet.',
                    executionTime: 0,
                    language,
                    variables: {}
                };
        }
    } catch (e) {
        return {
            steps: [{ line: 1, code: '', type: 'error', error: 'Interpreter error: ' + (e.message || 'Unknown error') }],
            output: [],
            error: e.message || 'Unknown interpreter error',
            executionTime: 0,
            language,
            variables: {}
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════
//  ASYNC INTERPRETER — Uses real Pyodide CPython for Python
// ═══════════════════════════════════════════════════════════════════════


/**
 * Async version of interpretCode that uses real Pyodide for Python.
 * Falls back to sync interpreter for other languages.
 */
export async function interpretCodeAsync(code, language) {
    if (!code || !code.trim()) {
        return { steps: [], output: [], error: null, executionTime: 0, language, variables: {} };
    }

    // For Python: use real CPython via Pyodide
    if (language === 'python') {
        try {
            const result = await executePython(code);
            const lines = code.split('\n');
            const steps = [];
            const outputCopy = [...(result.output || [])];
            let outputIdx = 0;

            // Build step trace from source lines
            for (let i = 0; i < lines.length; i++) {
                const lineNum = i + 1;
                const rawLine = lines[i];
                const trimmed = rawLine.trim();

                if (!trimmed) { steps.push({ line: lineNum, code: rawLine, type: 'skip' }); continue; }
                if (trimmed.startsWith('#')) { steps.push({ line: lineNum, code: rawLine, type: 'skip' }); continue; }

                // Import
                if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
                    steps.push({ line: lineNum, code: rawLine, type: 'exec' }); continue;
                }

                // Def/class
                if (trimmed.startsWith('def ') || trimmed.startsWith('class ') || trimmed.startsWith('async def ')) {
                    steps.push({ line: lineNum, code: rawLine, type: 'exec' }); continue;
                }

                // Indented block content (inside def/class/loop)
                if (rawLine.match(/^\s{4,}/) && !trimmed.startsWith('print')) {
                    // Check if it's an assignment
                    const assignMatch = trimmed.match(/^(\w+)\s*=\s*(.+)$/);
                    if (assignMatch && result.variables[assignMatch[1]] !== undefined) {
                        steps.push({
                            line: lineNum, code: rawLine, type: 'assign',
                            varName: assignMatch[1],
                            varValue: String(result.variables[assignMatch[1]])
                        });
                    } else {
                        steps.push({ line: lineNum, code: rawLine, type: 'exec' });
                    }
                    continue;
                }

                // print()
                if (trimmed.match(/^print\s*\(/)) {
                    if (outputIdx < outputCopy.length) {
                        steps.push({ line: lineNum, code: rawLine, type: 'output', output: outputCopy[outputIdx] });
                        outputIdx++;
                    } else {
                        steps.push({ line: lineNum, code: rawLine, type: 'output', output: '' });
                    }
                    continue;
                }

                // Variable assignment (top-level)
                const assignMatch = trimmed.match(/^(\w+)\s*=\s*(.+)$/);
                if (assignMatch && !trimmed.startsWith('if ') && !trimmed.startsWith('for ') && !trimmed.startsWith('while ')) {
                    const varName = assignMatch[1];
                    const varVal = result.variables[varName] !== undefined
                        ? String(result.variables[varName])
                        : assignMatch[2].trim();
                    steps.push({
                        line: lineNum, code: rawLine, type: 'assign',
                        varName: varName, varValue: varVal
                    });
                    continue;
                }

                // return
                if (trimmed.startsWith('return ')) {
                    steps.push({ line: lineNum, code: rawLine, type: 'return' }); continue;
                }

                // For/while/if
                if (trimmed.startsWith('for ') || trimmed.startsWith('while ') || trimmed.startsWith('if ') || trimmed.startsWith('elif ') || trimmed.startsWith('else')) {
                    steps.push({ line: lineNum, code: rawLine, type: 'exec' }); continue;
                }

                steps.push({ line: lineNum, code: rawLine, type: 'exec' });
            }

            // If there was an error, add error step
            if (result.error) {
                // Try to extract line number from Python traceback
                const lineMatch = result.error.match(/line (\d+)/);
                const errorLine = lineMatch ? parseInt(lineMatch[1]) : lines.length;
                steps.push({
                    line: errorLine, code: lines[errorLine - 1] || '',
                    type: 'error', error: result.error
                });
            }

            // Any remaining output lines not mapped to print() lines
            while (outputIdx < outputCopy.length) {
                steps.push({
                    line: lines.length, code: '', type: 'output',
                    output: outputCopy[outputIdx]
                });
                outputIdx++;
            }

            return {
                steps,
                output: result.output || [],
                error: result.error,
                executionTime: result.executionTime,
                language,
                variables: result.variables || {}
            };
        } catch (e) {
            return {
                steps: [{ line: 1, code: '', type: 'error', error: 'Python interpreter error: ' + (e.message || 'Unknown error') }],
                output: [],
                error: e.message,
                executionTime: 0,
                language,
                variables: {}
            };
        }
    }

    // For other languages: use sync interpreter
    return interpretCode(code, language);
}

