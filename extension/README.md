# 🚫 Stop-Slop Chrome Extension

> **Transform AI-generated slop into authentic, rhythmic human prose anywhere on the web.**
> Select any text $\rightarrow$ Right-Click $\rightarrow$ **Humanize with Stop-Slop** (or press `Alt + H`).

---

## ⚡ Key Features

1. **Right-Click Context Menu**:
   - Highlight text in Gmail, Google Docs, Notion, Slack, Reddit, Twitter, Word Online, or any article.
   - Right-click and choose **"Stop-Slop: Humanize Selection"**.
   - Submenus allow picking specific authentic author voices:
     - 🖋️ **Plain English & Anti-Jargon (George Orwell)**
     - 🛠️ **Systems Engineer (Runtime Trade-offs & Operational Reality)**
     - 🎓 **Academic Empirical (Methodological Rigor)**
     - 📜 **Bertrand Russell (Analytical Clarity & Deductive Logic)**
     - ✂️ **Instant 0ms Surgical Clean (100% Offline, Zero LLM)**
2. **In-Page Floating HUD (Shadow DOM Protected)**:
   - Floating card displays the humanized prose directly beside your selection.
   - Zero styling interference with host websites (encapsulated in Shadow DOM).
   - Shows **Human Fidelity Score** (e.g. 98/100) and **AI Tells Pruned**.
   - **Replace Selection**: If you are inside a text box or editable document (`textarea`, `input`, or rich-text editor like Gmail or Notion), one click replaces the selected text with the humanized rewrite.
   - **Copy to Clipboard**: Quick 1-click copy with instant feedback.
3. **Keyboard Shortcut (`Alt + H`)**:
   - Highlight any text and press `Alt + H` to instantly humanize without touching your mouse.
4. **Flexible Engine Support**:
   - **Instant Deterministic Surgery**: 0ms latency, 100% offline, zero keys needed.
   - **Local Ollama**: Connects to `http://localhost:11434` with `llama3.2`, `qwen2.5:14b`, `mistral`, etc.
   - **Google Gemini API**: Blazing fast `gemini-2.0-flash`.
   - **OpenAI / Groq API**: `gpt-4o-mini`, `llama-3.3-70b-versatile`.
5. **Toolbar Scratchpad**:
   - Click the Stop-Slop extension icon in the toolbar for a quick scratchpad and engine configuration.

---

## 📦 How to Install in Chrome / Edge / Brave (10 Seconds)

1. Open **Google Chrome** (or Edge / Brave).
2. Navigate to: `chrome://extensions/`
3. Toggle on **Developer mode** (top-right corner).
4. Click **Load unpacked** (top-left corner).
5. Select the `extension/` folder inside this repository:
   ```
   stop-slop/extension
   ```
6. That's it! Pin **Stop-Slop** to your browser toolbar for quick access.

---

## 🛠️ Usage

### Workflow 1: Right-Click on Any Webpage
1. Highlight any AI-written text.
2. Right-click $\rightarrow$ **Stop-Slop: Humanize Selection** $\rightarrow$ choose a voice.
3. Review the humanized prose and click **Replace Selection** or **Copy Text**.

### Workflow 2: Keyboard Shortcut
1. Highlight text anywhere.
2. Press `Alt + H`.
3. The floating Stop-Slop card appears immediately with the humanized result.

### Workflow 3: Toolbar Scratchpad
1. Click the 🚫 icon in your browser toolbar.
2. Paste text into the scratchpad.
3. Select your desired voice and click **⚡ Humanize**.
