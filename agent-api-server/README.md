# AI Council Chamber - Agent API Server

This directory contains the backend API server that allows AI agents to interact with the AI Council Chamber programmatically.

## Purpose

The AI Council Chamber is a client-side React application. This API server provides REST endpoints that agents can use to:
- Create deliberation sessions
- Submit topics for council review  
- Retrieve results programmatically
- Make direct inquiries to specific councilors

## Setup

### Option 1: Node.js/Express Server

```bash
cd agent-api-server
npm install
node server.js
# or
node server.cjs
```

### Option 2: Python/Flask Server

```bash
cd agent-api-server
pip install flask flask-cors
python api_server.py
```

The server will run on http://localhost:3001

## API Endpoints

### Health Check
```bash
GET http://localhost:3001/health
```

Response:
```json
{
  "status": "ok",
  "service": "ai-council-agent-api",
  "timestamp": "2026-02-06T22:55:00"
}
```

### Create Session
```bash
POST http://localhost:3001/api/session
Content-Type: application/json

{
  "mode": "legislative",
  "topic": "Should we implement feature X?",
  "councilors": ["technocrat", "ethicist", "skeptic"]
}
```

Response:
```json
{
  "sessionId": "uuid-here",
  "mode": "legislative",
  "topic": "Should we implement feature X?",
  "status": "created"
}
```

### Get Session Status
```bash
GET http://localhost:3001/api/session/{sessionId}
```

Response:
```json
{
  "sessionId": "uuid-here",
  "mode": "legislative",
  "topic": "Should we implement feature X?",
  "status": "completed",
  "createdAt": "2026-02-06T22:55:00",
  "messageCount": 5
}
```

### Get Session Messages
```bash
GET http://localhost:3001/api/session/{sessionId}/messages
```

Response:
```json
[
  {
    "author": "High Speaker",
    "role": "speaker",
    "content": "The Council is now in session...",
    "timestamp": "2026-02-06T22:55:01"
  }
]
```

### Direct Inquiry
```bash
POST http://localhost:3001/api/inquire
Content-Type: application/json

{
  "question": "What are the security risks?",
  "councilor": "sentinel"
}
```

Response:
```json
{
  "question": "What are the security risks?",
  "councilor": "sentinel",
  "answer": "The risks include...",
  "timestamp": "2026-02-06T22:55:00"
}
```

## Testing

Test the API:
```bash
# Health check
curl http://localhost:3001/health

# Create session
curl -X POST http://localhost:3001/api/session \
  -H "Content-Type: application/json" \
  -d '{"topic": "Test topic", "mode": "deliberation"}'

# Direct inquiry
curl -X POST http://localhost:3001/api/inquire \
  -H "Content-Type: application/json" \
  -d '{"question": "What do you think?", "councilor": "speaker"}'
```

## Integration with DuckBot

Use the Python client in the repository root:
```python
from ai_council_client import AICouncilClient

client = AICouncilClient("http://localhost:3001")
result = client.quick_deliberate("Should we implement X?")
print(result['content'])
```

## Notes

- The server requires LM Studio to be running on http://localhost:1234 for full functionality
- Session data is stored in-memory (use Redis/database for production)
- The Node.js server (server.js) has full LM Studio integration
- The Python server (api_server.py) is a simpler implementation

## Troubleshooting

**Port already in use:**
```bash
# Use different port
PORT=3002 node server.js
```

**LM Studio not connected:**
- Ensure LM Studio is running: http://localhost:1234
- Check models are loaded in LM Studio UI

**Server won't start:**
- Check port 3001 is not in use: `lsof -i :3001`
- Try the alternative server (Python if Node fails, or vice versa)
