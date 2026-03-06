/* ═══════════════════════════════════════════════════════════════════════
   OpenAI Integration Service
   Handles all communication with the OpenAI API
   ═══════════════════════════════════════════════════════════════════════ */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-3.5-turbo'; // cost-effective, fast

// ─── API Key Management ───
const DEFAULT_API_KEY = '';

export function getApiKey() {
    try {
        return localStorage.getItem('codewhiz_openai_key') || DEFAULT_API_KEY;
    } catch {
        return DEFAULT_API_KEY;
    }
}

export function setApiKey(key) {
    try {
        if (key) {
            localStorage.setItem('codewhiz_openai_key', key.trim());
        } else {
            localStorage.removeItem('codewhiz_openai_key');
        }
    } catch (e) {
        console.error('Failed to save API key:', e);
    }
}

export function hasApiKey() {
    return getApiKey().length > 10;
}

// ─── Core API Call ───
async function callOpenAI(messages, options = {}) {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('No OpenAI API key configured');
    }

    const {
        temperature = 0.7,
        maxTokens = 1024,
        model = MODEL
    } = options;

    const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens: maxTokens
        })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        if (response.status === 401) {
            throw new Error('Invalid API key. Please check your OpenAI API key in Settings.');
        }
        if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        if (response.status === 402 || (err.error?.code === 'insufficient_quota')) {
            throw new Error('OpenAI quota exceeded. Please check your billing at platform.openai.com.');
        }
        throw new Error(err.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

// ═══════════════════════════════════════════════════════════════════════
//  CHATBOT — AI-Powered Conversations
// ═══════════════════════════════════════════════════════════════════════

const CHAT_SYSTEM_PROMPT = `You are CodeMentor Bot — a friendly, encouraging, and expert AI coding assistant embedded in a code quality analysis tool called "Codewhiz".

Your personality:
- Be warm, supportive, and encouraging — like a patient mentor
- Use emojis naturally (but not excessively) to be friendly 😊
- Give clear, practical explanations with code examples
- When explaining concepts, use analogies and real-world comparisons
- Celebrate small wins and encourage learners
- Be concise but thorough — break complex topics into steps

Your capabilities:
- Explain error messages and how to fix them
- Teach programming concepts (variables, loops, functions, OOP, etc.)
- Debug code issues
- Suggest performance optimizations
- Share best practices and coding tips
- Explain algorithms and data structures
- Help with Python, JavaScript, Java, and C/C++

Rules:
- When the user shares code, analyze it and give specific feedback
- Always provide code examples when relevant (use markdown code blocks)
- If code has bugs, explain WHAT is wrong, WHY it's wrong, and HOW to fix it
- For beginners, explain concepts simply. For experts, go deeper.
- If you don't know something, say so honestly
- Never generate harmful, unethical, or malicious code`;

/**
 * Get an AI-powered chat response using OpenAI.
 * @param {Array} conversationHistory - Array of { role: 'user'|'assistant', content: string }
 * @param {string} codeContext - Current code in the editor
 * @param {string} language - Current programming language
 * @returns {Promise<string>} AI response text
 */
export async function getAIChatResponse(conversationHistory, codeContext = '', language = '') {
    const messages = [
        { role: 'system', content: CHAT_SYSTEM_PROMPT }
    ];

    // Add code context if available
    if (codeContext && codeContext.trim().length > 10) {
        messages.push({
            role: 'system',
            content: `The user currently has the following ${language || 'code'} in their editor:\n\`\`\`${language}\n${codeContext.slice(0, 3000)}\n\`\`\`\nRefer to this code when the user asks about "my code", "this code", etc.`
        });
    }

    // Add conversation history (last 20 messages to stay within context limits)
    const recentHistory = conversationHistory.slice(-20);
    messages.push(...recentHistory);

    return callOpenAI(messages, {
        temperature: 0.7,
        maxTokens: 1500
    });
}

// ═══════════════════════════════════════════════════════════════════════
//  CODE ANALYSIS — AI-Powered Deep Review
// ═══════════════════════════════════════════════════════════════════════

const ANALYSIS_SYSTEM_PROMPT = `You are an expert code reviewer. Analyze the given code and return a JSON response with the following structure:

{
  "summary": "Brief 1-2 sentence summary of the code quality",
  "codeStatus": "correct" | "has_errors" | "has_warnings",
  "score": {
    "overall": 0-100,
    "correctness": 0-100,
    "performance": 0-100,
    "readability": 0-100,
    "bestPractices": 0-100
  },
  "issues": [
    {
      "severity": "error" | "warning" | "info" | "suggestion",
      "category": "syntax" | "logic" | "performance" | "readability" | "bestpractice" | "security",
      "title": "Short title of the issue",
      "description": "Detailed explanation of the issue",
      "line": line_number_or_0,
      "suggestion": "How to fix it with code example",
      "whyMatters": "Why this issue is important (for beginners)"
    }
  ],
  "refactoringSuggestions": [
    {
      "title": "What to refactor",
      "description": "Why and how to refactor",
      "before": "code before refactoring",
      "after": "code after refactoring",
      "impact": "high" | "medium" | "low"
    }
  ],
  "bugRisks": [
    {
      "title": "Potential bug",
      "description": "What could go wrong",
      "probability": "high" | "medium" | "low",
      "suggestion": "How to prevent it"
    }
  ]
}

Be thorough but fair. Identify real issues, not trivial nitpicks. For correct code, still suggest best practices.
IMPORTANT: Return ONLY valid JSON, no markdown wrapping.`;

/**
 * Get an AI-powered code analysis using OpenAI.
 * @param {string} code - Source code to analyze
 * @param {string} language - Programming language
 * @param {string} mode - 'beginner' or 'expert'
 * @returns {Promise<Object>} Parsed analysis result
 */
export async function getAICodeAnalysis(code, language, mode = 'beginner') {
    const messages = [
        { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
        {
            role: 'user',
            content: `Analyze this ${language} code (user is a ${mode}-level developer):\n\n\`\`\`${language}\n${code.slice(0, 6000)}\n\`\`\``
        }
    ];

    const response = await callOpenAI(messages, {
        temperature: 0.3, // Lower temperature for consistent analysis
        maxTokens: 2000
    });

    // Parse the JSON response
    try {
        // Remove markdown code fences if present
        const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error('Failed to parse AI analysis:', e);
        throw new Error('Failed to parse AI analysis response. Please try again.');
    }
}

// ═══════════════════════════════════════════════════════════════════════
//  VALIDATE API KEY
// ═══════════════════════════════════════════════════════════════════════

/**
 * Test if an API key is valid by making a minimal request.
 * @param {string} key - OpenAI API key to test
 * @returns {Promise<{ valid: boolean, message: string }>}
 */
export async function validateApiKey(key) {
    try {
        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: 'user', content: 'Hi' }],
                max_tokens: 5
            })
        });

        if (response.ok) {
            return { valid: true, message: 'API key is valid! ✅' };
        }

        if (response.status === 401) {
            return { valid: false, message: 'Invalid API key. Please check and try again.' };
        }

        if (response.status === 429) {
            // Rate limited but key is valid
            return { valid: true, message: 'API key is valid! (Rate limited — wait a moment)' };
        }

        const err = await response.json().catch(() => ({}));
        return { valid: false, message: err.error?.message || `Error: ${response.status}` };
    } catch (e) {
        return { valid: false, message: 'Network error. Check your internet connection.' };
    }
}
