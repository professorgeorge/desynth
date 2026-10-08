import { amputateSlop } from './deslop-surgery.js';
import { lintProse } from './linter.js';
import { ALL_PERSONAS, formatPersonaYaml } from './personas.js';

export async function humanizeText({
  text,
  voiceId = 'george-orwell',
  provider = 'instant', // 'instant', 'ollama', 'gemini', 'openai', 'groq'
  config = {}
}) {
  if (!text || typeof text !== 'string') return { rewritten: '', lintBefore: null, lintAfter: null };

  const lintBefore = lintProse(text);
  const persona = ALL_PERSONAS.find(p => p.id === voiceId) || ALL_PERSONAS[1] || ALL_PERSONAS[0];

  // 1. Instant 0ms Deterministic Surgery (Zero latency, works offline, no keys)
  if (provider === 'instant') {
    const surgicalClean = amputateSlop(text);
    const lintAfter = lintProse(surgicalClean);
    return {
      rewritten: surgicalClean,
      lintBefore,
      lintAfter,
      provider: 'Instant Deterministic (0ms)',
      voice: persona.name
    };
  }

  // 2. LLM-Assisted Humanization
  const personaYaml = formatPersonaYaml(persona.card);
  const systemPrompt = `You are a master human prose craftsman and editor.
Your task is to humanize AI-generated text that has sound ideas, but suffers from sterile, robotic "AI taste".

COGNITIVE HUMAN INVARIANTS:
1. ZERO IDEA LOSS: Retain every argument, metric, technical detail, and factual claim intact.
2. ZERO FORMATTING LOSS: Retain every paragraph break, heading, and list item verbatim.
3. ANTI-TRICOLON BAN: Never force descriptions into triplets of adjectives or verbs ("scalable, robust, and intuitive"). Use natural pairs or singular attributes.
4. ASYMMETRIC BURSTINESS: Alternate short punchy statements (4–8 words) with longer analytical clauses (22–35 words).
5. NATURAL NOUN REPETITION: Repeat precise technical terms naturally without self-conscious synonym cycling.
6. NO MORALIZING CLOSURES: End on the final concrete fact or takeaway. Never append generic summarizing optimism ("Ultimately, embracing X paves the way for Y").
7. ZERO EM-DASHES (—): Total prohibition of em-dashes. Use colons, semicolons, parentheses, or separate sentences instead.
8. REMOVE SYNTHETIC TASTE: Cut robotic throat-clearing, binary contrast clichés ("not merely X; rather Y"), and corporate buzzwords ("tapestry", "delve", "realm", "beacon", "foster").

VOICE CONSTRAINTS (${persona.name}):
${personaYaml}

Output ONLY the humanized prose with exact original formatting preserved. No preamble, no quotes, no conversational filler.`;

  const userPrompt = `TEXT TO HUMANIZE (PRESERVE EXACT PARAGRAPHS, HEADINGS, AND IDEAS):
${text}`;

  let rawLLMOutput = '';

  try {
    if (provider === 'ollama') {
      rawLLMOutput = await callOllama({
        endpoint: config.ollamaEndpoint || 'http://localhost:11434',
        model: config.ollamaModel || 'llama3.2',
        systemPrompt,
        userPrompt
      });
    } else if (provider === 'gemini') {
      rawLLMOutput = await callGemini({
        apiKey: config.geminiApiKey,
        model: config.geminiModel || 'gemini-2.0-flash',
        systemPrompt,
        userPrompt
      });
    } else if (provider === 'openai' || provider === 'groq') {
      rawLLMOutput = await callOpenAICompatible({
        endpoint: provider === 'groq' ? 'https://api.groq.com/openai/v1' : (config.openaiEndpoint || 'https://api.openai.com/v1'),
        apiKey: provider === 'groq' ? config.groqApiKey : config.openaiApiKey,
        model: provider === 'groq' ? (config.groqModel || 'llama-3.3-70b-versatile') : (config.openaiModel || 'gpt-4o-mini'),
        systemPrompt,
        userPrompt
      });
    } else {
      rawLLMOutput = amputateSlop(text);
    }
  } catch (err) {
    console.warn('LLM call failed in extension, falling back to instant surgery:', err);
    const fallbackClean = amputateSlop(text);
    return {
      rewritten: fallbackClean,
      lintBefore,
      lintAfter: lintProse(fallbackClean),
      provider: 'Instant Fallback (LLM unreachable: ' + err.message + ')',
      voice: persona.name,
      warning: err.message
    };
  }

  const cleaned = amputateSlop(rawLLMOutput || text);
  const lintAfter = lintProse(cleaned);

  return {
    rewritten: cleaned,
    lintBefore,
    lintAfter,
    provider: provider,
    voice: persona.name
  };
}

async function callOllama({ endpoint, model, systemPrompt, userPrompt }) {
  const base = endpoint.replace(/\/+$/, '');
  const url = base.endsWith('/v1') ? `${base}/chat/completions` : `${base}/api/chat`;

  const isV1 = url.endsWith('/chat/completions');
  const body = isV1 ? {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.62,
    top_p: 0.93,
    stream: false,
    options: { temperature: 0.62, top_p: 0.93 }
  } : {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    stream: false,
    options: { temperature: 0.62, top_p: 0.93 }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Ollama HTTP ${res.status}: ${errText || res.statusText}`);
  }

  const data = await res.json();
  const content = isV1 ? data.choices?.[0]?.message?.content : data.message?.content;
  return content || '';
}

async function callGemini({ apiKey, model, systemPrompt, userPrompt }) {
  if (!apiKey) throw new Error('Gemini API key is required in extension options.');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { temperature: 0.62, topP: 0.93 }
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

async function callOpenAICompatible({ endpoint, apiKey, model, systemPrompt, userPrompt }) {
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
      temperature: 0.62,
      top_p: 0.93
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}
