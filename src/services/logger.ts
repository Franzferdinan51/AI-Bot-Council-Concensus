/**
 * Structured Logging Service
 * Provides comprehensive logging with levels, contexts, and persistence
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  levelName: string;
  message: string;
  service: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  sessionId?: string;
  toolName?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface LoggerConfig {
  level: LogLevel;
  outputToConsole: boolean;
  outputToFile: boolean;
  logDirectory: string;
  maxFileSize: number; // in MB
  maxFiles: number;
  includeStackTrace: boolean;
  timestampFormat: 'iso' | 'unix' | 'relative';
  prettyPrint: boolean;
}

export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private startTime: number = Date.now();

  private constructor() {
    this.config = {
      level: LogLevel.INFO,
      outputToConsole: true,
      outputToFile: false,
      logDirectory: './logs',
      maxFileSize: 10, // 10MB
      maxFiles: 5,
      includeStackTrace: true,
      timestampFormat: 'iso',
      prettyPrint: true
    };
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /**
   * Log at DEBUG level
   */
  debug(
    message: string,
    context: Record<string, any> = {},
    service: string = 'App'
  ): void {
    this.log(LogLevel.DEBUG, message, context, service);
  }

  /**
   * Log at INFO level
   */
  info(
    message: string,
    context: Record<string, any> = {},
    service: string = 'App'
  ): void {
    this.log(LogLevel.INFO, message, context, service);
  }

  /**
   * Log at WARN level
   */
  warn(
    message: string,
    context: Record<string, any> = {},
    service: string = 'App'
  ): void {
    this.log(LogLevel.WARN, message, context, service);
  }

  /**
   * Log at ERROR level
   */
  error(
    message: string,
    error?: Error,
    context: Record<string, any> = {},
    service: string = 'App'
  ): void {
    this.log(LogLevel.ERROR, message, context, service, error);
  }

  /**
   * Log at CRITICAL level
   */
  critical(
    message: string,
    error?: Error,
    context: Record<string, any> = {},
    service: string = 'App'
  ): void {
    this.log(LogLevel.CRITICAL, message, context, service, error);
  }

  /**
   * Log session activity
   */
  session(
    sessionId: string,
    action: string,
    status: 'started' | 'completed' | 'error' | 'stopped',
    context: Record<string, any> = {},
    service: string = 'SessionService'
  ): void {
    this.log(
      status === 'error' || status === 'stopped' ? LogLevel.WARN : LogLevel.INFO,
      `Session ${action}: ${sessionId}`,
      {
        ...context,
        sessionId,
        status
      },
      service
    );
  }

  /**
   * Log tool execution
   */
  tool(
    toolName: string,
    sessionId: string | undefined,
    status: 'started' | 'completed' | 'error',
    duration?: number,
    context: Record<string, any> = {},
    service: string = 'MCPTool'
  ): void {
    const level = status === 'error' ? LogLevel.ERROR : LogLevel.INFO;

    this.log(
      level,
      `Tool ${status}: ${toolName}`,
      {
        ...context,
        toolName,
        sessionId,
        duration
      },
      service
    );
  }

  /**
   * Log API calls
   */
  api(
    provider: string,
    operation: string,
    status: 'started' | 'completed' | 'error',
    duration?: number,
    context: Record<string, any> = {},
    service: string = 'AIService'
  ): void {
    const level = status === 'error' ? LogLevel.ERROR : LogLevel.INFO;

    this.log(
      level,
      `API ${operation} ${status}`,
      {
        ...context,
        provider,
        operation,
        duration
      },
      service
    );
  }

  /**
   * Log protection events
   */
  protection(
    event: string,
    sessionId: string,
    blocked: boolean,
    reason: string,
    context: Record<string, any> = {},
    service: string = 'ProtectionService'
  ): void {
    const level = blocked ? LogLevel.WARN : LogLevel.INFO;

    this.log(
      level,
      `Protection ${event}: ${blocked ? 'BLOCKED' : 'ALLOWED'}`,
      {
        ...context,
        sessionId,
        blocked,
        reason
      },
      service
    );
  }

  /**
   * Log validation errors
   */
  validation(
    toolName: string,
    errors: Array<{ field: string; message: string }>,
    context: Record<string, any> = {},
    service: string = 'ValidationService'
  ): void {
    this.warn(
      `Validation failed for ${toolName}`,
      {
        ...context,
        toolName,
        errorCount: errors.length,
        errors
      },
      service
    );
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context: Record<string, any> = {},
    service: string = 'App',
    error?: Error
  ): void {
    // Check if we should log this level
    if (level < this.config.level) {
      return;
    }

    // Create log entry
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      levelName: LogLevel[level],
      message,
      service,
      context,
      sessionId: context.sessionId,
      toolName: context.toolName,
      userId: context.userId,
      metadata: context.metadata
    };

    // Add error info if present
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.config.includeStackTrace ? error.stack : undefined
      };
    }

    // Add to log buffer
    this.logs.push(entry);

    // Limit log buffer size (keep last 10,000 entries)
    if (this.logs.length > 10000) {
      this.logs = this.logs.slice(-5000);
    }

    // Output to console
    if (this.config.outputToConsole) {
      this.outputToConsole(entry);
    }

    // Output to file
    if (this.config.outputToFile) {
      this.outputToFile(entry).catch(err => {
        console.error('[Logger] Failed to write to file:', err);
      });
    }
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    const timestamp = this.formatTimestamp(entry.timestamp);
    const level = entry.levelName.padEnd(8);
    const service = entry.service.padEnd(20);
    const context = this.formatContext(entry.context, entry.error);

    const logLine = `[${timestamp}] [${level}] [${service}] ${entry.message}${context}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logLine);
        break;
      case LogLevel.INFO:
        console.info(logLine);
        break;
      case LogLevel.WARN:
        console.warn(logLine);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(logLine);
        break;
    }
  }

  /**
   * Output log entry to file
   */
  private async outputToFile(entry: LogEntry): Promise<void> {
    // This would require fs/promises
    // For now, we'll just format the entry
    const line = JSON.stringify(entry) + '\n';
    // TODO: Implement file writing with rotation
  }

  /**
   * Format timestamp
   */
  private formatTimestamp(timestamp: number): string {
    switch (this.config.timestampFormat) {
      case 'iso':
        return new Date(timestamp).toISOString();
      case 'unix':
        return Math.floor(timestamp / 1000).toString();
      case 'relative':
        return `${Math.floor((timestamp - this.startTime) / 1000)}s`;
      default:
        return new Date(timestamp).toISOString();
    }
  }

  /**
   * Format context for output
   */
  private formatContext(
    context: Record<string, any> = {},
    error?: LogEntry['error']
  ): string {
    const parts: string[] = [];

    // Add context keys
    if (Object.keys(context).length > 0) {
      const ctx = this.config.prettyPrint
        ? JSON.stringify(context, null, 2)
        : JSON.stringify(context);
      parts.push(`\nContext: ${ctx}`);
    }

    // Add error info
    if (error) {
      parts.push(`\nError: ${error.message}`);
      if (error.stack && this.config.includeStackTrace) {
        parts.push(`\nStack: ${error.stack}`);
      }
    }

    return parts.join('');
  }

  /**
   * Get recent logs
   */
  getLogs(limit: number = 100): LogEntry[] {
    return this.logs.slice(-limit);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs by service
   */
  getLogsByService(service: string): LogEntry[] {
    return this.logs.filter(log => log.service === service);
  }

  /**
   * Get logs by session ID
   */
  getLogsBySession(sessionId: string): LogEntry[] {
    return this.logs.filter(log => log.sessionId === sessionId);
  }

  /**
   * Get logs by tool name
   */
  getLogsByTool(toolName: string): LogEntry[] {
    return this.logs.filter(log => log.toolName === toolName);
  }

  /**
   * Search logs by message
   */
  searchLogs(query: string): LogEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.logs.filter(log =>
      log.message.toLowerCase().includes(lowerQuery) ||
      JSON.stringify(log.context || {}).toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get log statistics
   */
  getStats(): {
    total: number;
    byLevel: Record<string, number>;
    byService: Record<string, number>;
    errors: number;
    warnings: number;
    timeSpan: {
      start: number;
      end: number;
      duration: number;
    };
  } {
    const byLevel: Record<string, number> = {};
    const byService: Record<string, number> = {};
    let errors = 0;
    let warnings = 0;

    for (const log of this.logs) {
      byLevel[log.levelName] = (byLevel[log.levelName] || 0) + 1;
      byService[log.service] = (byService[log.service] || 0) + 1;

      if (log.level >= LogLevel.ERROR) errors++;
      if (log.level === LogLevel.WARN) warnings++;
    }

    const timestamps = this.logs.map(l => l.timestamp);
    const start = timestamps.length > 0 ? Math.min(...timestamps) : Date.now();
    const end = timestamps.length > 0 ? Math.max(...timestamps) : Date.now();

    return {
      total: this.logs.length,
      byLevel,
      byService,
      errors,
      warnings,
      timeSpan: {
        start,
        end,
        duration: end - start
      }
    };
  }

  /**
   * Export logs to JSON
   */
  exportToJSON(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Export logs to NDJSON (newline-delimited JSON)
   */
  exportToNDJSON(): string {
    return this.logs.map(log => JSON.stringify(log)).join('\n');
  }

  /**
   * Clear log buffer
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Set minimum log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Create child logger with service context
   */
  child(service: string): Pick<Logger, 'debug' | 'info' | 'warn' | 'error' | 'critical'> {
    return {
      debug: (message: string, context?: Record<string, any>) =>
        this.debug(message, context, service),
      info: (message: string, context?: Record<string, any>) =>
        this.info(message, context, service),
      warn: (message: string, context?: Record<string, any>) =>
        this.warn(message, context, service),
      error: (message: string, error?: Error, context?: Record<string, any>) =>
        this.error(message, error, context, service),
      critical: (message: string, error?: Error, context?: Record<string, any>) =>
        this.critical(message, error, context, service)
    };
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Convenience functions for common logging patterns
export const log = {
  session: logger.session.bind(logger),
  tool: logger.tool.bind(logger),
  api: logger.api.bind(logger),
  protection: logger.protection.bind(logger),
  validation: logger.validation.bind(logger)
};
