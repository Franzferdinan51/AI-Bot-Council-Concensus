# AI Council MCP - Connection Guide

## Quick Start with Claude Code CLI

### 1. Start the Server

```bash
# Development mode (auto-restart)
npm run dev

# Or production mode
npm start
```

The server runs on `stdio` by default (MCP standard).

### 2. Configure Claude Desktop (Optional)

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ai-council": {
      "command": "node",
      "args": ["/path/to/ai-council-mcp-server/dist/index.js"],
      "env": {
        "ANTHROPIC_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### 3. Available Tools

#### Start Council Sessions

- **council_proposal** - Legislative debate with voting
- **council_deliberation** - Open discussion
- **council_inquiry** - Q&A format
- **council_research** - Deep investigation
- **council_swarm** - Parallel task processing
- **council_swarm_coding** - Code generation
- **council_prediction** - Superforecasting ⭐

#### Manage Sessions

- **council_list_sessions** - List all sessions
- **council_get_session** - Get full session data
- **council_get_transcript** - Get formatted transcript ⭐ NEW
- **council_stop_session** - Stop a session
- **council_pause_session** - Pause/resume

### 4. Common Workflows

#### Run a Prediction Session

```json
{
  "topic": "future of the USA",
  "settings": {
    "bots": [
      { "id": "Strategist", "enabled": true },
      { "id": "Historian", "enabled": true }
    ]
  }
}
```

**Returns:** Session ID and summary

#### Get the Transcript ⭐ EASIER

```json
{
  "sessionId": "session-1234567890-abc123"
}
```

Or with different formats:

```json
{
  "sessionId": "session-1234567890-abc123",
  "format": "markdown"
}
```

Formats: `text` (default), `markdown`, `json`

#### List All Sessions

```json
{}
```

### 5. Example: Complete Prediction Workflow

**Step 1:** Start prediction
```json
{
  "topic": "Will the US adopt universal healthcare by 2030?"
}
```

Response:
```
Session session-1764563054568-mq22q1rs8 created
Council has completed a prediction session...
```

**Step 2:** Get transcript immediately
```json
{
  "sessionId": "session-1764563054568-mq22q1rs8",
  "format": "markdown"
}
```

Response: Clean, formatted transcript with all council messages and prediction results!

### 6. Troubleshooting

#### "Session not found"
- Sessions auto-save every 2 seconds (improved!)
- Check with `council_list_sessions`

#### "Invalid sessionId format"
- Accepts: string, object with sessionId property, or array
- Examples all work:
  - `"session-123"` ✓
  - `{"sessionId": "session-123"}` ✓
  - `[{"sessionId": "session-123"}]` ✓

#### Server won't start
- Check Node.js version: `node --version` (requires Node 18+)
- Run `npm run build` first
- Check API key in `.env`

### 7. Environment Variables

Create `.env` file:

```env
ANTHROPIC_API_KEY=your-key-here
OPENAI_API_KEY=your-openai-key-here
SESSION_STORAGE_DIR=./data/sessions
LOG_LEVEL=info
```

### 8. Tips

1. **Use council_get_transcript** instead of council_get_session for cleaner output
2. Sessions persist to disk automatically
3. Use `format: "markdown"` for easy reading
4. Check server logs for debugging

---

Need help? Check the main README.md or TROUBLESHOOTING.md
