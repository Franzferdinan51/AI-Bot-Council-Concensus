#!/bin/bash
# AI Council Chamber API Server Startup Script for Linux/Mac
# Usage: ./start-server.sh [port] [lm-host] [lm-port]

# Default values
PORT=${1:-3001}
LM_HOST=${2:-localhost}
LM_PORT=${3:-1234}

echo ""
echo "==========================================="
echo "  AI Council Chamber - API Server"
echo "==========================================="
echo ""
echo "Configuration:"
echo "  Server Port: $PORT"
echo "  LM Studio:   $LM_HOST:$LM_PORT"
echo ""
echo "Starting server..."
echo ""

export PORT=$PORT
export LM_STUDIO_HOST=$LM_HOST
export LM_STUDIO_PORT=$LM_PORT

node server.js

if [ $? -ne 0 ]; then
    echo ""
    echo "[ERROR] Server failed to start"
    exit 1
fi
