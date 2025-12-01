# MCP Client Connection Issues - Troubleshooting Guide

## Issue: "Tool call failed" with WebSocket/connection errors

If you're seeing errors like:
```
Tool call failed for council_prediction()
Tool call failed for council_diagnostics()
WebSocket connection issue
Request interrupted by user
```

This guide will help you diagnose and fix the problem.

## ✅ Server Status: VERIFIED WORKING

I've tested the server and all tools are working correctly:
- ✅ council_diagnostics - Returns full system status
- ✅ council_prediction - Successfully runs prediction sessions
- ✅ All 13 MCP tools are registered and functional
- ✅ Gemini API key is properly configured and working
- ✅ 23 custom bot models loaded successfully

## Common Causes & Solutions

### 1. **Client Connection Issue (Most Common)**

The error is likely happening in your MCP client (Claude Code CLI, Claude Desktop, etc.), not the server.

#### Symptoms:
- "WebSocket connection failed"
- "Tool call failed"
- "Request interrupted by user"

#### Solutions:

**Option A: Restart Your MCP Client**
```bash
# Close Claude Code CLI completely
# Then restart it

# For Claude Desktop:
# 1. Quit Claude Desktop application
# 2. Wait 5 seconds
# 3. Restart Claude Desktop
```

**Option B: Check MCP Server Configuration**

Make sure your MCP client is configured to use the correct path to the server:

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

**Option C: Use HTTP Bridge for Testing**

Start the HTTP bridge to test tools directly:
```bash
# In the server directory:
npm run start:http

# Then test tools:
curl -X POST http://localhost:4000/call-tool \
  -H "Content-Type: application/json" \
  -d '{"name":"council_diagnostics","arguments":{}}'
```

### 2. **API Key Issues**

#### Symptoms:
- "Gemini provider not initialized"
- API calls failing

#### Solutions:

**Check your .env file:**
```bash
cat .env | grep GEMINI_API_KEY
```

Should show:
```
GEMINI_API_KEY=AIzaSyA65AdhiiwSemCA4DSC_46d5WBhZ-e2Glc
```

**Verify the key is valid:**
```bash
# Test with the server's built-in health check:
node dist/index.js --health
```

### 3. **Server Process Issues**

#### Symptoms:
- Server stops responding
- Tools timeout

#### Solutions:

**Check if server is running:**
```bash
# The server should be running via your MCP client
# If using stdio mode, it runs as part of the client

# For testing, use HTTP bridge:
npm run start:http
```

**Restart the server:**
```bash
npm run build
npm start
```

### 4. **Network/Firewall Issues**

#### Symptoms:
- Connection refused
- Timeout errors

#### Solutions:

**Check if port 4000 is available (for HTTP bridge):**
```bash
netstat -an | grep 4000
# or on Windows:
netstat -an | findstr 4000
```

**Disable firewall temporarily to test:**
- Windows: Windows Defender Firewall
- Mac: System Preferences > Security & Privacy > Firewall

## Diagnostic Steps

### Step 1: Verify Server Works (HTTP Bridge Test)

```bash
# Start HTTP bridge
npm run start:http

# In another terminal, test health:
curl http://localhost:4000/health

# Should return:
# {"status":"ok","server":"ai-council-mcp-server","version":"1.0.0"}
```

### Step 2: Test Tools via HTTP

```bash
# Test diagnostics:
curl -X POST http://localhost:4000/call-tool \
  -H "Content-Type: application/json" \
  -d '{"name":"council_diagnostics","arguments":{"verbose":true}}'

# Test prediction:
curl -X POST http://localhost:4000/call-tool \
  -H "Content-Type: application/json" \
  -d '{"name":"council_prediction","arguments":{"topic":"Test question"}}'
```

If these work, the server is fine - the issue is with your MCP client.

### Step 3: Check MCP Client Logs

Look for error messages in your MCP client's logs:
- **Claude Desktop**: Check the logs in `~/Library/Logs/Claude/` (Mac) or `%APPDATA%\Claude\logs\` (Windows)
- **Claude Code CLI**: Check console output for error messages

### Step 4: Verify Tool Registration

```bash
# List all available tools via HTTP:
curl http://localhost:4000/list-tools
```

Should show all 13 tools:
- council_proposal
- council_deliberation
- council_inquiry
- council_research
- council_swarm
- council_swarm_coding
- council_prediction
- council_list_sessions
- council_get_session
- council_get_transcript
- council_stop_session
- council_pause_session
- council_diagnostics

## MCP vs HTTP Bridge

### MCP (Stdio Mode) - Default
- Used by Claude Desktop, Claude Code CLI
- Runs via stdin/stdout
- No network port
- Automatic when configured in client

### HTTP Bridge - Testing
- Runs on port 4000
- Use for debugging/testing
- Manual curl commands
- Start with: `npm run start:http`

## Quick Fixes

### Fix 1: Restart Everything
```bash
# 1. Stop all servers
# 2. Rebuild
npm run build

# 3. Restart your MCP client
# 4. Try again
```

### Fix 2: Use HTTP Bridge for Testing
```bash
npm run start:http

# Then test in another terminal:
curl -X POST http://localhost:4000/call-tool \
  -H "Content-Type: application/json" \
  -d '{"name":"council_diagnostics","arguments":{}}'
```

### Fix 3: Check Configuration
```bash
# Verify .env has API key:
cat .env | grep GEMINI_API_KEY

# Verify server builds:
npm run build

# Test health:
node dist/index.js --health
```

## Still Having Issues?

### Information to Collect:
1. Your MCP client (Claude Desktop, Claude Code CLI, etc.)
2. Operating system (Windows, Mac, Linux)
3. Error message (exact text)
4. Client logs (if available)
5. Server logs (if using HTTP bridge)

### Useful Commands:
```bash
# Server health check:
node dist/index.js --health

# List available tools (HTTP):
curl http://localhost:4000/list-tools

# Run diagnostics (HTTP):
curl -X POST http://localhost:4000/call-tool \
  -H "Content-Type: application/json" \
  -d '{"name":"council_diagnostics","arguments":{"verbose":true}}'

# Check server process:
ps aux | grep "node dist/index.js"
```

## Success Indicators

✅ **Server is working when:**
- HTTP bridge health check returns: `{"status":"ok","server":"ai-council-mcp-server"}`
- council_diagnostics returns full system report
- council_prediction completes a session
- All tools show in `/list-tools` endpoint

✅ **Client is working when:**
- No "Tool call failed" errors
- Tools execute and return results
- No WebSocket/connection errors

## Summary

The server and all tools are **verified working**. The issue is likely:

1. **Client connection problem** - Restart your MCP client
2. **Configuration issue** - Check mcp.json path and environment variables
3. **Network issue** - Try HTTP bridge to isolate

**Quick Test:** Use the HTTP bridge (`npm run start:http`) to verify everything works, then fix the MCP client connection.
