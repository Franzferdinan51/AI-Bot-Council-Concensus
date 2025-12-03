# Gemini API Endpoint Configuration

## Quick Answer

**Google Gemini does NOT require a custom endpoint configuration.**

Unlike local AI providers (LM Studio, Ollama) that run on your machine and need localhost endpoints, Gemini is a cloud service that's pre-configured with Google's endpoint.

## What You Need to Do

Just add your API key:

```bash
GEMINI_API_KEY=your_api_key_here
```

That's it! No endpoint URL needed.

## Why No Endpoint Needed?

### Gemini (Cloud Provider)
- Uses Google's built-in endpoint: `https://generativelanguage.googleapis.com`
- Endpoint is hardcoded in the server software
- Just needs your API key for authentication
- No configuration needed

### Local Providers (Need Endpoints)
- **LM Studio**: Runs on your computer at `http://localhost:1234`
- **Ollama**: Runs on your computer at `http://localhost:11434`
- **Jan.ai**: Runs on your computer at `http://localhost:1337`

These local providers require you to specify their endpoint because:
1. They're running on your local machine
2. You can change the port they use
3. They're not default cloud services

## Comparison

| Provider | Type | Endpoint Needed? | What to Configure |
|----------|------|------------------|-------------------|
| Gemini | Cloud (Google) | ❌ No | Just API key |
| OpenAI | Cloud (OpenAI) | ❌ No | Just API key |
| Anthropic | Cloud (Anthropic) | ❌ No | Just API key |
| OpenRouter | Cloud (Aggregator) | ❌ No | Just API key |
| LM Studio | Local | ✅ Yes | Endpoint URL |
| Ollama | Local | ✅ Yes | Endpoint URL |
| Jan.ai | Local | ✅ Yes | Endpoint URL |

## Configuration Files

In `.env.example`, you'll see:

```bash
# Google Gemini (Recommended - Free tier available)
# Get your API key: https://aistudio.google.com/app/apikey
# Models: gemini-2.5-flash, gemini-1.5-pro, gemini-2.5-flash-8b
# Note: Gemini uses Google's built-in endpoint - NO CUSTOM ENDPOINT NEEDED
# Gemini is pre-configured with Google's endpoint, just add your API key
GEMINI_API_KEY=
# GEMINI_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models  # Usually not needed
```

The endpoint line is commented out because you don't need it!

## How the Server Uses Gemini

The server has this endpoint hardcoded:

```typescript
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta';
```

When you call a council session with a Gemini model, the server:
1. Uses the hardcoded endpoint
2. Adds your API key to the request headers
3. Sends the request to Google's servers
4. Returns the response

## Getting Your Gemini API Key

1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key
5. Add it to your `.env` file: `GEMINI_API_KEY=your_key_here`

## Troubleshooting

**Q: I get "Gemini provider not initialized" error**
A: Make sure you set `GEMINI_API_KEY` in your `.env` file

**Q: Can I use a custom Gemini endpoint?**
A: No, Google's Generative Language API only has one endpoint

**Q: Does this work with Google AI Studio?**
A: Yes, the API key from Google AI Studio works with this endpoint

**Q: Is Gemini free?**
A: Gemini has a generous free tier. Check https://ai.google.dev/pricing for current limits

## Summary

- ✅ Add `GEMINI_API_KEY=your_key`
- ❌ Don't add `GEMINI_ENDPOINT`
- The server handles the endpoint automatically
- This is different from local providers that need endpoints
