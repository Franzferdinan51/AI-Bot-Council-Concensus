import 'dotenv/config';
import http from 'http';
import { DEFAULT_SETTINGS } from './types/constants.js';
import { AIService } from './services/aiService.js';
import { CouncilOrchestrator } from './services/councilOrchestrator.js';
import { sessionService } from './services/sessionService.js';
import { createCouncilSessionTools, handleCouncilToolCall } from './tools/councilSessionTools.js';
import { createManagementTools, handleManagementToolCall } from './tools/managementTools.js';
import { createAutoSessionTools, handleAutoSessionToolCall } from './tools/autoSessionTools.js';
import { errorHandler } from './services/errorHandler.js';

const PORT = Number(process.env.HTTP_PORT || 4000);

function loadProviderSettings() {
  return {
    ...DEFAULT_SETTINGS.providers,
    geminiApiKey: process.env.GEMINI_API_KEY || DEFAULT_SETTINGS.providers.geminiApiKey,
    openRouterKey: process.env.OPENROUTER_API_KEY || DEFAULT_SETTINGS.providers.openRouterKey,
    genericOpenAIKey: process.env.GENERIC_OPENAI_API_KEY || DEFAULT_SETTINGS.providers.genericOpenAIKey,
    genericOpenAIEndpoint: process.env.GENERIC_OPENAI_ENDPOINT || DEFAULT_SETTINGS.providers.genericOpenAIEndpoint,
    lmStudioEndpoint: process.env.LM_STUDIO_ENDPOINT || DEFAULT_SETTINGS.providers.lmStudioEndpoint,
    ollamaEndpoint: process.env.OLLAMA_ENDPOINT || DEFAULT_SETTINGS.providers.ollamaEndpoint,
    janAiEndpoint: process.env.JAN_AI_ENDPOINT || DEFAULT_SETTINGS.providers.janAiEndpoint,
    zaiApiKey: process.env.ZAI_API_KEY || DEFAULT_SETTINGS.providers.zaiApiKey,
    zaiEndpoint: process.env.ZAI_ENDPOINT || DEFAULT_SETTINGS.providers.zaiEndpoint,
    moonshotApiKey: process.env.MOONSHOT_API_KEY || DEFAULT_SETTINGS.providers.moonshotApiKey,
    moonshotEndpoint: process.env.MOONSHOT_ENDPOINT || DEFAULT_SETTINGS.providers.moonshotEndpoint,
    minimaxApiKey: process.env.MINIMAX_API_KEY || DEFAULT_SETTINGS.providers.minimaxApiKey,
    minimaxEndpoint: process.env.MINIMAX_ENDPOINT || DEFAULT_SETTINGS.providers.minimaxEndpoint
  };
}

async function bootstrap() {
  await sessionService.initialize();

  const settings = {
    ...DEFAULT_SETTINGS,
    providers: loadProviderSettings(),
    bots: DEFAULT_SETTINGS.bots.map(b => ({ ...b }))
  };

  const aiService = new AIService(settings.providers);
  const orchestrator = new CouncilOrchestrator(aiService);

  const allTools = [
    ...createCouncilSessionTools(orchestrator),
    ...createManagementTools(),
    ...createAutoSessionTools(orchestrator)
  ];

  const server = http.createServer(async (req, res) => {
    try {
      if (!req.url) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Bad request' }));
        return;
      }

      if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', server: 'ai-council-mcp-server', version: '1.0.0' }));
        return;
      }

      if (req.method === 'GET' && req.url === '/list-tools') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          tools: allTools.map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema
          }))
        }, null, 2));
        return;
      }

      if (req.method === 'POST' && req.url === '/call-tool') {
        const body = await readJsonBody(req);
        const { name, arguments: args } = body || {};

        if (!name) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'name is required' }));
          return;
        }

        const sessionId = args?.sessionId;

        const result = await errorHandler.wrap(
          async () => {
            if (name === 'council_list_bots' ||
                name === 'council_update_bot' ||
                name === 'council_add_memory' ||
                name === 'council_search_memories' ||
                name === 'council_list_memories' ||
                name === 'council_add_document' ||
                name === 'council_search_documents' ||
                name === 'council_list_documents') {
              return await handleManagementToolCall(name, args);
            }
            if (name === 'council_auto') {
              return await handleAutoSessionToolCall(name, args, orchestrator);
            }
            return await handleCouncilToolCall(name, args, orchestrator);
          },
          {
            toolName: name,
            sessionId,
            context: { requestId: 'http-bridge', arguments: args },
            fallback: errorHandler.createErrorResponse(name, 'Tool execution failed', { sessionId, toolName: name })
          }
        );

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result, null, 2));
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message || 'Internal error' }));
    }
  });

  server.listen(PORT, () => {
    console.error(`[HTTP Bridge] Listening on http://localhost:${PORT}`);
  });
}

function readJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

bootstrap().catch(err => {
  console.error('[HTTP Bridge] Failed to start:', err);
  process.exit(1);
});

