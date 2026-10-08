# Context Profiles & Voice Profiles

Pass an optional context hint to adjust rule strictness. If no context is specified, auto-detect from content cues (short + hashtags = `linkedin`, code blocks = `technical-blog`, salutation = `investor-email`, step-by-step instructions = `docs`, default = `blog`).

## Profile Definitions

- **`linkedin`**: Short-form social. Punchy fragments, visual formatting matter.
- **`blog`**: Default. Standard long-form prose. All rules apply at full strength.
- **`technical-blog`**: Long-form with code, architecture, APIs. Technical terms get a pass.
- **`investor-email`**: High-trust audience. Tighten everything; promotional language is the biggest risk.
- **`docs`**: Documentation, READMEs, guides. Clarity over voice.
- **`casual`**: Slack messages, internal notes, quick replies. Only catch the worst offenders.

## Tolerance Matrix

Rules not listed in the table apply at full strength across all profiles.

| Rule | linkedin | blog | technical-blog | investor-email | docs | casual |
|------|----------|------|----------------|----------------|------|--------|
| Em dashes | relaxed (2/post OK) | strict | strict | strict | relaxed | skip |
| Bold overuse | relaxed (bold hooks OK) | strict | strict | strict | relaxed | skip |
| Emoji in headers | relaxed (1-2 end-of-line OK) | strict | strict | strict | skip | skip |
| Excessive bullets | skip (lists work on LinkedIn) | strict | relaxed (technical lists OK) | strict | skip (lists are docs) | skip |
| Hedging | strict | strict | relaxed ("may" is accurate in technical) | strict | relaxed | skip |
| Word table (full list) | strict | strict | **partial** (see vocabulary.md) | strict | relaxed | P0 only |
| Promotional language | relaxed (some sell is expected) | strict | strict | **extra strict** | strict | skip |
| Significance inflation | strict | strict | strict | **extra strict** | relaxed | skip |
| Copula avoidance | skip | strict | relaxed | strict | skip | skip |
| Uniform paragraph length | skip (short-form) | strict | strict | strict | relaxed | skip |
| Numbered list inflation | relaxed | strict | relaxed | strict | skip | skip |
| Rhetorical questions | relaxed (1 as hook OK) | strict | strict | strict | strict | skip |
| Transition phrases | skip (short-form) | strict | strict | strict | relaxed | skip |
| Generic conclusions | skip | strict | strict | **extra strict** | skip | skip |
| Hashtag stuffing | strict | strict | strict | **extra strict** | skip (no hashtags in docs) | skip |
| Bullet-NP lists | strict | strict | relaxed (technical option lists OK) | strict | relaxed (parameter lists OK) | skip |
| Tier 3 phrase clustering | strict | strict | strict | **extra strict** | relaxed | skip |
| Future-narrative closers | strict | strict | strict | **extra strict** | skip | skip |
| Social endorsement closers | strict (the LinkedIn share-post tell) | strict | strict | strict | skip | relaxed (1 OK in a DM) |
| Hedge-stacked predictions | strict | strict | relaxed ("could" is hedged accuracy) | **extra strict** | relaxed | skip |
| Real/actual inflation | strict | strict | strict | **extra strict** | relaxed | skip |
| Moral-adjective category errors | strict | strict | relaxed | strict | relaxed | skip |
| Invented contrast-pair mirroring | strict | strict | relaxed | strict | relaxed | skip |
| Subjectless fragments and agentless passives | relaxed (short-form fragments are the register) | strict | relaxed | strict | skip (fragment lists are docs) | skip |

**"Extra strict"**: Flag even borderline instances. In investor emails, a single "thriving ecosystem" can undermine the whole message.  
**"Skip"**: Do not audit this category for this profile. The rule does not apply or is not worth the edit.

## Auto-Detection Cues

| Signal | Inferred context |
|--------|-----------------|
| Under 300 words + hashtags or mentions | `linkedin` |
| Code blocks, API references, or technical architecture | `technical-blog` |
| Salutation ("Hi [name]", "Dear") + investor/fundraising language | `investor-email` |
| Step-by-step instructions, parameter docs, README structure | `docs` |
| No strong signals | `blog` (safest default — all rules apply) |

---

## Voice Profiles

Context profiles (above) set *how strict* to be for an audience. Voice profiles set *how the prose should sound* — the persona. They're independent axes: you can write blunt for a blog or warm for docs. Voice is **optional** — if the writer doesn't name one, infer it from the input's existing register and don't impose a persona on text that already has one.

Every target below is bounded by the Never-inject guardrails: a voice profile can bring out what the source already has, never manufacture what it doesn't.

### Profiles

- **`casual`**: Contractions throughout; their absence reads stiff. Short sentences (aim for ≤14 words on average); fragments allowed. Keep first-person and concrete touches where the source has them; never add one it lacks. Near-zero jargon. Keep warm hedges ("honestly," "I think") but cut corporate ones ("it's worth noting"). *Blog posts, social, community.*
- **`professional`**: Active voice for most sentences. Vary sentence length; avoid three in a row within a few words of each other. Prefer a concrete claim per paragraph (a number, a name, a date) when the source provides one; never "experts say." Keep the ask explicit where the source makes one; never invent facts or an ask. Low tolerance for hedging. *LinkedIn, investor email, sponsor pitches.*
- **`technical`**: Prefer plain copulatives ("X is Y") over inflated substitutes ("serves as," "stands as a testament to"). One idea per sentence; imperative mood for instructions. Jargon is fine, but define it on first use. Tables and lists only where the content is genuinely list-shaped, not for decoration. *Docs, technical blog.*
- **`warm`**: Address the reader directly where the source already speaks to them ("you"), and keep its acknowledgment rather than adding one. Cut intensifiers ("very," "truly," "incredibly") in favor of stronger verbs. No performative-empathy openers ("I completely understand how you feel"). Medium sentences (15–20 words) for an unhurried cadence. *Mentorship, onboarding, thank-yous.*
- **`blunt`**: Lead with the claim; cut "It's important to note that" windups. Em-dashes are rare here; use periods for emphasis. No padding to hit a rule of three. Near-zero hedging; flag "may / could / potentially" stacks. Short declaratives, with the occasional long sentence for contrast. *Decision memos, thought leadership, hard feedback.*

### Calibrate to a Sample

If the writer gives you a sample of their own writing ("match my voice — here's a post"), analyze its sentence-length pattern, contraction rate, paragraph openings, and recurring word choices, then match those instead of a named profile. Don't "upgrade" their vocabulary: if they write "stuff" and "things," keep that register.

### How Voice Composes with Context

Voice sets the target; context sets how hard to enforce it. A voice *target* always applies, even where a context profile would skip that category. Where both axes govern the same rule and agree, they reinforce. Where they disagree, resolve toward the **stricter** of the two.
