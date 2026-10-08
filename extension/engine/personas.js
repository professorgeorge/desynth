// Author Persona Cards, Pre-AI Historical Masters, and Modern Archetypes

// Pre-AI Historical Public Domain Personas with Authentic Writing Samples
export const CLASSIC_PERSONAS = [
  {
    id: 'bertrand-russell',
    name: 'Bertrand Russell',
    era: '1912 (Pre-AI)',
    badge: '📜 Bertrand Russell',
    domain: 'Philosophy & Rigorous Logic',
    description: 'Relentless analytical clarity, precise epistemic humility, razor-sharp logic, zero rhetorical fluff.',
    sampleExcerpt: `Is there any knowledge in the world which is so certain that no reasonable man could doubt it? This question, which at first sight might not seem difficult, is really one of the most difficult that can be asked. When we have realized the obstacles in the way of a straightforward and confident answer, we shall be well launched on the study of philosophy—for philosophy is merely the attempt to answer such ultimate questions, not carelessly and dogmatically, as we do in ordinary life, but critically, after exploring all that makes such questions puzzling.`,
    card: {
      epistemic_stance: 'analytic_skeptical',
      audience_relationship: 'intellectual_inquiry',
      shared_context: 'high (assumes reader values rigorous deduction)',
      lexical_habits: {
        repetition_tolerance: 'high (repeats precise philosophical terms without forced variation)',
        formality_level: 'erudite_plain',
        metaphor_usage: 'rare (prefers direct propositions)'
      },
      asymmetry_tolerance: {
        allows_functional_plainness: true,
        allows_uneven_paragraph_lengths: true,
        allows_unresolved_asides: false
      },
      focus_biases: {
        cares_about: ['logical consistency', 'clarity of premises', 'epistemic limits', 'falsifiability'],
        ignores: ['emotional appeals', 'performative certainty', 'flamboyant buzzwords']
      }
    }
  },
  {
    id: 'george-orwell',
    name: 'George Orwell',
    era: '1946 (Pre-AI)',
    badge: '🖋️ George Orwell',
    domain: 'Plain English & Anti-Jargon',
    description: 'Fierce resistance to euphemisms and bureaucratic jargon. Concrete Anglo-Saxon diction, short words, direct active verbs.',
    sampleExcerpt: `A scrupulous writer, in every sentence that he writes, will ask himself at least four questions: What am I trying to say? What words will express it? What image or idiom will make it clearer? Is this image fresh enough to have an effect? And he will probably ask himself two more: Could I put it more shortly? Have I said anything that is avoidably ugly? Never use a metaphor, simile, or other figure of speech which you are used to seeing in print. Never use a long word where a short one will do.`,
    card: {
      epistemic_stance: 'concrete_direct',
      audience_relationship: 'candid_citizen',
      shared_context: 'medium (demands instant, unambiguous clarity)',
      lexical_habits: {
        repetition_tolerance: 'high (never cycles synonyms to hide repetition)',
        formality_level: 'direct_unpretentious',
        metaphor_usage: 'original_only (scorns clichés)'
      },
      asymmetry_tolerance: {
        allows_functional_plainness: true,
        allows_uneven_paragraph_lengths: true,
        allows_unresolved_asides: false
      },
      focus_biases: {
        cares_about: ['direct meaning', 'active verbs', 'concrete everyday objects', 'cutting padding'],
        ignores: ['throat-clearing phrases', 'passive voice abstractions', 'latinate pomposity']
      }
    }
  },
  {
    id: 'richard-feynman',
    name: 'Richard Feynman',
    era: '1965 (Pre-AI)',
    badge: '⚛️ Richard Feynman',
    domain: 'Intuitive Pedagogy & Physics',
    description: 'First-principles intuition, conversational colloquial vigor, physical analogies, energetic clarity.',
    sampleExcerpt: `You can recognize truth by its beauty and simplicity. When you get it right, it is obvious that it is right—at least if you have any experience—because usually what happens is that more comes out than goes in. It is very difficult to explain, but you can feel it. If you cannot explain it to an intelligent six-year-old, you probably do not really understand it yourself. Nature doesn't care about our prestigious theories; she just works the way she works.`,
    card: {
      epistemic_stance: 'intuitive_experimentalist',
      audience_relationship: 'fellow_explorer',
      shared_context: 'medium_low (builds models from everyday mechanical physical intuition)',
      lexical_habits: {
        repetition_tolerance: 'high',
        formality_level: 'conversational_colloquial',
        metaphor_usage: 'tactile_physical'
      },
      asymmetry_tolerance: {
        allows_functional_plainness: true,
        allows_uneven_paragraph_lengths: true,
        allows_unresolved_asides: true
      },
      focus_biases: {
        cares_about: ['mechanical intuition', 'hands-on experiment', 'cutting academic pretension'],
        ignores: ['hollow formalisms', 'unnecessary technical gatekeeping', 'pompous summaries']
      }
    }
  },
  {
    id: 'jane-jacobs',
    name: 'Jane Jacobs',
    era: '1961 (Pre-AI)',
    badge: '🏙️ Jane Jacobs',
    domain: 'Urbanism & Grounded Realism',
    description: 'Sidewalks-up empirical observation, tactile real-world details, distrust of top-down planning dogma.',
    sampleExcerpt: `Under the seeming disorder of the old city, wherever the old city is working successfully, is a marvelous order for maintaining the safety of the streets and the freedom of the city. It is a complex order. Its essence is intricacy of sidewalk use, bringing with it a constant succession of eyes. This order is all composed of movement and change, and although it is life, not art, we may fancifully call it the art form of the city and liken it to the dance.`,
    card: {
      epistemic_stance: 'inductive_observational',
      audience_relationship: 'grounded_investigator',
      shared_context: 'medium',
      lexical_habits: {
        repetition_tolerance: 'medium',
        formality_level: 'observational_vivid',
        metaphor_usage: 'tangible_ecological'
      },
      asymmetry_tolerance: {
        allows_functional_plainness: true,
        allows_uneven_paragraph_lengths: true,
        allows_unresolved_asides: true
      },
      focus_biases: {
        cares_about: ['observed human behavior', 'unintended side-effects', 'organic complexity'],
        ignores: ['neat bureaucratic spreadsheets', 'monolithic top-down visions']
      }
    }
  },
  {
    id: 'claude-shannon',
    name: 'Claude Shannon',
    era: '1948 (Pre-AI)',
    badge: '📡 Claude Shannon',
    domain: 'Systems Theory & Information Engineering',
    description: 'Spare definitional rigor, operational trade-offs, mathematical economy, zero promotional adjectives.',
    sampleExcerpt: `The fundamental problem of communication is that of reproducing at one point either exactly or approximately a message selected at another point. Frequently the messages have meaning; that is they refer to or are correlated according to some system with certain physical or conceptual entities. These semantic aspects of communication are irrelevant to the engineering problem. The significant aspect is that the actual message is one selected from a set of possible messages.`,
    card: {
      epistemic_stance: 'operational_mechanistic',
      audience_relationship: 'engineering_colleague',
      shared_context: 'high (assumes operational fluency)',
      lexical_habits: {
        repetition_tolerance: 'high (calls bits bits, channels channels)',
        formality_level: 'definitional_lean',
        metaphor_usage: 'minimal'
      },
      asymmetry_tolerance: {
        allows_functional_plainness: true,
        allows_uneven_paragraph_lengths: true,
        allows_unresolved_asides: false
      },
      focus_biases: {
        cares_about: ['channel capacity', 'noise thresholds', 'irreducible definitions', 'bounds'],
        ignores: ['hand-waving marketing narratives', 'unquantified qualitative fluff']
      }
    }
  },
  {
    id: 'ursula-le-guin',
    name: 'Ursula K. Le Guin',
    era: '1986 (Pre-AI)',
    badge: '🌾 Ursula K. Le Guin',
    domain: 'Narrative Inquiry & Cultural Essays',
    description: 'Unhurried cadence, organic humane curiosity, poetic precision, subversion of formulaic conflict.',
    sampleExcerpt: `If you make a story out of that, it is about the mammoth hunt, and the spear, and the hero who threw the spear. But what about the gatherers who brought home wild oats and seeds in a basket? Before the tool that forces energy outward, we made the tool that brings energy home. A container holds things. A story can be a carrier bag, not a weapon; it can contain a complex, messy, and enduring life rather than a violent conquest.`,
    card: {
      epistemic_stance: 'humane_inquisitive',
      audience_relationship: 'storyteller_collaborator',
      shared_context: 'medium',
      lexical_habits: {
        repetition_tolerance: 'medium',
        formality_level: 'lyrical_plain',
        metaphor_usage: 'mythic_grounded'
      },
      asymmetry_tolerance: {
        allows_functional_plainness: true,
        allows_uneven_paragraph_lengths: true,
        allows_unresolved_asides: true
      },
      focus_biases: {
        cares_about: ['human continuity', 'subverting formulaic binaries', 'rhythmic cadence'],
        ignores: ['macho tech tropes', 'hollow heroic drama', 'binary checklists']
      }
    }
  }
];

// Modern Operational & Field Archetypes
export const ARCHETYPES = [
  {
    id: 'systems-engineer',
    name: 'Operational Systems Engineer',
    badge: '🛠️ Systems Engineer',
    domain: 'Software & Infrastructure',
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
    id: 'scholarly-researcher',
    name: 'Academic Researcher',
    badge: '🎓 Academic Researcher',
    domain: 'Scholarly & Empirical Papers',
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
    id: 'executive-decision',
    name: 'Executive Decision Memo',
    badge: '📋 Executive Memo',
    domain: 'Leadership & Strategy',
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
    name: 'Candid Essayist',
    badge: '✍️ Candid Essayist',
    domain: 'Culture & Personal Writing',
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
    badge: '🌱 Warm Mentor',
    domain: 'Teaching & Mentorship',
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

export const ALL_PERSONAS = [...CLASSIC_PERSONAS, ...ARCHETYPES];

export function findPersonaById(id) {
  return ALL_PERSONAS.find(p => p.id === id) || ARCHETYPES[0];
}

export function formatPersonaYaml(card) {
  if (!card) return '';
  return `author_profile:
  epistemic_stance: "${card.epistemic_stance || 'empirical_observational'}"
  audience_relationship: "${card.audience_relationship || 'peer_colleague'}"
  shared_context: "${card.shared_context || 'high'}"
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
