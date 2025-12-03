import {
  BotConfig,
  Message,
  SessionMode,
  SessionStatus,
  VoteData,
  PredictionData,
  CodeFile,
  Attachment,
  CouncilSettings,
  AuthorType
} from '../types/index.js';
import { COUNCIL_SYSTEM_INSTRUCTION, getBotsWithCustomConfigs } from '../types/constants.js';
import { AIService } from './aiService.js';
import { sessionService } from './sessionService.js';
import { searchMemories, searchDocuments, saveMemory } from './knowledgeService.js';
import { protectionService } from './protectionService.js';
import { predictionTrackingService } from './predictionTrackingService.js';
import { logger } from './logger.js';
import { councilEventBus } from './councilEventBus.js';

import { registerAgentTools } from '../tools/agentTools/index.js';
import { toolRegistry } from '../tools/agentTools/registry.js';

export class CouncilOrchestrator {
  public aiService: AIService;
  private controlSignals: Map<string, { stop: boolean; pause: boolean }> = new Map();

  constructor(aiService: AIService) {
    this.aiService = aiService;
    registerAgentTools();
  }

  /**
   * Set the current session context for cost tracking
   */
  setSessionContext(sessionId: string): void {
    this.aiService.setSessionContext(sessionId);
  }

  async runCouncilSession(
    sessionId: string,
    topic: string,
    mode: SessionMode,
    settings: CouncilSettings,
    context?: string,
    userPrompt?: string,
    attachments?: Attachment[]
  ): Promise<{
    messages: Message[];
    voteData?: VoteData;
    predictionData?: PredictionData;
    codeFiles?: CodeFile[];
    summary: string;
    consensusLabel?: string;
  }> {
    // Start protection tracking for this session
    protectionService.startSession(sessionId);

    // Set session context for cost tracking
    this.setSessionContext(sessionId);

    const controlSignal = { stop: false, pause: false };
    this.controlSignals.set(sessionId, controlSignal);

    // Enhanced logging
    const enabledBotCount = settings.bots.filter(b => b.enabled).length;

    logger.session(sessionId, 'started', 'started', {
      mode,
      topic,
      botCount: enabledBotCount,
      verbose: settings.verboseLogging
    });

    console.error(`[Orchestrator] Starting council session ${sessionId}`);
    console.error(`[Orchestrator] Mode: ${mode}, Topic: "${topic}"`);
    console.error(`[Orchestrator] Enabled bots: ${enabledBotCount}/${settings.bots.length}`);
    console.error(`[Orchestrator] Verbose logging: ${settings.verboseLogging ? 'enabled' : 'disabled'}`);
    console.error(`[Orchestrator] Progress delay: ${settings.progressDelay || 0}ms`);

    if (settings.verboseLogging) {
      console.error(`[Orchestrator] Economy mode: ${settings.economyMode ? 'enabled' : 'disabled'}`);
      console.error(`[Orchestrator] Max concurrent requests: ${settings.maxConcurrentRequests || 2}`);
    }

    sessionService.updateSessionStatus(sessionId, SessionStatus.OPENING);

    let sessionHistory: Message[] = [...sessionService.getSession(sessionId)!.messages];

    // Estimate tokens for the initial prompt
    const estimatedInitialTokens = this.estimateTokenCount(topic + (context || ''));
    const enabledBots = settings.bots.filter(b => b.enabled);

    const speaker = enabledBots.find(b => b.role === 'speaker');
    const moderator = enabledBots.find(b => b.role === 'moderator');
    // Treat any enabled bot that isn't speaker or moderator as a councilor (including specialists)
    const initialCouncilors = enabledBots.filter(b => b.role !== 'speaker' && b.role !== 'moderator');

    if (!speaker && initialCouncilors.length === 0) {
      const sysMessage = this.createSystemMessage('No Councilors present.');
      sessionService.addMessage(sessionId, sysMessage);
      sessionService.updateSessionStatus(sessionId, SessionStatus.ADJOURNED);
      return this.buildResult(sessionId);
    }

    try {
      const precedents = await searchMemories(topic);
      const docSnippets = await searchDocuments(settings.knowledge?.documents || [], topic);
      const contextBlock = [
        precedents.length > 0 ? `\n\n[RELEVANT PRECEDENTS]:\n${precedents.map(p => `- ${p.topic}: ${p.content.substring(0, 100)}...`).join('\n')}` : '',
        docSnippets.length > 0 ? `\n\n[KNOWLEDGE BASE]:\n${docSnippets.join('\n')}` : ''
      ].join('');

      const customDirective = settings.customDirective || "";
      const atmospherePrompt = "TONE: Professional, Objective, Legislative.";
      const injectTopic = (template: string) =>
        (atmospherePrompt + "\n\n" + (customDirective ? customDirective + "\n\n" : "") + template.replace(/{{TOPIC}}/g, topic)) + contextBlock;

      const maxConcurrency = settings.maxConcurrentRequests || 2;

      if (mode === SessionMode.PREDICTION) {
        await this.runPredictionMode(sessionId, topic, speaker, initialCouncilors, sessionHistory, injectTopic, maxConcurrency, controlSignal);
      } else if (mode === SessionMode.SWARM_CODING) {
        await this.runSwarmCodingMode(sessionId, topic, speaker, enabledBots, sessionHistory, injectTopic, maxConcurrency, controlSignal);
      } else if (mode === SessionMode.SWARM) {
        await this.runSwarmMode(sessionId, topic, speaker, enabledBots, sessionHistory, injectTopic, maxConcurrency, controlSignal);
      } else if (mode === SessionMode.RESEARCH) {
        await this.runResearchMode(sessionId, topic, speaker, initialCouncilors, sessionHistory, injectTopic, maxConcurrency, controlSignal);
      } else if (mode === SessionMode.INQUIRY || mode === SessionMode.DELIBERATION) {
        await this.runInquiryOrDeliberationMode(sessionId, topic, mode, speaker, initialCouncilors, sessionHistory, injectTopic, maxConcurrency, controlSignal);
      } else {
        await this.runProposalMode(sessionId, topic, speaker, moderator, initialCouncilors, sessionHistory, injectTopic, maxConcurrency, controlSignal, settings);
      }

      sessionService.updateSessionStatus(sessionId, SessionStatus.ADJOURNED);

      // End protection tracking for this session
      protectionService.endSession(sessionId);

      logger.session(sessionId, 'completed', 'completed', {
        mode,
        topic
      });

      return this.buildResult(sessionId);

    } catch (error: any) {
      if (error.message !== "SESSION_STOPPED") {
        const errorMsg = this.createSystemMessage(`ERROR: ${error.message}`);
        sessionService.addMessage(sessionId, errorMsg);
      } else {
        const haltedMsg = this.createSystemMessage('HALTED.');
        sessionService.addMessage(sessionId, haltedMsg);
      }
      sessionService.updateSessionStatus(sessionId, SessionStatus.ADJOURNED);

      // End protection tracking even on error
      protectionService.endSession(sessionId);

      logger.session(sessionId, 'failed', 'error', {
        error: error.message,
        mode,
        topic
      });

      return this.buildResult(sessionId);
    }
  }

  private async runPredictionMode(
    sessionId: string,
    topic: string,
    speaker: BotConfig | undefined,
    councilors: BotConfig[],
    history: Message[],
    injectTopic: (template: string) => string,
    maxConcurrency: number,
    controlSignal: { stop: boolean; pause: boolean }
  ) {
    if (speaker) {
      sessionService.updateSessionStatus(sessionId, SessionStatus.OPENING);
      const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PREDICTION.SPEAKER_OPENING)} Persona: ${speaker.persona}`;
      const res = await this.processBotTurn(sessionId, speaker, history, prompt, "CHIEF FORECASTER", controlSignal);
      history.push(this.createMessage(speaker.name, speaker.authorType, res, speaker.color, "CHIEF FORECASTER"));
    }

    sessionService.updateSessionStatus(sessionId, SessionStatus.DEBATING);
    const councilorResults = await this.runBatchWithConcurrency(
      councilors.slice(0, 3),
      async (bot) => {
        const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PREDICTION.COUNCILOR)} Persona: ${bot.persona}`;
        return await this.processBotTurn(sessionId, bot, history, prompt, "SUPERFORECASTER", controlSignal);
      },
      maxConcurrency,
      controlSignal
    );

    councilorResults.forEach((result, idx) => {
      const bot = councilors[idx];
      history.push(this.createMessage(bot.name, bot.authorType, result, bot.color, "SUPERFORECASTER"));
    });

    sessionService.updateSessionStatus(sessionId, SessionStatus.RESOLVING);
    if (speaker) {
      const finalPrompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PREDICTION.SPEAKER_PREDICTION)} Persona: ${speaker.persona}`;
      const finalRes = await this.processBotTurn(sessionId, speaker, history, finalPrompt, "FINAL PREDICTION", controlSignal);

      const predictionData = this.parsePredictionFromResponse(finalRes);
      if (predictionData) {
        sessionService.setPredictionData(sessionId, predictionData);

        // Track prediction for calibration
        const predictionId = await predictionTrackingService.storePrediction(
          sessionId,
          predictionData,
          speaker.id,
          speaker.name
        );

        console.error(`[PredictionTracking] Stored prediction ${predictionId} for session ${sessionId}`);
        console.error(`[PredictionTracking] Prediction: ${predictionData.confidence}% confidence`);
      }

      history.push(this.createMessage(speaker.name, speaker.authorType, finalRes, speaker.color, "FINAL PREDICTION"));
    }
  }

  private async runProposalMode(
    sessionId: string,
    topic: string,
    speaker: BotConfig | undefined,
    moderator: BotConfig | undefined,
    councilors: BotConfig[],
    history: Message[],
    injectTopic: (template: string) => string,
    maxConcurrency: number,
    controlSignal: { stop: boolean; pause: boolean },
    settings: CouncilSettings
  ) {
    if (speaker) {
      const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.SPEAKER_OPENING)} Persona: ${speaker.persona}`;
      const res = await this.processBotTurn(sessionId, speaker, history, prompt, "OPENING BRIEF", controlSignal);
      history.push(this.createMessage(speaker.name, speaker.authorType, res, speaker.color, "OPENING BRIEF"));
    }

    sessionService.updateSessionStatus(sessionId, SessionStatus.DEBATING);

    if (settings.economyMode && speaker) {
      const debatePrompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.ECONOMY_DEBATE).replace('{{COUNCILORS_LIST}}', councilors.map(b => `- ${b.name}: ${b.persona}`).join('\n'))} Persona: ${speaker.persona}`;
      const rawTranscript = await this.processBotTurn(sessionId, speaker, history, debatePrompt, "COUNCIL SIMULATION", controlSignal);

      history.push(this.createMessage(speaker.name, speaker.authorType, rawTranscript, speaker.color, "Councilor (Simulated)"));

      const turnRegex = /(?:\*\*|)?([^*:]+)(?:\*\*|)?:\s*([\s\S]*?)(?=(?:\*\*|)?([^*:]+)(?:\*\*|)?:\s*|$)/g;
      const turns = [...rawTranscript.matchAll(turnRegex)];

      turns.forEach((match) => {
        const name = match[1].trim();
        let content = match[2].trim();
        let thinking = undefined;

        const tMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/);
        if (tMatch) {
          thinking = tMatch[1].trim();
          content = content.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();
        }

        const bot = councilors.find(b => b.name === name) || { color: 'from-gray-500 to-gray-600', role: 'councilor' } as BotConfig;
        sessionService.addMessage(sessionId, {
          author: name,
          authorType: AuthorType.GEMINI,
          content: content,
          thinking: thinking,
          color: bot.color,
          roleLabel: "Councilor (Simulated)"
        });
      });
    } else {
      // Full sequential debate mode
      let debateQueue = [...councilors];
      let turnsProcessed = 0;
      const maxTurns = councilors.length * 2 + 1;
      let rebuttalChainLength = 0;
      let lastSpeakerId = "";

      while (debateQueue.length > 0 && turnsProcessed < maxTurns) {
        this.checkControlSignal(controlSignal);

        const councilor = debateQueue.shift();
        if (!councilor) break;

        if (councilor.id === lastSpeakerId && debateQueue.length > 0) {
          debateQueue.push(councilor);
          continue;
        }

        let prompt = turnsProcessed < councilors.length
          ? `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.COUNCILOR_OPENING)} Persona: ${councilor.persona}`
          : `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.COUNCILOR_REBUTTAL)} Persona: ${councilor.persona}`;

        if (rebuttalChainLength >= 3 && moderator) {
          const modMsg = this.createSystemMessage("*Interjecting to break repetitive argument loop...*");
          sessionService.addMessage(sessionId, modMsg);
          const modRes = await this.processBotTurn(sessionId, moderator, history, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.MODERATOR_INTERVENTION)} Persona: ${moderator.persona}`, "MODERATOR", controlSignal);
          history.push(this.createMessage(moderator.name, moderator.authorType, modRes, moderator.color, "MODERATOR"));
          rebuttalChainLength = 0;
          debateQueue = debateQueue.sort(() => Math.random() - 0.5);
        }

        const res = await this.processBotTurn(sessionId, councilor, history, prompt, councilor.role, controlSignal);
        lastSpeakerId = councilor.id;

        if (!res.includes('[PASS]')) {
          history.push(this.createMessage(councilor.name, councilor.authorType, res, councilor.color, councilor.role));
          turnsProcessed++;

          const challengeMatch = res.match(/\[CHALLENGE:\s*([^\]]+)\]/i);
          if (challengeMatch) {
            const challengedName = challengeMatch[1].toLowerCase();
            const session = sessionService.getSession(sessionId)!;
            const challengedBot = session.settings.bots.find(b => b.name.toLowerCase().includes(challengedName));

            if (challengedBot && challengedBot.id !== councilor.id) {
              debateQueue = debateQueue.filter(b => b.id !== challengedBot.id);
              debateQueue.unshift(challengedBot);
              rebuttalChainLength++;
            } else {
              rebuttalChainLength = 0;
            }
          } else {
            rebuttalChainLength = 0;
          }
        }
      }
    }

    sessionService.updateSessionStatus(sessionId, SessionStatus.VOTING);
    const voteMsg = this.createSystemMessage("DEBATE CLOSED. PROCEEDING TO ROLL CALL VOTE.");
    sessionService.addMessage(sessionId, voteMsg);

    if (speaker) {
      const votePrompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.ECONOMY_VOTE_BATCH).replace('{{COUNCILORS_LIST}}', councilors.map(b => `- ${b.name}: ${b.persona}`).join('\n'))} Persona: ${speaker.persona}`;
      const voteRes = await this.processBotTurn(sessionId, speaker, history, votePrompt, "VOTE TALLY", controlSignal);

      const voteData = this.parseVotesFromResponse(voteRes, topic, councilors);
      sessionService.setVoteData(sessionId, voteData);

      sessionService.updateSessionStatus(sessionId, SessionStatus.RESOLVING);
      const finalPrompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.SPEAKER_POST_VOTE)} VOTE OUTCOME: ${voteData.result} (${voteData.yeas} YEA, ${voteData.nays} NAY). Persona: ${speaker.persona}`;
      const finalRes = await this.processBotTurn(sessionId, speaker, history, finalPrompt, "FINAL DECREE", controlSignal);

      if (finalRes.includes('PASSED') || voteData.result === 'PASSED') {
        await saveMemory({
          id: `mem-${Date.now()}`,
          topic,
          content: finalRes,
          date: new Date().toISOString(),
          tags: [SessionMode.PROPOSAL]
        });
      }
    }
  }

  private async runSwarmCodingMode(
    sessionId: string,
    topic: string,
    speaker: BotConfig | undefined,
    enabledBots: BotConfig[],
    history: Message[],
    injectTopic: (template: string) => string,
    maxConcurrency: number,
    controlSignal: { stop: boolean; pause: boolean }
  ) {
    if (!speaker) return;

    const context = history.length > 0 ? history.map(m => `${m.author}: ${m.content}`).join('\n\n') : '';

    // Phase 1: Requirements Analysis
    sessionService.updateSessionStatus(sessionId, SessionStatus.OPENING);
    const reqMsg = this.createSystemMessage("PHASE 1: REQUIREMENTS ANALYSIS - Analyzing requirements...");
    sessionService.addMessage(sessionId, reqMsg);

    const reqPrompt = injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SWARM_CODING.REQUIREMENTS_ANALYST)
      .replace('{{CONTEXT}}', context || 'No previous context');
    const reqRes = await this.processBotTurn(sessionId, speaker, history, reqPrompt, "REQUIREMENTS ANALYST", controlSignal);
    history.push(this.createMessage(speaker.name, speaker.authorType, reqRes, speaker.color, "REQUIREMENTS ANALYST"));

    // Phase 2: Tech Stack Selection
    const techMsg = this.createSystemMessage("PHASE 2: TECH STACK SELECTION - Choosing technologies...");
    sessionService.addMessage(sessionId, techMsg);

    const techPrompt = injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SWARM_CODING.TECH_STACK_SELECTOR)
      .replace('{{CONTEXT}}', reqRes);
    const techRes = await this.processBotTurn(sessionId, speaker, history, techPrompt, "TECHNOLOGY ARCHITECT", controlSignal);
    history.push(this.createMessage(speaker.name, speaker.authorType, techRes, speaker.color, "TECHNOLOGY ARCHITECT"));

    // Phase 3: System Design
    const designMsg = this.createSystemMessage("PHASE 3: SYSTEM DESIGN - Creating architecture...");
    sessionService.addMessage(sessionId, designMsg);

    const designPrompt = injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SWARM_CODING.SYSTEM_DESIGNER)
      .replace('{{CONTEXT}}', `${reqRes}\n\n${techRes}`);
    const designRes = await this.processBotTurn(sessionId, speaker, history, designPrompt, "SYSTEM DESIGNER", controlSignal);
    history.push(this.createMessage(speaker.name, speaker.authorType, designRes, speaker.color, "SYSTEM DESIGNER"));

    // Phase 4: Task Planning
    const planMsg = this.createSystemMessage("PHASE 4: TASK PLANNING - Breaking down work...");
    sessionService.addMessage(sessionId, planMsg);

    const taskPrompt = injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SWARM_CODING.TASK_PLANNER)
      .replace('{{CONTEXT}}', `${reqRes}\n\n${techRes}\n\n${designRes}`);
    const taskRes = await this.processBotTurn(sessionId, speaker, history, taskPrompt, "PROJECT MANAGER", controlSignal);
    history.push(this.createMessage(speaker.name, speaker.authorType, taskRes, speaker.color, "PROJECT MANAGER"));

    // Parse file tasks from task plan
    const fileMatches = taskRes.matchAll(/<file name="(.*?)" role="(.*?)" description="(.*?)" complexity="(.*?)" \/>/g);
    const tasks: { file: string; role: string; desc: string; complexity: string }[] = [];
    for (const match of fileMatches) {
      tasks.push({ file: match[1], role: match[2], desc: match[3], complexity: match[4] });
    }

    if (tasks.length === 0) {
      const errorMsg = this.createSystemMessage("ERROR: No tasks identified. Using basic file structure.");
      sessionService.addMessage(sessionId, errorMsg);
      tasks.push({ file: "main.py", role: "Main Developer", desc: "Main application file", complexity: "M" });
    }

    // Phase 5: Development (Parallel Execution)
    sessionService.updateSessionStatus(sessionId, SessionStatus.DEBATING);
    const devMsg = this.createSystemMessage(`PHASE 5: DEVELOPMENT - Deploying ${tasks.length} developers...`);
    sessionService.addMessage(sessionId, devMsg);

    await this.runBatchWithConcurrency(tasks, async (task) => {
      // Find a suitable bot: prefer one with matching role, otherwise any councilor/specialist, fallback to speaker
      let assignedBot = enabledBots.find(b => b.role === task.role) ||
        enabledBots.find(b => b.role !== 'speaker' && b.role !== 'moderator') ||
        speaker!;
      const devPrompt = injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SWARM_CODING.DEV_AGENT)
        .replace('{{ROLE}}', task.role)
        .replace('{{FILE}}', task.file)
        .replace('{{CONTEXT}}', `${reqRes}\n\n${techRes}\n\n${designRes}`)
        .replace('{{TASK}}', task.desc);
      return await this.processBotTurn(sessionId, assignedBot, history, devPrompt, `${task.file} (DEV)`, controlSignal);
    }, maxConcurrency, controlSignal);

    // Phase 6: Code Review
    const reviewMsg = this.createSystemMessage("PHASE 6: CODE REVIEW - Reviewing code quality...");
    sessionService.addMessage(sessionId, reviewMsg);

    const reviewPrompt = injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SWARM_CODING.CODE_REVIEWER)
      .replace('{{CONTEXT}}', `${reqRes}\n\n${techRes}\n\n${designRes}`);
    const reviewRes = await this.processBotTurn(sessionId, speaker, history, reviewPrompt, "CODE REVIEWER", controlSignal);
    history.push(this.createMessage(speaker.name, speaker.authorType, reviewRes, speaker.color, "CODE REVIEWER"));

    // Phase 7: Test Generation
    const testMsg = this.createSystemMessage("PHASE 7: TEST GENERATION - Creating test suite...");
    sessionService.addMessage(sessionId, testMsg);

    const testPrompt = injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SWARM_CODING.TEST_GENERATOR)
      .replace('{{CONTEXT}}', `${reqRes}\n\n${techRes}\n\n${designRes}`);
    const testRes = await this.processBotTurn(sessionId, speaker, history, testPrompt, "QA ENGINEER", controlSignal);
    history.push(this.createMessage(speaker.name, speaker.authorType, testRes, speaker.color, "QA ENGINEER"));

    // Phase 8: Documentation
    const docMsg = this.createSystemMessage("PHASE 8: DOCUMENTATION - Writing docs...");
    sessionService.addMessage(sessionId, docMsg);

    const docPrompt = injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SWARM_CODING.DOCUMENTATION_WRITER)
      .replace('{{CONTEXT}}', `${reqRes}\n\n${techRes}\n\n${designRes}`);
    const docRes = await this.processBotTurn(sessionId, speaker, history, docPrompt, "TECHNICAL WRITER", controlSignal);
    history.push(this.createMessage(speaker.name, speaker.authorType, docRes, speaker.color, "TECHNICAL WRITER"));

    // Phase 9: DevOps Configuration
    const devopsMsg = this.createSystemMessage("PHASE 9: DEVOPS - Creating deployment configs...");
    sessionService.addMessage(sessionId, devopsMsg);

    const devopsPrompt = injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SWARM_CODING.DEVOPS_ENGINEER)
      .replace('{{CONTEXT}}', `${reqRes}\n\n${techRes}\n\n${designRes}`);
    const devopsRes = await this.processBotTurn(sessionId, speaker, history, devopsPrompt, "DEVOPS ENGINEER", controlSignal);
    history.push(this.createMessage(speaker.name, speaker.authorType, devopsRes, speaker.color, "DEVOPS ENGINEER"));

    // Phase 10: Integration Check
    const intMsg = this.createSystemMessage("PHASE 10: INTEGRATION - Validating components...");
    sessionService.addMessage(sessionId, intMsg);

    const intPrompt = injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SWARM_CODING.INTEGRATION_MANAGER)
      .replace('{{CONTEXT}}', `${reqRes}\n\n${techRes}\n\n${designRes}`);
    const intRes = await this.processBotTurn(sessionId, speaker, history, intPrompt, "INTEGRATION MANAGER", controlSignal);
    history.push(this.createMessage(speaker.name, speaker.authorType, intRes, speaker.color, "INTEGRATION MANAGER"));

    // Phase 11: Quality Assurance
    sessionService.updateSessionStatus(sessionId, SessionStatus.RESOLVING);
    const qaMsg = this.createSystemMessage("PHASE 11: QUALITY ASSURANCE - Final validation...");
    sessionService.addMessage(sessionId, qaMsg);

    const qaPrompt = injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SWARM_CODING.QUALITY_ASSURANCE)
      .replace('{{CONTEXT}}', `${reqRes}\n\n${techRes}\n\n${designRes}`);
    const qaRes = await this.processBotTurn(sessionId, speaker, history, qaPrompt, "QA LEAD", controlSignal);
    history.push(this.createMessage(speaker.name, speaker.authorType, qaRes, speaker.color, "QA LEAD"));

    // Phase 12: Final Presentation
    const finalMsg = this.createSystemMessage("PHASE 12: FINAL PRESENTATION - Presenting solution...");
    sessionService.addMessage(sessionId, finalMsg);

    const finalPrompt = injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SWARM_CODING.FINAL_PRESENTER)
      .replace('{{CONTEXT}}', `${reqRes}\n\n${techRes}\n\n${designRes}`);
    const finalRes = await this.processBotTurn(sessionId, speaker, history, finalPrompt, "PRODUCT MANAGER", controlSignal);
    history.push(this.createMessage(speaker.name, speaker.authorType, finalRes, speaker.color, "PRODUCT MANAGER"));

    const completeMsg = this.createSystemMessage("✅ SWARM CODING COMPLETE - All phases finished successfully!");
    sessionService.addMessage(sessionId, completeMsg);
  }

  private async runSwarmMode(
    sessionId: string,
    topic: string,
    speaker: BotConfig | undefined,
    enabledBots: BotConfig[],
    history: Message[],
    injectTopic: (template: string) => string,
    maxConcurrency: number,
    controlSignal: { stop: boolean; pause: boolean }
  ) {
    if (speaker) {
      const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SWARM.SPEAKER_DECOMPOSITION)} Persona: ${speaker.persona}`;
      const res = await this.processBotTurn(sessionId, speaker, history, prompt, "HIVE OVERSEER", controlSignal);
      history.push(this.createMessage(speaker.name, speaker.authorType, res, speaker.color, "HIVE OVERSEER"));

      const agentMatches = res.matchAll(/- Agent ([A-Za-z0-9\s]+):/g);
      const swarmAgents: BotConfig[] = [];
      for (const match of agentMatches) {
        const id = `swarm-${Date.now()}-${match[1].trim()}`;
        swarmAgents.push({
          id,
          name: `Swarm: ${match[1].trim()}`,
          role: 'swarm_agent',
          authorType: AuthorType.GEMINI,
          model: 'gemini-2.5-flash',
          persona: "You are a specialized Swarm Agent.",
          color: "from-orange-500 to-red-600",
          enabled: true
        });
      }

      sessionService.updateSessionStatus(sessionId, SessionStatus.DEBATING);
      await this.runBatchWithConcurrency(swarmAgents, async (agent: BotConfig) => {
        const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SWARM.SWARM_AGENT).replace('{{ROLE}}', agent.name).replace('{{TASK}}', 'Execute.')}`;
        return await this.processBotTurn(sessionId, agent, history, prompt, agent.name.toUpperCase(), controlSignal);
      }, maxConcurrency, controlSignal);

      sessionService.updateSessionStatus(sessionId, SessionStatus.RESOLVING);
      const finalRes = await this.processBotTurn(sessionId, speaker, history, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SWARM.SPEAKER_AGGREGATION)} Persona: ${speaker.persona}`, "HIVE CONSENSUS", controlSignal);
      history.push(this.createMessage(speaker.name, speaker.authorType, finalRes, speaker.color, "HIVE CONSENSUS"));
    }
  }

  private async runResearchMode(
    sessionId: string,
    topic: string,
    speaker: BotConfig | undefined,
    councilors: BotConfig[],
    history: Message[],
    injectTopic: (template: string) => string,
    maxConcurrency: number,
    controlSignal: { stop: boolean; pause: boolean }
  ) {
    if (speaker) {
      sessionService.updateSessionStatus(sessionId, SessionStatus.OPENING);
      await this.processBotTurn(sessionId, speaker, history, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.RESEARCH.SPEAKER_PLANNING)} Persona: ${speaker.persona}`, "LEAD INVESTIGATOR", controlSignal);

      sessionService.updateSessionStatus(sessionId, SessionStatus.DEBATING);
      await this.runBatchWithConcurrency(councilors.slice(0, 3), async (bot) => {
        return await this.processBotTurn(sessionId, bot, history, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.RESEARCH.COUNCILOR_ROUND_1)} Persona: ${bot.persona}`, "RESEARCH AGENT (PHASE 1)", controlSignal);
      }, maxConcurrency, controlSignal);

      sessionService.updateSessionStatus(sessionId, SessionStatus.RECONCILING);
      const gapAnalysis = await this.processBotTurn(sessionId, speaker, history, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.RESEARCH.SPEAKER_GAP_ANALYSIS)} Persona: ${speaker.persona}`, "GAP ANALYSIS", controlSignal);
      history.push(this.createMessage(speaker.name, speaker.authorType, gapAnalysis, speaker.color, "GAP ANALYSIS"));

      sessionService.updateSessionStatus(sessionId, SessionStatus.DEBATING);
      await this.runBatchWithConcurrency(councilors.slice(0, 3), async (bot) => {
        const depthPrompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.RESEARCH.COUNCILOR_ROUND_2).replace('{{GAP_CONTEXT}}', gapAnalysis)} Persona: ${bot.persona}`;
        return await this.processBotTurn(sessionId, bot, history, depthPrompt, "RESEARCH AGENT (PHASE 2)", controlSignal);
      }, maxConcurrency, controlSignal);

      sessionService.updateSessionStatus(sessionId, SessionStatus.RESOLVING);
      await this.processBotTurn(sessionId, speaker, history, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.RESEARCH.SPEAKER_REPORT)} Persona: ${speaker.persona}`, "FINAL DOSSIER", controlSignal);
    }
  }

  private async runInquiryOrDeliberationMode(
    sessionId: string,
    topic: string,
    mode: SessionMode,
    speaker: BotConfig | undefined,
    councilors: BotConfig[],
    history: Message[],
    injectTopic: (template: string) => string,
    maxConcurrency: number,
    controlSignal: { stop: boolean; pause: boolean }
  ) {
    let openingPrompt = "";
    let councilorPrompt = "";
    let closingPrompt = "";
    let closingRole = "FINAL";

    if (mode === SessionMode.INQUIRY) {
      openingPrompt = COUNCIL_SYSTEM_INSTRUCTION.INQUIRY.SPEAKER_OPENING;
      councilorPrompt = COUNCIL_SYSTEM_INSTRUCTION.INQUIRY.COUNCILOR;
      closingPrompt = COUNCIL_SYSTEM_INSTRUCTION.INQUIRY.SPEAKER_ANSWER;
      closingRole = "ANSWER";
    } else {
      openingPrompt = COUNCIL_SYSTEM_INSTRUCTION.DELIBERATION.SPEAKER_OPENING;
      councilorPrompt = COUNCIL_SYSTEM_INSTRUCTION.DELIBERATION.COUNCILOR;
      closingPrompt = COUNCIL_SYSTEM_INSTRUCTION.DELIBERATION.SPEAKER_SUMMARY;
      closingRole = "SUMMARY";
    }

    if (speaker) {
      sessionService.updateSessionStatus(sessionId, SessionStatus.OPENING);
      await this.processBotTurn(sessionId, speaker, history, `${injectTopic(openingPrompt)} Persona: ${speaker.persona}`, "SPEAKER", controlSignal);
    }

    sessionService.updateSessionStatus(sessionId, SessionStatus.DEBATING);
    await this.runBatchWithConcurrency(councilors.slice(0, 3), async (bot) => {
      return await this.processBotTurn(sessionId, bot, history, `${injectTopic(councilorPrompt)} Persona: ${bot.persona}`, bot.role, controlSignal);
    }, maxConcurrency, controlSignal);

    sessionService.updateSessionStatus(sessionId, SessionStatus.RESOLVING);
    if (speaker) {
      await this.processBotTurn(sessionId, speaker, history, `${injectTopic(closingPrompt)} Persona: ${speaker.persona}`, closingRole, controlSignal);
    }
  }

  private async processBotTurn(
    sessionId: string,
    bot: BotConfig,
    history: Message[],
    systemPrompt: string,
    roleLabel: string,
    controlSignal: { stop: boolean; pause: boolean }
  ): Promise<string> {
    this.checkControlSignal(controlSignal);

    // Inject tool definitions
    const toolDefs = toolRegistry.getToolDefinitions();
    const promptWithTools = `${systemPrompt}

[AVAILABLE TOOLS]
You have access to the following tools. To use a tool, output a JSON object wrapped in <tool_call> tags.
Example: <tool_call>{"name": "web_search", "arguments": {"query": "latest AI news"}}</tool_call>

${toolDefs}
`;

    // Estimate tokens for this AI call
    const estimatedTokens = this.estimateTokenCount(promptWithTools) + this.estimateTokenCount(history.map(m => m.content).join(' '));

    // Check if call is allowed by protection service
    const protectionCheck = protectionService.checkCallAllowed(
      sessionId,
      'ai_generation',
      { botId: bot.id, promptLength: systemPrompt.length },
      estimatedTokens
    );

    if (!protectionCheck.allowed) {
      const errorMsg = `[PROTECTION] Call blocked: ${protectionCheck.reason}`;
      sessionService.addMessage(sessionId, this.createSystemMessage(errorMsg));
      return "";
    }

    // Record this call for protection tracking
    protectionService.recordCall(sessionId, 'ai_generation', { botId: bot.id });

    const initialMsg = this.createMessage(bot.name, bot.authorType, "...", bot.color, roleLabel);
    initialMsg.thinking = "Processing...";

    // IMPORTANT: Capture the returned message which has the correct ID
    const storedMsg = sessionService.addMessage(sessionId, initialMsg);

    // Emit speaker change event
    councilEventBus.emitEvent('speaker_change', sessionId, {
      messageId: storedMsg.id,
      botName: bot.name,
      role: roleLabel,
      avatar: bot.avatar || 'default', // Assuming avatar might be added later
      color: bot.color
    });

    let currentContent = "...";

    try {
      const fullResponse = await this.aiService.streamBotResponse(
        bot,
        history,
        promptWithTools,
        (chunk) => {
          // Update the message with streaming content
          currentContent += chunk;
          sessionService.updateMessage(sessionId, storedMsg.id, { content: currentContent });

          // Emit token event for typewriter effect
          councilEventBus.emitEvent('token', sessionId, {
            messageId: storedMsg.id,
            chunk: chunk
          });
        }
      );

      // Update token count after successful response
      const actualTokens = this.estimateTokenCount(fullResponse);
      protectionService.updateTokenCount(sessionId, actualTokens);

      const cleanSpeech = fullResponse.replace(/<thinking>[\s\S]*?<\/thinking>/, '').replace(/<vote>[\s\S]*?<\/vote>/g, '').replace(/```[\s\S]*?```/g, '').trim();
      sessionService.updateMessage(sessionId, storedMsg.id, { content: fullResponse });

      // Complete the call (decrement depth)
      protectionService.completeCall(sessionId);

      return await this.handleToolCalls(sessionId, fullResponse, storedMsg);
    } catch (e: any) {
      sessionService.updateMessage(sessionId, storedMsg.id, { content: `(Error: ${e.message})` });
      // Complete the call even on error
      protectionService.completeCall(sessionId);
      return "";
    }
  }

  private async runBatchWithConcurrency<T, R>(
    items: T[],
    fn: (item: T) => Promise<R>,
    maxConcurrency: number,
    controlSignal: { stop: boolean; pause: boolean }
  ): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += maxConcurrency) {
      this.checkControlSignal(controlSignal);
      const batch = items.slice(i, i + maxConcurrency);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const batchResults = await Promise.all(batch.map(fn));
      results.push(...batchResults);
    }
    return results;
  }

  private parseVotesFromResponse(response: string, topic: string, councilors: BotConfig[]): VoteData {
    let yeas = 0;
    let nays = 0;
    let weightedYeas = 0;
    let weightedNays = 0;
    let totalWeight = 0;
    let totalConfidence = 0;
    let voteCount = 0;
    const votes: any[] = [];

    const voteBlocks = [...response.matchAll(/(?:MEMBER:\s*)?(?:\*\*)?(.*?)(?:\*\*)?\s*<vote>(.*?)<\/vote>\s*<confidence>(.*?)<\/confidence>\s*<reason>([\s\S]*?)<\/reason>/gi)];

    if (voteBlocks.length > 0) {
      voteBlocks.forEach(match => {
        const name = match[1].trim();
        const choice = match[2].toUpperCase().includes('YEA') ? 'YEA' : 'NAY';
        const conf = parseInt(match[3]) || 5;
        const reason = match[4].trim();

        const bot = councilors.find(b => b.name === name || b.name === name.replace(/\*\*/g, '')) || { color: 'from-gray-500 to-gray-600', weight: 1 } as any;
        const weight = bot.weight || 1; // Default weight is 1 if not specified

        if (choice === 'YEA') {
          yeas++;
          weightedYeas += weight;
        } else {
          nays++;
          weightedNays += weight;
        }
        totalConfidence += conf;
        totalWeight += weight;
        voteCount++;
        votes.push({ voter: name, choice, confidence: conf, reason, color: bot.color, weight });
      });
    }

    const avgConfidence = voteCount > 0 ? totalConfidence / voteCount : 0;

    // Use weighted votes if available, otherwise fall back to simple majority
    const finalWeightedYeas = weightedYeas || yeas;
    const finalWeightedNays = weightedNays || nays;

    let result: 'PASSED' | 'REJECTED' | 'RECONCILIATION NEEDED' = finalWeightedYeas > finalWeightedNays ? 'PASSED' : 'REJECTED';

    const margin = Math.abs(finalWeightedYeas - finalWeightedNays);
    const total = finalWeightedYeas + finalWeightedNays;
    const unanimity = total > 0 ? margin / total : 0;
    const consensusScore = Math.round(((unanimity * 0.7) + ((avgConfidence / 10) * 0.3)) * 100);

    let consensusLabel = "Divided";
    if (consensusScore > 85) consensusLabel = "Unanimous";
    else if (consensusScore > 65) consensusLabel = "Strong Consensus";
    else if (consensusScore > 40) consensusLabel = "Contentious";

    if (consensusScore < 40 && total > 2) result = 'RECONCILIATION NEEDED';


    logger.info(`Vote parsed: ${result} (${finalWeightedYeas} -${finalWeightedNays})`, {
      topic,
      consensusScore,
      consensusLabel,
      voteCount
    });

    return {
      topic,
      yeas,
      nays,
      result,
      avgConfidence,
      consensusScore,
      consensusLabel,
      votes,
      weightedYeas: finalWeightedYeas,
      weightedNays: finalWeightedNays,
      totalWeight
    };
  }

  private parsePredictionFromResponse(response: string): PredictionData | undefined {
    const outcomeMatch = response.match(/<outcome>([\s\S]*?)<\/outcome>/i);
    const confMatch = response.match(/<confidence>([\s\S]*?)<\/confidence>/i);
    const timeMatch = response.match(/<timeline>([\s\S]*?)<\/timeline>/i);
    const reasonMatch = response.match(/<reasoning>([\s\S]*?)<\/reasoning>/i);

    if (outcomeMatch && confMatch) {
      return {
        outcome: outcomeMatch[1].trim(),
        confidence: parseInt(confMatch[1]) || 50,
        timeline: timeMatch ? timeMatch[1].trim() : "Unknown",
        reasoning: reasonMatch ? reasonMatch[1].trim() : "No reasoning provided."
      };
    }
    return undefined;
  }

  private createMessage(
    author: string,
    authorType: string,
    content: string,
    color?: string,
    roleLabel?: string
  ): Message {
    return {
      id: `msg - ${Date.now()} -${Math.random().toString(36).substr(2, 9)} `,
      author,
      authorType: authorType as AuthorType,
      content,
      color,
      roleLabel,
      timestamp: Date.now()
    };
  }

  private createSystemMessage(content: string): Message {
    return {
      id: `sys - ${Date.now()} -${Math.random().toString(36).substr(2, 9)} `,
      author: 'Council Clerk',
      authorType: AuthorType.SYSTEM,
      content,
      timestamp: Date.now()
    };
  }

  private checkControlSignal(controlSignal: { stop: boolean; pause: boolean }) {
    if (controlSignal.stop) {
      throw new Error("SESSION_STOPPED");
    }
    while (controlSignal.pause) {
      setTimeout(() => { }, 500);
      if (controlSignal.stop) {
        throw new Error("SESSION_STOPPED");
      }
    }
  }

  private buildResult(sessionId: string) {
    const session = sessionService.getSession(sessionId)!;
    return {
      messages: session.messages,
      voteData: session.voteData,
      predictionData: session.predictionData,
      codeFiles: session.codeFiles,
      summary: sessionService.getSessionSummary(sessionId),
      consensusLabel: session.voteData?.consensusLabel
    };
  }

  stopSession(sessionId: string) {
    const controlSignal = this.controlSignals.get(sessionId);
    if (controlSignal) {
      controlSignal.stop = true;
    }
    sessionService.stopSession(sessionId);
  }

  pauseSession(sessionId: string) {
    const controlSignal = this.controlSignals.get(sessionId);
    if (controlSignal) {
      controlSignal.pause = !controlSignal.pause;
    }
    const session = sessionService.getSession(sessionId);
    if (session) {
      sessionService.updateSessionStatus(sessionId, session.status === SessionStatus.PAUSED ? SessionStatus.DEBATING : SessionStatus.PAUSED);
    }
  }

  /**
   * Handle tool calls in the response
   */
  private async handleToolCalls(sessionId: string, response: string, message: Message): Promise<string> {
    const toolCallRegex = /<tool_call>([\s\S]*?)<\/tool_call>/g;
    const matches = [...response.matchAll(toolCallRegex)];

    if (matches.length === 0) {
      return response;
    }

    let updatedResponse = response;

    for (const match of matches) {
      const toolCallJson = match[1];
      try {
        const toolCall = JSON.parse(toolCallJson);
        const toolName = toolCall.name;
        const toolArgs = toolCall.arguments;

        const tool = toolRegistry.getTool(toolName);
        if (tool) {
          console.error(`[Orchestrator] Executing tool ${toolName} for session ${sessionId}`);
          const result = await tool.execute(toolArgs);

          const toolOutput = `\n\n[TOOL OUTPUT: ${toolName}]\n${result}\n`;
          updatedResponse += toolOutput;

          // Update the message with tool output
          sessionService.updateMessage(sessionId, message.id, { content: updatedResponse });
        } else {
          updatedResponse += `\n\n[TOOL ERROR] Tool '${toolName}' not found.\n`;
          sessionService.updateMessage(sessionId, message.id, { content: updatedResponse });
        }
      } catch (e: any) {
        console.error(`[Orchestrator] Failed to parse tool call:`, e);
        updatedResponse += `\n\n[TOOL ERROR] Failed to parse tool call: ${e.message}\n`;
        sessionService.updateMessage(sessionId, message.id, { content: updatedResponse });
      }
    }

    return updatedResponse;
  }

  /**
   * Estimate token count for a text string
   * Rough approximation: 1 token ≈ 4 characters for English text
   */
  private estimateTokenCount(text: string): number {
    if (!text) return 0;
    // Use more conservative estimate: 1 token ≈ 3.5 characters
    return Math.ceil(text.length / 3.5);
  }
}
