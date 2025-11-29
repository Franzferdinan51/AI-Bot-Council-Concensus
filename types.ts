
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

export type BotRole = 'speaker' | 'councilor' | 'specialist' | 'moderator' | 'swarm_agent';

export enum SessionMode {
    PROPOSAL = 'proposal',       // Standard Legislative: Debate -> Vote -> Enact
    DELIBERATION = 'deliberation', // Roundtable: Deep discussion -> Summary (No Vote)
    INQUIRY = 'inquiry',          // Q&A: Direct answers -> Synthesis
    RESEARCH = 'research',         // Agentic: Deep Dive -> Plan -> Investigate -> Report
    SWARM = 'swarm'               // Swarm: Dynamic Decomposition -> Parallel Execution -> Aggregation
}

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
    useGeminiTTS: boolean; // Toggle between Browser and Gemini TTS
    autoPlay: boolean;
    speechRate: number; // 0.5 to 2.0
    voiceVolume: number; // 0 to 1.0
}

export interface UISettings {
    debateDelay: number; // ms delay between turns
    fontSize: 'small' | 'medium' | 'large';
    customDirective?: string; // Override for Prime Directive
}

export interface CostSettings {
    contextPruning: boolean; // Enable history truncation
    maxContextTurns: number; // Keep last N turns + Topic
    parallelProcessing: boolean; // Batch requests where possible
    maxConcurrentRequests: number; // Limit parallel requests to prevent 429s
    economyMode: boolean; // Force lighter models for councilors
}

export interface ProviderSettings {
    geminiApiKey?: string;
    openRouterKey?: string;
    ollamaEndpoint: string;
    lmStudioEndpoint: string;
    janAiEndpoint: string;
}

export interface MemoryEntry {
    id: string;
    topic: string;
    content: string; // The enactment/ruling
    date: string;
    tags: string[];
}

export interface RAGDocument {
    id: string;
    title: string;
    content: string;
    active: boolean;
}

export interface Settings {
  bots: BotConfig[];
  mcp: MCPSettings;
  audio: AudioSettings;
  ui: UISettings;
  cost: CostSettings;
  providers: ProviderSettings;
  knowledge: {
      documents: RAGDocument[];
  };
}

export interface VoteData {
    topic: string; 
    yeas: number;
    nays: number;
    result: 'PASSED' | 'REJECTED' | 'RECONCILIATION NEEDED';
    avgConfidence: number;
    consensusScore: number; // 0-100 score representing unity
    consensusLabel: string; // "Unanimous", "Strong", "Divided", "Contentious"
    votes: {
        voter: string;
        choice: 'YEA' | 'NAY';
        confidence: number; // 0-10
        reason: string;
        color: string;
    }[];
}

export interface Attachment {
    type: 'file' | 'link';
    mimeType?: string; // for files
    data: string; // base64 for files, url for links
    title?: string; // for links
}

export interface Message {
  id: string;
  author: string;
  content: string;
  authorType: AuthorType;
  color?: string; 
  roleLabel?: string;
  voteData?: VoteData;
  attachments?: Attachment[];
  thinking?: string; // Chain of Thought content
}

export enum SessionStatus {
    IDLE = 'idle',
    OPENING = 'opening',
    DEBATING = 'debating',
    RECONCILING = 'reconciling',
    RESOLVING = 'resolving',
    VOTING = 'voting',
    ENACTING = 'enacting',
    ADJOURNED = 'adjourned',
    PAUSED = 'paused'
}

export interface ControlSignal {
    stop: boolean;
    pause: boolean;
}
