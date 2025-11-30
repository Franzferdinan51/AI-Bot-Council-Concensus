# 🏛️ AI Council Chamber

**The Definitive Multi-Agent Governance & Deliberation Engine**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Gemini-blue)](https://ai.google.dev/)

The **AI Council Chamber** is a sophisticated, multi-agent legislative simulator designed to analyze complex problems through the lens of diverse, competing personas. It transforms solitary AI interaction into a parliamentary process, ensuring that every idea is debated, stress-tested, and refined before a conclusion is reached.

---

## 🌟 Why This Exists

Standard AI interfaces (like ChatGPT or standard Gemini) often suffer from **"Yes-Man Syndrome"**—they agree with the user's premise to be helpful. This is dangerous for decision-making.

The **AI Council Chamber** solves this by enforcing **Adversarial Collaboration**. By simulating a room full of experts with conflicting priorities (e.g., An Ethicist vs. A Technocrat vs. A Skeptic), the system forces the AI to check its own biases, uncover blind spots, and produce a significantly more balanced and robust output.

### Core Philosophy: **"Conflict Creates Clarity"**

---

## 🚀 Key Capabilities

### 1. Multi-Modal Deliberation Engines
The Council operates in distinct modes tailored to your specific needs:

*   **⚖️ Legislative Proposal (Default)**: The standard parliamentary flow. You propose a motion, the Council debates it in rounds, challenges each other, votes, and the Speaker enacts a binding decree. Best for decision-making.
*   **🧠 Deep Research (Agentic)**: A recursive investigation mode. The Speaker breaks a topic into vectors, assigns agents to perform breadth and depth searches using Google Search, identifies gaps, and compiles a comprehensive dossier. Best for learning.
*   **🐝 Swarm Hive**: Inspired by OpenAI's *Swarm*. A dynamic task-decomposition engine. The Speaker spawns ephemeral "Drone Agents" to execute massive parallel tasks.
*   **💻 Swarm Coding**: A dedicated software engineering workflow where the Council transforms into a Dev Team (Architect, Backend, Frontend, SecOps) to write production-ready code with live artifact previews. Includes a dedicated **IDE-Style UI**.
*   **🗣️ Inquiry**: A rapid-fire Q&A mode where the user asks questions and the Council provides specific answers synthesized by the Speaker.
*   **🛡️ Deliberation**: A roundtable discussion focused on exploring nuances rather than binary voting.
*   **🔮 Prediction**: A Superforecasting mode where the Council analyzes base rates, historical precedents, and variables to produce a probabilistic forecast (0-100%) for future events.

### 2. The Councilors (Personas)
The system comes pre-loaded with archetypes designed to cover the full spectrum of human thought:
*   **The Speaker (Gemini 3 Pro)**: The objective judge. Synthesizes arguments and issues rulings.
*   **The Technocrat**: Values efficiency and raw data above all.
*   **The Ethicist**: Prioritizes morality and human well-being.
*   **The Pragmatist**: Focuses on cost, feasibility, and immediate implementation.
*   **The Skeptic**: The Devil's Advocate. Looks for flaws and risks.
*   **The Historian**: Cites precedents and past human errors.
*   **The Diplomat**: Values compromise and soft power.
*   **The Sentinel**: Focuses on security and defense.
*   ...and many more (Journalist, Psychologist, Conspiracist).

### 3. Advanced Tooling & Integration
*   **Google Search Grounding**: Agents actively verify claims in real-time.
*   **YouTube Analysis**: Paste a video URL, and agents will find transcripts/summaries to debate the content.
*   **Direct Consultation**: Click any Councilor to open a private, off-the-record side channel.
*   **Live Audio Audience**: Speak directly to the Council using Gemini's native low-latency audio API.
*   **Broadcast Mode**: The Council speaks back using distinct neural voices for each persona.
*   **MCP Support**: Integrate external tools via the Model Context Protocol (Weather, Wikipedia, etc.).

---

## ⚙️ Setup & Configuration

### Prerequisites
1.  **Node.js** (v18 or higher)
2.  **Google Gemini API Key** (Get one at [aistudio.google.com](https://aistudio.google.com))

### Installation
1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/ai-council-chamber.git
    cd ai-council-chamber
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

### Connecting Local Models (LM Studio / Ollama)
You can save costs or ensure privacy by running Councilors on local hardware.
1.  Open **Settings** > **API Configuration**.
2.  Enter your Local Endpoint (e.g., `http://localhost:1234/v1/chat/completions` for LM Studio).
3.  Go to **Council Composition**, edit a member (e.g., The Technocrat), and change their Provider to **LM Studio**.

---

## 💡 Use Cases

### For Developers
*   **Architecture Review**: Use *Swarm Coding* mode. Ask the Council to "Critique this system design." The Sentinel will find security flaws, The Technocrat will find bottlenecks, and The Pragmatist will complain about maintenance costs.
*   **Code Generation**: Enable **Pro Coding UI** in settings. Ask the Council to build a full-stack app. Watch as the Architect assigns files to the swarm and they are generated in real-time.

### For Writers & Worldbuilders
*   **Scenario Simulation**: "What happens if humanity discovers FTL travel tomorrow?" Watch the Historian, Diplomat, and Sentinel debate the geopolitical fallout.
*   **Character Workshop**: Use *Direct Consultation* to interview specific personas to flesh out character voices.

### For Business Leaders
*   **Strategic Planning**: Propose a new business strategy. The Council will stress-test it against market forces (The Economist), ethical risks (The Ethicist), and execution realities (The Pragmatist).

---

## 🛠️ Architecture

The application is built on a modern React stack designed for performance and modularity.

*   **Frontend**: React 19, TypeScript, Tailwind CSS.
*   **AI Orchestration**: Custom `aiService` layer that handles prompt injection, context pruning, and multi-provider routing.
*   **State Management**: Complex local state orchestration to handle the asynchronous "Turn-Taking" of the debate cycle.
*   **Streaming**: Real-time token streaming for a responsive, "alive" feel.
*   **Mobile First**: Fully responsive layout using dynamic viewport units (`100dvh`) to function as a PWA.

---

## 🤝 Contributing

We welcome contributions!
*   **New Personas**: Submit a PR adding new archetypes to `constants.ts`.
*   **MCP Tools**: Add new schemas to the Public Registry.
*   **UI Enhancements**: Help us make the chamber even more immersive.

---

## 📄 License
MIT License. Free to use, modify, and govern.