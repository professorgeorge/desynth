import { ARCHETYPES, formatPersonaYaml } from './engine/personas.js';
import { PRESETS } from './engine/presets.js';
import { lintProse } from './engine/linter.js';
import { runCognitivePipeline } from './engine/pipeline.js';
import {
  detectChromeAI,
  isWebGPUSupported,
  fetchOllamaModels,
  testProviderConnection,
  initWebLLM
} from './engine/llm-connector.js';

// --- Multi-Provider Settings Storage Keys ---
const STORAGE_KEYS = {
  provider: 'stop_slop_provider',
  webllmModel: 'stop_slop_webllm_model',
  ollamaEndpoint: 'stop_slop_ollama_endpoint',
  ollamaModel: 'stop_slop_ollama_model',
  geminiKey: 'stop_slop_gemini_key',
  geminiModel: 'stop_slop_gemini_model',
  openaiEndpoint: 'stop_slop_openai_endpoint',
  openaiKey: 'stop_slop_openai_key',
  openaiModel: 'stop_slop_openai_model'
};

// Cloud provider presets
const CLOUD_PRESETS = {
  groq: {
    endpoint: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile'
  },
  openai: {
    endpoint: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini'
  },
  openrouter: {
    endpoint: 'https://openrouter.ai/api/v1',
    model: 'meta-llama/llama-3.3-70b-instruct'
  },
  deepseek: {
    endpoint: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat'
  }
};

// --- State Management ---
const state = {
  activePersona: ARCHETYPES[0],
  customPersona: null,
  activeTab: 'rewrite',
  activeProvider: localStorage.getItem(STORAGE_KEYS.provider) || 'demo',
  providerConfigs: {
    demo: {},
    webllm: {
      model: localStorage.getItem(STORAGE_KEYS.webllmModel) || 'Llama-3.2-1B-Instruct-q4f16_1-MLC'
    },
    ollama: {
      endpoint: localStorage.getItem(STORAGE_KEYS.ollamaEndpoint) || 'http://localhost:11434',
      model: localStorage.getItem(STORAGE_KEYS.ollamaModel) || 'llama3.2'
    },
    gemini: {
      apiKey: localStorage.getItem(STORAGE_KEYS.geminiKey) || localStorage.getItem('stop_slop_api_key') || '',
      model: localStorage.getItem(STORAGE_KEYS.geminiModel) || 'gemini-2.0-flash'
    },
    'chrome-ai': {},
    openai: {
      endpoint: localStorage.getItem(STORAGE_KEYS.openaiEndpoint) || 'https://api.groq.com/openai/v1',
      apiKey: localStorage.getItem(STORAGE_KEYS.openaiKey) || '',
      model: localStorage.getItem(STORAGE_KEYS.openaiModel) || 'llama-3.3-70b-versatile'
    }
  },
  lastResult: null,
  deferredInstallPrompt: null
};

// Helper: Get active engine parameters for pipeline execution
function getActiveEngineConfig() {
  const p = state.activeProvider;
  const cfg = state.providerConfigs[p] || {};
  return {
    provider: p,
    apiKey: cfg.apiKey || '',
    endpoint: cfg.endpoint || '',
    model: cfg.model || ''
  };
}

// --- DOM References ---
const sourceTextEl = document.getElementById('source-text');
const presetSelectorEl = document.getElementById('preset-selector');
const clearInputBtn = document.getElementById('clear-input-btn');
const inputStatsBadge = document.getElementById('input-stats-badge');
const personaChipsContainer = document.getElementById('persona-chips-container');
const personaDescText = document.getElementById('persona-desc-text');
const personaCardYaml = document.getElementById('persona-card-yaml');
const toggleCardYamlBtn = document.getElementById('toggle-card-yaml-btn');
const extractPersonaBtn = document.getElementById('extract-persona-btn');
const runPipelineBtn = document.getElementById('run-pipeline-btn');
const detectOnlyBtn = document.getElementById('detect-only-btn');

// Stepper & Drawer
const stepNodes = [1, 2, 3, 4].map(n => document.getElementById(`step-node-${n}`));
const stepConnectors = [1, 2, 3].map(n => document.getElementById(`step-connector-${n}`));
const stepDetailsDrawer = document.getElementById('step-details-drawer');
const drawerTitle = document.getElementById('drawer-title');
const drawerContent = document.getElementById('drawer-content');
const closeDrawerBtn = document.getElementById('close-drawer-btn');

// Output Tabs & Content
const tabPills = document.querySelectorAll('.tab-pill');
const tabPanes = {
  rewrite: document.getElementById('tab-pane-rewrite'),
  diff: document.getElementById('tab-pane-diff'),
  stylometrics: document.getElementById('tab-pane-stylometrics')
};
const outputProseBox = document.getElementById('output-prose-box');
const diffOriginalContent = document.getElementById('diff-original-content');
const diffTransformedContent = document.getElementById('diff-transformed-content');
const copyOutputBtn = document.getElementById('copy-output-btn');
const downloadOutputBtn = document.getElementById('download-output-btn');

// Metrics & Findings
const metricScore = document.getElementById('metric-score');
const metricScoreDelta = document.getElementById('metric-score-delta');
const metricTtr = document.getElementById('metric-ttr');
const metricBurstiness = document.getElementById('metric-burstiness');
const metricTells = document.getElementById('metric-tells');
const findingsList = document.getElementById('findings-list');

// Engine Modal
const engineSelectorBtn = document.getElementById('engine-selector-btn');
const engineModal = document.getElementById('engine-modal');
const closeEngineModalBtn = document.getElementById('close-engine-modal-btn');
const currentEngineLabel = document.getElementById('current-engine-label');
const engineStatusDot = document.getElementById('engine-status-dot');
const engineTabs = document.querySelectorAll('.engine-tab');
const providerPanes = {
  demo: document.getElementById('pane-demo'),
  webllm: document.getElementById('pane-webllm'),
  ollama: document.getElementById('pane-ollama'),
  gemini: document.getElementById('pane-gemini'),
  'chrome-ai': document.getElementById('pane-chrome-ai'),
  openai: document.getElementById('pane-openai')
};
const saveEngineBtn = document.getElementById('save-engine-btn');

// Modal Input Elements
const webllmModelSelect = document.getElementById('webllm-model');
const testWebllmBtn = document.getElementById('test-webllm-btn');
const webllmProgressContainer = document.getElementById('webllm-progress-container');
const webllmProgressBar = document.getElementById('webllm-progress-bar');
const webllmProgressText = document.getElementById('webllm-progress-text');

const ollamaEndpointInput = document.getElementById('ollama-endpoint');
const ollamaModelInput = document.getElementById('ollama-model');
const ollamaModelSelect = document.getElementById('ollama-model-select');
const fetchOllamaModelsBtn = document.getElementById('fetch-ollama-models-btn');
const testOllamaBtn = document.getElementById('test-ollama-btn');

const geminiKeyInput = document.getElementById('gemini-key');
const geminiModelSelect = document.getElementById('gemini-model');
const testGeminiBtn = document.getElementById('test-gemini-btn');

const testChromeAiBtn = document.getElementById('test-chrome-ai-btn');

const cloudPresetSelect = document.getElementById('cloud-preset-select');
const openaiEndpointInput = document.getElementById('openai-endpoint');
const openaiKeyInput = document.getElementById('openai-key');
const openaiModelInput = document.getElementById('openai-model');
const testOpenaiBtn = document.getElementById('test-openai-btn');

// Persona Modal
const personaModal = document.getElementById('persona-modal');
const closePersonaModalBtn = document.getElementById('close-persona-modal-btn');
const sampleAuthorText = document.getElementById('sample-author-text');
const generateCustomPersonaBtn = document.getElementById('generate-custom-persona-btn');

// PWA Install Button
const pwaInstallBtn = document.getElementById('pwa-install-btn');

// --- Initialization ---
function init() {
  renderPresets();
  renderPersonaChips();
  updateEngineUI();
  setupEventListeners();
  setupPWA();
}

function setupPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.warn('SW registration failed:', err);
      });
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.deferredInstallPrompt = e;
    pwaInstallBtn.classList.remove('hidden');
  });

  pwaInstallBtn.addEventListener('click', async () => {
    if (state.deferredInstallPrompt) {
      state.deferredInstallPrompt.prompt();
      const choice = await state.deferredInstallPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        pwaInstallBtn.classList.add('hidden');
      }
      state.deferredInstallPrompt = null;
    }
  });
}

function renderPresets() {
  presetSelectorEl.innerHTML = '<option value="" disabled selected>✨ Load a sample draft...</option>';
  PRESETS.forEach(preset => {
    const opt = document.createElement('option');
    opt.value = preset.id;
    opt.textContent = preset.title;
    presetSelectorEl.appendChild(opt);
  });
}

function renderPersonaChips() {
  personaChipsContainer.innerHTML = '';
  const allPersonas = state.customPersona ? [state.customPersona, ...ARCHETYPES] : ARCHETYPES;

  allPersonas.forEach(p => {
    const chip = document.createElement('button');
    chip.className = `persona-chip ${p.id === state.activePersona.id ? 'active' : ''}`;
    chip.textContent = p.badge || p.name;
    chip.title = p.description;
    chip.addEventListener('click', () => selectPersona(p));
    personaChipsContainer.appendChild(chip);
  });

  updatePersonaDisplay();
}

function selectPersona(p) {
  state.activePersona = p;
  renderPersonaChips();
}

function updatePersonaDisplay() {
  const p = state.activePersona;
  personaDescText.textContent = p.description;
  personaCardYaml.textContent = formatPersonaYaml(p.card);
}

function updateInputWordCount() {
  const text = sourceTextEl.value.trim();
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  inputStatsBadge.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;
}

// --- Engine Settings UI Sync ---
function updateEngineUI() {
  const p = state.activeProvider;
  if (p === 'demo') {
    currentEngineLabel.textContent = 'Demo Simulation';
    engineStatusDot.style.background = '#10B981';
  } else if (p === 'webllm') {
    const model = state.providerConfigs.webllm.model || 'Llama 3.2 1B';
    const shortName = model.split('-')[0] + ' ' + (model.split('-')[1] || '');
    currentEngineLabel.textContent = `WebLLM (${shortName})`;
    engineStatusDot.style.background = '#06B6D4';
  } else if (p === 'chrome-ai') {
    currentEngineLabel.textContent = 'Chrome Nano';
    engineStatusDot.style.background = '#38BDF8';
  } else if (p === 'ollama') {
    currentEngineLabel.textContent = `Ollama (${state.providerConfigs.ollama.model || 'local'})`;
    engineStatusDot.style.background = '#818CF8';
  } else if (p === 'gemini') {
    const model = state.providerConfigs.gemini.model || 'gemini-2.0-flash';
    currentEngineLabel.textContent = `Gemini (${model.replace('gemini-', '')})`;
    engineStatusDot.style.background = '#F59E0B';
  } else {
    currentEngineLabel.textContent = `Cloud (${state.providerConfigs.openai.model || 'API'})`;
    engineStatusDot.style.background = '#C084FC';
  }
}

// Populate modal inputs from current state
function populateModalInputs() {
  // 1. Activate tab corresponding to active provider
  engineTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.provider === state.activeProvider);
  });
  Object.keys(providerPanes).forEach(k => {
    if (providerPanes[k]) {
      providerPanes[k].classList.toggle('hidden', k !== state.activeProvider);
    }
  });

  // 2. Populate inputs
  if (webllmModelSelect) {
    webllmModelSelect.value = state.providerConfigs.webllm.model;
  }
  if (ollamaEndpointInput) {
    ollamaEndpointInput.value = state.providerConfigs.ollama.endpoint;
  }
  if (ollamaModelInput) {
    ollamaModelInput.value = state.providerConfigs.ollama.model;
  }
  if (geminiKeyInput) {
    geminiKeyInput.value = state.providerConfigs.gemini.apiKey;
  }
  if (geminiModelSelect) {
    geminiModelSelect.value = state.providerConfigs.gemini.model;
  }
  if (openaiEndpointInput) {
    openaiEndpointInput.value = state.providerConfigs.openai.endpoint;
  }
  if (openaiKeyInput) {
    openaiKeyInput.value = state.providerConfigs.openai.apiKey;
  }
  if (openaiModelInput) {
    openaiModelInput.value = state.providerConfigs.openai.model;
  }

  // Clear previous feedback
  document.querySelectorAll('.test-feedback-box').forEach(el => {
    el.className = 'test-feedback-box hidden';
    el.textContent = '';
  });
}

function showFeedback(providerKey, type, message) {
  const fb = document.getElementById(`test-feedback-${providerKey}`);
  if (!fb) return;
  fb.className = `test-feedback-box ${type}`;
  fb.textContent = message;
  fb.classList.remove('hidden');
}

async function checkChromeAIStatus() {
  const status = await detectChromeAI();
  const dot = document.getElementById('chrome-dot');
  const title = document.getElementById('chrome-status-title');
  const desc = document.getElementById('chrome-status-desc');

  if (status.supported) {
    dot.className = 'status-indicator-dot ready';
    title.textContent = 'Chrome Built-in AI Ready';
    desc.textContent = 'Gemini Nano is active and available on this browser session!';
  } else {
    dot.className = 'status-indicator-dot disabled';
    title.textContent = 'Prompt API Not Detected';
    desc.textContent = 'Requires Chrome 127+ with chrome://flags/#prompt-api-for-gemini-nano enabled. You can use In-Browser WebLLM, Ollama, or Gemini API!';
  }
}

// --- Stepper UI Helpers ---
function resetStepper() {
  stepNodes.forEach(node => {
    node.className = 'step-node';
  });
  stepConnectors.forEach(c => c.className = 'step-connector');
  stepDetailsDrawer.classList.add('hidden');
}

function updateStepperState(stepNum, status) {
  const node = stepNodes[stepNum - 1];
  if (!node) return;

  if (status === 'running') {
    node.className = 'step-node running';
  } else if (status === 'completed') {
    node.className = 'step-node completed';
    if (stepNum > 1) {
      stepConnectors[stepNum - 2].className = 'step-connector active';
    }
  }
}

// --- Tabs Management ---
function switchTab(tabKey) {
  state.activeTab = tabKey;
  tabPills.forEach(pill => {
    pill.classList.toggle('active', pill.dataset.tab === tabKey);
  });
  Object.keys(tabPanes).forEach(k => {
    tabPanes[k].classList.toggle('hidden', k !== tabKey);
  });
}

// --- Execution Handlers ---
async function handleRunPipeline() {
  const text = sourceTextEl.value.trim();
  if (!text) {
    alert('Please enter or load some text to transform.');
    return;
  }

  const engineCfg = getActiveEngineConfig();

  // Basic validation before launch
  if (engineCfg.provider === 'gemini' && !engineCfg.apiKey) {
    alert('Google Gemini API Key is missing. Click the Engine badge in the top bar to enter your key.');
    engineSelectorBtn.click();
    return;
  }
  if ((engineCfg.provider === 'openai' || engineCfg.provider === 'groq') && !engineCfg.apiKey) {
    alert('API Key is missing for your cloud provider. Click the Engine badge to enter your key.');
    engineSelectorBtn.click();
    return;
  }

  runPipelineBtn.disabled = true;
  detectOnlyBtn.disabled = true;
  resetStepper();

  outputProseBox.innerHTML = `
    <div class="empty-state">
      <div class="engine-pulse-dot" style="width:20px;height:20px;margin-bottom:14px;"></div>
      <h3>Executing 4-Pass Cognitive Engine...</h3>
      <p id="stepper-live-status">Step 1: Extracting irreducible substance with ${currentEngineLabel.textContent}...</p>
    </div>
  `;

  try {
    const pipelineResult = await runCognitivePipeline({
      input: text,
      persona: state.activePersona,
      engineConfig: engineCfg,
      onStepUpdate: ({ step, name, status, data }) => {
        updateStepperState(step, status);
        const liveStatus = document.getElementById('stepper-live-status');
        if (liveStatus) liveStatus.textContent = `${name}...`;

        // Store step details on node click
        const node = stepNodes[step - 1];
        if (node && data) {
          node.onclick = () => {
            drawerTitle.textContent = name;
            drawerContent.textContent = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
            stepDetailsDrawer.classList.remove('hidden');
          };
        }
      }
    });

    state.lastResult = pipelineResult;
    renderResults(pipelineResult);
    switchTab('rewrite');
  } catch (err) {
    console.error('Pipeline error:', err);
    outputProseBox.innerHTML = `
      <div class="empty-state">
        <div style="font-size:2rem;margin-bottom:10px;">⚠️</div>
        <h3 style="color:var(--accent-rose);">Execution Error (${engineCfg.provider})</h3>
        <p style="color:var(--text-secondary);white-space:pre-wrap;text-align:left;max-width:550px;background:rgba(0,0,0,0.3);padding:14px;border-radius:8px;font-family:var(--font-mono);font-size:0.8rem;">${escapeHtml(err.message || String(err))}</p>
        <button id="open-settings-from-err-btn" class="btn btn-secondary btn-sm" style="margin-top:16px;">
          ⚙️ Open LLM Configuration
        </button>
      </div>
    `;
    const openBtn = document.getElementById('open-settings-from-err-btn');
    if (openBtn) {
      openBtn.addEventListener('click', () => engineSelectorBtn.click());
    }
  } finally {
    runPipelineBtn.disabled = false;
    detectOnlyBtn.disabled = false;
  }
}

function handleScanOnly() {
  const text = sourceTextEl.value.trim();
  if (!text) {
    alert('Please enter some text to scan.');
    return;
  }

  const lint = lintProse(text);
  renderMetricsAndFindings(lint, null);
  switchTab('stylometrics');
}

function renderResults(result) {
  // Render Tab 1: Prose
  outputProseBox.innerHTML = `<div class="rendered-prose-text" style="white-space: pre-wrap;">${escapeHtml(result.finalRewrite)}</div>`;

  // Render Tab 2: Diff
  renderDiffView(sourceTextEl.value, result.finalRewrite);

  // Render Tab 3: Metrics & Findings
  renderMetricsAndFindings(result.inputLint, result.outputLint);
}

function renderDiffView(original, rewritten) {
  diffOriginalContent.innerHTML = escapeHtml(original);
  diffTransformedContent.innerHTML = `<span class="highlight-add">${escapeHtml(rewritten)}</span>`;
}

function renderMetricsAndFindings(inputLint, outputLint) {
  const activeLint = outputLint || inputLint;

  metricScore.textContent = `${activeLint.score}/100`;
  if (outputLint && inputLint) {
    const diff = outputLint.score - inputLint.score;
    metricScoreDelta.textContent = diff >= 0 ? `+${diff} improvement` : `${diff}`;
  } else {
    metricScoreDelta.textContent = 'Initial scan';
  }

  metricTtr.textContent = activeLint.stats.ttr;
  metricBurstiness.textContent = `${activeLint.stats.burstiness}`;
  metricTells.textContent = activeLint.findings.length;

  // Findings list
  if (activeLint.findings.length === 0) {
    findingsList.innerHTML = `<div class="empty-findings" style="color:var(--accent-green);">✨ Zero synthetic tells detected. Cadence and vocabulary appear authentic!</div>`;
    return;
  }

  findingsList.innerHTML = activeLint.findings.map(f => `
    <div class="finding-item ${f.severity || 'info'}">
      <div class="finding-details">
        <span class="finding-label">${escapeHtml(f.label)}</span>
        <span class="finding-snippet">Category: ${escapeHtml(f.category)}</span>
      </div>
      <span class="finding-badge">${f.tier}</span>
    </div>
  `).join('');
}

function escapeHtml(str) {
  return (str || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[m]);
}

// --- Event Listeners Setup ---
function setupEventListeners() {
  sourceTextEl.addEventListener('input', updateInputWordCount);

  clearInputBtn.addEventListener('click', () => {
    sourceTextEl.value = '';
    updateInputWordCount();
  });

  presetSelectorEl.addEventListener('change', (e) => {
    const selected = PRESETS.find(p => p.id === e.target.value);
    if (selected) {
      sourceTextEl.value = selected.input;
      updateInputWordCount();
      const matchPersona = ARCHETYPES.find(a => a.id === selected.personaId);
      if (matchPersona) selectPersona(matchPersona);
    }
  });

  toggleCardYamlBtn.addEventListener('click', () => {
    personaCardYaml.classList.toggle('hidden');
    toggleCardYamlBtn.textContent = personaCardYaml.classList.contains('hidden') ? 'View Card YAML' : 'Hide Card YAML';
  });

  tabPills.forEach(pill => {
    pill.addEventListener('click', () => switchTab(pill.dataset.tab));
  });

  closeDrawerBtn.addEventListener('click', () => {
    stepDetailsDrawer.classList.add('hidden');
  });

  runPipelineBtn.addEventListener('click', handleRunPipeline);
  detectOnlyBtn.addEventListener('click', handleScanOnly);

  // Copy & Download
  copyOutputBtn.addEventListener('click', () => {
    if (state.lastResult?.finalRewrite) {
      navigator.clipboard.writeText(state.lastResult.finalRewrite);
      alert('Copied rewritten prose to clipboard!');
    }
  });

  downloadOutputBtn.addEventListener('click', () => {
    if (state.lastResult?.finalRewrite) {
      const blob = new Blob([state.lastResult.finalRewrite], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'humanized-prose.md';
      a.click();
      URL.revokeObjectURL(url);
    }
  });

  // Engine Modal Open/Close
  engineSelectorBtn.addEventListener('click', () => {
    populateModalInputs();
    engineModal.classList.remove('hidden');
    checkChromeAIStatus();
  });
  closeEngineModalBtn.addEventListener('click', () => engineModal.classList.add('hidden'));

  // Switch tabs inside modal
  engineTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      engineTabs.forEach(t => t.classList.toggle('active', t === tab));
      Object.keys(providerPanes).forEach(k => {
        if (providerPanes[k]) {
          providerPanes[k].classList.toggle('hidden', k !== tab.dataset.provider);
        }
      });
    });
  });

  // Cloud Preset selector dropdown
  if (cloudPresetSelect) {
    cloudPresetSelect.addEventListener('change', (e) => {
      const p = CLOUD_PRESETS[e.target.value];
      if (p) {
        openaiEndpointInput.value = p.endpoint;
        openaiModelInput.value = p.model;
      }
    });
  }

  // --- Test Connection Handlers ---

  // 1. WebLLM
  testWebllmBtn.addEventListener('click', async () => {
    if (!isWebGPUSupported()) {
      showFeedback('webllm', 'error', '❌ WebGPU is not supported in this browser. Please use Chrome 113+, Edge 113+, or enable WebGPU.');
      return;
    }
    const model = webllmModelSelect.value;
    testWebllmBtn.disabled = true;
    webllmProgressContainer.classList.remove('hidden');
    webllmProgressBar.style.width = '10%';
    webllmProgressText.textContent = `Downloading / Loading ${model}...`;
    showFeedback('webllm', 'info', 'Loading model weights. This is cached locally in browser storage after first download...');

    try {
      const res = await testProviderConnection({
        provider: 'webllm',
        model: model,
        onProgress: (text) => {
          webllmProgressText.textContent = text;
          // Approximate progress if available
          const match = text.match(/(\d+)%/);
          if (match) {
            webllmProgressBar.style.width = `${match[1]}%`;
          }
        }
      });
      webllmProgressBar.style.width = '100%';
      if (res.success) {
        showFeedback('webllm', 'success', `✓ ${res.message}`);
      } else {
        showFeedback('webllm', 'error', `❌ ${res.message}`);
      }
    } catch (err) {
      showFeedback('webllm', 'error', `❌ Error initializing WebLLM: ${err.message}`);
    } finally {
      testWebllmBtn.disabled = false;
    }
  });

  // 2. Ollama Fetch Models
  fetchOllamaModelsBtn.addEventListener('click', async () => {
    const endpoint = ollamaEndpointInput.value.trim() || 'http://localhost:11434';
    fetchOllamaModelsBtn.disabled = true;
    showFeedback('ollama', 'info', `Scanning Ollama at ${endpoint}...`);

    try {
      const models = await fetchOllamaModels(endpoint);
      if (models.length > 0) {
        ollamaModelSelect.innerHTML = models.map(m => `<option value="${m}">${m}</option>`).join('');
        ollamaModelSelect.classList.remove('hidden');
        ollamaModelInput.value = models[0];
        ollamaModelSelect.addEventListener('change', () => {
          ollamaModelInput.value = ollamaModelSelect.value;
        });
        showFeedback('ollama', 'success', `✓ Found ${models.length} installed model(s): ${models.join(', ')}`);
      } else {
        showFeedback('ollama', 'info', 'Connected to Ollama, but no models found. Run "ollama pull llama3.2".');
      }
    } catch (err) {
      showFeedback('ollama', 'error', `❌ ${err.message}`);
    } finally {
      fetchOllamaModelsBtn.disabled = false;
    }
  });

  // 3. Ollama Test Connection
  testOllamaBtn.addEventListener('click', async () => {
    const endpoint = ollamaEndpointInput.value.trim() || 'http://localhost:11434';
    const model = ollamaModelInput.value.trim() || 'llama3.2';
    testOllamaBtn.disabled = true;
    showFeedback('ollama', 'info', `Testing connection to Ollama with model "${model}"...`);

    try {
      const res = await testProviderConnection({
        provider: 'ollama',
        endpoint: endpoint,
        model: model
      });
      if (res.success) {
        showFeedback('ollama', 'success', `✓ ${res.message}`);
      } else {
        showFeedback('ollama', 'error', `❌ ${res.message}`);
      }
    } catch (err) {
      showFeedback('ollama', 'error', `❌ ${err.message}`);
    } finally {
      testOllamaBtn.disabled = false;
    }
  });

  // 4. Gemini Test
  testGeminiBtn.addEventListener('click', async () => {
    const key = geminiKeyInput.value.trim();
    const model = geminiModelSelect.value;
    if (!key) {
      showFeedback('gemini', 'error', '❌ Please enter your Gemini API Key first.');
      return;
    }
    testGeminiBtn.disabled = true;
    showFeedback('gemini', 'info', `Testing Gemini API with ${model}...`);

    try {
      const res = await testProviderConnection({
        provider: 'gemini',
        apiKey: key,
        model: model
      });
      if (res.success) {
        showFeedback('gemini', 'success', `✓ ${res.message}`);
      } else {
        showFeedback('gemini', 'error', `❌ ${res.message}`);
      }
    } catch (err) {
      showFeedback('gemini', 'error', `❌ ${err.message}`);
    } finally {
      testGeminiBtn.disabled = false;
    }
  });

  // 5. Chrome AI Test
  testChromeAiBtn.addEventListener('click', checkChromeAIStatus);

  // 6. Cloud API (OpenAI/Groq) Test
  testOpenaiBtn.addEventListener('click', async () => {
    const endpoint = openaiEndpointInput.value.trim();
    const key = openaiKeyInput.value.trim();
    const model = openaiModelInput.value.trim();
    if (!key) {
      showFeedback('openai', 'error', '❌ Please enter an API key.');
      return;
    }
    testOpenaiBtn.disabled = true;
    showFeedback('openai', 'info', `Testing connection to ${endpoint}...`);

    try {
      const res = await testProviderConnection({
        provider: 'openai',
        endpoint: endpoint,
        apiKey: key,
        model: model
      });
      if (res.success) {
        showFeedback('openai', 'success', `✓ ${res.message}`);
      } else {
        showFeedback('openai', 'error', `❌ ${res.message}`);
      }
    } catch (err) {
      showFeedback('openai', 'error', `❌ ${err.message}`);
    } finally {
      testOpenaiBtn.disabled = false;
    }
  });

  // --- Save Engine Settings ---
  saveEngineBtn.addEventListener('click', () => {
    const activeTab = document.querySelector('.engine-tab.active');
    const selectedProvider = activeTab ? activeTab.dataset.provider : 'demo';

    state.activeProvider = selectedProvider;

    // Persist all fields so user inputs are never lost when switching
    if (webllmModelSelect) {
      state.providerConfigs.webllm.model = webllmModelSelect.value;
      localStorage.setItem(STORAGE_KEYS.webllmModel, webllmModelSelect.value);
    }
    if (ollamaEndpointInput && ollamaModelInput) {
      state.providerConfigs.ollama.endpoint = ollamaEndpointInput.value.trim() || 'http://localhost:11434';
      state.providerConfigs.ollama.model = ollamaModelInput.value.trim() || 'llama3.2';
      localStorage.setItem(STORAGE_KEYS.ollamaEndpoint, state.providerConfigs.ollama.endpoint);
      localStorage.setItem(STORAGE_KEYS.ollamaModel, state.providerConfigs.ollama.model);
    }
    if (geminiKeyInput && geminiModelSelect) {
      state.providerConfigs.gemini.apiKey = geminiKeyInput.value.trim();
      state.providerConfigs.gemini.model = geminiModelSelect.value;
      localStorage.setItem(STORAGE_KEYS.geminiKey, state.providerConfigs.gemini.apiKey);
      localStorage.setItem(STORAGE_KEYS.geminiModel, state.providerConfigs.gemini.model);
    }
    if (openaiEndpointInput && openaiKeyInput && openaiModelInput) {
      state.providerConfigs.openai.endpoint = openaiEndpointInput.value.trim();
      state.providerConfigs.openai.apiKey = openaiKeyInput.value.trim();
      state.providerConfigs.openai.model = openaiModelInput.value.trim();
      localStorage.setItem(STORAGE_KEYS.openaiEndpoint, state.providerConfigs.openai.endpoint);
      localStorage.setItem(STORAGE_KEYS.openaiKey, state.providerConfigs.openai.apiKey);
      localStorage.setItem(STORAGE_KEYS.openaiModel, state.providerConfigs.openai.model);
    }

    localStorage.setItem(STORAGE_KEYS.provider, selectedProvider);

    updateEngineUI();
    engineModal.classList.add('hidden');
  });

  // Persona Modal
  extractPersonaBtn.addEventListener('click', () => {
    personaModal.classList.remove('hidden');
  });
  closePersonaModalBtn.addEventListener('click', () => personaModal.classList.add('hidden'));

  generateCustomPersonaBtn.addEventListener('click', () => {
    const sample = sampleAuthorText.value.trim();
    if (!sample) {
      alert('Please paste a writing sample first.');
      return;
    }

    const words = sample.split(/\s+/).length;
    const isTechnical = /code|data|system|query|api|server|function|service/i.test(sample);
    
    state.customPersona = {
      id: 'custom-user-voice',
      name: 'My Extracted Voice',
      badge: '👤 My Voice',
      description: `Inferred persona based on ${words} words of sample writing. Stance: ${isTechnical ? 'operational' : 'empirical'}.`,
      card: {
        epistemic_stance: isTechnical ? 'operational_practitioner' : 'empirical_observational',
        audience_relationship: 'peer_colleague',
        shared_context: 'high',
        lexical_habits: {
          repetition_tolerance: 'high',
          formality_level: 'plain_spoken',
          metaphor_usage: 'rare'
        },
        asymmetry_tolerance: {
          allows_functional_plainness: true,
          allows_uneven_paragraph_lengths: true
        },
        focus_biases: {
          cares_about: ['concrete trade-offs', 'observed facts'],
          ignores: ['formulaic buzzwords', 'generic transitions']
        }
      }
    };

    selectPersona(state.customPersona);
    personaModal.classList.add('hidden');
    alert('Custom Author Voice extracted and applied!');
  });
}

// Run on load
document.addEventListener('DOMContentLoaded', init);
