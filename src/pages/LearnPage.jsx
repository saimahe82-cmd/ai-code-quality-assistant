import { useState } from 'react';
import {
    BookOpen, Code2, Terminal, Lightbulb, Shield, Zap,
    ChevronDown, ChevronRight, ExternalLink, Star, Check
} from 'lucide-react';

const learningTopics = [
    {
        id: 'python-basics',
        category: 'Python',
        icon: '🐍',
        title: 'Python Best Practices',
        difficulty: 'Beginner',
        items: [
            {
                title: 'PEP 8 Style Guide',
                content: `PEP 8 is Python's official style guide. Key rules include:

• Use 4 spaces for indentation (never tabs!)
• Limit lines to 79 characters
• Use snake_case for functions and variables
• Use PascalCase for class names
• Use UPPER_CASE for constants
• Add docstrings to all public functions
• Put imports at the top of the file`,
                link: 'https://pep8.org/'
            },
            {
                title: 'Common Python Pitfalls',
                content: `Watch out for these common mistakes:

• Mutable default arguments: def func(items=[]) creates a shared list!
  Fix: Use None as default and create inside the function.

• Using == instead of is for None: Always use "x is None" not "x == None"

• Forgetting to close files: Use "with open()" context manager

• Modifying a list while iterating: Create a copy first`,
            },
            {
                title: 'Pythonic Patterns',
                content: `Write more Pythonic code:

• List comprehensions: [x*2 for x in items if x > 0]
• enumerate() instead of range(len()): for i, item in enumerate(items)
• f-strings for formatting: f"Hello, {name}!"
• zip() for parallel iteration: for a, b in zip(list1, list2)
• dict.get() with default: d.get("key", default_value)
• Ternary: result = "yes" if condition else "no"`,
            }
        ]
    },
    {
        id: 'debugging',
        category: 'Skills',
        icon: '🔧',
        title: 'Debugging Techniques',
        difficulty: 'All Levels',
        items: [
            {
                title: 'Systematic Debugging',
                content: `Follow this process when debugging:

1. Read the error message carefully — it tells you the type and location
2. Reproduce the bug consistently 
3. Isolate the problem — comment out code to narrow down
4. Add print/log statements at key points
5. Check your assumptions about variable values
6. Use a rubber duck — explain the code line by line
7. Take a break if stuck — fresh eyes help!`,
            },
            {
                title: 'Common Error Types',
                content: `Understanding error types:

• SyntaxError: Code structure is wrong (missing colon, unmatched brackets)
• NameError: Variable/function not defined (typo?)
• TypeError: Wrong type used (adding string to int)
• IndexError: List index out of range (off-by-one?)
• KeyError: Dictionary key doesn't exist
• AttributeError: Object doesn't have that attribute
• ValueError: Right type, wrong value (int("hello"))`,
            },
            {
                title: 'Using Print Debugging',
                content: `Strategic print debugging:

• Print variable values at key points
• Print the TYPE of variables when unexpected behavior occurs
• Use formatted prints: print(f"x = {x}, type = {type(x)}")
• Print before and after suspect operations
• Number your prints: print("DEBUG 1:", variable)
• Remember to remove prints when done!

Pro tip: Use logging module for more control.`,
            }
        ]
    },
    {
        id: 'data-structures',
        category: 'CS Fundamentals',
        icon: '📦',
        title: 'Data Structures',
        difficulty: 'Intermediate',
        items: [
            {
                title: 'Choosing the Right Structure',
                content: `Pick the right data structure:

• List/Array: Ordered, fast access by index O(1), slow search O(n)
• Set: Unique items, fast lookup O(1), no duplicates
• Dictionary/Map: Key-value pairs, fast lookup O(1)
• Stack: LIFO — push/pop O(1), undo operations
• Queue: FIFO — enqueue/dequeue O(1), task scheduling
• Linked List: Fast insert/delete O(1), slow random access

Rule of thumb: If you need fast lookups by a key → use a dict/set`,
            },
            {
                title: 'Time Complexity Guide',
                content: `Common operation complexities:

• O(1): Dictionary lookup, array access by index
• O(log n): Binary search, balanced tree operations
• O(n): Linear search, list traversal
• O(n log n): Efficient sorting (merge sort, quick sort)
• O(n²): Nested loops, bubble sort
• O(2^n): Recursive Fibonacci (without memoization)

Always aim for the lowest complexity possible!`,
            }
        ]
    },
    {
        id: 'clean-code',
        category: 'Skills',
        icon: '✨',
        title: 'Writing Clean Code',
        difficulty: 'All Levels',
        items: [
            {
                title: 'Naming Conventions',
                content: `Good naming makes code self-documenting:

✅ Good: calculate_total_price, user_count, is_valid
❌ Bad: x, temp, data, stuff, doIt

Tips:
• Use descriptive nouns for variables: student_name, max_score
• Use verbs for functions: calculate_total, validate_input
• Use is_/has_/can_ prefixes for booleans: is_active, has_permission
• Avoid abbreviations unless universally understood
• Name constants clearly: MAX_RETRY_COUNT, API_BASE_URL`,
            },
            {
                title: 'Function Design',
                content: `Write better functions:

• Keep functions short — ideally under 20 lines
• Each function should do ONE thing
• Use descriptive names (no abbreviations)
• Limit parameters to 3-4 max
• Return early for error cases
• Add docstrings explaining purpose, params, returns
• Avoid side effects when possible
• Use type hints: def greet(name: str) -> str:`,
            },
            {
                title: 'Code Organization',
                content: `Organize your code well:

• Group related code together
• Put imports at the top (stdlib → third-party → local)
• Use blank lines to separate logical sections
• Keep files focused — one class per file (usually)
• Follow the DRY principle (Don't Repeat Yourself)
• Use constants instead of magic numbers
• Write comments for WHY, not WHAT
• Keep nesting shallow — use early returns`,
            }
        ]
    },
    {
        id: 'error-handling',
        category: 'Skills',
        icon: '🛡️',
        title: 'Error Handling',
        difficulty: 'Intermediate',
        items: [
            {
                title: 'Try/Except Best Practices',
                content: `Handle errors properly:

• Catch specific exceptions, never bare except:
  ✅ except ValueError as e:
  ❌ except:

• Don't silently swallow errors — at least log them
• Use finally for cleanup (closing files, connections)
• Raise exceptions for invalid input
• Create custom exception classes for your application
• Don't use exceptions for flow control

Python pattern:
try:
    result = risky_operation()
except SpecificError as e:
    logger.error(f"Operation failed: {e}")
    raise`,
            },
            {
                title: 'Defensive Programming',
                content: `Code defensively:

• Validate inputs at function boundaries
• Check for None/null before using values
• Use assertions for development-time checks
• Handle edge cases: empty lists, zero values, None
• Set reasonable defaults for optional parameters
• Use guard clauses (early returns) for invalid cases

Example:
def divide(a, b):
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b`,
            }
        ]
    }
];

export default function LearnPage() {
    const [expandedTopic, setExpandedTopic] = useState('python-basics');
    const [expandedItem, setExpandedItem] = useState(null);
    const [completedItems, setCompletedItems] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('codementor_completed') || '[]');
        } catch {
            return [];
        }
    });

    const toggleComplete = (topicId, itemIdx) => {
        const key = `${topicId}-${itemIdx}`;
        let updated;
        if (completedItems.includes(key)) {
            updated = completedItems.filter(k => k !== key);
        } else {
            updated = [...completedItems, key];
        }
        setCompletedItems(updated);
        localStorage.setItem('codementor_completed', JSON.stringify(updated));
    };

    const totalItems = learningTopics.reduce((sum, t) => sum + t.items.length, 0);
    const completedCount = completedItems.length;
    const progress = Math.round((completedCount / totalItems) * 100);

    return (
        <div className="page-container">
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <BookOpen size={24} style={{ color: 'var(--accent-success)' }} />
                    Learning Hub
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Curated learning resources to help you write better code.
                </p>
            </div>

            {/* Progress Bar */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>
                        <Star size={14} style={{ color: 'var(--accent-warning)', marginRight: '6px' }} />
                        Learning Progress
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {completedCount}/{totalItems} topics completed
                    </div>
                </div>
                <div style={{
                    height: '8px',
                    background: 'var(--bg-primary)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        height: '100%',
                        width: `${progress}%`,
                        background: 'var(--gradient-primary)',
                        borderRadius: '4px',
                        transition: 'width 0.5s ease-out'
                    }} />
                </div>
            </div>

            {/* Topics */}
            {learningTopics.map(topic => (
                <div key={topic.id} className="card" style={{ marginBottom: '12px' }}>
                    {/* Topic Header */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            cursor: 'pointer',
                            padding: '4px 0'
                        }}
                        onClick={() => setExpandedTopic(expandedTopic === topic.id ? null : topic.id)}
                    >
                        <span style={{ fontSize: '24px' }}>{topic.icon}</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '15px', fontWeight: 700 }}>{topic.title}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                                <span>{topic.category}</span>
                                <span>•</span>
                                <span>{topic.difficulty}</span>
                                <span>•</span>
                                <span>{topic.items.length} topics</span>
                            </div>
                        </div>
                        {expandedTopic === topic.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>

                    {/* Topic Items */}
                    {expandedTopic === topic.id && (
                        <div style={{ marginTop: '16px' }}>
                            {topic.items.map((item, idx) => {
                                const itemKey = `${topic.id}-${idx}`;
                                const isCompleted = completedItems.includes(itemKey);
                                const isExpanded = expandedItem === itemKey;

                                return (
                                    <div key={idx} style={{
                                        padding: '12px',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: 'var(--border-radius-sm)',
                                        marginBottom: '8px',
                                        border: `1px solid ${isCompleted ? 'rgba(0, 184, 148, 0.3)' : 'var(--border-color-light)'}`,
                                    }}>
                                        <div
                                            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                                            onClick={() => setExpandedItem(isExpanded ? null : itemKey)}
                                        >
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleComplete(topic.id, idx);
                                                }}
                                                style={{
                                                    width: '22px',
                                                    height: '22px',
                                                    borderRadius: '50%',
                                                    border: isCompleted ? 'none' : '2px solid var(--border-color)',
                                                    background: isCompleted ? 'var(--accent-success)' : 'transparent',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    flexShrink: 0,
                                                    transition: 'all 0.2s',
                                                    color: 'white'
                                                }}
                                            >
                                                {isCompleted && <Check size={12} />}
                                            </button>
                                            <div style={{
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                flex: 1,
                                                textDecoration: isCompleted ? 'line-through' : 'none',
                                                opacity: isCompleted ? 0.7 : 1
                                            }}>
                                                {item.title}
                                            </div>
                                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        </div>

                                        {isExpanded && (
                                            <div style={{
                                                marginTop: '12px',
                                                paddingTop: '12px',
                                                borderTop: '1px solid var(--border-color-light)',
                                                fontSize: '13px',
                                                color: 'var(--text-secondary)',
                                                lineHeight: 1.7,
                                                whiteSpace: 'pre-wrap',
                                                fontFamily: 'var(--font-body)'
                                            }}>
                                                {item.content}
                                                {item.link && (
                                                    <div style={{ marginTop: '12px' }}>
                                                        <a
                                                            href={item.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                fontSize: '12px',
                                                                fontWeight: 600,
                                                                padding: '4px 12px',
                                                                background: 'rgba(108, 92, 231, 0.1)',
                                                                borderRadius: 'var(--border-radius-full)'
                                                            }}
                                                        >
                                                            Read more <ExternalLink size={10} />
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
