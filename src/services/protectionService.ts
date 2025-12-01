/**
 * Protection Service
 * Prevents recursion, runaway loops, and excessive API calls
 */

export interface ProtectionConfig {
  maxRecursionDepth: number;
  minCallCooldown: number;
  maxRoundsPerSession: number;
  maxMessagesPerRound: number;
  maxTokensPerMessage: number;
}

export interface RecursionContext {
  sessionId: string;
  currentDepth: number;
  callStack: string[];
  lastCallTime: number;
  roundCount: number;
  messageCount: number;
  totalTokens: number;
}

export interface CallRecord {
  timestamp: number;
  toolName: string;
  sessionId: string;
  argsHash: string;
}

export class ProtectionService {
  private static instance: ProtectionService;
  private contexts: Map<string, RecursionContext> = new Map();
  private callHistory: CallRecord[] = [];
  private config: ProtectionConfig;

  private constructor() {
    this.config = {
      maxRecursionDepth: 3,
      minCallCooldown: 500, // 500ms between similar calls
      maxRoundsPerSession: 20,
      maxMessagesPerRound: 10,
      maxTokensPerMessage: 4000
    };
  }

  static getInstance(): ProtectionService {
    if (!ProtectionService.instance) {
      ProtectionService.instance = new ProtectionService();
    }
    return ProtectionService.instance;
  }

  /**
   * Start tracking a session
   */
  startSession(sessionId: string): void {
    this.contexts.set(sessionId, {
      sessionId,
      currentDepth: 0,
      callStack: [],
      lastCallTime: 0,
      roundCount: 0,
      messageCount: 0,
      totalTokens: 0
    });
  }

  /**
   * End tracking a session
   */
  endSession(sessionId: string): void {
    this.contexts.delete(sessionId);
  }

  /**
   * Check if a tool call is allowed
   */
  checkCallAllowed(
    sessionId: string,
    toolName: string,
    args: any,
    estimatedTokens: number = 0
  ): { allowed: boolean; reason?: string } {
    const context = this.contexts.get(sessionId);

    // If no context exists, start one
    if (!context) {
      this.startSession(sessionId);
      return { allowed: true };
    }

    // Check max recursion depth
    if (context.currentDepth >= this.config.maxRecursionDepth) {
      return {
        allowed: false,
        reason: `Maximum recursion depth (${this.config.maxRecursionDepth}) exceeded`
      };
    }

    // Check max rounds
    if (context.roundCount >= this.config.maxRoundsPerSession) {
      return {
        allowed: false,
        reason: `Maximum rounds per session (${this.config.maxRoundsPerSession}) exceeded`
      };
    }

    // Check max messages per round
    if (context.messageCount >= this.config.maxMessagesPerRound) {
      return {
        allowed: false,
        reason: `Maximum messages per round (${this.config.maxMessagesPerRound}) exceeded`
      };
    }

    // Check max tokens per message
    if (estimatedTokens > this.config.maxTokensPerMessage) {
      return {
        allowed: false,
        reason: `Message exceeds token limit (${this.config.maxTokensPerMessage})`
      };
    }

    // Check cooldown for similar calls
    const argsHash = this.hashArgs(args);
    const recentCall = this.findRecentCall(toolName, sessionId, argsHash);

    if (recentCall) {
      const timeSinceLastCall = Date.now() - recentCall.timestamp;
      if (timeSinceLastCall < this.config.minCallCooldown) {
        return {
          allowed: false,
          reason: `Call cooldown active (${Math.ceil((this.config.minCallCooldown - timeSinceLastCall) / 1000)}s remaining)`
        };
      }
    }

    // Check for potential infinite loops (same call 3+ times in sequence)
    const recentSimilarCalls = this.callHistory.filter(
      c =>
        c.sessionId === sessionId &&
        c.toolName === toolName &&
        c.argsHash === argsHash &&
        Date.now() - c.timestamp < 5000 // last 5 seconds
    );

    if (recentSimilarCalls.length >= 3) {
      return {
        allowed: false,
        reason: `Potential infinite loop detected (${recentSimilarCalls.length} similar calls)`
      };
    }

    return { allowed: true };
  }

  /**
   * Record a tool call
   */
  recordCall(sessionId: string, toolName: string, args: any): void {
    const context = this.contexts.get(sessionId);

    if (context) {
      context.currentDepth++;
      context.callStack.push(toolName);
      context.lastCallTime = Date.now();
      context.messageCount++;
    }

    // Record in call history
    this.callHistory.push({
      timestamp: Date.now(),
      toolName,
      sessionId,
      argsHash: this.hashArgs(args)
    });

    // Clean old call history (keep last 1000 calls)
    if (this.callHistory.length > 1000) {
      this.callHistory = this.callHistory.slice(-1000);
    }
  }

  /**
   * Mark completion of a round
   */
  completeRound(sessionId: string): void {
    const context = this.contexts.get(sessionId);
    if (context) {
      context.roundCount++;
      context.messageCount = 0; // Reset message count for new round
    }
  }

  /**
   * Complete a tool call (decrement depth)
   */
  completeCall(sessionId: string): void {
    const context = this.contexts.get(sessionId);
    if (context && context.currentDepth > 0) {
      context.currentDepth--;
      context.callStack.pop();
    }
  }

  /**
   * Update token count for session
   */
  updateTokenCount(sessionId: string, tokens: number): void {
    const context = this.contexts.get(sessionId);
    if (context) {
      context.totalTokens += tokens;
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string) {
    const context = this.contexts.get(sessionId);
    if (!context) {
      return null;
    }

    return {
      sessionId: context.sessionId,
      currentDepth: context.currentDepth,
      roundCount: context.roundCount,
      messageCount: context.messageCount,
      totalTokens: context.totalTokens,
      callStack: [...context.callStack],
      timeSinceLastCall: Date.now() - context.lastCallTime
    };
  }

  /**
   * Reset session counters
   */
  resetSession(sessionId: string): void {
    const context = this.contexts.get(sessionId);
    if (context) {
      context.currentDepth = 0;
      context.callStack = [];
      context.roundCount = 0;
      context.messageCount = 0;
      context.totalTokens = 0;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ProtectionConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get current configuration
   */
  getConfig(): ProtectionConfig {
    return { ...this.config };
  }

  /**
   * Clean up old contexts
   */
  cleanup(maxAgeMs: number = 3600000): void {
    const now = Date.now();
    for (const [sessionId, context] of this.contexts.entries()) {
      if (now - context.lastCallTime > maxAgeMs) {
        this.contexts.delete(sessionId);
      }
    }
  }

  /**
   * Private helper: Find recent call matching criteria
   */
  private findRecentCall(
    toolName: string,
    sessionId: string,
    argsHash: string,
    windowMs: number = 5000
  ): CallRecord | null {
    const cutoff = Date.now() - windowMs;

    for (let i = this.callHistory.length - 1; i >= 0; i--) {
      const call = this.callHistory[i];
      if (call.timestamp < cutoff) {
        break; // Calls are in chronological order
      }

      if (
        call.toolName === toolName &&
        call.sessionId === sessionId &&
        call.argsHash === argsHash
      ) {
        return call;
      }
    }

    return null;
  }

  /**
   * Private helper: Generate hash of arguments
   */
  private hashArgs(args: any): string {
    try {
      // Simple hash function for arguments
      const str = JSON.stringify(args, Object.keys(args).sort());
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash.toString(36);
    } catch (e) {
      // If can't stringify, use a random hash
      return Math.random().toString(36).substring(2);
    }
  }
}

// Export singleton instance
export const protectionService = ProtectionService.getInstance();
