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
import { extractTextFromFile } from './engine/file-parser.js';
import {
  analyzeAuthorStylometrics,
  buildPersonaFromStylometrics,
  analyzeAuthorWithAI,
  parseYamlToCard
} from './engine/stylometrics.js';
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
  customPersonas: 'stop_slop_custom_personas',
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

// Retrieve preserved custom personas list
function loadSavedCustomPersonas() {
  try {
    const rawList = localStorage.getItem(STORAGE_KEYS.customPersonas);
    if (rawList) {
      const parsed = JSON.parse(rawList);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // Backward compatibility: load legacy single custom persona
    const rawSingle = localStorage.getItem(STORAGE_KEYS.customPersona);
    if (rawSingle) {
      const single = JSON.parse(rawSingle);
      if (single && single.name) {
        if (!single.id) single.id = 'custom-user-voice-1';
        single.isCustom = true;
        const list = [single];
        localStorage.setItem(STORAGE_KEYS.customPersonas, JSON.stringify(list));
        return list;
      }
    }
  } catch (e) {
    console.warn('Could not parse stored custom personas:', e);
  }
  return [];
}

// Initial active persona resolution
const savedCustomPersonas = loadSavedCustomPersonas();
const savedPersonaId = localStorage.getItem(STORAGE_KEYS.activePersonaId);

let initialActivePersona = CLASSIC_PERSONAS[0]; // Default to Bertrand Russell or saved
if (savedPersonaId) {
  const customMatch = savedCustomPersonas.find(p => p.id === savedPersonaId);
  if (customMatch) {
    initialActivePersona = customMatch;
  } else if (savedPersonaId === 'custom-user-voice' && savedCustomPersonas.length > 0) {
    initialActivePersona = savedCustomPersonas[0];
  } else {
    initialActivePersona = findPersonaById(savedPersonaId);
  }
} else if (savedCustomPersonas.length > 0) {
  initialActivePersona = savedCustomPersonas[0];
}

// --- Application State ---
const state = {
  currentStage: 1,
  activePersona: initialActivePersona,
  customPersonas: savedCustomPersonas,
  customPersona: savedCustomPersonas[0] || null,
  activeVoiceFilter: 'all',
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

// Top Stepper Bar & Header Voice Controls
const stageNavItems = [1, 2, 3].map(n => document.getElementById(`nav-stage-${n}`));
const stagePanels = [1, 2, 3].map(n => document.getElementById(`stage-panel-${n}`));
const activeVoicePill = document.getElementById('active-voice-pill');
const draftStatusPill = document.getElementById('draft-status-pill');

// Global Home Navigation
const brandHomeBtn = document.getElementById('brand-home-btn');
const globalHomeBtn = document.getElementById('global-home-btn');
const stage3HomeBtn = document.getElementById('stage-3-home-btn');

// Global Header Voice
const voiceSelectorBtn = document.getElementById('voice-selector-btn');
const headerVoiceDot = document.getElementById('header-voice-dot');
const headerVoiceLabel = document.getElementById('header-voice-label');

// Voice Chooser Modal
const voiceModal = document.getElementById('voice-modal');
const closeVoiceModalBtn = document.getElementById('close-voice-modal-btn');
const closeVoiceModalDoneBtn = document.getElementById('close-voice-modal-done-btn');
const voiceModalTabs = document.querySelectorAll('.voice-modal-tab');
const voiceModalGrid = document.getElementById('voice-modal-grid');
const voiceModalActiveLabel = document.getElementById('voice-modal-active-label');
const modalPersonalCount = document.getElementById('modal-personal-count');
const modalCalibrateNewBtn = document.getElementById('modal-calibrate-new-btn');

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
const browseAllVoicesBtn = document.getElementById('browse-all-voices-btn');
const savedProfilesContainer = document.getElementById('saved-profiles-container');
const savedProfilesCount = document.getElementById('saved-profiles-count');
const savedProfilesList = document.getElementById('saved-profiles-list');
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
const extractAiVoiceBtn = document.getElementById('extract-ai-voice-btn');
const customVoiceStatusMsg = document.getElementById('custom-voice-status-msg');
const voiceStylometricsCard = document.getElementById('voice-stylometrics-card');
const auditStatsBadge = document.getElementById('audit-stats-badge');
const auditCadenceVal = document.getElementById('audit-cadence-val');
const auditCadenceSub = document.getElementById('audit-cadence-sub');
const auditTtrVal = document.getElementById('audit-ttr-val');
const auditTtrSub = document.getElementById('audit-ttr-sub');
const auditStanceVal = document.getElementById('audit-stance-val');
const auditStanceSub = document.getElementById('audit-stance-sub');
const auditEpistemicVal = document.getElementById('audit-epistemic-val');
const auditEpistemicSub = document.getElementById('audit-epistemic-sub');
const auditDistLabel = document.getElementById('audit-dist-label');
const barSegShort = document.getElementById('bar-seg-short');
const barSegMed = document.getElementById('bar-seg-med');
const barSegLong = document.getElementById('bar-seg-long');
const auditKeywordsContainer = document.getElementById('audit-keywords-container');
const auditPunctuationContainer = document.getElementById('audit-punctuation-container');
const classicMastersGrid = document.getElementById('classic-masters-grid');
const modernArchetypesGrid = document.getElementById('modern-archetypes-grid');

// Stage 2: Target Draft
const sourceTextEl = document.getElementById('source-text');
const presetSelectorEl = document.getElementById('preset-selector');
const densitySelectorEl = document.getElementById('density-selector');
const clearInputBtn = document.getElementById('clear-input-btn');
const inputStatsBadge = document.getElementById('input-stats-badge');
const loadedFileName = document.getElementById('loaded-file-name');
const stage2VoiceBtn = document.getElementById('stage2-voice-btn');
const stage2VoiceLabel = document.getElementById('stage2-voice-label');
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
  claims: document.getElementById('tab-pane-claims'),
  stylometrics: document.getElementById('tab-pane-stylometrics')
};
const outputProseBox = document.getElementById('output-prose-box');
const diffOriginalContent = document.getElementById('diff-original-content');
const diffTransformedContent = document.getElementById('diff-transformed-content');
const claimsContentBox = document.getElementById('claims-content-box');
const syntaxFramesBox = document.getElementById('syntax-frames-box');
const compressionBadge = document.getElementById('compression-badge');
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
const factoryResetBtn = document.getElementById('factory-reset-btn');
const resetEngineBtn = document.getElementById('reset-engine-btn');
const stage2EngineBtn = document.getElementById('stage2-engine-btn');
const stage2EngineDot = document.getElementById('stage2-engine-dot');
const stage2EngineLabel = document.getElementById('stage2-engine-label');

// --- Initialization ---
function init() {
  renderPresetSelector();
  renderClassicMasters();
  renderModernArchetypes();
  renderSavedProfilesList();
  updateActiveHeroVoiceDisplay();
  updateEngineUI();
  setupEventListeners();
  setupDragAndDrop();
  setupPWA();

  // If active persona is custom or custom profiles exist, pre-fill sample text indicator and render metrics
  if (state.activePersona && (state.activePersona.isCustom || state.activePersona.id.startsWith('custom-user-voice'))) {
    customVoiceStatusMsg.textContent = '✓ Voice DNA active & saved in local storage.';
    if (state.activePersona.metrics) {
      renderStylometricsAuditCard(state.activePersona.metrics);
    }
  } else if (state.customPersonas.length > 0) {
    customVoiceStatusMsg.textContent = `✓ ${state.customPersonas.length} personal profile voice(s) saved in local storage.`;
    if (state.customPersonas[0].metrics) {
      renderStylometricsAuditCard(state.customPersonas[0].metrics);
    }
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

function goHome() {
  switchStage(1);
  closeVoiceModal();
  if (excerptModal) excerptModal.classList.add('hidden');
  if (engineModal) engineModal.classList.add('hidden');
  if (stepDetailsDrawer) stepDetailsDrawer.classList.add('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- Persona Management & Rendering ---

function updateActiveHeroVoiceDisplay() {
  const p = state.activePersona;
  const isCustom = Boolean(p.isCustom || p.id.startsWith('custom-user-voice'));

  heroVoiceBadge.textContent = p.badge || p.name;
  heroEraBadge.textContent = p.era || (isCustom ? 'User Personal DNA' : (p.domain || 'Field Archetype'));
  heroVoiceName.textContent = p.name;
  heroVoiceDesc.textContent = p.description;

  // Saved voice indicator
  heroPersistedPill.classList.toggle('hidden', !isCustom);
  clearCustomVoiceBtn.classList.toggle('hidden', !isCustom);

  // Traits row
  heroTraitsContainer.innerHTML = '';
  let traits = [];
  if (isCustom && p.metrics) {
    traits = [
      `Cadence: ~${p.metrics.meanSentenceLength}w/sent`,
      `Burstiness: ${p.metrics.stdDevSentenceLength}`,
      `TTR: ${p.metrics.typeTokenRatio}`,
      p.card?.epistemic_stance?.replace(/_/g, ' ') || 'empirical'
    ];
  } else {
    traits = [
      p.card?.epistemic_stance?.replace(/_/g, ' ') || 'empirical observational',
      p.card?.lexical_habits?.formality_level?.replace(/_/g, ' ') || 'plain spoken',
      p.card?.audience_relationship?.replace(/_/g, ' ') || 'peer colleague'
    ];
  }
  traits.forEach(t => {
    const pill = document.createElement('span');
    pill.className = 'trait-pill';
    pill.textContent = t;
    heroTraitsContainer.appendChild(pill);
  });

  personaCardYaml.textContent = formatPersonaYaml(p.card);

  // Synchronize all voice labels across header, stepper, draft, and modals
  if (activeVoicePill) activeVoicePill.textContent = `Active: ${p.name} ▾`;
  if (headerVoiceLabel) headerVoiceLabel.textContent = p.name;
  if (stage2VoiceLabel) stage2VoiceLabel.textContent = `Voice: ${p.name}`;
  if (stageFooterVoiceLabel) stageFooterVoiceLabel.textContent = p.name;
  if (voiceModalActiveLabel) voiceModalActiveLabel.textContent = p.name;
  if (modalPersonalCount) modalPersonalCount.textContent = state.customPersonas.length;
  if (runButtonLabel) runButtonLabel.textContent = `✨ Humanize in ${p.name} →`;

  // Highlight active cards in grids
  document.querySelectorAll('.master-card, .voice-choice-card, .saved-profile-item').forEach(c => {
    const isThisCard = c.dataset.personaId === p.id;
    c.classList.toggle('active', isThisCard);
    const selectBtn = c.querySelector('.select-voice-btn, .select-voice-action-btn, .select-saved-profile-btn');
    if (selectBtn) {
      selectBtn.textContent = isThisCard ? '✓ Active Voice' : (selectBtn.classList.contains('select-saved-profile-btn') ? 'Active' : 'Select Voice');
      selectBtn.classList.toggle('btn-primary', isThisCard);
      selectBtn.classList.toggle('btn-secondary', !isThisCard);
    }
  });
}

function selectPersona(persona) {
  state.activePersona = persona;
  localStorage.setItem(STORAGE_KEYS.activePersonaId, persona.id);
  updateActiveHeroVoiceDisplay();
  renderSavedProfilesList();
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
  excerptModalTitle.textContent = `${persona.name}: Authentic Pre-AI Writing`;
  excerptAuthorName.textContent = persona.name;
  excerptEra.textContent = persona.era;
  excerptDomain.textContent = persona.domain;
  excerptQuoteText.textContent = `"${persona.sampleExcerpt}"`;
  excerptModal.classList.remove('hidden');
}

// --- Voice Chooser Modal & Multi-Profile Management ---

function renderVoiceModalGrid(filter = 'all') {
  if (!voiceModalGrid) return;
  voiceModalGrid.innerHTML = '';

  let list = [];
  if (filter === 'all') {
    list = [...state.customPersonas, ...CLASSIC_PERSONAS, ...ARCHETYPES];
  } else if (filter === 'personal') {
    list = state.customPersonas;
  } else if (filter === 'masters') {
    list = CLASSIC_PERSONAS;
  } else if (filter === 'archetypes') {
    list = ARCHETYPES;
  }

  if (list.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.style.cssText = 'grid-column: 1 / -1; padding: 36px 20px; text-align: center; background: var(--bg-surface); border: 1px dashed var(--border-subtle); border-radius: var(--radius-lg);';
    emptyDiv.innerHTML = `
      <div style="font-size: 2.2rem; margin-bottom: 10px;">👤</div>
      <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">No Personal Profiles Calibrated Yet</h4>
      <p style="font-size: 0.84rem; color: var(--text-secondary); max-width: 480px; margin: 0 auto 16px; line-height: 1.5;">
        Paste or drop 1–2 paragraphs of genuine text you wrote to compute and save your unique Author Voice DNA! You can store multiple profiles.
      </p>
      <button type="button" class="btn btn-primary btn-sm" id="empty-modal-calibrate-btn">➕ Calibrate Your Voice Now</button>
    `;
    emptyDiv.querySelector('#empty-modal-calibrate-btn').addEventListener('click', () => {
      closeVoiceModal();
      switchStage(1);
      switchVoiceTab('my-voice');
      if (sampleAuthorText) sampleAuthorText.focus();
    });
    voiceModalGrid.appendChild(emptyDiv);
    return;
  }

  list.forEach(p => {
    const isActive = p.id === state.activePersona.id;
    const isPersonal = Boolean(p.isCustom || p.id.startsWith('custom-user-voice'));

    const card = document.createElement('div');
    card.className = `voice-choice-card ${isActive ? 'active' : ''} ${isPersonal ? 'personal-card' : ''}`;
    card.dataset.personaId = p.id;

    let traits = [];
    if (isPersonal && p.metrics) {
      traits = [
        `~${p.metrics.meanSentenceLength}w/sent`,
        `Burstiness: ${p.metrics.stdDevSentenceLength}`,
        `TTR: ${p.metrics.typeTokenRatio}`
      ];
    } else if (p.card) {
      traits = [
        p.domain || 'General',
        p.card.epistemic_stance?.replace(/_/g, ' ') || 'empirical',
        p.card.lexical_habits?.formality_level?.replace(/_/g, ' ') || 'plain'
      ];
    }

    card.innerHTML = `
      <div class="choice-card-header">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span class="choice-card-badge">${escapeHtml(p.badge || p.name)}</span>
          ${p.era ? `<span class="hero-era-badge" style="font-size:0.68rem;padding:1px 6px;">${escapeHtml(p.era)}</span>` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          ${isActive ? '<span class="choice-active-pill">✓ Active</span>' : ''}
          ${isPersonal ? `<button type="button" class="delete-persona-btn" title="Delete this saved voice profile" data-del-id="${p.id}">🗑️</button>` : ''}
        </div>
      </div>
      <h4 class="choice-card-title">${escapeHtml(p.name)}</h4>
      <p class="choice-card-desc">${escapeHtml(p.description)}</p>
      <div class="choice-card-traits">
        ${traits.map(t => `<span class="trait-pill">${escapeHtml(t)}</span>`).join('')}
      </div>
      <div class="choice-card-footer">
        ${p.sampleExcerpt ? `<button type="button" class="btn btn-secondary btn-sm preview-excerpt-modal-btn" style="font-size:0.72rem;padding:3px 8px;">👁️ Sample</button>` : '<span></span>'}
        <button type="button" class="btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'} select-voice-action-btn" style="font-size:0.75rem;padding:4px 10px;">
          ${isActive ? '✓ Active Voice' : 'Select Voice'}
        </button>
      </div>
    `;

    // Preview excerpt
    const prevBtn = card.querySelector('.preview-excerpt-modal-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openExcerptModal(p);
      });
    }

    // Delete personal voice
    const delBtn = card.querySelector('.delete-persona-btn');
    if (delBtn) {
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deletePersonalVoice(p.id);
      });
    }

    // Select button
    const selectBtn = card.querySelector('.select-voice-action-btn');
    selectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectPersona(p);
      closeVoiceModal();
    });

    card.addEventListener('click', () => {
      selectPersona(p);
      closeVoiceModal();
    });

    voiceModalGrid.appendChild(card);
  });
}

function openVoiceModal(filter = 'all') {
  state.activeVoiceFilter = filter;
  voiceModalTabs.forEach(t => {
    t.classList.toggle('active', t.dataset.vfilter === filter);
  });
  if (modalPersonalCount) {
    modalPersonalCount.textContent = state.customPersonas.length;
  }
  if (voiceModalActiveLabel) {
    voiceModalActiveLabel.textContent = state.activePersona.name;
  }
  renderVoiceModalGrid(filter);
  voiceModal.classList.remove('hidden');
}

function closeVoiceModal() {
  voiceModal.classList.add('hidden');
}

function deletePersonalVoice(id) {
  const target = state.customPersonas.find(p => p.id === id);
  const name = target ? target.name : 'this voice';
  if (!confirm(`Delete personal voice "${name}"? This cannot be undone.`)) return;

  state.customPersonas = state.customPersonas.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.customPersonas, JSON.stringify(state.customPersonas));

  if (state.customPersonas.length > 0) {
    state.customPersona = state.customPersonas[0];
    localStorage.setItem(STORAGE_KEYS.customPersona, JSON.stringify(state.customPersonas[0]));
  } else {
    state.customPersona = null;
    localStorage.removeItem(STORAGE_KEYS.customPersona);
  }

  if (modalPersonalCount) {
    modalPersonalCount.textContent = state.customPersonas.length;
  }

  // If the active persona was deleted, fall back
  if (state.activePersona.id === id) {
    const fallback = state.customPersonas[0] || CLASSIC_PERSONAS[0];
    selectPersona(fallback);
  } else {
    updateActiveHeroVoiceDisplay();
  }

  renderVoiceModalGrid(state.activeVoiceFilter);
  renderSavedProfilesList();
}

function switchVoiceTab(tabId) {
  voiceTabs.forEach(t => t.classList.toggle('active', t.dataset.vtab === tabId));
  Object.keys(voicePanes).forEach(k => {
    if (voicePanes[k]) {
      voicePanes[k].classList.toggle('hidden', k !== tabId);
    }
  });
}

function renderSavedProfilesList() {
  if (!savedProfilesContainer || !savedProfilesList) return;
  const count = state.customPersonas.length;
  if (savedProfilesCount) savedProfilesCount.textContent = count;

  if (count === 0) {
    savedProfilesContainer.classList.add('hidden');
    savedProfilesList.innerHTML = '';
    return;
  }

  savedProfilesContainer.classList.remove('hidden');
  savedProfilesList.innerHTML = '';

  state.customPersonas.forEach(p => {
    const isActive = p.id === state.activePersona.id;
    const item = document.createElement('div');
    item.className = `saved-profile-item ${isActive ? 'active' : ''}`;
    item.dataset.personaId = p.id;
    item.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      background: var(--bg-surface-elevated);
      border: 1px solid ${isActive ? 'var(--accent-blue)' : 'var(--border-subtle)'};
      cursor: pointer;
      transition: all 0.2s ease;
    `;

    item.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:3px;flex:1;overflow:hidden;">
        <div style="display:flex;align-items:center;gap:6px;">
          <strong style="font-size:0.86rem;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${escapeHtml(p.name)}
          </strong>
          ${isActive ? '<span class="choice-active-pill">✓ Active</span>' : ''}
        </div>
        <span style="font-size:0.74rem;color:var(--text-muted);font-family:var(--font-mono);">
          ${escapeHtml(p.era || 'Personal Profile')} • ${p.metrics ? `~${p.metrics.meanSentenceLength}w/sent • TTR ${p.metrics.typeTokenRatio}` : 'Calibrated'}
        </span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <button type="button" class="btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'} select-saved-profile-btn" style="font-size:0.75rem;padding:3px 10px;">
          ${isActive ? 'Active' : 'Select'}
        </button>
        <button type="button" class="delete-persona-btn delete-saved-profile-btn" title="Delete voice profile">
          🗑️
        </button>
      </div>
    `;

    item.querySelector('.select-saved-profile-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      selectPersona(p);
    });

    item.querySelector('.delete-saved-profile-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      deletePersonalVoice(p.id);
    });

    item.addEventListener('click', () => selectPersona(p));
    savedProfilesList.appendChild(item);
  });
}

// --- Forensic Stylometrics Rendering & Extraction ---

function renderStylometricsAuditCard(metrics) {
  if (!metrics || !voiceStylometricsCard) return;

  auditStatsBadge.textContent = `${metrics.wordCount} words • ${metrics.sentenceCount} sentences`;
  
  auditCadenceVal.textContent = `${metrics.meanSentenceLength} words`;
  auditCadenceSub.textContent = `Burstiness: ${metrics.stdDevSentenceLength} (${metrics.rhythmDescription.split('(')[0].trim()})`;

  auditTtrVal.textContent = `TTR ${metrics.typeTokenRatio}`;
  auditTtrSub.textContent = `Hapax: ${Math.round(metrics.hapaxRatio * 100)}% unique words`;

  auditStanceVal.textContent = metrics.dominantPerspective.split('(')[0].trim();
  auditStanceSub.textContent = `Contractions: ${metrics.contractionRate}/1k words`;

  auditEpistemicVal.textContent = metrics.epistemicTone.split('/')[0].trim();
  auditEpistemicSub.textContent = `Stance: ${metrics.epistemicStance.replace(/_/g, ' ')}`;

  const d = metrics.sentenceDistribution;
  auditDistLabel.textContent = `Short (<12w): ${d.pctShort}% • Medium (12-25w): ${d.pctMedium}% • Complex (>25w): ${d.pctLong}%`;
  barSegShort.style.width = `${Math.max(4, d.pctShort)}%`;
  barSegMed.style.width = `${Math.max(4, d.pctMedium)}%`;
  barSegLong.style.width = `${Math.max(4, d.pctLong)}%`;

  // Keywords
  if (auditKeywordsContainer) {
    if (metrics.topKeywords.length > 0) {
      auditKeywordsContainer.innerHTML = metrics.topKeywords.map(k => `
        <span class="audit-keyword-chip">#${escapeHtml(k)}</span>
      `).join('');
    } else {
      auditKeywordsContainer.innerHTML = '<span style="color:var(--text-muted);font-size:0.72rem;">Insufficient length for distinctive keywords</span>';
    }
  }

  // Punctuation
  if (auditPunctuationContainer) {
    auditPunctuationContainer.innerHTML = metrics.punctuationHabits.map(h => `
      <span class="audit-punct-pill">📌 ${escapeHtml(h)}</span>
    `).join('');
  }

  voiceStylometricsCard.classList.remove('hidden');
}

// Extract and Persist Custom Author Voice via Forensic Stylometrics or AI
async function extractAndSaveUserVoice(sampleText, useAI = false) {
  const clean = (sampleText || '').trim();
  if (!clean || clean.length < 60) {
    alert('Please provide at least 1–2 full paragraphs (60+ characters) to compute an authentic stylometric fingerprint.');
    return;
  }

  const metrics = analyzeAuthorStylometrics(clean);
  if (!metrics || metrics.wordCount < 15) {
    alert('Writing sample is too brief to analyze. Please provide a longer sample (at least 20–30 words).');
    return;
  }

  // Render forensic audit dashboard immediately
  renderStylometricsAuditCard(metrics);

  extractSaveVoiceBtn.disabled = true;
  if (extractAiVoiceBtn) extractAiVoiceBtn.disabled = true;
  customVoiceStatusMsg.textContent = useAI ? '🧠 Running Deep AI Persona Modeling...' : '📊 Computing forensic stylometrics...';

  try {
    let customPersona = null;
    const profileId = `custom-user-voice-${Date.now()}`;
    const defaultProfileName = `My Voice DNA (${state.customPersonas.length + 1})`;
    const customName = prompt('Enter a label for this personal author voice profile:', defaultProfileName)?.trim() || defaultProfileName;

    if (useAI && state.activeProvider !== 'demo') {
      const engineCfg = getActiveEngineConfig();
      customVoiceStatusMsg.textContent = `🧠 Connecting to ${engineCfg.provider} to synthesize Latent Author YAML...`;
      
      const rawYaml = await analyzeAuthorWithAI({
        sampleText: clean,
        engineConfig: engineCfg,
        metrics,
        onProgress: (p) => {
          if (typeof p === 'string') customVoiceStatusMsg.textContent = `🧠 ${p}`;
        }
      });

      const parsedCard = parseYamlToCard(rawYaml, metrics);
      
      customPersona = {
        id: profileId,
        isCustom: true,
        name: customName,
        badge: '👤 Personal AI DNA',
        era: `User Forensic DNA (${engineCfg.provider})`,
        domain: metrics.topKeywords.length > 0 ? `Focus: ${metrics.topKeywords.slice(0, 3).join(', ')}` : 'Empirical Discourse',
        description: `Synthesized via ${engineCfg.provider} from ${metrics.wordCount} words. Mean sentence: ${metrics.meanSentenceLength}w • Burstiness: ${metrics.stdDevSentenceLength} • Stance: ${parsedCard.epistemic_stance || 'empirical'}.`,
        sampleExcerpt: clean.slice(0, 320) + (clean.length > 320 ? '...' : ''),
        metrics,
        rawYaml,
        card: parsedCard,
        createdAt: new Date().toISOString()
      };
    } else {
      if (useAI && state.activeProvider === 'demo') {
        alert('Active backend is Demo Simulation. Performing full mathematical forensic stylometric modeling instead of remote AI profiling.');
      }
      // Pure deterministic stylometric modeling
      customPersona = buildPersonaFromStylometrics(metrics, clean);
      customPersona.id = profileId;
      customPersona.isCustom = true;
      customPersona.name = customName;
      customPersona.badge = '👤 Personal Forensic DNA';
      customPersona.era = `User Forensic DNA (${new Date().toLocaleDateString()})`;
      customPersona.createdAt = new Date().toISOString();
    }

    state.customPersonas.unshift(customPersona);
    state.customPersona = customPersona;
    localStorage.setItem(STORAGE_KEYS.customPersonas, JSON.stringify(state.customPersonas));
    localStorage.setItem(STORAGE_KEYS.customPersona, JSON.stringify(customPersona));
    
    if (modalPersonalCount) {
      modalPersonalCount.textContent = state.customPersonas.length;
    }

    selectPersona(customPersona);
    renderSavedProfilesList();

    customVoiceStatusMsg.textContent = `✓ Forensic voice DNA saved as "${customName}" (${metrics.wordCount} words)!`;
    alert(
      `✨ Author Voice DNA Successfully Calibrated & Saved!\n\n` +
      `• Profile Name: ${customName}\n` +
      `• Analyzed: ${metrics.wordCount} words across ${metrics.sentenceCount} sentences\n` +
      `• Mean Sentence Length: ${metrics.meanSentenceLength} words\n` +
      `• Syntactic Burstiness: ${metrics.stdDevSentenceLength} (${metrics.rhythmDescription.split('(')[0].trim()})\n` +
      `• Lexical Variety (TTR): ${metrics.typeTokenRatio}\n` +
      `• Dominant Perspective: ${metrics.dominantPerspective}\n` +
      `• Epistemic Tone: ${metrics.epistemicTone}\n` +
      `• Stance: ${customPersona.card.epistemic_stance.replace(/_/g, ' ')}\n\n` +
      `This voice is now active and saved in your library of personal voices!`
    );
  } catch (err) {
    console.error('Voice extraction error:', err);
    customVoiceStatusMsg.textContent = `❌ ${err.message}`;
    alert(`Could not complete voice modeling: ${err.message}`);
  } finally {
    extractSaveVoiceBtn.disabled = false;
    if (extractAiVoiceBtn) extractAiVoiceBtn.disabled = false;
  }
}

function clearCustomVoice() {
  if (confirm('Clear all your saved personal author profile voices from local storage?')) {
    state.customPersonas = [];
    state.customPersona = null;
    localStorage.removeItem(STORAGE_KEYS.customPersonas);
    localStorage.removeItem(STORAGE_KEYS.customPersona);
    sampleAuthorText.value = '';
    customVoiceStatusMsg.textContent = '';
    if (voiceStylometricsCard) voiceStylometricsCard.classList.add('hidden');
    if (modalPersonalCount) modalPersonalCount.textContent = '0';
    renderSavedProfilesList();
    selectPersona(ARCHETYPES[0]);
    alert('All personal voice profiles cleared. Active voice reset to Operational Systems Engineer.');
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
    async (file) => {
      customVoiceStatusMsg.textContent = `⏳ Parsing ${file.name}...`;
      try {
        const parsed = await extractTextFromFile(file);
        sampleAuthorText.value = parsed.text;
        extractAndSaveUserVoice(parsed.text);
      } catch (err) {
        console.error('Voice file extraction error:', err);
        alert(`Could not extract text from "${file.name}": ${err.message}`);
        customVoiceStatusMsg.textContent = `❌ ${err.message}`;
      }
    }
  );

  // 2. Draft Dropzone
  setupFileDrop(
    draftDropzone,
    draftFileInput,
    async (file) => {
      loadedFileName.textContent = `⏳ Parsing ${file.name}...`;
      loadedFileName.classList.remove('hidden');
      try {
        const parsed = await extractTextFromFile(file);
        sourceTextEl.value = parsed.text;
        loadedFileName.textContent = `📄 ${parsed.fileName} (${parsed.words} words • .${parsed.fileType})`;
        loadedFileName.classList.remove('hidden');
        updateDraftWordCountAndRadar();
      } catch (err) {
        console.error('Draft file extraction error:', err);
        alert(`Could not extract text from "${file.name}": ${err.message}`);
        loadedFileName.textContent = `❌ Error loading ${file.name}`;
      }
    }
  );
}

function setupFileDrop(dropzoneEl, fileInputEl, handleFile) {
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
      handleFile(files[0]);
    }
  });

  fileInputEl.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
    fileInputEl.value = ''; // Reset input to allow re-uploading same file
  });
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
    const densityVal = densitySelectorEl ? densitySelectorEl.value : 'balanced';

    const pipelineResult = await runCognitivePipeline({
      input: text,
      persona: state.activePersona,
      engineConfig: engineCfg,
      density: densityVal,
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

  // Render Atomic Claims Graph & Syntactic Frames
  if (claimsContentBox) {
    claimsContentBox.textContent = result.factGraph || 'No atomic claims extracted.';
  }
  if (syntaxFramesBox) {
    if (result.syntacticFrames && result.syntacticFrames.length > 0) {
      syntaxFramesBox.innerHTML = result.syntacticFrames
        .map((f, i) => `<div style="margin-bottom:12px;background:rgba(255,255,255,0.03);padding:8px 10px;border-radius:6px;border:1px solid var(--border-subtle);"><strong style="color:var(--accent-cyan);">Mold ${i + 1}:</strong> "${escapeHtml(f)}"</div>`)
        .join('');
    } else {
      syntaxFramesBox.innerHTML = '<span style="color:var(--text-muted);">Default human syntactic molds applied.</span>';
    }
  }

  // Update Compression Badge
  if (compressionBadge) {
    compressionBadge.textContent = `⚡ -${result.compressionRatio}% words (${result.densityMode || 'balanced'})`;
    compressionBadge.classList.remove('hidden');
  }
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
  let label = '';
  let color = '#10B981';

  if (p === 'demo') {
    label = 'Demo Simulation';
    color = '#10B981';
  } else if (p === 'webllm') {
    const model = state.providerConfigs.webllm.model || 'Llama 3.2 1B';
    const shortName = model.split('-')[0] + ' ' + (model.split('-')[1] || '');
    label = `WebLLM (${shortName})`;
    color = '#06B6D4';
  } else if (p === 'chrome-ai') {
    label = 'Chrome Nano';
    color = '#38BDF8';
  } else if (p === 'ollama') {
    label = `Ollama (${state.providerConfigs.ollama.model || 'local'})`;
    color = '#818CF8';
  } else if (p === 'gemini') {
    const model = state.providerConfigs.gemini.model || 'gemini-2.0-flash';
    label = `Gemini (${model.replace('gemini-', '')})`;
    color = '#F59E0B';
  } else {
    label = `Cloud (${state.providerConfigs.openai.model || 'API'})`;
    color = '#C084FC';
  }

  currentEngineLabel.textContent = label;
  engineStatusDot.style.background = color;

  if (stage2EngineLabel) {
    stage2EngineLabel.textContent = `AI Engine: ${label}`;
  }
  if (stage2EngineDot) {
    stage2EngineDot.style.background = color;
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
  // Global Home Navigation (Return to Stage 1 from anywhere)
  if (brandHomeBtn) {
    brandHomeBtn.addEventListener('click', goHome);
    brandHomeBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        goHome();
      }
    });
  }
  if (globalHomeBtn) {
    globalHomeBtn.addEventListener('click', goHome);
  }
  if (stage3HomeBtn) {
    stage3HomeBtn.addEventListener('click', goHome);
  }

  // Stepper Bar Stage Selection
  stageNavItems.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      // If clicking Stage 1 while already on Stage 1, open Voice Chooser modal directly!
      if (idx === 0 && state.currentStage === 1) {
        openVoiceModal('all');
        return;
      }
      switchStage(idx + 1);
    });
  });

  // Clicking active voice pill in stepper bar directly opens Voice Chooser modal from any stage
  if (activeVoicePill) {
    activeVoicePill.addEventListener('click', (e) => {
      e.stopPropagation();
      openVoiceModal('all');
    });
  }

  // Global Header Voice Button
  if (voiceSelectorBtn) {
    voiceSelectorBtn.addEventListener('click', () => openVoiceModal('all'));
  }

  // Stage 1 controls
  gotoStage2Btn.addEventListener('click', () => switchStage(2));
  toggleHeroYamlBtn.addEventListener('click', () => {
    personaCardYaml.classList.toggle('hidden');
    toggleHeroYamlBtn.textContent = personaCardYaml.classList.contains('hidden') ? '📄 View Voice Card YAML' : 'Hide YAML';
  });
  clearCustomVoiceBtn.addEventListener('click', clearCustomVoice);

  // Hero card Change Voice button & badge click
  if (browseAllVoicesBtn) {
    browseAllVoicesBtn.addEventListener('click', () => openVoiceModal('all'));
  }
  if (heroVoiceBadge) {
    heroVoiceBadge.style.cursor = 'pointer';
    heroVoiceBadge.title = 'Click to choose active author voice';
    heroVoiceBadge.addEventListener('click', () => openVoiceModal('all'));
  }

  // Stage 2 Draft voice switch button
  if (stage2VoiceBtn) {
    stage2VoiceBtn.addEventListener('click', () => openVoiceModal('all'));
  }

  // Voice Chooser Modal controls
  if (closeVoiceModalBtn) {
    closeVoiceModalBtn.addEventListener('click', closeVoiceModal);
  }
  if (closeVoiceModalDoneBtn) {
    closeVoiceModalDoneBtn.addEventListener('click', closeVoiceModal);
  }
  if (voiceModal) {
    voiceModal.addEventListener('click', (e) => {
      if (e.target === voiceModal) closeVoiceModal();
    });
  }
  if (modalCalibrateNewBtn) {
    modalCalibrateNewBtn.addEventListener('click', () => {
      closeVoiceModal();
      switchStage(1);
      switchVoiceTab('my-voice');
      if (sampleAuthorText) sampleAuthorText.focus();
    });
  }
  voiceModalTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      openVoiceModal(tab.dataset.vfilter);
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeVoiceModal();
      if (excerptModal) excerptModal.classList.add('hidden');
      if (engineModal) engineModal.classList.add('hidden');
    }
  });

  // Voice Tabs (Stage 1)
  voiceTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      voiceTabs.forEach(t => t.classList.toggle('active', t === tab));
      Object.keys(voicePanes).forEach(k => {
        voicePanes[k].classList.toggle('hidden', k !== tab.dataset.vtab);
      });
    });
  });

  // Custom Voice Extraction Buttons
  extractSaveVoiceBtn.addEventListener('click', () => {
    extractAndSaveUserVoice(sampleAuthorText.value, false);
  });
  if (extractAiVoiceBtn) {
    extractAiVoiceBtn.addEventListener('click', () => {
      extractAndSaveUserVoice(sampleAuthorText.value, true);
    });
  }

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

  // Factory Reset button
  if (factoryResetBtn) {
    factoryResetBtn.addEventListener('click', resetStudioFactory);
  }

  // Engine Reset button
  if (resetEngineBtn) {
    resetEngineBtn.addEventListener('click', resetEngineSettings);
  }

  // Stage 2 Engine Pill button
  if (stage2EngineBtn) {
    stage2EngineBtn.addEventListener('click', () => {
      engineSelectorBtn.click();
    });
  }
}

// Studio Factory Reset: Clears custom voice, drafts, API keys, cache, and returns to initial state
function resetStudioFactory() {
  const confirmed = confirm(
    '⚠️ STUDIO FACTORY RESET\n\n' +
    'This will erase:\n' +
    '• Your saved custom author voice DNA\n' +
    '• All loaded draft texts and analysis findings\n' +
    '• Saved LLM API keys and connection settings\n\n' +
    'Are you sure you want to restore the studio to factory defaults?'
  );

  if (!confirmed) return;

  // Clear all localStorage keys starting with stop_slop_
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('stop_slop_')) {
      localStorage.removeItem(key);
    }
  });

  // Reset internal state
  state.customPersonas = [];
  state.customPersona = null;
  state.activePersona = CLASSIC_PERSONAS[0]; // Default to Bertrand Russell
  state.activeProvider = 'demo';
  state.providerConfigs = {
    demo: {},
    webllm: { model: 'Llama-3.2-1B-Instruct-q4f16_1-MLC' },
    ollama: { endpoint: 'http://localhost:11434', model: 'llama3.2' },
    gemini: { apiKey: '', model: 'gemini-2.0-flash' },
    'chrome-ai': {},
    openai: {
      endpoint: 'https://api.groq.com/openai/v1',
      apiKey: '',
      model: 'llama-3.3-70b-versatile'
    }
  };
  state.lastResult = null;

  // Reset inputs
  if (sourceTextEl) sourceTextEl.value = '';
  if (sampleAuthorText) sampleAuthorText.value = '';
  if (loadedFileName) {
    loadedFileName.textContent = '';
    loadedFileName.classList.add('hidden');
  }
  if (customVoiceStatusMsg) customVoiceStatusMsg.textContent = '';
  if (presetSelectorEl) presetSelectorEl.value = '';

  // Reset metrics & views
  resetStepper();
  outputProseBox.innerHTML = `
    <div class="empty-state">
      <div style="font-size:2rem;margin-bottom:10px;">✨</div>
      <h3>Studio Reset Complete</h3>
      <p>Configure an author voice and load a draft to begin.</p>
    </div>
  `;
  diffOriginalContent.innerHTML = '';
  diffTransformedContent.innerHTML = '';
  if (densitySelectorEl) densitySelectorEl.value = 'balanced';
  if (compressionBadge) compressionBadge.classList.add('hidden');
  if (claimsContentBox) claimsContentBox.textContent = 'Atomic micro-claims will appear here after executing the pipeline.';
  if (syntaxFramesBox) syntaxFramesBox.textContent = 'Grafted sentence molds from the author model will appear here.';

  // Switch to Stage 1
  switchStage(1);
  updateActiveHeroVoiceDisplay();
  renderSavedProfilesList();
  updateDraftWordCountAndRadar();
  updateEngineUI();
  populateModalInputs();

  alert('✨ Studio has been completely reset to factory defaults.');
}

// Reset Engine Settings only: resets provider to demo and clears keys
function resetEngineSettings() {
  const confirmed = confirm('Reset AI Backend connection settings to default Demo mode and clear saved API keys?');
  if (!confirmed) return;

  [
    STORAGE_KEYS.provider,
    STORAGE_KEYS.webllmModel,
    STORAGE_KEYS.ollamaEndpoint,
    STORAGE_KEYS.ollamaModel,
    STORAGE_KEYS.geminiKey,
    STORAGE_KEYS.geminiModel,
    STORAGE_KEYS.openaiEndpoint,
    STORAGE_KEYS.openaiKey,
    STORAGE_KEYS.openaiModel
  ].forEach(key => localStorage.removeItem(key));

  state.activeProvider = 'demo';
  state.providerConfigs.demo = {};
  state.providerConfigs.gemini.apiKey = '';
  state.providerConfigs.openai.apiKey = '';
  state.providerConfigs.openai.endpoint = 'https://api.groq.com/openai/v1';
  state.providerConfigs.openai.model = 'llama-3.3-70b-versatile';
  state.providerConfigs.ollama.endpoint = 'http://localhost:11434';
  state.providerConfigs.ollama.model = 'llama3.2';

  populateModalInputs();
  updateEngineUI();
  showFeedback('demo', 'success', '✓ AI Engine reset to Demo Simulation defaults.');
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
