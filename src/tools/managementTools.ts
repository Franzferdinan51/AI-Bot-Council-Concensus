import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import {
  ListBotsResult,
  UpdateBotInput,
  UpdateBotResult,
  AddMemoryInput,
  AddMemoryResult,
  SearchMemoryInput,
  SearchMemoryResult,
  AddDocumentInput,
  AddDocumentResult,
  SearchDocumentsInput,
  SearchDocumentsResult
} from '../types/index.js';
import { getBotsWithCustomConfigs } from '../types/constants.js';
import { listMemories, saveMemory, searchMemories } from '../services/knowledgeService.js';
import { listDocuments, saveDocument, searchDocuments } from '../services/knowledgeService.js';
import { ValidationService } from '../services/validationService.js';
import { predictionTrackingService } from '../services/predictionTrackingService.js';
import { personaSuggestionService } from '../services/personaSuggestionService.js';

export function createManagementTools(): any[] {
  return [
    {
      name: 'council_list_bots',
      description: 'List all available councilor bots and their configuration',
      inputSchema: {
        type: 'object',
        properties: {},
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
        return await handleListBots();
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

async function handleListBots(): Promise<CallToolResult> {
  const configuredBots = getBotsWithCustomConfigs();
  const result: ListBotsResult = {
    bots: configuredBots,
    message: `Found ${configuredBots.length} configured bots`
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

  const memory = {
    id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    topic: args.topic,
    content: args.content,
    date: new Date().toISOString(),
    tags: args.tags || []
  };

  await saveMemory(memory);

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

  const memories = await searchMemories(args.query, args.limit);

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
