# ⚡ Desynth Chrome Extension

> **De-synthesize AI text into authentic, rhythmic human prose anywhere on the web.**
> Select any text $\rightarrow$ Right-Click $\rightarrow$ **Desynth: Humanize Selection** (or press `Alt + H`).

---

## ⚡ Key Features

1. **Right-Click Context Menu**:
   - Highlight text in Gmail, Google Docs, Notion, Slack, Reddit, Twitter, Word Online, or any article.
   - Right-click and choose **"Desynth: Humanize Selection"**.
   - Submenus allow picking specific authentic author voices:
     - 🖋️ **Plain English & Anti-Jargon (George Orwell)**
     - 🛠️ **Systems Engineer (Runtime Trade-offs & Operational Reality)**
     - 🎓 **Academic Empirical (Methodological Rigor)**
     - 📜 **Bertrand Russell (Analytical Clarity & Deductive Logic)**
     - ✂️ **Instant 0ms Desynth (100% Offline, Zero LLM)**
2. **Dual Processing Engine (Parity with Web App)**:
   - **🧠 Deep 4-Pass Cognitive Mode**: Full pipeline featuring Pass 1 Atomic Fact Graph extraction, Pass 2 Syntactic Frame grafting, Pass 3 Cadence synthesis with Cognitive Human Invariants, and Pass 4 Deterministic surgery.
   - **⚡ Fast Single-Pass Mode**: High-velocity turnaround for short email and chat replies.
   - **✂️ Instant 0ms Mode**: 100% offline surgical excision of em-dashes, nominalizations, throat-clearing, and tricolons with zero delay.
3. **In-Page Floating HUD (Shadow DOM Protected)**:
   - Displays the humanized rewrite directly beside your selection.
   - Zero styling interference with host websites (encapsulated in Shadow DOM).
   - Shows **Human Fidelity Score** (e.g. `98/100`), **Syntactic Burstiness**, and **AI Tells Pruned**.
   - **Visual Diff View (`🔍 Visual Diff`)**: Toggle on to see exact strikethroughs of deleted AI filler vs preserved substance.
   - **1-Click In-Place Replacement**: Replaces selected text directly in Gmail, Notion, Slack, Google Docs, or textareas.
   - **On-the-Fly Voice Switcher**: Switch author voices directly in the HUD without re-selecting text.
4. **Custom Voice Studio Sync**:
   - Import custom voices created in the Desynth web app with **📥 Import JSON Voices**.
5. **Keyboard Shortcut (`Alt + H`)**:
   - Highlight any text and press `Alt + H` to immediately Desynth without touching your mouse.
6. **Flexible Backend Engine**:
   - **Instant Deterministic**: 0ms latency, 100% offline.
   - **Local Ollama**: Connects to `http://localhost:11434` with `llama3.2`, `qwen2.5:14b`, `mistral`, etc.
   - **Google Gemini API**: Blazing fast `gemini-2.0-flash`.
   - **OpenAI / Groq API**: `gpt-4o-mini`, `llama-3.3-70b-versatile`.

---

## 📦 How to Install in Chrome / Edge / Brave (10 Seconds)

1. Open **Google Chrome** (or Edge / Brave).
2. Navigate to: `chrome://extensions/`
3. Toggle on **Developer mode** (top-right corner).
4. Click **Load unpacked** (top-left corner).
5. Select the `extension/` folder inside this repository:
   ```text
   desynth/extension
   ```
6. Pin **Desynth** to your browser toolbar for quick access!

---

## 🛠️ Usage

### Workflow 1: Right-Click on Any Webpage
1. Highlight any AI-written text.
2. Right-click $\rightarrow$ **Desynth: Humanize Selection** $\rightarrow$ choose a voice.
3. Review the prose in the HUD and click **Replace** or **Copy**.

### Workflow 2: Keyboard Shortcut
1. Highlight text anywhere.
2. Press `Alt + H`.
3. The floating Desynth HUD appears immediately with the humanized result.

### Workflow 3: Toolbar Scratchpad
1. Click the ⚡ icon in your browser toolbar.
2. Paste text into the scratchpad.
3. Select your desired voice and click **⚡ Humanize**.
