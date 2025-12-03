# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the AI Council Chamber MCP Server.

## Table of Contents

1. [Quick Diagnosis](#quick-diagnosis)
2. [Installation Issues](#installation-issues)
3. [Configuration Issues](#configuration-issues)
4. [Runtime Issues](#runtime-issues)
5. [API & Provider Issues](#api--provider-issues)
6. [Performance Issues](#performance-issues)
7. [Integration Issues](#integration-issues)
8. [Session Issues](#session-issues)
9. [Memory & Knowledge Base Issues](#memory--knowledge-base-issues)
10. [Error Messages Reference](#error-messages-reference)
11. [Getting Help](#getting-help)

---

## Quick Diagnosis

### Check System Health

```bash
# Check configuration with diagnostics
council_diagnostics({ "preset": "config" })

# Check connectivity
council_diagnostics({ "preset": "connectivity", "includeTests": true })

# Check Node.js version
node -v

# Check if server starts
start.bat
```

### Enable Debug Logging

```bash
# Enable debug mode
DEBUG=mcp* start.bat -d
```

### View Logs

Logs are written to stderr. When using `start.bat`, logs appear in the terminal.

For file logging:
```bash
start.bat 2>&1 | tee server.log
```

---

## Installation Issues

### Problem: "Node.js is not installed"

**Symptoms:**
```
'node' is not recognized as an internal or external command
bash: node: command not found
```

**Solutions:**

1. **Install Node.js**
   - Download from [nodejs.org](https://nodejs.org/)
   - Install Node.js 18 or higher
   - Restart your terminal

2. **Verify Installation**
   ```bash
   node -v
   # Should output v18.x.x or higher
   ```

3. **PATH Issues (Linux/Mac)**
   ```bash
   # Add to ~/.bashrc or ~/.zshrc
   export PATH=$PATH:/usr/local/bin
   source ~/.bashrc
   ```

---

### Problem: "npm install fails"

**Symptoms:**
```
npm ERR! peer dep missing
npm ERR! cannot find module 'X'
```

**Solutions:**

1. **Clear npm cache**
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Use specific npm version**
   ```bash
   npm install -g npm@latest
   npm install
   ```

3. **Fix permissions (Linux/Mac)**
   ```bash
   sudo chown -R $USER:$GROUP ~/.npm
   sudo chown -R $USER:$GROUP ~/.config
   ```

4. **Install missing dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

---

### Problem: "Build failed - TypeScript errors"

**Symptoms:**
```
ERROR: Build failed
TypeScript compilation errors
```

**Solutions:**

1. **Clean and rebuild**
   ```bash
   rm -rf dist
   npm run build
   ```

2. **Check TypeScript version**
   ```bash
   npm list typescript
   # Should be version 5.x or higher
   ```

3. **Fix type errors**
   - Review error messages
   - Check for missing imports
   - Verify type definitions

4. **Skip type checking (not recommended)**
   ```bash
   npm run build -- --skipLibCheck
   ```

---

### Problem: "Permission denied" on Linux/Mac

**Symptoms:**
```
Permission denied: ./start.sh
bash: ./start.sh: Permission denied
```

**Solution:**
```bash
chmod +x start.sh
./start.sh
```

---

## Configuration Issues

### Problem: "No AI provider API keys configured"

**Symptoms:**
```
[WARNING] No AI provider API keys configured
[ERROR] Failed to start server
```

**Solutions:**

1. **Run setup wizard**
   ```cmd
   start.bat --setup
   ```

2. **Set environment variable**
   ```bash
   export GEMINI_API_KEY=your_key_here
   ```

3. **Create .env file**
   ```bash
   echo "GEMINI_API_KEY=your_key_here" > .env
   ```

4. **Verify configuration**
   ```bash
   start.bat -c
   ```

---

### Problem: ".env file not found"

**Symptoms:**
```
[ERROR] Cannot find .env file
[WARNING] Not loading environment variables
```

**Solutions:**

1. **Create .env file**
   ```bash
   # In project root directory
   touch .env
   # Add your configuration
   ```

2. **Copy from example**
   ```bash
   cp .env.example .env
   # Edit .env with your keys
   ```

3. **Use alternative location**
   ```bash
   # Copy .env to project root
   cp /path/to/config.env .env
   ```

---

### Problem: "Invalid API key format"

**Symptoms:**
```
[ERROR] Invalid API key
401 Unauthorized from provider
```

**Solutions:**

1. **Verify key format**
   - Gemini: Should start with "AIza"
   - OpenRouter: Should start with "sk-or-v1-"
   - OpenAI: Should start with "sk-"

2. **Regenerate key**
   - Log into provider dashboard
   - Create new API key
   - Update .env file

3. **Check for extra spaces**
   ```bash
   # Remove whitespace
   GEMINI_API_KEY=AIzaSy... # No spaces around =
   ```

---

## Runtime Issues

### Problem: "Server starts but exits immediately"

**Symptoms:**
```
Server started
Server shutting down
Exited with code 0
```

**Solutions:**

1. **Check for missing dependencies**
   ```bash
   npm install
   ```

2. **Check for port conflicts**
   ```bash
   # Kill process using port (if HTTP mode)
   lsof -ti:3000 | xargs kill
   ```

3. **Enable error logging**
   ```bash
   DEBUG=mcp* start.bat 2>&1 | tee debug.log
   ```

---

### Problem: "Out of memory errors"

**Symptoms:**
```
JavaScript heap out of memory
Fatal error: Allocation failed
```

**Solutions:**

1. **Increase Node.js memory limit**
   ```bash
   node --max-old-space-size=4096 dist/index.js
   ```

2. **Enable economy mode**
   ```bash
   # In .env
   ECONOMY_MODE=true
   ```

3. **Reduce concurrent requests**
   ```bash
   MAX_CONCURRENT_REQUESTS=1
   ```

4. **Use lighter models**
   - gemini-2.0-flash instead of gemini-2.0-pro
   - llama-7b instead of llama-70b

---

### Problem: "Server hangs or freezes"

**Symptoms:**
```
Server unresponsive
No output after starting
```

**Solutions:**

1. **Check for infinite loops**
   ```bash
   # Kill process
   Ctrl+C
   # Restart
   start.bat -d
   ```

2. **Check network connectivity**
   ```bash
   ping google.com
   ```

3. **Disable economy mode temporarily**
   ```bash
   ECONOMY_MODE=false
   ```

---

## API & Provider Issues

### Problem: "401 Unauthorized" from API

**Symptoms:**
```
[ERROR] API request failed: 401
Unauthorized access
```

**Solutions:**

1. **Verify API key**
   ```bash
   # Check key is correct
   cat .env | grep API_KEY
   ```

2. **Check key permissions**
   - Ensure key has proper access
   - Regenerate if compromised

3. **Verify billing**
   - Check provider billing page
   - Add payment method if required

4. **Test key directly**
   ```bash
   curl -H "Authorization: Bearer YOUR_KEY" \
     https://api.provider.com/test
   ```

---

### Problem: "429 Rate limit exceeded"

**Symptoms:**
```
[ERROR] API request failed: 429
Rate limit exceeded
Too many requests
```

**Solutions:**

1. **Reduce concurrent requests**
   ```bash
   MAX_CONCURRENT_REQUESTS=1
   ```

2. **Enable economy mode**
   ```bash
   ECONOMY_MODE=true
   ```

3. **Add delays**
   ```bash
   # In .env
   REQUEST_DELAY_MS=1000
   ```

4. **Upgrade plan**
   - Increase rate limits
   - Contact provider support

---

### Problem: "500 Server Error" from API

**Symptoms:**
```
[ERROR] API request failed: 500
Internal server error
```

**Solutions:**

1. **Check provider status**
   - Visit provider status page
   - Check for outages

2. **Reduce request size**
   ```bash
   MAX_CONTEXT_TURNS=5
   ```

3. **Simplify prompt**
   ```bash
   # Use custom directive to simplify
   CUSTOM_DIRECTIVE=Be concise
   ```

4. **Try different model**
   ```bash
   # Use more stable model
   OPENROUTER_MODEL=anthropic/claude-3-haiku
   ```

---

### Problem: "Network timeout"

**Symptoms:**
```
[ERROR] Request timeout
ETIMEDOUT
```

**Solutions:**

1. **Check internet connection**
   ```bash
   ping google.com
   ```

2. **Increase timeout**
   ```bash
   # In custom code, increase timeout value
   ```

3. **Use local models**
   ```bash
   # LM Studio or Ollama
   LM_STUDIO_ENDPOINT=http://localhost:1234
   ```

---

## Performance Issues

### Problem: "Very slow responses"

**Symptoms:**
```
Session takes 5+ minutes
Messages appear very slowly
```

**Solutions:**

1. **Increase concurrent requests**
   ```bash
   MAX_CONCURRENT_REQUESTS=3
   ```

2. **Disable economy mode**
   ```bash
   ECONOMY_MODE=false
   ```

3. **Use faster models**
   ```bash
   # Instead of gemini-2.0-pro
   OPENROUTER_MODEL=anthropic/claude-3-haiku
   ```

4. **Reduce bot count**
   ```json
   {
     "settings": {
       "bots": [
         {"id": "councilor-technocrat", "enabled": true},
         {"id": "councilor-pragmatist", "enabled": true}
       ]
     }
   }
   ```

5. **Check network latency**
   ```bash
   ping api.provider.com
   ```

---

### Problem: "High memory usage"

**Symptoms:**
```
System runs out of memory
Computer becomes slow
```

**Solutions:**

1. **Enable economy mode**
   ```bash
   ECONOMY_MODE=true
   ```

2. **Reduce context length**
   ```bash
   MAX_CONTEXT_TURNS=5
   ```

3. **Limit concurrent requests**
   ```bash
   MAX_CONCURRENT_REQUESTS=1
   ```

4. **Use smaller models**
   - 7B models instead of 70B
   - Flash models instead of Pro

---

### Problem: "High API costs"

**Symptoms:**
```
Billing is higher than expected
Quota exceeded quickly
```

**Solutions:**

1. **Enable economy mode**
   ```bash
   ECONOMY_MODE=true
   ```

2. **Use local models**
   ```bash
   # LM Studio or Ollama
   LM_STUDIO_ENDPOINT=http://localhost:1234
   ```

3. **Reduce bot count**
   - Use only 2-3 bots instead of all

4. **Limit sessions**
   - Shorter debates
   - Fewer rounds

5. **Monitor usage**
   - Check provider dashboard
   - Set billing alerts

---

## Integration Issues

### Problem: "Claude Desktop integration not working"

**Symptoms:**
```
Council tools not available in Claude
Tools not showing up
```

**Solutions:**

1. **Verify config path**
   ```bash
   # Check file exists
   ls ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. **Check absolute path**
   ```json
   {
     "mcpServers": {
       "ai-council": {
         "command": "node",
         "args": ["/full/absolute/path/to/dist/index.js"]
       }
     }
   }
   ```

3. **Verify environment variables**
   ```json
   {
     "mcpServers": {
       "ai-council": {
         "command": "node",
         "args": ["..."],
         "env": {
           "GEMINI_API_KEY": "your_key_here"
         }
       }
     }
   }
   ```

4. **Restart Claude Desktop**
   - Quit completely
   - Wait 5 seconds
   - Restart

5. **Check Claude logs**
   - Help → Logs
   - Look for MCP errors

---

### Problem: "Tool not found" error

**Symptoms:**
```
Unknown tool: council_auto
Tool not registered
```

**Solutions:**

1. **Verify build**
   ```bash
   npm run build
   ```

2. **Check index.ts registration**
   ```bash
   grep -n "council_auto" src/index.ts
   ```

3. **Restart server**
   ```bash
   # Stop with Ctrl+C
   start.bat
   ```

---

## Session Issues

### Problem: "Session not found"

**Symptoms:**
```
Session session-xyz not found
Session may have been deleted
```

**Solutions:**

1. **List sessions**
   ```json
   {
     "tool": "council_list_sessions",
     "arguments": {}
   }
   ```

2. **Session expired**
   - Sessions auto-delete after 30 days
   - Enable session persistence

3. **Wrong session ID**
   - Copy ID exactly
   - Check for typos

---

### Problem: "Session won't start"

**Symptoms:**
```
Session created but never begins
Status remains 'idle'
```

**Solutions:**

1. **Check session status**
   ```json
   {
     "tool": "council_get_session",
     "arguments": {
       "sessionId": "session-xyz"
     }
   }
   ```

2. **Verify at least one bot enabled**
   ```json
   {
     "settings": {
       "bots": [
         {"id": "councilor-technocrat", "enabled": true}
       ]
     }
   }
   ```

3. **Check protection limits**
   ```bash
   # Enable protection service in logs
   DEBUG=protection* start.bat
   ```

---

### Problem: "Session stops unexpectedly"

**Symptoms:**
```
Session halts mid-debate
Status changes to 'adjourned' early
```

**Solutions:**

1. **Check protection limits**
   - Max rounds exceeded
   - Max tokens exceeded
   - Recursion limit reached

2. **Check control signals**
   ```json
   {
     "tool": "council_stop_session",
     "arguments": {
       "sessionId": "session-xyz"
     }
   }
   ```

3. **Review session history**
   ```json
   {
     "tool": "council_get_session",
     "arguments": {
       "sessionId": "session-xyz"
     }
   }
   ```

---

## Memory & Knowledge Base Issues

### Problem: "Memories not persisting"

**Symptoms:**
```
Added memory but can't find it
Memory lost after restart
```

**Solutions:**

1. **Enable session persistence**
   - Sessions saved to disk
   - Check data/sessions directory

2. **Verify memory save**
   ```json
   {
     "tool": "council_list_memories",
     "arguments": {}
   }
   ```

3. **Check cleanup settings**
   ```javascript
   // Memories auto-delete after 90 days
   // Check cleanup stats
   getCleanupStats()
   ```

---

### Problem: "Search finds no results"

**Symptoms:**
```
Search returns empty
Can't find relevant memories
```

**Solutions:**

1. **Check search query**
   - Use specific keywords
   - Try different terms

2. **Verify memory exists**
   ```json
   {
     "tool": "council_list_memories",
     "arguments": {}
   }
   ```

3. **Check indexing**
   - Memories indexed by keywords
   - Very short topics may not index well

---

## Error Messages Reference

### "VALIDATION_ERROR"

**Meaning:** Input validation failed

**Solution:**
- Check required fields
- Verify data types
- Check field lengths

---

### "PROTECTION: Call blocked"

**Meaning:** Protection service blocked the call

**Reasons:**
- Max recursion depth exceeded
- Call cooldown active
- Max rounds exceeded
- Infinite loop detected

**Solution:**
- Wait for cooldown
- Reduce complexity
- Restart session

---

### "SESSION_NOT_FOUND"

**Meaning:** Session ID not found

**Solution:**
- Verify session ID
- Check if session expired
- List available sessions

---

### "UNKNOWN_TOOL"

**Meaning:** Tool name not recognized

**Solution:**
- Check tool name spelling
- Verify registration
- Restart server

---

### "ECONOMY_MODE_ENABLED"

**Meaning:** Running in economy mode

**Impact:**
- Faster responses
- Lower costs
- Less thorough debates

**Solution:**
- Disable if needed:
  ```json
  {
    "settings": {
      "economyMode": false
    }
  }
  ```

---

## Getting Help

### 1. Check Documentation

- **Setup Guide**: `SETUP.md`
- **README**: `README.md`
- **Examples**: `examples/TOOL_CALL_EXAMPLES.md`

### 2. Run Diagnostics

```bash
# Check configuration
start.bat -c

# Check system info
start.bat --node-version
start.bat --version

# Enable debug logging
DEBUG=mcp* start.bat -d
```

### 3. Collect Information

Before seeking help, collect:

```bash
# System info
node -v
npm -v
uname -a  # Linux/Mac
systeminfo  # Windows

# Configuration
cat .env  # (remove API keys!)

# Error logs
# Copy relevant error messages
```

### 4. Create Issue on GitHub

**Include:**
- Operating system
- Node.js version
- Error messages (full)
- Steps to reproduce
- Configuration (.env without API keys)

**Template:**
```markdown
**System:**
- OS: [Windows/macOS/Linux]
- Node: v20.x.x

**Issue:**
[Describe problem]

**Steps:**
1. Run `...`
2. See error `...`

**Expected:** ...
**Actual:** ...

**Config:** [Paste .env without API keys]
```

### 5. Community Resources

- GitHub Issues: Report bugs
- GitHub Discussions: Ask questions
- Documentation: Read guides

---

## Quick Reference

### Common Commands

```bash
# Check config
start.bat -c

# Run in dev mode
start.bat -d

# Show help
start.bat -h

# Setup wizard
start.bat --setup

# Start server
start.bat
```

### Quick Fixes

**Restart server:**
```bash
Ctrl+C
start.bat
```

**Clean rebuild:**
```bash
rm -rf dist
npm install
npm run build
```

**Reset config:**
```bash
rm .env
start.bat --setup
```

---

## Summary

This troubleshooting guide covers:
- ✅ 50+ common issues and solutions
- ✅ Step-by-step diagnosis
- ✅ Quick fixes and workarounds
- ✅ Error message reference
- ✅ Getting help section

For issues not covered here, please create a GitHub issue with:
- System details
- Error messages
- Steps to reproduce
- Configuration (without API keys)
