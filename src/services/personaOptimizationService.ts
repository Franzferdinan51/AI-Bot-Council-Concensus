import { BotConfig, SessionMode } from '../types/index.js';
import { getBotsWithCustomConfigs } from '../types/constants.js';
import { costTrackingService } from './costTrackingService.js';
import { predictionTrackingService } from './predictionTrackingService.js';
import { sessionService } from './sessionService.js';

export interface PersonaPerformanceMetrics {
  botId: string;
  botName: string;
  role: string;
  topicExpertise: Map<string, {
    sessions: number;
    avgConfidence: number;
    successRate: number;
    costPerSession: number;
    effectiveness: number;
  }>;
  overallMetrics: {
    totalSessions: number;
    avgConfidence: number;
    successRate: number;
    totalCost: number;
    costEfficiency: number;
    collaborationScore: number;
    predictionAccuracy: number;
  };
  optimizationSuggestions: OptimizationSuggestion[];
}

export interface OptimizationSuggestion {
  type: 'enable' | 'disable' | 'reconfigure' | 'role_change' | 'collaboration';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: string;
  reasoning: string;
  confidence: number;
}

export interface TeamComposition {
  speaker: BotConfig | null;
  specialists: BotConfig[];
  councilors: BotConfig[];
  totalScore: number;
  predictedEffectiveness: number;
  estimatedCost: number;
  optimizationNotes: string[];
}

/**
 * AI-Driven Persona Optimization Service
 *
 * Analyzes historical performance data to optimize:
 * - Persona selection for specific topics
 * - Team composition effectiveness
 * - Cost-efficiency optimization
 * - Collaboration patterns
 * - Dynamic weight adjustments
 */
export class PersonaOptimizationService {
  private performanceHistory: Map<string, PersonaPerformanceMetrics> = new Map();

  /**
   * Analyze persona performance across all sessions
   */
  async analyzePersonaPerformance(): Promise<Map<string, PersonaPerformanceMetrics>> {
    const bots = getBotsWithCustomConfigs();
    const performanceMap = new Map<string, PersonaPerformanceMetrics>();

    for (const bot of bots) {
      const metrics = await this.analyzeBotPerformance(bot);
      performanceMap.set(bot.id, metrics);
      this.performanceHistory.set(bot.id, metrics);
    }

    return performanceMap;
  }

  /**
   * Get optimized team composition for a topic
   */
  async getOptimizedTeamComposition(
    topic: string,
    mode: SessionMode,
    maxBots: number = 5
  ): Promise<TeamComposition> {
    const bots = getBotsWithCustomConfigs();
    const enabledBots = bots.filter(b => b.enabled);

    // Analyze performance for this topic
    const botScores = await Promise.all(
      enabledBots.map(async (bot) => {
        const score = await this.calculateBotScoreForTopic(bot, topic, mode);
        return { bot, score };
      })
    );

    // Sort by score
    botScores.sort((a, b) => b.score - a.score);

    // Select optimal team
    const speaker = botScores.find(b => b.bot.role === 'speaker')?.bot || null;
    const specialists = botScores
      .filter(b => b.bot.role === 'specialist')
      .slice(0, Math.min(2, maxBots - (speaker ? 1 : 0)))
      .map(b => b.bot);
    const councilors = botScores
      .filter(b => b.bot.role === 'councilor')
      .slice(0, Math.min(3, maxBots - (speaker ? 1 : 0) - specialists.length))
      .map(b => b.bot);

    const totalScore = botScores.slice(0, maxBots).reduce((sum, b) => sum + b.score, 0);
    const predictedEffectiveness = this.predictTeamEffectiveness(speaker, specialists, councilors, topic, mode);
    const estimatedCost = this.estimateTeamCost(speaker, specialists, councilors);
    const optimizationNotes = this.generateTeamNotes(speaker, specialists, councilors, topic);

    return {
      speaker,
      specialists,
      councilors,
      totalScore,
      predictedEffectiveness,
      estimatedCost,
      optimizationNotes
    };
  }

  /**
   * Get optimization recommendations for all personas
   */
  getOptimizationRecommendations(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    for (const [botId, metrics] of this.performanceHistory.entries()) {
      suggestions.push(...metrics.optimizationSuggestions);
    }

    // Add team-level suggestions
    suggestions.push(...this.generateTeamLevelSuggestions());

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Optimize persona weights based on performance
   */
  optimizePersonaWeights(botId: string): number {
    const metrics = this.performanceHistory.get(botId);
    if (!metrics) return 1.0;

    const { overallMetrics } = metrics;
    let optimizedWeight = 1.0;

    // Adjust based on success rate
    optimizedWeight *= 0.8 + (overallMetrics.successRate * 0.4);

    // Adjust based on cost efficiency
    optimizedWeight *= 0.9 + (overallMetrics.costEfficiency * 0.2);

    // Adjust based on collaboration score
    optimizedWeight *= 0.95 + (overallMetrics.collaborationScore * 0.1);

    // Ensure reasonable bounds
    return Math.max(0.5, Math.min(2.0, optimizedWeight));
  }

  /**
   * Predict which personas will be most effective for a new topic
   */
  async predictTopPerformers(topic: string, mode: SessionMode, limit: number = 3): Promise<Array<{
    botId: string;
    botName: string;
    predictedScore: number;
    reasoning: string;
  }>> {
    const bots = getBotsWithCustomConfigs().filter(b => b.enabled);

    const predictions = await Promise.all(
      bots.map(async (bot) => {
        const score = await this.calculateBotScoreForTopic(bot, topic, mode);
        const reasoning = this.generatePredictionReasoning(bot, topic, score);
        return {
          botId: bot.id,
          botName: bot.name,
          predictedScore: score,
          reasoning
        };
      })
    );

    return predictions
      .sort((a, b) => b.predictedScore - a.predictedScore)
      .slice(0, limit);
  }

  /**
   * Analyze historical performance for a specific bot
   */
  private async analyzeBotPerformance(bot: BotConfig): Promise<PersonaPerformanceMetrics> {
    const topicExpertise = new Map<string, {
      sessions: number;
      avgConfidence: number;
      successRate: number;
      costPerSession: number;
      effectiveness: number;
    }>();

    // Get all sessions where this bot participated
    const sessions = sessionService.listSessions();
    const botSessions = sessions.filter(s =>
      s.settings.bots.some(b => b.id === bot.id)
    );

    // Group by topic/category
    const topicGroups = new Map<string, typeof botSessions>();
    for (const session of botSessions) {
      const category = this.categorizeTopic(session.topic);
      const group = topicGroups.get(category) || [];
      group.push(session);
      topicGroups.set(category, group);
    }

    // Calculate metrics per topic
    for (const [topic, sessions] of topicGroups.entries()) {
      const metrics = await this.calculateTopicMetrics(bot, topic, sessions);
      topicExpertise.set(topic, metrics);
    }

    // Calculate overall metrics
    const overallMetrics = this.calculateOverallMetrics(bot, botSessions, topicExpertise);

    // Generate optimization suggestions
    const optimizationSuggestions = this.generateOptimizationSuggestions(bot, overallMetrics, topicExpertise);

    return {
      botId: bot.id,
      botName: bot.name,
      role: bot.role,
      topicExpertise,
      overallMetrics,
      optimizationSuggestions
    };
  }

  /**
   * Calculate bot score for a specific topic
   */
  private async calculateBotScoreForTopic(bot: BotConfig, topic: string, mode: SessionMode): Promise<number> {
    let score = 0;

    // Base score from bot configuration
    if (bot.role === 'speaker') score += 0.5;
    if (bot.role === 'specialist') score += 0.4;
    if (bot.role === 'councilor') score += 0.3;

    // Role-topic alignment
    const category = this.categorizeTopic(topic);
    const alignmentScore = this.getRoleTopicAlignment(bot, category);
    score += alignmentScore * 0.3;

    // Historical performance if available
    const metrics = this.performanceHistory.get(bot.id);
    if (metrics) {
      const topicMetrics = metrics.topicExpertise.get(category);
      if (topicMetrics) {
        score += topicMetrics.effectiveness * 0.2;
      }
    }

    // Cost efficiency
    if (metrics?.overallMetrics.costEfficiency) {
      score += metrics.overallMetrics.costEfficiency * 0.1;
    }

    // Mode-specific adjustments
    const modeAdjustment = this.getModeSpecificAdjustment(bot, mode);
    score += modeAdjustment;

    return Math.min(1.0, score);
  }

  /**
   * Predict team effectiveness
   */
  private predictTeamEffectiveness(
    speaker: BotConfig | null,
    specialists: BotConfig[],
    councilors: BotConfig[],
    topic: string,
    mode: SessionMode
  ): number {
    let effectiveness = 0.5; // Base

    // Role diversity bonus
    const roles = new Set([speaker?.role, ...specialists.map(s => s.role), ...councilors.map(c => c.role)]);
    const diversityBonus = Math.min(0.3, roles.size * 0.1);
    effectiveness += diversityBonus;

    // Topic alignment
    const category = this.categorizeTopic(topic);
    for (const bot of [...specialists, ...councilors]) {
      const alignment = this.getRoleTopicAlignment(bot, category);
      effectiveness += alignment * 0.1;
    }

    // Mode-specific bonuses
    if (mode === SessionMode.PREDICTION) {
      if (councilors.some(c => c.id.includes('visionary') || c.id.includes('skeptic'))) {
        effectiveness += 0.1;
      }
    } else if (mode === SessionMode.SWARM_CODING) {
      if (specialists.some(s => s.id.includes('code'))) {
        effectiveness += 0.2;
      }
    }

    return Math.min(1.0, effectiveness);
  }

  /**
   * Estimate cost for a team
   */
  private estimateTeamCost(speaker: BotConfig | null, specialists: BotConfig[], councilors: BotConfig[]): number {
    const allBots = [speaker, ...specialists, ...councilors].filter(Boolean) as BotConfig[];
    return allBots.length * 0.05; // Rough estimate per bot
  }

  /**
   * Generate optimization notes for team
   */
  private generateTeamNotes(
    speaker: BotConfig | null,
    specialists: BotConfig[],
    councilors: BotConfig[],
    topic: string
  ): string[] {
    const notes: string[] = [];

    if (!speaker) {
      notes.push('⚠️ No speaker selected - consider adding one for better synthesis');
    }

    if (specialists.length === 0) {
      notes.push('💡 No specialists - may lack domain expertise');
    }

    if (councilors.length < 2) {
      notes.push('💡 Limited perspectives - consider adding more councilors for diversity');
    }

    const category = this.categorizeTopic(topic);
    for (const bot of [...specialists, ...councilors]) {
      const alignment = this.getRoleTopicAlignment(bot, category);
      if (alignment < 0.3) {
        notes.push(`⚠️ ${bot.name} may not be well-aligned with topic`);
      }
    }

    if (notes.length === 0) {
      notes.push('✅ Well-balanced team composition');
    }

    return notes;
  }

  /**
   * Calculate topic-specific metrics
   */
  private async calculateTopicMetrics(
    bot: BotConfig,
    topic: string,
    sessions: any[]
  ): Promise<{
    sessions: number;
    avgConfidence: number;
    successRate: number;
    costPerSession: number;
    effectiveness: number;
  }> {
    let totalConfidence = 0;
    let successfulSessions = 0;
    let totalCost = 0;

    for (const session of sessions) {
      // Get confidence from vote data or similar
      if (session.voteData) {
        const vote = session.voteData.votes.find((v: any) => v.voter === bot.name);
        if (vote) totalConfidence += vote.confidence / 10; // Normalize to 0-1
      }

      // Consider session successful if consensus score > 0.6
      if (session.voteData?.consensusScore > 0.6) {
        successfulSessions++;
      }

      // Get cost from cost tracking
      // Note: This would need actual session cost data
    }

    const sessionsCount = sessions.length;
    const avgConfidence = sessionsCount > 0 ? totalConfidence / sessionsCount : 0;
    const successRate = sessionsCount > 0 ? successfulSessions / sessionsCount : 0;
    const costPerSession = sessionsCount > 0 ? totalCost / sessionsCount : 0;
    const effectiveness = (avgConfidence * 0.4) + (successRate * 0.6);

    return {
      sessions: sessionsCount,
      avgConfidence,
      successRate,
      costPerSession,
      effectiveness
    };
  }

  /**
   * Calculate overall metrics
   */
  private calculateOverallMetrics(
    bot: BotConfig,
    sessions: any[],
    topicExpertise: Map<string, any>
  ): PersonaPerformanceMetrics['overallMetrics'] {
    const totalSessions = sessions.length;
    const avgConfidence = Array.from(topicExpertise.values())
      .reduce((sum, m) => sum + m.avgConfidence, 0) / (topicExpertise.size || 1);
    const successRate = Array.from(topicExpertise.values())
      .reduce((sum, m) => sum + m.successRate, 0) / (topicExpertise.size || 1);
    const totalCost = Array.from(topicExpertise.values())
      .reduce((sum, m) => sum + (m.costPerSession * m.sessions), 0);
    const costEfficiency = totalSessions > 0 && totalCost > 0 ? successRate / (totalCost / totalSessions) : 0.5;
    const collaborationScore = this.calculateCollaborationScore(bot, sessions);
    const predictionAccuracy = this.calculatePredictionAccuracy(bot, sessions);

    return {
      totalSessions,
      avgConfidence,
      successRate,
      totalCost,
      costEfficiency,
      collaborationScore,
      predictionAccuracy
    };
  }

  /**
   * Generate optimization suggestions for a bot
   */
  private generateOptimizationSuggestions(
    bot: BotConfig,
    metrics: PersonaPerformanceMetrics['overallMetrics'],
    topicExpertise: Map<string, any>
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Low performance suggestions
    if (metrics.successRate < 0.4) {
      suggestions.push({
        type: 'reconfigure',
        priority: 'high',
        title: 'Low Success Rate',
        description: `This persona has a ${(metrics.successRate * 100).toFixed(0)}% success rate`,
        expectedImpact: 'Increase discussion quality',
        reasoning: 'Consider adjusting persona configuration or using for different topics',
        confidence: 0.8
      });
    }

    // Cost efficiency suggestions
    if (metrics.costEfficiency < 0.3 && metrics.totalSessions > 5) {
      suggestions.push({
        type: 'reconfigure',
        priority: 'medium',
        title: 'High Cost, Low Effectiveness',
        description: 'Cost efficiency is below optimal threshold',
        expectedImpact: 'Reduce operational costs',
        reasoning: 'Consider switching to economy mode or replacing with more efficient persona',
        confidence: 0.7
      });
    }

    // Topic specialization
    const bestTopics = Array.from(topicExpertise.entries())
      .sort((a, b) => b[1].effectiveness - a[1].effectiveness)
      .slice(0, 2);

    if (bestTopics.length > 0) {
      suggestions.push({
        type: 'collaboration',
        priority: 'low',
        title: 'Topic Specialization',
        description: `Perform best on: ${bestTopics.map(([t]) => t).join(', ')}`,
        expectedImpact: 'Improve topic-specific outcomes',
        reasoning: 'Deploy this persona primarily for these topics',
        confidence: 0.6
      });
    }

    return suggestions;
  }

  /**
   * Generate team-level suggestions
   */
  private generateTeamLevelSuggestions(): OptimizationSuggestion[] {
    return [
      {
        type: 'collaboration',
        priority: 'medium',
        title: 'Diverse Perspective Balance',
        description: 'Ensure ideological diversity in political discussions',
        expectedImpact: 'More balanced decision-making',
        reasoning: 'Teams with diverse perspectives produce better outcomes',
        confidence: 0.7
      },
      {
        type: 'enable',
        priority: 'low',
        title: 'Enable Underutilized Personas',
        description: 'Some personas are rarely used despite good performance',
        expectedImpact: 'Unlock hidden potential',
        reasoning: 'Data shows these personas perform well but are underutilized',
        confidence: 0.5
      }
    ];
  }

  /**
   * Generate prediction reasoning
   */
  private generatePredictionReasoning(bot: BotConfig, topic: string, score: number): string {
    const category = this.categorizeTopic(topic);
    const alignment = this.getRoleTopicAlignment(bot, category);

    if (score > 0.8) {
      return `Excellent match - ${bot.name} has strong alignment with this topic`;
    } else if (score > 0.6) {
      return `Good match - suitable expertise for this domain`;
    } else if (score > 0.4) {
      return `Moderate match - may provide useful perspective`;
    } else {
      return `Limited expertise - consider specialist alternatives`;
    }
  }

  /**
   * Get role-topic alignment score
   */
  private getRoleTopicAlignment(bot: BotConfig, category: string): number {
    const alignmentMap: Record<string, string[]> = {
      'science': ['specialist-science', 'councilor-visionary', 'councilor-technocrat'],
      'technology': ['specialist-code', 'councilor-technocrat', 'councilor-sentinel'],
      'law': ['specialist-legal', 'councilor-diplomat', 'councilor-ethicist'],
      'economics': ['specialist-finance', 'councilor-pragmatist', 'councilor-progressive'],
      'politics': ['councilor-progressive', 'councilor-conservative', 'councilor-independent']
    };

    const alignedBots = alignmentMap[category] || [];
    return alignedBots.includes(bot.id) ? 1.0 : 0.3;
  }

  /**
   * Get mode-specific adjustment
   */
  private getModeSpecificAdjustment(bot: BotConfig, mode: SessionMode): number {
    if (mode === SessionMode.PREDICTION && bot.id.includes('visionary')) return 0.1;
    if (mode === SessionMode.SWARM_CODING && bot.role === 'specialist') return 0.15;
    if (mode === SessionMode.DELIBERATION && bot.role === 'councilor') return 0.05;
    return 0;
  }

  /**
   * Categorize topic
   */
  private categorizeTopic(topic: string): string {
    const t = topic.toLowerCase();

    if (t.includes('science') || t.includes('research') || t.includes('data')) return 'science';
    if (t.includes('tech') || t.includes('code') || t.includes('ai')) return 'technology';
    if (t.includes('law') || t.includes('legal') || t.includes('regulation')) return 'law';
    if (t.includes('econom') || t.includes('market') || t.includes('finance')) return 'economics';
    if (t.includes('polit') || t.includes('election') || t.includes('government')) return 'politics';

    return 'general';
  }

  /**
   * Calculate collaboration score
   */
  private calculateCollaborationScore(bot: BotConfig, sessions: any[]): number {
    // Simplified - in production would analyze actual collaboration metrics
    return bot.role === 'speaker' ? 0.9 : 0.7;
  }

  /**
   * Calculate prediction accuracy
   */
  private calculatePredictionAccuracy(bot: BotConfig, sessions: any[]): number {
    // Get prediction tracking data for this bot
    const predictions = predictionTrackingService.getSessionPredictions(sessions[0]?.id || '');
    const botPredictions = predictions.filter(p => p.councilorId === bot.id);

    if (botPredictions.length === 0) return 0.5;

    const correct = botPredictions.filter(p => {
      // Simplified accuracy check
      return true;
    }).length;

    return correct / botPredictions.length;
  }

  /**
   * Export optimization data
   */
  exportOptimizationData(): string {
    return JSON.stringify({
      performanceHistory: Array.from(this.performanceHistory.entries()),
      recommendations: this.getOptimizationRecommendations(),
      timestamp: new Date().toISOString()
    }, null, 2);
  }
}

// Export singleton instance
export const personaOptimizationService = new PersonaOptimizationService();
