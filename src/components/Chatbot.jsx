import { useState, useRef, useEffect, useCallback } from 'react';
import {
    MessageSquare, X, Send, Sparkles, Bot, User,
    Trash2, Minimize2, Maximize2, Copy, Check,
    Key, Settings, Zap
} from 'lucide-react';
import { getChatResponse, getQuickSuggestions } from '../utils/chatEngine';
import { getAIChatResponse, hasApiKey, getApiKey, setApiKey, validateApiKey } from '../utils/openaiService';
import { useApp } from '../context/AppContext';

// ─── Mood Indicators ───
const MOOD_STATES = {
    happy: { emoji: '😊', label: 'Happy to help!' },
    thinking: { emoji: '🤔', label: 'Thinking...' },
    excited: { emoji: '🚀', label: 'Let\'s go!' },
    listening: { emoji: '👂', label: 'Listening...' },
    idle: { emoji: '💤', label: 'Waiting...' },
    ai: { emoji: '🧠', label: 'AI-powered' },
};

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [mood, setMood] = useState('idle');
    const [isMinimized, setIsMinimized] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [copiedIdx, setCopiedIdx] = useState(null);
    const [showEmojiReaction, setShowEmojiReaction] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [apiKeyStatus, setApiKeyStatus] = useState(''); // 'validating'|'valid'|'invalid'|''
    const [apiKeyMsg, setApiKeyMsg] = useState('');
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const { code, language, currentUser, refreshApiKeyStatus } = useApp();
    const typingTimeoutRef = useRef(null);

    // Conversation history for OpenAI (role: user/assistant)
    const [conversationHistory, setConversationHistory] = useState([]);

    const useAI = hasApiKey();
    const userName = currentUser?.fullName?.split(' ')[0] || 'friend';

    // ─── Initial greeting ───
    useEffect(() => {
        if (messages.length === 0) {
            const greeting = getTimeBasedGreeting();
            setMessages([{
                type: 'bot',
                text: greeting,
                timestamp: new Date(),
                reactions: [],
            }]);
        }
    }, []);

    function getTimeBasedGreeting() {
        const hour = new Date().getHours();
        let timeGreeting;
        if (hour < 12) timeGreeting = 'Good morning';
        else if (hour < 17) timeGreeting = 'Good afternoon';
        else if (hour < 21) timeGreeting = 'Good evening';
        else timeGreeting = 'Hey night owl 🦉';

        const aiTag = hasApiKey()
            ? '\n\n🧠 **AI Mode Active** — I\'m powered by OpenAI for smarter, context-aware responses!'
            : '\n\n💡 **Tip:** Add your OpenAI API key in ⚙️ Settings for AI-powered responses!';

        return `${timeGreeting}, **${userName}**! 👋\n\nI'm **CodeMentor Bot** — your friendly AI coding assistant! ✨\n\nI can help you with:\n💡 Understanding error messages\n🐛 Debugging tips & tricks\n📚 Programming concepts explained simply\n⚡ Performance optimization\n🎨 Code style & best practices${aiTag}`;
    }

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setUnreadCount(0);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isTyping) setMood(useAI ? 'ai' : 'thinking');
        else if (input.length > 0) setMood('listening');
        else if (messages.length > 1) setMood(useAI ? 'ai' : 'happy');
        else setMood('idle');
    }, [isTyping, input, messages.length, useAI]);

    // ─── Send Message (AI or Template) ───
    const handleSend = useCallback(async () => {
        if (!input.trim() || isTyping) return;

        const userMsg = input.trim();
        setInput('');

        const userMessage = {
            type: 'user',
            text: userMsg,
            timestamp: new Date(),
            reactions: [],
        };
        setMessages(prev => [...prev, userMessage]);
        setIsTyping(true);

        if (useAI) {
            // ─── OpenAI-powered response ───
            const newHistory = [...conversationHistory, { role: 'user', content: userMsg }];

            try {
                const aiResponse = await getAIChatResponse(newHistory, code, language);
                const botMessage = {
                    type: 'bot',
                    text: aiResponse,
                    timestamp: new Date(),
                    reactions: [],
                    isAI: true,
                };
                setMessages(prev => [...prev, botMessage]);
                setConversationHistory([...newHistory, { role: 'assistant', content: aiResponse }]);
            } catch (err) {
                const errorMsg = {
                    type: 'bot',
                    text: `⚠️ **AI Error:** ${err.message}\n\nFalling back to built-in responses...\n\n${getChatResponse(userMsg, code)}`,
                    timestamp: new Date(),
                    reactions: [],
                    isAI: false,
                };
                setMessages(prev => [...prev, errorMsg]);
            }
        } else {
            // ─── Template-based response ───
            const thinkingTime = 500 + Math.random() * 800;
            await new Promise(resolve => setTimeout(resolve, thinkingTime));

            const response = getChatResponse(userMsg, code);
            setMessages(prev => [...prev, {
                type: 'bot',
                text: response,
                timestamp: new Date(),
                reactions: [],
                isAI: false,
            }]);
        }

        setIsTyping(false);

        if (isMinimized || !isOpen) {
            setUnreadCount(prev => prev + 1);
        }
    }, [input, code, language, isTyping, isMinimized, isOpen, useAI, conversationHistory]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleQuickSuggestion = async (suggestion) => {
        const cleanSuggestion = suggestion.replace(/^[^\w•]+ /, '');

        setMessages(prev => [...prev, {
            type: 'user',
            text: cleanSuggestion,
            timestamp: new Date(),
            reactions: [],
        }]);
        setIsTyping(true);

        if (useAI) {
            const newHistory = [...conversationHistory, { role: 'user', content: cleanSuggestion }];
            try {
                const aiResponse = await getAIChatResponse(newHistory, code, language);
                setMessages(prev => [...prev, {
                    type: 'bot', text: aiResponse, timestamp: new Date(),
                    reactions: [], isAI: true,
                }]);
                setConversationHistory([...newHistory, { role: 'assistant', content: aiResponse }]);
            } catch (err) {
                const response = getChatResponse(cleanSuggestion, code);
                setMessages(prev => [...prev, {
                    type: 'bot', text: response, timestamp: new Date(),
                    reactions: [], isAI: false,
                }]);
            }
        } else {
            await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 600));
            const response = getChatResponse(cleanSuggestion, code);
            setMessages(prev => [...prev, {
                type: 'bot', text: response, timestamp: new Date(),
                reactions: [], isAI: false,
            }]);
        }

        setIsTyping(false);
    };

    const handleClearChat = () => {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        setIsTyping(false);
        setConversationHistory([]);
        setMessages([{
            type: 'bot',
            text: `Chat cleared! ✨ I'm ready for new questions, ${userName}! What would you like to learn? 🚀`,
            timestamp: new Date(),
            reactions: [],
        }]);
    };

    const handleCopyMessage = (text, idx) => {
        const clean = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/`{3}[\s\S]*?`{3}/g, (m) => {
            return m.replace(/```\w*\n?/g, '').replace(/```/g, '');
        });
        navigator.clipboard.writeText(clean);
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2000);
    };

    const handleReaction = (msgIdx, emoji) => {
        setShowEmojiReaction({ idx: msgIdx, emoji });
        setMessages(prev => prev.map((msg, i) => {
            if (i === msgIdx) {
                const reactions = msg.reactions || [];
                const existing = reactions.find(r => r === emoji);
                return {
                    ...msg,
                    reactions: existing
                        ? reactions.filter(r => r !== emoji)
                        : [...reactions, emoji]
                };
            }
            return msg;
        }));
        setTimeout(() => setShowEmojiReaction(null), 600);
    };

    // ─── API Key Settings ───
    const handleSaveApiKey = async () => {
        if (!apiKeyInput.trim()) {
            setApiKey('');
            setApiKeyStatus('');
            setApiKeyMsg('API key removed.');
            refreshApiKeyStatus();
            return;
        }

        setApiKeyStatus('validating');
        setApiKeyMsg('Validating API key...');

        const result = await validateApiKey(apiKeyInput.trim());
        if (result.valid) {
            setApiKey(apiKeyInput.trim());
            setApiKeyStatus('valid');
            setApiKeyMsg(result.message);
            refreshApiKeyStatus();

            // Re-initialize greeting with AI badge
            setTimeout(() => {
                setMessages(prev => [{
                    type: 'bot',
                    text: `🧠 **AI Mode Activated!** 🎉\n\nI'm now powered by OpenAI and can give you:\n• Much more accurate code analysis\n• Context-aware debugging help\n• In-depth explanations with examples\n• Natural conversation about anything code-related\n\nTry asking me something, ${userName}! 🚀`,
                    timestamp: new Date(),
                    reactions: [],
                    isAI: true,
                }, ...prev.slice(1)]);
            }, 500);
        } else {
            setApiKeyStatus('invalid');
            setApiKeyMsg(result.message);
        }
    };

    const handleRemoveApiKey = () => {
        setApiKey('');
        setApiKeyInput('');
        setApiKeyStatus('');
        setApiKeyMsg('API key removed. Using built-in responses.');
        refreshApiKeyStatus();
    };

    const suggestions = getQuickSuggestions(code);

    // ─── Format message text ───
    const formatText = (text) => {
        const blocks = text.split(/(```[\s\S]*?```)/g);
        return blocks.map((block, blockIdx) => {
            if (block.startsWith('```') && block.endsWith('```')) {
                const lines = block.split('\n');
                const langMatch = lines[0].match(/```(\w+)/);
                const lang = langMatch ? langMatch[1] : '';
                const codeContent = lines.slice(1, -1).join('\n');
                return (
                    <div key={blockIdx} className="chat-code-block">
                        <div className="chat-code-header">
                            <span>{lang || 'code'}</span>
                            <button
                                className="chat-code-copy"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(codeContent);
                                }}
                                title="Copy code"
                            >
                                <Copy size={10} /> Copy
                            </button>
                        </div>
                        <pre className="chat-code-content">{codeContent}</pre>
                    </div>
                );
            }
            const parts = block.split(/(\*\*.*?\*\*|`[^`]+`|\n)/g);
            return (
                <span key={blockIdx}>
                    {parts.map((part, i) => {
                        if (part === '\n') return <br key={i} />;
                        if (part.startsWith('**') && part.endsWith('**'))
                            return <strong key={i}>{part.slice(2, -2)}</strong>;
                        if (part.startsWith('`') && part.endsWith('`'))
                            return <code key={i} className="chat-inline-code">{part.slice(1, -1)}</code>;
                        return part;
                    })}
                </span>
            );
        });
    };

    const formatTime = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const currentMood = MOOD_STATES[mood] || MOOD_STATES.idle;

    return (
        <>
            {/* ═══ Floating Trigger Button ═══ */}
            <button
                className={`chatbot-trigger ${isOpen ? 'open' : ''} ${unreadCount > 0 ? 'has-unread' : ''}`}
                onClick={() => {
                    setIsOpen(!isOpen);
                    setIsMinimized(false);
                    if (!isOpen) setUnreadCount(0);
                }}
                id="chatbot-trigger"
                aria-label="Toggle AI Chatbot"
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
                {unreadCount > 0 && !isOpen && (
                    <span className="chatbot-unread-badge">{unreadCount}</span>
                )}
                {unreadCount > 0 && !isOpen && (
                    <span className="chatbot-trigger-pulse" />
                )}
            </button>

            {/* ═══ Chat Panel ═══ */}
            {isOpen && (
                <div className={`chatbot-panel ${isMinimized ? 'minimized' : ''}`} id="chatbot-panel">
                    {/* Header */}
                    <div className="chatbot-header">
                        <div className="chatbot-header-left">
                            <div className="chatbot-avatar">
                                <Bot size={18} />
                                <span className={`chatbot-status-dot ${useAI ? 'ai' : ''}`} />
                            </div>
                            <div>
                                <div className="chatbot-header-title">
                                    CodeMentor Bot
                                    {useAI ? (
                                        <span className="chatbot-ai-badge">
                                            <Zap size={9} /> AI
                                        </span>
                                    ) : (
                                        <Sparkles size={12} style={{ opacity: 0.8 }} />
                                    )}
                                </div>
                                <div className="chatbot-mood">
                                    {currentMood.emoji} {currentMood.label}
                                </div>
                            </div>
                        </div>
                        <div className="chatbot-header-actions">
                            <button
                                className={`chatbot-header-btn ${showSettings ? 'active-setting' : ''}`}
                                onClick={() => setShowSettings(!showSettings)}
                                title="API Settings"
                            >
                                <Key size={14} />
                            </button>
                            <button
                                className="chatbot-header-btn"
                                onClick={handleClearChat}
                                title="Clear chat"
                            >
                                <Trash2 size={14} />
                            </button>
                            <button
                                className="chatbot-header-btn"
                                onClick={() => setIsMinimized(!isMinimized)}
                                title={isMinimized ? 'Expand' : 'Minimize'}
                            >
                                {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                            </button>
                            <button
                                className="chatbot-header-btn"
                                onClick={() => setIsOpen(false)}
                                title="Close"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {/* ═══ API Key Settings Panel ═══ */}
                    {showSettings && !isMinimized && (
                        <div className="chatbot-settings-panel">
                            <div className="chatbot-settings-title">
                                <Key size={14} />
                                OpenAI API Key
                            </div>
                            <p className="chatbot-settings-desc">
                                Add your OpenAI API key to enable AI-powered responses and smarter code analysis.
                                Get a key at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">platform.openai.com</a>
                            </p>
                            <div className="chatbot-settings-input-row">
                                <input
                                    type="password"
                                    className="chatbot-settings-input"
                                    value={apiKeyInput}
                                    onChange={(e) => setApiKeyInput(e.target.value)}
                                    placeholder="sk-..."
                                    id="api-key-input"
                                />
                                <button
                                    className="chatbot-settings-save-btn"
                                    onClick={handleSaveApiKey}
                                    disabled={apiKeyStatus === 'validating'}
                                >
                                    {apiKeyStatus === 'validating' ? '...' : 'Save'}
                                </button>
                            </div>
                            {apiKeyMsg && (
                                <div className={`chatbot-settings-status ${apiKeyStatus}`}>
                                    {apiKeyStatus === 'valid' ? '✅' : apiKeyStatus === 'invalid' ? '❌' : 'ℹ️'} {apiKeyMsg}
                                </div>
                            )}
                            {hasApiKey() && (
                                <button className="chatbot-settings-remove" onClick={handleRemoveApiKey}>
                                    Remove API Key
                                </button>
                            )}
                            <div className="chatbot-settings-note">
                                🔒 Your key is stored locally in your browser and never sent to our servers.
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    {!isMinimized && (
                        <>
                            <div className="chatbot-messages" id="chatbot-messages">
                                {messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`chat-message ${msg.type} ${showEmojiReaction?.idx === idx ? 'reacting' : ''}`}
                                    >
                                        <div className="chat-message-header">
                                            <div className="chat-message-author">
                                                {msg.type === 'bot' ? (
                                                    <span className="chat-author-icon bot"><Bot size={10} /></span>
                                                ) : (
                                                    <span className="chat-author-icon user"><User size={10} /></span>
                                                )}
                                                <span>{msg.type === 'bot' ? 'CodeMentor' : userName}</span>
                                                {msg.isAI && msg.type === 'bot' && (
                                                    <span className="chat-ai-tag">
                                                        <Zap size={8} /> AI
                                                    </span>
                                                )}
                                            </div>
                                            <span className="chat-message-time">{formatTime(msg.timestamp)}</span>
                                        </div>

                                        <div className="chat-message-body">
                                            {formatText(msg.text)}
                                        </div>

                                        <div className="chat-message-actions">
                                            <button
                                                className="chat-action-btn"
                                                onClick={() => handleCopyMessage(msg.text, idx)}
                                                title="Copy message"
                                            >
                                                {copiedIdx === idx ? <Check size={11} /> : <Copy size={11} />}
                                            </button>
                                            {msg.type === 'bot' && (
                                                <>
                                                    <button
                                                        className={`chat-action-btn ${msg.reactions?.includes('👍') ? 'active' : ''}`}
                                                        onClick={() => handleReaction(idx, '👍')}
                                                    >👍</button>
                                                    <button
                                                        className={`chat-action-btn ${msg.reactions?.includes('❤️') ? 'active' : ''}`}
                                                        onClick={() => handleReaction(idx, '❤️')}
                                                    >❤️</button>
                                                    <button
                                                        className={`chat-action-btn ${msg.reactions?.includes('💡') ? 'active' : ''}`}
                                                        onClick={() => handleReaction(idx, '💡')}
                                                    >💡</button>
                                                </>
                                            )}
                                        </div>

                                        {msg.reactions?.length > 0 && (
                                            <div className="chat-message-reactions">
                                                {msg.reactions.map((r, ri) => (
                                                    <span key={ri} className="chat-reaction-badge">{r}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Typing */}
                                {isTyping && (
                                    <div className="chat-message bot typing">
                                        <div className="chat-typing-indicator">
                                            <div className="chat-typing-dot" />
                                            <div className="chat-typing-dot" />
                                            <div className="chat-typing-dot" />
                                        </div>
                                        <span className="chat-typing-text">
                                            {useAI ? 'AI is generating a response...' : 'CodeMentor is thinking...'}
                                        </span>
                                    </div>
                                )}

                                {/* Quick Suggestions */}
                                {messages.length <= 1 && !isTyping && (
                                    <div className="chat-suggestions">
                                        <div className="chat-suggestions-label">Try asking:</div>
                                        {suggestions.map((s, i) => (
                                            <button
                                                key={i}
                                                className="chat-suggestion-chip"
                                                onClick={() => handleQuickSuggestion(s)}
                                                style={{ animationDelay: `${i * 0.08}s` }}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="chatbot-input-area">
                                <div className="chatbot-input-row">
                                    <input
                                        ref={inputRef}
                                        className="chatbot-input"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={isTyping ? (useAI ? 'AI is responding...' : 'Bot is typing...') : `Ask me anything, ${userName}...`}
                                        id="chatbot-input"
                                        disabled={isTyping}
                                    />
                                    <button
                                        className={`chatbot-send-btn ${input.trim() ? 'active' : ''}`}
                                        onClick={handleSend}
                                        disabled={!input.trim() || isTyping}
                                        id="chatbot-send"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                                <div className="chatbot-input-hint">
                                    {useAI ? '🧠 AI-powered · ' : ''}Press Enter to send
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
