import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import {
  ListBotsResult,
  ListBotsInput,
  UpdateBotInput,
  UpdateBotResult,
  AddMemoryInput,
  AddMemoryResult,
  SearchMemoryInput,
  SearchMemoryResult,
  AddDocumentInput,
  AddDocumentResult,
  SearchDocumentsInput,
  SearchDocumentsResult,
  BotRole
} from '../types/index.js';
import { logger } from '../services/logger.js';
import { getBotsWithCustomConfigs } from '../types/constants.js';
import { listMemories, saveMemory, searchMemories } from '../services/knowledgeService.js';
import { listDocuments, saveDocument, searchDocuments } from '../services/knowledgeService.js';
import { ValidationService } from '../services/validationService.js';
import { predictionTrackingService } from '../services/predictionTrackingService.js';
import { personaSuggestionService } from '../services/personaSuggestionService.js';
import { costTrackingService } from '../services/costTrackingService.js';
import { sessionTemplateService } from '../services/sessionTemplateService.js';
import { exportService } from '../services/exportService.js';

export function createManagementTools(): any[] {
  return [
    {
      name: 'council_list_bots',
      description: 'List all available councilor bots and their configuration',
      inputSchema: {
        type: 'object',
        properties: {
          role: { type: 'string', description: 'Filter by bot role' },
          enabled: { type: 'boolean', description: 'Filter by enabled status' },
          model: { type: 'string', description: 'Filter by model' },
          sortBy: { type: 'string', enum: ['name', 'role', 'model'], description: 'Sort results by field' }
        },
        required: []
      }
    },
    {
      name: 'council_update_bot',
      description: 'Update configuration of a specific councilor bot',
      inputSchema: {
        type: 'object',
        properties: {
          botId: {
            type: 'string',
            description: 'ID of the bot to update'
          },
          updates: {
            type: 'object',
            description: 'Updates to apply',
            properties: {
              enabled: { type: 'boolean' },
              persona: { type: 'string' },
              model: { type: 'string' },
              apiKey: { type: 'string' },
              endpoint: { type: 'string' }
            }
          }
        },
        required: ['botId', 'updates']
      }
    },
    {
      name: 'council_add_memory',
      description: 'Add a precedent or ruling to the council memory',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'Topic of the memory'
          },
          content: {
            type: 'string',
            description: 'Content of the memory'
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Tags for categorizing the memory'
          }
        },
        required: ['topic', 'content']
      }
    },
    {
      name: 'council_search_memories',
      description: 'Search council memory for relevant precedents',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results (default: 10)',
            default: 10
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by tags'
          },
          dateRange: {
            type: 'object',
            properties: {
              start: { type: 'string' },
              end: { type: 'string' }
            },
            description: 'Filter by date range'
          }
        },
        required: ['query']
      }
    },
    {
      name: 'council_list_memories',
      description: 'List all stored council memories',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    {
      name: 'council_add_document',
      description: 'Add a document to the knowledge base',
      inputSchema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Title of the document'
          },
          content: {
            type: 'string',
            description: 'Content of the document'
          }
        },
        required: ['title', 'content']
      }
    },
    {
      name: 'council_search_documents',
      description: 'Search the knowledge base documents',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results (default: 5)',
            default: 5
          }
        },
        required: ['query']
      }
    },
    {
      name: 'council_list_documents',
      description: 'List all knowledge base documents',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    {
      name: 'council_track_prediction_outcome',
      description: 'Record the actual outcome of a prediction for tracking and calibration',
      inputSchema: {
        type: 'object',
        properties: {
          predictionId: {
            type: 'string',
            description: 'ID of the prediction to update'
          },
          actualOutcome: {
            type: 'boolean',
            description: 'Whether the predicted event actually occurred'
          },
          actualTimeline: {
            type: 'string',
            description: 'Optional: actual timeline if different from prediction',
            default: ''
          },
          notes: {
            type: 'string',
            description: 'Optional: additional notes about the outcome',
            default: ''
          }
        },
        required: ['predictionId', 'actualOutcome']
      }
    },
    {
      name: 'council_get_prediction_stats',
      description: 'Get comprehensive prediction tracking statistics and calibration metrics',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    {
      name: 'council_suggest_personas',
      description: 'Get AI-powered suggestions for optimal persona combinations based on topic',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The topic to analyze for persona selection'
          },
          context: {
            type: 'string',
            description: 'Additional context for the topic',
            default: ''
          },
          mode: {
            type: 'string',
            description: 'Session mode (proposal, deliberation, research, etc.)',
            default: 'deliberation'
          },
          maxBots: {
            type: 'number',
            description: 'Maximum number of personas to suggest (default: 5)',
            default: 5
          }
        },
        required: ['topic']
      }
    },
    {
      name: 'council_validate_personas',
      description: 'Validate a persona selection against best practices and get feedback',
      inputSchema: {
        type: 'object',
        properties: {
          botIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of bot IDs to validate'
          }
        },
        required: ['botIds']
      }
    },
    {
      name: 'council_get_cost_report',
      description: 'Get comprehensive cost tracking report and analytics',
      inputSchema: {
        type: 'object',
        properties: {
          days: {
            type: 'number',
            description: 'Number of days to include in report (default: 30)',
            default: 30
          }
        },
        required: []
      }
    },
    {
      name: 'council_get_session_cost',
      description: 'Get cost breakdown for a specific session',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: {
            type: 'string',
            description: 'Session ID to get cost breakdown for'
          }
        },
        required: ['sessionId']
      }
    },
    {
      name: 'council_set_budget_alert',
      description: 'Set a budget alert threshold with automatic notifications',
      inputSchema: {
        type: 'object',
        properties: {
          alertId: {
            type: 'string',
            description: 'Unique identifier for the alert'
          },
          threshold: {
            type: 'number',
            description: 'Budget threshold amount in USD'
          }
        },
        required: ['alertId', 'threshold']
      }
    },
    {
      name: 'council_get_current_spend',
      description: 'Get current total spend and usage statistics',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    {
      name: 'council_list_templates',
      description: 'List all available session templates with categories and descriptions',
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Filter by category (proposal, analysis, research, prediction, creative, decision, custom)'
          },
          search: {
            type: 'string',
            description: 'Search templates by name or tags'
          }
        },
        required: []
      }
    },
    {
      name: 'council_get_template',
      description: 'Get detailed information about a specific template',
      inputSchema: {
        type: 'object',
        properties: {
          templateId: {
            type: 'string',
            description: 'Template ID to retrieve'
          }
        },
        required: ['templateId']
      }
    },
    {
      name: 'council_apply_template',
      description: 'Apply a template to create pre-configured session settings',
      inputSchema: {
        type: 'object',
        properties: {
          templateId: {
            type: 'string',
            description: 'Template ID to apply'
          },
          customizations: {
            type: 'object',
            description: 'Optional customizations to apply to the template',
            properties: {
              maxConcurrentRequests: { type: 'number' },
              economyMode: { type: 'boolean' },
              verboseLogging: { type: 'boolean' },
              progressDelay: { type: 'number' }
            }
          }
        },
        required: ['templateId']
      }
    },
    {
      name: 'council_suggest_templates',
      description: 'Get template suggestions for a specific topic',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'Topic to get template suggestions for'
          }
        },
        required: ['topic']
      }
    },
    {
      name: 'council_export_report',
      description: 'Export data in multiple formats (PDF, Markdown, JSON, CSV)',
      inputSchema: {
        type: 'object',
        properties: {
          itemId: {
            type: 'string',
            description: 'ID of item to export'
          },
          title: {
            type: 'string',
            description: 'Title of the export'
          },
          description: {
            type: 'string',
            description: 'Description of the export'
          },
          type: {
            type: 'string',
            enum: ['session', 'analytics', 'prediction', 'cost', 'persona', 'learning', 'test_suite'],
            description: 'Type of data to export'
          },
          data: {
            type: 'object',
            description: 'Data to export'
          },
          format: {
            type: 'string',
            enum: ['pdf', 'markdown', 'json', 'csv', 'xml'],
            description: 'Export format',
            default: 'pdf'
          },
          includeMetadata: {
            type: 'boolean',
            description: 'Include metadata in export',
            default: true
          },
          includeCharts: {
            type: 'boolean',
            description: 'Include charts in export',
            default: true
          }
        },
        required: ['itemId', 'title', 'type', 'data', 'format']
      }
    },
    {
      name: 'council_export_test_suite',
      description: 'Generate comprehensive test suite report',
      inputSchema: {
        type: 'object',
        properties: {
          testData: {
            type: 'object',
            description: 'Test data to include in report'
          },
          format: {
            type: 'string',
            enum: ['pdf', 'markdown', 'json'],
            description: 'Export format',
            default: 'pdf'
          }
        },
        required: ['testData']
      }
    },
    {
      name: 'council_export_analytics',
      description: 'Export analytics dashboard report',
      inputSchema: {
        type: 'object',
        properties: {
          analyticsData: {
            type: 'object',
            description: 'Analytics data to export'
          },
          format: {
            type: 'string',
            enum: ['pdf', 'markdown', 'json'],
            description: 'Export format',
            default: 'pdf'
          }
        },
        required: ['analyticsData']
      }
    },
    {
      name: 'council_export_session',
      description: 'Export detailed session report',
      inputSchema: {
        type: 'object',
        properties: {
          sessionData: {
            type: 'object',
            description: 'Session data to export'
          },
          format: {
            type: 'string',
            enum: ['markdown', 'json', 'pdf'],
            description: 'Export format',
            default: 'markdown'
          }
        },
        required: ['sessionData']
      }
    },
    {
      name: 'council_export_predictions',
      description: 'Export prediction tracking report',
      inputSchema: {
        type: 'object',
        properties: {
          predictionData: {
            type: 'object',
            description: 'Prediction data to export'
          },
          format: {
            type: 'string',
            enum: ['json', 'csv', 'markdown'],
            description: 'Export format',
            default: 'json'
          }
        },
        required: ['predictionData']
      }
    },
    {
      name: 'council_export_personas',
      description: 'Export persona performance report',
      inputSchema: {
        type: 'object',
        properties: {
          personaData: {
            type: 'object',
            description: 'Persona performance data to export'
          },
          format: {
            type: 'string',
            enum: ['markdown', 'json', 'pdf'],
            description: 'Export format',
            default: 'markdown'
          }
        },
        required: ['personaData']
      }
    },
    {
      name: 'council_export_learning',
      description: 'Export meta-learning insights report',
      inputSchema: {
        type: 'object',
        properties: {
          learningData: {
            type: 'object',
            description: 'Learning insights data to export'
          },
          format: {
            type: 'string',
            enum: ['markdown', 'json', 'pdf'],
            description: 'Export format',
            default: 'markdown'
          }
        },
        required: ['learningData']
      }
    },
    {
      name: 'council_export_batch',
      description: 'Export multiple items in batch',
      inputSchema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                type: { type: 'string' },
                data: { type: 'object' }
              }
            },
            description: 'Array of items to export'
          },
          format: {
            type: 'string',
            enum: ['json', 'markdown', 'csv'],
            description: 'Export format',
            default: 'json'
          }
        },
        required: ['items']
      }
    },
    {
      name: 'council_export_custom',
      description: 'Generate custom formatted report',
      inputSchema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Report title'
          },
          subtitle: {
            type: 'string',
            description: 'Report subtitle'
          },
          sections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                content: { type: 'object' }
              }
            },
            description: 'Report sections'
          },
          metadata: {
            type: 'object',
            description: 'Additional metadata'
          },
          format: {
            type: 'string',
            enum: ['pdf', 'markdown', 'json'],
            description: 'Export format',
            default: 'pdf'
          }
        },
        required: ['title', 'sections']
      }
    }
  ];
}

export async function handleManagementToolCall(
  toolName: string,
  arguments_: any
): Promise<CallToolResult> {
  try {
    switch (toolName) {
      case 'council_list_bots':
        return await handleListBots(arguments_);
      case 'council_update_bot':
        return await handleUpdateBot(arguments_);
      case 'council_add_memory':
        return await handleAddMemory(arguments_);
      case 'council_search_memories':
        return await handleSearchMemories(arguments_);
      case 'council_list_memories':
        return await handleListMemories();
      case 'council_add_document':
        return await handleAddDocument(arguments_);
      case 'council_search_documents':
        return await handleSearchDocuments(arguments_);
      case 'council_list_documents':
        return await handleListDocuments();
      case 'council_track_prediction_outcome':
        return await handleTrackPredictionOutcome(arguments_);
      case 'council_get_prediction_stats':
        return await handleGetPredictionStats();
      case 'council_suggest_personas':
        return await handleSuggestPersonas(arguments_);
      case 'council_validate_personas':
        return await handleValidatePersonas(arguments_);
      case 'council_get_cost_report':
        return await handleGetCostReport(arguments_);
      case 'council_get_session_cost':
        return await handleGetSessionCost(arguments_);
      case 'council_set_budget_alert':
        return await handleSetBudgetAlert(arguments_);
      case 'council_get_current_spend':
        return await handleGetCurrentSpend();
      case 'council_list_templates':
        return await handleListTemplates(arguments_);
      case 'council_get_template':
        return await handleGetTemplate(arguments_);
      case 'council_apply_template':
        return await handleApplyTemplate(arguments_);
      case 'council_suggest_templates':
        return await handleSuggestTemplates(arguments_);
      case 'council_export_report':
        return await handleExportReport(arguments_);
      case 'council_export_test_suite':
        return await handleExportTestSuite(arguments_);
      case 'council_export_analytics':
        return await handleExportAnalytics(arguments_);
      case 'council_export_session':
        return await handleExportSession(arguments_);
      case 'council_export_predictions':
        return await handleExportPredictions(arguments_);
      case 'council_export_personas':
        return await handleExportPersonas(arguments_);
      case 'council_export_learning':
        return await handleExportLearning(arguments_);
      case 'council_export_batch':
        return await handleExportBatch(arguments_);
      case 'council_export_custom':
        return await handleExportCustom(arguments_);
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

async function handleListBots(args?: ListBotsInput): Promise<CallToolResult> {
  let configuredBots = getBotsWithCustomConfigs();

  // Apply filters
  if (args) {
    if (args.role) {
      configuredBots = configuredBots.filter(b => b.role === args.role);
    }
    if (args.enabled !== undefined) {
      configuredBots = configuredBots.filter(b => b.enabled === args.enabled);
    }
    if (args.model) {
      configuredBots = configuredBots.filter(b => b.model.includes(args.model!));
    }

    // Apply sorting
    if (args.sortBy) {
      configuredBots.sort((a, b) => {
        const valA = String(a[args.sortBy!] || '');
        const valB = String(b[args.sortBy!] || '');
        return valA.localeCompare(valB);
      });
    }
  }

  const result: ListBotsResult = {
    bots: configuredBots,
    message: `Found ${configuredBots.length} configured bots`
  };

  logger.info('Listed bots', { count: configuredBots.length, filters: args }, 'ManagementTools');

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }
    ]
  };
}

async function handleUpdateBot(args: any): Promise<CallToolResult> {
  // Validate input
  const validation = ValidationService.validateBotUpdate(args);
  if (!validation.isValid) {
    return ValidationService.createErrorResponse(validation.errors);
  }

  const { botId, updates } = args;
  const configuredBots = getBotsWithCustomConfigs();
  const bot = configuredBots.find(b => b.id === botId);

  if (!bot) {
    return {
      content: [
        {
          type: 'text',
          text: `Bot ${botId} not found`
        }
      ]
    };
  }

  Object.assign(bot, updates);

  const result: UpdateBotResult = {
    success: true,
    bot,
    message: `Bot ${botId} updated successfully`
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }
    ]
  };
}

async function handleAddMemory(args: AddMemoryInput): Promise<CallToolResult> {
  // Validate input
  const validation = ValidationService.validateMemoryInput(args);
  if (!validation.isValid) {
    return ValidationService.createErrorResponse(validation.errors);
  }

  // Duplicate detection
  const existing = await searchMemories(args.content, 1);
  if (existing.length > 0 && existing[0].content === args.content) {
    logger.warn('Duplicate memory detected', { topic: args.topic }, 'ManagementTools');
    return {
      content: [{ type: 'text', text: `Warning: Duplicate memory detected (ID: ${existing[0].id})` }],
      isError: true
    };
  }

  // Auto-tagging if no tags provided
  const tags = args.tags || [];
  if (tags.length === 0) {
    if (args.content.toLowerCase().includes('error')) tags.push('error');
    if (args.content.toLowerCase().includes('fix')) tags.push('fix');
    if (args.content.toLowerCase().includes('decision')) tags.push('decision');
  }

  const memory = {
    id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    topic: args.topic,
    content: args.content,
    date: new Date().toISOString(),
    tags: tags
  };

  await saveMemory(memory);
  logger.info('Added memory', { id: memory.id, topic: memory.topic }, 'ManagementTools');

  const result: AddMemoryResult = {
    success: true,
    memoryId: memory.id,
    message: `Memory saved with ID ${memory.id}`
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }
    ]
  };
}

async function handleSearchMemories(args: SearchMemoryInput): Promise<CallToolResult> {
  // Validate input
  const validation = ValidationService.validateSearchInput(args);
  if (!validation.isValid) {
    return ValidationService.createErrorResponse(validation.errors);
  }

  let memories = await searchMemories(args.query, args.limit);

  // Apply post-search filters
  if (args.tags && args.tags.length > 0) {
    memories = memories.filter(m => args.tags!.every(t => m.tags.includes(t)));
  }

  if (args.dateRange) {
    const start = args.dateRange.start ? new Date(args.dateRange.start).getTime() : 0;
    const end = args.dateRange.end ? new Date(args.dateRange.end).getTime() : Infinity;
    memories = memories.filter(m => {
      const date = new Date(m.date).getTime();
      return date >= start && date <= end;
    });
  }

  logger.info('Searched memories', { query: args.query, results: memories.length }, 'ManagementTools');

  const result: SearchMemoryResult = {
    memories,
    message: `Found ${memories.length} relevant memories`
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }
    ]
  };
}

async function handleListMemories(): Promise<CallToolResult> {
  const memories = await listMemories();

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(memories, null, 2)
      }
    ]
  };
}

async function handleAddDocument(args: AddDocumentInput): Promise<CallToolResult> {
  // Validate input
  const validation = ValidationService.validateDocumentInput(args);
  if (!validation.isValid) {
    return ValidationService.createErrorResponse(validation.errors);
  }

  const document = {
    id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: args.title,
    content: args.content,
    active: true
  };

  await saveDocument(document);

  const result: AddDocumentResult = {
    success: true,
    documentId: document.id,
    message: `Document saved with ID ${document.id}`
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }
    ]
  };
}

async function handleSearchDocuments(args: SearchDocumentsInput): Promise<CallToolResult> {
  // Validate input
  const validation = ValidationService.validateDocumentSearchInput(args);
  if (!validation.isValid) {
    return ValidationService.createErrorResponse(validation.errors);
  }

  const snippets = await searchDocuments([], args.query);

  const result: SearchDocumentsResult = {
    documents: [],
    snippets,
    message: `Found ${snippets.length} relevant document snippets`
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }
    ]
  };
}

async function handleListDocuments(): Promise<CallToolResult> {
  const documents = await listDocuments();

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(documents, null, 2)
      }
    ]
  };
}

async function handleTrackPredictionOutcome(args: any): Promise<CallToolResult> {
  const { predictionId, actualOutcome, actualTimeline, notes } = args;

  if (!predictionId || actualOutcome === undefined) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: predictionId and actualOutcome are required'
        }
      ]
    };
  }

  try {
    await predictionTrackingService.recordOutcome(
      predictionId,
      actualOutcome,
      actualTimeline,
      notes
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Outcome recorded for prediction ${predictionId}`,
            actualOutcome,
            timestamp: new Date().toISOString()
          }, null, 2)
        }
      ]
    };
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

async function handleGetPredictionStats(): Promise<CallToolResult> {
  try {
    const report = predictionTrackingService.generateTrackingReport();

    return {
      content: [
        {
          type: 'text',
          text: report
        }
      ]
    };
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

async function handleSuggestPersonas(args: any): Promise<CallToolResult> {
  const { topic, context, mode, maxBots } = args;

  if (!topic) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: topic is required'
        }
      ]
    };
  }

  try {
    const result = await personaSuggestionService.suggestPersonas({
      topic,
      context,
      mode,
      maxBots
    });

    // Format for display
    const display = {
      suggestions: result.suggestions.map(s => ({
        botId: s.botId,
        name: s.botName,
        confidence: `${(s.confidence * 100).toFixed(0)}%`,
        reasoning: s.reasoning
      })),
      teamScore: `${(result.score * 100).toFixed(0)}%`,
      reasoning: result.reasoning,
      composition: {
        specialists: result.teamComposition.specialists.map(b => b.name),
        generalists: result.teamComposition.generalists.map(b => b.name),
        perspectives: result.teamComposition.perspectives
      }
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(display, null, 2)
        }
      ]
    };
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

async function handleValidatePersonas(args: any): Promise<CallToolResult> {
  const { botIds } = args;

  if (!botIds || !Array.isArray(botIds)) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: botIds array is required'
        }
      ]
    };
  }

  try {
    const validation = personaSuggestionService.validatePersonaSelection(botIds);

    const display = {
      valid: validation.valid,
      score: validation.score,
      percentage: `${validation.score}%`,
      feedback: validation.feedback
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(display, null, 2)
        }
      ]
    };
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

async function handleGetCostReport(args: any): Promise<CallToolResult> {
  const { days = 30 } = args;

  try {
    const report = costTrackingService.generateCostReport(days);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(report, null, 2)
        }
      ]
    };
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

async function handleGetSessionCost(args: any): Promise<CallToolResult> {
  const { sessionId } = args;

  if (!sessionId) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: sessionId is required'
        }
      ]
    };
  }

  try {
    const summary = costTrackingService.getSessionCostSummary(sessionId);

    if (!summary) {
      return {
        content: [
          {
            type: 'text',
            text: `No cost data found for session ${sessionId}`
          }
        ]
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(summary, null, 2)
        }
      ]
    };
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

async function handleSetBudgetAlert(args: any): Promise<CallToolResult> {
  const { alertId, threshold } = args;

  if (!alertId || threshold === undefined) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: alertId and threshold are required'
        }
      ]
    };
  }

  try {
    costTrackingService.setBudgetAlert(alertId, threshold);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            alertId,
            threshold,
            message: `Budget alert "${alertId}" set to $${threshold}`
          }, null, 2)
        }
      ]
    };
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

async function handleGetCurrentSpend(): Promise<CallToolResult> {
  try {
    const totalCost = costTrackingService.getCurrentTotalCost();
    const totalTokens = costTrackingService.getCurrentTotalTokens();

    const trends = costTrackingService.getCostTrends(7);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            totalCost: `$${totalCost.toFixed(4)}`,
            totalTokens,
            dailyUsage: trends,
            timestamp: new Date().toISOString()
          }, null, 2)
        }
      ]
    };
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

async function handleListTemplates(args: any): Promise<CallToolResult> {
  const { category, search } = args;

  try {
    let templates;

    if (search) {
      templates = sessionTemplateService.searchTemplates(search);
    } else if (category) {
      templates = sessionTemplateService.getTemplatesByCategory(category as any);
    } else {
      templates = sessionTemplateService.getAllTemplates();
    }

    const categories = sessionTemplateService.getCategories();

    const display = {
      templates: templates.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        mode: t.mode,
        tags: t.tags,
        icon: t.icon,
        recommendedTopics: t.recommendedTopics.slice(0, 3) // Show first 3
      })),
      categories,
      count: templates.length
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(display, null, 2)
        }
      ]
    };
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

async function handleGetTemplate(args: any): Promise<CallToolResult> {
  const { templateId } = args;

  if (!templateId) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: templateId is required'
        }
      ]
    };
  }

  try {
    const template = sessionTemplateService.getTemplate(templateId);

    if (!template) {
      return {
        content: [
          {
            type: 'text',
            text: `Template ${templateId} not found`
          }
        ]
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(template, null, 2)
        }
      ]
    };
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

async function handleApplyTemplate(args: any): Promise<CallToolResult> {
  const { templateId, customizations } = args;

  if (!templateId) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: templateId is required'
        }
      ]
    };
  }

  try {
    const settings = sessionTemplateService.applyTemplate(templateId, customizations);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            templateId,
            settings,
            message: `Template "${templateId}" applied successfully`
          }, null, 2)
        }
      ]
    };
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

async function handleSuggestTemplates(args: any): Promise<CallToolResult> {
  const { topic } = args;

  if (!topic) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: topic is required'
        }
      ]
    };
  }

  try {
    const suggestions = sessionTemplateService.suggestTemplatesForTopic(topic);

    const display = {
      topic,
      suggestions: suggestions.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        mode: t.mode,
        relevance: 'Recommended',
        icon: t.icon
      })),
      count: suggestions.length
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(display, null, 2)
        }
      ]
    };
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

// ============================================================================
// Export Service Handlers
// ============================================================================

async function handleExportReport(args: any): Promise<CallToolResult> {
  const { itemId, title, description, type, data, format, includeMetadata, includeCharts } = args;

  try {
    const result = await exportService.exportItem(
      {
        id: itemId,
        title,
        description,
        type,
        data,
        timestamp: Date.now()
      },
      {
        format,
        includeMetadata,
        includeCharts
      }
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
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

async function handleExportTestSuite(args: any): Promise<CallToolResult> {
  const { testData, format } = args;

  try {
    const result = await exportService.generateTestSuiteReport(testData, format);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
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

async function handleExportAnalytics(args: any): Promise<CallToolResult> {
  const { analyticsData, format } = args;

  try {
    const result = await exportService.exportAnalyticsReport(analyticsData, format);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
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

async function handleExportSession(args: any): Promise<CallToolResult> {
  const { sessionData, format } = args;

  try {
    const result = await exportService.exportSession(sessionData, format);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
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

async function handleExportPredictions(args: any): Promise<CallToolResult> {
  const { predictionData, format } = args;

  try {
    const result = await exportService.exportPredictions(predictionData, format);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
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

async function handleExportPersonas(args: any): Promise<CallToolResult> {
  const { personaData, format } = args;

  try {
    const result = await exportService.exportPersonaReport(personaData, format);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
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

async function handleExportLearning(args: any): Promise<CallToolResult> {
  const { learningData, format } = args;

  try {
    const result = await exportService.exportLearningReport(learningData, format);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
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

async function handleExportBatch(args: any): Promise<CallToolResult> {
  const { items, format } = args;

  try {
    const result = await exportService.exportBatch(items, {
      format,
      includeMetadata: true
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
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

async function handleExportCustom(args: any): Promise<CallToolResult> {
  const { title, subtitle, sections, metadata, format } = args;

  try {
    const result = await exportService.generateCustomReport(
      {
        title,
        subtitle,
        sections: sections.map((s: any, i: number) => ({
          title: s.title,
          content: s.content,
          order: i
        })),
        metadata: metadata || {}
      },
      format
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
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
