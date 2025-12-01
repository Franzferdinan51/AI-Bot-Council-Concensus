import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  InitializeRequestSchema,
  InitializeResultSchema,
  ListToolsRequestSchema,
  ListToolsResultSchema,
  CallToolRequestSchema,
  CallToolResultSchema
} from '@modelcontextprotocol/sdk/types.js';
import { AIService } from './services/aiService.js';
import { CouncilOrchestrator } from './services/councilOrchestrator.js';
import { sessionService } from './services/sessionService.js';
import { errorHandler } from './services/errorHandler.js';
import { createCouncilSessionTools, handleCouncilToolCall } from './tools/councilSessionTools.js';
import { createManagementTools, handleManagementToolCall } from './tools/managementTools.js';
import { createAutoSessionTools, handleAutoSessionToolCall } from './tools/autoSessionTools.js';
import { DEFAULT_SETTINGS } from './types/constants.js';
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';

// Lightweight health check flag
if (process.argv.includes('--health')) {
  console.log(JSON.stringify({
    status: 'ok',
    server: 'ai-council-mcp-server',
    version: '1.0.0'
  }));
  process.exit(0);
}

// Initialize session service and load persisted sessions
await sessionService.initialize();

// Initialize services
const aiService = new AIService(DEFAULT_SETTINGS.providers);
const orchestrator = new CouncilOrchestrator(aiService);

const server = new Server(
  {
    name: 'ai-council-mcp-server',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Register all tools
const allTools = [
  ...createCouncilSessionTools(orchestrator),
  ...createManagementTools(),
  ...createAutoSessionTools(orchestrator)
];

server.setRequestHandler(InitializeRequestSchema, async () => {
  return {
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: {}
    },
    serverInfo: {
      name: 'ai-council-mcp-server',
      version: '1.0.0'
    }
  };
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: allTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }))
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest | any) => {
  const { name, arguments: args } = request.params as { name: string; arguments?: Record<string, unknown> };
  const typedArgs = args as any;

  console.error(`[AI Council MCP] Tool called: ${name}`);

  // Get session ID from args if available
  const sessionId = (args as any)?.sessionId;

  // Wrap tool execution with error handling
  return await errorHandler.wrap(
    async () => {
      // @ts-ignore - CallToolResult type from MCP SDK
      let result: any;

      // Route to appropriate tool handler
      if (name.startsWith('council_')) {
        if (name === 'council_list_bots' ||
            name === 'council_update_bot' ||
            name === 'council_add_memory' ||
            name === 'council_search_memories' ||
            name === 'council_list_memories' ||
            name === 'council_add_document' ||
            name === 'council_search_documents' ||
            name === 'council_list_documents') {
          result = await handleManagementToolCall(name, typedArgs);
        } else if (name === 'council_auto') {
          result = await handleAutoSessionToolCall(name, typedArgs, orchestrator);
        } else {
          result = await handleCouncilToolCall(name, typedArgs, orchestrator);
        }
      } else {
        throw new Error(`Unknown tool: ${name}`);
      }

      console.error(`[AI Council MCP] Tool completed: ${name}`);
      return result;
    },
    {
      toolName: name,
      sessionId,
      context: {
        requestId: (request as any).id,
        arguments: args
      },
      fallback: errorHandler.createErrorResponse(
        name,
        'Tool execution failed',
        { sessionId, toolName: name }
      )
    }
  ) || errorHandler.createErrorResponse(
    name,
    'Tool execution failed',
    { sessionId, toolName: name }
  );
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('AI Council MCP Server started');
}

main().catch((error) => {
  console.error('Fatal error starting server:', error);
  process.exit(1);
});
