import { Message } from '../types/index.js';

export interface SentimentResult {
  overall: 'positive' | 'neutral' | 'negative';
  confidence: number;
  emotions: Array<{
    emotion: string;
    intensity: number;
  }>;
  keywords: string[];
}

export interface EntityExtraction {
  entities: Array<{
    text: string;
    type: 'person' | 'organization' | 'location' | 'concept' | 'technology';
    confidence: number;
  }>;
  relationships: Array<{
    subject: string;
    relation: string;
    object: string;
    confidence: number;
  }>;
}

export interface ConflictDetection {
  conflicts: Array<{
    participants: string[];
    topic: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    resolutionSuggestions: string[];
  }>;
  agreementPoints: Array<{
    participants: string[];
    topic: string;
    consensus: number;
  }>;
}

export interface EngagementMetrics {
  participationByAuthor: Record<string, {
    messageCount: number;
    wordCount: number;
    averageResponseTime: number;
    engagementScore: number;
  }>;
  topicEvolution: Array<{
    topic: string;
    startTime: number;
    endTime: number;
    participants: string[];
  }>;
  momentum: {
    increasing: boolean;
    peakParticipation: number;
    currentLevel: number;
  };
}

export interface ConversationInsight {
  type: 'sentiment' | 'entities' | 'conflicts' | 'engagement' | 'patterns';
  data: any;
  timestamp: number;
  confidence: number;
}

export class ConversationIntelligenceService {
  constructor() {}

  async analyzeSentiment(messages: Message[]): Promise<SentimentResult> {
    // Simple keyword-based sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'agree', 'support', 'positive', 'benefit'];
    const negativeWords = ['bad', 'terrible', 'disagree', 'oppose', 'negative', 'problem', 'issue'];

    let score = 0;
    const emotionKeywords: string[] = [];
    const allText = messages.map(m => m.content.toLowerCase()).join(' ');

    positiveWords.forEach(word => {
      const matches = (allText.match(new RegExp(word, 'g')) || []).length;
      score += matches;
    });

    negativeWords.forEach(word => {
      const matches = (allText.match(new RegExp(word, 'g')) || []).length;
      score -= matches;
    });

    const normalized = score / Math.max(messages.length, 1);
    let overall: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (normalized > 0.5) overall = 'positive';
    else if (normalized < -0.5) overall = 'negative';

    return {
      overall,
      confidence: Math.min(1, Math.abs(normalized)),
      emotions: [
        { emotion: 'satisfaction', intensity: Math.max(0, normalized) },
        { emotion: 'frustration', intensity: Math.max(0, -normalized) }
      ],
      keywords: this.extractKeywords(allText)
    };
  }

  async extractEntities(messages: Message[]): Promise<EntityExtraction> {
    const allText = messages.map(m => m.content).join(' ');

    // Simple entity extraction based on patterns
    const entities: EntityExtraction['entities'] = [];
    const relationships: EntityExtraction['relationships'] = [];

    // Find capitalized words (potential entities)
    const capitalizedWords = allText.match(/\b[A-Z][a-zA-Z]+\b/g) || [];
    capitalizedWords.forEach(word => {
      if (word.length > 3 && !['The', 'This', 'That'].includes(word)) {
        entities.push({
          text: word,
          type: this.categorizeEntity(word),
          confidence: 0.7
        });
      }
    });

    // Simple relationship detection
    const relationshipPatterns = [
      { pattern: /(\w+)\s+(is|are|was|were)\s+(\w+)/, relation: 'is' },
      { pattern: /(\w+)\s+(has|have)\s+(\w+)/, relation: 'has' }
    ];

    relationshipPatterns.forEach(({ pattern, relation }) => {
      const matches = allText.match(pattern);
      if (matches) {
        relationships.push({
          subject: matches[1],
          relation,
          object: matches[3],
          confidence: 0.6
        });
      }
    });

    return { entities, relationships };
  }

  async detectConflicts(messages: Message[]): Promise<ConflictDetection> {
    const conflicts: ConflictDetection['conflicts'] = [];
    const agreementPoints: ConflictDetection['agreementPoints'] = [];

    const disagreementKeywords = ['disagree', 'oppose', 'against', 'conflict', 'differ'];
    const agreementKeywords = ['agree', 'support', 'consensus', 'aligned'];

    for (let i = 0; i < messages.length - 1; i++) {
      const current = messages[i];
      const next = messages[i + 1];

      const hasDisagreement = disagreementKeywords.some(k =>
        current.content.toLowerCase().includes(k) || next.content.toLowerCase().includes(k)
      );

      if (hasDisagreement) {
        conflicts.push({
          participants: [current.author, next.author],
          topic: this.extractTopic(current.content),
          severity: 'medium',
          description: `Disagreement detected between ${current.author} and ${next.author}`,
          resolutionSuggestions: [
            'Facilitate structured discussion',
            'Identify common ground',
            'Explore alternative perspectives'
          ]
        });
      }

      const hasAgreement = agreementKeywords.some(k =>
        current.content.toLowerCase().includes(k) || next.content.toLowerCase().includes(k)
      );

      if (hasAgreement) {
        agreementPoints.push({
          participants: [current.author, next.author],
          topic: this.extractTopic(current.content),
          consensus: 0.8
        });
      }
    }

    return { conflicts, agreementPoints };
  }

  async analyzeEngagement(messages: Message[]): Promise<EngagementMetrics> {
    const participationByAuthor: EngagementMetrics['participationByAuthor'] = {};

    messages.forEach(msg => {
      if (!participationByAuthor[msg.author]) {
        participationByAuthor[msg.author] = {
          messageCount: 0,
          wordCount: 0,
          averageResponseTime: 0,
          engagementScore: 0
        };
      }

      const stats = participationByAuthor[msg.author];
      stats.messageCount++;
      stats.wordCount += msg.content.split(/\s+/).length;
    });

    // Calculate engagement scores
    Object.keys(participationByAuthor).forEach(author => {
      const stats = participationByAuthor[author];
      stats.engagementScore = (stats.messageCount * 0.5) + (stats.wordCount / 100 * 0.5);
    });

    // Track topic evolution
    const topicEvolution = this.trackTopicEvolution(messages);

    // Calculate momentum
    const participation = Object.values(participationByAuthor);
    const totalMessages = participation.reduce((sum, p) => sum + p.messageCount, 0);
    const avgMessages = totalMessages / Math.max(participation.length, 1);

    const currentLevel = participation.filter(p => p.messageCount > avgMessages).length;

    return {
      participationByAuthor,
      topicEvolution,
      momentum: {
        increasing: currentLevel > avgMessages * 0.7,
        peakParticipation: Math.max(...participation.map(p => p.messageCount)),
        currentLevel
      }
    };
  }

  async generateInsights(messages: Message[]): Promise<ConversationInsight[]> {
    const insights: ConversationInsight[] = [];

    // Sentiment insight
    const sentiment = await this.analyzeSentiment(messages);
    insights.push({
      type: 'sentiment',
      data: sentiment,
      timestamp: Date.now(),
      confidence: sentiment.confidence
    });

    // Entity insight
    const entities = await this.extractEntities(messages);
    insights.push({
      type: 'entities',
      data: entities,
      timestamp: Date.now(),
      confidence: 0.7
    });

    // Conflict insight
    const conflicts = await this.detectConflicts(messages);
    insights.push({
      type: 'conflicts',
      data: conflicts,
      timestamp: Date.now(),
      confidence: 0.6
    });

    // Engagement insight
    const engagement = await this.analyzeEngagement(messages);
    insights.push({
      type: 'engagement',
      data: engagement,
      timestamp: Date.now(),
      confidence: 0.8
    });

    return insights;
  }

  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase().split(/\W+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    const wordFreq = new Map<string, number>();

    words.forEach(word => {
      if (word.length > 4 && !stopWords.has(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    });

    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  private categorizeEntity(word: string): 'person' | 'organization' | 'location' | 'concept' | 'technology' {
    if (['inc', 'corp', 'company', 'organization'].some(s => word.toLowerCase().includes(s))) {
      return 'organization';
    }
    if (['AI', 'ML', 'API', 'HTTP', 'JSON'].includes(word.toUpperCase())) {
      return 'technology';
    }
    if (['city', 'country', 'building'].some(s => word.toLowerCase().includes(s))) {
      return 'location';
    }
    return 'concept';
  }

  private extractTopic(text: string): string {
    const words = text.split(/\s+/);
    return words.slice(0, 5).join(' ');
  }

  private trackTopicEvolution(messages: Message[]): EngagementMetrics['topicEvolution'] {
    // Simple topic tracking
    const evolution: EngagementMetrics['topicEvolution'] = [];

    for (let i = 0; i < messages.length; i += 5) {
      const batch = messages.slice(i, i + 5);
      const topic = this.extractTopic(batch[0].content);
      evolution.push({
        topic,
        startTime: batch[0].timestamp,
        endTime: batch[batch.length - 1].timestamp,
        participants: [...new Set(batch.map(m => m.author))]
      });
    }

    return evolution;
  }
}

// Export singleton instance
export const conversationIntelligenceService = new ConversationIntelligenceService();
