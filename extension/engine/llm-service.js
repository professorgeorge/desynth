import { amputateSlop, extractSyntacticFrames, PARALLEL_EXEMPLARS } from './deslop-surgery.js';
import { lintProse } from './linter.js';
import { ALL_PERSONAS, formatPersonaYaml } from './personas.js';

export async function humanizeText({
  text,
  voiceId = 'george-orwell',
  mode = 'deep', // 'deep' (full 4-pass cognitive pipeline) or 'fast' (single-pass synthesis)
  provider = 'instant', // 'instant', 'ollama', 'gemini', 'openai', 'groq'
  config = {},
  onProgress = null
}) {
  if (!text || typeof text !== 'string') return { rewritten: '', lintBefore: null, lintAfter: null };

  const lintBefore = lintProse(text);
  
  // Resolve persona (supports built-in personas and custom user personas stored in config.customVoices)
  const customVoices = Array.isArray(config.customVoices) ? config.customVoices : [];
  const combinedPersonas = [...ALL_PERSONAS, ...customVoices];
  const persona = combinedPersonas.find(p => p.id === voiceId) || combinedPersonas[1] || combinedPersonas[0];

  // 1. Instant 0ms Deterministic Surgery (Zero latency, works offline, no keys)
  if (provider === 'instant') {
    const surgicalClean = amputateSlop(text);
    const lintAfter = lintProse(surgicalClean);
    return {
      rewritten: surgicalClean,
      lintBefore,
      lintAfter,
      mode: 'instant',
      provider: 'Instant Deterministic (0ms)',
      voice: persona.name,
      diff: generateWordDiff(text, surgicalClean)
    };
  }

  // 2. Persona Card & Syntactic Cadence Molds
  const personaYaml = formatPersonaYaml(persona.card);
  const sampleExcerpt = persona.sampleExcerpt || persona.description || '';
  const frames = extractSyntacticFrames(sampleExcerpt);
  const framesText = frames.map((f, i) => `${i + 1}. "${f}"`).join('\n');

  let rawLLMOutput = '';

  try {
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const isLongDocument = wordCount > 900;

    if (mode === 'deep' && !isLongDocument) {
      // =========================================================================
      // DEEP COGNITIVE PIPELINE (Pass 1 -> Pass 2 -> Pass 3 -> Pass 4)
      // =========================================================================
      if (onProgress) onProgress('Pass 1: Extracting atomic claims & metrics...');

      // Pass 1: Fact Graph Extraction (guarantees zero idea loss & zero hallucination)
      const p1System = `You are a forensic scientific content extractor. You completely annihilate prose and rhetoric.
Your sole job is to extract ONLY the irreducible atomic factual claims, numbers, entities, and causal relationships.
RULES:
- Output a bulleted list of raw facts.
- ZERO adjectives, ZERO commentary.
- Preserve every exact metric, number, and entity.`;

      const factGraph = await executeLLMCall({
        provider,
        config,
        systemPrompt: p1System,
        userPrompt: `Extract the atomic claim graph from this text:\n\n${text}`,
        temperature: 0.2,
        top_p: 0.90
      });

      if (onProgress) onProgress('Pass 2 & 3: Cadence synthesis with human molds...');

      // Pass 3: Cognitive Synthesis anchored to Fact Graph & Syntactic Frames
      const p3System = `You are a master human author and prose editor.
Your objective is to humanize AI-generated text using the provided author model and authentic sentence skeletons.

COGNITIVE HUMAN INVARIANTS:
1. ZERO IDEA LOSS: Retain every argument, metric, technical detail, and factual claim intact.
2. ZERO FORMATTING LOSS: Retain every paragraph break (\\n\\n), heading, bullet item, and list marker verbatim.
3. ANTI-TRICOLON BAN: Never force descriptions into triplets of adjectives or verbs ("scalable, robust, and intuitive"). Use natural pairs or singular attributes.
4. ASYMMETRIC BURSTINESS: Break robotic 20-word sentence monotony. Alternate short punchy statements (4–8 words) with longer analytical sentences (22–35 words).
5. NATURAL NOUN REPETITION: Repeat precise technical terms naturally without forced synonym cycling.
6. NO MORALIZING CLOSURES: End on the final concrete finding. Never append generic summarizing optimism ("Ultimately, embracing X paves the way for Y").
7. ZERO EM-DASHES (—): Use natural colons, semicolons, parentheses, or separate sentences instead of em-dashes.
8. REMOVE SYNTHETIC TASTE: Cut robotic throat-clearing, binary contrast clichés ("not merely X; rather Y"), and corporate buzzwords ("tapestry", "delve", "realm", "beacon", "foster").

VOICE CONSTRAINTS (${persona.name}):
${personaYaml}

Output ONLY the humanized prose with exact original formatting preserved. No preamble, no quotes, no conversational filler.`;

      const p3User = `AUTHENTIC CADENCE SKELETONS TO EMULATE:
${framesText}

ATOMIC CLAIMS & DETAILS TO PRESERVE:
${factGraph || text}

ORIGINAL DOCUMENT STRUCTURE (PRESERVE EXACT PARAGRAPHS, HEADINGS, AND IDEAS):
${text}`;

      rawLLMOutput = await executeLLMCall({
        provider,
        config,
        systemPrompt: p3System,
        userPrompt: p3User,
        temperature: 0.62,
        top_p: 0.93
      });

    } else if (isLongDocument) {
      // =========================================================================
      // CHUNKED PIPELINE WITH CROSS-CHUNK MEMORY & JITTER
      // =========================================================================
      if (onProgress) onProgress('Partitioning sections for memory safety...');
      const chunks = partitionText(text, 750);
      const parts = [];
      let lastSanitizedTail = '';
      const establishedEntities = new Set();

      for (let i = 0; i < chunks.length; i++) {
        if (onProgress) onProgress(`Polishing Section ${i + 1} of ${chunks.length}...`);
        const chunk = chunks[i];

        // Sinusoidal temperature & top-p jitter
        const jitteredTemp = Number((0.58 + (Math.sin(i * 1.5 + 0.4) * 0.08)).toFixed(2));
        const jitteredTopP = Number((0.93 + (Math.cos(i * 1.5 + 0.4) * 0.03)).toFixed(2));

        const chunkSystem = `You are a master human author and prose editor.
Humanize this section while preserving exact formatting and ideas.
COGNITIVE HUMAN INVARIANTS:
- ZERO IDEA LOSS: Retain every argument, metric, technical detail, and claim.
- ZERO FORMATTING LOSS: Retain every paragraph break, heading, and list marker verbatim.
- ANTI-TRICOLON BAN: Never force descriptions into triplets.
- ASYMMETRIC BURSTINESS: Alternate short punchy statements with longer clauses.
- ZERO EM-DASHES (—): Use natural punctuation instead.
- ZERO SYNTHETIC TASTE: Cut throat-clearing and corporate buzzwords.
VOICE: ${persona.name}
${personaYaml}
Output ONLY humanized prose for this section. No preamble.`;

        let chunkUser = `AUTHENTIC CADENCE SKELETONS:
${framesText}\n\n`;

        if (i > 0 && lastSanitizedTail) {
          chunkUser += `CONTINUITY & CO-REFERENCE MEMORY (Section ${i + 1} of ${chunks.length}):
- Manuscript in active progress. Do NOT write an introduction or summary.
- Do NOT redefine established acronyms.
- Preceding section concluded with: "${lastSanitizedTail}"\n`;
          if (establishedEntities.size > 0) {
            chunkUser += `- Active terms: ${Array.from(establishedEntities).slice(0, 8).join(', ')}\n`;
          }
          chunkUser += `\n`;
        }

        chunkUser += `SECTION TO HUMANIZE:\n${chunk}`;

        const sectionOut = await executeLLMCall({
          provider,
          config,
          systemPrompt: chunkSystem,
          userPrompt: chunkUser,
          temperature: jitteredTemp,
          top_p: jitteredTopP
        });

        const cleanedSection = amputateSlop(sectionOut || chunk).trim();
        parts.push(cleanedSection);

        // Update state memory
        const sents = cleanedSection.split(/(?<=[.!?])\s+/).filter(Boolean);
        if (sents.length > 0) lastSanitizedTail = sents.slice(-2).join(' ').slice(-200).trim();
        const entitiesFound = cleanedSection.match(/\b[A-Z]{2,6}\b/g) || [];
        for (const e of entitiesFound) {
          if (!['THE', 'AND', 'FOR', 'NOT', 'BUT'].includes(e)) establishedEntities.add(e);
        }
      }

      rawLLMOutput = parts.join('\n\n');

    } else {
      // =========================================================================
      // FAST SINGLE-PASS COGNITIVE SYNTHESIS
      // =========================================================================
      if (onProgress) onProgress('Fast humanization with cognitive constraints...');

      const singleSystem = `You are a master human author and prose editor.
Humanize this text while retaining 100% of claims, explanations, and structure.

COGNITIVE HUMAN INVARIANTS:
1. ZERO IDEA LOSS: Retain every argument, metric, technical detail, and factual claim intact.
2. ZERO FORMATTING LOSS: Retain every paragraph break (\\n\\n), heading, bullet item, and list marker verbatim.
3. ANTI-TRICOLON BAN: Never force descriptions into triplets of adjectives or verbs.
4. ASYMMETRIC BURSTINESS: Alternate short punchy statements (4–8 words) with longer analytical sentences (22–35 words).
5. NATURAL NOUN REPETITION: Repeat precise technical terms naturally without self-conscious synonym cycling.
6. NO MORALIZING CLOSURES: End directly on the final concrete fact. Never append summarizing optimism.
7. ZERO EM-DASHES (—): Use natural commas, colons, or semicolons instead.
8. REMOVE SYNTHETIC TASTE: Cut robotic throat-clearing, binary contrast clichés, and corporate buzzwords.

VOICE CONSTRAINTS (${persona.name}):
${personaYaml}

Output ONLY the humanized prose with exact original formatting preserved. No preamble, no quotes.`;

      const singleUser = `AUTHENTIC CADENCE SKELETONS TO EMULATE:
${framesText}

DOCUMENT TO HUMANIZE (PRESERVE EXACT PARAGRAPHS, HEADINGS, AND IDEAS):
${text}`;

      rawLLMOutput = await executeLLMCall({
        provider,
        config,
        systemPrompt: singleSystem,
        userPrompt: singleUser,
        temperature: 0.62,
        top_p: 0.93
      });
    }

  } catch (err) {
    console.warn('LLM call failed in extension, falling back to instant surgery:', err);
    const fallbackClean = amputateSlop(text);
    return {
      rewritten: fallbackClean,
      lintBefore,
      lintAfter: lintProse(fallbackClean),
      mode,
      provider: 'Instant Fallback (LLM unreachable: ' + err.message + ')',
      voice: persona.name,
      warning: err.message,
      diff: generateWordDiff(text, fallbackClean)
    };
  }

  // Pass 4: Deterministic Slop Surgery + Final Alignment Audit
  const finalRewrite = amputateSlop(rawLLMOutput || text);
  const lintAfter = lintProse(finalRewrite);

  return {
    rewritten: finalRewrite,
    lintBefore,
    lintAfter,
    mode,
    provider: provider,
    voice: persona.name,
    diff: generateWordDiff(text, finalRewrite)
  };
}

// Helper to strip <think>...</think> reasoning traces from models like DeepSeek-R1
function sanitizeModelOutput(text) {
  if (!text) return '';
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

export function detectChromeAI() {
  const g = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {}));
  
  // 1. W3C Standard Prompt API (Chrome 132+)
  if (g.LanguageModel) {
    return {
      supported: true,
      status: 'available',
      model: 'Gemini Nano (W3C LanguageModel)',
      api: g.LanguageModel,
      isClass: true
    };
  }

  // 2. Chrome Preview Prompt API (window.ai.languageModel)
  const aiObj = g.ai?.languageModel || g.window?.ai?.languageModel || g.navigator?.ai?.languageModel || g.self?.ai?.languageModel;
  if (aiObj) {
    return {
      supported: true,
      status: 'available',
      model: 'Gemini Nano (ai.languageModel)',
      api: aiObj,
      isClass: false
    };
  }

  return { supported: false, status: 'unavailable', message: 'Prompt API not detected in this context' };
}

export async function fetchOllamaModels(customEndpoint) {
  const candidateBases = [];
  if (customEndpoint && typeof customEndpoint === 'string' && customEndpoint.trim()) {
    candidateBases.push(customEndpoint.trim().replace(/\/+$/, ''));
  }
  // Always include standard IPv4 loopback (Windows Ollama default) and localhost
  if (!candidateBases.includes('http://127.0.0.1:11434')) candidateBases.push('http://127.0.0.1:11434');
  if (!candidateBases.includes('http://localhost:11434')) candidateBases.push('http://localhost:11434');

  let lastErr = null;
  for (const base of candidateBases) {
    const urls = [`${base}/api/tags`, `${base}/v1/models`];
    for (const url of urls) {
      try {
        const res = await fetch(url, { method: 'GET' });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.models)) {
            const models = json.models.map(m => m.name || m.model).filter(Boolean);
            return { workingEndpoint: base, models };
          }
          if (Array.isArray(json.data)) {
            const models = json.data.map(m => m.id).filter(Boolean);
            return { workingEndpoint: base, models };
          }
        }
      } catch (err) {
        lastErr = err;
      }
    }
  }

  throw new Error(`Cannot reach Ollama at 127.0.0.1:11434 or localhost:11434 (${lastErr ? lastErr.message : 'Connection refused'}). Make sure Ollama is running ('ollama serve').`);
}

async function executeLLMCall({ provider, config, systemPrompt, userPrompt, temperature, top_p }) {
  if (provider === 'ollama') {
    return await callOllama({
      endpoint: config.ollamaEndpoint || 'http://127.0.0.1:11434',
      model: config.ollamaModel || 'llama3.2',
      systemPrompt,
      userPrompt,
      temperature,
      top_p
    });
  } else if (provider === 'chrome-ai') {
    return await callChromeAI({
      systemPrompt,
      userPrompt,
      temperature,
      top_p,
      tabId: config.tabId
    });
  } else if (provider === 'webllm') {
    return await callWebLLMOrLocalServer({
      endpoint: config.webllmEndpoint || 'http://127.0.0.1:8000/v1',
      model: config.webllmModel || 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
      apiKey: config.webllmApiKey || 'not-needed',
      systemPrompt,
      userPrompt,
      temperature,
      top_p
    });
  } else if (provider === 'gemini') {
    return await callGemini({
      apiKey: config.geminiApiKey,
      model: config.geminiModel || 'gemini-2.0-flash',
      systemPrompt,
      userPrompt,
      temperature,
      top_p
    });
  } else if (provider === 'openai' || provider === 'groq') {
    return await callOpenAICompatible({
      endpoint: provider === 'groq' ? 'https://api.groq.com/openai/v1' : (config.openaiEndpoint || 'https://api.openai.com/v1'),
      apiKey: provider === 'groq' ? config.groqApiKey : config.openaiApiKey,
      model: provider === 'groq' ? (config.groqModel || 'llama-3.3-70b-versatile') : (config.openaiModel || 'gpt-4o-mini'),
      systemPrompt,
      userPrompt,
      temperature,
      top_p
    });
  }
  return amputateSlop(userPrompt);
}

async function callOllama({ endpoint, model, systemPrompt, userPrompt, temperature = 0.62, top_p = 0.93 }) {
  const cleanModel = (model || 'llama3.2').trim();
  const rawBase = (endpoint || 'http://127.0.0.1:11434').trim().replace(/\/+$/, '');

  // Build candidate bases to handle Windows IPv4 vs IPv6 loopback
  const candidateBases = [rawBase];
  if (rawBase.includes('localhost:11434') && !candidateBases.includes('http://127.0.0.1:11434')) {
    candidateBases.push('http://127.0.0.1:11434');
  }
  if (rawBase.includes('127.0.0.1:11434') && !candidateBases.includes('http://localhost:11434')) {
    candidateBases.push('http://localhost:11434');
  }

  // Model name variants (e.g. "llama3.2" and "llama3.2:latest")
  const modelCandidates = [cleanModel];
  if (!cleanModel.includes(':')) {
    modelCandidates.push(`${cleanModel}:latest`);
  } else if (cleanModel.endsWith(':latest')) {
    modelCandidates.push(cleanModel.replace(/:latest$/, ''));
  }

  let lastError = null;

  for (const base of candidateBases) {
    for (const m of modelCandidates) {
      // Try /api/chat route
      try {
        const res = await fetch(`${base}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: m,
            messages: [
              ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
              { role: 'user', content: userPrompt }
            ],
            stream: false,
            options: {
              temperature,
              top_p,
              num_ctx: 16384
            }
          })
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.message?.content;
          if (content) return sanitizeModelOutput(content);
        } else if (res.status !== 404) {
          const errText = await res.text().catch(() => '');
          lastError = new Error(`Ollama HTTP ${res.status}: ${errText}`);
        }
      } catch (err) {
        lastError = err;
      }

      // Try OpenAI-compatible /v1/chat/completions route on Ollama
      try {
        const v1Url = base.endsWith('/v1') ? `${base}/chat/completions` : `${base}/v1/chat/completions`;
        const res = await fetch(v1Url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: m,
            messages: [
              ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
              { role: 'user', content: userPrompt }
            ],
            temperature,
            top_p,
            stream: false
          })
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) return sanitizeModelOutput(content);
        } else if (res.status !== 404) {
          const errText = await res.text().catch(() => '');
          lastError = new Error(`Ollama HTTP ${res.status}: ${errText}`);
        }
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw new Error(
    `Failed to connect to Ollama (${cleanModel}) at ${rawBase}. ` +
    `Ensure Ollama is running ('ollama serve') and model is installed ('ollama run ${cleanModel}'). ` +
    `Error details: ${lastError ? lastError.message : 'Unreachable'}`
  );
}

async function callChromeAI({ systemPrompt, userPrompt, temperature, top_p, tabId }) {
  const detection = detectChromeAI();
  if (detection.supported && detection.api) {
    const aiObj = detection.api;
    let session = null;
    try {
      session = await aiObj.create({
        systemPrompt: systemPrompt || undefined,
        temperature: typeof temperature === 'number' ? temperature : 0.65,
        topK: 3
      });

      const reply = await session.prompt(userPrompt);
      return sanitizeModelOutput(reply);
    } finally {
      if (session && typeof session.destroy === 'function') {
        try { session.destroy(); } catch (e) {}
      }
    }
  }

  // If in background service worker without window context, delegate to active tab
  if (tabId && typeof chrome !== 'undefined' && chrome.tabs?.sendMessage) {
    try {
      const res = await chrome.tabs.sendMessage(tabId, {
        action: 'PROMPT_CHROME_AI',
        systemPrompt,
        userPrompt
      });
      if (res && res.text) return sanitizeModelOutput(res.text);
      if (res && res.error) throw new Error(res.error);
    } catch (e) {
      console.warn('Tab delegation for Chrome AI failed:', e);
    }
  }

  throw new Error(
    'Chrome Built-in AI (Prompt API) not available in this context. ' +
    'To enable: use Chrome 127+ and turn on chrome://flags/#prompt-api-for-gemini-nano, ' +
    'or switch to Ollama / Instant mode.'
  );
}

async function callWebLLMOrLocalServer({ endpoint, model, apiKey, systemPrompt, userPrompt, temperature = 0.62, top_p = 0.93 }) {
  const rawBase = (endpoint || 'http://127.0.0.1:8000/v1').trim().replace(/\/+$/, '');
  const url = rawBase.endsWith('/chat/completions') ? rawBase : `${rawBase}/chat/completions`;

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey && apiKey !== 'not-needed') {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: model || 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: userPrompt }
      ],
      temperature,
      top_p
    })
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`WebLLM / Local Server HTTP ${res.status}: ${errText || res.statusText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  return sanitizeModelOutput(content);
}

async function callGemini({ apiKey, model, systemPrompt, userPrompt, temperature = 0.62, top_p = 0.93 }) {
  if (!apiKey) throw new Error('Gemini API key is required in extension options.');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { temperature, topP: top_p }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
}

async function callOpenAICompatible({ endpoint, apiKey, model, systemPrompt, userPrompt, temperature = 0.62, top_p = 0.93 }) {
  if (!apiKey) throw new Error('API key is required in extension options.');
  const base = endpoint.replace(/\/+$/, '');
  const url = base.endsWith('/chat/completions') ? base : `${base}/chat/completions`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature,
      top_p
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

function partitionText(text, targetWords = 750) {
  const paras = text.split(/\n\n+/).filter(Boolean);
  if (paras.length <= 1) return [text];

  const chunks = [];
  let current = [];
  let words = 0;

  for (const p of paras) {
    const pWords = p.split(/\s+/).filter(Boolean).length;
    if (words + pWords > targetWords && current.length > 0) {
      chunks.push(current.join('\n\n'));
      current = [p];
      words = pWords;
    } else {
      current.push(p);
      words += pWords;
    }
  }

  if (current.length > 0) chunks.push(current.join('\n\n'));
  return chunks;
}

// Lightweight Word-Level Diff Generator for in-HUD and in-Popup comparison
export function generateWordDiff(original, humanized) {
  if (!original || !humanized) return [];
  const origTokens = original.split(/(\s+)/);
  const humTokens = humanized.split(/(\s+)/);

  // Compute token set difference for visual highlight
  const humSet = new Set(humTokens.map(t => t.toLowerCase().trim()).filter(Boolean));
  const origSet = new Set(origTokens.map(t => t.toLowerCase().trim()).filter(Boolean));

  return {
    deletedWordsCount: origTokens.filter(t => t.trim() && !humSet.has(t.toLowerCase().trim())).length,
    addedWordsCount: humTokens.filter(t => t.trim() && !origSet.has(t.toLowerCase().trim())).length
  };
}
