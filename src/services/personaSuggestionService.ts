import { BotConfig } from '../types/index.js';
import { getBotsWithCustomConfigs } from '../types/constants.js';

export interface PersonaSuggestion {
  botId: string;
  botName: string;
  role: string;
  confidence: number; // 0-1
  reasoning: string;
  expertise: string[];
}

export interface SuggestionRequest {
  topic: string;
  context?: string;
  mode?: string;
  maxBots?: number;
  includeSpecialists?: boolean;
  includeIdeological?: boolean;
}

export interface SuggestionResult {
  suggestions: PersonaSuggestion[];
  teamComposition: {
    specialists: BotConfig[];
    generalists: BotConfig[];
    perspectives: string[];
  };
  score: number; // Overall team score
  reasoning: string;
}

/**
 * Smart Persona Suggestion Service
 *
 * Analyzes topics and suggests optimal persona combinations for council sessions.
 * Uses keyword matching and semantic similarity to match topics to expertise.
 */
export class PersonaSuggestionService {
  private topicMappings: Map<string, {
    keywords: string[];
    personas: string[];
    minBots: number;
    maxBots: number;
    recommended: string[];
  }>;

  private personaExpertise: Map<string, {
    domains: string[];
    keywords: string[];
    ideologies?: string[];
    specialties?: string[];
  }>;

  constructor() {
    this.initializeTopicMappings();
    this.initializePersonaExpertise();
  }

  private initializeTopicMappings() {
    this.topicMappings = new Map([
      ['science', {
        keywords: ['science', 'research', 'experiment', 'hypothesis', 'quantum', 'physics', 'biology', 'chemistry', 'scientific'],
        personas: ['speaker-high-council', 'specialist-science', 'councilor-technocrat', 'councilor-visionary', 'councilor-historian'],
        minBots: 3,
        maxBots: 5,
        recommended: ['specialist-science', 'councilor-technocrat', 'councilor-visionary']
      }],
      ['medicine', {
        keywords: ['medicine', 'medical', 'health', 'treatment', 'disease', 'diagnosis', 'therapy', 'drug', 'patient', 'clinical'],
        personas: ['speaker-high-council', 'specialist-medical', 'councilor-ethicist', 'councilor-psychologist'],
        minBots: 3,
        maxBots: 4,
        recommended: ['specialist-medical', 'councilor-ethicist', 'councilor-psychologist']
      }],
      ['technology', {
        keywords: ['technology', 'software', 'coding', 'programming', 'AI', 'artificial intelligence', 'tech', 'digital', 'computer'],
        personas: ['speaker-high-council', 'specialist-code', 'councilor-technocrat', 'councilor-sentinel'],
        minBots: 3,
        maxBots: 4,
        recommended: ['specialist-code', 'councilor-technocrat', 'councilor-sentinel']
      }],
      ['law', {
        keywords: ['law', 'legal', 'regulation', 'compliance', 'court', 'ruling', 'justice', 'rights', 'policy'],
        personas: ['speaker-high-council', 'specialist-legal', 'councilor-diplomat', 'councilor-ethicist'],
        minBots: 3,
        maxBots: 4,
        recommended: ['specialist-legal', 'councilor-diplomat', 'councilor-ethicist']
      }],
      ['economics', {
        keywords: ['economics', 'economy', 'market', 'finance', 'business', 'trade', 'budget', 'tax', 'inflation', 'investment'],
        personas: ['speaker-high-council', 'specialist-finance', 'councilor-pragmatist', 'councilor-progressive'],
        minBots: 3,
        maxBots: 4,
        recommended: ['specialist-finance', 'councilor-pragmatist', 'councilor-progressive']
      }],
      ['politics', {
        keywords: ['politics', 'political', 'election', 'government', 'democracy', 'policy', 'reform', 'vote'],
        personas: ['speaker-high-council', 'councilor-diplomat', 'councilor-progressive', 'councilor-conservative', 'councilor-independent'],
        minBots: 4,
        maxBots: 5,
        recommended: ['councilor-progressive', 'councilor-conservative', 'councilor-independent']
      }],
      ['philosophy', {
        keywords: ['philosophy', 'ethics', 'morality', 'values', 'meaning', 'existence', 'virtue', 'justice'],
        personas: ['speaker-high-council', 'councilor-ethicist', 'councilor-visionary', 'councilor-historian'],
        minBots: 3,
        maxBots: 4,
        recommended: ['councilor-ethicist', 'councilor-visionary', 'councilor-historian']
      }],
      ['environment', {
        keywords: ['environment', 'climate', 'sustainability', 'green', 'carbon', 'emission', 'renewable', 'ecosystem'],
        personas: ['speaker-high-council', 'specialist-science', 'councilor-pragmatist', 'councilor-visionary'],
        minBots: 3,
        maxBots: 4,
        recommended: ['specialist-science', 'councilor-pragmatist', 'councilor-visionary']
      }],
      ['defense', {
        keywords: ['defense', 'security', 'military', 'war', 'conflict', 'threat', 'safety', 'protection'],
        personas: ['speaker-high-council', 'specialist-military', 'councilor-sentinel', 'councilor-diplomat'],
        minBots: 3,
        maxBots: 4,
        recommended: ['specialist-military', 'councilor-sentinel', 'councilor-diplomat']
      }],
      ['social', {
        keywords: ['social', 'society', 'community', 'culture', 'equality', 'diversity', 'inclusion', 'rights'],
        personas: ['speaker-high-council', 'councilor-ethicist', 'councilor-progressive', 'councilor-psychologist'],
        minBots: 3,
        maxBots: 5,
        recommended: ['councilor-ethicist', 'councilor-progressive', 'councilor-psychologist']
      }],
      ['education', {
        keywords: ['education', 'school', 'learning', 'teaching', 'student', 'curriculum', 'knowledge'],
        personas: ['speaker-high-council', 'councilor-historian', 'councilor-pragmatist', 'councilor-visionary'],
        minBots: 3,
        maxBots: 4,
        recommended: ['councilor-historian', 'councilor-pragmatist', 'councilor-visionary']
      }],
      ['business', {
        keywords: ['business', 'corporate', 'company', 'startup', 'entrepreneur', 'strategy', 'management'],
        personas: ['speaker-high-council', 'councilor-pragmatist', 'councilor-technocrat', 'specialist-finance'],
        minBots: 3,
        maxBots: 4,
        recommended: ['councilor-pragmatist', 'councilor-technocrat', 'specialist-finance']
      }],
      ['space', {
        keywords: ['space', 'astronomy', 'rocket', 'satellite', 'exploration', 'Mars', 'NASA', '宇宙'],
        personas: ['speaker-high-council', 'specialist-science', 'councilor-visionary', 'councilor-technocrat'],
        minBots: 3,
        maxBots: 4,
        recommended: ['specialist-science', 'councilor-visionary', 'councilor-technocrat']
      }],
      ['energy', {
        keywords: ['energy', 'power', 'electricity', 'fuel', 'oil', 'gas', 'nuclear', 'renewable', 'solar', 'wind'],
        personas: ['speaker-high-council', 'specialist-science', 'councilor-technocrat', 'councilor-pragmatist'],
        minBots: 3,
        maxBots: 4,
        recommended: ['specialist-science', 'councilor-technocrat', 'councilor-pragmatist']
      }],
      ['psychology', {
        keywords: ['psychology', 'psychological', 'behavior', 'mental', 'mind', 'cognitive', 'therapy'],
        personas: ['speaker-high-council', 'councilor-psychologist', 'councilor-ethicist', 'councilor-skeptic'],
        minBots: 3,
        maxBots: 4,
        recommended: ['councilor-psychologist', 'councilor-ethicist', 'councilor-skeptic']
      }]
    ]);
  }

  private initializePersonaExpertise() {
    const bots = getBotsWithCustomConfigs();

    this.personaExpertise = new Map();
    for (const bot of bots) {
      const expertise = this.extractExpertiseFromPersona(bot.persona);
      this.personaExpertise.set(bot.id, expertise);
    }
  }

  private extractExpertiseFromPersona(persona: string) {
    const domains: string[] = [];
    const keywords: string[] = [];
    const ideologies: string[] = [];
    const specialties: string[] = [];

    // Extract domains based on persona description
    const desc = persona.toLowerCase();

    // Domain detection
    if (desc.includes('science') || desc.includes('research')) {
      domains.push('science');
      keywords.push('science', 'research', 'data', 'evidence');
    }
    if (desc.includes('technolog') || desc.includes('code') || desc.includes('data')) {
      domains.push('technology');
      keywords.push('technology', 'software', 'coding', 'digital');
    }
    if (desc.includes('ethic') || desc.includes('moral')) {
      domains.push('ethics');
      keywords.push('ethics', 'morality', 'values', 'right', 'wrong');
    }
    if (desc.includes('econom') || desc.includes('market') || desc.includes('financial')) {
      domains.push('economics');
      keywords.push('economics', 'finance', 'market', 'trade');
    }
    if (desc.includes('law') || desc.includes('legal') || desc.includes('regulation')) {
      domains.push('law');
      keywords.push('law', 'legal', 'regulation', 'compliance');
    }
    if (desc.includes('health') || desc.includes('medical') || desc.includes('medicine')) {
      domains.push('medicine');
      keywords.push('medicine', 'health', 'treatment', 'clinical');
    }
    if (desc.includes('security') || desc.includes('defense') || desc.includes('military')) {
      domains.push('security');
      keywords.push('security', 'defense', 'safety', 'threat');
    }
    if (desc.includes('psycholog') || desc.includes('behavior')) {
      domains.push('psychology');
      keywords.push('psychology', 'behavior', 'mental', 'cognitive');
    }
    if (desc.includes('history') || desc.includes('past')) {
      domains.push('history');
      keywords.push('history', 'past', 'precedent', 'historical');
    }
    if (desc.includes('vision') || desc.includes('future')) {
      domains.push('future');
      keywords.push('future', 'vision', 'innovation', 'change');
    }

    // Ideology detection
    if (desc.includes('progressive')) {
      ideologies.push('progressive');
    }
    if (desc.includes('conservative')) {
      ideologies.push('conservative');
    }
    if (desc.includes('libertarian')) {
      ideologies.push('libertarian');
    }
    if (desc.includes('independent')) {
      ideologies.push('independent');
    }

    // Specialty detection
    if (desc.includes('finance') || desc.includes('econom')) {
      specialties.push('finance');
    }
    if (desc.includes('code') || desc.includes('program')) {
      specialties.push('coding');
    }
    if (desc.includes('legal')) {
      specialties.push('legal');
    }
    if (desc.includes('military') || desc.includes('defense')) {
      specialties.push('military');
    }
    if (desc.includes('science')) {
      specialties.push('science');
    }
    if (desc.includes('medical') || desc.includes('health')) {
      specialties.push('medical');
    }

    return { domains, keywords, ideologies, specialties };
  }

  /**
   * Suggest optimal personas for a given topic
   */
  async suggestPersonas(request: SuggestionRequest): Promise<SuggestionResult> {
    const { topic, context, mode, maxBots = 5, includeSpecialists = true, includeIdeological = true } = request;

    // Normalize topic for matching
    const normalizedTopic = (topic + ' ' + (context || '')).toLowerCase();

    // Determine topic category
    const category = this.categorizeTopic(normalizedTopic);

    // Get configured bots
    const allBots = getBotsWithCustomConfigs();

    // Score bots based on expertise match
    const scoredBots = allBots.map(bot => {
      const expertise = this.personaExpertise.get(bot.id) || { domains: [], keywords: [], ideologies: [], specialties: [] };
      const score = this.calculateBotScore(bot, normalizedTopic, category, expertise, includeSpecialists, includeIdeological);

      return {
        bot,
        score,
        reasoning: this.generateReasoning(bot, category, expertise)
      };
    });

    // Filter and sort by score
    const relevantBots = scoredBots
      .filter(sb => sb.score > 0.3) // Minimum threshold
      .sort((a, b) => b.score - a.score);

    // Select optimal team composition
    const selected = this.selectTeam(relevantBots, category, maxBots);

    // Build result
    const suggestions = selected.map(s => ({
      botId: s.bot.id,
      botName: s.bot.name,
      role: s.bot.role,
      confidence: s.score,
      reasoning: s.reasoning,
      expertise: this.personaExpertise.get(s.bot.id)?.domains || []
    }));

    const teamComposition = this.buildTeamComposition(selected.map(s => s.bot), category);

    const result: SuggestionResult = {
      suggestions,
      teamComposition,
      score: selected.reduce((sum, s) => sum + s.score, 0) / selected.length,
      reasoning: this.generateTeamReasoning(category, selected.length, teamComposition)
    };

    return result;
  }

  private categorizeTopic(text: string): string | null {
    let bestMatch: string | null = null;
    let bestScore = 0;

    for (const [category, config] of this.topicMappings.entries()) {
      let score = 0;
      for (const keyword of config.keywords) {
        if (text.includes(keyword)) {
          score += 1;
        }
      }

      // Boost score if topic is exactly the category
      if (text.includes(category)) {
        score += 3;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = category;
      }
    }

    return bestScore > 0 ? bestMatch : null;
  }

  private calculateBotScore(
    bot: BotConfig,
    topic: string,
    category: string | null,
    expertise: any,
    includeSpecialists: boolean,
    includeIdeological: boolean
  ): number {
    let score = 0;

    // Base score for being enabled
    score += bot.enabled ? 0.5 : 0;

    // Role-based scoring
    if (bot.role === 'speaker') score += 0.3;
    if (bot.role === 'specialist' && includeSpecialists) score += 0.8;
    if (bot.role === 'councilor') score += 0.4;

    // Category match
    if (category && bot.role === 'specialist') {
      const specialistMap: Record<string, string> = {
        science: 'specialist-science',
        medicine: 'specialist-medical',
        technology: 'specialist-code',
        law: 'specialist-legal',
        economics: 'specialist-finance',
        defense: 'specialist-military'
      };

      if (specialistMap[category] === bot.id) {
        score += 1.0; // Perfect match
      }
    }

    // Expertise match
    if (category && this.topicMappings.has(category)) {
      const config = this.topicMappings.get(category)!;
      if (config.personas.includes(bot.id)) {
        score += 0.7;
      }
      if (config.recommended.includes(bot.id)) {
        score += 0.5; // Extra boost for recommended
      }
    }

    // Keyword matching
    const botKeywords = expertise.keywords || [];
    const textWords = topic.split(/\s+/);

    let keywordMatches = 0;
    for (const keyword of botKeywords) {
      if (textWords.some(w => w.includes(keyword) || keyword.includes(w))) {
        keywordMatches++;
      }
    }

    score += Math.min(keywordMatches * 0.1, 0.5);

    return Math.min(score, 2.0); // Cap at 2.0
  }

  private generateReasoning(bot: BotConfig, category: string | null, expertise: any): string {
    const reasons: string[] = [];

    if (bot.role === 'specialist') {
      reasons.push(`Specialist in ${expertise.specialties?.join(', ') || bot.id.replace('specialist-', '')}`);
    }

    if (category && this.topicMappings.has(category)) {
      const config = this.topicMappings.get(category)!;
      if (config.recommended.includes(bot.id)) {
        reasons.push('Recommended for this topic category');
      }
      if (config.personas.includes(bot.id)) {
        reasons.push('Relevant expertise for this domain');
      }
    }

    if (expertise.domains.length > 0) {
      reasons.push(`Domain expertise: ${expertise.domains.join(', ')}`);
    }

    if (reasons.length === 0) {
      reasons.push('General perspective valuable for balanced discussion');
    }

    return reasons.join('; ');
  }

  private selectTeam(scoredBots: Array<{ bot: BotConfig; score: number; reasoning: string }>, category: string | null, maxBots: number) {
    const selected: Array<{ bot: BotConfig; score: number; reasoning: string }> = [];
    const selectedIds = new Set<string>();

    // Ensure we have a speaker
    const speaker = scoredBots.find(sb => sb.bot.role === 'speaker' && !selectedIds.has(sb.bot.id));
    if (speaker) {
      selected.push(speaker);
      selectedIds.add(speaker.bot.id);
    }

    // Add specialists first if available
    const specialists = scoredBots
      .filter(sb => sb.bot.role === 'specialist' && !selectedIds.has(sb.bot.id))
      .slice(0, maxBots - selected.length);

    for (const specialist of specialists) {
      if (selected.length < maxBots) {
        selected.push(specialist);
        selectedIds.add(specialist.bot.id);
      }
    }

    // Fill remaining spots with generalists
    const generalists = scoredBots
      .filter(sb => sb.bot.role === 'councilor' && !selectedIds.has(sb.bot.id))
      .slice(0, maxBots - selected.length);

    for (const generalist of generalists) {
      if (selected.length < maxBots) {
        selected.push(generalist);
        selectedIds.add(generalist.bot.id);
      }
    }

    return selected;
  }

  private buildTeamComposition(bots: BotConfig[], category: string | null) {
    const specialists = bots.filter(b => b.role === 'specialist');
    const generalists = bots.filter(b => b.role === 'councilor');

    const perspectives = new Set<string>();
    if (category === 'politics' || category === 'social') {
      // Add ideological diversity for political topics
      const progressives = bots.find(b => b.id.includes('progressive'));
      const conservatives = bots.find(b => b.id.includes('conservative'));
      const independents = bots.find(b => b.id.includes('independent'));

      if (progressives) perspectives.add('Progressive');
      if (conservatives) perspectives.add('Conservative');
      if (independents) perspectives.add('Independent');
    } else {
      // Add perspective diversity
      const visionaries = bots.find(b => b.id.includes('visionary'));
      const pragmatists = bots.find(b => b.id.includes('pragmatist'));
      const skeptics = bots.find(b => b.id.includes('skeptic'));

      if (visionaries) perspectives.add('Visionary');
      if (pragmatists) perspectives.add('Pragmatic');
      if (skeptics) perspectives.add('Skeptical');
    }

    return {
      specialists,
      generalists,
      perspectives: Array.from(perspectives)
    };
  }

  private generateTeamReasoning(category: string | null, teamSize: number, composition: any): string {
    let reasoning = `Selected ${teamSize} personas`;

    if (category) {
      reasoning += ` optimized for ${category} topics`;
    }

    if (composition.specialists.length > 0) {
      reasoning += `, including ${composition.specialists.length} specialist(s)`;
    }

    if (composition.perspectives.length > 0) {
      reasoning += ` for balanced ${composition.perspectives.join(', ')} perspectives`;
    }

    reasoning += '.';

    return reasoning;
  }

  /**
   * Get all available topic categories
   */
  getTopicCategories(): Array<{ category: string; keywords: string[]; description: string }> {
    return Array.from(this.topicMappings.entries()).map(([category, config]) => ({
      category,
      keywords: config.keywords,
      description: `${category.charAt(0).toUpperCase() + category.slice(1)} topics`
    }));
  }

  /**
   * Validate a persona selection against best practices
   */
  validatePersonaSelection(botIds: string[]): { valid: boolean; score: number; feedback: string[] } {
    const bots = getBotsWithCustomConfigs();
    const selectedBots = bots.filter(b => botIds.includes(b.id));

    const feedback: string[] = [];
    let score = 0;

    // Check for speaker
    const hasSpeaker = selectedBots.some(b => b.role === 'speaker');
    if (hasSpeaker) {
      score += 20;
    } else {
      feedback.push('Warning: No speaker selected. Consider adding one for better synthesis.');
    }

    // Check team size
    if (selectedBots.length < 3) {
      feedback.push('Team may be too small. Consider 3-5 personas for richer discussion.');
    } else if (selectedBots.length > 7) {
      feedback.push('Team may be too large. Consider limiting to 5 personas for focus.');
    } else {
      score += 20;
    }

    // Check role diversity
    const hasSpecialist = selectedBots.some(b => b.role === 'specialist');
    const hasGeneralists = selectedBots.some(b => b.role === 'councilor');

    if (hasSpecialist && hasGeneralists) {
      score += 20;
    } else if (selectedBots.length >= 3) {
      score += 10;
    }

    // Check perspective diversity
    const ideologicalBots = selectedBots.filter(b =>
      b.id.includes('progressive') ||
      b.id.includes('conservative') ||
      b.id.includes('libertarian') ||
      b.id.includes('independent')
    );

    if (ideologicalBots.length >= 2) {
      score += 20;
      feedback.push('Good ideological diversity detected.');
    } else if (selectedBots.length >= 3) {
      score += 10;
    }

    // Check for enabled bots
    const allEnabled = selectedBots.every(b => b.enabled);
    if (allEnabled) {
      score += 20;
    } else {
      feedback.push('Some selected bots are disabled. Enable them for participation.');
    }

    const valid = score >= 60; // 60% threshold

    if (valid) {
      feedback.push('Strong persona selection!');
    } else if (score >= 40) {
      feedback.push('Adequate selection, could be improved.');
    } else {
      feedback.push('Consider revising persona selection for better balance.');
    }

    return { valid, score, feedback };
  }
}

// Export singleton instance
export const personaSuggestionService = new PersonaSuggestionService();
