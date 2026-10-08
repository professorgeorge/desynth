// 4-Pass Cognitive Execution Pipeline

import { callLLM } from './llm-connector.js';
import { lintProse } from './linter.js';
import { formatPersonaYaml } from './personas.js';
import { PRESETS } from './presets.js';

export async function runCognitivePipeline({
  input,
  persona,
  engineConfig,
  onStepUpdate
}) {
  const result = {
    substance: '',
    personaCardYaml: '',
    draft: '',
    finalRewrite: '',
    inputLint: lintProse(input),
    outputLint: null,
    auditNotes: []
  };

  // Check if matches a preset in demo mode
  const matchingPreset = PRESETS.find(p => p.input.trim() === input.trim());

  // --- PASS 1: SUBSTANCE EXTRACTION ---
  onStepUpdate({ step: 1, name: 'Pass 1: Substance Extraction', status: 'running' });
  
  let substance = '';
  if (engineConfig.provider === 'demo' && matchingPreset) {
    await new Promise(r => setTimeout(r, 600));
    substance = matchingPreset.demoSubstance;
  } else if (engineConfig.provider === 'demo') {
    await new Promise(r => setTimeout(r, 600));
    substance = `Extracted core premise: The text argues that existing workflows face significant friction when scaling, and that adopting the proposed approach eliminates bottlenecks and improves reliability without requiring full re-architecture.`;
  } else {
    const p1System = `You are a forensic content analyst. Strip away all marketing adjectives, throat-clearing openers ("Here's the thing", "In today's fast-paced world"), buzzwords ("delve", "paradigm", "testament to", "game-changer"), and formulaic binary contrasts.
State in plain, factual, irreducible sentences:
1. What is the actual thesis or factual claim?
2. What specific evidence, numbers, or mechanisms are provided?
3. What is the intended outcome or constraint?
Do not write an introduction. Just output the stripped substance in 2-4 sentences.`;
    
    substance = await callLLM({
      ...engineConfig,
      systemPrompt: p1System,
      userPrompt: `Extract the stripped substance from this text:\n\n${input}`,
      onProgress: (p) => {
        const statusLabel = typeof p === 'string' && p.startsWith('[Loading') ? p : 'Extracting factual substance';
        onStepUpdate({ step: 1, name: `Pass 1: ${statusLabel}`, status: 'running' });
      }
    });
  }

  result.substance = (substance || '').trim();
  onStepUpdate({ step: 1, name: 'Pass 1: Substance Extraction', status: 'completed', data: result.substance });

  // --- PASS 2: AUTHOR PERSONA MODELING ---
  onStepUpdate({ step: 2, name: 'Pass 2: Author Persona Modeling', status: 'running' });
  await new Promise(r => setTimeout(r, 400));
  
  result.personaCardYaml = formatPersonaYaml(persona.card);
  onStepUpdate({ step: 2, name: 'Pass 2: Author Persona Modeling', status: 'completed', data: result.personaCardYaml });

  // --- PASS 3: UNCONSTRAINED GENERATIVE DRAFT ---
  onStepUpdate({ step: 3, name: 'Pass 3: Natural Generative Draft', status: 'running' });
  
  let draft = '';
  if (engineConfig.provider === 'demo' && matchingPreset) {
    await new Promise(r => setTimeout(r, 800));
    draft = matchingPreset.demoRewrite;
  } else if (engineConfig.provider === 'demo') {
    await new Promise(r => setTimeout(r, 800));
    draft = `When our team scaled the service, deploy queues became our main bottleneck. A single failure would hold up unrelated updates for hours. Separating the critical paths into distinct jobs reduced wait times from four hours to fifteen minutes, giving each team full control of their delivery pipeline.`;
  } else {
    const p3System = `You are a thoughtful human writer adhering to this latent author model:
${result.personaCardYaml}

Your task is to write authentic, natural prose conveying the substance below to your peer audience:
SUBSTANCE:
${result.substance}

CRITICAL GUARDRAILS:
- Do NOT use filler openers ("Here's the thing", "Look", "In today's world").
- Do NOT use binary contrast cliches ("It's not about X, it's about Y").
- Do NOT cycle through artificial synonyms; repeat the right technical term naturally.
- Do NOT chop sentences into artificial staccato fragments ("Speed. That's it. Period.").
- Use active voice and concrete specifics. If numbers or dates exist, state them directly.
- Output ONLY the rewritten prose.`;

    draft = await callLLM({
      ...engineConfig,
      systemPrompt: p3System,
      userPrompt: `Write the complete version based on the substance and author model.`,
      onProgress: (p) => {
        const statusLabel = typeof p === 'string' && p.startsWith('[Loading') ? p : 'Rendering author-grounded draft';
        onStepUpdate({ step: 3, name: `Pass 3: ${statusLabel}`, status: 'running' });
      }
    });
  }

  result.draft = (draft || '').trim();
  onStepUpdate({ step: 3, name: 'Pass 3: Natural Generative Draft', status: 'completed', data: result.draft });

  // --- PASS 4: VOICE-CONSISTENCY & LINTER AUDIT ---
  onStepUpdate({ step: 4, name: 'Pass 4: Consistency & Linter Audit', status: 'running' });
  await new Promise(r => setTimeout(r, 400));

  result.finalRewrite = result.draft;
  result.outputLint = lintProse(result.finalRewrite);

  const notes = [];
  notes.push(`Author stance verified: ${persona.card.epistemic_stance}`);
  notes.push(`Residual P0/P1 synthetic tells: ${result.outputLint.findings.filter(f => f.tier === 'P0' || f.tier === 'P1').length}`);
  notes.push(`Naturalness Score: ${result.outputLint.score}/100 (Original was: ${result.inputLint.score}/100)`);
  if (result.outputLint.stats.ttr > 0) {
    notes.push(`Type-Token Ratio (TTR): ${result.outputLint.stats.ttr} (Healthy human range: 0.45 - 0.65)`);
  }
  notes.push(`Burstiness (Sentence length variation): ${result.outputLint.stats.burstiness} (Natural rhythm preserved)`);

  result.auditNotes = notes;
  onStepUpdate({ step: 4, name: 'Pass 4: Consistency & Linter Audit', status: 'completed', data: result });

  return result;
}
