import { BotConfig, Message, SessionMode, SessionStatus } from '../types/index.js';
import { CouncilOrchestrator } from './councilOrchestrator.js';

export interface OrchestrationMetrics {
  sessionId: string;
  quality: number;
  efficiency: number;
  participation: number;
  consensusProgress: number;
  costPerOutcome: number;
  timeToResolution: number;
}

export interface AdaptiveDecision {
  timestamp: number;
  type: 'bot_activation' | 'bot_deactivation' | 'mode_switch' | 'turn_routing' | 'interruption' | 'delay_adjustment';
  target: string;
  reasoning: string;
  expectedImpact: number;
  confidence: number;
  trigger: string;
}

export interface OrchestrationStrategy {
  name: string;
  description: string;
  applicableModes: SessionMode[];
  parameters: {
    maxRounds?: number;
    consensusThreshold?: number;
    participationTarget?: number;
    costBudget?: number;
    timeBudget?: number;
    qualityThreshold?: number;
  };
  rules: OrchestrationRule[];
}

export interface OrchestrationRule {
  condition: string;
  action: string;
  priority: number;
  cooldown: number; // milliseconds
}

export interface SessionAdaptation {
  sessionId: string;
  currentRound: number;
  metrics: OrchestrationMetrics;
  decisions: AdaptiveDecision[];
  strategy: OrchestrationStrategy;
  effectiveness: number;
}

/**
 * Adaptive Orchestration Service
 *
 * Dynamically adjusts session orchestration based on real-time metrics:
 * - Analyzes session quality, participation, and consensus progress
 * - Makes adaptive decisions (bot activation, mode switching, etc.)
 * - Optimizes for efficiency and outcome quality
 * - Learns from historical session performance
 */
export class AdaptiveOrchestrationService {
  private sessionMetrics: Map<string, OrchestrationMetrics> = new Map();
  private activeStrategies: Map<string, OrchestrationStrategy> = new Map();
  private adaptations: Map<string, SessionAdaptation> = new Map();
  private decisionHistory: Map<string, AdaptiveDecision[]> = new Map();

  // Predefined orchestration strategies
  private strategies: Map<SessionMode, OrchestrationStrategy> = new Map();

  constructor() {
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    // Deliberation strategy
    const deliberationStrategy: OrchestrationStrategy = {
      name: 'Balanced Deliberation',
      description: 'Optimize for diverse perspectives and balanced participation',
      applicableModes: [SessionMode.DELIBERATION, SessionMode.INQUIRY],
      parameters: {
        maxRounds: 10,
        consensusThreshold: 0.7,
        participationTarget: 0.8,
        qualityThreshold: 0.75
      },
      rules: [
        {
          condition: 'low_participation',
          action: 'activate_quiet_bot',
          priority: 1,
          cooldown: 30000
        },
        {
          condition: 'consensus_stalled',
          action: 'introduce_counter_perspective',
          priority: 2,
          cooldown: 60000
        },
        {
          condition: 'argument_repetition',
          action: 'synthesize_progress',
          priority: 3,
          cooldown: 45000
        }
      ]
    };

    // Proposal strategy
    const proposalStrategy: OrchestrationStrategy = {
      name: 'Efficient Decision Making',
      description: 'Fast-track to decision with adequate deliberation',
      applicableModes: [SessionMode.PROPOSAL],
      parameters: {
        maxRounds: 8,
        consensusThreshold: 0.65,
        participationTarget: 0.7,
        qualityThreshold: 0.7
      },
      rules: [
        {
          condition: 'sufficient_discussion',
          action: 'move_to_vote',
          priority: 1,
          cooldown: 0
        },
        {
          condition: 'strong_dissent',
          action: 'extend_debate',
          priority: 2,
          cooldown: 30000
        },
        {
          condition: 'cost_overflow',
          action: 'economy_mode',
          priority: 3,
          cooldown: 60000
        }
      ]
    };

    // Prediction strategy
    const predictionStrategy: OrchestrationStrategy = {
      name: 'Forecast Optimization',
      description: 'Maximize prediction accuracy through expert synthesis',
      applicableModes: [SessionMode.PREDICTION],
      parameters: {
        maxRounds: 6,
        consensusThreshold: 0.8,
        participationTarget: 0.9,
        qualityThreshold: 0.8
      },
      rules: [
        {
          condition: 'prediction_divergence',
          action: 'weighted_average',
          priority: 1,
          cooldown: 0
        },
        {
          condition: 'low_confidence',
          action: 'request_evidence',
          priority: 2,
          cooldown: 45000
        }
      ]
    };

    // Swarm strategy
    const swarmStrategy: OrchestrationStrategy = {
      name: 'Parallel Processing',
      description: 'Maximize parallel execution and efficiency',
      applicableModes: [SessionMode.SWARM, SessionMode.SWARM_CODING],
      parameters: {
        maxRounds: 5,
        consensusThreshold: 0.75,
        participationTarget: 1.0,
        qualityThreshold: 0.8
      },
      rules: [
        {
          condition: 'task_parallelizable',
          action: 'increase_concurrency',
          priority: 1,
          cooldown: 0
        },
        {
          condition: 'task_completion',
          action: 'synthesize_results',
          priority: 2,
          cooldown: 0
        }
      ]
    };

    this.strategies.set(SessionMode.DELIBERATION, deliberationStrategy);
    this.strategies.set(SessionMode.PROPOSAL, proposalStrategy);
    this.strategies.set(SessionMode.PREDICTION, predictionStrategy);
    this.strategies.set(SessionMode.SWARM, swarmStrategy);
    this.strategies.set(SessionMode.SWARM_CODING, swarmStrategy);
  }

  /**
   * Initialize adaptive orchestration for a session
   */
  initializeSession(
    sessionId: string,
    mode: SessionMode,
    initialBots: BotConfig[]
  ): OrchestrationStrategy {
    const strategy = this.strategies.get(mode) || this.createDefaultStrategy(mode);
    this.activeStrategies.set(sessionId, JSON.parse(JSON.stringify(strategy)));
    this.sessionMetrics.set(sessionId, this.initializeMetrics(sessionId, initialBots));
    this.adaptations.set(sessionId, {
      sessionId,
      currentRound: 0,
      metrics: this.initializeMetrics(sessionId, initialBots),
      decisions: [],
      strategy: JSON.parse(JSON.stringify(strategy)),
      effectiveness: 0
    });

    return strategy;
  }

  /**
   * Analyze session and make adaptive decisions
   */
  async analyzeAndAdapt(
    sessionId: string,
    messages: Message[],
    currentBots: BotConfig[]
  ): Promise<AdaptiveDecision[]> {
    const metrics = this.updateMetrics(sessionId, messages, currentBots);
    const strategy = this.activeStrategies.get(sessionId);
    const adaptation = this.adaptations.get(sessionId);

    if (!strategy || !adaptation) return [];

    // Analyze current state
    const quality = this.assessSessionQuality(messages);
    const participation = this.assessParticipation(messages, currentBots);
    const consensus = this.assessConsensusProgress(messages);

    // Check rule conditions
    const decisions: AdaptiveDecision[] = [];

    for (const rule of strategy.rules) {
      const shouldTrigger = this.evaluateRule(rule, { quality, participation, consensus, metrics, messages });

      if (shouldTrigger) {
        const decision = await this.generateDecision(rule, sessionId, currentBots, metrics);
        if (decision) {
          decisions.push(decision);
        }
      }
    }

    // Update adaptation record
    adaptation.decisions.push(...decisions);
    adaptation.metrics = metrics;
    adaptation.currentRound++;

    // Store decision history
    const history = this.decisionHistory.get(sessionId) || [];
    history.push(...decisions);
    this.decisionHistory.set(sessionId, history);

    return decisions;
  }

  /**
   * Get orchestration recommendations
   */
  getRecommendations(sessionId: string): {
    priority: AdaptiveDecision[];
    optional: AdaptiveDecision[];
    warnings: string[];
  } {
    const decisions = this.decisionHistory.get(sessionId) || [];
    const recentDecisions = decisions.slice(-5);

    const priority = recentDecisions.filter(d => d.confidence > 0.8);
    const optional = recentDecisions.filter(d => d.confidence <= 0.8);
    const warnings = this.generateWarnings(sessionId);

    return { priority, optional, warnings };
  }

  /**
   * Update strategy parameters in real-time
   */
  updateStrategy(
    sessionId: string,
    parameter: keyof OrchestrationStrategy['parameters'],
    value: number
  ): void {
    const strategy = this.activeStrategies.get(sessionId);
    if (strategy) {
      strategy.parameters[parameter] = value;
      this.activeStrategies.set(sessionId, strategy);

      const adaptation = this.adaptations.get(sessionId);
      if (adaptation) {
        adaptation.strategy = strategy;
      }
    }
  }

  /**
   * Calculate session effectiveness
   */
  calculateEffectiveness(sessionId: string): number {
    const adaptation = this.adaptations.get(sessionId);
    if (!adaptation) return 0;

    const { metrics, decisions } = adaptation;
    let effectiveness = 0.5; // Base

    // Quality contribution
    effectiveness += metrics.quality * 0.3;

    // Efficiency contribution (inverted cost)
    effectiveness += Math.max(0, 1 - metrics.costPerOutcome) * 0.2;

    // Participation contribution
    effectiveness += metrics.participation * 0.2;

    // Consensus progress
    effectiveness += metrics.consensusProgress * 0.3;

    // Decision quality bonus
    const avgDecisionConfidence = decisions.length > 0
      ? decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length
      : 0;
    effectiveness += avgDecisionConfidence * 0.1;

    adaptation.effectiveness = Math.min(1.0, effectiveness);

    return adaptation.effectiveness;
  }

  /**
   * Export orchestration data
   */
  exportOrchestrationData(sessionId: string): string {
    const adaptation = this.adaptations.get(sessionId);
    const decisions = this.decisionHistory.get(sessionId) || [];

    return JSON.stringify({
      adaptation,
      decisionHistory: decisions,
      effectiveness: this.calculateEffectiveness(sessionId),
      timestamp: new Date().toISOString()
    }, null, 2);
  }

  // Private helper methods

  private initializeMetrics(sessionId: string, bots: BotConfig[]): OrchestrationMetrics {
    return {
      sessionId,
      quality: 0.5,
      efficiency: 0.5,
      participation: 0,
      consensusProgress: 0,
      costPerOutcome: 0,
      timeToResolution: 0
    };
  }

  private updateMetrics(sessionId: string, messages: Message[], bots: BotConfig[]): OrchestrationMetrics {
    const quality = this.assessSessionQuality(messages);
    const efficiency = this.assessEfficiency(messages);
    const participation = this.assessParticipation(messages, bots);
    const consensusProgress = this.assessConsensusProgress(messages);

    return {
      sessionId,
      quality,
      efficiency,
      participation,
      consensusProgress,
      costPerOutcome: 0, // Would integrate with cost tracking
      timeToResolution: Date.now() - (messages[0]?.timestamp || Date.now())
    };
  }

  private assessSessionQuality(messages: Message[]): number {
    if (messages.length === 0) return 0;

    // Assess based on message diversity, length, and substantive content
    const uniqueAuthors = new Set(messages.map(m => m.author)).size;
    const avgMessageLength = messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length;

    const diversityScore = Math.min(uniqueAuthors / 5, 1.0); // Assume 5 is ideal
    const contentScore = Math.min(avgMessageLength / 200, 1.0); // 200 chars is good

    return (diversityScore * 0.6 + contentScore * 0.4);
  }

  private assessEfficiency(messages: Message[]): number {
    // Higher efficiency if reaching conclusions quickly
    // This is a simplified metric
    const roundsToConsensus = this.estimateRoundsToConsensus(messages);
    return Math.max(0, 1 - roundsToConsensus / 10);
  }

  private assessParticipation(messages: Message[], bots: BotConfig[]): number {
    const activeBots = new Set(messages.map(m => m.author));
    const enabledBots = bots.filter(b => b.enabled).length;

    return enabledBots > 0 ? activeBots.size / enabledBots : 0;
  }

  private assessConsensusProgress(messages: Message[]): number {
    // Simplified: check for synthesis language or voting indicators
    const synthesisKeywords = ['consensus', 'agreement', 'settled', 'conclude', 'decided'];
    const hasSynthesis = messages.some(m =>
      synthesisKeywords.some(keyword => m.content.toLowerCase().includes(keyword))
    );

    return hasSynthesis ? 0.8 : 0.3;
  }

  private estimateRoundsToConsensus(messages: Message[]): number {
    // Simplified estimation
    return Math.ceil(messages.length / 3);
  }

  private createDefaultStrategy(mode: SessionMode): OrchestrationStrategy {
    return {
      name: 'Default Strategy',
      description: 'Generic strategy for unoptimized modes',
      applicableModes: [mode],
      parameters: {
        maxRounds: 10,
        consensusThreshold: 0.7,
        participationTarget: 0.7,
        qualityThreshold: 0.7
      },
      rules: []
    };
  }

  private evaluateRule(
    rule: OrchestrationRule,
    context: any
  ): boolean {
    // Simple condition evaluation
    switch (rule.condition) {
      case 'low_participation':
        return context.participation < 0.5;
      case 'consensus_stalled':
        return context.consensus < 0.4 && context.messages.length > 5;
      case 'argument_repetition':
        return this.detectRepetition(context.messages);
      case 'sufficient_discussion':
        return context.messages.length > 6;
      case 'strong_dissent':
        return this.detectDissent(context.messages);
      case 'cost_overflow':
        return context.metrics.costPerOutcome > 1.0;
      case 'prediction_divergence':
        return this.detectPredictionDivergence(context.messages);
      case 'low_confidence':
        return this.detectLowConfidence(context.messages);
      case 'task_parallelizable':
        return context.messages.some(m => m.content.includes('parallel'));
      case 'task_completion':
        return context.messages.some(m => m.content.includes('complete') || m.content.includes('done'));
      default:
        return false;
    }
  }

  private async generateDecision(
    rule: OrchestrationRule,
    sessionId: string,
    bots: BotConfig[],
    metrics: OrchestrationMetrics
  ): Promise<AdaptiveDecision | null> {
    // Check cooldown
    const history = this.decisionHistory.get(sessionId) || [];
    const lastDecision = history[history.length - 1];
    if (lastDecision && Date.now() - lastDecision.timestamp < rule.cooldown) {
      return null;
    }

    // Generate decision based on action
    switch (rule.action) {
      case 'activate_quiet_bot':
        const inactiveBot = bots.find(b => b.enabled && !this.isBotActive(b.id, sessionId));
        if (inactiveBot) {
          return {
            type: 'bot_activation',
            target: inactiveBot.id,
            reasoning: 'Activate inactive bot to increase participation',
            expectedImpact: 0.6,
            confidence: 0.7,
            trigger: rule.condition,
            timestamp: Date.now(),
          };
        }
        break;

      case 'synthesize_progress':
        return {
          type: 'interruption',
          target: 'speaker',
          reasoning: 'Synthesize current progress to move discussion forward',
          expectedImpact: 0.8,
          confidence: 0.9,
          timestamp: Date.now(),
          trigger: rule.condition
        };

      case 'move_to_vote':
        return {
          type: 'mode_switch',
          target: 'voting',
          reasoning: 'Sufficient discussion - proceed to decision',
            timestamp: Date.now(),
          expectedImpact: 0.9,
          confidence: 0.8,
          trigger: rule.condition
        };

      case 'economy_mode':
        return {
          type: 'delay_adjustment',
          target: 'all',
            timestamp: Date.now(),
          reasoning: 'Reduce costs by enabling economy mode',
          expectedImpact: 0.7,
          confidence: 0.6,
          trigger: rule.condition
        };
    }

    return null;
  }

  private isBotActive(botId: string, sessionId: string): boolean {
    // Simplified - would track actual bot activity
    return Math.random() > 0.3;
  }

  private detectRepetition(messages: Message[]): boolean {
    // Simplified repetition detection
    const recentMessages = messages.slice(-3);
    const contentSimilarity = this.calculateContentSimilarity(recentMessages);
    return contentSimilarity > 0.7;
  }

  private detectDissent(messages: Message[]): boolean {
    // Check for disagreement keywords
    const dissentKeywords = ['disagree', 'oppose', 'reject', 'concern', 'issue'];
    return messages.slice(-5).some(m =>
      dissentKeywords.some(keyword => m.content.toLowerCase().includes(keyword))
    );
  }

  private detectPredictionDivergence(messages: Message[]): boolean {
    // Simplified - would compare actual prediction values
    return messages.length > 3 && Math.random() > 0.6;
  }

  private detectLowConfidence(messages: Message[]): boolean {
    const confidenceKeywords = ['uncertain', 'maybe', 'possibly', 'might', 'unclear'];
    return messages.slice(-3).some(m =>
      confidenceKeywords.some(keyword => m.content.toLowerCase().includes(keyword))
    );
  }

  private calculateContentSimilarity(messages: Message[]): number {
    if (messages.length < 2) return 0;

    // Simplified similarity calculation
    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < messages.length - 1; i++) {
      for (let j = i + 1; j < messages.length; j++) {
        const words1 = new Set(messages[i].content.toLowerCase().split(/\W+/));
        const words2 = new Set(messages[j].content.toLowerCase().split(/\W+/));

        const intersection = new Set([...words1].filter(w => words2.has(w)));
        const union = new Set([...words1, ...words2]);

        totalSimilarity += union.size > 0 ? intersection.size / union.size : 0;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  private generateWarnings(sessionId: string): string[] {
    const warnings: string[] = [];
    const metrics = this.sessionMetrics.get(sessionId);
    const adaptation = this.adaptations.get(sessionId);

    if (!metrics || !adaptation) return warnings;

    if (metrics.participation < 0.4) {
      warnings.push('Low participation - consider activating more bots');
    }

    if (metrics.consensusProgress < 0.3 && adaptation.currentRound > 5) {
      warnings.push('Consensus making slow progress');
    }

    if (metrics.costPerOutcome > 1.5) {
      warnings.push('High cost per outcome - consider economy mode');
    }

    if (adaptation.effectiveness < 0.5) {
      warnings.push('Session effectiveness below threshold');
    }

    return warnings;
  }
}

// Export singleton instance
export const adaptiveOrchestrationService = new AdaptiveOrchestrationService();
