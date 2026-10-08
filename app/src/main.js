import { ARCHETYPES, formatPersonaYaml } from './engine/personas.js';
import { PRESETS } from './engine/presets.js';
import { lintProse } from './engine/linter.js';
import { runCognitivePipeline } from './engine/pipeline.js';
import { detectChromeAI } from './engine/llm-connector.js';

// --- State Management ---
const state = {
  activePersona: ARCHETYPES[0],
  customPersona: null,
  activeTab: 'rewrite',
  engineConfig: {
    provider: localStorage.getItem('stop_slop_provider') || 'demo',
    apiKey: localStorage.getItem('stop_slop_api_key') || '',
    endpoint: localStorage.getItem('stop_slop_endpoint') || '',
    model: localStorage.getItem('stop_slop_model') || ''
  },
  lastResult: null,
  deferredInstallPrompt: null
};

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
  'chrome-ai': document.getElementById('pane-chrome-ai'),
  ollama: document.getElementById('pane-ollama'),
  gemini: document.getElementById('pane-gemini'),
  openai: document.getElementById('pane-openai')
};
const saveEngineBtn = document.getElementById('save-engine-btn');

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

// --- Engine Settings ---
function updateEngineUI() {
  const p = state.engineConfig.provider;
  if (p === 'demo') {
    currentEngineLabel.textContent = 'Demo Simulation';
    engineStatusDot.style.background = '#10B981';
  } else if (p === 'chrome-ai') {
    currentEngineLabel.textContent = 'Chrome AI (Gemini Nano)';
    engineStatusDot.style.background = '#38BDF8';
  } else if (p === 'ollama') {
    currentEngineLabel.textContent = `Ollama (${state.engineConfig.model || 'local'})`;
    engineStatusDot.style.background = '#818CF8';
  } else if (p === 'gemini') {
    currentEngineLabel.textContent = 'Google Gemini 2.0';
    engineStatusDot.style.background = '#F59E0B';
  } else {
    currentEngineLabel.textContent = 'OpenAI / Groq';
    engineStatusDot.style.background = '#C084FC';
  }
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
    desc.textContent = 'Requires Chrome 127+ with chrome://flags/#prompt-api-for-gemini-nano enabled. You can use Gemini API or Ollama instead!';
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

  runPipelineBtn.disabled = true;
  detectOnlyBtn.disabled = true;
  resetStepper();

  outputProseBox.innerHTML = `
    <div class="empty-state">
      <div class="engine-pulse-dot" style="width:20px;height:20px;margin-bottom:14px;"></div>
      <h3>Executing 4-Pass Cognitive Engine...</h3>
      <p id="stepper-live-status">Step 1: Extracting irreducible substance...</p>
    </div>
  `;

  try {
    const pipelineResult = await runCognitivePipeline({
      input: text,
      persona: state.activePersona,
      engineConfig: state.engineConfig,
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
    outputProseBox.innerHTML = `
      <div class="empty-state">
        <div style="font-size:2rem;margin-bottom:10px;">⚠️</div>
        <h3 style="color:var(--accent-rose);">Execution Error</h3>
        <p style="color:var(--text-secondary);">${err.message || err}</p>
      </div>
    `;
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
    engineModal.classList.remove('hidden');
    checkChromeAIStatus();
  });
  closeEngineModalBtn.addEventListener('click', () => engineModal.classList.add('hidden'));

  engineTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      engineTabs.forEach(t => t.classList.toggle('active', t === tab));
      Object.keys(providerPanes).forEach(k => {
        providerPanes[k].classList.toggle('hidden', k !== tab.dataset.provider);
      });
    });
  });

  saveEngineBtn.addEventListener('click', () => {
    const activeTab = document.querySelector('.engine-tab.active');
    const provider = activeTab ? activeTab.dataset.provider : 'demo';

    state.engineConfig.provider = provider;
    if (provider === 'gemini') {
      state.engineConfig.apiKey = document.getElementById('gemini-key').value.trim();
      state.engineConfig.model = document.getElementById('gemini-model').value;
    } else if (provider === 'ollama') {
      state.engineConfig.endpoint = document.getElementById('ollama-endpoint').value.trim();
      state.engineConfig.model = document.getElementById('ollama-model').value.trim();
    } else if (provider === 'openai') {
      state.engineConfig.endpoint = document.getElementById('openai-endpoint').value.trim();
      state.engineConfig.apiKey = document.getElementById('openai-key').value.trim();
      state.engineConfig.model = document.getElementById('openai-model').value.trim();
    }

    localStorage.setItem('stop_slop_provider', provider);
    localStorage.setItem('stop_slop_api_key', state.engineConfig.apiKey);
    localStorage.setItem('stop_slop_endpoint', state.engineConfig.endpoint);
    localStorage.setItem('stop_slop_model', state.engineConfig.model);

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

    // Heuristically construct Custom Author Card
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
