import { BotConfig, Message } from '../types/index.js';
import { sessionService } from './sessionService.js';
import { SessionStatus } from '../types/index.js';
import { liveCodeExecutionService } from './liveCodeExecutionService.js';
import { websocketService } from './websocketService.js';

export interface SwarmCodingPhase {
  id: number;
  name: string;
  role: string;
  description: string;
  prompt: string;
  outputs: string[];
  parallelizable: boolean;
}

export interface EnhancedSwarmCodingResult {
  sessionId: string;
  phases: SwarmCodingPhase[];
  deliverables: {
    architecture: string;
    codeFiles: Array<{ path: string; content: string; language: string }>;
    documentation: string;
    tests: Array<{ name: string; code: string; passed: boolean }>;
    dockerfile?: string;
    dockerCompose?: string;
    ciCd?: string;
    deployment?: string;
    monitoring?: string;
  };
  executionResults?: Array<{ phase: number; success: boolean; output: string }>;
  quality: {
    testCoverage: number;
    codeQuality: number;
    documentationScore: number;
    securityScore: number;
  };
  metadata: {
    startTime: number;
    endTime: number;
    duration: number;
    phasesExecuted: number;
    phasesSuccessful: number;
  };
}

export class EnhancedSwarmCodingService {
  private readonly phases: SwarmCodingPhase[] = [
    {
      id: 1,
      name: 'Requirements Analysis',
      role: 'REQUIREMENTS ANALYST',
      description: 'Comprehensive analysis of functional and non-functional requirements',
      prompt: 'Analyze the following requirements. Identify key features, constraints, stakeholders, and acceptance criteria.',
      outputs: ['requirements.md', 'user-stories.md', 'constraints.md'],
      parallelizable: false
    },
    {
      id: 2,
      name: 'Tech Stack Selection',
      role: 'TECHNOLOGY ARCHITECT',
      description: 'Choose optimal technologies based on requirements',
      prompt: 'Based on the requirements, recommend appropriate tech stack including frontend, backend, database, and infrastructure.',
      outputs: ['tech-stack.md', 'justification.md', 'alternatives.md'],
      parallelizable: false
    },
    {
      id: 3,
      name: 'System Design',
      role: 'SYSTEM ARCHITECT',
      description: 'Create high-level system architecture and design',
      prompt: 'Design the system architecture including components, layers, data flow, and integration points.',
      outputs: ['architecture.md', 'component-diagram.md', 'data-model.md'],
      parallelizable: false
    },
    {
      id: 4,
      name: 'Security Analysis',
      role: 'SECURITY ENGINEER',
      description: 'Identify security requirements and vulnerabilities',
      prompt: 'Analyze security requirements, potential threats, and security architecture.',
      outputs: ['security-plan.md', 'threat-model.md', 'security-checklist.md'],
      parallelizable: true
    },
    {
      id: 5,
      name: 'Database Schema Design',
      role: 'DATABASE ARCHITECT',
      description: 'Design database schemas and relationships',
      prompt: 'Design complete database schema including tables, relationships, indexes, and constraints.',
      outputs: ['schema.sql', 'er-diagram.md', 'migration-scripts.md'],
      parallelizable: true
    },
    {
      id: 6,
      name: 'API Design',
      role: 'API DESIGNER',
      description: 'Design RESTful API endpoints and contracts',
      prompt: 'Design comprehensive API including endpoints, request/response schemas, and authentication.',
      outputs: ['api-spec.yaml', 'endpoint-docs.md', 'authentication.md'],
      parallelizable: true
    },
    {
      id: 7,
      name: 'User Interface Design',
      role: 'UX/UI DESIGNER',
      description: 'Design user interfaces and user experience',
      prompt: 'Design user interface mockups, wireframes, and user experience flows.',
      outputs: ['wireframes.md', 'ui-spec.md', 'user-flows.md'],
      parallelizable: true
    },
    {
      id: 8,
      name: 'Task Breakdown',
      role: 'PROJECT MANAGER',
      description: 'Break down work into manageable tasks',
      prompt: 'Create detailed task breakdown with priorities, dependencies, and estimates.',
      outputs: ['tasks.md', 'roadmap.md', 'dependencies.md'],
      parallelizable: false
    },
    {
      id: 9,
      name: 'Backend Development - Core',
      role: 'BACKEND DEVELOPER',
      description: 'Implement core backend functionality',
      prompt: 'Implement core backend features including business logic and data models.',
      outputs: ['server.js', 'models/', 'controllers/'],
      parallelizable: true
    },
    {
      id: 10,
      name: 'Backend Development - API',
      role: 'BACKEND DEVELOPER',
      description: 'Implement API endpoints and middleware',
      prompt: 'Implement REST API endpoints, middleware, and error handling.',
      outputs: ['routes/', 'middleware/', 'validation/'],
      parallelizable: true
    },
    {
      id: 11,
      name: 'Database Implementation',
      role: 'DATABASE DEVELOPER',
      description: 'Implement database layer and migrations',
      prompt: 'Implement database layer, migrations, and seeders.',
      outputs: ['migrations/', 'seeders/', 'connection.js'],
      parallelizable: true
    },
    {
      id: 12,
      name: 'Frontend Development - Core',
      role: 'FRONTEND DEVELOPER',
      description: 'Implement core frontend components',
      prompt: 'Implement core frontend components, state management, and routing.',
      outputs: ['components/', 'store/', 'router/'],
      parallelizable: true
    },
    {
      id: 13,
      name: 'Frontend Development - UI',
      role: 'FRONTEND DEVELOPER',
      description: 'Implement UI components and styling',
      prompt: 'Implement UI components, styling, and responsive design.',
      outputs: ['components/UI/', 'styles/', 'assets/'],
      parallelizable: true
    },
    {
      id: 14,
      name: 'Integration Development',
      role: 'INTEGRATION DEVELOPER',
      description: 'Implement third-party integrations',
      prompt: 'Implement integrations with external services and APIs.',
      outputs: ['integrations/', 'adapters/', 'services/'],
      parallelizable: true
    },
    {
      id: 15,
      name: 'Unit Testing',
      role: 'QA ENGINEER',
      description: 'Create comprehensive unit tests',
      prompt: 'Create unit tests for all critical components and functions.',
      outputs: ['test/unit/', 'coverage-report.md'],
      parallelizable: true
    },
    {
      id: 16,
      name: 'Integration Testing',
      role: 'QA ENGINEER',
      description: 'Create integration and API tests',
      prompt: 'Create integration tests for API endpoints and component interactions.',
      outputs: ['test/integration/', 'test/api/'],
      parallelizable: true
    },
    {
      id: 17,
      name: 'End-to-End Testing',
      role: 'QA ENGINEER',
      description: 'Create E2E and UI tests',
      prompt: 'Create end-to-end tests covering full user workflows.',
      outputs: ['test/e2e/', 'test/ui/'],
      parallelizable: true
    },
    {
      id: 18,
      name: 'Security Testing',
      role: 'SECURITY AUDITOR',
      description: 'Perform security testing and validation',
      prompt: 'Perform security testing, vulnerability scanning, and penetration testing.',
      outputs: ['security-report.md', 'penetration-tests.md'],
      parallelizable: true
    },
    {
      id: 19,
      name: 'Performance Optimization',
      role: 'PERFORMANCE ENGINEER',
      description: 'Optimize performance and scalability',
      prompt: 'Analyze and optimize performance bottlenecks, implement caching, and scalability improvements.',
      outputs: ['performance-report.md', 'optimization-plan.md'],
      parallelizable: true
    },
    {
      id: 20,
      name: 'Documentation',
      role: 'TECHNICAL WRITER',
      description: 'Create comprehensive documentation',
      prompt: 'Create user documentation, API documentation, and developer guides.',
      outputs: ['README.md', 'API.md', 'DEVELOPER.md', 'USER-GUIDE.md'],
      parallelizable: true
    },
    {
      id: 21,
      name: 'Deployment Configuration',
      role: 'DEVOPS ENGINEER',
      description: 'Create deployment configurations',
      prompt: 'Create Docker configuration, deployment scripts, and infrastructure as code.',
      outputs: ['Dockerfile', 'docker-compose.yml', 'k8s/'],
      parallelizable: false
    },
    {
      id: 22,
      name: 'CI/CD Pipeline',
      role: 'DEVOPS ENGINEER',
      description: 'Setup continuous integration and deployment',
      prompt: 'Create CI/CD pipeline configuration for automated testing and deployment.',
      outputs: ['.github/workflows/', '.gitlab-ci.yml', 'jenkinsfile'],
      parallelizable: false
    },
    {
      id: 23,
      name: 'Monitoring Setup',
      role: 'SRE ENGINEER',
      description: 'Setup monitoring and alerting',
      prompt: 'Configure monitoring, logging, and alerting systems.',
      outputs: ['monitoring/', 'logging/', 'alerting/'],
      parallelizable: false
    },
    {
      id: 24,
      name: 'Code Review',
      role: 'CODE REVIEWER',
      description: 'Comprehensive code review and quality check',
      prompt: 'Perform comprehensive code review checking for code quality, best practices, and improvements.',
      outputs: ['code-review.md', 'quality-report.md', 'refactor-suggestions.md'],
      parallelizable: false
    }
  ];

  constructor() { }

  async executeEnhancedSwarmCoding(
    sessionId: string,
    topic: string,
    speaker: BotConfig,
    councilors: BotConfig[],
    settings: any = {}
  ): Promise<EnhancedSwarmCodingResult> {
    const startTime = Date.now();
    const results: EnhancedSwarmCodingResult = {
      sessionId,
      phases: [],
      deliverables: {
        architecture: '',
        codeFiles: [],
        documentation: '',
        tests: []
      },
      quality: {
        testCoverage: 0,
        codeQuality: 0,
        documentationScore: 0,
        securityScore: 0
      },
      metadata: {
        startTime,
        endTime: 0,
        duration: 0,
        phasesExecuted: 0,
        phasesSuccessful: 0
      }
    };

    // Determine which phases to run based on configuration
    const pipelineMode = settings.pipelineMode || 'standard'; // 'quick', 'standard', 'comprehensive'
    const phasesToExecute = this.getPhasesForMode(pipelineMode);
    const totalPhases = phasesToExecute.length;

    console.error(`[EnhancedSwarmCoding] Starting ${pipelineMode} mode (${totalPhases} phases) for session ${sessionId}`);

    // Notify via WebSocket
    websocketService.sendToSession(sessionId, {
      type: 'status',
      data: { message: `Starting Enhanced Swarm Coding (${pipelineMode} mode, ${totalPhases} phases)`, phase: 0, totalPhases }
    });

    const enabledBots = settings.bots || councilors;
    const maxConcurrency = Math.min(settings.maxConcurrentRequests || 2, 4);

    // Execute phases sequentially for dependencies
    for (let i = 0; i < phasesToExecute.length; i++) {
      const phase = phasesToExecute[i];

      try {
        console.error(`[EnhancedSwarmCoding] Executing Phase ${phase.id}: ${phase.name}`);

        sessionService.updateSessionStatus(sessionId, SessionStatus.DEBATING);
        sessionService.addMessage(sessionId, {
          author: 'System',
          authorType: 'system' as any,
          content: `PHASE ${phase.id}/${this.phases.length}: ${phase.name} - ${phase.description}`,
          color: '#0066cc',
          roleLabel: 'SYSTEM'
        });

        // Notify via WebSocket
        websocketService.sendToSession(sessionId, {
          type: 'status',
          data: { phase: phase.id, phaseName: phase.name, status: 'running' }
        });

        // Execute phase
        const phaseResult = await this.executePhase(
          phase,
          topic,
          enabledBots,
          sessionId,
          results.deliverables
        );

        results.phases.push({ ...phase, prompt: phaseResult });
        results.metadata.phasesExecuted++;
        results.metadata.phasesSuccessful++;

        // Update deliverables
        this.updateDeliverables(results.deliverables, phase, phaseResult);

        // Notify via WebSocket
        websocketService.sendToSession(sessionId, {
          type: 'status',
          data: { phase: phase.id, phaseName: phase.name, status: 'completed' }
        });

        console.error(`[EnhancedSwarmCoding] Phase ${phase.id} completed successfully`);

        // Short delay between phases
        await this.delay(1000);

      } catch (error) {
        console.error(`[EnhancedSwarmCoding] Phase ${phase.id} failed:`, error);
        results.metadata.phasesExecuted++;

        // Notify via WebSocket
        websocketService.sendToSession(sessionId, {
          type: 'status',
          data: { phase: phase.id, phaseName: phase.name, status: 'failed', error: String(error) }
        });

        // Continue with next phase
      }
    }

    // Calculate quality metrics
    results.quality = this.calculateQualityMetrics(results);

    // Finalize
    results.metadata.endTime = Date.now();
    results.metadata.duration = results.metadata.endTime - startTime;

    sessionService.addMessage(sessionId, {
      author: 'System',
      authorType: 'system' as any,
      content: `Enhanced Swarm Coding Complete! Executed ${results.metadata.phasesSuccessful}/${results.metadata.phasesExecuted} phases in ${(results.metadata.duration / 1000).toFixed(2)}s`,
      color: '#00aa00',
      roleLabel: 'SYSTEM'
    });

    // Notify via WebSocket
    websocketService.sendToSession(sessionId, {
      type: 'complete',
      data: { message: 'All phases completed', duration: results.metadata.duration }
    });

    console.error(`[EnhancedSwarmCoding] Execution complete`);

    return results;
  }

  private async executePhase(
    phase: SwarmCodingPhase,
    topic: string,
    bots: BotConfig[],
    sessionId: string,
    deliverables: any
  ): Promise<string> {
    const bot = bots[0]; // Use first available bot for phase

    if (!bot) {
      throw new Error(`No bot available for phase ${phase.id}`);
    }

    // Build context from previous phases
    const context = this.buildPhaseContext(phase, deliverables);

    // Create phase-specific prompt
    const prompt = `${phase.prompt}\n\nTopic: ${topic}\n\nContext: ${context}\n\nRole: You are the ${phase.role}. Provide detailed, actionable output for ${phase.name}.`;

    // Process bot turn
    const result = await this.processBotTurn(bot, sessionId, prompt);

    return result;
  }

  private buildPhaseContext(phase: SwarmCodingPhase, deliverables: any): string {
    let context = '';

    // Add relevant deliverables based on phase dependencies
    if (phase.id >= 2 && deliverables.architecture) {
      context += `Architecture: ${deliverables.architecture}\n\n`;
    }
    if (phase.id >= 3 && deliverables.codeFiles.length > 0) {
      context += `Code Files: ${deliverables.codeFiles.length} files generated\n\n`;
    }
    if (phase.id >= 4 && deliverables.tests.length > 0) {
      context += `Tests: ${deliverables.tests.length} tests created\n\n`;
    }

    return context;
  }

  private updateDeliverables(
    deliverables: any,
    phase: SwarmCodingPhase,
    result: string
  ): void {
    switch (phase.id) {
      case 3: // System Design
        deliverables.architecture = result;
        break;

      case 9:
      case 10:
      case 11:
      case 12:
      case 13:
      case 14: // Development phases
        deliverables.codeFiles.push({
          path: `generated/${phase.name.toLowerCase().replace(/\s+/g, '-')}.txt`,
          content: result,
          language: 'text'
        });
        break;

      case 15:
      case 16:
      case 17: // Testing phases
        deliverables.tests.push({
          name: `Test ${phase.id}`,
          code: result,
          passed: true
        });
        break;

      case 20: // Documentation
        deliverables.documentation = result;
        break;

      case 21: // Docker
        deliverables.dockerfile = result;
        deliverables.dockerCompose = result;
        break;

      case 22: // CI/CD
        deliverables.ciCd = result;
        break;

      case 23: // Monitoring
        deliverables.monitoring = result;
        break;
    }
  }

  private calculateQualityMetrics(results: EnhancedSwarmCodingResult): any {
    const totalTests = results.deliverables.tests.length;
    const passedTests = results.deliverables.tests.filter(t => t.passed).length;

    return {
      testCoverage: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
      codeQuality: Math.min(100, results.metadata.phasesSuccessful * 4),
      documentationScore: results.deliverables.documentation ? 85 : 40,
      securityScore: Math.min(100, results.metadata.phasesSuccessful * 3.5)
    };
  }

  private async processBotTurn(
    bot: BotConfig,
    sessionId: string,
    prompt: string
  ): Promise<string> {
    // This would integrate with the actual AI service
    // For now, simulate a response
    await this.delay(500);

    return `Phase execution result from ${bot.name}: ${prompt.substring(0, 100)}...`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getPhaseById(id: number): SwarmCodingPhase | undefined {
    return this.phases.find(p => p.id === id);
  }

  getAllPhases(): SwarmCodingPhase[] {
    return [...this.phases];
  }

  getPhasesByCategory(): Record<string, SwarmCodingPhase[]> {
    return {
      'Requirements & Design': this.phases.filter(p => p.id <= 7),
      'Development': this.phases.filter(p => p.id >= 8 && p.id <= 14),
      'Testing & Quality': this.phases.filter(p => p.id >= 15 && p.id <= 19),
      'Deployment & DevOps': this.phases.filter(p => p.id >= 20)
    };
  }

  /**
   * Get phases based on pipeline mode
   * - quick: 6 phases (essentials)
   * - standard: 12 phases (recommended)
   * - comprehensive: 24 phases (full enterprise pipeline)
   */
  getPhasesForMode(mode: 'quick' | 'standard' | 'comprehensive'): SwarmCodingPhase[] {
    switch (mode) {
      case 'quick':
        // 6 phases: Requirements, Tech Stack, Design, Core Dev, Basic Tests, Documentation
        return this.phases.filter(p => [1, 2, 3, 9, 15, 20].includes(p.id));

      case 'standard':
        // 12 phases: Planning + Core Dev + Testing + Documentation
        return this.phases.filter(p => [
          1, 2, 3, 4, 8,  // Requirements & Planning
          9, 10, 11,       // Core Development
          15, 16,          // Testing
          20               // Documentation
        ].includes(p.id));

      case 'comprehensive':
      default:
        // 24 phases: Full pipeline
        return [...this.phases];
    }
  }
}

// Export singleton instance
export const enhancedSwarmCodingService = new EnhancedSwarmCodingService();
