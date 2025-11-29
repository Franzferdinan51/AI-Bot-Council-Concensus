# 🏛️ AI Council Chamber

> A multi-agent legislative system where AI personas debate, deliberate, and govern.

The **AI Council Chamber** is a sophisticated React application that simulates a high-level government council composed of diverse Artificial Intelligence entities. Unlike a standard chat interface, this application structures interactions into parliamentary procedures, featuring a Speaker, varied Councilors (personas), and specialized phases for debate, voting, and enactment.

## 🌟 Key Features

### 🧠 Multi-Agent Core
- **Dynamic Personas**: Includes default archetypes like *The Technocrat*, *The Ethicist*, *The Pragmatist*, and *The Theorist*.
- **New Specialized Roles**:
    - **The Historian**: Provides precedent, context, and warnings from the past.
    - **The Diplomat**: Focuses on soft power, compromise, and international relations.
    - **The Skeptic**: Identifying structural flaws, risks, and "devil's advocate" arguments.
    - **The Sentinel**: Specializes in security, defense, and threat assessment.
- **The Speaker**: A "Thinking" model (Gemini 3 Pro) that presides over sessions, synthesizes arguments, and issues binding rulings.
- **The Moderator**: Enforces topic discipline and guides the flow of debate.

### 📜 Session Modes
1.  **Legislative Proposal**: The standard flow. A motion is proposed, debated in rounds (with dynamic challenges), voted upon, and enacted into a decree.
2.  **Deliberation**: A roundtable discussion focused on exploring nuances rather than binary voting.
3.  **Inquiry**: A rapid Q&A mode where the user asks questions and the Council provides specific answers synthesized by the Speaker.
4.  **Deep Research (Agentic)**: A recursive, multi-stage investigation mode where agents perform breadth and depth searches to compile a comprehensive dossier.
5.  **Swarm Hive**: A dynamic task-decomposition mode where the Speaker spawns ephemeral "Drone Agents" to handle sub-tasks in parallel.

### 🛠️ Advanced Tooling
- **Direct Consultation (Private Counsel)**: Click on any Councilor to enter a private, off-the-record chat to discuss strategy or get advice without the rest of the Council hearing.
- **Google Search Grounding**: Agents actively verify claims and research topics using real-time web data.
- **YouTube Analysis**: Attach YouTube links, and the agents will search for transcripts/summaries to discuss the video content intelligently.
- **Live Audio Audience**: Engage in a real-time, low-latency voice conversation with the Council via the Gemini Live API.
- **Broadcast Mode (TTS)**: The Council speaks back using distinct neural voices for each persona.

### ⚙️ Technical Capabilities
- **Multi-Provider Support**: Configure endpoints for **Google Gemini**, **OpenRouter**, **LM Studio** (Local), **Ollama**, and **Jan AI**.
- **Context Pruning**: Smart history management to reduce token costs while preserving the core topic.
- **Parallel Processing**: Batch execution of Councilor turns to speed up debates in Research and Inquiry modes.
- **Responsive Design**: Fully functional on Desktop, Tablet, and Mobile devices.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A Google Gemini API Key (recommended for full features)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/ai-council-chamber.git
    cd ai-council-chamber
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables**
    Create a `.env` file in the root:
    ```env
    API_KEY=your_google_gemini_api_key
    ```
    *Note: You can also enter API keys directly in the application Settings panel.*

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

### 🔧 Troubleshooting

*   **API Key Errors**: Ensure your API key is correctly set in the `.env` file or the Settings panel. If using Google Gemini, make sure the key has access to the required models (e.g., `gemini-2.0-flash-exp`).
*   **Vite Build Issues**: If you encounter errors during build, try deleting the `node_modules` folder and `package-lock.json`, then run `npm install` again.
*   **Audio Issues**: For Live Audio Audience, ensure your browser has permission to access the microphone.

## 📖 Usage Guide

### The Interface
*   **Councilor Deck**: The top bar displays active agents. A green pulse indicates who is currently "thinking". Click a Councilor to open **Direct Consultation**.
*   **Legislative Record**: The sidebar on the right (desktop) or toggle (mobile) shows the history of passed/failed motions.
*   **Input Bar**:
    *   **Tabs**: Switch between Proposal, Deliberation, Inquiry, Research, and Swarm modes.
    *   **Microphone**: Dictate your proposal.
    *   **Attachment**: Upload images/videos or paste URLs for analysis.

### Usage Examples

*   **Legislative Proposal**: "Propose a motion to implement a 4-day work week for all government employees."
*   **Deliberation**: "Discuss the ethical implications of using AI in judicial sentencing."
*   **Inquiry**: "What are the economic impacts of universal basic income?"
*   **Deep Research**: "Compile a comprehensive report on the history of renewable energy adoption in Scandinavia."
*   **Swarm Hive**: "Plan a marketing campaign for a new eco-friendly product."

### Settings Panel
Access the settings via the gear icon to:
*   **Edit Council**: Add/Remove bots, change personas, or switch underlying models (e.g., make The Technocrat run on Llama 3 via OpenRouter).
*   **Audio**: Enable Text-to-Speech and adjust playback speed.
*   **Cost**: Toggle context pruning or parallel processing.
*   **Knowledge**: Manage "Long Term Memory" (Precedents) and upload context documents for RAG.

## 🏗️ Architecture

*   **Frontend**: React 18, Tailwind CSS, Vite.
*   **AI SDK**: `@google/genai` for Gemini interactions.
*   **State Management**: React Hooks (local state) with complex asynchronous flows for debate orchestration.
*   **Streaming**: Token-by-token streaming for responsive UI.

### 📂 Project Structure

```
ai-council-chamber/
├── src/
│   ├── components/       # UI Components
│   │   ├── CouncilorDeck.tsx  # Top bar with agent avatars
│   │   ├── ChatWindow.tsx     # Main debate display
│   │   ├── SettingsPanel.tsx  # Configuration interface
│   │   └── ...
│   ├── services/         # Logic Layers
│   │   ├── aiService.ts       # LLM provider integration
│   │   └── knowledgeService.ts # RAG and memory management
│   ├── App.tsx           # Main entry point and state orchestration
│   └── ...
├── public/               # Static assets
└── ...
```

## 🤝 Contributing

Contributions are welcome! Please submit a Pull Request or open an Issue to discuss new features (e.g., new Session Modes, MCP Tool integrations).

## 🔮 Future Roadmap

*   **More LLM Providers**: Integration with Anthropic Claude and OpenAI GPT models.
*   **Persistent Storage**: Database integration (PostgreSQL/Supabase) for saving session history and councilor memory across reloads.
*   **Custom Personas**: A UI builder for creating and saving custom councilor personas with unique system prompts.
*   **Multi-User Mode**: Allow multiple human users to participate in the council sessions.

## 📄 License

MIT License
