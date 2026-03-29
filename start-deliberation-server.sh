#!/bin/bash
# Start AI Council Deliberation Server on port 3005

cd /Users/duckets/.openclaw/workspace/ai-council-webui-new

# Kill any existing deliberation server
pkill -f "ai-council-webui-new.*server.mjs" 2>/dev/null || true
sleep 1

# Start the server
echo "🏛️  Starting AI Council Deliberation Server on port 3005..."
nohup node server.mjs > /tmp/delib-3005.log 2>&1 &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

# Wait and verify
sleep 2
if curl -s http://localhost:3005/health > /dev/null 2>&1; then
    echo "✅ Deliberation Server running on http://localhost:3005"
else
    echo "❌ Server failed to start. Check /tmp/delib-3005.log"
fi
