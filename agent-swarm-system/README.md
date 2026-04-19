# 🐝 Agent Swarm System

**133+ specialized AI agents working together on your tasks.**

A proper swarm orchestration system built for OpenClaw — not a simulation, but real sub-agents coordinated by a central brain.

---

## Overview

The Agent Swarm System turns complex tasks into coordinated work by multiple specialized agents. Instead of one general-purpose AI doing everything badly, you get a team of experts — each focused on their domain — working in parallel and combining their output.

### Key Concepts

- **Agent Registry** — 133 agents across 4 domains (general, game, coding, industry)
- **Swarm Orchestrator** — Classifies tasks and dispatches the right agents
- **Tier System** — Tier 1 (strategic) → Tier 2 (tactical) → Tier 3 (execution)
- **Model Routing** — Uses Bailian models per AGENTS.md policy (qwen3.5-plus, glm-5, MiniMax-M2.5)

---

## Quick Start

### Run a Swarm

```bash
cd /Users/duckets/.openclaw/workspace/agent-swarm-system
python3 swarm-orchestrator.py "build a REST API for task management"
python3 swarm-orchestrator.py "make a 2D roguelike platformer" --count 8
python3 swarm-orchestrator.py "research AI agent frameworks"
python3 swarm-orchestrator.py "audit our codebase for security" --domain audit
```

### Or Just Tell DuckBot:

```
swarm build a REST API for task management
swarm game dev a roguelike
swarm research AI agents
swarm audit my code
swarm build a mobile app --count 5
```

---

## Swarm Types

### 🏗️ `swarm build` — Build an App/Service
**Agents:** architect + backend-dev + frontend-dev + devops-eng + security-eng + qa-engineer + database-specialist + ...

**Example:** `"build a task management REST API with React frontend"`

**What happens:**
1. Architect designs the system
2. Backend writes server code + DB schema
3. Frontend builds the UI
4. DevOps sets up CI/CD
5. Security reviews for vulnerabilities
6. QA writes tests

---

### 🎮 `swarm game` — Game Development
**Agents:** creative-director + technical-director + producer + game-designer + lead-programmer + art-director + ...

**Example:** `"make a 2D roguelike platformer" --count 8`

**What happens (6-layer workflow):**
1. Layer 1: Studio Leadership (creative vision, tech feasibility, scope)
2. Layer 2: Technical Division (gameplay, engine, physics, networking)
3. Layer 3: Art & Audio (characters, environments, audio)
4. Layer 4: Design (systems, levels, narrative)
5. Layer 5: Production & QA
6. Layer 6: Business & Marketing (near launch)

---

### 🔬 `swarm research` — Research & Analysis
**Agents:** research-lead + data-lead + ux-researcher + security-lead + technical-writer + ...

**Example:** `"research AI agent frameworks"`

**What happens:**
1. Research Lead surveys the landscape
2. Data Lead analyzes metrics/data
3. UX Researcher reviews user considerations
4. Security Lead assesses risks
5. Technical Writer compiles findings

---

### 🔒 `swarm audit` — Security & Quality Audit
**Agents:** security-eng + reliability-engineer + qa-engineer + security-lead + architect + ...

**Example:** `"audit our codebase for security" --domain audit`

**What happens:**
1. Security Engineer finds vulnerabilities
2. SRE audits reliability/infrastructure
3. QA Engineer checks test coverage
4. Security Lead provides strategic review

---

### 📱 `swarm mobile` — Mobile App Development
**Agents:** mobile-specialist + architect + react-native-specialist + swiftui-specialist + ...

**Example:** `"build a Flutter mobile app" --domain mobile`

---

### 📊 `swarm data` — Data & ML Projects
**Agents:** data-lead + ml-engineer + data-engineer + airflow-specialist + llm-specialist + ...

**Example:** `"build a data pipeline for analytics" --domain data`

---

## Agent Registry

### General Purpose (Tier 1 — Strategic)

| Agent | Model | Role |
|-------|-------|------|
| architect | qwen3.5-plus | System design, technology selection |
| tech-director | qwen3.5-plus | Technology strategy, stack decisions |
| product-director | qwen3.5-plus | Product strategy, roadmap |
| operations-director | qwen3.5-plus | DevOps strategy, process efficiency |

### General Purpose (Tier 2 — Tactical)

| Agent | Model | Role |
|-------|-------|------|
| backend-dev | glm-5 | API design, database, server logic |
| frontend-dev | glm-5 | UI, components, state management |
| devops-eng | glm-5 | CI/CD, deployment, infrastructure |
| security-eng | glm-5 | Security audits, vulnerability assessment |
| qa-engineer | glm-5 | Test strategy, test generation |
| security-lead | glm-5 | Security strategy, threat modeling |
| data-lead | glm-5 | Data strategy, analytics, ML platform |
| product-lead | glm-5 | Requirements, user stories |
| research-lead | glm-5 | Market research, competitive analysis |

### Coding Specialists (Tier 3 — Execution)

| Subdomain | Agents |
|-----------|--------|
| **Web Frontend** | react-specialist, vue-specialist, svelte-specialist, angular-specialist, typescript-specialist, tailwindcss-specialist, animation-specialist, ux-engineer |
| **Web Backend** | nodejs-specialist, express-specialist, fastapi-specialist, django-specialist, flask-specialist, nestjs-specialist, golang-specialist, rust-web-specialist, spring-specialist, elixir-specialist, dotnet-specialist, graphql-specialist |
| **Mobile** | react-native-specialist, flutter-specialist, swiftui-specialist, uikit-specialist, kotlin-specialist |
| **Database** | postgresql-specialist, mongodb-specialist, redis-specialist, dynamodb-specialist, elasticsearch-specialist |
| **Cloud/DevOps** | aws-specialist, gcp-specialist, azure-specialist, kubernetes-specialist, docker-specialist, terraform-specialist, ci-cd-specialist, monitoring-specialist, serverless-specialist |
| **Data/ML** | python-data-specialist, pytorch-specialist, sklearn-specialist, pandas-specialist, airflow-specialist, llm-specialist, mlops-specialist |
| **Systems** | linux-specialist, network-specialist, bash-scripting-specialist, python-automation-specialist, git-specialist, performance-specialist, distributed-systems-specialist, microservices-specialist, api-design-specialist, websocket-specialist, testing-specialist |
| **Security** | appsec-specialist, penetration-testing-specialist, cryptography-specialist, oauth-specialist, devsecops-specialist |
| **Industry** | ecommerce-specialist, saas-specialist, fintech-specialist, iot-specialist, blockchain-specialist, automation-specialist, raspberry-pi-specialist, crypto-specialist, media-specialist, audio-specialist, openclaw-specialist |

### Game Development (48 agents)

Full studio hierarchy from Tier 1 (Directors) → Tier 2 (Department Leads) → Tier 3 (Specialists). See [SWARM-GAME-STUDIO.md](https://github.com/Franzferdinan51/Claude-Code-Game-Studios) for full details.

---

## Model Routing (Bailian Policy)

| Tier | Model | Cost | Use For |
|------|-------|------|---------|
| Tier 1 | `bailian/qwen3.5-plus` | 18K/mo quota | Strategic decisions, architecture, complex reasoning |
| Tier 2 | `bailian/glm-5` | API credits | Framework expertise, coding, mid-complexity |
| Tier 3 | `bailian/MiniMax-M2.5` | FREE unlimited | Quick tasks, scripting, documentation |

---

## Architecture

```
agent-swarm-system/
├── agent-registry.json       # All 133 agents with metadata
├── swarm-orchestrator.py    # Main orchestration engine
├── plans/                   # Saved swarm plans (JSON)
│   └── plan-xxxxxx.json     # Individual plan files
├── agents/
│   ├── game/                # Game dev agents (from Claude-Code-Game-Studios)
│   ├── general/             # General purpose agents
│   └── coding/              # Coding specialty agents
└── README.md
```

---

## How the Orchestrator Works

1. **Classify** — Analyzes task text to detect domain (game/build/research/audit/mobile/data)
2. **Select** — Picks the right agents based on domain + requested count
3. **Split** — Breaks the task into agent-specific subtasks with role instructions
4. **Dispatch** — Saves a JSON plan, then I spawn each agent via `sessions_spawn`
5. **Aggregate** — Collects results from all agents and synthesizes a final response

---

## Adding Custom Agents

Edit `agent-registry.json` and add an entry:

```json
"my-specialist": {
  "name": "My Specialist",
  "tier": 3,
  "domain": "coding",
  "subdomain": "frontend",
  "model": "bailian/MiniMax-M2.5",
  "role": "What this agent does",
  "delivers": ["Deliverable 1", "Deliverable 2"],
  "quality_focus": ["Quality area 1", "Quality area 2"]
}
```

---

## Integration with AI Council Chamber

The Swarm System integrates with the AI Council Chamber deliberation engine at:
`/Users/duckets/.openclaw/workspace/ai-council-chamber/`

The AI Council provides:
- Adversarial deliberation modes
- Multi-persona governance
- Real-time agent coordination

The Swarm System provides:
- Parallel task execution
- Specialized coding agents
- Production code delivery

---

## Skills Integration

See `SKILL.md` for how to invoke swarms directly from DuckBot.

---

## Examples

### Example 1: Full-Stack Web App

```bash
python3 swarm-orchestrator.py "build a task management web app with React and Node.js" --count 8
```

**Agents spawned:** architect, backend-dev, frontend-dev, devops-eng, security-eng, qa-engineer, database-specialist, api-specialist

---

### Example 2: Indie Game Prototype

```bash
python3 swarm-orchestrator.py "make a 2D roguelike platformer for PC" --count 6
```

**Agents spawned:** creative-director, technical-director-game, producer-game, game-designer, lead-programmer, gameplay-programmer

---

### Example 3: Security Audit

```bash
python3 swarm-orchestrator.py "audit our authentication system" --domain audit
```

**Agents spawned:** security-eng, reliability-engineer, qa-engineer, security-lead

---

### Example 4: Data Pipeline

```bash
python3 swarm-orchestrator.py "build a real-time analytics data pipeline" --domain data --count 6
```

**Agents spawned:** data-lead, ml-engineer, data-engineer, airflow-specialist, llm-specialist, python-data-specialist

---

## Troubleshooting

**"No agents found for domain"**
→ The task will default to `general` domain. Try specifying `--domain` explicitly.

**"Too many agents"**
→ Use `--count N` to limit. Default is 5, max recommended is 12.

**"Wrong agents selected"**
→ Check the keyword classification in `swarm-orchestrator.py`. You can force a domain with `--domain`.

**"Sub-agents not responding"**
→ Check that OpenClaw Gateway is running and Bailian API is accessible.

---

## Credits

- **Game Dev Agents:** Based on [Claude-Code-Game-Studios](https://github.com/Franzferdinan51/Claude-Code-Game-Studios) by Donchitos
- **Orchestration:** Built for OpenClaw with Bailian model routing
- **DuckBot:** Primary operator

---

*Last updated: March 26, 2026*
