// Multi-Engine LLM Connector
// Supported: WebLLM (In-browser WebGPU), Chrome Built-in AI, Ollama (Local), Google Gemini, Cloud APIs (OpenAI / Groq / OpenRouter)

// WebLLM Engine cache
let webLLMEngineInstance = null;
let currentWebLLMModel = null;

export const WEBLLM_MODELS = [
  { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', name: 'Llama 3.2 1B (Fast, ~880MB)', size: '880MB' },
  { id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', name: 'Qwen 2.5 0.5B (Ultra-Light, ~390MB)', size: '390MB' },
  { id: 'SmolLM2-1.7B-Instruct-q4f16_1-MLC', name: 'SmolLM2 1.7B (Compact, ~1GB)', size: '1GB' },
  { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', name: 'Qwen 2.5 1.5B (Balanced, ~1.1GB)', size: '1.1GB' },
  { id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC', name: 'Llama 3.2 3B (Higher Quality, ~2.2GB)', size: '2.2GB' }
];

export function isWebGPUSupported() {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

export async function detectChromeAI() {
  if (typeof window !== 'undefined' && (window.ai?.languageModel || window.LanguageModel || navigator.ai?.languageModel)) {
    try {
      const aiObj = window.ai?.languageModel || navigator.ai?.languageModel;
      if (aiObj?.capabilities) {
        const capabilities = await aiObj.capabilities();
        return {
          supported: capabilities.available !== 'no',
          status: capabilities.available,
          model: 'Gemini Nano (Chrome Built-in)'
        };
      }
    } catch (err) {
      console.warn('Chrome AI capability check:', err);
    }
  }
  return { supported: false, status: 'unavailable', model: 'None' };
}

// Strip <think>...</think> artifacts from reasoning models (e.g. DeepSeek-R1)
function sanitizeModelOutput(text) {
  if (!text) return '';
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

export async function callLLM({ provider, apiKey, endpoint, model, systemPrompt, userPrompt, onProgress }) {
  let output = '';

  if (provider === 'webllm') {
    output = await callWebLLM(model || 'Llama-3.2-1B-Instruct-q4f16_1-MLC', systemPrompt, userPrompt, onProgress);
  } else if (provider === 'chrome-ai') {
    output = await callChromeAI(systemPrompt, userPrompt, onProgress);
  } else if (provider === 'ollama') {
    output = await callOllama(endpoint || 'http://localhost:11434', model || 'llama3.2', systemPrompt, userPrompt, onProgress);
  } else if (provider === 'gemini') {
    output = await callGeminiAPI(apiKey, model || 'gemini-2.0-flash', systemPrompt, userPrompt, onProgress);
  } else if (provider === 'openai' || provider === 'groq' || provider === 'openrouter') {
    const defaultEndpoint = provider === 'groq'
      ? 'https://api.groq.com/openai/v1'
      : provider === 'openrouter'
      ? 'https://openrouter.ai/api/v1'
      : 'https://api.openai.com/v1';
    const defaultModel = provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';
    output = await callOpenAICompatible(endpoint || defaultEndpoint, apiKey, model || defaultModel, systemPrompt, userPrompt, onProgress);
  } else if (provider === 'anthropic') {
    output = await callAnthropic(apiKey, model || 'claude-3-5-sonnet-20241022', systemPrompt, userPrompt, onProgress);
  } else {
    // Simulation fallback
    output = await mockSimulation(userPrompt, onProgress);
  }

  return sanitizeModelOutput(output);
}

// --- WebLLM (In-Browser WebGPU) ---
export async function initWebLLM(modelId, onProgress) {
  if (!isWebGPUSupported()) {
    throw new Error('WebGPU is not available in this browser. Use Chrome 113+, Edge 113+, or another WebGPU-supported browser, or switch to Ollama / Gemini.');
  }

  if (webLLMEngineInstance && currentWebLLMModel === modelId) {
    return webLLMEngineInstance;
  }

  const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
  
  webLLMEngineInstance = await CreateMLCEngine(modelId, {
    initProgressCallback: (report) => {
      if (onProgress) {
        onProgress(report);
      }
    }
  });

  currentWebLLMModel = modelId;
  return webLLMEngineInstance;
}

async function callWebLLM(modelId, systemPrompt, userPrompt, onProgress) {
  const engine = await initWebLLM(modelId, (report) => {
    if (onProgress) onProgress(`[Loading Model] ${report.text}`);
  });

  const messages = [];
  if (systemPrompt && systemPrompt.trim()) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userPrompt });

  const reply = await engine.chat.completions.create({
    messages: messages,
    temperature: 0.7
  });

  const output = reply.choices?.[0]?.message?.content || '';
  if (onProgress) onProgress(output);
  return output;
}

// --- Chrome Built-in AI ---
async function callChromeAI(systemPrompt, userPrompt, onProgress) {
  const aiObj = window.ai?.languageModel || navigator.ai?.languageModel;
  if (!aiObj) {
    throw new Error('Chrome Built-in AI (Prompt API) is not enabled. Try Chrome 127+ with chrome://flags/#prompt-api-for-gemini-nano enabled, or use WebLLM / Ollama / Gemini.');
  }

  const session = await aiObj.create({
    systemPrompt: systemPrompt
  });

  if (session.promptStreaming && onProgress) {
    const stream = session.promptStreaming(userPrompt);
    let fullText = '';
    for await (const chunk of stream) {
      fullText = chunk;
      onProgress(fullText);
    }
    session.destroy();
    return fullText;
  } else {
    const result = await session.prompt(userPrompt);
    session.destroy();
    return result;
  }
}

// --- Local Ollama ---
export function normalizeOllamaUrl(rawUrl) {
  let url = (rawUrl || 'http://localhost:11434').trim().replace(/\/+$/, '');
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `http://${url}`;
  }
  return url;
}

export async function fetchOllamaModels(endpoint) {
  const base = normalizeOllamaUrl(endpoint);
  const candidateUrls = [
    `${base}/api/tags`,
    `${base}/v1/models`
  ];

  // Also include Vite proxy fallback if on localhost dev server
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '5173') {
    candidateUrls.push('/ollama-proxy/api/tags');
  }

  let lastError = null;
  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        if (json.models && Array.isArray(json.models)) {
          return json.models.map(m => m.name || m.model);
        }
        if (json.data && Array.isArray(json.data)) {
          return json.data.map(m => m.id);
        }
      }
    } catch (e) {
      lastError = e;
    }
  }

  throw new Error(`Cannot reach Ollama at ${base}. Make sure Ollama is running ('ollama serve') and CORS is enabled.`);
}

async function callOllama(endpoint, model, systemPrompt, userPrompt, onProgress) {
  const base = normalizeOllamaUrl(endpoint);
  const cleanModel = (model || 'llama3.2').trim();

  // Try standard /v1/chat/completions first, then /api/chat
  const v1Url = base.endsWith('/v1') ? `${base}/chat/completions` : `${base}/v1/chat/completions`;
  const apiChatUrl = `${base}/api/chat`;

  const requestOptions = [
    {
      url: v1Url,
      body: {
        model: cleanModel,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        stream: false
      },
      extractor: (d) => d.choices?.[0]?.message?.content
    },
    {
      url: apiChatUrl,
      body: {
        model: cleanModel,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: userPrompt }
        ],
        stream: false
      },
      extractor: (d) => d.message?.content
    }
  ];

  // If in Vite dev server, also try Vite proxy candidates
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '5173') {
    requestOptions.push({
      url: '/ollama-proxy/v1/chat/completions',
      body: requestOptions[0].body,
      extractor: requestOptions[0].extractor
    });
    requestOptions.push({
      url: '/ollama-proxy/api/chat',
      body: requestOptions[1].body,
      extractor: requestOptions[1].extractor
    });
  }

  let lastError = null;

  for (const opt of requestOptions) {
    try {
      const response = await fetch(opt.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opt.body)
      });

      if (response.ok) {
        const data = await response.json();
        const content = opt.extractor(data) || '';
        if (content) {
          if (onProgress) onProgress(content);
          return content;
        }
      } else {
        const errText = await response.text().catch(() => '');
        lastError = new Error(`Ollama HTTP ${response.status}: ${errText}`);
      }
    } catch (netErr) {
      lastError = netErr;
    }
  }

  // If all failed, provide a crystal clear, actionable diagnosis
  throw new Error(
    `Failed to connect to Ollama (${cleanModel}) at ${base}.\n\n` +
    `Possible solutions:\n` +
    `1. Start Ollama: 'ollama serve'\n` +
    `2. Pull the model: 'ollama pull ${cleanModel}'\n` +
    `3. Enable CORS for browser access: on Windows run:\n` +
    `   $env:OLLAMA_ORIGINS="*"; ollama serve`
  );
}

// --- Google Gemini API ---
async function callGeminiAPI(apiKey, model, systemPrompt, userPrompt, onProgress) {
  const cleanKey = (apiKey || '').trim();
  if (!cleanKey) {
    throw new Error('Google Gemini API key required. Enter your key in the LLM Settings.');
  }

  const cleanModel = (model || 'gemini-2.0-flash').trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${cleanKey}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }]
      }
    ],
    generationConfig: {
      temperature: 0.7
    }
  };

  if (systemPrompt && systemPrompt.trim()) {
    payload.systemInstruction = {
      parts: [{ text: systemPrompt }]
    };
  }

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (netErr) {
    throw new Error(`Gemini Network/CORS Error: ${netErr.message}. Verify internet connectivity and ad-blockers.`);
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const message = err.error?.message || response.statusText;
    if (response.status === 400 && message.includes('API_KEY_INVALID')) {
      throw new Error('Gemini API Error: Invalid API key. Please check your Google AI Studio key.');
    }
    if (response.status === 404) {
      throw new Error(`Gemini API Error: Model '${cleanModel}' not found. Please try 'gemini-2.0-flash' or 'gemini-1.5-flash'.`);
    }
    throw new Error(`Gemini API Error (${response.status}): ${message}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  if (!candidate) {
    throw new Error('Gemini returned no response candidates. The prompt may have triggered safety filters.');
  }

  const text = candidate.content?.parts?.map(p => p.text).filter(Boolean).join('') || '';
  if (!text) {
    throw new Error(`Gemini returned empty text. Finish reason: ${candidate.finishReason || 'UNKNOWN'}`);
  }

  if (onProgress) onProgress(text);
  return text;
}

// --- OpenAI Compatible (OpenAI, Groq, OpenRouter, DeepSeek) ---
async function callOpenAICompatible(endpoint, apiKey, model, systemPrompt, userPrompt, onProgress) {
  const cleanKey = (apiKey || '').trim();
  if (!cleanKey) {
    throw new Error('API key required for cloud provider.');
  }

  let baseUrl = (endpoint || 'https://api.openai.com/v1').trim().replace(/\/+$/, '');
  let url = baseUrl;
  if (!url.endsWith('/chat/completions')) {
    url = `${url}/chat/completions`;
  }

  const messages = [];
  if (systemPrompt && systemPrompt.trim()) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userPrompt });

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanKey}`
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7
      })
    });
  } catch (netErr) {
    throw new Error(`Network error connecting to ${baseUrl}: ${netErr.message}`);
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`API error (${response.status}): ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  if (!text) {
    throw new Error(`Received empty completion from ${baseUrl}`);
  }
  if (onProgress) onProgress(text);
  return text;
}

// --- Anthropic Claude API ---
async function callAnthropic(apiKey, model, systemPrompt, userPrompt, onProgress) {
  if (!apiKey) {
    throw new Error('Anthropic API key required.');
  }

  const url = 'https://api.anthropic.com/v1/messages';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey.trim(),
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: model || 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Anthropic Error (${response.status}): ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  if (onProgress) onProgress(text);
  return text;
}

// --- Simulation Fallback ---
async function mockSimulation(userPrompt, onProgress) {
  await new Promise(r => setTimeout(r, 600));
  return `Clean, humanized synthesis derived from user input. Anchored in concrete mechanics rather than formulaic filler.`;
}

// --- Unified Test Connection Helper ---
export async function testProviderConnection({ provider, apiKey, endpoint, model, onProgress }) {
  const testSystem = 'You are a test assistant. Answer in 1 word.';
  const testUser = 'Say "Connected"';

  if (provider === 'webllm') {
    if (!isWebGPUSupported()) {
      return { success: false, message: 'WebGPU is not supported in this browser. Use Chrome/Edge with hardware acceleration enabled.' };
    }
    const engine = await initWebLLM(model || 'Llama-3.2-1B-Instruct-q4f16_1-MLC', (report) => {
      if (onProgress) onProgress(report.text);
    });
    const reply = await engine.chat.completions.create({
      messages: [{ role: 'user', content: 'Say "Ready"' }],
      max_tokens: 10
    });
    return { success: true, message: `WebLLM loaded successfully! Output: "${reply.choices[0]?.message?.content?.trim()}"` };
  }

  if (provider === 'chrome-ai') {
    const status = await detectChromeAI();
    if (!status.supported) {
      return { success: false, message: 'Chrome Built-in AI not detected. Needs Chrome 127+ with Gemini Nano enabled in chrome://flags.' };
    }
    const res = await callChromeAI(testSystem, testUser);
    return { success: true, message: `Chrome AI is active! Model: ${status.model}` };
  }

  if (provider === 'ollama') {
    const res = await callOllama(endpoint || 'http://localhost:11434', model || 'llama3.2', testSystem, testUser);
    return { success: true, message: `Ollama connected successfully! Model "${model}" replied: "${res.trim()}"` };
  }

  if (provider === 'gemini') {
    const res = await callGeminiAPI(apiKey, model || 'gemini-2.0-flash', testSystem, testUser);
    return { success: true, message: `Gemini connected successfully! Model "${model || 'gemini-2.0-flash'}" replied: "${res.trim()}"` };
  }

  if (provider === 'openai' || provider === 'groq' || provider === 'openrouter') {
    const res = await callOpenAICompatible(endpoint, apiKey, model, testSystem, testUser);
    return { success: true, message: `API connected successfully! Model "${model}" replied: "${res.trim()}"` };
  }

  return { success: true, message: 'Demo simulation is always ready!' };
}
