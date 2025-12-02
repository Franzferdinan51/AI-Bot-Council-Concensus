import { AuthorType, SessionMode } from '../types/index.js';

export interface CostRecord {
  id: string;
  sessionId?: string;
  timestamp: number;
  provider: AuthorType;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  duration: number;
  botId?: string;
  botName?: string;
  status: 'success' | 'error';
  errorMessage?: string;
}

export interface SessionCostSummary {
  sessionId: string;
  totalCost: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  apiCallCount: number;
  providerBreakdown: Map<AuthorType, {
    cost: number;
    tokens: number;
    calls: number;
  }>;
  modeBreakdown: Map<SessionMode, {
    cost: number;
    tokens: number;
    calls: number;
  }>;
  duration: number;
  startTime: number;
  endTime: number;
}

export interface BudgetAlert {
  id: string;
  threshold: number;
  currentSpend: number;
  percentage: number;
  triggered: boolean;
  lastTriggered?: number;
}

export interface CostReport {
  totalCost: number;
  totalTokens: number;
  totalCalls: number;
  averageCostPerCall: number;
  providerStats: Map<AuthorType, {
    cost: number;
    tokens: number;
    calls: number;
    percentage: number;
    avgCost: number;
  }>;
  modelStats: Map<string, {
    cost: number;
    tokens: number;
    calls: number;
  }>;
  dailyUsage: Map<string, {
    cost: number;
    tokens: number;
    calls: number;
  }>;
  budgetProgress: {
    budgetLimit?: number;
    currentSpend: number;
    percentage: number;
    remaining: number;
  };
  sessionBreakdown: SessionCostSummary[];
}

/**
 * Real-Time Cost Tracking Service
 *
 * Tracks API costs across all providers, monitors budgets, and generates cost reports.
 * Integrates with council sessions for per-session cost analysis.
 */
export class CostTrackingService {
  private records: Map<string, CostRecord> = new Map();
  private sessionSummaries: Map<string, SessionCostSummary> = new Map();
  private budgets: Map<string, BudgetAlert> = new Map();
  private globalBudget?: number;

  // Model pricing database (per 1K tokens)
  private modelPricing: Map<string, {
    input: number;
    output: number;
    provider: AuthorType;
  }> = new Map();

  constructor() {
    this.initializeModelPricing();
  }

  private initializeModelPricing() {
    // Gemini pricing (approximate, as of 2024)
    this.modelPricing.set('gemini-2.5-flash', { input: 0.00015, output: 0.0006, provider: AuthorType.GEMINI });
    this.modelPricing.set('gemini-pro', { input: 0.0005, output: 0.0015, provider: AuthorType.GEMINI });

    // OpenRouter pricing (approximate, varies by model)
    this.modelPricing.set('anthropic/claude-3.5-sonnet', { input: 0.003, output: 0.015, provider: AuthorType.OPENROUTER });
    this.modelPricing.set('anthropic/claude-3-haiku', { input: 0.00025, output: 0.00125, provider: AuthorType.OPENROUTER });
    this.modelPricing.set('openai/gpt-4o-mini', { input: 0.00015, output: 0.0006, provider: AuthorType.OPENROUTER });
    this.modelPricing.set('google/gemma-2-9b-it', { input: 0.0002, output: 0.0002, provider: AuthorType.OPENROUTER });
    this.modelPricing.set('meta-llama/llama-3.1-70b-instruct', { input: 0.0009, output: 0.0009, provider: AuthorType.OPENROUTER });
    this.modelPricing.set('mistralai/mistral-large', { input: 0.004, output: 0.012, provider: AuthorType.OPENROUTER });
    this.modelPricing.set('microsoft/phi-3-medium-128k-instruct', { input: 0.0005, output: 0.0005, provider: AuthorType.OPENROUTER });
    this.modelPricing.set('x-ai/grok-beta', { input: 0.005, output: 0.015, provider: AuthorType.OPENROUTER });

    // Other providers (often local, cost varies)
    this.modelPricing.set('gpt-3.5-turbo', { input: 0.0005, output: 0.0015, provider: AuthorType.OPENAI_COMPATIBLE });
    this.modelPricing.set('gpt-4', { input: 0.03, output: 0.06, provider: AuthorType.OPENAI_COMPATIBLE });
    this.modelPricing.set('llama-2-7b', { input: 0, output: 0, provider: AuthorType.LM_STUDIO }); // Local, no API cost
    this.modelPricing.set('llama-2-13b', { input: 0, output: 0, provider: AuthorType.LM_STUDIO }); // Local, no API cost
    this.modelPricing.set('codellama', { input: 0, output: 0, provider: AuthorType.OLLAMA }); // Local, no API cost
    this.modelPricing.set('mistral', { input: 0, output: 0, provider: AuthorType.OLLAMA }); // Local, no API cost

    // Add generic fallback
    this.modelPricing.set('default', { input: 0.001, output: 0.002, provider: AuthorType.OPENAI_COMPATIBLE });
  }

  /**
   * Start tracking a new API call
   */
  startCall(
    sessionId: string | undefined,
    botId: string | undefined,
    botName: string | undefined,
    provider: AuthorType,
    model: string
  ): string {
    const id = `cost-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const record: CostRecord = {
      id,
      sessionId,
      timestamp: Date.now(),
      provider,
      model,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      cost: 0,
      duration: 0,
      botId,
      botName,
      status: 'success'
    };

    this.records.set(id, record);

    // Initialize session summary if needed
    if (sessionId) {
      this.initializeSessionSummary(sessionId);
    }

    return id;
  }

  /**
   * Complete tracking an API call
   */
  completeCall(
    callId: string,
    promptTokens: number,
    completionTokens: number,
    status: 'success' | 'error' = 'success',
    errorMessage?: string
  ): void {
    const record = this.records.get(callId);
    if (!record) return;

    record.promptTokens = promptTokens;
    record.completionTokens = completionTokens;
    record.totalTokens = promptTokens + completionTokens;
    record.duration = Date.now() - record.timestamp;
    record.status = status;
    record.errorMessage = errorMessage;

    // Calculate cost
    const pricing = this.getPricingForModel(record.model);
    const cost = (promptTokens / 1000) * pricing.input + (completionTokens / 1000) * pricing.output;
    record.cost = cost;

    this.records.set(callId, record);

    // Update session summary
    if (record.sessionId) {
      this.updateSessionSummary(record);
    }

    // Check budget alerts
    this.checkBudgetAlerts();
  }

  /**
   * Get pricing for a model
   */
  private getPricingForModel(model: string): { input: number; output: number } {
    return this.modelPricing.get(model) || this.modelPricing.get('default')!;
  }

  /**
   * Initialize session summary
   */
  private initializeSessionSummary(sessionId: string): void {
    if (this.sessionSummaries.has(sessionId)) return;

    const summary: SessionCostSummary = {
      sessionId,
      totalCost: 0,
      totalTokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      apiCallCount: 0,
      providerBreakdown: new Map(),
      modeBreakdown: new Map(),
      duration: 0,
      startTime: Date.now(),
      endTime: Date.now()
    };

    this.sessionSummaries.set(sessionId, summary);
  }

  /**
   * Update session summary with a cost record
   */
  private updateSessionSummary(record: CostRecord): void {
    const summary = this.sessionSummaries.get(record.sessionId!);
    if (!summary) return;

    summary.totalCost += record.cost;
    summary.totalTokens += record.totalTokens;
    summary.promptTokens += record.promptTokens;
    summary.completionTokens += record.completionTokens;
    summary.apiCallCount += 1;
    summary.endTime = record.timestamp;

    // Update provider breakdown
    const provider = record.provider;
    const providerStats = summary.providerBreakdown.get(provider) || { cost: 0, tokens: 0, calls: 0 };
    providerStats.cost += record.cost;
    providerStats.tokens += record.totalTokens;
    providerStats.calls += 1;
    summary.providerBreakdown.set(provider, providerStats);

    // Note: mode breakdown would need to be passed in separately or inferred
  }

  /**
   * Set budget alert threshold
   */
  setBudgetAlert(id: string, threshold: number): void {
    this.budgets.set(id, {
      id,
      threshold,
      currentSpend: this.getCurrentTotalCost(),
      percentage: 0,
      triggered: false
    });
  }

  /**
   * Set global budget limit
   */
  setGlobalBudget(limit: number): void {
    this.globalBudget = limit;
  }

  /**
   * Get current total cost across all records
   */
  getCurrentTotalCost(): number {
    let total = 0;
    for (const record of this.records.values()) {
      total += record.cost;
    }
    return total;
  }

  /**
   * Get current total tokens
   */
  getCurrentTotalTokens(): number {
    let total = 0;
    for (const record of this.records.values()) {
      total += record.totalTokens;
    }
    return total;
  }

  /**
   * Check budget alerts
   */
  private checkBudgetAlerts(): void {
    const currentSpend = this.getCurrentTotalCost();

    for (const alert of this.budgets.values()) {
      alert.currentSpend = currentSpend;
      alert.percentage = (currentSpend / alert.threshold) * 100;

      if (!alert.triggered && alert.percentage >= 80) {
        alert.triggered = true;
        alert.lastTriggered = Date.now();
        console.error(`[COST TRACKING] ⚠️ Budget alert triggered: ${alert.percentage.toFixed(1)}% of ${alert.threshold.toFixed(2)}`);
      }
    }

    if (this.globalBudget) {
      const percentage = (currentSpend / this.globalBudget) * 100;
      if (percentage >= 80) {
        console.error(`[COST TRACKING] ⚠️ Global budget warning: ${percentage.toFixed(1)}% of ${this.globalBudget.toFixed(2)}`);
      }
    }
  }

  /**
   * Get session cost summary
   */
  getSessionCostSummary(sessionId: string): SessionCostSummary | undefined {
    return this.sessionSummaries.get(sessionId);
  }

  /**
   * Get all session summaries
   */
  getAllSessionSummaries(): SessionCostSummary[] {
    return Array.from(this.sessionSummaries.values());
  }

  /**
   * Generate comprehensive cost report
   */
  generateCostReport(days: number = 30): CostReport {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const recentRecords = Array.from(this.records.values())
      .filter(r => r.timestamp >= cutoff);

    const totalCost = recentRecords.reduce((sum, r) => sum + r.cost, 0);
    const totalTokens = recentRecords.reduce((sum, r) => sum + r.totalTokens, 0);
    const totalCalls = recentRecords.length;

    // Provider statistics
    const providerStats = new Map<AuthorType, any>();
    const modelStats = new Map<string, any>();

    for (const record of recentRecords) {
      // Provider stats
      const provider = record.provider;
      const pStats = providerStats.get(provider) || { cost: 0, tokens: 0, calls: 0 };
      pStats.cost += record.cost;
      pStats.tokens += record.totalTokens;
      pStats.calls += 1;
      providerStats.set(provider, pStats);

      // Model stats
      const modelKey = `${record.provider}:${record.model}`;
      const mStats = modelStats.get(modelKey) || { cost: 0, tokens: 0, calls: 0 };
      mStats.cost += record.cost;
      mStats.tokens += record.totalTokens;
      mStats.calls += 1;
      modelStats.set(modelKey, mStats);
    }

    // Calculate percentages and averages
    for (const [provider, stats] of providerStats.entries()) {
      stats.percentage = totalCost > 0 ? (stats.cost / totalCost) * 100 : 0;
      stats.avgCost = stats.calls > 0 ? stats.cost / stats.calls : 0;
      providerStats.set(provider, stats);
    }

    // Daily usage
    const dailyUsage = new Map<string, any>();
    for (const record of recentRecords) {
      const date = new Date(record.timestamp).toISOString().split('T')[0];
      const dayStats = dailyUsage.get(date) || { cost: 0, tokens: 0, calls: 0 };
      dayStats.cost += record.cost;
      dayStats.tokens += record.totalTokens;
      dayStats.calls += 1;
      dailyUsage.set(date, dayStats);
    }

    // Budget progress
    const currentSpend = this.getCurrentTotalCost();
    const budgetProgress = {
      budgetLimit: this.globalBudget,
      currentSpend,
      percentage: this.globalBudget ? (currentSpend / this.globalBudget) * 100 : 0,
      remaining: this.globalBudget ? this.globalBudget - currentSpend : 0
    };

    return {
      totalCost,
      totalTokens,
      totalCalls,
      averageCostPerCall: totalCalls > 0 ? totalCost / totalCalls : 0,
      providerStats,
      modelStats,
      dailyUsage,
      budgetProgress,
      sessionBreakdown: this.getAllSessionSummaries()
    };
  }

  /**
   * Export cost data as JSON
   */
  exportCostData(): string {
    return JSON.stringify({
      records: Array.from(this.records.values()),
      sessionSummaries: Array.from(this.sessionSummaries.values()),
      budgets: Array.from(this.budgets.values()),
      globalBudget: this.globalBudget
    }, null, 2);
  }

  /**
   * Get cost trends over time
   */
  getCostTrends(days: number = 7): Array<{
    date: string;
    cost: number;
    tokens: number;
    calls: number;
  }> {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const recentRecords = Array.from(this.records.values())
      .filter(r => r.timestamp >= cutoff);

    // Group by day
    const dayGroups: Map<string, CostRecord[]> = new Map();
    for (const record of recentRecords) {
      const date = new Date(record.timestamp).toISOString().split('T')[0];
      const group = dayGroups.get(date) || [];
      group.push(record);
      dayGroups.set(date, group);
    }

    // Calculate metrics per day
    const trends: Array<{ date: string; cost: number; tokens: number; calls: number }> = [];
    for (const [date, records] of dayGroups.entries()) {
      const cost = records.reduce((sum, r) => sum + r.cost, 0);
      const tokens = records.reduce((sum, r) => sum + r.totalTokens, 0);
      trends.push({ date, cost, tokens, calls: records.length });
    }

    return trends.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Reset all cost tracking data
   */
  reset(): void {
    this.records.clear();
    this.sessionSummaries.clear();
    this.budgets.clear();
    console.error('[COST TRACKING] All cost data reset');
  }

  /**
   * Add or update model pricing
   */
  updateModelPricing(model: string, pricing: { input: number; output: number }, provider: AuthorType): void {
    this.modelPricing.set(model, { input: pricing.input, output: pricing.output, provider });
    console.error(`[COST TRACKING] Updated pricing for ${model}: $${pricing.input}/1K input, $${pricing.output}/1K output`);
  }
}

// Export singleton instance
export const costTrackingService = new CostTrackingService();
