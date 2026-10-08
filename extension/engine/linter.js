// Stop Slop Stylometric & Pattern Linter Engine

export const TIER_0_PATTERNS = [
  { id: 'citation-leak-1', regex: /citeturn\d+search\d+/gi, label: 'Chatbot citation token leak' },
  { id: 'citation-leak-2', regex: /contentReference\[oaicite:\d+\]/gi, label: 'OpenAI citation leak' },
  { id: 'citation-leak-3', regex: /\[attached_file:\d+\]/gi, label: 'Attached file token leak' },
  { id: 'citation-leak-4', regex: /grok_card/gi, label: 'Grok citation leak' },
  { id: 'url-tracker', regex: /[?&](?:utm_source=(?:chatgpt\.com|copilot\.com|openai|claude\.ai|perplexity\.ai)|referrer=grok\.com)/gi, label: 'AI tool tracking parameter in URL' },
  { id: 'placeholder-bracket', regex: /\[(?:Your Name|Insert|Add|Enter|Describe|Specify)[^\]]*\]/gi, label: 'Unfilled template placeholder' },
  { id: 'chatbot-artifact-1', regex: /\b(?:I hope this helps!|Great question!|Feel free to reach out|As of my last update)\b/gi, label: 'Conversational chatbot artifact' },
];

export const TIER_1A_WORDS = [
  'delve', 'delving', 'delves',
  'tapestry', 'tapestries',
  'realm', 'realms',
  'paradigm', 'paradigms',
  'embark', 'embarking', 'embarks',
  'beacon', 'beacons',
  'testament to',
  'watershed moment',
  'game-changer', 'game-changing',
  'at its core',
  'cutting-edge',
  'seamless', 'seamlessly',
  'meticulous', 'meticulously',
  'underscores', 'underscored',
  'leverage', 'leveraging',
  'robust',
  'comprehensive',
  'pivotal',
  'interplay',
  'holistic', 'holistically',
  'actionable',
  'impactful',
  'learnings',
  'foster', 'fostering', 'fosters',
  'nuanced',
  'multifaceted',
  'paramount',
  'catalyst', 'catalysts',
  'imperative',
  'bolster', 'bolstering',
  'navigate the complexities',
  'ushering in',
  'poised to'
];

export const TIER_1B_WORDS = [
  'utilize', 'utilizing', 'utilizes',
  'in order to',
  'due to the fact that',
  'serves as',
  'features as',
  'boasts',
  'commence', 'commencing',
  'ascertain',
  'endeavor', 'endeavors'
];

export const STRUCTURAL_PATTERNS = [
  { id: 'binary-contrast', regex: /\b(?:it['’]s not about|isn['’]t the problem|not because [^.]+\. Because)\b/gi, label: 'Binary contrast cliché ("Not X, but Y")' },
  { id: 'aphorism-formula', regex: /\b(?:is the (?:language|currency|architecture|mirror) of)\b/gi, label: 'Aphorism slot-fill formula' },
  { id: 'infomercial-hook', regex: /\b(?:the catch\?|the kicker\?|plot twist:|here['’]s the thing:|let that sink in)\b/gi, label: 'Infomercial engagement hook' },
  { id: 'future-narrative', regex: /\b(?:poised to become|may become one of the most|the future looks bright)\b/gi, label: 'Generic future-narrative closer' },
  { id: 'hedge-stack', regex: /\b(?:could potentially|may eventually|might ultimately)\b/gi, label: 'Hedge-stacked modal prediction' },
  { id: 'narrated-candor', regex: /\b(?:to be (?:completely|fully) transparent|two caveats I (?:would|'d) rather flag)\b/gi, label: 'Narrated candor ("performing honesty")' },
  { id: 'recap-flattery', regex: /\b(?:thanks for all the legwork|your (?:excellent|great) work on)\b/gi, label: 'Recap-flattery conversational opener' },
  { id: 'moralizing-closer', regex: /\b(?:paves? the way for|a testament to what lies ahead|the journey ahead|endless possibilities|unlocking? the full potential of)\b/gi, label: 'Moralizing / promotional conclusion cliché' }
];

export function lintProse(text) {
  if (!text || typeof text !== 'string') {
    return {
      stats: { words: 0, sentences: 0, paragraphs: 0, ttr: 0, burstiness: 0, avgLength: 0 },
      findings: [],
      score: 100,
    };
  }

  const findings = [];

  // Check Tier 0
  for (const item of TIER_0_PATTERNS) {
    const matches = [...text.matchAll(item.regex)];
    for (const match of matches) {
      findings.push({
        tier: 'P0',
        severity: 'danger',
        label: item.label,
        match: match[0],
        index: match.index,
        category: 'Publishing Bug'
      });
    }
  }

  // Check Tier 1A (AI frequency markers)
  for (const word of TIER_1A_WORDS) {
    const reg = new RegExp(`\\b${word.replace('-', '[-\\s]')}\\b`, 'gi');
    const matches = [...text.matchAll(reg)];
    for (const match of matches) {
      findings.push({
        tier: 'P1',
        severity: 'warning',
        label: `AI frequency marker: "${match[0]}"`,
        match: match[0],
        index: match.index,
        category: 'Tier 1A Vocabulary'
      });
    }
  }

  // Check Tier 1B (Clarity edits)
  for (const word of TIER_1B_WORDS) {
    const reg = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = [...text.matchAll(reg)];
    for (const match of matches) {
      findings.push({
        tier: 'P2',
        severity: 'info',
        label: `Inflated formality / Wordiness: "${match[0]}"`,
        match: match[0],
        index: match.index,
        category: 'Tier 1B Clarity'
      });
    }
  }

  // Check Structural Patterns
  for (const item of STRUCTURAL_PATTERNS) {
    const matches = [...text.matchAll(item.regex)];
    for (const match of matches) {
      findings.push({
        tier: 'P1',
        severity: 'warning',
        label: item.label,
        match: match[0],
        index: match.index,
        category: 'Structural Cliché'
      });
    }
  }

  // Check Em Dashes rate
  const emDashMatches = text.match(/[—]|--/g) || [];
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const emDashRatePer1k = wordCount > 0 ? (emDashMatches.length / wordCount) * 1000 : 0;

  if (emDashRatePer1k > 1.2 && emDashMatches.length > 1) {
    findings.push({
      tier: 'P1',
      severity: 'warning',
      label: `High em-dash density (${emDashMatches.length} dashes in ${wordCount} words; target ≤ 1 per 1,000 words)`,
      match: '—',
      category: 'Punctuation'
    });
  }

  // Stylometric Computations
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  const paragraphs = text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  const sentenceLengths = sentences.map(s => s.split(/\s+/).filter(Boolean).length);
  const avgSentenceLength = sentenceLengths.length > 0
    ? sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length
    : 0;

  // Standard deviation (Burstiness)
  let variance = 0;
  if (sentenceLengths.length > 1) {
    const mean = avgSentenceLength;
    variance = sentenceLengths.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / sentenceLengths.length;
  }
  const burstiness = Math.sqrt(variance);

  // Type-Token Ratio (TTR)
  const tokenSet = new Set(words.map(w => w.toLowerCase().replace(/[^a-z0-9]/g, '')));
  tokenSet.delete('');
  const ttr = wordCount > 0 ? (tokenSet.size / wordCount) : 0;

  // Naturalness Health Score (100 - penalties)
  let penalty = 0;
  penalty += findings.filter(f => f.tier === 'P0').length * 25;
  penalty += findings.filter(f => f.tier === 'P1').length * 8;
  penalty += findings.filter(f => f.tier === 'P2').length * 3;
  if (wordCount > 150 && burstiness < 3.5) penalty += 15; // Low burstiness penalty
  if (wordCount > 200 && ttr < 0.40) penalty += 15; // Vocabulary starvation penalty

  const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));

  return {
    stats: {
      words: wordCount,
      sentences: sentences.length,
      paragraphs: paragraphs.length,
      ttr: Number(ttr.toFixed(3)),
      burstiness: Number(burstiness.toFixed(2)),
      avgLength: Number(avgSentenceLength.toFixed(1)),
    },
    findings,
    score,
  };
}
