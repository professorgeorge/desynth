// Deep Forensic Stylometric Profiler
// Performs quantitative linguistic and syntactic analysis on author writing samples.

import { callLLM } from './llm-connector.js';

export const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing',
  'don\'t', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t',
  'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers',
  'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if',
  'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t',
  'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our',
  'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s',
  'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re',
  'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t',
  'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s',
  'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t',
  'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself',
  'yourselves', 'also', 'just', 'like', 'even', 'one', 'two', 'many', 'well', 'much', 'still'
]);

/**
 * Conducts a comprehensive stylometric audit of an author's writing sample.
 * @param {string} text - Raw input text
 * @returns {Object} Comprehensive stylometric profile
 */
export function analyzeAuthorStylometrics(text) {
  const clean = (text || '').trim();
  if (!clean) {
    return null;
  }

  // 1. Tokenization
  const rawWords = clean.split(/\s+/).filter(Boolean);
  const wordCount = rawWords.length;
  if (wordCount < 10) return null;

  // Clean words (lowercase alphanumeric)
  const tokens = rawWords
    .map(w => w.toLowerCase().replace(/[^a-z0-9'’-]/g, ''))
    .filter(w => w.length > 0);

  // 2. Sentence Analysis
  const sentenceRegex = /(?<=[.!?])\s+(?=[A-Z0-9"“'‘])/g;
  const rawSentences = clean
    .split(sentenceRegex)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const sentences = rawSentences.length > 0 ? rawSentences : [clean];
  const sentenceWordCounts = sentences.map(s => s.split(/\s+/).filter(Boolean).length);

  const meanSentenceLength = sentenceWordCounts.reduce((a, b) => a + b, 0) / sentenceWordCounts.length;
  
  // Variance & Standard Deviation (Burstiness)
  let variance = 0;
  if (sentenceWordCounts.length > 1) {
    variance = sentenceWordCounts.reduce((acc, val) => acc + Math.pow(val - meanSentenceLength, 2), 0) / sentenceWordCounts.length;
  }
  const stdDevSentenceLength = Math.sqrt(variance);
  const coefVariation = meanSentenceLength > 0 ? stdDevSentenceLength / meanSentenceLength : 0;

  // Sentence Length Distribution Buckets
  const shortSentences = sentenceWordCounts.filter(len => len < 12).length;
  const mediumSentences = sentenceWordCounts.filter(len => len >= 12 && len <= 25).length;
  const longSentences = sentenceWordCounts.filter(len => len > 25).length;
  const pctShort = Math.round((shortSentences / sentenceWordCounts.length) * 100);
  const pctMedium = Math.round((mediumSentences / sentenceWordCounts.length) * 100);
  const pctLong = Math.round((longSentences / sentenceWordCounts.length) * 100);

  // 3. Paragraph Structure & Asymmetry
  const rawParagraphs = clean
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
  const paragraphs = rawParagraphs.length > 0 ? rawParagraphs : [clean];
  const paragraphWordCounts = paragraphs.map(p => p.split(/\s+/).filter(Boolean).length);
  const meanParagraphLength = paragraphWordCounts.reduce((a, b) => a + b, 0) / paragraphs.length;
  
  let paraVariance = 0;
  if (paragraphWordCounts.length > 1) {
    paraVariance = paragraphWordCounts.reduce((acc, val) => acc + Math.pow(val - meanParagraphLength, 2), 0) / paragraphs.length;
  }
  const paraStdDev = Math.sqrt(paraVariance);
  const paraAsymmetryScore = meanParagraphLength > 0 ? paraStdDev / meanParagraphLength : 0;

  // 4. Lexical Richness & Distinctive Vocabulary
  const wordFrequency = new Map();
  for (const token of tokens) {
    const base = token.replace(/['’].*$/, ''); // strip contractions for counting
    if (base.length > 1) {
      wordFrequency.set(base, (wordFrequency.get(base) || 0) + 1);
    }
  }

  const uniqueWords = wordFrequency.size;
  const typeTokenRatio = wordCount > 0 ? uniqueWords / wordCount : 0;
  
  // Hapax Legomena (words occurring exactly once)
  let hapaxCount = 0;
  for (const count of wordFrequency.values()) {
    if (count === 1) hapaxCount++;
  }
  const hapaxRatio = uniqueWords > 0 ? hapaxCount / uniqueWords : 0;

  // Distinctive Content Words (excluding stop words)
  const distinctiveWords = [];
  for (const [word, count] of wordFrequency.entries()) {
    if (!STOP_WORDS.has(word) && word.length > 3) {
      distinctiveWords.push({ word, count });
    }
  }
  distinctiveWords.sort((a, b) => b.count - a.count);
  const topKeywords = distinctiveWords.slice(0, 10).map(d => d.word);

  // 5. Pronoun Perspective Stance (per 1,000 words)
  const p1SingularRegex = /\b(i|me|my|mine|myself)\b/gi;
  const p1PluralRegex = /\b(we|us|our|ours|ourselves)\b/gi;
  const p2Regex = /\b(you|your|yours|yourself|yourselves)\b/gi;
  const p3Regex = /\b(he|she|it|they|him|her|them|his|hers|its|their|theirs)\b/gi;

  const countP1Singular = (clean.match(p1SingularRegex) || []).length;
  const countP1Plural = (clean.match(p1PluralRegex) || []).length;
  const countP2 = (clean.match(p2Regex) || []).length;
  const countP3 = (clean.match(p3Regex) || []).length;

  const rate1k = (count) => Number(((count / wordCount) * 1000).toFixed(1));

  let dominantPerspective = '3rd-person objective';
  if (countP1Singular > countP1Plural && countP1Singular > countP2 && countP1Singular > 2) {
    dominantPerspective = '1st-person singular (Personal narrative / I)';
  } else if (countP1Plural > countP1Singular && countP1Plural > countP2 && countP1Plural > 2) {
    dominantPerspective = '1st-person plural (Collaborative / We)';
  } else if (countP2 > countP1Singular && countP2 > countP1Plural && countP2 > 2) {
    dominantPerspective = '2nd-person direct (Instructive / You)';
  }

  // 6. Epistemic Modality (Hedging vs Assertion)
  const hedgingRegex = /\b(perhaps|maybe|possibly|potentially|seems?|seemed|seeming|suggests?|suggested|might|could|tentative(?:ly)?|apparent(?:ly)?|unlikely|arguably|roughly|in some sense)\b/gi;
  const assertiveRegex = /\b(clearly|obviously|certainly|definitely|undoubtedly|must|proves?|proven|demonstrates?|inevitably|always|never|fact|facts|indeed|precisely|vital|crucial|essential)\b/gi;

  const countHedging = (clean.match(hedgingRegex) || []).length;
  const countAssertive = (clean.match(assertiveRegex) || []).length;
  const epistemicRatio = (countAssertive + 1) / (countHedging + 1);

  let epistemicTone = 'Balanced inquiry';
  if (epistemicRatio > 2.0 && countAssertive > 1) {
    epistemicTone = 'Declarative / Assertive (High certainty, minimal hedging)';
  } else if (epistemicRatio < 0.6 && countHedging > 1) {
    epistemicTone = 'Hypothetical / Skeptical (Heavy hedging, cautious caveats)';
  } else if (countAssertive === 0 && countHedging === 0) {
    epistemicTone = 'Empirical / Neutral description';
  }

  // 7. Punctuation Profile (per 1,000 words)
  const countSemicolons = (clean.match(/;/g) || []).length;
  const countEmDashes = (clean.match(/—|--/g) || []).length;
  const countColons = (clean.match(/:/g) || []).length;
  const countParentheses = (clean.match(/\([^)]+\)/g) || []).length;
  const countQuestions = (clean.match(/\?/g) || []).length;
  const countExclamations = (clean.match(/!/g) || []).length;

  // 8. Contractions & Formality
  const contractionsRegex = /\b(can't|don't|won't|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|it's|that's|there's|what's|who's|i'm|you're|we're|they're|i've|you've|we've|they've|i'll|you'll|we'll|they'll|i'd|you'd|we'd|they'd)\b/gi;
  const countContractions = (clean.match(contractionsRegex) || []).length;
  const contractionRate = rate1k(countContractions);

  let formalityLevel = 'formal_academic';
  if (contractionRate > 8.0) {
    formalityLevel = 'conversational';
  } else if (contractionRate > 2.0) {
    formalityLevel = 'plain_spoken_direct';
  } else {
    formalityLevel = 'uncontracted_measured';
  }

  // 9. Synthesize Epistemic Stance
  let epistemicStance = 'empirical_observational';
  const hasTechWords = /algorithm|architecture|code|database|deploy|endpoint|infrastructure|latency|memory|pipeline|server|software|system|runtime/i.test(clean);
  const hasPhilosophical = /epistem|ontology|premise|deduction|paradox|metaphysics|consciousness|truth|axiom|validity/i.test(clean);
  const hasNarrative = countP1Singular > 4 && countContractions > 3;

  if (hasPhilosophical) {
    epistemicStance = 'analytic_skeptical';
  } else if (hasTechWords) {
    epistemicStance = 'operational_practitioner';
  } else if (hasNarrative) {
    epistemicStance = 'first_person_reflective';
  } else if (countAssertive > countHedging * 2) {
    epistemicStance = 'polemical_declarative';
  }

  // Qualitative Rhythm Description
  let rhythmDescription = 'Balanced human cadence';
  if (stdDevSentenceLength > 10 || coefVariation > 0.65) {
    rhythmDescription = 'High burstiness (dynamic shifts between short punchy and complex compound sentences)';
  } else if (stdDevSentenceLength < 4.5 && wordCount > 80) {
    rhythmDescription = 'Uniform / Metronomic rhythm (consistent sentence lengths)';
  } else {
    rhythmDescription = 'Natural moderate cadence variance';
  }

  // Punctuation habits summary list
  const punctuationHabits = [];
  if (countSemicolons > 0) punctuationHabits.push(`Uses semicolons (${countSemicolons} instances; ${rate1k(countSemicolons)}/1k words)`);
  if (countEmDashes > 0) punctuationHabits.push(`Em-dashes (${countEmDashes} instances; ${rate1k(countEmDashes)}/1k words)`);
  if (countParentheses > 0) punctuationHabits.push(`Parenthetical asides (${countParentheses} instances)`);
  if (countQuestions > 0) punctuationHabits.push(`Rhetorical questions (${countQuestions} instances)`);
  if (punctuationHabits.length === 0) punctuationHabits.push('Minimal complex punctuation (prefers periods & commas)');

  return {
    wordCount,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    
    // Cadence
    meanSentenceLength: Number(meanSentenceLength.toFixed(1)),
    stdDevSentenceLength: Number(stdDevSentenceLength.toFixed(2)),
    coefVariation: Number(coefVariation.toFixed(2)),
    sentenceDistribution: {
      pctShort,
      pctMedium,
      pctLong
    },
    rhythmDescription,

    // Paragraphs
    meanParagraphLength: Number(meanParagraphLength.toFixed(1)),
    paraAsymmetryScore: Number(paraAsymmetryScore.toFixed(2)),

    // Lexical
    typeTokenRatio: Number(typeTokenRatio.toFixed(3)),
    hapaxRatio: Number(hapaxRatio.toFixed(3)),
    topKeywords,

    // Perspective & Modality
    dominantPerspective,
    pronounRates: {
      p1Singular: rate1k(countP1Singular),
      p1Plural: rate1k(countP1Plural),
      p2: rate1k(countP2),
      p3: rate1k(countP3)
    },
    epistemicTone,
    epistemicStance,
    hedgingCount: countHedging,
    assertiveCount: countAssertive,

    // Formality & Punctuation
    formalityLevel,
    contractionRate,
    punctuationHabits,
    punctuationCounts: {
      semicolons: countSemicolons,
      emDashes: countEmDashes,
      colons: countColons,
      parentheses: countParentheses,
      questions: countQuestions
    }
  };
}

/**
 * Builds a deterministic, high-fidelity Latent Persona Card directly from the measured stylometrics.
 * @param {Object} metrics - Output from analyzeAuthorStylometrics
 * @param {string} sampleText - Original text snippet
 * @returns {Object} Structured persona object
 */
export function buildPersonaFromStylometrics(metrics, sampleText) {
  if (!metrics) return null;

  const domain = metrics.topKeywords.length > 0
    ? `Domain: ${metrics.topKeywords.slice(0, 3).join(', ')}`
    : 'Empirical Discourse';

  const card = {
    epistemic_stance: metrics.epistemicStance,
    audience_relationship: metrics.dominantPerspective.includes('1st-person singular')
      ? 'first_person_witness_to_reader'
      : metrics.dominantPerspective.includes('1st-person plural')
      ? 'peer_collaborator'
      : 'objective_observer_to_peer',
    shared_context: 'high (assumes reader understands the field)',
    lexical_habits: {
      cadence_profile: `Mean ${metrics.meanSentenceLength} words/sentence (Burstiness: ${metrics.stdDevSentenceLength}). ${metrics.sentenceDistribution.pctShort}% short (<12w), ${metrics.sentenceDistribution.pctMedium}% medium, ${metrics.sentenceDistribution.pctLong}% long (>25w).`,
      formality_level: metrics.formalityLevel.replace(/_/g, ' '),
      contraction_density: `${metrics.contractionRate} per 1k words`,
      vocabulary_richness: `TTR ${metrics.typeTokenRatio} (Hapax ratio ${metrics.hapaxRatio})`,
      signature_vocabulary: metrics.topKeywords.slice(0, 6),
      punctuation_patterns: metrics.punctuationHabits
    },
    asymmetry_tolerance: {
      allows_functional_plainness: true,
      allows_uneven_paragraph_lengths: metrics.paraAsymmetryScore > 0.4,
      measured_paragraph_asymmetry: `${Math.round(metrics.paraAsymmetryScore * 100)}% variance across paragraphs`
    },
    focus_biases: {
      cares_about: [
        `Authentic cadence matching ~${metrics.meanSentenceLength} words/sentence`,
        `Subject matter grounded in ${metrics.topKeywords.slice(0, 4).join(', ') || 'concrete reality'}`,
        `${metrics.epistemicTone}`
      ],
      ignores: [
        'formulaic AI transitions ("furthermore", "moreover", "in conclusion")',
        'synthetic buzzwords ("delve", "tapestry", "paradigm", "testament to")',
        'artificial staccato marketing sentences'
      ]
    }
  };

  return {
    id: 'custom-user-voice',
    name: 'My Calibrated Voice',
    badge: '👤 My Voice DNA (Measured)',
    era: 'User Empirical Profile (Forensic)',
    domain: domain,
    description: `Statistically modeled from ${metrics.wordCount} words. Mean sentence length: ${metrics.meanSentenceLength}w • Burstiness: ${metrics.stdDevSentenceLength} • Stance: ${metrics.epistemicStance.replace(/_/g, ' ')}.`,
    sampleExcerpt: sampleText.slice(0, 320) + (sampleText.length > 320 ? '...' : ''),
    metrics,
    card
  };
}

/**
 * Executes deep cognitive AI persona modeling using the connected LLM backend.
 * Synthesizes measured stylometric data + authentic writing to produce an author model.
 */
export async function analyzeAuthorWithAI({ sampleText, engineConfig, metrics, onProgress }) {
  const prompt = `You are an elite computational forensic linguist. Analyze this author's authentic writing sample to construct their Latent Author Persona Model.

MEASURED QUANTITATIVE STYLOMETRICS:
- Sample word count: ${metrics.wordCount}
- Mean sentence length: ${metrics.meanSentenceLength} words (Burstiness / StdDev: ${metrics.stdDevSentenceLength})
- Sentence cadence distribution: ${metrics.sentenceDistribution.pctShort}% short (<12w), ${metrics.sentenceDistribution.pctMedium}% medium, ${metrics.sentenceDistribution.pctLong}% complex (>25w)
- Lexical Type-Token Ratio: ${metrics.typeTokenRatio} (Hapax legomena ratio: ${metrics.hapaxRatio})
- Dominant perspective: ${metrics.dominantPerspective}
- Epistemic modality: ${metrics.epistemicTone}
- Observed punctuation habits: ${metrics.punctuationHabits.join(', ')}
- Distinctive content keywords: ${metrics.topKeywords.join(', ')}

AUTHENTIC AUTHOR WRITING SAMPLE:
"""
${sampleText.slice(0, 4500)}
"""

TASK:
Produce an authentic Latent Author Persona Model matching their real voice. Output valid YAML matching this exact schema:
epistemic_stance: <stance_name>
audience_relationship: <relationship_with_reader>
shared_context: <level_of_shared_assumptions>
lexical_habits:
  cadence_profile: "<description of their sentence rhythm based on measured metrics>"
  distinctive_vocabulary:
    - <authentic term 1>
    - <authentic term 2>
    - <authentic term 3>
  formality_level: "<measured formality level>"
  punctuation_patterns:
    - <observed habit 1>
    - <observed habit 2>
asymmetry_tolerance:
  allows_functional_plainness: true
  allows_uneven_paragraph_lengths: true
  allows_unresolved_asides: <true or false>
focus_biases:
  cares_about:
    - <specific core value or interest observed in sample 1>
    - <specific core value or interest observed in sample 2>
    - <specific core value or interest observed in sample 3>
  ignores:
    - <AI cliché or synthetic habit to strictly avoid 1>
    - <AI cliché or synthetic habit to strictly avoid 2>

Output ONLY the YAML. No conversational intro, no markdown backticks.`;

  const response = await callLLM({
    ...engineConfig,
    systemPrompt: 'You are an objective computational forensic linguist. Output only valid YAML with no chat filler.',
    userPrompt: prompt,
    onProgress
  });

  return (response || '').replace(/^```ya?ml/i, '').replace(/```$/i, '').trim();
}

/**
 * Parses pure YAML into a valid Latent Persona Card structure.
 */
export function parseYamlToCard(yamlStr, fallbackMetrics) {
  const card = {
    epistemic_stance: fallbackMetrics?.epistemicStance || 'empirical_observational',
    audience_relationship: 'peer_colleague',
    shared_context: 'high',
    lexical_habits: {
      cadence_profile: fallbackMetrics ? `Mean ${fallbackMetrics.meanSentenceLength}w/sentence (Burstiness: ${fallbackMetrics.stdDevSentenceLength})` : 'Natural human variation',
      distinctive_vocabulary: fallbackMetrics?.topKeywords ? [...fallbackMetrics.topKeywords.slice(0, 6)] : [],
      formality_level: fallbackMetrics?.formalityLevel?.replace(/_/g, ' ') || 'plain spoken',
      punctuation_patterns: fallbackMetrics?.punctuationHabits || []
    },
    asymmetry_tolerance: {
      allows_functional_plainness: true,
      allows_uneven_paragraph_lengths: true,
      allows_unresolved_asides: true
    },
    focus_biases: {
      cares_about: [],
      ignores: []
    }
  };

  if (!yamlStr) return card;

  let currentSection = null;
  let currentSubSection = null;

  const lines = yamlStr.split('\n');
  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (/^epistemic_stance:\s*(.+)$/i.test(trimmed)) {
      card.epistemic_stance = trimmed.replace(/^epistemic_stance:\s*/i, '').trim().replace(/^['"]|['"]$/g, '');
    } else if (/^audience_relationship:\s*(.+)$/i.test(trimmed)) {
      card.audience_relationship = trimmed.replace(/^audience_relationship:\s*/i, '').trim().replace(/^['"]|['"]$/g, '');
    } else if (/^shared_context:\s*(.+)$/i.test(trimmed)) {
      card.shared_context = trimmed.replace(/^shared_context:\s*/i, '').trim().replace(/^['"]|['"]$/g, '');
    } else if (/^lexical_habits:/i.test(trimmed)) {
      currentSection = 'lexical_habits';
      currentSubSection = null;
    } else if (/^asymmetry_tolerance:/i.test(trimmed)) {
      currentSection = 'asymmetry_tolerance';
      currentSubSection = null;
    } else if (/^focus_biases:/i.test(trimmed)) {
      currentSection = 'focus_biases';
      currentSubSection = null;
    } else if (currentSection === 'lexical_habits') {
      if (/^cadence_profile:\s*(.+)$/i.test(trimmed)) {
        card.lexical_habits.cadence_profile = trimmed.replace(/^cadence_profile:\s*/i, '').trim().replace(/^['"]|['"]$/g, '');
      } else if (/^formality_level:\s*(.+)$/i.test(trimmed)) {
        card.lexical_habits.formality_level = trimmed.replace(/^formality_level:\s*/i, '').trim().replace(/^['"]|['"]$/g, '');
      } else if (/^distinctive_vocabulary:/i.test(trimmed)) {
        currentSubSection = 'distinctive_vocabulary';
        card.lexical_habits.distinctive_vocabulary = [];
      } else if (/^punctuation_patterns:/i.test(trimmed)) {
        currentSubSection = 'punctuation_patterns';
        card.lexical_habits.punctuation_patterns = [];
      } else if (trimmed.startsWith('-') && currentSubSection === 'distinctive_vocabulary') {
        const item = trimmed.replace(/^-\s*/, '').replace(/^['"]|['"]$/g, '').trim();
        if (item) card.lexical_habits.distinctive_vocabulary.push(item);
      } else if (trimmed.startsWith('-') && currentSubSection === 'punctuation_patterns') {
        const item = trimmed.replace(/^-\s*/, '').replace(/^['"]|['"]$/g, '').trim();
        if (item) card.lexical_habits.punctuation_patterns.push(item);
      }
    } else if (currentSection === 'focus_biases') {
      if (/^cares_about:/i.test(trimmed)) {
        currentSubSection = 'cares_about';
      } else if (/^ignores:/i.test(trimmed)) {
        currentSubSection = 'ignores';
      } else if (trimmed.startsWith('-') && currentSubSection === 'cares_about') {
        const item = trimmed.replace(/^-\s*/, '').replace(/^['"]|['"]$/g, '').trim();
        if (item) card.focus_biases.cares_about.push(item);
      } else if (trimmed.startsWith('-') && currentSubSection === 'ignores') {
        const item = trimmed.replace(/^-\s*/, '').replace(/^['"]|['"]$/g, '').trim();
        if (item) card.focus_biases.ignores.push(item);
      }
    }
  }

  return card;
}


