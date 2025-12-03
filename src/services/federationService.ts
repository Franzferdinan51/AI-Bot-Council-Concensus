import { BotConfig, Message, SessionMode } from '../types/index.js';

/**
 * Specialized Council Types
 */
export type SpecializedCouncil =
  | 'legal'
  | 'technical'
  | 'financial'
  | 'medical'
  | 'scientific'
  | 'strategic'
  | 'ethical'
  | 'operational';

/**
 * Council Specialization
 */
export interface CouncilSpecialization {
  councilId: string;
  name: string;
  type: SpecializedCouncil;
  expertise: string[];
  description: string;
  capabilities: string[];
  avgResponseTime: number;
  accuracy: number;
  specialization: number; // 0-1, how focused this council is
}

/**
 * Federation Node
 */
export interface FederationNode {
  nodeId: string;
  councilId: string;
  endpoint?: string;
  specialization: CouncilSpecialization;
  status: 'active' | 'inactive' | 'busy';
  load: number; // 0-1
  lastHeartbeat: number;
  metadata: {
    version: string;
    region: string;
    capabilities: string[];
  };
}

/**
 * Inter-Council Message
 */
export interface InterCouncilMessage {
  messageId: string;
  sourceCouncilId: string;
  targetCouncilId: string;
  sessionId: string;
  type: 'consultation' | 'response' | 'collaboration' | 'handoff' | 'result';
  priority: 'low' | 'normal' | 'high' | 'critical';
  payload: {
    topic: string;
    question?: string;
    context?: string;
    data?: any;
    responseFormat: 'summary' | 'detailed' | 'bullet_points';
    expectedTime?: number;
  };
  status: 'pending' | 'processing' | 'responded' | 'failed';
  timestamp: number;
  responseTime?: number;
}

/**
 * Federation Session
 */
export interface FederationSession {
  sessionId: string;
  parentSessionId: string;
  topic: string;
  participatingCouncils: string[];
  primaryCouncil: string;
  mode: SessionMode;
  status: 'initializing' | 'active' | 'collaborating' | 'synthesizing' | 'completed' | 'failed';
  phases: FederationPhase[];
  results: Map<string, CouncilContribution>;
  synthesizedResult?: string;
  createdAt: number;
  completedAt?: number;
}

/**
 * Federation Phase
 */
export interface FederationPhase {
  phaseId: string;
  name: string;
  activeCouncil: string;
  startTime: number;
  endTime?: number;
  messages: InterCouncilMessage[];
  status: 'pending' | 'active' | 'completed';
  result?: string;
}

/**
 * Council Contribution
 */
export interface CouncilContribution {
  councilId: string;
  specialization: CouncilSpecialization['type'];
  contribution: string;
  confidence: number;
  perspective: string;
  keyPoints: string[];
  recommendations: string[];
  crossReferences: string[];
  timestamp: number;
}

/**
 * Federation Result
 */
export interface FederationResult {
  sessionId: string;
  topic: string;
  primaryRecommendation: string;
  councilContributions: CouncilContribution[];
  consensus: {
    level: number; // 0-1
    areasOfAgreement: string[];
    areasOfDisagreement: string[];
  };
  synthesizedView: string;
  actionItems: string[];
  followUpRequired: string[];
  confidence: number;
  generatedAt: number;
}

/**
 * Federation Service
 *
 * Multiple specialized councils collaborate:
 * - Legal council, Technical council, Financial council
 * - Remote consultation protocol
 * - Peer-to-peer result sharing
 * - Result synthesis across councils
 */
export class FederationService {
  private nodes: Map<string, FederationNode> = new Map();
  private sessions: Map<string, FederationSession> = new Map();
  private messageQueue: InterCouncilMessage[] = [];
  private processingMessages: Set<string> = new Set();

  constructor() {
    this.initializeDefaultCouncils();
  }

  /**
   * Register a council node
   */
  registerNode(node: FederationNode): void {
    this.nodes.set(node.nodeId, node);
    console.error(`[Federation] Registered council node: ${node.councilId} (${node.specialization.type})`);
  }

  /**
   * Unregister a council node
   */
  unregisterNode(nodeId: string): boolean {
    const deleted = this.nodes.delete(nodeId);
    if (deleted) {
      console.error(`[Federation] Unregistered council node: ${nodeId}`);
    }
    return deleted;
  }

  /**
   * Get available councils by specialization
   */
  getCouncilsBySpecialization(specialization: SpecializedCouncil): FederationNode[] {
    return Array.from(this.nodes.values()).filter(
      node => node.specialization.type === specialization && node.status === 'active'
    );
  }

  /**
   * Get the best council for a topic
   */
  async selectBestCouncil(topic: string, specialization?: SpecializedCouncil): Promise<FederationNode | null> {
    const candidates = specialization
      ? this.getCouncilsBySpecialization(specialization)
      : Array.from(this.nodes.values()).filter(node => node.status === 'active');

    if (candidates.length === 0) return null;

    // Score based on expertise match and load
    const scored = candidates.map(node => {
      const expertiseScore = this.calculateExpertiseScore(topic, node.specialization);
      const loadPenalty = node.load * 0.3;
      const accuracyBonus = node.specialization.accuracy * 0.2;
      const score = expertiseScore - loadPenalty + accuracyBonus;

      return { node, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].node;
  }

  /**
   * Initiate federated session
   */
  async initiateFederatedSession(
    parentSessionId: string,
    topic: string,
    mode: SessionMode,
    requiredSpecializations: SpecializedCouncil[]
  ): Promise<FederationSession> {
    const sessionId = this.generateSessionId();

    // Select primary council (first specialization)
    const primaryCouncil = await this.selectBestCouncil(topic, requiredSpecializations[0]);

    if (!primaryCouncil) {
      throw new Error(`No available council for specialization: ${requiredSpecializations[0]}`);
    }

    // Select additional councils
    const participatingCouncils: string[] = [primaryCouncil.councilId];

    for (let i = 1; i < requiredSpecializations.length; i++) {
      const spec = requiredSpecializations[i];
      const council = await this.selectBestCouncil(topic, spec);
      if (council) {
        participatingCouncils.push(council.councilId);
      }
    }

    const session: FederationSession = {
      sessionId,
      parentSessionId,
      topic,
      participatingCouncils,
      primaryCouncil: primaryCouncil.councilId,
      mode,
      status: 'initializing',
      phases: [
        {
          phaseId: this.generatePhaseId(),
          name: 'Initial Consultation',
          activeCouncil: primaryCouncil.councilId,
          startTime: Date.now(),
          messages: [],
          status: 'active'
        }
      ],
      results: new Map(),
      createdAt: Date.now()
    };

    this.sessions.set(sessionId, session);
    console.error(`[Federation] Initiated federated session ${sessionId} with ${participatingCouncils.length} councils`);

    return session;
  }

  /**
   * Send inter-council message
   */
  async sendMessage(message: Omit<InterCouncilMessage, 'messageId' | 'timestamp' | 'status'>): Promise<string> {
    const fullMessage: InterCouncilMessage = {
      ...message,
      messageId: this.generateMessageId(),
      timestamp: Date.now(),
      status: 'pending'
    };

    this.messageQueue.push(fullMessage);
    console.error(`[Federation] Queued message ${fullMessage.messageId}: ${message.type} from ${message.sourceCouncilId} to ${message.targetCouncilId}`);

    // Process asynchronously
    this.processMessageQueue();

    return fullMessage.messageId;
  }

  /**
   * Handle consultation request
   */
  async requestConsultation(
    sourceCouncilId: string,
    targetCouncilType: SpecializedCouncil,
    sessionId: string,
    question: string,
    context: string
  ): Promise<InterCouncilMessage> {
    const targetNode = await this.selectBestCouncil(question, targetCouncilType);

    if (!targetNode) {
      throw new Error(`No available council of type: ${targetCouncilType}`);
    }

    const message = await this.sendMessage({
      sourceCouncilId,
      targetCouncilId: targetNode.councilId,
      sessionId,
      type: 'consultation',
      priority: 'normal',
      payload: {
        topic: question,
        question,
        context,
        responseFormat: 'detailed',
        expectedTime: 5000
      }
    });

    const fullMessage = this.messageQueue.find(m => m.messageId === message);
    if (!fullMessage) {
      throw new Error('Message not found in queue');
    }

    return fullMessage;
  }

  /**
   * Receive and process message
   */
  async receiveMessage(messageId: string, response: any): Promise<void> {
    const message = this.messageQueue.find(m => m.messageId === messageId);
    if (!message) {
      throw new Error(`Message not found: ${messageId}`);
    }

    message.status = 'responded';
    message.responseTime = Date.now() - message.timestamp;

    // Update session phase
    const session = this.sessions.get(message.sessionId);
    if (session) {
      const activePhase = session.phases[session.phases.length - 1];
      activePhase.messages.push(message);

      // Store contribution
      session.results.set(message.sourceCouncilId, {
        councilId: message.sourceCouncilId,
        specialization: this.getNodeSpecialization(message.sourceCouncilId),
        contribution: response.summary || response,
        confidence: response.confidence || 0.8,
        perspective: this.getPerspective(message.sourceCouncilId),
        keyPoints: response.keyPoints || [],
        recommendations: response.recommendations || [],
        crossReferences: response.crossReferences || [],
        timestamp: Date.now()
      });

      // Check if we should move to next phase
      if (session.participatingCouncils.every(id => session.results.has(id))) {
        await this.advanceToSynthesis(session.sessionId);
      }
    }

    console.error(`[Federation] Received response to ${messageId} from ${message.sourceCouncilId}`);
  }

  /**
   * Synthesize results from all councils
   */
  async synthesizeResults(sessionId: string): Promise<FederationResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const contributions = Array.from(session.results.values());

    // Calculate consensus
    const consensus = this.calculateConsensus(contributions);

    // Generate synthesized view
    const synthesizedView = this.generateSynthesizedView(session.topic, contributions);

    // Determine action items
    const actionItems = this.extractActionItems(contributions);

    // Calculate overall confidence
    const avgConfidence = contributions.reduce((sum, c) => sum + c.confidence, 0) / contributions.length;

    const result: FederationResult = {
      sessionId,
      topic: session.topic,
      primaryRecommendation: this.determinePrimaryRecommendation(contributions),
      councilContributions: contributions,
      consensus,
      synthesizedView,
      actionItems,
      followUpRequired: this.identifyFollowUps(contributions),
      confidence: avgConfidence,
      generatedAt: Date.now()
    };

    session.synthesizedResult = JSON.stringify(result, null, 2);
    session.status = 'completed';
    session.completedAt = Date.now();

    console.error(`[Federation] Synthesized results for session ${sessionId} with ${contributions.length} contributions`);

    return result;
  }

  /**
   * Get federation statistics
   */
  getStatistics(): {
    totalNodes: number;
    activeNodes: number;
    totalSessions: number;
    activeSessions: number;
    messageQueueSize: number;
    averageResponseTime: number;
    councilUtilization: Record<SpecializedCouncil, number>;
  } {
    const activeNodes = Array.from(this.nodes.values()).filter(n => n.status === 'active');
    const activeSessions = Array.from(this.sessions.values()).filter(s => s.status !== 'completed' && s.status !== 'failed');

    const councilUtilization: Record<SpecializedCouncil, number> = {
      legal: 0,
      technical: 0,
      financial: 0,
      medical: 0,
      scientific: 0,
      strategic: 0,
      ethical: 0,
      operational: 0
    };

    activeNodes.forEach(node => {
      councilUtilization[node.specialization.type]++;
    });

    const messages = this.messageQueue.filter(m => m.responseTime !== undefined);
    const avgResponseTime = messages.length > 0
      ? messages.reduce((sum, m) => sum + (m.responseTime || 0), 0) / messages.length
      : 0;

    return {
      totalNodes: this.nodes.size,
      activeNodes: activeNodes.length,
      totalSessions: this.sessions.size,
      activeSessions: activeSessions.length,
      messageQueueSize: this.messageQueue.length,
      averageResponseTime: avgResponseTime,
      councilUtilization
    };
  }

  /**
   * Export federation data
   */
  exportData(): string {
    return JSON.stringify({
      nodes: Array.from(this.nodes.values()),
      sessions: Array.from(this.sessions.values()).map(s => ({
        ...s,
        results: Array.from(s.results.entries())
      })),
      statistics: this.getStatistics(),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  // Private methods

  private initializeDefaultCouncils(): void {
    const defaultCouncils: FederationNode[] = [
      {
        nodeId: 'legal-node-1',
        councilId: 'council-legal-1',
        specialization: {
          councilId: 'council-legal-1',
          name: 'Legal Advisory Council',
          type: 'legal',
          expertise: ['contract law', 'compliance', 'regulation', 'litigation'],
          description: 'Specialized in legal analysis and compliance',
          capabilities: ['contract review', 'risk assessment', 'compliance check'],
          avgResponseTime: 3000,
          accuracy: 0.92,
          specialization: 0.95
        },
        status: 'active',
        load: 0.3,
        lastHeartbeat: Date.now(),
        metadata: {
          version: '1.0',
          region: 'us-east',
          capabilities: ['legal', 'compliance', 'contracts']
        }
      },
      {
        nodeId: 'technical-node-1',
        councilId: 'council-technical-1',
        specialization: {
          councilId: 'council-technical-1',
          name: 'Technical Review Council',
          type: 'technical',
          expertise: ['architecture', 'security', 'scalability', 'performance'],
          description: 'Technical architecture and implementation',
          capabilities: ['code review', 'architecture design', 'security audit'],
          avgResponseTime: 2500,
          accuracy: 0.9,
          specialization: 0.92
        },
        status: 'active',
        load: 0.4,
        lastHeartbeat: Date.now(),
        metadata: {
          version: '1.0',
          region: 'us-west',
          capabilities: ['technical', 'architecture', 'security']
        }
      },
      {
        nodeId: 'financial-node-1',
        councilId: 'council-financial-1',
        specialization: {
          councilId: 'council-financial-1',
          name: 'Financial Analysis Council',
          type: 'financial',
          expertise: ['investment', 'risk management', 'accounting', 'economics'],
          description: 'Financial planning and analysis',
          capabilities: ['financial modeling', 'risk assessment', 'investment analysis'],
          avgResponseTime: 3500,
          accuracy: 0.88,
          specialization: 0.9
        },
        status: 'active',
        load: 0.2,
        lastHeartbeat: Date.now(),
        metadata: {
          version: '1.0',
          region: 'us-east',
          capabilities: ['financial', 'investment', 'risk']
        }
      }
    ];

    defaultCouncils.forEach(node => this.registerNode(node));
  }

  private calculateExpertiseScore(topic: string, specialization: CouncilSpecialization): number {
    const topicLower = topic.toLowerCase();
    let score = 0;

    specialization.expertise.forEach(expertise => {
      if (topicLower.includes(expertise.toLowerCase())) {
        score += 0.3;
      }
    });

    return Math.min(1.0, score + specialization.accuracy * 0.3);
  }

  private async processMessageQueue(): Promise<void> {
    if (this.processingMessages.size > 0) return;

    const message = this.messageQueue.find(m => m.status === 'pending');
    if (!message) return;

    this.processingMessages.add(message.messageId);
    message.status = 'processing';

    // Simulate message processing
    await new Promise(resolve => setTimeout(resolve, 100));

    // In production, would send to actual council endpoint
    message.status = 'responded';
    this.processingMessages.delete(message.messageId);

    console.error(`[Federation] Processed message ${message.messageId}`);
  }

  private async advanceToSynthesis(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const synthesisPhase: FederationPhase = {
      phaseId: this.generatePhaseId(),
      name: 'Synthesis',
      activeCouncil: session.primaryCouncil,
      startTime: Date.now(),
      messages: [],
      status: 'active'
    };

    session.phases.push(synthesisPhase);
    session.status = 'synthesizing';

    await this.synthesizeResults(sessionId);
  }

  private calculateConsensus(contributions: CouncilContribution[]): FederationResult['consensus'] {
    // Simplified consensus calculation
    const avgConfidence = contributions.reduce((sum, c) => sum + c.confidence, 0) / contributions.length;
    const level = avgConfidence * 0.8; // Scale down for consensus

    return {
      level,
      areasOfAgreement: contributions.flatMap(c => c.keyPoints).slice(0, 3),
      areasOfDisagreement: ['Implementation timeline', 'Risk assessment'] // Simplified
    };
  }

  private generateSynthesizedView(topic: string, contributions: CouncilContribution[]): string {
    let synthesis = `Federated Analysis on "${topic}":\n\n`;

    contributions.forEach(contribution => {
      synthesis += `${contribution.specialization.toUpperCase()} Perspective:\n`;
      synthesis += `  ${contribution.contribution}\n\n`;
    });

    synthesis += 'Synthesis:\n';
    synthesis += 'A comprehensive view combining all specialized perspectives provides a balanced analysis.\n';

    return synthesis;
  }

  private extractActionItems(contributions: CouncilContribution[]): string[] {
    return Array.from(new Set(contributions.flatMap(c => c.recommendations))).slice(0, 5);
  }

  private identifyFollowUps(contributions: CouncilContribution[]): string[] {
    return [
      'Review regulatory requirements',
      'Technical feasibility assessment',
      'Financial impact analysis'
    ];
  }

  private determinePrimaryRecommendation(contributions: CouncilContribution[]): string {
    // Return recommendation from highest confidence contribution
    const sorted = contributions.sort((a, b) => b.confidence - a.confidence);
    return sorted[0]?.recommendations[0] || 'No specific recommendation';
  }

  private getNodeSpecialization(councilId: string): CouncilSpecialization['type'] {
    const node = Array.from(this.nodes.values()).find(n => n.councilId === councilId);
    return node?.specialization.type || 'technical';
  }

  private getPerspective(councilId: string): string {
    const node = Array.from(this.nodes.values()).find(n => n.councilId === councilId);
    return node?.specialization.description || 'General perspective';
  }

  private generateSessionId(): string {
    return `fed_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generatePhaseId(): string {
    return `phase_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const federationService = new FederationService();
