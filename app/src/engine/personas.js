// Author Persona Cards & Archetypes

export const ARCHETYPES = [
  {
    id: 'scholarly-researcher',
    name: 'Academic / Scholarly Researcher',
    badge: '🎓 Scholarly',
    description: 'Methodological rigor, precise domain terminology, active reasoning, zero promotional fluff.',
    card: {
      epistemic_stance: 'empirical_observational',
      audience_relationship: 'peer_colleague',
      shared_context: 'high (assumes standard methodology & domain knowledge)',
      lexical_habits: {
        repetition_tolerance: 'high (repeats precise technical terms without forced synonyms)',
        formality_level: 'rigorous',
        metaphor_usage: 'rare (prefers concrete mechanics)'
      },
      asymmetry_tolerance: {
        allows_functional_plainness: true,
        allows_uneven_paragraph_lengths: true,
        allows_unresolved_asides: false
      },
      focus_biases: {
        cares_about: ['methodology', 'empirical evidence', 'boundary conditions', 'falsifiability'],
        ignores: ['visionary hype', 'marketing adjectives', 'dramatic countdowns']
      }
    }
  },
  {
    id: 'systems-engineer',
    name: 'Operational Systems Engineer',
    badge: '🛠️ Systems',
    description: 'Grounds claims in concrete runtime trade-offs, failure modes, deploy latency, and operational reality.',
    card: {
      epistemic_stance: 'operational_practitioner',
      audience_relationship: 'peer_colleague',
      shared_context: 'high (omits elementary software primers)',
      lexical_habits: {
        repetition_tolerance: 'high (calls a cache a cache, never "temporary memory buffer")',
        formality_level: 'plain_spoken',
        metaphor_usage: 'rare'
      },
      asymmetry_tolerance: {
        allows_functional_plainness: true,
        allows_uneven_paragraph_lengths: true,
        allows_unresolved_asides: true
      },
      focus_biases: {
        cares_about: ['latency', 'failure modes', 'reproducibility', 'rollback cost'],
        ignores: ['synergy', 'transformative paradigm shifts', 'generic corporate agility']
      }
    }
  },
  {
    id: 'executive-decision',
    name: 'Executive Decision Memo',
    badge: '📋 Decision Memo',
    description: 'Blunt, actionable, resource-oriented. Directly states trade-offs, risks, and timelines without runway.',
    card: {
      epistemic_stance: 'direct_assertive',
      audience_relationship: 'executive_briefing',
      shared_context: 'medium (leads with bottom line, follows with numbers)',
      lexical_habits: {
        repetition_tolerance: 'medium',
        formality_level: 'terse_professional',
        metaphor_usage: 'rare'
      },
      asymmetry_tolerance: {
        allows_functional_plainness: true,
        allows_uneven_paragraph_lengths: true,
        allows_unresolved_asides: false
      },
      focus_biases: {
        cares_about: ['headcount', 'timeline risk', 'reversible vs irreversible decisions'],
        ignores: ['speculative future narratives', 'empty superlatives']
      }
    }
  },
  {
    id: 'candid-essayist',
    name: 'Candid Technical Essayist',
    badge: '✍️ Essayist',
    description: 'Conversational cadence, observational stance, personal voice without performative drama.',
    card: {
      epistemic_stance: 'empirical_observational',
      audience_relationship: 'public_explainer',
      shared_context: 'medium',
      lexical_habits: {
        repetition_tolerance: 'high',
        formality_level: 'conversational',
        metaphor_usage: 'concrete_everyday'
      },
      asymmetry_tolerance: {
        allows_functional_plainness: true,
        allows_uneven_paragraph_lengths: true,
        allows_unresolved_asides: true
      },
      focus_biases: {
        cares_about: ['counterintuitive findings', 'lived engineering friction', 'honest trade-offs'],
        ignores: ['sycophantic flattery', 'motivational poster closures']
      }
    }
  },
  {
    id: 'warm-mentor',
    name: 'Direct & Warm Mentor',
    badge: '🌱 Mentor',
    description: 'Engaging, unhurried cadence, directly addresses reader ("you"), cuts hollow praise for practical advice.',
    card: {
      epistemic_stance: 'supportive_practitioner',
      audience_relationship: 'mentor',
      shared_context: 'medium_low (clear, instructive explanations)',
      lexical_habits: {
        repetition_tolerance: 'medium',
        formality_level: 'warm_approachable',
        metaphor_usage: 'instructive'
      },
      asymmetry_tolerance: {
        allows_functional_plainness: true,
        allows_uneven_paragraph_lengths: true,
        allows_unresolved_asides: false
      },
      focus_biases: {
        cares_about: ['conceptual clarity', 'practical next steps', 'preventing common pitfalls'],
        ignores: ['performative empathy openers ("I completely understand how you feel")']
      }
    }
  }
];

export function formatPersonaYaml(card) {
  return `author_profile:
  epistemic_stance: "${card.epistemic_stance}"
  audience_relationship: "${card.audience_relationship}"
  shared_context: "${card.shared_context}"
  lexical_habits:
    repetition_tolerance: "${card.lexical_habits?.repetition_tolerance || 'high'}"
    formality_level: "${card.lexical_habits?.formality_level || 'plain_spoken'}"
    metaphor_usage: "${card.lexical_habits?.metaphor_usage || 'rare'}"
  asymmetry_tolerance:
    allows_functional_plainness: ${card.asymmetry_tolerance?.allows_functional_plainness ?? true}
    allows_uneven_paragraph_lengths: ${card.asymmetry_tolerance?.allows_uneven_paragraph_lengths ?? true}
  focus_biases:
    cares_about: ${JSON.stringify(card.focus_biases?.cares_about || [])}
    ignores: ${JSON.stringify(card.focus_biases?.ignores || [])}`;
}
