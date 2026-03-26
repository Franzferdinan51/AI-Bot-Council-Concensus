# AI Provider Configuration Guide

**Support for multiple AI providers - use what works best for you!**

---

## 🎯 Supported Providers

### Primary Providers
- ✅ **MiniMax M2.7** (Default)
- ✅ **LM Studio** (Local, Free)
- ✅ **OpenAI** (GPT-4, GPT-3.5)
- ✅ **Anthropic** (Claude 3, Claude 2)
- ✅ **Google** (Gemini Pro, Gemini Ultra)

### Additional Providers
- ✅ **Ollama** (Local, Open Source Models)
- ✅ **Together AI** (Cloud, Various Models)
- ✅ **Anyscale** (Cloud, Open Source Models)
- ✅ **Groq** (Cloud, Fast Inference)
- ✅ **DeepSeek** (Cloud, DeepSeek Models)
- ✅ **Moonshot** (Cloud, Kimi Models)

### Coming Soon
- 🔄 **Azure OpenAI**
- 🔄 **AWS Bedrock**
- 🔄 **Cohere**
- 🔄 **Mistral AI**
- 🔄 **Perplexity**

---

## ⚙️ Provider Configuration

### MiniMax M2.7 (Default)

**Best For:** Production use, best performance, comprehensive model selection

**Setup:**
```bash
# .env configuration
MINIMAX_API_KEY=your-minimax-api-key
MINIMAX_ENDPOINT=https://api.minimax.io/v1

# Model configuration
SPEAKER_MODEL=MiniMax-M2.7
RESEARCH_MODEL=MiniMax-M2.7
VISION_MODEL=qwen/qwen3.5-9b
FAST_MODEL=jan-v3-4b-base-instruct
```

**Available Models:**
- MiniMax-M2.7 - Best for complex reasoning and agentic tasks
- qwen/qwen3.5-9b - Local vision-capable fallback
- MiniMax-M2.7 - Primary reasoning and coding model
- jan-v3-4b-base-instruct - Fast local text fallback
- qwen/qwen3.5-9b - Local vision and fallback

**Cost:**
- Free / local: qwen/qwen3.5-9b, LM Studio models
- Paid: MiniMax M2.7 API usage if configured

---

### LM Studio (Local Fallback)

**Best For:** Privacy, offline use, free inference, custom models

**Setup:**
```bash
# .env configuration
LM_STUDIO_ENDPOINT=http://localhost:1234/v1
LM_STUDIO_API_KEY=lm-studio (not required, but can be set)

# Model configuration
SPEAKER_MODEL=qwen/qwen3.5-9b
RESEARCH_MODEL=qwen/qwen3.5-9b
VISION_MODEL=qwen/qwen3.5-9b
FAST_MODEL=qwen/qwen3.5-9b
```

**Available Models:**
- qwen/qwen3.5-9b - Local fallback model
- qwen3.5-27b - Larger local fallback option
- qwen3.5-9b - Vision-capable local model
- qwen3.5-4b / qwen3.5-2b - Fast local options
- Any model you can run locally!

**Cost:** FREE (your hardware)

**Installation:**
1. Download LM Studio from https://lmstudio.ai/
2. Install and launch
3. Download models from Hugging Face
4. Start local server (default: http://localhost:1234)
5. Configure in .env

---

### OpenAI

**Best For:** GPT-4 quality, reliable, well-documented

**Setup:**
```bash
# .env configuration
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_ENDPOINT=https://api.openai.com/v1

# Model configuration
SPEAKER_MODEL=openai/gpt-4-turbo
RESEARCH_MODEL=openai/gpt-4-turbo
VISION_MODEL=openai/gpt-4-vision
FAST_MODEL=openai/gpt-3.5-turbo
```

**Available Models:**
- gpt-4-turbo - Best reasoning
- gpt-4-vision - Vision capabilities
- gpt-3.5-turbo - Fast, cheap
- gpt-4o - Latest multimodal

**Cost:**
- GPT-4 Turbo: ~$0.01-0.03 per 1K tokens
- GPT-3.5 Turbo: ~$0.0005-0.0015 per 1K tokens

---

### Anthropic (Claude)

**Best For:** Long context, nuanced responses, safety

**Setup:**
```bash
# .env configuration
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
ANTHROPIC_ENDPOINT=https://api.anthropic.com/v1

# Model configuration
SPEAKER_MODEL=anthropic/claude-3-opus
RESEARCH_MODEL=anthropic/claude-3-sonnet
VISION_MODEL=anthropic/claude-3-opus
FAST_MODEL=anthropic/claude-3-haiku
```

**Available Models:**
- claude-3-opus - Most powerful
- claude-3-sonnet - Balanced
- claude-3-haiku - Fast, cheap
- claude-2.1 - Previous generation

**Cost:**
- Claude 3 Opus: ~$0.015-0.075 per 1K tokens
- Claude 3 Sonnet: ~$0.003-0.015 per 1K tokens
- Claude 3 Haiku: ~$0.00025-0.00125 per 1K tokens

---

### Google (Gemini)

**Best For:** Multimodal, Google integration, competitive pricing

**Setup:**
```bash
# .env configuration
GOOGLE_API_KEY=your-google-api-key
GOOGLE_ENDPOINT=https://generativelanguage.googleapis.com/v1

# Model configuration
SPEAKER_MODEL=google/gemini-pro
RESEARCH_MODEL=google/gemini-pro
VISION_MODEL=google/gemini-pro-vision
FAST_MODEL=google/gemini-flash
```

**Available Models:**
- gemini-pro - Best reasoning
- gemini-pro-vision - Vision capabilities
- gemini-flash - Fast, cheap
- gemini-ultra - Most powerful (limited access)

**Cost:**
- Gemini Pro: ~$0.00025-0.0005 per 1K tokens
- Gemini Flash: ~$0.000075-0.0003 per 1K tokens

---

### Ollama (Local)

**Best For:** Open source models, local inference, privacy

**Setup:**
```bash
# .env configuration
OLLAMA_ENDPOINT=http://localhost:11434/api
OLLAMA_API_KEY=ollama (not required)

# Model configuration
SPEAKER_MODEL=ollama/llama3:70b
RESEARCH_MODEL=ollama/mixtral:8x22b
VISION_MODEL=ollama/llava:34b
FAST_MODEL=ollama/phi3:mini
```

**Available Models:**
- llama3:70b - Meta's latest
- mixtral:8x22b - MoE architecture
- llava:34b - Vision capabilities
- phi3:mini - Fast, lightweight
- Any Ollama model!

**Cost:** FREE (your hardware)

**Installation:**
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull models
ollama pull llama3:70b
ollama pull mixtral:8x22b
ollama pull llava:34b

# Start server
ollama serve
```

---

### Together AI

**Best For:** Cloud open source models, scalable

**Setup:**
```bash
# .env configuration
TOGETHER_API_KEY=your-together-api-key
TOGETHER_ENDPOINT=https://api.together.xyz/v1

# Model configuration
SPEAKER_MODEL=together/meta-llama/Llama-3-70b
RESEARCH_MODEL=together/mistralai/Mixtral-8x22B
VISION_MODEL=together/meta-llama/Llama-3-70b
FAST_MODEL=together/microsoft/phi-3-mini
```

**Available Models:**
- Llama 3 70B - Meta's latest
- Mixtral 8x22B - MoE architecture
- Phi-3 Mini - Fast, lightweight
- Many more open source models

**Cost:**
- Llama 3 70B: ~$0.0009 per 1K tokens
- Mixtral 8x22B: ~$0.0012 per 1K tokens

---

### Anyscale

**Best For:** Enterprise open source, reliable

**Setup:**
```bash
# .env configuration
ANYSCALE_API_KEY=your-anyscale-api-key
ANYSCALE_ENDPOINT=https://api.endpoints.anyscale.com/v1

# Model configuration
SPEAKER_MODEL=anyscale/meta-llama/Llama-3-70b
RESEARCH_MODEL=anyscale/mistralai/Mixtral-8x22B
FAST_MODEL=anyscale/microsoft/phi-3-mini
```

**Cost:**
- Llama 3 70B: ~$0.001 per 1K tokens
- Mixtral 8x22B: ~$0.0015 per 1K tokens

---

### Groq

**Best For:** Fastest inference, low latency

**Setup:**
```bash
# .env configuration
GROQ_API_KEY=your-groq-api-key
GROQ_ENDPOINT=https://api.groq.com/openai/v1

# Model configuration
SPEAKER_MODEL=groq/llama3-70b-8192
RESEARCH_MODEL=groq/mixtral-8x7b-32768
FAST_MODEL=groq/gemma-7b-it
```

**Available Models:**
- llama3-70b-8192 - 70B params, 8K context
- mixtral-8x7b-32768 - MoE, 32K context
- gemma-7b-it - Fast inference

**Cost:**
- Llama 3 70B: ~$0.00059 per 1K tokens
- Mixtral 8x7B: ~$0.00024 per 1K tokens
- Gemma 7B: ~$0.00007 per 1K tokens

---

### DeepSeek

**Best For:** Cost-effective, good performance

**Setup:**
```bash
# .env configuration
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_ENDPOINT=https://api.deepseek.com/v1

# Model configuration
SPEAKER_MODEL=deepseek/deepseek-chat
RESEARCH_MODEL=deepseek/deepseek-chat
FAST_MODEL=deepseek/deepseek-coder
```

**Cost:**
- DeepSeek Chat: ~$0.00014-0.00028 per 1K tokens
- DeepSeek Coder: ~$0.00014-0.00028 per 1K tokens

---

### Moonshot (Kimi)

**Best For:** Long context, Chinese/English bilingual

**Setup:**
```bash
# .env configuration
MOONSHOT_API_KEY=your-moonshot-api-key
MOONSHOT_ENDPOINT=https://api.moonshot.cn/v1

# Model configuration
SPEAKER_MODEL=moonshot/moonshot-v1-128k
RESEARCH_MODEL=moonshot/moonshot-v1-32k
FAST_MODEL=moonshot/moonshot-v1-8k
```

**Cost:**
- Moonshot v1 128K: ~$0.0012-0.0024 per 1K tokens
- Moonshot v1 32K: ~$0.0006-0.0012 per 1K tokens

---

## 🔀 Multi-Provider Setup

### Failover Configuration

Use multiple providers for reliability:

```bash
# .env configuration
PRIMARY_PROVIDER=lmstudio
FALLBACK_PROVIDER_1=lmstudio
FALLBACK_PROVIDER_2=openai

# Automatic failover enabled
ENABLE_FAILOVER=true
FAILOVER_TIMEOUT=30 # seconds
```

### Load Balancing

Distribute requests across providers:

```bash
# .env configuration
LOAD_BALANCING=round-robin # or weighted, least-latency
PROVIDER_WEIGHTS=lmstudio:0.6,openai:0.2,ollama:0.2
```

### Cost Optimization

Route based on cost/complexity:

```bash
# .env configuration
COST_OPTIMIZATION=true
SIMPLE_QUERIES_PROVIDER=lmstudio # Free
COMPLEX_QUERIES_PROVIDER=lmstudio # Best quality
```

---

## 🎛️ Provider Selection

### By Use Case

**Production/Enterprise:**
- Primary: MiniMax M2.7
- Fallback: OpenAI or Anthropic

**Privacy-Focused:**
- Primary: LM Studio or Ollama (local)
- Fallback: None (stay local)

**Cost-Effective:**
- Primary: LM Studio or Ollama (free)
- Fallback: Groq or DeepSeek (cheap)

**Best Quality:**
- Primary: MiniMax M2.7
- Fallback: OpenAI (GPT-4) or Anthropic (Claude 3 Opus)

**Fastest:**
- Primary: Groq
- Fallback: LM Studio (local)

**Long Context:**
- Primary: Moonshot (128K)
- Fallback: Anthropic Claude 3 (200K)

---

## 💰 Cost Comparison

### Per 1K Tokens (Input/Output)

| Provider | Model | Input | Output | Best For |
|----------|-------|-------|--------|----------|
| **LM Studio** | Local | FREE | FREE | Privacy, free |
| **Ollama** | Local | FREE | FREE | Open source |
| **Groq** | Gemma 7B | $0.00007 | $0.00007 | Speed |
| **DeepSeek** | Chat | $0.00014 | $0.00028 | Cost-effective |
| **Google** | Gemini Flash | $0.000075 | $0.0003 | Multimodal |
| **Moonshot** | 8K | $0.0006 | $0.0012 | Long context |
| **MiniMax** | M2.7 | API | varies | Best overall |
| **MiniMax** | M2.7-highspeed | API | varies | Fast coding |
| **Anthropic** | Haiku | $0.00025 | $0.00125 | Fast Claude |
| **OpenAI** | GPT-3.5 | $0.0005 | $0.0015 | Reliable |
| **Anthropic** | Sonnet | $0.003 | $0.015 | Balanced |
| **OpenAI** | GPT-4 | $0.01 | $0.03 | Quality |
| **Anthropic** | Opus | $0.015 | $0.075 | Best Claude |
| **MiniMax** | M2.7 | API | varies | Best overall |

---

## 🔧 Switching Providers

### Quick Switch

```bash
# Use LM Studio
council config set provider lmstudio

# Use OpenAI
council config set provider openai

# Use MiniMax M2.7 (default)
council config set provider minimax
```

### Per-Session

```bash
# Use specific provider for this deliberation
council deliberate "topic" --provider lmstudio

# Use specific model
council deliberate "topic" --model lmstudio/qwen3.5-35b
```

### Permanent Switch

Edit `.env`:
```bash
# Change default provider
DEFAULT_PROVIDER=lmstudio

# Update model configuration
SPEAKER_MODEL=qwen/qwen3.5-9b
RESEARCH_MODEL=qwen/qwen3.5-9b
```

---

## 📊 Provider Performance

### Latency (Average Response Time)

| Provider | Avg Latency | Best Case |
|----------|-------------|-----------|
| Groq | 50-100ms | 30ms |
| LM Studio (local) | 100-500ms | 50ms |
| Ollama (local) | 200-800ms | 100ms |
| DeepSeek | 500-1000ms | 300ms |
| MiniMax | 300-1200ms | 300ms |
| Google | 500-1500ms | 400ms |
| OpenAI | 1000-2000ms | 500ms |
| Anthropic | 1000-2500ms | 600ms |

### Quality (MMLU Score)

| Provider | Model | MMLU Score |
|----------|-------|------------|
| MiniMax | M2.7 | n/a |
| OpenAI | GPT-4 | 86.4% |
| Anthropic | Claude 3 Opus | 86.8% |
| MiniMax | M2.7-highspeed | n/a |
| Google | Gemini Pro | 83.7% |
| LM Studio | qwen3.5-35b | 82.1% |

---

## 🛡️ Security & Privacy

### Local Providers (Most Private)
- ✅ LM Studio
- ✅ Ollama
- ✅ Your data never leaves your machine

### Cloud Providers (Review Privacy Policies)
- 🔒 MiniMax M2.7 - Enterprise privacy
- 🔒 OpenAI - Enterprise available
- 🔒 Anthropic - Strong privacy focus
- 🔒 Google - Standard Google privacy
- 🔒 Others - Review individual policies

### Recommendations

**For Sensitive Data:**
- Use LM Studio or Ollama (local)
- Enable encryption at rest
- Don't log sensitive deliberations

**For Production:**
- Use enterprise providers (MiniMax, OpenAI Enterprise)
- Enable audit logging
- Use private endpoints

---

## 📝 Best Practices

### Do's:
- ✅ Start with LM Studio for development (free)
- ✅ Use MiniMax or OpenAI for production
- ✅ Configure failover for reliability
- ✅ Monitor costs and usage
- ✅ Review provider privacy policies
- ✅ Use local providers for sensitive data

### Don'ts:
- ❌ Don't commit API keys to git
- ❌ Don't use production keys in development
- ❌ Don't ignore rate limits
- ❌ Don't skip error handling
- ❌ Don't use unencrypted connections

---

## 🔍 Troubleshooting

### Provider Not Working

**Check:**
1. API key is correct
2. Endpoint URL is correct
3. Network connectivity
4. Provider status page

**Commands:**
```bash
# Test provider
council provider test lmstudio

# Check logs
council logs --provider lmstudio

# Verify configuration
council config show
```

### High Latency

**Solutions:**
1. Switch to faster provider (Groq)
2. Use local provider (LM Studio, Ollama)
3. Reduce model size
4. Enable caching

### High Costs

**Solutions:**
1. Use free providers (LM Studio, Ollama)
2. Enable cost optimization
3. Use smaller models for simple queries
4. Set up usage alerts

---

**Choose the provider that best fits your needs - the AI Council works with all major providers!** 🏛️🤖
