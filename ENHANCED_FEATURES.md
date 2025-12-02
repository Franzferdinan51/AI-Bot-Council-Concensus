# Enhanced MCP Server Features

## New Capabilities

### 1. 🎨 Dynamic Persona Selection

The controlling AI can now **dynamically select** which council personas participate in each session!

#### Why This Matters:
**Default Mode**: Uses pre-configured enabled bots (generic expertise)
**Dynamic Mode**: AI selects optimal personas for specific topics (targeted expertise)

#### Example: Science Topic
```json
{
  "topic": "Should we implement nuclear fusion power?",
  "settings": {
    "bots": [
      { "id": "speaker-high-council", "enabled": true },
      { "id": "specialist-science", "enabled": true },
      { "id": "councilor-technocrat", "enabled": true },
      { "id": "councilor-visionary", "enabled": true },
      { "id": "councilor-historian", "enabled": true }
    ]
  }
}
```

**Result**: Deep scientific analysis with historical context, instead of generic responses!

#### Quick Reference - Persona Selection:
- **Science/Technology** → `specialist-science`, `councilor-technocrat`, `councilor-visionary`
- **Medicine/Health** → `specialist-medical`, `councilor-ethicist`, `councilor-psychologist`
- **Legal Issues** → `specialist-legal`, `councilor-diplomat`, `councilor-ethicist`
- **Economics** → `specialist-finance`, `councilor-pragmatist`, `councilor-progressive`
- **Defense/Security** → `specialist-military`, `councilor-sentinel`, `councilor-diplomat`
- **Coding** → `specialist-code`, `councilor-technocrat`, `councilor-sentinel`

**📖 See**: `DYNAMIC_PERSONA_SELECTION.md` for complete guide with 24+ personas and smart selection patterns! 🎯

---

### 2. Bot Participation in Council Sessions

The controlling bot can now **participate** in council sessions as "User" or "Petitioner", not just observe.

#### How to Use:
Add a `userPrompt` parameter to any council session tool call:

```json
{
  "topic": "Should we implement universal basic income?",
  "userPrompt": "As a concerned citizen, I want to add that automation is accelerating job displacement at an unprecedented rate.",
  "settings": {
    "verboseLogging": true,
    "progressDelay": 500
  }
}
```

#### What Happens:
- The bot's message appears as the first message in the council
- Councilors will respond to and discuss the bot's input
- The bot becomes an active participant, not just a facilitator

### 2. Enhanced Logging & Visibility

Sessions now provide detailed logging so you can see what's happening:

#### Startup Logging:
```
[Orchestrator] Starting council session session-xxx
[Orchestrator] Mode: prediction, Topic: "Will AI replace jobs?"
[Orchestrator] Enabled bots: 5/23
[Orchestrator] Verbose logging: enabled
[Orchestrator] Progress delay: 500ms
[Orchestrator] Economy mode: enabled
[Orchestrator] Max concurrent requests: 2
```

#### Tool Call Logging:
```
[MCP TOOL] council_prediction called - Topic: "Will AI replace jobs?"
[MCP SETTINGS] Verbose logging: enabled
[MCP SETTINGS] Progress delay: 500ms
[SessionService] Creating session session-xxx - Mode: PREDICTION, User Participation: Yes
[SessionService] Adding user prompt to session: "As a concerned citizen..."
[MCP TOOL] Created session: session-xxx
[MCP TOOL] Session completed: session-xxx - Messages: 8
```

#### Session Progress:
```
[AI Council MCP] [SESSION] session-xxx status -> opening
[AI Council MCP] [MESSAGE] session-xxx author=High Speaker type=gemini
[AI Council MCP] [SESSION] session-xxx status -> debating
[AI Council MCP] [MESSAGE] session-xxx author=The Technocrat type=gemini
[AI Council MCP] [MESSAGE] session-xxx author=The Ethicist type=gemini
[AI Council MCP] [SESSION] session-xxx status -> resolving
[AI Council MCP] [SESSION] session-xxx status -> adjourned
```

### 3. Progress Delay (Slower Execution)

Configure how fast sessions run for better visibility:

```json
{
  "topic": "Analyze market trends",
  "settings": {
    "progressDelay": 1000,  // 1 second between steps
    "verboseLogging": true
  }
}
```

**Benefits:**
- See each message as it arrives
- Better for monitoring long sessions
- Simulates "real-time" discussion
- Helps debug session flow

### 4. Verbose Mode

Enable detailed logging with `verboseLogging: true`:

```json
{
  "topic": "Complex research question",
  "settings": {
    "verboseLogging": true,  // Shows all internal operations
    "progressDelay": 500
  }
}
```

**Default:** `verboseLogging: true` (enabled by default)

## Updated Tool Schemas

All council session tools now accept:

### Parameters:
- `topic` (string, required): The topic to discuss
- `userPrompt` (string, optional): Your participation message
- `settings` (object, optional):
  - `verboseLogging` (boolean): Enable detailed logging (default: true)
  - `progressDelay` (number): Delay between steps in ms (default: 500)
  - `bots` (array): Configure which councilors participate
  - `economyMode` (boolean): Reduce costs (default: true)
  - `customDirective` (string): Additional instructions

### Example Calls:

#### Proposal Mode with Bot Participation:
```json
{
  "name": "council_proposal",
  "arguments": {
    "topic": "Implement a 4-day work week",
    "userPrompt": "I propose this because studies show it increases productivity while improving work-life balance.",
    "settings": {
      "verboseLogging": true,
      "progressDelay": 800
    }
  }
}
```

#### Research Mode with Progress Delay:
```json
{
  "name": "council_research",
  "arguments": {
    "topic": "Future of renewable energy",
    "settings": {
      "verboseLogging": true,
      "progressDelay": 1000
    }
  }
}
```

#### Prediction Mode:
```json
{
  "name": "council_prediction",
  "arguments": {
    "topic": "Will Bitcoin reach $100k by end of 2025?",
    "userPrompt": "Considering current market trends and regulatory developments, my hypothesis is...",
    "settings": {
      "verboseLogging": true,
      "progressDelay": 600
    }
  }
}
```

## Session Flow Logging

Each session now logs:

1. **Creation**
   - Session ID
   - Mode
   - Number of enabled bots
   - User participation status

2. **Status Changes**
   - opening → debating → resolving → adjourned

3. **Messages**
   - Author
   - AI model used
   - Timing

4. **Completion**
   - Total messages
   - Duration
   - Results summary

## Benefits

### For Developers:
- See exactly what the server is doing
- Debug session flow issues
- Monitor API calls and timing
- Track bot participation

### For Users:
- Visible progress (not "instant" results)
- Ability to participate in discussions
- Understand session flow
- Better transparency

### For Production:
- Monitor session health
- Identify bottlenecks
- Track resource usage
- Audit bot interactions

## Configuration Tips

### For Fast Results:
```json
{
  "settings": {
    "verboseLogging": false,
    "progressDelay": 0
  }
}
```

### For Maximum Visibility:
```json
{
  "settings": {
    "verboseLogging": true,
    "progressDelay": 1000,
    "economyMode": false
  }
}
```

### For Development/Testing:
```json
{
  "settings": {
    "verboseLogging": true,
    "progressDelay": 500
  }
}
```

## Examples

### Example 1: Active Participation
```json
{
  "name": "council_deliberation",
  "arguments": {
    "topic": "The ethics of AI in healthcare",
    "userPrompt": "As a healthcare professional, I'm concerned about patient privacy when AI makes diagnostic decisions.",
    "settings": {
      "verboseLogging": true,
      "progressDelay": 600
    }
  }
}
```

### Example 2: Product Owner in Coding Session
```json
{
  "name": "council_swarm_coding",
  "arguments": {
    "topic": "Build a REST API for user authentication",
    "userPrompt": "I need JWT-based auth with refresh tokens. Also, we should support OAuth2 for Google and GitHub login.",
    "settings": {
      "verboseLogging": true,
      "progressDelay": 800
    }
  }
}
```

### Example 3: Stakeholder in Proposal
```json
{
  "name": "council_proposal",
  "arguments": {
    "topic": "Transition to renewable energy",
    "userPrompt": "From an environmental perspective, we must act within the next 10 years to meet climate goals.",
    "settings": {
      "verboseLogging": true,
      "progressDelay": 700
    }
  }
}
```

---

### 5. 🎯 Comprehensive Server Logging (NEW!)

The MCP server now provides **extensive logging** so you can see everything happening on the server side!

#### Enhanced Startup Logging:
```
╔════════════════════════════════════════════════════════════╗
║         AI Council Chamber MCP Server                      ║
║         Version 1.0.0 - Standalone Mode                   ║
╚════════════════════════════════════════════════════════════╝

[SERVER] Starting initialization...
[SERVER] Node.js: v20.10.0
[SERVER] Platform: win32 x64
[SERVER] PID: 12345

[SERVER] ✓ Session service initialized
[SERVER] ✓ AI service initialized
[SERVER] ✓ Council orchestrator ready

[SERVER] Tools registered: 21
[SERVER]   - Council Session Tools: 7
[SERVER]   - Session Management: 5
[SERVER]   - Bot Management: 9
[SERVER]   - System Tools: 2

╔════════════════════════════════════════════════════════════╗
║                 SERVER READY                                ║
╚════════════════════════════════════════════════════════════╝
[SERVER] Initialization complete in 0.245s
[SERVER] Waiting for MCP requests on STDIO...
[SERVER] Log level: ERROR (use console.error for output)
```

#### Tool Call Logging:
```
[2025-12-01T19:15:32.145Z] [TOOL CALL #1] council_diagnostics
[TOOL] Arguments:
   {
     "verbose": true
   }

[2025-12-01T19:15:32.892Z] [TOOL COMPLETE] council_diagnostics
[TOOL] Total Duration: 747ms
[TOOL] Result preview:
   ╔════════════════════════════════════════════════════════════╗
   ║              AI COUNCIL MCP - DIAGNOSTICS                 ║
   ╚════════════════════════════════════════════════════════════╝
   ...
```

#### Server Heartbeat (Every 60 seconds):
```
[7:15:33 PM] [HEARTBEAT] Requests: 5 | Tools: 3 | Sessions: 1 | Memory: 45MB
[7:16:33 PM] [HEARTBEAT] Requests: 8 | Tools: 6 | Sessions: 2 | Memory: 52MB
```

#### Request Tracking:
```
[2025-12-01T19:15:30.123Z] [SERVER] Request #1: initialize
[SERVER]   Details: {
  "clientInfo": {
    "name": "Claude Desktop",
    "version": "0.9.0"
  }
}
```

#### Shutdown Logging:
```
[SERVER] Received SIGINT, shutting down gracefully...
[SERVER] Total uptime: 145.67s
[SERVER] Total requests: 12
[SERVER] Total tool calls: 8
```

#### What Gets Logged:
- ✅ **Server startup** - Version, platform, PID, initialization steps
- ✅ **Tool registration** - Count of each tool type
- ✅ **Request tracking** - All MCP requests with timestamps
- ✅ **Tool calls** - Arguments, duration, results preview
- ✅ **Heartbeat** - Memory usage, active sessions, request count
- ✅ **Session events** - Creation, status changes, completion
- ✅ **Error tracking** - Detailed error messages with context
- ✅ **Graceful shutdown** - Uptime statistics and summary

#### How to View Logs:
**For MCP Integration:**
- Logs appear on stderr (console.error)
- All server output goes to stderr for MCP compatibility
- Use your MCP client's log viewer to see server activity

**For Direct Execution:**
```bash
node dist/index.js 2>&1 | tee server.log
# Or just
node dist/index.js  # Output goes to console
```

**For Development:**
```bash
npm run dev  # Watch mode with logs
```

## Summary

✅ **Bot Participation** - Add `userPrompt` to participate as "User" or "Petitioner"
✅ **Enhanced Logging** - Detailed console output for all operations
✅ **Server Logging** - Comprehensive startup, request, and heartbeat logging
✅ **Progress Delay** - Adjustable delays for visible progression
✅ **Verbose Mode** - Optional detailed logging for debugging
✅ **Session Tracking** - Full visibility into session lifecycle

These enhancements make the MCP server more transparent, interactive, and developer-friendly!
