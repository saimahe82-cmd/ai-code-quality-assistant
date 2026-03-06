/* ═══════════════════════════════════════════════════════════════════════
   Codewhiz — In-App User Database
   Stores user sign-up data in memory + localStorage for persistence
   ═══════════════════════════════════════════════════════════════════════ */

// ─── In-memory user store ───
let users = [];

// ─── Load from localStorage on init ───
function loadFromStorage() {
    try {
        const stored = localStorage.getItem('codementor_users');
        if (stored) {
            users = JSON.parse(stored);
        }
    } catch (e) {
        console.error('Failed to load users from storage:', e);
        users = [];
    }
}

// ─── Save to localStorage ───
function saveToStorage() {
    try {
        localStorage.setItem('codementor_users', JSON.stringify(users));
    } catch (e) {
        console.error('Failed to save users to storage:', e);
    }
}

// ─── Initialize on module load ───
loadFromStorage();

/* ─── Database API ─── */

/**
 * Register a new user.
 * @param {Object} userData - { fullName, email, password, role, experience }
 * @returns {{ success: boolean, message: string, user?: Object }}
 */
export function registerUser(userData) {
    const { fullName, email, password, role, experience } = userData;

    // Validation
    if (!fullName || !email || !password) {
        return { success: false, message: 'Full name, email, and password are required.' };
    }

    if (password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters.' };
    }

    // Check for duplicate email
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
        return { success: false, message: 'An account with this email already exists.' };
    }

    // Create user record
    const newUser = {
        id: crypto.randomUUID ? crypto.randomUUID() : `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password, // In production, this would be hashed!
        role: role || 'student',
        experience: experience || 'beginner',
        createdAt: new Date().toISOString(),
        lastLogin: null,
        analysisCount: 0,
        profileAvatar: fullName.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
    };

    users.push(newUser);
    saveToStorage();

    // Return user without password
    const { password: _, ...safeUser } = newUser;
    return { success: true, message: 'Account created successfully!', user: safeUser };
}

/**
 * Authenticate a user.
 * @param {string} email
 * @param {string} password
 * @returns {{ success: boolean, message: string, user?: Object }}
 */
export function loginUser(email, password) {
    if (!email || !password) {
        return { success: false, message: 'Email and password are required.' };
    }

    const user = users.find(u => u.email === email.toLowerCase());
    if (!user) {
        return { success: false, message: 'No account found with this email.' };
    }

    if (user.password !== password) {
        return { success: false, message: 'Incorrect password.' };
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    saveToStorage();

    // Store successful login email if needed for "Remember me"
    // (Actual logic will be in the component, but we provide the tool)

    const { password: _, ...safeUser } = user;
    return { success: true, message: 'Login successful!', user: safeUser };
}

/**
 * Get a user by their ID.
 * @param {string} id
 * @returns {Object|null}
 */
export function getUserById(id) {
    const user = users.find(u => u.id === id);
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
}

/**
 * Get all registered users (without passwords).
 * @returns {Array<Object>}
 */
export function getAllUsers() {
    return users.map(({ password, ...rest }) => rest);
}

/**
 * Get a user by email (without password).
 * @param {string} email
 * @returns {Object|null}
 */
export function getUserByEmail(email) {
    const user = users.find(u => u.email === email.toLowerCase());
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
}

/**
 * Get total number of registered users.
 * @returns {number}
 */
export function getUserCount() {
    return users.length;
}

/**
 * Delete a user by email.
 * @param {string} email
 * @returns {{ success: boolean, message: string }}
 */
export function deleteUser(email) {
    const index = users.findIndex(u => u.email === email.toLowerCase());
    if (index === -1) {
        return { success: false, message: 'User not found.' };
    }
    users.splice(index, 1);
    saveToStorage();
    return { success: true, message: 'User deleted successfully.' };
}

/**
 * Update user profile data.
 * @param {string} email
 * @param {Object} updates - fields to update
 * @returns {{ success: boolean, message: string, user?: Object }}
 */
export function updateUser(email, updates) {
    const user = users.find(u => u.email === email.toLowerCase());
    if (!user) {
        return { success: false, message: 'User not found.' };
    }

    // Don't allow updating email or id
    const { email: _, id: __, password: ___, ...safeUpdates } = updates;
    Object.assign(user, safeUpdates);
    saveToStorage();

    const { password: ____, ...safeUser } = user;
    return { success: true, message: 'Profile updated.', user: safeUser };
}


/* ═══════════════════════════════════════════════════════════════════════
   Per-User Code History Database
   Each user has their own isolated history stored under a unique key
   ═══════════════════════════════════════════════════════════════════════ */

const MAX_HISTORY_ENTRIES = 100;

/**
 * Get the localStorage key for a user's code history.
 * @param {string} userId
 * @returns {string}
 */
function getUserHistoryKey(userId) {
    return `codementor_history_${userId}`;
}

/**
 * Save a code analysis entry to a user's personal history.
 * @param {string} userId - The user's unique ID
 * @param {Object} entry - { code, language, score, issueCount, issueTypes, issues, analysisResult }
 * @returns {Array} The updated history array
 */
export function saveCodeHistory(userId, entry) {
    if (!userId) return [];

    const key = getUserHistoryKey(userId);
    let history = [];

    try {
        const stored = localStorage.getItem(key);
        if (stored) {
            history = JSON.parse(stored);
        }
    } catch (e) {
        console.error('Failed to load user history:', e);
        history = [];
    }

    // Create timestamped entry
    const historyEntry = {
        id: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        date: new Date().toISOString(),
        code: entry.code || '',
        language: entry.language || 'unknown',
        score: entry.score || 0,
        issueCount: entry.issueCount || 0,
        issueTypes: entry.issueTypes || {},
        issues: entry.issues || [],
        codeSnippet: (entry.code || '').slice(0, 200), // Short preview
        lineCount: (entry.code || '').split('\n').length,
    };

    history.push(historyEntry);

    // Cap at max entries
    if (history.length > MAX_HISTORY_ENTRIES) {
        history = history.slice(-MAX_HISTORY_ENTRIES);
    }

    try {
        localStorage.setItem(key, JSON.stringify(history));
    } catch (e) {
        console.error('Failed to save user history:', e);
    }

    // Also update the user's analysisCount
    const user = users.find(u => u.id === userId);
    if (user) {
        user.analysisCount = history.length;
        saveToStorage();
    }

    return history;
}

/**
 * Get a user's complete code history.
 * @param {string} userId
 * @returns {Array}
 */
export function getCodeHistory(userId) {
    if (!userId) return [];

    try {
        const stored = localStorage.getItem(getUserHistoryKey(userId));
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Failed to load user history:', e);
        return [];
    }
}

/**
 * Clear a user's code history.
 * @param {string} userId
 * @returns {{ success: boolean, message: string }}
 */
export function clearCodeHistory(userId) {
    if (!userId) return { success: false, message: 'No user ID provided.' };

    try {
        localStorage.removeItem(getUserHistoryKey(userId));
        const user = users.find(u => u.id === userId);
        if (user) {
            user.analysisCount = 0;
            saveToStorage();
        }
        return { success: true, message: 'History cleared.' };
    } catch (e) {
        return { success: false, message: 'Failed to clear history.' };
    }
}

/**
 * Get the number of history entries for a user.
 * @param {string} userId
 * @returns {number}
 */
export function getCodeHistoryCount(userId) {
    return getCodeHistory(userId).length;
}

