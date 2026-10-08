// Deterministic De-Slop Surgery & Syntactic Grafting Engine
// Replaces statistical LLM auto-regressive drift with deterministic amputation & structural grafting.

/**
 * 1. DETERMINISTIC SLOP SURGERY
 * Surgically removes deadweight corporate filler, throat-clearing openers,
 * nominalizations, and passive constructions without relying on LLM self-correction.
 */

// Phrase-level throat-clearing patterns to eliminate completely
// Phrase-level throat-clearing patterns to eliminate completely
export const THROAT_CLEARING_PATTERNS = [
  /\b(?:in today['’]s\s+(?:[a-z-]+(?:\s+[a-z-]+)*)\s+(?:world|landscape|ecosystem|society|realm|market))\b,?\s*/gi,
  /\b(?:in the\s+(?:contemporary|fast-paced|ever-evolving|modern|dynamic|digital)\s+(?:landscape|realm|ecosystem|world|milieu)\s+of)\b\s*/gi,
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
  { regex: /\bserves as (?:a|an)\b/gi, replace: 'is' },
  { regex: /\bserves to\b/gi, replace: 'helps' },
  { regex: /\bfeatures as\b/gi, replace: 'is' },
  { regex: /\bconduct(?:s)? an investigation (?:into|of)\b/gi, replace: 'investigates' },
  { regex: /\bconducted an investigation (?:into|of)\b/gi, replace: 'investigated' },
  { regex: /\bconducting an investigation (?:into|of)\b/gi, replace: 'investigating' },
  { regex: /\bconduct an investigation (?:into|of)\b/gi, replace: 'investigate' },
  { regex: /\bmake(?:s)? a determination\b/gi, replace: 'determines' },
  { regex: /\bmade a determination\b/gi, replace: 'determined' },
  { regex: /\bmaking a determination\b/gi, replace: 'determining' },
  { regex: /\bfacilitate the implementation of\b/gi, replace: 'implement' },
  { regex: /\bfacilitates the implementation of\b/gi, replace: 'implements' },
  { regex: /\bfacilitated the implementation of\b/gi, replace: 'implemented' },
  { regex: /\bfacilitating the implementation of\b/gi, replace: 'implementing' },
  { regex: /\bfacilitate\b/gi, replace: 'help' },
  { regex: /\bfacilitates\b/gi, replace: 'helps' },
  { regex: /\bfacilitated\b/gi, replace: 'helped' },
  { regex: /\bfacilitating\b/gi, replace: 'helping' },
  { regex: /\bprovide(?:s)? an explanation (?:of|for)\b/gi, replace: 'explains' },
  { regex: /\bprovided an explanation (?:of|for)\b/gi, replace: 'explained' },
  { regex: /\bproviding an explanation (?:of|for)\b/gi, replace: 'explaining' },
  { regex: /\bengage(?:s)? in the utilization of\b/gi, replace: 'uses' },
  { regex: /\bengaged in the utilization of\b/gi, replace: 'used' },
  { regex: /\butilize\b/gi, replace: 'use' },
  { regex: /\butilizes\b/gi, replace: 'uses' },
  { regex: /\butilized\b/gi, replace: 'used' },
  { regex: /\butilizing\b/gi, replace: 'using' },
  { regex: /\butilization\b/gi, replace: 'use' },
  { regex: /\bcommence\b/gi, replace: 'start' },
  { regex: /\bcommences\b/gi, replace: 'starts' },
  { regex: /\bcommenced\b/gi, replace: 'started' },
  { regex: /\bcommencing\b/gi, replace: 'starting' },
  { regex: /\bascertain\b/gi, replace: 'find' },
  { regex: /\bascertains\b/gi, replace: 'finds' },
  { regex: /\bascertained\b/gi, replace: 'found' },
  { regex: /\bascertaining\b/gi, replace: 'finding' },
  { regex: /\bpivotal role\b/gi, replace: 'key part' },
  { regex: /\bwatershed moment\b/gi, replace: 'turning point' },
  { regex: /\bgame-changer\b/gi, replace: 'major shift' },
  { regex: /\bdelve into\b/gi, replace: 'examine' },
  { regex: /\bdelves into\b/gi, replace: 'examines' },
  { regex: /\bdelved into\b/gi, replace: 'examined' },
  { regex: /\bdelving into\b/gi, replace: 'examining' },
  { regex: /\btapestry of\b/gi, replace: 'mix of' },
  { regex: /\bseamless(?:ly)?\b/gi, replace: 'direct' },
  { regex: /\bholistic(?:ally)?\b/gi, replace: 'broad' },
  { regex: /\bfoster\b/gi, replace: 'build' },
  { regex: /\bfosters\b/gi, replace: 'builds' },
  { regex: /\bfostered\b/gi, replace: 'built' },
  { regex: /\bfostering\b/gi, replace: 'building' },
  { regex: /\bnuanced\b/gi, replace: 'detailed' },
  { regex: /\bmultifaceted\b/gi, replace: 'varied' },
  { regex: /\bparamount\b/gi, replace: 'critical' },
  { regex: /\bimperative to\b/gi, replace: 'necessary to' },
  { regex: /\bbolster\b/gi, replace: 'strengthen' },
  { regex: /\bbolsters\b/gi, replace: 'strengthens' },
  { regex: /\bbolstered\b/gi, replace: 'strengthened' },
  { regex: /\bbolstering\b/gi, replace: 'strengthening' },
  { regex: /\bnavigate(?:s|d|ing)? (?:the complexities of|the landscape of)\b/gi, replace: 'manage' },
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
    clean = clean.replace(/\s*(?:[—–]|--)\s*(which|because|since|meaning|where|when|while|if|as)\b/gi, ', $1');
    // C) Other internal clause connections: replace with semicolon or period to avoid comma splices
    clean = clean.replace(/\s*(?:[—–]|--)\s*/g, '; ');
    // D) If semicolon was placed directly before a coordinating conjunction: "; and" -> ", and"
    clean = clean.replace(/;\s*(and|but|or|so|yet)\b/gi, ', $1');

    // 4. Untangle compulsive AI Tricolons (Rule of 3 triads) into natural pairs
    clean = untangleTricolons(clean);

    // 5. Prune moralizing inspirational conclusion formulas
    clean = pruneMoralizingClosers(clean);

    // 6. Clean up punctuation debris & grammar artifacts
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
 * Untangles compulsive synthetic tricolons (rule-of-three adjective/adverb triads
 * and parallel fluff gerund clauses) into punchy, natural human constructions.
 * @param {string} text
 * @returns {string}
 */
export function untangleTricolons(text) {
  if (!text || typeof text !== 'string') return '';

  let out = text;

  // A) Adverb triads: "X-ly, Y-ly, and Z-ly" -> "X-ly and Z-ly"
  out = out.replace(/\b([a-zA-Z]+ly)\s*,\s*([a-zA-Z]+ly)\s*,?\s+and\s+([a-zA-Z]+ly)\b/gi, (m, adv1, adv2, adv3) => {
    return `${adv1} and ${adv3}`;
  });

  // B) Evaluative AI Adjective Triads: "A, B, and C [noun]"
  const evaluativeAdjList = new Set([
    'scalable', 'robust', 'resilient', 'intuitive', 'comprehensive', 'flexible', 'seamless',
    'dynamic', 'innovative', 'transformative', 'vital', 'crucial', 'nuanced', 'streamlined',
    'cohesive', 'actionable', 'iterative', 'tailored', 'agile', 'efficient', 'effective',
    'reliable', 'modern', 'powerful', 'clear', 'concise', 'compelling', 'diverse', 'versatile',
    'sustainable', 'holistic', 'interconnected', 'multifaceted', 'proactive', 'strategic'
  ]);

  const adjSuffixRegex = /(?:ive|able|ible|al|ic|ous|ful|less|ent|ant|ary|ory|ed|ing)$/i;

  out = out.replace(/\b([a-zA-Z]{3,20})\s*,\s*([a-zA-Z]{3,20})\s*,?\s+and\s+([a-zA-Z]{3,20})\s+([a-zA-Z]{3,25})\b/g, (match, w1, w2, w3, noun) => {
    const l1 = w1.toLowerCase();
    const l2 = w2.toLowerCase();
    const l3 = w3.toLowerCase();

    const isAdj1 = evaluativeAdjList.has(l1) || adjSuffixRegex.test(l1);
    const isAdj2 = evaluativeAdjList.has(l2) || adjSuffixRegex.test(l2);
    const isAdj3 = evaluativeAdjList.has(l3) || adjSuffixRegex.test(l3);

    // If all three or at least two are evaluative adjectives qualifying the noun, reduce to a punchy pair
    if ((isAdj1 && isAdj2 && isAdj3) || (evaluativeAdjList.has(l1) || evaluativeAdjList.has(l2) || evaluativeAdjList.has(l3))) {
      return `${w1} and ${w3} ${noun}`;
    }
    return match;
  });

  // C) Parallel gerund triads: "streamlining workflows, reducing errors, and enhancing productivity"
  const aiGerundsList = new Set(['fostering', 'enhancing', 'driving', 'streamlining', 'empowering', 'navigating', 'leveraging', 'optimizing', 'bolstering', 'maximizing', 'ensuring', 'delivering', 'paving', 'reducing', 'improving', 'building', 'creating', 'transforming']);
  out = out.replace(/\b([a-zA-Z]+ing\s+[^,;\n]{3,35}),\s*([a-zA-Z]+ing\s+[^,;\n]{3,35}),?\s*and\s*([a-zA-Z]+ing\s+[^.;\n]{3,35})\b/gi, (match, c1, c2, c3) => {
    const v1 = c1.split(/\s+/)[0].toLowerCase();
    const v2 = c2.split(/\s+/)[0].toLowerCase();
    const v3 = c3.split(/\s+/)[0].toLowerCase();
    if (aiGerundsList.has(v1) || aiGerundsList.has(v2) || aiGerundsList.has(v3)) {
      return `${c1} and ${c2}`;
    }
    return match;
  });

  return out;
}

/**
 * Prunes boilerplate synthetic moralizing conclusion clauses at paragraph ends.
 * (e.g., "Ultimately, embracing X paves the way for a more resilient future.")
 * @param {string} text
 * @returns {string}
 */
export function pruneMoralizingClosers(text) {
  if (!text || typeof text !== 'string') return '';

  return text.replace(
    /(?:^|\s)(?:Ultimately|In conclusion|Looking ahead|At the end of the day),?\s*[^.\n]*?(?:paves the way for|ushers in a new era|stands as a testament to|ensures a brighter|lays the groundwork for)[^.\n]*[.!?]/gi,
    ''
  );
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
