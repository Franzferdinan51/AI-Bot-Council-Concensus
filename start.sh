#!/bin/bash
cd ~/.openclaw/workspace/ai-council-chamber

# Kill existing
lsof -ti :3001 | xargs -r kill -9 2>/dev/null
sleep 1

# Start fresh
nohup node api-server.cjs > /tmp/council.log 2>&1 &
sleep 2

# Verify
if curl -s --max-time 3 http://localhost:3001/api/health > /dev/null; then
  echo "✅ AI Council running on port 3001 (PID: $(pgrep -f 'api-server.cjs'))"
else
  echo "❌ Failed to start"
fi
