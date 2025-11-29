
export enum AuthorType {
  HUMAN = 'human',
  GEMINI = 'gemini',
  OPENROUTER = 'openrouter',
  LM_STUDIO = 'lmstudio',
  OLLAMA = 'ollama',
  JAN_AI = 'jan_ai',
  OPENAI_COMPATIBLE = 'openai_compatible',
  SYSTEM = 'system',
}

export type BotRole = 'speaker' | 'councilor' | 'specialist' | 'moderator';

export interface BotConfig {
  id: string;
  name: string;
  role: BotRole;
  authorType: AuthorType;
  model: string; 
  apiKey?: string; 
  endpoint?: string; 
  persona: string;
  color: string; 
  enabled: boolean;
  voiceIndex?: number; // Preference for TTS voice index
}

export interface MCPTool {
  name: string;
  description: string;
  schema: string; 
}

export interface MCPSettings {
  enabled: boolean;
  dockerEndpoint: string; 
  customTools: MCPTool[]; 
}

export interface AudioSettings {
    enabled: boolean;
    autoPlay: boolean;
    speechRate: number; // 0.5 to 2.0
    voiceVolume: number; // 0 to 1.0
}

export interface UISettings {
    debateDelay: number; // ms delay between turns
    fontSize: 'small' | 'medium' | 'large';
}

export interface ProviderSettings {
    geminiApiKey?: string;
    openRouterKey?: string;
    ollamaEndpoint: string;
    lmStudioEndpoint: string;
    janAiEndpoint: string;
}

export interface Settings {
  bots: BotConfig[];
  mcp: MCPSettings;
  audio: AudioSettings;
  ui: UISettings;
  providers: ProviderSettings;
}

export interface VoteData {
    topic: string; 
    yeas: number;
    nays: number;
    result: 'PASSED' | 'REJECTED';
    votes: {
        voter: string;
        choice: 'YEA' | 'NAY';
        reason: string;
        color: string;
    }[];
}

export interface Message {
  id: string;
  author: string;
  content: string;
  authorType: AuthorType;
  color?: string; 
  roleLabel?: string;
  voteData?: VoteData; 
}

export enum SessionStatus {
    IDLE = 'idle',
    OPENING = 'opening',
    DEBATING = 'debating',
    RESOLVING = 'resolving',
    VOTING = 'voting',
    ENACTING = 'enacting',
    ADJOURNED = 'adjourned'
}
