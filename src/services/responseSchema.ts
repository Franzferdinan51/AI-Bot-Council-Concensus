/**
 * Unified Response Schema Service
 * Standardizes all MCP tool responses with consistent formatting
 */

export interface UnifiedResponse {
  status: 'success' | 'error' | 'warning';
  tool: string;
  timestamp: number;
  executionTime: number;
  sessionId?: string;
  data: any;
  metadata?: {
    tokenCount?: number;
    rounds?: number;
    messages?: number;
    provider?: string;
    model?: string;
    totalCount?: number;
    limit?: number;
    offset?: number;
    enabledCount?: number;
    consensusScore?: number;
    yeas?: number;
    nays?: number;
    confidence?: number;
    codeFileCount?: number;
  };
  errors?: ValidationError[];
  warnings?: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface SuccessResponse<T = any> extends UnifiedResponse {
  status: 'success';
  data: T;
}

export interface ErrorResponse extends UnifiedResponse {
  status: 'error';
  data: {
    errorType: string;
    message: string;
    details?: any;
  };
  errors: ValidationError[];
}

export interface WarningResponse<T = any> extends UnifiedResponse {
  status: 'warning';
  data: T;
  warnings: string[];
}

export class ResponseSchemaService {
  private static instance: ResponseSchemaService;

  private constructor() {}

  static getInstance(): ResponseSchemaService {
    if (!ResponseSchemaService.instance) {
      ResponseSchemaService.instance = new ResponseSchemaService();
    }
    return ResponseSchemaService.instance;
  }

  /**
   * Create a unified success response
   */
  success<T>(
    toolName: string,
    data: T,
    options: {
      sessionId?: string;
      metadata?: Record<string, any>;
      executionTime?: number;
    } = {}
  ): SuccessResponse<T> {
    const executionTime = options.executionTime || this.getCurrentExecutionTime();

    return {
      status: 'success',
      tool: toolName,
      timestamp: Date.now(),
      executionTime,
      sessionId: options.sessionId,
      data,
      metadata: options.metadata
    };
  }

  /**
   * Create a unified error response
   */
  error(
    toolName: string,
    errorType: string,
    message: string,
    options: {
      sessionId?: string;
      details?: any;
      errors?: ValidationError[];
      executionTime?: number;
    } = {}
  ): ErrorResponse {
    const executionTime = options.executionTime || this.getCurrentExecutionTime();

    return {
      status: 'error',
      tool: toolName,
      timestamp: Date.now(),
      executionTime,
      sessionId: options.sessionId,
      data: {
        errorType,
        message,
        details: options.details
      },
      errors: options.errors || [{
        field: 'general',
        message,
        code: errorType
      }]
    };
  }

  /**
   * Create a unified warning response
   */
  warning<T>(
    toolName: string,
    data: T,
    warnings: string[],
    options: {
      sessionId?: string;
      metadata?: Record<string, any>;
      executionTime?: number;
    } = {}
  ): WarningResponse<T> {
    const executionTime = options.executionTime || this.getCurrentExecutionTime();

    return {
      status: 'warning',
      tool: toolName,
      timestamp: Date.now(),
      executionTime,
      sessionId: options.sessionId,
      data,
      metadata: options.metadata,
      warnings
    };
  }

  /**
   * Create validation error response (convenience method)
   */
  validationError(
    toolName: string,
    errors: ValidationError[],
    options: {
      sessionId?: string;
      executionTime?: number;
    } = {}
  ): ErrorResponse {
    const executionTime = options.executionTime || this.getCurrentExecutionTime();

    return {
      status: 'error',
      tool: toolName,
      timestamp: Date.now(),
      executionTime,
      sessionId: options.sessionId,
      data: {
        errorType: 'VALIDATION_ERROR',
        message: 'Input validation failed',
        details: { errorCount: errors.length }
      },
      errors
    };
  }

  /**
   * Create session summary response
   */
  sessionSummary(
    toolName: string,
    sessionData: any,
    options: {
      executionTime?: number;
      includeMessages?: boolean;
    } = {}
  ): SuccessResponse<any> {
    const executionTime = options.executionTime || this.getCurrentExecutionTime();

    const data: any = {
      sessionId: sessionData.id,
      topic: sessionData.topic,
      mode: sessionData.mode,
      status: sessionData.status,
      messageCount: sessionData.messages?.length || 0,
      createdAt: sessionData.createdAt,
      updatedAt: sessionData.updatedAt
    };

    // Conditionally include messages
    if (options.includeMessages && sessionData.messages) {
      data.messages = sessionData.messages;
    }

    // Include vote data if available
    if (sessionData.voteData) {
      data.voteData = sessionData.voteData;
    }

    // Include prediction data if available
    if (sessionData.predictionData) {
      data.predictionData = sessionData.predictionData;
    }

    // Include code files if available
    if (sessionData.codeFiles) {
      data.codeFiles = sessionData.codeFiles;
    }

    return {
      status: 'success',
      tool: toolName,
      timestamp: Date.now(),
      executionTime,
      sessionId: sessionData.id,
      data,
      metadata: {
        rounds: sessionData.roundCount,
        messages: sessionData.messages?.length || 0
      }
    };
  }

  /**
   * Create list response (for lists of items)
   */
  list<T>(
    toolName: string,
    items: T[],
    options: {
      sessionId?: string;
      metadata?: {
        totalCount?: number;
        limit?: number;
        offset?: number;
      };
      executionTime?: number;
    } = {}
  ): SuccessResponse<{
    items: T[];
    totalCount: number;
    metadata?: any;
  }> {
    const executionTime = options.executionTime || this.getCurrentExecutionTime();

    return {
      status: 'success',
      tool: toolName,
      timestamp: Date.now(),
      executionTime,
      sessionId: options.sessionId,
      data: {
        items,
        totalCount: items.length,
        metadata: options.metadata
      },
      metadata: {
        totalCount: items.length,
        ...options.metadata
      }
    };
  }

  /**
   * Create council session result response
   */
  councilResult(
    toolName: string,
    result: any,
    options: {
      sessionId?: string;
      executionTime?: number;
    } = {}
  ): SuccessResponse<any> {
    const executionTime = options.executionTime || this.getCurrentExecutionTime();

    // Extract metadata from result
    const metadata: Record<string, any> = {
      messageCount: result.messages?.length || 0
    };

    if (result.voteData) {
      metadata.consensusScore = result.voteData.consensusScore;
      metadata.yeas = result.voteData.yeas;
      metadata.nays = result.voteData.nays;
    }

    if (result.predictionData) {
      metadata.confidence = result.predictionData.confidence;
    }

    if (result.codeFiles) {
      metadata.codeFileCount = result.codeFiles.length;
    }

    return {
      status: 'success',
      tool: toolName,
      timestamp: Date.now(),
      executionTime,
      sessionId: options.sessionId,
      data: {
        summary: result.summary,
        consensusLabel: result.consensusLabel,
        messages: result.messages,
        voteData: result.voteData,
        predictionData: result.predictionData,
        codeFiles: result.codeFiles
      },
      metadata
    };
  }

  /**
   * Create bot configuration response
   */
  botConfig(
    toolName: string,
    bots: any[],
    options: {
      executionTime?: number;
    } = {}
  ): SuccessResponse<{
    bots: any[];
    totalCount: number;
    enabledCount: number;
  }> {
    const executionTime = options.executionTime || this.getCurrentExecutionTime();
    const enabledCount = bots.filter(b => b.enabled).length;

    return {
      status: 'success',
      tool: toolName,
      timestamp: Date.now(),
      executionTime,
      data: {
        bots,
        totalCount: bots.length,
        enabledCount
      },
      metadata: {
        totalCount: bots.length,
        enabledCount
      }
    };
  }

  /**
   * Convert response to MCP-compatible format
   */
  toMCPResponse(unifiedResponse: UnifiedResponse): {
    content: Array<{ type: 'text'; text: string }>;
  } {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(unifiedResponse, null, 2)
        }
      ]
    };
  }

  /**
   * Get or create execution time marker
   * This should be called at the start of tool execution
   */
  startExecution(): number {
    return Date.now();
  }

  /**
   * Calculate execution time from marker
   */
  private getCurrentExecutionTime(): number {
    // In a real implementation, you'd track this per-request
    // For now, return a default
    return 0;
  }

  /**
   * Create a standardized API response wrapper
   */
  wrap<T>(
    toolName: string,
    fn: () => Promise<T>,
    options: {
      sessionId?: string;
      catchErrors?: boolean;
    } = {}
  ): Promise<SuccessResponse<T> | ErrorResponse> {
    const startTime = this.startExecution();

    return fn()
      .then(data => {
        const executionTime = Date.now() - startTime;
        return this.success(toolName, data, {
          sessionId: options.sessionId,
          executionTime
        });
      })
      .catch(error => {
        const executionTime = Date.now() - startTime;

        if (options.catchErrors !== false) {
          return this.error(
            toolName,
            error.name || 'UNKNOWN_ERROR',
            error.message,
            {
              sessionId: options.sessionId,
              details: error.stack,
              executionTime
            }
          );
        }

        throw error;
      });
  }
}

// Export singleton instance
export const responseSchema = ResponseSchemaService.getInstance();
