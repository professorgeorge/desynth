// Deterministic De-Slop Surgery & Syntactic Grafting Engine
// Replaces statistical LLM auto-regressive drift with deterministic amputation & structural grafting.

/**
 * 1. DETERMINISTIC SLOP SURGERY
 * Surgically removes deadweight corporate filler, throat-clearing openers,
 * nominalizations, and passive constructions without relying on LLM self-correction.
 */

// Phrase-level throat-clearing patterns to eliminate completely
export const THROAT_CLEARING_PATTERNS = [
  /\b(?:in today's (?:fast-paced|digital|interconnected|ever-evolving|modern|data-driven) (?:world|landscape|ecosystem|society|realm))\b,?\s*/gi,
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
  /\b(?:a testament to (?:the fact that|the))\b/gi,
  /\b(?:serves as a testament to)\b/gi,
  /\b(?:crucially,?\s*)\b/gi,
  /\b(?:importantly,?\s*)\b/gi,
  /\b(?:by and large,?\s*)\b/gi
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
  { regex: /\bfacilitate(?:s|d|ing)?\b/gi, replace: 'help$1' },
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
  { regex: /\bholistic(?:ally)?\b/gi, replace: 'broad' },
  { regex: /\bfoster(?:s|ed|ing)?\b/gi, replace: 'build$1' },
  { regex: /\bnuanced\b/gi, replace: 'detailed' },
  { regex: /\bmultifaceted\b/gi, replace: 'varied' },
  { regex: /\bparamount\b/gi, replace: 'critical' },
  { regex: /\bimperative to\b/gi, replace: 'necessary to' },
  { regex: /\bbolster(?:s|ed|ing)?\b/gi, replace: 'strengthen$1' },
  { regex: /\bnavigate(?:s|d|ing)? (?:the complexities of|the landscape of)\b/gi, replace: 'manage$1' },
  { regex: /\brealm of\b/gi, replace: 'field of' },
  { regex: /\bbeacon of\b/gi, replace: 'model of' }
];

/**
 * Runs deterministic surgical slop amputation on text while strictly preserving
 * paragraph breaks (\n\n), markdown headers (#), bullet lists, and numbered lists.
 * @param {string} text - Raw input text
 * @returns {string} Cleaned prose with 100% formatting structure intact
 */
export function amputateSlop(text) {
  if (!text || typeof text !== 'string') return '';
  
  // Process block-by-block to preserve line breaks, headers, and bullet formatting
  const lines = text.split('\n');
  const processed = lines.map(line => {
    if (!line.trim()) return '';

    // Detect and preserve markdown headers or list prefixes
    let prefix = '';
    let content = line;

    const headingMatch = line.match(/^(#{1,6}\s+)(.*)$/);
    if (headingMatch) {
      prefix = headingMatch[1];
      content = headingMatch[2];
    } else {
      const listMatch = line.match(/^(\s*(?:[-*+]|\d+\.)\s+)(.*)$/);
      if (listMatch) {
        prefix = listMatch[1];
        content = listMatch[2];
      }
    }

    let clean = content;

    // 1. Cut throat-clearing openers
    for (const pattern of THROAT_CLEARING_PATTERNS) {
      clean = clean.replace(pattern, '');
    }

    // 2. Replace nominalizations and wordy euphemisms
    for (const { regex, replace } of NOMINALIZATION_REPLACEMENTS) {
      clean = clean.replace(regex, replace);
    }

    // 3. Intelligent Context-Aware Em-Dash Surgery
    // A) Paired em-dashes acting as parenthetical asides: "word — aside — word" -> "word (aside) word"
    clean = clean.replace(/(\w+)\s*[—]\s*([^—\n]+?)\s*[—]\s*(\w+)/g, '$1 ($2) $3');
    // B) Subordinating clauses after dash: " — which/because/since/where" -> ", which/because/since/where"
    clean = clean.replace(/\s*[—|--]\s*(which|because|since|meaning|where|when|while|if|as)\b/gi, ', $1');
    // C) Other internal clause connections: replace with semicolon or period to avoid comma splices
    clean = clean.replace(/\s*[—|--]\s*/g, '; ');
    // D) If semicolon was placed directly before a coordinating conjunction: "; and" -> ", and"
    clean = clean.replace(/;\s*(and|but|or|so|yet)\b/gi, ', $1');

    // 4. Clean up punctuation debris & grammar artifacts
    clean = clean
      .replace(/(^[a-z]|(?<=[.!?]\s+)[a-z])/g, m => m.toUpperCase())
      .replace(/(?<=[.!?]\s+)[,;:]\s*/g, '')
      .replace(/^[,;:]\s*/, '')
      .replace(/,\s*,+/g, ',')
      .replace(/;\s*;+/g, ';')
      .replace(/\s+,/g, ',')
      .replace(/\s+;/g, ';')
      .replace(/\.{2,}/g, '.')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();

    return prefix + clean;
  });

  return processed.join('\n');
}

/**
 * Humanizes AI-generated text with 100% formatting and idea preservation.
 * Surgically removes the synthetic taste, artificial binary contrasts, signposts,
 * and robotic filler while maintaining every paragraph, idea, and technical detail.
 * @param {string} text - Input draft
 * @param {object} persona - Selected author persona
 * @returns {string} Humanized prose
 */
export function humanizePreservingStructure(text, persona) {
  if (!text || typeof text !== 'string') return '';

  const paragraphs = text.split(/\n\n+/);
  const humanizedParagraphs = paragraphs.map(para => {
    if (!para.trim()) return '';

    let p = para;

    // 1. Remove rhetorical signposts and conversational filler
    p = p
      .replace(/\b(?:furthermore|moreover|in addition to this|what['’]s more),?\s*/gi, '')
      .replace(/\b(?:in conclusion|to conclude|all in all|in summary),?\s*/gi, '')
      .replace(/\b(?:let that sink in[:.]?|full stop\.?|the kicker[?:]?)\s*/gi, '')
      .replace(/\b(?:here['’]s the thing:?|what if I told you that)\s*/gi, '')
      .replace(/\b(?:as of my last update,?\s*)\b/gi, '')
      .replace(/\b(?:at its core,?\s*)\b/gi, '')
      .replace(/\b(?:a watershed moment for)\b/gi, 'a turning point in')
      .replace(/\b(?:serves as a testament to(?: the fact that| the)?)\b/gi, 'shows')
      .replace(/\b(?:delv(?:e|es|ed|ing) deep(?:ly)? into)\b/gi, 'examin$1')
      .replace(/\b(?:intricate tapestry of)\b/gi, 'structure of')
      .replace(/\b(?:poised to become)\b/gi, 'will become')
      .replace(/\b(?:seamlessly intertwin(?:e|es|ed|ing))\b/gi, 'connect$1');

    // 2. Dissolve fake binary contrasts ("It is not merely about X; rather, it is about Y")
    p = p.replace(
      /(?:it['’]s|it is) not (?:just|merely|only) about ([^;.,]+?)[;,—]\s*(?:rather|instead|it['’]s about|it is about)\s+([^.]+?)\./gi,
      (match, a, b) => `${b.trim()}, rather than ${a.trim()}.`
    );

    // 3. Run surgical slop amputation
    p = amputateSlop(p);

    // 4. Clean up any leading colon or semicolon left after removal (e.g. after "let that sink in:")
    p = p.replace(/(?:^|\n)(#+\s*|[-*]\s*|\d+\.\s*)?[:;,]\s*/g, (match, prefix) => prefix ? prefix : '');

    // 5. Clean up duplicate spaces and capitalize starting letters after sentence breaks
    p = p.replace(/[ \t]{2,}/g, ' ')
         .replace(/(^|[.!?]\s+)([a-z])/g, (m, sep, char) => sep + char.toUpperCase());

    return p;
  });

  return humanizedParagraphs.join('\n\n');
}

/**
 * 2. SYNTACTIC TEMPLATE GRAFTING
 * Extracts authentic, asymmetric human sentence skeletons from an author's sample text
 * to serve as strict structural molds for synthesis.
 */

/**
 * Extracts 3 to 5 representative syntactic sentence frames from human writing.
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

  // Prioritize sentences with human structural markers (semicolons, causal clauses, asides)
  // while actively penalizing em-dashes as artificial AI slop
  const ranked = sentences.map(s => {
    let score = 0;
    if (/;/.test(s)) score += 4;
    if (/\([^)]+\)/.test(s)) score += 3;
    if (/\b(?:when|because|if|though|unless|while)\b/i.test(s)) score += 2;
    if (/\b(?:not because|merely|only|rather|instead)\b/i.test(s)) score += 2;
    if (/[—]/.test(s)) score -= 3; // Penalize em-dash slop
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
    'When we examine [fact], the primary obstacle is rarely [misconception]; it is [underlying mechanism].',
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
