# MCP Tool Call Examples

This document provides example JSON for every tool available in the AI Council Chamber MCP Server.

## Table of Contents

1. [Auto Session Tool](#auto-session-tool)
2. [Council Session Tools](#council-session-tools)
3. [Session Management Tools](#session-management-tools)
4. [Bot Management Tools](#bot-management-tools)
5. [Memory Tools](#memory-tools)
6. [Knowledge Base Tools](#knowledge-base-tools)

---

## Auto Session Tool

### council_auto

Automatically runs a council session with smart mode selection. This is the easiest way to get started.

**Example 1: Auto mode selection (recommended)**
```json
{
  "tool": "council_auto",
  "arguments": {
    "topic": "Should we implement a 4-day work week?",
    "mode": "auto"
  }
}
```

**Example 2: Specify mode explicitly**
```json
{
  "tool": "council_auto",
  "arguments": {
    "topic": "Implement a caching mechanism for user sessions",
    "mode": "swarm_coding"
  }
}
```

**Example 3: With custom settings**
```json
{
  "tool": "council_auto",
  "arguments": {
    "topic": "Will AI replace programmers by 2030?",
    "mode": "auto",
    "settings": {
      "economyMode": true,
      "maxConcurrentRequests": 2,
      "useWeightedVoting": true,
      "maxRounds": 5,
      "customDirective": "Focus on factual analysis and data"
    }
  }
}
```

**Example 4: Create session without starting (for manual control)**
```json
{
  "tool": "council_auto",
  "arguments": {
    "topic": "Should we invest in renewable energy?",
    "autoStart": false
  }
}
```

---

## Council Session Tools

### council_proposal

Runs a legislative proposal session with opening, debate, voting, and enactment.

```json
{
  "tool": "council_proposal",
  "arguments": {
    "topic": "Proposed policy: Universal Basic Income",
    "context": "Discuss the economic feasibility and social implications of UBI",
    "settings": {
      "bots": [
        { "id": "councilor-technocrat", "enabled": true },
        { "id": "councilor-ethicist", "enabled": true },
        { "id": "councilor-pragmatist", "enabled": true }
      ],
      "economyMode": true,
      "customDirective": "Be pragmatic about implementation costs"
    }
  }
}
```

### council_deliberation

Runs a roundtable discussion without voting.

```json
{
  "tool": "council_deliberation",
  "arguments": {
    "topic": "Best practices for remote team management",
    "context": "Our company is moving to a remote-first model",
    "settings": {
      "bots": [
        { "id": "councilor-pragmatist", "enabled": true },
        { "id": "councilor-technocrat", "enabled": true },
        { "id": "councilor-diplomat", "enabled": true }
      ]
    }
  }
}
```

### council_inquiry

Q&A mode where councilors provide direct answers.

```json
{
  "tool": "council_inquiry",
  "arguments": {
    "topic": "What is the optimal database architecture for a SaaS application?",
    "context": "We expect 100k users in the first year"
  }
}
```

### council_research

Multi-phase investigation with gap analysis.

```json
{
  "tool": "council_research",
  "arguments": {
    "topic": "The future of electric vehicles in urban transportation",
    "context": "Research current trends, challenges, and opportunities"
  }
}
```

### council_swarm

Dynamic task decomposition with parallel execution.

```json
{
  "tool": "council_swarm",
  "arguments": {
    "topic": "Plan a product launch strategy for our new AI tool",
    "settings": {
      "bots": [
        { "id": "councilor-pragmatist", "enabled": true },
        { "id": "councilor-diplomat", "enabled": true },
        { "id": "councilor-visionary", "enabled": true }
      ]
    }
  }
}
```

### council_swarm_coding

Software development workflow with code generation.

```json
{
  "tool": "council_swarm_coding",
  "arguments": {
    "topic": "Build a REST API for user authentication",
    "context": "Need JWT tokens, password hashing, and rate limiting"
  }
}
```

### council_prediction

Superforecasting with probabilistic analysis.

```json
{
  "tool": "council_prediction",
  "arguments": {
    "topic": "Will Bitcoin reach $100,000 by end of 2025?",
    "context": "Consider market trends, regulatory changes, and adoption rates"
  }
}
```

---

## Session Management Tools

### council_list_sessions

Lists all council sessions.

```json
{
  "tool": "council_list_sessions",
  "arguments": {}
}
```

### council_get_session

Gets details of a specific session.

```json
{
  "tool": "council_get_session",
  "arguments": {
    "sessionId": "session-1701234567890-abc123def"
  }
}
```

### council_stop_session

Stops a running council session.

```json
{
  "tool": "council_stop_session",
  "arguments": {
    "sessionId": "session-1701234567890-abc123def"
  }
}
```

### council_pause_session

Pauses or resumes a running council session.

```json
{
  "tool": "council_pause_session",
  "arguments": {
    "sessionId": "session-1701234567890-abc123def"
  }
}
```

---

## Bot Management Tools

### council_list_bots

Lists all available councilor bots and their configuration.

```json
{
  "tool": "council_list_bots",
  "arguments": {}
}
```

### council_update_bot

Updates configuration of a specific councilor bot.

```json
{
  "tool": "council_update_bot",
  "arguments": {
    "botId": "councilor-technocrat",
    "updates": {
      "enabled": true,
      "model": "gemini-2.0-flash",
      "persona": "Custom persona focusing on efficiency and metrics"
    }
  }
}
```

---

## Memory Tools

### council_add_memory

Adds a precedent or ruling to the council memory.

```json
{
  "tool": "council_add_memory",
  "arguments": {
    "topic": "Universal Basic Income discussion",
    "content": "Council concluded that UBI requires careful implementation with pilot programs",
    "tags": ["economy", "policy", "social"]
  }
}
```

### council_search_memories

Searches council memory for relevant precedents.

```json
{
  "tool": "council_search_memories",
  "arguments": {
    "query": "remote work productivity",
    "limit": 5
  }
}
```

### council_list_memories

Lists all stored council memories.

```json
{
  "tool": "council_list_memories",
  "arguments": {}
}
```

---

## Knowledge Base Tools

### council_add_document

Adds a document to the knowledge base.

```json
{
  "tool": "council_add_document",
  "arguments": {
    "title": "Company Remote Work Policy 2024",
    "content": "This document outlines our remote work policies, including work hours, communication protocols, and security requirements..."
  }
}
```

### council_search_documents

Searches the knowledge base documents.

```json
{
  "tool": "council_search_documents",
  "arguments": {
    "query": "security protocols for remote workers",
    "limit": 3
  }
}
```

### council_list_documents

Lists all knowledge base documents.

```json
{
  "tool": "council_list_documents",
  "arguments": {}
}
```

---

## Usage Tips

### 1. Economy Mode

Enable `economyMode: true` in settings to reduce API costs by simulating debates with fewer API calls.

### 2. Weighted Voting

Set `useWeightedVoting: true` to have council members vote with different weights:
- Speaker: 2.0 (tiebreaker)
- Core Councilors: 1.5
- Regular Councilors: 1.0
- Moderator: 0.5

### 3. Custom Directives

Use `customDirective` to guide the council's behavior:

```json
{
  "settings": {
    "customDirective": "Focus on cost-benefit analysis and practical implementation"
  }
}
```

### 4. Bot Selection

Enable only the bots you need for faster, more focused discussions:

```json
{
  "settings": {
    "bots": [
      { "id": "councilor-technocrat", "enabled": true },
      { "id": "councilor-pragmatist", "enabled": true }
    ]
  }
}
```

### 5. Concurrent Requests

Adjust `maxConcurrentRequests` based on your API limits (1-5):

```json
{
  "settings": {
    "maxConcurrentRequests": 3
  }
}
```

---

## Response Format

All tools return a standardized JSON response with the following structure:

```json
{
  "status": "success",
  "tool": "tool_name",
  "timestamp": 1701234567890,
  "executionTime": 15234,
  "sessionId": "session-1701234567890-abc123def",
  "data": {
    // Tool-specific data
  },
  "metadata": {
    "tokenCount": 4200,
    "rounds": 3,
    "messages": 15
  }
}
```

For error responses:

```json
{
  "status": "error",
  "tool": "tool_name",
  "timestamp": 1701234567890,
  "executionTime": 123,
  "data": {
    "errorType": "VALIDATION_ERROR",
    "message": "Input validation failed"
  },
  "errors": [
    {
      "field": "topic",
      "message": "Topic is required",
      "code": "REQUIRED_FIELD_MISSING"
    }
  ]
}
```

---

## Integration Examples

### Python

```python
import asyncio
from mcp import ClientSession

async def run_council():
    async with ClientSession(stdio_transport) as session:
        await session.initialize()

        result = await session.call_tool(
            "council_auto",
            arguments={
                "topic": "Should we switch to microservices?",
                "mode": "auto",
                "settings": {
                    "economyMode": True
                }
            }
        )

        print(result.content[0].text)

asyncio.run(run_council())
```

### Claude Desktop (claude_desktop_config.json)

```json
{
  "mcpServers": {
    "ai-council": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### curl

```bash
curl -X POST http://localhost:3000/call-tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "council_auto",
    "arguments": {
      "topic": "Best programming language for 2025?",
      "mode": "auto"
    }
  }'
```

---

## Rate Limits & Best Practices

1. **Use Economy Mode** for testing or when costs are a concern
2. **Limit bot count** to 3-5 for faster responses
3. **Use specific topics** for better results
4. **Enable weighted voting** for more nuanced decisions
5. **Store important results** using council_add_memory for future reference

---

## Need Help?

- Check `SETUP_WIZARD_GUIDE.md` for configuration help
- See `STARTUP_GUIDE.md` for installation instructions
- Review `README.md` for full documentation
