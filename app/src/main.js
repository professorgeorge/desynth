import {
  ARCHETYPES,
  CLASSIC_PERSONAS,
  ALL_PERSONAS,
  findPersonaById,
  formatPersonaYaml
} from './engine/personas.js';
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
  openaiModel: 'stop_slop_openai_model',
  customPersona: 'stop_slop_custom_persona',
  activePersonaId: 'stop_slop_active_persona_id'
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

// Retrieve preserved custom persona if exists
function loadSavedCustomPersona() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.customPersona);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Could not parse stored custom persona:', e);
  }
  return null;
}

// Initial active persona resolution
const savedCustomPersona = loadSavedCustomPersona();
const savedPersonaId = localStorage.getItem(STORAGE_KEYS.activePersonaId);

let initialActivePersona = CLASSIC_PERSONAS[0]; // Default to Bertrand Russell
if (savedCustomPersona && (!savedPersonaId || savedPersonaId === 'custom-user-voice')) {
  initialActivePersona = savedCustomPersona;
} else if (savedPersonaId) {
  if (savedPersonaId === 'custom-user-voice' && savedCustomPersona) {
    initialActivePersona = savedCustomPersona;
  } else {
    initialActivePersona = findPersonaById(savedPersonaId);
  }
}

// --- Application State ---
const state = {
  currentStage: 1,
  activePersona: initialActivePersona,
  customPersona: savedCustomPersona,
  activeResultTab: 'rewrite',
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
  activeModalPersona: null,
  deferredInstallPrompt: null
};

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

// Top Stepper Bar
const stageNavItems = [1, 2, 3].map(n => document.getElementById(`nav-stage-${n}`));
const stagePanels = [1, 2, 3].map(n => document.getElementById(`stage-panel-${n}`));
const activeVoicePill = document.getElementById('active-voice-pill');
const draftStatusPill = document.getElementById('draft-status-pill');

// Stage 1: Voice Calibration
const heroVoiceBadge = document.getElementById('hero-voice-badge');
const heroEraBadge = document.getElementById('hero-era-badge');
const heroPersistedPill = document.getElementById('hero-persisted-pill');
const heroVoiceName = document.getElementById('hero-voice-name');
const heroVoiceDesc = document.getElementById('hero-voice-desc');
const heroTraitsContainer = document.getElementById('hero-traits-container');
const toggleHeroYamlBtn = document.getElementById('toggle-hero-yaml-btn');
const personaCardYaml = document.getElementById('persona-card-yaml');
const clearCustomVoiceBtn = document.getElementById('clear-custom-voice-btn');
const stageFooterVoiceLabel = document.getElementById('stage-footer-voice-label');
const gotoStage2Btn = document.getElementById('goto-stage-2-btn');

// Voice Tabs
const voiceTabs = document.querySelectorAll('.voice-tab');
const voicePanes = {
  'my-voice': document.getElementById('vpane-my-voice'),
  'classic-masters': document.getElementById('vpane-classic-masters'),
  'modern-archetypes': document.getElementById('vpane-modern-archetypes')
};
const voiceDropzone = document.getElementById('voice-dropzone');
const voiceFileInput = document.getElementById('voice-file-input');
const sampleAuthorText = document.getElementById('sample-author-text');
const extractSaveVoiceBtn = document.getElementById('extract-save-voice-btn');
const customVoiceStatusMsg = document.getElementById('custom-voice-status-msg');
const classicMastersGrid = document.getElementById('classic-masters-grid');
const modernArchetypesGrid = document.getElementById('modern-archetypes-grid');

// Stage 2: Target Draft
const sourceTextEl = document.getElementById('source-text');
const presetSelectorEl = document.getElementById('preset-selector');
const clearInputBtn = document.getElementById('clear-input-btn');
const inputStatsBadge = document.getElementById('input-stats-badge');
const loadedFileName = document.getElementById('loaded-file-name');
const draftDropzone = document.getElementById('draft-dropzone');
const draftFileInput = document.getElementById('draft-file-input');
const radarTellsBadge = document.getElementById('radar-tells-badge');
const radarChipsContainer = document.getElementById('radar-chips-container');
const backToStage1Btn = document.getElementById('back-to-stage-1-btn');
const detectOnlyBtn = document.getElementById('detect-only-btn');
const runPipelineBtn = document.getElementById('run-pipeline-btn');
const runButtonLabel = document.getElementById('run-button-label');

// Stage 3: Mastering Studio
const backToStage2Btn = document.getElementById('back-to-stage-2-btn');
const stage3BackBtn = document.getElementById('stage-3-back-btn');
const stage3RestartBtn = document.getElementById('stage-3-restart-btn');
const stepNodes = [1, 2, 3, 4].map(n => document.getElementById(`step-node-${n}`));
const stepConnectors = [1, 2, 3].map(n => document.getElementById(`step-connector-${n}`));
const stepDetailsDrawer = document.getElementById('step-details-drawer');
const drawerTitle = document.getElementById('drawer-title');
const drawerContent = document.getElementById('drawer-content');
const closeDrawerBtn = document.getElementById('close-drawer-btn');

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

// Stylometrics Metrics
const metricScore = document.getElementById('metric-score');
const metricScoreDelta = document.getElementById('metric-score-delta');
const metricTtr = document.getElementById('metric-ttr');
const metricBurstiness = document.getElementById('metric-burstiness');
const metricTells = document.getElementById('metric-tells');
const findingsList = document.getElementById('findings-list');

// Historical Excerpt Preview Modal
const excerptModal = document.getElementById('excerpt-modal');
const excerptModalTitle = document.getElementById('excerpt-modal-title');
const closeExcerptModalBtn = document.getElementById('close-excerpt-modal-btn');
const excerptAuthorName = document.getElementById('excerpt-author-name');
const excerptEra = document.getElementById('excerpt-era');
const excerptDomain = document.getElementById('excerpt-domain');
const excerptQuoteText = document.getElementById('excerpt-quote-text');
const selectExcerptVoiceBtn = document.getElementById('select-excerpt-voice-btn');

// LLM Engine Modal
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

const pwaInstallBtn = document.getElementById('pwa-install-btn');

// --- Initialization ---
function init() {
  renderPresetSelector();
  renderClassicMasters();
  renderModernArchetypes();
  updateActiveHeroVoiceDisplay();
  updateEngineUI();
  setupEventListeners();
  setupDragAndDrop();
  setupPWA();

  // If a saved custom persona is present, pre-fill sample text indicator
  if (state.customPersona) {
    customVoiceStatusMsg.textContent = '✓ Voice DNA active & saved in local storage.';
  }
}

// --- Stage Navigation ---
function switchStage(stageNum) {
  state.currentStage = stageNum;
  stageNavItems.forEach((btn, idx) => {
    btn.classList.toggle('active', idx + 1 === stageNum);
  });
  stagePanels.forEach((panel, idx) => {
    panel.classList.toggle('hidden', idx + 1 !== stageNum);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- Persona Management & Rendering ---

function updateActiveHeroVoiceDisplay() {
  const p = state.activePersona;
  const isCustom = p.id === 'custom-user-voice';

  heroVoiceBadge.textContent = p.badge || p.name;
  heroEraBadge.textContent = p.era || (isCustom ? 'User Personal DNA' : (p.domain || 'Field Archetype'));
  heroVoiceName.textContent = p.name;
  heroVoiceDesc.textContent = p.description;

  // Saved voice indicator
  heroPersistedPill.classList.toggle('hidden', !isCustom);
  clearCustomVoiceBtn.classList.toggle('hidden', !isCustom);

  // Traits row
  heroTraitsContainer.innerHTML = '';
  const traits = [
    p.card?.epistemic_stance?.replace(/_/g, ' ') || 'empirical observational',
    p.card?.lexical_habits?.formality_level?.replace(/_/g, ' ') || 'plain spoken',
    p.card?.audience_relationship?.replace(/_/g, ' ') || 'peer colleague'
  ];
  traits.forEach(t => {
    const pill = document.createElement('span');
    pill.className = 'trait-pill';
    pill.textContent = t;
    heroTraitsContainer.appendChild(pill);
  });

  personaCardYaml.textContent = formatPersonaYaml(p.card);

  // Stepper subtext and footer labels
  activeVoicePill.textContent = `Active: ${p.name}`;
  stageFooterVoiceLabel.textContent = p.name;
  runButtonLabel.textContent = `✨ Humanize in ${p.name} →`;

  // Highlight active cards in grids
  document.querySelectorAll('.master-card').forEach(c => {
    c.classList.toggle('active', c.dataset.personaId === p.id);
    const selectBtn = c.querySelector('.select-voice-btn');
    if (selectBtn) {
      selectBtn.textContent = c.dataset.personaId === p.id ? '✓ Active Voice' : 'Select This Voice';
      selectBtn.classList.toggle('btn-primary', c.dataset.personaId === p.id);
      selectBtn.classList.toggle('btn-secondary', c.dataset.personaId !== p.id);
    }
  });
}

function selectPersona(persona) {
  state.activePersona = persona;
  localStorage.setItem(STORAGE_KEYS.activePersonaId, persona.id);
  updateActiveHeroVoiceDisplay();
}

function renderClassicMasters() {
  classicMastersGrid.innerHTML = '';
  CLASSIC_PERSONAS.forEach(p => {
    const card = document.createElement('div');
    card.className = `master-card ${p.id === state.activePersona.id ? 'active' : ''}`;
    card.dataset.personaId = p.id;

    card.innerHTML = `
      <div class="master-card-header">
        <div class="master-meta-row">
          <span class="hero-voice-badge">${p.badge}</span>
          <span class="hero-era-badge">${p.era}</span>
        </div>
        <span class="master-domain-badge">${p.domain}</span>
        <h4 class="master-card-title">${p.name}</h4>
        <p class="master-card-desc">${p.description}</p>
      </div>
      <div class="master-card-actions">
        <button type="button" class="preview-excerpt-btn" title="Read original pre-AI passage">
          👁️ Read Pre-AI Sample
        </button>
        <button type="button" class="btn btn-sm select-voice-btn ${p.id === state.activePersona.id ? 'btn-primary' : 'btn-secondary'}">
          ${p.id === state.activePersona.id ? '✓ Active Voice' : 'Select This Voice'}
        </button>
      </div>
    `;

    // Click on excerpt button opens modal
    card.querySelector('.preview-excerpt-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openExcerptModal(p);
    });

    // Select button
    card.querySelector('.select-voice-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      selectPersona(p);
    });

    // Clicking card selects it
    card.addEventListener('click', () => selectPersona(p));

    classicMastersGrid.appendChild(card);
  });
}

function renderModernArchetypes() {
  modernArchetypesGrid.innerHTML = '';
  ARCHETYPES.forEach(p => {
    const card = document.createElement('div');
    card.className = `master-card ${p.id === state.activePersona.id ? 'active' : ''}`;
    card.dataset.personaId = p.id;

    card.innerHTML = `
      <div class="master-card-header">
        <div class="master-meta-row">
          <span class="hero-voice-badge">${p.badge}</span>
          <span class="master-domain-badge">${p.domain}</span>
        </div>
        <h4 class="master-card-title">${p.name}</h4>
        <p class="master-card-desc">${p.description}</p>
      </div>
      <div class="master-card-actions">
        <span></span>
        <button type="button" class="btn btn-sm select-voice-btn ${p.id === state.activePersona.id ? 'btn-primary' : 'btn-secondary'}">
          ${p.id === state.activePersona.id ? '✓ Active Voice' : 'Select This Voice'}
        </button>
      </div>
    `;

    card.querySelector('.select-voice-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      selectPersona(p);
    });

    card.addEventListener('click', () => selectPersona(p));

    modernArchetypesGrid.appendChild(card);
  });
}

function openExcerptModal(persona) {
  state.activeModalPersona = persona;
  excerptModalTitle.textContent = `${persona.name} — Authentic Pre-AI Writing`;
  excerptAuthorName.textContent = persona.name;
  excerptEra.textContent = persona.era;
  excerptDomain.textContent = persona.domain;
  excerptQuoteText.textContent = `"${persona.sampleExcerpt}"`;
  excerptModal.classList.remove('hidden');
}

// Extract and Persist Custom Author Voice
function extractAndSaveUserVoice(sampleText) {
  const clean = (sampleText || '').trim();
  if (!clean || clean.length < 50) {
    alert('Please provide at least 1–2 paragraphs (50+ characters) of writing to analyze your authentic cadence.');
    return;
  }

  const words = clean.split(/\s+/).length;
  const isTechnical = /code|data|system|query|api|server|function|service|database|latency|cache/i.test(clean);
  const isPhilosophical = /truth|logic|mind|belief|knowledge|question|reason|paradox/i.test(clean);
  const formality = clean.includes("I'm") || clean.includes("we're") || clean.includes("don't") ? 'conversational' : 'plain_spoken';

  const stance = isPhilosophical
    ? 'analytic_skeptical'
    : isTechnical
    ? 'operational_practitioner'
    : 'empirical_observational';

  const customPersona = {
    id: 'custom-user-voice',
    name: 'My Saved Voice',
    badge: '👤 My Voice DNA',
    era: 'User Personal DNA (Saved)',
    domain: isTechnical ? 'Technical Engineering' : isPhilosophical ? 'Analytical / Logical' : 'Empirical Observation',
    description: `Extracted from ${words} words of authentic personal writing. Calibrated for ${stance.replace(/_/g, ' ')}.`,
    sampleExcerpt: clean.slice(0, 300) + '...',
    card: {
      epistemic_stance: stance,
      audience_relationship: 'peer_colleague',
      shared_context: 'high',
      lexical_habits: {
        repetition_tolerance: 'high (uses precise terms naturally)',
        formality_level: formality,
        metaphor_usage: 'rare (prefers concrete mechanics)'
      },
      asymmetry_tolerance: {
        allows_functional_plainness: true,
        allows_uneven_paragraph_lengths: true,
        allows_unresolved_asides: true
      },
      focus_biases: {
        cares_about: ['concrete trade-offs', 'observed facts', 'unvarnished mechanics'],
        ignores: ['formulaic buzzwords', 'generic transitions', 'performative excitement']
      }
    }
  };

  state.customPersona = customPersona;
  localStorage.setItem(STORAGE_KEYS.customPersona, JSON.stringify(customPersona));
  selectPersona(customPersona);

  customVoiceStatusMsg.textContent = `✓ Voice DNA extracted from ${words} words and saved in local storage!`;
  alert('✨ Your Author Voice DNA has been calibrated and saved! It will remain active across sessions until you clear it.');
}

function clearCustomVoice() {
  if (confirm('Clear your custom voice DNA from local storage?')) {
    state.customPersona = null;
    localStorage.removeItem(STORAGE_KEYS.customPersona);
    sampleAuthorText.value = '';
    customVoiceStatusMsg.textContent = '';
    selectPersona(CLASSIC_PERSONAS[0]);
    alert('Custom voice cleared. Active voice reset to Bertrand Russell.');
  }
}

// --- Draft Handling & Live Tell Radar ---

function renderPresetSelector() {
  presetSelectorEl.innerHTML = '<option value="" disabled selected>✨ Load sample draft...</option>';
  PRESETS.forEach(preset => {
    const opt = document.createElement('option');
    opt.value = preset.id;
    opt.textContent = preset.title;
    presetSelectorEl.appendChild(opt);
  });
}

function updateDraftWordCountAndRadar() {
  const text = sourceTextEl.value.trim();
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  inputStatsBadge.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;

  if (!text) {
    draftStatusPill.textContent = 'Draft empty';
    radarTellsBadge.textContent = '0 Tells Detected';
    radarTellsBadge.className = 'radar-badge clean';
    radarChipsContainer.innerHTML = '<span class="empty-radar-text">Type or load text above to scan for synthetic AI markers.</span>';
    return;
  }

  // Live Scan with linter
  const lint = lintProse(text);
  const tellCount = lint.findings.length;

  draftStatusPill.textContent = `${words} words • ${tellCount} tell${tellCount === 1 ? '' : 's'}`;
  radarTellsBadge.textContent = `${tellCount} Tell${tellCount === 1 ? '' : 's'} Detected (Score: ${lint.score}/100)`;
  radarTellsBadge.className = `radar-badge ${tellCount === 0 ? 'clean' : ''}`;

  if (tellCount === 0) {
    radarChipsContainer.innerHTML = '<span class="empty-radar-text" style="color:var(--accent-green);">✨ Zero synthetic tells detected. Cadence and vocabulary appear authentic!</span>';
    return;
  }

  // Display top detected tells
  radarChipsContainer.innerHTML = lint.findings.slice(0, 10).map(f => `
    <span class="radar-tell-chip" title="${escapeHtml(f.category)}: ${escapeHtml(f.label)}">
      ${escapeHtml(f.label)}
    </span>
  `).join('');
}

// --- Drag & Drop File Uploads ---

function setupDragAndDrop() {
  // 1. Voice Dropzone
  setupFileDrop(
    voiceDropzone,
    voiceFileInput,
    (content, fileName) => {
      sampleAuthorText.value = content;
      extractAndSaveUserVoice(content);
    }
  );

  // 2. Draft Dropzone
  setupFileDrop(
    draftDropzone,
    draftFileInput,
    (content, fileName) => {
      sourceTextEl.value = content;
      loadedFileName.textContent = `📄 ${fileName}`;
      loadedFileName.classList.remove('hidden');
      updateDraftWordCountAndRadar();
    }
  );
}

function setupFileDrop(dropzoneEl, fileInputEl, onFileRead) {
  if (!dropzoneEl || !fileInputEl) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzoneEl.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzoneEl.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzoneEl.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzoneEl.classList.remove('dragover');
    });
  });

  dropzoneEl.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      readFile(files[0], onFileRead);
    }
  });

  fileInputEl.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      readFile(files[0], onFileRead);
    }
  });
}

function readFile(file, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    callback(e.target.result, file.name);
  };
  reader.onerror = () => {
    alert(`Could not read file ${file.name}`);
  };
  reader.readAsText(file);
}

// --- Pipeline Execution Handlers ---

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

async function handleRunPipeline() {
  const text = sourceTextEl.value.trim();
  if (!text) {
    alert('Please enter or drop a draft file to sanitize.');
    return;
  }

  const engineCfg = getActiveEngineConfig();

  // Validate credentials if needed
  if (engineCfg.provider === 'gemini' && !engineCfg.apiKey) {
    alert('Google Gemini API Key is missing. Click the Engine badge in the top bar to configure it.');
    engineSelectorBtn.click();
    return;
  }
  if ((engineCfg.provider === 'openai' || engineCfg.provider === 'groq') && !engineCfg.apiKey) {
    alert('API Key is missing for your cloud provider. Click the Engine badge to configure it.');
    engineSelectorBtn.click();
    return;
  }

  // Switch to Stage 3 Studio
  switchStage(3);
  runPipelineBtn.disabled = true;
  detectOnlyBtn.disabled = true;
  resetStepper();

  outputProseBox.innerHTML = `
    <div class="empty-state">
      <div class="engine-pulse-dot" style="width:20px;height:20px;margin-bottom:14px;"></div>
      <h3>Executing 4-Pass Cognitive Engine...</h3>
      <p id="stepper-live-status">Step 1: Extracting irreducible substance using ${state.activePersona.name} stance...</p>
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
    switchResultTab('rewrite');
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
  switchStage(3);
  renderMetricsAndFindings(lint, null);
  switchResultTab('stylometrics');
}

function renderResults(result) {
  outputProseBox.innerHTML = `<div class="rendered-prose-text" style="white-space: pre-wrap;">${escapeHtml(result.finalRewrite)}</div>`;
  renderDiffView(sourceTextEl.value, result.finalRewrite);
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

function switchResultTab(tabKey) {
  state.activeResultTab = tabKey;
  tabPills.forEach(pill => {
    pill.classList.toggle('active', pill.dataset.tab === tabKey);
  });
  Object.keys(tabPanes).forEach(k => {
    tabPanes[k].classList.toggle('hidden', k !== tabKey);
  });
}

function escapeHtml(str) {
  return (str || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[m]);
}

// --- Engine Configuration Modal Handlers ---

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

function populateModalInputs() {
  engineTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.provider === state.activeProvider);
  });
  Object.keys(providerPanes).forEach(k => {
    if (providerPanes[k]) {
      providerPanes[k].classList.toggle('hidden', k !== state.activeProvider);
    }
  });

  if (webllmModelSelect) webllmModelSelect.value = state.providerConfigs.webllm.model;
  if (ollamaEndpointInput) ollamaEndpointInput.value = state.providerConfigs.ollama.endpoint;
  if (ollamaModelInput) ollamaModelInput.value = state.providerConfigs.ollama.model;
  if (geminiKeyInput) geminiKeyInput.value = state.providerConfigs.gemini.apiKey;
  if (geminiModelSelect) geminiModelSelect.value = state.providerConfigs.gemini.model;
  if (openaiEndpointInput) openaiEndpointInput.value = state.providerConfigs.openai.endpoint;
  if (openaiKeyInput) openaiKeyInput.value = state.providerConfigs.openai.apiKey;
  if (openaiModelInput) openaiModelInput.value = state.providerConfigs.openai.model;

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

// --- Event Listeners Setup ---

function setupEventListeners() {
  // Stepper Bar Stage Selection
  stageNavItems.forEach(btn => {
    btn.addEventListener('click', () => switchStage(parseInt(btn.dataset.stage, 10)));
  });

  // Stage 1 controls
  gotoStage2Btn.addEventListener('click', () => switchStage(2));
  toggleHeroYamlBtn.addEventListener('click', () => {
    personaCardYaml.classList.toggle('hidden');
    toggleHeroYamlBtn.textContent = personaCardYaml.classList.contains('hidden') ? '📄 View Voice Card YAML' : 'Hide YAML';
  });
  clearCustomVoiceBtn.addEventListener('click', clearCustomVoice);

  // Voice Tabs
  voiceTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      voiceTabs.forEach(t => t.classList.toggle('active', t === tab));
      Object.keys(voicePanes).forEach(k => {
        voicePanes[k].classList.toggle('hidden', k !== tab.dataset.vtab);
      });
    });
  });

  // Custom Voice Extraction Button
  extractSaveVoiceBtn.addEventListener('click', () => {
    extractAndSaveUserVoice(sampleAuthorText.value);
  });

  // Excerpt Modal Controls
  closeExcerptModalBtn.addEventListener('click', () => excerptModal.classList.add('hidden'));
  selectExcerptVoiceBtn.addEventListener('click', () => {
    if (state.activeModalPersona) {
      selectPersona(state.activeModalPersona);
      excerptModal.classList.add('hidden');
    }
  });

  // Stage 2: Draft controls
  sourceTextEl.addEventListener('input', updateDraftWordCountAndRadar);

  clearInputBtn.addEventListener('click', () => {
    sourceTextEl.value = '';
    loadedFileName.classList.add('hidden');
    updateDraftWordCountAndRadar();
  });

  presetSelectorEl.addEventListener('change', (e) => {
    const selected = PRESETS.find(p => p.id === e.target.value);
    if (selected) {
      sourceTextEl.value = selected.input;
      loadedFileName.textContent = `✨ ${selected.title}`;
      loadedFileName.classList.remove('hidden');
      updateDraftWordCountAndRadar();

      // If preset has associated persona, select it automatically
      const match = ALL_PERSONAS.find(a => a.id === selected.personaId);
      if (match) selectPersona(match);
    }
  });

  backToStage1Btn.addEventListener('click', () => switchStage(1));
  detectOnlyBtn.addEventListener('click', handleScanOnly);
  runPipelineBtn.addEventListener('click', handleRunPipeline);

  // Stage 3: Mastering Studio controls
  backToStage2Btn.addEventListener('click', () => switchStage(2));
  stage3BackBtn.addEventListener('click', () => switchStage(2));
  stage3RestartBtn.addEventListener('click', handleRunPipeline);

  closeDrawerBtn.addEventListener('click', () => {
    stepDetailsDrawer.classList.add('hidden');
  });

  tabPills.forEach(pill => {
    pill.addEventListener('click', () => switchResultTab(pill.dataset.tab));
  });

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
      a.download = `${state.activePersona.name.toLowerCase().replace(/\s+/g, '-')}-humanized.md`;
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

  if (cloudPresetSelect) {
    cloudPresetSelect.addEventListener('change', (e) => {
      const p = CLOUD_PRESETS[e.target.value];
      if (p) {
        openaiEndpointInput.value = p.endpoint;
        openaiModelInput.value = p.model;
      }
    });
  }

  // Engine Test Connection Handlers
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
    showFeedback('webllm', 'info', 'Loading model weights into browser cache...');

    try {
      const res = await testProviderConnection({
        provider: 'webllm',
        model: model,
        onProgress: (text) => {
          webllmProgressText.textContent = text;
          const match = text.match(/(\d+)%/);
          if (match) webllmProgressBar.style.width = `${match[1]}%`;
        }
      });
      webllmProgressBar.style.width = '100%';
      showFeedback('webllm', res.success ? 'success' : 'error', res.message);
    } catch (err) {
      showFeedback('webllm', 'error', `❌ Error initializing WebLLM: ${err.message}`);
    } finally {
      testWebllmBtn.disabled = false;
    }
  });

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
      showFeedback('ollama', res.success ? 'success' : 'error', res.message);
    } catch (err) {
      showFeedback('ollama', 'error', `❌ ${err.message}`);
    } finally {
      testOllamaBtn.disabled = false;
    }
  });

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
      showFeedback('gemini', res.success ? 'success' : 'error', res.message);
    } catch (err) {
      showFeedback('gemini', 'error', `❌ ${err.message}`);
    } finally {
      testGeminiBtn.disabled = false;
    }
  });

  testChromeAiBtn.addEventListener('click', checkChromeAIStatus);

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
      showFeedback('openai', res.success ? 'success' : 'error', res.message);
    } catch (err) {
      showFeedback('openai', 'error', `❌ ${err.message}`);
    } finally {
      testOpenaiBtn.disabled = false;
    }
  });

  saveEngineBtn.addEventListener('click', () => {
    const activeTab = document.querySelector('.engine-tab.active');
    const selectedProvider = activeTab ? activeTab.dataset.provider : 'demo';

    state.activeProvider = selectedProvider;

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

// Run on load
document.addEventListener('DOMContentLoaded', init);
