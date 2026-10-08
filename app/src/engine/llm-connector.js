// Multi-Engine LLM Connector (Chrome Built-in AI, Ollama, Cloud APIs, Simulation)

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

export async function callLLM({ provider, apiKey, endpoint, model, systemPrompt, userPrompt, onProgress }) {
  if (provider === 'chrome-ai') {
    return await callChromeAI(systemPrompt, userPrompt, onProgress);
  }
  if (provider === 'ollama') {
    return await callOllama(endpoint || 'http://localhost:11434/v1', model || 'llama3.2', systemPrompt, userPrompt, onProgress);
  }
  if (provider === 'gemini') {
    return await callGeminiAPI(apiKey, model || 'gemini-2.0-flash', systemPrompt, userPrompt, onProgress);
  }
  if (provider === 'openai' || provider === 'groq' || provider === 'openrouter') {
    const defaultEndpoint = provider === 'groq'
      ? 'https://api.groq.com/openai/v1'
      : provider === 'openrouter'
      ? 'https://openrouter.ai/api/v1'
      : 'https://api.openai.com/v1';
    const defaultModel = provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';
    return await callOpenAICompatible(endpoint || defaultEndpoint, apiKey, model || defaultModel, systemPrompt, userPrompt, onProgress);
  }
  if (provider === 'anthropic') {
    return await callAnthropic(apiKey, model || 'claude-3-5-sonnet-20241022', systemPrompt, userPrompt, onProgress);
  }

  // Simulation fallback
  return await mockSimulation(userPrompt, onProgress);
}

async function callChromeAI(systemPrompt, userPrompt, onProgress) {
  const aiObj = window.ai?.languageModel || navigator.ai?.languageModel;
  if (!aiObj) {
    throw new Error('Chrome Built-in AI (Prompt API) is not enabled on this browser. Try Chrome 127+ with chrome://flags/#prompt-api-for-gemini-nano enabled, or switch to Gemini API / Ollama.');
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

async function callOllama(endpoint, model, systemPrompt, userPrompt, onProgress) {
  const url = `${endpoint.replace(/\/+$/, '')}/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      stream: false
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ollama error (${response.status}): ${errText || 'Connection failed. Ensure Ollama is running with OLLAMA_ORIGINS=*'}`);
  }

  const data = await response.json();
  const output = data.choices?.[0]?.message?.content || '';
  if (onProgress) onProgress(output);
  return output;
}

async function callGeminiAPI(apiKey, model, systemPrompt, userPrompt, onProgress) {
  if (!apiKey) {
    throw new Error('Google Gemini API key required. Enter your key in engine settings.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [{
        parts: [{ text: userPrompt }]
      }],
      generationConfig: {
        temperature: 0.7
      }
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Gemini API Error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (onProgress) onProgress(text);
  return text;
}

async function callOpenAICompatible(endpoint, apiKey, model, systemPrompt, userPrompt, onProgress) {
  if (!apiKey) {
    throw new Error('API key required for this cloud provider.');
  }

  const url = `${endpoint.replace(/\/+$/, '')}/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`API error (${response.status}): ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  if (onProgress) onProgress(text);
  return text;
}

async function callAnthropic(apiKey, model, systemPrompt, userPrompt, onProgress) {
  if (!apiKey) {
    throw new Error('Anthropic API key required.');
  }

  const url = 'https://api.anthropic.com/v1/messages';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Anthropic Error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  if (onProgress) onProgress(text);
  return text;
}

async function mockSimulation(userPrompt, onProgress) {
  await new Promise(r => setTimeout(r, 600));
  return `Clean, humanized synthesis derived from user input. Anchored in concrete mechanics rather than formulaic filler.`;
}
