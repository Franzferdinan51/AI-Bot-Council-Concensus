# 🏛️ AI Council Chamber Integration Plan

## Overview
Integration of the AI Council Chamber (Multi-Agent Deliberation Engine) with DuckBot's local model infrastructure.

## Configuration Details

### LM Studio Provider
- **Endpoint:** `http://100.74.88.40:1234/v1/chat/completions`
- **Authentication:** None required (local/Tailscale)

### Council Model Mapping
| Role Group | Models Used | Reasoning |
|---|---|---|
| **High Reasoning** (Speaker, Sentinel, Specialist Science/Military/Legal/Medical) | `jan-v2-vl-max_moe` | Best logic and complex analysis |
| **Deep Research** (Ethicist, Visionary, Skeptic, Historian, Psychologist) | `qwen3-next-80b-a3b-thinking` | Best for broad knowledge and deep thinking |
| **Efficient/Fast** (Moderator, Pragmatist, Diplomat, Journalist, Propagandist) | `gpt-oss-20b` | Balance of speed and quality |
| **Ultra-Fast** (Conspiracist, Libertarian, Progressive, Conservative, Independent) | `jan-v3-4b-base-instruct` | Fastest response for simpler perspectives |
| **Specialized Coding** (Specialist Coder) | `qwen3-coder-next` | Optimized for software development |

## Implementation Progress

- [x] **Clone Repository:** Done
- [x] **Update Models:** All councilors mapped to LM Studio models in `constants.ts`
- [x] **Enable Council:** All 24 councilors enabled in `constants.ts`
- [x] **Install Dependencies:** `npm install --legacy-peer-deps` completed
- [x] **OpenClaw Copy:** Created `/home/duckets/.openclaw/workspace/AI-Bot-Council-OpenClaw/`
- [x] **Launch Script:** Created `start-ai-council.sh`
- [x] **LM Studio Test:** Verified endpoint accessible (HTTP 200)
- [x] **Integration Skill:** Created `skills/ai-council-chamber/SKILL.md` (9KB comprehensive guide)
- [x] **Python Client:** Created `tools/ai-council-client.py` (programmatic API access)
- [ ] **Functional Test:** Awaiting user to run and verify

## Maintenance Tasks
- Regularly check LM Studio model availability at `100.74.88.40`.
- Update `constants.ts` if new models are added to the local server.
- Monitor `npm` dependencies for React 19 compatibility fixes in `recharts`.

## Usage Instructions
1. Run `./start-ai-council.sh`
2. Open Browser to `http://localhost:5173`
3. Configure API keys in Settings if using Gemini/OpenRouter fallbacks (optional).
4. Initiate sessions for complex decision-making.
