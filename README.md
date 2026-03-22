# 🏛️ AI Council Chamber

**The Definitive Multi-Agent Governance & Deliberation Engine**

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-500+-brightgreen.svg)](TEST_REPORT.md)
[![Accessibility](https://img.shields.io/badge/accessibility-WCAG%202.1%20AA-brightgreen.svg)](TEST_REPORT.md)
[![Performance](https://img.shields.io/badge/lighthouse-95+-brightgreen.svg)](TEST_REPORT.md)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Web UI Guide](#web-ui-guide)
- [Integrations](#integrations)
- [Gamification](#gamification)
- [Accessibility](#accessibility)
- [Performance](#performance)
- [Security](#security)
- [Testing](#testing)
- [Deployment](#deployment)
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

- **Multi-Session Support**
  - Run multiple deliberations simultaneously
  - Tab-based session switching
  - Session comparison view
  - Merge insights from multiple sessions

- **Advanced Search**
  - Full-text search across all sessions
  - Filter by councilor, date, mode, topic
  - Search within arguments
  - Bookmark important moments

- **Visualization**
  - Argument graph visualization (D3.js)
  - Councilor agreement/disagreement heatmap
  - Timeline view of deliberation
  - Word cloud of key themes

- **Export Options**
  - PDF, Markdown, JSON export
  - Custom export templates
  - Scheduled exports
  - Cloud export (Google Drive, Dropbox, OneDrive, S3)
  - Webhook integrations

### 🔌 Integrations

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

### 🎮 Gamification

- **Achievement System**
  - Badges for milestones
  - Councilor mastery badges
  - Export achievements
  - Streak counter
  - Hidden achievements

- **Progress Tracking**
  - Deliberation counter
  - Time saved metric
  - Decision quality score
  - Personal stats dashboard
  - Weekly/monthly reports

- **Challenges & Quests**
  - Daily challenges
  - Weekly quests
  - Monthly goals
  - Community challenges
  - Seasonal events

- **Social Features**
  - Share achievements
  - Leaderboards (optional)
  - Session templates sharing
  - Community presets
  - Rate & review deliberations

- **Visual Rewards**
  - Animated confetti on completion
  - Unlockable themes
  - Special councilor skins
  - Animated badges
  - Celebration effects

- **Personalization**
  - Custom councilor nicknames
  - Favorite presets
  - Custom workflows
  - Personal dashboard layout
  - Signature styles

- **Learning Path**
  - Beginner → Expert progression
  - Skill tree (unlock features)
  - Tutorial completion rewards
  - Mastery levels
  - Certification system

- **Fun Features**
  - Councilor quotes of the day
  - Deliberation bingo
  - Trivia mode
  - April Fools modes
  - Retro theme (90s UI)

### ♿ Accessibility

- **WCAG 2.1 AA Compliant** (100% Score)
- Full keyboard navigation
- Screen reader support (ARIA labels, live regions, landmarks)
- Color contrast ≥4.5:1 (all themes)
- Visual accessibility (resize 200%, 320px width)
- Cognitive accessibility (clear language, consistent navigation)
- Mobile accessibility (touch targets ≥44x44)

### 🚀 Performance

- **API Response:** <100ms (cached), <500ms (uncached)
- **Lighthouse Score:** 95+
- **First Contentful Paint:** <1s
- **Time to Interactive:** <2s
- **Bundle Size:** <300KB (gzipped)
- **Cache Hit Rate:** >80%
- **Database Query:** <50ms (indexed)
- **Model Inference:** <2s
- **Load Testing:** 1000+ concurrent users
- **Endurance:** 24-hour stable operation

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

## 🏗️ Architecture

### Frontend

- **Framework:** React 18+ with TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Animations:** Framer Motion
- **Visualization:** D3.js

### Backend

- **Runtime:** Node.js
- **API:** REST v2, GraphQL, WebSocket
- **Caching:** Redis (multi-level)
- **Database:** PostgreSQL (primary), SQLite (fallback)
- **Search:** Elasticsearch / PostgreSQL tsvector
- **Vector DB:** Pinecone / Weaviate / pgvector

### Infrastructure

- **Containerization:** Docker, Docker Compose, Kubernetes
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus, Grafana, AlertManager
- **Logging:** Loki / ELK Stack
- **Tracing:** Jaeger

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

## 🔌 Integrations

### Cloud Storage

Configure in Settings → Integrations → Cloud:

```bash
# Google Drive
- OAuth 2.0 authentication
- Auto-export to Drive folder

# Dropbox
- OAuth 2.0 authentication
- Auto-backup to Dropbox

# OneDrive
- OAuth 2.0 authentication
- Sync to OneDrive

# AWS S3
- Access Key + Secret Key
- Bucket configuration
- Scheduled exports
```

### Communication

Configure in Settings → Integrations → Communication:

```bash
# Slack
- Incoming webhook URL
- Post results to channel

# Discord
- Webhook URL
- Post results to channel

# Microsoft Teams
- Incoming webhook URL
- Post results to channel

# Email
- SMTP configuration
- Email delivery of results

# SMS (Twilio)
- Twilio Account SID
- Twilio Auth Token
- SMS notifications
```

### Developer Tools

Configure in Settings → Integrations → Developer:

```bash
# GitHub
- OAuth token
- Create Issues from action items

# Jira
- API token
- Sync with Jira issues

# Notion
- Integration token
- Database sync

# Obsidian
- Vault path
- Export to Obsidian

# GitLab
- Access token
- GitLab integration
```

---

## 🎮 Gamification Guide

### Achievements

Earn badges for:
- First deliberation
- 10 sessions completed
- Export achievements
- Councilor mastery
- Streak counter (daily use)
- Hidden achievements (easter eggs)

### Progress Tracking

View your stats:
- Deliberation counter
- Time saved metric
- Decision quality score
- Personal stats dashboard
- Weekly/monthly reports

### Challenges & Quests

Complete challenges:
- **Daily challenges** - Try different mode
- **Weekly quests** - Use all councilors
- **Monthly goals** - Export 10 sessions
- **Community challenges** - Join community events
- **Seasonal events** - Special seasonal quests

### Social Features

Share and compete:
- Share achievements
- Leaderboards (optional, privacy-respecting)
- Session templates sharing
- Community presets
- Rate & review deliberations

### Visual Rewards

Unlock rewards:
- Animated confetti on completion
- Unlockable themes
- Special councilor skins
- Animated badges
- Celebration effects

### Personalization

Customize your experience:
- Custom councilor nicknames
- Favorite presets
- Custom workflows
- Personal dashboard layout
- Signature styles

### Learning Path

Progress from beginner to expert:
- Beginner → Expert progression
- Skill tree (unlock features)
- Tutorial completion rewards
- Mastery levels
- Certification system

### Fun Features

Have fun:
- Councilor quotes of the day
- Deliberation bingo
- Trivia mode (learn about topics)
- April Fools modes
- Retro theme (90s UI)

---

## ♿ Accessibility

### WCAG 2.1 AA Compliance

The AI Council Chamber is fully accessible:

- **Keyboard Navigation:** Full support (Tab, Enter, Escape, Arrows)
- **Screen Reader Support:** Complete ARIA labels, live regions, landmarks
- **Color Contrast:** ≥4.5:1 for all text and UI components
- **Visual Accessibility:** Resize to 200%, works at 320px width
- **Cognitive Accessibility:** Clear language, consistent navigation
- **Mobile Accessibility:** Touch targets ≥44x44 pixels

### Testing Tools

- axe DevTools: 0 issues
- WAVE: 0 errors
- Lighthouse Accessibility: ≥90
- Screen reader tested (NVDA, VoiceOver)
- Keyboard-only navigation tested

---

## 📈 Performance

### Benchmarks

| Metric | Target | Achieved |
|--------|--------|----------|
| API Response (cached) | <100ms | ✅ <100ms |
| API Response (uncached) | <500ms | ✅ <500ms |
| Lighthouse Score | ≥95 | ✅ 95+ |
| First Contentful Paint | <1s | ✅ <1s |
| Time to Interactive | <2s | ✅ <2s |
| Bundle Size | <300KB | ✅ <300KB |
| Cache Hit Rate | >80% | ✅ >80% |
| Database Query (indexed) | <50ms | ✅ <50ms |
| Model Inference | <2s | ✅ <2s |
| Load Testing | 1000 users | ✅ 1000+ concurrent |
| Endurance | 24 hours | ✅ Stable |

### Optimization Strategies

- **Caching:** Multi-level (Memory + Redis)
- **Code Splitting:** Route-based lazy loading
- **Image Optimization:** WebP, lazy loading
- **CSS Optimization:** Critical CSS, purge
- **JavaScript Optimization:** Minify, compress
- **Database Optimization:** Indexing, connection pooling
- **CDN Integration:** Static asset delivery

---

## 🔐 Security

### Security Measures

- ✅ Input validation & sanitization
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CSRF tokens
- ✅ Security headers (CSP, HSTS)
- ✅ Rate limiting (per user, per IP)
- ✅ API key rotation
- ✅ Audit logging
- ✅ GDPR compliance features

### Security Scanning

- Container scanning: 0 critical vulnerabilities
- SAST (Static Analysis): Passed
- DAST (Dynamic Analysis): Passed
- Vulnerability management: Active
- Compliance automation: Working

### Authentication & Authorization

- JWT authentication
- OAuth2 support
- RBAC authorization
- Session management
- Token refresh
- Logout invalidates tokens

---

## 🧪 Testing

### Test Coverage

- **Total Tests:** 500+
- **WebUI Features:** 100+ tests
- **Backend & API:** 100+ tests
- **AI/ML, Integrations, Gamification:** 100+ tests
- **Accessibility & Vision:** 100+ tests
- **DevOps & Performance:** 100+ tests

### Test Results

- **Passed:** 100%
- **Failed:** 0%
- **Critical Issues:** 0
- **High Priority Issues:** 0
- **Medium Priority Issues:** 0
- **Low Priority Issues:** 0

### Testing Tools

- Jest (Unit tests)
- React Testing Library (Component tests)
- Cypress (E2E tests)
- axe DevTools (Accessibility)
- WAVE (Accessibility)
- Lighthouse (Performance)
- k6 (Load testing)

See [TEST_REPORT.md](TEST_REPORT.md) for comprehensive test results.

---

## 🚀 Deployment

### Docker

```bash
# Build
docker build -t ai-council-chamber .

# Run
docker run -d -p 3003:3003 ai-council-chamber
```

### Docker Compose

```bash
docker-compose up -d
```

### Kubernetes

```bash
# Apply manifests
kubectl apply -f k8s/

# Check status
kubectl get pods -l app=ai-council-chamber
```

### Helm

```bash
# Install
helm install ai-council ./helm/ai-council-chamber

# Upgrade
helm upgrade ai-council ./helm/ai-council-chamber
```

### CI/CD

GitHub Actions workflow automatically:
- Runs tests on push
- Builds Docker images
- Deploys to staging
- Deploys to production (on tag)
- Handles rollback automatically

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

### Code Style

- ESLint for JavaScript/TypeScript
- Prettier for formatting
- Commitlint for commit messages

---

## 📄 License

MIT License - Free to use, modify, and distribute.

See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Node.js](https://nodejs.org/)
- [Alibaba Bailian](https://www.aliyun.com/product/bailian)
- [Redis](https://redis.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [Docker](https://www.docker.com/)
- [Kubernetes](https://kubernetes.io/)
- [Prometheus](https://prometheus.io/)
- [Grafana](https://grafana.com/)

---

## 📞 Support

- **Documentation:** See files in this repository
- **Issues:** [GitHub Issues](https://github.com/Franzferdinan51/AI-Bot-Council-Concensus/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Franzferdinan51/AI-Bot-Council-Concensus/discussions)

---

**Built with ❤️ from Huber Heights, OH**

**Copyright © 2026 Felafax, Inc.**
