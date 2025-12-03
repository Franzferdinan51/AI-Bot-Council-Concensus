/**
 * API-Specific Types
 * Type definitions for API requests, responses, and client interfaces
 */

import type {
  CouncilSession,
  CouncilSettings,
  Message,
  VoteData,
  PredictionData,
  MemoryEntry,
  RAGDocument,
  BotConfig
} from './index.js';

// ===== REQUEST/RESPONSE TYPES =====

/**
 * Base interface for all MCP tool requests
 */
export interface MCPRequest {
  /** Unique request identifier */
  readonly id: string;
  /** Tool name being called */
  readonly name: string;
  /** Request arguments */
  readonly arguments: Record<string, unknown>;
  /** ISO timestamp when request was made */
  readonly timestamp: number;
  /** Client metadata */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Base interface for all MCP tool responses
 */
export interface MCPResponse {
  /** Unique response identifier matching request */
  readonly requestId: string;
  /** Response status */
  readonly status: 'success' | 'error';
  /** Response data */
  readonly data: unknown;
  /** Error information if status is error */
  readonly error?: MCPError;
  /** Execution time in milliseconds */
  readonly executionTime: number;
  /** ISO timestamp when response was generated */
  readonly timestamp: number;
}

/**
 * MCP error information
 */
export interface MCPError {
  /** Error code */
  readonly code: string;
  /** Human-readable error message */
  readonly message: string;
  /** Error details */
  readonly details?: Record<string, unknown>;
  /** Stack trace if available */
  readonly stack?: string;
  /** Error category */
  readonly category: 'VALIDATION' | 'API' | 'TIMEOUT' | 'RATE_LIMIT' | 'SYSTEM' | 'INTERNAL';
  /** Whether the error is retryable */
  readonly retryable: boolean;
}

/**
 * Success response wrapper
 */
export interface SuccessResponse<T> {
  readonly status: 'success';
  readonly data: T;
  readonly metadata?: {
    readonly executionTime: number;
    readonly sessionId?: string;
    readonly toolName: string;
    readonly timestamp: number;
  };
}

/**
 * Error response wrapper
 */
export interface ErrorResponse {
  readonly status: 'error';
  readonly error: MCPError;
  readonly metadata?: {
    readonly executionTime: number;
    readonly timestamp: number;
  };
}

// ===== API CLIENT INTERFACES =====

/**
 * Generic API client interface
 */
export interface ApiClient {
  /** Send a request to the API */
  send<TRequest, TResponse>(request: TRequest): Promise<TResponse>;
  /** Check if client is healthy */
  healthCheck(): Promise<boolean>;
  /** Get client status */
  getStatus(): ClientStatus;
}

/**
 * Client status information
 */
export interface ClientStatus {
  /** Whether client is ready to accept requests */
  readonly ready: boolean;
  /** Number of active requests */
  readonly activeRequests: number;
  /** Total requests processed */
  readonly totalRequests: number;
  /** Number of failed requests */
  readonly failedRequests: number;
  /** Last error if any */
  readonly lastError?: Error;
  /** Client configuration hash */
  readonly configHash: string;
}

/**
 * Rate limiter configuration
 */
export interface RateLimitConfig {
  /** Maximum requests per time window */
  readonly maxRequests: number;
  /** Time window in milliseconds */
  readonly windowMs: number;
  /** Optional custom rate limit handler */
  readonly onLimitExceeded?: () => Promise<void>;
}

// ===== HTTP TYPES =====

/**
 * HTTP method enum
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * HTTP headers
 */
export type HttpHeaders = Record<string, string>;

/**
 * HTTP request configuration
 */
export interface HttpRequestConfig {
  /** Request URL */
  readonly url: string;
  /** HTTP method */
  readonly method: HttpMethod;
  /** Request headers */
  readonly headers?: HttpHeaders;
  /** Request body */
  readonly body?: unknown;
  /** Timeout in milliseconds */
  readonly timeoutMs?: number;
  /** Number of retries */
  readonly retries?: number;
  /** Retry delay in milliseconds */
  readonly retryDelayMs?: number;
}

/**
 * HTTP response
 */
export interface HttpResponse<T = unknown> {
  /** Response status code */
  readonly status: number;
  /** Response headers */
  readonly headers: HttpHeaders;
  /** Response body */
  readonly data: T;
  /** Response size in bytes */
  readonly size: number;
  /** Response time in milliseconds */
  readonly duration: number;
}

// ===== WEBSOCKET TYPES =====

/**
 * WebSocket message types
 */
export type WebSocketMessageType =
  | 'connect'
  | 'disconnect'
  | 'message'
  | 'error'
  | 'ping'
  | 'pong'
  | 'subscribe'
  | 'unsubscribe';

/**
 * WebSocket message
 */
export interface WebSocketMessage {
  /** Message type */
  readonly type: WebSocketMessageType;
  /** Message payload */
  readonly data: unknown;
  /** Message ID */
  readonly id?: string;
  /** Timestamp */
  readonly timestamp: number;
}

/**
 * WebSocket event handlers
 */
export interface WebSocketHandlers {
  /** Called on connect */
  onConnect?: () => void;
  /** Called on disconnect */
  onDisconnect?: (code: number, reason: string) => void;
  /** Called on error */
  onError?: (error: Error) => void;
  /** Called on message */
  onMessage?: (message: WebSocketMessage) => void;
  /** Called on pong */
  onPong?: (latency: number) => void;
}

// ===== STREAMING TYPES =====

/**
 * Stream event types
 */
export type StreamEventType =
  | 'start'
  | 'data'
  | 'error'
  | 'complete'
  | 'abort'
  | 'heartbeat';

/**
 * Stream event
 */
export interface StreamEvent<T = unknown> {
  /** Event type */
  readonly type: StreamEventType;
  /** Event data */
  readonly data: T;
  /** Timestamp */
  readonly timestamp: number;
  /** Optional stream ID */
  readonly streamId?: string;
}

/**
 * Stream handler
 */
export interface StreamHandler<T = unknown> {
  /** Handle incoming event */
  onEvent(event: StreamEvent<T>): void | Promise<void>;
  /** Handle stream error */
  onError(error: Error): void | Promise<void>;
  /** Handle stream complete */
  onComplete(): void | Promise<void>;
}

/**
 * Async iterable stream
 */
export interface AsyncStream<T> extends AsyncIterableIterator<T> {
  /** Cancel the stream */
  cancel(): Promise<void>;
  /** Check if stream is active */
  readonly active: boolean;
}

// ===== PAGINATION TYPES =====

/**
 * Pagination parameters
 */
export interface PaginationParams {
  /** Page number (0-indexed) */
  readonly page?: number;
  /** Number of items per page */
  readonly limit?: number;
  /** Sorting field */
  readonly sortBy?: string;
  /** Sort order */
  readonly sortOrder?: 'asc' | 'desc';
  /** Filter criteria */
  readonly filter?: Record<string, unknown>;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  /** Items in current page */
  readonly items: T[];
  /** Total number of items */
  readonly total: number;
  /** Current page number */
  readonly page: number;
  /** Number of items per page */
  readonly limit: number;
  /** Whether more pages exist */
  readonly hasMore: boolean;
}

// ===== FILTERS AND QUERIES =====

/**
 * Generic filter criteria
 */
export interface FilterCriteria {
  /** Field name */
  readonly field: string;
  /** Comparison operator */
  readonly operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains';
  /** Field value */
  readonly value: unknown;
}

/**
 * Search query with filters
 */
export interface SearchQuery {
  /** Search query string */
  readonly query: string;
  /** Filters to apply */
  readonly filters?: FilterCriteria[];
  /** Fields to search in */
  readonly searchFields?: string[];
  /** Fields to return */
  readonly returnFields?: string[];
  /** Pagination params */
  readonly pagination?: PaginationParams;
}

/**
 * Search result
 */
export interface SearchResult<T> {
  /** Matching items */
  readonly results: T[];
  /** Total matches */
  readonly total: number;
  /** Search score for each result */
  readonly scores?: number[];
  /** Facets for filtering */
  readonly facets?: Record<string, Array<{ value: unknown; count: number }>>;
}

// ===== METRICS AND MONITORING =====

/**
 * Performance metrics
 */
export interface Metrics {
  /** Requests per second */
  readonly rps: number;
  /** Average response time */
  readonly avgResponseTime: number;
  /** Error rate */
  readonly errorRate: number;
  /** Active connections */
  readonly activeConnections: number;
  /** Total requests */
  readonly totalRequests: number;
  /** Timestamp */
  readonly timestamp: number;
}

/**
 * Health check result
 */
export interface HealthCheck {
  /** Service name */
  readonly service: string;
  /** Health status */
  readonly status: 'healthy' | 'degraded' | 'unhealthy';
  /** Response time */
  readonly responseTime: number;
  /** Additional information */
  readonly info?: Record<string, unknown>;
  /** Dependencies status */
  readonly dependencies?: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
  }>;
}

// ===== AUTHENTICATION TYPES =====

/**
 * Authentication credentials
 */
export interface AuthCredentials {
  /** API key */
  readonly apiKey?: string;
  /** Bearer token */
  readonly bearerToken?: string;
  /** Basic auth */
  readonly username?: string;
  readonly password?: string;
  /** Custom headers */
  readonly headers?: HttpHeaders;
}

/**
 * Authentication result
 */
export interface AuthResult {
  /** Whether authentication succeeded */
  readonly success: boolean;
  /** Access token if successful */
  readonly token?: string;
  /** Token expiration time */
  readonly expiresAt?: number;
  /** Error message if failed */
  readonly error?: string;
}

// ===== CONFIGURATION TYPES =====

/**
 * Server configuration
 */
export interface ServerConfig {
  /** Host to bind to */
  readonly host: string;
  /** Port to listen on */
  readonly port: number;
  /** HTTPS enabled */
  readonly https: boolean;
  /** SSL certificate path */
  readonly certPath?: string;
  /** SSL key path */
  readonly keyPath?: string;
  /** Request timeout */
  readonly timeoutMs: number;
  /** Max request size */
  readonly maxRequestSize: number;
  /** CORS enabled */
  readonly corsEnabled: boolean;
  /** Allowed origins */
  readonly allowedOrigins?: string[];
  /** Logging level */
  readonly logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// ===== EXPORT ALL =====

export type {
  CouncilSession,
  CouncilSettings,
  Message,
  VoteData,
  PredictionData,
  MemoryEntry,
  RAGDocument,
  BotConfig
};
