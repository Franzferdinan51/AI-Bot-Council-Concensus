# Detailed Setup Guide

This guide provides step-by-step instructions for installing and configuring the AI Council Chamber MCP Server.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Methods](#installation-methods)
3. [Configuration](#configuration)
4. [API Key Setup](#api-key-setup)
5. [Interactive Setup Wizard](#interactive-setup-wizard)
6. [Integration with Claude Desktop](#integration-with-claude-desktop)
7. [Testing Your Setup](#testing-your-setup)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Configuration](#advanced-configuration)

---

## Prerequisites

### System Requirements

- **Node.js**: Version 18.0 or higher
- **Operating System**: Windows 10+, macOS 10.15+, or Linux
- **Memory**: Minimum 2GB RAM (4GB recommended)
- **Disk Space**: 500MB free space

### Check Your Node.js Version

```bash
node -v
```

If you don't have Node.js installed, download it from [nodejs.org](https://nodejs.org/).

---

## Installation Methods

### Method 1: Interactive Setup Wizard (Recommended for Windows)

The easiest way to get started is using the interactive setup wizard:

```cmd
start.bat --setup
```

This will guide you through:
1. AI Provider configuration
2. Council persona selection
3. Server settings
4. Saving your configuration

The wizard will create a `.env` file with your settings and start the server automatically.

### Method 2: Quick Start Script

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

**Windows:**
```cmd
start.bat
```

On first run, the script will:
1. Check for Node.js
2. Install dependencies
3. Prompt for API keys
4. Build the TypeScript
5. Start the server

### Method 3: Manual Installation

```bash
# 1. Install dependencies
npm install

# 2. Build TypeScript
npm run build

# 3. Set environment variables
export GEMINI_API_KEY=your_key_here

# 4. Start the server
npm start
```

### Method 4: Development Mode

For development with hot reload:

```bash
# Install and build
npm install
npm run build

# Start in dev mode
npm run dev
```

---

## Configuration

### Configuration File (.env)

The server uses a `.env` file for configuration. Create this file in the project root:

```bash
# AI Council Chamber MCP Server Configuration

# ==========================================
# AI PROVIDER CONFIGURATION
# ==========================================

# Google Gemini (Recommended)
GEMINI_API_KEY=your_gemini_api_key_here

# OpenRouter (Alternative)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Local AI Providers
LM_STUDIO_ENDPOINT=http://localhost:1234/v1/chat/completions
OLLAMA_ENDPOINT=http://localhost:11434/v1/chat/completions

# ==========================================
# SERVER CONFIGURATION
# ==========================================

# Max concurrent API requests (1-5)
MAX_CONCURRENT_REQUESTS=2

# Enable economy mode (true/false) - reduces API costs
ECONOMY_MODE=true

# Context pruning for long conversations
CONTEXT_PRUNING=true

# Max conversation turns to keep
MAX_CONTEXT_TURNS=8

# Custom system directive (optional)
# CUSTOM_DIRECTIVE=Focus on efficiency and data-driven decisions
```

### Server Settings Explained

| Setting | Description | Default | Range |
|---------|-------------|---------|-------|
| `MAX_CONCURRENT_REQUESTS` | Parallel API calls to speed up sessions | 2 | 1-5 |
| `ECONOMY_MODE` | Reduces costs by simulating some debates | true | true/false |
| `CONTEXT_PRUNING` | Keeps conversation history manageable | true | true/false |
| `MAX_CONTEXT_TURNS` | Maximum turns to remember per councilor | 8 | 5-20 |
| `CUSTOM_DIRECTIVE` | Global instruction for all councilors | - | Text |

---

## API Key Setup

### Google Gemini (Recommended)

**Step 1:** Get your API key
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key

**Step 2:** Configure it

**Option A: Environment Variable**
```bash
export GEMINI_API_KEY=AIzaSy...
```

**Option B: .env File**
```bash
echo "GEMINI_API_KEY=AIzaSy..." >> .env
```

**Step 3:** Test
```bash
start.bat -c
```

### OpenRouter

**Step 1:** Get your API key
1. Visit [OpenRouter](https://openrouter.ai/keys)
2. Create an account
3. Generate a new key
4. Copy the key

**Step 2:** Configure
```bash
export OPENROUTER_API_KEY=sk-or-v1-...
```

**Step 3:** Test with a specific model
```bash
export OPENROUTER_API_KEY=sk-or-v1-...
export OPENROUTER_MODEL=anthropic/claude-3-sonnet
start.bat -c
```

### LM Studio (Local Models)

**Step 1:** Install LM Studio
1. Download from [lmstudio.ai](https://lmstudio.ai/)
2. Install on your computer
3. Launch the application

**Step 2:** Start a Local Server
1. In LM Studio, go to "Local Server" tab
2. Load a model (e.g., Llama-2-7B-Chat)
3. Click "Start Server"
4. Note the endpoint (default: http://localhost:1234)

**Step 3:** Configure
```bash
export LM_STUDIO_ENDPOINT=http://localhost:1234/v1/chat/completions
```

### Ollama (Local Models)

**Step 1:** Install Ollama
```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows: Download from ollama.com
```

**Step 2:** Pull a Model
```bash
ollama pull llama2
ollama pull codellama
```

**Step 3:** Start Ollama
```bash
ollama serve
```

**Step 4:** Configure
```bash
export OLLAMA_ENDPOINT=http://localhost:11434/v1/chat/completions
```

---

## Interactive Setup Wizard

The setup wizard provides a user-friendly way to configure your server:

### Running the Wizard

**Windows:**
```cmd
start.bat --setup
```

**Linux/Mac:** (Wizard available in Windows batch version only)

### Wizard Steps

#### Step 1: AI Provider Configuration

Choose your provider(s):

```
Available Providers:
  1. Google Gemini     - Powerful, multi-modal, recommended
  2. OpenRouter        - Access to Claude, GPT-4, Llama, etc.
  3. LM Studio         - Local models (your computer)
  4. Ollama            - Local models (your computer)
  5. Other providers   - Z.ai, Moonshot, Minimax, etc.

Enter provider number (1-5) or press Enter to skip: 1
```

#### Step 2: Council Personas

Choose a preset:

```
Choose which councilors to enable for debates:

DEFAULT COUNCIL (Recommended for beginners):
  [1] The Speaker      - Objective judge and moderator
  [2] The Technocrat   - Data-driven, efficiency focused
  [3] The Ethicist     - Morality and well-being focused
  [4] The Pragmatist   - Economics and feasibility

ADDITIONAL COUNCILORS (Optional):
  [5] The Visionary    - Future-focused, radical innovation
  [6] The Sentinel     - Security and defense focused
  [7] The Historian    - Past precedents and patterns
  [8] The Diplomat     - Soft power and compromise
  [9] The Skeptic      - Devil's advocate, risk assessment
  [10] The Journalist  - Public interest, transparency

SPECIALIST AGENTS:
  [11] Specialist Coder     - Technical implementation
  [12] Specialist Legal     - Law and regulations
  [13] Specialist Finance   - Economics and markets

Enter choice (1=Beginner, 2=Advanced, 3=Custom, 4=Skip): 1
```

#### Step 3: Server Configuration

```
These settings control behavior and costs:

Enable Economy Mode? (reduces API costs) [y/n] [y]: y
Max concurrent API requests (1-5) [2]: 2
Max context turns to keep (5-20) [8]: 8
Custom system directive (optional, press Enter to skip):
```

#### Step 4: Save Configuration

Review and save your settings:

```
Configuration Summary:

  ✓ Google Gemini configured
  ✓ The Speaker enabled
  ✓ The Technocrat enabled
  ✓ The Ethicist enabled
  ✓ The Pragmatist enabled

  Economy Mode: true
  Max Concurrent Requests: 2
  Max Context Turns: 8

Save this configuration? (y/n) [y]: y

[SUCCESS] Configuration saved to .env file
```

---

## Integration with Claude Desktop

To use the AI Council MCP Server with Claude Desktop:

### Step 1: Locate Claude Desktop Config

**macOS:**
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```bash
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux:**
```bash
~/.config/claude/claude_desktop_config.json
```

### Step 2: Edit the Config

Add the MCP server configuration:

```json
{
  "mcpServers": {
    "ai-council": {
      "command": "node",
      "args": ["/full/path/to/ai-council-mcp-server/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

**Example (macOS):**

```json
{
  "mcpServers": {
    "ai-council": {
      "command": "node",
      "args": ["/Users/username/ai-council-mcp-server/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "AIzaSy..."
      }
    }
  }
}
```

**Example (Windows):**

```json
{
  "mcpServers": {
    "ai-council": {
      "command": "node",
      "args": ["C:\\Users\\username\\ai-council-mcp-server\\dist\\index.js"],
      "env": {
        "GEMINI_API_KEY": "AIzaSy..."
      }
    }
  }
}
```

### Step 3: Restart Claude Desktop

Close Claude Desktop completely and restart it.

### Step 4: Verify Integration

In Claude Desktop, try:

```
Can you help me set up a council session to discuss remote work policies?
```

Claude should automatically use the AI Council MCP tools.

---

## Testing Your Setup

### Check Configuration

```bash
start.bat -c
```

Expected output:
```
[INFO] Configuration:
  Mode: Production
  Node.js: v20.x.x
  NPM: v10.x.x
  Provider: Google Gemini ✓

[SUCCESS] At least one AI provider configured
[SUCCESS] All checks passed!
```

### Run a Test Session

```bash
start.bat
```

In another terminal, test with curl:

```bash
curl -X POST http://localhost:3000/call-tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "council_auto",
    "arguments": {
      "topic": "Test: Should we have coffee breaks?",
      "mode": "inquiry",
      "settings": {
        "economyMode": true,
        "maxRounds": 2
      }
    }
  }'
```

### Test with Python

```python
import asyncio
import json
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def test():
    server_params = StdioServerParameters(
        command="node",
        args=["dist/index.js"],
        env={"GEMINI_API_KEY": "your_key"}
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            result = await session.call_tool(
                "council_auto",
                arguments={
                    "topic": "What is the best programming language?",
                    "mode": "auto"
                }
            )

            print(json.loads(result.content[0].text))

asyncio.run(test())
```

---

## Troubleshooting

### Common Issues

#### Issue: "Node.js is not installed"

**Solution:**
1. Install Node.js 18+ from [nodejs.org](https://nodejs.org/)
2. Restart your terminal
3. Run `node -v` to verify

#### Issue: "No AI provider API keys configured"

**Solution:**
1. Run the setup wizard: `start.bat --setup`
2. Or manually set environment variables:
   ```bash
   export GEMINI_API_KEY=your_key
   ```

#### Issue: "Build failed"

**Solution:**
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

#### Issue: "Permission denied" (Linux/Mac)

**Solution:**
```bash
chmod +x start.sh
```

#### Issue: Server starts but tools don't work

**Solution:**
1. Check the server is running: `start.bat`
2. Verify API keys: `start.bat -c`
3. Check logs for errors
4. Try economy mode for testing

#### Issue: "Module not found" errors

**Solution:**
```bash
npm install
npm run build
```

#### Issue: Claude Desktop integration not working

**Solution:**
1. Verify the path in config is correct (use absolute path)
2. Check file permissions
3. Restart Claude Desktop completely
4. Check Claude Desktop logs

#### Issue: High API costs

**Solution:**
1. Enable economy mode: `ECONOMY_MODE=true`
2. Reduce concurrent requests: `MAX_CONCURRENT_REQUESTS=1`
3. Use local models (LM Studio, Ollama)
4. Limit bot count in sessions

#### Issue: Slow responses

**Solution:**
1. Increase concurrent requests: `MAX_CONCURRENT_REQUESTS=3` (max 5)
2. Disable economy mode for faster responses
3. Use faster models (gemini-2.0-flash vs gemini-2.0-pro)
4. Check your internet connection

---

## Advanced Configuration

### Custom Environment File Location

By default, the server looks for `.env` in the project root. To use a different location:

```bash
start.bat --env-file /path/to/custom.env
```

### Running Without .env File

```bash
start.bat --no-env
```

Then set environment variables:
```bash
export GEMINI_API_KEY=your_key
export MAX_CONCURRENT_REQUESTS=3
```

### Debug Mode

For detailed logging:

```bash
DEBUG=mcp* start.bat
```

### Custom Ports

The MCP server uses stdio by default. To use HTTP:

Edit `dist/index.js` and modify the transport:

```javascript
// Change from StdioServerTransport to:
import { HttpServerTransport } from '@modelcontextprotocol/sdk/server/http.js';

// Then use:
const transport = new HttpServerTransport({ port: 3000 });
```

### Scaling for Production

**Environment Variables:**

```bash
NODE_ENV=production
MAX_CONCURRENT_REQUESTS=5
ECONOMY_MODE=true
LOG_LEVEL=info
```

**PM2 Process Manager:**

```bash
npm install -g pm2
pm2 start dist/index.js --name "ai-council-mcp"
pm2 save
pm2 startup
```

---

## Getting Help

- **Documentation**: See `README.md` for overview
- **Setup Wizard Guide**: See `SETUP_WIZARD_GUIDE.md`
- **Tool Examples**: See `examples/TOOL_CALL_EXAMPLES.md`
- **Issues**: Create an issue on GitHub

---

## Summary

You should now have:
- ✅ Node.js installed
- ✅ Server configured with API keys
- ✅ .env file created
- ✅ Server running successfully
- ✅ Integration with Claude Desktop (optional)
- ✅ Knowledge of troubleshooting steps

You're ready to use the AI Council Chamber MCP Server!
