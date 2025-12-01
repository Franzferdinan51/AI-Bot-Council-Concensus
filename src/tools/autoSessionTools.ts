/**
 * Auto Session Tools
 * Provides automated council sessions with smart mode selection
 */

import { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';
import { CouncilOrchestrator } from '../services/councilOrchestrator.js';
import { sessionService } from '../services/sessionService.js';
import { ValidationService } from '../services/validationService.js';
import { responseSchema } from '../services/responseSchema.js';
import { SessionMode, CouncilSettings, getBotsWithCustomConfigs, DEFAULT_SETTINGS } from '../types/index.js';

export interface AutoSessionInput {
  topic: string;
  mode?: 'auto' | 'proposal' | 'deliberation' | 'inquiry' | 'research' | 'swarm' | 'swarm_coding' | 'prediction';
  settings?: {
    bots?: Array<{ id: string; enabled: boolean }>;
    economyMode?: boolean;
    maxConcurrentRequests?: number;
    customDirective?: string;
    useWeightedVoting?: boolean;
    maxRounds?: number;
  };
  context?: string;
  autoStart?: boolean;
}

export interface AutoSessionResult {
  sessionId: string;
  topic: string;
  mode: SessionMode | string;
  status: string;
  result: any;
  messageCount: number;
  executionTime: number;
}

/**
 * Automatically select the best session mode based on the topic
 */
function selectOptimalMode(topic: string): SessionMode {
  const topicLower = topic.toLowerCase();

  // Check for code/development keywords
  if (topicLower.includes('code') || topicLower.includes('implement') ||
      topicLower.includes('develop') || topicLower.includes('build') ||
      topicLower.includes('function') || topicLower.includes('algorithm')) {
    return SessionMode.SWARM_CODING;
  }

  // Check for prediction/forecast keywords
  if (topicLower.includes('predict') || topicLower.includes('forecast') ||
      topicLower.includes('will happen') || topicLower.includes('outcome') ||
      topicLower.includes('future') || topicLower.includes('estimate')) {
    return SessionMode.PREDICTION;
  }

  // Check for research/investigation keywords
  if (topicLower.includes('research') || topicLower.includes('investigate') ||
      topicLower.includes('analyze') || topicLower.includes('study') ||
      topicLower.includes('explore') || topicLower.includes('examine')) {
    return SessionMode.RESEARCH;
  }

  // Check for inquiry/Q&A keywords
  if (topicLower.includes('?') || topicLower.includes('what is') ||
      topicLower.includes('how to') || topicLower.includes('explain') ||
      topicLower.includes('define') || topicLower.includes('what are')) {
    return SessionMode.INQUIRY;
  }

  // Check for voting/decision keywords
  if (topicLower.includes('vote') || topicLower.includes('decide') ||
      topicLower.includes('approve') || topicLower.includes('reject') ||
      topicLower.includes('should we') || topicLower.includes('motion')) {
    return SessionMode.PROPOSAL;
  }

  // Default to deliberation for general discussions
  return SessionMode.DELIBERATION;
}

/**
 * Build session settings from overrides
 */
function buildSessionSettings(overrides?: AutoSessionInput['settings']): CouncilSettings {
  const settings: CouncilSettings = {
    ...DEFAULT_SETTINGS,
    bots: DEFAULT_SETTINGS.bots.map(b => ({ ...b })),
    providers: { ...DEFAULT_SETTINGS.providers }
  };

  if (overrides?.bots) {
    const botMap = new Map<string, CouncilSettings['bots'][number]>(settings.bots.map(b => [b.id, b]));
    for (const update of overrides.bots) {
      const bot = botMap.get(update.id);
      if (bot) {
        bot.enabled = update.enabled;
      }
    }
  }

  if (overrides?.economyMode !== undefined) {
    settings.economyMode = overrides.economyMode;
  }

  if (overrides?.maxConcurrentRequests !== undefined) {
    settings.maxConcurrentRequests = overrides.maxConcurrentRequests;
  }

  if (overrides?.customDirective) {
    settings.customDirective = overrides.customDirective;
  }

  // Add custom metadata for auto sessions
  (settings as any).autoSession = true;
  (settings as any).useWeightedVoting = overrides?.useWeightedVoting || false;
  (settings as any).maxRounds = overrides?.maxRounds || 10;

  return settings;
}

/**
 * Create the council_auto tool
 */
export function createAutoSessionTools(orchestrator: CouncilOrchestrator): Tool[] {
  return [
    {
      name: 'council_auto',
      description: 'Automatically run a council session with smart mode selection. Analyzes the topic and selects the optimal mode, or allows manual mode selection.',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The topic or question to discuss with the council'
          },
          mode: {
            type: 'string',
            description: 'Session mode (auto = smart selection, or specify: proposal, deliberation, inquiry, research, swarm, swarm_coding, prediction)',
            enum: ['auto', 'proposal', 'deliberation', 'inquiry', 'research', 'swarm', 'swarm_coding', 'prediction'],
            default: 'auto'
          },
          settings: {
            type: 'object',
            description: 'Optional session settings',
            properties: {
              bots: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    enabled: { type: 'boolean' }
                  }
                }
              },
              economyMode: { type: 'boolean' },
              maxConcurrentRequests: { type: 'number', minimum: 1, maximum: 5 },
              customDirective: { type: 'string' },
              useWeightedVoting: { type: 'boolean', description: 'Use weighted voting based on bot weights' },
              maxRounds: { type: 'number', description: 'Maximum debate rounds (default: 10)' }
            }
          },
          context: {
            type: 'string',
            description: 'Additional context for the discussion'
          },
          autoStart: {
            type: 'boolean',
            description: 'Automatically start the session (default: true)',
            default: true
          }
        },
        required: ['topic']
      }
    }
  ];
}

/**
 * Handle council_auto tool calls
 */
export async function handleAutoSessionToolCall(
  toolName: string,
  arguments_: AutoSessionInput,
  orchestrator: CouncilOrchestrator
): Promise<CallToolResult> {
  const startTime = responseSchema.startExecution();

  try {
    // Validate input
    const validation = ValidationService.validateCouncilInput(arguments_);
    if (!validation.isValid) {
      const errorResponse = responseSchema.validationError(
        toolName,
        validation.errors,
        { executionTime: Date.now() - startTime }
      );
      return responseSchema.toMCPResponse(errorResponse);
    }

    const { topic, mode = 'auto', settings, context, autoStart = true } = arguments_;

    // Determine the session mode
    const sessionMode: SessionMode = mode === 'auto' ? selectOptimalMode(topic) : (mode as SessionMode);

    // Build settings
    const sessionSettings = buildSessionSettings(settings);

    // Create session
    const sessionId = sessionService.createSession(
      topic,
      sessionMode,
      sessionSettings,
      context
    );

    let result: any = null;

    if (autoStart) {
      // Run the session
      result = await orchestrator.runCouncilSession(
        sessionId,
        topic,
        sessionMode,
        sessionSettings,
        context
      );

      // Use the council result response schema
      const unifiedResponse = responseSchema.councilResult(
        toolName,
        result,
        {
          sessionId,
          executionTime: Date.now() - startTime
        }
      );

      return responseSchema.toMCPResponse(unifiedResponse);
    } else {
      // Just create the session, don't run it
      const session = sessionService.getSession(sessionId);
      const autoResult: AutoSessionResult = {
        sessionId,
        topic,
        mode: sessionMode,
        status: session?.status || 'created',
        result: { message: 'Session created, autoStart=false' },
        messageCount: session?.messages.length || 0,
        executionTime: Date.now() - startTime
      };

      const unifiedResponse = responseSchema.success(
        toolName,
        autoResult,
        {
          sessionId,
          executionTime: Date.now() - startTime
        }
      );

      return responseSchema.toMCPResponse(unifiedResponse);
    }
  } catch (error: any) {
    const errorResponse = responseSchema.error(
      toolName,
      'AUTO_SESSION_ERROR',
      error.message,
      {
        executionTime: Date.now() - startTime,
        details: error.stack
      }
    );

    return responseSchema.toMCPResponse(errorResponse);
  }
}
