# 🏛️ AI Council Chamber

**The Definitive Multi-Agent Governance & Deliberation Engine**

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![OpenClaw Compatible](https://img.shields.io/badge/OpenClaw-compatible-brightgreen.svg)](https://github.com/openclaw/openclaw)
[![Providers](https://img.shields.io/badge/providers-10+-brightgreen.svg)](PROVIDERS.md)
[![Councilors](https://img.shields.io/badge/councilors-43-brightgreen.svg)](COUNCILORS.md)(COUNCILORS.md)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [38 Councilors](#38-councilors)
- [Smart Selection](#smart-councilor-selection)
- [Multi-Provider Support](#multi-provider-support)
- [Quick Start](#quick-start)
- [OpenClaw Integration](#openclaw-integration)
- [Configuration](#configuration)
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

### 🏛️ Core Deliberation

- **6 Deliberation Modes**
  - ⚖️ Legislative - Debate + vote
  - 🧠 Deep Research - Recursive investigation
  - 🐝 Swarm Hive - Task decomposition
  - 💻 Swarm Coding - Software engineering
  - 🔮 Prediction Market - Probabilistic forecasting
  - 🗣️ Inquiry - Rapid-fire Q&A

- **43 Specialized Councilors**
  - 5 categories: Business, Technical, User, Compliance, Innovation
  - Auto-selected based on topic
  - Smart scaling (5-20+ councilors)

### 🎨 Web UI

- Multi-session support
- Advanced search & bookmarks
- Real-time WebSocket updates
- Argument visualization
- Export (PDF, Markdown, JSON, cloud)
- Dark/light themes
- Mobile responsive

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

## 🏛️ 38 Councilors

### Original (15)
Speaker, Technocrat, Ethicist, Pragmatist, Skeptic, Sentinel, Visionary, Historian, Diplomat, Journalist, Psychologist, Conspiracist, Propagmatist, Moderator, Coder

### Business & Strategy (5)
Economist, Product Manager, Marketing Expert, Finance Expert, Risk Manager

### Technical & Engineering (6)
DevOps Engineer, Security Expert, Data Scientist, Performance Engineer, Quality Assurance, Solutions Architect

### User & Community (4)
User Advocate, Customer Support, Community Manager, Accessibility Expert

### Compliance & Legal (3)
Legal Expert, Compliance Officer, Privacy Officer

### Innovation & Culture (5)
Innovation Coach, HR Specialist, Environmental Specialist, Ethics Philosopher

**See [COUNCILORS.md](COUNCILORS.md) for complete guide.**

---

## 🎯 Smart Councilor Selection

**Never run all 38 councilors!** The AI Council auto-selects the most relevant councilors for each decision.

### Selection Tiers

| Tier | Councilors | Use For | Cost | Time |
|------|------------|---------|------|------|
| **Quick** | 3-5 | Simple questions | ~$0.01-0.05 | <30s |
| **Standard** ⭐ | 7-10 | Most decisions (DEFAULT) | ~$0.02-0.10 | 30-60s |
| **Comprehensive** | 12-15 | Major decisions | ~$0.05-0.20 | 60-90s |
| **Full** | 20+ | Critical decisions | ~$0.10-0.50+ | 90s+ |

### Auto-Selection by Topic

- **Business** → Economist, Product Manager, Finance, Risk
- **Technical** → Solutions Architect, DevOps, Security
- **Security** → Security Expert, Sentinel, Legal, Compliance
- **UX** → User Advocate, Accessibility, Support
- **Compliance** → Legal, Compliance, Privacy
- **Innovation** → Innovation Coach, Visionary, Conspiracist

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
```

**See [COUNCILOR-SELECTION.md](COUNCILOR-SELECTION.md) for complete guide.**

---

## 🤖 Multi-Provider Support

Support for **10+ AI providers** - use what works best!

### Primary Providers

| Provider | Best For | Cost | Latency |
|----------|----------|------|---------|
| **Bailian** (default) | Performance | FREE-$$$ | 500-1500ms |
| **LM Studio** | Privacy, FREE | FREE | 100-500ms |
| **OpenAI** | Quality | $$$ | 1000-2000ms |
| **Anthropic** | Long context | $$$ | 1000-2500ms |
| **Google** | Multimodal | $$ | 500-1500ms |

### Additional Providers

Ollama (FREE, local), Groq (fastest), DeepSeek (cheap), Together AI, Anyscale, Moonshot (128K context)

### Quick Switch

```bash
# Use LM Studio (free)
council config set provider lmstudio

# Use OpenAI
council config set provider openai

# Use Bailian (default)
council config set provider bailian
```

**See [PROVIDERS.md](PROVIDERS.md) for complete setup guide.**

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

# Start
npm run dev

# Open browser
http://localhost:3003/
```

### Auto-Start

```bash
./start-ai-council.sh
```

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
DEFAULT_PROVIDER=bailian
BAILIAN_API_KEY=your-bailian-key

# Alternative providers
OPENAI_API_KEY=your-openai-key
LM_STUDIO_ENDPOINT=http://localhost:1234/v1

# Server
PORT=3003
HOST=0.0.0.0

# Models
SPEAKER_MODEL=bailian/qwen3.5-plus
RESEARCH_MODEL=bailian/MiniMax-M2.5
FAST_MODEL=bailian/glm-5
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

## 📡 API Documentation

### REST API

```bash
# Health
GET /api/v2/health

# Councilors
GET /api/v2/councilors

# Deliberate
POST /api/v2/deliberate
{
  "topic": "Should we implement X?",
  "mode": "legislative"
}

# Session
GET /api/v2/session/{id}

# Export
POST /api/v2/export
{
  "session_id": "abc123",
  "format": "markdown"
}
```

### GraphQL

```graphql
query {
  sessions { id, topic, status }
  councilors { id, name, role }
}
```

### WebSocket

```javascript
const ws = new WebSocket('ws://localhost:3001/ws');
ws.send(JSON.stringify({ type: 'subscribe', session_id: 'abc' }));
ws.onmessage = (e) => console.log(JSON.parse(e.data));
```

**Swagger UI:** http://localhost:3001/api-docs

---

## 🖥️ Web UI Guide

### Start Deliberation

1. Click **"New Deliberation"**
2. Select mode (Legislative, Research, etc.)
3. Select councilors (or use auto-select)
4. Enter topic
5. Click **"Start"**

### Features

- **Multi-Session:** Click "+" for new session
- **Search:** Press Ctrl+K
- **Bookmarks:** Click bookmark icon
- **Export:** Click "Export" button
- **Settings:** Click gear icon

**See full guide in repository.**

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

## 🙏 Acknowledgments

- [OpenClaw](https://github.com/openclaw/openclaw)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Node.js](https://nodejs.org/)
- [Alibaba Bailian](https://www.aliyun.com/product/bailian)

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/Franzferdinan51/AI-Bot-Council-Concensus/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Franzferdinan51/AI-Bot-Council-Concensus/discussions)
- **Documentation:** See files in this repository

---

**Built with ❤️ from Huber Heights, OH**

**Copyright © 2026 Felafax, Inc.**
