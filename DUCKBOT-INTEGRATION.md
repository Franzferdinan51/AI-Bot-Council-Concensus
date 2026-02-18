# DuckBot + AI Council Integration

## Overview
DuckBot can use the AI Council Chamber for complex decision-making and debates.

## How DuckBot Uses the Council

### 1. Via Python Client
```bash
python tools/ai-council-client.py --mode legislative "Should we attack Iran?"
```

### 2. Via Web UI
- Start: `./start-ai-council.sh`
- Open: http://localhost:3000

### 3. Model Routing
| Task Type | Model |
|-----------|-------|
| Complex reasoning | MiniMax-M2.5 |
| Fast/simple | jan-v3-4b-base-instruct |
| Vision tasks | qwen3-vl-8b-thinking |
| Coding | qwen/qwen3-14b |

## Available Modes
- **Legislative**: Debate + vote on proposals
- **Deep Research**: Multi-vector investigation
- **Swarm Coding**: Software engineering
- **Prediction Market**: Probabilistic forecasting
- **Inquiry**: Q&A

## Configuration
- Endpoint: http://100.74.88.40:1234/v1 (LM Studio)
- MiniMax: https://api.minimax.io/anthropic (for complex)

## Usage
DuckBot can spawn council sessions for:
- Strategic decisions
- Complex research
- Multi-perspective analysis
- Code reviews
