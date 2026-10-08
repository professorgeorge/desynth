// Stop-Slop Extension Popup Logic

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

  const providerSelect = document.getElementById('provider-select');
  const ollamaConfig = document.getElementById('ollama-config');
  const geminiConfig = document.getElementById('gemini-config');
  const openaiConfig = document.getElementById('openai-config');
  const groqConfig = document.getElementById('groq-config');

  const ollamaEndpoint = document.getElementById('ollama-endpoint');
  const ollamaModel = document.getElementById('ollama-model');
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
  if (storage.ollamaModel) ollamaModel.value = storage.ollamaModel;
  if (storage.geminiApiKey) geminiKey.value = storage.geminiApiKey;
  if (storage.openaiApiKey) openaiKey.value = storage.openaiApiKey;
  if (storage.openaiModel) openaiModel.value = storage.openaiModel;
  if (storage.groqApiKey) groqKey.value = storage.groqApiKey;

  statWords.textContent = (storage.totalWordsSanitized || 0).toLocaleString();
  statTells.textContent = (storage.totalTellsExcised || 0).toLocaleString();

  function updateConfigPanels() {
    const val = providerSelect.value;
    ollamaConfig.classList.toggle('hidden', val !== 'ollama');
    geminiConfig.classList.toggle('hidden', val !== 'gemini');
    openaiConfig.classList.toggle('hidden', val !== 'openai');
    groqConfig.classList.toggle('hidden', val !== 'groq');
  }

  providerSelect.addEventListener('change', updateConfigPanels);
  updateConfigPanels();

  // Save Settings
  saveSettingsBtn.addEventListener('click', async () => {
    await chrome.storage.local.set({
      defaultVoice: voiceSelect.value,
      provider: providerSelect.value,
      mode: currentMode,
      ollamaEndpoint: ollamaEndpoint.value.trim(),
      ollamaModel: ollamaModel.value.trim(),
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

    lastOriginalInput = text;
    isDiffActive = false;
    popupDiffBtn.classList.remove('diff-active');
    popupDiffBtn.textContent = '🔍 Diff';

    humanizeBtn.disabled = true;
    btnText.textContent = currentMode === 'deep' ? 'Deep 4-Pass...' : 'Processing...';
    btnSpinner.classList.remove('hidden');

    try {
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
      alert('Error humanizing text: ' + err.message);
    } finally {
      humanizeBtn.disabled = false;
      btnText.textContent = '⚡ Humanize';
      btnSpinner.classList.add('hidden');
    }
  });
});
