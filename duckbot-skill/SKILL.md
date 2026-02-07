# AI Council Chamber Integration

Multi-agent deliberation and decision-making using the AI Council Chamber.

## Overview

AI Council Chamber is a multi-agent deliberation engine with 24 specialized councilors (Speaker, Technocrat, Ethicist, Visionary, etc.) that can provide multi-perspective analysis on complex topics.

## Installation

AI Council Chamber is installed at: `/home/duckets/.openclaw/workspace/AI-Bot-Council-Concensus`

**Dedicated OpenClaw version:** `/home/duckets/.openclaw/workspace/AI-Bot-Council-OpenClaw/`

## Configuration

### LM Studio Integration

All councilors are configured to use **LM Studio** local models:

**Endpoint:** `http://100.74.88.40:1234/v1/chat/completions`

**Model Mapping:**
- **High-Quality Reasoning** (Speaker, Sentinel, Specialists): `jan-v2-vl-max_moe`
- **Deep Research** (Ethicist, Visionary, Skeptic): `qwen3-next-80b-a3b-thinking`
- **Fast/Efficient** (Moderator, Pragmatist, Diplomats): `gpt-oss-20b`
- **Ultra-Fast** (Conspiracist, Libertarian, Progressive, etc.): `jan-v3-4b-base-instruct`
- **Specialized Coding** (Specialist Coder): `qwen3-coder-next`

## Usage

### Quick Start

1. **Launch AI Council Chamber:**
   ```bash
   ./start-ai-council.sh
   ```

2. **Access Web Interface:**
   - Local: `http://localhost:5173`
   - Tailscale: `https://[TAILSCALE_IP]:5173`

3. **Select Deliberation Mode:**
   - **Legislative:** Debate + Vote on proposals
   - **Deep Research:** Multi-vector research with gap analysis
   - **Swarm:** Parallel task execution
   - **Swarm Coding:** Multi-agent code generation
   - **Prediction:** Probabilistic forecasting with confidence intervals
   - **Deliberation:** Open roundtable discussion
   - **Inquiry:** Direct Q&A with councilors

4. **Enter Topic:** Type your question or proposal
5. **Watch Deliberation:** Councilors debate using local models

### Use Cases for DuckBot

#### 1. Multi-Perspective Decision Making

**Example: "Should we implement feature X?"**

AI Council provides:
- **Technocrat:** Efficiency analysis and implementation feasibility
- **Ethicist:** Moral and social impact assessment
- **Pragmatist:** Economic and timeline evaluation
- **Skeptic:** Risk identification and worst-case scenarios
- **Speaker:** Synthesized recommendation

#### 2. Adversarial Testing

**Example: "Review this architecture proposal"**

Council will:
- Find implementation flaws (Skeptic)
- Identify security vulnerabilities (Sentinel)
- Suggest efficiency improvements (Technocrat)
- Assess scalability (Pragmatist)
- Challenge assumptions (Skeptic, Conspiracist)

#### 3. Deep Research

**Example: "Research best practices for X"**

Council executes:
- **Phase 1:** Breadth search across multiple vectors
- **Gap Analysis:** Identify missing information
- **Phase 2:** Targeted drill-down on gaps
- **Report:** Comprehensive dossier with citations

#### 4. Security Assessment

**Example: "Analyze security risks of this plan"**

Specialists provide:
- **Sentinel:** Threat vectors and defense posture
- **Specialist Legal:** Compliance and liability assessment
- **Specialist Military:** Tactical vulnerabilities
- **Specialist Medical:** If applicable: biological/health risks

#### 5. Risk Management

**Example: "What are the top 5 risks of this project?"**

Council identifies:
- Technical risks (Technocrat)
- Financial risks (Pragmatist)
- Security risks (Sentinel)
- Implementation risks (Skeptic)
- Regulatory risks (Legal Specialist)

#### 6. Probabilistic Forecasting

**Example: "What is the probability this will succeed?"**

Council provides:
- Base rates from historical precedents (Historian)
- Confidence intervals (0-100%)
- Timeline estimates
- Evidence-based reasoning

## Deliberation Modes

### 1. Legislative Proposal
**Best for:** Policy decisions, feature debates, go/no-go decisions

**Process:**
1. Speaker opens topic
2. Councilors state positions
3. Rebuttals and challenges
4. Vote (YEA/NAY with confidence 0-10)
5. Speaker issues final ruling

### 2. Deep Research
**Best for:** Comprehensive investigation, multi-vector analysis

**Process:**
1. Decompose topic into search vectors
2. Assign vectors to councilors based on expertise
3. Phase 1: Breadth search
4. Gap analysis
5. Phase 2: Targeted drill-down
6. Compile comprehensive dossier

### 3. Swarm Coding
**Best for:** Multi-file changes, complex features, refactoring

**Process:**
1. Architect decomposes task
2. Assign sub-tasks to swarm agents
3. Parallel code generation
4. Integration testing
5. Product lead presents final solution

### 4. Prediction Market
**Best for:** Success probability, timeline estimation, risk forecasting

**Process:**
1. Frame as probabilistic question
2. Identify key variables
3. Councilors research base rates
4. Provide confidence intervals (0-100%)
5. Final prediction with reasoning

### 5. Deliberation
**Best for:** Open discussion, roundtable analysis, brainstorming

**Process:**
1. Speaker opens roundtable
2. Councilors discuss freely
3. Speaker synthesizes discussion

### 6. Inquiry
**Best for:** Direct Q&A, expert consultation

**Process:**
1. Speaker directs councilors
2. Councilors answer based on expertise
3. Speaker compiles final answer

## Performance Considerations

### Model Load Times
- **jan-v3-4b:** ~2 seconds (cached)
- **gpt-oss-20b:** ~10 seconds (first load), ~3 seconds (cached)
- **qwen3-80b:** ~40 seconds (first load), ~8 seconds (cached)
- **jan-v2-max:** ~38 seconds (first load), ~5 seconds (cached)

### Parallel Processing
- **Economy Mode Enabled:** Multiple councilors respond in parallel
- **Max Concurrent:** 2 requests at a time
- **First Load Penalty:** Initial session will be slow as models load

### Optimization Tips
1. **Warm Up Models:** Run a quick session first to load all models
2. **Use Economy Mode:** Enabled by default for parallel responses
3. **Context Pruning:** Automatically prunes to 8 turns to save tokens
4. **Model Caching:** Subsequent sessions are much faster

## Integration with DuckBot

### For Routine Tasks
Use AI Council Chamber when:
- Making strategic decisions
- Evaluating architecture proposals
- Risk assessment
- Security review
- Multi-perspective analysis

### For Quick Tasks
Use direct sub-agent delegation when:
- Simple code changes
- Status checks
- Single-perspective questions
- Fast response required

### For Complex Problems
Use AI Council Chamber when:
- Multiple perspectives needed
- Adversarial testing required
- Risk assessment critical
- Decision quality important
- Stakeholder buy-in needed

## Troubleshooting

### LM Studio Not Responding
```bash
# Check if LM Studio is running
curl http://100.74.88.40:1234/v1/models

# Check model availability
curl http://100.74.88.40:1234/v1/models | jq '.data[].id'
```

### Port 5173 Already in Use
```bash
# Kill existing process
lsof -i :5173
kill -9 [PID]

# Or use different port
PORT=3001 npm run dev
```

### Models Taking Too Long to Load
- First load is expected to be slow (up to 60 seconds)
- Subsequent loads are much faster (3-8 seconds)
- Run a warm-up session first

### Council Not Responding
1. Check LM Studio endpoint in Settings
2. Verify models are loaded on LM Studio
3. Check browser console for errors
4. Try with Economy Mode disabled

## Advanced Features

### MCP Tool Integration
AI Council Chamber supports MCP (Model Context Protocol) tools:
- Google Search (for research)
- Git repo access
- Postgres queries
- Docker control
- Custom tools

Configure in: Settings > MCP > Tools

### Specialist Councilors
Access specialists directly for expert consultation:
- **Specialist Coder:** Software development
- **Specialist Legal:** Law and compliance
- **Specialist Science:** Physics, chemistry, biology
- **Specialist Finance:** Economics and markets
- **Specialist Military:** Defense and strategy
- **Specialist Medical:** Health and medicine

### Custom Personas
Create custom councilors with specific personas:
- Open Settings > Bots
- Click "Add Bot"
- Configure persona, model, role
- Use for specialized domains

## Best Practices

### When to Use AI Council
✅ Complex decisions requiring multiple perspectives
✅ Strategic planning and risk assessment
✅ Architecture review and design evaluation
✅ Security analysis and vulnerability assessment
✅ Multi-vector research and investigation
✅ Probabilistic forecasting and prediction
✅ Adversarial testing and stress-testing ideas

### When NOT to Use AI Council
❌ Simple status checks (use jan-v3-4b directly)
❌ Quick code edits (use qwen3-coder-next directly)
❌ Routine monitoring tasks (use main agent)
❌ Time-critical operations (too slow with multiple models)

### Council Selection Tips
- **Strategic Decisions:** Use full council (24 members)
- **Quick Decisions:** Use subset (Speaker + 3-4 key councilors)
- **Technical Decisions:** Use Specialists + Technocrat + Skeptic
- **Policy Decisions:** Use Ethicist + Pragmatist + Diplomat + Visionary
- **Security Decisions:** Use Sentinel + Military Specialist + Skeptic

## Memory & Documentation

Log all AI Council sessions in:
- `/home/duckets/.openclaw/workspace/logs/ai-council/`

Update:
- MEMORY.md with AI Council insights and decisions
- HEARTBEAT.md with AI Council integration status
- INTEGRATION-PLAN.md for ongoing maintenance

---

**Integration Status:** ✅ Operational
**Last Updated:** 2026-02-06 18:30 EST
**Configuration:** All 24 councilors enabled, LM Studio integration complete
