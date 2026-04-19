# 🕹️ SWARM: Game Studio Edition

> Layered swarm orchestration for full-scale game development projects.

Built on top of [SWARM-CODING.md](./SWARM-CODING.md). Use this when a task is a game development project — from prototype to shipped title.

---

## 🎯 When to Use This Mode

Trigger Game Studio SWARM when the user describes:
- A game concept (any genre, platform, or scope)
- A game mechanic, system, or feature request
- A need for art, audio, narrative, or design work for a game
- Requesting a full production pipeline

**Routing:** If unsure, ask one question: *"Is this for a game project or general software?"*

---

## 🏗️ Division Layers

Game Studio SWARM runs through 6 layers, escalating in scope.

### Layer 1 — Studio Leadership
**Triggered:** Always. First layer to activate.

| Agent | Role |
|-------|------|
| Creative Director | Defines vision, art style, narrative tone, genre feel |
| Executive Producer | Sets scope, timeline, team composition, stakeholder alignment |
| Lead Programmer | Chooses engine, architecture, tech stack, milestone plan |

**Deliverable:** One-page Game Design Brief (GDB)
- Elevator pitch (1-2 sentences)
- Core loop (what players do minute-to-minute)
- Genre and platform targets
- Scope tier: Prototype / Vertical Slice / Full Production
- Estimated complexity (1-5)
- Decision: proceed to Layer 2 or abort with rationale

---

### Layer 2 — Technical Division
**Triggered:** When GDB is approved. Parallel agents:

| Agent | Role |
|-------|------|
| Gameplay Programmer | Player mechanics, controls, input handling, game feel |
| Engine Programmer | Core engine setup, rendering pipeline, platform ports |
| Physics Programmer | Collision systems, rigidbody, fluid, destruction, ragdolls |
| Graphics Programmer | Shaders, lighting, post-processing, optimization |
| Game AI Programmer | NPC behavior, pathfinding, decision trees, ML agents |
| Networking Programmer | Multiplayer netcode, matchmaking, server architecture |
| Audio Programmer | Wwise/FMOD integration, procedural audio, DSP |
| Tools Programmer | Level editor, scripting tools, debug tools, pipeline |

**Deliverable:** Technical Design Document (TDD)
- Engine choice and rationale
- Core systems architecture (UML or ASCII diagram)
- Platform targets and performance budgets
- Third-party dependencies and licensing
- AI behavior system overview
- Networking model (peer-to-peer vs client-server)

---

### Layer 3 — Art & Audio Division
**Triggered:** After TDD, parallel with Layer 4 where possible.

| Agent | Role |
|-------|------|
| Character Artist | Character models, textures, rigging, VFX, animation cycles |
| Environment Artist | World-building, props, terrain, lighting, biome style |
| UI/UX Designer | Menus, HUD, accessibility, responsive design, font/typography |
| Animator | Character animation, cutscenes, physics-based animation |
| Audio Designer | Sound effects, ambient audio, music direction, voice pipelines |

**Deliverable:** Art & Audio Production Brief
- Visual style guide (color, mood, reference boards)
- Character design sheet summary
- Environment art tier (stylized vs realistic, LOD plan)
- UI mockups (3-5 key screens)
- Audio mood board and implementation approach

---

### Layer 4 — Design Division
**Triggered:** After TDD, parallel with Layer 3.

| Agent | Role |
|-------|------|
| Systems Designer | Economy, progression, itemization, balance, meta-systems |
| Level Designer | Level layout, pacing, encounter design, difficulty curves |
| Narrative Designer | Story, dialogue, world lore, character arcs, tone |
| UX Designer | Player journey, onboarding, retention, monetization touchpoints |

**Deliverable:** Design Production Brief
- Core game loop diagram
- Progression and economy model (with tuning targets)
- Level structure and pacing guide
- Narrative world summary and key characters
- Monetization model (if applicable)

---

### Layer 5 — Production & QA
**Triggered:** When core development begins.

| Agent | Role |
|-------|------|
| QA Lead | Test plans, bug tracking, regression suites, certification checklist |
| Technical Producer | Sprint planning, backlog, milestone delivery, risk tracking |
| Community Manager | Player feedback loops, social media, community events |

**Deliverable:** Production Plan
- Sprint breakdown (4-6 sprints for prototype, more for full production)
- Milestone definitions with acceptance criteria
- Bug severity and priority framework
- Release criteria and certification requirements

---

### Layer 6 — Business & Outreach
**Triggered:** As project approaches launch.

| Agent | Role |
|-------|------|
| Marketing Director | Go-to-market plan, trailers, press releases, influencer campaign |
| Business Analyst | Monetization review, LTV, churn, market positioning |

**Deliverable:** Go-to-Market Plan
- Launch window and platform sequencing
- Trailer and press kit plan
- Influencer and content creator outreach
- Post-launch analytics framework

---

## 🔀 Orchestration Flow

```
USER REQUEST
     │
     ▼
 Layer 1: Studio Leadership (sequential)
     │  GDB produced
     ▼
 Layer 2: Technical Division (parallel)
     │  TDD produced
     ▼
 Layer 3 + Layer 4 (parallel)
     │  Art/Audio + Design briefs produced
     ▼
 Layer 5: Production + QA
     │  Production plan produced
     ▼
 Layer 6: Business + Outreach (near launch)
     │
     ▼
 FINAL DELIVERY
```

---

## 📊 Project Complexity Scaling

| Tier | Agents Engaged | Scope |
|------|---------------|-------|
| **Indie Sprint** | 3-5 agents | Single mechanic prototype, 1-2 weeks |
| **Vertical Slice** | 6-10 agents | Playable demo, 1-3 months |
| **Full Production** | 15-20 agents | Complete game, 6-18 months |
| **AAA Project** | All layers + specialists | 2-5 year development |

---

## 🎮 Genre Specialization Routing

| Genre | Priority Division | Key Specialist |
|-------|------------------|---------------|
| RPG | Design (Narrative) | Narrative Designer, Systems Designer |
| FPS/TPS | Technical (Physics + AI) | Game AI Programmer, Graphics Programmer |
| Strategy | Design (Systems) | Systems Designer, Level Designer |
| Horror | Art + Audio | Audio Designer, Environment Artist |
| Multiplayer | Technical (Networking) | Networking Programmer, QA Lead |
| Platformer | Technical (Physics) | Physics Programmer, Animator |
| Puzzle | Design (Level) | Level Designer, Systems Designer |
| Simulation | Design (Systems) | Systems Designer, Technical Director |

---

## 🔗 Integration with SWARM-CODING.md

Game Studio SWARM extends SWARM-CODING.md. The base SWARM workflow handles:

- **Research Phase** → Reuse existing research agents for market analysis
- **Planning Phase** → Game Studio Layer 1 replaces the generic Architect
- **Build Phase** → Game Studio layers replace the generic backend/frontend/devops agents
- **Ship Phase** → Layer 6 (Business) + Layer 5 (QA) handle release

For game-adjacent tasks (website for a game studio, internal tooling, analytics dashboard), use the **Generic SWARM** from SWARM-CODING.md instead.

---

## 🚀 Quick Start

```
/council game-studio "3D roguelike dungeon crawler for PC with multiplayer co-op"
```

Council will:
1. Activate Studio Leadership → produce GDB
2. Engage Technical Division → produce TDD
3. Run Art/Audio + Design in parallel → produce briefs
4. Add Production/QA → produce sprint plan
5. Deliver complete game development roadmap
