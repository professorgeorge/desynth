// 4-Pass Paradigm-Shift De-Slop Pipeline
// Disassembles slop into atomic claims, grafts authentic human syntactic skeletons,
// enforces hard entropy compression budgets, and applies deterministic slop surgery.

import { callLLM } from './llm-connector.js';
import { lintProse } from './linter.js';
import { formatPersonaYaml } from './personas.js';
import { PRESETS } from './presets.js';
import {
  amputateSlop,
  extractSyntacticFrames,
  PARALLEL_EXEMPLARS
} from './deslop-surgery.js';

export async function runCognitivePipeline({
  input,
  persona,
  engineConfig,
  density = 'balanced', // 'dense' (45%), 'balanced' (60%), 'narrative' (75%)
  onStepUpdate
}) {
  const inputWords = input.trim().split(/\s+/).filter(Boolean).length;
  
  // Calculate target compression budget
  const ratio = density === 'dense' ? 0.45 : density === 'narrative' ? 0.75 : 0.60;
  const targetWords = Math.max(30, Math.round(inputWords * ratio));
  const minWords = Math.max(20, Math.round(targetWords * 0.8));
  const maxWords = Math.round(targetWords * 1.2);

  const result = {
    factGraph: '',
    syntacticFrames: [],
    personaCardYaml: '',
    rawDraft: '',
    finalRewrite: '',
    compressionRatio: 0,
    densityMode: density,
    inputLint: lintProse(input),
    outputLint: null,
    auditNotes: []
  };

  // Check matching preset in demo mode
  const matchingPreset = PRESETS.find(p => p.input.trim() === input.trim());

  // =========================================================================
  // PASS 1: TOTAL PROSE ANNIHILATION (ATOMIC CLAIM GRAPH)
  // =========================================================================
  onStepUpdate({ step: 1, name: 'Pass 1: Atomic Fact Extraction (Destroying Prose)', status: 'running' });

  let factGraph = '';
  if (engineConfig.provider === 'demo' && matchingPreset) {
    await new Promise(r => setTimeout(r, 600));
    factGraph = matchingPreset.demoSubstance;
  } else if (engineConfig.provider === 'demo') {
    await new Promise(r => setTimeout(r, 600));
    factGraph = [
      "- Scaling production traffic caused deploy queues to become the primary bottleneck.",
      "- Single service failures blocked unrelated updates for several hours.",
      "- Isolating critical path jobs reduced deployment wait times from four hours to fifteen minutes.",
      "- Independent job delivery gave teams autonomous control of releases."
    ].join('\n');
  } else {
    const p1System = `You are a forensic scientific content extractor. You completely annihilate prose and rhetoric.
Your sole job is to extract ONLY the irreducible atomic factual claims, numbers, entities, and causal relationships from the text.

RULES:
- Output a bulleted list of raw facts.
- ZERO adjectives, ZERO introductory padding, ZERO commentary.
- Preserve every exact metric, number, tool name, or entity.
- If a sentence contains no concrete fact, discard it entirely.`;

    factGraph = await callLLM({
      ...engineConfig,
      systemPrompt: p1System,
      userPrompt: `Extract the atomic claim graph from this text:\n\n${input}`,
      onProgress: (p) => {
        const statusLabel = typeof p === 'string' && p.startsWith('[Loading') ? p : 'Extracting atomic micro-claims';
        onStepUpdate({ step: 1, name: `Pass 1: ${statusLabel}`, status: 'running' });
      }
    });
  }

  result.factGraph = (factGraph || '').trim();
  onStepUpdate({
    step: 1,
    name: 'Pass 1: Atomic Fact Extraction',
    status: 'completed',
    data: result.factGraph
  });

  // =========================================================================
  // PASS 2: SYNTACTIC TEMPLATE GRAFTING
  // =========================================================================
  onStepUpdate({ step: 2, name: 'Pass 2: Syntactic Template Grafting', status: 'running' });
  await new Promise(r => setTimeout(r, 400));

  const sampleExcerpt = persona.sampleExcerpt || persona.description || '';
  const frames = extractSyntacticFrames(sampleExcerpt);
  result.syntacticFrames = frames;
  result.personaCardYaml = formatPersonaYaml(persona.card);

  const pass2Data = {
    frames,
    cardYaml: result.personaCardYaml
  };

  onStepUpdate({
    step: 2,
    name: 'Pass 2: Syntactic Template Grafting',
    status: 'completed',
    data: pass2Data
  });

  // =========================================================================
  // PASS 3: HIGH-ENTROPY COMPRESSED SYNTHESIS (STRICT WORD BUDGET)
  // =========================================================================
  onStepUpdate({ step: 3, name: `Pass 3: High-Entropy Synthesis (~${targetWords} words)`, status: 'running' });

  let draft = '';
  if (engineConfig.provider === 'demo' && matchingPreset) {
    await new Promise(r => setTimeout(r, 800));
    draft = matchingPreset.demoRewrite;
  } else if (engineConfig.provider === 'demo') {
    await new Promise(r => setTimeout(r, 800));
    draft = `When our team scaled the service, deploy queues became our main bottleneck. A single failure would hold up unrelated updates for hours. Separating the critical paths into distinct jobs reduced wait times from four hours to fifteen minutes, giving each team full control of their delivery pipeline.`;
  } else {
    // Construct High-Entropy prompt with parallel exemplars, grafted frames, and strict budget
    const exemplarText = PARALLEL_EXEMPLARS.map((ex, i) => `
EXEMPLAR ${i + 1}:
[SLOPPY INPUT]: "${ex.slop}"
[ATOMIC CLAIMS]:
${ex.facts.map(f => `- ${f}`).join('\n')}
[HUMAN COMPRESSION]:
"${ex.human}"
`).join('\n---\n');

    const framesText = frames.map((f, i) => `${i + 1}. "${f}"`).join('\n');

    const p3System = `You are an elite prose craftsman and human author. You reject all AI boilerplate, corporate filler, and generic transitions.
You are given a list of atomic factual claims and an author voice model.

YOUR MISSION:
Reconstruct the atomic claims into dense, authentic, direct human prose.

CRITICAL RULES:
1. STRICT WORD BUDGET: Write between ${minWords} and ${maxWords} words (Target: ~${targetWords} words). Every word must earn its survival.
2. SYNTACTIC GRAFTING: Emulate the cadence, clause rhythm, and asymmetrical sentence structures shown in these authentic human sentence molds:
${framesText}
3. FORBIDDEN PATTERNS:
   - ZERO throat-clearing ("In today's world", "It is worth noting that", "When it comes to").
   - ZERO binary contrasts ("It is not merely about X; rather, it is about Y").
   - ZERO signpost transitions ("Furthermore", "Moreover", "In conclusion", "Ultimately").
   - ZERO nominalizations (do not write "facilitate the implementation of" when you can write "implement").
4. Output ONLY the rewritten prose. No preamble, no quotes, no conversational filler.`;

    const p3User = `STUDY THESE PARALLEL TRANSFORMATION EXAMPLES:
${exemplarText}

AUTHOR PERSONA CONSTRAINTS:
${result.personaCardYaml}

ATOMIC CLAIMS TO RECONSTRUCT:
${result.factGraph}

Write the compressed human version now (Target: ~${targetWords} words):`;

    draft = await callLLM({
      ...engineConfig,
      systemPrompt: p3System,
      userPrompt: p3User,
      onProgress: (p) => {
        const statusLabel = typeof p === 'string' && p.startsWith('[Loading') ? p : `Compressing substance into ~${targetWords} words`;
        onStepUpdate({ step: 3, name: `Pass 3: ${statusLabel}`, status: 'running' });
      }
    });
  }

  result.rawDraft = (draft || '').trim();
  onStepUpdate({
    step: 3,
    name: 'Pass 3: High-Entropy Synthesis',
    status: 'completed',
    data: result.rawDraft
  });

  // =========================================================================
  // PASS 4: DETERMINISTIC SLOP SURGERY & STYLOMETRIC AUDIT
  // =========================================================================
  onStepUpdate({ step: 4, name: 'Pass 4: Deterministic Slop Surgery & Audit', status: 'running' });
  await new Promise(r => setTimeout(r, 400));

  // Run deterministic amputation of remaining filler and nominalizations
  const surgicalClean = amputateSlop(result.rawDraft);
  result.finalRewrite = surgicalClean || result.rawDraft;

  // Compute final linter metrics
  result.outputLint = lintProse(result.finalRewrite);

  const outputWords = result.finalRewrite.trim().split(/\s+/).filter(Boolean).length;
  result.compressionRatio = (inputWords > 0 && outputWords < inputWords)
    ? Math.round(((inputWords - outputWords) / inputWords) * 100)
    : 0;

  const notes = [];
  const compLabel = result.compressionRatio > 0 ? `-${result.compressionRatio}% reduction` : `${outputWords} words`;
  notes.push(`Information Density: ${outputWords} words (${compLabel})`);
  notes.push(`Density Target: ${density.toUpperCase()} (~${targetWords} words)`);
  notes.push(`Author Voice Model: ${persona.name} (${persona.card?.epistemic_stance || 'empirical'})`);
  notes.push(`Residual Synthetic Tells: ${result.outputLint.findings.length} (Score: ${result.outputLint.score}/100)`);
  notes.push(`Syntactic Burstiness: ${result.outputLint.stats.burstiness} (Natural sentence length variation)`);
  notes.push(`Lexical TTR: ${result.outputLint.stats.ttr}`);

  result.auditNotes = notes;

  onStepUpdate({
    step: 4,
    name: 'Pass 4: Slop Surgery & Audit',
    status: 'completed',
    data: {
      finalRewrite: result.finalRewrite,
      compressionRatio: result.compressionRatio,
      notes
    }
  });

  return result;
}
