/* ═══════════════════════════════════════════════════════════════════════
   Content Script — Adds floating "Analyze" button on text selection
   ═══════════════════════════════════════════════════════════════════════ */

let floatingBtn = null;

// Listen for text selection on the page
document.addEventListener('mouseup', (e) => {
    const selection = window.getSelection().toString().trim();

    // Remove existing button
    if (floatingBtn) {
        floatingBtn.remove();
        floatingBtn = null;
    }

    // Only show for code-like selections (multi-line or contains code chars)
    if (selection.length > 20 && (selection.includes('\n') || /[{}();=]/.test(selection))) {
        showFloatingButton(e.clientX, e.clientY, selection);
    }
});

document.addEventListener('mousedown', (e) => {
    if (floatingBtn && !floatingBtn.contains(e.target)) {
        floatingBtn.remove();
        floatingBtn = null;
    }
});

function showFloatingButton(x, y, code) {
    floatingBtn = document.createElement('div');
    floatingBtn.className = 'codementor-float-btn';
    floatingBtn.innerHTML = '⚡ Analyze';

    // Position near mouse
    floatingBtn.style.left = Math.min(x + 10, window.innerWidth - 150) + 'px';
    floatingBtn.style.top = Math.min(y - 40, window.innerHeight - 40) + 'px';

    floatingBtn.addEventListener('click', () => {
        chrome.storage.local.set({
            pendingAction: 'analyze',
            pendingCode: code
        });

        // Try to open side panel
        chrome.runtime.sendMessage({ type: 'open-sidepanel' });

        floatingBtn.remove();
        floatingBtn = null;
    });

    document.body.appendChild(floatingBtn);

    // Auto-hide after 4 seconds
    setTimeout(() => {
        if (floatingBtn) {
            floatingBtn.style.opacity = '0';
            setTimeout(() => {
                if (floatingBtn) {
                    floatingBtn.remove();
                    floatingBtn = null;
                }
            }, 300);
        }
    }, 4000);
}
