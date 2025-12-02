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
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }));
  process.exit(0);
}

// Enhanced server logging
const logServer = {
  startTime: Date.now(),
  requestCount: 0,
  toolCallCount: 0,

  logStartup() {
    console.error('╔════════════════════════════════════════════════════════════╗');
    console.error('║         AI Council Chamber MCP Server                      ║');
    console.error('║         Version 1.0.0 - Standalone Mode                   ║');
    console.error('╚════════════════════════════════════════════════════════════╝');
    console.error('');
    console.error(`[SERVER] Starting initialization...`);
    console.error(`[SERVER] Node.js: ${process.version}`);
    console.error(`[SERVER] Platform: ${process.platform} ${process.arch}`);
    console.error(`[SERVER] PID: ${process.pid}`);
  },

  logInitialization() {
    console.error('');
    console.error('[SERVER] ✓ Session service initialized');
    console.error('[SERVER] ✓ AI service initialized');
    console.error('[SERVER] ✓ Council orchestrator ready');
  },

  logTools(tools: any[]) {
    console.error('');
    console.error(`[SERVER] Tools registered: ${tools.length}`);
    console.error(`[SERVER]   - Council Session Tools: ${tools.filter(t => t.name.startsWith('council_') && !['list', 'get', 'stop', 'pause', 'diagnostics'].some(a => t.name.includes(a))).length}`);
    console.error(`[SERVER]   - Session Management: ${tools.filter(t => ['council_list_sessions', 'council_get_session', 'council_get_transcript', 'council_stop_session', 'council_pause_session'].includes(t.name)).length}`);
    console.error(`[SERVER]   - Bot Management: ${tools.filter(t => t.name.includes('bot') || t.name.includes('memory') || t.name.includes('document')).length}`);
    console.error(`[SERVER]   - System Tools: ${tools.filter(t => ['council_diagnostics', 'council_auto'].includes(t.name)).length}`);
  },

  logReady() {
    const uptime = ((Date.now() - this.startTime) / 1000).toFixed(2);
    console.error('');
    console.error('╔════════════════════════════════════════════════════════════╗');
    console.error('║                 SERVER READY                                ║');
    console.error('╚════════════════════════════════════════════════════════════╝');
    console.error(`[SERVER] Initialization complete in ${uptime}s`);
    console.error(`[SERVER] Waiting for MCP requests on STDIO...`);
    console.error(`[SERVER] Log level: ERROR (use console.error for output)`);
    console.error('');
  },

  logRequest(type: string, details?: any) {
    this.requestCount++;
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [SERVER] Request #${this.requestCount}: ${type}`);
    if (details) {
      console.error(`[SERVER]   Details:`, JSON.stringify(details, null, 2).split('\n').map(l => '   ' + l).join('\n'));
    }
  },

  logToolCall(name: string, args?: any, duration?: number) {
    this.toolCallCount++;
    const timestamp = new Date().toISOString();
    console.error('');
    console.error(`[${timestamp}] [TOOL CALL #${this.toolCallCount}] ${name}`);
    if (duration) {
      console.error(`[TOOL] Duration: ${duration}ms`);
    }
    if (args && Object.keys(args).length > 0) {
      const argStr = JSON.stringify(args, null, 2).split('\n').map(l => '   ' + l).join('\n');
      console.error(`[TOOL] Arguments:\n${argStr}`);
    }
  },

  logToolComplete(name: string, result?: any, duration?: number) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [TOOL COMPLETE] ${name}`);
    if (duration) {
      console.error(`[TOOL] Total Duration: ${duration}ms`);
    }
    if (result && result.content && result.content[0] && result.content[0].text) {
      const text = result.content[0].text;
      const preview = text.length > 200 ? text.substring(0, 200) + '...' : text;
      console.error(`[TOOL] Result preview:\n   ${preview.replace(/\n/g, '\n   ')}`);
    }
    console.error('');
  },

  logConnection(status: string) {
    console.error(`[SERVER] Connection status: ${status}`);
  },

  logHeartbeat() {
    const memUsage = process.memoryUsage();
    const sessions = sessionService.listSessions();
    const timestamp = new Date().toLocaleTimeString();

    console.error(`[${timestamp}] [HEARTBEAT] Requests: ${this.requestCount} | Tools: ${this.toolCallCount} | Sessions: ${sessions.length} | Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
  },

  logSession(sessionId: string, action: string, status?: string) {
    console.error(`[SESSION ${sessionId.substring(0, 8)}] ${action}${status ? ' - Status: ' + status : ''}`);
  },

  logError(error: any, context?: string) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${context || 'Server Error'}: ${error.message || error}`);
    if (error.stack && process.env.NODE_ENV !== 'production') {
      console.error(`[ERROR] Stack:`, error.stack);
    }
  }
};

// Log server start
logServer.logStartup();

// Initialize session service and load persisted sessions
await sessionService.initialize();

// Initialize services
const aiService = new AIService(DEFAULT_SETTINGS.providers);
const orchestrator = new CouncilOrchestrator(aiService);

logServer.logInitialization();

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

logServer.logTools(allTools);

server.setRequestHandler(InitializeRequestSchema, async (request: any) => {
  logServer.logRequest('initialize', { clientInfo: request?.params?.clientInfo });
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

server.setRequestHandler(ListToolsRequestSchema, async (request: any) => {
  logServer.logRequest('list_tools', { toolCount: allTools.length });
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
  const startTime = Date.now();
  const requestId = request?.id || 'unknown';

  // Get session ID from args if available
  const sessionId = (args as any)?.sessionId;

  // Log tool call
  logServer.logToolCall(name, { requestId, sessionId, ...typedArgs });

  // Wrap tool execution with error handling
  return await errorHandler.wrap(
    async () => {
      // @ts-ignore - CallToolResult type from MCP SDK
      let result: any;

      // Route to appropriate tool handler
      if (name.startsWith('council_')) {
        // Session tools (council_proposal, council_deliberation, etc.)
        const sessionToolPatterns = [
          'council_proposal',
          'council_deliberation',
          'council_inquiry',
          'council_research',
          'council_swarm',
          'council_swarm_coding',
          'council_prediction'
        ];

        // Management tools (everything else council_*)
        if (name === 'council_auto') {
          result = await handleAutoSessionToolCall(name, typedArgs, orchestrator);
        } else if (sessionToolPatterns.includes(name)) {
          result = await handleCouncilToolCall(name, typedArgs, orchestrator);
        } else {
          // All other council_ tools are management tools
          result = await handleManagementToolCall(name, typedArgs);
        }
      } else {
        throw new Error(`Unknown tool: ${name}`);
      }

      const duration = Date.now() - startTime;
      logServer.logToolComplete(name, result, duration);
      return result;
    },
    {
      toolName: name,
      sessionId,
      context: {
        requestId: requestId,
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
  logServer.logConnection('connected');
  logServer.logReady();
}

main().catch((error) => {
  logServer.logError(error, 'Fatal error in main()');
  process.exit(1);
});

// Set up periodic heartbeat (every 60 seconds)
setInterval(() => {
  logServer.logHeartbeat();
}, 60000);

// Log server shutdown
process.on('SIGINT', () => {
  console.error('');
  console.error('[SERVER] Received SIGINT, shutting down gracefully...');
  const uptime = ((Date.now() - logServer.startTime) / 1000).toFixed(2);
  console.error(`[SERVER] Total uptime: ${uptime}s`);
  console.error(`[SERVER] Total requests: ${logServer.requestCount}`);
  console.error(`[SERVER] Total tool calls: ${logServer.toolCallCount}`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('[SERVER] Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});
