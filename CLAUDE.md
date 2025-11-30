# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**High AI Council Chamber** is a multi-agent legislative simulator that transforms solitary AI interaction into a parliamentary debate process. Multiple AI personas (councilors) with conflicting priorities debate topics, stress-test ideas, and produce collective decisions through voting and consensus-building.

## Tech Stack

- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS (dark theme with amber accents)
- **AI Providers:** Google Gemini (primary), OpenRouter, LM Studio, Ollama, Jan AI, Z.ai, Moonshot, Minimax
- **Visualization:** Recharts (for vote data and predictions)
- **Audio:** Web Speech API + Gemini Text-to-Speech

## Common Commands

```bash
# Development
npm run dev              # Start dev server on port 3000
npm run build            # Build for production
npm run preview          # Preview production build

# Environment Setup
# Create .env file with:
GEMINI_API_KEY=your_api_key_here
```

## Project Structure

```
/
├── App.tsx                    # Main orchestrator - handles all session modes, state management
├── constants.ts               # Default settings, bot personas, session prompts
├── types.ts                   # TypeScript type definitions
├── index.tsx                  # React entry point
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
├── services/
│   ├── aiService.ts          # AI provider integration (all APIs, streaming, TTS)
│   └── knowledgeService.ts   # Memory/document search
└── components/
    ├── ChatWindow.tsx        # Main chat interface
    ├── ChatMessage.tsx       # Individual message component with code/visualization rendering
    ├── SettingsPanel.tsx     # Configuration UI for bots, providers, modes
    ├── LiveSession.tsx       # Audio session component
    └── CodingInterface.tsx   # IDE-style UI for Swarm Coding mode
```

## Core Architecture

### Session Orchestration (App.tsx:247-548)

The `runCouncilSession` function is the central coordinator that handles 7 distinct session modes:

1. **PROPOSAL** (default) - Legislative flow: Opening → Debate → Voting → Enactment
2. **DELIBERATION** - Roundtable discussion without voting
3. **INQUIRY** - Q&A mode with synthesis
4. **RESEARCH** - Multi-phase deep research with gap analysis
5. **SWARM** - Dynamic task decomposition with parallel agents
6. **SWARM_CODING** - Software development workflow (Architect → Dev Swarm → Integration)
7. **PREDICTION** - Superforecasting with probabilistic analysis

Each mode has specialized prompt templates in `constants.ts:COUNCIL_SYSTEM_INSTRUCTION`.

### Councilor System (constants.ts:86-267)

Pre-configured personas include:
- **Speaker** (Gemini 3 Pro) - Objective judge, synthesizes arguments
- **Moderator** - Ensures balanced debate, breaks loops
- **Councilors** - Technocrat, Ethicist, Pragmatist, Visionary, Sentinel, Historian, Diplomat, Skeptic, etc.
- **Specialists** - Subject matter experts (Legal, Finance, Medical, etc.)

Each persona has:
- Unique `persona` prompt defining perspective and priorities
- `color` gradient for UI identification
- `authorType` (which AI provider to use)
- `model` specification
- `enabled` status

### State Management

Complex local state in App.tsx manages:
- `messages[]` - Conversation history
- `sessionStatus` - OPENING, DEBATING, VOTING, etc.
- `thinkingBotIds[]` - Tracks bots currently "thinking"
- `activeSessionBots[]` - Subset of enabled bots participating
- `controlSignal` - Stop/pause controls
- `privateMessages` - 1-on-1 consultation channels

### AI Provider Integration (services/aiService.ts)

Multi-provider abstraction supporting:
- **Google Gemini** - Primary provider with streaming support
- **OpenRouter** - Access to multiple models (Claude, GPT-4, Llama, etc.)
- **LM Studio** - Local model hosting
- **Ollama** - Local model hosting
- Generic **OpenAI-compatible** APIs

Key functions:
- `getBotResponse()` - Single request
- `streamBotResponse()` - Real-time token streaming
- `generateSpeech()` - Gemini TTS integration

### Voting & Consensus System (App.tsx:162-227)

XML-formatted votes parsed into structured data:
```typescript
interface VoteData {
  yeas: number;
  nays: number;
  result: 'PASSED' | 'REJECTED' | 'RECONCILIATION NEEDED';
  consensusScore: number;  // 0-100
  consensusLabel: string;  // "Unanimous", "Strong", "Divided", "Contentious"
  votes: Array<{
    voter: string;
    choice: 'YEA' | 'NAY';
    confidence: number;
    reason: string;
  }>;
}
```

### Prediction Mode (App.tsx:230-245)

Parses structured predictions:
```typescript
interface PredictionData {
  outcome: string;
  confidence: number;  // 0-100
  timeline: string;
  reasoning: string;
}
```

### Memory System (services/knowledgeService.ts)

Two-tier knowledge:
- **Global Memory** - Persisted precedents (localStorage)
- **RAG Documents** - Uploaded knowledge base with semantic search

### Cost Management (constants.ts:427-433)

Features to control API costs:
- `economyMode` - Use lighter models
- `maxConcurrentRequests` - Prevent 429 errors
- `contextPruning` - Truncate history
- `maxContextTurns` - Limit conversation length

## Key Implementation Details

### Debate Flow Control (App.tsx:464-518)

Sequential turn-taking with:
- Challenge protocol - `[CHALLENGE: Member Name]` to force rebuttals
- `[PASS]` to yield floor
- Loop detection - moderator interjects after 3 consecutive rebuttals
- Randomization to prevent domination

### Economy Mode Simulation (App.tsx:431-461)

Instead of individual API calls, Speaker simulates entire debate in one response, parsing transcript to generate individual message objects. Significantly reduces costs.

### Audio System (App.tsx:52-87)

Dual TTS support:
- **Browser Speech API** - Universal, free, multiple voices
- **Gemini TTS** - Higher quality, distinct neural voices per persona

### Private Consultation (App.tsx:574-598)

Slides in panel for 1-on-1 with councilors, bypassing normal debate flow. Uses `PRIVATE_WHISPER` prompt template.

### Code Artifact Rendering (components/ChatMessage.tsx:28+)

Parses markdown code blocks and renders:
- Syntax highlighting
- File preview for HTML
- Copy/download functionality
- Visual preview for HTML/JS

### Settings Persistence

Settings stored in localStorage with cost warning acknowledgment (`ai_council_cost_ack`).

## Important Constants

- **DEFAULT_SETTINGS** (constants.ts:434-484) - Complete configuration schema
- **COUNCIL_SYSTEM_INSTRUCTION** (constants.ts:519+) - Prompt templates for each mode
- **DEFAULT_BOTS** (constants.ts:86-267) - Pre-configured councilor personas
- **OPENROUTER_MODELS** (constants.ts:5-13) - Available models
- **VOICE_MAP** (constants.ts:15-35) - TTS voice assignment per role
- **PUBLIC_MCP_REGISTRY** (constants.ts:38-158) - Available tools (web_search, wikipedia, weather, etc.)

## Development Notes

- Empty files exist (constants.ts, types.ts, components/*.tsx) - actual content is in temp files from git operations
- No testing setup configured
- Uses Tailwind CSS (no separate CSS files)
- Responsive design with `100dvh` for mobile/PWA
- Environment variables: `GEMINI_API_KEY` loaded via Vite's loadEnv
- Type definitions are comprehensive - reference types.ts when modifying interfaces

## Common Tasks

### Adding a New Councilor

1. Add to `DEFAULT_BOTS` array in constants.ts
2. Define persona prompt with perspective and priorities
3. Assign color gradient
4. Set role (speaker/councilor/specialist/moderator)

### Adding a New Session Mode

1. Add to `SessionMode` enum in types.ts
2. Create prompt templates in `COUNCIL_SYSTEM_INSTRUCTION` object
3. Add handler in `runCouncilSession` (App.tsx:247-548)
4. Implement any special parsing (votes, predictions, etc.)

### Adding a New AI Provider

1. Add to `AuthorType` enum in types.ts
2. Update `ProviderSettings` interface in types.ts
3. Implement provider logic in aiService.ts
4. Add endpoint/API key fields to DEFAULT_SETTINGS
5. Update SettingsPanel.tsx UI

### Modifying Debate Behavior

Key areas:
- `processBotTurn()` (App.tsx:138-159) - Individual turn processing
- `runBatchWithConcurrency()` (App.tsx:126-136) - Parallel execution
- Debate queue logic (App.tsx:464-518) - Turn order and challenge protocol

## Dependencies

- **react@19.1.1** - UI framework
- **@google/genai@1.20.0** - Google AI SDK
- **recharts@2.13.0** - Data visualization
- **@vitejs/plugin-react@5.0.0** - Vite React integration
- **typescript@5.8.2** - Type safety
- **@types/node@22.14.0** - Node.js types

## Security & Privacy

- API keys stored locally (localStorage)
- No backend - all API calls client-side
- No authentication - open access to configured API keys
- Cost warning shown on first visit

## PWA Features

- Mobile-first responsive design
- Safe area insets support (iOS notch)
- Request frame permissions for microphone/camera (metadata.json)
- Can be installed as PWA