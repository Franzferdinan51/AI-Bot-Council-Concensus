import { GoogleGenerativeAI } from '@google/generative-ai';
import { BotConfig, AuthorType, Message, ProviderSettings } from '../types/index.js';
import { costTrackingService } from './costTrackingService.js';

export interface StreamingCallback {
  (chunk: string): void;
}

export class AIService {
  private providers: Map<AuthorType, any> = new Map();
  private settings: ProviderSettings;
  private currentSessionId?: string;

  constructor(settings: ProviderSettings) {
    this.settings = settings;
    this.initializeProviders();
  }

  /**
   * Set the current session context for cost tracking
   */
  setSessionContext(sessionId?: string): void {
    this.currentSessionId = sessionId;
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
    let response;
    try {
      const result = await model.generateContent(messages);
      response = await result.response;
    } catch (error: any) {
      throw new Error(`Gemini API error: ${error.message || error}`);
    }

    // Track cost
    try {
      const promptTokenCount = this.estimateTokenCount(messages.map(m => JSON.stringify(m)).join(' '));
      const responseText = response.text();
      const completionTokenCount = this.estimateTokenCount(responseText);
      const callId = costTrackingService.startCall(this.currentSessionId, bot.id, bot.name, bot.authorType, bot.model);
      costTrackingService.completeCall(callId, promptTokenCount, completionTokenCount);
    } catch (error) {
      console.error('[COST TRACKING] Error tracking Gemini call:', error);
    }

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

    let result;
    try {
      result = await model.generateContentStream(messages);
    } catch (error: any) {
      throw new Error(`Gemini streaming error: ${error.message || error}`);
    }

    let fullResponse = '';
    try {
      const callId = costTrackingService.startCall(this.currentSessionId, bot.id, bot.name, bot.authorType, bot.model);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
        onChunk(chunkText);
      }

      const promptTokenCount = this.estimateTokenCount(messages.map(m => JSON.stringify(m)).join(' '));
      const completionTokenCount = this.estimateTokenCount(fullResponse);
      costTrackingService.completeCall(callId, promptTokenCount, completionTokenCount);
    } catch (error) {
      console.error('[COST TRACKING] Error tracking Gemini streaming call:', error);
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

    const openAIMessages = this.formatMessagesForOpenAI(history, systemPrompt);
    const promptTokenCount = this.estimateTokenCount(openAIMessages.map(m => m.content || '').join(' '));

    const callId = costTrackingService.startCall(this.currentSessionId, bot.id, bot.name, bot.authorType, bot.model);

    try {
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
          messages: openAIMessages,
          temperature: 0.7,
          stream: false
        })
      });

      if (!response.ok) {
        costTrackingService.completeCall(callId, promptTokenCount, 0, 'error', response.statusText);
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      const data = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      };

      const responseContent = data.choices?.[0]?.message?.content || '';
      const completionTokenCount = data.usage?.completion_tokens || this.estimateTokenCount(responseContent);

      costTrackingService.completeCall(callId, data.usage?.prompt_tokens || promptTokenCount, completionTokenCount);

      return responseContent;
    } catch (error) {
      costTrackingService.completeCall(callId, promptTokenCount, 0, 'error', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
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

  /**
   * Estimate token count for a text string
   * Rough approximation: 1 token ≈ 3.5 characters for English text
   */
  private estimateTokenCount(text: string): number {
    if (!text) return 0;
    // Use more conservative estimate: 1 token ≈ 3.5 characters
    return Math.ceil(text.length / 3.5);
  }
}
