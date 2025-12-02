import {
  CallToolResult,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { CouncilOrchestrator } from '../services/councilOrchestrator.js';
import { sessionService } from '../services/sessionService.js';
import { sessionStorage } from '../services/sessionStorageService.js';
import { getBotsWithCustomConfigs, DEFAULT_SETTINGS } from '../types/constants.js';
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
import { logger } from '../services/logger.js';

export function createCouncilSessionTools(orchestrator: CouncilOrchestrator): Tool[] {
  return [
    {
      name: 'council_proposal',
      description: 'Run a legislative proposal session - standard parliamentary debate with opening, debate, voting, and enactment. 🎨 Dynamically select specific council personas via settings.bots for topic-appropriate expertise. Controlling bot can participate as "User/Petitioner".',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The topic or motion to be debated'
          },
          userPrompt: {
            type: 'string',
            description: 'Optional participation message from the controlling bot (acts as User/Petitioner in the council)'
          },
          settings: {
            type: 'object',
            description: 'Custom settings - TIP: Use settings.bots to select topic-appropriate personas (e.g., specialist-science for science topics)',
            properties: {
              bots: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', description: 'Bot ID (e.g., "specialist-science", "councilor-technocrat")' },
                    enabled: { type: 'boolean', description: 'Enable this persona for this session' }
                  }
                },
                description: 'Dynamic persona selection - specify which council members participate. See DYNAMIC_PERSONA_SELECTION.md for examples'
              },
              economyMode: { type: 'boolean' },
              maxConcurrentRequests: { type: 'number' },
              customDirective: { type: 'string' },
              verboseLogging: { type: 'boolean', description: 'Enable detailed progress logging (default: true)' },
              progressDelay: { type: 'number', description: 'Delay between steps in ms (default: 500)' }
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
      description: 'Run a deliberation session - roundtable discussion without voting. 🎨 Dynamic persona selection enabled - specify experts via settings.bots for relevant expertise. Controlling bot can participate as "User".',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The topic to deliberate on'
          },
          userPrompt: {
            type: 'string',
            description: 'Optional participation message from the controlling bot (acts as User in the council)'
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
              customDirective: { type: 'string' },
              verboseLogging: { type: 'boolean', description: 'Enable detailed progress logging (default: true)' },
              progressDelay: { type: 'number', description: 'Delay between steps in ms (default: 500)' }
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
      description: 'Run an inquiry session - Q&A mode where councilors provide direct answers. 🎨 Select relevant personas via settings.bots for topic-specific expertise. The controlling bot can participate as "User".',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The question or inquiry'
          },
          userPrompt: {
            type: 'string',
            description: 'Optional participation message from the controlling bot'
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
              verboseLogging: { type: 'boolean', description: 'Enable detailed progress logging (default: true)' },
              progressDelay: { type: 'number', description: 'Delay between steps in ms (default: 500)' }
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
      description: 'Run a deep research session - multi-phase investigation with gap analysis. 🎨 Choose research specialists via settings.bots (e.g., specialist-science, specialist-legal) for domain expertise. The controlling bot can participate as "User".',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The research topic'
          },
          userPrompt: {
            type: 'string',
            description: 'Optional participation message from the controlling bot'
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
              verboseLogging: { type: 'boolean', description: 'Enable detailed progress logging (default: true)' },
              progressDelay: { type: 'number', description: 'Delay between steps in ms (default: 500)' }
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
      description: 'Run a swarm session - dynamic task decomposition with parallel execution. 🎨 Include diverse specialists via settings.bots for comprehensive analysis. The controlling bot can participate as "User".',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The topic for swarm processing'
          },
          userPrompt: {
            type: 'string',
            description: 'Optional participation message from the controlling bot'
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
              verboseLogging: { type: 'boolean', description: 'Enable detailed progress logging (default: true)' },
              progressDelay: { type: 'number', description: 'Delay between steps in ms (default: 500)' }
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
      description: 'Run a swarm coding session - software development workflow with code generation. 🎨 Enable specialist-code and technocrat via settings.bots for technical expertise. The controlling bot can participate as "User/Product Owner".',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The coding task or feature request'
          },
          userPrompt: {
            type: 'string',
            description: 'Optional participation message from the controlling bot (acts as Product Owner/Stakeholder)'
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
              verboseLogging: { type: 'boolean', description: 'Enable detailed progress logging (default: true)' },
              progressDelay: { type: 'number', description: 'Delay between steps in ms (default: 500)' }
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
      description: 'Run a prediction session - superforecasting with probabilistic analysis. 🎨 Include historian (past precedents) and specialist-finance (data analysis) via settings.bots for better forecasting. The controlling bot can participate as "User".',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The event or outcome to predict'
          },
          userPrompt: {
            type: 'string',
            description: 'Optional participation message from the controlling bot'
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
              verboseLogging: { type: 'boolean', description: 'Enable detailed progress logging (default: true)' },
              progressDelay: { type: 'number', description: 'Delay between steps in ms (default: 500)' }
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
      name: 'council_advisory',
      description: 'Run an advisory consultation session - strategic guidance and best practices with domain expertise. 🎨 Select relevant councilors via settings.bots (councilor-ethicist for ethical guidance, councilor-pragmatist for feasibility). The controlling bot can participate as "User/Client" seeking advice.',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The strategic question or decision requiring advisory guidance'
          },
          userPrompt: {
            type: 'string',
            description: 'Optional participation message from the controlling bot (acts as User/Client seeking advice)'
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
              domain: {
                type: 'string',
                enum: ['general', 'technical', 'business', 'strategy', 'leadership', 'innovation', 'ethics'],
                description: 'Domain focus for advisory (general, technical, business, strategy, leadership, innovation, ethics)'
              },
              timeframe: {
                type: 'string',
                enum: ['immediate', 'short-term', 'long-term', 'strategic'],
                description: 'Time horizon for recommendations (immediate, short-term, long-term, strategic)'
              },
              verboseLogging: { type: 'boolean', description: 'Enable detailed progress logging (default: true)' },
              progressDelay: { type: 'number', description: 'Delay between steps in ms (default: 500)' }
            }
          },
          context: {
            type: 'string',
            description: 'Additional context for the advisory request (constraints, objectives, background)'
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
      name: 'council_get_transcript',
      description: 'Get a clean, readable transcript of a council session - returns formatted conversation',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: {
            type: 'string',
            description: 'The session ID to retrieve transcript from'
          },
          format: {
            type: 'string',
            enum: ['text', 'json', 'markdown'],
            description: 'Output format (default: text)'
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
    },
    {
      name: 'council_diagnostics',
      description: 'Run server diagnostics and health checks - test all systems and report issues',
      inputSchema: {
        type: 'object',
        properties: {
          verbose: {
            type: 'boolean',
            description: 'Include detailed system information (default: false)'
          }
        },
        required: []
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
      case 'council_advisory':
        return await handleAdvisory(arguments_, orchestrator);
      case 'council_list_sessions':
        return await handleListSessions();
      case 'council_get_session':
        return await handleGetSession(arguments_);
      case 'council_get_transcript':
        return await handleGetTranscript(arguments_);
      case 'council_stop_session':
        return await handleStopSession(arguments_, orchestrator);
      case 'council_pause_session':
        return await handlePauseSession(arguments_, orchestrator);
      case 'council_diagnostics':
        return await handleDiagnostics(arguments_);
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

  const { topic, userPrompt, settings, context } = args;

  // Log to structured logger
  logger.info('Council session started', {
    tool: 'council_proposal',
    topic: topic,
    hasUserPrompt: !!userPrompt,
    hasSettings: !!settings,
    hasContext: !!context
  }, 'CouncilSessionTools');

  console.error(`[MCP HANDLER] council_proposal - Topic: "${topic}"`);
  if (userPrompt) {
    console.error(`[MCP HANDLER] User participation: "${userPrompt.substring(0, 100)}..."`);
  }

  const sessionSettings = buildSessionSettings(settings);

  const sessionId = sessionService.createSession(
    topic,
    SessionMode.PROPOSAL,
    sessionSettings,
    context,
    userPrompt
  );

  console.error(`[MCP TOOL] Created session: ${sessionId}`);

  const result = await orchestrator.runCouncilSession(
    sessionId,
    topic,
    SessionMode.PROPOSAL,
    sessionSettings,
    context,
    userPrompt
  );

  console.error(`[MCP HANDLER] Session completed: ${sessionId} - Messages: ${result.messages?.length || 0}`);

  // Log to structured logger
  logger.info('Council session completed', {
    tool: 'council_proposal',
    sessionId: sessionId,
    messageCount: result.messages?.length || 0,
    hasVoteData: !!result.voteData,
    hasPredictionData: !!result.predictionData,
    hasCodeFiles: !!(result.codeFiles && result.codeFiles.length > 0)
  }, 'CouncilSessionTools');

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

  const { topic, userPrompt, settings, context } = args;
  console.error(`[MCP TOOL] council_deliberation called - Topic: "${topic}"`);
  if (userPrompt) {
    console.error(`[MCP TOOL] User participation: "${userPrompt.substring(0, 100)}..."`);
  }

  const sessionSettings = buildSessionSettings(settings);

  const sessionId = sessionService.createSession(
    topic,
    SessionMode.DELIBERATION,
    sessionSettings,
    context,
    userPrompt
  );

  console.error(`[MCP TOOL] Created session: ${sessionId}`);

  const result = await orchestrator.runCouncilSession(
    sessionId,
    topic,
    SessionMode.DELIBERATION,
    sessionSettings,
    context,
    userPrompt
  );

  console.error(`[MCP TOOL] Session completed: ${sessionId} - Messages: ${result.messages?.length || 0}`);

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

  const { topic, userPrompt, settings, context } = args;
  console.error(`[MCP TOOL] council_inquiry called - Topic: "${topic}"`);
  if (userPrompt) {
    console.error(`[MCP TOOL] User participation: "${userPrompt.substring(0, 100)}..."`);
  }

  const sessionSettings = buildSessionSettings(settings);

  const sessionId = sessionService.createSession(
    topic,
    SessionMode.INQUIRY,
    sessionSettings,
    context,
    userPrompt
  );

  console.error(`[MCP TOOL] Created session: ${sessionId}`);

  const result = await orchestrator.runCouncilSession(
    sessionId,
    topic,
    SessionMode.INQUIRY,
    sessionSettings,
    context,
    userPrompt
  );

  console.error(`[MCP TOOL] Session completed: ${sessionId} - Messages: ${result.messages?.length || 0}`);

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

  const { topic, userPrompt, settings, context } = args;
  console.error(`[MCP TOOL] council_research called - Topic: "${topic}"`);
  if (userPrompt) {
    console.error(`[MCP TOOL] User participation: "${userPrompt.substring(0, 100)}..."`);
  }

  const sessionSettings = buildSessionSettings(settings);

  const sessionId = sessionService.createSession(
    topic,
    SessionMode.RESEARCH,
    sessionSettings,
    context,
    userPrompt
  );

  console.error(`[MCP TOOL] Created session: ${sessionId}`);

  const result = await orchestrator.runCouncilSession(
    sessionId,
    topic,
    SessionMode.RESEARCH,
    sessionSettings,
    context,
    userPrompt
  );

  console.error(`[MCP TOOL] Session completed: ${sessionId} - Messages: ${result.messages?.length || 0}`);

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

  const { topic, userPrompt, settings, context } = args;
  console.error(`[MCP TOOL] council_swarm called - Topic: "${topic}"`);
  if (userPrompt) {
    console.error(`[MCP TOOL] User participation: "${userPrompt.substring(0, 100)}..."`);
  }

  const sessionSettings = buildSessionSettings(settings);

  const sessionId = sessionService.createSession(
    topic,
    SessionMode.SWARM,
    sessionSettings,
    context,
    userPrompt
  );

  console.error(`[MCP TOOL] Created session: ${sessionId}`);

  const result = await orchestrator.runCouncilSession(
    sessionId,
    topic,
    SessionMode.SWARM,
    sessionSettings,
    context,
    userPrompt
  );

  console.error(`[MCP TOOL] Session completed: ${sessionId} - Messages: ${result.messages?.length || 0}`);

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

  const { topic, userPrompt, settings, context } = args;
  console.error(`[MCP TOOL] council_swarm_coding called - Topic: "${topic}"`);
  if (userPrompt) {
    console.error(`[MCP TOOL] User participation: "${userPrompt.substring(0, 100)}..."`);
  }

  const sessionSettings = buildSessionSettings(settings);

  const sessionId = sessionService.createSession(
    topic,
    SessionMode.SWARM_CODING,
    sessionSettings,
    context,
    userPrompt
  );

  console.error(`[MCP TOOL] Created session: ${sessionId}`);

  const result = await orchestrator.runCouncilSession(
    sessionId,
    topic,
    SessionMode.SWARM_CODING,
    sessionSettings,
    context,
    userPrompt
  );

  console.error(`[MCP TOOL] Session completed: ${sessionId} - Messages: ${result.messages?.length || 0}`);

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

  const { topic, userPrompt, settings, context } = args;
  console.error(`[MCP TOOL] council_prediction called - Topic: "${topic}"`);
  if (userPrompt) {
    console.error(`[MCP TOOL] User participation: "${userPrompt.substring(0, 100)}..."`);
  }

  const sessionSettings = buildSessionSettings(settings);

  const sessionId = sessionService.createSession(
    topic,
    SessionMode.PREDICTION,
    sessionSettings,
    context,
    userPrompt
  );

  console.error(`[MCP TOOL] Created session: ${sessionId}`);

  const result = await orchestrator.runCouncilSession(
    sessionId,
    topic,
    SessionMode.PREDICTION,
    sessionSettings,
    context,
    userPrompt
  );

  console.error(`[MCP TOOL] Session completed: ${sessionId} - Messages: ${result.messages?.length || 0}`);

  return {
    content: [
      {
        type: 'text',
        text: formatCouncilResult(sessionId, result)
      }
    ]
  };
}

async function handleAdvisory(args: any, orchestrator: CouncilOrchestrator): Promise<CallToolResult> {
  const validation = ValidationService.validateCouncilInput(args);
  if (!validation.isValid) {
    return ValidationService.createErrorResponse(validation.errors);
  }

  const { topic, userPrompt, settings, context } = args;
  console.error(`[MCP TOOL] council_advisory called - Topic: "${topic}"`);
  if (userPrompt) {
    console.error(`[MCP TOOL] User participation: "${userPrompt.substring(0, 100)}..."`);
  }

  const sessionSettings = buildSessionSettings(settings);

  const sessionId = sessionService.createSession(
    topic,
    SessionMode.ADVISORY,
    sessionSettings,
    context,
    userPrompt
  );

  console.error(`[MCP TOOL] Created session: ${sessionId}`);

  const result = await orchestrator.runCouncilSession(
    sessionId,
    topic,
    SessionMode.ADVISORY,
    sessionSettings,
    context,
    userPrompt
  );

  console.error(`[MCP TOOL] Session completed: ${sessionId} - Messages: ${result.messages?.length || 0}`);

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

  // Flexible validation - accept sessionId as string or in an object
  let sessionId: string;
  if (typeof args === 'string') {
    sessionId = args;
  } else if (args?.sessionId) {
    sessionId = typeof args.sessionId === 'string' ? args.sessionId : args.sessionId.sessionId;
  } else if (Array.isArray(args) && args[0]?.sessionId) {
    sessionId = args[0].sessionId;
  } else {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: sessionId is required and must be a string'
        }
      ]
    };
  }

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

async function handleGetTranscript(args: any): Promise<CallToolResult> {
  const startTime = responseSchema.startExecution();

  // Flexible validation - accept sessionId as string or in an object
  let sessionId: string;
  if (typeof args === 'string') {
    sessionId = args;
  } else if (args.sessionId) {
    sessionId = typeof args.sessionId === 'string' ? args.sessionId : args.sessionId.sessionId;
  } else if (typeof args === 'object' && args[0]) {
    sessionId = args[0].sessionId;
  } else {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: sessionId is required and must be a string'
        }
      ]
    };
  }

  const session = sessionService.getSession(sessionId);

  if (!session) {
    const errorResponse = responseSchema.error(
      'council_get_transcript',
      'SESSION_NOT_FOUND',
      `Session ${sessionId} not found`,
      { sessionId, executionTime: Date.now() - startTime }
    );
    return responseSchema.toMCPResponse(errorResponse);
  }

  const format = args.format || 'text';

  let transcriptText = '';

  if (format === 'markdown') {
    transcriptText = `# Council Session Transcript\n\n`;
    transcriptText += `**Topic:** ${session.topic}\n`;
    transcriptText += `**Mode:** ${session.mode}\n`;
    transcriptText += `**Status:** ${session.status}\n`;
    transcriptText += `**Messages:** ${session.messages.length}\n\n`;
    transcriptText += `---\n\n`;

    session.messages.forEach((m, idx) => {
      const prefix = m.authorType === 'system' ? '🖥️ System' : `👤 ${m.author}`;
      transcriptText += `## Message ${idx + 1} (${prefix})\n\n`;
      transcriptText += `${m.content}\n\n`;
    });

    if (session.predictionData) {
      transcriptText += `---\n\n## Prediction Results\n\n`;
      transcriptText += `**Outcome:** ${session.predictionData.outcome}\n\n`;
      transcriptText += `**Confidence:** ${session.predictionData.confidence}%\n\n`;
      transcriptText += `**Timeline:** ${session.predictionData.timeline}\n\n`;
      transcriptText += `**Reasoning:**\n${session.predictionData.reasoning}\n\n`;
    }
  } else if (format === 'json') {
    transcriptText = JSON.stringify(session.messages, null, 2);
  } else {
    // Default text format - clean and readable
    transcriptText = `╔════════════════════════════════════════════════════════════╗\n`;
    transcriptText += `║           AI COUNCIL SESSION TRANSCRIPT                   ║\n`;
    transcriptText += `╚════════════════════════════════════════════════════════════╝\n\n`;
    transcriptText += `SESSION ID: ${session.id}\n`;
    transcriptText += `TOPIC: ${session.topic}\n`;
    transcriptText += `MODE: ${session.mode}\n`;
    transcriptText += `STATUS: ${session.status}\n`;
    transcriptText += `MESSAGE COUNT: ${session.messages.length}\n\n`;
    transcriptText += `═══════════════════════════════════════════════════════════\n\n`;

    session.messages.forEach((m, idx) => {
      const prefix = m.authorType === 'system' ? '[SYSTEM]' : `[${m.author}]`;
      transcriptText += `${String(idx + 1).padStart(3, ' ')} | ${prefix}\n`;
      transcriptText += `     | ${m.content}\n\n`;
    });

    if (session.predictionData) {
      transcriptText += `═══════════════════════════════════════════════════════════\n\n`;
      transcriptText += `PREDICTION RESULTS:\n\n`;
      transcriptText += `Outcome: ${session.predictionData.outcome}\n`;
      transcriptText += `Confidence: ${session.predictionData.confidence}%\n`;
      transcriptText += `Timeline: ${session.predictionData.timeline}\n`;
      transcriptText += `\nReasoning:\n${session.predictionData.reasoning}\n`;
    }

    transcriptText += `\n╚════════════════════════════════════════════════════════════╝\n`;
  }

  const unifiedResponse = responseSchema.success(
    'council_get_transcript',
    {
      sessionId,
      format,
      transcript: transcriptText,
      messageCount: session.messages.length,
      executionTime: Date.now() - startTime
    },
    {
      sessionId,
      executionTime: Date.now() - startTime
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

async function handleDiagnostics(args: any): Promise<CallToolResult> {
  const startTime = responseSchema.startExecution();
  const verbose = args?.verbose || false;

  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    status: 'OK',
    checks: {},
    errors: [],
    warnings: []
  };

  // Check 1: API Keys
  const apiKeys = {
    gemini: !!process.env.GEMINI_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
    lmStudio: !!process.env.LM_STUDIO_ENDPOINT,
    ollama: !!process.env.OLLAMA_ENDPOINT,
    configured: []
  };

  // Track which providers are configured
  if (apiKeys.gemini) apiKeys.configured.push('Gemini');
  if (apiKeys.anthropic) apiKeys.configured.push('Anthropic');
  if (apiKeys.openai) apiKeys.configured.push('OpenAI');
  if (apiKeys.openrouter) apiKeys.configured.push('OpenRouter');
  if (apiKeys.lmStudio) apiKeys.configured.push('LM Studio');
  if (apiKeys.ollama) apiKeys.configured.push('Ollama');

  diagnostics.checks.apiKeys = apiKeys;

  // Check if at least one provider is configured
  const hasCloudProvider = apiKeys.gemini || apiKeys.anthropic || apiKeys.openai || apiKeys.openrouter;
  const hasLocalProvider = apiKeys.lmStudio || apiKeys.ollama;

  if (!hasCloudProvider && !hasLocalProvider) {
    diagnostics.errors.push({
      component: 'API Keys',
      issue: 'No AI providers configured',
      severity: 'CRITICAL',
      message: 'Configure at least one provider:\n' +
               '  - Cloud: GEMINI_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY, or OPENROUTER_API_KEY\n' +
               '  - Local: LM_STUDIO_ENDPOINT or OLLAMA_ENDPOINT'
    });
    diagnostics.status = 'ERROR';
  } else {
    console.log(`[Diagnostics] Configured providers: ${apiKeys.configured.join(', ')}`);
  }

  // Check 2: Session Service
  try {
    const sessionCount = sessionService.listSessions().length;
    diagnostics.checks.sessionService = {
      status: 'OK',
      activeSessions: sessionCount
    };
  } catch (error: any) {
    diagnostics.errors.push({
      component: 'Session Service',
      issue: error.message,
      severity: 'CRITICAL',
      stack: verbose ? error.stack : undefined
    });
    diagnostics.checks.sessionService = { status: 'ERROR', error: error.message };
    diagnostics.status = 'ERROR';
  }

  // Check 3: Session Storage
  try {
    const stats = sessionStorage.getStorageStats();
    diagnostics.checks.sessionStorage = {
      status: 'OK',
      totalSessions: stats.totalSessions,
      storageDir: sessionStorage.getConfig().storageDir
    };

    // Check if storage directory is writable
    if (verbose) {
      diagnostics.checks.sessionStorage.config = sessionStorage.getConfig();
    }
  } catch (error: any) {
    diagnostics.warnings.push({
      component: 'Session Storage',
      issue: error.message,
      severity: 'WARNING'
    });
    diagnostics.checks.sessionStorage = { status: 'WARNING', error: error.message };
  }

  // Check 4: Memory Usage
  if (verbose) {
    const memUsage = process.memoryUsage();
    diagnostics.checks.memory = {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)} MB`
    };
  }

  // Check 5: Node.js Version
  diagnostics.checks.nodeVersion = {
    version: process.version,
    platform: process.platform,
    arch: process.arch
  };

  // Check 6: Available Council Modes
  diagnostics.checks.availableModes = [
    'council_proposal',
    'council_deliberation',
    'council_inquiry',
    'council_research',
    'council_swarm',
    'council_swarm_coding',
    'council_prediction'
  ];

  // Check 7: Test Session Creation
  try {
    const testSessionId = sessionService.createSession(
      '[DIAGNOSTIC] System Test',
      SessionMode.INQUIRY,
      { bots: [], economyMode: true, maxConcurrentRequests: 1 },
      'Automatic system diagnostic test - will be cleaned up'
    );

    diagnostics.checks.sessionCreation = {
      status: 'OK',
      testSessionId
    };

    // Clean up test session
    const testSession = sessionService.getSession(testSessionId);
    if (testSession) {
      sessionService.updateSessionStatus(testSessionId, SessionStatus.ADJOURNED);
      diagnostics.checks.sessionCleanup = { status: 'OK' };
    }
  } catch (error: any) {
    diagnostics.errors.push({
      component: 'Session Creation',
      issue: error.message,
      severity: 'CRITICAL',
      stack: verbose ? error.stack : undefined
    });
    diagnostics.checks.sessionCreation = { status: 'ERROR', error: error.message };
    diagnostics.status = 'ERROR';
  }

  // Generate Report
  let report = `╔════════════════════════════════════════════════════════════╗\n`;
  report += `║              AI COUNCIL MCP - DIAGNOSTICS                 ║\n`;
  report += `╚════════════════════════════════════════════════════════════╝\n\n`;
  report += `Status: ${diagnostics.status}\n`;
  report += `Timestamp: ${diagnostics.timestamp}\n`;
  report += `Node.js: ${diagnostics.checks.nodeVersion.version} (${diagnostics.checks.nodeVersion.platform})\n\n`;

  // API Keys Status
  report += `─── API KEYS ───\n`;
  report += `Gemini: ${apiKeys.gemini ? '✓ Configured' : '✗ Missing'}\n`;
  report += `Anthropic: ${apiKeys.anthropic ? '✓ Configured' : '✗ Missing'}\n`;
  report += `OpenAI: ${apiKeys.openai ? '✓ Configured' : '✗ Missing'}\n`;
  report += `OpenRouter: ${apiKeys.openrouter ? '✓ Configured' : '✗ Missing'}\n`;
  report += `LM Studio: ${apiKeys.lmStudio ? '✓ Configured' : '✗ Missing'}\n`;
  report += `Ollama: ${apiKeys.ollama ? '✓ Configured' : '✗ Missing'}\n\n`;

  if (apiKeys.configured.length > 0) {
    report += `Configured Providers: ${apiKeys.configured.join(', ')}\n\n`;
  }

  // Session Service
  report += `─── SESSIONS ───\n`;
  report += `Active: ${diagnostics.checks.sessionService.activeSessions || 0}\n`;
  report += `Storage: ${diagnostics.checks.sessionStorage.status}\n\n`;

  // Errors
  if (diagnostics.errors.length > 0) {
    report += `─── ERRORS (${diagnostics.errors.length}) ───\n`;
    diagnostics.errors.forEach((err, idx) => {
      report += `${idx + 1}. [${err.severity}] ${err.component}: ${err.issue}\n`;
      if (verbose && err.stack) {
        report += `   Stack: ${err.stack}\n`;
      }
    });
    report += '\n';
  }

  // Warnings
  if (diagnostics.warnings.length > 0) {
    report += `─── WARNINGS (${diagnostics.warnings.length}) ───\n`;
    diagnostics.warnings.forEach((warn, idx) => {
      report += `${idx + 1}. ${warn.component}: ${warn.issue}\n`;
    });
    report += '\n';
  }

  // Available Tools
  report += `─── AVAILABLE TOOLS ───\n`;
  diagnostics.checks.availableModes.forEach((tool, idx) => {
    report += `${idx + 1}. ${tool}\n`;
  });
  report += `\n`;

  report += `─── QUICK ACTIONS ───\n`;
  report += `• List sessions: council_list_sessions\n`;
  report += `• Run prediction: council_prediction {"topic": "your question"}\n`;
  report += `• Get transcript: council_get_transcript {"sessionId": "id"}\n`;
  report += `• Run diagnostics: council_diagnostics {"verbose": true}\n\n`;

  report += `╚════════════════════════════════════════════════════════════╝\n`;
  report += `Server is ${diagnostics.status === 'OK' ? 'ready ✓' : 'has issues ✗'}\n`;

  if (diagnostics.status !== 'OK') {
    report += `\n⚠️  Please resolve errors before running council sessions.\n`;
  }

  const content: any[] = [
    {
      type: 'text' as const,
      text: report
    }
  ];

  if (verbose && diagnostics.errors.length > 0) {
    content.push({
      type: 'text' as const,
      text: '\n--- VERBOSE DATA ---\n' + JSON.stringify(diagnostics, null, 2)
    });
  }

  return { content };
}

function buildSessionSettings(overrides?: any): CouncilSettings {
  // Use configured bots with custom models
  const configuredBots = getBotsWithCustomConfigs();

  const settings: CouncilSettings = {
    ...DEFAULT_SETTINGS,
    bots: configuredBots,
    verboseLogging: true,  // Default to true for better visibility
    progressDelay: 500     // Default 500ms delay for visible progress
  };

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
    if (typeof overrides.verboseLogging === 'boolean') {
      settings.verboseLogging = overrides.verboseLogging;
      console.error(`[MCP SETTINGS] Verbose logging: ${overrides.verboseLogging ? 'enabled' : 'disabled'}`);
    }
    if (typeof overrides.progressDelay === 'number') {
      settings.progressDelay = overrides.progressDelay;
      console.error(`[MCP SETTINGS] Progress delay: ${overrides.progressDelay}ms`);
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
