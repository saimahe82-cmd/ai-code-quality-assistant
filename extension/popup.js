/* ═══════════════════════════════════════════════════════════════════════
   Codewhiz — Chrome Extension Popup Logic
   ═══════════════════════════════════════════════════════════════════════ */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-3.5-turbo';

// ─── DOM Elements ───
const tabs = document.querySelectorAll('.tab');
const tabContents = {
    analyze: document.getElementById('tab-analyze'),
    chat: document.getElementById('tab-chat'),
    settings: document.getElementById('tab-settings'),
};
const codeInput = document.getElementById('code-input');
const langSelect = document.getElementById('lang-select');
const analyzeBtn = document.getElementById('analyze-btn');
const interpretBtn = document.getElementById('interpret-btn');
const resultsArea = document.getElementById('results-area');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');
const apiKeyInput = document.getElementById('api-key-input');
const saveKeyBtn = document.getElementById('save-key-btn');
const keyStatus = document.getElementById('key-status');
const openAppBtn = document.getElementById('open-app-btn');
const websiteLink = document.getElementById('website-link');

// ─── Tab Switching ───
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        Object.values(tabContents).forEach(c => c.classList.add('hidden'));
        tab.classList.add('active');
        tabContents[tab.dataset.tab].classList.remove('hidden');
    });
});

// ─── Load saved API key ───
chrome.storage.local.get(['openai_key'], (result) => {
    if (result.openai_key) {
        apiKeyInput.value = '••••••••••••••••••';
    }
});

// ─── Check for pending action (from context menu) ───
chrome.storage.local.get(['pendingAction', 'pendingCode'], (result) => {
    if (result.pendingCode) {
        codeInput.value = result.pendingCode;
        chrome.storage.local.remove(['pendingAction', 'pendingCode']);

        if (result.pendingAction === 'analyze') {
            setTimeout(() => analyzeCode(), 300);
        } else if (result.pendingAction === 'explain') {
            // Switch to chat and explain
            tabs.forEach(t => t.classList.remove('active'));
            Object.values(tabContents).forEach(c => c.classList.add('hidden'));
            tabs[1].classList.add('active');
            tabContents.chat.classList.remove('hidden');
            sendChat('Explain this code:\n```\n' + result.pendingCode + '\n```');
        } else if (result.pendingAction === 'debug') {
            tabs.forEach(t => t.classList.remove('active'));
            Object.values(tabContents).forEach(c => c.classList.add('hidden'));
            tabs[1].classList.add('active');
            tabContents.chat.classList.remove('hidden');
            sendChat('Debug this code and find potential issues:\n```\n' + result.pendingCode + '\n```');
        }
    }
});

// ═══════════════════════════════════════════════════════════════════════
//  LANGUAGE DETECTION
// ═══════════════════════════════════════════════════════════════════════

function detectLanguage(code) {
    if (/\b(def |import |print\(|elif |class \w+:)/.test(code)) return 'python';
    if (/\b(console\.|const |let |=>|function\s)/.test(code)) return 'javascript';
    if (/\b(public\s+class|System\.out|void\s+main)/.test(code)) return 'java';
    if (/\b(#include|printf\(|int\s+main)/.test(code)) return 'c';
    return 'javascript';
}

// ═══════════════════════════════════════════════════════════════════════
//  CODE ANALYSIS (Local + AI)
// ═══════════════════════════════════════════════════════════════════════

analyzeBtn.addEventListener('click', () => analyzeCode());

async function analyzeCode() {
    const code = codeInput.value.trim();
    if (!code) return;

    const lang = langSelect.value === 'auto' ? detectLanguage(code) : langSelect.value;
    langSelect.value = lang;

    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<span class="spinner"></span> Analyzing...';
    resultsArea.innerHTML = '';

    // Local quick analysis
    const localResult = localAnalyze(code, lang);
    renderResults(localResult);

    // If API key exists, also run AI analysis
    const apiKey = await getApiKey();
    if (apiKey) {
        try {
            const aiResult = await aiAnalyze(code, lang, apiKey);
            renderResults({ ...localResult, aiSummary: aiResult.summary, aiIssues: aiResult.issues || [] });
        } catch (e) {
            console.error('AI analysis failed:', e);
        }
    }

    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = '🔍 Analyze';
}

function localAnalyze(code, lang) {
    const issues = [];
    const lines = code.split('\n');
    let score = 85;

    // Common checks
    lines.forEach((line, i) => {
        const trimmed = line.trim();
        const lineNum = i + 1;

        // Long lines
        if (line.length > 100) {
            issues.push({ severity: 'info', title: `Line ${lineNum} is too long (${line.length} chars)`, desc: 'Keep lines under 100 characters for readability.' });
        }

        // TODO comments
        if (/\/\/\s*TODO|#\s*TODO/.test(trimmed)) {
            issues.push({ severity: 'info', title: `TODO comment on line ${lineNum}`, desc: 'Unfinished task found.' });
        }
    });

    // Python checks
    if (lang === 'python') {
        if (/except\s*:/.test(code)) {
            issues.push({ severity: 'warning', title: 'Bare except clause', desc: 'Catch specific exceptions instead of using bare except.' });
            score -= 5;
        }
        if (/\beval\s*\(/.test(code)) {
            issues.push({ severity: 'error', title: 'Use of eval()', desc: 'eval() is a security risk. Use ast.literal_eval() instead.' });
            score -= 15;
        }
        if (!/^[a-z_]/.test(code.match(/def\s+(\w+)/)?.[1] || 'a')) {
            // Function naming
        }
    }

    // JavaScript checks
    if (lang === 'javascript') {
        if (/\bvar\s+/.test(code)) {
            issues.push({ severity: 'warning', title: 'Use of var keyword', desc: 'Use let or const instead of var for block scoping.' });
            score -= 3;
        }
        if (/==(?!=)/.test(code)) {
            issues.push({ severity: 'warning', title: 'Loose equality (==)', desc: 'Use strict equality (===) to avoid type coercion bugs.' });
            score -= 3;
        }
        if (/\bconsole\.log/.test(code)) {
            issues.push({ severity: 'info', title: 'Console.log found', desc: 'Remove debug statements before production.' });
        }
    }

    // Java checks
    if (lang === 'java') {
        if (!/\bprivate\b/.test(code) && /\bclass\b/.test(code)) {
            issues.push({ severity: 'suggestion', title: 'No private fields', desc: 'Consider using private access modifiers for encapsulation.' });
        }
    }

    if (issues.filter(i => i.severity === 'error').length > 0) score -= 20;
    score = Math.max(10, Math.min(100, score));

    return { score, issues, language: lang, codeStatus: issues.filter(i => i.severity === 'error').length > 0 ? 'has_errors' : issues.length > 0 ? 'has_warnings' : 'correct' };
}

async function aiAnalyze(code, lang, apiKey) {
    const res = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: 'system', content: 'You are a code reviewer. Analyze the code and return JSON: {"summary":"...","issues":[{"severity":"error|warning|info","title":"...","desc":"..."}]}. Return ONLY JSON.' },
                { role: 'user', content: `Analyze this ${lang} code:\n\`\`\`${lang}\n${code.slice(0, 3000)}\n\`\`\`` }
            ],
            temperature: 0.3,
            max_tokens: 800
        })
    });

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '{}';
    return JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
}

function renderResults(result) {
    const scoreClass = result.score >= 80 ? 'score-high' : result.score >= 50 ? 'score-med' : 'score-low';

    let html = `
        <div class="result-card">
            <div class="result-header">
                Score: <span class="score-badge ${scoreClass}">${result.score}/100</span>
                <span style="margin-left:auto;font-size:11px;color:#8b93a7;">${result.language}</span>
            </div>
            ${result.aiSummary ? `<div style="font-size:12px;color:#8b93a7;margin-bottom:8px;padding:8px;background:rgba(108,92,231,0.06);border-radius:6px;">🧠 <strong>AI:</strong> ${result.aiSummary}</div>` : ''}
    `;

    const allIssues = [...result.issues, ...(result.aiIssues || [])];

    if (allIssues.length === 0) {
        html += '<div class="no-issues">✅ No issues found! Code looks great.</div>';
    } else {
        allIssues.forEach(issue => {
            const cls = issue.severity === 'error' ? 'issue-error' : issue.severity === 'warning' ? 'issue-warning' : issue.severity === 'suggestion' ? 'issue-suggestion' : 'issue-info';
            html += `<div class="issue-item ${cls}"><strong>${issue.title}</strong><br>${issue.desc || issue.description || ''}</div>`;
        });
    }

    html += '</div>';
    resultsArea.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════════
//  INTERPRETER
// ═══════════════════════════════════════════════════════════════════════

interpretBtn.addEventListener('click', () => {
    const code = codeInput.value.trim();
    if (!code) return;

    const lang = langSelect.value === 'auto' ? detectLanguage(code) : langSelect.value;
    const lines = code.split('\n');
    const output = [];

    if (lang === 'javascript') {
        try {
            const fakeConsole = {
                log: (...a) => output.push(a.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join(' ')),
                warn: (...a) => output.push('⚠️ ' + a.join(' ')),
                error: (...a) => output.push('❌ ' + a.join(' ')),
                info: (...a) => output.push('ℹ️ ' + a.join(' ')),
            };
            const fn = new Function('console', 'document', 'window', 'globalThis', 'eval', '"use strict";\n' + code);
            fn(fakeConsole, undefined, undefined, undefined, undefined);
        } catch (e) {
            output.push('❌ Error: ' + e.message);
        }
    } else if (lang === 'python') {
        lines.forEach(line => {
            const m = line.trim().match(/^print\s*\((.+)\)\s*$/);
            if (m) output.push(m[1].replace(/^["']|["']$/g, ''));
        });
    } else if (lang === 'java') {
        lines.forEach(line => {
            const m = line.trim().match(/System\.out\.println\s*\(\s*(.+?)\s*\)\s*;?$/);
            if (m) output.push(m[1].replace(/^"|"$/g, ''));
        });
    }

    let html = '<div class="result-card"><div class="result-header">▶ Output</div>';
    if (output.length > 0) {
        output.forEach((line, i) => {
            html += `<div style="padding:2px 0;font-family:monospace;font-size:12px;color:#55efc4;"><span style="color:#4a5068;margin-right:8px;">${i + 1}</span>${escapeHtml(line)}</div>`;
        });
    } else {
        html += '<div class="no-issues" style="color:#8b93a7;">No output. Add print/console.log statements.</div>';
    }
    html += '</div>';
    resultsArea.innerHTML = html;
});

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ═══════════════════════════════════════════════════════════════════════
//  CHATBOT
// ═══════════════════════════════════════════════════════════════════════

let chatHistory = [];

async function sendChat(userMsg) {
    if (!userMsg?.trim()) return;

    // Add user message
    const userDiv = document.createElement('div');
    userDiv.className = 'chat-msg user';
    userDiv.textContent = userMsg;
    chatMessages.appendChild(userDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const apiKey = await getApiKey();

    if (apiKey) {
        // AI-powered chat
        chatHistory.push({ role: 'user', content: userMsg });

        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-msg bot';
        typingDiv.innerHTML = '<span class="spinner" style="width:12px;height:12px;border-width:1.5px;"></span> Thinking...';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const res = await fetch(OPENAI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model: MODEL,
                    messages: [
                        { role: 'system', content: 'You are CodeMentor Bot, a friendly and encouraging coding assistant. Use emojis, be helpful, give code examples in markdown code blocks. Be concise.' },
                        ...chatHistory.slice(-16)
                    ],
                    temperature: 0.7,
                    max_tokens: 1000
                })
            });

            const data = await res.json();
            const reply = data.choices?.[0]?.message?.content || 'Sorry, I couldn\'t get a response.';
            chatHistory.push({ role: 'assistant', content: reply });

            typingDiv.textContent = reply;
        } catch (e) {
            typingDiv.textContent = '❌ Error: ' + e.message;
        }
    } else {
        // Simple built-in responses
        const botDiv = document.createElement('div');
        botDiv.className = 'chat-msg bot';

        const lower = userMsg.toLowerCase();
        let reply = '🤔 I can help better with an OpenAI API key! Go to Settings to add one. In the meantime, try the Analyze tab to check your code!';

        if (lower.includes('hello') || lower.includes('hi')) reply = '👋 Hey there! How can I help you with your code today?';
        else if (lower.includes('error')) reply = '🐛 Errors can be tricky! Paste your code in the Analyze tab and I\'ll check it. Common fixes: check syntax, variable names, and missing imports.';
        else if (lower.includes('help')) reply = '💡 I can help with:\n• Code analysis\n• Error debugging\n• Concept explanations\n\nTry the Analyze tab or add your API key for AI chat!';
        else if (lower.includes('python')) reply = '🐍 Python tips: use list comprehensions, f-strings, and type hints. Need something specific?';
        else if (lower.includes('javascript') || lower.includes('js')) reply = '⚡ JS tips: use const/let, arrow functions, and async/await. What do you need help with?';

        botDiv.textContent = reply;
        chatMessages.appendChild(botDiv);
    }

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

chatSend.addEventListener('click', () => {
    const msg = chatInput.value.trim();
    if (msg) {
        sendChat(msg);
        chatInput.value = '';
    }
});

chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const msg = chatInput.value.trim();
        if (msg) {
            sendChat(msg);
            chatInput.value = '';
        }
    }
});

// ═══════════════════════════════════════════════════════════════════════
//  SETTINGS
// ═══════════════════════════════════════════════════════════════════════

async function getApiKey() {
    return new Promise(resolve => {
        chrome.storage.local.get(['openai_key'], (result) => {
            resolve(result.openai_key || '');
        });
    });
}

saveKeyBtn.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    if (!key || key.startsWith('•')) {
        keyStatus.innerHTML = '<div class="status-msg error">Please enter a valid key.</div>';
        return;
    }

    saveKeyBtn.disabled = true;
    saveKeyBtn.innerHTML = '<span class="spinner"></span>';

    try {
        const res = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
            body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: 'Hi' }], max_tokens: 5 })
        });

        if (res.ok || res.status === 429) {
            chrome.storage.local.set({ openai_key: key });
            apiKeyInput.value = '••••••••••••••••••';
            keyStatus.innerHTML = '<div class="status-msg success">✅ API key saved and verified!</div>';
        } else {
            keyStatus.innerHTML = '<div class="status-msg error">❌ Invalid key. Check and try again.</div>';
        }
    } catch (e) {
        keyStatus.innerHTML = '<div class="status-msg error">❌ Network error.</div>';
    }

    saveKeyBtn.disabled = false;
    saveKeyBtn.innerHTML = 'Save Key';
});

// Open full website (adjust URL as needed)
openAppBtn?.addEventListener('click', () => chrome.tabs.create({ url: 'http://localhost:5173' }));
websiteLink?.addEventListener('click', (e) => { e.preventDefault(); chrome.tabs.create({ url: 'http://localhost:5173' }); });
