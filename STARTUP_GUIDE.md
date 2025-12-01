# Quick Start Guide

## 🚀 Getting Started

### Option 1: Use the Startup Script (Recommended)

**Linux/Mac:**
```bash
./start.sh
```

**Windows:**
```cmd
start.bat
```

The script will automatically:
- Check Node.js version (v18+ required)
- Install dependencies if needed
- Build TypeScript if needed
- Validate API configuration
- Start the MCP server

---

## ⚙️ Configuration

### Quick API Key Setup

**Set environment variable and start:**
```bash
# Linux/Mac
export GEMINI_API_KEY=your_key_here
./start.sh

# Or inline
GEMINI_API_KEY=your_key_here ./start.sh

# Windows
set GEMINI_API_KEY=your_key_here& start.bat
```

### Using .env File

```bash
# 1. Copy example file
cp .env.example .env

# 2. Edit .env and add your API keys
# 3. Start the server
./start.sh
```

---

## 📋 Startup Script Options

### Help & Info
```bash
./start.sh -h              # Show full help
./start.sh -v              # Show version
./start.sh --node-version  # Show Node.js requirements
```

### Development
```bash
./start.sh -d              # Development mode (tsx watch)
```

### Optimization
```bash
./start.sh -i              # Skip npm install
./start.sh -b              # Skip TypeScript build
./start.sh -i -b           # Skip both (for quick testing)
```

### Configuration
```bash
./start.sh -c              # Check configuration only (don't start)
./start.sh --no-env        # Don't load .env file
```

---

## 🔑 API Providers

You only need **one** of these configured:

| Provider | Variable | Description |
|----------|----------|-------------|
| Google Gemini | `GEMINI_API_KEY` | Primary provider, get from [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| OpenRouter | `OPENROUTER_API_KEY` | Access to Claude, GPT-4, Llama, etc. |
| Local Models | `OLLAMA_ENDPOINT` | Ollama running locally |
| LM Studio | `LM_STUDIO_ENDPOINT` | LM Studio running locally |

**Local Model Examples:**
```bash
export OLLAMA_ENDPOINT=http://localhost:11434/v1/chat/completions
export LM_STUDIO_ENDPOINT=http://localhost:1234/v1/chat/completions
```

---

## ✅ Verify Installation

Run configuration check:
```bash
./start.sh -c
```

Expected output:
```
[SUCCESS] Node.js vX.X.X detected
[SUCCESS] .env file loaded (if using .env)
[SUCCESS] Dependencies already installed
[SUCCESS] Build already exists
[SUCCESS] At least one AI provider configured
[SUCCESS] All checks passed!
```

---

## 🎯 Integration Examples

### Claude Desktop

Add to your Claude Desktop config:
```json
{
  "mcpServers": {
    "ai-council": {
      "command": "/path/to/ai-council-mcp-server/start.sh",
      "env": {
        "GEMINI_API_KEY": "your_key_here"
      }
    }
  }
}
```

### Custom MCP Client

```python
# Python example
import asyncio
from mcp import ClientSession

async def main():
    # Run configuration check
    os.system('./start.sh -c')

    # Start server and connect
    process = await asyncio.create_subprocess_exec(
        './start.sh',
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )

    # Use the MCP server...
```

---

## 🛠️ Development

### Watch Mode (Auto-reload)
```bash
./start.sh -d
# or
npm run dev
```

### Manual Build
```bash
npm run build
npm start
```

### Type Checking
```bash
npm run typecheck
```

---

## 📁 File Structure

After setup:
```
ai-council-mcp-server/
├── .env                    # Your API keys (create this)
├── .env.example           # Example configuration
├── start.sh               # Linux/Mac startup script
├── start.bat              # Windows startup script
├── node_modules/          # Dependencies
├── dist/                  # Built JavaScript
└── src/                   # Source code
```

---

## 🐛 Troubleshooting

### Node.js not found
```bash
# Install Node.js 18+ from https://nodejs.org/
# Verify installation
node -v
npm -v
```

### Build fails
```bash
# Clean and rebuild
npm run clean
npm run build
```

### No API keys configured
```bash
# Set at least one provider
export GEMINI_API_KEY=your_key
# or use .env file
cp .env.example .env
# Then edit .env and add your keys
```

### Permission denied (Linux/Mac)
```bash
chmod +x start.sh
```

### Port already in use
The MCP server uses stdio, not network ports, so this shouldn't occur.

---

## 📚 Next Steps

1. **Configure API key** - Set up at least one AI provider
2. **Test with Claude Desktop** - See `examples/CLAUDE_DESKTOP_INTEGRATION.md`
3. **Explore tools** - Run `./start.sh -c` then start the server
4. **Build custom clients** - See `examples/example-client.py`

---

## 💡 Tips

- Start with **economy mode** in tool settings to reduce API costs
- Use **local models** (Ollama, LM Studio) for privacy and cost savings
- Check configuration with `./start.sh -c` before integration
- Use development mode (`-d`) when modifying the server code
