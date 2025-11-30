# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# High AI Council Chamber

A sophisticated multi-agent legislative simulator that transforms AI interaction from a single "Yes-Man" conversation into a parliamentary debate between diverse AI personas. The application enforces **Adversarial Collaboration** where competing perspectives stress-test ideas before reaching a resolution.

## Quick Start Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Windows users can also use the startup script
startup.bat
```

## Architecture Overview

### Core Structure
- **App.tsx (681 lines)** - Central orchestration layer managing session state, flow control, and multi-bot coordination
- **7 Session Modes** - Different deliberation engines (PROPOSAL, DELIBERATION, INQUIRY, RESEARCH, SWARM, SWARM_CODING, PREDICTION)
- **Services Layer** - AI provider orchestration (`services/aiService.ts`) and memory management (`services/knowledgeService.ts`)
- **Components** - React components with Tailwind CSS for rich UI interactions
- **Type System** - Comprehensive type definitions in `types.ts` (currently minimal due to git state)

### Key Dependencies
- **React 19.1.1** + React-DOM 19.1.1
- **@google/genai** - Primary Gemini integration
- **recharts 2.13.0** - Voting/prediction visualizations
- **Vite 6.2.0** - Build system and dev server

## Session Modes (App.tsx:247-548)

### 1. PROPOSAL (Default Legislative Flow)
- **Flow**: Speaker Opening → Councilor Debate → Challenge/Response Cycles → Voting → Final Decree
- **Economy Mode**: Simulates entire council in single AI call (cost optimization)
- **Challenge System**: `[CHALLENGE: Member Name]` forces specific responses
- **Moderator**: Breaks repetitive argument loops after 3 rebuttals

### 2. PREDICTION (Superforecasting)
- Flow: Speaker Opening → Councilor Analysis → Final Prediction
- Output: `<outcome>`, `<confidence>`, `<timeline>`, `<reasoning>` XML
- Use Case: Forecasting future events with probability analysis

### 3. SWARM_CODING (Dev Team Workflow)
- Flow: Architect Plans → Dev Swarm (parallel execution) → Integration
- File Generation: Parses `<file name="..." assignee="..." description="..."/>` tags
- Specialized UI mode available (`settings.ui.proCodingUI`)
- Use Case: Full-stack application generation

### 4. SWARM (Task Decomposition)
- Flow: Speaker Decomposition → Parallel Agent Execution → Aggregation
- Dynamic Agents: Creates ephemeral `swarm_agent` bots at runtime
- Use Case: Complex problem-solving with parallel research

### 5. RESEARCH (Agentic Investigation)
- Flow: Planning → Round 1 (breadth) → Gap Analysis → Round 2 (depth) → Final Dossier
- Use Case: Comprehensive research reports with knowledge gap identification

### 6. INQUIRY (Q&A Mode)
- Flow: Speaker Opening → Councilor Input → Synthesized Answer
- Use Case: Quick answers with diverse perspectives

### 7. DELIBERATION (Roundtable)
- Flow: Speaker Opening → Discussion → Summary
- No voting, focuses on exploration over decision

## AI Council System

### Default Personas (24 archetypes)
Located in `constants.ts` (currently empty - from git history):
- **Speaker** - Gemini 3 Pro, synthesizes and issues rulings
- **Moderator** - Manages debate flow
- **Councilors**: Technocrat, Ethicist, Pragmatist, Visionary, Skeptic, Historian, Diplomat, Sentinel, Journalist, Psychologist, Conspiracist, Propagandist
- **Political Spectrum**: Libertarian, Progressive, Conservative, Independent
- **Specialists**: Code, Legal, Science, Finance, Military, Medical

Each persona has:
- `persona` prompt defining behavior
- `color` gradient for UI
- `authorType` (AI provider)
- `role` (speaker/councilor/specialist/swarm_agent)

### Provider Types (AuthorType enum)
- **GEMINI** - Google Gemini (primary, via @google/genai)
- **OPENROUTER** - Access to Claude, Llama, Mistral, GPT-4o-mini
- **LM_STUDIO** - Local models
- **OLLAMA** - Local models
- **JAN_AI** - Local models
- **Z_AI, MOONSHOT, MINIMAX** - Additional providers

### Economy Mode (App.tsx:431-461)
- Single AI call simulates all councilors
- Parses `**[Member Name]:** Turn text` to reconstruct debate
- 60-80% cost reduction

## Voting & Consensus System (App.tsx:162-227)

### Vote Parsing
- XML format: `<vote>YEA/NAY</vote>`, `<confidence>1-10</confidence>`, `<reason>...</reason>`
- Regex patterns: Lines 169-200 extract votes from responses

### Consensus Scoring Formula
```typescript
consensusScore = ((margin/total * 0.7) + (avgConfidence/10 * 0.3)) * 100
```

### Consensus Labels
- **Unanimous**: >85
- **Strong Consensus**: >65
- **Contentious**: >40
- **Divided**: <40 (triggers "RECONCILIATION NEEDED" if >2 voters)

## State Management (App.tsx:12-36)

### Core State Variables
- `messages[]` - Chat history with voting/prediction data
- `sessionStatus` - 9 states: IDLE, OPENING, DEBATING, VOTING, RESOLVING, ADJOURNED, PAUSED, RECONCILING
- `thinkingBotIds[]` - "Thinking" animation triggers
- `activeSessionBots[]` - Current session participants
- `debateHeat` (-1 to 1) - Agreement/disagreement meter

### Control Signals (App.tsx:37)
```typescript
{ stop: boolean, pause: boolean }
```
Used for session control with async check points

### Persistence
- `localStorage` - Cost acknowledgment (`ai_council_cost_ack`)
- Memory system - Saves enacted resolutions as precedents (via `saveMemory`)

## Services Layer

### aiService.ts
**Currently empty** (1 line) - from git history, handles:
- Multi-provider AI routing
- Token streaming
- Context pruning
- MCP tool execution
- Audio generation (TTS/transcription)

### knowledgeService.ts
**Currently empty** (1 line) - from git history, handles:
- Global precedent memory (RAG via localStorage)
- Bot-specific memory
- Document search with relevancy scoring

## UI Components

### ChatMessage.tsx (382 lines)
Rich message rendering with:
- **Code artifacts** - HTML preview in iframe
- **Voting visualizations** - Recharts radial bars, vote tallies
- **Prediction dashboards** - Confidence gauges, probability displays
- **Thinking toggles** - Collapsible chain-of-thought blocks
- **Source verification** - Expandable sections

### ChatWindow.tsx
Main chat interface with:
- Message list
- Councilor deck display
- Session mode selector
- Control buttons (pause/stop/clear)

### SettingsPanel.tsx
Configuration interface:
- Bot management (enable/disable, edit personas)
- Provider API keys
- Audio settings (TTS, speech rate)
- Cost controls (economy mode, concurrency)

### CodingInterface.tsx
IDE-style UI for SWARM_CODING mode:
- File tree navigation
- Live code artifacts
- Dev team assignment display

### LiveSession.tsx
Audio mode interface:
- Real-time microphone input
- Audio playback via Gemini TTS or Web Speech API

### CouncilorDeck.tsx
Visual representation of active councilors with:
- Persona cards
- Thinking indicators
- Click-to-consult functionality

## Build System (vite.config.ts)

### Configuration
- Port: 3000, Host: 0.0.0.0
- React plugin enabled
- Path alias: `@/*` → `./`
- Env var injection: `GEMINI_API_KEY`

### TypeScript (tsconfig.json)
- ES2022 target, ESNext modules
- React JSX support
- Path mapping configured

## Key Features

### Real-Time Experience
- **Token streaming** from AI responses (via `streamBotResponse`)
- **Thinking animations** (thinkingBotIds state)
- **Live audio** (Web Speech API + Gemini TTS)
- **Session controls** (stop/pause/reset)

### Cost Management
- **Context pruning** - Keeps last N turns
- **Economy mode** - Simulated debates
- **Concurrency limiting** - `maxConcurrentRequests` setting
- **Local providers** - LM Studio, Ollama support

### Rich Interactions
- **Private consultations** - 1-on-1 councilor sidebar chats (App.tsx:574-598)
- **Challenge system** - Forces specific responses
- **Moderator intervention** - Breaks argument loops
- **Code artifact preview** - HTML in iframe
- **Voting visualizations** - Radial charts, bar charts
- **Prediction confidence** - Gauge displays

## Important Implementation Details

### Batch Concurrency (App.tsx:126-136)
```typescript
runBatchWithConcurrency(items, fn, maxConcurrency)
```
Controls parallel AI calls to avoid rate limits

### Message Processing (App.tsx:89-103)
- Extracts `<thinking>` tags for collapsible display
- Calculates debate heat from agreement/disagreement keywords
- Auto-saves enacted resolutions to memory

### Vote Parsing Logic (App.tsx:169-200)
Supports two formats:
1. Individual member blocks: `MEMBER: [Name] <vote>[YEA/NAY]</vote> <confidence>[1-10]</confidence> <reason>[text]</reason>`
2. Single vote block: `<vote>`, `<confidence>`, `<reason>` at top level

### Prediction XML Format (App.tsx:229-245)
Required fields:
- `<outcome>[result]</outcome>`
- `<confidence>[0-100]</confidence>`
Optional:
- `<timeline>[when]</timeline>`
- `<reasoning>[explanation]</reasoning>`

### Session Status Flow
```
IDLE → OPENING → DEBATING → VOTING → RESOLVING → ADJOURNED
                      ↓
                  PAUSED
                      ↓
                 RECONCILING
```

## Development Tips

### Adding New Personas
Edit `DEFAULT_BOTS` in `constants.ts` (currently empty):
```typescript
{
  id: 'unique-id',
  name: 'Display Name',
  role: 'councilor', // or 'speaker', 'moderator', 'specialist'
  authorType: AuthorType.GEMINI,
  model: 'gemini-2.5-flash',
  persona: 'Behavior prompt...',
  color: 'from-blue-500 to-purple-600',
  enabled: true
}
```

### Adding New Session Modes
1. Add to `SessionMode` enum in `types.ts`
2. Add to `runCouncilSession` switch statement in `App.tsx` (line ~247)
3. Add mode-specific prompts to `COUNCIL_SYSTEM_INSTRUCTION` in `constants.ts`

### Cost Optimization
- Enable `settings.cost.economyMode` for simulated debates
- Use local providers (LM Studio/Ollama) for testing
- Set `settings.cost.maxConcurrentRequests` to 1-2 for rate limit compliance
- Enable context pruning in aiService.ts

### Debugging
- Enable thinking blocks: Models output `<thinking>...</thinking>` which UI collapses
- Check control signals: `controlSignal.current` for stop/pause state
- Monitor batch concurrency: `runBatchWithConcurrency` controls parallel execution
- Vote parsing: Regex patterns in lines 169-200 of App.tsx

## Environment Variables

- `GEMINI_API_KEY` - Google Gemini API key (get at aistudio.google.com)
- Can also configure via Settings panel

## Common Tasks

### Test a Single Session Mode
```typescript
// In App.tsx, modify line 29:
const [sessionMode, setSessionMode] = useState<SessionMode>(SessionMode.PREDICTION);
```

### Add a New AI Provider
1. Add to `AuthorType` enum in `types.ts`
2. Implement provider logic in `services/aiService.ts`
3. Add to `getBotResponse` and `streamBotResponse` functions

### Customize Voting Thresholds
Modify `consensusScore` calculation in App.tsx:208
- Current: `(margin/total * 0.7) + (avgConfidence/10 * 0.3)`
- Adjust weightings for margin vs confidence

## Current Status

### Empty/Missing Files (Git State)
- `types.ts`, `constants.ts` - Minimal content (1 line each)
- `services/aiService.ts`, `services/knowledgeService.ts` - Empty
- All component files - Empty (0-1 lines)

The application is in a git state where core files were deleted and recreated as untracked. The main `App.tsx` contains the full implementation, suggesting other files need to be restored from git history.

### Next Steps
1. Restore missing files from git history
2. Verify type definitions match App.tsx usage
3. Implement service layer methods
4. Complete component implementations
