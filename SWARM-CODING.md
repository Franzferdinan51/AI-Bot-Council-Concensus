# 💻 Swarm Coding Mode - Complete Guide

**AI-powered collaborative software engineering with multi-agent code review**

> 🎮 **Game Studio Mode Available!** This document also covers the **Game Studio Swarm** integration with 48 specialized game development agents, engine references (Godot/Unity/Unreal), 36 skills, and 8 coordination workflow patterns. See [Game Studio Swarm Mode](#-game-studio-swarm-mode) below.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Roles](#roles)
- [Workflow](#workflow)
- [Quality Gates](#quality-gates)
- [Examples](#examples)
- [Templates](#templates)
- [API Reference](#api-reference)
- [Integrations](#integrations)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

**Swarm Coding** is an advanced deliberation mode that simulates a complete software engineering team. Multiple AI councilors collaborate on code generation, review, and deployment—just like a real dev team.

### Key Features

- 🤖 **6+ Specialized Roles** - Architect, Backend, Frontend, DevOps, Security, QA
- 📋 **4-Phase Workflow** - Plan, Implement, Review, Deploy
- ✅ **Quality Gates** - Automated code review, security, performance checks
- 🔗 **Integrations** - GitHub, GitLab, VS Code, CI/CD
- 📊 **Metrics** - Code quality, test coverage, security score

### When to Use

✅ **Perfect for:**
- New feature development
- Code refactoring
- Security audits
- Performance optimization
- Architecture design
- Code reviews

❌ **Not for:**
- Simple one-line fixes
- Quick questions
- Non-coding tasks

---

## 👥 Roles

### Core Roles (6)

#### 1. **Solutions Architect** 🏗️
- **Responsibilities:** System design, technology selection, architecture review
- **Deliverables:** Architecture diagrams, tech stack recommendations
- **Quality Focus:** Scalability, maintainability, integration patterns

#### 2. **Backend Developer** ⚙️
- **Responsibilities:** API design, database schema, business logic
- **Deliverables:** Server code, database migrations, API documentation
- **Quality Focus:** Performance, error handling, logging

#### 3. **Frontend Developer** 🎨
- **Responsibilities:** UI components, user experience, state management
- **Deliverables:** Component code, styles, tests
- **Quality Focus:** Accessibility, responsiveness, performance

#### 4. **DevOps Engineer** 🚀
- **Responsibilities:** CI/CD pipeline, deployment, monitoring
- **Deliverables:** Docker files, deployment scripts, monitoring setup
- **Quality Focus:** Reliability, scalability, observability

#### 5. **Security Expert** 🔒
- **Responsibilities:** Security audit, threat modeling, compliance
- **Deliverables:** Security report, vulnerability fixes, compliance checklist
- **Quality Focus:** OWASP Top 10, data protection, authentication

#### 6. **QA Engineer** ✅
- **Responsibilities:** Test strategy, test generation, coverage analysis
- **Deliverables:** Unit tests, integration tests, test reports
- **Quality Focus:** Coverage, edge cases, regression testing

### Supporting Councilors

- **Performance Engineer** - Performance optimization, profiling
- **Technical Writer** - Documentation, comments, guides
- **Coder** - Code quality, best practices
- **Product Manager** - Requirements, prioritization, user value

---

## 🔄 Workflow

### Phase 1: Planning & Design (15-20 min)

**Activities:**
1. **Requirements Analysis** - Understand user needs
2. **Architecture Design** - System design review
3. **Technology Selection** - Stack recommendations
4. **Risk Assessment** - Identify potential issues

**Deliverables:**
- Architecture document
- Technology stack decision
- Risk register
- Project timeline

**Exit Criteria:**
- ✅ Architecture approved by Architect
- ✅ Technology stack agreed
- ✅ Risks documented
- ✅ Timeline estimated

---

### Phase 2: Implementation (30-60 min)

**Activities:**
1. **Code Generation** - Generate code by role
2. **Unit Testing** - Write tests alongside code
3. **Integration** - Connect components
4. **Documentation** - Write inline docs

**Deliverables:**
- Source code
- Unit tests
- Integration code
- Initial documentation

**Exit Criteria:**
- ✅ All code generated
- ✅ Unit tests passing
- ✅ Integration complete
- ✅ Documentation started

---

### Phase 3: Review (20-30 min)

**Activities:**
1. **Code Review** - Review by all roles
2. **Security Audit** - Security expert review
3. **Performance Review** - Performance optimization
4. **QA Review** - Test coverage analysis

**Deliverables:**
- Code review report
- Security audit report
- Performance report
- Test coverage report

**Exit Criteria:**
- ✅ Code review approved
- ✅ Security issues resolved
- ✅ Performance acceptable
- ✅ Test coverage >80%

---

### Phase 4: Deployment (15-20 min)

**Activities:**
1. **CI/CD Setup** - Pipeline configuration
2. **Environment Setup** - Deploy to staging
3. **Monitoring Setup** - Alerts and dashboards
4. **Rollback Plan** - Contingency planning

**Deliverables:**
- Deployment scripts
- Monitoring dashboards
- Rollback procedures
- Production checklist

**Exit Criteria:**
- ✅ CI/CD pipeline ready
- ✅ Staging deployed
- ✅ Monitoring active
- ✅ Rollback tested

---

## ✅ Quality Gates

### Code Quality

| Metric | Threshold | Tool |
|--------|-----------|------|
| **Code Coverage** | >80% | Jest/Pytest |
| **Cyclomatic Complexity** | <10 | ESLint/Pylint |
| **Code Duplication** | <5% | SonarQube |
| **Technical Debt** | <5% | SonarQube |
| **Documentation** | >90% | JSDoc/Sphinx |

### Security

| Check | Required | Tool |
|-------|----------|------|
| **OWASP Top 10** | All checked | OWASP ZAP |
| **Dependency Scan** | No critical | Snyk/Dependabot |
| **Secrets Scan** | Zero secrets | GitLeaks |
| **Authentication** | Implemented | Manual review |
| **Authorization** | Implemented | Manual review |

### Performance

| Metric | Threshold | Tool |
|--------|-----------|------|
| **Response Time** | <200ms | Lighthouse |
| **Throughput** | >100 req/s | k6 |
| **Memory Usage** | <256MB | Chrome DevTools |
| **CPU Usage** | <50% | k6 |
| **Bundle Size** | <500KB | Webpack Bundle Analyzer |

### Documentation

| Requirement | Status |
|-------------|--------|
| README complete | ✅ |
| API documentation | ✅ |
| Code comments | ✅ |
| Deployment guide | ✅ |
| Troubleshooting guide | ✅ |

---

## 📚 Examples

### Example 1: REST API Development

**Request:**
```
Build a REST API for a todo app with:
- User authentication (JWT)
- CRUD operations for todos
- PostgreSQL database
- Docker deployment
```

**Swarm Coding Session:**

**Phase 1: Planning**
- Architect: Microservices vs monolith → Monolith for simplicity
- Backend: Node.js + Express + PostgreSQL
- DevOps: Docker + Docker Compose
- Security: JWT auth + bcrypt password hashing

**Phase 2: Implementation**
- Backend: Express routes, controllers, models
- Security: JWT middleware, password hashing
- QA: Unit tests for routes, integration tests
- DevOps: Dockerfile, docker-compose.yml

**Phase 3: Review**
- Security: JWT implementation approved
- Performance: Database indexing added
- QA: Test coverage 92%
- Architect: Architecture approved

**Phase 4: Deployment**
- DevOps: CI/CD pipeline configured
- Monitoring: Health check endpoint added
- Rollback: Docker image versioning

**Deliverables:**
- Complete REST API code
- Database schema
- Docker configuration
- Test suite (92% coverage)
- Deployment guide

---

### Example 2: Frontend Component

**Request:**
```
Create a React dashboard component with:
- Real-time data updates (WebSocket)
- Charts and graphs
- Responsive design
- Accessibility compliance
```

**Swarm Coding Session:**

**Phase 1: Planning**
- Frontend: React + TypeScript + Recharts
- Architect: Component structure, state management
- Accessibility: WCAG 2.1 AA compliance
- Performance: Lazy loading, code splitting

**Phase 2: Implementation**
- Frontend: Components, hooks, styles
- Accessibility: ARIA labels, keyboard navigation
- Performance: Memoization, lazy loading
- QA: Component tests, accessibility tests

**Phase 3: Review**
- Accessibility: All WCAG criteria met
- Performance: Lighthouse score 95+
- QA: Test coverage 88%
- Frontend: Code review approved

**Phase 4: Deployment**
- DevOps: Build pipeline configured
- Monitoring: Error tracking setup
- Documentation: Component docs generated

**Deliverables:**
- React components
- TypeScript types
- Styles (CSS-in-JS)
- Test suite
- Accessibility report

---

### Example 3: Security Audit

**Request:**
```
Audit our authentication system for:
- OWASP Top 10 vulnerabilities
- Password security
- Session management
- Rate limiting
```

**Swarm Coding Session:**

**Phase 1: Planning**
- Security: Define audit scope
- Architect: System architecture review
- Backend: Code access for review
- QA: Test plan for vulnerabilities

**Phase 2: Implementation**
- Security: Code review, vulnerability scan
- Backend: Fix implementation
- QA: Penetration testing
- DevOps: WAF configuration

**Phase 3: Review**
- Security: All critical issues fixed
- Backend: Code changes approved
- QA: Penetration test passed
- Architect: Architecture changes approved

**Phase 4: Deployment**
- DevOps: Security patches deployed
- Monitoring: Security alerts configured
- Documentation: Security report generated

**Deliverables:**
- Security audit report
- Vulnerability fixes
- Penetration test results
- Security monitoring setup

---

## 📋 Templates

### Requirements Template

```markdown
# Project Requirements

## Overview
- **Project Name:** [Name]
- **Description:** [Brief description]
- **Stakeholders:** [List stakeholders]

## Functional Requirements
1. [Requirement 1]
2. [Requirement 2]
3. [Requirement 3]

## Non-Functional Requirements
- **Performance:** [Requirements]
- **Security:** [Requirements]
- **Scalability:** [Requirements]
- **Availability:** [Requirements]

## Technical Constraints
- [Constraint 1]
- [Constraint 2]

## Success Criteria
- [Criterion 1]
- [Criterion 2]
```

### Architecture Review Template

```markdown
# Architecture Review

## System Overview
- [Architecture diagram]
- [Component description]

## Technology Stack
- **Frontend:** [Technology]
- **Backend:** [Technology]
- **Database:** [Technology]
- **Infrastructure:** [Technology]

## Architecture Decisions
1. [Decision 1] - [Rationale]
2. [Decision 2] - [Rationale]

## Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| [Risk 1] | High | Medium | [Mitigation] |

## Approval
- [ ] Architect: Approved
- [ ] Security: Approved
- [ ] DevOps: Approved
```

### Code Review Template

```markdown
# Code Review

## Overview
- **PR:** [Link]
- **Author:** [Name]
- **Reviewer:** [Name]

## Checklist
- [ ] Code follows style guide
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No security issues
- [ ] No performance issues
- [ ] Error handling complete

## Comments
### Positive
- [Comment 1]
- [Comment 2]

### Improvements
- [Suggestion 1]
- [Suggestion 2]

## Approval
- [ ] Approved
- [ ] Changes Requested
- [ ] Commented
```

### Test Plan Template

```markdown
# Test Plan

## Overview
- **Feature:** [Name]
- **Scope:** [What's tested]

## Test Types
### Unit Tests
- [Test 1]
- [Test 2]

### Integration Tests
- [Test 1]
- [Test 2]

### E2E Tests
- [Test 1]
- [Test 2]

## Coverage Requirements
- **Overall:** >80%
- **Critical:** >95%

## Test Execution
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Coverage requirements met
```

### Deployment Checklist

```markdown
# Deployment Checklist

## Pre-Deployment
- [ ] Code review approved
- [ ] Tests passing
- [ ] Documentation complete
- [ ] Security scan passed
- [ ] Performance tests passed

## Deployment
- [ ] Staging deployed
- [ ] Staging tested
- [ ] Production deployed
- [ ] Health checks passing

## Post-Deployment
- [ ] Monitoring active
- [ ] Alerts configured
- [ ] Rollback tested
- [ ] Documentation updated
- [ ] Stakeholders notified
```

---

## 🛠️ Best Practices

### Prompt Engineering

**Do:**
- ✅ Provide clear requirements
- ✅ Include context (existing code, constraints)
- ✅ Specify quality requirements
- ✅ Define success criteria
- ✅ Include examples

**Don't:**
- ❌ Vague requirements
- ❌ Missing context
- ❌ No quality standards
- ❌ Unclear success criteria

### Context Management

**Do:**
- ✅ Provide file structure
- ✅ Include dependencies
- ✅ Share existing code
- ✅ Document constraints

**Don't:**
- ❌ Assume context is known
- ❌ Hide dependencies
- ❌ Withhold constraints

### Review Strategies

**Do:**
- ✅ Review in phases
- ✅ Use checklists
- ✅ Involve all roles
- ✅ Document decisions

**Don't:**
- ❌ Skip reviews
- ❌ Rush reviews
- ❌ Exclude roles
- ❌ Undocumented decisions

---

## 🐛 Troubleshooting

### Common Issues

**Issue: Code quality too low**
- **Cause:** Rushed implementation
- **Solution:** Enforce quality gates, add review cycles

**Issue: Test coverage low**
- **Cause:** Tests not prioritized
- **Solution:** Make tests mandatory, add coverage gates

**Issue: Security vulnerabilities**
- **Cause:** Security not considered early
- **Solution:** Add security review in Phase 1

**Issue: Performance issues**
- **Cause:** Performance not tested
- **Solution:** Add performance tests in Phase 3

**Issue: Deployment failures**
- **Cause:** Incomplete deployment prep
- **Solution:** Use deployment checklist, test in staging

---

## 📊 Metrics

### Session Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Session Duration** | 2-3 hours | Time tracking |
| **Code Quality** | >85% | SonarQube |
| **Test Coverage** | >80% | Coverage tool |
| **Security Score** | >90% | Security scan |
| **Documentation** | >90% | Documentation scan |

### Quality Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| **Defect Density** | Defects / KLOC | <1 |
| **Code Coverage** | Covered Lines / Total Lines | >80% |
| **Technical Debt** | Debt Ratio | <5% |
| **Review Coverage** | Reviewed Files / Total Files | 100% |

---

## 🤖 API Reference

### Start Session

```bash
POST /api/v2/swarm-coding/start

{
  "requirements": "Build a REST API...",
  "roles": ["architect", "backend", "frontend", "devops", "security", "qa"],
  "qualityGates": {
    "coverage": 80,
    "security": 90,
    "performance": 85
  }
}
```

### Get Status

```bash
GET /api/v2/swarm-coding/{sessionId}/status
```

### Get Artifacts

```bash
GET /api/v2/swarm-coding/{sessionId}/artifacts
```

### Submit Review

```bash
POST /api/v2/swarm-coding/{sessionId}/review

{
  "role": "security",
  "approved": true,
  "comments": ["JWT implementation approved", "Add rate limiting"]
}
```

### Export Code

```bash
POST /api/v2/swarm-coding/{sessionId}/export

{
  "format": "zip",
  "includeTests": true,
  "includeDocs": true
}
```

---

## 🔗 Integrations

### GitHub

**Features:**
- Push code to repository
- Create pull requests
- Add code review comments
- Link issues

**Setup:**
```bash
council config set github.token YOUR_TOKEN
council config set github.repo owner/repo
```

### GitLab

**Features:**
- Push code to repository
- Create merge requests
- Add code review comments
- CI/CD pipeline trigger

**Setup:**
```bash
council config set gitlab.token YOUR_TOKEN
council config set gitlab.repo owner/repo
```

### VS Code

**Features:**
- Direct code generation in editor
- Real-time review comments
- Quick fixes
- Test generation

**Extension:** Coming soon

### CI/CD

**Features:**
- Pipeline generation
- Test execution
- Deployment automation
- Quality gates

**Supported:**
- GitHub Actions
- GitLab CI
- Jenkins
- CircleCI

---

## 🎮 Game Studio Swarm Mode

Full integration from **Claude-Code-Game-Studios** - a comprehensive game development swarm with 48 specialized agents, 36 skills, engine references, and 8 coordination patterns.

### Quick Start

```bash
# Delegate a game development task to the swarm
"Build a combat system with dodge-roll, parry, and stamina management"
```

### Directory Structure

```
duckbot-skill/
├── game-studio-agents/      # 48 specialized agent definitions
│   ├── creative-director.md
│   ├── technical-director.md
│   ├── producer.md
│   ├── game-designer.md
│   ├── godot-specialist.md
│   ├── unity-specialist.md
│   ├── unreal-specialist.md
│   └── ... (48 total agents)
├── game-studio-skills/       # 36 workflow skills
│   ├── brainstorm/
│   ├── prototype/
│   ├── sprint-plan/
│   ├── code-review/
│   ├── design-review/
│   └── ... (36 total skills)
├── game-studio-docs/         # Documentation & references
│   ├── coordination-map.md   # Hierarchy & delegation rules
│   ├── agent-roster.md       # Complete agent listing
│   ├── engine-reference/    # Godot/Unity/Unreal refs
│   │   ├── godot/
│   │   ├── unity/
│   │   └── unreal/
│   └── workflow-guide.md
├── game-studio-templates/     # Sprint plans, bug reports, etc.
└── game-studio-rules/        # Coordination rules
```

### Coordination Hierarchy

```
                        [Human Developer]
                              |
            +-----------------+-----------------+
            |                 |                 |
    creative-director   technical-director    producer
            |                 |                 |
    +--------+--------+       |          (coordinates all)
    |        |        |       |
  game-designer  art-dir  narr-dir    lead-programmer  qa-lead
    |        |        |       |              |            |
  +--+--+  technical  writer  +--+--+--+--+--+--+--+--+  sound
  sys lvl  artist            gp ep  ai net tl ui       designer
  eco
```

### 8 Workflow Patterns

#### 1. New Feature (Full Pipeline)
```
1. creative-director  → Approves feature concept
2. game-designer     → Creates design document
3. producer          → Schedules work, identifies dependencies
4. lead-programmer   → Designs code architecture
5. [specialist]      → Implements the feature
6. qa-tester         → Writes and executes tests
7. producer          → Marks task complete
```

#### 2. Bug Fix
```
1. qa-tester         → Files bug report
2. qa-lead           → Triage severity
3. lead-programmer    → Root cause analysis
4. [programmer]      → Fixes the bug
5. qa-tester         → Verifies fix
```

#### 3. Balance Adjustment
```
1. analytics-engineer → Identifies imbalance
2. game-designer     → Evaluates issue
3. economy-designer  → Models adjustment
4. [config update]    → Change values
5. qa-tester         → Regression test
```

#### 4. New Area/Level
```
1. narrative-director → Defines narrative beats
2. world-builder      → Creates lore
3. level-designer     → Designs layout & encounters
4. art-director       → Visual direction
5. [implementation]   → Build the area
6. qa-tester         → Tests complete area
```

#### 5. Sprint Cycle
```
1. producer           → Plans sprint
2. [All agents]       → Execute tasks
3. qa-lead            → Continuous testing
4. lead-programmer    → Code review
5. producer           → Retrospective
```

#### 6. Milestone Checkpoint
```
1. producer           → Runs /milestone-review
2. creative-director  → Reviews creative progress
3. technical-director → Reviews technical health
4. qa-lead            → Quality metrics
5. [decision]         → Go/no-go discussion
```

#### 7. Release Pipeline
```
1. release-manager    → Cuts release branch
2. qa-lead            → Full regression
3. performance-analyst → Confirms benchmarks
4. devops-engineer    → Build artifacts
5. release-manager    → Deploy and monitor
```

#### 8. Rapid Prototype
```
1. game-designer      → Defines hypothesis
2. prototyper         → Scaffolds prototype
3. game-designer      → Evaluates against criteria
4. creative-director  → Go/no-go decision
```

### Example Swarm Tasks

**Feature Development:**
```
"Add a crafting system with resource gathering, recipes, and upgrade paths"
→ creative-director approves → game-designer specs → lead-programmer 
  designs → systems-designer models economy → [engine specialist] implements
```

**Bug Fix:**
```
"Player gets stuck when jumping near corner geometry"
→ qa-lead triages → lead-programmer identifies → gameplay-programmer fixes
  → qa-tester verifies → close
```

**Content Creation:**
```
"Design a boss fight for the ice dungeon"
→ game-designer specs encounter → level-designer builds layout → 
  ai-programmer defines boss AI → sound-designer audio events → qa-tester
```

### Engine-Specific Agents

**Godot 4:**
- `godot-specialist` - GDScript, node/scene, signals, resources
- `godot-gdscript-specialist` - Static typing, patterns, coroutines
- `godot-shader-specialist` - Shading language, visual shaders, VFX
- `godot-gdextension-specialist` - C++/Rust bindings, native performance

**Unity:**
- `unity-specialist` - MonoBehaviour/DOTS, Addressables, URP/HDRP
- `unity-dots-specialist` - ECS, Jobs, Burst, hybrid renderer
- `unity-shader-specialist` - Shader Graph, VFX Graph, SRP
- `unity-addressables-specialist` - Async loading, memory, CDN
- `unity-ui-specialist` - UI Toolkit, UGUI, UXML/USS

**Unreal Engine 5:**
- `unreal-specialist` - Blueprint/C++, GAS overview, UE subsystems
- `ue-gas-specialist` - Abilities, effects, attributes, tags, prediction
- `ue-blueprint-specialist` - BP/C++ boundary, graph standards
- `ue-replication-specialist` - Netcode, RPCs, relevancy, bandwidth
- `ue-umg-specialist` - UMG, CommonUI, widget hierarchy

### Skills Reference

| Skill | Purpose |
|-------|---------|
| `/brainstorm` | Generate and evaluate game ideas |
| `/prototype` | Rapid throwaway prototypes for validation |
| `/sprint-plan` | Sprint planning and daily standups |
| `/design-review` | Design document review |
| `/code-review` | Code quality and architecture review |
| `/balance-check` | Game balance analysis |
| `/milestone-review` | Milestone readiness assessment |
| `/release-checklist` | Release readiness checklist |
| `/perf-profile` | Performance profiling and optimization |
| `/playtest-report` | Playtest feedback analysis |

---

**Swarm Coding is the future of AI-powered software development!** 💻🚀
