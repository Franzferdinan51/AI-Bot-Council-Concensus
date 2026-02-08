# AI Council Chamber - Agent API Server

Cross-platform REST API for AI Council Chamber using LM Studio local models.

## Requirements

- Node.js 18+ (Windows or Linux)
- LM Studio running with API server enabled
- npm or yarn

## Installation

```bash
cd agent-api-server
npm install
```

## Configuration

Set environment variables (optional - defaults shown):

```bash
# Linux/Mac
export PORT=3001
export LM_STUDIO_HOST=localhost
export LM_STUDIO_PORT=1234

# Windows PowerShell
$env:PORT=3001
$env:LM_STUDIO_HOST="localhost"
$env:LM_STUDIO_PORT=1234

# Windows CMD
set PORT=3001
set LM_STUDIO_HOST=localhost
set LM_STUDIO_PORT=1234
```

## Running the Server

### Windows
```powershell
node server.js
```

### Linux/Mac
```bash
node server.js
# or
chmod +x server.js
./server.js
```

## Testing

Once running, test with:

```bash
# Health check
curl http://localhost:3001/health

# Test LM Studio connection
curl http://localhost:3001/test-lm

# Direct inquiry
curl -X POST http://localhost:3001/api/inquire \
  -H "Content-Type: application/json" \
  -d '{"question":"What is your purpose?","councilor":"speaker"}'

# Create deliberation session
curl -X POST http://localhost:3001/api/session \
  -H "Content-Type: application/json" \
  -d '{"topic":"Should we use local AI models?","mode":"legislative"}'
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server health check |
| `/test-lm` | GET | Test LM Studio connectivity |
| `/api/inquire` | POST | Ask a single councilor |
| `/api/session` | POST | Create new deliberation |
| `/api/session/:id` | GET | Get session status |
| `/api/session/:id/messages` | GET | Get deliberation messages |
| `/api/sessions` | GET | List all sessions |

## Troubleshooting

### Connection refused to LM Studio
- Verify LM Studio is running
- Check API server is enabled in LM Studio settings
- Verify `LM_STUDIO_HOST` and `LM_STUDIO_PORT` match LM Studio's settings

### Port already in use
- Change `PORT` environment variable
- Or kill process using port 3001

### Windows Defender/Firewall
- Allow Node.js through Windows Defender
- Or run in WSL2 for Linux environment
