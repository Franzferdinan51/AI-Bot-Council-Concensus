/**
 * Global Error Handling Middleware
 * Centralized error handling, logging, and reporting
 */

import { responseSchema } from './responseSchema.js';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  RATE_LIMIT = 'rate_limit',
  EXTERNAL_API = 'external_api',
  INTERNAL = 'internal',
  SYSTEM = 'system',
  TIMEOUT = 'timeout',
  NETWORK = 'network',
  PERMISSION = 'permission'
}

export interface ErrorContext {
  sessionId?: string;
  toolName?: string;
  userId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  provider?: string;
  arguments?: any;
  metadata?: Record<string, any>;
}

export interface LoggedError {
  timestamp: number;
  severity: ErrorSeverity;
  category: ErrorCategory;
  message: string;
  stack?: string;
  context: ErrorContext;
  retryable: boolean;
  resolved: boolean;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errors: LoggedError[] = [];
  private errorCounts: Map<string, number> = new Map();
  private callbacks: Array<(error: LoggedError) => void> = [];

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle and log an error
   */
  handle(
    error: Error | string,
    options: {
      severity?: ErrorSeverity;
      category?: ErrorCategory;
      context?: ErrorContext;
      retryable?: boolean;
      toolName?: string;
      sessionId?: string;
    } = {}
  ): LoggedError {
    const {
      severity = ErrorSeverity.MEDIUM,
      category = ErrorCategory.INTERNAL,
      context = {},
      retryable = false,
      toolName,
      sessionId
    } = options;

    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;

    // Create error record
    const loggedError: LoggedError = {
      timestamp: Date.now(),
      severity,
      category,
      message: errorMessage,
      stack: errorStack,
      context: {
        ...context,
        toolName,
        sessionId
      },
      retryable,
      resolved: false
    };

    // Add to error log
    this.errors.push(loggedError);

    // Track error counts for rate limiting
    const errorKey = `${category}:${errorMessage}`;
    const count = (this.errorCounts.get(errorKey) || 0) + 1;
    this.errorCounts.set(errorKey, count);

    // Limit error log size (keep last 1000 errors)
    if (this.errors.length > 1000) {
      this.errors = this.errors.slice(-1000);
    }

    // Notify callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(loggedError);
      } catch (e) {
        // Swallow callback errors
        console.error('[ErrorHandler] Callback error:', e);
      }
    });

    // Log to console based on severity
    this.logToConsole(loggedError);

    return loggedError;
  }

  /**
   * Handle validation errors
   */
  validationError(
    message: string,
    context: ErrorContext = {},
    toolName?: string
  ): LoggedError {
    return this.handle(message, {
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.VALIDATION,
      context,
      retryable: false,
      toolName
    });
  }

  /**
   * Handle API errors
   */
  apiError(
    error: Error | string,
    provider: string,
    context: ErrorContext = {},
    toolName?: string
  ): LoggedError {
    return this.handle(error, {
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.EXTERNAL_API,
      context: {
        ...context,
        provider
      },
      retryable: true,
      toolName
    });
  }

  /**
   * Handle timeout errors
   */
  timeoutError(
    operation: string,
    timeoutMs: number,
    context: ErrorContext = {},
    toolName?: string
  ): LoggedError {
    return this.handle(`Operation timeout: ${operation} (${timeoutMs}ms)`, {
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.TIMEOUT,
      context,
      retryable: true,
      toolName
    });
  }

  /**
   * Handle rate limit errors
   */
  rateLimitError(
    operation: string,
    limit: number,
    windowMs: number,
    context: ErrorContext = {},
    toolName?: string
  ): LoggedError {
    return this.handle(`Rate limit exceeded for ${operation}: ${limit} requests per ${windowMs}ms`, {
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.RATE_LIMIT,
      context,
      retryable: true,
      toolName
    });
  }

  /**
   * Handle system errors
   */
  systemError(
    error: Error | string,
    context: ErrorContext = {},
    toolName?: string
  ): LoggedError {
    return this.handle(error, {
      severity: ErrorSeverity.CRITICAL,
      category: ErrorCategory.SYSTEM,
      context,
      retryable: false,
      toolName
    });
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 50): LoggedError[] {
    return this.errors.slice(-limit);
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: ErrorCategory): LoggedError[] {
    return this.errors.filter(e => e.category === category);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): LoggedError[] {
    return this.errors.filter(e => e.severity === severity);
  }

  /**
   * Get error counts
   */
  getErrorCounts(): Map<string, number> {
    return new Map(this.errorCounts);
  }

  /**
   * Check if error threshold exceeded
   */
  isThresholdExceeded(
    category: ErrorCategory,
    threshold: number,
    windowMs: number = 60000
  ): boolean {
    const cutoff = Date.now() - windowMs;
    const recentErrors = this.errors.filter(
      e => e.category === category && e.timestamp >= cutoff
    );
    return recentErrors.length > threshold;
  }

  /**
   * Register error callback
   */
  onError(callback: (error: LoggedError) => void): void {
    this.callbacks.push(callback);
  }

  /**
   * Remove error callback
   */
  offError(callback: (error: LoggedError) => void): void {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  /**
   * Mark error as resolved
   */
  markResolved(timestamp: number): void {
    const error = this.errors.find(e => e.timestamp === timestamp);
    if (error) {
      error.resolved = true;
    }
  }

  /**
   * Get error statistics
   */
  getStats(): {
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    unresolved: number;
    recent: number;
  } {
    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    for (const error of this.errors) {
      byCategory[error.category] = (byCategory[error.category] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
    }

    const unresolved = this.errors.filter(e => !e.resolved).length;
    const recent = this.errors.filter(
      e => Date.now() - e.timestamp < 3600000
    ).length;

    return {
      total: this.errors.length,
      byCategory,
      bySeverity,
      unresolved,
      recent
    };
  }

  /**
   * Clear error log
   */
  clear(): void {
    this.errors = [];
    this.errorCounts.clear();
  }

  /**
   * Export error log
   */
  export(): string {
    return JSON.stringify(this.errors, null, 2);
  }

  /**
   * Log to console based on severity
   */
  private logToConsole(error: LoggedError): void {
    const { severity, category, message, stack, context } = error;
    const timestamp = new Date(error.timestamp).toISOString();

    const contextStr = JSON.stringify(context);
    const logMessage = `[AI Council MCP] [${timestamp}] [${severity.toUpperCase()}] [${category}] ${message}`;

    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        console.error(`${logMessage} :: ${contextStr}${stack ? `\n${stack}` : ''}`);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn(`${logMessage} :: ${contextStr}`);
        break;
      case ErrorSeverity.LOW:
        console.log(`${logMessage} :: ${contextStr}`);
        break;
    }
  }

  /**
   * Wrap async function with error handling
   */
  async wrap<T>(
    fn: () => Promise<T>,
    options: {
      toolName?: string;
      sessionId?: string;
      context?: ErrorContext;
      fallback?: T;
      onError?: (error: LoggedError) => void;
    } = {}
  ): Promise<T | undefined> {
    const { toolName, sessionId, context = {}, fallback, onError } = options;

    try {
      return await fn();
    } catch (error) {
      const loggedError = this.handle(error as Error, {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.INTERNAL,
        context: {
          ...context,
          toolName,
          sessionId
        },
        retryable: true,
        toolName
      });

      if (onError) {
        onError(loggedError);
      }

      return fallback;
    }
  }

  /**
   * Create MCP error response
   */
  createErrorResponse(
    toolName: string,
    error: Error | string,
    context: ErrorContext = {},
    executionTime?: number
  ) {
    const loggedError = this.handle(error, {
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.INTERNAL,
      context,
      retryable: false,
      toolName
    });

    return responseSchema.toMCPResponse(
      responseSchema.error(
        toolName,
        'INTERNAL_ERROR',
        loggedError.message,
        {
          sessionId: context.sessionId,
          details: {
            category: loggedError.category,
            severity: loggedError.severity,
            timestamp: loggedError.timestamp
          },
          executionTime
        }
      )
    );
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();
