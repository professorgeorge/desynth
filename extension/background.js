import { humanizeText } from './engine/llm-service.js';

// Setup Context Menus on Installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    // Parent Context Menu
    chrome.contextMenus.create({
      id: 'desynth-parent',
      title: 'Desynth: Humanize Selection',
      contexts: ['selection']
    });

    // Quick Default
    chrome.contextMenus.create({
      id: 'desynth-quick',
      parentId: 'desynth-parent',
      title: '⚡ Quick Desynth (Default Voice)',
      contexts: ['selection']
    });

    // Separator
    chrome.contextMenus.create({
      id: 'desynth-sep-1',
      parentId: 'desynth-parent',
      type: 'separator',
      contexts: ['selection']
    });

    // Voice Choices
    chrome.contextMenus.create({
      id: 'voice-george-orwell',
      parentId: 'desynth-parent',
      title: '🖋️ Plain English & Anti-Jargon (Orwell)',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'voice-systems-engineer',
      parentId: 'desynth-parent',
      title: '🛠️ Systems Engineer (Runtime Trade-offs)',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'voice-scholarly-researcher',
      parentId: 'desynth-parent',
      title: '🎓 Academic Empirical (Methodological Rigor)',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'voice-bertrand-russell',
      parentId: 'desynth-parent',
      title: '📜 Bertrand Russell (Rigorous Logic)',
      contexts: ['selection']
    });

    // Separator
    chrome.contextMenus.create({
      id: 'desynth-sep-2',
      parentId: 'desynth-parent',
      type: 'separator',
      contexts: ['selection']
    });

    // 0ms Instant Clean
    chrome.contextMenus.create({
      id: 'desynth-instant',
      parentId: 'desynth-parent',
      title: '✂️ Instant 0ms Desynth (No LLM)',
      contexts: ['selection']
    });
  });

  // Initialize storage defaults if not present
  chrome.storage.local.get(['defaultVoice', 'provider', 'totalWordsSanitized', 'totalTellsExcised'], (res) => {
    chrome.storage.local.set({
      defaultVoice: res.defaultVoice || 'george-orwell',
      provider: res.provider || 'instant',
      ollamaEndpoint: res.ollamaEndpoint || 'http://localhost:11434',
      ollamaModel: res.ollamaModel || 'llama3.2',
      totalWordsSanitized: res.totalWordsSanitized || 0,
      totalTellsExcised: res.totalTellsExcised || 0
    });
  });
});

// Context Menu Click Handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.id || !info.selectionText) return;

  const text = info.selectionText.trim();
  if (!text) return;

  const storage = await chrome.storage.local.get([
    'defaultVoice',
    'provider',
    'ollamaEndpoint',
    'ollamaModel',
    'geminiApiKey',
    'geminiModel',
    'openaiApiKey',
    'openaiEndpoint',
    'openaiModel',
    'groqApiKey',
    'groqModel',
    'totalWordsSanitized',
    'totalTellsExcised'
  ]);

  let voiceId = storage.defaultVoice || 'george-orwell';
  let provider = storage.provider || 'instant';

  if (info.menuItemId.startsWith('voice-')) {
    voiceId = info.menuItemId.replace('voice-', '');
  } else if (info.menuItemId === 'desynth-instant') {
    provider = 'instant';
  }

  // Notify tab to show loading spinner HUD
  try {
    await chrome.tabs.sendMessage(tab.id, {
      action: 'HUMANIZE_STARTED',
      selectedText: text,
      voiceId
    });
  } catch (err) {
    // If content script was not injected on this tab yet, inject it dynamically
    await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['content.css'] });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
    await chrome.tabs.sendMessage(tab.id, {
      action: 'HUMANIZE_STARTED',
      selectedText: text,
      voiceId
    });
  }

  // Execute humanization with progress updates
  const result = await humanizeText({
    text,
    voiceId,
    mode: storage.mode || 'deep',
    provider,
    config: storage,
    onProgress: (status) => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'HUMANIZE_PROGRESS',
        status
      }).catch(() => {});
    }
  });

  // Calculate statistics
  const words = text.split(/\s+/).filter(Boolean).length;
  const tellsPruned = Math.max(0, (result.lintBefore?.findings?.length || 0) - (result.lintAfter?.findings?.length || 0));

  await chrome.storage.local.set({
    totalWordsSanitized: (storage.totalWordsSanitized || 0) + words,
    totalTellsExcised: (storage.totalTellsExcised || 0) + tellsPruned
  });

  // Send result back to content script
  await chrome.tabs.sendMessage(tab.id, {
    action: 'HUMANIZE_COMPLETED',
    originalText: text,
    ...result
  });
});

// Direct Messages from Popup or Content Script
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === 'RUN_HUMANIZE') {
    (async () => {
      const storage = await chrome.storage.local.get();
      const result = await humanizeText({
        text: req.text,
        voiceId: req.voiceId || storage.defaultVoice || 'george-orwell',
        mode: req.mode || storage.mode || 'deep',
        provider: req.provider || storage.provider || 'instant',
        config: storage
      });

      const words = req.text.split(/\s+/).filter(Boolean).length;
      const tellsPruned = Math.max(0, (result.lintBefore?.findings?.length || 0) - (result.lintAfter?.findings?.length || 0));

      await chrome.storage.local.set({
        totalWordsSanitized: (storage.totalWordsSanitized || 0) + words,
        totalTellsExcised: (storage.totalTellsExcised || 0) + tellsPruned
      });

      sendResponse(result);
    })();
    return true; // Keep message channel open for async response
  }
});
