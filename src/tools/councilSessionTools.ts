import {
  CallToolResult,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { CouncilOrchestrator } from '../services/councilOrchestrator.js';
import { sessionService } from '../services/sessionService.js';
import { DEFAULT_BOTS, DEFAULT_SETTINGS } from '../types/constants.js';
import {
  CouncilToolInput,
  CouncilToolResult,
  SessionMode,
  SessionStatus,
  CouncilSettings,
  ListSessionsResult,
  GetSessionResult,
  StopSessionResult
} from '../types/index.js';
import { ValidationService } from '../services/validationService.js';
import { responseSchema } from '../services/responseSchema.js';

export function createCouncilSessionTools(orchestrator: CouncilOrchestrator): Tool[] {
  return [
    {
      name: 'council_proposal',
      description: 'Run a legislative proposal session - standard parliamentary debate flow with opening, debate, voting, and enactment',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The topic or motion to be debated'
          },
          settings: {
            type: 'object',
            description: 'Optional custom settings for the session',
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
              maxConcurrentRequests: { type: 'number' },
              customDirective: { type: 'string' }
            }
          },
          context: {
            type: 'string',
            description: 'Additional context for the proposal'
          }
        },
        required: ['topic']
      }
    },
    {
      name: 'council_deliberation',
      description: 'Run a deliberation session - roundtable discussion without voting',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The topic to deliberate on'
          },
          settings: {
            type: 'object',
            description: 'Optional custom settings',
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
              customDirective: { type: 'string' }
            }
          },
          context: {
            type: 'string',
            description: 'Additional context for deliberation'
          }
        },
        required: ['topic']
      }
    },
    {
      name: 'council_inquiry',
      description: 'Run an inquiry session - Q&A mode where councilors provide direct answers',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The question or inquiry'
          },
          settings: {
            type: 'object',
            description: 'Optional custom settings',
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
              }
            }
          },
          context: {
            type: 'string',
            description: 'Additional context for the inquiry'
          }
        },
        required: ['topic']
      }
    },
    {
      name: 'council_research',
      description: 'Run a deep research session - multi-phase investigation with gap analysis',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The research topic'
          },
          settings: {
            type: 'object',
            description: 'Optional custom settings',
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
              }
            }
          },
          context: {
            type: 'string',
            description: 'Additional context for research'
          }
        },
        required: ['topic']
      }
    },
    {
      name: 'council_swarm',
      description: 'Run a swarm session - dynamic task decomposition with parallel execution',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The topic for swarm processing'
          },
          settings: {
            type: 'object',
            description: 'Optional custom settings',
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
              }
            }
          },
          context: {
            type: 'string',
            description: 'Additional context for swarm processing'
          }
        },
        required: ['topic']
      }
    },
    {
      name: 'council_swarm_coding',
      description: 'Run a swarm coding session - software development workflow with code generation',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The coding task or feature request'
          },
          settings: {
            type: 'object',
            description: 'Optional custom settings',
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
              }
            }
          },
          context: {
            type: 'string',
            description: 'Additional context or requirements'
          }
        },
        required: ['topic']
      }
    },
    {
      name: 'council_prediction',
      description: 'Run a prediction session - superforecasting with probabilistic analysis',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The event or outcome to predict'
          },
          settings: {
            type: 'object',
            description: 'Optional custom settings',
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
              }
            }
          },
          context: {
            type: 'string',
            description: 'Additional context for the prediction'
          }
        },
        required: ['topic']
      }
    },
    {
      name: 'council_list_sessions',
      description: 'List all council sessions',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    {
      name: 'council_get_session',
      description: 'Get details of a specific session',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: {
            type: 'string',
            description: 'The session ID to retrieve'
          }
        },
        required: ['sessionId']
      }
    },
    {
      name: 'council_stop_session',
      description: 'Stop a running council session',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: {
            type: 'string',
            description: 'The session ID to stop'
          }
        },
        required: ['sessionId']
      }
    },
    {
      name: 'council_pause_session',
      description: 'Pause or resume a running council session',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: {
            type: 'string',
            description: 'The session ID to pause/resume'
          }
        },
        required: ['sessionId']
      }
    }
  ];
}

export async function handleCouncilToolCall(
  toolName: string,
  arguments_: any,
  orchestrator: CouncilOrchestrator
): Promise<CallToolResult> {
  try {
    switch (toolName) {
      case 'council_proposal':
        return await handleProposal(arguments_, orchestrator);
      case 'council_deliberation':
        return await handleDeliberation(arguments_, orchestrator);
      case 'council_inquiry':
        return await handleInquiry(arguments_, orchestrator);
      case 'council_research':
        return await handleResearch(arguments_, orchestrator);
      case 'council_swarm':
        return await handleSwarm(arguments_, orchestrator);
      case 'council_swarm_coding':
        return await handleSwarmCoding(arguments_, orchestrator);
      case 'council_prediction':
        return await handlePrediction(arguments_, orchestrator);
      case 'council_list_sessions':
        return await handleListSessions();
      case 'council_get_session':
        return await handleGetSession(arguments_);
      case 'council_stop_session':
        return await handleStopSession(arguments_, orchestrator);
      case 'council_pause_session':
        return await handlePauseSession(arguments_, orchestrator);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`
        }
      ]
    };
  }
}

async function handleProposal(args: any, orchestrator: CouncilOrchestrator): Promise<CallToolResult> {
  // Validate input
  const validation = ValidationService.validateCouncilInput(args);
  if (!validation.isValid) {
    return ValidationService.createErrorResponse(validation.errors);
  }

  const { topic, settings, context } = args;
  const sessionSettings = buildSessionSettings(settings);

  const sessionId = sessionService.createSession(
    topic,
    SessionMode.PROPOSAL,
    sessionSettings,
    context
  );

  const result = await orchestrator.runCouncilSession(
    sessionId,
    topic,
    SessionMode.PROPOSAL,
    sessionSettings,
    context
  );

  return {
    content: [
      {
        type: 'text',
        text: formatCouncilResult(sessionId, result)
      }
    ]
  };
}

async function handleDeliberation(args: any, orchestrator: CouncilOrchestrator): Promise<CallToolResult> {
  const validation = ValidationService.validateCouncilInput(args);
  if (!validation.isValid) {
    return ValidationService.createErrorResponse(validation.errors);
  }

  const { topic, settings, context } = args;
  const sessionSettings = buildSessionSettings(settings);

  const sessionId = sessionService.createSession(
    topic,
    SessionMode.DELIBERATION,
    sessionSettings,
    context
  );

  const result = await orchestrator.runCouncilSession(
    sessionId,
    topic,
    SessionMode.DELIBERATION,
    sessionSettings,
    context
  );

  return {
    content: [
      {
        type: 'text',
        text: formatCouncilResult(sessionId, result)
      }
    ]
  };
}

async function handleInquiry(args: any, orchestrator: CouncilOrchestrator): Promise<CallToolResult> {
  const validation = ValidationService.validateCouncilInput(args);
  if (!validation.isValid) {
    return ValidationService.createErrorResponse(validation.errors);
  }

  const { topic, settings, context } = args;
  const sessionSettings = buildSessionSettings(settings);

  const sessionId = sessionService.createSession(
    topic,
    SessionMode.INQUIRY,
    sessionSettings,
    context
  );

  const result = await orchestrator.runCouncilSession(
    sessionId,
    topic,
    SessionMode.INQUIRY,
    sessionSettings,
    context
  );

  return {
    content: [
      {
        type: 'text',
        text: formatCouncilResult(sessionId, result)
      }
    ]
  };
}

async function handleResearch(args: any, orchestrator: CouncilOrchestrator): Promise<CallToolResult> {
  const validation = ValidationService.validateCouncilInput(args);
  if (!validation.isValid) {
    return ValidationService.createErrorResponse(validation.errors);
  }

  const { topic, settings, context } = args;
  const sessionSettings = buildSessionSettings(settings);

  const sessionId = sessionService.createSession(
    topic,
    SessionMode.RESEARCH,
    sessionSettings,
    context
  );

  const result = await orchestrator.runCouncilSession(
    sessionId,
    topic,
    SessionMode.RESEARCH,
    sessionSettings,
    context
  );

  return {
    content: [
      {
        type: 'text',
        text: formatCouncilResult(sessionId, result)
      }
    ]
  };
}

async function handleSwarm(args: any, orchestrator: CouncilOrchestrator): Promise<CallToolResult> {
  const validation = ValidationService.validateCouncilInput(args);
  if (!validation.isValid) {
    return ValidationService.createErrorResponse(validation.errors);
  }

  const { topic, settings, context } = args;
  const sessionSettings = buildSessionSettings(settings);

  const sessionId = sessionService.createSession(
    topic,
    SessionMode.SWARM,
    sessionSettings,
    context
  );

  const result = await orchestrator.runCouncilSession(
    sessionId,
    topic,
    SessionMode.SWARM,
    sessionSettings,
    context
  );

  return {
    content: [
      {
        type: 'text',
        text: formatCouncilResult(sessionId, result)
      }
    ]
  };
}

async function handleSwarmCoding(args: any, orchestrator: CouncilOrchestrator): Promise<CallToolResult> {
  const validation = ValidationService.validateCouncilInput(args);
  if (!validation.isValid) {
    return ValidationService.createErrorResponse(validation.errors);
  }

  const { topic, settings, context } = args;
  const sessionSettings = buildSessionSettings(settings);

  const sessionId = sessionService.createSession(
    topic,
    SessionMode.SWARM_CODING,
    sessionSettings,
    context
  );

  const result = await orchestrator.runCouncilSession(
    sessionId,
    topic,
    SessionMode.SWARM_CODING,
    sessionSettings,
    context
  );

  return {
    content: [
      {
        type: 'text',
        text: formatCouncilResult(sessionId, result)
      }
    ]
  };
}

async function handlePrediction(args: any, orchestrator: CouncilOrchestrator): Promise<CallToolResult> {
  const validation = ValidationService.validateCouncilInput(args);
  if (!validation.isValid) {
    return ValidationService.createErrorResponse(validation.errors);
  }

  const { topic, settings, context } = args;
  const sessionSettings = buildSessionSettings(settings);

  const sessionId = sessionService.createSession(
    topic,
    SessionMode.PREDICTION,
    sessionSettings,
    context
  );

  const result = await orchestrator.runCouncilSession(
    sessionId,
    topic,
    SessionMode.PREDICTION,
    sessionSettings,
    context
  );

  return {
    content: [
      {
        type: 'text',
        text: formatCouncilResult(sessionId, result)
      }
    ]
  };
}

async function handleListSessions(): Promise<CallToolResult> {
  const startTime = responseSchema.startExecution();

  const sessions = sessionService.listSessions();
  const result: ListSessionsResult = {
    sessions: sessions.map(s => ({
      sessionId: s.id,
      topic: s.topic,
      mode: s.mode,
      status: s.status,
      messageCount: s.messages.length,
      createdAt: s.createdAt
    }))
  };

  const unifiedResponse = responseSchema.list(
    'council_list_sessions',
    result.sessions,
    {
      executionTime: Date.now() - startTime,
      metadata: {
        totalCount: result.sessions.length
      }
    }
  );

  return responseSchema.toMCPResponse(unifiedResponse);
}

async function handleGetSession(args: any): Promise<CallToolResult> {
  const startTime = responseSchema.startExecution();

  const validation = ValidationService.validateSessionId(args);
  if (!validation.isValid) {
    const errorResponse = responseSchema.validationError(
      'council_get_session',
      validation.errors,
      { executionTime: Date.now() - startTime }
    );
    return responseSchema.toMCPResponse(errorResponse);
  }

  const { sessionId } = args;
  const session = sessionService.getSession(sessionId);

  if (!session) {
    const errorResponse = responseSchema.error(
      'council_get_session',
      'SESSION_NOT_FOUND',
      `Session ${sessionId} not found`,
      { sessionId, executionTime: Date.now() - startTime }
    );
    return responseSchema.toMCPResponse(errorResponse);
  }

  const result: GetSessionResult = {
    sessionId: session.id,
    status: session.status,
    topic: session.topic,
    mode: session.mode,
    messages: session.messages,
    voteData: session.voteData,
    predictionData: session.predictionData,
    codeFiles: session.codeFiles
  };

  const unifiedResponse = responseSchema.sessionSummary(
    'council_get_session',
    session,
    {
      executionTime: Date.now() - startTime,
      includeMessages: true
    }
  );

  return responseSchema.toMCPResponse(unifiedResponse);
}

async function handleStopSession(args: any, orchestrator: CouncilOrchestrator): Promise<CallToolResult> {
  const startTime = responseSchema.startExecution();

  const validation = ValidationService.validateSessionId(args);
  if (!validation.isValid) {
    const errorResponse = responseSchema.validationError(
      'council_stop_session',
      validation.errors,
      { executionTime: Date.now() - startTime }
    );
    return responseSchema.toMCPResponse(errorResponse);
  }

  const { sessionId } = args;
  orchestrator.stopSession(sessionId);

  const result: StopSessionResult = {
    sessionId,
    status: SessionStatus.ADJOURNED,
    message: 'Session stopped successfully'
  };

  const unifiedResponse = responseSchema.success(
    'council_stop_session',
    result,
    {
      sessionId,
      executionTime: Date.now() - startTime
    }
  );

  return responseSchema.toMCPResponse(unifiedResponse);
}

async function handlePauseSession(args: any, orchestrator: CouncilOrchestrator): Promise<CallToolResult> {
  const startTime = responseSchema.startExecution();

  const validation = ValidationService.validateSessionId(args);
  if (!validation.isValid) {
    const errorResponse = responseSchema.validationError(
      'council_pause_session',
      validation.errors,
      { executionTime: Date.now() - startTime }
    );
    return responseSchema.toMCPResponse(errorResponse);
  }

  const { sessionId } = args;
  orchestrator.pauseSession(sessionId);

  const result: StopSessionResult = {
    sessionId,
    status: SessionStatus.PAUSED,
    message: 'Session paused/resumed successfully'
  };

  const unifiedResponse = responseSchema.success(
    'council_pause_session',
    result,
    {
      sessionId,
      executionTime: Date.now() - startTime
    }
  );

  return responseSchema.toMCPResponse(unifiedResponse);
}

function buildSessionSettings(overrides?: any): CouncilSettings {
  const settings = { ...DEFAULT_SETTINGS };

  if (overrides) {
    if (overrides.bots) {
      const botMap = new Map(settings.bots.map(b => [b.id, b]));
      for (const update of overrides.bots) {
        const bot = botMap.get(update.id);
        if (bot) {
          bot.enabled = update.enabled ?? bot.enabled;
        }
      }
    }
    if (typeof overrides.economyMode === 'boolean') {
      settings.economyMode = overrides.economyMode;
    }
    if (typeof overrides.maxConcurrentRequests === 'number') {
      settings.maxConcurrentRequests = overrides.maxConcurrentRequests;
    }
    if (typeof overrides.customDirective === 'string') {
      settings.customDirective = overrides.customDirective;
    }
  }

  return settings;
}

function formatCouncilResult(sessionId: string, result: any): string {
  let output = `=== Council Session ${sessionId} Results ===\n\n`;
  output += result.summary;

  if (result.voteData) {
    output += `\n\n--- VOTE DATA ---\n`;
    output += `Result: ${result.voteData.result}\n`;
    output += `Score: ${result.voteData.consensusScore}% (${result.voteData.consensusLabel})\n`;
    output += `Yeay: ${result.voteData.yeas}, Nay: ${result.voteData.nays}\n`;
    output += `Average Confidence: ${result.voteData.avgConfidence}/10\n\n`;

    output += `Individual Votes:\n`;
    result.voteData.votes.forEach((v: any) => {
      output += `  ${v.voter}: ${v.choice} (${v.confidence}/10) - ${v.reason}\n`;
    });
  }

  if (result.predictionData) {
    output += `\n--- PREDICTION ---\n`;
    output += `Outcome: ${result.predictionData.outcome}\n`;
    output += `Confidence: ${result.predictionData.confidence}%\n`;
    output += `Timeline: ${result.predictionData.timeline}\n`;
    output += `\nReasoning: ${result.predictionData.reasoning}\n`;
  }

  if (result.codeFiles && result.codeFiles.length > 0) {
    output += `\n--- CODE ARTIFACTS ---\n`;
    result.codeFiles.forEach((f: any) => {
      output += `${f.filename} (${f.language})\n`;
    });
  }

  output += `\n\n--- FULL TRANSCRIPT ---\n`;
  result.messages.forEach((m: any) => {
    const prefix = m.authorType === 'system' ? '[SYSTEM]' : `[${m.author}]`;
    output += `${prefix}: ${m.content}\n`;
  });

  return output;
}
