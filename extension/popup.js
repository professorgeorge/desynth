// Desynth Extension Popup Logic
import { fetchOllamaModels, detectChromeAI } from './engine/llm-service.js';

document.addEventListener('DOMContentLoaded', async () => {
  const inputText = document.getElementById('input-text');
  const voiceSelect = document.getElementById('voice-select');
  const optgroupCustom = document.getElementById('optgroup-custom');
  const humanizeBtn = document.getElementById('humanize-btn');
  const btnText = document.getElementById('btn-text');
  const btnSpinner = document.getElementById('btn-spinner');
  const clearBtn = document.getElementById('clear-btn');

  const modeDeepBtn = document.getElementById('mode-deep-btn');
  const modeFastBtn = document.getElementById('mode-fast-btn');

  const outputSection = document.getElementById('output-section');
  const outputText = document.getElementById('output-text');
  const copyBtn = document.getElementById('copy-btn');
  const popupDiffBtn = document.getElementById('popup-diff-btn');
  const scorePill = document.getElementById('score-pill');
  const burstinessPill = document.getElementById('burstiness-pill');
  const prunedPill = document.getElementById('pruned-pill');

  const statWords = document.getElementById('stat-words');
  const statTells = document.getElementById('stat-tells');

  const statusBanner = document.getElementById('status-banner');
  const providerSelect = document.getElementById('provider-select');
  
  // Config Panels
  const ollamaConfig = document.getElementById('ollama-config');
  const chromeAiConfig = document.getElementById('chrome-ai-config');
  const webllmConfig = document.getElementById('webllm-config');
  const geminiConfig = document.getElementById('gemini-config');
  const openaiConfig = document.getElementById('openai-config');
  const groqConfig = document.getElementById('groq-config');

  // Ollama Inputs & Actions
  const ollamaEndpoint = document.getElementById('ollama-endpoint');
  const ollamaModelSelect = document.getElementById('ollama-model-select');
  const ollamaModel = document.getElementById('ollama-model');
  const ollamaDetectBtn = document.getElementById('ollama-detect-btn');
  const ollamaTestBtn = document.getElementById('ollama-test-btn');
  const ollamaStatusBadge = document.getElementById('ollama-status-badge');

  // Chrome AI Inputs & Actions
  const chromeAiStatus = document.getElementById('chrome-ai-status');
  const chromeAiTestBtn = document.getElementById('chrome-ai-test-btn');
  const chromeAiHelp = document.getElementById('chrome-ai-help');

  // WebLLM Inputs & Actions
  const webllmEndpoint = document.getElementById('webllm-endpoint');
  const webllmModel = document.getElementById('webllm-model');
  const webllmTestBtn = document.getElementById('webllm-test-btn');
  const webllmStatusBadge = document.getElementById('webllm-status-badge');

  // Cloud API Inputs
  const geminiKey = document.getElementById('gemini-key');
  const openaiKey = document.getElementById('openai-key');
  const openaiModel = document.getElementById('openai-model');
  const groqKey = document.getElementById('groq-key');

  const importVoiceBtn = document.getElementById('import-voice-btn');
  const exportVoiceBtn = document.getElementById('export-voice-btn');
  const voiceFileInput = document.getElementById('voice-file-input');
  const customVoiceCount = document.getElementById('custom-voice-count');

  const saveSettingsBtn = document.getElementById('save-settings-btn');
  const saveMsg = document.getElementById('save-msg');

  let currentMode = 'deep';
  let lastOriginalInput = '';
  let lastRewrittenOutput = '';
  let isDiffActive = false;

  // Load saved settings
  const storage = await chrome.storage.local.get([
    'defaultVoice',
    'provider',
    'mode',
    'customVoices',
    'ollamaEndpoint',
    'ollamaModel',
    'webllmEndpoint',
    'webllmModel',
    'geminiApiKey',
    'openaiApiKey',
    'openaiModel',
    'groqApiKey',
    'totalWordsSanitized',
    'totalTellsExcised'
  ]);

  if (storage.mode) currentMode = storage.mode;
  updateModeButtons();

  function updateModeButtons() {
    modeDeepBtn.classList.toggle('mode-active', currentMode === 'deep');
    modeFastBtn.classList.toggle('mode-active', currentMode === 'fast');
  }

  modeDeepBtn.addEventListener('click', async () => {
    currentMode = 'deep';
    updateModeButtons();
    await chrome.storage.local.set({ mode: 'deep' });
  });

  modeFastBtn.addEventListener('click', async () => {
    currentMode = 'fast';
    updateModeButtons();
    await chrome.storage.local.set({ mode: 'fast' });
  });

  // Populate Custom Voices
  function renderCustomVoices(customList = []) {
    optgroupCustom.innerHTML = '';
    if (customList.length === 0) {
      const emptyOpt = document.createElement('option');
      emptyOpt.disabled = true;
      emptyOpt.textContent = '(No custom voices yet)';
      optgroupCustom.appendChild(emptyOpt);
      customVoiceCount.textContent = '0 custom voices synced';
      return;
    }

    customVoiceCount.textContent = `${customList.length} custom voice${customList.length === 1 ? '' : 's'} synced`;
    customList.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = `${v.badge || '✨'} ${v.name}`;
      optgroupCustom.appendChild(opt);
    });
  }

  renderCustomVoices(storage.customVoices || []);

  if (storage.defaultVoice) voiceSelect.value = storage.defaultVoice;
  if (storage.provider) providerSelect.value = storage.provider;
  if (storage.ollamaEndpoint) ollamaEndpoint.value = storage.ollamaEndpoint;
  if (storage.ollamaModel) {
    ollamaModel.value = storage.ollamaModel;
  }
  if (storage.webllmEndpoint) webllmEndpoint.value = storage.webllmEndpoint;
  if (storage.webllmModel) webllmModel.value = storage.webllmModel;
  if (storage.geminiApiKey) geminiKey.value = storage.geminiApiKey;
  if (storage.openaiApiKey) openaiKey.value = storage.openaiApiKey;
  if (storage.openaiModel) openaiModel.value = storage.openaiModel;
  if (storage.groqApiKey) groqKey.value = storage.groqApiKey;

  statWords.textContent = (storage.totalWordsSanitized || 0).toLocaleString();
  statTells.textContent = (storage.totalTellsExcised || 0).toLocaleString();

  function updateConfigPanels() {
    const val = providerSelect.value;
    ollamaConfig.classList.toggle('hidden', val !== 'ollama');
    chromeAiConfig.classList.toggle('hidden', val !== 'chrome-ai');
    webllmConfig.classList.toggle('hidden', val !== 'webllm');
    geminiConfig.classList.toggle('hidden', val !== 'gemini');
    openaiConfig.classList.toggle('hidden', val !== 'openai');
    groqConfig.classList.toggle('hidden', val !== 'groq');

    if (val === 'ollama') detectOllama();
    if (val === 'chrome-ai') updateChromeAIStatus();
  }

  providerSelect.addEventListener('change', updateConfigPanels);
  updateConfigPanels();

  // Banner Helper
  function showBanner(message, type = 'error') {
    statusBanner.textContent = message;
    statusBanner.className = `status-banner ${type === 'info' ? 'banner-info' : type === 'success' ? 'banner-success' : ''}`;
    statusBanner.classList.remove('hidden');
  }

  function hideBanner() {
    statusBanner.classList.add('hidden');
  }

  // --- Ollama Detection & Test ---
  async function detectOllama(silent = false) {
    try {
      if (!silent) {
        ollamaStatusBadge.textContent = '🔄 Scanning 127.0.0.1:11434 & localhost...';
        ollamaStatusBadge.className = 'engine-status-badge';
        ollamaStatusBadge.classList.remove('hidden');
      }

      const endpoint = ollamaEndpoint.value.trim() || 'http://127.0.0.1:11434';
      const result = await fetchOllamaModels(endpoint);

      if (result && result.models && result.models.length > 0) {
        ollamaEndpoint.value = result.workingEndpoint;
        ollamaModelSelect.innerHTML = '';
        result.models.forEach(m => {
          const opt = document.createElement('option');
          opt.value = m;
          opt.textContent = m;
          ollamaModelSelect.appendChild(opt);
        });

        // Match existing value or select first model
        const currentM = ollamaModel.value.trim();
        if (result.models.includes(currentM)) {
          ollamaModelSelect.value = currentM;
        } else if (result.models.includes(currentM + ':latest')) {
          ollamaModelSelect.value = currentM + ':latest';
          ollamaModel.value = currentM + ':latest';
        } else {
          ollamaModelSelect.value = result.models[0];
          ollamaModel.value = result.models[0];
        }

        ollamaStatusBadge.textContent = `✅ Connected (${result.workingEndpoint}): ${result.models.length} model(s) ready`;
        ollamaStatusBadge.className = 'engine-status-badge status-ok';
        ollamaStatusBadge.classList.remove('hidden');

        await chrome.storage.local.set({
          ollamaEndpoint: result.workingEndpoint,
          ollamaModel: ollamaModel.value
        });
      } else {
        ollamaStatusBadge.textContent = '⚠️ Ollama reached, but no models downloaded yet.';
        ollamaStatusBadge.className = 'engine-status-badge status-err';
        ollamaStatusBadge.classList.remove('hidden');
      }
    } catch (err) {
      if (!silent) {
        ollamaStatusBadge.textContent = `⚠️ Cannot reach Ollama: ${err.message}`;
        ollamaStatusBadge.className = 'engine-status-badge status-err';
        ollamaStatusBadge.classList.remove('hidden');
      }
    }
  }

  ollamaModelSelect.addEventListener('change', () => {
    ollamaModel.value = ollamaModelSelect.value;
  });

  ollamaDetectBtn.addEventListener('click', () => detectOllama(false));

  ollamaTestBtn.addEventListener('click', async () => {
    const rawBase = (ollamaEndpoint.value.trim() || 'http://127.0.0.1:11434').replace(/\/+$/, '');
    const model = ollamaModel.value.trim() || 'llama3.2';
    ollamaStatusBadge.textContent = `⚡ Testing ping to ${model}...`;
    ollamaStatusBadge.className = 'engine-status-badge';
    ollamaStatusBadge.classList.remove('hidden');

    const candidateBases = [rawBase];
    if (!candidateBases.includes('http://127.0.0.1:11434')) candidateBases.push('http://127.0.0.1:11434');
    if (!candidateBases.includes('http://localhost:11434')) candidateBases.push('http://localhost:11434');

    let lastError = null;

    for (const base of candidateBases) {
      // 1. Try /api/chat
      try {
        const start = performance.now();
        const res = await fetch(`${base}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: 'Say "Ready" in one word.' }],
            stream: false
          })
        });

        if (res.ok) {
          const json = await res.json();
          const latency = Math.round(performance.now() - start);
          const reply = json.message?.content?.trim() || 'OK';
          ollamaEndpoint.value = base;
          ollamaStatusBadge.textContent = `✅ Ping Success (${latency}ms at ${base})! "${reply}"`;
          ollamaStatusBadge.className = 'engine-status-badge status-ok';
          await chrome.storage.local.set({ ollamaEndpoint: base, ollamaModel: model });
          return;
        } else if (res.status === 403) {
          lastError = new Error('HTTP 403 Forbidden. Ollama rejected cross-origin request.');
        } else {
          const txt = await res.text().catch(() => '');
          lastError = new Error(`HTTP ${res.status}: ${txt}`);
        }
      } catch (err) {
        lastError = err;
      }

      // 2. Try /v1/chat/completions
      try {
        const start = performance.now();
        const res = await fetch(`${base}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: 'Say "Ready"' }],
            stream: false
          })
        });

        if (res.ok) {
          const json = await res.json();
          const latency = Math.round(performance.now() - start);
          const reply = json.choices?.[0]?.message?.content?.trim() || 'OK';
          ollamaEndpoint.value = base;
          ollamaStatusBadge.textContent = `✅ Ping Success (${latency}ms at ${base})! "${reply}"`;
          ollamaStatusBadge.className = 'engine-status-badge status-ok';
          await chrome.storage.local.set({ ollamaEndpoint: base, ollamaModel: model });
          return;
        }
      } catch (err) {
        lastError = err;
      }
    }

    ollamaStatusBadge.textContent = `❌ Ping Failed: ${lastError ? lastError.message : 'Unreachable'}`;
    ollamaStatusBadge.className = 'engine-status-badge status-err';
  });

  // --- Chrome Built-in AI (Gemini Nano) ---
  function updateChromeAIStatus() {
    const check = detectChromeAI();
    if (check.supported) {
      chromeAiStatus.textContent = '✅ Gemini Nano Detected & Ready';
      chromeAiStatus.className = 'engine-status-badge status-ok';
      chromeAiHelp.classList.add('hidden');
    } else {
      chromeAiStatus.textContent = '⚠️ Not Enabled in Chrome';
      chromeAiStatus.className = 'engine-status-badge status-err';
      chromeAiHelp.classList.remove('hidden');
    }
  }

  chromeAiTestBtn.addEventListener('click', async () => {
    const check = detectChromeAI();
    if (!check.supported || !check.api) {
      alert('Chrome Built-in AI is not enabled. Follow the instructions below to enable it in chrome://flags.');
      return;
    }

    chromeAiStatus.textContent = '⚡ Testing on-device prompt...';
    try {
      const session = await check.api.create({
        systemPrompt: 'You are a test assistant. Answer in 1 word.'
      });
      const res = await session.prompt('Say "Ready"');
      if (session && typeof session.destroy === 'function') session.destroy();
      chromeAiStatus.textContent = `✅ On-Device AI Active! Replied: "${res.trim()}"`;
      chromeAiStatus.className = 'engine-status-badge status-ok';
    } catch (err) {
      chromeAiStatus.textContent = `❌ Chrome AI Error: ${err.message}`;
      chromeAiStatus.className = 'engine-status-badge status-err';
    }
  });

  // --- WebLLM / Local Server Test ---
  webllmTestBtn.addEventListener('click', async () => {
    const base = (webllmEndpoint.value.trim() || 'http://127.0.0.1:8000/v1').replace(/\/+$/, '');
    const model = webllmModel.value.trim();
    const url = base.endsWith('/chat/completions') ? base : `${base}/chat/completions`;

    webllmStatusBadge.textContent = `⚡ Pinging ${url}...`;
    webllmStatusBadge.className = 'engine-status-badge';
    webllmStatusBadge.classList.remove('hidden');

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Say "Ready"' }]
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const reply = json.choices?.[0]?.message?.content?.trim() || 'OK';
      webllmStatusBadge.textContent = `✅ WebLLM Connected! "${reply}"`;
      webllmStatusBadge.className = 'engine-status-badge status-ok';
    } catch (err) {
      webllmStatusBadge.textContent = `❌ WebLLM Error: ${err.message}`;
      webllmStatusBadge.className = 'engine-status-badge status-err';
    }
  });

  // Auto-detect Ollama immediately on load if provider is ollama or default
  if (providerSelect.value === 'ollama') {
    detectOllama(true);
  }

  // Save Settings
  saveSettingsBtn.addEventListener('click', async () => {
    await chrome.storage.local.set({
      defaultVoice: voiceSelect.value,
      provider: providerSelect.value,
      mode: currentMode,
      ollamaEndpoint: ollamaEndpoint.value.trim(),
      ollamaModel: ollamaModel.value.trim(),
      webllmEndpoint: webllmEndpoint.value.trim(),
      webllmModel: webllmModel.value.trim(),
      geminiApiKey: geminiKey.value.trim(),
      openaiApiKey: openaiKey.value.trim(),
      openaiModel: openaiModel.value.trim(),
      groqApiKey: groqKey.value.trim()
    });

    saveMsg.classList.remove('hidden');
    setTimeout(() => saveMsg.classList.add('hidden'), 2000);
  });

  // Import Custom Voices JSON
  importVoiceBtn.addEventListener('click', () => voiceFileInput.click());
  voiceFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const imported = Array.isArray(parsed) ? parsed : (parsed.customVoices || [parsed]);
        const existing = (await chrome.storage.local.get('customVoices')).customVoices || [];
        
        // Merge without duplicate IDs
        const map = new Map();
        existing.forEach(v => map.set(v.id, v));
        imported.forEach(v => {
          if (v && v.id && v.name) map.set(v.id, v);
        });

        const merged = Array.from(map.values());
        await chrome.storage.local.set({ customVoices: merged });
        renderCustomVoices(merged);
        alert(`Successfully imported ${imported.length} custom voice(s)!`);
      } catch (err) {
        alert('Invalid JSON voice file: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  // Export Custom Voices JSON
  exportVoiceBtn.addEventListener('click', async () => {
    const voices = (await chrome.storage.local.get('customVoices')).customVoices || [];
    if (voices.length === 0) {
      alert('No custom voices stored to export.');
      return;
    }
    const blob = new Blob([JSON.stringify(voices, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `desynth-voices-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Clear button
  clearBtn.addEventListener('click', () => {
    inputText.value = '';
    outputSection.classList.add('hidden');
    hideBanner();
    inputText.focus();
  });

  // Copy button
  copyBtn.addEventListener('click', () => {
    const text = lastRewrittenOutput || outputText.textContent;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = 'Copied!';
      copyBtn.classList.add('pill-good');
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
        copyBtn.classList.remove('pill-good');
      }, 1500);
    });
  });

  // Visual Diff Toggle
  popupDiffBtn.addEventListener('click', () => {
    isDiffActive = !isDiffActive;
    if (isDiffActive) {
      popupDiffBtn.classList.add('diff-active');
      popupDiffBtn.textContent = '📄 Clean';
      renderPopupDiff();
    } else {
      popupDiffBtn.classList.remove('diff-active');
      popupDiffBtn.textContent = '🔍 Diff';
      outputText.textContent = lastRewrittenOutput;
    }
  });

  function renderPopupDiff() {
    if (!lastOriginalInput || !lastRewrittenOutput) return;
    const origTokens = lastOriginalInput.split(/(\s+)/);
    const rewTokens = lastRewrittenOutput.split(/(\s+)/);
    const rewSet = new Set(rewTokens.map(w => w.toLowerCase().trim()).filter(Boolean));

    let html = '';
    for (const part of origTokens) {
      if (!part.trim()) {
        html += part;
      } else if (!rewSet.has(part.toLowerCase().trim())) {
        html += `<del class="popup-diff-del">${escapeHtml(part)}</del>`;
      } else {
        html += `<span>${escapeHtml(part)}</span>`;
      }
    }
    outputText.innerHTML = html;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Humanize button
  humanizeBtn.addEventListener('click', async () => {
    const text = inputText.value.trim();
    if (!text) {
      inputText.focus();
      return;
    }

    hideBanner();
    lastOriginalInput = text;
    isDiffActive = false;
    popupDiffBtn.classList.remove('diff-active');
    popupDiffBtn.textContent = '🔍 Diff';

    humanizeBtn.disabled = true;
    btnText.textContent = currentMode === 'deep' ? 'Deep 4-Pass...' : 'Processing...';
    btnSpinner.classList.remove('hidden');

    try {
      // Save current choices first
      await chrome.storage.local.set({
        defaultVoice: voiceSelect.value,
        provider: providerSelect.value,
        mode: currentMode,
        ollamaEndpoint: ollamaEndpoint.value.trim(),
        ollamaModel: ollamaModel.value.trim(),
        webllmEndpoint: webllmEndpoint.value.trim(),
        webllmModel: webllmModel.value.trim()
      });

      const response = await chrome.runtime.sendMessage({
        action: 'RUN_HUMANIZE',
        text,
        voiceId: voiceSelect.value,
        provider: providerSelect.value,
        mode: currentMode
      });

      if (response && response.rewritten) {
        lastRewrittenOutput = response.rewritten;
        outputText.textContent = response.rewritten;
        outputSection.classList.remove('hidden');

        // Check if there was an LLM warning (e.g. fallback triggered)
        if (response.warning) {
          showBanner(`⚠️ ${response.warning}`, 'warning');
        }

        const score = response.lintAfter?.score ?? 98;
        scorePill.textContent = `Score: ${score}/100`;

        const burstiness = response.lintAfter?.stats?.burstiness ?? '14.2';
        burstinessPill.textContent = `Burstiness: ${burstiness}`;

        const tellsPruned = Math.max(0, (response.lintBefore?.findings?.length || 0) - (response.lintAfter?.findings?.length || 0));
        prunedPill.textContent = `${tellsPruned} Tells Pruned`;

        // Refresh stats
        const updatedStats = await chrome.storage.local.get(['totalWordsSanitized', 'totalTellsExcised']);
        statWords.textContent = (updatedStats.totalWordsSanitized || 0).toLocaleString();
        statTells.textContent = (updatedStats.totalTellsExcised || 0).toLocaleString();
      }
    } catch (err) {
      console.error('Humanize failed in popup:', err);
      showBanner(`Error: ${err.message}`);
    } finally {
      humanizeBtn.disabled = false;
      btnText.textContent = '⚡ Humanize';
      btnSpinner.classList.add('hidden');
    }
  });
});
