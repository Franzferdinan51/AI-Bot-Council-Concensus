# Agent Swarm Skill

**Spawn coordinated teams of specialized AI agents for any task.**

---

## Trigger Phrases

- `swarm build <task>`
- `swarm game <task>`
- `swarm research <task>`
- `swarm audit <task>`
- `swarm mobile <task>`
- `swarm data <task>`
- `start a swarm`
- `dispatch a swarm`
- `run agent swarm`

---

## What It Does

The Agent Swarm System classifies your task, selects the right specialized agents, splits the work into parallel subtasks, and dispatches them all simultaneously. Results are aggregated into a final deliverable.

---

## Swarm Types

### 🏗️ swarm build — Build Apps/Services
**Keywords detected:** build, create, develop, implement, app, website, API, backend, frontend, full-stack, REST, database

**Example:** `"swarm build a task management REST API with React frontend"`

**Agents:** architect + backend-dev + frontend-dev + devops-eng + security-eng + qa-engineer + ...

---

### 🎮 swarm game — Game Development
**Keywords detected:** game, gaming, playtest, gameplay, NPC, level design, shader, unity, unreal, godot, roguelike, platformer, FPS, RPG

**Example:** `"swarm game dev a 2D roguelike platformer"`

**Agents:** creative-director + technical-director-game + producer-game + game-designer + lead-programmer + art-director-game + ...

---

### 🔬 swarm research — Research & Analysis
**Keywords detected:** research, analyze, investigate, study, survey, explore, compare, evaluate

**Example:** `"swarm research AI agent frameworks"`

**Agents:** research-lead + data-lead + ux-researcher + security-lead + technical-writer + ...

---

### 🔒 swarm audit — Security & Quality Audit
**Keywords detected:** audit, review, security, vulnerability, penetration, test, assess, check

**Example:** `"swarm audit my codebase"`

**Agents:** security-eng + reliability-engineer + qa-engineer + security-lead + ...

---

### 📱 swarm mobile — Mobile App Development
**Keywords detected:** ios, android, mobile app, react native, flutter, swiftui, kotlin

**Example:** `"swarm mobile build a fitness tracking app"`

**Agents:** mobile-specialist + architect + react-native-specialist + swiftui-specialist + ...

---

### 📊 swarm data — Data & ML Projects
**Keywords detected:** data pipeline, ETL, dashboard, analytics, machine learning, ML, model training

**Example:** `"swarm data build a real-time analytics pipeline"`

**Agents:** data-lead + ml-engineer + data-engineer + airflow-specialist + llm-specialist + ...

---

## Usage Examples

### Tell me directly:
```
swarm build a REST API for task management
swarm game dev a roguelike
swarm research AI agents
swarm audit my code
swarm build a mobile app --count 5
swarm data create an analytics pipeline
```

### Or describe what you want:
```
I need to build a full-stack app with React and Node.js
Make a 2D roguelike platformer game
Research the best AI agent frameworks
Audit our codebase for security vulnerabilities
Build a Flutter mobile app for fitness tracking
Create a data pipeline for real-time analytics
```

---

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--count N` | Number of agents to spawn (1-15) | 5 |
| `--domain` | Force a specific domain | Auto-detected |

**Examples:**
```
swarm build a REST API --count 8
swarm game dev a platformer --count 10
swarm audit my code --count 3
```

---

## What Happens

1. **I classify** your task → detects domain (game/build/research/audit/mobile/data)
2. **I select agents** → picks specialists matching your task
3. **I split the work** → each agent gets a focused subtask
4. **I spawn sub-agents** → they work in parallel on their pieces
5. **I aggregate** → collect all outputs and synthesize a final result

---

## Swarm Sizes

| Size | Agents | Best For |
|------|--------|----------|
| Small (3) | Tier 1 only | Quick decisions, strategic direction |
| Medium (5) | Tier 1 + Tier 2 | Standard tasks, most projects |
| Large (8) | All tiers | Complex projects, full builds |
| XL (12+) | All tiers + specialists | Game dev, large audits |

---

## Domain Detection

If you don't specify a domain, I auto-detect based on keywords:

| Contains... | → Domain |
|-------------|----------|
| game, gaming, level design, shader, unity, unreal | `game` |
| research, analyze, investigate, compare | `research` |
| audit, security, vulnerability, penetration | `audit` |
| ios, android, mobile app, react native, flutter | `mobile` |
| data pipeline, ETL, dashboard, ML, analytics | `data` |
| build, create, develop, app, website, API | `build` |
| (nothing matched) | `general` |

---

## Agent Tiers

| Tier | Role | Model | Cost |
|------|------|-------|------|
| **Tier 1** | Strategic / Directors | qwen3.5-plus | 18K/mo quota |
| **Tier 2** | Tactical / Leads | glm-5 | API credits |
| **Tier 3** | Execution / Specialists | MiniMax-M2.5 | FREE unlimited |

---

## Examples with Expected Output

### `"swarm build a REST API"`
→ architect designs system → backend writes API code → frontend builds UI → devops sets up deployment → security reviews → QA writes tests

### `"swarm game dev a roguelike"`
→ creative-director defines vision → technical-director picks engine → producer scopes timeline → game-designer designs mechanics → lead-programmer plans architecture

### `"swarm research AI agents"`
→ research-lead surveys landscape → data-lead analyzes metrics → ux-researcher reviews usability → security-lead assesses risks → technical-writer compiles report

### `"swarm audit my code"`
→ security-eng finds vulnerabilities → reliability-engineer checks infra → qa-engineer reviews test coverage → security-lead provides strategic review

---

## Adding Custom Swarms

You can request any combination:
```
swarm build <task> with react-specialist, fastapi-specialist, and postgresql-specialist
swarm game dev <task> with gameplay-programmer, systems-designer, and economy-designer
swarm research <task> focused on llm-specialist and technical-writer
```

---

## Integration

- **AI Council Chamber:** Swarm results can be fed into council deliberation modes for adversarial review
- **Agent Registry:** 133 agents defined in `agent-registry.json`
- **Orchestrator:** `swarm-orchestrator.py` handles classification, selection, and dispatch
- **Plans:** Each swarm run saves a JSON plan to `plans/` for audit/replay

---

## Limitations

- Max 15 agents per swarm (prevents overwhelming the system)
- Sub-agents depend on Bailian API availability
- Complex tasks may require multiple swarm runs (e.g., one for planning, one for implementation)
- Game dev swarms are design-focused by default; code generation requires additional prompting

---

## File Locations

| File | Purpose |
|------|---------|
| `agent-registry.json` | All agent definitions |
| `swarm-orchestrator.py` | Main orchestration engine |
| `plans/*.json` | Saved swarm run plans |
| `agents/coding/README.md` | Full coding agent reference |
| `README.md` | Full system documentation |
