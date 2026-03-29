#!/bin/bash
# Start AI Council Deliberation Server on port 3003

cd /Users/duckets/.openclaw/workspace/ai-council-webui-new

# Kill any existing server on port 3003
lsof -ti :3003 | xargs kill -9 2>/dev/null || true

# Start the server
echo "🏛️  Starting AI Council Deliberation Server on port 3003..."
node server.js &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"
echo $SERVER_PID > /tmp/ai-council-deliberation.pid

# Wait a moment and check if it started
sleep 2
if curl -s http://localhost:3003/health > /dev/null 2>&1; then
    echo "✅ Server running on http://localhost:3003"
else
    echo "❌ Server failed to start"
fi
