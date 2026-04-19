/**
 * predictionService.ts
 *
 * Core forecasting service for AI Senate Prediction Mode.
 * Implements Good Judgment / Superforecasting methodology:
 * - Base rates (Outside View)
 * - Kestrel/Tern analysis (decomposition)
 * - Calibration tracking
 * - Contrary thinking (falsification)
 * - Temporal decay
 * - Conditional branching
 */

import {
  searchForecastData,
  getHistoricalBaseRate,
  getNewsSentiment,
  getEconomicIndicators,
  getExpertForecasts,
  decomposeQuestion,
  combineProbabilities,
  calculateCalibrationScore,
  addCalibrationRecord,
  getCalibrationHistory,
  applyTemporalDecay,
  calculateConditionalProbability,
  SearchResult,
  BaseRateResult,
  NewsSentiment,
  EconomicIndicators,
  ExpertForecast,
  CalibrationRecord
} from './tools/predictionTools';

export type { CalibrationRecord };

// --- MAIN FORECAST INTERFACE ---

export interface ForecastFactor {
  factor: string;
  direction: 'for' | 'against';
  weight: number;    // 0-1
  evidence: string;
}

export interface Forecast {
  question: string;
  baseRate: number;              // Historical frequency (0-1)
  timeframe: string;
  probability: number;            // Final probability (0-100%)
  confidence: number;            // Confidence in prediction (0-1)
  reasoning: string;
  factors: ForecastFactor[];
  contraryEvidence: string;
  sources: string[];
  calibrationNote: string;
  lastUpdated: number;

  // New Superforecasting fields
  subQuestionAnalysis?: {
    subQuestions: { question: string; probability: number; direction: 'and' | 'or' }[];
    combinedProbability: number;
    decompositionQuality: string;
  };
  conditionalDrivers?: {
    driver: string;
    probabilityIfDriver: number;
    probabilityIfNot: number;
    currentLikelihood: number;
    conditionalProbability: number;
  }[];
  temporalNote?: string;         // "Prediction shifted X% due to new information"
  falsificationTest?: string;    // "What would prove this forecast wrong"
  calibrationHistory?: CalibrationRecord[];
}

export interface CouncilorForecast {
  councilorId: string;
  councilorName: string;
  probability: number;
  confidence: number;
  reasoning: string;
  factors: ForecastFactor[];
  contraryEvidence: string;
  sources: string[];
  isOverconfident: boolean;       // If confidence > accuracy history suggests
  calibrationAdjustment: number;  // How much to adjust based on known bias
  calibrationAccuracy?: number;   // 0-1, historical accuracy for this councilor
  adjustedProbability?: number;   // Probability after calibration adjustment
}

// --- SUPERFORECASTER PERSONAS ---

export interface SuperforecasterPersona {
  id: string;
  name: string;
  calibrationAccuracy: number;  // 0-1 (e.g., 0.78 = 78% of 70% predictions come true)
  knownBias: 'optimist' | 'pessimist' | 'contrarian' | 'calm' | null;
  biasStrength: number;           // 0-1 how strong the bias is
  specialty: string;              // What they're good at
  famousMiss?: string;           // Notable failed prediction
}

export const SUPERFORECASTERS: SuperforecasterPersona[] = [
  {
    id: 'superforecaster-alpha',
    name: 'The Superforecaster',
    calibrationAccuracy: 0.78,
    knownBias: null,
    biasStrength: 0,
    specialty: 'Geopolitics & Markets'
  },
  {
    id: 'skeptic-beta',
    name: 'The Skeptic',
    calibrationAccuracy: 0.42,   // Often wrong, but LOUD about it
    knownBias: 'contrarian',
    biasStrength: 0.6,
    specialty: 'Finding flaws in consensus',
    famousMiss: 'Called the 2008 crisis years early but also called 47 false alarms before it'
  },
  {
    id: 'bull-gamma',
    name: 'The Bull',
    calibrationAccuracy: 0.61,
    knownBias: 'optimist',
    biasStrength: 0.5,
    specialty: 'Tech startups, growth scenarios'
  },
  {
    id: 'bear-delta',
    name: 'The Bear',
    calibrationAccuracy: 0.58,
    knownBias: 'pessimist',
    biasStrength: 0.45,
    specialty: 'Risk analysis, downside scenarios'
  },
  {
    id: 'disagreeable-epsilon',
    name: 'The Disagreeable',
    calibrationAccuracy: 0.55,
    knownBias: 'contrarian',
    biasStrength: 0.7,
    specialty: 'Going against the crowd when wrong, but sometimes right at key moments',
    famousMiss: 'Correctly predicted Brexit when 95% of experts said no'
  }
];

// --- MAIN FORECASTING ENGINE ---

export class PredictionEngine {
  private topic: string;
  private timeframe: string;
  private calibrationScore = calculateCalibrationScore();

  constructor(topic: string, timeframe: string = 'Next 12 months') {
    this.topic = topic;
    this.timeframe = timeframe;
  }

  /**
   * Run the full superforecasting pipeline
   */
  async generateForecast(): Promise<Forecast> {
    const sources: string[] = [];
    const factors: ForecastFactor[] = [];

    // 1. BASE RATE ANALYSIS (Outside View)
    const baseRateResult = await getHistoricalBaseRate(this.topic);
    sources.push(baseRateResult.source);
    const baseRate = baseRateResult.baseRate;

    // 2. DECOMPOSE INTO SUB-QUESTIONS (Kestrel/Tern Analysis)
    const decomposition = decomposeQuestion(this.topic);

    // 3. GATHER RECENT NEWS
    const newsSentiment = await getNewsSentiment(this.topic);
    const newsWeight = (newsSentiment.positive - newsSentiment.negative) /
                       Math.max(newsSentiment.positive + newsSentiment.negative, 1);

    // 4. ECONOMIC INDICATORS (if relevant)
    let econIndicators: EconomicIndicators | null = null;
    const econKeywords = ['economy', 'recession', 'inflation', 'market', 'stock', 'gdp', 'jobs', 'unemployment'];
    if (econKeywords.some(k => this.topic.toLowerCase().includes(k))) {
      try {
        econIndicators = await getEconomicIndicators();
        sources.push(econIndicators.source);
      } catch (e) {
        console.warn('Economic indicators unavailable:', e);
      }
    }

    // 5. EXPERT FORECASTS (Metaculus, GJO)
    const expertForecasts = await getExpertForecasts(this.topic);
    sources.push(...expertForecasts.map(f => f.source));

    // 6. CALCULATE TEMPORAL DECAY
    let adjustedBaseRate = baseRate;
    if (newsSentiment.recentHeadlines.length > 0) {
      // Assume 1 day since last news update for simplicity
      adjustedBaseRate = applyTemporalDecay(baseRate, newsWeight, 1);
    }

    // 7. BUILD FACTORS LIST
    if (newsWeight > 0) {
      factors.push({
        factor: 'Recent positive news coverage',
        direction: 'for',
        weight: Math.abs(newsWeight) * 0.15,
        evidence: `${newsSentiment.positive} positive vs ${newsSentiment.negative} negative headlines`
      });
    } else if (newsWeight < 0) {
      factors.push({
        factor: 'Recent negative news coverage',
        direction: 'against',
        weight: Math.abs(newsWeight) * 0.15,
        evidence: `${newsSentiment.negative} negative vs ${newsSentiment.positive} positive headlines`
      });
    }

    // 8. ADD ECONOMIC FACTORS
    if (econIndicators) {
      if (econIndicators.gdpGrowth !== undefined) {
        const direction = econIndicators.gdpGrowth > 0 ? 'for' : 'against';
        factors.push({
          factor: `GDP growth: ${econIndicators.gdpGrowth.toFixed(1)}%`,
          direction,
          weight: 0.2,
          evidence: 'Quarterly GDP change'
        });
      }
      if (econIndicators.unemploymentRate !== undefined) {
        const direction = econIndicators.unemploymentRate < 5 ? 'for' : 'against';
        factors.push({
          factor: `Unemployment: ${econIndicators.unemploymentRate}%`,
          direction,
          weight: 0.15,
          evidence: 'Labor market health indicator'
        });
      }
    }

    // 9. ADD EXPERT FORECAST FACTORS
    if (expertForecasts.length > 0) {
      const avgExpertProb = expertForecasts.reduce((sum, f) => sum + f.communityProb, 0) / expertForecasts.length;
      factors.push({
        factor: `Expert consensus (${expertForecasts[0].source})`,
        direction: avgExpertProb > 50 ? 'for' : 'against',
        weight: 0.25,
        evidence: `Average expert probability: ${avgExpertProb.toFixed(1)}%`
      });
    }

    // 10. CALCULATE FINAL PROBABILITY
    let finalProbability = adjustedBaseRate * 100;

    // Weight factors adjustments
    let totalWeight = 0;
    let weightedAdjustment = 0;

    for (const factor of factors) {
      weightedAdjustment += (factor.direction === 'for' ? 1 : -1) * factor.weight;
      totalWeight += factor.weight;
    }

    if (totalWeight > 0) {
      const normalizedAdjustment = weightedAdjustment / totalWeight;
      // Cap the adjustment at ±20%
      finalProbability += normalizedAdjustment * 20;
    }

    // Clamp to reasonable bounds (1% - 99%)
    finalProbability = Math.min(Math.max(finalProbability, 1), 99);

    // 11. CALCULATE CONFIDENCE
    // Higher confidence when:
    // - Strong base rate data
    // - Multiple expert sources agree
    // - Clear news sentiment
    // - Low calibration score (we're well-calibrated ourselves)

    let confidence = 0.5; // Base confidence

    if (baseRateResult.historicalContext.includes('%')) confidence += 0.1;
    if (expertForecasts.length >= 2) confidence += 0.15;
    if (newsSentiment.recentHeadlines.length >= 3) confidence += 0.1;
    if (econIndicators) confidence += 0.1;

    // Adjust for own calibration
    if (this.calibrationScore.totalPredictions >= 10) {
      const selfCalibrationFactor = 1 - this.calibrationScore.brierScore;
      confidence *= selfCalibrationFactor;
    }

    confidence = Math.min(Math.max(confidence, 0.1), 0.95);

    // 12. CONTRARY THINKING - What would make this WRONG?
    const contraryEvidence = this.generateContraryEvidence(baseRateResult, newsSentiment, econIndicators);

    // 13. FALSIFICATION TEST
    const falsificationTest = this.generateFalsificationTest(finalProbability);

    // 14. BUILD CALIBRATION NOTE
    const calibrationNote = this.generateCalibrationNote();

    // 15. SUBQUESTION ANALYSIS (if decomposed)
    let subQuestionAnalysis = undefined;
    if (decomposition.subQuestions.length > 0) {
      const combined = combineProbabilities(
        decomposition.subQuestions.map(sq => ({
          probability: sq.probability,
          direction: sq.direction
        })),
        decomposition.combinationType
      );
      subQuestionAnalysis = {
        subQuestions: decomposition.subQuestions,
        combinedProbability: combined * 100,
        decompositionQuality: decomposition.subQuestions.length > 1 ? 'Good decomposition' : 'Single question'
      };
    }

    // 16. CONDITIONAL DRIVERS
    const conditionalDrivers = this.identifyConditionalDrivers(finalProbability);

    return {
      question: this.topic,
      baseRate: baseRateResult.baseRate,
      timeframe: this.timeframe,
      probability: Math.round(finalProbability),
      confidence: Math.round(confidence * 100) / 100,
      reasoning: this.buildReasoning(baseRateResult, factors, newsSentiment, econIndicators, expertForecasts),
      factors,
      contraryEvidence,
      sources: [...new Set(sources)].slice(0, 10),
      calibrationNote,
      lastUpdated: Date.now(),
      subQuestionAnalysis,
      conditionalDrivers,
      temporalNote: newsSentiment.recentHeadlines.length > 0
        ? `${newsSentiment.recentHeadlines.length} news items from last 48h factored in`
        : 'No recent news updates available',
      falsificationTest
    };
  }

  private generateContraryEvidence(
    baseRate: BaseRateResult,
    news: NewsSentiment,
    econ: EconomicIndicators | null
  ): string {
    const contraryPoints: string[] = [];

    // Base rate contrary
    if (baseRate.baseRate > 0.5) {
      contraryPoints.push(`Historical base rate suggests this is MORE likely (${(baseRate.baseRate * 100).toFixed(0)}%) — contrarians would bet against it.`);
    } else {
      contraryPoints.push(`Historical base rate is low (${(baseRate.baseRate * 100).toFixed(0)}%) — but rare events DO happen.`);
    }

    // News contrary
    if (news.negative > news.positive) {
      contraryPoints.push('Negative news bias could be overblown — markets often overreact to bad headlines.');
    }

    // Economic contrary
    if (econ) {
      if (econ.stockMarketChange !== undefined && econ.stockMarketChange < -2) {
        contraryPoints.push('Recent market drop could be temporary — buying opportunity, not collapse signal.');
      }
      if (econ.unemploymentRate !== undefined && econ.unemploymentRate > 5) {
        contraryPoints.push('High unemployment might trigger policy response, reducing severity.');
      }
    }

    return contraryPoints.join(' | ') || 'No specific contrary evidence identified.';
  }

  private generateFalsificationTest(probability: number): string {
    // "What would prove me wrong?" - The Tiger Woods test
    if (probability > 70) {
      return `This forecast would be proven WRONG if: (1) Key assumption underlying the ${probability}% probability fails, (2) Base rate evidence is overturned by new data, (3) Expert consensus shifts significantly. |
CONTINGENCY: If this forecast is wrong, the most likely alternative is [describe opposite outcome].`;
    } else if (probability < 30) {
      return `This forecast would be proven WRONG if: (1) A "black swan" event occurs, (2) Multiple independent factors all shift simultaneously, (3) Historical base rates prove to be irrelevant for this case. |
SURPRISE FACTOR: For this low-probability event to occur, what would have to be true?`;
    } else {
      return `This is a TOSS-UP forecast. Key tipping-point factors that would shift probability >20%: |
(1) [Factor A] → would shift to ${Math.min(probability + 25, 95)}% |
(2) [Factor B] → would shift to ${Math.max(probability - 25, 5)}% |
The forecast is highly sensitive to these drivers.`;
    }
  }

  private generateCalibrationNote(): string {
    if (this.calibrationScore.totalPredictions < 5) {
      return 'Calibration history insufficient (< 5 predictions) — treat this forecast with appropriate caution.';
    }

    const accuracy = (this.calibrationScore.correctPredictions / this.calibrationScore.totalPredictions * 100).toFixed(0);
    const brier = (this.calibrationScore.brierScore * 100).toFixed(1);

    return `Based on ${this.calibrationScore.totalPredictions} past predictions: ${accuracy}% came true (within 10%% of predicted probability). Brier score: ${brier}/100 (lower is better). ${this.calibrationScore.averageConfidence > 0 ? `Average confidence: ${(this.calibrationScore.averageConfidence * 100).toFixed(0)}%.` : ''}`;
  }

  private identifyConditionalDrivers(currentProb: number) {
    // Identify key drivers and their conditional impact
    const drivers: {
      driver: string;
      probabilityIfDriver: number;
      probabilityIfNot: number;
      currentLikelihood: number;
      conditionalProbability: number;
    }[] = [];

    // Generic driver analysis based on common forecasting patterns
    const commonDrivers = [
      { keyword: 'economy', driver: 'Economic conditions improve', shift: 15 },
      { keyword: 'political', driver: 'Policy/fiscal stimulus enacted', shift: 20 },
      { keyword: 'technology', driver: 'Major tech breakthrough', shift: 25 },
      { keyword: 'market', driver: 'Market sentiment shifts bull', shift: 15 }
    ];

    for (const d of commonDrivers) {
      if (this.topic.toLowerCase().includes(d.keyword)) {
        drivers.push({
          driver: d.driver,
          probabilityIfDriver: Math.min(currentProb + d.shift, 95),
          probabilityIfNot: Math.max(currentProb - d.shift, 5),
          currentLikelihood: 0.5, // Unknown
          conditionalProbability: currentProb
        });
      }
    }

    return drivers;
  }

  private buildReasoning(
    baseRate: BaseRateResult,
    factors: ForecastFactor[],
    news: NewsSentiment,
    econ: EconomicIndicators | null,
    experts: ExpertForecast[]
  ): string {
    const parts: string[] = [];

    parts.push(`OUTSIDE VIEW: In similar historical situations, this event occurs ${(baseRate.baseRate * 100).toFixed(0)}% of the time (${baseRate.timeframe}).`);

    if (factors.length > 0) {
      const supporting = factors.filter(f => f.direction === 'for');
      const opposing = factors.filter(f => f.direction === 'against');

      if (supporting.length > 0) {
        parts.push(`SUPPORTING FACTORS: ${supporting.map(f => `${f.factor} (weight: ${(f.weight * 100).toFixed(0)}%)`).join(', ')}.`);
      }
      if (opposing.length > 0) {
        parts.push(`OPPOSING FACTORS: ${opposing.map(f => `${f.factor} (weight: ${(f.weight * 100).toFixed(0)}%)`).join(', ')}.`);
      }
    }

    if (news.recentHeadlines.length > 0) {
      parts.push(`RECENT NEWS: ${news.positive} positive, ${news.negative} negative headlines in last 48h.`);
    }

    if (econ) {
      const econParts: string[] = [];
      if (econ.gdpGrowth !== undefined) econParts.push(`GDP: ${econ.gdpGrowth > 0 ? '+' : ''}${econ.gdpGrowth.toFixed(1)}%`);
      if (econ.unemploymentRate !== undefined) econParts.push(`Unemployment: ${econ.unemploymentRate}%`);
      if (econ.inflationRate !== undefined) econParts.push(`Inflation: ${econ.inflationRate.toFixed(1)}%`);
      if (econParts.length > 0) {
        parts.push(`ECONOMIC INDICATORS: ${econParts.join(', ')}.`);
      }
    }

    if (experts.length > 0) {
      const avgProb = experts.reduce((s, e) => s + e.communityProb, 0) / experts.length;
      parts.push(`EXPERT CONSENSUS: ${experts[0].source} community assigns ~${avgProb.toFixed(0)}% probability.`);
    }

    return parts.join(' ');
  }

  /**
   * Adjust a councilor's raw prediction for their known bias
   */
  adjustForCalibration(
    rawProbability: number,
    councilorPersona: SuperforecasterPersona
  ): { adjustedProbability: number; calibrationNote: string } {
    if (councilorPersona.knownBias === null) {
      return { adjustedProbability: rawProbability, calibrationNote: 'No bias adjustment applied.' };
    }

    const biasAdjustment = councilorPersona.biasStrength * 10; // Max 10% adjustment

    let adjusted: number;
    let note: string;

    switch (councilorPersona.knownBias) {
      case 'optimist':
        // Optimists overestimate positive outcomes
        adjusted = rawProbability - biasAdjustment;
        note = `Adjusted -${biasAdjustment.toFixed(0)}% for ${councilorPersona.name}'s optimism bias (calibration: ${(councilorPersona.calibrationAccuracy * 100).toFixed(0)}%).`;
        break;
      case 'pessimist':
        adjusted = rawProbability + biasAdjustment;
        note = `Adjusted +${biasAdjustment.toFixed(0)}% for ${councilorPersona.name}'s pessimism bias (calibration: ${(councilorPersona.calibrationAccuracy * 100).toFixed(0)}%).`;
        break;
      case 'contrarian':
        // Contrarians often right when consensus is wrong
        // If raw is near 50%, they might be more decisive
        adjusted = rawProbability > 45 && rawProbability < 55
          ? (rawProbability > 50 ? 60 : 40)
          : rawProbability;
        note = `Adjusted for ${councilorPersona.name}'s contrarian tendency. ${councilorPersona.famousMiss ? `Known miss: ${councilorPersona.famousMiss}` : ''}`;
        break;
      default:
        adjusted = rawProbability;
        note = 'No significant bias detected.';
    }

    return {
      adjustedProbability: Math.min(Math.max(adjusted, 1), 99),
      calibrationNote: note
    };
  }

  /**
   * Aggregate multiple councilor forecasts into a final prediction
   */
  aggregateForecasts(councilorForecasts: CouncilorForecast[]): {
    probability: number;
    confidence: number;
    reasoning: string;
    calibrationNote: string;
    consensusScore: number;  // 0-1 how much they agree
    outlierCount: number;    // How many are significantly off from median
  } {
    if (councilorForecasts.length === 0) {
      return {
        probability: 50,
        confidence: 0.3,
        reasoning: 'No councilor forecasts available.',
        calibrationNote: 'Unable to assess calibration.',
        consensusScore: 0,
        outlierCount: 0
      };
    }

    // Remove extremes (best and worst calibrated) before averaging
    const sorted = [...councilorForecasts].sort((a, b) => b.calibrationAccuracy - a.calibrationAccuracy);
    const trimmed = sorted.slice(1, -1); // Remove best and worst

    const avgProb = trimmed.reduce((s, f) => s + f.adjustedProbability, 0) / trimmed.length;
    const avgConf = trimmed.reduce((s, f) => s + f.confidence, 0) / trimmed.length;

    // Calculate consensus (standard deviation)
    const mean = avgProb;
    const variance = trimmed.reduce((s, f) => s + Math.pow(f.adjustedProbability - mean, 2), 0) / trimmed.length;
    const stdDev = Math.sqrt(variance);
    const consensusScore = 1 - Math.min(stdDev / 50, 1); // Normalize to 0-1

    // Count outliers (>20% from median)
    const sortedProbs = trimmed.map(f => f.adjustedProbability).sort((a, b) => a - b);
    const median = sortedProbs[Math.floor(sortedProbs.length / 2)];
    const outlierCount = trimmed.filter(f => Math.abs(f.adjustedProbability - median) > 20).length;

    return {
      probability: Math.round(avgProb),
      confidence: Math.round(avgConf * 100) / 100,
      reasoning: `Aggregated ${trimmed.length} calibrated forecasts. Consensus score: ${(consensusScore * 100).toFixed(0)}%.`,
      calibrationNote: `Forecast range: ${Math.min(...trimmed.map(f => f.adjustedProbability))}% - ${Math.max(...trimmed.map(f => f.adjustedProbability))}%.`,
      consensusScore,
      outlierCount
    };
  }

  /**
   * Record an outcome for calibration tracking
   */
  recordOutcome(predictedProbability: number, confidence: number, actualOutcome: boolean): void {
    const record: CalibrationRecord = {
      predicted: predictedProbability,
      actual: actualOutcome,
      confidence,
      timestamp: Date.now(),
      topic: this.topic
    };
    addCalibrationRecord(record);

    // Update local calibration score
    this.calibrationScore = calculateCalibrationScore();
  }
}

// --- CONVENIENCE FUNCTIONS ---

export async function quickForecast(topic: string, timeframe?: string): Promise<Forecast> {
  const engine = new PredictionEngine(topic, timeframe);
  return engine.generateForecast();
}

export function getPredictionEngine(topic: string, timeframe?: string): PredictionEngine {
  return new PredictionEngine(topic, timeframe);
}
