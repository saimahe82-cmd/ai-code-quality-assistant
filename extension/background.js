/* ═══════════════════════════════════════════════════════════════════════
   Background Service Worker — Handles context menus and side panel
   ═══════════════════════════════════════════════════════════════════════ */

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'codementor-analyze',
        title: '🔍 Analyze with CodeMentor AI',
        contexts: ['selection']
    });

    chrome.contextMenus.create({
        id: 'codementor-explain',
        title: '💡 Explain this code',
        contexts: ['selection']
    });

    chrome.contextMenus.create({
        id: 'codementor-debug',
        title: '🐛 Debug this code',
        contexts: ['selection']
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    const selectedText = info.selectionText || '';

    if (!selectedText.trim()) return;

    switch (info.menuItemId) {
        case 'codementor-analyze':
            chrome.storage.local.set({
                pendingAction: 'analyze',
                pendingCode: selectedText
            });
            chrome.sidePanel.open({ tabId: tab.id });
            break;

        case 'codementor-explain':
            chrome.storage.local.set({
                pendingAction: 'explain',
                pendingCode: selectedText
            });
            chrome.sidePanel.open({ tabId: tab.id });
            break;

        case 'codementor-debug':
            chrome.storage.local.set({
                pendingAction: 'debug',
                pendingCode: selectedText
            });
            chrome.sidePanel.open({ tabId: tab.id });
            break;
    }
});

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ tabId: tab.id });
});
