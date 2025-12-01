# Interactive Setup Wizard Guide

## 🎯 Quick Start

**For Windows users, we now have a powerful interactive setup wizard!**

```cmd
start.bat --setup
```

This launches a step-by-step wizard that makes configuration easy and intuitive.

---

## 📋 What the Setup Wizard Does

### Step 1: Configure AI Providers
Choose from multiple providers:

- **Google Gemini** - Powerful, multi-modal (recommended)
- **OpenRouter** - Access to Claude, GPT-4, Llama, and more
- **LM Studio** - Local models on your computer
- **Ollama** - Local models on your computer
- **Other Providers** - Z.ai, Moonshot, Minimax, Generic OpenAI-compatible

**You can configure multiple providers at once!**

---

### Step 2: Configure Council Personas

Three options:

#### Option 1: Beginner Setup ✅
Automatically enables:
- The Speaker (moderator)
- The Technocrat (data-driven)
- The Ethicist (morality-focused)
- The Pragmatist (economics-focused)

**Perfect for getting started quickly!**

#### Option 2: Advanced Setup 🚀
Includes everything from Beginner plus:
- The Visionary (future-focused)
- The Skeptic (devil's advocate)
- The Historian (past precedents)

**Great for complex debates and decision-making**

#### Option 3: Custom Setup 🎛️
Manually enable/disable each persona:
- The Speaker
- The Technocrat
- The Ethicist
- The Pragmatist
- The Visionary
- The Sentinel
- The Historian
- The Diplomat
- The Skeptic
- The Journalist
- Specialist Coder
- Specialist Legal
- Specialist Finance

**Full control over your council!**

---

### Step 3: Server Configuration

Settings to control behavior and costs:

- **Economy Mode** (y/n) - Reduces API costs by simulating debates
- **Max Concurrent Requests** (1-5) - Control parallel API calls
- **Max Context Turns** (5-20) - Limit conversation history
- **Custom System Directive** (optional) - Override default behavior

---

### Step 4: Save Configuration

Review your configuration summary:
- ✅ Check all providers configured
- ✅ Review enabled personas
- ✅ Confirm server settings

Then save to `.env` file for automatic loading!

---

## 🚀 Usage Examples

### First-Time Setup
```cmd
# Launch the wizard
start.bat --setup

# Follow the prompts...
# 1. Choose provider (e.g., Gemini)
# 2. Enter API key
# 3. Choose "Beginner" preset
# 4. Enable Economy Mode
# 5. Save configuration

# Server starts automatically!
```

### Modify Existing Setup
```cmd
# Run wizard again - it loads your existing .env
start.bat --setup

# Make changes and save
```

### Quick Presets
```cmd
# Beginner (4 councilors)
# Choose option 1 in Step 2

# Advanced (7 councilors)
# Choose option 2 in Step 2

# Custom (your choice)
# Choose option 3 in Step 2
```

---

## 📝 Configuration File

The wizard creates a `.env` file with all your settings:

```env
# AI Council Chamber MCP Server Configuration

# ==========================================
# AI PROVIDER CONFIGURATION
# ==========================================

GEMINI_API_KEY=your_key_here
OPENROUTER_API_KEY=your_key_here
LM_STUDIO_ENDPOINT=http://localhost:1234/v1/chat/completions

# ==========================================
# SERVER CONFIGURATION
# ==========================================

MAX_CONCURRENT_REQUESTS=2
ECONOMY_MODE=true
CONTEXT_PRUNING=true
MAX_CONTEXT_TURNS=8
```

---

## 💡 Tips

### For Beginners
- Start with **Beginner preset** (Step 2, option 1)
- Enable **Economy Mode** to save costs
- Use **Google Gemini** or **OpenRouter** as your provider

### For Advanced Users
- Use **Advanced preset** (Step 2, option 2)
- Configure **multiple providers** for flexibility
- Customize **max concurrent requests** based on your API limits

### For Developers
- Use **Custom setup** (Step 2, option 3)
- Enable only the personas you need
- Set **custom system directive** for specific behavior

### For Privacy/Security
- Use **LM Studio** or **Ollama** for local processing
- No data leaves your computer
- Set `ECONOMY_MODE=true` to minimize API calls

---

## 🔧 Command Line Options

Full list of available commands:

```cmd
start.bat --setup          # Interactive setup wizard
start.bat                  # Start server with current config
start.bat --dev            # Development mode (watch)
start.bat -c               # Check configuration only
start.bat -i -b            # Skip install/build (for testing)
start.bat -h               # Show help
start.bat --version        # Show version
```

---

## 📖 Workflow Examples

### Example 1: First-Time User
```
start.bat --setup
→ Choose Gemini (option 1)
→ Enter API key
→ Choose Beginner preset (option 1)
→ Accept default settings
→ Save configuration
→ Server starts automatically!
```

### Example 2: Add More Personas
```
start.bat --setup
→ Skip provider setup (press Enter)
→ Choose Custom setup (option 3)
→ Enable additional personas (y/n for each)
→ Save changes
```

### Example 3: Switch to Local Models
```
start.bat --setup
→ Choose LM Studio (option 3)
→ Press Enter for default endpoint
→ Choose any personas
→ Save configuration
```

### Example 4: Just Check Configuration
```
start.bat -c
→ Shows validation results
→ No server startup
```

---

## 🎓 Available Personas Reference

### Core Council (Always Recommended)
- **The Speaker** - Objective judge, synthesizes arguments
- **The Technocrat** - Data-driven, efficiency-focused
- **The Ethicist** - Morality and human well-being
- **The Pragmatist** - Economics and feasibility

### Extended Council
- **The Visionary** - Future-focused, radical innovation
- **The Sentinel** - Security and defense
- **The Historian** - Past precedents and patterns
- **The Diplomat** - Soft power and compromise
- **The Skeptic** - Devil's advocate, risk assessment
- **The Journalist** - Public interest, transparency

### Specialists
- **Specialist Coder** - Technical implementation
- **Specialist Legal** - Law and regulations
- **Specialist Finance** - Economics and markets

---

## 🆘 Troubleshooting

### No providers configured
```cmd
start.bat --setup
# Then configure at least one provider in Step 1
```

### Want to change API key
```cmd
start.bat --setup
# Wizard loads existing .env
# Just reconfigure the provider in Step 1
```

### Reset configuration
```cmd
del .env
start.bat --setup
# Start fresh with the wizard
```

### Check what was configured
```cmd
type .env
# View your configuration file
```

---

## 📚 Documentation

- **README.md** - Full documentation
- **STARTUP_GUIDE.md** - Quick start guide
- **SETUP_WIZARD_GUIDE.md** - This guide

---

## 🎉 Next Steps

After running the setup wizard:

1. **Test your configuration**
   ```cmd
   start.bat -c
   ```

2. **Start the server**
   ```cmd
   start.bat
   ```

3. **Integrate with Claude Desktop**
   - See `examples/CLAUDE_DESKTOP_INTEGRATION.md`

4. **Build custom clients**
   - See `examples/example-client.py`

---

## ✨ Pro Tips

- **Re-run the wizard anytime** to modify configuration
- **Use presets** (Beginner/Advanced) for speed, **Custom** for control
- **Economy Mode** is great for testing and cost savings
- **Multiple providers** give you flexibility and backup options
- **Local models** (LM Studio, Ollama) provide privacy and zero per-call costs

Happy debating! 🏛️✨
