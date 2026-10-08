# Phrases & Fingerprints to Remove

Every phrase and token listed here is a signal of AI-generated text. Remove them on sight.

## Chatbot Citation Leaks & URL Tracking Fingerprints

Proof of raw copy-paste from AI interfaces:

- Citation tokens: `citeturn0search0`, `contentReference[oaicite:0]{index=0}`, `oai_citation`, `[attached_file:1]`, `grok_card`
- AI tracking URL parameters: `utm_source=chatgpt.com`, `utm_source=copilot.com`, `utm_source=openai`, `utm_source=claude.ai`, `utm_source=perplexity.ai`, `referrer=grok.com`
- Unfilled placeholders: `[Your Name]`, `[INSERT SOURCE URL]`, `[Describe the specific section]`, `2025-XX-XX`, `<!-- Add citation if available -->`

**Fix:** Strip tokens and tracking parameters completely. Fill or delete placeholders.

## Throat-Clearing Openers

These announce the point instead of making it. Cut them and start with the content.

- "Here's the thing:"
- "Here's what [X]"
- "Here's why [X]"
- "The uncomfortable truth is"
- "It turns out"
- "The real [X] is"
- "Let me be clear"
- "The truth is,"
- "I'm going to be honest"
- "Here's what I find interesting"
- "Look," / "So," / "Now," (as empty openers)

## Emphasis Crutches

Manufactured weight:

- "Full stop." / "Period."
- "Let that sink in."
- "This matters because"
- "Make no mistake"
- "Read that again."
- "I can't stress this enough"
- "This is huge."
- "And I mean that."

## Business & Dev-Blog Jargon

Replace with plain language:

- "Navigate (challenges)" → deal with, handle
- "Unpack (analysis)" → explain, examine
- "Lean into" → embrace, accept
- "Game-changer" → (name specific change)
- "Deep dive" → analysis, look at
- "Level up" → improve
- "Unlock" / "Empower" → allow, let, enable
- "Ecosystem" → market, network, community
- "Batteries included" → (name actual inclusions)
- "It just works" → (describe behavior)
- "Zero config" → installs with no config file
- "Fits in your head" → (state API size)

## Social Endorsement Closers & Lingering-Attention Claims

- "This one is worth your time:"
- "This one's a must-read:"
- "Don't sleep on this one."
- "Thank me later."
- "Save this for later." / "Bookmark this."
- "The line I keep coming back to:"
- "I can't stop thinking about this:"
- "Still thinking about this one:"

**Fix:** State what the thing is and who it's for, or drop the sign-off / frame.

## Hollow Intensifiers & Adverbs

No `-ly` intensifiers. Just state the fact:

- really, just, literally, genuinely, honestly, simply, actually
- deeply, truly, fundamentally, inherently, inevitably
- interestingly, importantly, crucially, ultimately, essentially
- remarkably, surprisingly, notably, clearly, obviously, seamlessly

## Infomercial Hooks & "Let's" Transitions

- "The catch?" / "The kicker?"
- "Plot twist:" / "The result?"
- "The best part?"
- "Let's explore" / "Let's dive in" / "Let's break this down" / "Let's take a look"

**Fix:** Delete the hook/opener and make the point directly.
