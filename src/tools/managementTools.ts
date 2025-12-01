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
