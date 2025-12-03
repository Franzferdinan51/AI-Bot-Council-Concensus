import { PredictionData } from '../types/index.js';

export interface PredictionRecord {
  id: string;
  sessionId: string;
  topic: string;
  predictedProbability: number;
  predictedTimeline: string;
  predictedOutcome?: string;
  actualOutcome?: boolean;
  actualTimeline?: string;
  confidenceLevel: number;
  brierScore?: number;
  councilorId: string;
  councilorName: string;
  timestamp: number;
  trackingData: {
    sourceData: string;
    reasoning: string;
    calibrationMethod: string;
  };
}

export interface PredictionOutcome {
  predictionId: string;
  actualOutcome: boolean;
  actualTimeline?: string;
  verificationDate: number;
  notes?: string;
}

export interface CalibrationMetrics {
  totalPredictions: number;
  trackedOutcomes: number;
  brierScore: number;
  meanAbsoluteError: number;
  accuracy: number;
  calibrationCurve: CalibrationPoint[];
  councilorAccuracy: Map<string, {
    name: string;
    accuracy: number;
    brierScore: number;
    predictionCount: number;
  }>;
}

export interface CalibrationPoint {
  probabilityBin: number; // 0-100 in bins of 10
  predictedCount: number;
  actualCount: number;
  calibrationError: number;
}

export class PredictionTrackingService {
  private predictions: Map<string, PredictionRecord> = new Map();
  private outcomes: Map<string, PredictionOutcome> = new Map();

  /**
   * Store a prediction for tracking
   */
  async storePrediction(
    sessionId: string,
    predictionData: PredictionData,
    councilorId: string,
    councilorName: string
  ): Promise<string> {
    const id = `pred-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const record: PredictionRecord = {
      id,
      sessionId,
      topic: predictionData.outcome,
      predictedProbability: predictionData.confidence,
      predictedTimeline: predictionData.timeline,
      confidenceLevel: predictionData.confidence,
      councilorId,
      councilorName,
      timestamp: Date.now(),
      trackingData: {
        sourceData: predictionData.reasoning || '',
        reasoning: predictionData.reasoning || '',
        calibrationMethod: 'initial'
      }
    };

    this.predictions.set(id, record);
    return id;
  }

  /**
   * Record the actual outcome of a prediction
   */
  async recordOutcome(
    predictionId: string,
    actualOutcome: boolean,
    actualTimeline?: string,
    notes?: string
  ): Promise<void> {
    const prediction = this.predictions.get(predictionId);
    if (!prediction) {
      throw new Error(`Prediction ${predictionId} not found`);
    }

    // Calculate Brier Score
    const brierScore = this.calculateBrierScore(
      prediction.predictedProbability,
      actualOutcome
    );

    // Update prediction record
    prediction.actualOutcome = actualOutcome;
    prediction.actualTimeline = actualTimeline;
    prediction.brierScore = brierScore;

    // Store outcome
    const outcome: PredictionOutcome = {
      predictionId,
      actualOutcome,
      actualTimeline,
      verificationDate: Date.now(),
      notes
    };

    this.outcomes.set(predictionId, outcome);
    this.predictions.set(predictionId, prediction);

    console.error(`[PredictionTracking] Outcome recorded for ${predictionId}: ${actualOutcome ? 'YES' : 'NO'}, Brier Score: ${brierScore.toFixed(3)}`);
  }

  /**
   * Calculate Brier Score for a single prediction
   * Brier Score = (forecasted_probability - actual_outcome)²
   * Range: 0 (perfect) to 1 (worst)
   */
  private calculateBrierScore(probability: number, actualOutcome: boolean): number {
    const forecast = probability / 100; // Convert percentage to 0-1
    const actual = actualOutcome ? 1 : 0;
    return Math.pow(forecast - actual, 2);
  }

  /**
   * Get all predictions for a session
   */
  getSessionPredictions(sessionId: string): PredictionRecord[] {
    const results: PredictionRecord[] = [];
    for (const prediction of this.predictions.values()) {
      if (prediction.sessionId === sessionId) {
        results.push(prediction);
      }
    }
    return results;
  }

  /**
   * Get prediction by ID
   */
  getPrediction(id: string): PredictionRecord | undefined {
    return this.predictions.get(id);
  }

  /**
   * Calculate comprehensive calibration metrics
   */
  calculateCalibrationMetrics(): CalibrationMetrics {
    const predictions = Array.from(this.predictions.values());
    const trackedPredictions = predictions.filter(p => p.actualOutcome !== undefined);

    const totalPredictions = predictions.length;
    const trackedOutcomes = trackedPredictions.length;

    if (trackedOutcomes === 0) {
      return {
        totalPredictions,
        trackedOutcomes: 0,
        brierScore: 0,
        meanAbsoluteError: 0,
        accuracy: 0,
        calibrationCurve: [],
        councilorAccuracy: new Map()
      };
    }

    // Calculate overall metrics
    let brierSum = 0;
    let maeSum = 0;
    let correctPredictions = 0;

    // Group by probability bins for calibration curve
    const binSize = 10; // 10% bins
    const bins: Map<number, { predicted: number; actual: number }> = new Map();
    for (let i = 0; i <= 100; i += binSize) {
      bins.set(i, { predicted: 0, actual: 0 });
    }

    // Track councilor performance
    const councilorStats: Map<string, { count: number; correct: number; brierSum: number }> = new Map();

    for (const prediction of trackedPredictions) {
      const { predictedProbability, actualOutcome } = prediction;
      const actual = actualOutcome ? 1 : 0;

      // Brier Score
      brierSum += prediction.brierScore || 0;

      // Mean Absolute Error (in percentage points)
      maeSum += Math.abs(predictedProbability - (actual * 100));

      // Accuracy
      if ((predictedProbability >= 50 && actualOutcome) ||
          (predictedProbability < 50 && !actualOutcome)) {
        correctPredictions++;
      }

      // Calibration curve - bin predictions
      const bin = Math.floor(predictedProbability / binSize) * binSize;
      const binData = bins.get(bin)!;
      binData.predicted += 1;
      binData.actual += actual;
      bins.set(bin, binData);

      // Councilor stats
      const councilorId = prediction.councilorId;
      const stats = councilorStats.get(councilorId) || { count: 0, correct: 0, brierSum: 0 };
      stats.count += 1;
      if ((predictedProbability >= 50 && actualOutcome) ||
          (predictedProbability < 50 && !actualOutcome)) {
        stats.correct += 1;
      }
      stats.brierSum += prediction.brierScore || 0;
      councilorStats.set(councilorId, stats);
    }

    // Build calibration curve
    const calibrationCurve: CalibrationPoint[] = [];
    for (const [bin, data] of bins.entries()) {
      if (data.predicted > 0) {
        const actualRate = (data.actual / data.predicted) * 100;
        const calibrationError = Math.abs(bin - actualRate);
        calibrationCurve.push({
          probabilityBin: bin,
          predictedCount: data.predicted,
          actualCount: data.actual,
          calibrationError
        });
      }
    }

    // Build councilor accuracy map
    const councilorAccuracy: Map<string, any> = new Map();
    for (const [councilorId, stats] of councilorStats.entries()) {
      const prediction = trackedPredictions.find(p => p.councilorId === councilorId);
      councilorAccuracy.set(councilorId, {
        name: prediction?.councilorName || 'Unknown',
        accuracy: stats.count > 0 ? (stats.correct / stats.count) * 100 : 0,
        brierScore: stats.count > 0 ? stats.brierSum / stats.count : 0,
        predictionCount: stats.count
      });
    }

    return {
      totalPredictions,
      trackedOutcomes,
      brierScore: brierSum / trackedOutcomes,
      meanAbsoluteError: maeSum / trackedOutcomes,
      accuracy: (correctPredictions / trackedOutcomes) * 100,
      calibrationCurve,
      councilorAccuracy
    };
  }

  /**
   * Get untracked predictions (for following up)
   */
  getUntrackedPredictions(olderThanDays: number = 30): PredictionRecord[] {
    const cutoff = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    const results: PredictionRecord[] = [];

    for (const prediction of this.predictions.values()) {
      if (prediction.actualOutcome === undefined && prediction.timestamp < cutoff) {
        results.push(prediction);
      }
    }

    return results;
  }

  /**
   * Get prediction accuracy trends over time
   */
  getAccuracyTrend(days: number = 90): Array<{
    date: string;
    accuracy: number;
    predictionCount: number;
    brierScore: number;
  }> {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const predictions = Array.from(this.predictions.values())
      .filter(p => p.timestamp >= cutoff && p.actualOutcome !== undefined);

    // Group by day
    const dayGroups: Map<string, PredictionRecord[]> = new Map();
    for (const prediction of predictions) {
      const date = new Date(prediction.timestamp).toISOString().split('T')[0];
      const group = dayGroups.get(date) || [];
      group.push(prediction);
      dayGroups.set(date, group);
    }

    // Calculate metrics per day
    const trend: Array<{ date: string; accuracy: number; predictionCount: number; brierScore: number }> = [];
    for (const [date, preds] of dayGroups.entries()) {
      let correct = 0;
      let brierSum = 0;
      for (const pred of preds) {
        if ((pred.predictedProbability >= 50 && pred.actualOutcome) ||
            (pred.predictedProbability < 50 && !pred.actualOutcome)) {
          correct++;
        }
        brierSum += pred.brierScore || 0;
      }
      trend.push({
        date,
        accuracy: (correct / preds.length) * 100,
        predictionCount: preds.length,
        brierScore: brierSum / preds.length
      });
    }

    return trend.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Generate a prediction tracking report
   */
  generateTrackingReport(): string {
    const metrics = this.calculateCalibrationMetrics();
    const untracked = this.getUntrackedPredictions(30);
    const trend = this.getAccuracyTrend(30);

    const lines: string[] = [];
    lines.push('='.repeat(70));
    lines.push('PREDICTION TRACKING REPORT');
    lines.push('='.repeat(70));
    lines.push('');

    lines.push('OVERVIEW:');
    lines.push(`  Total Predictions: ${metrics.totalPredictions}`);
    lines.push(`  Tracked Outcomes: ${metrics.trackedOutcomes}`);
    lines.push(`  Tracking Rate: ${((metrics.trackedOutcomes / metrics.totalPredictions) * 100).toFixed(1)}%`);
    lines.push('');

    lines.push('ACCURACY METRICS:');
    lines.push(`  Overall Accuracy: ${metrics.accuracy.toFixed(1)}%`);
    lines.push(`  Brier Score: ${metrics.brierScore.toFixed(3)} (lower is better)`);
    lines.push(`  Mean Absolute Error: ${metrics.meanAbsoluteError.toFixed(1)} percentage points`);
    lines.push('');

    lines.push('COUNCILOR PERFORMANCE:');
    for (const [_, stats] of metrics.councilorAccuracy) {
      lines.push(`  ${stats.name}:`);
      lines.push(`    Accuracy: ${stats.accuracy.toFixed(1)}%`);
      lines.push(`    Brier Score: ${stats.brierScore.toFixed(3)}`);
      lines.push(`    Predictions: ${stats.predictionCount}`);
    }
    lines.push('');

    lines.push('UNTRACKED PREDICTIONS (>30 days old):');
    lines.push(`  Count: ${untracked.length}`);
    if (untracked.length > 0) {
      lines.push('  Examples:');
      untracked.slice(0, 5).forEach(p => {
        lines.push(`    - ${p.topic} (${new Date(p.timestamp).toLocaleDateString()})`);
      });
    }
    lines.push('');

    lines.push('RECENT TREND (Last 30 days):');
    if (trend.length > 0) {
      const recentAvg = trend[trend.length - 1];
      lines.push(`  Current Accuracy: ${recentAvg.accuracy.toFixed(1)}%`);
      lines.push(`  Recent Brier Score: ${recentAvg.brierScore.toFixed(3)}`);
      lines.push(`  Predictions This Period: ${trend.reduce((sum, d) => sum + d.predictionCount, 0)}`);
    } else {
      lines.push('  No recent tracked predictions');
    }
    lines.push('');

    lines.push('='.repeat(70));

    return lines.join('\n');
  }

  /**
   * Export predictions as JSON
   */
  exportPredictions(): string {
    return JSON.stringify({
      predictions: Array.from(this.predictions.values()),
      outcomes: Array.from(this.outcomes.values())
    }, null, 2);
  }
}

// Export singleton instance
export const predictionTrackingService = new PredictionTrackingService();
