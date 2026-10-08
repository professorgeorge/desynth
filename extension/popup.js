// Stop-Slop Extension Popup Logic

document.addEventListener('DOMContentLoaded', async () => {
  const inputText = document.getElementById('input-text');
  const voiceSelect = document.getElementById('voice-select');
  const humanizeBtn = document.getElementById('humanize-btn');
  const btnText = document.getElementById('btn-text');
  const btnSpinner = document.getElementById('btn-spinner');
  const clearBtn = document.getElementById('clear-btn');

  const outputSection = document.getElementById('output-section');
  const outputText = document.getElementById('output-text');
  const copyBtn = document.getElementById('copy-btn');
  const scorePill = document.getElementById('score-pill');
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

  const saveSettingsBtn = document.getElementById('save-settings-btn');
  const saveMsg = document.getElementById('save-msg');

  // Load saved settings
  const storage = await chrome.storage.local.get([
    'defaultVoice',
    'provider',
    'ollamaEndpoint',
    'ollamaModel',
    'geminiApiKey',
    'openaiApiKey',
    'openaiModel',
    'groqApiKey',
    'totalWordsSanitized',
    'totalTellsExcised'
  ]);

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

  // Clear button
  clearBtn.addEventListener('click', () => {
    inputText.value = '';
    outputSection.classList.add('hidden');
    inputText.focus();
  });

  // Copy button
  copyBtn.addEventListener('click', () => {
    const text = outputText.textContent;
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

  // Humanize button
  humanizeBtn.addEventListener('click', async () => {
    const text = inputText.value.trim();
    if (!text) {
      inputText.focus();
      return;
    }

    humanizeBtn.disabled = true;
    btnText.textContent = 'Processing...';
    btnSpinner.classList.remove('hidden');

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'RUN_HUMANIZE',
        text,
        voiceId: voiceSelect.value,
        provider: providerSelect.value
      });

      if (response && response.rewritten) {
        outputText.textContent = response.rewritten;
        outputSection.classList.remove('hidden');

        const score = response.lintAfter?.score ?? 98;
        scorePill.textContent = `Score: ${score}/100`;

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
