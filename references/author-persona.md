# Author Persona & Latent Modeling Guide

This reference explains how to construct, infer, and condition on an **Author Persona Card** to produce writing with authentic human voice instead of generic AI de-slopping.

---

## The Philosophy: Latent Persona Conditioning

When a human writes, their text is shaped by a complex mental state:
- What they care about vs. what bores them
- Their level of conviction or doubt on a topic
- What they assume the reader already knows
- Their idiosyncratic habits of sentence structure and word choice
- Their comfort with leaving thoughts slightly rough or under-explained

When an LLM writes without an author model, it samples from a high-probability centroid that balances all voices. When it is told to "sound human" or "vary sentence length," it simulates a shallow caricature of voice.

Conditioning on an **Author Model** breaks this centroid. It grounds the LLM in a consistent perspective.

---

## The Author Card Schema

An author card specifies the latent parameters of the writer:

```yaml
author_profile:
  # 1. Epistemic Stance
  # How the writer relates to truth and evidence.
  # Values: direct_assertive | empirical_observational | skeptical_inquisitive | operational_practitioner
  epistemic_stance: operational_practitioner

  # 2. Audience Relationship & Shared Context
  # How the writer views the reader.
  # Values: peer_colleague | mentor | executive_briefing | public_explainer
  audience_relationship: peer_colleague
  # Values: high (skip elementary explanations) | medium | low (define everything)
  shared_context: high

  # 3. Lexical Habits & Repetition Tolerance
  lexical_habits:
    # High means author repeats the exact right noun rather than cycling synonyms
    repetition_tolerance: high
    # Values: plain_spoken | rigorous | conversational | terse
    formality_level: plain_spoken
    # Values: rare | mechanical_systems | everyday_life
    metaphor_usage: mechanical_systems

  # 4. Asymmetry & Imperfection Profile
  asymmetry_tolerance:
    allows_functional_plainness: true     # Sentences don't all need to be zingers
    allows_uneven_paragraph_lengths: true # One point can be 3 paragraphs; another can be 1 sentence
    allows_unresolved_asides: true        # Author can drop an observation without a 3-part essay resolution

  # 5. Core Beliefs / Blind Spots (Context Specific)
  focus_biases:
    cares_about: ["latency", "operational simplicity", "debugging under pressure"]
    ignores: ["corporate governance buzzwords", "generic future predictions"]
```

---

## Extracting an Author Card from a Writing Sample

When a user provides a writing sample (`--sample <text>` or past blog post / email / pull request description), extract the persona using these five diagnostic questions:

1. **What does the author take for granted?**  
   Look at what they *don't* explain. If they mention "p99 latency" without explaining what a percentile is, `shared_context` is `high`.
2. **How do they handle disagreement or criticism?**  
   Do they hedge with polite phrases ("It is worth noting that some might feel..."), or do they state the trade-off directly ("If you do this, rollbacks become impossible")?
3. **What is their repetition behavior?**  
   Do they use the same noun three times in two sentences because it's the exact technical term, or do they reach for synonyms?
4. **How do their paragraphs end?**  
   Do they end with inspirational one-liners ("And that makes all the difference"), or do they stop once the technical explanation is finished?
5. **What is their cadence under pressure?**  
   Do they write in short, functional bursts or long, layered analytical sentences?

---

## Archetype Cards

### 1. The Systems Engineer / Pragmatic Builder
```yaml
author_profile:
  epistemic_stance: operational_practitioner
  audience_relationship: peer_colleague
  shared_context: high
  lexical_habits:
    repetition_tolerance: high
    formality_level: plain_spoken
    metaphor_usage: rare
  asymmetry_tolerance:
    allows_functional_plainness: true
    allows_uneven_paragraph_lengths: true
    allows_unresolved_asides: true
  focus_biases:
    cares_about: ["trade-offs", "failure modes", "reproducibility"]
    ignores: ["brand messaging", "visionary predictions"]
```
*Sample Output*:
> "We kept the sqlite storage engine for local caching. It's single-threaded for writes, but we only write during startup sync. Moving to an embedded KV store would have added another CGO dependency without cutting read latency."

### 2. The Thoughtful Decision Memo Writer (Executive / Product Lead)
```yaml
author_profile:
  epistemic_stance: direct_assertive
  audience_relationship: executive_briefing
  shared_context: medium
  lexical_habits:
    repetition_tolerance: medium
    formality_level: rigorous
    metaphor_usage: concrete_mechanics
  asymmetry_tolerance:
    allows_functional_plainness: true
    allows_uneven_paragraph_lengths: false
    allows_unresolved_asides: false
  focus_biases:
    cares_about: ["resource allocation", "timeline risks", "irreversible choices"]
    ignores: ["speculative upside without dates"]
```
*Sample Output*:
> "We should deprecate the v1 ingest pipeline in Q3. Three customers still route traffic through it, but supporting the dual schema costs roughly twenty engineering hours every sprint."

### 3. The Candid Technical Essayist
```yaml
author_profile:
  epistemic_stance: empirical_observational
  audience_relationship: public_explainer
  shared_context: medium
  lexical_habits:
    repetition_tolerance: high
    formality_level: conversational
    metaphor_usage: everyday_life
  asymmetry_tolerance:
    allows_functional_plainness: true
    allows_uneven_paragraph_lengths: true
    allows_unresolved_asides: true
  focus_biases:
    cares_about: ["counterintuitive findings", "personal friction points", "plain facts"]
    ignores: ["sycophantic flattery", "platitudes"]
```
*Sample Output*:
> "Everyone assumed the bottle-neck was network I/O. It wasn't. We were spending forty milliseconds per request serializing JSON objects that nobody downstream ever read."

---

## Golden Rule of Persona Execution

The persona is a lens through which the text is filtered — **not a character to be performed**.  
If the writing begins to sound like an actor trying to sound like an engineer, dial back the persona traits and return to the primary directive: **clarity of thought, organic pacing, and factual substance.**
