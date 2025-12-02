import type { BotConfig, AuthorType, CouncilSettings } from './index.js';
import { BotConfigService } from '../services/botConfigService.js';
import { ConfigLoader } from '../utils/configLoader.js';

// Load configurations
const modelsConfig = ConfigLoader.loadModels();
const botsConfig = ConfigLoader.loadBots();
const promptsConfig = ConfigLoader.loadPrompts();

export const OPENROUTER_MODELS = modelsConfig.openRouterModels;

export const VOICE_MAP: Record<string, string> = modelsConfig.voiceMap;

export const DEFAULT_BOTS: BotConfig[] = botsConfig.defaultBots;

export const PERSONA_PRESETS = botsConfig.personaPresets;

export const COUNCIL_SYSTEM_INSTRUCTION = promptsConfig;

export const DEFAULT_SETTINGS: CouncilSettings = {
  bots: DEFAULT_BOTS,
  providers: {
    geminiApiKey: "",
    openRouterKey: "",
    ollamaEndpoint: "http://localhost:11434/v1/chat/completions",
    lmStudioEndpoint: "http://localhost:1234/v1/chat/completions",
    janAiEndpoint: "http://localhost:1337/v1/chat/completions",
    genericOpenAIEndpoint: "",
    genericOpenAIKey: "",
    zaiApiKey: "",
    zaiEndpoint: "https://api.zai.com/v1/chat/completions",
    moonshotApiKey: "",
    moonshotEndpoint: "https://api.moonshot.cn/v1/chat/completions",
    minimaxApiKey: "",
    minimaxEndpoint: "https://api.minimax.chat/v1/text/chatcompletion_v2"
  },
  maxConcurrentRequests: 2,
  economyMode: true,
  contextPruning: true,
  maxContextTurns: 8
};

// Export configured bots with custom models applied
export const CONFIGURED_BOTS = BotConfigService.getConfiguredBots();

// Export a function to get bots with custom configs
export const getBotsWithCustomConfigs = (): BotConfig[] => {
  return BotConfigService.getConfiguredBots();
};
