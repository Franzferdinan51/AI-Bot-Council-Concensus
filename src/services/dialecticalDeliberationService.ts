import { BotConfig, Message } from '../types/index.js';

export interface DialecticalRound {
  roundNumber: number;
  thesis?: string;
  antithesis?: string;
  synthesis?: string;
  participants: string[];
  arguments: Argument[];
  resolution?: string;
}

export interface Argument {
  position: string;
  evidence: string[];
  reasoning: string;
  counterArgument?: string;
  response?: string;
  supporter: string;
  strength: number; // 0-1
}

export interface DialecticalSynthesis {
  summary: string;
  keyInsights: string[];
  unresolvedIssues: string[];
  consensusPoints: string[];
  divergencePoints: string[];
  finalPosition?: string;
  confidence: number;
}

export interface DeliberationTrace {
  rounds: DialecticalRound[];
  synthesis: DialecticalSynthesis;
  evolutionTrace: Array<{
    round: number;
    position: string;
    evolution: string;
    catalyst: string;
  }>;
}

/**
 * Dialectical Deliberation Engine
 *
 * Implements dialectical reasoning (thesis-antithesis-synthesis) to:
 * - Structure complex debates through systematic opposition
 * - Force deeper critical thinking
 * - Achieve higher-quality synthesis
 * - Track argument evolution
 * - Identify genuine convergence vs. superficial agreement
 */
export class DialecticalDeliberationService {
  private rounds: Map<string, DialecticalRound[]> = new Map();
  private syntheses: Map<string, DialecticalSynthesis> = new Map();

  /**
   * Initiate dialectical deliberation
   */
  initiateDeliberation(sessionId: string, initialPosition: string, initiator: string): void {
    const firstRound: DialecticalRound = {
      roundNumber: 1,
      thesis: initialPosition,
      participants: [initiator],
      arguments: []
    };

    const rounds = this.rounds.get(sessionId) || [];
    rounds.push(firstRound);
    this.rounds.set(sessionId, rounds);
  }

  /**
   * Add antithesis (counter-argument)
   */
  addAntithesis(
    sessionId: string,
    counterArgument: string,
    evidence: string[],
    reasoning: string,
    opponent: string
  ): void {
    const rounds = this.rounds.get(sessionId) || [];
    const currentRound = rounds[rounds.length - 1];

    if (!currentRound) {
      throw new Error('No active deliberation round');
    }

    currentRound.antithesis = counterArgument;
    currentRound.participants.push(opponent);

    currentRound.arguments.push({
      position: counterArgument,
      evidence,
      reasoning,
      supporter: opponent,
      strength: this.calculateArgumentStrength(counterArgument, evidence, reasoning)
    });
  }

  /**
   * Develop synthesis (integration)
   */
  developSynthesis(
    sessionId: string,
    synthesis: string,
    integrator: string,
    resolution?: string
  ): void {
    const rounds = this.rounds.get(sessionId) || [];
    const currentRound = rounds[rounds.length - 1];

    if (!currentRound) {
      throw new Error('No active deliberation round');
    }

    currentRound.synthesis = synthesis;
    currentRound.resolution = resolution;

    if (!currentRound.participants.includes(integrator)) {
      currentRound.participants.push(integrator);
    }
  }

  /**
   * Initiate next dialectical round
   */
  nextRound(
    sessionId: string,
    newPosition: string,
    basis: string, // What evolved from previous synthesis
    participant: string
  ): void {
    const rounds = this.rounds.get(sessionId) || [];
    const currentRound = rounds[rounds.length - 1];

    if (!currentRound || !currentRound.synthesis) {
      throw new Error('Must complete current round before starting new one');
    }

    const nextRound: DialecticalRound = {
      roundNumber: currentRound.roundNumber + 1,
      thesis: newPosition,
      participants: [participant],
      arguments: []
    };

    rounds.push(nextRound);
    this.rounds.set(sessionId, rounds);
  }

  /**
   * Generate comprehensive synthesis
   */
  generateSynthesis(sessionId: string, topic: string): DialecticalSynthesis {
    const rounds = this.rounds.get(sessionId) || [];
    const synthesis: DialecticalSynthesis = {
      summary: this.generateSummary(rounds, topic),
      keyInsights: this.extractKeyInsights(rounds),
      unresolvedIssues: this.identifyUnresolvedIssues(rounds),
      consensusPoints: this.findConsensusPoints(rounds),
      divergencePoints: this.findDivergencePoints(rounds),
      confidence: this.calculateSynthesisConfidence(rounds)
    };

    this.syntheses.set(sessionId, synthesis);
    return synthesis;
  }

  /**
   * Get deliberation trace
   */
  getDeliberationTrace(sessionId: string): DeliberationTrace | null {
    const rounds = this.rounds.get(sessionId);
    const synthesis = this.syntheses.get(sessionId);

    if (!rounds || rounds.length === 0) return null;

    const evolutionTrace = this.traceArgumentEvolution(rounds);

    return {
      rounds,
      synthesis: synthesis || this.generateSynthesis(sessionId, 'Unknown'),
      evolutionTrace
    };
  }

  /**
   * Analyze dialectical effectiveness
   */
  analyzeEffectiveness(sessionId: string): {
    roundsCount: number;
    participationRate: number;
    argumentQuality: number;
    synthesisQuality: number;
    convergenceScore: number;
    insights: string[];
  } {
    const rounds = this.rounds.get(sessionId) || [];
    const synthesis = this.syntheses.get(sessionId);

    const allParticipants = new Set<string>();
    rounds.forEach(r => r.participants.forEach(p => allParticipants.add(p)));

    const totalArguments = rounds.reduce((sum, r) => sum + r.arguments.length, 0);
    const avgArgumentStrength = totalArguments > 0
      ? rounds.reduce((sum, r) =>
          sum + r.arguments.reduce((aSum, a) => aSum + a.strength, 0), 0) / totalArguments
      : 0;

    const participationRate = allParticipants.size / Math.max(rounds.length, 1);
    const synthesisQuality = synthesis?.confidence || 0;
    const convergenceScore = this.calculateConvergence(rounds);

    return {
      roundsCount: rounds.length,
      participationRate,
      argumentQuality: avgArgumentStrength,
      synthesisQuality,
      convergenceScore,
      insights: this.generateEffectivenessInsights(rounds, synthesis)
    };
  }

  /**
   * Export dialectical data
   */
  exportDialecticalData(sessionId: string): string {
    const trace = this.getDeliberationTrace(sessionId);
    const analysis = this.analyzeEffectiveness(sessionId);

    return JSON.stringify({
      trace,
      analysis,
      timestamp: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Generate Socratic questions for deeper exploration
   */
  generateSocraticQuestions(argument: string): string[] {
    const questions: string[] = [];

    // Questioning assumptions
    if (argument.includes('always') || argument.includes('never')) {
      questions.push('What evidence supports this absolute claim?');
      questions.push('Can you think of any counter-examples?');
    }

    // Questioning evidence
    if (argument.length > 100) {
      questions.push('What is the strongest piece of evidence supporting this?');
      questions.push('How reliable is this evidence?');
    }

    // Questioning implications
    questions.push('If this is true, what are the implications?');
    questions.push('What would need to be true for this to be false?');

    // Meta-questions
    questions.push('What aspects of this issue are we not discussing?');
    questions.push('What questions should we be asking that we aren\'t?');

    return questions.slice(0, 5);
  }

  /**
   * Detect argument patterns
   */
  detectArgumentPatterns(rounds: DialecticalRound[]): {
    patterns: Array<{
      type: 'escalation' | 'convergence' | 'divergence' | 'synthesis' | 'regression';
      description: string;
      round: number;
      evidence: string;
    }>;
    dominantPattern: string;
  } {
    const patterns = [];

    for (let i = 1; i < rounds.length; i++) {
      const prev = rounds[i - 1];
      const curr = rounds[i];

      // Check for convergence
      const similarity = this.calculateTextSimilarity(
        prev.synthesis || '',
        curr.thesis || ''
      );

      if (similarity > 0.7) {
        patterns.push({
          type: 'convergence',
          description: 'Positions are becoming more similar',
          round: i,
          evidence: `Similarity: ${(similarity * 100).toFixed(0)}%`
        });
      } else if (similarity < 0.3) {
        patterns.push({
          type: 'divergence',
          description: 'Positions are moving apart',
          round: i,
          evidence: `Low similarity: ${(similarity * 100).toFixed(0)}%`
        });
      }

      // Check for synthesis
      if (curr.synthesis && prev.thesis && prev.antithesis) {
        patterns.push({
          type: 'synthesis',
          description: 'Successful integration of opposing views',
          round: i,
          evidence: 'Thesis + Antithesis → Synthesis'
        });
      }
    }

    // Find dominant pattern
    const patternCounts = patterns.reduce((acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantPattern = Object.entries(patternCounts)
      .sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'none';

    return { patterns, dominantPattern };
  }

  // Private helper methods

  private calculateArgumentStrength(
    position: string,
    evidence: string[],
    reasoning: string
  ): number {
    let strength = 0.5; // Base strength

    // Evidence quality
    strength += Math.min(evidence.length * 0.1, 0.3);

    // Reasoning length and complexity
    const reasoningScore = Math.min(reasoning.length / 200, 0.2);
    strength += reasoningScore;

    // Position clarity (simplified)
    if (position.length > 50 && position.length < 500) {
      strength += 0.1;
    }

    return Math.min(1.0, strength);
  }

  private generateSummary(rounds: DialecticalRound[], topic: string): string {
    const summary = `Dialectical deliberation on "${topic}" consisting of ${rounds.length} rounds.\n\n`;

    const thesisPoints = rounds.filter(r => r.thesis).map(r => r.thesis!).join('\n');
    const antithesisPoints = rounds.filter(r => r.antithesis).map(r => r.antithesis!).join('\n');
    const synthesisPoints = rounds.filter(r => r.synthesis).map(r => r.synthesis!).join('\n');

    return summary +
      `Initial Positions: ${thesisPoints}\n\n` +
      `Counter-arguments: ${antithesisPoints}\n\n` +
      `Syntheses: ${synthesisPoints}`;
  }

  private extractKeyInsights(rounds: DialecticalRound[]): string[] {
    const insights: string[] = [];

    // Extract from syntheses
    for (const round of rounds) {
      if (round.synthesis) {
        // Split into sentences and identify key points
        const sentences = round.synthesis.split(/[.!?]+/).filter(s => s.trim().length > 20);
        insights.push(...sentences.slice(0, 2));
      }
    }

    return Array.from(new Set(insights)).slice(0, 10);
  }

  private identifyUnresolvedIssues(rounds: DialecticalRound[]): string[] {
    const unresolved: string[] = [];

    // Check if arguments lack responses
    for (const round of rounds) {
      for (const arg of round.arguments) {
        if (!arg.response) {
          unresolved.push(arg.position);
        }
      }
    }

    return unresolved.slice(0, 5);
  }

  private findConsensusPoints(rounds: DialecticalRound[]): string[] {
    const consensus: string[] = [];

    // Simplified: look for repeated positions or themes
    const themes = new Map<string, number>();

    rounds.forEach(round => {
      const text = `${round.thesis || ''} ${round.synthesis || ''}`;
      const words = text.toLowerCase().split(/\W+/);
      words.forEach(word => {
        if (word.length > 5) {
          themes.set(word, (themes.get(word) || 0) + 1);
        }
      });
    });

    // Most frequent themes likely represent consensus
    Array.from(themes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([theme]) => consensus.push(theme));

    return consensus;
  }

  private findDivergencePoints(rounds: DialecticalRound[]): string[] {
    const divergence: string[] = [];

    // Check for opposing arguments
    for (let i = 0; i < rounds.length - 1; i++) {
      const round = rounds[i];
      const nextRound = rounds[i + 1];

      if (round.thesis && nextRound.thesis) {
        const similarity = this.calculateTextSimilarity(round.thesis, nextRound.thesis);
        if (similarity < 0.5) {
          divergence.push(`Round ${i}: ${round.thesis.substring(0, 50)}...`);
          divergence.push(`Round ${i + 1}: ${nextRound.thesis.substring(0, 50)}...`);
        }
      }
    }

    return divergence.slice(0, 5);
  }

  private calculateSynthesisConfidence(rounds: DialecticalRound[]): number {
    if (rounds.length === 0) return 0;

    const synthesisRounds = rounds.filter(r => r.synthesis);
    if (synthesisRounds.length === 0) return 0.3;

    // Base confidence on round completion
    let confidence = Math.min(synthesisRounds.length / rounds.length, 1.0);

    // Boost for more rounds (indicates thorough exploration)
    confidence += Math.min(rounds.length / 10, 0.3);

    // Check for participant diversity
    const allParticipants = new Set<string>();
    rounds.forEach(r => r.participants.forEach(p => allParticipants.add(p)));
    confidence += Math.min(allParticipants.size / 5, 0.2);

    return Math.min(1.0, confidence);
  }

  private traceArgumentEvolution(rounds: DialecticalRound[]): DeliberationTrace['evolutionTrace'] {
    const trace: DeliberationTrace['evolutionTrace'] = [];

    for (let i = 1; i < rounds.length; i++) {
      const prev = rounds[i - 1];
      const curr = rounds[i];

      trace.push({
        round: i,
        position: curr.thesis || '',
        evolution: this.describeEvolution(prev, curr),
        catalyst: curr.participants[curr.participants.length - 1] || 'Unknown'
      });
    }

    return trace;
  }

  private describeEvolution(prev: DialecticalRound, curr: DialecticalRound): string {
    if (!prev.synthesis || !curr.thesis) return 'Position evolved';

    const similarity = this.calculateTextSimilarity(prev.synthesis, curr.thesis);

    if (similarity > 0.8) {
      return 'Position refined based on synthesis';
    } else if (similarity > 0.5) {
      return 'Position evolved with partial integration';
    } else {
      return 'Position significantly changed';
    }
  }

  private calculateConvergence(rounds: DialecticalRound[]): number {
    if (rounds.length < 2) return 0;

    let convergenceSum = 0;
    let comparisons = 0;

    for (let i = 1; i < rounds.length; i++) {
      const prev = rounds[i - 1];
      const curr = rounds[i];

      if (prev.synthesis && curr.thesis) {
        convergenceSum += this.calculateTextSimilarity(prev.synthesis, curr.thesis);
        comparisons++;
      }
    }

    return comparisons > 0 ? convergenceSum / comparisons : 0;
  }

  private generateEffectivenessInsights(
    rounds: DialecticalRound[],
    synthesis?: DialecticalSynthesis
  ): string[] {
    const insights: string[] = [];

    if (rounds.length < 3) {
      insights.push('Limited exploration - consider more dialectical rounds');
    }

    const participantCount = new Set(rounds.flatMap(r => r.participants)).size;
    if (participantCount < 3) {
      insights.push('Limited perspectives - encourage more diverse participation');
    }

    const argumentCount = rounds.reduce((sum, r) => sum + r.arguments.length, 0);
    if (argumentCount < rounds.length * 2) {
      insights.push('Sparse argumentation - seek more counter-arguments');
    }

    if (synthesis?.confidence && synthesis.confidence < 0.6) {
      insights.push('Low synthesis confidence - explore more thoroughly');
    }

    const unresolvedCount = synthesis?.unresolvedIssues.length || 0;
    if (unresolvedCount > 2) {
      insights.push('Many unresolved issues - may need additional rounds');
    }

    if (insights.length === 0) {
      insights.push('Strong dialectical process with good synthesis');
    }

    return insights;
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\W+/).filter(w => w.length > 3));
    const words2 = new Set(text2.toLowerCase().split(/\W+/).filter(w => w.length > 3));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }
}

// Export singleton instance
export const dialecticalDeliberationService = new DialecticalDeliberationService();
