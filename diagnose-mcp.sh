#!/bin/bash
# MCP Server Diagnostic Script
# This script helps diagnose MCP client connection issues

echo "========================================="
echo "  AI Council MCP Server Diagnostics"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo "1. Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "   ${GREEN}✓${NC} Node.js installed: $NODE_VERSION"
else
    echo -e "   ${RED}✗${NC} Node.js not found"
    exit 1
fi

# Check if .env exists
echo ""
echo "2. Checking configuration..."
if [ -f ".env" ]; then
    echo -e "   ${GREEN}✓${NC} .env file exists"

    # Check API key
    if grep -q "GEMINI_API_KEY=" .env && ! grep -q "GEMINI_API_KEY=$" .env; then
        echo -e "   ${GREEN}✓${NC} Gemini API key configured"
    else
        echo -e "   ${YELLOW}!${NC} Gemini API key not set"
    fi
else
    echo -e "   ${YELLOW}!${NC} .env file not found"
fi

# Check if server is built
echo ""
echo "3. Checking server build..."
if [ -f "dist/index.js" ]; then
    echo -e "   ${GREEN}✓${NC} Server built (dist/index.js exists)"
else
    echo -e "   ${RED}✗${NC} Server not built. Run: npm run build"
    exit 1
fi

# Test health endpoint
echo ""
echo "4. Testing server health..."
node dist/index.js --health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "   ${GREEN}✓${NC} Server health check passed"
else
    echo -e "   ${RED}✗${NC} Server health check failed"
fi

# Check HTTP bridge
echo ""
echo "5. Testing HTTP bridge..."
HTTP_PORT=${HTTP_PORT:-4000}

# Check if port is in use
if lsof -Pi :$HTTP_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "   ${GREEN}✓${NC} HTTP bridge is running on port $HTTP_PORT"

    # Test health endpoint
    HEALTH=$(curl -s http://localhost:$HTTP_PORT/health 2>/dev/null)
    if [[ $HEALTH == *"ok"* ]]; then
        echo -e "   ${GREEN}✓${NC} HTTP bridge responding"
    else
        echo -e "   ${YELLOW}!${NC} HTTP bridge not responding properly"
    fi

    # Test tools
    echo ""
    echo "6. Testing tools via HTTP bridge..."

    # Test diagnostics
    DIAG=$(curl -s -X POST http://localhost:$HTTP_PORT/call-tool \
        -H "Content-Type: application/json" \
        -d '{"name":"council_diagnostics","arguments":{"verbose":false}}' 2>/dev/null)

    if [[ $DIAG == *"AI COUNCIL MCP"* ]]; then
        echo -e "   ${GREEN}✓${NC} council_diagnostics working"
    else
        echo -e "   ${RED}✗${NC} council_diagnostics failed"
    fi

else
    echo -e "   ${YELLOW}!${NC} HTTP bridge not running"
    echo "      Start it with: npm run start:http"
fi

# Summary
echo ""
echo "========================================="
echo "  Summary"
echo "========================================="
echo ""
echo "Server Status: $([ -f "dist/index.js" ] && echo -e "${GREEN}Ready${NC}" || echo -e "${RED}Not Built${NC}")"
echo "Configuration: $([ -f ".env" ] && echo -e "${GREEN}Present${NC}" || echo -e "${YELLOW}Missing${NC}")"
echo "HTTP Bridge: $(lsof -Pi :$HTTP_PORT -sTCP:LISTEN -t >/dev/null 2>&1 && echo -e "${GREEN}Running${NC}" || echo -e "${YELLOW}Not Running${NC}")"
echo ""

# Recommendations
echo "========================================="
echo "  Recommendations"
echo "========================================="
echo ""

if [ ! -f ".env" ]; then
    echo "• Configure API keys: cp .env.example .env"
    echo "• Edit .env and add your GEMINI_API_KEY"
    echo ""
fi

if [ ! -f "dist/index.js" ]; then
    echo "• Build the server: npm run build"
    echo ""
fi

if ! lsof -Pi :$HTTP_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "• Test with HTTP bridge: npm run start:http"
    echo "• Then test: curl http://localhost:$HTTP_PORT/health"
    echo ""
fi

echo "• If MCP client tools are failing, restart your MCP client (Claude Desktop, etc.)"
echo "• See TROUBLESHOOTING_MCP_CLIENT.md for detailed help"
echo ""

# Show available tools via HTTP if bridge is running
if lsof -Pi :$HTTP_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "========================================="
    echo "  Available Tools (via HTTP)"
    echo "========================================="
    curl -s http://localhost:$HTTP_PORT/list-tools | jq -r '.tools[].name' 2>/dev/null || \
        curl -s http://localhost:$HTTP_PORT/list-tools | grep -o '"name":"[^"]*"' | cut -d'"' -f4
    echo ""
fi
