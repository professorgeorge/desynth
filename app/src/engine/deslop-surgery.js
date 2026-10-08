// Deterministic De-Slop Surgery & Syntactic Grafting Engine
// Replaces statistical LLM auto-regressive drift with deterministic amputation & structural grafting.

/**
 * 1. DETERMINISTIC SLOP SURGERY
 * Surgically removes deadweight corporate filler, throat-clearing openers,
 * nominalizations, and passive constructions without relying on LLM self-correction.
 */

// Phrase-level throat-clearing patterns to eliminate completely
export const THROAT_CLEARING_PATTERNS = [
  /\b(?:in today's (?:fast-paced|digital|interconnected|ever-evolving|modern) (?:world|landscape|ecosystem|society|realm))\b,?\s*/gi,
  /\b(?:in the (?:contemporary|fast-paced|ever-evolving|modern|dynamic) (?:landscape|realm|ecosystem|world|milieu) of)\b\s*/gi,
  /\b(?:it is (?:important|crucial|essential|vital|worth noting|worth mentioning|worth highlighting) to (?:note|remember|recognize|keep in mind|understand) that)\b\s*/gi,
  /\b(?:it goes without saying that)\b\s*/gi,
  /\b(?:needless to say,?\s*)\b/gi,
  /\b(?:at the end of the day,?\s*)\b/gi,
  /\b(?:when it comes to)\b\s*/gi,
  /\b(?:all things considered,?\s*)\b/gi,
  /\b(?:with that (?:being said|said),?\s*)\b/gi,
  /\b(?:in order to achieve this,?\s*)\b/gi,
  /\b(?:as we (?:navigate|explore|delve into) (?:this|the|these))\b,?\s*/gi,
  /\b(?:first and foremost,?\s*)\b/gi,
  /\b(?:last but not least,?\s*)\b/gi,
  /\b(?:to be completely (?:transparent|honest|candid),?\s*)\b/gi,
  /\b(?:it['’]s safe to say that)\b\s*/gi,
  /\b(?:a testament to (?:the fact that|the))\b/gi
];

// Nominalization & Wordy Replacement Rules (Wordy -> Direct)
export const NOMINALIZATION_REPLACEMENTS = [
  { regex: /\bin order to\b/gi, replace: 'to' },
  { regex: /\bdue to the fact that\b/gi, replace: 'because' },
  { regex: /\bserves as (?:a|an)\b/gi, replace: 'is $1' },
  { regex: /\bserves to\b/gi, replace: 'helps' },
  { regex: /\bfeatures as\b/gi, replace: 'is' },
  { regex: /\bconduct(?:s|ed|ing)? an investigation (?:into|of)\b/gi, replace: 'investigate$1' },
  { regex: /\bmake(?:s|d|ing)? a determination\b/gi, replace: 'determine$1' },
  { regex: /\bfacilitate(?:s|d|ing)? the implementation of\b/gi, replace: 'implement$1' },
  { regex: /\bprovide(?:s|d|ing)? an explanation (?:of|for)\b/gi, replace: 'explain$1' },
  { regex: /\bengage(?:s|d|ing)? in the utilization of\b/gi, replace: 'use$1' },
  { regex: /\butilize(?:s|d|ing)?\b/gi, replace: 'use$1' },
  { regex: /\bcommence(?:s|d|ing)?\b/gi, replace: 'start$1' },
  { regex: /\bascertain(?:s|ed|ing)?\b/gi, replace: 'find$1' },
  { regex: /\bpivotal role\b/gi, replace: 'key part' },
  { regex: /\bwatershed moment\b/gi, replace: 'turning point' },
  { regex: /\bgame-changer\b/gi, replace: 'major shift' },
  { regex: /\bdelve(?:s|d|ing)? into\b/gi, replace: 'examine$1' },
  { regex: /\btapestry of\b/gi, replace: 'mix of' },
  { regex: /\bseamless(?:ly)?\b/gi, replace: 'direct' },
  { regex: /\bholistic(?:ally)?\b/gi, replace: 'broad' }
];

/**
 * Runs deterministic surgical slop amputation on text.
 * @param {string} text - Raw input text
 * @returns {string} Cleaned, compacted prose
 */
export function amputateSlop(text) {
  if (!text || typeof text !== 'string') return '';
  let clean = text;

  // 1. Cut throat-clearing openers
  for (const pattern of THROAT_CLEARING_PATTERNS) {
    clean = clean.replace(pattern, '');
  }

  // 2. Replace nominalizations and wordy euphemisms
  for (const { regex, replace } of NOMINALIZATION_REPLACEMENTS) {
    clean = clean.replace(regex, replace);
  }

  // 3. Clean up sentence punctuation debris left behind by deletions
  clean = clean
    // Capitalize first letter of sentences if throat-clearing was at sentence start
    .replace(/(^[a-z]|(?<=[.!?]\s+)[a-z])/g, m => m.toUpperCase())
    // Remove orphaned commas at start of sentences
    .replace(/(?<=[.!?]\s+),\s*/g, '')
    .replace(/^,\s*/, '')
    // Remove double commas or double periods
    .replace(/,\s*,/g, ',')
    .replace(/\.{2,}/g, '.')
    // Collapse excessive whitespace
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  return clean;
}

/**
 * 2. SYNTACTIC TEMPLATE GRAFTING
 * Extracts authentic, asymmetric human sentence skeletons from an author's sample text
 * to serve as strict structural molds for synthesis.
 */

/**
 * Extracts 3–5 representative syntactic sentence frames from human writing.
 * @param {string} sampleText - Authentic author sample
 * @returns {Array<string>} List of human grammatical skeletons
 */
export function extractSyntacticFrames(sampleText) {
  if (!sampleText || typeof sampleText !== 'string') {
    return getDefaultFrames();
  }

  const sentences = sampleText
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"“'‘])/g)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 280);

  if (sentences.length === 0) {
    return getDefaultFrames();
  }

  // Prioritize sentences with human structural markers (em-dashes, semicolons, causal clauses, asides)
  const ranked = sentences.map(s => {
    let score = 0;
    if (/[—]/.test(s)) score += 4;
    if (/;/.test(s)) score += 3;
    if (/\([^)]+\)/.test(s)) score += 3;
    if (/\b(?:when|because|if|though|unless|while)\b/i.test(s)) score += 2;
    if (/\b(?:not because|merely|only|rather|instead)\b/i.test(s)) score += 2;
    const wordCount = s.split(/\s+/).length;
    // Prefer medium to long complex sentences for grafting molds
    if (wordCount >= 14 && wordCount <= 38) score += 2;
    return { sentence: s, score };
  });

  ranked.sort((a, b) => b.score - a.score);
  const selected = ranked.slice(0, 4).map(r => r.sentence);

  return selected.length > 0 ? selected : getDefaultFrames();
}

function getDefaultFrames() {
  return [
    'When we examine [fact], the primary obstacle is rarely [misconception]—it is [underlying mechanism].',
    'The system failed not because of [secondary factor], but because [root cause] overwhelmed [constraint].',
    'Separating [component A] from [component B] reduced latency from [metric 1] to [metric 2], leaving [outcome].',
    'If we assume [premise], we inevitably run into [trade-off]; the alternative is [concrete resolution].'
  ];
}

/**
 * 3. PARALLEL DE-SLOPPING EXEMPLARS
 * In-context conditioning demonstrating the violent transformation gradient from slop to human prose.
 */
export const PARALLEL_EXEMPLARS = [
  {
    slop: "In today's rapidly evolving technological ecosystem, the adoption of microservices architectures has emerged as a transformative paradigm. By leveraging containerization and orchestration, enterprises can unlock unprecedented operational synergies and achieve seamless scalability across distributed environments. It is not merely about modularity; rather, it is a testament to the power of modern infrastructure.",
    facts: [
      "Microservices split software into smaller deployable units.",
      "Containers let teams deploy changes independently.",
      "The trade-off is higher network latency and more complex distributed debugging."
    ],
    human: "Splitting an application into twenty services does not make it fast; it makes it distributed. When every database query becomes a network request over TCP, latency compounds. Teams gain the ability to deploy without coordinating calendars, but they pay for it in distributed tracing logs."
  },
  {
    slop: "At its core, effective leadership is fundamentally anchored in empathy and strategic alignment. In order to drive actionable outcomes, leaders must delve into the nuanced dynamics of their teams and foster an environment of continuous growth. This is a game-changer for organizational culture, fostering a holistic interplay between vision and execution.",
    facts: [
      "Leadership requires clear decisions and clear criteria.",
      "Teams fail when managers conceal bad news or leave priorities ambiguous.",
      "Direct weekly feedback prevents small mistakes from turning into missed quarters."
    ],
    human: "Good managers do not speak in abstractions. They make trade-offs explicit: if the team must deliver the security patch by Friday, the UI redesign stops today. When priorities are ambiguous, people guess, and guessing produces missed deadlines."
  }
];
