# Quick Start Guide - AI Council Chamber

**Last Updated:** 2026-02-06 10:15 EST
**Status:** ✅ Ready to Use

---

## 🚀 Setup (5 minutes)

### Prerequisites
- Node.js 18+ installed
- Google Gemini API key (or alternative provider)

### Step 1: Install Dependencies
```bash
cd /home/duckets/AI-Bot-Council-Concensus
npm install --legacy-peer-deps
```

**Note:** We use `--legacy-peer-deps` because Recharts 3.x is React 19 compatible (current project version), but still marks React 16/17/18 as peer dependencies.

### Step 2: Configure API Key

**Option A: Environment Variable (Recommended)**
```bash
export API_KEY="your-gemini-api-key-here"
npm run dev
```

**Option B: Browser Local Storage**
1. Start the dev server: `npm run dev`
2. Open http://localhost:3001/
3. Click "Settings" button (⚙️)
4. Paste your API key in the "Gemini API Key" field
5. Click "Save Settings"

**Get Gemini API Key:** https://aistudio.google.com/app/apikey

### Step 3: Start the Application
```bash
npm run dev
```

**Access:** http://localhost:3001/

**Network Access:**
- Local: http://localhost:3001/
- LAN: http://192.168.1.101:3001/
- External: http://100.106.80.61:3001/

---

## 🤖 Using the Council

### Basic Workflow

1. **Select a Mode**
   - **Legislative Proposal** - Standard debate → vote → enact
   - **Deep Research** - Agentic investigation with Google Search
   - **Swarm Hive** - Parallel task decomposition
   - **Swarm Coding** - Code generation with IDE UI
   - **Prediction Market** - Probabilistic forecasting
   - **Inquiry** - Q&A mode

2. **Enter Your Topic**
   - Type your question or proposal in the input field
   - Click "Open Session" or press Enter

3. **Watch the Debate**
   - Councilors will take turns debating
   - Each bot responds based on their persona
   - The Speaker synthesizes and moderates

4. **Review Results**
   - Read all councilor contributions
   - Check the final synthesis
   - Vote if in Legislative mode

---

## 🎭 Available Councilors

### Core Personas
- **The Speaker** (Gemini 3 Pro) - Objective judge, synthesizes arguments
- **The Technocrat** - Values efficiency and data
- **The Ethicist** - Prioritizes morality and human well-being
- **The Pragmatist** - Focuses on cost and feasibility
- **The Skeptic** - Devil's advocate, finds flaws
- **The Visionary** - Future-focused, big ideas
- **The Historian** - Provides historical context
- **The Diplomat** - Seeks consensus and compromise
- **The Sentinel** - Security-focused, risk-aware

### Specialist Agents
- **Law Specialist** - Legal expertise
- **Science Specialist** - Technical analysis
- **Finance Specialist** - Economic perspective
- **Military Specialist** - Strategic assessment

---

## 🔧 Advanced Features

### Private Consultation
Click any councilor's avatar to open a private side channel for 1-on-1 discussion.

### Audio Support
1. Go to Settings (⚙️)
2. Enable "Audio Output"
3. Choose "Gemini TTS" for neural voices or "Browser TTS" for system voices
4. Adjust speech rate and volume

### Session Modes

#### Legislative Proposal
Standard parliamentary flow:
1. Present topic
2. Councilors debate in rounds
3. Vote on the proposal
4. Speaker issues ruling

#### Deep Research
Agentic investigation:
1. Topic broken into research vectors
2. Agents perform breadth and depth searches
3. Gaps identified and filled
4. Comprehensive dossier compiled

#### Swarm Hive
Parallel task execution:
1. Topic decomposed into subtasks
2. Drone agents spawned for parallel work
3. Results aggregated and synthesized

#### Swarm Coding
Software engineering workflow:
1. Council transforms into Dev Team
2. Architect assigns files to workers
3. Code generated in real-time
4. IDE-style UI with file explorer

#### Prediction Market
Superforecasting:
1. Council performs "Pre-Mortem" analysis
2. Base rates analyzed
3. Probabilistic forecasts generated
4. Confidence intervals provided

#### Inquiry
Rapid-fire Q&A:
1. User asks questions
2. Council provides specific answers
3. Speaker synthesizes responses

---

## 🌐 Configuring Multiple AI Providers

### Google Gemini (Primary)
```
Provider: Google Gemini
API Key: Get from https://aistudio.google.com/app/apikey
Models: gemini-2.5-flash, gemini-1.5-pro, gemini-2.5-flash-8b
Endpoint: Auto-configured (Google's endpoint)
```

### LM Studio (Local - Free!)
```
Provider: LM Studio
Endpoint: http://100.74.88.40:1234/v1/chat/completions
API Key: Usually not needed
Models: qwen3-coder-next, jan-v2-vl-max_moe, etc.
```

### OpenRouter (Multiple Models)
```
Provider: OpenRouter
API Key: Get from https://openrouter.ai/keys
Models: anthropic/claude-3.5-sonnet, openai/gpt-4o, meta-llama/llama-3.1-70b-instruct
Endpoint: https://openrouter.ai/api/v1/chat/completions
```

### Ollama (Local - Free!)
```
Provider: Ollama
Endpoint: http://localhost:11434/v1/chat/completions
API Key: Usually not needed
Models: llama2, mistral, codellama, etc.
```

---

## 🛠️ Available Tools (Built-in MCP)

### Public MCP Tools
- **Web Search** - Google Search integration (Gemini only)
- **Fetch Website** - Scrape text from URLs
- **GitHub Repo** - Read files from GitHub repositories
- **Weather** - Get current weather data
- **Crypto Price** - Get cryptocurrency prices
- **Wikipedia** - Search Wikipedia summaries
- **Current Time** - Get time in any timezone
- **GitHub User** - Get user profile information
- **Random Identity** - Generate fake identities for testing

### Tool Usage
Tools are automatically called by AI when needed. No manual configuration required for basic usage.

---

## 📱 Access from Other Devices

### On the Same Network
1. Find your local IP: `ip addr show | grep inet`
2. Access: `http://YOUR-IP:3001/`
   - Example: `http://192.168.1.101:3001/`

### External Access
1. Open firewall port 3001
2. Access: `http://100.106.80.61:3001/`
3. **Security Warning:** Only use on trusted networks or with VPN

---

## 🐛 Troubleshooting

### "vite: not found"
```bash
npm install --legacy-peer-deps
```

### Port 3000 Already in Use
The app auto-switches to port 3001. No action needed.

### React 19 / Recharts Error
This has been fixed! We now use Recharts 3.7.0 which is React 19 compatible.

### "API Key Required"
You must configure an API key to use the council:
1. Go to Settings (⚙️)
2. Enter your Gemini API key
3. Click "Save Settings"

### Slow Response Times
- Use local models (LM Studio, Ollama) for faster responses
- Reduce number of enabled councilors
- Enable "Economy Mode" in Settings

### Session Won't Start
- Check that you have an API key configured
- Verify at least 2 councilors are enabled
- Check browser console for errors (F12)

---

## 📊 Cost Optimization

### Reduce API Costs
1. **Use Local Models** - LM Studio and Ollama are free
2. **Enable Economy Mode** - Forces lighter models for councilors
3. **Limit Councilors** - Fewer bots = fewer API calls
4. **Reduce Context** - Lower "Max Context Turns" in Settings
5. **Use Gemini 2.5 Flash** - Cheaper than Pro

### Monitor Costs
- Settings panel shows estimated costs per session
- Check "Cost Tracking" section after sessions

---

## 🔒 Security Notes

### API Keys
- Never commit `.env` files to git
- Use environment variables when possible
- Rotate keys regularly

### External Access
- Only expose on trusted networks
- Consider using VPN for remote access
- Disable debug mode in production

### Data Privacy
- Session data is stored in browser localStorage
- Clear browser data to reset the council
- No data is sent to third parties (except AI API providers)

---

## 📚 Next Steps

### Learn More
- **Full Documentation:** See `INVESTIGATION-REPORT.md` for technical details
- **Repository:** https://github.com/Franzferdinan51/AI-Bot-Council-Concensus.git

### Enhancements Coming
- **Backend Services** - SQLite database for persistence
- **MCP Server** - External tool integration
- **Session Templates** - Pre-configured debate formats
- **Vector Database** - Semantic memory search
- **Multi-Instance Federation** - Connect multiple councils

### Get Involved
- Report bugs on GitHub Issues
- Suggest new features
- Contribute new personas
- Add MCP tools

---

## 💡 Tips

### Best Practices
1. **Start with Legislative mode** for most topics
2. **Enable 5-7 councilors** for balanced debates
3. **Use Deep Research mode** for fact-intensive topics
4. **Try Swarm Coding** for software projects
5. **Check the Skeptic's arguments** for risk analysis

### Example Topics
- "Should AI be regulated?"
- "Design a system for remote team collaboration"
- "Predict the future of autonomous vehicles"
- "What are the ethical implications of genetic editing?"
- "Create a plan to reduce carbon emissions"

---

## 🆘 Support

### Documentation
- `README.md` - Full feature documentation
- `INVESTIGATION-REPORT.md` - Technical analysis
- This guide - Quick start

### Issues
- Report bugs: https://github.com/Franzferdinan51/AI-Bot-Council-Concensus/issues
- Feature requests: Same as above

---

**Enjoy your AI Council!** 🏛️

*Built by the community for multi-agent AI deliberation*
