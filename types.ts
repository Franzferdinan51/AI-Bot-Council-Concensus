
export enum AuthorType {
  HUMAN = 'human',
  GEMINI = 'gemini',
  OPENROUTER = 'openrouter',
  LM_STUDIO = 'lmstudio',
  OPENAI_COMPATIBLE = 'openai_compatible',
  SYSTEM = 'system',
}

export type BotRole = 'speaker' | 'councilor' | 'specialist' | 'moderator';

export interface BotConfig {
  id: string;
  name: string;
  role: BotRole;
  authorType: AuthorType;
  model: string; // e.g., 'gemini-2.5-flash', 'gpt-4', 'local-model'
  apiKey?: string; // Optional per-bot key
  endpoint?: string; // For LM Studio / Local / Generic
  persona: string;
  color: string; // Tailwind gradient classes
  enabled: boolean;
}

export interface MCPTool {
  name: string;
  description: string;
  schema: string; // JSON string of the schema
}

export interface MCPSettings {
  enabled: boolean;
  dockerEndpoint: string; // Simulating a connection to a local Docker MCP
  customTools: MCPTool[]; // JSON definitions
}

export interface Settings {
  bots: BotConfig[];
  mcp: MCPSettings;
  globalOpenRouterKey?: string;
}

export interface VoteData {
    topic: string; // The motion being voted on
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
  color?: string; // Store color at message level for consistency
  roleLabel?: string;
  voteData?: VoteData; // Optional structured data for voting results
}

export enum SessionStatus {
    IDLE = 'idle',
    OPENING = 'opening',
    DEBATING = 'debating',
    RESOLVING = 'resolving',
    VOTING = 'voting',
    ENACTING = 'enacting',
}
