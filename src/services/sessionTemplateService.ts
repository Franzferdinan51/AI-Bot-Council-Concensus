import { CouncilSettings, SessionMode, BotConfig } from '../types/index.js';
import { getBotsWithCustomConfigs } from '../types/constants.js';

export interface SessionTemplate {
  id: string;
  name: string;
  description: string;
  category: 'proposal' | 'analysis' | 'research' | 'prediction' | 'creative' | 'decision' | 'custom';
  mode: SessionMode;
  settings: Partial<CouncilSettings>;
  recommendedTopics: string[];
  icon?: string;
  tags: string[];
}

/**
 * Session Template Service
 *
 * Provides pre-configured workflows for common council use cases.
 * Allows quick setup of optimized settings for different types of sessions.
 */
export class SessionTemplateService {
  private templates: Map<string, SessionTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates() {
    // Strategic Decision Making
    this.registerTemplate({
      id: 'strategic-decision',
      name: 'Strategic Decision Making',
      description: 'Structured decision-making process with comprehensive analysis and voting',
      category: 'decision',
      mode: SessionMode.PROPOSAL,
      settings: {
        bots: this.selectBots(['speaker-high-council', 'councilor-technocrat', 'councilor-pragmatist', 'councilor-ethicist', 'councilor-visionary']),
        maxConcurrentRequests: 2,
        economyMode: false,
        verboseLogging: true,
        progressDelay: 500
      },
      recommendedTopics: [
        'Business strategy decisions',
        'Policy reforms',
        'Investment choices',
        'Strategic partnerships',
        'Product development roadmap'
      ],
      icon: '🎯',
      tags: ['business', 'strategy', 'voting', 'decision']
    });

    // Technical Architecture Review
    this.registerTemplate({
      id: 'technical-review',
      name: 'Technical Architecture Review',
      description: 'Deep technical analysis with specialist input and detailed evaluation',
      category: 'analysis',
      mode: SessionMode.DELIBERATION,
      settings: {
        bots: this.selectBots(['speaker-high-council', 'specialist-code', 'councilor-technocrat', 'councilor-sentinel', 'councilor-skeptic']),
        maxConcurrentRequests: 3,
        economyMode: true,
        verboseLogging: true,
        progressDelay: 300
      },
      recommendedTopics: [
        'System architecture design',
        'Technology stack selection',
        'Security audit',
        'Performance optimization',
        'Code quality review'
      ],
      icon: '⚙️',
      tags: ['technical', 'architecture', 'code', 'review']
    });

    // Market Research & Analysis
    this.registerTemplate({
      id: 'market-research',
      name: 'Market Research & Analysis',
      description: 'Comprehensive market research with data-driven insights and trend analysis',
      category: 'research',
      mode: SessionMode.RESEARCH,
      settings: {
        bots: this.selectBots(['speaker-high-council', 'specialist-finance', 'councilor-pragmatist', 'councilor-visionary', 'councilor-journalist']),
        maxConcurrentRequests: 3,
        economyMode: true,
        verboseLogging: true,
        progressDelay: 400
      },
      recommendedTopics: [
        'Market entry analysis',
        'Competitor analysis',
        'Consumer behavior trends',
        'Investment opportunities',
        'Industry disruption assessment'
      ],
      icon: '📊',
      tags: ['research', 'market', 'data', 'trends']
    });

    // Prediction & Forecasting
    this.registerTemplate({
      id: 'prediction-forecasting',
      name: 'Prediction & Forecasting',
      description: 'Evidence-based prediction with confidence intervals and outcome tracking',
      category: 'prediction',
      mode: SessionMode.PREDICTION,
      settings: {
        bots: this.selectBots(['speaker-high-council', 'councilor-technocrat', 'councilor-visionary', 'councilor-skeptic', 'councilor-historian']),
        maxConcurrentRequests: 2,
        economyMode: false,
        verboseLogging: true,
        progressDelay: 600
      },
      recommendedTopics: [
        'Market forecasts',
        'Technology adoption timeline',
        'Economic predictions',
        'Risk assessment',
        'Scenario planning'
      ],
      icon: '🔮',
      tags: ['prediction', 'forecast', 'probability', 'scenarios']
    });

    // Legal & Compliance Review
    this.registerTemplate({
      id: 'legal-review',
      name: 'Legal & Compliance Review',
      description: 'Comprehensive legal analysis with risk assessment and compliance checking',
      category: 'analysis',
      mode: SessionMode.INQUIRY,
      settings: {
        bots: this.selectBots(['speaker-high-council', 'specialist-legal', 'councilor-diplomat', 'councilor-ethicist']),
        maxConcurrentRequests: 2,
        economyMode: true,
        verboseLogging: true,
        progressDelay: 400
      },
      recommendedTopics: [
        'Contract analysis',
        'Compliance audits',
        'Regulatory changes impact',
        'Legal risk assessment',
        'Policy interpretation'
      ],
      icon: '⚖️',
      tags: ['legal', 'compliance', 'risk', 'regulation']
    });

    // Crisis Response Planning
    this.registerTemplate({
      id: 'crisis-response',
      name: 'Crisis Response Planning',
      description: 'Rapid response planning with security-focused analysis and contingency planning',
      category: 'decision',
      mode: SessionMode.DELIBERATION,
      settings: {
        bots: this.selectBots(['speaker-high-council', 'councilor-sentinel', 'councilor-pragmatist', 'councilor-diplomat', 'councilor-ethicist']),
        maxConcurrentRequests: 3,
        economyMode: false,
        verboseLogging: true,
        progressDelay: 200
      },
      recommendedTopics: [
        'Crisis management plans',
        'Business continuity',
        'Risk mitigation strategies',
        'Emergency response',
        'Contingency planning'
      ],
      icon: '🚨',
      tags: ['crisis', 'emergency', 'planning', 'response']
    });

    // Creative Ideation
    this.registerTemplate({
      id: 'creative-ideation',
      name: 'Creative Ideation',
      description: 'Open brainstorming session with diverse perspectives and innovative thinking',
      category: 'creative',
      mode: SessionMode.SWARM,
      settings: {
        bots: this.selectBots(['speaker-high-council', 'councilor-visionary', 'councilor-progressive', 'councilor-pragmatist', 'councilor-psychologist']),
        maxConcurrentRequests: 5,
        economyMode: true,
        verboseLogging: true,
        progressDelay: 300
      },
      recommendedTopics: [
        'Product innovation',
        'Creative campaigns',
        'Design concepts',
        'Content strategy',
        'User experience ideas'
      ],
      icon: '💡',
      tags: ['creative', 'ideation', 'brainstorming', 'innovation']
    });

    // Code Development
    this.registerTemplate({
      id: 'code-development',
      name: 'Code Development',
      description: 'End-to-end code generation with requirements analysis, testing, and documentation',
      category: 'proposal',
      mode: SessionMode.SWARM_CODING,
      settings: {
        bots: this.selectBots(['speaker-high-council', 'specialist-code']),
        maxConcurrentRequests: 3,
        economyMode: true,
        verboseLogging: true,
        progressDelay: 400
      },
      recommendedTopics: [
        'Application development',
        'API design',
        'Database schema',
        'Algorithm implementation',
        'Code refactoring'
      ],
      icon: '💻',
      tags: ['coding', 'development', 'programming', 'software']
    });

    // Policy Analysis
    this.registerTemplate({
      id: 'policy-analysis',
      name: 'Policy Analysis',
      description: 'Comprehensive policy analysis with stakeholder impact and implementation review',
      category: 'analysis',
      mode: SessionMode.DELIBERATION,
      settings: {
        bots: this.selectBots(['speaker-high-council', 'councilor-progressive', 'councilor-conservative', 'councilor-independent', 'councilor-ethicist']),
        maxConcurrentRequests: 2,
        economyMode: true,
        verboseLogging: true,
        progressDelay: 500
      },
      recommendedTopics: [
        'Policy proposals',
        'Regulatory impact',
        'Stakeholder analysis',
        'Implementation strategies',
        'Policy effectiveness'
      ],
      icon: '📜',
      tags: ['policy', 'governance', 'regulation', 'stakeholders']
    });

    // Quick Consultation
    this.registerTemplate({
      id: 'quick-consultation',
      name: 'Quick Consultation',
      description: 'Fast, economy-mode consultation for rapid insights and basic analysis',
      category: 'custom',
      mode: SessionMode.INQUIRY,
      settings: {
        bots: this.selectBots(['speaker-high-council', 'councilor-pragmatist']),
        maxConcurrentRequests: 1,
        economyMode: true,
        verboseLogging: false,
        progressDelay: 100
      },
      recommendedTopics: [
        'Quick questions',
        'Simple clarifications',
        'Basic advice',
        'Initial assessment',
        'Fast feedback'
      ],
      icon: '⚡',
      tags: ['quick', 'fast', 'simple', 'consultation']
    });

    // Consensus Building
    this.registerTemplate({
      id: 'consensus-building',
      name: 'Consensus Building',
      description: 'Deliberative process focused on finding common ground and unified agreements',
      category: 'decision',
      mode: SessionMode.DELIBERATION,
      settings: {
        bots: this.selectBots(['speaker-high-council', 'councilor-diplomat', 'councilor-independent', 'councilor-pragmatist', 'councilor-ethicist']),
        maxConcurrentRequests: 2,
        economyMode: false,
        verboseLogging: true,
        progressDelay: 600
      },
      recommendedTopics: [
        'Team alignment',
        'Agreement formation',
        'Conflict resolution',
        'Negotiation strategy',
        'Collaboration frameworks'
      ],
      icon: '🤝',
      tags: ['consensus', 'agreement', 'collaboration', 'unity']
    });
  }

  /**
   * Register a new template
   */
  registerTemplate(template: SessionTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): SessionTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Get all templates
   */
  getAllTemplates(): SessionTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: SessionTemplate['category']): SessionTemplate[] {
    return this.getAllTemplates().filter(t => t.category === category);
  }

  /**
   * Search templates by tags or name
   */
  searchTemplates(query: string): SessionTemplate[] {
    const searchTerm = query.toLowerCase();
    return this.getAllTemplates().filter(t =>
      t.name.toLowerCase().includes(searchTerm) ||
      t.description.toLowerCase().includes(searchTerm) ||
      t.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Apply template settings to create a complete CouncilSettings
   */
  applyTemplate(templateId: string, customizations?: Partial<CouncilSettings>): CouncilSettings {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const allBots = getBotsWithCustomConfigs();

    // Merge template settings with customizations
    const settings: CouncilSettings = {
      ...{
        bots: allBots,
        providers: {} as any,
        maxConcurrentRequests: 2,
        economyMode: true,
        contextPruning: true,
        maxContextTurns: 8,
        verboseLogging: true,
        progressDelay: 500
      },
      ...template.settings,
      ...customizations
    };

    // Ensure template bots are enabled and others are disabled if specified
    if (template.settings.bots) {
      settings.bots = allBots.map(bot => ({
        ...bot,
        enabled: template.settings.bots!.some(tb => tb.id === bot.id)
      }));
    }

    return settings;
  }

  /**
   * Get recommended templates for a topic
   */
  suggestTemplatesForTopic(topic: string): SessionTemplate[] {
    const topicLower = topic.toLowerCase();

    // Match templates based on recommended topics
    const matches = this.getAllTemplates().filter(template =>
      template.recommendedTopics.some(rt =>
        rt.toLowerCase().includes(topicLower) ||
        topicLower.includes(rt.toLowerCase().split(' ')[0]) // Match first word
      )
    );

    // If no matches, return generic templates
    if (matches.length === 0) {
      return [
        this.getTemplate('quick-consultation')!,
        this.getTemplate('strategic-decision')!,
        this.getTemplate('market-research')!
      ];
    }

    return matches;
  }

  /**
   * Select bots by IDs and return them
   */
  private selectBots(botIds: string[]): BotConfig[] {
    const allBots = getBotsWithCustomConfigs();
    return allBots.filter(bot => botIds.includes(bot.id));
  }

  /**
   * Get all unique categories
   */
  getCategories(): Array<{ id: SessionTemplate['category']; name: string; description: string }> {
    return [
      { id: 'decision', name: 'Decision Making', description: 'Structured decision processes with voting and consensus' },
      { id: 'analysis', name: 'Analysis & Review', description: 'Deep analysis and evaluation of proposals or systems' },
      { id: 'research', name: 'Research & Investigation', description: 'Comprehensive research and information gathering' },
      { id: 'prediction', name: 'Prediction & Forecasting', description: 'Evidence-based predictions and scenario planning' },
      { id: 'creative', name: 'Creative & Ideation', description: 'Open brainstorming and creative problem-solving' },
      { id: 'proposal', name: 'Proposal & Development', description: 'Structured proposal development and code generation' },
      { id: 'custom', name: 'Custom & General', description: 'General-purpose templates and custom workflows' }
    ];
  }

  /**
   * Export all templates as JSON
   */
  exportTemplates(): string {
    return JSON.stringify(this.getAllTemplates(), null, 2);
  }

  /**
   * Get template statistics
   */
  getStatistics(): {
    total: number;
    byCategory: Record<string, number>;
    mostUsed: SessionTemplate[];
  } {
    const templates = this.getAllTemplates();
    const byCategory: Record<string, number> = {};

    templates.forEach(template => {
      byCategory[template.category] = (byCategory[template.category] || 0) + 1;
    });

    return {
      total: templates.length,
      byCategory,
      mostUsed: templates.slice(0, 5) // First 5 as most "used" (could track actual usage)
    };
  }
}

// Export singleton instance
export const sessionTemplateService = new SessionTemplateService();
