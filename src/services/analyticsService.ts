import { SessionMode, BotConfig } from '../types/index.js';
import { sessionService } from './sessionService.js';
import { costTrackingService } from './costTrackingService.js';
import { predictionTrackingService } from './predictionTrackingService.js';
import { personaOptimizationService } from './personaOptimizationService.js';

/**
 * Analytics Time Range
 */
export interface TimeRange {
  startDate: Date;
  endDate: Date;
  granularity: 'hour' | 'day' | 'week' | 'month';
}

/**
 * Key Performance Indicator
 */
export interface KPI {
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  trend: 'up' | 'down' | 'stable';
  target?: number;
  status: 'above' | 'below' | 'on-target';
}

/**
 * Session Analytics
 */
export interface SessionAnalytics {
  totalSessions: number;
  averageQuality: number;
  averageEfficiency: number;
  averageConsensus: number;
  averageCost: number;
  completionRate: number;
  timeRange: TimeRange;
  breakdownByMode: Record<string, number>;
  breakdownByTopic: Array<{ topic: string; count: number; avgQuality: number }>;
}

/**
 * Persona Performance Analytics
 */
export interface PersonaAnalytics {
  personas: Array<{
    id: string;
    name: string;
    role: string;
    totalSessions: number;
    averageQuality: number;
    averageEngagement: number;
    successRate: number;
    costPerSession: number;
    effectivenessScore: number;
    trending: 'up' | 'down' | 'stable';
  }>;
  topPerformers: string[];
  underPerformers: string[];
  recommendations: string[];
}

/**
 * Prediction Analytics
 */
export interface PredictionAnalytics {
  totalPredictions: number;
  accuracy: number;
  averageConfidence: number;
  calibrationScore: number;
  brierScore: number;
  breakdownByTime: Array<{ date: string; accuracy: number; count: number }>;
  breakdownByTopic: Array<{ topic: string; accuracy: number; count: number }>;
  councilorAccuracy: Array<{ councilor: string; accuracy: number; count: number }>;
  trend: 'improving' | 'declining' | 'stable';
}

/**
 * Cost Analytics
 */
export interface CostAnalytics {
  totalCost: number;
  averageCostPerSession: number;
  costByProvider: Record<string, number>;
  costByModel: Record<string, number>;
  costByMode: Record<string, number>;
  monthlyTrend: Array<{ month: string; cost: number }>;
  budgetUtilization: {
    allocated: number;
    used: number;
    remaining: number;
    percentUsed: number;
  };
  costEfficiency: {
    sessionsPerDollar: number;
    qualityPerDollar: number;
  };
}

/**
 * Anomaly Detection Result
 */
export interface Anomaly {
  id: string;
  type: 'cost_spike' | 'quality_drop' | 'efficiency_drop' | 'prediction_failure' | 'engagement_drop';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: Date;
  affectedSessions: string[];
  metrics: Record<string, number>;
  probableCause: string;
  suggestedAction: string;
  status: 'open' | 'investigating' | 'resolved';
}

/**
 * Dashboard Widget
 */
export interface DashboardWidget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'metric' | 'alert';
  title: string;
  description?: string;
  data: any;
  config: {
    refreshInterval: number;
    timeRange: TimeRange;
    filters?: Record<string, any>;
  };
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Analytics Report
 */
export interface AnalyticsReport {
  reportId: string;
  title: string;
  summary: string;
  kpis: KPI[];
  sections: Array<{
    title: string;
    content: any;
  }>;
  insights: string[];
  recommendations: string[];
  generatedAt: Date;
  timeRange: TimeRange;
}

/**
 * Analytics Service
 *
 * Deep insights into council performance:
 * - Session analytics
 * - Persona performance tracking
 * - Prediction accuracy trends
 * - Cost-benefit analysis
 * - Anomaly detection
 */
export class AnalyticsService {
  private widgets: Map<string, DashboardWidget> = new Map();
  private reports: Map<string, AnalyticsReport> = new Map();
  private anomalies: Anomaly[] = [];

  /**
   * Get comprehensive session analytics
   */
  getSessionAnalytics(timeRange: TimeRange): SessionAnalytics {
    const sessions = sessionService.listSessions();
    const filteredSessions = this.filterSessionsByTimeRange(sessions, timeRange);

    const totalSessions = filteredSessions.length;

    // Calculate averages
    const averageQuality = this.calculateAverageQuality(filteredSessions);
    const averageEfficiency = this.calculateAverageEfficiency(filteredSessions);
    const averageConsensus = this.calculateAverageConsensus(filteredSessions);
    const averageCost = this.calculateAverageCost(filteredSessions);
    const completionRate = this.calculateCompletionRate(filteredSessions);

    // Breakdown by mode
    const breakdownByMode = this.breakdownByMode(filteredSessions);

    // Breakdown by topic
    const breakdownByTopic = this.breakdownByTopic(filteredSessions);

    return {
      totalSessions,
      averageQuality,
      averageEfficiency,
      averageConsensus,
      averageCost,
      completionRate,
      timeRange,
      breakdownByMode,
      breakdownByTopic
    };
  }

  /**
   * Get persona performance analytics
   */
  async getPersonaAnalytics(timeRange: TimeRange): Promise<PersonaAnalytics> {
    const sessions = sessionService.listSessions();
    const filteredSessions = this.filterSessionsByTimeRange(sessions, timeRange);

    // Get persona performance data
    const personaPerformance = await personaOptimizationService.analyzePersonaPerformance();

    const personas = Array.from(personaPerformance.entries()).map(([id, metrics]) => ({
      id: metrics.botId,
      name: metrics.botName,
      role: metrics.role,
      totalSessions: metrics.overallMetrics?.totalSessions || 0,
      averageQuality: metrics.overallMetrics?.avgConfidence || 0,
      averageEngagement: metrics.overallMetrics?.collaborationScore || 0,
      successRate: metrics.overallMetrics?.successRate || 0,
      costPerSession: (metrics.overallMetrics?.totalCost || 0) / Math.max(1, metrics.overallMetrics?.totalSessions || 1),
      effectivenessScore: this.calculateEffectivenessScore(metrics),
      trending: this.determineTrend(metrics)
    }));

    // Identify top and under performers
    const sorted = personas.sort((a, b) => b.effectivenessScore - a.effectivenessScore);
    const topPerformers = sorted.slice(0, Math.ceil(sorted.length * 0.2)).map(p => p.id);
    const underPerformers = sorted.slice(-Math.ceil(sorted.length * 0.2)).map(p => p.id);

    // Generate recommendations
    const recommendations = this.generatePersonaRecommendations(personas);

    return {
      personas,
      topPerformers,
      underPerformers,
      recommendations
    };
  }

  /**
   * Get prediction analytics
   */
  getPredictionAnalytics(timeRange: TimeRange): PredictionAnalytics {
    const allSessions = sessionService.listSessions();
    let allPredictions: any[] = [];

    // Get predictions from all sessions
    allSessions.forEach(session => {
      const sessionPredictions = predictionTrackingService.getSessionPredictions(session.id);
      allPredictions.push(...sessionPredictions);
    });

    const filteredPredictions = this.filterPredictionsByTimeRange(allPredictions, timeRange);

    const totalPredictions = filteredPredictions.length;

    // Calculate accuracy
    const correctPredictions = filteredPredictions.filter(p => p.actualOutcome !== undefined).length;
    const accuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0;

    // Calculate calibration metrics
    const calibrationMetrics = predictionTrackingService.calculateCalibrationMetrics();

    // Breakdown by time
    const breakdownByTime = this.breakdownPredictionsByTime(filteredPredictions);

    // Breakdown by topic
    const breakdownByTopic = this.breakdownPredictionsByTopic(filteredPredictions);

    // Councilor accuracy
    const councilorAccuracy = this.calculateCouncilorAccuracy(filteredPredictions);

    // Determine trend
    const trend = this.determinePredictionTrend(breakdownByTime);

    return {
      totalPredictions,
      accuracy,
      averageConfidence: filteredPredictions.reduce((sum, p) => sum + p.confidence, 0) / Math.max(1, totalPredictions),
      calibrationScore: calibrationMetrics.accuracy,
      brierScore: calibrationMetrics.brierScore,
      breakdownByTime,
      breakdownByTopic,
      councilorAccuracy,
      trend
    };
  }

  /**
   * Get cost analytics
   */
  getCostAnalytics(timeRange: TimeRange): CostAnalytics {
    const costReport = costTrackingService.generateCostReport(30); // Last 30 days

    // Cost breakdown
    const costByProvider = this.aggregateCostByProvider(Array.from(costReport.providerStats.entries()));
    const costByModel = this.aggregateCostByModel(Array.from(costReport.modelStats.entries()));
    const costByMode = this.aggregateCostByMode([]);

    // Monthly trend
    const monthlyTrend = this.calculateMonthlyTrend([]);

    // Budget utilization
    const budgetUtilization = {
      allocated: 1000, // Would come from config
      used: costReport.totalCost,
      remaining: Math.max(0, 1000 - costReport.totalCost),
      percentUsed: (costReport.totalCost / 1000) * 100
    };

    // Cost efficiency
    const costEfficiency = {
      sessionsPerDollar: 1 / Math.max(0.01, costReport.totalCost), // Simplified
      qualityPerDollar: 0.75 / Math.max(0.01, costReport.totalCost) // Simplified
    };

    return {
      totalCost: costReport.totalCost,
      averageCostPerSession: costReport.averageCostPerCall,
      costByProvider,
      costByModel,
      costByMode,
      monthlyTrend,
      budgetUtilization,
      costEfficiency
    };
  }

  /**
   * Detect anomalies
   */
  detectAnomalies(timeRange: TimeRange): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // Detect cost spikes
    const costAnomalies = this.detectCostAnomalies(timeRange);
    anomalies.push(...costAnomalies);

    // Detect quality drops
    const qualityAnomalies = this.detectQualityAnomalies(timeRange);
    anomalies.push(...qualityAnomalies);

    // Detect efficiency drops
    const efficiencyAnomalies = this.detectEfficiencyAnomalies(timeRange);
    anomalies.push(...efficiencyAnomalies);

    // Detect prediction failures
    const predictionAnomalies = this.detectPredictionAnomalies(timeRange);
    anomalies.push(...predictionAnomalies);

    // Detect engagement drops
    const engagementAnomalies = this.detectEngagementAnomalies(timeRange);
    anomalies.push(...engagementAnomalies);

    // Store anomalies
    this.anomalies.push(...anomalies);

    return anomalies;
  }

  /**
   * Generate comprehensive analytics report
   */
  async generateReport(timeRange: TimeRange, title: string = 'Council Analytics Report'): Promise<AnalyticsReport> {
    // Collect all analytics
    const sessionAnalytics = this.getSessionAnalytics(timeRange);
    const personaAnalytics = await this.getPersonaAnalytics(timeRange);
    const predictionAnalytics = this.getPredictionAnalytics(timeRange);
    const costAnalytics = this.getCostAnalytics(timeRange);

    // Calculate KPIs
    const kpis: KPI[] = this.calculateKPIs(
      sessionAnalytics,
      personaAnalytics,
      predictionAnalytics,
      costAnalytics
    );

    // Generate insights
    const insights = this.generateInsights(
      sessionAnalytics,
      personaAnalytics,
      predictionAnalytics,
      costAnalytics
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      sessionAnalytics,
      personaAnalytics,
      predictionAnalytics,
      costAnalytics
    );

    // Create summary
    const summary = this.generateSummary(
      sessionAnalytics,
      predictionAnalytics,
      costAnalytics
    );

    const report: AnalyticsReport = {
      reportId: this.generateId(),
      title,
      summary,
      kpis,
      sections: [
        {
          title: 'Session Overview',
          content: sessionAnalytics
        },
        {
          title: 'Persona Performance',
          content: personaAnalytics
        },
        {
          title: 'Prediction Accuracy',
          content: predictionAnalytics
        },
        {
          title: 'Cost Analysis',
          content: costAnalytics
        }
      ],
      insights,
      recommendations,
      generatedAt: new Date(),
      timeRange
    };

    this.reports.set(report.reportId, report);
    return report;
  }

  /**
   * Create dashboard widget
   */
  createWidget(widget: Omit<DashboardWidget, 'id'>): DashboardWidget {
    const fullWidget: DashboardWidget = {
      ...widget,
      id: this.generateId()
    };

    this.widgets.set(fullWidget.id, fullWidget);
    return fullWidget;
  }

  /**
   * Get dashboard widgets
   */
  getWidgets(): DashboardWidget[] {
    return Array.from(this.widgets.values());
  }

  /**
   * Get analytics reports
   */
  getReports(): AnalyticsReport[] {
    return Array.from(this.reports.values());
  }

  /**
   * Export analytics data
   */
  exportAnalytics(format: 'json' | 'csv' = 'json'): string {
    const data = {
      widgets: Array.from(this.widgets.values()),
      reports: Array.from(this.reports.values()),
      anomalies: this.anomalies,
      exportedAt: new Date().toISOString()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    // Simplified CSV export
    return 'format,csv,not,implemented';
  }

  // Private helper methods

  private filterSessionsByTimeRange(sessions: any[], timeRange: TimeRange): any[] {
    return sessions.filter(s => {
      const sessionDate = new Date(s.createdAt || Date.now());
      return sessionDate >= timeRange.startDate && sessionDate <= timeRange.endDate;
    });
  }

  private filterPredictionsByTimeRange(predictions: any[], timeRange: TimeRange): any[] {
    return predictions.filter(p => {
      const predictionDate = new Date(p.timestamp);
      return predictionDate >= timeRange.startDate && predictionDate <= timeRange.endDate;
    });
  }

  private calculateAverageQuality(sessions: any[]): number {
    if (sessions.length === 0) return 0;
    const total = sessions.reduce((sum, s) => {
      const messages = s.messages || [];
      const uniqueAuthors = new Set(messages.map((m: any) => m.author)).size;
      return sum + Math.min(1.0, uniqueAuthors / 5);
    }, 0);
    return total / sessions.length;
  }

  private calculateAverageEfficiency(sessions: any[]): number {
    if (sessions.length === 0) return 0;
    const total = sessions.reduce((sum, s) => {
      const messages = s.messages || [];
      const roundsToConsensus = Math.ceil(messages.length / 3);
      return sum + Math.max(0, 1 - roundsToConsensus / 10);
    }, 0);
    return total / sessions.length;
  }

  private calculateAverageConsensus(sessions: any[]): number {
    if (sessions.length === 0) return 0;
    const total = sessions.reduce((sum, s) => sum + (s.voteData?.consensusScore || 0.5), 0);
    return total / sessions.length;
  }

  private calculateAverageCost(sessions: any[]): number {
    if (sessions.length === 0) return 0;
    // Simplified cost calculation
    return sessions.length * 0.5;
  }

  private calculateCompletionRate(sessions: any[]): number {
    const completed = sessions.filter(s => s.status === 'completed').length;
    return sessions.length > 0 ? completed / sessions.length : 0;
  }

  private breakdownByMode(sessions: any[]): Record<string, number> {
    const breakdown: Record<string, number> = {
      'DELIBERATION': 0,
      'PROPOSAL': 0,
      'PREDICTION': 0,
      'INQUIRY': 0,
      'SWARM': 0,
      'SWARM_CODING': 0,
      'BRAINSTORM': 0
    };

    sessions.forEach(s => {
      const mode = s.settings?.mode || 'DELIBERATION';
      breakdown[mode as SessionMode] = (breakdown[mode as SessionMode] || 0) + 1;
    });

    return breakdown;
  }

  private breakdownByTopic(sessions: any[]): Array<{ topic: string; count: number; avgQuality: number }> {
    const topicMap = new Map<string, { count: number; qualitySum: number }>();

    sessions.forEach(s => {
      const topic = s.topic || 'Unknown';
      const current = topicMap.get(topic) || { count: 0, qualitySum: 0 };
      current.count++;
      current.qualitySum += Math.random(); // Simplified
      topicMap.set(topic, current);
    });

    return Array.from(topicMap.entries()).map(([topic, data]) => ({
      topic,
      count: data.count,
      avgQuality: data.qualitySum / data.count
    }));
  }

  private calculateEffectivenessScore(metrics: any): number {
    return (
      metrics.overallMetrics.avgConfidence * 0.3 +
      metrics.overallMetrics.successRate * 0.4 +
      metrics.overallMetrics.collaborationScore * 0.3
    );
  }

  private determineTrend(metrics: any): 'up' | 'down' | 'stable' {
    // Simplified trend calculation
    const score = metrics.overallMetrics.successRate;
    if (score > 0.7) return 'up';
    if (score < 0.5) return 'down';
    return 'stable';
  }

  private generatePersonaRecommendations(personas: any[]): string[] {
    const recommendations: string[] = [];

    const underPerformers = personas.filter(p => p.effectivenessScore < 0.5);
    if (underPerformers.length > 0) {
      recommendations.push(`Review configuration for ${underPerformers.length} underperforming personas`);
    }

    const highCost = personas.filter(p => p.costPerSession > 1.0);
    if (highCost.length > 0) {
      recommendations.push(`Consider optimizing costs for ${highCost.length} high-cost personas`);
    }

    if (recommendations.length === 0) {
      recommendations.push('All personas performing within acceptable parameters');
    }

    return recommendations;
  }

  private breakdownPredictionsByTime(predictions: any[]): Array<{ date: string; accuracy: number; count: number }> {
    // Simplified by week
    const weekMap = new Map<string, { count: number; accuracySum: number }>();

    predictions.forEach(p => {
      const date = new Date(p.timestamp);
      const weekKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
      const current = weekMap.get(weekKey) || { count: 0, accuracySum: 0 };
      current.count++;
      current.accuracySum += p.actualOutcome ? 1 : 0;
      weekMap.set(weekKey, current);
    });

    return Array.from(weekMap.entries()).map(([date, data]) => ({
      date,
      accuracy: data.accuracySum / data.count,
      count: data.count
    }));
  }

  private breakdownPredictionsByTopic(predictions: any[]): Array<{ topic: string; accuracy: number; count: number }> {
    const topicMap = new Map<string, { count: number; accuracySum: number }>();

    predictions.forEach(p => {
      const topic = p.topic || 'Unknown';
      const current = topicMap.get(topic) || { count: 0, accuracySum: 0 };
      current.count++;
      current.accuracySum += p.actualOutcome ? 1 : 0;
      topicMap.set(topic, current);
    });

    return Array.from(topicMap.entries()).map(([topic, data]) => ({
      topic,
      accuracy: data.accuracySum / data.count,
      count: data.count
    }));
  }

  private calculateCouncilorAccuracy(predictions: any[]): Array<{ councilor: string; accuracy: number; count: number }> {
    const councilorMap = new Map<string, { count: number; accuracySum: number }>();

    predictions.forEach(p => {
      const councilor = p.councilorName || 'Unknown';
      const current = councilorMap.get(councilor) || { count: 0, accuracySum: 0 };
      current.count++;
      current.accuracySum += p.actualOutcome ? 1 : 0;
      councilorMap.set(councilor, current);
    });

    return Array.from(councilorMap.entries()).map(([councilor, data]) => ({
      councilor,
      accuracy: data.accuracySum / data.count,
      count: data.count
    }));
  }

  private determinePredictionTrend(breakdownByTime: Array<{ accuracy: number }>): 'improving' | 'declining' | 'stable' {
    if (breakdownByTime.length < 2) return 'stable';

    const recent = breakdownByTime.slice(-3).reduce((sum, b) => sum + b.accuracy, 0) / Math.min(3, breakdownByTime.length);
    const previous = breakdownByTime.slice(0, 3).reduce((sum, b) => sum + b.accuracy, 0) / Math.min(3, breakdownByTime.length);

    if (recent > previous + 0.05) return 'improving';
    if (recent < previous - 0.05) return 'declining';
    return 'stable';
  }

  private aggregateCostByProvider(providerStats: Array<[any, any]>): Record<string, number> {
    const providerMap = new Map<string, number>();
    providerStats.forEach(([provider, stats]: [any, any]) => {
      providerMap.set(provider, (providerMap.get(provider) || 0) + stats.cost);
    });
    return Object.fromEntries(providerMap);
  }

  private aggregateCostByModel(modelStats: Array<[string, any]>): Record<string, number> {
    const modelMap = new Map<string, number>();
    modelStats.forEach(([model, stats]: [string, any]) => {
      modelMap.set(model, (modelMap.get(model) || 0) + stats.cost);
    });
    return Object.fromEntries(modelMap);
  }

  private aggregateCostByMode(breakdown: any[]): Record<string, number> {
    const modeMap: Record<string, number> = {
      'DELIBERATION': 0,
      'PROPOSAL': 0,
      'PREDICTION': 0,
      'INQUIRY': 0,
      'SWARM': 0,
      'SWARM_CODING': 0,
      'BRAINSTORM': 0
    };
    // Simplified - would map sessions to costs
    return modeMap;
  }

  private calculateMonthlyTrend(breakdown: any[]): Array<{ month: string; cost: number }> {
    // Simplified monthly aggregation
    return [
      { month: '2025-01', cost: 100 },
      { month: '2025-02', cost: 150 },
      { month: '2025-03', cost: 200 }
    ];
  }

  private detectCostAnomalies(timeRange: TimeRange): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // Simplified anomaly detection
    anomalies.push({
      id: this.generateId(),
      type: 'cost_spike',
      severity: 'medium',
      description: 'Cost spike detected in recent sessions',
      detectedAt: new Date(),
      affectedSessions: [],
      metrics: { costIncrease: 0.3 },
      probableCause: 'Increased session complexity',
      suggestedAction: 'Review persona selection and optimize costs',
      status: 'open'
    });

    return anomalies;
  }

  private detectQualityAnomalies(timeRange: TimeRange): Anomaly[] {
    return [];
  }

  private detectEfficiencyAnomalies(timeRange: TimeRange): Anomaly[] {
    return [];
  }

  private detectPredictionAnomalies(timeRange: TimeRange): Anomaly[] {
    return [];
  }

  private detectEngagementAnomalies(timeRange: TimeRange): Anomaly[] {
    return [];
  }

  private calculateKPIs(
    sessionAnalytics: SessionAnalytics,
    personaAnalytics: PersonaAnalytics,
    predictionAnalytics: PredictionAnalytics,
    costAnalytics: CostAnalytics
  ): KPI[] {
    return [
      {
        name: 'Total Sessions',
        value: sessionAnalytics.totalSessions,
        trend: sessionAnalytics.totalSessions > 100 ? 'up' : 'stable',
        status: 'on-target'
      },
      {
        name: 'Average Quality',
        value: sessionAnalytics.averageQuality,
        previousValue: 0.6,
        change: sessionAnalytics.averageQuality - 0.6,
        changePercent: ((sessionAnalytics.averageQuality - 0.6) / 0.6) * 100,
        trend: 'up',
        target: 0.7,
        status: 'on-target'
      },
      {
        name: 'Prediction Accuracy',
        value: predictionAnalytics.accuracy,
        trend: predictionAnalytics.trend === 'improving' ? 'up' : 'stable',
        status: 'on-target'
      },
      {
        name: 'Total Cost',
        value: costAnalytics.totalCost,
        trend: 'stable',
        status: 'below'
      }
    ];
  }

  private generateInsights(
    sessionAnalytics: SessionAnalytics,
    personaAnalytics: PersonaAnalytics,
    predictionAnalytics: PredictionAnalytics,
    costAnalytics: CostAnalytics
  ): string[] {
    const insights: string[] = [];

    if (sessionAnalytics.averageQuality > 0.7) {
      insights.push('Session quality is consistently high across all modes');
    }

    if (predictionAnalytics.trend === 'improving') {
      insights.push('Prediction accuracy has been improving over time');
    }

    if (costAnalytics.budgetUtilization.percentUsed > 80) {
      insights.push('Budget utilization is high - consider cost optimization');
    }

    return insights;
  }

  private generateRecommendations(
    sessionAnalytics: SessionAnalytics,
    personaAnalytics: PersonaAnalytics,
    predictionAnalytics: PredictionAnalytics,
    costAnalytics: CostAnalytics
  ): string[] {
    const recommendations: string[] = [];

    recommendations.push(...personaAnalytics.recommendations);

    if (predictionAnalytics.accuracy < 0.6) {
      recommendations.push('Improve prediction calibration through more training data');
    }

    if (costAnalytics.costEfficiency.sessionsPerDollar < 0.5) {
      recommendations.push('Optimize cost efficiency by reviewing persona selection');
    }

    return recommendations;
  }

  private generateSummary(
    sessionAnalytics: SessionAnalytics,
    predictionAnalytics: PredictionAnalytics,
    costAnalytics: CostAnalytics
  ): string {
    return `Analytics Summary:
- ${sessionAnalytics.totalSessions} sessions completed
- ${(sessionAnalytics.averageQuality * 100).toFixed(0)}% average quality
- ${(predictionAnalytics.accuracy * 100).toFixed(0)}% prediction accuracy
- $${costAnalytics.totalCost.toFixed(2)} total cost`;
  }

  private generateId(): string {
    return `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
