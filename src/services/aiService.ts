import { GoogleGenerativeAI } from '@google/generative-ai';
import { BotConfig, AuthorType, Message, ProviderSettings } from '../types/index.js';

export interface StreamingCallback {
  (chunk: string): void;
}

export class AIService {
  private providers: Map<AuthorType, any> = new Map();
  private settings: ProviderSettings;

  constructor(settings: ProviderSettings) {
    this.settings = settings;
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize Gemini
    if (this.settings.geminiApiKey) {
      this.providers.set(AuthorType.GEMINI, new GoogleGenerativeAI(this.settings.geminiApiKey));
    }

    // Other providers will be initialized on-demand
  }

  async getBotResponse(
    bot: BotConfig,
    history: Message[],
    systemPrompt: string,
    overrideSettings?: Partial<ProviderSettings>
  ): Promise<string> {
    const providerSettings = { ...this.settings, ...overrideSettings };

    switch (bot.authorType) {
      case AuthorType.GEMINI:
        return this.getGeminiResponse(bot, history, systemPrompt, providerSettings);

      case AuthorType.OPENROUTER:
        return this.getOpenRouterResponse(bot, history, systemPrompt, providerSettings);

      case AuthorType.OPENAI_COMPATIBLE:
      case AuthorType.LM_STUDIO:
      case AuthorType.OLLAMA:
      case AuthorType.JAN_AI:
      case AuthorType.ZAI:
      case AuthorType.MOONSHOT:
      case AuthorType.MINIMAX:
        return this.getGenericOpenAIResponse(bot, history, systemPrompt, providerSettings);

      default:
        throw new Error(`Unsupported author type: ${bot.authorType}`);
    }
  }

  async streamBotResponse(
    bot: BotConfig,
    history: Message[],
    systemPrompt: string,
    onChunk: StreamingCallback,
    overrideSettings?: Partial<ProviderSettings>
  ): Promise<string> {
    const providerSettings = { ...this.settings, ...overrideSettings };

    switch (bot.authorType) {
      case AuthorType.GEMINI:
        return this.streamGeminiResponse(bot, history, systemPrompt, onChunk, providerSettings);

      case AuthorType.OPENROUTER:
        return this.streamOpenRouterResponse(bot, history, systemPrompt, onChunk, providerSettings);

      case AuthorType.OPENAI_COMPATIBLE:
      case AuthorType.LM_STUDIO:
      case AuthorType.OLLAMA:
      case AuthorType.JAN_AI:
      case AuthorType.ZAI:
      case AuthorType.MOONSHOT:
      case AuthorType.MINIMAX:
        return this.streamGenericOpenAIResponse(bot, history, systemPrompt, onChunk, providerSettings);

      default:
        throw new Error(`Streaming not supported for author type: ${bot.authorType}`);
    }
  }

  private async getGeminiResponse(
    bot: BotConfig,
    history: Message[],
    systemPrompt: string,
    settings: ProviderSettings
  ): Promise<string> {
    const provider = this.providers.get(AuthorType.GEMINI);
    if (!provider) {
      throw new Error('Gemini provider not initialized. Please set GEMINI_API_KEY.');
    }

    const model = provider.getGenerativeModel({ model: bot.model });

    const messages = this.formatMessagesForGemini(history, systemPrompt);
    const result = await model.generateContent(messages);
    const response = await result.response;

    return response.text();
  }

  private async streamGeminiResponse(
    bot: BotConfig,
    history: Message[],
    systemPrompt: string,
    onChunk: StreamingCallback,
    settings: ProviderSettings
  ): Promise<string> {
    const provider = this.providers.get(AuthorType.GEMINI);
    if (!provider) {
      throw new Error('Gemini provider not initialized. Please set GEMINI_API_KEY.');
    }

    const model = provider.getGenerativeModel({ model: bot.model });
    const messages = this.formatMessagesForGemini(history, systemPrompt);

    const result = await model.generateContentStream(messages);

    let fullResponse = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
      onChunk(chunkText);
    }

    return fullResponse;
  }

  private async getOpenRouterResponse(
    bot: BotConfig,
    history: Message[],
    systemPrompt: string,
    settings: ProviderSettings
  ): Promise<string> {
    if (!settings.openRouterKey) {
      throw new Error('OpenRouter API key not provided');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ai-council-mcp-server',
        'X-Title': 'AI Council MCP Server'
      },
      body: JSON.stringify({
        model: bot.model,
        messages: this.formatMessagesForOpenAI(history, systemPrompt),
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content || '';
  }

  private async streamOpenRouterResponse(
    bot: BotConfig,
    history: Message[],
    systemPrompt: string,
    onChunk: StreamingCallback,
    settings: ProviderSettings
  ): Promise<string> {
    if (!settings.openRouterKey) {
      throw new Error('OpenRouter API key not provided');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ai-council-mcp-server',
        'X-Title': 'AI Council MCP Server'
      },
      body: JSON.stringify({
        model: bot.model,
        messages: this.formatMessagesForOpenAI(history, systemPrompt),
        temperature: 0.7,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    if (!reader) {
      throw new Error('No response body');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              onChunk(content);
            }
          } catch (e) {
            // Ignore parse errors for keep-alive messages
          }
        }
      }
    }

    return fullResponse;
  }

  private async getGenericOpenAIResponse(
    bot: BotConfig,
    history: Message[],
    systemPrompt: string,
    settings: ProviderSettings
  ): Promise<string> {
    const endpoint = this.getEndpointForAuthorType(bot.authorType, settings);

    if (!endpoint) {
      throw new Error(`No endpoint configured for ${bot.authorType}`);
    }

    const apiKey = this.getApiKeyForAuthorType(bot.authorType, settings);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: bot.model,
        messages: this.formatMessagesForOpenAI(history, systemPrompt),
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`${bot.authorType} API error: ${response.statusText}`);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content || '';
  }

  private async streamGenericOpenAIResponse(
    bot: BotConfig,
    history: Message[],
    systemPrompt: string,
    onChunk: StreamingCallback,
    settings: ProviderSettings
  ): Promise<string> {
    const endpoint = this.getEndpointForAuthorType(bot.authorType, settings);

    if (!endpoint) {
      throw new Error(`No endpoint configured for ${bot.authorType}`);
    }

    const apiKey = this.getApiKeyForAuthorType(bot.authorType, settings);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: bot.model,
        messages: this.formatMessagesForOpenAI(history, systemPrompt),
        temperature: 0.7,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`${bot.authorType} API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    if (!reader) {
      throw new Error('No response body');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              onChunk(content);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }

    return fullResponse;
  }

  async generateSpeech(text: string, voiceName: string, apiKey?: string): Promise<string | null> {
    // Placeholder for TTS generation
    // In a full implementation, this would integrate with various TTS providers
    return null;
  }

  private formatMessagesForGemini(history: Message[], systemPrompt: string): any[] {
    const messages = [];

    if (systemPrompt) {
      messages.push({
        role: 'user',
        parts: [{ text: `System Instructions: ${systemPrompt}` }]
      });
      messages.push({
        role: 'model',
        parts: [{ text: 'Understood. I will follow these instructions.' }]
      });
    }

    for (const msg of history) {
      const role = msg.authorType === AuthorType.HUMAN ? 'user' : 'model';
      messages.push({
        role,
        parts: [{ text: `${msg.author}: ${msg.content}` }]
      });
    }

    return messages;
  }

  private formatMessagesForOpenAI(history: Message[], systemPrompt: string): any[] {
    const messages = [];

    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }

    for (const msg of history) {
      const role = msg.authorType === AuthorType.HUMAN ? 'user' : 'assistant';
      messages.push({
        role,
        content: `${msg.author}: ${msg.content}`
      });
    }

    return messages;
  }

  private getEndpointForAuthorType(authorType: AuthorType, settings: ProviderSettings): string | null {
    switch (authorType) {
      case AuthorType.LM_STUDIO:
        return settings.lmStudioEndpoint || null;
      case AuthorType.OLLAMA:
        return settings.ollamaEndpoint || null;
      case AuthorType.JAN_AI:
        return settings.janAiEndpoint || null;
      case AuthorType.OPENAI_COMPATIBLE:
        return settings.genericOpenAIEndpoint || null;
      case AuthorType.ZAI:
        return settings.zaiEndpoint || null;
      case AuthorType.MOONSHOT:
        return settings.moonshotEndpoint || null;
      case AuthorType.MINIMAX:
        return settings.minimaxEndpoint || null;
      default:
        return null;
    }
  }

  private getApiKeyForAuthorType(authorType: AuthorType, settings: ProviderSettings): string | null {
    switch (authorType) {
      case AuthorType.LM_STUDIO:
      case AuthorType.OLLAMA:
      case AuthorType.JAN_AI:
      case AuthorType.OPENAI_COMPATIBLE:
        return settings.genericOpenAIKey || null;
      case AuthorType.ZAI:
        return settings.zaiApiKey || null;
      case AuthorType.MOONSHOT:
        return settings.moonshotApiKey || null;
      case AuthorType.MINIMAX:
        return settings.minimaxApiKey || null;
      default:
        return null;
    }
  }

  updateSettings(settings: ProviderSettings) {
    this.settings = settings;
    this.initializeProviders();
  }
}
