
# 🏛️ AI Council Chamber

**The Definitive Multi-Agent Governance & Deliberation Engine**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Gemini-blue)](https://ai.google.dev/)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev/)

The **AI Council Chamber** is a sophisticated, multi-agent legislative simulator designed to analyze complex problems through the lens of diverse, competing personas. It transforms solitary AI interaction into a parliamentary process, ensuring that every idea is debated, stress-tested, and refined before a conclusion is reached.

---

## 🌟 Why This Exists

Standard AI interfaces (like ChatGPT or standard Gemini) often suffer from **"Yes-Man Syndrome"**—they agree with the user's premise to be helpful. This is dangerous for decision-making.

The **AI Council Chamber** solves this by enforcing **Adversarial Collaboration**. By simulating a room full of experts with conflicting priorities (e.g., An Ethicist vs. A Technocrat vs. A Skeptic), the system forces the AI to check its own biases, uncover blind spots, and produce a significantly more balanced and robust output.

### Core Philosophy: **"Conflict Creates Clarity"**

---

## 🚀 Key Capabilities

### 1. Multi-Modal Deliberation Engines
The Council operates in distinct modes tailored to your specific needs:

*   **⚖️ Legislative Proposal (Default)**: The standard parliamentary flow. You propose a motion, the Council debates it in rounds, challenges each other, votes, and the Speaker enacts a binding decree.
*   **🧠 Deep Research (Agentic)**: A recursive investigation mode. The Speaker breaks a topic into vectors, assigns agents to perform breadth and depth searches using Google Search, identifies gaps, and compiles a comprehensive dossier.
*   **🐝 Swarm Hive**: Inspired by OpenAI's *Swarm*. A dynamic task-decomposition engine. The Speaker spawns ephemeral "Drone Agents" to execute massive parallel tasks.
*   **💻 Swarm Coding**: A dedicated software engineering workflow where the Council transforms into a Dev Team (Architect, Backend, Frontend, SecOps) to write production-ready code. Includes a dedicated **IDE-Style UI** with file explorer and preview.
*   **🔮 Prediction Market**: Superforecasting mode. The Council performs a "Pre-Mortem", analyzes base rates, and generates probabilistic forecasts with confidence intervals.
*   **🗣️ Inquiry**: A rapid-fire Q&A mode where the user asks questions and the Council provides specific answers synthesized by the Speaker.

### 2. The Councilors (Personas)
The system comes pre-loaded with archetypes designed to cover the full spectrum of human thought:
*   **The Speaker (Gemini 3 Pro)**: The objective judge. Synthesizes arguments and issues rulings.
*   **The Technocrat**: Values efficiency and raw data above all.
*   **The Ethicist**: Prioritizes morality and human well-being.
*   **The Pragmatist**: Focuses on cost, feasibility, and immediate implementation.
*   **The Skeptic**: The Devil's Advocate. Looks for flaws and risks.
*   **Specialist Agents**: Dynamic sub-agents for Law, Science, Finance, and Military strategy.
*   ...and many more (Journalist, Psychologist, Conspiracist).

### 3. Advanced Tooling & Integration
*   **Google Search Grounding**: Agents actively verify claims in real-time.
*   **Native MCP Tools**: Built-in client-side tools for **GitHub User Lookup**, **Math Evaluation**, **Weather**, **Crypto Prices**, **Wikipedia**, and **Random Identity Generation**.
*   **YouTube Analysis**: Paste a video URL, and agents will find transcripts/summaries to debate the content.
*   **Direct Consultation**: Click any Councilor to open a private, off-the-record side channel.
*   **Live Audio Audience**: Speak directly to the Council using Gemini's native low-latency audio API.
*   **Broadcast Mode**: The Council speaks back using distinct neural voices for each persona.

---

## ⚙️ Setup & Configuration

### Prerequisites
1.  **Node.js** (v18 or higher)
2.  **Google Gemini API Key** (Get one at [aistudio.google.com](https://aistudio.google.com))

### Installation
1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/ai-council-chamber.git
    cd ai-council-chamber
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

### Provider Configuration
The Council supports a wide range of LLM providers. Configure them in **Settings > API**:

*   **Google Gemini**: Primary driver for the Speaker and complex reasoning.
*   **OpenRouter**: Access to Claude 3.5, GPT-4o, Llama 3.1 405B.
*   **Local Models**: First-class support for **Ollama**, **LM Studio**, and **Jan AI** (local endpoints).
*   **Specialized APIs**: Support for **Moonshot (Kimi)**, **Minimax**, and **Z.ai**.

---

## 💡 Use Cases

### For Developers
*   **Architecture Review**: Use *Swarm Coding* mode. Ask the Council to "Critique this system design." The Sentinel will find security flaws, The Technocrat will find bottlenecks, and The Pragmatist will complain about maintenance costs.
*   **Code Generation**: Enable **Pro Coding UI** in settings. Ask the Council to build a full-stack app. Watch as the Architect assigns files to the swarm and they are generated in real-time.

### For Writers & Worldbuilders
*   **Scenario Simulation**: "What happens if humanity discovers FTL travel tomorrow?" Watch the Historian, Diplomat, and Sentinel debate the geopolitical fallout.
*   **Character Workshop**: Use *Direct Consultation* to interview specific personas to flesh out character voices.

### For Business Leaders
*   **Strategic Planning**: Propose a new business strategy. The Council will stress-test it against market forces (The Economist), ethical risks (The Ethicist), and execution realities (The Pragmatist).

---

## 🛠️ Architecture

The application is built on a modern React stack designed for performance and modularity.

*   **Frontend**: React 18, TypeScript, Tailwind CSS, Recharts.
*   **AI Orchestration**: Custom `aiService` layer that handles prompt injection, context pruning, and multi-provider routing.
*   **State Management**: Complex local state orchestration to handle the asynchronous "Turn-Taking" of the debate cycle.
*   **Streaming**: Real-time token streaming for a responsive, "alive" feel.
*   **Mobile First**: Fully responsive layout using dynamic viewport units (`100dvh`) to function as a PWA.

---

## 🤝 Contributing

We welcome contributions!
*   **New Personas**: Submit a PR adding new archetypes to `constants.ts`.
*   **MCP Tools**: Add new schemas to the Public Registry.
*   **UI Enhancements**: Help us make the chamber even more immersive.

---

## 🔌 Agent Integration Guide

### Overview
The AI Council Chamber is designed to be integrated with other AI agents (OpenClaw, DuckBot, custom agents). This enables autonomous agents to request multi-perspective deliberations, adversarial testing, and complex decision-making.

---

### Integration Methods

#### 1. Python Client (Recommended)

**Location:** `tools/ai-council-client.py` (create this file)

**Quick Start:**
```python
#!/usr/bin/env python3
import requests
import json

# Auto-detect AI Council port
PORTS = [3000, 3001, 8000]
BASE_URL = None

for port in PORTS:
    try:
        r = requests.get(f"http://localhost:{port}/health", timeout=1)
        if r.status_code == 200:
            BASE_URL = f"http://localhost:{port}"
            break
    except:
        pass

if not BASE_URL:
    print("❌ AI Council Chamber not found")
    exit(1)

print(f"✅ Auto-detected AI Council on port {BASE_URL.split(':')[-1]}")

# Submit deliberation request
def deliberate(topic, mode="legislative"):
    response = requests.post(f"{BASE_URL}/api/deliberate", json={
        "topic": topic,
        "mode": mode
    })
    return response.json()

# Example: Get multi-perspective analysis
result = deliberate("Should we implement feature X?")
print(f"Result: {result}")
```

**Available Modes:**
- `legislative` - Debate + vote
- `research` - Deep research with Google Search
- `swarm` - Task decomposition
- `coding` - Swarm coding mode
- `prediction` - Probabilistic forecasting
- `inquiry` - Direct Q&A

---

#### 2. REST API Endpoints

**Health Check:**
```bash
GET /health
# Returns: {"status": "ok", "version": "1.0.0"}
```

**Submit Deliberation:**
```bash
POST /api/deliberate
Content-Type: application/json

{
  "topic": "Should we implement feature X?",
  "mode": "legislative",
  "councilors": ["technocrat", "ethicist", "skeptic"],  // Optional: Select specific councilors
  "model": "jan-v2-vl-max_moe"  // Optional: Override default model
}

# Returns:
{
  "session_id": "abc123",
  "status": "running",
  "results_url": "/api/session/abc123"
}
```

**Get Session Results:**
```bash
GET /api/session/{session_id}

# Returns:
{
  "status": "completed",
  "topic": "Should we implement feature X?",
  "consensus": "Recommended: Implement with caution",
  "votes": {
    "for": 3,
    "against": 1,
    "abstain": 1
  },
  "arguments": [...],
  "speaker_synthesis": "..."
}
```

**Direct Inquiry:**
```bash
POST /api/inquire
Content-Type: application/json

{
  "question": "What are the top 5 risks of this plan?",
  "councilor": "sentinel"  // Optional: Specific councilor
}
```

---

#### 3. OpenClaw Integration

**Skill Integration:**

Create a skill file: `skills/ai-council/SKILL.md`

```markdown
# AI Council Chamber Integration

Use AI Council Chamber for multi-perspective decision making and adversarial testing.

## Installation

AI Council Chamber should be running on http://localhost:3000/

## Usage

### Quick Deliberation
Use this skill when you need:
- Multi-perspective analysis of complex decisions
- Adversarial testing to find flaws
- Risk assessment before implementing features
- Deep research on topics

### Example Prompts
- "Ask AI Council: Should we prioritize X or Y?"
- "Get adversarial feedback on this plan"
- "Use AI Council to assess risks"
- "Research best practices for [topic]"

### Integration Commands
```python
# Use ai-council-client.py
./tools/ai-council-client.py deliberate "Should we implement X?"
./tools/ai-council-client.py research "Best practices for Y"
./tools/ai-council-client.py legislative "Propose Z"
```

### When to Use
- Strategic decisions requiring balanced perspectives
- Architecture reviews (use Swarm Coding mode)
- Security assessments (use Sentinel councilor)
- Risk analysis (use Prediction Market mode)
- Complex research tasks (use Deep Research mode)

### When NOT to Use
- Simple Q&A (use main model)
- Fast status checks (use small models)
- Code generation (use coding sub-agents)
```

**OpenClaw Configuration:**

Add to `openclaw.json`:
```json
{
  "tools": {
    "aiCouncil": {
      "enabled": true,
      "endpoint": "http://localhost:3000",
      "modes": ["legislative", "research", "swarm", "coding", "prediction", "inquiry"]
    }
  }
}
```

---

#### 4. Environment Variables

**Required for AI Council Chamber:**

```bash
# .env file
GEMINI_API_KEY=your-gemini-api-key-here
LM_STUDIO_ENDPOINT=http://localhost:1234/v1  # For local models
OLLAMA_ENDPOINT=http://localhost:11434/v1      # For Ollama
JAN_AI_ENDPOINT=http://localhost:1337/v1        # For Jan AI
```

**Provider Configuration:**

Navigate to **Settings > API** in the web UI to configure:
- Google Gemini (primary)
- OpenRouter (Claude, GPT-4o)
- LM Studio (local)
- Ollama (local)
- Jan AI (local)

---

### Best Practices for Agent Integration

#### 1. Mode Selection
- **Strategic Decisions:** Use `legislative` mode for balanced debate
- **Deep Research:** Use `research` mode for comprehensive investigation
- **Security Reviews:** Use `prediction` mode with `sentinel` councilor
- **Code Reviews:** Use `coding` mode for swarm-based code analysis
- **Simple Questions:** Use `inquiry` mode for direct Q&A

#### 2. Councilor Selection
- **General Analysis:** Use default councilors (Speaker, Technocrat, Ethicist, Pragmatist, Skeptic)
- **Security-Focused:** Add `sentinel`, `technocrat`
- **Legal/Ethical:** Add `lawyer`, `ethicist`
- **Technical:** Add `architect`, `scientist`
- **Financial:** Add `economist`

#### 3. Model Selection
- **Complex Reasoning:** Use `jan-v2-vl-max_moe` (Jan v2 Max)
- **Deep Research:** Use `qwen3-next-80b-a3b-thinking` (Qwen 3 80B)
- **Fast Tasks:** Use `jan-v3-4b-base-instruct` (Jan v3 4B)
- **Coding:** Use `qwen3-coder-next` (Qwen 3 Coder)

#### 4. Error Handling
```python
try:
    result = deliberate("Topic")
    if result.get("status") == "completed":
        return result["speaker_synthesis"]
    else:
        return "Council deliberation in progress..."
except requests.exceptions.ConnectionError:
    return "AI Council Chamber not available"
except Exception as e:
    return f"Error: {str(e)}"
```

#### 5. Async Patterns
For long-running deliberations (research, swarm):
```python
# Submit request asynchronously
session = requests.post(f"{BASE_URL}/api/deliberate", json={
    "topic": topic,
    "mode": "research",
    "async": true
}).json()

# Poll for results
while True:
    result = requests.get(f"{BASE_URL}/api/session/{session['session_id']}").json()
    if result["status"] == "completed":
        break
    time.sleep(2)

return result["speaker_synthesis"]
```

---

### Example Workflows

#### Workflow 1: Security Review
```python
# 1. Use Sentinel councilor for security assessment
result = requests.post(f"{BASE_URL}/api/inquire", json={
    "question": "What are the security vulnerabilities in this architecture?",
    "councilor": "sentinel"
})

# 2. Use prediction market for risk assessment
risk = requests.post(f"{BASE_URL}/api/deliberate", json={
    "topic": "Probability of security breach within 6 months",
    "mode": "prediction"
})

# 3. Combine results for comprehensive report
report = f"""
Security Assessment:
- Vulnerabilities: {result.json()['answer']}
- Risk Probability: {risk.json()['consensus']}
"""
```

#### Workflow 2: Architecture Review
```python
# 1. Use swarm coding mode
result = requests.post(f"{BASE_URL}/api/deliberate", json={
    "topic": "Review and improve this system design",
    "mode": "coding",
    "councilors": ["architect", "backend", "frontend", "secops"]
})

# 2. Use legislative mode for final vote
vote = requests.post(f"{BASE_URL}/api/deliberate", json={
    "topic": "Should we proceed with this architecture?",
    "mode": "legislative",
    "context": result.json()['design_recommendations']
})
```

#### Workflow 3: Strategic Planning
```python
# 1. Deep research on market trends
research = requests.post(f"{BASE_URL}/api/deliberate", json={
    "topic": "Market trends for AI agents in 2026",
    "mode": "research"
})

# 2. Legislative debate on strategy
strategy = requests.post(f"{BASE_URL}/api/deliberate", json={
    "topic": "Strategic plan: Build vs Buy AI infrastructure",
    "mode": "legislative",
    "context": research.json()['findings']
})

# 3. Prediction market for success probability
forecast = requests.post(f"{BASE_URL}/api/deliberate", json={
    "topic": "Success probability of this strategy",
    "mode": "prediction",
    "context": strategy.json()['consensus']
})
```

---

### Troubleshooting

#### Issue: Connection Refused
**Solution:** Ensure AI Council Chamber is running
```bash
cd AI-Bot-Council-Concensus
npm run dev
```

#### Issue: Model Not Found
**Solution:** Configure models in Settings > API
- Check LM Studio endpoint: `http://localhost:1234/v1`
- Verify model IDs: `jan-v2-vl-max_moe`, `qwen3-next-80b-a3b-thinking`
- Test model connectivity in Settings

#### Issue: Slow Response
**Solution:**
- Use faster models for quick inquiries (`jan-v3-4b`)
- Enable async mode for long deliberations
- Reduce councilor count for faster decisions

#### Issue: Councilor Not Responding
**Solution:**
- Check provider configuration for that councilor
- Verify API key is valid
- Try different model/provider for that councilor

---

## 📄 License
MIT License. Free to use, modify, and govern.
