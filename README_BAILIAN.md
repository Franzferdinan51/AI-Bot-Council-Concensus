# AI Bot Council Consensus - Bailian Configuration (Legacy)

**Configured for:** Historical Bailian-only setup. Current active setup uses MiniMax M2.7 + LM Studio + local Qwen3.5.
**Date:** March 22, 2026

## Model Configuration

All councilors use **Alibaba Bailian** models:

| Role | Model | Provider | Context | Cost |
|------|-------|----------|---------|------|
| Speaker | `qwen3.5-plus` | Bailian | 1M | 18K/mo quota |
| Research | `MiniMax-M2.5` | Bailian | 196k | ✅ FREE |
| Vision | `kimi-k2.5` | Bailian | 196k | ✅ FREE |
| Fast | `glm-5` | Bailian | 128k | API credits |
| Coding | `qwen3-coder-plus` | Bailian | 128k | Quota |
| Backup | `glm-4.7` | Bailian | 196k | API credits |

## Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` and add your Bailian API key:
```bash
BAILIAN_API_KEY=your-actual-key-here
```

3. Install dependencies:
```bash
npm install
```

4. Start the server:
```bash
npm run dev
```

5. Open http://localhost:3003/

## Councilor Model Mapping

- **Speaker, Sentinel, Skeptic, Visionary**: `bailian/qwen3.5-plus`
- **Moderator, Technocrat, Ethicist, Pragmatist, Historian, Diplomat, Journalist, Psychologist**: `bailian/MiniMax-M2.5` (FREE)
- **Conspiracist, Propagmatist**: `bailian/glm-5`
- **Coder**: `bailian/qwen3-coder-plus`

## Cost Optimization

- 10/15 councilors use FREE `MiniMax-M2.5`
- 4/15 use quota-based `qwen3.5-plus`
- 2/15 use API credit `glm-5`
- ZERO ChatGPT/OpenAI costs

## Security

- `.env` file is gitignored (never commit API keys!)
- Use `.env.example` as template
- Bailian API key stored in environment only
