# AI Council Chamber MCP Server - Standalone Installation

This folder contains a complete, standalone installation of the AI Council Chamber MCP Server.

## What's Included

### Core Files
- `src/` - TypeScript source code (all services, tools, and types)
- `package.json` - Node.js dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Build configuration
- `.env.example` - Environment variables template

### Documentation
- `README.md` - Complete project documentation
- `SETUP.md` - Detailed setup instructions
- `SETUP_WIZARD_GUIDE.md` - Interactive setup wizard guide
- `TROUBLESHOOTING.md` - 50+ common issues and solutions
- `CHANGELOG.md` - Version history
- `examples/TOOL_CALL_EXAMPLES.md` - 13 comprehensive tool call examples

### Startup Scripts
- `start.bat` - Windows startup script with setup wizard
- `start.sh` - Linux/Mac startup script

### Configuration
- `mcp.json` - MCP server configuration template

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Keys

**Option A: Copy environment file**
```bash
cp .env.example .env
# Edit .env and add your API keys
```

**Option B: Set environment variables**
```bash
export GEMINI_API_KEY=your_api_key_here
```

### 3. Build the Server
```bash
npm run build
```

### 4. Start the Server

**Windows:**
```cmd
start.bat
```

**Linux/Mac:**
```bash
./start.sh
```

**With setup wizard (Windows only):**
```cmd
start.bat --setup
```

## Available MCP Tools

### Council Session Tools
1. `council_proposal` - Legislative proposal with voting
2. `council_deliberation` - Open roundtable discussion
3. `council_inquiry` - Direct Q&A format
4. `council_research` - Deep multi-phase research
5. `council_swarm` - Parallel task execution
6. `council_swarm_coding` - Collaborative code generation
7. `council_prediction` - Superforecasting with probabilities
8. `council_auto` - Smart mode selection (meta-tool)

### Management Tools
- `council_list_sessions` - List all sessions
- `council_get_session` - Get session details
- `council_stop_session` - Stop a session
- `council_list_bots` - List all councilor bots
- `council_update_bot` - Update bot configuration
- `council_add_memory` - Add precedent to memory
- `council_search_memories` - Search memories
- `council_list_memories` - List all memories
- `council_add_document` - Add knowledge base document
- `council_search_documents` - Search documents
- `council_list_documents` - List all documents

## Features

✅ **7 Session Modes** - Proposal, Deliberation, Inquiry, Research, Swarm, Swarm Coding, Prediction
✅ **20+ Councilor Personas** - Pre-configured diverse perspectives
✅ **Multi-Provider AI** - Gemini, OpenRouter, LM Studio, Ollama, Z.ai, Moonshot, Minimax
✅ **Weighted Voting** - Configurable vote weights
✅ **Session Persistence** - Survives server restarts
✅ **Input Validation** - XSS protection and schema validation
✅ **Loop Protection** - Prevents runaway sessions
✅ **Global Error Handling** - Centralized error management
✅ **Structured Logging** - Service-specific loggers
✅ **TypeScript Types** - Branded IDs and type guards

## Integration with MCP-Compatible Hosts

### Claude Desktop

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "ai-council": {
      "command": "node",
      "args": ["/full/path/to/ai-council-mcp-server-standalone/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "your_key_here"
      }
    }
  }
}
```

Config file locations:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`

### Using mcp.json

You can also reference the included `mcp.json` file in your MCP configuration.

## Development

### Run in Development Mode
```bash
npm run dev
```

### Run Type Checking
```bash
npm run type-check
```

### Run Linting
```bash
npm run lint
```

## Support

For issues and questions:
1. Check `TROUBLESHOOTING.md` for common solutions
2. Review `SETUP.md` for detailed setup instructions
3. See `examples/TOOL_CALL_EXAMPLES.md` for usage examples

## License

MIT License

---

**Version**: 2.0.0
**Last Updated**: November 2025
