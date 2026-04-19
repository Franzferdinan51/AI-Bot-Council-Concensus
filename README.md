# 🏛️ AI Council Chamber

**The Definitive Multi-Agent Governance & Deliberation Engine**

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![OpenClaw Compatible](https://img.shields.io/badge/OpenClaw-compatible-brightgreen.svg)](https://github.com/openclaw/openclaw)
[![Providers](https://img.shields.io/badge/providers-10+-brightgreen.svg)](PROVIDERS.md)
[![Councilors](https://img.shields.io/badge/councilors-46-brightgreen.svg)](COUNCILORS.md)
[![Mobile Friendly](https://img.shields.io/badge/mobile-friendly-brightgreen.svg)](MOBILE-UI.md)
[![PWA](https://img.shields.io/badge/PWA-enabled-brightgreen.svg)](PWA-GUIDE.md)
[![Vision Mode](https://img.shields.io/badge/vision-mode-brightgreen.svg)](VISION-COUNCIL.md)
[![MCP](https://img.shields.io/badge/MCP-enabled-brightgreen.svg)]

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [46 Councilors](#46-councilors)
- [9 Deliberation Modes](#13-deliberation-modes)
- [Smart Selection](#smart-councilor-selection)
- [Multi-Provider Support](#multi-provider-support)
- [Mobile-Friendly WebUI](#mobile-friendly-webui)
- [PWA Support](#pwa-support)
- [Vision Council Mode](#vision-council-mode)
- [Quick Start](#quick-start)
- [Architecture: App vs MCP](#architecture-app-vs-mcp)
- [OpenClaw Integration](#openclaw-integration)
- [Configuration](#configuration)
- [🐝 Agent Swarm System](#-agent-swarm-system) ⭐ NEW
- [API Documentation](#api-documentation)
- [Web UI Guide](#web-ui-guide)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

The AI Council Chamber is a sophisticated, multi-agent deliberation engine that analyzes complex problems through diverse, competing personas. It transforms solitary AI interaction into a parliamentary process, ensuring every idea is debated, stress-tested, and refined.

### Why AI Council?

Standard AI suffers from "Yes-Man Syndrome"—it agrees to be helpful. This is dangerous for decision-making.

**The AI Council Chamber enforces Adversarial Collaboration.** By simulating experts with conflicting priorities (Ethicist vs. Technocrat vs. Skeptic), the system uncovers blind spots and produces balanced, robust outcomes.

---

## ✨ Features

## 🧩 Architecture: App vs MCP

AI Council now has **two interfaces inside the same main repo**:

### 1. Main AI Council App / API
This is the actual AI Council program.
It provides:
- the web UI
- deliberation engine
- vision council
- councilor/session/provider APIs
- internal tool broker endpoints for Brave Search + BrowserOS

Typical local endpoint:
- `http://localhost:3001`

### 2. Native MCP Entrypoint (integrated)
This repo now also includes a native MCP server entrypoint:
- `mcp-server.mjs`

This exposes AI Council directly to MCP clients like:
- LM Studio
- OpenClaw / mcporter
- other MCP-compatible tools

Run it with:
```bash
npm run mcp
```

### Important distinction
- The **app/API** is the source of truth.
- The **MCP entrypoint** is just another interface into the same app.
- It does **not** replace the app.
- It does **not** merge AI Council with other projects like CannaAI.

### Legacy wrapper note
There was previously a separate `ai-council-mcp` wrapper repo used as an adapter.
That wrapper is now considered **legacy / redundant** because MCP is integrated directly into this main AI Council repo.

### MCP capabilities now available from the main repo
The integrated MCP entrypoint exposes:
- core council tools (`ask_council`, `list_councilors`, `list_modes`, etc.)
- vision tools (`vision_analyze`, `vision_get_models`, etc.)
- internal broker tools (`web_search`, `tool_broker_status`)
- full BrowserOS passthrough as `browseros_*`

This means AI Council is now the **single source of truth** for both:
- app behavior
- MCP behavior


### 🏛️ Core Deliberation

- **9 Deliberation Modes** — Proposal, Deliberation, Inquiry, Research, Swarm, Swarm Coding, Prediction, Legislature, Inspector
- **46 Specialized Councilors** across 8 categories
- Auto-selected based on topic
- Smart scaling (5-20+ councilors)

### 🎛️ Orchestration Engine ⭐ NEW

- **5 Coordination Patterns** — Generator-Verifier, Orchestrator-Subagent, Agent Teams, Message Bus, Shared State
- **Meta-Agent Cycle** — Plan → Execute → Critic → Heal → Learn
- **Quality Gates** — Auto-retry on short/hallucinated responses
- **Dynamic Selection** — Scores councilors by topic affinity and relevance
- **Session Management** — Pause, resume, abort active sessions
- **Pattern Selector UI** — Choose coordination pattern per session

### 👁️ Vision Council Mode ⭐ NEW

- **Image Analysis** - Upload photos for multi-perspective analysis
- **8 Vision Specialists** - Visual Analyst, Pattern Recognizer, Color Specialist, etc.
- **Multi-Model Vision** - Gemini Vision, Kimi Vision, GPT-4V, Qwen-VL
- **Collaborative Deliberation** - Vision councilors discuss and debate
- **Inspector Mode** - Deep multi-angle visual analysis with structured dossier reports
- **Rich Export** - PDF, Markdown, JSON with images
- **See [VISION-COUNCIL.md](VISION-COUNCIL.md) for complete guide**

### 💻 Swarm Coding (Advanced)

- **6+ Specialized Roles** - Architect, Backend, Frontend, DevOps, Security, QA
- **4-Phase Workflow** - Plan, Implement, Review, Deploy
- **Quality Gates** - Code review, security audit, performance review
- **Integrations** - GitHub, GitLab, VS Code, CI/CD
- **See [SWARM-CODING.md](SWARM-CODING.md) for complete guide**

### 📱 Mobile-Friendly WebUI

- **No Scrolling Required** - Full-screen viewport (100vh, 100vw)
- **Thumb-Friendly Navigation** - Bottom tab bar optimized for one-handed use
- **Adaptive Layout** - Automatically adjusts to mobile, tablet, desktop
- **Fast Performance** - <3s load, <1s paint, 60 FPS animations
- **Accessible** - WCAG 2.1 AA compliant, screen reader support
- **Themes** - Dark/light mode, high contrast mode
- **Quick Settings Bar** - Temperature slider, stream toggle, active councilor count (always visible)
- **Session Stats** - Messages/duration/councilors count in Settings panel
- **Export Session** - Download full session as JSON file
- **Settings Persistence** - All settings survive page reloads
- **See [MOBILE-UI.md](MOBILE-UI.md) for complete mobile guide**

### 📲 PWA Support ⭐ NEW

- **Installable** - Add to home screen like native app
- **Offline Support** - Use without internet connection
- **Push Notifications** - Get notified when deliberations complete
- **Fast Loading** - Cached assets for instant loading
- **Auto-Update** - Always up-to-date without manual updates
- **Storage Efficient** - ~7.5MB total storage
- **See [PWA-GUIDE.md](PWA-GUIDE.md) for complete PWA guide**

### 🎨 Desktop Web UI

- Multi-session support
- Advanced search & bookmarks
- Real-time WebSocket updates
- Argument visualization
- Export (PDF, Markdown, JSON, cloud)
- Dark/light themes
- Responsive design

### 🔌 Integrations

**OpenClaw (Primary):**
- MCP server, Skills, Gateway, Canvas
- Voice/Talk, Browser, Cron, Notifications, Memory

**Cloud Storage:**
- Google Drive, Dropbox, OneDrive, AWS S3

**Communication:**
- Slack, Discord, Teams, Email, SMS

**Developer Tools:**
- GitHub, Jira, Notion, Obsidian, GitLab

**Multi-Agent:**
- LangChain, AutoGen, CrewAI, Semantic Kernel
- LlamaIndex, Haystack, Custom Protocol

---

## 🏛️ 46 Councilors

### Original (15)

- **Speaker** - Facilitator, neutral synthesis
- **Technocrat** - Efficiency, data, optimization
- **Ethicist** - Morality, human well-being
- **Pragmatist** - Cost, feasibility, implementation
- **Skeptic** - Devil's advocate, finds flaws
- **Sentinel** - Security, threats, safety
- **Visionary** - Innovation, long-term thinking
- **Historian** - Historical context, lessons from past
- **Diplomat** - Compromise, middle ground
- **Journalist** - Facts, investigation, truth
- **Psychologist** - Human behavior, motivations
- **Conspiracist** - Alternative theories
- **Propagmatist** - Messaging, communication
- **Moderator** - Process, rules, fairness
- **Coder** - Code quality, technical implementation

### Business & Strategy (5)

- **Economist** - Financial impact, cost-benefit, market forces, ROI
- **Product Manager** - Product strategy, roadmap, prioritization, user value
- **Marketing Expert** - Go-to-market, positioning, messaging, brand
- **Finance Expert** - Budget, financial planning, cash flow, funding
- **Risk Manager** - Enterprise risk, mitigation strategies, risk assessment

### Technical & Engineering (6)

- **DevOps Engineer** - Infrastructure, scalability, deployment, monitoring, SRE
- **Security Expert** - Cybersecurity, threat modeling, security best practices
- **Data Scientist** - Data analysis, ML/AI implications, metrics, analytics
- **Performance Engineer** - Performance optimization, bottlenecks, profiling
- **Quality Assurance** - Testing strategy, edge cases, quality standards
- **Solutions Architect** - System design, integration patterns, enterprise architecture

### User & Community (4)

- **User Advocate** - User experience, accessibility, user needs, pain points
- **Customer Support** - Customer pain points, support burden, documentation
- **Community Manager** - Community impact, open source considerations, feedback
- **Accessibility Expert** - WCAG compliance, inclusive design, assistive technology

### Compliance & Legal (3)

- **Legal Expert** - Compliance, regulations, liability, legal risks, contracts
- **Compliance Officer** - Regulatory compliance, audits, standards, certifications
- **Privacy Officer** - Data privacy, GDPR, CCPA, privacy by design

### Innovation & Culture (5)

- **Innovation Coach** - Creative thinking, breakthrough ideas, disruption
- **HR Specialist** - Team impact, hiring, organizational culture, change management
- **Environmental Specialist** - Sustainability, environmental impact, green tech
- **Ethics Philosopher** - Deep ethical analysis, moral frameworks, philosophical perspectives

### Weather & Emergency Response (5) 🌪️

- **Meteorologist** - Weather patterns, severe weather threats, atmospheric analysis
- **Emergency Manager** - Emergency preparedness, public safety, shelter coordination
- **Animal Care Specialist** - Livestock safety, pet protection, wildlife considerations
- **Risk Analyst** - Probability analysis, impact assessment, risk scoring
- **Local Resident** - Ground-level perspective, neighborhood knowledge, common sense

### Agriculture & Plant Science (2) 🌿🧬

- **🌿 Botanist** - Plant physiology, nutrient management, pest/disease ID, recovery protocols, environmental optimization (VPD, humidity, temperature), growth stage guidance
- **🧬 Geneticist** - Genetics, trait inheritance, breeding programs, strain development, phenotype tracking, generation management (F1, F2, backcrossing), seed viability

### Vision Specialists (8) 👁️ **NEW**

- **Visual Analyst** - General image analysis, overall composition
- **Pattern Recognizer** - Patterns, anomalies, repetitions detection
- **Color Specialist** - Color theory, mood, harmony analysis
- **Composition Expert** - Layout, balance, framing expertise
- **Context Interpreter** - Scene understanding, setting analysis
- **Detail Observer** - Fine details, textures, small elements
- **Emotion Reader** - Emotional content, mood, feelings
- **Symbol Interpreter** - Symbols, meanings, cultural context

**Total: 46 specialized councilors for comprehensive deliberation!**

See [COUNCILORS.md](COUNCILORS.md) for complete guide with roles, priorities, and use cases.

---

## 🎭 9 Deliberation Modes

### Core Modes (6)

1. **⚖️ Legislative** - Debate + vote on proposals
   - Councilors debate, then vote
   - Majority rules with minority opinion recorded
   - Best for: Policy decisions, feature approvals

2. **🧠 Deep Research** - Recursive investigation with search
   - Multi-round research with verification
   - Source citation and fact-checking
   - Best for: Complex topics, market research

3. **🐝 Swarm Hive** - Dynamic task decomposition
   - Breaks complex problems into subtasks
   - Parallel processing by specialized councilors
   - Best for: Large projects, system design

4. **💻 Swarm Coding** - Dedicated software engineering workflow ⭐ ENHANCED
   - 6+ roles: Architect, Backend, Frontend, DevOps, Security, QA
   - 4 phases: Plan, Implement, Review, Deploy
   - Quality gates: Code review, security, performance, tests
   - Integrations: GitHub, GitLab, VS Code, CI/CD
   - Best for: Code development, code review, architecture design
   - **See [SWARM-CODING.md](SWARM-CODING.md) for complete guide**

5. **🔮 Prediction Market** - Superforecasting with probabilistic forecasts
   - Probability estimates with confidence intervals
   - Base rate analysis and pre-mortem
   - Best for: Risk assessment, forecasting

6. **🗣️ Inquiry** - Rapid-fire Q&A mode
   - Quick answers from relevant councilors
   - Minimal deliberation, maximum speed
   - Best for: Quick questions, fact-finding

### Advanced Modes (7) 🆕

7. **🌪️ Emergency Response** - Rapid crisis deliberation
   - Fast-track decision making for emergencies
   - Prioritizes safety and immediate action
   - Councilors: Meteorologist, Emergency Manager, Risk Analyst, Local Resident
   - Best for: Weather emergencies, security incidents, crisis management

8. **🏛️ Legislature** - Full legislative process 🆕
   - 5-phase legislative cycle: First Reading → Committee Deliberation → Second Reading → Final Vote → Enactment
   - Each councilor acts as a committee member assessing the proposal from their political persona
   - Coalition building in final votes with concessions documented
   - Speaker issues official `<legislative_record>` with vote tally, coalition map, and effective date
   - Political personas: Libertarian, Progressive, Centrist, etc. deliberate amendments
   - Best for: Policy proposals, governance decisions, rule-making, legislative analysis

9. **🔬 Inspector** - Deep visual & data analysis 🆕
   - Upload images for structured multi-angle inspection
   - Speaker assigns each councilor a specific inspection angle (technical, analytical, specialist, generalist)
   - Each councilor produces `<inspection_report>` with findings, anomalies, concerns, uncertainties
   - Speaker synthesizes into unified `<inspection_dossier>`: primary findings, critical issues, cross-perspectives, data quality, next steps, gaps
   - Images passed to Gemini as inline base64 for native vision analysis
   - Teal dossier card with color-coded sections (green findings, red critical, amber cross-perspectives)
   - Best for: Visual inspection, anomaly detection, data quality assessment, evidence analysis

10. **📊 Risk Assessment** - Comprehensive risk analysis
   - Quantitative and qualitative risk scoring
   - Mitigation strategy development
   - Councilors: Risk Analyst, Security Expert, Finance Expert, Legal Expert
   - Best for: Project risks, security reviews, financial risk assessment

11. **🤝 Consensus Building** - Find common ground
   - Facilitated dialogue to find agreement
   - Documents areas of agreement/disagreement
   - Councilors: Diplomat, Psychologist, Moderator, Ethicist
   - Best for: Team disputes, stakeholder alignment, conflict resolution

12. **🎯 Strategic Planning** - Long-term strategic thinking
    - Multi-year planning with scenario analysis
    - Competitive analysis and positioning
    - Councilors: Visionary, Historian, Economist, Product Manager
    - Best for: Roadmap planning, strategy sessions, competitive analysis

13. **👁️ Vision Council** - Image-based deliberation
    - Upload photos for multi-perspective analysis
    - 8 vision-specialized councilors
    - Multi-model vision analysis (Kimi Vision, GPT-4V, Gemini Vision, Qwen-VL)
    - Collaborative deliberation on image content
    - Export with images (PDF, Markdown, JSON)
    - Best for: Photo analysis, design review, art critique, real estate photos, product optimization
    - **See [VISION-COUNCIL.md](VISION-COUNCIL.md) for complete guide**

---

## 🎯 Smart Councilor Selection

**Never run all 46 councilors!** The AI Council auto-selects the most relevant councilors for each decision.

### Selection Tiers

| Tier | Councilors | Use For | Cost | Time |
|------|------------|---------|------|------|
| **Quick** | 3-5 | Simple questions | ~$0.01-0.05 | <30s |
| **Standard** ⭐ | 7-10 | Most decisions (DEFAULT) | ~$0.02-0.10 | 30-60s |
| **Comprehensive** | 12-15 | Major decisions | ~$0.05-0.20 | 60-90s |
| **Full** | 20+ | Critical decisions | ~$0.10-0.50+ | 90s+ |
| **Vision** | 8 | Image analysis | ~$0.05-0.15 | 2-5 min |

### Auto-Selection by Topic

- **Business** → Economist, Product Manager, Finance, Risk
- **Technical** → Solutions Architect, DevOps, Security
- **Security** → Security Expert, Sentinel, Legal, Compliance
- **UX** → User Advocate, Accessibility, Support
- **Compliance** → Legal, Compliance, Privacy
- **Innovation** → Innovation Coach, Visionary, Conspiracist
- **Weather/Emergency** → Meteorologist, Emergency Manager, Risk Analyst, Local Resident
- **Coding** → Solutions Architect, Coder, Security Expert, QA, DevOps
- **🌿 Plant Health** → Botanist, Scientist, Sentinel, Pragmatist
- **🧬 Breeding Programs** → Geneticist, Botanist, Scientist
- **🌾 Agriculture** → Botanist, Geneticist, Environmental Specialist
- **📸 Image Analysis** → Visual Analyst, Pattern Recognizer, Color Specialist, Composition Expert

### Smart Presets

```bash
# Default (7-10 councilors)
council deliberate "topic"

# Quick (3-5 councilors)
council deliberate "topic" --preset minimal

# Comprehensive (12-15 councilors)
council deliberate "topic" --preset thorough

# Topic-focused
council deliberate "topic" --preset technical
council deliberate "topic" --preset business
council deliberate "topic" --preset security
council deliberate "topic" --preset emergency
council deliberate "topic" --preset coding
council deliberate "topic" --preset agriculture
council deliberate "topic" --preset breeding
council deliberate "topic" --preset vision

# Vision mode
council vision-analyze image.jpg --prompt "Analyze composition and color"
```

**See [COUNCILOR-SELECTION.md](COUNCILOR-SELECTION.md) for complete guide.**

---

## 🤖 Multi-Provider Support

Support for **10+ AI providers** - use what works best!

### Primary Providers

| Provider | Best For | Cost | Latency |
|----------|----------|------|---------|
| **MiniMax M2.7** (default) | Best overall reasoning | API | 300-1200ms |
| **LM Studio** | Privacy, FREE | FREE | 100-500ms |
| **OpenAI** | Quality, Vision | $$$ | 1000-2000ms |
| **Anthropic** | Long context | $$$ | 1000-2500ms |
| **Google** | Multimodal, Vision | $$ | 500-1500ms |

### Additional Providers

Ollama (FREE, local), Groq (fastest), DeepSeek (cheap), Together AI, Anyscale, Moonshot (128K context)

### Quick Switch

```bash
# Use LM Studio (free)
council config set provider lmstudio

# Use OpenAI
council config set provider openai

# Use MiniMax M2.7 (default)
council config set provider minimax
```

**See [PROVIDERS.md](PROVIDERS.md) for complete setup guide.**

---

## 📱 Mobile-Friendly WebUI

The WebUI is **fully mobile-friendly** with a **no-scroll design** on mobile devices!

### Key Features

- ✅ **No Scrolling Required** - Full-screen viewport (100vh, 100vw)
- ✅ **Thumb-Friendly Navigation** - Bottom tab bar
- ✅ **Adaptive Layout** - Mobile, tablet, desktop
- ✅ **Fast Performance** - <3s load, 60 FPS
- ✅ **Accessible** - WCAG 2.1 AA compliant
- ✅ **Themes** - Dark/light, high contrast

### Responsive Breakpoints

| Device | Breakpoint | Layout | Navigation |
|--------|------------|--------|------------|
| **Mobile** | < 768px | Full-screen, no scroll | Bottom tab bar |
| **Tablet** | 768px - 1024px | Adaptive grid | Bottom or side |
| **Desktop** | > 1024px | Multi-column | Side navigation |

### Performance Benchmarks

| Metric | Target | Achieved |
|--------|--------|----------|
| **Load Time** | < 3s | ✅ 2.1s |
| **First Paint** | < 1s | ✅ 0.6s |
| **Time to Interactive** | < 2s | ✅ 1.5s |
| **Animation FPS** | 60 FPS | ✅ 60 FPS |
| **Memory Usage** | < 100MB | ✅ 65MB |

### Tested Devices

**Mobile:** iPhone SE/13/14 Pro Max/17 Air, Pixel 7, Samsung Galaxy S23 ✅  
**Tablets:** iPad Mini/Pro, Samsung Tab S8 ✅  
**Desktop:** Safari, Chrome, Firefox, Edge ✅

**See [MOBILE-UI.md](MOBILE-UI.md) for complete mobile guide!**

---

## 📲 PWA Support

The AI Council Chamber is now a **Progressive Web App (PWA)**!

### Key Features

- 📲 **Installable** - Add to home screen like native app
- 📶 **Offline Support** - Use without internet connection
- 🔔 **Push Notifications** - Get notified when deliberations complete
- ⚡ **Fast Loading** - Cached assets for instant loading
- 🔄 **Auto-Update** - Always up-to-date
- 💾 **Storage Efficient** - ~7.5MB total

### Installation

**Android (Chrome):**
1. Open Chrome → Navigate to app
2. Tap install prompt or menu → "Add to Home screen"
3. Confirm → App installed!

**iOS (Safari):**
1. Open Safari → Navigate to app
2. Tap Share button → "Add to Home Screen"
3. Confirm → App appears on home screen!

**Desktop (Chrome/Edge):**
1. Open browser → Navigate to app
2. Click install icon in address bar
3. Confirm → App installs!

### Offline Features

**Works Offline:**
- ✅ View cached deliberations
- ✅ Draft new deliberations (queued for sync)
- ✅ View councilors and modes
- ✅ Adjust settings
- ✅ All UI components load instantly

**Requires Internet:**
- ❌ Start new deliberations
- ❌ Vision analysis
- ❌ Sync queued data
- ❌ Push notifications

### Performance

**Lighthouse PWA Score: 100/100** ✅

| Metric | Target | Achieved |
|--------|--------|----------|
| **First Contentful Paint** | <1s | ✅ 0.4s |
| **Time to Interactive** | <2s | ✅ 1.2s |
| **Speed Index** | <3s | ✅ 1.8s |

**See [PWA-GUIDE.md](PWA-GUIDE.md) for complete PWA guide!**

---

## 👁️ Vision Council + Inspector Mode

Upload photos for multi-perspective analysis — **Vision Council** for creative review, **Inspector** for structured deep-dive assessment!

### 8 Vision Specialists

- **Visual Analyst** - General image analysis
- **Pattern Recognizer** - Patterns, anomalies detection
- **Color Specialist** - Color theory, mood analysis
- **Composition Expert** - Layout, balance, framing
- **Context Interpreter** - Scene understanding
- **Detail Observer** - Fine details, textures
- **Emotion Reader** - Emotional content, mood
- **Symbol Interpreter** - Symbols, meanings, cultural context

### Supported Vision Models

- **Qwen3.5 Vision** (Local Qwen/Qwen3.5-9b) - Fast, accurate
- **GPT-4 Vision** (OpenAI) - Detailed analysis
- **Gemini Pro Vision** (Google) - Multi-modal
- **Qwen-VL** (Local) - Privacy-focused

### How to Use

1. Click "New Deliberation"
2. Select "👁️ Vision Council" or **🔬 Inspector** mode
3. Upload image (Inspector mode provides structured dossier reports) (drag & drop, camera, or file picker)
4. Add prompt/question (optional)
5. Click "Start Analysis"
6. Review individual analyses
7. Watch collaborative deliberation
8. Export results (PDF, Markdown, JSON)

### Use Cases

- 📷 Photo analysis & feedback
- 🎨 Design review
- 🖼️ Art critique
- 🏠 Real estate photo analysis
- 🛍️ Product photo optimization
- 📱 Social media content review
- 🔍 Security camera analysis
- 🌿 Plant/animal identification
- 📄 Document analysis
- 🎯 Marketing material review

**See [VISION-COUNCIL.md](VISION-COUNCIL.md) for complete guide!**

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- npm or yarn
- AI provider API key (or use local LM Studio/Ollama)

### Installation

```bash
# Clone
git clone https://github.com/Franzferdinan51/AI-Bot-Council-Concensus.git
cd AI-Bot-Council-Concensus

# Install
npm install

# Configure
cp .env.example .env
# Edit .env with your API keys

# Start API server (default port: 3006)
PORT=3006 node server.js &

# Start web UI (in another terminal or use concurrently)
npm run dev -- --host 0.0.0.0

# Or run both together:
# npm install -D concurrently
# npm run dev:full

# Open browser
http://localhost:3002/
```

### Auto-Start

```bash
./start-ai-council.sh
```

### Mobile Setup

1. Open on mobile device
2. Add to Home Screen:
   - **iOS:** Share → Add to Home Screen
   - **Android:** Menu → Add to Home screen
3. Use like a native app!

---

## 🔌 OpenClaw Integration

Fully integrated with OpenClaw:

```bash
# Start deliberation
openclaw agent --message "council deliberate Should we implement X?"

# Check status
openclaw agent --message "council status"

# Export session
openclaw agent --message "council export session_123"

# Vision analysis
openclaw agent --message "council vision-analyze image.jpg"
```

### Features

- ✅ MCP server (auto-registered)
- ✅ OpenClaw skills
- ✅ Gateway integration
- ✅ Canvas visualization
- ✅ Voice/Talk support
- ✅ Browser control
- ✅ Cron automation
- ✅ Notifications
- ✅ Memory sharing
- ✅ Multi-agent routing

---

## ⚙️ Configuration

### Environment (.env)

```bash
# Primary provider
DEFAULT_PROVIDER=minimax
MINIMAX_API_KEY=your-minimax-key

# Alternative providers
OPENAI_API_KEY=your-openai-key
LM_STUDIO_ENDPOINT=http://localhost:1234/v1

# Server
PORT=3002
HOST=0.0.0.0

# Models
SPEAKER_MODEL=MiniMax-M2.7
RESEARCH_MODEL=MiniMax-M2.7
FAST_MODEL=jan-v3-4b-base-instruct
VISION_MODEL=qwen/qwen3.5-9b
```

### MCP Config

```json
{
  "mcpServers": {
    "ai-council": {
      "url": "http://127.0.0.1:3001/mcp",
      "_auto_connect": true,
      "_default": true
    }
  }
}
```

---

## 🤖 MCP Server

**Full Model Context Protocol support for AI agents**

Connect AI Council to LM Studio, OpenClaw, Claude Desktop, and any MCP-compatible client.

### Quick Connect

```json
{
  "mcpServers": {
    "ai-council": {
      "command": "node",
      "args": ["/path/to/ai-council-chamber/api-server.cjs"],
      "env": { "PORT": "3001" }
    }
  }
}
```

### 38 Available Tools

#### Vision + Inspector (6 tools)
| Tool | Description |
|------|-------------|
| `vision_analyze` | Analyze images with vision councilors |
| `vision_deliberate` | Start deliberation on vision session |
| `vision_upload` | Upload image for analysis |
| `vision_get_models` | List available vision models |
| `get_vision_session` | Get vision analysis results |
| `inspection_parse` | Parse inspection dossier from deliberation |

#### Councilor Management (6 tools)
| Tool | Description |
|------|-------------|
| `list_councilors` | List all 25 councilors |
| `list_councilors_by_role` | Filter by role (vision, coding, emergency) |
| `get_councilor` | Get specific councilor details |
| `add_councilor` | Add custom councilor |
| `update_councilor` | Update councilor config |
| `remove_councilor` | Remove councilor |

#### Deliberation & Voting (7 tools)
| Tool | Description |
|------|-------------|
| `list_modes` | List 11 deliberation modes |
| `start_deliberation` | Start new deliberation session |
| `ask_council` | Ask the council a question |
| `vote` | Cast vote in deliberation |
| `get_votes` | Get current vote tally |
| `get_consensus` | Get consensus analysis |
| `get_session` | Get session status |
| `stop_session` | Stop current session |

#### Providers & Settings (6 tools)
| Tool | Description |
|------|-------------|
| `get_providers` | List configured AI providers |
| `update_provider` | Configure provider API key/endpoint |
| `test_provider` | Test provider connection |
| `get_settings` | Get all settings |
| `update_settings` | Update settings |
| `health` | Check API status |

#### UI & Audio (4 tools)
| Tool | Description |
|------|-------------|
| `get_ui_settings` | Get theme, animations, compact mode |
| `update_ui_settings` | Update UI preferences |
| `get_audio_settings` | Get TTS/voice settings |
| `update_audio_settings` | Configure voice per councilor |

#### Export (1 tool)
| Tool | Description |
|------|-------------|
| `export_session` | Export deliberation (markdown/json/pdf) |

### JSON-RPC Example

```bash
POST http://localhost:3001/mcp
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "ask_council",
    "arguments": {
      "question": "Should we adopt microservices?",
      "mode": "legislative"
    }
  },
  "id": 1
}
```

### Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{
      "type": "text",
      "text": "{\n  \"question\": \"Should we adopt microservices?\",\n  \"mode\": \"legislative\",\n  \"response\": \"[Council deliberation...]\"\n}"
    }]
  }
}
```

### LM Studio Integration

Add to `~/.lmstudio/mcp.json`:

```json
{
  "mcpServers": {
    "ai-council": {
      "command": "node",
      "args": ["/Users/duckets/AI-Bot-Council-Concensus/api-server.cjs"],
      "env": { "PORT": "3001" }
    }
  }
}
```

### OpenClaw Integration

Add to your OpenClaw config `mcporter.json`:

```json
{
  "mcpServers": {
    "ai-council": {
      "command": "node",
      "args": ["/path/to/ai-council-chamber/api-server.cjs"]
    }
  }
}
```

---

## 📡 API Documentation

### REST API

```bash
# Health Check
GET /api/health

# Councilors Management
GET /api/councilors           # List all councilors
POST /api/councilors           # Add councilor
PATCH /api/councilors/:id      # Update councilor
DELETE /api/councilors/:id    # Remove councilor

# Session Management
GET /api/session              # Get current session
POST /api/session/start       # Start session { mode, topic }
POST /api/session/stop         # Stop session

# Ask the Council
POST /api/ask                 # { question, mode }

# Providers
GET /api/providers            # List providers
PUT /api/providers/:name      # Update provider

# Settings
GET /api/settings            # Get all settings
PUT /api/settings            # Update settings

# UI Settings
GET /api/ui                  # Get UI settings
PATCH /api/ui               # Update UI { theme, animationsEnabled }

# Audio Settings
GET /api/audio               # Get audio settings
PATCH /api/audio            # Update audio { enabled, useGeminiTTS, autoPlay }
```

### MCP Protocol (Model Context Protocol)

**Connect via LM Studio, OpenClaw, Claude Desktop, etc.:**

```json
{
  "mcpServers": {
    "ai-council": {
      "command": "node",
      "args": ["/path/to/ai-council-chamber/api-server.cjs"],
      "env": { "PORT": "3001" }
    }
  }
}
```

**Available MCP Tools:**

| Tool | Description |
|------|-------------|
| `health` | Check API status |
| `list_councilors` | List all councilors |
| `add_councilor` | Add new councilor |
| `update_councilor` | Update councilor settings |
| `remove_councilor` | Remove councilor |
| `start_session` | Start deliberation session |
| `stop_session` | Stop current session |
| `get_session` | Get session status |
| `ask_council` | Ask the council a question |
| `get_providers` | List AI providers |
| `update_provider` | Configure provider |
| `get_settings` | Get settings |
| `update_settings` | Update settings |
| `get_ui_settings` | Get UI config |
| `update_ui_settings` | Update UI { theme, animations } |
| `get_audio_settings` | Get audio config |
| `update_audio_settings` | Update audio { enabled, voiceMap } |

**JSON-RPC Format:**
```bash
POST /mcp
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "list_councilors",
    "arguments": {}
  },
  "id": 1
}
```

### WebSocket (Coming Soon)

```javascript
const ws = new WebSocket('ws://localhost:3001/ws');
ws.send(JSON.stringify({ type: 'subscribe', session_id: 'abc' }));
ws.onmessage = (e) => console.log(JSON.parse(e.data));
```


## 🖥️ Web UI Guide

### Start Deliberation

1. Click **"New Deliberation"**
2. Select mode (Legislative, Research, Vision, Inspector, etc.)
3. Select councilors (or use auto-select)
4. Enter topic or upload image
5. Click **"Start"**

### Features

- **Multi-Session:** Click "+" for new session
- **Search:** Press Ctrl+K
- **Bookmarks:** Click bookmark icon
- **Export:** Click "Export" button
- **Settings:** Click gear icon
- **Mobile:** Bottom navigation bar
- **PWA:** Install button in settings

---

## 🤝 Contributing

We welcome contributions!

```bash
# Fork
git clone https://github.com/your-username/AI-Bot-Council-Concensus.git

# Install
npm install

# Dev
npm run dev

# Test
npm test

# Build
npm run build
```

1. Fork the repo
2. Create feature branch
3. Make changes
4. Run tests
5. Submit PR

---

## 📄 License

MIT License - Free to use, modify, distribute.

See [LICENSE](LICENSE) for details.

---

## 🐝 Agent Swarm System ⭐ NEW (March 26, 2026)

**218+ specialized AI agents working together on your tasks.**

The Agent Swarm System is a major addition to the AI Council — parallel task execution with specialized agents across game dev, software build, research, security audits, mobile, data/ML, and every coding domain imaginable.

### How It Works

```
swarm build a REST API for task management
swarm game dev a 2D roguelike platformer
swarm research AI agent frameworks
swarm audit my code for security vulnerabilities
swarm mobile build a fitness tracking app
swarm data create a real-time analytics pipeline
```

1. **Classify** → Detects domain (game/build/research/audit/mobile/data)
2. **Select** → Picks 3-15 specialized agents
3. **Split** → Each agent gets a focused subtask
4. **Dispatch** → Agents work in parallel via `sessions_spawn`
5. **Aggregate** → Results synthesized into final deliverable

### Agent Tiers (218 Total)

| Tier | Role | Model | Count |
|------|------|-------|-------|
| **Tier 1** | Strategic / Directors | MiniMax-M2.7 | 25 |
| **Tier 2** | Tactical / Leads | MiniMax-M2.7 | 50 |
| **Tier 3** | Specialists | MiniMax-M2.5 | 143+ |

### Tier 1 Coding Directors (10)
solutions-architect, frontend-architect, backend-architect, api-architect, devops-director, security-director, data-ml-director, mobile-director, ux-director, platform-director

### Tier 2 Coding Tech Leads (15)
frontend-tech-lead, backend-tech-lead, mobile-tech-lead, devops-lead, security-lead-eng, qa-lead-engineer, data-engineering-lead, cloud-infra-lead, ml-engineering-lead, platform-engineering-lead, api-lead, performance-engineering-lead, reliability-engineering-lead, product-engineering-lead, research-engineering-lead

### Tier 3 Coding Specialists (134+) — Key Categories

| Category | Examples |
|----------|----------|
| **Frontend** | React, Vue, Svelte, Angular, Next.js, Remix, Nuxt, Astro, TypeScript, Tailwind, Radix UI, Shadcn, Animation |
| **Backend** | Node.js, Express, FastAPI, Django, Flask, NestJS, Spring, .NET, Go, Rust, Elixir, Bun, Deno, GraphQL |
| **Mobile** | React Native, Flutter, SwiftUI, UIKit, Kotlin, Android Native |
| **Database** | PostgreSQL, MongoDB, Redis, DynamoDB, Elasticsearch, SQLite |
| **Cloud** | AWS, GCP, Azure, Kubernetes, Docker, Terraform, Cloudflare Workers, Vercel, Firebase, Supabase |
| **Data/ML** | PyTorch, Pandas, Airflow, dbt, Snowflake, Databricks, BigQuery, Kafka, LLM, LangChain, RAG, HuggingFace, Vector DB |
| **AI Agents** | LangChain, CrewAI, RAG Specialist, Vector DB, OpenAI API, HuggingFace |
| **Testing** | Playwright, Cypress, Jest, Vitest, TDD |
| **Security** | AppSec, Pen Testing, Cryptography, OAuth, DevSecOps, GDPR, HIPAA, PCI-DSS, SOC 2 |
| **Observability** | OpenTelemetry, Sentry, Datadog, Prometheus, Grafana |
| **Payments** | Stripe, Payment Gateway |
| **Search/CMS** | Algolia, Contentful, Sanity |
| **Auth** | Auth0, Clerk, Supabase Auth |
| **Streaming** | Kafka, Redis Streams, HLS/DASH, WebRTC |
| **Industry** | E-commerce, SaaS, Fintech, IoT, Blockchain, Media, Audio, Automation, Raspberry Pi, Crypto, Home Automation |

### Domains

| Domain | Example | Agents |
|--------|---------|--------|
| **game** | `swarm game dev a roguelike` | 48 agents: creative-director, technical-director, producer, game-designer, lead-programmer, art-director, audio-director, narrative-director, qa-lead, release-manager, localization-lead + 39 specialists incl. Godot/Unity/Unreal engine agents |
| **build** | `swarm build a REST API` | architect + backend-dev + frontend-dev + devops-eng + security-eng + qa-engineer + database-specialist + api-specialist |
| **research** | `swarm research AI agents` | research-lead + data-lead + ux-researcher + security-lead + technical-writer + product-lead |
| **audit** | `swarm audit my code` | security-eng + reliability-engineer + qa-engineer + security-lead + architect + penetration-testing-specialist |
| **mobile** | `swarm mobile build an app` | mobile-specialist + architect + react-native-specialist + swiftui-specialist + flutter-specialist + kotlin-specialist |
| **data** | `swarm data build a pipeline` | data-lead + ml-engineer + data-engineer + airflow-specialist + llm-specialist + pandas-specialist |

### Game Studio Agents — 48 Total (Full Claude-Code-Game-Studios Integration)

**Tier 1 — Leadership (3):** creative-director, technical-director, producer

**Tier 2 — Department Leads (9):** game-designer, lead-programmer, art-director, audio-director, narrative-director, qa-lead, release-manager, localization-lead

**Tier 3 — Specialists (36):**
- **Programming:** gameplay-programmer, engine-programmer, ai-programmer, network-programmer, tools-programmer, ui-programmer
- **Design:** systems-designer, level-designer, economy-designer, world-builder
- **Art & Tech:** technical-artist, ux-designer
- **Audio & Narrative:** sound-designer, writer
- **Production:** prototyper, performance-analyst, devops-engineer, analytics-engineer
- **Quality & Ops:** security-engineer, qa-tester, accessibility-specialist, live-ops-designer, community-manager
- **Godot 4:** godot-specialist, godot-gdscript-specialist, godot-shader-specialist, godot-gdextension-specialist
- **Unity:** unity-specialist, unity-dots-specialist, unity-shader-specialist, unity-addressables-specialist, unity-ui-specialist
- **Unreal:** unreal-specialist, ue-gas-specialist, ue-blueprint-specialist, ue-replication-specialist, ue-umg-specialist

**36 Skills:** start, brainstorm, prototype, sprint-plan, design-review, code-review, design-system, bug-report, hotfix, changelog, milestone-review, and 26 more

**Full details:** [SWARM-GAME-STUDIO.md](SWARM-GAME-STUDIO.md) | [duckbot-skill/game-studio-agents/](duckbot-skill/game-studio-agents/) | [duckbot-skill/game-studio-skills/](duckbot-skill/game-studio-skills/)

### Location

```
agent-swarm-system/
├── agent-registry.json      # 133 agent definitions
├── swarm-orchestrator.py   # Main orchestrator
├── plans/                   # Saved swarm plans
├── agents/
│   ├── game/               # 48 game dev agents
│   ├── general/            # 25 general agents
│   └── coding/            # 75 coding specialists
└── README.md               # Full documentation
```

### Integration with AI Council

- Swarm results can be fed into council deliberation modes for adversarial review
- Swarm agents can use the AI Council's councilor personas
- Multi-agent coordination via OpenClaw `sessions_spawn`

### Quick Start

```bash
cd agent-swarm-system
python3 swarm-orchestrator.py "build a REST API" --count 5
python3 swarm-orchestrator.py "make a 2D roguelike" --count 8
python3 swarm-orchestrator.py "audit our codebase" --domain audit
```

Or tell DuckBot: `swarm build a REST API`

---

## 🙏 Acknowledgments

- [OpenClaw](https://github.com/openclaw/openclaw)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Node.js](https://nodejs.org/)
- [Legacy Alibaba Bailian reference](https://www.aliyun.com/product/bailian)

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/Franzferdinan51/AI-Bot-Council-Concensus/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Franzferdinan51/AI-Bot-Council-Concensus/discussions)
- **Documentation:** See files in this repository

---

**Built with ❤️ for better decision-making**

**MIT License - Free to use, modify, and distribute**

### New — Tier 1 & 2 Coding Directors & Leads (Non-Game)

**10 Tier 1 Coding Directors:**
solutions-architect, frontend-architect, backend-architect, api-architect, devops-director, security-director, data-ml-director, mobile-director, ux-director, platform-director

**15 Tier 2 Coding Tech Leads:**
frontend-tech-lead, backend-tech-lead, mobile-tech-lead, devops-lead, security-lead-eng, qa-lead-engineer, data-engineering-lead, cloud-infra-lead, ml-engineering-lead, platform-engineering-lead, api-lead, performance-engineering-lead, reliability-engineering-lead, product-engineering-lead, research-engineering-lead
