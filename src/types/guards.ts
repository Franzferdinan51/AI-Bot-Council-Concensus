/**
 * Type Guards and Runtime Validation
 * Provides runtime type checking and validation for all data structures
 */

// ===== BRANDED TYPES =====

/**
 * Branded type to prevent accidental ID misuse
 * Session IDs must follow the pattern: session-YYYYMMDD-HHMMSS-XXXXXXXX
 */
export type SessionId = string & { readonly brand: unique symbol };

/**
 * Memory entry ID
 */
export type MemoryId = string & { readonly brand: unique symbol };

/**
 * Document ID for knowledge base
 */
export type DocumentId = string & { readonly brand: unique symbol };

/**
 * Vote ID
 */
export type VoteId = string & { readonly brand: unique symbol };

/**
 * Prediction ID
 */
export type PredictionId = string & { readonly brand: unique symbol };

/**
 * Message ID
 */
export type MessageId = string & { readonly brand: unique symbol };

// ===== TYPE GUARDS =====

/**
 * Guard for SessionId
 */
export function isSessionId(value: unknown): value is SessionId {
  if (typeof value !== 'string') return false;
  const sessionIdPattern = /^session-\d{8}-\d{6}-[a-f0-9]{8}$/;
  return sessionIdPattern.test(value);
}

/**
 * Guard for MemoryId
 */
export function isMemoryId(value: unknown): value is MemoryId {
  if (typeof value !== 'string') return false;
  const memoryIdPattern = /^memory-\d{8}-\d{6}-[a-f0-9]{8}$/;
  return memoryIdPattern.test(value);
}

/**
 * Guard for DocumentId
 */
export function isDocumentId(value: unknown): value is DocumentId {
  if (typeof value !== 'string') return false;
  const documentIdPattern = /^doc-\d{8}-\d{6}-[a-f0-9]{8}$/;
  return documentIdPattern.test(value);
}

/**
 * Guard for MessageId
 */
export function isMessageId(value: unknown): value is MessageId {
  if (typeof value !== 'string') return false;
  const messageIdPattern = /^msg-\d{8}-\d{6}-[a-f0-9]{8}$/;
  return messageIdPattern.test(value);
}

/**
 * Guard for non-empty strings
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Guard for valid SessionMode
 */
export function isSessionMode(value: unknown): value is import('./index.js').SessionMode {
  return (
    value === 'proposal' ||
    value === 'deliberation' ||
    value === 'inquiry' ||
    value === 'research' ||
    value === 'swarm' ||
    value === 'swarm_coding' ||
    value === 'prediction'
  );
}

/**
 * Guard for valid SessionStatus
 */
export function isSessionStatus(value: unknown): value is import('./index.js').SessionStatus {
  return (
    value === 'idle' ||
    value === 'opening' ||
    value === 'debating' ||
    value === 'reconciling' ||
    value === 'resolving' ||
    value === 'voting' ||
    value === 'enacting' ||
    value === 'adjourned' ||
    value === 'paused'
  );
}

/**
 * Guard for valid AuthorType
 */
export function isAuthorType(value: unknown): value is import('./index.js').AuthorType {
  return (
    value === 'human' ||
    value === 'gemini' ||
    value === 'openrouter' ||
    value === 'lmstudio' ||
    value === 'ollama' ||
    value === 'jan_ai' ||
    value === 'openai_compatible' ||
    value === 'zai' ||
    value === 'moonshot' ||
    value === 'minimax' ||
    value === 'system'
  );
}

/**
 * Guard for BotRole
 */
export function isBotRole(value: unknown): value is import('./index.js').BotRole {
  return (
    value === 'speaker' ||
    value === 'councilor' ||
    value === 'specialist' ||
    value === 'moderator' ||
    value === 'swarm_agent'
  );
}

/**
 * Guard for BotConfig
 */
export function isBotConfig(value: unknown): value is import('./index.js').BotConfig {
  if (typeof value !== 'object' || value === null) return false;

  const bot = value as Partial<import('./index.js').BotConfig>;

  return (
    isNonEmptyString(bot.id) &&
    isNonEmptyString(bot.name) &&
    isBotRole(bot.role) &&
    isAuthorType(bot.authorType) &&
    isNonEmptyString(bot.model) &&
    isNonEmptyString(bot.persona) &&
    isNonEmptyString(bot.color) &&
    typeof bot.enabled === 'boolean' &&
    (bot.weight === undefined || typeof bot.weight === 'number')
  );
}

/**
 * Guard for Message
 */
export function isMessage(value: unknown): value is import('./index.js').Message {
  if (typeof value !== 'object' || value === null) return false;

  const msg = value as Partial<import('./index.js').Message>;

  return (
    isMessageId(msg.id) &&
    isNonEmptyString(msg.author) &&
    isNonEmptyString(msg.content) &&
    isAuthorType(msg.authorType) &&
    typeof msg.timestamp === 'number'
  );
}

/**
 * Guard for VoteData
 */
export function isVoteData(value: unknown): value is import('./index.js').VoteData {
  if (typeof value !== 'object' || value === null) return false;

  const vote = value as Partial<import('./index.js').VoteData>;

  return (
    isNonEmptyString(vote.topic) &&
    typeof vote.yeas === 'number' &&
    typeof vote.nays === 'number' &&
    (vote.result === 'PASSED' || vote.result === 'REJECTED' || vote.result === 'RECONCILIATION NEEDED') &&
    typeof vote.avgConfidence === 'number' &&
    typeof vote.consensusScore === 'number' &&
    isNonEmptyString(vote.consensusLabel) &&
    Array.isArray(vote.votes)
  );
}

/**
 * Guard for PredictionData
 */
export function isPredictionData(value: unknown): value is import('./index.js').PredictionData {
  if (typeof value !== 'object' || value === null) return false;

  const pred = value as Partial<import('./index.js').PredictionData>;

  return (
    isNonEmptyString(pred.outcome) &&
    typeof pred.confidence === 'number' &&
    isNonEmptyString(pred.timeline) &&
    isNonEmptyString(pred.reasoning)
  );
}

/**
 * Guard for MemoryEntry
 */
export function isMemoryEntry(value: unknown): value is import('./index.js').MemoryEntry {
  if (typeof value !== 'object' || value === null) return false;

  const mem = value as Partial<import('./index.js').MemoryEntry>;

  return (
    isMemoryId(mem.id) &&
    isNonEmptyString(mem.topic) &&
    isNonEmptyString(mem.content) &&
    isNonEmptyString(mem.date) &&
    Array.isArray(mem.tags)
  );
}

/**
 * Guard for RAGDocument
 */
export function isRAGDocument(value: unknown): value is import('./index.js').RAGDocument {
  if (typeof value !== 'object' || value === null) return false;

  const doc = value as Partial<import('./index.js').RAGDocument>;

  return (
    isDocumentId(doc.id) &&
    isNonEmptyString(doc.title) &&
    isNonEmptyString(doc.content) &&
    typeof doc.active === 'boolean'
  );
}

/**
 * Guard for CouncilSettings
 */
export function isCouncilSettings(value: unknown): value is import('./index.js').CouncilSettings {
  if (typeof value !== 'object' || value === null) return false;

  const settings = value as Partial<import('./index.js').CouncilSettings>;

  return (
    Array.isArray(settings.bots) &&
    settings.bots.every(isBotConfig) &&
    typeof settings.providers === 'object' &&
    settings.providers !== null
  );
}

/**
 * Guard for CouncilToolInput
 */
export function isCouncilToolInput(value: unknown): value is import('./index.js').CouncilToolInput {
  if (typeof value !== 'object' || value === null) return false;

  const input = value as Partial<import('./index.js').CouncilToolInput>;

  return (
    isNonEmptyString(input.topic) &&
    isSessionMode(input.mode)
  );
}

/**
 * Guard for number within range
 */
export function isNumberInRange(
  value: unknown,
  min: number = Number.MIN_SAFE_INTEGER,
  max: number = Number.MAX_SAFE_INTEGER
): value is number {
  return typeof value === 'number' && value >= min && value <= max;
}

/**
 * Guard for array with constraints
 */
export function isArrayWithLength<T>(
  value: unknown,
  minLength: number = 0,
  maxLength: number = Number.MAX_SAFE_INTEGER
): value is T[] {
  return Array.isArray(value) && value.length >= minLength && value.length <= maxLength;
}

/**
 * Guard for object with required keys
 */
export function hasRequiredKeys<T extends Record<string, unknown>>(
  value: unknown,
  requiredKeys: (keyof T)[]
): value is T {
  if (typeof value !== 'object' || value === null) return false;

  for (const key of requiredKeys) {
    if (!(key in value)) return false;
  }

  return true;
}

// ===== TYPE ASSERTIONS =====

/**
 * Assert SessionId or throw error
 */
export function assertSessionId(value: string, name: string = 'SessionId'): asserts value is SessionId {
  if (!isSessionId(value)) {
    throw new Error(`${name} must be a valid session ID (format: session-YYYYMMDD-HHMMSS-XXXXXXXX)`);
  }
}

/**
 * Assert MemoryId or throw error
 */
export function assertMemoryId(value: string, name: string = 'MemoryId'): asserts value is MemoryId {
  if (!isMemoryId(value)) {
    throw new Error(`${name} must be a valid memory ID (format: memory-YYYYMMDD-HHMMSS-XXXXXXXX)`);
  }
}

/**
 * Assert DocumentId or throw error
 */
export function assertDocumentId(value: string, name: string = 'DocumentId'): asserts value is DocumentId {
  if (!isDocumentId(value)) {
    throw new Error(`${name} must be a valid document ID (format: doc-YYYYMMDD-HHMMSS-XXXXXXXX)`);
  }
}

/**
 * Assert MessageId or throw error
 */
export function assertMessageId(value: string, name: string = 'MessageId'): asserts value is MessageId {
  if (!isMessageId(value)) {
    throw new Error(`${name} must be a valid message ID (format: msg-YYYYMMDD-HHMMSS-XXXXXXXX)`);
  }
}

/**
 * Assert BotConfig or throw error
 */
export function assertBotConfig(value: unknown, name: string = 'BotConfig'): asserts value is import('./index.js').BotConfig {
  if (!isBotConfig(value)) {
    throw new Error(`${name} must be a valid BotConfig object`);
  }
}

/**
 * Assert Message or throw error
 */
export function assertMessage(value: unknown, name: string = 'Message'): asserts value is import('./index.js').Message {
  if (!isMessage(value)) {
    throw new Error(`${name} must be a valid Message object`);
  }
}

/**
 * Assert non-empty string or throw error
 */
export function assertNonEmptyString(value: unknown, name: string): asserts value is string {
  if (!isNonEmptyString(value)) {
    throw new Error(`${name} must be a non-empty string`);
  }
}

// ===== HELPERS =====

/**
 * Type predicate to check if value is defined
 */
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

/**
 * Type predicate to check if value is not null
 */
export function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

/**
 * Type predicate to check if value is not undefined
 */
export function isNotUndefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

/**
 * Narrow array to non-empty
 */
export function isNonEmptyArray<T>(value: T[]): value is [T, ...T[]] {
  return value.length > 0;
}

/**
 * Extract and validate SessionId from unknown
 */
export function asSessionId(value: string): SessionId {
  assertSessionId(value);
  return value as SessionId;
}

/**
 * Extract and validate MemoryId from unknown
 */
export function asMemoryId(value: string): MemoryId {
  assertMemoryId(value);
  return value as MemoryId;
}

/**
 * Extract and validate DocumentId from unknown
 */
export function asDocumentId(value: string): DocumentId {
  assertDocumentId(value);
  return value as DocumentId;
}

/**
 * Extract and validate MessageId from unknown
 */
export function asMessageId(value: string): MessageId {
  assertMessageId(value);
  return value as MessageId;
}
