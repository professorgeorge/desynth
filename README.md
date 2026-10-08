# Stop Slop — Cognitive Voice & Anti-Slop Studio

[![Deploy to GitHub Pages](https://github.com/professorgeorge/stop-slop/actions/workflows/deploy.yml/badge.svg)](https://github.com/professorgeorge/stop-slop/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

> **Eliminate artificial AI writing patterns and restore authentic human prose.**  
> Powered by author persona modeling, controlled asymmetry, and a 4-pass thinking-to-rendering engine.

---

## 🌟 Live PWA Web App

You can run Stop Slop directly in your browser as an installable **Progressive Web App (PWA)**:

👉 **[Launch Live Web App](https://professorgeorge.github.io/stop-slop/)**

---

## 🧩 Chrome Extension (Right-Click Humanization Anywhere)

Stop-Slop also includes a dedicated **Manifest V3 Chrome Extension**:
Select any text $\to$ Right-Click $\to$ **"Stop-Slop: Humanize Selection"** (or press `Alt + H`)!

* **In-Page Floating HUD (Shadow DOM Protected)**: Shows the humanized rewrite directly beside your selection with zero CSS conflicts with host websites.
* **1-Click In-Place Replacement**: Replaces selected text directly in Gmail, Google Docs, Notion, Slack, Reddit, Word Online, or form textareas.
* **Instant 0ms Deterministic Clean**: Runs offline in 0.5ms with zero LLM requirements, purging em-dashes, nominalizations, throat-clearing, and tricolons.
* **Local & Cloud Model Support**: Works seamlessly with local **Ollama** (`http://localhost:11434`), **Google Gemini**, or **OpenAI / Groq**.
* **Toolbar Scratchpad**: Click the toolbar icon to quickly paste and humanize drafts on the fly.

### Install Extension in 10 Seconds:
1. Open Chrome and go to `chrome://extensions/`.
2. Toggle on **Developer mode** in the top-right corner.
3. Click **Load unpacked** and select the [`extension`](file:///c:/Users/babug/.gemini/antigravity-ide/scratch/stop-slop/extension) folder from this repository.
4. Highlight any text on any page and press **Alt + H** or right-click!

---

## 🚀 How to Enable GitHub Pages

The repository is pre-configured with two deployment options:

### Option A: Direct `/docs` Folder (Simplest, Zero CI Time)
1. Go to your repository on GitHub: `https://github.com/<your-username>/stop-slop`.
2. Click **Settings** $\to$ **Pages** (in the left sidebar).
3. Under **Build and deployment**:
   * **Source**: Select `Deploy from a branch`.
   * **Branch**: Select `main`.
   * **Folder**: Select `/docs`.
4. Click **Save**. Within 1–2 minutes, your live PWA will be published at `https://<your-username>.github.io/stop-slop/`!

### Option B: Automated GitHub Actions
The repository includes `.github/workflows/deploy.yml`. In **Settings > Pages**, set **Source** to **GitHub Actions**, and every push to `main` will build and publish automatically.

---

## 💻 Local Development

```bash
# Clone the repository
git clone https://github.com/professorgeorge/stop-slop.git
cd stop-slop/app

# Install dependencies
npm install

# Start development server
npm run dev
# -> Opens http://localhost:5173/

# Build production bundle (outputs to ../docs for GitHub Pages)
npm run build
```

---

## 🧠 The 4-Pass Cognitive Architecture

Traditional "AI humanizers" fail because they attempt to evade detectors using superficial checklists (e.g. chopping sentences into machine-gun fragments, banning words, adding performative cynicism). This merely trains models into an equally artificial "AI pretending to be human" distribution.

Stop Slop replaces negative checklists with a sequential cognitive pipeline:

1. **Pass 1: Substance Extraction**: Strips away buzzwords, throat-clearing openers, and rhetorical padding to reveal the irreducible factual claim and evidence.
2. **Pass 2: Author Persona Modeling**: Grounds the generation in an explicit Author Card (epistemic stance, shared audience assumptions, habitual vocabulary, asymmetry tolerance).
3. **Pass 3: Natural Generative Draft**: Generates the draft freely from the author's stance without real-time blacklist cognitive overload.
4. **Pass 4: Consistency & Linter Audit**: Evaluates voice consistency against the author model and runs background sanity checks (catching leaked citation tokens, tracking parameters, and corporate jargon).

---

## 📦 Using as an Agent Skill

The repository also includes the packaged **`stop-slop.skill`** bundle and **`SKILL.md`** for use with AI coding assistants (Claude Code, Cursor, Antigravity, OpenHands, OpenClaw):

* **Global Agent Skill**: Copy `SKILL.md` and `references/` into `~/.gemini/config/skills/stop-slop/` or `~/.claude/skills/stop-slop/`.
* **Workspace Skill**: Place in `.agents/skills/stop-slop/` or your project root.

---

## 📜 License

MIT License. Based on research from [Avoid AI Writing](https://github.com/conorbronsdon/avoid-ai-writing) and [Stop Slop](https://github.com/hvpandya/stop-slop).
