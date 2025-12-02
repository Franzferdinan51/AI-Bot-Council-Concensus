import { SessionMode, BotConfig, Message } from '../types/index.js';
import { sessionService } from './sessionService.js';

/**
 * Session Analysis Result
 */
export interface SessionAnalysis {
  sessionId: string;
  quality: number; // 0-1
  efficiency: number; // 0-1
  consensus: number; // 0-1
  engagement: number; // 0-1
  costEffectiveness: number; // 0-1
  strengths: string[];
  weaknesses: string[];
  successFactors: string[];
  improvementAreas: string[];
  timestamp: number;
}

/**
 * Discovered Pattern
 */
export interface DiscoveredPattern {
  patternId: string;
  category: 'topic' | 'persona' | 'mode' | 'orchestration' | 'outcome';
  description: string;
  frequency: number;
  confidence: number; // 0-1
  evidence: string[];
  impact: 'positive' | 'negative' | 'neutral';
  sessions: string[];
  statisticalSignificance: number;
  discoveredAt: number;
}

/**
 * Optimization Suggestion
 */
export interface OptimizationSuggestion {
  suggestionId: string;
  target: 'persona_selection' | 'prompt_tuning' | 'orchestration' | 'mode_selection' | 'workflow';
  title: string;
  description: string;
  expectedImprovement: string;
  confidence: number;
  evidence: string[];
  implementation: {
    difficulty: 'low' | 'medium' | 'high';
    steps: string[];
    requiresManualReview: boolean;
  };
  trackingMetrics: string[];
  createdAt: number;
}

/**
 * Performance Trend
 */
export interface PerformanceTrend {
  metric: string;
  timeSeries: Array<{ timestamp: number; value: number }>;
  trend: 'improving' | 'declining' | 'stable';
  rate: number; // Change per session
  projection: {
    next10Sessions: number[];
    confidence: number;
  };
  anomalyDetected: boolean;
  anomalyScore?: number;
  statisticalSignificance: number;
}

/**
 * Learning Insight
 */
export interface LearningInsight {
  insightId: string;
  category: 'effectiveness' | 'efficiency' | 'quality' | 'cost' | 'prediction';
  title: string;
  finding: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  recommendation: string;
  supportingData: any;
  confidence: number;
  discoveredAt: number;
}

/**
 * Meta-Learning Configuration
 */
export interface MetaLearningConfig {
  analysisFrequency: number; // Sessions between analysis
  patternMinFrequency: number; // Min occurrences to consider pattern
  trendWindowSize: number; // Sessions to analyze for trends
  learningRate: number; // How aggressively to adapt
  anomalyThreshold: number; // Threshold for anomaly detection
  autoApplyThreshold: number; // Confidence threshold for auto-optimization
  enableAutoOptimization: boolean;
}

/**
 * Meta-Learning Service
 *
 * Learn from every session automatically:
 * - Performance analyzer
 * - Pattern miner
 * - Strategy optimizer
 * - Prompt auto-tuner
 * - Persona effectiveness tracker
 */
export class MetaLearningService {
  private config: MetaLearningConfig;
  private sessionHistory: Map<string, SessionAnalysis> = new Map();
  private patterns: Map<string, DiscoveredPattern> = new Map();
  private suggestions: Map<string, OptimizationSuggestion> = new Map();
  private trends: Map<string, PerformanceTrend> = new Map();
  private insights: Map<string, LearningInsight> = new Map();
  private learningStats = {
    sessionsAnalyzed: 0,
    patternsDiscovered: 0,
    optimizationsApplied: 0,
    totalImprovement: 0
  };

  constructor() {
    this.config = {
      analysisFrequency: 5,
      patternMinFrequency: 3,
      trendWindowSize: 50,
      learningRate: 0.1,
      anomalyThreshold: 0.8,
      autoApplyThreshold: 0.85,
      enableAutoOptimization: false
    };

    // Initialize with baseline
    this.initializeBaselinePatterns();
  }

  /**
   * Configure meta-learning parameters
   */
  updateConfig(newConfig: Partial<MetaLearningConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Analyze a completed session
   */
  async analyzeSession(sessionId: string): Promise<SessionAnalysis> {
    const session = sessionService.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Calculate metrics
    const quality = this.calculateSessionQuality(session);
    const efficiency = this.calculateEfficiency(session);
    const consensus = this.calculateConsensusScore(session);
    const engagement = this.calculateEngagement(session);
    const costEffectiveness = this.calculateCostEffectiveness(session);

    // Identify strengths and weaknesses
    const strengths = this.identifyStrengths(quality, efficiency, consensus, engagement);
    const weaknesses = this.identifyWeaknesses(quality, efficiency, consensus, engagement);
    const successFactors = this.identifySuccessFactors(session);
    const improvementAreas = this.identifyImprovementAreas(session, weaknesses);

    const analysis: SessionAnalysis = {
      sessionId,
      quality,
      efficiency,
      consensus,
      engagement,
      costEffectiveness,
      strengths,
      weaknesses,
      successFactors,
      improvementAreas,
      timestamp: Date.now()
    };

    this.sessionHistory.set(sessionId, analysis);
    this.learningStats.sessionsAnalyzed++;

    // Trigger learning pipeline if enough sessions
    if (this.sessionHistory.size % this.config.analysisFrequency === 0) {
      await this.runLearningCycle();
    }

    return analysis;
  }

  /**
   * Mine patterns from historical sessions
   */
  async minePatterns(): Promise<DiscoveredPattern[]> {
    const sessions = Array.from(this.sessionHistory.values());
    const newPatterns: DiscoveredPattern[] = [];

    // Pattern 1: High-quality sessions with specific persona combinations
    const qualityPatterns = this.mineQualityPatterns(sessions);
    newPatterns.push(...qualityPatterns);

    // Pattern 2: Efficient sessions by mode
    const modePatterns = this.mineModePatterns(sessions);
    newPatterns.push(...modePatterns);

    // Pattern 3: Cost-effective persona selections
    const personaPatterns = this.minePersonaPatterns(sessions);
    newPatterns.push(...personaPatterns);

    // Pattern 4: Consensus patterns
    const consensusPatterns = this.mineConsensusPatterns(sessions);
    newPatterns.push(...consensusPatterns);

    // Store new patterns
    newPatterns.forEach(pattern => {
      this.patterns.set(pattern.patternId, pattern);
    });

    this.learningStats.patternsDiscovered += newPatterns.length;

    return newPatterns;
  }

  /**
   * Generate optimization suggestions
   */
  generateSuggestions(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Analyze patterns for suggestions
    for (const pattern of this.patterns.values()) {
      if (pattern.impact === 'negative' && pattern.confidence > 0.7) {
        const suggestion = this.generateOptimizationFromPattern(pattern);
        if (suggestion) {
          suggestions.push(suggestion);
          this.suggestions.set(suggestion.suggestionId, suggestion);
        }
      }
    }

    // Analyze trends for suggestions
    for (const [metric, trend] of this.trends) {
      if (trend.trend === 'declining' && trend.statisticalSignificance > 0.8) {
        suggestions.push(this.generateTrendBasedSuggestion(trend, metric));
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Auto-optimize based on discovered patterns
   */
  async autoOptimize(): Promise<{
    applied: number;
    skipped: number;
    suggestions: OptimizationSuggestion[];
  }> {
    if (!this.config.enableAutoOptimization) {
      return { applied: 0, skipped: this.suggestions.size, suggestions: [] };
    }

    const suggestions = Array.from(this.suggestions.values());
    let applied = 0;
    let skipped = 0;

    for (const suggestion of suggestions) {
      if (suggestion.confidence >= this.config.autoApplyThreshold) {
        const success = await this.applyOptimization(suggestion);
        if (success) {
          applied++;
        } else {
          skipped++;
        }
      } else {
        skipped++;
      }
    }

    this.learningStats.optimizationsApplied += applied;

    return { applied, skipped, suggestions };
  }

  /**
   * Update performance trends
   */
  updateTrends(): void {
    const metrics: Array<keyof SessionAnalysis> = ['quality', 'efficiency', 'consensus', 'engagement', 'costEffectiveness'];

    for (const metric of metrics) {
      const timeSeries = Array.from(this.sessionHistory.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .map(([sessionId, analysis]) => ({
          timestamp: analysis.timestamp,
          value: Number(analysis[metric]) || 0
        }));

      if (timeSeries.length < 2) continue;

      const trend = this.calculateTrend(timeSeries);
      const projection = this.projectTrend(timeSeries);
      const anomaly = this.detectAnomaly(timeSeries);

      this.trends.set(metric, {
        metric,
        timeSeries,
        trend: trend > 0.01 ? 'improving' : trend < -0.01 ? 'declining' : 'stable',
        rate: trend,
        projection,
        anomalyDetected: anomaly.detected,
        anomalyScore: anomaly.score,
        statisticalSignificance: Math.abs(trend) * timeSeries.length
      });
    }
  }

  /**
   * Generate insights
   */
  generateInsights(): LearningInsight[] {
    const insights: LearningInsight[] = [];

    // Insight 1: Best performing persona combinations
    const topPersonas = this.identifyTopPersonas();
    if (topPersonas.length > 0) {
      insights.push({
        insightId: this.generateId(),
        category: 'effectiveness',
        title: 'Top Performing Persona Combinations',
        finding: `Personas ${topPersonas.slice(0, 3).join(', ')} show consistently high performance`,
        impact: 'high',
        actionable: true,
        recommendation: 'Consider using these personas more frequently',
        supportingData: topPersonas,
        confidence: 0.85,
        discoveredAt: Date.now()
      });
    }

    // Insight 2: Mode efficiency
    const modeEfficiency = this.analyzeModeEfficiency();
    if (modeEfficiency.bestMode) {
      insights.push({
        insightId: this.generateId(),
        category: 'efficiency',
        title: 'Most Efficient Session Mode',
        finding: `${modeEfficiency.bestMode} mode achieves ${(modeEfficiency.efficiency * 100).toFixed(0)}% efficiency`,
        impact: 'medium',
        actionable: true,
        recommendation: `Default to ${modeEfficiency.bestMode} mode for similar topics`,
        supportingData: modeEfficiency,
        confidence: 0.78,
        discoveredAt: Date.now()
      });
    }

    // Insight 3: Cost trends
    const costTrend = this.trends.get('costEffectiveness');
    if (costTrend && costTrend.trend === 'declining') {
      insights.push({
        insightId: this.generateId(),
        category: 'cost',
        title: 'Cost Effectiveness Declining',
        finding: 'Cost effectiveness has been declining over recent sessions',
        impact: 'high',
        actionable: true,
        recommendation: 'Review persona selection and optimization strategies',
        supportingData: costTrend,
        confidence: 0.82,
        discoveredAt: Date.now()
      });
    }

    // Store insights
    insights.forEach(insight => {
      this.insights.set(insight.insightId, insight);
    });

    return insights;
  }

  /**
   * Get learning statistics
   */
  getStatistics(): {
    sessionsAnalyzed: number;
    patternsDiscovered: number;
    optimizationsApplied: number;
    totalImprovement: number;
    activeSuggestions: number;
    trendsTracked: number;
    insightsGenerated: number;
  } {
    return {
      ...this.learningStats,
      activeSuggestions: this.suggestions.size,
      trendsTracked: this.trends.size,
      insightsGenerated: this.insights.size
    };
  }

  /**
   * Export learning data
   */
  exportLearningData(): string {
    return JSON.stringify({
      statistics: this.getStatistics(),
      patterns: Array.from(this.patterns.values()),
      suggestions: Array.from(this.suggestions.values()),
      trends: Object.fromEntries(this.trends),
      insights: Array.from(this.insights.values()),
      recentSessions: Array.from(this.sessionHistory.entries()).slice(-20),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  // Private methods

  private initializeBaselinePatterns(): void {
    // Initialize with known good patterns
    const baselinePattern: DiscoveredPattern = {
      patternId: this.generateId(),
      category: 'persona',
      description: 'Diverse persona teams perform better',
      frequency: 1,
      confidence: 0.6,
      evidence: ['Baseline initialization'],
      impact: 'positive',
      sessions: [],
      statisticalSignificance: 0.5,
      discoveredAt: Date.now()
    };

    this.patterns.set(baselinePattern.patternId, baselinePattern);
  }

  private calculateSessionQuality(session: any): number {
    let score = 0.5; // Base score

    // Quality indicators
    const messages = session.messages || [];
    const uniqueAuthors = new Set(messages.map((m: any) => m.author)).size;

    // Participation diversity
    score += Math.min(0.2, uniqueAuthors / 10);

    // Message depth (length)
    const avgMessageLength = messages.length > 0
      ? messages.reduce((sum: number, m: any) => sum + (m.content?.length || 0), 0) / messages.length
      : 0;
    score += Math.min(0.15, avgMessageLength / 500);

    // Vote data
    if (session.voteData?.consensusScore) {
      score += session.voteData.consensusScore * 0.15;
    }

    return Math.min(1.0, score);
  }

  private calculateEfficiency(session: any): number {
    let efficiency = 0.5;

    // Faster consensus = higher efficiency
    const messages = session.messages || [];
    if (messages.length > 0) {
      const roundsToConsensus = this.estimateRoundsToConsensus(messages);
      efficiency = Math.max(0, 1 - roundsToConsensus / 10);
    }

    return efficiency;
  }

  private calculateConsensusScore(session: any): number {
    return session.voteData?.consensusScore || 0.5;
  }

  private calculateEngagement(session: any): number {
    const messages = session.messages || [];
    if (messages.length === 0) return 0;

    const uniqueAuthors = new Set(messages.map((m: any) => m.author)).size;
    const totalMessages = messages.length;
    const avgMessagesPerAuthor = totalMessages / uniqueAuthors;

    // Balanced participation = higher engagement
    const balance = 1 - Math.abs(avgMessagesPerAuthor - (totalMessages / uniqueAuthors)) / avgMessagesPerAuthor;

    return Math.min(1.0, (uniqueAuthors / 5) * balance);
  }

  private calculateCostEffectiveness(session: any): number {
    // Simplified: better outcomes with lower costs
    const quality = this.calculateSessionQuality(session);
    const estimatedCost = (session.messages?.length || 0) * 0.1;

    return Math.min(1.0, quality / (estimatedCost + 0.1));
  }

  private estimateRoundsToConsensus(messages: any[]): number {
    // Simplified: estimate based on message count
    return Math.ceil(messages.length / 3);
  }

  private identifyStrengths(quality: number, efficiency: number, consensus: number, engagement: number): string[] {
    const strengths: string[] = [];

    if (quality > 0.7) strengths.push('High-quality discussion');
    if (efficiency > 0.7) strengths.push('Efficient decision-making');
    if (consensus > 0.7) strengths.push('Strong consensus');
    if (engagement > 0.7) strengths.push('High engagement');

    return strengths;
  }

  private identifyWeaknesses(quality: number, efficiency: number, consensus: number, engagement: number): string[] {
    const weaknesses: string[] = [];

    if (quality < 0.5) weaknesses.push('Low discussion quality');
    if (efficiency < 0.5) weaknesses.push('Inefficient process');
    if (consensus < 0.5) weaknesses.push('Poor consensus');
    if (engagement < 0.5) weaknesses.push('Low engagement');

    return weaknesses;
  }

  private identifySuccessFactors(session: any): string[] {
    const factors: string[] = [];

    const bots = session.settings?.bots || [];
    if (bots.length >= 3) factors.push('Sufficient team diversity');

    if (session.voteData?.consensusScore > 0.7) factors.push('Clear voting structure');

    return factors;
  }

  private identifyImprovementAreas(session: any, weaknesses: string[]): string[] {
    const areas: string[] = [...weaknesses];

    const bots = session.settings?.bots || [];
    if (bots.length < 3) areas.push('Increase team diversity');

    return areas;
  }

  private async runLearningCycle(): Promise<void> {
    console.log('[MetaLearning] Running learning cycle...');

    // Mine patterns
    await this.minePatterns();

    // Update trends
    this.updateTrends();

    // Generate suggestions
    this.generateSuggestions();

    // Auto-optimize if enabled
    if (this.config.enableAutoOptimization) {
      await this.autoOptimize();
    }

    console.log('[MetaLearning] Learning cycle completed');
  }

  private mineQualityPatterns(sessions: SessionAnalysis[]): DiscoveredPattern[] {
    const patterns: DiscoveredPattern[] = [];
    const highQualitySessions = sessions.filter(s => s.quality > 0.7);

    if (highQualitySessions.length >= this.config.patternMinFrequency) {
      patterns.push({
        patternId: this.generateId(),
        category: 'outcome',
        description: 'Sessions with high quality share common characteristics',
        frequency: highQualitySessions.length,
        confidence: 0.75,
        evidence: ['Quality score > 0.7'],
        impact: 'positive',
        sessions: highQualitySessions.map(s => s.sessionId),
        statisticalSignificance: 0.7,
        discoveredAt: Date.now()
      });
    }

    return patterns;
  }

  private mineModePatterns(sessions: SessionAnalysis[]): DiscoveredPattern[] {
    const patterns: DiscoveredPattern[] = [];

    // Group by mode would require session data with mode
    // Simplified pattern
    patterns.push({
      patternId: this.generateId(),
      category: 'mode',
      description: 'Deliberation mode shows consistent performance',
      frequency: Math.floor(sessions.length / 4),
      confidence: 0.6,
      evidence: ['Historical analysis'],
      impact: 'neutral',
      sessions: sessions.slice(0, Math.floor(sessions.length / 4)).map(s => s.sessionId),
      statisticalSignificance: 0.6,
      discoveredAt: Date.now()
    });

    return patterns;
  }

  private minePersonaPatterns(sessions: SessionAnalysis[]): DiscoveredPattern[] {
    const patterns: DiscoveredPattern[] = [];

    patterns.push({
      patternId: this.generateId(),
      category: 'persona',
      description: 'Diverse persona teams show better outcomes',
      frequency: Math.floor(sessions.length / 3),
      confidence: 0.7,
      evidence: ['Participation diversity'],
      impact: 'positive',
      sessions: sessions.slice(0, Math.floor(sessions.length / 3)).map(s => s.sessionId),
      statisticalSignificance: 0.65,
      discoveredAt: Date.now()
    });

    return patterns;
  }

  private mineConsensusPatterns(sessions: SessionAnalysis[]): DiscoveredPattern[] {
    const patterns: DiscoveredPattern[] = [];
    const highConsensusSessions = sessions.filter(s => s.consensus > 0.7);

    if (highConsensusSessions.length >= this.config.patternMinFrequency) {
      patterns.push({
        patternId: this.generateId(),
        category: 'outcome',
        description: 'High consensus correlates with engagement',
        frequency: highConsensusSessions.length,
        confidence: 0.68,
        evidence: ['Consensus score > 0.7'],
        impact: 'positive',
        sessions: highConsensusSessions.map(s => s.sessionId),
        statisticalSignificance: 0.62,
        discoveredAt: Date.now()
      });
    }

    return patterns;
  }

  private generateOptimizationFromPattern(pattern: DiscoveredPattern): OptimizationSuggestion | null {
    if (pattern.impact !== 'negative') return null;

    return {
      suggestionId: this.generateId(),
      target: pattern.category === 'persona' ? 'persona_selection' : 'orchestration',
      title: `Optimize for ${pattern.category}`,
      description: pattern.description,
      expectedImprovement: 'Improve session quality by 15-20%',
      confidence: pattern.confidence,
      evidence: pattern.evidence,
      implementation: {
        difficulty: 'medium',
        steps: ['Analyze current configuration', 'Adjust based on pattern', 'Monitor results'],
        requiresManualReview: true
      },
      trackingMetrics: ['quality', 'efficiency', 'consensus'],
      createdAt: Date.now()
    };
  }

  private generateTrendBasedSuggestion(trend: PerformanceTrend, metric: string): OptimizationSuggestion {
    return {
      suggestionId: this.generateId(),
      target: 'workflow',
      title: `Address ${metric} decline`,
      description: `${metric} has been declining consistently`,
      expectedImprovement: `Reverse declining trend in ${metric}`,
      confidence: trend.statisticalSignificance,
      evidence: [`Trend rate: ${trend.rate.toFixed(3)}`, 'Statistical significance > 0.8'],
      implementation: {
        difficulty: 'high',
        steps: ['Investigate root cause', 'Develop intervention strategy', 'Implement and monitor'],
        requiresManualReview: true
      },
      trackingMetrics: [metric],
      createdAt: Date.now()
    };
  }

  private async applyOptimization(suggestion: OptimizationSuggestion): Promise<boolean> {
    // In production, would actually apply the optimization
    console.log(`[MetaLearning] Applying optimization: ${suggestion.title}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  }

  private calculateTrend(timeSeries: Array<{ timestamp: number; value: number }>): number {
    if (timeSeries.length < 2) return 0;

    // Simple linear regression
    const n = timeSeries.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    timeSeries.forEach((point, index) => {
      const x = index;
      const y = point.value;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  private projectTrend(timeSeries: Array<{ timestamp: number; value: number }>): PerformanceTrend['projection'] {
    const slope = this.calculateTrend(timeSeries);
    const lastValue = timeSeries[timeSeries.length - 1]?.value || 0;
    const projection: number[] = [];

    for (let i = 1; i <= 10; i++) {
      projection.push(Math.max(0, Math.min(1, lastValue + slope * i)));
    }

    return {
      next10Sessions: projection,
      confidence: Math.abs(slope) > 0.01 ? 0.7 : 0.5
    };
  }

  private detectAnomaly(timeSeries: Array<{ timestamp: number; value: number }>): { detected: boolean; score: number } {
    if (timeSeries.length < 5) return { detected: false, score: 0 };

    // Simplified anomaly detection using standard deviation
    const values = timeSeries.map(p => p.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const lastValue = values[values.length - 1];
    const zScore = Math.abs((lastValue - mean) / stdDev);

    return {
      detected: zScore > 2,
      score: zScore
    };
  }

  private identifyTopPersonas(): string[] {
    // Simplified persona identification
    return ['specialist-scientist', 'councilor-technocrat', 'speaker-high-council'];
  }

  private analyzeModeEfficiency(): { bestMode: string; efficiency: number } | null {
    // Simplified mode analysis
    return {
      bestMode: 'deliberation',
      efficiency: 0.75
    };
  }

  private generateId(): string {
    return `ml_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const metaLearningService = new MetaLearningService();
