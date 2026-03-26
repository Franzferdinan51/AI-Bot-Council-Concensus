# What We Build — Project Brief

**Multi-Agent AI Orchestration Systems**

---

## The Short Version

We build AI agent systems that coordinate multiple specialized AI agents to do real work — not just chat with one AI, but orchestrate teams of agents that deliberate, vote, build, automate, and ship.

Think of it like building a construction company, except instead of human workers, we're coordinating specialized AI agents. You give it a project, it picks the right specialists, they work in parallel, and something real gets delivered.

---

## The Core Problem We Solve

Most AI tools work like a calculator — ask a question, get an answer. They're single-purpose, single-agent, stateless.

Real work doesn't work that way. Real work involves:
- Multiple specialists with different expertise
- Coordination and communication between workers
- Decisions that benefit from debate and deliberation
- Parallel execution for speed
- Systems that remember and learn over time

That's what we build.

---

## What We Actually Built

### 🏛️ AI Council Chamber
**Multi-agent deliberation engine**

A system where multiple AI agents act as councilors — each with a distinct persona, expertise, and perspective. Before a major decision, they debate, vote, and reach consensus.

**11 deliberation modes:**
- Legislative — voting on proposals with weighted votes
- Deep Research — multi-vector investigation across sources
- Swarm Coding — parallel agent teams building code
- Architectural Review — system design evaluation
- Security Council — threat modeling and vulnerability assessment
- Plus: Legal Review, Financial Analysis, UX Review, Stakeholder Alignment, Risk Assessment, Final Sign-off

**Why it matters:** Single AI opinions can be wrong, biased, or miss angles. A council of specialists with different viewpoints produces better decisions.

**Tech:** TypeScript, Node.js, WebSockets, Python agent API server, OpenClaw backend

---

### 🐝 Agent Swarm System
**218 specialized AI agents working in parallel**

When you need something built, the swarm system automatically selects the right specialists, splits the work, and dispatches agents to work simultaneously.

**Example — "Build a task manager app":**
Instead of one AI fumbling through everything, the swarm spawns:
- Solutions Architect → designs the architecture
- Backend Tech Lead → builds the API and database
- Frontend Tech Lead → builds the UI
- DevOps Lead → sets up deployment
- Security Lead → audits for vulnerabilities

All at the same time. Results synthesized in ~4 minutes.

**218 agents across every coding domain:**
- Frontend (React, Vue, Svelte, Next.js, Angular, Astro, etc.)
- Backend (Node.js, Go, Rust, Python, Elixir, .NET, etc.)
- Mobile (React Native, Flutter, SwiftUI, Kotlin)
- Cloud (AWS, GCP, Azure, Cloudflare, Vercel, Firebase)
- AI/ML (LangChain, RAG, vector databases, fine-tuning)
- Security (pen testing, compliance, cryptography)
- Plus: payments, streaming, observability, compliance, and 50+ more

**Tech:** Python orchestrator, JSON agent registry, OpenClaw sessions_spawn, MiniMax models

---

### 🎮 Claude-Code-Game-Studios
**48-agent game development studio**

A swarm system specifically for game development — modeled after how real game studios are organized.

**Tier 1 — Leadership:**
Creative Director, Technical Director, Executive Producer

**Tier 2 — Department Heads:**
Game Designer, Lead Programmer, Art Director, Audio Director, Narrative Director, QA Lead, Release Manager, Localization Lead

**Tier 3 — Specialists (39 agents):**
Gameplay programmers, AI programmers, network programmers, level designers, systems designers, economy designers, technical artists, writers, world builders, and specialists for Godot, Unity, and Unreal Engine.

**8 workflow patterns:**
New Feature (13-step pipeline), Bug Fix, Balance Adjustment, New Area/Level, Sprint Cycle, Milestone Checkpoint, Release Pipeline, Rapid Prototype, Live Event/Season Launch

**Tech:** Claude Code integration, workflow skills, template system

---

### 🦆 DuckBot-OS
**Pre-OpenClaw foundation (2024)**

Our first attempt at this — built before OpenClaw existed. A comprehensive AI operating system concept featuring:

- **Archon Multi-Agent Framework** — agent orchestration before we had a proper platform
- **Memento Memory System** — persistent conversation memory
- **ByteBot Desktop Automation** — visual desktop control
- **AI Router** — multi-provider routing
- **Discord Bot Integration** — chat-based AI interaction
- **Cross-platform** — Windows + Linux support

**Lesson learned:** We had the right vision, but building the orchestration platform from scratch was too much. When OpenClaw appeared, we pivoted to building on top of it instead.

---

### 🌊 Open-WebUi-Lobster-Edition
**Custom AI chat web interface**

A themed, customized version of Open WebUI with DuckBot branding and enhancements:

- Lobster/DuckBot visual theme
- OpenClaw Agent integration in the model selector
- DuckBot Settings admin panel
- Generative UI (dynamic components based on context)
- Agent Mesh Integration
- Full OpenClaw control panel access

**Tech:** SvelteKit, TypeScript, Docker, Open WebUI upstream

---

### 🦞 RS-Agent-Skill
**RuneScape API toolkit for OpenClaw**

A specialized agent skill for RuneScape players:

- MCP server with 13 tools
- GE price monitoring and arbitrage detection
- Clan management and member tracking
- Portfolio tracking with profit/loss
- PvP loot calculator
- Discord bot with slash commands
- Personalized money-making guides

**Why it matters:** Shows how specialized agent skills can be built for any domain — gaming, finance, research, whatever.

---

## What Runs 24/7

On the Mac mini (OpenClaw gateway):

- **OpenClaw Gateway** — the core orchestration platform
- **AI Council Chamber** — web UI at port 3001, deliberation + swarm execution
- **DuckBot Chat** — Telegram interface for talking to agents
- **Grow Automation** — plant tent monitoring, AC Infinity integration, VPD tracking
- **Weather Alerts** — storm monitoring with email notifications
- **Cron Jobs** — twice-daily plant checks, continuous monitoring, daily reports

The AI is always watching. Always ready to act.

---

## The Stack

**Platform:** OpenClaw (we didn't build this — it's the orchestration layer)

**AI Models:** MiniMax (primary, free unlimited), LM Studio (local inference), OpenAI Codex (premium)

**Languages:** TypeScript, Python, Swift, Dart, Bash

**Infrastructure:** macOS (Mac mini), Docker, GitHub Actions, Cron

**External Integrations:** Telegram, Discord, GitHub, Gmail, ADB (Android), Home Assistant

---

## What Makes This Different

| Typical AI Usage | What We Build |
|-----------------|---------------|
| Ask one AI a question | Coordinate a team of specialists |
| One-off conversations | Persistent, memory-aware systems |
| Chat-based | APIs, automations, web interfaces, mobile apps |
| Reactive (you ask, it answers) | Proactive (it watches, alerts, acts) |
| Single-purpose | Multi-agent, multi-domain |
| Theoretical answers | Real code, pushed commits, working systems |

---

## The Vision

Not just "an AI assistant." Not just "a chatbot."

An **AI infrastructure** — systems that coordinate, deliberate, build, automate, and operate 24/7 with minimal human intervention.

Like how the internet stopped being "a website" and became infrastructure that runs everything. AI is heading that direction. We're building the infrastructure layer now.

---

## Repositories

| Repo | Stars | Description |
|------|-------|-------------|
| [AI-Bot-Council-Concensus](https://github.com/Franzferdinan51/AI-Bot-Council-Concensus) | 5 | Multi-agent deliberation engine |
| [Open-WebUi-Lobster-Edition](https://github.com/Franzferdinan51/Open-WebUi-Lobster-Edition) | 3 | Custom web UI |
| [Claude-Code-Game-Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) | 1 | Game dev swarm (forked/enhanced) |
| [RS-Agent-Skill-Lobster-Edition](https://github.com/Franzferdinan51/RS-Agent-Skill-Lobster-Edition) | 1 | RuneScape agent toolkit |
| [DuckBot-OS](https://github.com/Franzferdinan51/DuckBot-OS) | — | Pre-OpenClaw foundation |

---

*Last updated: March 2026*
