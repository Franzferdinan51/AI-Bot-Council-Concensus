# AI Council Chamber MCP Server

> ⚠️ **COST WARNING**: This server makes multiple AI API calls during sessions. Council sessions can generate 10-50+ API calls, and Enhanced Swarm Coding uses 12+ phases with parallel execution. **Using paid APIs (OpenAI, Claude, OpenRouter) can result in significant costs.** Use economy mode, test with free tiers, or use local models (Ollama, LM Studio) to control expenses.

A **stand-alone** Model Context Protocol (MCP) server that provides multi-agent legislative simulation and deliberation engine. Transform AI interactions into a parliamentary debate process where diverse personas collaborate, challenge, and reach collective decisions.

## 🚀 What This Is

This is a **complete, standalone MCP server** - no web interface needed! Simply install the dependencies, configure your API keys, and start the server. The server provides **13 MCP tools** that can be integrated into any MCP-compatible AI assistant (Claude Desktop, custom MCP clients, etc.).

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure API keys
cp .env.example .env
# Edit .env and add your API keys

# 3. Build the server
npm run build

# 4. Start the server
start.bat    # Windows (shows interactive menu)
# OR
./start.sh   # Linux/Mac

# Helper scripts
- `npm run mcp` – build + start MCP server (STDIO)
- `npm run start:http` – start lightweight HTTP bridge (`/health`, `/list-tools`, `/call-tool`)
- `npm run health` – quick health probe (JSON then exit)
- `npm run gen:mcp` – generate `mcp.json` from current environment

# Or use the interactive setup wizard
start.bat    # Then choose option 2 for setup
```

## Installation

```bash
# Clone or download this standalone folder
cd ai-council-mcp-server

# Install dependencies
npm install

# Configure environment (optional - can use environment variables instead)
cp .env.example .env
# Edit .env and add your API keys

# Build TypeScript
npm run build

# Start the server
./start.sh                    # Linux/Mac
start.bat                     # Windows
```

## Configuration

### Option 1: .env File
Create a `.env` file using `.env.example` as a template:

```bash
# Google Gemini (Recommended)
GEMINI_API_KEY=your_gemini_api_key

# OpenRouter (Alternative)
OPENROUTER_API_KEY=your_openrouter_key

# Local models
LM_STUDIO_ENDPOINT=http://localhost:1234/v1/chat/completions
OLLAMA_ENDPOINT=http://localhost:11434/v1/chat/completions

# Server settings
MAX_CONCURRENT_REQUESTS=2
ECONOMY_MODE=true
MAX_CONTEXT_TURNS=8
```

### Option 2: Environment Variables
```bash
export GEMINI_API_KEY=your_api_key
export MAX_CONCURRENT_REQUESTS=2
npm run build && ./start.sh
```

### Option 3: Interactive Setup Wizard (Windows)
```cmd
start.bat
# Then choose option 2 from the menu
```

### Core Features

- **15 Session Modes**: Proposal, Deliberation, Inquiry, Research, Swarm, Swarm Coding, Prediction, Advisory, Arbitration, Negotiation, Brainstorming, Peer Review, Strategic Planning, Design Review, Risk Assessment
- **20+ Pre-configured Personas**: Technocrat, Ethicist, Pragmatist, Visionary, Sentinel, Historian, Diplomat, Skeptic, and more
- **Multi-Provider AI Support**: Google Gemini, OpenRouter, LM Studio, Ollama, Z.ai, Moonshot, Minimax, and OpenAI-compatible APIs
- **Voting & Consensus System**: Structured voting with weighted voting and consensus scores
- **Prediction Mode**: Superforecasting with probabilistic outcomes
- **Advisory Mode**: Strategic guidance and best practices consultation across 6 domains
- **Swarm Coding**: Software development workflow with configurable pipeline modes (6/12/24 phases)
- **Memory System**: Persisted precedents and knowledge base
- **Bot-Specific Memory**: Each bot maintains persistent context and memories across sessions ⭐ NEW
- **Real-time Streaming**: Live token streaming for responsive sessions

### Available MCP Tools

This server provides **14+ MCP tools** organized in three categories:

#### 1. Council Session Tools (9 tools)
- `council_proposal` - Legislative proposal with voting
- `council_deliberation` - Open roundtable discussion
- `council_inquiry` - Direct Q&A format
- `council_research` - Deep multi-phase research
- `council_swarm` - Parallel task execution
- `council_swarm_coding` - **Enhanced 12-phase professional development pipeline** ⭐
- `council_prediction` - Superforecasting with probabilities
- `council_advisory` - Strategic guidance and best practices consultation ⭐
- `council_auto` - Smart mode selection (meta-tool)

#### 2. Session Management Tools (6 tools)
- `council_list_sessions` - List all sessions
- `council_get_session` - Get session details
- `council_get_transcript` - Get formatted transcript (text/markdown/json) ⭐
- `council_stop_session` - Stop a session
- `council_pause_session` - Pause/resume a session
- `council_diagnostics` - Server health check and diagnostics ⭐

#### 3. Management Tools (9 tools)
- `council_list_bots` - List all councilor bots
- `council_update_bot` - Update bot configuration
- `council_add_memory` - Add precedent to memory
- `council_search_memories` - Search memories
- `council_list_memories` - List all memories
- `council_add_document` - Add knowledge base document
- `council_search_documents` - Search documents
- `council_list_documents` - List all documents
- Bot Memory Management: Each bot automatically maintains personal memories ⭐

### Core Features

- **14 Session Modes**: Proposal, Deliberation, Inquiry, Research, Swarm, Swarm Coding, Prediction, Arbitration, Negotiation, Brainstorming, Peer Review, Strategic Planning, Design Review, Risk Assessment
- **20+ Pre-configured Personas**: Technocrat, Ethicist, Pragmatist, Visionary, Sentinel, Historian, Diplomat, Skeptic, and more
- **Multi-Provider AI Support**: Google Gemini, OpenRouter, LM Studio, Ollama, Z.ai, Moonshot, Minimax, and OpenAI-compatible APIs
- **Voting & Consensus System**: Structured voting with weighted voting and consensus scores
- **Prediction Mode**: Superforecasting with probabilistic outcomes
- **Swarm Coding**: Software development workflow with configurable pipeline modes (6/12/24 phases)
- **Memory System**: Persisted precedents and knowledge base
- **Bot-Specific Memory**: Each bot maintains persistent context and memories across sessions ⭐ NEW
- **Real-time Streaming**: Live token streaming for responsive sessions

### Latest Improvements (v2.2) ⭐

#### ✨ New Features
- **Bot-Specific Memory System**: Each council bot now maintains persistent, personalized memories across sessions! Bots can remember facts, directives, and observations from previous interactions, enabling continuity-aware conversations. Directives are always included in context, while facts/observations are intelligently matched to current topics.
- **Enhanced Knowledge Storage**: 30-day memory retention with 500-memory cap per bot, automatic cleanup, and smart context retrieval

### Latest Improvements (v2.1) ⭐

#### ✨ New Features
- **Enhanced Session Persistence**: Auto-save interval reduced from 30s to 2s for better data safety
- **Flexible Input Validation**: Accepts sessionId in multiple formats (string, object, array)
- **New Transcript Tool**: `council_get_transcript` with text/markdown/json output formats
- **Built-in Diagnostics**: `council_diagnostics` tool for testing server health and reporting errors
- **Connection Guide**: Comprehensive `CONNECTION_GUIDE.md` for easier integration

#### 🔧 Integration Improvements
- **Better Error Messages**: Clear, actionable error reporting for connected bots
- **Improved MCP Compatibility**: Enhanced compatibility with Claude Code CLI and other MCP clients
- **Flexible Input Handling**: Tools accept inputs in various formats to reduce client-side complexity
- **Comprehensive Logging**: Detailed server status and health checks

### Version 2.0 Improvements

#### ✨ New Features
- **Meta-Tool (council_auto)**: Smart session mode selection based on topic analysis
- **Weighted Voting**: Configurable vote weights (Speaker=2.0, Core=1.5, Regular=1.0)
- **Session Persistence**: Disk-based storage with auto-save
- **Interactive Setup Wizard**: 4-step configuration (Windows)

#### 🛡️ Quality & Reliability
- **Unified Input Validation**: All 13 MCP tools with XSS protection
- **Recursion Protection**: Max depth 3, cooldown 500ms
- **Hard Limits**: 4000 tokens, 20 rounds, 10 messages/round
- **Global Error Handling**: Centralized middleware with categorization
- **Structured Logging**: Service-specific loggers with context
- **Enhanced TypeScript**: Branded IDs, type guards, utility types

#### 📚 Documentation & Tools
- **13 Example Tool Calls**: Comprehensive JSON examples
- **Detailed Setup Guide**: `SETUP.md`
- **Troubleshooting Guide**: 50+ common issues (`TROUBLESHOOTING.md`)
- **Installation Guide**: `INSTALL.md`

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd ai-council-mcp-server

# Option 1: Use the startup script (recommended)
./start.sh                    # Linux/Mac
# or
start.bat                     # Windows (shows interactive menu)

# Option 2: Manual setup
npm install
npm run build
npm start
```

### Quick Start with API Key

```bash
# Set your API key and start
export GEMINI_API_KEY=your_key
./start.sh

# Or inline (Linux/Mac)
GEMINI_API_KEY=your_key ./start.sh

# Windows (Command Prompt)
set GEMINI_API_KEY=your_key& start.bat

# Or use the interactive menu:
start.bat
```

### Configuring Custom Models for Bots

Each bot/persona can use a different AI model. This is perfect for:
- Using Claude for some bots, GPT-4 for others
- Optimizing costs (use faster models for simple tasks)
- Experimenting with different models for different personas
- Supporting multiple AI providers simultaneously

**Option 1: Interactive Configuration (Windows)**

Run the interactive menu:
```cmd
start.bat
# Then choose option 3: "Configure Bot Models"
```

Choose from:
1. **Quick Configure** - Set one model for all bots
2. **Advanced Configure** - Set individual models for each bot
3. **Reset to defaults** - Remove custom models

**Option 2: Manual Configuration**

Edit your `.env` file directly:

```bash
# Configure Speaker to use Claude 3.5 Sonnet via OpenRouter
MODEL_SPEAKER_HIGH_COUNCIL=anthropic/claude-3.5-sonnet

# Configure Technocrat to use GPT-4o
MODEL_COUNCILOR_TECHNOCRAT=openai/gpt-4o

# Configure Specialist Coder to use Llama
MODEL_SPECIALIST_CODE=meta-llama/llama-3.1-70b-instruct

# Use different models for different modes
MODEL_COVNILOR_ETHICIST=anthropic/claude-3-haiku
```

**Available Models:**

- **Gemini**: `gemini-2.5-flash`, `gemini-1.5-pro`
- **OpenRouter**: `anthropic/claude-3.5-sonnet`, `anthropic/claude-3-haiku`, `openai/gpt-4o`, `openai/gpt-4o-mini`, `meta-llama/llama-3.1-70b-instruct`
- **OpenAI**: `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo`
- **Local**: Any model name for Ollama/LM Studio

**Example Configuration:**

```bash
# High Council Speaker uses premium model
MODEL_SPEAKER_HIGH_COUNCIL=anthropic/claude-3.5-sonnet
AUTHOR_TYPE_SPEAKER_HIGH_COUNCIL=openrouter

# Other bots use faster, cheaper models
MODEL_COUNCILOR_TECHNOCRAT=openai/gpt-4o-mini
MODEL_COUNCILOR_ETHICIST=openai/gpt-4o-mini
MODEL_COUNCILOR_PRAGMATIST=gemini-2.5-flash
```

**Author Type Configuration (Optional):**

You can also specify which provider to use per bot:

```bash
# Use OpenRouter for Speaker
AUTHOR_TYPE_SPEAKER_HIGH_COUNCIL=openrouter

# Use Gemini for Technocrat
AUTHOR_TYPE_COUNCILOR_TECHNOCRAT=gemini

# Use local Ollama for Specialist
AUTHOR_TYPE_SPECIALIST_CODE=ollama
```

**Environment Variable Format:**

- `MODEL_<BOT-ID>` - Set the model for a specific bot
- `AUTHOR_TYPE_<BOT-ID>` - Set the provider for a specific bot

Bot IDs are uppercase versions of the bot names:
- `speaker-high-council` → `MODEL_SPEAKER_HIGH_COUNCIL`
- `councilor-technocrat` → `MODEL_COUNCILOR_TECHNOCRAT`
- `specialist-code` → `MODEL_SPECIALIST_CODE`

**Changes Take Effect:**

After configuring models, restart the server:
```bash
npm start
# or
start.bat
```

### 💰 Cost Management & Optimization

**Important**: Council sessions involve multiple AI models communicating. Costs can add up quickly!

#### **Cost Estimates:**

| Session Type | Typical API Calls | Est. Cost (Claude) | Est. Cost (GPT-4o) |
|--------------|------------------|-------------------|-------------------|
| Quick Inquiry | 5-10 calls | $0.10 - $0.30 | $0.05 - $0.15 |
| Full Proposal | 15-30 calls | $0.30 - $1.00 | $0.15 - $0.50 |
| Prediction Mode | 20-40 calls | $0.50 - $1.50 | $0.25 - $0.75 |
| **Enhanced Swarm Coding** | **50-100+ calls** | **$1.00 - $5.00** | **$0.50 - $2.50** |

*Costs vary based on input/output length and model pricing*

#### **How to Control Costs:**

**1. Use Economy Mode (Recommended)**
```bash
# In .env or setup wizard
ECONOMY_MODE=true
```
- Reduces API calls by ~50%
- Limits context length
- Uses fewer councilors

**2. Use Local Models (Free)**
```bash
# Install Ollama (free, local)
ollama pull llama3:latest
ollama pull codellama:latest

# Or use LM Studio (free, local)
# Download from: lmstudio.ai
```
- Zero API costs
- Runs on your machine
- Good for testing and development

**3. Optimize Model Selection**
```bash
# Use cheaper models for most bots
MODEL_COUNCILOR_TECHNOCRAT=openai/gpt-4o-mini  # $0.15/1M tokens
MODEL_COUNCILOR_ETHICIST=anthropic/claude-3-haiku  # $0.25/1M tokens

# Use premium only for critical tasks
MODEL_SPEAKER_HIGH_COUNCIL=anthropic/claude-3.5-sonnet  # $3/1M tokens
```

**4. Limit Concurrent Requests**
```bash
MAX_CONCURRENT_REQUESTS=1  # Sequential instead of parallel
```
- Slower but cheaper
- Better for budget consciousness

**5. Test Before Production**
- Start with free models (Ollama, LM Studio)
- Test with economy mode enabled
- Monitor costs with provider dashboards
- Gradually upgrade to paid models

**6. Provider Comparison (per 1M tokens)**
- **Claude 3.5 Sonnet**: $3 (input) / $15 (output)
- **GPT-4o**: $2.50 (input) / $10 (output)
- **GPT-4o-mini**: $0.15 (input) / $0.60 (output)
- **Gemini 2.5 Flash**: $0.35 (input) / $1.05 (output)
- **Local Models**: FREE (after setup)

**7. Budget-Friendly Setup Example**
```bash
# .env configuration for low-cost testing
ECONOMY_MODE=true
MAX_CONCURRENT_REQUESTS=1
MAX_CONTEXT_TURNS=5

# Use free local models
MODEL_SPEAKER_HIGH_COUNCL=llama3:latest
AUTHOR_TYPE_SPEAKER_HIGH_COUNCIL=ollama
MODEL_COUNCILOR_TECHNOCRAT=llama3:latest
AUTHOR_TYPE_COUNCILOR_TECHNOCRAT=ollama
MODEL_COUNCILOR_ETHICIST=llama3:latest
AUTHOR_TYPE_COUNCILOR_ETHICIST=ollama
```

**8. Monitor Your Usage**
- OpenAI: https://platform.openai.com/usage
- Anthropic: https://console.anthropic.com/
- OpenRouter: https://openrouter.ai/keys
- Set up usage alerts and limits

### Startup Script Options

The `start.sh` / `start.bat` script provides several options:

```bash
# Show help
./start.sh -h

# Development mode with hot reload
./start.sh -d

# Run checks only (verify configuration)
./start.sh -c

# Show version information
./start.sh -v

# Show Node.js version
./start.sh --node-version

# Interactive setup wizard (Windows only)
start.bat --setup

# Custom .env file location
./start.sh --env-file /path/to/custom.env

# Don't load .env file
./start.sh --no-env
```

### Interactive Setup Wizard

The setup wizard provides a user-friendly 4-step configuration process:

**Step 1: AI Provider Configuration**
- Choose from Google Gemini, OpenRouter, LM Studio, Ollama, or other providers
- Input API keys and endpoints

**Step 2: Council Personas**
- Beginner preset: Core 4 councilors (Speaker, Technocrat, Ethicist, Pragmatist)
- Advanced preset: 12 councilors including specialists
- Custom: Select individual personas

**Step 3: Server Configuration**
- Economy mode (recommended for cost savings)
- Concurrent requests (1-5, default: 2)
- Context turns (5-20, default: 8)
- Custom system directive (optional)

**Step 4: Save Configuration**
- Review settings
- Save to .env file
- Auto-start server

**Run the wizard:**
```cmd
start.bat --setup    # Windows
```

### Configuration File

Create a `.env` file for persistent configuration:

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your API keys
# Then start the server
./start.sh
```

## Configuration

### Environment Variables

Set any of the following environment variables to configure AI providers:

```bash
# Google Gemini (Primary provider)
GEMINI_API_KEY=your_gemini_api_key

# OpenRouter (for Claude, GPT-4, Llama, etc.)
OPENROUTER_API_KEY=your_openrouter_key

# Generic OpenAI-compatible endpoints
GENERIC_OPENAI_API_KEY=your_api_key
GENERIC_OPENAI_ENDPOINT=http://localhost:11434/v1/chat/completions

# LM Studio
LM_STUDIO_ENDPOINT=http://localhost:1234/v1/chat/completions

# Ollama
OLLAMA_ENDPOINT=http://localhost:11434/v1/chat/completions

# Jan AI
JAN_AI_ENDPOINT=http://localhost:1337/v1/chat/completions

# Z.ai
ZAI_API_KEY=your_key
ZAI_ENDPOINT=https://api.zai.com/v1/chat/completions

# Moonshot
MOONSHOT_API_KEY=your_key
MOONSHOT_ENDPOINT=https://api.moonshot.cn/v1/chat/completions

# Minimax
MINIMAX_API_KEY=your_key
MINIMAX_ENDPOINT=https://api.minimax.chat/v1/text/chatcompletion_v2
```

## Available Tools

### Council Session Tools

#### 1. `council_proposal`

Run a legislative proposal session - the standard parliamentary flow.

**Parameters:**
- `topic` (string, required): The motion to be debated
- `settings` (object, optional): Custom configuration
  - `bots`: Array of bot IDs and enabled status
  - `economyMode`: Use simulated debate for cost savings
  - `maxConcurrentRequests`: Limit parallel API calls
  - `customDirective`: Override the system prompt
- `context` (string, optional): Additional context

**Example:**
```json
{
  "topic": "Should we implement a universal basic income?",
  "settings": {
    "economyMode": true,
    "bots": [
      { "id": "councilor-technocrat", "enabled": true },
      { "id": "councilor-ethicist", "enabled": true },
      { "id": "councilor-pragmatist", "enabled": true }
    ]
  },
  "context": "Considering the impact of automation on employment"
}
```

#### 2. `council_deliberation`

Run a roundtable discussion without voting.

**Example:**
```json
{
  "topic": "The future of artificial intelligence in governance",
  "settings": {
    "customDirective": "Focus on long-term implications"
  }
}
```

#### 3. `council_inquiry`

Q&A mode where councilors provide direct answers.

**Example:**
```json
{
  "topic": "What are the key factors for successful space colonization?"
}
```

#### 4. `council_research`

Deep research session with multi-phase investigation.

**Example:**
```json
{
  "topic": "Analyze the feasibility of fusion power by 2030"
}
```

#### 5. `council_swarm`

Dynamic task decomposition with parallel execution.

**Example:**
```json
{
  "topic": "Break down the challenges of climate change mitigation"
}
```

#### 6. `council_swarm_coding`

Software development workflow with code generation. **Configurable pipeline modes**:

**Pipeline Modes:**
- **quick** (6 phases): Essentials only - Requirements → Tech Stack → Design → Core Dev → Basic Tests → Docs
- **standard** (12 phases): Balanced workflow - Requirements → Planning → Core Dev → Testing → Documentation
- **comprehensive** (24 phases): Full enterprise pipeline - Complete 24-phase development lifecycle

**Example:**
```json
{
  "topic": "Build a REST API for a task management application with authentication",
  "settings": {
    "pipelineMode": "standard"  // "quick" | "standard" | "comprehensive"
  }
}
```

#### 7. `council_prediction`

Superforecasting mode with probabilistic analysis.

**Example:**
```json
{
  "topic": "Will GPT-5 be released before June 2025?",
  "context": "Based on current AI development trends and industry announcements"
}
```

### Meta-Tool

#### `council_auto`

Smart session tool that automatically selects the optimal mode based on topic analysis.

**Features:**
- **Auto Mode**: Analyzes keywords to select best session type (research→Research, code→Swarm Coding, voting→Proposal, etc.)
- **Manual Override**: Explicitly specify mode if needed
- **Keyword Detection**: Smart topic analysis for optimal council experience

**Example:**
```json
{
  "topic": "Build a task management REST API",
  "mode": "auto"
}
```

**Auto-detection examples:**
- Contains "code", "build", "implement" → Swarm Coding
- Contains "research", "analyze", "study" → Research
- Contains "vote", "should we", "approve" → Proposal
- Contains "predict", "will", "forecast" → Prediction
- Default → Deliberation

### Session Management Tools

#### `council_list_sessions`

List all council sessions.

**Example:**
```json
{}
```

#### `council_get_session`

Get details of a specific session.

**Parameters:**
- `sessionId` (string, required): The session ID

**Example:**
```json
{
  "sessionId": "session-1701234567890-abc123"
}
```

#### `council_stop_session`

Stop a running session.

**Example:**
```json
{
  "sessionId": "session-1701234567890-abc123"
}
```

#### `council_pause_session`

Pause or resume a running session.

**Example:**
```json
{
  "sessionId": "session-1701234567890-abc123"
}
```

### Bot Management Tools

#### `council_list_bots`

List all available councilor bots and their configuration.

**Example:**
```json
{}
```

#### `council_update_bot`

Update a bot's configuration.

**Parameters:**
- `botId` (string, required): Bot ID to update
- `updates` (object, required): Updates to apply
  - `enabled`: Enable/disable the bot
  - `persona`: Custom persona prompt
  - `model`: Model name
  - `apiKey`: API key
  - `endpoint`: Custom endpoint

**Example:**
```json
{
  "botId": "councilor-visionary",
  "updates": {
    "enabled": true,
    "persona": "You are a futurist specializing in quantum computing advances."
  }
}
```

### Memory & Knowledge Tools

#### `council_add_memory`

Add a precedent to council memory.

**Parameters:**
- `topic` (string, required): Topic of the memory
- `content` (string, required): Content
- `tags` (array, optional): Tags

**Example:**
```json
{
  "topic": "Universal Basic Income",
  "content": "PASSED: The council voted 6-3 to support pilot programs for UBI in urban centers.",
  "tags": ["economics", "social-policy", "passed"]
}
```

#### `council_search_memories`

Search council memories.

**Parameters:**
- `query` (string, required): Search query
- `limit` (number, optional): Max results (default: 10)

**Example:**
```json
{
  "query": "artificial intelligence regulation",
  "limit": 5
}
```

#### `council_list_memories`

List all stored memories.

**Example:**
```json
{}
```

#### `council_add_document`

Add a document to the knowledge base.

**Parameters:**
- `title` (string, required): Document title
- `content` (string, required): Document content

**Example:**
```json
{
  "title": "AI Ethics Framework",
  "content": "Comprehensive framework for ethical AI deployment..."
}
```

#### `council_search_documents`

Search knowledge base documents.

**Parameters:**
- `query` (string, required): Search query
- `limit` (number, optional): Max results (default: 5)

**Example:**
```json
{
  "query": "machine learning bias",
  "limit": 3
}
```

#### `council_list_documents`

List all documents.

**Example:**
```json
{}
```

## Usage Examples

### Example 1: Simple Proposal

```python
# Python MCP client example
result = client.call_tool('council_proposal', {
    'topic': 'Should we ban facial recognition in public spaces?',
    'settings': {
        'economyMode': True,
        'bots': [
            {'id': 'councilor-technocrat', 'enabled': True},
            {'id': 'councilor-ethicist', 'enabled': True},
            {'id': 'councilor-sentinel', 'enabled': True},
            {'id': 'councilor-journalist', 'enabled': True}
        ]
    }
})

print(result.content[0].text)
```

### Example 2: Prediction Market

```python
result = client.call_tool('council_prediction', {
    'topic': 'Will Bitcoin reach $100,000 by end of 2025?',
    'context': 'Considering current market trends, regulatory developments, and institutional adoption'
})

print(result.content[0].text)
```

### Example 3: Research Deep Dive

```python
result = client.call_tool('council_research', {
    'topic': 'Quantum computing breakthroughs in 2024',
    'settings': {
        'bots': [
            {'id': 'specialist-science', 'enabled': True},
            {'id': 'councilor-historian', 'enabled': True},
            {'id': 'councilor-visionary', 'enabled': True}
        ]
    }
})
```

### Example 4: Software Development

```python
result = client.call_tool('council_swarm_coding', {
    'topic': 'Create a microservices architecture for an e-commerce platform',
    'context': 'Include user service, product catalog, order processing, and payment integration'
})
```

### Example 5: Managing Knowledge

```python
# Add a document
client.call_tool('council_add_document', {
    'title': 'Climate Change Mitigation Strategies',
    'content': 'Comprehensive analysis of carbon reduction policies...'
})

# Search for relevant precedents
result = client.call_tool('council_search_memories', {
    'query': 'carbon tax policy',
    'limit': 5
})
```

### Example 6: Server Diagnostics ⭐

```python
# Run basic health check
result = client.call_tool('council_diagnostics', {})
print(result.content[0].text)

# Run verbose diagnostics with full system info
result = client.call_tool('council_diagnostics', {
    'verbose': True
})

# Extract just the report
report = result.content[0].text
# Get detailed JSON data (if verbose)
if len(result.content) > 1:
    detailed_data = result.content[1].text
```

### Example 7: Get Transcript ⭐

```python
# Start a prediction session
result = client.call_tool('council_prediction', {
    'topic': 'Future of the USA'
})

# Get the session ID from the response
session_id = extract_session_id(result)

# Get formatted transcript
transcript = client.call_tool('council_get_transcript', {
    'sessionId': session_id,
    'format': 'markdown'  # or 'text' or 'json'
})

print(transcript.content[0].text)
```

### Example 8: Enhanced Swarm Coding ⭐

```python
# Start a development session with configurable pipeline mode
result = client.call_tool('council_swarm_coding', {
    'topic': 'Build a REST API for a task management system',
    'settings': {
        'bots': [
            {'id': 'speaker-high-council', 'enabled': True},
            {'id': 'councilor-technocrat', 'enabled': True}
        ],
        'pipelineMode': 'standard'  # "quick" (6), "standard" (12), "comprehensive" (24)
    },
    'context': 'Need authentication, CRUD operations, and PostgreSQL database'
})

# Standard mode (12 phases) includes:
# 1. Requirements Analysis
# 2. Tech Stack Selection
# 3. System Design
# 4. Security Analysis
# 5. Task Breakdown
# 6-8. Backend Development (Core/API/Database)
# 9-10. Testing (Unit/Integration)
# 11. Documentation
# 12. Final Review

# Comprehensive mode (24 phases) adds:
# - Frontend Development, UI Design, Integration
# - E2E Testing, Security Testing, Performance Optimization
# - Docker, CI/CD Pipeline, Monitoring Setup, Code Review

# Get the complete transcript
transcript = client.call_tool('council_get_transcript', {
    'sessionId': extract_session_id(result),
    'format': 'markdown'
})

print(transcript.content[0].text)
```

## Response Format

All tools return a `CallToolResult` with the following structure:

```typescript
{
  content: [
    {
      type: 'text',
      text: string  // JSON or formatted text output
    }
  ]
}
```

### Council Session Response

Council session tools return structured data including:

- **Session ID**: Unique identifier for the session
- **Messages**: Full transcript of all messages
- **Vote Data**: (Proposal mode) Voting results with consensus score
- **Prediction Data**: (Prediction mode) Probabilistic outcome
- **Code Files**: (Swarm Coding mode) Generated code artifacts
- **Summary**: Human-readable summary of the session

## AI Assistant Integration Guide 🤖

### Preset Prompt for Your AI Assistant

We've created a dedicated file with a comprehensive preset prompt that you can give to your AI assistant (Claude, GPT-4, etc.) to help it effectively use the AI Council MCP Server.

**File:** [`AI_ASSISTANT_PROMPT.md`](./AI_ASSISTANT_PROMPT.md)

#### How to Use:

1. **Open** `AI_ASSISTANT_PROMPT.md` in any text editor
2. **Select ALL** the text (from "You have access..." to "...insights!")
3. **Copy it** (Ctrl+C / Cmd+C)
4. **Paste it** into your AI assistant at the start of your conversation
5. **Reference it** when needed: "Remember your AI Council MCP Server capabilities"

This prompt includes:
- Complete overview of all 21 MCP tools
- Dynamic Persona Selection guidance
- Bot Memory System explanation
- 3 detailed example workflows
- Cost management best practices
- Quick reference for common use cases

**Why a separate file?**
- Easy to copy-paste without formatting issues
- Always up-to-date with latest features
- No need to scroll through the entire README
- Simple one-click access

---

### Quick Reference Card

**Most Common Use Cases:**

| Task | Tool | Key Parameters |
|------|------|----------------|
| Make a decision | council_proposal | topic, settings.bots, userPrompt |
| Get expert opinions | council_deliberation | topic, settings.bots |
| Research a topic | council_research | topic, settings.bots |
| Build software | council_swarm_coding | topic, userPrompt, settings |
| Forecast outcomes | council_prediction | topic, context |
| Get a clean transcript | council_get_transcript | sessionId, format: "markdown" |
| Check server health | council_diagnostics | verbose: true |

**Dynamic Persona Cheat Sheet:**
- **Science/Technology**: specialist-science, councilor-technocrat, councilor-visionary
- **Medicine/Health**: specialist-medical, councilor-ethicist, councilor-psychologist
- **Legal/Regulatory**: specialist-legal, councilor-diplomat, councilor-ethicist
- **Economics/Finance**: specialist-finance, councilor-pragmatist, councilor-progressive
- **Defense/Security**: specialist-military, councilor-sentinel, councilor-diplomat
- **Coding/Software**: specialist-code, councilor-technocrat, councilor-sentinel

## Architecture

### Core Components

1. **AIService**: Multi-provider AI integration (Gemini, OpenRouter, LM Studio, etc.)
2. **CouncilOrchestrator**: Session execution engine
3. **SessionService**: In-memory session management
4. **KnowledgeService**: Memory and document storage
5. **Tool Handlers**: MCP tool implementations

### Data Flow

```
Client Tool Call
    ↓
MCP Server Router
    ↓
Tool Handler
    ↓
CouncilOrchestrator
    ↓
AIService (AI Provider APIs)
    ↓
Session/Knowledge Storage
    ↓
Formatted Response
```

## Pre-configured Councilors

The server comes with 20+ pre-configured personas:

### Core Council (Enabled by Default)
- **High Speaker**: Objective judge, synthesizes arguments (Gemini 3 Pro)
- **The Facilitator**: Moderates debate, ensures civility
- **The Technocrat**: Data-driven, efficiency-focused
- **The Ethicist**: Morality and human well-being focused
- **The Pragmatist**: Economics and feasibility focused

### Additional Councilors (Disabled by Default)
- **The Visionary**: Future-focused, radical innovation
- **The Sentinel**: Security and defense focused
- **The Historian**: Past precedents and patterns
- **The Diplomat**: Soft power and compromise
- **The Skeptic**: Devil's advocate, risk assessment
- **The Conspiracist**: Alternative perspectives
- **The Journalist**: Public interest, transparency
- **The Propagandist**: Narrative and perception
- **The Psychologist**: Human behavior and motivations
- **The Libertarian**: Individual liberty, minimal state
- **The Progressive**: Social justice, equity
- **The Conservative**: Tradition, order, gradual change
- **The Independent**: Middle ground, practical solutions

### Specialist Sub-Agents
- **Specialist Coder**: Technical implementation
- **Specialist Legal**: Law and regulations
- **Specialist Science**: Hard sciences
- **Specialist Finance**: Economics and markets
- **Specialist Military**: Defense and strategy
- **Specialist Medical**: Medicine and public health

## Cost Management

Several features help control API costs:

1. **Economy Mode**: Simulates entire debates in a single API call
2. **Max Concurrent Requests**: Prevents rate limiting
3. **Context Pruning**: Limits conversation history
4. **Lighter Models**: Uses faster/cheaper models for councilors

## Session Modes Explained

### 1. PROPOSAL (Default)
**Flow**: Opening → Debate → Voting → Enactment
- Speaker opens with facts
- Councilors debate in rounds
- Challenge protocol: `[CHALLENGE: Member Name]`
- Pass option: `[PASS]` to yield floor
- Roll call vote with confidence scores
- Speaker issues final ruling
- **Output**: Vote data with consensus score

### 2. DELIBERATION
**Flow**: Opening → Discussion → Summary
- Roundtable discussion without voting
- Focus on exploring nuances
- Speaker provides final synthesis
- **Output**: Discussion transcript

### 3. INQUIRY
**Flow**: Question → Multiple Answers → Synthesis
- Direct Q&A format
- Councilors provide specific answers
- Speaker compiles final response
- **Output**: Synthesized answer

### 4. RESEARCH
**Flow**: Planning → Phase 1 Search → Gap Analysis → Phase 2 Search → Report
- Multi-phase investigation
- Breadth-first then depth-first
- Identifies missing information
- Compiles comprehensive dossier
- **Output**: Deep research report

### 5. SWARM
**Flow**: Decomposition → Parallel Execution → Aggregation
- Speaker decomposes topic
- Spawns dynamic "drone agents"
- Agents work in parallel
- Speaker aggregates results
- **Output**: Aggregated findings

### 6. SWARM_CODING
**Flow**: Architect Plan → Dev Swarm → Integration
- Chief Architect creates plan
- Assigns files to dev agents
- Agents generate code in parallel
- Product Lead integrates solution
- **Output**: Code artifacts

### 7. PREDICTION
**Flow**: Opening → Superforecasting → Final Prediction
- Frame as probabilistic forecast
- Identify key variables
- Councilors analyze base rates
- Speaker issues final prediction
- **Output**: Prediction with confidence %

### 8. ADVISORY ⭐ NEW
**Flow**: Issue Presentation → Expert Analysis → Recommendation Development → Advisory Report
- Strategic guidance and best practices consultation
- Domain expertise across technical, business, strategy, leadership, innovation, and ethics
- Structured advisory reports with actionable recommendations
- Risk assessment and mitigation strategies
- Action plans with timelines and priorities
- **Output**: Comprehensive advisory report with recommendations

### 9. ARBITRATION ⭐ NEW
**Flow**: Issue Presentation → Party Arguments → Evidence Review → Arbitration Decision
- Neutral councilors hear opposing viewpoints
- Fact-finding and evidence evaluation
- Impartial decision based on merits
- **Output**: Binding arbitration decision

### 9. NEGOTIATION ⭐ NEW
**Flow**: Opening Positions → Counter-Offers → Compromise Exploration → Agreement
- Multi-party bargaining sessions
- Identify common ground and trade-offs
- Facilitate mutually acceptable solutions
- **Output**: Negotiated agreement with terms

### 10. BRAINSTORMING ⭐ NEW
**Flow**: Topic Introduction → Idea Generation → Grouping → Voting → Selection
- Creative ideation sessions
- Generate diverse solutions rapidly
- Collaborative filtering and voting
- **Output**: Ranked list of ideas with consensus

### 11. PEER REVIEW ⭐ NEW
**Flow**: Submission → Review Assignment → Expert Evaluation → Revision → Approval
- Academic/scientific review process
- Anonymous peer evaluation
- Quality assessment and feedback
- **Output**: Peer-reviewed assessment

### 12. STRATEGIC PLANNING ⭐ NEW
**Flow**: Situation Analysis → Goal Setting → Strategy Development → Roadmap Creation
- Long-term strategic planning
- SWOT analysis and scenario planning
- Resource allocation and prioritization
- **Output**: Strategic plan with roadmap

### 13. DESIGN REVIEW ⭐ NEW
**Flow**: Design Presentation → Expert Review → Critique → Recommendations → Approval
- UX/UI design evaluation
- Usability and accessibility review
- Best practices assessment
- **Output**: Design recommendations

### 14. RISK ASSESSMENT ⭐ NEW
**Flow**: Threat Identification → Impact Analysis → Likelihood Assessment → Mitigation
- Comprehensive risk analysis
- Security and vulnerability assessment
- Mitigation strategy development
- **Output**: Risk register with mitigation plans

## Troubleshooting

### API Key Issues
```
Error: Gemini provider not initialized
```
**Solution**: Set `GEMINI_API_KEY` environment variable

### Connection Errors
```
Error: OpenRouter API error: 401 Unauthorized
```
**Solution**: Verify your API key and account status

### Rate Limiting
```
Error: 429 Too Many Requests
```
**Solution**: Reduce `maxConcurrentRequests` in settings

### Session Not Found
```
Error: Session session-xxx not found
```
**Solution**: Use `council_list_sessions` to see active sessions

## Integration with MCP-Compatible Hosts

### Claude Desktop

Add to your Claude Desktop config:

**Config Location:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ai-council": {
      "command": "node",
      "args": ["/full/path/to/ai-council-mcp-server/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "your_key_here"
      }
    }
  }
}
```

### Claude Code CLI

Claude Code CLI supports MCP servers through a configuration file. Here's how to set it up:

#### Step 1: Locate Claude Code Config Directory

**Find your Claude Code config directory:**

- **macOS**: `~/Library/Application Support/ClaudeCode/`
- **Windows**: `%APPDATA%\ClaudeCode\`
- **Linux**: `~/.config/claude-code/`

If the directory doesn't exist, create it:
```bash
mkdir -p ~/.config/claude-code/
```

#### Step 2: Create MCP Configuration

Create or edit `mcp-config.json` in the config directory:

```bash
touch ~/.config/claude-code/mcp-config.json
```

Add the following configuration:

```json
{
  "mcpServers": {
    "ai-council": {
      "command": "node",
      "args": ["/full/path/to/ai-council-mcp-server/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "your_api_key_here",
        "MAX_CONCURRENT_REQUESTS": "2",
        "ECONOMY_MODE": "true"
      }
    }
  }
}
```

**Important:** Replace `/full/path/to/ai-council-mcp-server/dist/index.js` with the actual absolute path to your server's `index.js` file.

**Example paths:**
- **macOS**: `/Users/username/ai-council-mcp-server/dist/index.js`
- **Windows**: `C:\Users\YourName\ai-council-mcp-server\dist\index.js`
- **Linux**: `/home/username/ai-council-mcp-server/dist/index.js`

#### Step 3: Set Your API Key

You can set your API key in the config file as shown above, or use environment variables:

```bash
export GEMINI_API_KEY=your_api_key_here
```

#### Step 4: Verify Installation

Test that Claude Code can see the server:

```bash
# List MCP servers
claude mcp

# Should show: ai-council (or similar)
```

#### Step 5: Use in Claude Code

Once configured, you can use AI Council tools directly in Claude Code:

**Example: Start a council deliberation**
```
/council_deliberation topic="Should we implement a 4-day work week?"
```

**Example: Get a proposal with voting**
```
/council_proposal topic="Should AI-generated content be labeled?"
```

**Example: Use the smart auto-tool**
```
/council_auto topic="Build a REST API for task management"
```

#### Quick Reference: Available Tools in Claude Code

| Command | Description |
|---------|-------------|
| `/council_proposal` | Legislative proposal with voting |
| `/council_deliberation` | Roundtable discussion |
| `/council_inquiry` | Direct Q&A format |
| `/council_research` | Deep research analysis |
| `/council_swarm` | Parallel task execution |
| `/council_swarm_coding` | Software development |
| `/council_prediction` | Superforecasting |
| `/council_auto` | Smart mode selection |
| `/council_list_sessions` | List all sessions |
| `/council_diagnostics` | Server health check |

#### Troubleshooting Claude Code Integration

**Server not showing up:**
```bash
claude mcp list
# Check if ai-council appears
```

**Permission denied:**
```bash
# Make sure index.js is executable (Unix systems)
chmod +x /path/to/ai-council-mcp-server/dist/index.js
```

**Command not found:**
```bash
# Verify Node.js is installed
node --version

# Verify the path to index.js is correct
ls -l /path/to/ai-council-mcp-server/dist/index.js
```

**API key issues:**
```bash
# Test the server directly
node /path/to/ai-council-mcp-server/dist/index.js

# Should show initialization messages without errors
```

### Using mcp.json

This folder includes `mcp.json` for easy configuration:

```json
{
  "mcpServers": {
    "ai-council": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "",
        "OPENROUTER_API_KEY": "",
        "MAX_CONCURRENT_REQUESTS": "2",
        "ECONOMY_MODE": "true"
      }
    }
  }
}
```

**Note:** This file is provided for reference. For Claude Code CLI, use the `mcp-config.json` method described above.

## Project Structure

```
ai-council-mcp-server/
├── src/                          # TypeScript source code
│   ├── index.ts                  # MCP server entry point
│   ├── services/                 # Core services
│   │   ├── aiService.ts          # AI provider integration
│   │   ├── councilOrchestrator.ts # Session execution
│   │   ├── sessionService.ts     # Session management
│   │   ├── knowledgeService.ts   # Memory & documents
│   │   ├── validationService.ts  # Input validation
│   │   ├── protectionService.ts  # Loop/runaway protection
│   │   ├── errorHandler.ts       # Global error handling
│   │   ├── logger.ts             # Structured logging
│   │   ├── responseSchema.ts     # Response formatting
│   │   └── sessionStorageService.ts # Session persistence
│   ├── tools/                    # MCP tool implementations
│   │   ├── councilSessionTools.ts # Session mode tools
│   │   ├── managementTools.ts     # Management tools
│   │   └── autoSessionTools.ts    # Meta-tool
│   ├── types/                    # Type definitions
│   │   ├── index.ts              # Main types
│   │   ├── guards.ts             # Type guards & validation
│   │   ├── utilities.ts          # Type utilities
│   │   ├── enhanced.ts           # Enhanced strict types
│   │   ├── api.ts                # API-specific types
│   │   └── constants.ts          # Defaults & prompts
│   └── utils/                    # Utility functions
├── examples/                     # Examples and templates
│   ├── TOOL_CALL_EXAMPLES.md     # 13 tool call examples
│   ├── CLAUDE_DESKTOP_INTEGRATION.md
│   ├── config.example.json       # Config template
│   └── example-client.py         # Python client example
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript config
├── vite.config.ts                # Build configuration
├── mcp.json                      # MCP server configuration
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore rules
├── start.bat                     # Windows startup script
├── start.sh                      # Linux/Mac startup script
├── README.md                     # This file
├── INSTALL.md                    # Installation guide
├── SETUP.md                      # Detailed setup
├── SETUP_WIZARD_GUIDE.md         # Interactive wizard guide
├── TROUBLESHOOTING.md            # 50+ issues & solutions
├── STARTUP_GUIDE.md              # Startup options
└── CHANGELOG.md                  # Version history
```

### Adding a New Session Mode

1. Add mode to `SessionMode` enum in `types/index.ts`
2. Create prompt templates in `types/constants.ts`
3. Add handler method in `CouncilOrchestrator`
4. Create tool definition in `tools/councilSessionTools.ts`
5. Add routing in `handleCouncilToolCall()`

### Adding a New AI Provider

1. Add to `AuthorType` enum
2. Implement provider methods in `AIService`
3. Add configuration fields
4. Update documentation

## Development

### Scripts

```bash
# Build the server
npm run build

# Build in watch mode
npm run dev

# Run type checking
npm run type-check

# Run linting
npm run lint
```

### File Structure Overview

The codebase is organized into clear modules:

- **`src/index.ts`**: MCP server entry point with tool routing
- **`src/services/`**: Core business logic (AI, sessions, validation, etc.)
- **`src/tools/`**: MCP tool definitions (13 tools total)
- **`src/types/`**: TypeScript type definitions (guards, utilities, etc.)
- **`src/utils/`**: Helper functions

### Key Services

1. **AIService**: Multi-provider AI integration
2. **CouncilOrchestrator**: Session execution engine
3. **SessionService**: In-memory session management
4. **SessionStorageService**: Disk-based persistence
5. **KnowledgeService**: Memory and document storage
6. **ValidationService**: Input validation and XSS protection
7. **ProtectionService**: Runaway session prevention
8. **ErrorHandler**: Global error handling middleware
9. **Logger**: Structured logging with context tracking
10. **ResponseSchema**: Standardized response formatting

## Changelog

### Version 3.0.0 (Current)

#### ✨ Major Enhancement - 23 New AI Services & Advanced Features
- **WebSocket Service**: Real-time session updates and live streaming
- **Vector Database Service**: In-memory vector database with semantic search and clustering
- **Live Code Execution Service**: Secure sandbox with security scanning and auto-testing
- **Enhanced Swarm Coding**: Configurable pipeline (6/12/24 phases) - default 12 phases
- **7 New Session Modes**: Arbitration, Negotiation, Brainstorming, Peer Review, Strategic Planning, Design Review, Risk Assessment
- **Deployment Automation Service**: Multi-cloud deployment (Docker, Kubernetes, AWS, Heroku)
- **Conversation Intelligence Service**: Sentiment analysis, entity extraction, conflict detection
- **Analytics Dashboard Service**: KPIs, anomaly detection, trend analysis, comparative analytics
- **Multi-Modal Analysis Service**: Image, document, audio, and video analysis capabilities
- **Integration Ecosystem Service**: Slack, GitHub, JIRA, and webhook integrations
- **Export Service with Visualizations**: Multi-format export (PDF/Markdown/JSON/CSV/SVG) with charts
- **Microservice Architecture Service**: Service registry, load balancing, circuit breaker patterns
- **Prediction Tracking Service**: Brier score calculation, calibration metrics, outcome tracking
- **Persona Suggestion Service**: AI-driven selection across 15 topic categories
- **Cost Tracking Service**: Multi-provider tracking, budget alerts, analytics
- **Session Template Service**: 11 pre-configured workflows, template suggestions
- **Enhanced Argumentation Framework**: CLAIM-EVIDENCE-REASONING structured prompting
- **Semantic Memory Service**: Vector embeddings, clustering, intelligent retrieval
- **Persona Optimization Service**: Performance analysis, team composition optimization
- **Dialectical Deliberation Service**: Thesis-antithesis-synthesis reasoning engine
- **Ensemble Prediction Service**: Statistical aggregation, confidence intervals
- **Adaptive Orchestration Service**: Real-time session optimization
- **RAG Service**: Vector database, semantic search, hybrid retrieval
- **Federation Service**: Multi-council collaboration and consensus
- **Meta-Learning Service**: Automatic learning, pattern mining, optimization

#### 🧠 Enhanced AI Capabilities
- Structured argumentation with evidence-based reasoning
- Semantic memory with vector embeddings
- Ensemble forecasting with statistical aggregation
- Adaptive orchestration based on real-time metrics
- Meta-learning from historical session data

#### 📊 Analytics & Insights
- Prediction analytics with Brier score and calibration
- Persona performance tracking and optimization
- Cost analytics with multi-provider breakdown
- Session quality, efficiency, and consensus metrics
- Automated anomaly detection

#### 📥 Export System
- Multi-format export: PDF, Markdown, JSON, CSV, XML
- 10+ new export MCP tools
- Report types: test suites, analytics, sessions, predictions, personas, learning
- Custom formatted reports with batch export capability

#### 🛠️ New MCP Tools (20+ tools)
- Prediction tracking and analytics tools
- Persona suggestion and validation tools
- Cost tracking and budget management tools
- Session template management tools
- All export tools (council_export_*)

#### 🏗️ Architecture Enhancements
- 16 new service modules (all singleton pattern)
- Enhanced type safety with comprehensive interfaces
- Service integration with existing MCP protocol
- Backward compatible with all existing features

#### ⚙️ Pipeline Mode Improvements (v3.0.1)
- **Enhanced Swarm Coding**: Now configurable with 3 pipeline modes
  - **quick** (6 phases): Essentials only
  - **standard** (12 phases): Balanced workflow (default)
  - **comprehensive** (24 phases): Full enterprise pipeline
- Better cost control and faster execution for typical use cases
- Configurable via `settings.pipelineMode` parameter

### Version 2.0.0

#### ✨ New Features
- **Meta-Tool (council_auto)**: Smart session mode selection
- **Weighted Voting**: Configurable vote weights
- **Session Persistence**: Disk-based storage
- **Interactive Setup Wizard**: 4-step configuration

#### 🛡️ Quality & Reliability
- **Unified Input Validation**: All 13 MCP tools
- **Recursion Protection**: Max depth 3, cooldown 500ms
- **Hard Limits**: 4000 tokens, 20 rounds, 10 msgs/round
- **Global Error Handling**: Centralized middleware
- **Structured Logging**: Service-specific loggers
- **Enhanced TypeScript**: Branded IDs, type guards

#### 📚 Documentation & Tools
- **13 Example Tool Calls**: Comprehensive JSON examples
- **Detailed Setup Guide**: `SETUP.md`
- **Troubleshooting Guide**: 50+ issues (`TROUBLESHOOTING.md`)
- **Installation Guide**: `INSTALL.md`

#### 🔧 Technical Improvements
- Response schema standardization
- Memory & knowledge base cleanup
- Protection service enhancements
- Better error categorization
- Session statistics tracking

### Version 1.0.0
- Initial MCP Server release
- 7 session modes
- 20+ pre-configured personas
- Multi-provider AI support
- Memory and knowledge base
- Voting and consensus system

## License

MIT License

## Support

For issues and feature requests, please open an issue in the repository.

### Additional Resources

- **📦 Installation Guide**: `INSTALL.md` - Quick start for this standalone package
- **⚙️ Setup Guide**: `SETUP.md` - Detailed setup instructions
- **🧙 Setup Wizard Guide**: `SETUP_WIZARD_GUIDE.md` - Interactive configuration
- **🔧 Troubleshooting**: `TROUBLESHOOTING.md` - 50+ common issues and solutions
- **📝 Tool Examples**: `examples/TOOL_CALL_EXAMPLES.md` - 13 comprehensive examples
- **🖥️ Claude Desktop Integration**: `examples/CLAUDE_DESKTOP_INTEGRATION.md`
- **🚀 Startup Guide**: `STARTUP_GUIDE.md` - Startup script options
- **📜 Changelog**: `CHANGELOG.md` - Version history

### Example Configurations

See `examples/` folder for:
- MCP client examples (Python)
- Claude Desktop configuration
- Tool call JSON examples
- Configuration templates

## License

MIT License

---

**Version**: 3.0.0
**Last Updated**: December 2025
**MCP Tools**: 33+ tools (20+ new tools in v3.0)
**Session Modes**: 14 modes (7 new in v3.0)
**Councilors**: 20+ personas
**AI Services**: 23 new services (v3.0)
