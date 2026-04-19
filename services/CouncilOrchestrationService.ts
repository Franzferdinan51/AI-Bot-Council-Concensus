/**
 * CouncilOrchestrationService.ts
 * Advanced multi-agent orchestration engine for AI Council
 * 
 * Features:
 * - 5 coordination patterns (inspired by Agent-Teams)
 * - Meta-Agent lifecycle (Plan → Execute → Critic → Heal → Learn)
 * - Multi-tier execution pipeline with quality gates
 * - Shared state coordination + event bus
 * - Dynamic councilor selection by topic relevance
 * - Generator-Verifier quality enforcement
 */
import { Message, BotConfig, Settings, AuthorType, SessionMode } from '../types';
import { streamBotResponse, getBotResponse } from './aiService';
import { searchMemories, saveMemory } from './knowledgeService';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type CoordinationPattern = 
  | 'orchestrator-subagent'   // Hierarchical decomposition
  | 'agent-teams'            // Parallel independent subtasks
  | 'generator-verifier'      // Quality-critical with evaluation
  | 'message-bus'            // Event-driven pipelines
  | 'shared-state';          // Collaborative building

export type MetaPhase = 'plan' | 'execute' | 'critic' | 'heal' | 'learn';

export interface OrchestratorConfig {
  pattern: CoordinationPattern;
  maxConcurrency: number;
  maxTurnsPerCouncilor: number;
  enableQualityGates: boolean;
  enableMetaAgent: boolean;
  enableSharedMemory: boolean;
  debateDelay: number;
}

export interface OrchestratorTask {
  id: string;
  description: string;
  assignedCouncilor?: BotConfig;
  status: 'pending' | 'in_progress' | 'done' | 'failed' | 'verified';
  result?: string;
  verified?: boolean;
  attempts: number;
  maxAttempts: number;
}

export interface OrchestratorSession {
  id: string;
  topic: string;
  mode: SessionMode;
  pattern: CoordinationPattern;
  config: OrchestratorConfig;
  tasks: OrchestratorTask[];
  phase: MetaPhase;
  status: 'running' | 'paused' | 'done' | 'failed';
  startedAt: string;
  completedAt?: string;
  metaCycleCount: number;
  sharedMemory: string;
  learnings: string[];
}

export interface CouncilEvent {
  type: 'phase' | 'task' | 'councilor' | 'error' | 'quality' | 'meta' | 'broadcast';
  source: string;
  data: any;
  timestamp: string;
}

// ─── QUALITY GATES ─────────────────────────────────────────────────────────────

interface QualityCriteria {
  minLength: number;
  requiredTags: string[];
  forbiddenPatterns: string[];
  minConsensusScore?: number;
}

const DEFAULT_QUALITY_GATES: Record<string, QualityCriteria> = {
  vote: {
    minLength: 100,
    requiredTags: ['<vote>', '<confidence>', '<reason>'],
    forbiddenPatterns: ['[COPY]', 'as an AI', 'I cannot', "I don't have opinions"],
    minConsensusScore: 40,
  },
  forecast: {
    minLength: 150,
    requiredTags: ['<forecast>', '<probability>', '<timeline>'],
    forbiddenPatterns: ['[COPY]', 'as an AI', 'I cannot'],
  },
  inspection: {
    minLength: 200,
    requiredTags: ['<inspection_report>', '<findings>', '<anomalies>'],
    forbiddenPatterns: ['[COPY]', 'as an AI'],
  },
  code: {
    minLength: 50,
    requiredTags: ['<file', 'language=', '/>'],
    forbiddenPatterns: ['[COPY]', 'placeholder', 'TODO'],
  },
  general: {
    minLength: 50,
    requiredTags: [],
    forbiddenPatterns: ['[COPY]', 'as an AI', 'I cannot'],
  },
};

// ─── EVENT BUS ────────────────────────────────────────────────────────────────

type EventHandler = (event: CouncilEvent) => void;

class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private eventLog: CouncilEvent[] = [];

  subscribe(type: string, handler: EventHandler) {
    if (!this.handlers.has(type)) this.handlers.set(type, []);
    this.handlers.get(type)!.push(handler);
    return () => { this.handlers.get(type)?.splice(0); };
  }

  emit(event: CouncilEvent) {
    this.eventLog.push(event);
    const h = this.handlers.get(event.type);
    if (h) h.forEach(handler => { try { handler(event); } catch (e) { console.error('Event handler error:', e); } });
    const wildcard = this.handlers.get('*');
    if (wildcard) wildcard.forEach(handler => { try { handler(event); } catch (e) { console.error('Wildcard handler error:', e); } });
  }

  getLog(limit = 100): CouncilEvent[] { return this.eventLog.slice(-limit); }
}

// ─── SHARED STATE ─────────────────────────────────────────────────────────────

class SharedState {
  private store = new Map<string, any>();
  private locks = new Map<string, boolean>();
  private listeners = new Map<string, ((key: string, value: any) => void)[]>();

  set(key: string, value: any) { this.store.set(key, value); this.notify(key, value); }
  get(key: string): any { return this.store.get(key); }

  update(key: string, updater: (v: any) => any) {
    const next = updater(this.store.get(key));
    this.store.set(key, next);
    this.notify(key, next);
    return next;
  }

  append(key: string, value: any) {
    const current = this.store.get(key) || [];
    const next = Array.isArray(current) ? [...current, value] : [current, value];
    this.store.set(key, next);
    this.notify(key, next);
    return next;
  }

  lock(key: string): boolean { if (this.locks.get(key)) return false; this.locks.set(key, true); return true; }
  unlock(key: string) { this.locks.set(key, false); }

  watch(key: string, handler: (key: string, value: any) => void) {
    if (!this.listeners.has(key)) this.listeners.set(key, []);
    this.listeners.get(key)!.push(handler);
  }

  private notify(key: string, value: any) {
    (this.listeners.get(key) || []).forEach(h => h(key, value));
    (this.listeners.get('*') || []).forEach(h => h(key, value));
  }

  getAll(): Record<string, any> { return Object.fromEntries(this.store); }
  clear() { this.store.clear(); this.locks.clear(); }
}

// ─── TOPIC ANALYZER ───────────────────────────────────────────────────────────

const TOPIC_KEYWORDS: Record<string, string[]> = {
  security: ['security', 'hack', 'breach', 'vulnerability', 'attack', 'cyber', 'privacy', 'encrypt', 'auth'],
  code: ['code', 'program', 'software', 'function', 'api', 'debug', 'implement', 'build', 'engineer'],
  legal: ['law', 'legal', 'court', 'rights', 'regulation', 'policy', 'constitutional', 'jurisdiction'],
  science: ['science', 'research', 'study', 'data', 'experiment', 'hypothesis', 'theory'],
  medical: ['medical', 'health', 'doctor', 'patient', 'disease', 'treatment', 'clinical', 'drug'],
  finance: ['money', 'financial', 'invest', 'stock', 'bank', 'budget', 'revenue', 'profit', 'cost'],
  weather: ['weather', 'storm', 'hurricane', 'tornado', 'flood', 'climate', 'forecast', 'meteorological'],
  art: ['art', 'creative', 'design', 'aesthetic', 'visual', 'music', 'paint', 'draw'],
  ethics: ['ethics', 'moral', 'right', 'wrong', 'justice', 'fair', 'bias', 'responsibility'],
  politics: ['politics', 'government', 'election', 'vote', 'party', 'congress'],
  military: ['military', 'war', 'defense', 'weapon', 'troop', 'army', 'combat'],
  animals: ['animal', 'pet', 'wildlife', 'zoo', 'vet', 'species', 'habitat'],
  plants: ['plant', 'grow', 'garden', 'crop', 'harvest', 'agriculture', 'soil'],
  emergency: ['emergency', 'disaster', 'crisis', 'urgent', 'critical', 'evacuate'],
  prediction: ['will', 'predict', 'forecast', 'probability', 'chance', 'outcome'],
  vision: ['image', 'photo', 'picture', 'visual', 'see', 'analyze', 'detect', 'recognize'],
};

const MODE_SPECIALISTS: Record<SessionMode, string[]> = {
  [SessionMode.PREDICTION]: ['scientist', 'analyst', 'researcher'],
  [SessionMode.INSPECTOR]: ['scientist', 'analyst', 'legal', 'medical'],
  [SessionMode.SWARM_CODING]: ['coder', 'specialist', 'architect'],
  [SessionMode.GOVERNMENT]: ['legal', 'politician', 'diplomat'],
  [SessionMode.RESEARCH]: ['scientist', 'researcher', 'journalist'],
  [SessionMode.SWARM]: ['planner', 'analyst'],
  [SessionMode.PROPOSAL]: ['ethicist', 'pragmatist', 'skeptic'],
  [SessionMode.DELIBERATION]: ['diplomat', 'psychologist'],
  [SessionMode.INQUIRY]: ['scientist', 'journalist', 'expert'],
};

const TEAM_SIZES: Record<SessionMode, number> = {
  [SessionMode.SWARM_CODING]: 4,
  [SessionMode.SWARM]: 5,
  [SessionMode.GOVERNMENT]: 6,
  [SessionMode.INSPECTOR]: 4,
  [SessionMode.RESEARCH]: 5,
  [SessionMode.PREDICTION]: 4,
  [SessionMode.PROPOSAL]: 3,
  [SessionMode.DELIBERATION]: 4,
  [SessionMode.INQUIRY]: 3,
};

// ─── ORCHESTRATION SERVICE ────────────────────────────────────────────────────

export class CouncilOrchestrationService {
  private eventBus = new EventBus();
  private sharedState = new SharedState();
  private sessions = new Map<string, OrchestratorSession>();
  private activeSession: OrchestratorSession | null = null;
  private stopSignal = false;
  private pauseSignal = false;

  constructor() {}

  // ── Session Management ──────────────────────────────────────────────────

  createSession(topic: string, mode: SessionMode, config?: Partial<OrchestratorConfig>): OrchestratorSession {
    const session: OrchestratorSession = {
      id: `orch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      topic,
      mode,
      pattern: this.inferPattern(mode),
      config: {
        pattern: this.inferPattern(mode),
        maxConcurrency: config?.maxConcurrency ?? 2,
        maxTurnsPerCouncilor: config?.maxTurnsPerCouncilor ?? 2,
        enableQualityGates: config?.enableQualityGates ?? true,
        enableMetaAgent: config?.enableMetaAgent ?? true,
        enableSharedMemory: config?.enableSharedMemory ?? true,
        debateDelay: config?.debateDelay ?? 1500,
      },
      tasks: [],
      phase: 'plan',
      status: 'running',
      startedAt: new Date().toISOString(),
      metaCycleCount: 0,
      sharedMemory: `# Council Session: ${topic}\n\nStarted: ${new Date().toISOString()}\n`,
      learnings: [],
    };
    this.sessions.set(session.id, session);
    this.activeSession = session;
    this.sharedState.set(`session:${session.id}:tasks`, []);
    this.sharedState.set(`session:${session.id}:phase`, 'plan');
    this.eventBus.emit({ type: 'phase', source: 'orchestrator', data: { sessionId: session.id, phase: 'plan' }, timestamp: new Date().toISOString() });
    return session;
  }

  stopSession(sessionId?: string) {
    const session = sessionId ? this.sessions.get(sessionId) : this.activeSession;
    if (session) { this.stopSignal = true; session.status = 'done'; session.completedAt = new Date().toISOString(); }
  }
  pauseSession() { this.pauseSignal = true; }
  resumeSession() { this.pauseSignal = false; }
  getSession(id?: string): OrchestratorSession | null { return id ? this.sessions.get(id) || null : this.activeSession; }

  onEvent(type: string, handler: EventHandler) { return this.eventBus.subscribe(type, handler); }
  getEventLog(limit = 100) { return this.eventBus.getLog(limit); }
  getSharedState(key: string) { return this.sharedState.get(key); }

  // ── Pattern Inference ───────────────────────────────────────────────────

  inferPattern(mode: SessionMode): CoordinationPattern {
    switch (mode) {
      case SessionMode.SWARM_CODING: return 'orchestrator-subagent';
      case SessionMode.SWARM: return 'agent-teams';
      case SessionMode.INSPECTOR: return 'generator-verifier';
      case SessionMode.GOVERNMENT: return 'orchestrator-subagent';
      case SessionMode.RESEARCH: return 'orchestrator-subagent';
      case SessionMode.PREDICTION: return 'generator-verifier';
      case SessionMode.PROPOSAL: return 'shared-state';
      case SessionMode.DELIBERATION: return 'shared-state';
      case SessionMode.INQUIRY: return 'message-bus';
      default: return 'shared-state';
    }
  }

  // ── Dynamic Councilor Selection ────────────────────────────────────────

  selectCouncilorsForTopic(allCouncilors: BotConfig[], topic: string, mode: SessionMode): BotConfig[] {
    const topicLower = topic.toLowerCase();
    const enabled = allCouncilors.filter(b => b.enabled && b.role !== 'speaker');

    const scored = enabled.map(bot => {
      let score = 0;
      const botLower = (bot.name + ' ' + (bot.persona || '') + ' ' + bot.role).toLowerCase();
      if (bot.role === 'specialist') score += 20;
      if (bot.role === 'moderator') score += 10;
      for (const [category, keywords] of Object.entries(TOPIC_KEYWORDS)) {
        if (keywords.some(k => topicLower.includes(k) && botLower.includes(k))) {
          score += 15;
          if (bot.persona?.toLowerCase().includes(category)) score += 10;
        }
      }
      const preferred = MODE_SPECIALISTS[mode] || [];
      if (preferred.some(r => bot.role === r || bot.name.toLowerCase().includes(r))) score += 25;
      return { bot, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const teamSize = TEAM_SIZES[mode] ?? 4;
    let selected = scored.slice(0, teamSize).map(s => s.bot);

    // Ensure role diversity
    const roles = new Set(selected.map(b => b.role));
    if (roles.size < 3 && enabled.length > 3) {
      const missing = enabled.filter(b => !roles.has(b.role) && !selected.includes(b));
      if (missing.length > 0) selected.push(missing[0]);
    }

    this.eventBus.emit({
      type: 'councilor', source: 'orchestrator',
      data: { topic, selected: selected.map(b => ({ id: b.id, name: b.name, score: scored.find(s => s.bot.id === b.id)?.score || 0 })) },
      timestamp: new Date().toISOString(),
    });
    return selected;
  }

  // ── Task Decomposition ──────────────────────────────────────────────────

  decomposeTask(topic: string, mode: SessionMode, councilors: BotConfig[]): OrchestratorTask[] {
    const tasks: OrchestratorTask[] = [];

    switch (mode) {
      case SessionMode.SWARM_CODING: {
        tasks.push({ id: `arch-${Date.now()}`, description: `Architect the ${topic} system`, status: 'pending', attempts: 0, maxAttempts: 2 });
        councilors.slice(0, 3).forEach((c, i) => tasks.push({ id: `dev-${Date.now()}-${i}`, description: `Implement component ${i + 1} of ${topic}`, assignedCouncilor: c, status: 'pending', attempts: 0, maxAttempts: 2 }));
        tasks.push({ id: `int-${Date.now()}`, description: `Integrate and review ${topic}`, status: 'pending', attempts: 0, maxAttempts: 2 });
        break;
      }
      case SessionMode.SWARM: {
        tasks.push({ id: `swarm-plan-${Date.now()}`, description: `Decompose ${topic} into sub-tasks`, status: 'pending', attempts: 0, maxAttempts: 2 });
        councilors.forEach((c, i) => tasks.push({ id: `swarm-${Date.now()}-${i}`, description: `Execute sub-task ${i + 1} for ${topic}`, assignedCouncilor: c, status: 'pending', attempts: 0, maxAttempts: 2 }));
        tasks.push({ id: `swarm-aggr-${Date.now()}`, description: `Aggregate swarm results for ${topic}`, status: 'pending', attempts: 0, maxAttempts: 2 });
        break;
      }
      case SessionMode.GOVERNMENT: {
        ['First Reading', 'Committee Deliberation', 'Second Reading', 'Final Vote', 'Enactment'].forEach((phase, i) => {
          tasks.push({ id: `gov-${Date.now()}-${i}`, description: `${phase} of ${topic}`, status: 'pending', attempts: 0, maxAttempts: 2 });
        });
        break;
      }
      case SessionMode.INSPECTOR: {
        tasks.push({ id: `insp-plan-${Date.now()}`, description: `Plan inspection angles for ${topic}`, status: 'pending', attempts: 0, maxAttempts: 2 });
        councilors.forEach((c, i) => tasks.push({ id: `insp-${Date.now()}-${i}`, description: `Inspect ${topic} — ${c.name}`, assignedCouncilor: c, status: 'pending', attempts: 0, maxAttempts: 2 }));
        tasks.push({ id: `insp-synth-${Date.now()}`, description: `Synthesize inspection dossier for ${topic}`, status: 'pending', attempts: 0, maxAttempts: 2 });
        break;
      }
      case SessionMode.RESEARCH: {
        ['Breadth Research', 'Gap Analysis', 'Deep Drill-Down', 'Final Research Dossier'].forEach((phase, i) => {
          tasks.push({ id: `res-${Date.now()}-${i}`, description: `${phase} for ${topic}`, status: 'pending', attempts: 0, maxAttempts: 2 });
        });
        break;
      }
      case SessionMode.PREDICTION: {
        tasks.push({ id: `pred-open-${Date.now()}`, description: `Open forecasting session for ${topic}`, status: 'pending', attempts: 0, maxAttempts: 2 });
        councilors.forEach((c, i) => tasks.push({ id: `pred-${Date.now()}-${i}`, description: `Superforecast for ${topic}`, assignedCouncilor: c, status: 'pending', attempts: 0, maxAttempts: 2 }));
        tasks.push({ id: `pred-synth-${Date.now()}`, description: `Synthesize final forecast for ${topic}`, status: 'pending', attempts: 0, maxAttempts: 2 });
        break;
      }
      default: {
        tasks.push({ id: `open-${Date.now()}`, description: `Opening statement on ${topic}`, status: 'pending', attempts: 0, maxAttempts: 2 });
        councilors.forEach((c, i) => tasks.push({ id: `deb-${Date.now()}-${i}`, description: `Debate ${topic}`, assignedCouncilor: c, status: 'pending', attempts: 0, maxAttempts: 2 }));
        tasks.push({ id: `close-${Date.now()}`, description: `Closing summary of ${topic}`, status: 'pending', attempts: 0, maxAttempts: 2 });
      }
    }

    this.sharedState.set(`session:${this.activeSession?.id}:tasks`, tasks);
    return tasks;
  }

  // ── Quality Gate Check ─────────────────────────────────────────────────

  checkQualityGate(response: string, gateType: keyof typeof DEFAULT_QUALITY_GATES = 'general'): { passed: boolean; issues: string[]; score: number } {
    const criteria = DEFAULT_QUALITY_GATES[gateType];
    const issues: string[] = [];
    let score = 100;

    if (response.length < criteria.minLength) { issues.push(`Too short (${response.length} < ${criteria.minLength})`); score -= 20; }
    for (const tag of criteria.requiredTags) { if (!response.includes(tag)) { issues.push(`Missing: ${tag}`); score -= 15; } }
    for (const pattern of criteria.forbiddenPatterns) { if (response.toLowerCase().includes(pattern.toLowerCase())) { issues.push(`Forbidden: ${pattern}`); score -= 25; } }
    const words = response.toLowerCase().split(/\s+/); const unique = new Set(words);
    if (unique.size < words.length * 0.3) { issues.push('High repetition'); score -= 30; }

    this.eventBus.emit({ type: 'quality', source: 'orchestrator', data: { gateType, passed: score >= 60, issues, score }, timestamp: new Date().toISOString() });
    return { passed: score >= 60, issues, score };
  }

  private getGateType(mode: SessionMode): keyof typeof DEFAULT_QUALITY_GATES {
    switch (mode) {
      case SessionMode.PROPOSAL: return 'vote';
      case SessionMode.PREDICTION: return 'forecast';
      case SessionMode.INSPECTOR: return 'inspection';
      case SessionMode.SWARM_CODING: return 'code';
      default: return 'general';
    }
  }

  private getTaskInstruction(task: OrchestratorTask, mode: SessionMode, injectTopic: (t: string) => string): string {
    const base = injectTopic('{{TOPIC}}');
    switch (mode) {
      case SessionMode.GOVERNMENT: {
        if (task.description.includes('First Reading')) return `${base} — PHASE: First Reading. Present the proposal formally.`;
        if (task.description.includes('Committee')) return `${base} — PHASE: Committee Deliberation. Analyze the proposal in detail.`;
        if (task.description.includes('Second Reading')) return `${base} — PHASE: Second Reading. Revise based on committee feedback.`;
        if (task.description.includes('Vote')) return `${base} — PHASE: Final Vote. Cast your vote with XML vote block.`;
        return `${base} — PHASE: Enactment. Finalize the decree.`;
      }
      case SessionMode.INSPECTOR: {
        if (task.description.includes('Plan')) return `${base} — PHASE: Inspection Plan. Assign angles to each inspector.`;
        if (task.description.includes('Synthesize')) return `${base} — PHASE: Dossier Synthesis. Create the final <inspection_dossier>.`;
        return `${base} — PHASE: Inspection. Produce structured <inspection_report>.`;
      }
      case SessionMode.PREDICTION: {
        if (task.description.includes('Open')) return `${base} — PHASE: Forecast Opening.`;
        if (task.description.includes('Synthesize')) return `${base} — PHASE: Final Forecast. Produce <forecast> XML.`;
        return `${base} — PHASE: Superforecast. Produce probability and reasoning.`;
      }
      case SessionMode.SWARM_CODING: {
        if (task.description.includes('Architect')) return `${base} — PHASE: System Architecture.`;
        if (task.description.includes('Integrate')) return `${base} — PHASE: Integration.`;
        return `${base} — PHASE: Implementation.`;
      }
      default: return base;
    }
  }

  // ── Meta-Agent Cycle ────────────────────────────────────────────────────

  async runMetaCycle(topic: string, phase: MetaPhase, history: Message[], speaker: BotConfig | undefined, settings: Settings): Promise<{ result: string; nextPhase: MetaPhase }> {
    if (!this.activeSession || !this.activeSession.config.enableMetaAgent || !speaker) return { result: '', nextPhase: 'execute' };

    this.activeSession.phase = phase;
    this.sharedState.set(`session:${this.activeSession.id}:phase`, phase);
    this.eventBus.emit({ type: 'phase', source: 'meta-agent', data: { phase }, timestamp: new Date().toISOString() });

    const metaInstructions: Record<MetaPhase, string> = {
      plan: `You are the Meta-Agent PLANNER. For topic "${topic}": determine best approach, councilor order, key questions, risks. Reply with <plan> XML.`,
      execute: `You are the Meta-Agent EXECUTOR. Supervise the deliberation. Ensure councilors stay on topic, challenge weak arguments. Reply with <execution_report>.`,
      critic: `You are the Meta-Agent CRITIC. Review deliberation so far: strongest/weakest arguments, missing perspectives, logical fallacies. Reply with <critique>.`,
      heal: `You are the Meta-Agent HEALER. Suggest course corrections based on critique. Reply with <healing_plan>.`,
      learn: `You are the Meta-Agent LEARNER. Log key learnings from this session. Reply with <learnings> of 2-3 bullet points.`,
    };

    try {
      const result = await getBotResponse(speaker, history, metaInstructions[phase], settings);

      if (phase === 'learn' && this.activeSession.config.enableSharedMemory) {
        const learnMatch = result.match(/<learnings>([\s\S]*?)<\/learnings>/i);
        if (learnMatch) {
          learnMatch[1].split(/•|--|\n/).filter(l => l.trim()).forEach(l => {
            const t = l.trim();
            if (t) { this.activeSession!.learnings.push(t); this.activeSession!.sharedMemory += `\n- ${t}`; }
          });
        }
      }

      const phases: MetaPhase[] = ['plan', 'execute', 'critic', 'heal', 'learn'];
      const nextPhase = phases[Math.min(phases.indexOf(phase) + 1, phases.length - 1)];
      this.activeSession.metaCycleCount++;
      return { result, nextPhase };
    } catch (e) {
      console.error('Meta-agent error:', e);
      return { result: '', nextPhase: 'execute' };
    }
  }

  // ── Orchestrator-Subagent Pattern ──────────────────────────────────────

  async runOrchestratorSubagent(
    topic: string,
    councilors: BotConfig[],
    speaker: BotConfig | undefined,
    history: Message[],
    settings: Settings,
    mode: SessionMode,
    injectTopic: (t: string) => string,
    processBotTurn: (bot: BotConfig, history: Message[], prompt: string, roleLabel?: string) => Promise<string>
  ): Promise<Message[]> {
    const results: Message[] = [];
    const tasks = this.decomposeTask(topic, mode, councilors);
    const { maxConcurrency } = this.activeSession!.config;

    // Plan phase
    const { result: planResult } = await this.runMetaCycle(topic, 'plan', history, speaker, settings);
    if (planResult) results.push({ id: `meta-plan-${Date.now()}`, author: 'Meta-Agent', authorType: AuthorType.SYSTEM, content: `📋 PLANNER: ${planResult}` } as Message);

    let taskQueue = [...tasks];
    while (taskQueue.length > 0) {
      if (this.stopSignal) break;
      while (this.pauseSignal) await new Promise(r => setTimeout(r, 500));

      const batch = taskQueue.splice(0, maxConcurrency);
      const batchResults = await Promise.all(batch.map(async (task) => {
        await this.runMetaCycle(topic, 'execute', history, speaker, settings);
        const assignedCouncilor = task.assignedCouncilor || councilors[tasks.indexOf(task) % councilors.length];
        if (!assignedCouncilor) return null;

        const taskInstruction = this.getTaskInstruction(task, mode, injectTopic);
        try {
          const response = await processBotTurn(assignedCouncilor, history, `${taskInstruction}\n\nPersona: ${assignedCouncilor.persona}`, task.description.split(' ')[0].toUpperCase());
          task.status = 'done';
          task.result = response;

          const quality = this.checkQualityGate(response, this.getGateType(mode));
          if (!quality.passed && task.attempts < task.maxAttempts) { task.attempts++; task.status = 'pending'; taskQueue.unshift(task); }

          this.eventBus.emit({ type: 'task', source: 'orchestrator', data: { taskId: task.id, status: task.status, quality: quality.score }, timestamp: new Date().toISOString() });

          return { task, councilor: assignedCouncilor, response, quality };
        } catch (e) { task.status = 'failed'; task.result = String(e); return null; }
      }));

      for (const br of batchResults) {
        if (br?.response) {
          const msg: Message = { id: `orch-${Date.now()}`, author: br.councilor.name, authorType: br.councilor.authorType, content: br.response, roleLabel: br.task.description.split(' ')[0].toUpperCase(), color: br.councilor.color };
          results.push(msg);
          history.push(msg);
          if (this.activeSession?.config.enableSharedMemory) this.sharedState.append(`session:${this.activeSession.id}:results`, { councilor: br.councilor.name, quality: br.quality.score });
        }
      }

      const { result: critResult } = await this.runMetaCycle(topic, 'critic', history, speaker, settings);
      if (critResult) results.push({ id: `meta-critic-${Date.now()}`, author: 'Meta-Agent', authorType: AuthorType.SYSTEM, content: `🔍 CRITIC: ${critResult}` } as Message);

      const { result: healResult } = await this.runMetaCycle(topic, 'heal', history, speaker, settings);
      if (healResult) results.push({ id: `meta-heal-${Date.now()}`, author: 'Meta-Agent', authorType: AuthorType.SYSTEM, content: `🩹 HEALER: ${healResult}` } as Message);
    }

    const { result: learnResult } = await this.runMetaCycle(topic, 'learn', history, speaker, settings);
    if (learnResult) {
      results.push({ id: `meta-learn-${Date.now()}`, author: 'Meta-Agent', authorType: AuthorType.SYSTEM, content: `📚 LEARNER: ${learnResult}` } as Message);
      if (this.activeSession?.config.enableSharedMemory) saveMemory({ id: `orch-${Date.now()}`, topic, content: learnResult, date: new Date().toISOString(), tags: ['orchestration', mode] });
    }

    this.activeSession.status = 'done';
    this.activeSession.completedAt = new Date().toISOString();
    return results;
  }

  // ── Generator-Verifier Pattern ──────────────────────────────────────────

  async runGeneratorVerifier(
    topic: string,
    councilors: BotConfig[],
    settings: Settings,
    mode: SessionMode,
    injectTopic: (t: string) => string,
    processBotTurn: (bot: BotConfig, history: Message[], prompt: string, roleLabel?: string) => Promise<string>
  ): Promise<Message[]> {
    const results: Message[] = [];

    for (const councilor of councilors) {
      if (this.stopSignal) break;
      while (this.pauseSignal) await new Promise(r => setTimeout(r, 500));

      const taskInstruction = this.getTaskInstruction({ id: councilor.id, description: `Analyze ${topic}`, status: 'pending', attempts: 0, maxAttempts: 2 }, mode, injectTopic);
      let attempt = 0, passed = false;

      while (attempt < 2 && !passed) {
        attempt++;
        const generatorResult = await processBotTurn(councilor, [], `${taskInstruction}\n\nPersona: ${councilor.persona}`, 'GENERATOR');
        const quality = this.checkQualityGate(generatorResult, this.getGateType(mode));

        if (quality.passed) {
          results.push({ id: `gv-${councilor.id}-${Date.now()}`, author: councilor.name, authorType: councilor.authorType, content: generatorResult, color: councilor.color, roleLabel: 'GENERATOR' } as Message);
          if (this.activeSession?.config.enableSharedMemory) this.sharedState.append(`session:${this.activeSession.id}:verified`, { councilor: councilor.name, quality: quality.score });
          passed = true;
        } else {
          this.eventBus.emit({ type: 'quality', source: 'orchestrator', data: { councilor: councilor.name, attempt, issues: quality.issues }, timestamp: new Date().toISOString() });
          if (attempt < 2) results.push({ id: `gv-retry-${councilor.id}-${Date.now()}`, author: 'Verifier', authorType: AuthorType.SYSTEM, content: `⚠️ Quality issues: ${quality.issues.join(', ')}. Please revise.`, color: 'from-orange-500 to-red-500' } as Message);
        }
      }
    }
    return results;
  }

  // ── Agent-Teams Pattern ─────────────────────────────────────────────────

  async runAgentTeams(
    topic: string,
    councilors: BotConfig[],
    settings: Settings,
    mode: SessionMode,
    injectTopic: (t: string) => string,
    processBotTurn: (bot: BotConfig, history: Message[], prompt: string, roleLabel?: string) => Promise<string>
  ): Promise<Message[]> {
    const results = await Promise.all(councilors.map(async (councilor) => {
      if (this.stopSignal) return null;
      while (this.pauseSignal) await new Promise(r => setTimeout(r, 500));
      const taskInstruction = this.getTaskInstruction({ id: councilor.id, description: `Analyze ${topic}`, status: 'pending', attempts: 0, maxAttempts: 2 }, mode, injectTopic);
      const response = await processBotTurn(councilor, [], `${taskInstruction}\n\nPersona: ${councilor.persona}`, 'AGENT');
      return { id: `team-${councilor.id}-${Date.now()}`, author: councilor.name, authorType: councilor.authorType, content: response, color: councilor.color, roleLabel: 'AGENT' } as Message;
    }));
    return results.filter(Boolean) as Message[];
  }

  // ── Pattern Runner (dispatcher) ─────────────────────────────────────────

  async runByPattern(
    topic: string,
    councilors: BotConfig[],
    speaker: BotConfig | undefined,
    history: Message[],
    settings: Settings,
    mode: SessionMode,
    injectTopic: (t: string) => string,
    processBotTurn: (bot: BotConfig, history: Message[], prompt: string, roleLabel?: string) => Promise<string>
  ): Promise<Message[]> {
    const pattern = this.activeSession?.pattern || this.inferPattern(mode);
    switch (pattern) {
      case 'orchestrator-subagent': return this.runOrchestratorSubagent(topic, councilors, speaker, history, settings, mode, injectTopic, processBotTurn);
      case 'generator-verifier': return this.runGeneratorVerifier(topic, councilors, settings, mode, injectTopic, processBotTurn);
      case 'agent-teams': return this.runAgentTeams(topic, councilors, settings, mode, injectTopic, processBotTurn);
      default: {
        // Shared-state / message-bus: run as sequential with shared memory
        const msgs: Message[] = [];
        for (const c of councilors) {
          if (this.stopSignal) break;
          while (this.pauseSignal) await new Promise(r => setTimeout(r, 500));
          const r = await processBotTurn(c, history, injectTopic('{{TOPIC}}'), c.role);
          const msg: Message = { id: `ss-${Date.now()}`, author: c.name, authorType: c.authorType, content: r, color: c.color };
          msgs.push(msg); history.push(msg);
          if (this.activeSession?.config.enableSharedMemory) this.sharedState.append(`session:${this.activeSession.id}:results`, { councilor: c.name });
          msgs.push(msg);
        }
        this.activeSession!.status = 'done';
        this.activeSession!.completedAt = new Date().toISOString();
        return msgs;
      }
    }
  }

  // ── Orchestration Dashboard ─────────────────────────────────────────────

  getDashboard(): {
    activeSession: OrchestratorSession | null;
    eventLogCount: number;
    sharedStateKeys: string[];
    patterns: CoordinationPattern[];
  } {
    return {
      activeSession: this.activeSession,
      eventLogCount: this.eventBus.getLog().length,
      sharedStateKeys: Object.keys(this.sharedState.getAll()),
      patterns: ['orchestrator-subagent', 'agent-teams', 'generator-verifier', 'message-bus', 'shared-state'],
    };
  }
}

export default CouncilOrchestrationService;
