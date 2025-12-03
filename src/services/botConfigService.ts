/**
 * Bot Configuration Service
 * Handles loading custom models and configurations from environment variables
 */

import { BotConfig } from '../types/index.js';
import { DEFAULT_BOTS } from '../types/constants.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

export interface BotModelConfig {
  [botId: string]: {
    model: string;
    authorType: string;
  };
}

export class BotConfigService {
  private static customBotConfigs: Map<string, Partial<BotConfig>> = new Map();

  /**
   * Load custom bot configurations from environment variables
   */
  static loadCustomConfigs(): Map<string, Partial<BotConfig>> {
    this.customBotConfigs.clear();

    // Get all environment variables that start with MODEL_
    const modelEnvVars = Object.keys(process.env).filter(key =>
      key.startsWith('MODEL_')
    );

    // Also check for AUTHOR_TYPE_ variables
    const authorTypeEnvVars = Object.keys(process.env).filter(key =>
      key.startsWith('AUTHOR_TYPE_')
    );

    // Process model variables
    for (const envVar of modelEnvVars) {
      const botId = envVar.substring('MODEL_'.length).toLowerCase().replace(/-/g, '_');
      const modelValue = process.env[envVar];

      if (modelValue && modelValue.trim() !== '') {
        const existing = this.customBotConfigs.get(botId) || {};
        this.customBotConfigs.set(botId, {
          ...existing,
          model: modelValue.trim()
        });
        console.error(`[BotConfig] Loaded custom model for ${botId}: ${modelValue}`);
      }
    }

    // Process author type variables
    for (const envVar of authorTypeEnvVars) {
      const botId = envVar.substring('AUTHOR_TYPE_'.length).toLowerCase().replace(/-/g, '_');
      const authorTypeValue = process.env[envVar];

      if (authorTypeValue && authorTypeValue.trim() !== '') {
        const existing = this.customBotConfigs.get(botId) || {};
        this.customBotConfigs.set(botId, {
          ...existing,
          authorType: authorTypeValue.trim() as any
        });
        console.error(`[BotConfig] Loaded custom author type for ${botId}: ${authorTypeValue}`);
      }
    }

    if (this.customBotConfigs.size > 0) {
      console.error(`[BotConfig] Loaded ${this.customBotConfigs.size} custom bot configurations`);
    }

    return this.customBotConfigs;
  }

  private static configPath = 'bots.json';

  /**
   * Load bots from file if exists
   */
  static loadBotsFromFile(): BotConfig[] | null {
    try {
      const fs = require('fs');
      const path = require('path');
      const fullPath = path.resolve(process.cwd(), this.configPath);

      if (fs.existsSync(fullPath)) {
        const data = fs.readFileSync(fullPath, 'utf8');
        const bots = JSON.parse(data);
        console.error(`[BotConfig] Loaded ${bots.length} bots from ${this.configPath}`);
        return bots;
      }
    } catch (error) {
      console.error(`[BotConfig] Failed to load bots from file:`, error);
    }
    return null;
  }

  /**
   * Save bots to file
   */
  static saveBotsToFile(bots: BotConfig[]): boolean {
    try {
      const fs = require('fs');
      const path = require('path');
      const fullPath = path.resolve(process.cwd(), this.configPath);

      fs.writeFileSync(fullPath, JSON.stringify(bots, null, 2));
      console.error(`[BotConfig] Saved ${bots.length} bots to ${this.configPath}`);
      return true;
    } catch (error) {
      console.error(`[BotConfig] Failed to save bots to file:`, error);
      return false;
    }
  }

  /**
   * Get bots with custom configurations applied
   */
  static getConfiguredBots(): BotConfig[] {
    // 1. Try loading from file first (highest priority for persistence)
    const fileBots = this.loadBotsFromFile();
    if (fileBots) {
      return fileBots;
    }

    // 2. Load custom configs from env vars if not already loaded
    if (this.customBotConfigs.size === 0) {
      this.loadCustomConfigs();
    }

    // 3. Apply custom env configs to default bots
    return DEFAULT_BOTS.map(bot => {
      const customConfig = this.customBotConfigs.get(bot.id);
      if (customConfig) {
        return {
          ...bot,
          ...customConfig
        };
      }
      return bot;
    });
  }

  /**
   * Get a single bot with custom config applied
   */
  static getBot(botId: string): BotConfig | undefined {
    const configuredBots = this.getConfiguredBots();
    return configuredBots.find(bot => bot.id === botId);
  }

  /**
   * Get all custom configurations as a map
   */
  static getCustomConfigs(): Map<string, Partial<BotConfig>> {
    if (this.customBotConfigs.size === 0) {
      this.loadCustomConfigs();
    }
    return this.customBotConfigs;
  }

  /**
   * Generate .env template entries for all bots
   */
  static generateEnvTemplate(): string {
    let template = '\n# ========================================\n';
    template += '# CUSTOM BOT MODEL CONFIGURATIONS\n';
    template += '# ========================================\n';
    template += '# Configure individual models for each bot\n';
    template += '# Format: MODEL_<bot-id>=<model-name>\n';
    template += '# Example: MODEL_speaker_high_council=claude-3-5-sonnet\n';
    template += '#\n';
    template += '# Available bot IDs:\n';

    const bots = DEFAULT_BOTS;
    for (const bot of bots) {
      template += `# - ${bot.id} (${bot.name}) - Current: ${bot.model}\n`;
    }

    template += '#\n';
    template += '# Also configurable: AUTHOR_TYPE_<bot-id>=<provider>\n';
    template += '# Example: AUTHOR_TYPE_speaker_high_council=openrouter\n';
    template += '#\n';
    template += '# Common providers: gemini, openrouter, openai, anthropic\n';
    template += '# ========================================\n\n';

    for (const bot of bots) {
      const botIdEnv = bot.id.toUpperCase().replace(/-/g, '_');
      template += `# ${bot.name}\n`;
      template += `# MODEL_${botIdEnv}=${bot.model}\n`;
      template += `# AUTHOR_TYPE_${botIdEnv}=${bot.authorType}\n`;
      template += '\n';
    }

    return template;
  }

  /**
   * List all available models for a specific provider
   */
  static getAvailableModels(provider: string): string[] {
    const models: { [key: string]: string[] } = {
      gemini: [
        'gemini-2.5-flash',
        'gemini-2.5-flash-8b',
        'gemini-1.5-pro',
        'gemini-1.5-flash'
      ],
      openrouter: [
        'anthropic/claude-3.5-sonnet',
        'anthropic/claude-3-haiku',
        'openai/gpt-4o',
        'openai/gpt-4o-mini',
        'openai/gpt-4-turbo',
        'google/gemma-2-9b-it',
        'meta-llama/llama-3.1-70b-instruct',
        'meta-llama/llama-3.1-8b-instruct',
        'mistralai/mistral-large',
        'mistralai/mistral-7b-instruct'
      ],
      openai: [
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4-turbo',
        'gpt-3.5-turbo'
      ],
      anthropic: [
        'claude-3-5-sonnet',
        'claude-3-opus',
        'claude-3-haiku'
      ],
      local: [
        'llama3:latest',
        'mistral:latest',
        'codellama:latest',
        'custom-model-name'
      ]
    };

    return models[provider] || [];
  }

  /**
   * Check if a model is valid for a provider
   */
  static isValidModel(provider: string, model: string): boolean {
    const availableModels = this.getAvailableModels(provider);
    return availableModels.includes(model);
  }
}

// Auto-load custom configs on module import
BotConfigService.loadCustomConfigs();
