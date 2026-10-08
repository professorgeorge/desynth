# Before/After Examples

Each example shows an AI writing pattern and its fix. Study these to internalize the rules.

---

## Example 1: Throat-Clearing + Binary Contrast

**Before:**
> "Here's the thing: building products is hard. Not because the technology is complex. Because
> people are complex. Let that sink in."

**After:**
> "Building products is hard. Technology is manageable. People aren't."

**What changed:** Removed the opener ("Here's the thing"), the binary contrast structure ("Not
because X. Because Y."), and the emphasis crutch ("Let that sink in"). Three direct statements
remain.

---

## Example 2: Filler + Unnecessary Reassurance

**Before:**
> "It turns out that most teams struggle with alignment. The uncomfortable truth is that nobody
> wants to admit they're confused. And that's okay."

**After:**
> "Teams struggle with alignment. Nobody admits confusion."

**What changed:** Cut the hedging ("most"), removed two throat-clearing phrases ("It turns out,"
"The uncomfortable truth is"), and deleted the permission-granting closer ("And that's okay.").

---

## Example 3: Business Jargon Stack

**Before:**
> "In today's fast-paced landscape, we need to lean into discomfort and navigate uncertainty with
> clarity. This matters because your competition isn't waiting."

**After:**
> "Move faster. Your competition is."

**What changed:** Eliminated every piece of jargon. The core message fits in six words.

---

## Example 4: Dramatic Fragmentation

**Before:**
> "Speed. Quality. Cost. You can only pick two. That's it. That's the tradeoff."

**After:**
> "Speed, quality, cost: pick two."

**What changed:** Collapsed fragments into one sentence. Removed performative emphasis ("That's it.
That's the tradeoff.").

---

## Example 5: Rhetorical Setup

**Before:**
> "What if I told you that the best teams don't optimize for productivity? Here's what I mean:
> they optimize for learning. Think about it."

**After:**
> "The best teams optimize for learning, not productivity."

**What changed:** Direct claim. No rhetorical scaffolding ("What if I told you"), no redundant
preview ("Here's what I mean"), no condescending prompt ("Think about it").

---

## Example 6: False Agency

**Before:**
> "The data tells a compelling story. Revenue growth accelerated when the strategy shifted toward
> customer retention. The decision to pivot emerged from months of analysis."

**After:**
> "The finance team tracked revenue for three months and found that keeping existing customers drove
> more growth than acquiring new ones. The VP of product approved the pivot in October."

**What changed:** Named the humans (finance team, VP of product). Replaced false agency ("data
tells," "strategy shifted," "decision emerged") with people doing things. Added specifics (three
months, October).

---

## Example 7: Narrator-from-a-Distance + Vague Declaratives

**Before:**
> "Nobody designed organizational dysfunction. It happens gradually, through a thousand small
> compromises. The implications are significant. This is why culture matters."

**After:**
> "You don't set out to build a dysfunctional org. You skip one hard conversation, then another.
> Eighteen months later, your best engineer quits and you can't explain why."

**What changed:** Replaced the narrator-from-a-distance voice with "you." Killed the vague
declarative ("The implications are significant") and the empty closer ("This is why culture
matters"). Replaced abstractions with a concrete scene.

---

## Example 8: Passive Voice + Adverbs

**Before:**
> "The initiative was carefully designed to fundamentally transform how feedback is delivered across
> the organization. It was widely regarded as a genuinely innovative approach."

**After:**
> "The HR director redesigned the feedback process. Managers now give written reviews every two
> weeks instead of annual scores."

**What changed:** Named the actor (HR director, managers). Killed every adverb (carefully,
fundamentally, widely, genuinely). Replaced the vague "transform" with the specific change (written
reviews every two weeks).

---

## Example 9: Three-Item List + Em Dash + Meta-Commentary

**Before:**
> "Great leaders do three things: they listen, they adapt, and they execute. These qualities
> — often overlooked — are what separate good managers from great ones. Let me walk you through
> each."

**After:**
> "Good managers listen and then change course when the situation demands it. The ones who stand out
> follow through on the change."

**What changed:** Collapsed the three-item list to a natural sentence flow. Removed the em dash
construction, the meta-commentary ("Let me walk you through each"), and the vague
framing ("separate good from great").

---

## Example 10: Performative Emphasis + Telling Instead of Showing

**Before:**
> "This is genuinely hard. Most people underestimate how difficult it is to give feedback that
> actually matters. I've seen this firsthand. It's not about being nice or being tough. It's about
> being specific."

**After:**
> "Giving useful feedback is harder than most managers expect. 'You need to improve your
> communication' does nothing. 'Your last three status emails buried the deadline in paragraph four'
> gives someone something to fix."

**What changed:** Cut "genuinely" and "actually." Replaced "I've seen this firsthand" (performative
emphasis). Replaced the binary contrast ("not about X, it's about Y") with a concrete example
showing what specificity looks like.

---

## Example 11: Full Rewrite (Multiple Violations)

**Before:**
> "In today's rapidly evolving technological landscape, artificial intelligence is fundamentally
> transforming how we think about productivity. The implications are truly staggering. It's not
> just about automation — it's about augmentation. Here's why that matters: when AI handles
> routine tasks, humans are freed up to do what they do best. Think about it. The possibilities
> are genuinely endless."

**After:**
> "AI handles the repetitive work so you can spend your time on problems that need judgment. An
> analyst who used to spend four hours cleaning spreadsheets now spends that time finding patterns
> in the data."

**What changed:** Killed the jargon opener ("rapidly evolving technological landscape"), five
adverbs, a vague declarative ("truly staggering"), a binary contrast ("not just X, it's Y"), an em
dash, a throat-clearer ("Here's why that matters"), a condescending prompt ("Think about it"), and
a hollow closer ("genuinely endless"). Replaced all of it with one concrete example.

---

## Example 12: The 4-Pass Cognitive Engine vs. The "Humanizer" Trap

**Before (Generic AI Prose):**
> "In the modern software development landscape, maintaining developer velocity is a paramount concern for engineering leaders. However, monolithic architectures often serve as a bottleneck, hindering rapid iteration. By embracing microservices, organizations can unlock unprecedented scalability and empower cross-functional teams to innovate seamlessly. At its core, this architectural paradigm shift is not just about code—it is about fostering a culture of agility."

**Bad "Humanizer" Rewrite (The Detector Evasion Trap):**
> "Velocity. That's the whole game. Everyone thinks microservices are about scaling. They're wrong. Monoliths slow teams down. Breaking them up frees engineers. It's not about the code. It's about culture. Period."
> *(Why this fails: Choppy staccato rhythm, manufactured contrarianism, artificial fragments, and an emphasis crutch ("Period"). Detectors flag this immediately as an AI attempting to simulate a human essayist).*

**Authentic 4-Pass Rewrite (Conditioned on Systems Engineer Persona):**
> **Pass 1 (Substance)**: Monoliths slow down deployments as teams grow because shared builds and test suites bottleneck everyone. Breaking services apart gives teams independent deployment pipelines.  
> **Pass 2 (Persona)**: Staff engineer writing an internal architecture memo. High shared context, operational stance, focuses on deploy times and ownership boundaries.  
> **Pass 3 & 4 (Render & Consistency Audit)**:  
> "As the engineering team crossed forty people, our single Rails repo became the main constraint on shipping. A broken test in billing would block the search team from deploying for two days. Splitting the ingest and billing workers into separate services gave each team their own deploy pipeline, which brought average deploy queue time from four hours down to twelve minutes."

**What changed:** Replaced marketing abstractions ("velocity", "unprecedented scalability", "fostering agility") and avoided artificial staccato fragments. Anchored the narrative in operational reality, human actors, and concrete numbers.

