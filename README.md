# 🏛️ AI Council Chamber

**The Definitive Multi-Agent Governance & Deliberation Engine**

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![OpenClaw Compatible](https://img.shields.io/badge/OpenClaw-compatible-brightgreen.svg)](https://github.com/openclaw/openclaw)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [OpenClaw Integration](#openclaw-integration)
- [Agent Integrations](#agent-integrations)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Web UI Guide](#web-ui-guide)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

The AI Council Chamber is a sophisticated, multi-agent legislative simulator designed to analyze complex problems through the lens of diverse, competing personas. It transforms solitary AI interaction into a parliamentary process, ensuring that every idea is debated, stress-tested, and refined before a conclusion is reached.

### Why AI Council?

Standard AI interfaces often suffer from "Yes-Man Syndrome"—they agree with the user's premise to be helpful. This is dangerous for decision-making.

**The AI Council Chamber solves this by enforcing Adversarial Collaboration.** By simulating a room full of experts with conflicting priorities (e.g., An Ethicist vs. A Technocrat vs. A Skeptic), the system forces the AI to check its own biases, uncover blind spots, and produce a significantly more balanced and robust output.

---

## ✨ Features

### 🏛️ Core Deliberation

- **6 Deliberation Modes**
  - ⚖️ **Legislative** - Debate + vote on proposals
  - 🧠 **Deep Research** - Recursive investigation with search
  - 🐝 **Swarm Hive** - Dynamic task decomposition
  - 💻 **Swarm Coding** - Dedicated software engineering workflow
  - 🔮 **Prediction Market** - Superforecasting with probabilistic forecasts
  - 🗣️ **Inquiry** - Rapid-fire Q&A mode

- **15 Councilor Archetypes**
  - Speaker, Technocrat, Ethicist, Pragmatist, Skeptic, Sentinel
  - Visionary, Historian, Diplomat, Journalist, Psychologist
  - Conspiracist, Propagmatist, Moderator, Coder

### 🎨 Web UI Features

- **Multi-Session Support** - Run multiple deliberations simultaneously
- **Advanced Search** - Full-text search across all sessions
- **Visualization** - Argument graphs, heatmaps, timelines
- **Export Options** - PDF, Markdown, JSON, cloud export
- **Real-time Updates** - WebSocket-powered live deliberation
- **Theme Support** - Dark/light themes with auto-switch
- **Mobile Responsive** - Works on all devices

### 🔌 Integrations

#### OpenClaw (Primary)
- ✅ MCP server integration
- ✅ OpenClaw skills
- ✅ Gateway integration
- ✅ Canvas integration
- ✅ Voice/Talk integration
- ✅ Browser integration
- ✅ Cron/automation
- ✅ Notifications
- ✅ Memory integration

#### Cloud Storage
- ✅ Google Drive
- ✅ Dropbox
- ✅ OneDrive
- ✅ AWS S3

#### Communication
- ✅ Slack
- ✅ Discord
- ✅ Microsoft Teams
- ✅ Email
- ✅ SMS (Twilio)

#### Developer Tools
- ✅ GitHub
- ✅ Jira
- ✅ Notion
- ✅ Obsidian
- ✅ GitLab

#### AI Services
- ✅ Alibaba Bailian (Primary)
- ✅ OpenAI
- ✅ Anthropic Claude
- ✅ Google Gemini
- ✅ Hugging Face
- ✅ Ollama (Local)

### 🤝 Multi-Agent Collaboration

- **Agent Registry** - Discover and register AI agents
- **Communication Protocol** - Agent-to-agent messaging
- **Task Delegation** - Delegate subtasks to specialized agents
- **Shared Context** - Unified memory across agents
- **Consensus Mechanisms** - Multi-agent voting and confidence scoring
- **Agent Orchestration** - Coordinate multiple agents
- **Agent Marketplace** - Browse and install agents

### 🌐 Cross-Platform Integrations

- ✅ LangChain Agents
- ✅ AutoGen Agents
- ✅ CrewAI Agents
- ✅ Semantic Kernel
- ✅ LlamaIndex Agents
- ✅ Haystack Agents
- ✅ Custom Agent Protocol (REST, WebSocket, gRPC, GraphQL)
- ✅ Agent Gateway
- ✅ Unified Dashboard

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18 or higher
- npm or yarn
- Alibaba Bailian API key (or other AI provider)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/Franzferdinan51/AI-Bot-Council-Concensus.git
cd AI-Bot-Council-Concensus
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment:**
```bash
cp .env.example .env
# Edit .env and add your API keys
```

4. **Start the server:**
```bash
npm run dev
```

5. **Open in browser:**
```
http://localhost:3003/
```

### Auto-Start Script

```bash
./start-ai-council.sh
```

---

## 🔌 OpenClaw Integration

The AI Council Chamber is fully integrated with OpenClaw.

### MCP Server

AI Council registers automatically with OpenClaw MCP hub.

### OpenClaw Skills

Use AI Council directly from OpenClaw:

```bash
# Start deliberation
openclaw agent --message "council deliberate Should we implement feature X?"

# Check status
openclaw agent --message "council status"

# Export session
openclaw agent --message "council export session_123"

# List sessions
openclaw agent --message "council list sessions"

# Join session
openclaw agent --message "council join session_123"
```

### Gateway Integration

- AI Council registered as OpenClaw agent
- Deliberations route through OpenClaw Gateway
- Sessions sync between systems
- Unified authentication
- Shared memory context

### Canvas Integration

- Deliberation progress displayed on Canvas
- Real-time argument visualization
- Councilor status on Canvas
- Vote results on Canvas
- Export results to Canvas

### Voice/Talk Integration

- Voice-activated deliberations
- Speak deliberation results
- Voice commands for Council
- Talk mode for real-time deliberation

### Browser Integration

- Control OpenClaw browser from Council
- Research mode uses OpenClaw browser
- Share browser sessions
- Collaborative browsing

### Cron/Automation

- Scheduled deliberations via OpenClaw cron
- Automated research tasks
- Recurring council meetings
- Webhook triggers from OpenClaw

### Notifications

- Send deliberation results via OpenClaw channels
- Telegram, Discord, Slack, email notifications

### Memory Integration

- Share memory between systems
- Council learns from OpenClaw conversations
- OpenClaw accesses Council insights
- Unified knowledge base

### Multi-Agent Routing

- Route specific topics to AI Council
- Council as specialized agent for complex decisions
- Fallback to Council for adversarial analysis
- Agent collaboration protocols

---

## 🤝 Agent Integrations

### Multi-Agent Collaboration

- **Agent Registry** - Discover available AI agents
- **Communication Protocol** - Agent-to-agent messaging
- **Task Delegation** - Delegate and receive tasks
- **Shared Context** - Unified memory access
- **Consensus Mechanisms** - Multi-agent voting
- **Agent Orchestration** - Coordinate multiple agents
- **Specialized Roles** - Research, coding, creative, analysis, domain experts
- **Agent Marketplace** - Browse and install agents
- **Collaboration Analytics** - Track success metrics

### Cross-Platform Integrations

- **LangChain** - Agent integration and tool sharing
- **AutoGen** - Group chat and multi-agent debates
- **CrewAI** - Crew integration and role assignment
- **Semantic Kernel** - Plugins and planner integration
- **LlamaIndex** - RAG integration and query engines
- **Haystack** - Pipeline integration and retrieval
- **Custom Protocol** - REST, WebSocket, gRPC, GraphQL
- **Agent Gateway** - Central registry and load balancing
- **Unified Dashboard** - View and monitor all agents

---

## ⚙️ Configuration

### Environment Variables

```bash
# AI Provider (Primary)
BAILIAN_API_KEY=your-bailian-api-key
BAILIAN_ENDPOINT=https://coding-intl.dashscope.aliyuncs.com/v1

# Model Configuration
SPEAKER_MODEL=bailian/qwen3.5-plus
RESEARCH_MODEL=bailian/MiniMax-M2.5
VISION_MODEL=bailian/kimi-k2.5
FAST_MODEL=bailian/glm-5

# Local Fallback (Optional)
LM_STUDIO_ENDPOINT=http://localhost:1234/v1

# Server Configuration
PORT=3003
HOST=0.0.0.0
NODE_ENV=development

# Logging
LOG_LEVEL=info
DISABLE_THOUGHT_LOGGING=false
```

### MCP Configuration

The AI Council Chamber integrates with LM Studio via MCP:

```json
{
  "mcpServers": {
    "ai-council": {
      "url": "http://127.0.0.1:3001/mcp",
      "_auto_connect": true,
      "_default": true,
      "_enabled": true
    }
  }
}
```

---

## 📡 API Documentation

### REST API v2

```bash
# Health check
GET /api/v2/health

# Get councilors
GET /api/v2/councilors

# Start deliberation
POST /api/v2/deliberate
{
  "topic": "Should we implement feature X?",
  "mode": "legislative",
  "councilors": ["technocrat", "ethicist", "skeptic"]
}

# Get session results
GET /api/v2/session/{session_id}

# Export results
POST /api/v2/export
{
  "session_id": "abc123",
  "format": "markdown"
}
```

### GraphQL API

```graphql
# Query sessions
query {
  sessions {
    id
    topic
    mode
    status
    createdAt
  }
}

# Query councilors
query {
  councilors {
    id
    name
    role
    model
  }
}
```

### WebSocket API

```javascript
// Connect to real-time updates
const ws = new WebSocket('ws://localhost:3001/ws');

// Subscribe to session
ws.send(JSON.stringify({
  type: 'subscribe',
  session_id: 'abc123'
}));

// Receive real-time arguments
ws.onmessage = (event) => {
  console.log('New argument:', JSON.parse(event.data));
};
```

### Interactive API Documentation

Access Swagger UI at:
```
http://localhost:3001/api-docs
```

---

## 🖥️ Web UI Guide

### Starting a Deliberation

1. Click **"New Deliberation"** button
2. Select deliberation mode (Legislative, Research, etc.)
3. Select councilors (or use recommended)
4. Enter your topic/question
5. Click **"Start Deliberation"**

### Multi-Session Management

- Click **"+"** tab button to open new session
- Switch between sessions via tabs
- Compare sessions in comparison view
- Close sessions with **"X"** button

### Search & Bookmarks

- Press **Ctrl+K** to open search
- Filter by councilor, date, mode, topic
- Click bookmark icon to save moments
- Access bookmarks from sidebar

### Export Results

- Click **"Export"** button
- Select format (PDF, Markdown, JSON)
- Choose template (optional)
- Click **"Export"**

### Settings

- Click **gear icon** to open settings
- Configure themes, notifications, preferences
- Import/export settings
- Reset to defaults

---

## 🤝 Contributing

We welcome contributions!

### How to Contribute

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

### Development Setup

```bash
# Clone fork
git clone https://github.com/your-username/AI-Bot-Council-Concensus.git

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

---

## 📄 License

MIT License - Free to use, modify, and distribute.

See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [OpenClaw](https://github.com/openclaw/openclaw)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Node.js](https://nodejs.org/)
- [Alibaba Bailian](https://www.aliyun.com/product/bailian)
- [Redis](https://redis.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [Docker](https://www.docker.com/)
- [Kubernetes](https://kubernetes.io/)

---

## 📞 Support

- **Documentation:** See files in this repository
- **Issues:** [GitHub Issues](https://github.com/Franzferdinan51/AI-Bot-Council-Concensus/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Franzferdinan51/AI-Bot-Council-Concensus/discussions)

---

**Built with ❤️ from Huber Heights, OH**

**Copyright © 2026 Felafax, Inc.**

---

## 🏛️ Councilor Archetypes (38 Total)

### Original Councilors (15)
- Speaker, Technocrat, Ethicist, Pragmatist, Skeptic
- Sentinel, Visionary, Historian, Diplomat, Journalist
- Psychologist, Conspiracist, Propagmatist, Moderator, Coder

### Business & Strategy (5) ⭐ NEW
- **Economist** - Financial impact, cost-benefit, market forces, ROI
- **Product Manager** - Product strategy, roadmap, prioritization, user value
- **Marketing Expert** - Go-to-market, positioning, messaging, brand
- **Finance Expert** - Budget, financial planning, cash flow, funding
- **Risk Manager** - Enterprise risk, mitigation strategies, risk assessment

### Technical & Engineering (6) ⭐ NEW
- **DevOps Engineer** - Infrastructure, scalability, deployment, monitoring, SRE
- **Security Expert** - Cybersecurity, threat modeling, security best practices
- **Data Scientist** - Data analysis, ML/AI implications, metrics, analytics
- **Performance Engineer** - Performance optimization, bottlenecks, profiling
- **Quality Assurance** - Testing strategy, edge cases, quality standards
- **Solutions Architect** - System design, integration patterns, enterprise architecture

### User & Community (4) ⭐ NEW
- **User Advocate** - User experience, accessibility, user needs, pain points
- **Customer Support** - Customer pain points, support burden, documentation
- **Community Manager** - Community impact, open source considerations, feedback
- **Accessibility Expert** - WCAG compliance, inclusive design, assistive technology

### Compliance & Legal (3) ⭐ NEW
- **Legal Expert** - Compliance, regulations, liability, legal risks, contracts
- **Compliance Officer** - Regulatory compliance, audits, standards, certifications
- **Privacy Officer** - Data privacy, GDPR, CCPA, privacy by design

### Innovation & Culture (5) ⭐ NEW
- **Innovation Coach** - Creative thinking, breakthrough ideas, disruption
- **HR Specialist** - Team impact, hiring, organizational culture, change management
- **Environmental Specialist** - Sustainability, environmental impact, green tech
- **Ethics Philosopher** - Deep ethical analysis, moral frameworks, philosophical perspectives

**Total: 38 specialized councilors for comprehensive deliberation!**

See [COUNCILORS.md](COUNCILORS.md) for complete councilor guide.

---

---

## 🎯 Smart Councilor Selection

**Important:** The AI Council automatically selects the most relevant councilors for each decision - you don't need to run all 38 every time!

### Selection Tiers

#### Quick Review (3-5 councilors)
- **Use for:** Simple decisions, quick feedback
- **Councilors:** Speaker + 4 core (Technocrat, Ethicist, Skeptic, Pragmatist)
- **API Calls:** ~5
- **Response Time:** Fast (<30s)
- **Cost:** ~$0.01-0.05

#### Standard Review (7-10 councilors) ⭐ **DEFAULT**
- **Use for:** Most decisions, feature reviews
- **Councilors:** Core 5 + specialists based on topic
- **API Calls:** ~7-10
- **Response Time:** Moderate (30-60s)
- **Cost:** ~$0.02-0.10

#### Comprehensive Review (12-15 councilors)
- **Use for:** Major decisions, architecture reviews
- **Councilors:** Core + domain experts
- **API Calls:** ~12-15
- **Response Time:** Slower (60-90s)
- **Cost:** ~$0.05-0.20

#### Full Deliberation (20+ councilors)
- **Use for:** Critical decisions, company-wide impact
- **Councilors:** All relevant councilors
- **API Calls:** 20+
- **Response Time:** Slow (90s+)
- **Cost:** ~$0.10-0.50+

### Automatic Selection

The AI Council automatically selects councilors based on your topic:

**Business Decision** → Economist, Product Manager, Finance Expert, Risk Manager  
**Technical Decision** → Solutions Architect, DevOps Engineer, Security Expert  
**Security Review** → Security Expert, Sentinel, Risk Manager, Legal Expert  
**UX Decision** → User Advocate, Accessibility Expert, Customer Support  
**Compliance** → Legal Expert, Compliance Officer, Privacy Officer  
**Innovation** → Innovation Coach, Visionary, Conspiracist  

### Manual Selection

You can also manually select councilors:

```bash
# Select specific councilors
council deliberate "topic" --councilors "Speaker,Technocrat,Ethicist,Skeptic,Pragmatist,Sentinel"

# Use preset
council deliberate "topic" --preset quick    # 5 councilors
council deliberate "topic" --preset standard # 7-10 councilors
council deliberate "topic" --preset comprehensive # 12-15 councilors
```

### Cost Optimization

**Default behavior:** 7-10 councilors (Standard Review)

This provides the best balance of:
- ✅ Diverse perspectives
- ✅ Reasonable API cost
- ✅ Fast response time
- ✅ Manageable context size

**Save money by:**
- Using Quick Review for simple questions
- Using Standard Review for most decisions (default)
- Using Comprehensive only for major decisions
- Avoiding Full Deliberation unless critical

See [COUNCILOR-SELECTION.md](COUNCILOR-SELECTION.md) for complete selection guide.

---

---

## 🧠 Advanced Topic Analysis

The AI Council uses intelligent topic analysis to automatically select the most relevant councilors.

### Topic Analysis Process

1. **Keyword Extraction** - Identify key terms and domain terminology
2. **Category Classification** - Primary and secondary categories
3. **Impact Assessment** - Scope, urgency, risk, cost, user impact
4. **Councilor Selection** - Core + specialists + impact-based additions

### Topic Categories

**Business & Strategy**
- Keywords: revenue, cost, ROI, market, competition, investment, budget, strategy
- Auto-Select: Economist, Product Manager, Finance Expert, Risk Manager

**Technical & Architecture**
- Keywords: architecture, microservices, API, database, cloud, infrastructure, scalability
- Auto-Select: Solutions Architect, DevOps Engineer, Performance Engineer, Security Expert

**Security & Compliance**
- Keywords: security, vulnerability, threat, compliance, GDPR, audit, privacy, encryption
- Auto-Select: Security Expert, Sentinel, Risk Manager, Legal Expert, Compliance Officer

**User Experience & Design**
- Keywords: UX, UI, design, user, customer, accessibility, usability, interface
- Auto-Select: User Advocate, Accessibility Expert, Customer Support, Psychologist

**Product & Features**
- Keywords: feature, product, roadmap, release, launch, MVP, beta, prioritize
- Auto-Select: Product Manager, User Advocate, Economist, Marketing Expert

**Innovation & Research**
- Keywords: innovation, research, experiment, breakthrough, disruption, AI, ML
- Auto-Select: Innovation Coach, Visionary, Conspiracist, Data Scientist

**Team & Organization**
- Keywords: team, hiring, culture, org, management, leadership, remote, diversity
- Auto-Select: HR Specialist, Ethicist, Legal Expert, Community Manager

**Legal & Regulatory**
- Keywords: legal, contract, agreement, policy, regulation, compliance, lawsuit
- Auto-Select: Legal Expert, Compliance Officer, Risk Manager, Privacy Officer

**Environmental & Social**
- Keywords: environment, sustainability, carbon, green, climate, social, ESG, ethical
- Auto-Select: Environmental Specialist, Ethics Philosopher, Legal Expert

### Impact-Based Scaling

| Impact Level | Criteria | Councilors | Use For |
|-------------|----------|------------|---------|
| **Low** | <10 people, <$1K, reversible | 5-7 | Simple questions |
| **Medium** ⭐ | 10-100 people, $1K-10K | 7-10 | Most decisions (DEFAULT) |
| **High** | 100-1000 people, $10K-100K | 10-15 | Major decisions |
| **Critical** | 1000+ people, >$100K | 15-20+ | Critical decisions |

### Smart Presets

```bash
# Balanced (default) - 7-10 councilors
council deliberate "topic" --preset balanced

# Conservative - 10-15 councilors (more risk-averse)
council deliberate "topic" --preset conservative

# Innovative - 7-10 councilors (more creative)
council deliberate "topic" --preset innovative

# Technical - 7-10 councilors (technical focus)
council deliberate "topic" --preset technical

# Business - 7-10 councilors (business focus)
council deliberate "topic" --preset business

# Security - 10-12 councilors (security focus)
council deliberate "topic" --preset security

# Minimal - 3-5 councilors (fastest)
council deliberate "topic" --preset minimal

# Thorough - 15-20 councilors (comprehensive)
council deliberate "topic" --preset thorough
```

### Topic Analysis Examples

**"Should we migrate to microservices?"**
- Categories: Technical (primary), Business (secondary)
- Impact: High (costly, hard to reverse)
- Auto-Selected: 13 councilors (Solutions Architect, DevOps, Performance, Economist, etc.)

**"Is our feature GDPR compliant?"**
- Categories: Compliance (primary), Legal (primary)
- Impact: High (regulatory risk)
- Auto-Selected: 12 councilors (Legal Expert, Compliance Officer, Privacy Officer, etc.)

**"Fix the login bug"**
- Categories: Technical (primary), UX (secondary)
- Impact: Low (reversible)
- Auto-Selected: 5 councilors (Coder, User Advocate, core councilors)

See [ADVANCED-TOPIC-SELECTION.md](ADVANCED-TOPIC-SELECTION.md) for complete topic analysis guide.

---
