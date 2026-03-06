/* ═══════════════════════════════════════════════════════════════════════
   Code Analysis Engine
   Client-side static analysis for Python, JavaScript, and Java
   Now with REAL syntax validation — checks if code is correct or wrong!
   ═══════════════════════════════════════════════════════════════════════ */

// ─── Language Detection ───
export function detectLanguage(code, filename = '') {
    if (filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const langMap = {
            py: 'python', js: 'javascript', jsx: 'javascript', ts: 'typescript',
            tsx: 'typescript', java: 'java', c: 'c', cpp: 'cpp', cs: 'csharp',
            rb: 'ruby', go: 'go', rs: 'rust', php: 'php'
        };
        if (langMap[ext]) return langMap[ext];
    }
    // Heuristic detection
    if (/^\s*(def |class |import |from .+ import|print\(|if __name__)/m.test(code)) return 'python';
    if (/^\s*(const |let |var |function |=>|require\(|import .+ from)/m.test(code)) return 'javascript';
    if (/^\s*(public class|System\.out|private |protected )/m.test(code)) return 'java';
    if (/^\s*(#include|int main|printf\(|void )/m.test(code)) return 'c';
    return 'python'; // default
}

// ═══════════════════════════════════════════════════════════════════════
// REAL SYNTAX VALIDATION — Checks if code is actually correct or wrong
// ═══════════════════════════════════════════════════════════════════════

function validatePythonSyntax(code) {
    const errors = [];
    const lines = code.split('\n');

    // 1. Check for unmatched brackets/parentheses/braces
    const bracketErrors = checkBrackets(code, lines);
    errors.push(...bracketErrors);

    // 2. Check for missing colons after def, class, if, for, while, try, except, elif, else, with
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith('#')) continue;

        // Check for structures that MUST end with colon
        const colonRequired = /^(def\s+\w+.*|class\s+\w+.*|if\s+.+|elif\s+.+|else|for\s+.+|while\s+.+|try|except.*|finally|with\s+.+)$/;
        if (colonRequired.test(trimmed) && !trimmed.endsWith(':') && !trimmed.endsWith(':\\')) {
            errors.push({
                id: 'SYN_PY01', severity: 'error', category: 'syntax', isRealError: true,
                title: 'SyntaxError: Missing colon (:)',
                description: `Line ${i + 1}: "${trimmed}" — This statement requires a colon at the end.`,
                suggestion: `Add a colon: ${trimmed}:`,
                whyMatters: 'Python uses colons to start a new code block. Without it, Python cannot parse your code.',
                line: i + 1, lineContent: trimmed
            });
        }
    }

    // 3. Check indentation errors (mixing or bad indents after colons)
    let expectedIndent = 0;
    let prevLineEndedWithColon = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const currentIndent = line.length - line.trimStart().length;

        // After a colon, the next non-empty line MUST be indented more
        if (prevLineEndedWithColon && currentIndent <= expectedIndent) {
            errors.push({
                id: 'SYN_PY02', severity: 'error', category: 'syntax', isRealError: true,
                title: 'IndentationError: Expected an indented block',
                description: `Line ${i + 1}: Expected indented code after the previous statement, but found "${trimmed}"`,
                suggestion: 'Add 4 spaces of indentation after statements ending with a colon.',
                whyMatters: 'Python uses indentation to define code blocks. After a colon, the next line must be indented.',
                line: i + 1, lineContent: trimmed
            });
        }

        prevLineEndedWithColon = trimmed.endsWith(':');
        expectedIndent = currentIndent;
    }

    // 4. Check for print without parentheses (Python 3 error)
    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (/^print\s+[^(=]/.test(trimmed)) {
            errors.push({
                id: 'SYN_PY03', severity: 'error', category: 'syntax', isRealError: true,
                title: 'SyntaxError: Missing parentheses in call to print',
                description: `Line ${i + 1}: In Python 3, print is a function: print("text"), not print "text"`,
                suggestion: `Change to: print(${trimmed.slice(6)})`,
                whyMatters: 'Python 3 requires print() with parentheses. This code will not run.',
                line: i + 1, lineContent: trimmed
            });
        }
    }

    // 5. Check for invalid assignment (using = in if/while conditions without ==)
    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        // Match 'if x = value:' but not 'if x == value:' or 'if x := value:'
        const assignInCondition = /^(if|elif|while)\s+.*[^=!<>:]=(?!=)(?!.*:=).*:/.exec(trimmed);
        if (assignInCondition && !trimmed.includes('==') && !trimmed.includes('!=') && !trimmed.includes('<=') && !trimmed.includes('>=')) {
            // More careful check - look for single = that's not part of == or !=
            const condPart = trimmed.match(/^(?:if|elif|while)\s+(.+):\s*$/);
            if (condPart) {
                const cond = condPart[1];
                // Replace ==, !=, <=, >= with nothing, then check for remaining =
                const cleaned = cond.replace(/[!=<>]=|:=/g, '');
                if (/[^=]=(?!=)/.test(cleaned) && !cond.includes(' in ') && !cond.includes('lambda ')) {
                    errors.push({
                        id: 'SYN_PY04', severity: 'error', category: 'logic', isRealError: true,
                        title: 'SyntaxError: Invalid assignment in condition',
                        description: `Line ${i + 1}: You used "=" (assignment) instead of "==" (comparison) in a condition.`,
                        suggestion: 'Use == for comparison: if x == value:',
                        whyMatters: 'In Python, = assigns a value while == compares values. Using = in if/while is a syntax error.',
                        line: i + 1, lineContent: trimmed
                    });
                }
            }
        }
    }

    // 6. Check for return/break/continue outside function/loop
    let inFunction = false;
    let inLoop = false;
    let funcIndent = -1;
    let loopIndent = -1;
    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        const indent = lines[i].length - lines[i].trimStart().length;
        if (!trimmed || trimmed.startsWith('#')) continue;

        if (/^def\s+/.test(trimmed)) { inFunction = true; funcIndent = indent; }
        if (/^(for|while)\s+/.test(trimmed)) { inLoop = true; loopIndent = indent; }

        if (inFunction && indent <= funcIndent && !/^def\s+/.test(trimmed) && i > 0) inFunction = false;
        if (inLoop && indent <= loopIndent && !/^(for|while)\s+/.test(trimmed) && i > 0) inLoop = false;

        if (/^(break|continue)\b/.test(trimmed) && !inLoop) {
            errors.push({
                id: 'SYN_PY05', severity: 'error', category: 'syntax', isRealError: true,
                title: `SyntaxError: '${trimmed.split(/\s/)[0]}' outside loop`,
                description: `Line ${i + 1}: "${trimmed.split(/\s/)[0]}" can only be used inside a for or while loop.`,
                suggestion: 'Move this statement inside a loop, or use return to exit a function.',
                whyMatters: 'break and continue only work inside loops. Using them outside a loop causes a SyntaxError.',
                line: i + 1, lineContent: trimmed
            });
        }
    }

    // 7. Check for incomplete strings
    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith('#')) continue;
        // Count quotes (ignoring escaped ones)
        const singleQuotes = (trimmed.match(/(?<!\\)'/g) || []).length;
        const doubleQuotes = (trimmed.match(/(?<!\\)"/g) || []).length;
        // Check triple quotes separately
        const tripleSingle = (trimmed.match(/'''/g) || []).length;
        const tripleDouble = (trimmed.match(/"""/g) || []).length;

        if (tripleSingle === 0 && tripleDouble === 0) {
            if (singleQuotes % 2 !== 0) {
                errors.push({
                    id: 'SYN_PY06', severity: 'error', category: 'syntax', isRealError: true,
                    title: 'SyntaxError: Unterminated string literal',
                    description: `Line ${i + 1}: String is not properly closed — missing closing quote.`,
                    suggestion: 'Add the matching closing quote to complete the string.',
                    whyMatters: 'Every opening quote must have a matching closing quote, or Python cannot parse the code.',
                    line: i + 1, lineContent: trimmed
                });
            }
            if (doubleQuotes % 2 !== 0) {
                errors.push({
                    id: 'SYN_PY06', severity: 'error', category: 'syntax', isRealError: true,
                    title: 'SyntaxError: Unterminated string literal',
                    description: `Line ${i + 1}: String is not properly closed — missing closing quote.`,
                    suggestion: 'Add the matching closing quote to complete the string.',
                    whyMatters: 'Every opening quote must have a matching closing quote, or Python cannot parse the code.',
                    line: i + 1, lineContent: trimmed
                });
            }
        }
    }

    return errors;
}

function validateJavaScriptSyntax(code) {
    const errors = [];
    const lines = code.split('\n');

    // 1. Check unmatched brackets
    const bracketErrors = checkBrackets(code, lines);
    errors.push(...bracketErrors);

    // 2. Check for missing semicolons on statements (common errors)
    // Not a hard error in JS, but check for actual parse issues

    // 3. Check for invalid syntax patterns
    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*')) continue;

        // function without opening brace
        if (/^function\s+\w+\s*\([^)]*\)\s*$/.test(trimmed) && !trimmed.endsWith('{')) {
            const nextLine = lines[i + 1]?.trim();
            if (nextLine && !nextLine.startsWith('{')) {
                errors.push({
                    id: 'SYN_JS01', severity: 'error', category: 'syntax', isRealError: true,
                    title: 'SyntaxError: Missing function body',
                    description: `Line ${i + 1}: Function declaration needs { } braces for the body.`,
                    suggestion: `Add opening brace: ${trimmed} {`,
                    whyMatters: 'Functions require curly braces to define their body.',
                    line: i + 1, lineContent: trimmed
                });
            }
        }

        // = instead of == in if/while
        const condMatch = /^(if|while)\s*\((.+)\)/.exec(trimmed);
        if (condMatch) {
            const cond = condMatch[2];
            const cleaned = cond.replace(/===|!==|==|!=|<=|>=/g, '');
            if (/[^=!<>]=(?!=)/.test(cleaned) && !cond.includes('=>') && !cond.includes('let ') && !cond.includes('const ')) {
                errors.push({
                    id: 'SYN_JS02', severity: 'error', category: 'logic', isRealError: true,
                    title: 'Possible Error: Assignment in condition instead of comparison',
                    description: `Line ${i + 1}: Did you mean == or === instead of = in the condition?`,
                    suggestion: 'Use === (strict equality) for comparison, not = (assignment).',
                    whyMatters: 'Using = instead of == or === in a condition assigns a value instead of comparing.',
                    line: i + 1, lineContent: trimmed
                });
            }
        }

        // Calling undefined common functions with typos
        if (/\bconsol\./.test(trimmed) || /\bConsole\./.test(trimmed)) {
            errors.push({
                id: 'SYN_JS03', severity: 'error', category: 'syntax', isRealError: true,
                title: 'ReferenceError: "consol" is not defined (typo)',
                description: `Line ${i + 1}: Did you mean "console" instead of "${trimmed.match(/\b(consol|Console)\b/)?.[0]}"?`,
                suggestion: 'Fix the typo: console.log(...)',
                whyMatters: 'JavaScript is case-sensitive. Misspelling built-in objects causes ReferenceError.',
                line: i + 1, lineContent: trimmed
            });
        }

        // const reassignment
        if (/^const\s+(\w+)/.test(trimmed)) {
            const varName = trimmed.match(/^const\s+(\w+)/)[1];
            // Check if reassigned later
            for (let j = i + 1; j < lines.length; j++) {
                const laterLine = lines[j].trim();
                if (new RegExp(`^${varName}\\s*=[^=]`).test(laterLine)) {
                    errors.push({
                        id: 'SYN_JS04', severity: 'error', category: 'logic', isRealError: true,
                        title: `TypeError: Assignment to constant variable "${varName}"`,
                        description: `Line ${j + 1}: "${varName}" was declared with const on line ${i + 1} and cannot be reassigned.`,
                        suggestion: `Use let instead of const if you need to reassign: let ${varName} = ...`,
                        whyMatters: 'Variables declared with const cannot be reassigned. Use let if the value changes.',
                        line: j + 1, lineContent: laterLine
                    });
                    break;
                }
            }
        }
    }

    // 4. Check for unterminated strings
    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
        // Skip template literals
        if (trimmed.includes('`')) continue;
        const singleQuotes = (trimmed.match(/(?<!\\)'/g) || []).length;
        const doubleQuotes = (trimmed.match(/(?<!\\)"/g) || []).length;
        if (singleQuotes % 2 !== 0) {
            errors.push({
                id: 'SYN_JS05', severity: 'error', category: 'syntax', isRealError: true,
                title: 'SyntaxError: Unterminated string literal',
                description: `Line ${i + 1}: String is not properly closed — missing closing quote.`,
                suggestion: 'Add the matching closing quote to complete the string.',
                whyMatters: 'Unterminated strings prevent JavaScript from parsing the code.',
                line: i + 1, lineContent: trimmed
            });
        }
        if (doubleQuotes % 2 !== 0) {
            errors.push({
                id: 'SYN_JS05', severity: 'error', category: 'syntax', isRealError: true,
                title: 'SyntaxError: Unterminated string literal',
                description: `Line ${i + 1}: String is not properly closed — missing closing quote.`,
                suggestion: 'Add the matching closing quote to complete the string.',
                whyMatters: 'Unterminated strings prevent JavaScript from parsing the code.',
                line: i + 1, lineContent: trimmed
            });
        }
    }

    return errors;
}

// ─── Bracket Matching (shared) ───
function checkBrackets(code, lines) {
    const errors = [];
    const stack = [];
    const pairs = { '(': ')', '[': ']', '{': '}' };
    const closers = { ')': '(', ']': '[', '}': '{' };
    let inString = false;
    let stringChar = '';
    let inComment = false;
    let inMultiComment = false;

    for (let i = 0; i < code.length; i++) {
        const ch = code[i];
        const prev = i > 0 ? code[i - 1] : '';
        const next = i < code.length - 1 ? code[i + 1] : '';
        const lineNum = code.slice(0, i).split('\n').length;

        // Handle comments
        if (!inString && !inMultiComment && (ch === '#' || (ch === '/' && next === '/'))) { inComment = true; continue; }
        if (!inString && ch === '/' && next === '*') { inMultiComment = true; continue; }
        if (inMultiComment && ch === '*' && next === '/') { inMultiComment = false; i++; continue; }
        if (inComment && ch === '\n') { inComment = false; continue; }
        if (inComment || inMultiComment) continue;

        // Handle strings
        if (!inString && (ch === '"' || ch === "'" || ch === '`') && prev !== '\\') {
            inString = true; stringChar = ch; continue;
        }
        if (inString && ch === stringChar && prev !== '\\') { inString = false; continue; }
        if (inString) continue;

        // Track brackets
        if (pairs[ch]) {
            stack.push({ char: ch, line: lineNum, pos: i });
        } else if (closers[ch]) {
            if (stack.length === 0) {
                errors.push({
                    id: 'SYN_BRACKET', severity: 'error', category: 'syntax', isRealError: true,
                    title: `SyntaxError: Unexpected '${ch}'`,
                    description: `Line ${lineNum}: Found closing '${ch}' without a matching opening bracket.`,
                    suggestion: `Add the matching opening '${closers[ch]}' or remove this '${ch}'.`,
                    whyMatters: 'Every closing bracket must have a matching opening bracket.',
                    line: lineNum, lineContent: lines[lineNum - 1]?.trim() || ''
                });
            } else {
                const top = stack.pop();
                if (pairs[top.char] !== ch) {
                    errors.push({
                        id: 'SYN_BRACKET', severity: 'error', category: 'syntax', isRealError: true,
                        title: `SyntaxError: Mismatched brackets '${top.char}' and '${ch}'`,
                        description: `Line ${lineNum}: Expected '${pairs[top.char]}' to close '${top.char}' from line ${top.line}, but found '${ch}'.`,
                        suggestion: `Replace '${ch}' with '${pairs[top.char]}', or fix the opening bracket on line ${top.line}.`,
                        whyMatters: 'Brackets must be properly paired: ( with ), [ with ], { with }.',
                        line: lineNum, lineContent: lines[lineNum - 1]?.trim() || ''
                    });
                }
            }
        }
    }

    // Remaining unmatched opening brackets
    for (const item of stack) {
        errors.push({
            id: 'SYN_BRACKET', severity: 'error', category: 'syntax', isRealError: true,
            title: `SyntaxError: Unclosed '${item.char}'`,
            description: `Line ${item.line}: Opening '${item.char}' is never closed.`,
            suggestion: `Add a matching '${pairs[item.char]}' to close this bracket.`,
            whyMatters: 'Every opening bracket must have a matching closing bracket.',
            line: item.line, lineContent: lines[item.line - 1]?.trim() || ''
        });
    }

    return errors;
}

// ─── Python Analysis Rules ───
const pythonRules = [
    {
        id: 'PY001', severity: 'error', category: 'syntax',
        pattern: /print\s+[^(]/g,
        title: 'Missing parentheses in print statement',
        description: 'In Python 3, print is a function and requires parentheses.',
        suggestion: 'Use print() with parentheses: print("hello")',
        whyMatters: 'Python 3 requires print() as a function call. Without parentheses, you\'ll get a SyntaxError.'
    },
    {
        id: 'PY002', severity: 'warning', category: 'style',
        pattern: /^[A-Z][a-zA-Z]*\s*=\s*(?!class)/gm,
        title: 'Variable name starts with uppercase',
        description: 'Python convention (PEP 8) uses lowercase_with_underscores for variable names.',
        suggestion: 'Use snake_case for variable names: my_variable = ...',
        whyMatters: 'Following PEP 8 naming conventions makes your code more readable and consistent with the Python ecosystem.'
    },
    {
        id: 'PY003', severity: 'warning', category: 'bestpractice',
        pattern: /except\s*:/g,
        title: 'Bare except clause',
        description: 'Catching all exceptions without specifying a type can hide bugs.',
        suggestion: 'Specify the exception type: except ValueError:',
        whyMatters: 'Bare except catches everything including KeyboardInterrupt and SystemExit, making debugging difficult.'
    },
    {
        id: 'PY004', severity: 'info', category: 'readability',
        pattern: /def\s+\w+\([^)]*\)\s*:/g,
        check: (match, code) => {
            const funcLine = match[0];
            const funcEnd = match.index + funcLine.length;
            const nextLines = code.slice(funcEnd, funcEnd + 100);
            return !nextLines.match(/^\s*["']{3}|^\s*#/m);
        },
        title: 'Missing docstring',
        description: 'Functions should have docstrings explaining their purpose.',
        suggestion: 'Add a docstring: def my_func():\n    """Description of what this function does."""',
        whyMatters: 'Docstrings serve as documentation and appear in help() output. They help others understand your code.'
    },
    {
        id: 'PY005', severity: 'warning', category: 'logic',
        pattern: /while\s+True\s*:/g,
        title: 'Infinite loop detected',
        description: 'while True creates an infinite loop. Ensure there\'s a break condition.',
        suggestion: 'Add a break condition inside the loop or use a specific condition: while condition:',
        whyMatters: 'An infinite loop without a break will hang your program. Always ensure there\'s a clear exit path.'
    },
    {
        id: 'PY006', severity: 'suggestion', category: 'performance',
        pattern: /for\s+\w+\s+in\s+range\(len\(/g,
        title: 'Using range(len()) anti-pattern',
        description: 'Iterating with range(len()) is less Pythonic than using enumerate().',
        suggestion: 'Use enumerate(): for i, item in enumerate(my_list):',
        whyMatters: 'enumerate() is more readable and Pythonic. It avoids indexing errors and is the preferred pattern.'
    },
    {
        id: 'PY007', severity: 'warning', category: 'logic',
        pattern: /==\s*None|None\s*==/g,
        title: 'Comparison to None using ==',
        description: 'Use "is None" instead of "== None" for None comparisons.',
        suggestion: 'Use: if x is None:',
        whyMatters: 'The "is" operator checks identity, which is correct for None. "==" checks equality and can be overridden.'
    },
    {
        id: 'PY008', severity: 'info', category: 'readability',
        pattern: /[a-z]\s*=\s*.+/g,
        check: (match) => match[0].match(/^[a-z]\s*=/),
        title: 'Single-character variable name',
        description: 'Single-character variable names reduce code readability (except in loops).',
        suggestion: 'Use descriptive variable names: count = 0 instead of c = 0',
        whyMatters: 'Descriptive names make code self-documenting and easier to maintain for yourself and others.'
    },
    {
        id: 'PY009', severity: 'suggestion', category: 'performance',
        pattern: /\+\s*=\s*.*\+\s*/g,
        title: 'String concatenation in a loop may be inefficient',
        description: 'Repeated string concatenation creates new string objects each time.',
        suggestion: 'Use str.join() or list append: result = "".join(parts)',
        whyMatters: 'String concatenation has O(n²) complexity. Using join() is O(n) and much faster for large strings.'
    },
    {
        id: 'PY010', severity: 'warning', category: 'bestpractice',
        pattern: /def\s+\w+\([^)]*\blist\b[^)]*=[^)]*\[\]/g,
        title: 'Mutable default argument',
        description: 'Using a mutable default argument (like []) is a common Python gotcha.',
        suggestion: 'Use None as default: def func(items=None):\n    if items is None:\n        items = []',
        whyMatters: 'Mutable defaults are shared across function calls, leading to unexpected behavior.'
    },
    {
        id: 'PY011', severity: 'error', category: 'syntax',
        pattern: /\bdef\s+\w+\s*\(/g,
        check: (match, code) => {
            const afterMatch = code.slice(match.index);
            const firstLine = afterMatch.split('\n')[0];
            return !firstLine.includes(':');
        },
        title: 'Missing colon after function definition',
        description: 'Function definitions must end with a colon (:).',
        suggestion: 'Add a colon: def my_function():',
        whyMatters: 'The colon is required syntax in Python. Without it, you\'ll get a SyntaxError.'
    },
    {
        id: 'PY012', severity: 'info', category: 'style',
        pattern: /\t/g,
        title: 'Tab character found',
        description: 'PEP 8 recommends using 4 spaces instead of tabs for indentation.',
        suggestion: 'Configure your editor to use 4 spaces for indentation.',
        whyMatters: 'Mixing tabs and spaces causes IndentationError in Python 3. Spaces are the recommended standard.'
    },
    {
        id: 'PY013', severity: 'warning', category: 'logic',
        pattern: /if\s+\w+\s*==\s*True|if\s+\w+\s*==\s*False/g,
        title: 'Comparing to True/False explicitly',
        description: 'Don\'t compare boolean values to True or False explicitly.',
        suggestion: 'Use: if condition:  or  if not condition:',
        whyMatters: 'Direct boolean checks are more Pythonic and readable. Explicit comparison is redundant.'
    },
    {
        id: 'PY014', severity: 'suggestion', category: 'readability',
        pattern: /import\s+\*/g,
        title: 'Wildcard import',
        description: 'Importing everything with * makes it unclear what names are available.',
        suggestion: 'Import specific names: from module import name1, name2',
        whyMatters: 'Wildcard imports can lead to name conflicts and make code harder to understand.'
    }
];

// ─── JavaScript Analysis Rules ───
const jsRules = [
    {
        id: 'JS001', severity: 'warning', category: 'bestpractice',
        pattern: /\bvar\s+/g,
        title: 'Using "var" declaration',
        description: 'var has function scope which can lead to bugs. Prefer const or let.',
        suggestion: 'Use const for values that don\'t change, let for variables that do.',
        whyMatters: '"var" is hoisted and function-scoped, which can cause unexpected behavior. "const" and "let" are block-scoped.'
    },
    {
        id: 'JS002', severity: 'warning', category: 'logic',
        pattern: /[^=!<>]==[^=]/g,
        title: 'Using loose equality (==)',
        description: 'Loose equality performs type coercion which can cause unexpected results.',
        suggestion: 'Use strict equality (===) to avoid type coercion.',
        whyMatters: '"==" can produce surprising results like "0" == false being true. "===" is safer.'
    },
    {
        id: 'JS003', severity: 'error', category: 'logic',
        pattern: /\bconsole\.log\(/g,
        title: 'Console.log left in code',
        description: 'Debugging console.log statements should be removed from production code.',
        suggestion: 'Remove or replace with proper logging: logger.debug(...)',
        whyMatters: 'Console statements can expose sensitive data and clutter browser console in production.'
    },
    {
        id: 'JS004', severity: 'suggestion', category: 'performance',
        pattern: /\.forEach\(/g,
        check: (match, code) => {
            const before = code.slice(Math.max(0, match.index - 50), match.index);
            return before.includes('.filter(') || before.includes('.map(');
        },
        title: 'Chaining array methods unnecessarily',
        description: 'Chaining filter/map/forEach creates intermediate arrays.',
        suggestion: 'Consider using a single reduce() or for loop for better performance.',
        whyMatters: 'Each chained array method creates a new array, increasing memory usage.'
    },
    {
        id: 'JS005', severity: 'warning', category: 'bestpractice',
        pattern: /function\s*\(/g,
        check: (match, code) => !code.slice(Math.max(0, match.index - 20), match.index).includes('='),
        title: 'Anonymous function without name',
        description: 'Anonymous functions are harder to debug in stack traces.',
        suggestion: 'Use named functions or arrow functions for clarity.',
        whyMatters: 'Named functions appear in stack traces, making debugging easier.'
    },
    {
        id: 'JS006', severity: 'error', category: 'syntax',
        pattern: /;\s*;/g,
        title: 'Double semicolons',
        description: 'Double semicolons are usually a typo.',
        suggestion: 'Remove the extra semicolon.',
        whyMatters: 'While harmless, double semicolons indicate a potential logic error.'
    },
    {
        id: 'JS007', severity: 'warning', category: 'logic',
        pattern: /typeof\s+\w+\s*===?\s*["']undefined["']/g,
        title: 'Checking typeof for undefined',
        description: 'Consider using optional chaining (?.) or nullish coalescing (??) instead.',
        suggestion: 'Use: value ?? defaultValue  or  obj?.property',
        whyMatters: 'Modern JavaScript provides cleaner ways to handle undefined values.'
    },
    {
        id: 'JS008', severity: 'suggestion', category: 'readability',
        pattern: /new Promise\(\s*\(resolve,\s*reject\)\s*=>/g,
        title: 'Manual Promise construction',
        description: 'If wrapping an async operation, consider using async/await instead.',
        suggestion: 'Use async/await for cleaner asynchronous code.',
        whyMatters: 'async/await is more readable and easier to debug than promise chains.'
    },
    {
        id: 'JS009', severity: 'warning', category: 'bestpractice',
        pattern: /catch\s*\(\s*\w+\s*\)\s*\{\s*\}/g,
        title: 'Empty catch block',
        description: 'Silently swallowing errors makes debugging impossible.',
        suggestion: 'Handle the error or at least log it: catch(err) { console.error(err); }',
        whyMatters: 'Empty catch blocks hide errors that could indicate real problems in your code.'
    },
    {
        id: 'JS010', severity: 'info', category: 'style',
        pattern: /\belse\s*{\s*return/g,
        title: 'Unnecessary else after return',
        description: 'An else block after a return is unnecessary and adds nesting.',
        suggestion: 'Remove the else and keep the code at the same indentation level.',
        whyMatters: 'Early returns reduce nesting and make code flow clearer.'
    }
];

// ═══════════════════════════════════════════════════════════════════════
// JAVA SYNTAX VALIDATION
// ═══════════════════════════════════════════════════════════════════════

function validateJavaSyntax(code) {
    const errors = [];
    const lines = code.split('\n');

    // 1. Bracket/brace/paren matching
    const stack = [];
    const pairs = { '(': ')', '{': '}', '[': ']' };
    const closers = { ')': '(', '}': '{', ']': '[' };
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip strings and comments for bracket matching
        let inString = false;
        let stringChar = '';
        for (let j = 0; j < line.length; j++) {
            const ch = line[j];
            if (inString) {
                if (ch === stringChar && line[j - 1] !== '\\') inString = false;
                continue;
            }
            if (ch === '"' || ch === "'") { inString = true; stringChar = ch; continue; }
            if (ch === '/' && line[j + 1] === '/') break; // rest is comment
            if (pairs[ch]) { stack.push({ ch, line: i + 1 }); }
            if (closers[ch]) {
                const last = stack.pop();
                if (!last || last.ch !== closers[ch]) {
                    errors.push({
                        id: 'JAVA-SYN-BRACKET',
                        severity: 'error',
                        category: 'syntax',
                        title: `SyntaxError: Unmatched '${ch}'`,
                        description: `Found '${ch}' without matching '${closers[ch]}'.`,
                        suggestion: `Add the matching '${closers[ch]}' bracket.`,
                        whyMatters: 'Unmatched brackets cause compilation errors.',
                        line: i + 1,
                        lineContent: line.trim(),
                        isRealError: true
                    });
                }
            }
        }
    }
    if (stack.length > 0) {
        const unclosed = stack.pop();
        errors.push({
            id: 'JAVA-SYN-BRACKET',
            severity: 'error',
            category: 'syntax',
            title: `SyntaxError: Unclosed '${unclosed.ch}'`,
            description: `'${unclosed.ch}' opened on line ${unclosed.line} is never closed.`,
            suggestion: `Add a closing '${pairs[unclosed.ch]}' bracket.`,
            whyMatters: 'Unclosed brackets prevent compilation.',
            line: unclosed.line,
            lineContent: lines[unclosed.line - 1]?.trim(),
            isRealError: true
        });
    }

    // 2. Stray characters after semicolons (like  ;- or ;=)
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (/;\s*[^\s\/\}\)\{]/.test(line) && !/for\s*\(/.test(line) && !line.startsWith('//')) {
            const match = line.match(/;\s*([^\s\/\}\)\{])/);
            if (match) {
                errors.push({
                    id: 'JAVA-SYN-STRAY',
                    severity: 'error',
                    category: 'syntax',
                    title: `SyntaxError: Stray character '${match[1]}' after semicolon`,
                    description: `Unexpected character '${match[1]}' found after the semicolon. This will cause a compilation error.`,
                    suggestion: `Remove the stray '${match[1]}' character.`,
                    whyMatters: 'Stray characters are illegal syntax in Java and prevent compilation.',
                    line: i + 1,
                    lineContent: line,
                    isRealError: true
                });
            }
        }
    }

    // 3. catch order — catch(Exception) before more specific catch blocks
    const catchBlocks = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const catchMatch = line.match(/catch\s*\(\s*(\w+(?:\.\w+)*)\s+\w+\s*\)/);
        if (catchMatch) {
            catchBlocks.push({ type: catchMatch[1], line: i + 1 });
        }
    }
    // Check if a general Exception comes before a more specific one
    const generalExceptions = ['Exception', 'Throwable', 'java.lang.Exception', 'java.lang.Throwable'];
    let foundGeneral = null;
    for (const block of catchBlocks) {
        if (generalExceptions.includes(block.type)) {
            foundGeneral = block;
        } else if (foundGeneral) {
            errors.push({
                id: 'JAVA-SYN-CATCHORDER',
                severity: 'error',
                category: 'syntax',
                title: `CompileError: Unreachable catch block for '${block.type}'`,
                description: `catch(${block.type}) on line ${block.line} is unreachable because catch(${foundGeneral.type}) on line ${foundGeneral.line} already catches all exceptions.`,
                suggestion: `Move catch(${block.type}) BEFORE catch(${foundGeneral.type}) — always catch specific exceptions first.`,
                whyMatters: 'Java requires specific catch blocks before general ones. This is a compile-time error.',
                line: block.line,
                lineContent: lines[block.line - 1]?.trim(),
                isRealError: true
            });
        }
    }

    // 4. Missing semicolons on statements
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) continue;
        if (/^(import|package)\s+/.test(line) && !line.endsWith(';')) {
            errors.push({
                id: 'JAVA-SYN-SEMI',
                severity: 'error',
                category: 'syntax',
                title: 'SyntaxError: Missing semicolon',
                description: `Statement on line ${i + 1} is missing its semicolon.`,
                suggestion: 'Add a semicolon (;) at the end of the statement.',
                whyMatters: 'Java requires semicolons at the end of every statement.',
                line: i + 1,
                lineContent: line,
                isRealError: true
            });
        }
    }

    // 5. Missing main method in public class
    if (/public\s+class\b/.test(code) && !/public\s+static\s+void\s+main/.test(code)) {
        // This is not an error but worth noting — don't mark as real error
    }

    return errors;
}

// ─── Java Analysis Rules ───
const javaRules = [
    {
        id: 'JV001',
        severity: 'warning',
        category: 'best-practice',
        title: 'Catching generic Exception',
        description: 'Catching the generic Exception class can hide bugs. Catch specific exception types instead.',
        suggestion: 'Replace catch(Exception e) with specific types like catch(IOException e) or catch(NumberFormatException e).',
        whyMatters: 'Catching generic exceptions makes debugging harder because it hides the actual error type.',
        pattern: /catch\s*\(\s*Exception\s+\w+\s*\)/g
    },
    {
        id: 'JV002',
        severity: 'warning',
        category: 'best-practice',
        title: 'Empty catch block',
        description: 'An empty catch block silently swallows exceptions, making debugging very difficult.',
        suggestion: 'At minimum, log the exception: catch(Exception e) { e.printStackTrace(); }',
        whyMatters: 'Empty catch blocks hide errors completely — your program may fail silently without any indication of what went wrong.',
        pattern: /catch\s*\([^)]+\)\s*\{\s*\}/g
    },
    {
        id: 'JV003',
        severity: 'info',
        category: 'readability',
        title: 'System.out.println used for output',
        description: 'Using System.out.println is fine for learning, but production code should use a logging framework.',
        suggestion: 'For production: use Logger.info() from java.util.logging or SLF4J.',
        whyMatters: 'Logging frameworks provide log levels, formatting, and output configuration that println cannot.',
        pattern: /System\.out\.print(ln)?\(/g
    },
    {
        id: 'JV004',
        severity: 'warning',
        category: 'best-practice',
        title: 'Scanner not closed in finally block',
        description: 'Scanner (or other resource) should be closed in a finally block or use try-with-resources.',
        suggestion: 'Use try-with-resources: try (Scanner sc = new Scanner(System.in)) { ... }',
        whyMatters: 'Not closing resources can lead to resource leaks, especially with file handles and database connections.',
        pattern: /new\s+Scanner\s*\(/g,
        check: (match, code) => !code.includes('try (') || !code.includes('Scanner')
    },
    {
        id: 'JV005',
        severity: 'info',
        category: 'readability',
        title: 'Magic number in code',
        description: 'Hardcoded numeric literals make code harder to understand and maintain.',
        suggestion: 'Define constants: static final int MAX_SIZE = 30;',
        whyMatters: 'Named constants convey intent — "MAX_RETRIES" is clearer than the number 3.',
        pattern: /(?:=\s*|new\s+\w+\[)\{[^}]*\d{2,}/g
    },
    {
        id: 'JV006',
        severity: 'info',
        category: 'best-practice',
        title: 'Array access with hardcoded index',
        description: 'Accessing an array with a hardcoded index could cause ArrayIndexOutOfBoundsException if the index exceeds the array length.',
        suggestion: 'Check array length before access: if (index < arr.length) { arr[index]; }',
        whyMatters: 'Hardcoded array indices are fragile — if the array size changes, the code will crash at runtime.',
        pattern: /\w+\[\d+\]/g
    },
    {
        id: 'JV007',
        severity: 'suggestion',
        category: 'readability',
        title: 'Consider using try-with-resources',
        description: 'Java 7+ supports try-with-resources for AutoCloseable resources, which is cleaner and safer.',
        suggestion: 'Replace: Scanner sc = new Scanner(...); try { } finally { sc.close(); }\nWith: try (Scanner sc = new Scanner(...)) { }',
        whyMatters: 'try-with-resources automatically closes resources even if an exception occurs, preventing resource leaks.',
        pattern: /\w+\.close\(\)/g
    },
    {
        id: 'JV008',
        severity: 'warning',
        category: 'logic',
        title: 'Division without zero check',
        description: 'Performing integer division without checking if the divisor is zero can cause ArithmeticException.',
        suggestion: 'Add a guard: if (b != 0) { result = a / b; } else { /* handle zero */ }',
        whyMatters: 'ArithmeticException from division by zero will crash your program at runtime.',
        pattern: /\w+\s*\/\s*\w+\s*;/g,
        check: (match, code) => !code.includes('ArithmeticException') || code.indexOf('ArithmeticException') > code.indexOf(match[0])
    },
    {
        id: 'JV009',
        severity: 'info',
        category: 'readability',
        title: 'Single-letter variable name',
        description: 'Single-letter variable names (except for loop indices) reduce readability.',
        suggestion: 'Use descriptive names: "numerator" instead of "a", "denominator" instead of "b".',
        whyMatters: 'Descriptive names make code self-documenting and easier for others (and future you) to understand.',
        pattern: /(?:int|double|float|long|String|char|boolean)\s+([a-z])\s*[=;]/g,
        check: (match) => !['i', 'j', 'k', 'n', 'e'].includes(match[1])
    },
    {
        id: 'JV010',
        severity: 'warning',
        category: 'best-practice',
        title: 'String comparison using ==',
        description: 'Using == to compare Strings checks reference equality, not value equality.',
        suggestion: 'Use .equals() method: str1.equals(str2) or Objects.equals(str1, str2) for null safety.',
        whyMatters: '== compares memory addresses, not content. Two identical strings can have different addresses.',
        pattern: /"[^"]*"\s*==\s*|==\s*"[^"]*"/g
    },
    {
        id: 'JV011',
        severity: 'info',
        category: 'best-practice',
        title: 'Consider using final for constants',
        description: 'Variables that don\'t change should be declared as final to indicate immutability.',
        suggestion: 'Add final keyword: final int MAX_SIZE = 100;',
        whyMatters: 'final makes code intent clearer and helps the compiler optimize.',
        pattern: /(?:static\s+)(?!final\s+)\w+\s+[A-Z_]{2,}\s*=/g
    },
    {
        id: 'JV012',
        severity: 'info',
        category: 'readability',
        title: 'Public class should have javadoc',
        description: 'Public classes should have Javadoc comments explaining their purpose.',
        suggestion: 'Add: /** Description of this class. */ before the class declaration.',
        whyMatters: 'Javadoc generates documentation and helps other developers understand your code.',
        pattern: /(?<!\*\/\s*\n\s*)public\s+class\s+/g
    }
];

// ─── Run Analysis ───
export function analyzeCode(code, language = null) {
    if (!code.trim()) return { issues: [], score: null, language: 'unknown', codeStatus: null, syntaxErrors: [], styleIssues: [] };

    const lang = language || detectLanguage(code);
    const rules = lang === 'javascript' ? jsRules : lang === 'java' ? javaRules : pythonRules;
    const issues = [];
    const lines = code.split('\n');

    // ═══ STEP 1: Real Syntax Validation (checks if code is correct or wrong) ═══
    let syntaxErrors;
    if (lang === 'javascript') {
        syntaxErrors = validateJavaScriptSyntax(code);
    } else if (lang === 'java') {
        syntaxErrors = validateJavaSyntax(code);
    } else {
        syntaxErrors = validatePythonSyntax(code);
    }

    // Add syntax errors to issues
    issues.push(...syntaxErrors);

    // ═══ STEP 2: Style & Best Practice Checks (suggestions, not errors) ═══
    for (const rule of rules) {
        const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
        let match;

        while ((match = regex.exec(code)) !== null) {
            // Optional check function
            if (rule.check && !rule.check(match, code)) continue;

            // Calculate line number
            const lineNum = code.slice(0, match.index).split('\n').length;
            const lineContent = lines[lineNum - 1]?.trim() || '';

            // Skip if we already have a syntax error on this exact line with same message
            const alreadyReported = syntaxErrors.some(e => e.line === lineNum && e.category === 'syntax');
            if (alreadyReported && rule.category === 'syntax') continue;

            issues.push({
                id: rule.id,
                severity: rule.severity,
                category: rule.category,
                title: rule.title,
                description: rule.description,
                suggestion: rule.suggestion,
                whyMatters: rule.whyMatters,
                line: lineNum,
                lineContent,
                isRealError: false, // these are style/best-practice issues
                column: match.index - code.lastIndexOf('\n', match.index - 1)
            });
        }
    }

    // Sort: real errors first, then warnings, then info, then suggestions
    const severityOrder = { error: 0, warning: 1, info: 2, suggestion: 3 };
    issues.sort((a, b) => {
        // Real errors always come first
        if (a.isRealError && !b.isRealError) return -1;
        if (!a.isRealError && b.isRealError) return 1;
        return severityOrder[a.severity] - severityOrder[b.severity];
    });

    // ═══ STEP 3: Determine Code Status ═══
    const realErrors = issues.filter(i => i.isRealError);
    const styleIssues = issues.filter(i => !i.isRealError);
    let codeStatus;
    if (realErrors.length > 0) {
        codeStatus = 'has_errors';
    } else if (styleIssues.filter(i => i.severity === 'warning').length > 0) {
        codeStatus = 'has_warnings';
    } else {
        codeStatus = 'correct';
    }

    // Compute score
    const score = computeScore(code, issues, lang);

    return { issues, score, language: lang, codeStatus, syntaxErrors: realErrors, styleIssues };
}

// ─── Score Computation ───
function computeScore(code, issues, language) {
    const lines = code.split('\n').filter(l => l.trim()).length;
    if (lines === 0) return null;

    // Correctness (40%)
    let correctness = 100;
    for (const issue of issues) {
        if (issue.severity === 'error') correctness -= 10;
        if (issue.severity === 'warning' && issue.category === 'logic') correctness -= 5;
    }
    correctness = Math.max(0, Math.min(100, correctness));

    // Performance (20%)
    let performance = 100;
    const hasNestedLoops = /for\s.*\n\s*for\s|while\s.*\n\s*while\s|for\s.*\n\s*while\s/m.test(code);
    if (hasNestedLoops) performance -= 30;
    const perfIssues = issues.filter(i => i.category === 'performance').length;
    performance -= perfIssues * 10;
    performance = Math.max(0, Math.min(100, performance));

    // Readability (20%)
    let readability = 100;
    const avgLineLength = code.split('\n').reduce((s, l) => s + l.length, 0) / lines;
    if (avgLineLength > 100) readability -= 15;
    if (avgLineLength > 120) readability -= 20;
    const hasComments = (code.match(/#|\/\/|\/\*/g) || []).length;
    if (hasComments < lines / 10) readability -= 10;
    const readIssues = issues.filter(i => i.category === 'readability' || i.category === 'style').length;
    readability -= readIssues * 5;
    readability = Math.max(0, Math.min(100, readability));

    // Best Practices (20%)
    let bestPractices = 100;
    const bpIssues = issues.filter(i => i.category === 'bestpractice').length;
    bestPractices -= bpIssues * 8;
    bestPractices = Math.max(0, Math.min(100, bestPractices));

    const overall = Math.round(
        correctness * 0.4 +
        performance * 0.2 +
        readability * 0.2 +
        bestPractices * 0.2
    );

    return {
        overall,
        correctness: Math.round(correctness),
        performance: Math.round(performance),
        readability: Math.round(readability),
        bestPractices: Math.round(bestPractices)
    };
}

// ─── Generate Refactoring Suggestions ───
export function generateRefactorings(code, issues, language) {
    const refactorings = [];

    if (language === 'python') {
        // range(len()) → enumerate()
        if (code.includes('range(len(')) {
            const original = extractSnippet(code, 'range(len(');
            refactorings.push({
                category: 'readability',
                title: 'Use enumerate() instead of range(len())',
                original,
                refactored: original.replace(/for\s+(\w+)\s+in\s+range\(len\((\w+)\)\)/, 'for $1, item in enumerate($2)'),
                explanation: 'enumerate() is the Pythonic way to iterate with an index. It\'s more readable and less error-prone.'
            });
        }

        // == None → is None
        if (code.includes('== None')) {
            const original = extractSnippet(code, '== None');
            refactorings.push({
                category: 'readability',
                title: 'Use "is None" instead of "== None"',
                original,
                refactored: original.replace(/(\w+)\s*==\s*None/g, '$1 is None'),
                explanation: '"is" checks identity, which is the correct way to compare with None. "==" can be overridden by classes.'
            });
        }

        // Bare except →  specific except
        if (code.includes('except:')) {
            const original = extractSnippet(code, 'except:');
            refactorings.push({
                category: 'maintainability',
                title: 'Specify exception type in except clause',
                original,
                refactored: original.replace('except:', 'except Exception as e:'),
                explanation: 'Catching specific exceptions prevents hiding bugs like KeyboardInterrupt or SystemExit.'
            });
        }

        // if x == True → if x
        if (/if\s+\w+\s*==\s*True/.test(code)) {
            const original = extractSnippet(code, '== True');
            refactorings.push({
                category: 'readability',
                title: 'Remove explicit comparison to True',
                original,
                refactored: original.replace(/if\s+(\w+)\s*==\s*True/g, 'if $1'),
                explanation: 'Comparing to True explicitly is redundant. The boolean value itself is sufficient.'
            });
        }

        // import * → specific imports
        if (code.includes('import *')) {
            const original = extractSnippet(code, 'import *');
            refactorings.push({
                category: 'maintainability',
                title: 'Replace wildcard import with specific imports',
                original,
                refactored: original.replace(/from\s+(\w+)\s+import\s+\*/, 'from $1 import specific_function, SpecificClass'),
                explanation: 'Wildcard imports make it unclear what names are available and can cause name conflicts.'
            });
        }
    }

    if (language === 'javascript') {
        // var → const/let
        if (/\bvar\s+/.test(code)) {
            const original = extractSnippet(code, 'var ');
            refactorings.push({
                category: 'readability',
                title: 'Replace "var" with "const" or "let"',
                original,
                refactored: original.replace(/\bvar\s+/g, 'const '),
                explanation: '"const" and "let" are block-scoped and prevent accidental reassignment. Use "const" by default.'
            });
        }

        // == → ===
        if (/[^=!<>]==[^=]/.test(code)) {
            const original = extractSnippet(code, '==');
            refactorings.push({
                category: 'maintainability',
                title: 'Use strict equality (===)',
                original,
                refactored: original.replace(/([^=!<>])={2}([^=])/g, '$1===$2'),
                explanation: 'Strict equality avoids type coercion bugs like "0" == false being true.'
            });
        }

        // Promise → async/await
        if (code.includes('new Promise')) {
            const original = extractSnippet(code, 'new Promise');
            refactorings.push({
                category: 'readability',
                title: 'Consider async/await over manual Promise construction',
                original,
                refactored: '// Consider refactoring to:\nasync function myFunction() {\n  const result = await someAsyncOperation();\n  return result;\n}',
                explanation: 'async/await provides cleaner syntax for asynchronous operations and better error handling with try/catch.'
            });
        }
    }

    if (language === 'java') {
        // catch(Exception) → specific exception
        if (/catch\s*\(\s*Exception\s+/.test(code)) {
            const original = extractSnippet(code, 'catch');
            refactorings.push({
                category: 'maintainability',
                title: 'Catch specific exception types',
                original,
                refactored: original.replace(/catch\s*\(\s*Exception\s+(\w+)\s*\)/g, 'catch (ArithmeticException $1)'),
                explanation: 'Catching specific exceptions makes error handling more precise and helps with debugging.'
            });
        }

        // Scanner without try-with-resources
        if (code.includes('new Scanner') && !code.includes('try (')) {
            const original = extractSnippet(code, 'new Scanner');
            refactorings.push({
                category: 'readability',
                title: 'Use try-with-resources for Scanner',
                original,
                refactored: original.replace(
                    /Scanner\s+(\w+)\s*=\s*new\s+Scanner\(([^)]+)\);/,
                    '// Use try-with-resources:\ntry (Scanner $1 = new Scanner($2)) {'
                ),
                explanation: 'try-with-resources automatically closes the Scanner when done, preventing resource leaks.'
            });
        }

        // Catch order fix
        if (/catch\s*\(\s*Exception\b/.test(code) && /catch\s*\(\s*\w+Exception\b/.test(code)) {
            const catchLines = code.split('\n').filter(l => /catch\s*\(/.test(l));
            if (catchLines.length >= 2) {
                refactorings.push({
                    category: 'maintainability',
                    title: 'Fix catch block order — specific before general',
                    original: catchLines.join('\n'),
                    refactored: [...catchLines].reverse().join('\n'),
                    explanation: 'In Java, specific exception types must be caught before general ones. catch(Exception) catches everything, making subsequent catch blocks unreachable.'
                });
            }
        }
    }

    return refactorings;
}

function extractSnippet(code, keyword) {
    const lines = code.split('\n');
    const idx = lines.findIndex(l => l.includes(keyword));
    if (idx === -1) return keyword;
    const start = Math.max(0, idx - 1);
    const end = Math.min(lines.length, idx + 3);
    return lines.slice(start, end).join('\n');
}

// ─── Generate Flowchart Data ───
export function generateFlowchart(code, language) {
    const nodes = [];
    const lines = code.split('\n');

    nodes.push({ type: 'start', label: 'Start', id: 'start' });

    let nodeId = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('#') || line.startsWith('//')) continue;

        if (/^(def |function |const \w+ = |public |private |protected |static |void |class )/.test(line)) {
            nodes.push({ type: 'process', label: line.slice(0, 50), id: `n${nodeId++}`, line: i + 1 });
        } else if (/^(if |else if|elif |else:?|else\s*\{|\}\s*else)/.test(line)) {
            nodes.push({ type: 'decision', label: line.slice(0, 40), id: `n${nodeId++}`, line: i + 1 });
        } else if (/^(for |while |do\s*\{)/.test(line)) {
            nodes.push({ type: 'decision', label: line.slice(0, 40), id: `n${nodeId++}`, line: i + 1 });
        } else if (/^(try\s*\{|try\s*\()/.test(line)) {
            nodes.push({ type: 'process', label: 'try block', id: `n${nodeId++}`, line: i + 1 });
        } else if (/^catch\s*\(/.test(line)) {
            nodes.push({ type: 'decision', label: line.slice(0, 40), id: `n${nodeId++}`, line: i + 1 });
        } else if (/^finally\s*\{/.test(line)) {
            nodes.push({ type: 'process', label: 'finally block', id: `n${nodeId++}`, line: i + 1 });
        } else if (/^(return |print\(|console\.log|System\.out|input\(|prompt\()/.test(line)) {
            nodes.push({ type: 'io', label: line.slice(0, 40), id: `n${nodeId++}`, line: i + 1 });
        } else if (/^(import |from |require\(|package )/.test(line)) {
            // skip imports for cleaner flowchart
        } else if (/\w+\s*=\s*/.test(line) || /\w+\.\w+\(/.test(line)) {
            nodes.push({ type: 'process', label: line.slice(0, 50), id: `n${nodeId++}`, line: i + 1 });
        }

        if (nodes.length > 15) break; // limit for visual clarity
    }

    nodes.push({ type: 'end', label: 'End', id: 'end' });

    return nodes;
}

// ─── Bug Prediction ────
export function predictBugs(code, language) {
    const predictions = [];

    if (language === 'python') {
        // Division by zero
        if (/\/\s*\w+/.test(code) && !code.includes('ZeroDivisionError')) {
            predictions.push({
                type: 'warning',
                title: 'Potential Division by Zero',
                description: 'Your code performs division without checking if the divisor is zero.',
                suggestion: 'Add a check: if divisor != 0: result = a / divisor'
            });
        }

        // Index out of range
        if (/\[\w+\]/.test(code) && !code.includes('IndexError')) {
            predictions.push({
                type: 'info',
                title: 'Potential Index Out of Range',
                description: 'Accessing list/array elements without bounds checking could cause IndexError.',
                suggestion: 'Check length before accessing: if i < len(my_list): value = my_list[i]'
            });
        }

        // Empty input handling
        if (code.includes('input(') && !code.includes('if ') && !code.includes('try')) {
            predictions.push({
                type: 'warning',
                title: 'Unvalidated User Input',
                description: 'User input is used without validation, which could cause crashes.',
                suggestion: 'Validate input with try/except or conditional checks.'
            });
        }
    }

    if (language === 'javascript') {
        // Null/undefined access
        if (/\.\w+/.test(code) && !code.includes('?.')) {
            predictions.push({
                type: 'info',
                title: 'Potential Null/Undefined Access',
                description: 'Accessing properties without null checks could cause TypeError.',
                suggestion: 'Use optional chaining: obj?.property?.nested'
            });
        }

        // Async without await
        if (code.includes('async') && !code.includes('await') && code.includes('Promise')) {
            predictions.push({
                type: 'warning',
                title: 'Async Function Without Await',
                description: 'An async function that doesn\'t use await may not behave as expected.',
                suggestion: 'Add await before async operations: const data = await fetchData();'
            });
        }
    }

    if (language === 'java') {
        // Division by zero
        if (/\/\s*\w+/.test(code)) {
            predictions.push({
                type: 'warning',
                title: 'Potential ArithmeticException (Division by Zero)',
                description: 'Integer division in Java throws ArithmeticException if the divisor is zero. Your code should validate the divisor before dividing.',
                suggestion: 'Add a guard: if (b != 0) { result = a / b; } else { System.out.println("Cannot divide by zero"); }'
            });
        }

        // ArrayIndexOutOfBounds
        if (/\w+\[\d+\]/.test(code)) {
            const matches = code.match(/\w+\[(\d+)\]/g) || [];
            for (const m of matches) {
                const idx = parseInt(m.match(/\[(\d+)\]/)[1]);
                if (idx >= 3) { // heuristic: flag large indices
                    predictions.push({
                        type: 'warning',
                        title: 'Potential ArrayIndexOutOfBoundsException',
                        description: `Accessing index ${idx} on an array — if the array has fewer than ${idx + 1} elements, this will crash at runtime.`,
                        suggestion: `Check bounds first: if (${idx} < arr.length) { System.out.println(arr[${idx}]); }`
                    });
                }
            }
        }

        // NullPointerException
        if (/\w+\.\w+\(/.test(code) && !code.includes('!= null')) {
            predictions.push({
                type: 'info',
                title: 'Potential NullPointerException',
                description: 'Method calls on objects without null checks can throw NullPointerException.',
                suggestion: 'Add null checks before method calls: if (obj != null) { obj.method(); }'
            });
        }

        // Unreachable catch block
        if (/catch\s*\(\s*Exception\b/.test(code)) {
            const catchLines = [];
            const codeLines = code.split('\n');
            for (let i = 0; i < codeLines.length; i++) {
                if (/catch\s*\(/.test(codeLines[i])) catchLines.push({ line: i + 1, content: codeLines[i].trim() });
            }
            let seenGeneral = false;
            for (const c of catchLines) {
                if (/Exception\s+\w+/.test(c.content) && !/\w+Exception/.test(c.content.replace('Exception', ''))) {
                    seenGeneral = true;
                } else if (seenGeneral) {
                    predictions.push({
                        type: 'error',
                        title: 'Unreachable Catch Block',
                        description: `The catch block on line ${c.line} will never execute because a previous catch(Exception) already catches all exceptions.`,
                        suggestion: 'Move specific exception catches BEFORE the general Exception catch.'
                    });
                }
            }
        }
    }

    return predictions;
}

// ─── Plagiarism Detection (Token-based similarity) ───
function tokenize(code) {
    return code
        .replace(/["'].*?["']/g, 'STRING')
        .replace(/\d+/g, 'NUM')
        .replace(/\/\/.*|#.*/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split(/\s+/)
        .filter(t => t.length > 0);
}

export function checkPlagiarism(code, corpus = []) {
    if (!corpus.length) {
        // Use some common code patterns as sample corpus
        return {
            similarity: 0,
            matches: [],
            verdict: 'No corpus available for comparison'
        };
    }

    const tokens1 = tokenize(code);
    const results = [];

    for (const sample of corpus) {
        const tokens2 = tokenize(sample.code);
        const commonTokens = tokens1.filter(t => tokens2.includes(t)).length;
        const similarity = Math.round((commonTokens / Math.max(tokens1.length, tokens2.length)) * 100);

        if (similarity > 30) {
            results.push({
                source: sample.name,
                similarity,
                matchedLines: `${Math.min(5, Math.floor(similarity / 10))} matching blocks`
            });
        }
    }

    results.sort((a, b) => b.similarity - a.similarity);

    return {
        similarity: results.length > 0 ? results[0].similarity : 0,
        matches: results.slice(0, 5),
        verdict: results.length > 0 && results[0].similarity > 60
            ? 'High similarity detected — review for potential plagiarism'
            : results.length > 0 && results[0].similarity > 30
                ? 'Some similarity found — likely coincidental'
                : 'No significant similarity detected'
    };
}
