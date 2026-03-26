# 🎮 Game Studio Swarm Mode - Complete Guide

**Multi-agent collaborative game development powered by Claude Code Game Studios**

---

## Table of Contents

- [Overview](#overview)
- [Agent Roster](#agent-roster)
- [Coordination Hierarchy](#coordination-hierarchy)
- [Engine-Specific Agents](#engine-specific-agents)
- [Skills Reference](#skills-reference)
- [Workflow Patterns](#workflow-patterns)
- [Delegation Guide](#delegation-guide)
- [Quick Start Examples](#quick-start-examples)

---

## Overview

**Game Studio Swarm Mode** is a comprehensive multi-agent game development system with:

- **48 Specialized Agents** - From creative director to QA tester
- **36 Workflow Skills** - Brainstorm, prototype, sprint-plan, code-review, etc.
- **3 Engine Stacks** - Godot 4, Unity, Unreal Engine 5
- **8 Coordination Patterns** - New feature, bug fix, balance adjustment, etc.
- **Full Documentation** - Agent rosters, coordination maps, engine references

### When to Use Game Studio Swarm

✅ **Perfect for:**
- New game features and mechanics
- Full game development projects
- Content creation (levels, quests, characters)
- Bug fixes with proper triage
- Balance adjustments and tuning
- Engine-specific implementations
- Sprint planning and retrospectives
- Release pipeline management

---

## Agent Roster

### Tier 1 - Leadership Agents (qwen3.5-plus)

| Agent | Domain | When to Use |
|-------|--------|-------------|
| `creative-director` | Vision & Art | Major creative decisions, pillar conflicts, tone, art direction |
| `technical-director` | Technology | Architecture decisions, engine selection, performance strategy |
| `producer` | Production | Sprint planning, milestone tracking, risk management, coordination |

### Tier 2 - Department Leads (glm-5)

| Agent | Domain | When to Use |
|-------|--------|-------------|
| `game-designer` | Game Design | Mechanics, systems, progression, economy, balancing |
| `lead-programmer` | Code Architecture | System design, code review, API design, refactoring |
| `art-director` | Visual Direction | Style guides, art bible, asset standards, UI/UX direction |
| `audio-director` | Audio Direction | Music direction, sound palette, audio implementation strategy |
| `narrative-director` | Story & Writing | Story arcs, world-building, character design, dialogue |
| `qa-lead` | Quality Assurance | Test strategy, bug triage, release readiness, regression |
| `release-manager` | Release Pipeline | Builds, versioning, changelogs, deployment, rollbacks |
| `localization-lead` | Internationalization | String externalization, translation, locale testing |

### Tier 3 - Specialist Agents (MiniMax-M2.5)

| Agent | Domain | When to Use |
|-------|--------|-------------|
| `gameplay-programmer` | Gameplay Code | Feature implementation, gameplay systems |
| `engine-programmer` | Engine Systems | Core engine, rendering, physics, memory |
| `ai-programmer` | AI Systems | Behavior trees, pathfinding, NPC logic |
| `network-programmer` | Networking | Netcode, replication, lag compensation |
| `tools-programmer` | Dev Tools | Editor extensions, pipeline tools, debug |
| `ui-programmer` | UI Implementation | UI framework, screens, widgets |
| `systems-designer` | Systems Design | Mechanic implementation, formulas, loops |
| `level-designer` | Level Design | Level layouts, pacing, encounter design |
| `economy-designer` | Economy/Balance | Resource economies, loot tables, curves |
| `technical-artist` | Tech Art | Shaders, VFX, optimization, art pipeline |
| `sound-designer` | Sound Design | SFX design, audio events, mixing |
| `writer` | Dialogue/Lore | Dialogue writing, lore entries |
| `world-builder` | World/Lore | World rules, factions, history |
| `qa-tester` | Test Execution | Test cases, bug reports |
| `performance-analyst` | Performance | Profiling, optimization, memory |
| `devops-engineer` | Build/Deploy | CI/CD, build scripts |
| `analytics-engineer` | Telemetry | Event tracking, dashboards |
| `ux-designer` | UX Flows | User flows, wireframes, accessibility |
| `prototyper` | Prototyping | Throwaway prototypes, feasibility |
| `security-engineer` | Security | Anti-cheat, exploits, encryption |
| `accessibility-specialist` | Accessibility | WCAG, colorblind, remapping |
| `live-ops-designer` | Live Operations | Seasons, events, battle passes |
| `community-manager` | Community | Patch notes, feedback, crisis comms |

---

## Coordination Hierarchy

```
                           [Human Developer]
                                 |
                +----------------+----------------+
                |                |                |
        creative-director  technical-director  producer
                |                |                |
       +--------+--------+       |         (coordinates all)
       |        |        |       |
   game-designer art-dir  narr-dir  lead-programmer  qa-lead  audio-dir
       |        |        |       |         |              |        |
   +---+---+    |     +--+--+  +--+--+--+--+--+--+--+--+  |        |
   sys lvl eco  ta   wrt  wrld gp ep  ai net tl ui qa-t  snd    writer
                            |
                        +---+---+
                        |       |
                     perf-a   devops   analytics

   Additional Leads (report to producer/directors):
     release-manager     → Release pipeline, versioning, deployment
     localization-lead   → i18n, string tables, translation
     prototyper          → Rapid prototypes, concept validation
     security-engineer   → Anti-cheat, exploits, network security
     accessibility-spec  → WCAG, colorblind, remapping
     live-ops-designer  → Seasons, events, battle passes
     community-manager   → Patch notes, player feedback
```

### Delegation Table

| From | Can Delegate To |
|------|----------------|
| creative-director | game-designer, art-director, audio-director, narrative-director |
| technical-director | lead-programmer, devops, performance-analyst, tech-artist |
| producer | Any agent (within domain) |
| game-designer | systems-designer, level-designer, economy-designer |
| lead-programmer | gameplay-programmer, engine-programmer, ai-programmer, network-programmer, tools-programmer, ui-programmer |
| art-director | technical-artist, ux-designer |
| audio-director | sound-designer |
| narrative-director | writer, world-builder |
| qa-lead | qa-tester |
| [engine]-specialist | Engine sub-specialists |

---

## Engine-Specific Agents

### Godot 4 Stack

| Agent | Subsystem | When to Use |
|-------|-----------|-------------|
| `godot-specialist` | Godot 4 Lead | GDScript, node/scene, signals, resources, optimization |
| `godot-gdscript-specialist` | GDScript | Static typing, design patterns, signals, coroutines, performance |
| `godot-shader-specialist` | Shaders | Godot shading language, visual shaders, particles, post-processing |
| `godot-gdextension-specialist` | GDExtension | C++/Rust bindings, native performance, custom nodes, build systems |

### Unity Stack

| Agent | Subsystem | When to Use |
|-------|-----------|-------------|
| `unity-specialist` | Unity Lead | MonoBehaviour/DOTS, Addressables, URP/HDRP, optimization |
| `unity-dots-specialist` | DOTS/ECS | Entity Component System, Jobs, Burst compiler, hybrid renderer |
| `unity-shader-specialist` | Shaders/VFX | Shader Graph, VFX Graph, SRP customization, post-processing |
| `unity-addressables-specialist` | Asset Management | Addressable groups, async loading, memory, CDN |
| `unity-ui-specialist` | UI | UI Toolkit, UXML/USS, UGUI Canvas, data binding |

### Unreal Engine 5 Stack

| Agent | Subsystem | When to Use |
|-------|-----------|-------------|
| `unreal-specialist` | UE5 Lead | Blueprint/C++, GAS overview, UE subsystems, optimization |
| `ue-gas-specialist` | Gameplay Ability System | Abilities, gameplay effects, attribute sets, tags, prediction |
| `ue-blueprint-specialist` | Blueprint Architecture | BP/C++ boundary, graph standards, naming, optimization |
| `ue-replication-specialist` | Networking/Replication | Property replication, RPCs, prediction, relevancy, bandwidth |
| `ue-umg-specialist` | UMG/CommonUI | Widget hierarchy, data binding, CommonUI input, UI performance |

---

## Skills Reference

### Core Workflow Skills

| Skill | Command | Purpose |
|-------|---------|---------|
| **Start** | `/start` | Initialize a new game project |
| **Brainstorm** | `/brainstorm [topic]` | Generate and evaluate game ideas |
| **Prototype** | `/prototype [feature]` | Rapid throwaway prototypes |
| **Sprint Plan** | `/sprint-plan [action]` | Sprint planning, status, retrospective |
| **Design Review** | `/design-review [doc]` | Review design documents |
| **Code Review** | `/code-review [feature]` | Review code quality and architecture |
| **Design System** | `/design-system` | UI/UX design system standards |

### Quality & Review Skills

| Skill | Command | Purpose |
|-------|---------|---------|
| **Milestone Review** | `/milestone-review` | Milestone readiness assessment |
| **Gate Check** | `/gate-check` | Quality gate verification |
| **Scope Check** | `/scope-check` | Scope creep prevention |
| **Estimate** | `/estimate [feature]` | Effort estimation |
| **Reverse Document** | `/reverse-document` | Generate docs from code |
| **Tech Debt** | `/tech-debt` | Track and address technical debt |
| **Bug Report** | `/bug-report` | Structured bug reporting |
| **Hotfix** | `/hotfix [issue]` | Emergency bug fix workflow |

### Release & Ops Skills

| Skill | Command | Purpose |
|-------|---------|---------|
| **Changelog** | `/changelog` | Generate changelog entries |
| **Patch Notes** | `/patch-notes` | Create patch notes |
| **Release Checklist** | `/release-checklist` | Release readiness checklist |
| **Launch Checklist** | `/launch-checklist` | Game launch checklist |
| **Map Systems** | `/map-systems` | System architecture mapping |
| **Team Release** | `/team-release` | Coordinated release workflow |

### Team-Specific Skills

| Skill | Command | Purpose |
|-------|---------|---------|
| **Team Audio** | `/team-audio` | Audio team coordination |
| **Team Combat** | `/team-combat` | Combat system development |
| **Team Level** | `/team-level` | Level design workflow |
| **Team Narrative** | `/team-narrative` | Narrative content creation |
| **Team Polish** | `/team-polish` | Polish and optimization |
| **Team UI** | `/team-ui` | UI development workflow |

### Specialist Skills

| Skill | Command | Purpose |
|-------|---------|---------|
| **Architecture Decision** | `/architecture-decision` | ADR creation and review |
| **Asset Audit** | `/asset-audit` | Asset pipeline review |
| **Balance Check** | `/balance-check` | Game balance analysis |
| **Localize** | `/localize` | Localization workflow |
| **Perf Profile** | `/perf-profile` | Performance profiling |
| **Playtest Report** | `/playtest-report` | Playtest feedback analysis |
| **Onboard** | `/onboard [role]` | Team onboarding |
| **Project Stage Detect** | `/project-stage-detect` | Detect current project stage |

---

## Workflow Patterns

### Pattern 1: New Feature

```
1. creative-director  → Approves feature concept aligns with vision
2. game-designer      → Creates design document with full spec
3. producer           → Schedules work, identifies dependencies
4. lead-programmer    → Designs code architecture
5. [specialist]       → Implements the feature
6. technical-artist   → Implements visual effects (if needed)
7. writer             → Creates text content (if needed)
8. sound-designer     → Creates audio events (if needed)
9. qa-tester          → Writes test cases
10. lead-programmer   → Code review
11. qa-tester         → Executes tests
12. producer          → Marks task complete
```

### Pattern 2: Bug Fix

```
1. qa-tester          → Files bug report with /bug-report
2. qa-lead            → Triages severity and priority
3. producer           → Assigns to sprint (if not S1)
4. lead-programmer     → Identifies root cause, assigns
5. [programmer]       → Fixes the bug
6. lead-programmer     → Code review
7. qa-tester          → Verifies fix and runs regression
8. qa-lead            → Closes bug
```

### Pattern 3: Balance Adjustment

```
1. analytics-engineer → Identifies imbalance from data
2. game-designer      → Evaluates the issue
3. economy-designer   → Models the adjustment
4. game-designer      → Approves new values
5. [config update]    → Change configuration
6. qa-tester          → Regression test
7. analytics-engineer → Monitor post-change metrics
```

### Pattern 4: New Area/Level

```
1. narrative-director → Defines narrative purpose and beats
2. world-builder      → Creates lore and context
3. level-designer     → Designs layout, encounters, pacing
4. game-designer      → Reviews mechanical design
5. art-director       → Defines visual direction
6. audio-director     → Defines audio direction
7. [implementation]   → Build the area
8. writer             → Creates area text
9. qa-tester          → Tests complete area
```

### Pattern 5: Sprint Cycle

```
1. producer           → Plans sprint with /sprint-plan
2. [All agents]       → Execute assigned tasks
3. producer           → Daily status
4. qa-lead            → Continuous testing
5. lead-programmer     → Continuous code review
6. producer           → Retrospective
```

### Pattern 6: Milestone Checkpoint

```
1. producer           → Runs /milestone-review
2. creative-director   → Reviews creative progress
3. technical-director → Reviews technical health
4. qa-lead            → Reviews quality metrics
5. [All directors]    → Go/no-go discussion
6. producer           → Documents decisions
```

### Pattern 7: Release Pipeline

```
1. producer           → Declares release candidate
2. release-manager     → Cuts branch, generates checklist
3. qa-lead            → Full regression
4. localization-lead   → Verifies translations
5. performance-analyst → Confirms benchmarks
6. devops-engineer    → Builds artifacts
7. release-manager    → Generates changelog, tags
8. release-manager     → Deploys, monitors 48 hours
```

### Pattern 8: Rapid Prototype

```
1. game-designer       → Defines hypothesis and criteria
2. prototyper          → Scaffolds with /prototype
3. prototyper          → Builds minimal implementation
4. game-designer       → Evaluates against criteria
5. creative-director   → Go/no-go decision
6. producer            → Schedules production if approved
```

### Pattern 9: Live Event

```
1. live-ops-designer   → Designs event content
2. game-designer       → Validates mechanics
3. economy-designer    → Balances economy
4. narrative-director  → Seasonal theme
5. producer            → Schedules work
6. community-manager   → Drafts announcement
7. release-manager     → Deploys event
8. analytics-engineer  → Monitors metrics
```

---

## Delegation Guide

### Quick Reference

**Need a new game mechanic?**
```
→ creative-director (approve) → game-designer (spec) → lead-programmer (design) 
  → gameplay-programmer (implement) → qa-tester (test)
```

**Need a new level?**
```
→ narrative-director (narrative) → world-builder (lore) → level-designer (layout)
  → game-designer (review) → [programmers] (implement) → qa-tester (test)
```

**Need engine-specific work?**
```
Godot: → godot-specialist → godot-[subsystem]-specialist
Unity: → unity-specialist → unity-[subsystem]-specialist  
Unreal: → unreal-specialist → ue-[subsystem]-specialist
```

**Need a bug fixed?**
```
→ qa-lead (triage) → lead-programmer (root cause) → [programmer] (fix)
  → qa-tester (verify) → qa-lead (close)
```

**Need balancing?**
```
→ analytics-engineer (data) → game-designer (evaluate) → economy-designer (model)
  → [config] (update) → qa-tester (regression)
```

---

## Quick Start Examples

### Example 1: Combat System

**Task:** "Add a dodge-roll mechanic with i-frames and stamina cost"

```
→ creative-director: Approves dodge-roll concept
→ game-designer: Specs dodge-roll (i-frames, stamina cost, animation)
→ lead-programmer: Designs player controller architecture
→ gameplay-programmer: Implements dodge-roll system
→ sound-designer: Creates dodge sound effect list
→ qa-tester: Writes dodge-roll test cases
→ qa-lead: Reviews test coverage
→ lead-programmer: Code review
→ qa-tester: Executes tests, verifies i-frames work
```

### Example 2: Boss Fight

**Task:** "Design and implement an ice dragon boss"

```
→ narrative-director: Defines boss story and importance
→ world-builder: Creates ice dungeon lore
→ game-designer: Specs boss mechanics (phases, attacks)
→ level-designer: Designs arena layout and pacing
→ ai-programmer: Implements boss AI (behavior tree)
→ engine-programmer: Creates ice breath attack VFX
→ sound-designer: Creates dragon roar and attack sounds
→ writer: Writes boss dialogue
→ qa-tester: Comprehensive boss test plan
→ performance-analyst: Verify boss doesn't cause FPS drops
```

### Example 3: Mobile Port

**Task:** "Port our Unity game to iOS and Android"

```
→ technical-director: Approves mobile port strategy
→ unity-specialist: Defines mobile-specific architecture
→ lead-programmer: Mobile input system design
→ unity-ui-specialist: Touch UI adaptation
→ devops-engineer: Mobile build pipeline setup
→ accessibility-specialist: Mobile accessibility review
→ qa-lead: Mobile test strategy
→ qa-tester: Device fragmentation testing
→ release-manager: App store submission pipeline
```

---

## Templates

Templates are available in `/duckbot-skill/game-studio-templates/`:
- `sprint-plan-template.md`
- `bug-report-template.md`
- `design-document-template.md`
- `feature-spec-template.md`
- `playtest-report-template.md`
- `milestone-review-template.md`

## Engine References

Detailed engine references are available in `/duckbot-skill/game-studio-docs/engine-reference/`:

**Godot:**
- `godot/getting-started.md`
- `godot/gdscript-style-guide.md`
- `godot/signal-patterns.md`
- `godot/scene-composition.md`

**Unity:**
- `unity/architecture.md`
- `unity/dots-best-practices.md`
- `unity/addressables-guide.md`
- `unity/performance-tuning.md`

**Unreal:**
- `unreal/architecture.md`
- `unreal/gas-guide.md`
- `unreal/blueprint-standards.md`
- `unreal/replication-guide.md`

---

**Game Studio Swarm Mode - Built for game development at scale!** 🎮🚀
