#!/bin/bash
# AI Council Chamber - Auto-start script
# Start both API server and Web UI

echo "🏛️ Starting AI Council Chamber..."

# Kill any existing instances
pkill -f "vite.*3003" 2>/dev/null
pkill -f "node.*server-bailian" 2>/dev/null
sleep 1

# Start API Server (port 3001)
echo "1. Starting Bailian API Server on port 3001..."
cd "$(dirname "$0")/agent-api-server"
nohup node server-bailian.js > /tmp/ai-council-api.log 2>&1 &
sleep 2

# Verify API server
if curl -s http://localhost:3001/health >/dev/null 2>&1; then
    echo "   ✅ API Server running"
else
    echo "   ❌ API Server failed to start"
    exit 1
fi

# Start Web UI (port 3003)
echo "2. Starting Web UI on port 3003..."
cd "$(dirname "$0")"
nohup npm run dev > /tmp/ai-council-webui.log 2>&1 &
sleep 5

# Verify Web UI
if curl -s http://localhost:3003/ >/dev/null 2>&1; then
    echo "   ✅ Web UI running"
else
    echo "   ⏳ Web UI still starting..."
fi

echo ""
echo "✅ AI Council Chamber started!"
echo ""
echo "Services:"
echo "  Web UI: http://localhost:3003/"
echo "  API Server: http://localhost:3001/"
echo "  MCP Endpoint: http://localhost:3001/mcp"
echo ""
echo "Logs:"
echo "  API: /tmp/ai-council-api.log"
echo "  WebUI: /tmp/ai-council-webui.log"
