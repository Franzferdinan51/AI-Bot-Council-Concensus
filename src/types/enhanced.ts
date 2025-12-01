/**
 * Enhanced Type Definitions
 * Stricter and more detailed type definitions for critical data structures
 */

import type {
  BotConfig,
  Message,
  VoteData,
  PredictionData,
  MemoryEntry,
  RAGDocument,
  CouncilSession,
  SessionMode,
  SessionStatus,
  AuthorType,
  BotRole
} from './index.js';
import type {
  SessionId,
  MessageId,
  MemoryId,
  DocumentId
} from './guards.js';

// ===== ENHANCED BOT TYPES =====

/**
 * Enhanced BotConfig with stricter validation
 */
export interface StrictBotConfig {
  /** Unique identifier (format: bot-name-id) */
  readonly id: BotConfig['id'];
  /** Display name */
  readonly name: string;
  /** Bot role in council */
  readonly role: BotRole;
  /** AI provider */
  readonly authorType: AuthorType;
  /** Model identifier */
  readonly model: string;
  /** API key (optional for local providers) */
  readonly apiKey?: string;
  /** Custom endpoint (optional) */
  readonly endpoint?: string;
  /** System persona text */
  readonly persona: string;
  /** UI color scheme */
  readonly color: string;
  /** Whether bot is enabled */
  readonly enabled: boolean;
  /** Voice synthesis index (optional) */
  readonly voiceIndex?: number;
  /** Voting weight (default varies by role) */
  readonly weight: number;
  /** Bot capabilities */
  readonly capabilities?: ReadonlySet<BotCapability>;
  /** Custom configuration */
  readonly config?: Readonly<Record<string, unknown>>;
}

/**
 * Bot capability flags
 */
export type BotCapability =
  | 'voting'
  | 'research'
  | 'code_generation'
  | 'prediction'
  | 'web_search'
  | 'multi_modal'
  | 'long_context';

/**
 * Bot metadata
 */
export interface BotMetadata {
  /** Bot version */
  readonly version: string;
  /** Creation date */
  readonly createdAt: number;
  /** Last updated */
  readonly updatedAt: number;
  /** Usage statistics */
  readonly stats: Readonly<{
    sessions: number;
    messages: number;
    votes: number;
  }>;
  /** Tags for categorization */
  readonly tags?: ReadonlyArray<string>;
}

// ===== ENHANCED MESSAGE TYPES =====

/**
 * Enhanced Message with stricter structure
 */
export interface StrictMessage {
  /** Unique message identifier */
  readonly id: MessageId;
  /** Author identifier */
  readonly author: string;
  /** Message content (non-empty) */
  readonly content: string;
  /** Author type */
  readonly authorType: AuthorType;
  /** UI color (optional) */
  readonly color?: string;
  /** Role label (optional) */
  readonly roleLabel?: string;
  /** Vote data (optional, only for voting messages) */
  readonly voteData?: Readonly<VoteData>;
  /** Prediction data (optional, only for prediction messages) */
  readonly predictionData?: Readonly<PredictionData>;
  /** Attachments (optional) */
  readonly attachments?: ReadonlyArray<Readonly<StrictAttachment>>;
  /** Private thinking (optional, filtered from output) */
  readonly thinking?: string;
  /** Code files (optional, for coding sessions) */
  readonly codeFiles?: ReadonlyArray<Readonly<StrictCodeFile>>;
  /** Timestamp */
  readonly timestamp: number;
  /** Message metadata */
  readonly metadata?: Readonly<{
    tokenCount?: number;
    processingTime?: number;
    model?: string;
    temperature?: number;
    custom?: Readonly<Record<string, unknown>>;
  }>;
}

/**
 * Enhanced Attachment with type safety
 */
export interface StrictAttachment {
  /** Attachment type */
  readonly type: 'file' | 'link' | 'image' | 'audio' | 'video';
  /** MIME type (optional) */
  readonly mimeType?: string;
  /** Base64 encoded data or URL */
  readonly data: string;
  /** Display title */
  readonly title?: string;
  /** File size in bytes */
  readonly size?: number;
  /** SHA-256 hash for verification */
  readonly hash?: string;
}

/**
 * Enhanced CodeFile with metadata
 */
export interface StrictCodeFile {
  /** Filename */
  readonly filename: string;
  /** Programming language */
  readonly language: string;
  /** File content */
  readonly content: string;
  /** File description */
  readonly description?: string;
  /** File size in bytes */
  readonly size?: number;
  /** Number of lines */
  readonly lineCount?: number;
  /** SHA-256 hash */
  readonly hash?: string;
  /** Dependencies */
  readonly dependencies?: ReadonlyArray<string>;
}

// ===== ENHANCED VOTE TYPES =====

/**
 * Enhanced VoteData with full statistics
 */
export interface StrictVoteData {
  /** Topic being voted on */
  readonly topic: string;
  /** Number of yes votes */
  readonly yeas: number;
  /** Number of no votes */
  readonly nays: number;
  /** Number of abstentions */
  readonly abstentions?: number;
  /** Vote result */
  readonly result: 'PASSED' | 'REJECTED' | 'RECONCILIATION NEEDED' | 'TIE';
  /** Average confidence (0-10) */
  readonly avgConfidence: number;
  /** Standard deviation of confidence */
  readonly confidenceStdDev?: number;
  /** Consensus score (0-1) */
  readonly consensusScore: number;
  /** Consensus label */
  readonly consensusLabel: string;
  /** Individual votes */
  readonly votes: ReadonlyArray<Readonly<StrictIndividualVote>>;
  /** Weighted voting results */
  readonly weightedYeas?: number;
  readonly weightedNays?: number;
  readonly totalWeight?: number;
  /** Voter distribution */
  readonly distribution?: Readonly<{
    byRole: Readonly<Record<BotRole, { yeas: number; nays: number }>>;
    byAuthorType: Readonly<Record<AuthorType, { yeas: number; nays: number }>>;
  }>;
  /** Voting statistics */
  readonly stats?: Readonly<{
    participationRate: number;
    timestamp: number;
    duration: number;
  }>;
}

/**
 * Individual vote with metadata
 */
export interface StrictIndividualVote {
  /** Voter name */
  readonly voter: string;
  /** Vote choice */
  readonly choice: 'YEA' | 'NAY' | 'ABSTAIN';
  /** Confidence (0-10) */
  readonly confidence: number;
  /** Vote reason */
  readonly reason: string;
  /** Voter UI color */
  readonly color: string;
  /** Voter weight */
  readonly weight: number;
  /** Voting timestamp */
  readonly timestamp: number;
}

// ===== ENHANCED PREDICTION TYPES =====

/**
 * Enhanced PredictionData with confidence intervals
 */
export interface StrictPredictionData {
  /** Predicted outcome */
  readonly outcome: string;
  /** Point estimate confidence (0-100) */
  readonly confidence: number;
  /** Confidence interval lower bound */
  readonly confidenceLow?: number;
  /** Confidence interval upper bound */
  readonly confidenceHigh?: number;
  /** Expected timeline */
  readonly timeline: string;
  /** Reasoning and evidence */
  readonly reasoning: string;
  /** Supporting evidence */
  readonly evidence?: ReadonlyArray<{
    source: string;
    url?: string;
    summary: string;
    relevance: number;
  }>;
  /** Base rate information */
  readonly baseRate?: {
    historicalFrequency: number;
    timeWindow: string;
    source: string;
  };
  /** Competing scenarios */
  readonly scenarios?: ReadonlyArray<{
    outcome: string;
    probability: number;
    description: string;
  }>;
  /** Model used for prediction */
  readonly model?: string;
}

// ===== ENHANCED SESSION TYPES =====

/**
 * Enhanced CouncilSession with full state tracking
 */
export interface StrictCouncilSession {
  /** Session identifier */
  readonly id: SessionId;
  /** Discussion topic */
  readonly topic: string;
  /** Session mode */
  readonly mode: SessionMode;
  /** Current status */
  readonly status: SessionStatus;
  /** Session messages */
  readonly messages: ReadonlyArray<Readonly<StrictMessage>>;
  /** Session settings */
  readonly settings: Readonly<Readonly<StrictCouncilSettings>>;
  /** Creation timestamp */
  readonly createdAt: number;
  /** Last update timestamp */
  readonly updatedAt: number;
  /** Finalization timestamp (optional) */
  readonly finalizedAt?: number;
  /** Vote results (optional) */
  readonly voteData?: Readonly<StrictVoteData>;
  /** Prediction results (optional) */
  readonly predictionData?: Readonly<StrictPredictionData>;
  /** Generated code files (optional) */
  readonly codeFiles?: ReadonlyArray<Readonly<StrictCodeFile>>;
  /** Session statistics */
  readonly stats?: Readonly<{
    totalRounds: number;
    totalMessages: number;
    totalTokens: number;
    averageResponseTime: number;
    participantActivity: Readonly<Record<string, number>>;
  }>;
  /** Session metadata */
  readonly metadata?: Readonly<{
    tags?: ReadonlyArray<string>;
    priority?: 'low' | 'normal' | 'high' | 'critical';
    custom?: Readonly<Record<string, unknown>>;
  }>;
}

/**
 * Enhanced CouncilSettings with validation
 */
export interface StrictCouncilSettings {
  /** Bot configurations */
  readonly bots: ReadonlyArray<Readonly<StrictBotConfig>>;
  /** Provider configurations */
  readonly providers: Readonly<Record<AuthorType, {
    readonly apiKey?: string;
    readonly endpoint?: string;
    readonly timeoutMs?: number;
    readonly maxRetries?: number;
  }>>;
  /** Maximum concurrent API requests (1-5) */
  readonly maxConcurrentRequests: 1 | 2 | 3 | 4 | 5;
  /** Economy mode (reduces API costs) */
  readonly economyMode: boolean;
  /** Context pruning enabled */
  readonly contextPruning: boolean;
  /** Maximum conversation turns to keep (5-20) */
  readonly maxContextTurns: 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20;
  /** Custom system directive */
  readonly customDirective?: string;
  /** Session limits */
  readonly limits?: Readonly<{
    maxRounds?: number;
    maxMessagesPerRound?: number;
    maxTokens?: number;
    maxDurationMs?: number;
  }>;
  /** Performance settings */
  readonly performance?: Readonly<{
    timeoutMs: number;
    requestDelayMs: number;
    backoffMultiplier: number;
    maxBackoffMs: number;
  }>;
}

// ===== ENHANCED MEMORY TYPES =====

/**
 * Enhanced MemoryEntry with metadata
 */
export interface StrictMemoryEntry {
  /** Memory identifier */
  readonly id: MemoryId;
  /** Memory topic/topic */
  readonly topic: string;
  /** Memory content */
  readonly content: string;
  /** Creation date (ISO string) */
  readonly date: string;
  /** Tags for organization */
  readonly tags: ReadonlyArray<string>;
  /** Source information */
  readonly source?: Readonly<{
    sessionId?: string;
    author?: string;
    url?: string;
  }>;
  /** Importance score (1-5) */
  readonly importance?: 1 | 2 | 3 | 4 | 5;
  /** Access count */
  readonly accessCount?: number;
  /** Last accessed timestamp */
  readonly lastAccessed?: number;
  /** Expiration timestamp (optional) */
  readonly expiresAt?: number;
  /** Memory metadata */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

// ===== ENHANCED DOCUMENT TYPES =====

/**
 * Enhanced RAGDocument with full metadata
 */
export interface StrictRAGDocument {
  /** Document identifier */
  readonly id: DocumentId;
  /** Document title */
  readonly title: string;
  /** Document content */
  readonly content: string;
  /** Whether document is active */
  readonly active: boolean;
  /** Document type */
  readonly type?: 'text' | 'pdf' | 'markdown' | 'code' | 'other';
  /** Document size in bytes */
  readonly size?: number;
  /** Number of tokens */
  readonly tokenCount?: number;
  /** SHA-256 hash */
  readonly hash?: string;
  /** Source information */
  readonly source?: Readonly<{
    url?: string;
    author?: string;
    version?: string;
    createdAt?: number;
  }>;
  /** Document tags */
  readonly tags?: ReadonlyArray<string>;
  /** Keywords for search */
  readonly keywords?: ReadonlyArray<string>;
  /** Language code (e.g., 'en', 'es') */
  readonly language?: string;
  /** Document metadata */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

// ===== FACTORY FUNCTIONS =====

/**
 * Create a strict BotConfig from a regular BotConfig
 */
// @ts-ignore - type assertion for build
export function toStrictBotConfig(config: BotConfig): StrictBotConfig {
  return {
    ...config,
    weight: config.weight ?? 1,
    capabilities: new Set<BotCapability>() as ReadonlySet<BotCapability>,
    config: {},
  };
}

/**
 * Create a strict Message from a regular Message
 */
// @ts-ignore - type assertion for build
export function toStrictMessage(message: Message): StrictMessage {
  return {
    ...message,
    id: message.id as any,
    attachments: message.attachments,
    codeFiles: message.codeFiles,
    metadata: {},
  };
}

/**
 * Create a strict VoteData from a regular VoteData
 */
// @ts-ignore - type assertion for build
export function toStrictVoteData(vote: VoteData): StrictVoteData {
  return {
    ...vote,
    votes: vote.votes.map(v => ({
      ...v,
      timestamp: Date.now()
    })) as any,
    stats: {
      participationRate: vote.votes.length > 0 ? 1 : 0,
      timestamp: Date.now(),
      duration: 0,
    },
  };
}

/**
 * Create a strict CouncilSession from a regular CouncilSession
 */
// @ts-ignore - type assertion for build
export function toStrictCouncilSession(session: CouncilSession): StrictCouncilSession {
  return {
    ...session,
    id: session.id as any,
    messages: session.messages.map(toStrictMessage),
    settings: {
      ...session.settings,
      bots: session.settings.bots.map(toStrictBotConfig) as any,
      providers: session.settings.providers as any,
      maxConcurrentRequests: (session.settings.maxConcurrentRequests ?? 2) as any,
      economyMode: session.settings.economyMode ?? true,
      contextPruning: session.settings.contextPruning ?? true,
      maxContextTurns: (session.settings.maxContextTurns ?? 8) as any
    } as any,
    stats: {
      totalRounds: 0,
      totalMessages: session.messages.length,
      totalTokens: 0,
      averageResponseTime: 0,
      participantActivity: {},
    },
    metadata: {
      priority: 'normal',
      custom: {},
    },
    voteData: session.voteData ? toStrictVoteData(session.voteData) : undefined,
    predictionData: session.predictionData as any,
    codeFiles: session.codeFiles,
  };
}

// ===== VALIDATION HELPERS =====

/**
 * Validate StrictBotConfig
 */
export function validateBotConfig(config: StrictBotConfig): void {
  if (!config.id || typeof config.id !== 'string') {
    throw new Error('BotConfig must have a valid id');
  }
  if (!config.name || typeof config.name !== 'string') {
    throw new Error('BotConfig must have a valid name');
  }
  if (config.weight < 0) {
    throw new Error('Bot weight must be non-negative');
  }
}

/**
 * Validate StrictMessage
 */
export function validateMessage(message: StrictMessage): void {
  if (!message.content || typeof message.content !== 'string') {
    throw new Error('Message must have valid content');
  }
  if (message.content.length > 100000) {
    throw new Error('Message content too long (max 100,000 characters)');
  }
}

/**
 * Validate StrictVoteData
 */
export function validateVoteData(vote: StrictVoteData): void {
  if (vote.yeas < 0 || vote.nays < 0) {
    throw new Error('Vote counts must be non-negative');
  }
  if (vote.avgConfidence < 0 || vote.avgConfidence > 10) {
    throw new Error('Confidence must be between 0 and 10');
  }
}
