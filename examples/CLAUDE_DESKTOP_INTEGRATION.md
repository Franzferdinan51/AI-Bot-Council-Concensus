# Integrating AI Council MCP Server with Claude Desktop

This guide shows how to integrate the AI Council MCP Server with Claude Desktop (claude.ai) or other MCP-compatible clients.

## Prerequisites

1. **Claude Desktop** with MCP support (or compatible MCP client)
2. **Node.js** 18+ installed
3. **AI Council MCP Server** built and ready

## Installation Steps

### 1. Build the MCP Server

```bash
cd ai-council-mcp-server
npm install
npm run build
```

### 2. Configure Claude Desktop

Add the following to your Claude Desktop configuration file:

**Location:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

**Configuration:**

```json
{
  "mcpServers": {
    "ai-council": {
      "command": "node",
      "args": ["/path/to/ai-council-mcp-server/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "your_gemini_api_key",
        "OPENROUTER_API_KEY": "your_openrouter_key"
      }
    }
  }
}
```

**Example with full path:**

```json
{
  "mcpServers": {
    "ai-council": {
      "command": "node",
      "args": ["/Users/username/projects/ai-council-mcp-server/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "AIzaSyC...",
        "OPENROUTER_API_KEY": "sk-or-..."
      }
    }
  }
}
```

### 3. Restart Claude Desktop

After updating the configuration, restart Claude Desktop completely.

### 4. Verify Integration

Open a new conversation with Claude and try:

```
Can you show me what tools are available from the ai-council server?
```

Claude should list all available tools including:
- `council_proposal`
- `council_deliberation`
- `council_inquiry`
- `council_research`
- `council_swarm`
- `council_swarm_coding`
- `council_prediction`
- And management tools...

## Usage Examples

### Example 1: Legislative Proposal

You can now say to Claude:

> "Use the ai-council server to debate whether we should implement a 4-day work week. Include the technocrat, ethicist, and pragmatist."

Claude will automatically call the `council_proposal` tool and return the full debate transcript with voting results.

### Example 2: Prediction Market

> "Use the ai-council server to predict whether SpaceX will land humans on Mars before 2030. Have the historian and visionary participate."

### Example 3: Software Development

> "Use the ai-council server in swarm coding mode to design a microservices architecture for a food delivery app."

### Example 4: Research

> "Use the ai-council server to research the impact of quantum computing on cryptography. Include the specialist-scientist bot."

### Example 5: Managing Knowledge

> "Use the ai-council server to add a memory about our previous discussion on AI regulation."

Then:

> "Search the ai-council server memory for precedents on AI regulation."

## Advanced Configuration

### Custom Bot Configuration

You can customize which bots participate by specifying them in your request:

```json
{
  "topic": "Should AI systems have legal personhood?",
  "settings": {
    "bots": [
      { "id": "specialist-legal", "enabled": true },
      { "id": "councilor-ethicist", "enabled": true },
      { "id": "councilor-skeptic", "enabled": true }
    ],
    "economyMode": true,
    "maxConcurrentRequests": 2
  }
}
```

### Economy Mode for Cost Control

Enable economy mode to reduce API costs:

```json
{
  "topic": "Should we ban cryptocurrency?",
  "settings": {
    "economyMode": true
  }
}
```

In economy mode, the Speaker bot simulates the entire debate in a single API call instead of making individual calls to each councilor.

### Custom System Directive

Override the default persona behavior:

```json
{
  "topic": "Evaluate this business strategy",
  "settings": {
    "customDirective": "TONE: Brutally honest. Focus on failure modes and hidden risks."
  }
}
```

## Available Tools Reference

### Session Tools

| Tool | Description | Best For |
|------|-------------|----------|
| `council_proposal` | Legislative debate with voting | Decision making, policy |
| `council_deliberation` | Roundtable discussion | Exploring nuances |
| `council_inquiry` | Q&A format | Getting specific answers |
| `council_research` | Deep multi-phase research | Learning, investigation |
| `council_swarm` | Parallel task execution | Complex problem breakdown |
| `council_swarm_coding` | Software development | Code generation, architecture |
| `council_prediction` | Superforecasting | Predicting future events |

### Management Tools

| Tool | Description |
|------|-------------|
| `council_list_bots` | List all available councilors |
| `council_update_bot` | Enable/disable or modify bots |
| `council_add_memory` | Store precedents for future reference |
| `council_search_memories` | Find relevant precedents |
| `council_list_memories` | View all stored memories |
| `council_add_document` | Add documents to knowledge base |
| `council_search_documents` | Search knowledge base |
| `council_list_documents` | List all documents |
| `council_list_sessions` | View active/completed sessions |
| `council_get_session` | Retrieve a specific session |
| `council_stop_session` | Stop a running session |
| `council_pause_session` | Pause/resume a session |

## Troubleshooting

### Tool Not Found Error

**Problem**: "Tool not found"

**Solution**:
1. Verify the MCP server is running: `npm start`
2. Check Claude Desktop config file path and syntax
3. Restart Claude Desktop completely
4. Check server logs for errors

### API Key Errors

**Problem**: "Gemini provider not initialized"

**Solution**:
1. Verify environment variables are set correctly in config
2. Check API keys are valid
3. For Claude Desktop, the environment must be set in the config JSON

### Empty Response

**Problem**: Tool returns no content

**Solution**:
1. Check server logs for errors
2. Try with `economyMode: true` to reduce complexity
3. Verify at least one bot is enabled

### Rate Limiting

**Problem**: 429 Too Many Requests

**Solution**:
```json
{
  "settings": {
    "maxConcurrentRequests": 1,
    "economyMode": true
  }
}
```

## Best Practices

### 1. Start Simple

Begin with basic requests and economy mode:

```json
{
  "topic": "Simple yes/no question?",
  "settings": {
    "economyMode": true,
    "bots": [
      {"id": "councilor-technocrat", "enabled": true},
      {"id": "councilor-ethicist", "enabled": true}
    ]
  }
}
```

### 2. Use Memory

Persist important decisions:

```python
# After a successful session
await session.call_tool("council_add_memory", {
    "topic": "Previous Decision Topic",
    "content": "Summary of the outcome",
    "tags": ["category", "status"]
})
```

### 3. Choose Appropriate Mode

- **Proposal**: When you need a decision with voting
- **Prediction**: When you need probability estimates
- **Research**: When you need comprehensive information
- **Swarm Coding**: When you need software architecture or code
- **Inquiry**: When you need direct answers to questions
- **Deliberation**: When exploring different perspectives

### 4. Manage Costs

```json
{
  "settings": {
    "economyMode": true,           # Simulate debate in one call
    "maxConcurrentRequests": 1,    # Avoid rate limits
    "contextPruning": true,        # Limit history
    "maxContextTurns": 8           # Keep only recent messages
  }
}
```

### 5. Customize Personas

Enable specific bots for your use case:

```json
{
  "settings": {
    "bots": [
      { "id": "councilor-historian", "enabled": true },    # For historical context
      { "id": "specialist-finance", "enabled": true },     # For financial topics
      { "id": "councilor-ethicist", "enabled": true }      # For ethical dilemmas
    ]
  }
}
```

## Sample Conversations

### Conversation 1: Business Decision

```
User: "Use the ai-council server to help me decide whether to pivot my startup from B2C to B2B. Enable the pragmatist, technocrat, and journalist."

Claude: [Calls council_proposal tool with appropriate parameters]

Claude: "I'll convene a council debate to help you evaluate this pivot decision..."

[Full debate transcript with voting results]
```

### Conversation 2: Prediction

```
User: "Use the ai-council server to forecast if remote work will be the majority work arrangement by 2028."

Claude: [Calls council_prediction tool]

Claude: "I've opened a prediction market on the future of remote work..."

[Prediction with confidence percentage and reasoning]
```

### Conversation 3: Research

```
User: "Use the ai-council server to research CRISPR gene editing safety concerns. Include the specialist-medical and specialist-science bots."

Claude: [Calls council_research tool]

Claude: "I've initiated a deep research investigation into CRISPR safety..."

[Comprehensive research dossier with sources]
```

## Support

For issues or questions:

1. Check the server logs for error messages
2. Verify your API keys are valid and have sufficient credits
3. Try reducing complexity with economy mode
4. Check the main README.md for troubleshooting steps

## Advanced: Custom MCP Client

You can also create a custom client using the MCP SDK:

```python
import asyncio
from mcp import ClientSession
from mcp.client.stdio import stdio_client

async def main():
    async with stdio_client() as (read, write):
        async with ClientSession(read, write) as session:
            # Initialize
            await session.initialize()

            # List tools
            tools = await session.list_tools()
            print(f"Available tools: {tools}")

            # Run a session
            result = await session.call_tool("council_proposal", {
                "topic": "Your topic here",
                "settings": { "economyMode": True }
            })
            print(result.content[0].text)

asyncio.run(main())
```

Refer to the `examples/` directory for more client examples.
