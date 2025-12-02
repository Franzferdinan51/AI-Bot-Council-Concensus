import { BotConfig, PredictionData } from '../types/index.js';
import { predictionTrackingService } from './predictionTrackingService.js';

export interface IndividualPrediction {
  botId: string;
  botName: string;
  prediction: {
    outcome: string;
    probability: number; // 0-100
    timeline: string;
    reasoning: string;
  };
  confidence: number;
  modelQuality: number; // Historical accuracy
}

export interface EnsembleResult {
  outcome: string;
  meanProbability: number;
  medianProbability: number;
  standardDeviation: number;
  confidenceInterval: {
    lower: number;
    upper: number;
    confidenceLevel: number; // e.g., 0.95 for 95%
  };
  predictionDistribution: number[];
  individualPredictions: IndividualPrediction[];
  aggregationMethod: 'mean' | 'median' | 'weighted' | 'bayesian';
  uncertaintyLevel: 'low' | 'medium' | 'high';
  calibrationScore: number;
  consensusStrength: number;
}

export interface PredictionInsight {
  type: 'consensus' | 'disagreement' | 'outlier' | 'trend';
  title: string;
  description: string;
  confidence: number;
  supportingPredictions: string[];
}

/**
 * Ensemble Prediction Service with Confidence Intervals
 *
 * Implements sophisticated prediction aggregation:
 * - Multiple ensemble methods (mean, median, weighted, Bayesian)
 * - Confidence intervals using statistical methods
 * - Uncertainty quantification
 * - Calibration analysis
 * - Outlier detection
 */
export class EnsemblePredictionService {
  private historicalCalibration: Map<string, number> = new Map(); // botId -> calibration score

  /**
   * Generate ensemble prediction from multiple bots
   */
  async generateEnsemblePrediction(
    predictions: IndividualPrediction[],
    confidenceLevel: number = 0.95
  ): Promise<EnsembleResult> {
    if (predictions.length === 0) {
      throw new Error('No predictions provided');
    }

    // Extract probabilities for statistical analysis
    const probabilities = predictions.map(p => p.prediction.probability);
    const outcomes = predictions.map(p => p.prediction.outcome);

    // Check for outcome consensus
    const outcomeFrequency = this.calculateOutcomeFrequency(outcomes);
    const dominantOutcome = outcomeFrequency[0]?.outcome || outcomes[0];

    // Calculate ensemble statistics
    const meanProb = this.calculateMean(probabilities);
    const medianProb = this.calculateMedian(probabilities);
    const stdDev = this.calculateStandardDeviation(probabilities, meanProb);

    // Generate confidence intervals
    const confidenceInterval = this.calculateConfidenceInterval(
      probabilities,
      confidenceLevel
    );

    // Determine aggregation method based on data characteristics
    const aggregationMethod = this.selectAggregationMethod(predictions, stdDev);

    // Calculate weighted probability
    const weightedProb = this.calculateWeightedProbability(predictions);

    // Determine final probability based on method
    let finalProbability: number;
    switch (aggregationMethod) {
      case 'weighted':
        finalProbability = weightedProb;
        break;
      case 'median':
        finalProbability = medianProb;
        break;
      case 'bayesian':
        finalProbability = this.calculateBayesianProbability(predictions);
        break;
      default:
        finalProbability = meanProb;
    }

    // Calculate uncertainty level
    const uncertaintyLevel = this.calculateUncertaintyLevel(stdDev, predictions.length);

    // Calculate consensus strength
    const consensusStrength = this.calculateConsensusStrength(probabilities);

    // Calculate calibration score
    const calibrationScore = this.calculateCalibrationScore(predictions);

    return {
      outcome: dominantOutcome,
      meanProbability: meanProb,
      medianProbability: medianProb,
      standardDeviation: stdDev,
      confidenceInterval,
      predictionDistribution: probabilities,
      individualPredictions: predictions,
      aggregationMethod,
      uncertaintyLevel,
      calibrationScore,
      consensusStrength
    };
  }

  /**
   * Calculate prediction intervals for timeline
   */
  calculateTimelineDistribution(predictions: IndividualPrediction[]): {
    earliest: string;
    latest: string;
    median: string;
    distribution: Array<{ timeline: string; count: number }>;
  } {
    const timelines = predictions.map(p => p.prediction.timeline);

    // Parse timeline estimates
    const parsedTimelines = timelines.map(t => this.parseTimeline(t));

    const sortedTimelines = parsedTimelines.sort((a, b) => a.days - b.days);

    const earliest = sortedTimelines[0]?.raw || 'Unknown';
    const latest = sortedTimelines[sortedTimelines.length - 1]?.raw || 'Unknown';
    const median = this.convertDaysToTimeline(sortedTimelines[Math.floor(sortedTimelines.length / 2)]?.days || 0);

    // Create distribution
    const distribution = this.groupTimelineDistribution(timelines);

    return {
      earliest,
      latest,
      median,
      distribution
    };
  }

  /**
   * Generate insights from ensemble prediction
   */
  generateInsights(result: EnsembleResult): PredictionInsight[] {
    const insights: PredictionInsight[] = [];

    // Consensus insight
    if (result.consensusStrength > 0.8) {
      insights.push({
        type: 'consensus',
        title: 'Strong Consensus',
        description: `All predictors agree on outcome with ${(result.consensusStrength * 100).toFixed(0)}% consensus strength`,
        confidence: result.consensusStrength,
        supportingPredictions: result.individualPredictions.map(p => p.botId)
      });
    }

    // Disagreement insight
    if (result.standardDeviation > 15) {
      insights.push({
        type: 'disagreement',
        title: 'Significant Disagreement',
        description: `High variance in predictions (σ=${result.standardDeviation.toFixed(1)}). Consider gathering more data.`,
        confidence: Math.min(result.standardDeviation / 30, 1.0),
        supportingPredictions: result.individualPredictions
          .filter(p => Math.abs(p.prediction.probability - result.meanProbability) > result.standardDeviation)
          .map(p => p.botId)
      });
    }

    // Uncertainty insight
    if (result.uncertaintyLevel === 'high') {
      insights.push({
        type: 'trend',
        title: 'High Uncertainty',
        description: 'Prediction has high uncertainty. Consider updating predictions as new information becomes available.',
        confidence: 0.9,
        supportingPredictions: []
      });
    }

    // Outlier detection
    const outliers = this.detectOutliers(result.individualPredictions, result.meanProbability, result.standardDeviation);
    if (outliers.length > 0) {
      insights.push({
        type: 'outlier',
        title: 'Outlier Detected',
        description: `${outliers.length} prediction(s) significantly deviate from ensemble mean`,
        confidence: 0.8,
        supportingPredictions: outliers.map(o => o.botId)
      });
    }

    return insights;
  }

  /**
   * Update calibration scores based on outcomes
   */
  async updateCalibration(predictions: IndividualPrediction[], actualOutcome: boolean): Promise<void> {
    for (const prediction of predictions) {
      const predictedProb = prediction.prediction.probability / 100;
      const error = Math.abs(predictedProb - (actualOutcome ? 1 : 0));

      // Update running calibration score (exponential moving average)
      const currentScore = this.historicalCalibration.get(prediction.botId) || 1.0;
      const alpha = 0.1; // Learning rate
      const newScore = currentScore - alpha * (error - (1 - currentScore));

      this.historicalCalibration.set(prediction.botId, Math.max(0, Math.min(1, newScore)));
    }
  }

  /**
   * Get calibration statistics
   */
  getCalibrationStats(): Map<string, {
    botId: string;
    botName: string;
    calibrationScore: number;
    predictionCount: number;
    reliability: 'high' | 'medium' | 'low';
  }> {
    const stats = new Map<string, any>();

    for (const [botId, score] of this.historicalCalibration.entries()) {
      stats.set(botId, {
        botId,
        botName: 'Unknown', // Would need to map from botId
        calibrationScore: score,
        predictionCount: 1, // Would track this separately
        reliability: score > 0.7 ? 'high' : score > 0.5 ? 'medium' : 'low'
      });
    }

    return stats;
  }

  /**
   * Predict ensemble accuracy
   */
  predictEnsembleAccuracy(predictions: IndividualPrediction[]): {
    predictedAccuracy: number;
    confidenceInterval: { lower: number; upper: number };
    factors: string[];
  } {
    // Base accuracy on individual calibration scores
    const calibrations = predictions.map(p => this.historicalCalibration.get(p.botId) || 0.5);
    const avgCalibration = calibrations.reduce((sum, c) => sum + c, 0) / calibrations.length;

    // Ensemble effect: more predictors generally improve accuracy
    const ensembleBoost = Math.min(predictions.length * 0.05, 0.3);

    // Disagreement reduces predicted accuracy
    const probabilities = predictions.map(p => p.prediction.probability);
    const stdDev = this.calculateStandardDeviation(probabilities, this.calculateMean(probabilities));
    const disagreementPenalty = Math.max(0, stdDev / 100 * 0.2);

    const predictedAccuracy = Math.max(0, Math.min(1, avgCalibration + ensembleBoost - disagreementPenalty));

    // Confidence interval based on sample size
    const confidenceInterval = {
      lower: Math.max(0, predictedAccuracy - 0.1 / Math.sqrt(predictions.length)),
      upper: Math.min(1, predictedAccuracy + 0.1 / Math.sqrt(predictions.length))
    };

    const factors = [
      `Average individual calibration: ${(avgCalibration * 100).toFixed(0)}%`,
      `Ensemble size: ${predictions.length} predictors`,
      `Disagreement level: ${stdDev > 15 ? 'High' : 'Low'} (σ=${stdDev.toFixed(1)})`
    ];

    return {
      predictedAccuracy,
      confidenceInterval,
      factors
    };
  }

  // Private helper methods

  private calculateOutcomeFrequency(outcomes: string[]): Array<{ outcome: string; count: number; percentage: number }> {
    const frequency = new Map<string, number>();
    outcomes.forEach(outcome => {
      frequency.set(outcome, (frequency.get(outcome) || 0) + 1);
    });

    return Array.from(frequency.entries())
      .map(([outcome, count]) => ({
        outcome,
        count,
        percentage: (count / outcomes.length) * 100
      }))
      .sort((a, b) => b.count - a.count);
  }

  private calculateMean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  private calculateStandardDeviation(values: number[], mean: number): number {
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(variance);
  }

  private calculateConfidenceInterval(
    values: number[],
    confidenceLevel: number
  ): { lower: number; upper: number; confidenceLevel: number } {
    const mean = this.calculateMean(values);
    const stdDev = this.calculateStandardDeviation(values, mean);
    const n = values.length;

    // Using t-distribution approximation (for small samples)
    const zScore = confidenceLevel === 0.95 ? 1.96 : 2.58; // 95% or 99%
    const margin = zScore * (stdDev / Math.sqrt(n));

    return {
      lower: Math.max(0, mean - margin),
      upper: Math.min(100, mean + margin),
      confidenceLevel
    };
  }

  private selectAggregationMethod(
    predictions: IndividualPrediction[],
    stdDev: number
  ): 'mean' | 'median' | 'weighted' | 'bayesian' {
    // Use weighted average if we have calibration data
    const hasCalibration = predictions.some(p => this.historicalCalibration.has(p.botId));
    if (hasCalibration) return 'weighted';

    // Use median if high disagreement
    if (stdDev > 20) return 'median';

    // Use Bayesian if enough data
    if (predictions.length >= 5) return 'bayesian';

    // Default to mean
    return 'mean';
  }

  private calculateWeightedProbability(predictions: IndividualPrediction[]): number {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const prediction of predictions) {
      const weight = this.historicalCalibration.get(prediction.botId) || 0.5;
      weightedSum += prediction.prediction.probability * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : this.calculateMean(predictions.map(p => p.prediction.probability));
  }

  private calculateBayesianProbability(predictions: IndividualPrediction[]): number {
    // Simplified Bayesian update
    // Prior: uniform distribution
    // Likelihood: based on prediction probabilities
    // Posterior: weighted average with uncertainty

    const likelihoods = predictions.map(p => {
      const calibration = this.historicalCalibration.get(p.botId) || 0.5;
      return p.prediction.probability * calibration;
    });

    const prior = 0.5;
    const likelihoodSum = likelihoods.reduce((sum, l) => sum + l, 0);

    // Bayesian update formula (simplified)
    const posterior = (prior + likelihoodSum) / (1 + predictions.length);

    return posterior;
  }

  private calculateUncertaintyLevel(stdDev: number, sampleSize: number): 'low' | 'medium' | 'high' {
    const coefficientOfVariation = stdDev / (this.calculateMean([]) || 1);
    if (sampleSize < 3 || stdDev > 20) return 'high';
    if (stdDev > 10) return 'medium';
    return 'low';
  }

  private calculateConsensusStrength(probabilities: number[]): number {
    const mean = this.calculateMean(probabilities);
    const stdDev = this.calculateStandardDeviation(probabilities, mean);

    // Convert standard deviation to consensus strength (0-1)
    // Lower stdDev = higher consensus
    const consensus = 1 - (stdDev / 50); // Normalize by max possible stdDev
    return Math.max(0, Math.min(1, consensus));
  }

  private calculateCalibrationScore(predictions: IndividualPrediction[]): number {
    // Average calibration of participating bots
    const calibrations = predictions.map(p => this.historicalCalibration.get(p.botId) || 0.5);
    return calibrations.reduce((sum, c) => sum + c, 0) / calibrations.length;
  }

  private parseTimeline(timeline: string): { raw: string; days: number } {
    // Simple parsing - in production would use more sophisticated NLP
    const daysMatch = timeline.match(/(\d+)\s*day/);
    const monthsMatch = timeline.match(/(\d+)\s*month/);
    const yearsMatch = timeline.match(/(\d+)\s*year/);

    let days = 0;
    if (daysMatch) days += parseInt(daysMatch[1]);
    if (monthsMatch) days += parseInt(monthsMatch[1]) * 30;
    if (yearsMatch) days += parseInt(yearsMatch[1]) * 365;

    return { raw: timeline, days: days || 0 };
  }

  private convertDaysToTimeline(days: number): string {
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.round(days / 30)} months`;
    return `${Math.round(days / 365)} years`;
  }

  private groupTimelineDistribution(timelines: string[]): Array<{ timeline: string; count: number }> {
    const distribution = new Map<string, number>();
    timelines.forEach(t => {
      distribution.set(t, (distribution.get(t) || 0) + 1);
    });

    return Array.from(distribution.entries()).map(([timeline, count]) => ({ timeline, count }));
  }

  private detectOutliers(predictions: IndividualPrediction[], mean: number, stdDev: number): IndividualPrediction[] {
    return predictions.filter(p =>
      Math.abs(p.prediction.probability - mean) > 2 * stdDev
    );
  }

  /**
   * Export ensemble prediction data
   */
  exportEnsembleData(predictions: IndividualPrediction[], result: EnsembleResult): string {
    return JSON.stringify({
      individualPredictions: predictions,
      ensembleResult: result,
      calibration: Object.fromEntries(this.historicalCalibration.entries()),
      timestamp: new Date().toISOString()
    }, null, 2);
  }
}

// Export singleton instance
export const ensemblePredictionService = new EnsemblePredictionService();
