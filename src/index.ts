import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  InitializeRequestSchema,
  InitializeResultSchema,
  ListToolsRequestSchema,
  ListToolsResultSchema,
  CallToolRequestSchema,
  CallToolResultSchema,
  CallToolResult
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
import { logger } from './services/logger.js';
import { councilEventBus } from './services/councilEventBus.js';

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

// Override console methods to redirect to structured logger
// This ensures all logs are captured for diagnostics and directed to stderr to protect MCP protocol
logger.overrideConsole();

// Helper for raw output to bypass logger override
function rawLog(message: string) {
  process.stderr.write(message + '\n');
}

// Enhanced server logging
const logServer = {
  startTime: Date.now(),
  requestCount: 0,
  toolCallCount: 0,

  logStartup() {
    rawLog('╔════════════════════════════════════════════════════════════╗');
    rawLog('║         AI Council Chamber MCP Server                      ║');
    rawLog('║         Version 1.0.0 - Standalone Mode                   ║');
    rawLog('╚════════════════════════════════════════════════════════════╝');
    rawLog('');
    rawLog(`[SERVER] Starting initialization...`);
    rawLog(`[SERVER] Node.js: ${process.version}`);
    rawLog(`[SERVER] Platform: ${process.platform} ${process.arch}`);
    rawLog(`[SERVER] PID: ${process.pid}`);
  },

  logInitialization() {
    rawLog('');
    rawLog('[SERVER] ✓ Session service initialized');
    rawLog('[SERVER] ✓ AI service initialized');
    rawLog('[SERVER] ✓ Council orchestrator ready');
  },

  logTools(tools: any[]) {
    rawLog('');
    rawLog(`[SERVER] Tools registered: ${tools.length}`);
    rawLog(`[SERVER]   - Council Session Tools: ${tools.filter(t => t.name.startsWith('council_') && !['list', 'get', 'stop', 'pause', 'diagnostics'].some(a => t.name.includes(a))).length}`);
    rawLog(`[SERVER]   - Session Management: ${tools.filter(t => ['council_list_sessions', 'council_get_session', 'council_get_transcript', 'council_stop_session', 'council_pause_session'].includes(t.name)).length}`);
    rawLog(`[SERVER]   - Bot Management: ${tools.filter(t => t.name.includes('bot') || t.name.includes('memory') || t.name.includes('document')).length}`);
    rawLog(`[SERVER]   - System Tools: ${tools.filter(t => ['council_diagnostics', 'council_auto'].includes(t.name)).length}`);
  },

  logReady() {
    const uptime = ((Date.now() - this.startTime) / 1000).toFixed(2);
    rawLog('');
    rawLog('╔════════════════════════════════════════════════════════════╗');
    rawLog('║                 SERVER READY                                ║');
    rawLog('╚════════════════════════════════════════════════════════════╝');
    rawLog(`[SERVER] Initialization complete in ${uptime}s`);
    rawLog(`[SERVER] Waiting for MCP requests on STDIO...`);
    rawLog(`[SERVER] Log level: ERROR (use console.error for output)`);
    rawLog('');
  },

  logRequest(type: string, details?: any) {
    this.requestCount++;
    const timestamp = new Date().toISOString();
    rawLog(`[${timestamp}] [SERVER] Request #${this.requestCount}: ${type}`);
    if (details) {
      rawLog(`[SERVER]   Details:\n${JSON.stringify(details, null, 2).split('\n').map(l => '   ' + l).join('\n')}`);
    }
  },

  logToolCall(name: string, args?: any, duration?: number) {
    this.toolCallCount++;
    const timestamp = new Date().toISOString();

    // Enhanced logging with more details
    rawLog('');
    rawLog('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
    rawLog(`┃ [TOOL CALL #${this.toolCallCount}] ${name.padEnd(44)} ┃`);
    rawLog('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');
    rawLog(`[TOOL] Timestamp: ${timestamp}`);
    rawLog(`[TOOL] Request ID: ${args?.requestId || 'N/A'}`);

    // Log session ID if present
    if (args?.sessionId) {
      rawLog(`[TOOL] Session ID: ${args.sessionId}`);
    }

    // Log key arguments based on tool type
    if (args?.topic) {
      rawLog(`[TOOL] Topic: ${args.topic.substring(0, 100)}${args.topic.length > 100 ? '...' : ''}`);
    }

    // Log userPrompt if present
    if (args?.userPrompt) {
      rawLog(`[TOOL] User Prompt: ${args.userPrompt.substring(0, 100)}${args.userPrompt.length > 100 ? '...' : ''}`);
    }

    // Log settings
    if (args?.settings) {
      rawLog(`[TOOL] Settings:`);
      if (args.settings.bots) {
        const enabledBots = args.settings.bots.filter((b: any) => b.enabled).map((b: any) => b.id);
        rawLog(`[TOOL]   - Enabled Bots: ${enabledBots.length > 0 ? enabledBots.join(', ') : 'default'}`);
      }
      if (args.settings.economyMode !== undefined) {
        rawLog(`[TOOL]   - Economy Mode: ${args.settings.economyMode}`);
      }
      if (args.settings.maxConcurrentRequests) {
        rawLog(`[TOOL]   - Max Concurrent: ${args.settings.maxConcurrentRequests}`);
      }
      if (args.settings.domain) {
        rawLog(`[TOOL]   - Domain: ${args.settings.domain}`);
      }
      if (args.settings.timeframe) {
        rawLog(`[TOOL]   - Timeframe: ${args.settings.timeframe}`);
      }
    }

    // Log context if present
    if (args?.context) {
      rawLog(`[TOOL] Context: ${args.context.substring(0, 150)}${args.context.length > 150 ? '...' : ''}`);
    }

    if (duration) {
      rawLog(`[TOOL] Duration: ${duration}ms`);
    }

    // Full arguments (if needed, use format from original)
    if (args && Object.keys(args).length > 0 && !args.topic && !args.userPrompt) {
      const argStr = JSON.stringify(args, null, 2).split('\n').map(l => '   ' + l).join('\n');
      rawLog(`[TOOL] Arguments:\n${argStr}`);
    }

    rawLog('');

    // Also log to structured logger
    logger.tool(name, args?.sessionId, 'started', undefined, {
      requestId: args?.requestId,
      topic: args?.topic,
      settings: args?.settings,
      context: args?.context,
      userPrompt: args?.userPrompt
    });

    // Emit event for Web UI
    councilEventBus.emitEvent('tool_call', args?.sessionId || 'system', {
      name,
      requestId: args?.requestId,
      args: args
    });
  },

  logToolComplete(name: string, result?: any, duration?: number) {
    const timestamp = new Date().toISOString();
    rawLog('');
    rawLog('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
    rawLog(`┃ [TOOL COMPLETE] ${name.padEnd(41)} ┃`);
    rawLog('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');
    rawLog(`[TOOL] Timestamp: ${timestamp}`);

    if (duration) {
      rawLog(`[TOOL] Total Duration: ${duration}ms`);
    }

    // Log result summary based on content type
    if (result && result.content && result.content[0] && result.content[0].text) {
      const text = result.content[0].text;

      // Check if it's an error
      if (text.startsWith('Error:')) {
        rawLog(`[TOOL] Status: ❌ FAILED`);
        rawLog(`[TOOL] Error: ${text.substring(0, 300)}${text.length > 300 ? '...' : ''}`);
      } else {
        rawLog(`[TOOL] Status: ✅ SUCCESS`);
        const preview = text.length > 400 ? text.substring(0, 400) + '...' : text;
        rawLog(`[TOOL] Result preview:\n   ${preview.replace(/\n/g, '\n   ')}`);
      }
    }

    // Log structured data if available
    if (result && result.content && result.content.length > 1) {
      rawLog(`[TOOL] Additional data: ${result.content.length - 1} additional item(s)`);
    }

    rawLog('');

    // Also log to structured logger
    const isError = result && result.content && result.content[0] && result.content[0].text && result.content[0].text.startsWith('Error:');
    logger.tool(name, result?.content?.[0]?.text?.includes('session-') ? result.content[0].text.match(/session-[0-9]+/)?.[0] : undefined, isError ? 'error' : 'completed', duration, {
      status: isError ? 'failed' : 'success',
      resultType: result?.content?.length || 0
    });

    // Emit event for Web UI
    councilEventBus.emitEvent('tool_complete', 'system', {
      name,
      duration,
      status: isError ? 'failed' : 'success',
      resultPreview: result?.content?.[0]?.text?.substring(0, 200)
    });
  },

  logConnection(status: string) {
    rawLog(`[SERVER] Connection status: ${status}`);
  },

  logHeartbeat() {
    const memUsage = process.memoryUsage();
    const sessions = sessionService.listSessions();
    const timestamp = new Date().toLocaleTimeString();

    rawLog('');
    rawLog('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
    rawLog('┃ [HEARTBEAT] Server Health Check                            ┃');
    rawLog('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');
    rawLog(`[HEARTBEAT] Timestamp: ${timestamp}`);
    rawLog(`[HEARTBEAT] Total Requests: ${this.requestCount}`);
    rawLog(`[HEARTBEAT] Tool Calls: ${this.toolCallCount}`);
    rawLog(`[HEARTBEAT] Active Sessions: ${sessions.length}`);
    rawLog(`[HEARTBEAT] Memory Usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
    rawLog(`[HEARTBEAT] Uptime: ${((Date.now() - this.startTime) / 1000 / 60).toFixed(1)} minutes`);
    rawLog('');

    // Log to structured logger
    logger.info('Server heartbeat', {
      requestCount: this.requestCount,
      toolCallCount: this.toolCallCount,
      activeSessions: sessions.length,
      memoryMB: Math.round(memUsage.heapUsed / 1024 / 1024),
      uptimeMinutes: ((Date.now() - this.startTime) / 1000 / 60).toFixed(1)
    }, 'Server');
  },

  logSession(sessionId: string, action: string, status?: string) {
    rawLog(`[SESSION ${sessionId.substring(0, 8)}] ${action}${status ? ' - Status: ' + status : ''}`);
  },

  logError(error: any, context?: string) {
    const timestamp = new Date().toISOString();
    rawLog(`[${timestamp}] [ERROR] ${context || 'Server Error'}: ${error.message || error}`);
    if (error.stack && process.env.NODE_ENV !== 'production') {
      rawLog(`[ERROR] Stack:\n${error.stack}`);
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

// Inject AI Service into PersonaSuggestionService
import { personaSuggestionService } from './services/personaSuggestionService.js';
personaSuggestionService.setAIService(aiService);

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
      let result: CallToolResult;

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
          'council_prediction',
          'council_advisory',
          'council_list_sessions',
          'council_get_session',
          'council_get_transcript',
          'council_stop_session',
          'council_pause_session',
          'council_diagnostics'
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

import { startHttpServer } from './httpBridge.js';

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logServer.logConnection('connected');

  // Start HTTP Server for Web UI and n8n
  const httpPort = Number(process.env.HTTP_PORT || 4000);
  try {
    await startHttpServer(orchestrator, allTools, httpPort);
    logServer.logReady();
    console.error(`[SERVER] HTTP Bridge active on port ${httpPort}`);
  } catch (err) {
    console.error(`[SERVER] Failed to start HTTP Bridge: ${err}`);
  }
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
