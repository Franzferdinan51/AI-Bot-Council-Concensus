// ===== ENUMS =====

/**
 * AI provider types supported by the council system
 */
export enum AuthorType {
  /** Human user input */
  HUMAN = 'human',
  /** Google Gemini API */
  GEMINI = 'gemini',
  /** OpenRouter aggregation service */
  OPENROUTER = 'openrouter',
  /** LM Studio local models */
  LM_STUDIO = 'lmstudio',
  /** Ollama local models */
  OLLAMA = 'ollama',
  /** Jan.ai local models */
  JAN_AI = 'jan_ai',
  /** OpenAI-compatible API */
  OPENAI_COMPATIBLE = 'openai_compatible',
  /** Z.ai provider */
  ZAI = 'zai',
  /** Moonshot AI provider */
  MOONSHOT = 'moonshot',
  /** Minimax AI provider */
  MINIMAX = 'minimax',
  /** System-generated message */
  SYSTEM = 'system',
  /** User message */
  USER = 'user',
}

/**
 * Bot role types within the council
 */
export type BotRole = 'speaker' | 'councilor' | 'specialist' | 'moderator' | 'swarm_agent';

/**
 * Session modes for council discussions
 */
export enum SessionMode {
  /** Proposal mode - voting on proposals */
  PROPOSAL = 'proposal',
  /** Deliberation mode - open discussion */
  DELIBERATION = 'deliberation',
  /** Inquiry mode - direct question answering */
  INQUIRY = 'inquiry',
  /** Research mode - deep research and analysis */
  RESEARCH = 'research',
  /** Swarm mode - parallel agent execution */
  SWARM = 'swarm',
  /** Swarm coding - collaborative code generation */
  SWARM_CODING = 'swarm_coding',
  /** Prediction mode - forecasting and probability */
  PREDICTION = 'prediction',
  /** Arbitration mode - conflict resolution between parties */
  ARBITRATION = 'arbitration',
  /** Negotiation mode - multi-party bargaining and compromise */
  NEGOTIATION = 'negotiation',
  /** Brainstorming mode - creative ideation with voting */
  BRAINSTORMING = 'brainstorming',
  /** Peer review mode - scientific/academic review process */
  PEER_REVIEW = 'peer_review',
  /** Strategic planning mode - long-term planning and roadmaps */
  STRATEGIC_PLANNING = 'strategic_planning',
  /** Design review mode - UX/UI critique and feedback */
  DESIGN_REVIEW = 'design_review',
  /** Risk assessment mode - security and risk analysis */
  RISK_ASSESSMENT = 'risk_assessment',
  /** Advisory mode - strategic guidance and best practices consultation */
  ADVISORY = 'advisory'
}

/**
 * Session status states
 */
export enum SessionStatus {
  /** Session created but not started */
  IDLE = 'idle',
  /** Session starting - opening statements */
  OPENING = 'opening',
  /** Active debate in progress */
  DEBATING = 'debating',
  /** Reconciling different viewpoints */
  RECONCILING = 'reconciling',
  /** Resolving issues */
  RESOLVING = 'resolving',
  /** Voting in progress */
  VOTING = 'voting',
  /** Enacting decisions */
  ENACTING = 'enacting',
  /** Session concluded */
  ADJOURNED = 'adjourned',
  /** Session temporarily paused */
  PAUSED = 'paused'
}

// ===== INTERFACES =====

/**
 * Configuration for a council bot/persona
 */
export interface BotConfig {
  /** Unique identifier for the bot */
  id: string;
  /** Display name of the bot */
  name: string;
  /** Role the bot plays in council */
  role: BotRole;
  /** AI provider to use */
  authorType: AuthorType;
  /** Model identifier */
  model: string;
  /** API key for provider (optional) */
  apiKey?: string;
  /** Custom endpoint URL (optional) */
  endpoint?: string;
  /** System persona definition */
  persona: string;
  /** UI color scheme for display */
  color: string;
  /** Whether this bot is enabled */
  enabled: boolean;
  /** Voice synthesis index (optional) */
  voiceIndex?: number;
  /** Voting weight in decisions (default: 1.0) */
  weight?: number;
}

/**
 * Individual message in council discussion
 */
export interface Message {
  /** Unique message identifier */
  id: string;
  /** Author identifier */
  author: string;
  /** Message content */
  content: string;
  /** Type of author */
  authorType: AuthorType;
  /** UI color for message (optional) */
  color?: string;
  /** Role label (optional) */
  roleLabel?: string;
  /** Vote data if this is a vote message (optional) */
  voteData?: VoteData;
  /** Prediction data if this is a prediction message (optional) */
  predictionData?: PredictionData;
  /** File attachments (optional) */
  attachments?: Attachment[];
  /** Private thinking (filtered from output) (optional) */
  thinking?: string;
  /** Code files generated (optional) */
  codeFiles?: CodeFile[];
  /** Unix timestamp of message creation */
  timestamp: number;
}

/**
 * Voting data for proposal sessions
 */
export interface VoteData {
  /** Topic being voted on */
  topic: string;
  /** Number of yes votes */
  yeas: number;
  /** Number of no votes */
  nays: number;
  /** Vote outcome */
  result: 'PASSED' | 'REJECTED' | 'RECONCILIATION NEEDED';
  /** Average confidence level (0-10) */
  avgConfidence: number;
  /** Consensus score (0-1) */
  consensusScore: number;
  /** Human-readable consensus label */
  consensusLabel: string;
  /** Individual votes */
  votes: {
    /** Voter name */
    voter: string;
    /** Vote choice */
    choice: 'YEA' | 'NAY';
    /** Confidence level (0-10) */
    confidence: number;
    /** Reason for vote */
    reason: string;
    /** UI color */
    color: string;
    /** Voter weight */
    weight: number;
  }[];
  /** Weighted yes votes (optional) */
  weightedYeas?: number;
  /** Weighted no votes (optional) */
  weightedNays?: number;
  /** Total voting weight (optional) */
  totalWeight?: number;
}

/**
 * Prediction data for prediction sessions
 */
export interface PredictionData {
  /** Predicted outcome description */
  outcome: string;
  /** Confidence percentage (0-100) */
  confidence: number;
  /** Expected timeline for outcome */
  timeline: string;
  /** Reasoning and supporting evidence */
  reasoning: string;
}

/**
 * File or link attachment
 */
export interface Attachment {
  /** Type of attachment */
  type: 'file' | 'link';
  /** MIME type (optional) */
  mimeType?: string;
  /** Base64 data or URL */
  data: string;
  /** Display title (optional) */
  title?: string;
}

/**
 * Code file generated during sessions
 */
export interface CodeFile {
  /** Filename */
  filename: string;
  /** Programming language */
  language: string;
  /** File content */
  content: string;
  /** Description (optional) */
  description?: string;
}

/**
 * Memory entry from council discussions
 */
export interface MemoryEntry {
  /** Unique memory identifier */
  id: string;
  /** Memory topic/topic */
  topic: string;
  /** Memory content */
  content: string;
  /** ISO date string */
  date: string;
  /** Tags for organization */
  tags: string[];
}

/**
 * Bot-specific memory entry
 */
export interface BotMemory {
  /** Unique memory identifier */
  id: string;
  /** Bot that owns this memory */
  botId: string;
  /** Type of memory */
  type: 'fact' | 'directive' | 'observation';
  /** Memory content */
  content: string;
  /** Creation timestamp */
  timestamp: number;
}

/**
 * Document in knowledge base
 */
export interface RAGDocument {
  /** Document identifier */
  id: string;
  /** Document title */
  title: string;
  /** Document content */
  content: string;
  /** Document type */
  type?: string;
  /** Whether document is active */
  active: boolean;
  /** Creation timestamp */
  createdAt?: number;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * AI provider configurations
 */
export interface ProviderSettings {
  /** Google Gemini API key */
  geminiApiKey?: string;
  /** OpenRouter API key */
  openRouterKey?: string;
  /** Ollama endpoint URL */
  ollamaEndpoint?: string;
  /** LM Studio endpoint URL */
  lmStudioEndpoint?: string;
  /** Jan.ai endpoint URL */
  janAiEndpoint?: string;
  /** Generic OpenAI-compatible endpoint URL */
  genericOpenAIEndpoint?: string;
  /** Generic OpenAI-compatible API key */
  genericOpenAIKey?: string;
  /** Z.ai API key */
  zaiApiKey?: string;
  /** Z.ai endpoint URL */
  zaiEndpoint?: string;
  /** Moonshot API key */
  moonshotApiKey?: string;
  /** Moonshot endpoint URL */
  moonshotEndpoint?: string;
  /** Minimax API key */
  minimaxApiKey?: string;
  /** Minimax endpoint URL */
  minimaxEndpoint?: string;
}

/**
 * Overall council configuration
 */
export interface CouncilSettings {
  /** Bot configurations */
  bots: BotConfig[];
  /** Provider configurations */
  providers: ProviderSettings;
  /** Knowledge base documents */
  knowledge?: {
    documents: RAGDocument[];
  };
  /** Custom system directive */
  customDirective?: string;
  /** Maximum concurrent API requests (default: 2) */
  maxConcurrentRequests?: number;
  /** Enable economy mode to reduce costs (default: true) */
  economyMode?: boolean;
  /** Enable context pruning for long conversations (default: true) */
  contextPruning?: boolean;
  /** Maximum conversation turns to keep (default: 8) */
  maxContextTurns?: number;
  /** Enable verbose logging during session execution (default: true) */
  verboseLogging?: boolean;
  /** Delay between progress steps in milliseconds (default: 500) */
  progressDelay?: number;
}

// ===== MCP TOOL INPUT/OUTPUT TYPES =====

/**
 * Input parameters for council session tools
 */
export interface CouncilToolInput {
  /** Discussion topic or question */
  topic: string;
  /** Session mode to use */
  mode: SessionMode;
  /** Optional session settings override */
  settings?: Partial<CouncilSettings>;
  /** Additional context (optional) */
  context?: string;
  /** File attachments (optional) */
  attachments?: Attachment[];
}

/**
 * Result from council session tools
 */
export interface CouncilToolResult {
  /** Session identifier */
  sessionId: string;
  /** Current session status */
  status: SessionStatus;
  /** Discussion topic */
  topic: string;
  /** Session mode */
  mode: SessionMode;
  /** Session messages */
  messages: Message[];
  /** Vote results if applicable (optional) */
  voteData?: VoteData;
  /** Prediction results if applicable (optional) */
  predictionData?: PredictionData;
  /** Generated code files if applicable (optional) */
  codeFiles?: CodeFile[];
  /** Session summary */
  summary: string;
  /** Consensus label if applicable (optional) */
  consensusLabel?: string;
}

/**
 * Result from listing sessions
 */
export interface ListSessionsResult {
  /** List of sessions */
  sessions: Array<{
    /** Session identifier */
    sessionId: string;
    /** Discussion topic */
    topic: string;
    /** Session mode */
    mode: SessionMode;
    /** Current status */
    status: SessionStatus;
    /** Number of messages */
    messageCount: number;
    /** Creation timestamp */
    createdAt: number;
  }>;
}

/**
 * Result from getting session details
 */
export interface GetSessionResult {
  /** Session identifier */
  sessionId: string;
  /** Current status */
  status: SessionStatus;
  /** Discussion topic */
  topic: string;
  /** Session mode */
  mode: SessionMode;
  /** Session messages */
  messages: Message[];
  /** Vote data if applicable (optional) */
  voteData?: VoteData;
  /** Prediction data if applicable (optional) */
  predictionData?: PredictionData;
  /** Code files if applicable (optional) */
  codeFiles?: CodeFile[];
}

/**
 * Result from stopping a session
 */
export interface StopSessionResult {
  /** Session identifier */
  sessionId: string;
  /** Final status */
  status: SessionStatus;
  /** Result message */
  message: string;
}

/**
 * Input for adding memory
 */
export interface AddMemoryInput {
  /** Memory topic */
  topic: string;
  /** Memory content */
  content: string;
  /** Optional tags */
  tags?: string[];
}

/**
 * Result from adding memory
 */
export interface AddMemoryResult {
  /** Success flag */
  success: boolean;
  /** New memory identifier */
  memoryId: string;
  /** Result message */
  message: string;
}

/**
 * Input for searching memory
 */
export interface SearchMemoryInput {
  /** Search query */
  query: string;
  /** Maximum results (optional) */
  limit?: number;
}

/**
 * Result from searching memory
 */
export interface SearchMemoryResult {
  /** Matching memories */
  memories: MemoryEntry[];
  /** Result message */
  message: string;
}

/**
 * Input for adding document
 */
export interface AddDocumentInput {
  /** Document title */
  title: string;
  /** Document content */
  content: string;
}

/**
 * Result from adding document
 */
export interface AddDocumentResult {
  /** Success flag */
  success: boolean;
  /** New document identifier */
  documentId: string;
  /** Result message */
  message: string;
}

/**
 * Input for searching documents
 */
export interface SearchDocumentsInput {
  /** Search query */
  query: string;
  /** Maximum results (optional) */
  limit?: number;
}

/**
 * Result from searching documents
 */
export interface SearchDocumentsResult {
  /** Matching documents */
  documents: RAGDocument[];
  /** Matching snippets */
  snippets: string[];
  /** Result message */
  message: string;
}

/**
 * Result from listing bots
 */
export interface ListBotsResult {
  /** Bot configurations */
  bots: BotConfig[];
  /** Result message */
  message: string;
}

/**
 * Input for updating bot
 */
export interface UpdateBotInput {
  /** Bot identifier */
  botId: string;
  /** Fields to update */
  updates: Partial<BotConfig>;
}

/**
 * Result from updating bot
 */
export interface UpdateBotResult {
  /** Success flag */
  success: boolean;
  /** Updated bot configuration */
  bot: BotConfig;
  /** Result message */
  message: string;
}

// ===== STREAMING TYPES =====

/**
 * Stream event types
 */
export interface StreamEvent {
  /** Event type */
  type: 'thinking' | 'message' | 'status' | 'complete' | 'error';
  /** Event data */
  data: any;
}

/**
 * Complete council session data
 */
export interface CouncilSession {
  /** Session identifier */
  id: string;
  /** Discussion topic */
  topic: string;
  /** Session mode */
  mode: SessionMode;
  /** Current status */
  status: SessionStatus;
  /** Session messages */
  messages: Message[];
  /** Session settings */
  settings: CouncilSettings;
  /** Creation timestamp */
  createdAt: number;
  /** Last update timestamp */
  updatedAt: number;
  /** Vote data (optional) */
  voteData?: VoteData;
  /** Prediction data (optional) */
  predictionData?: PredictionData;
  /** Code files (optional) */
  codeFiles?: CodeFile[];
}

export type { Result, Option, Some, None } from './utilities.js';
export type { MCPRequest, MCPResponse, SuccessResponse, ErrorResponse } from './api.js';

// ===== EXPORTS FROM CONSTANTS =====

export { DEFAULT_BOTS, DEFAULT_SETTINGS, getBotsWithCustomConfigs } from './constants.js';

// ===== EXPORT GUARDS =====

export {
  isSessionId,
  isMemoryId,
  isDocumentId,
  isMessageId,
  isNonEmptyString,
  isSessionMode,
  isSessionStatus,
  isAuthorType,
  isBotRole,
  isBotConfig,
  isMessage,
  isVoteData,
  isPredictionData,
  isMemoryEntry,
  isRAGDocument,
  isCouncilSettings,
  isCouncilToolInput,
  isNumberInRange,
  isArrayWithLength,
  hasRequiredKeys,
  assertSessionId,
  assertMemoryId,
  assertDocumentId,
  assertMessageId,
  assertBotConfig,
  assertMessage,
  assertNonEmptyString,
  asSessionId,
  asMemoryId,
  asDocumentId,
  asMessageId
} from './guards.js';

// ===== EXPORT UTILITIES =====

export {
  isDefined,
  isNotNull,
  isNotUndefined,
  isNonEmptyArray,
  success,
  failure,
  some,
  none,
  isSome,
  isNone,
  unwrap,
  unwrapOr
} from './utilities.js';

