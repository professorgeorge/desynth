// Stop-Slop In-Page Content Script & HUD Overlay
// Runs in Shadow DOM to guarantee zero CSS conflict with host websites.

let lastActiveSelection = null;
let lastActiveRange = null;
let lastActiveElement = null;
let activeHudContainer = null;

// Track selection whenever user selects text
document.addEventListener('selectionchange', () => {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0 && selection.toString().trim().length > 0) {
    lastActiveSelection = selection.toString().trim();
    try {
      lastActiveRange = selection.getRangeAt(0).cloneRange();
    } catch (e) {}
    lastActiveElement = document.activeElement;
  }
});

// Also track on contextmenu right-click
document.addEventListener('contextmenu', () => {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0 && selection.toString().trim().length > 0) {
    lastActiveSelection = selection.toString().trim();
    try {
      lastActiveRange = selection.getRangeAt(0).cloneRange();
    } catch (e) {}
    lastActiveElement = document.activeElement;
  }
});

// Listen to keyboard shortcut: Alt+H to Humanize current selection
document.addEventListener('keydown', (e) => {
  if (e.altKey && (e.key === 'h' || e.key === 'H')) {
    const selection = window.getSelection();
    const text = (selection ? selection.toString() : '') || lastActiveSelection;
    if (text && text.trim().length > 0) {
      e.preventDefault();
      triggerQuickHumanize(text.trim());
    }
  }
});

function triggerQuickHumanize(text) {
  showHudLoading(text, 'Default Voice');
  chrome.runtime.sendMessage({ action: 'RUN_HUMANIZE', text }, (result) => {
    if (result) {
      showHudResult(text, result);
    }
  });
}

// Listen to messages from background service worker
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'HUMANIZE_STARTED') {
    showHudLoading(msg.selectedText, msg.voiceId);
  } else if (msg.action === 'HUMANIZE_COMPLETED') {
    showHudResult(msg.originalText, msg);
  }
});

function removeExistingHud() {
  if (activeHudContainer && activeHudContainer.parentNode) {
    activeHudContainer.parentNode.removeChild(activeHudContainer);
  }
  activeHudContainer = null;
}

function calculateHudPosition() {
  let rect = null;
  if (lastActiveRange) {
    rect = lastActiveRange.getBoundingClientRect();
  } else if (lastActiveElement && typeof lastActiveElement.getBoundingClientRect === 'function') {
    rect = lastActiveElement.getBoundingClientRect();
  }

  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;

  if (rect && rect.width > 0 && rect.height > 0) {
    let top = rect.bottom + scrollY + 8;
    let left = rect.left + scrollX;

    // Boundary protection for window viewport
    const viewportWidth = window.innerWidth;
    if (left + 460 > viewportWidth) {
      left = Math.max(16, viewportWidth - 480);
    }

    return { top, left };
  }

  // Fallback to center-screen
  return {
    top: scrollY + Math.max(80, window.innerHeight / 4),
    left: scrollX + Math.max(20, (window.innerWidth - 460) / 2)
  };
}

function showHudLoading(text, voice) {
  removeExistingHud();

  const pos = calculateHudPosition();
  const container = document.createElement('div');
  container.id = 'stop-slop-hud-host';
  container.style.position = 'absolute';
  container.style.top = `${pos.top}px`;
  container.style.left = `${pos.left}px`;
  container.style.zIndex = '2147483647';
  document.body.appendChild(container);
  activeHudContainer = container;

  const shadow = container.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>${getHudStyles()}</style>
    <div class="ss-hud ss-hud-loading">
      <div class="ss-hud-header">
        <div class="ss-logo">
          <span class="ss-dot"></span>
          <strong>Stop-Slop</strong>
        </div>
        <button class="ss-close-btn" id="ss-close">&times;</button>
      </div>
      <div class="ss-hud-body">
        <div class="ss-spinner"></div>
        <div class="ss-status-msg">Humanizing with authentic cadence...</div>
        <div class="ss-subtext">Purging tricolons, robotic signposts & em-dashes</div>
      </div>
    </div>
  `;

  shadow.getElementById('ss-close').addEventListener('click', removeExistingHud);
}

function showHudResult(originalText, result) {
  if (!activeHudContainer) {
    const pos = calculateHudPosition();
    const container = document.createElement('div');
    container.id = 'stop-slop-hud-host';
    container.style.position = 'absolute';
    container.style.top = `${pos.top}px`;
    container.style.left = `${pos.left}px`;
    container.style.zIndex = '2147483647';
    document.body.appendChild(container);
    activeHudContainer = container;
    container.attachShadow({ mode: 'open' });
  }

  const shadow = activeHudContainer.shadowRoot;
  const scoreBefore = result.lintBefore?.score ?? 50;
  const scoreAfter = result.lintAfter?.score ?? 98;
  const tellsPruned = Math.max(0, (result.lintBefore?.findings?.length || 0) - (result.lintAfter?.findings?.length || 0));

  const isEditable = isTargetEditable(lastActiveElement);

  shadow.innerHTML = `
    <style>${getHudStyles()}</style>
    <div class="ss-hud ss-hud-result">
      <div class="ss-hud-header">
        <div class="ss-logo">
          <span class="ss-dot ss-dot-active"></span>
          <strong>Stop-Slop Humanized</strong>
          <span class="ss-badge">${result.voice || 'Humanized'}</span>
        </div>
        <button class="ss-close-btn" id="ss-close" title="Close (Esc)">&times;</button>
      </div>

      <div class="ss-metrics-bar">
        <div class="ss-metric-pill">
          <span class="ss-pill-label">Human Fidelity:</span>
          <span class="ss-pill-val ss-val-good">${scoreAfter}/100</span>
        </div>
        <div class="ss-metric-pill">
          <span class="ss-pill-label">AI Tells Pruned:</span>
          <span class="ss-pill-val">${tellsPruned}</span>
        </div>
        <div class="ss-metric-pill">
          <span class="ss-pill-label">Provider:</span>
          <span class="ss-pill-val">${result.provider || 'Instant'}</span>
        </div>
      </div>

      <div class="ss-text-preview" id="ss-text">${escapeHtml(result.rewritten)}</div>

      <div class="ss-hud-footer">
        ${isEditable ? `
          <button class="ss-btn ss-btn-primary" id="ss-replace-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            Replace Selection
          </button>
        ` : ''}
        <button class="ss-btn ${isEditable ? 'ss-btn-secondary' : 'ss-btn-primary'}" id="ss-copy-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <span id="ss-copy-label">Copy Text</span>
        </button>
        <button class="ss-btn ss-btn-ghost" id="ss-dismiss-btn">Dismiss</button>
      </div>
    </div>
  `;

  // Event handlers
  shadow.getElementById('ss-close').addEventListener('click', removeExistingHud);
  shadow.getElementById('ss-dismiss-btn').addEventListener('click', removeExistingHud);

  const copyBtn = shadow.getElementById('ss-copy-btn');
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(result.rewritten).then(() => {
      const label = shadow.getElementById('ss-copy-label');
      label.textContent = 'Copied!';
      copyBtn.classList.add('ss-btn-success');
      setTimeout(() => {
        if (label) label.textContent = 'Copy Text';
        copyBtn.classList.remove('ss-btn-success');
      }, 1500);
    });
  });

  const replaceBtn = shadow.getElementById('ss-replace-btn');
  if (replaceBtn) {
    replaceBtn.addEventListener('click', () => {
      replaceSelectionWithText(result.rewritten);
      removeExistingHud();
    });
  }
}

// Check if an element is an editable input, textarea, or contenteditable
function isTargetEditable(el) {
  if (!el) return false;
  const tag = el.tagName ? el.tagName.toLowerCase() : '';
  if (tag === 'textarea' || (tag === 'input' && !['button', 'submit', 'checkbox', 'radio'].includes(el.type))) {
    return true;
  }
  return el.isContentEditable || el.getAttribute?.('contenteditable') === 'true';
}

function replaceSelectionWithText(newText) {
  const el = lastActiveElement;
  if (!el) return;

  const tag = el.tagName ? el.tagName.toLowerCase() : '';

  // 1. Textarea or Input
  if (tag === 'textarea' || tag === 'input') {
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (typeof start === 'number' && typeof end === 'number' && start !== end) {
      const val = el.value;
      el.value = val.substring(0, start) + newText + val.substring(end);
      el.selectionStart = start;
      el.selectionEnd = start + newText.length;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.focus();
      return;
    }
  }

  // 2. ContentEditable / Rich text editors (Gmail, Notion, Slack, Google Docs)
  if (el.isContentEditable || lastActiveRange) {
    try {
      const sel = window.getSelection();
      sel.removeAllRanges();
      if (lastActiveRange) {
        sel.addRange(lastActiveRange);
        document.execCommand('insertText', false, newText);
      }
    } catch (e) {
      console.warn('ExecCommand replacement fallback:', e);
      navigator.clipboard.writeText(newText);
    }
  }
}

// Click outside or press Esc to dismiss HUD
document.addEventListener('click', (e) => {
  if (activeHudContainer && !activeHudContainer.contains(e.target)) {
    removeExistingHud();
  }
}, true);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && activeHudContainer) {
    removeExistingHud();
  }
});

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getHudStyles() {
  return `
    :host {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 13px;
      line-height: 1.5;
      color: #0f172a;
    }
    .ss-hud {
      width: 440px;
      max-width: 90vw;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      box-shadow: 0 12px 36px -6px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      animation: ssFadeIn 0.16s ease-out;
      box-sizing: border-box;
    }
    @keyframes ssFadeIn {
      from { opacity: 0; transform: translateY(-4px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .ss-hud-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .ss-logo {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
    }
    .ss-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #94a3b8;
    }
    .ss-dot-active {
      background: #10b981;
      box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
    }
    .ss-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 500;
      padding: 1px 7px;
      background: #e0e7ff;
      color: #3730a3;
      border-radius: 6px;
      margin-left: 6px;
    }
    .ss-close-btn {
      background: none;
      border: none;
      font-size: 18px;
      line-height: 1;
      color: #64748b;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .ss-close-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .ss-hud-loading .ss-hud-body {
      padding: 24px 16px;
      text-align: center;
    }
    .ss-spinner {
      width: 24px;
      height: 24px;
      border: 3px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: ssSpin 0.7s linear infinite;
      margin: 0 auto 12px;
    }
    @keyframes ssSpin {
      to { transform: rotate(360deg); }
    }
    .ss-status-msg {
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 4px;
    }
    .ss-subtext {
      font-size: 12px;
      color: #64748b;
    }
    .ss-metrics-bar {
      display: flex;
      gap: 8px;
      padding: 8px 14px;
      background: #f1f5f9;
      border-bottom: 1px solid #e2e8f0;
    }
    .ss-metric-pill {
      font-size: 11px;
      color: #475569;
      background: #ffffff;
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    .ss-pill-val {
      font-weight: 600;
      color: #0f172a;
    }
    .ss-val-good {
      color: #059669;
    }
    .ss-text-preview {
      padding: 12px 14px;
      max-height: 220px;
      overflow-y: auto;
      font-size: 13.5px;
      line-height: 1.6;
      color: #1e293b;
      white-space: pre-wrap;
      background: #ffffff;
      user-select: text;
    }
    .ss-hud-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding: 10px 14px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
    }
    .ss-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12.5px;
      font-weight: 500;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.12s ease;
    }
    .ss-btn-primary {
      background: #2563eb;
      color: #ffffff;
    }
    .ss-btn-primary:hover {
      background: #1d4ed8;
    }
    .ss-btn-secondary {
      background: #ffffff;
      color: #1e293b;
      border-color: #cbd5e1;
    }
    .ss-btn-secondary:hover {
      background: #f1f5f9;
      border-color: #94a3b8;
    }
    .ss-btn-ghost {
      background: transparent;
      color: #64748b;
    }
    .ss-btn-ghost:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .ss-btn-success {
      background: #059669 !important;
      color: #ffffff !important;
    }
  `;
}
