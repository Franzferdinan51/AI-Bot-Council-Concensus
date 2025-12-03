import 'dotenv/config';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_SETTINGS } from './types/constants.js';
import { AIService } from './services/aiService.js';
import { CouncilOrchestrator } from './services/councilOrchestrator.js';
import { sessionService } from './services/sessionService.js';
import { createCouncilSessionTools, handleCouncilToolCall } from './tools/councilSessionTools.js';
import { createManagementTools, handleManagementToolCall } from './tools/managementTools.js';
import { createAutoSessionTools, handleAutoSessionToolCall } from './tools/autoSessionTools.js';
import { errorHandler } from './services/errorHandler.js';
import { logger } from './services/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, '../public');

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
    minimaxEndpoint: process.env.MINIMAX_ENDPOINT || DEFAULT_SETTINGS.providers.minimaxEndpoint,
    searchProvider: process.env.SEARCH_PROVIDER || 'duckduckgo',
    braveApiKey: process.env.BRAVE_API_KEY,
    tavilyApiKey: process.env.TAVILY_API_KEY,
    serperApiKey: process.env.SERPER_API_KEY
  };
}

export async function startHttpServer(
  orchestrator: CouncilOrchestrator,
  allTools: any[],
  port: number = 4000
) {
  const server = http.createServer(async (req, res) => {
    try {
      if (!req.url) return;

      // Enable CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      const url = new URL(req.url, `http://${req.headers.host}`);
      const pathname = url.pathname;

      // API Routes
      if (pathname.startsWith('/api/')) {
        if (req.method === 'GET' && pathname === '/api/system') {
          const stats = {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            activeSessions: sessionService.listSessions().length,
            totalRequests: 0 // Placeholder
          };
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(stats));
          return;
        }

        if (req.method === 'GET' && pathname === '/api/logs') {
          const since = Number(url.searchParams.get('since') || 0);
          const logs = logger.getRecentLogs(100).filter(l => l.timestamp > since);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(logs));
          return;
        }

        if (req.method === 'GET' && pathname === '/api/config') {
          // Re-load settings to get latest
          const currentSettings = {
            ...DEFAULT_SETTINGS,
            providers: loadProviderSettings(),
            bots: DEFAULT_SETTINGS.bots
          };
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(currentSettings));
          return;
        }

        if (req.method === 'POST' && pathname === '/api/config') {
          const body = await readJsonBody(req);
          const providers = body.providers || {};

          try {
            // Map frontend keys to env vars
            const envUpdates: Record<string, string> = {};
            if (providers.geminiApiKey) envUpdates.GEMINI_API_KEY = providers.geminiApiKey;
            if (providers.openRouterKey) envUpdates.OPENROUTER_API_KEY = providers.openRouterKey;
            if (providers.searchProvider) envUpdates.SEARCH_PROVIDER = providers.searchProvider;
            if (providers.braveApiKey) envUpdates.BRAVE_API_KEY = providers.braveApiKey;
            if (providers.tavilyApiKey) envUpdates.TAVILY_API_KEY = providers.tavilyApiKey;
            if (providers.serperApiKey) envUpdates.SERPER_API_KEY = providers.serperApiKey;

            // Update .env file
            await updateEnvFile(envUpdates);

            // Reload local process.env for immediate effect
            Object.assign(process.env, envUpdates);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Configuration saved' }));
          } catch (err: any) {
            console.error('Failed to save config:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to save configuration' }));
          }
          return;
        }
      }

      // Existing Tool Routes
      if (req.method === 'GET' && pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', server: 'ai-council-mcp-server', version: '2.4.0' }));
        return;
      }

      if (req.method === 'GET' && pathname === '/list-tools') {
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

      if (req.method === 'POST' && pathname === '/call-tool') {
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
            const sessionToolPatterns = [
              'council_proposal',
              'council_deliberation',
              'council_inquiry',
              'council_research',
              'council_swarm',
              'council_swarm_coding',
              'council_prediction'
            ];

            if (name === 'council_auto') {
              return await handleAutoSessionToolCall(name, args, orchestrator);
            }
            else if (sessionToolPatterns.includes(name)) {
              return await handleCouncilToolCall(name, args, orchestrator);
            }
            else {
              return await handleManagementToolCall(name, args);
            }
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

      // Static File Serving
      let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

      // Prevent directory traversal
      if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        const contentTypes: Record<string, string> = {
          '.html': 'text/html',
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.ico': 'image/x-icon'
        };
        const contentType = contentTypes[ext] || 'text/plain';

        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));

    } catch (err: any) {
      console.error('Request error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message || 'Internal error' }));
    }
  });

  server.listen(port, () => {
    console.error(`[HTTP] Web UI available at http://localhost:${port}`);
    console.error(`[HTTP] API available at http://localhost:${port}/health`);
  });

  return server;
}

async function bootstrap() {
  // Only run if called directly
  if (process.argv[1] === fileURLToPath(import.meta.url)) {
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

    await startHttpServer(orchestrator, allTools, PORT);
  }
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

async function updateEnvFile(updates: Record<string, string>) {
  const envPath = path.join(process.cwd(), '.env');
  let content = '';

  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
  }

  const lines = content.split('\n');
  const newLines: string[] = [];
  const updatedKeys = new Set<string>();

  for (const line of lines) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      if (updates[key] !== undefined) {
        newLines.push(`${key}=${updates[key]}`);
        updatedKeys.add(key);
      } else {
        newLines.push(line);
      }
    } else {
      newLines.push(line);
    }
  }

  // Add new keys
  for (const [key, value] of Object.entries(updates)) {
    if (!updatedKeys.has(key)) {
      newLines.push(`${key}=${value}`);
    }
  }

  fs.writeFileSync(envPath, newLines.join('\n'));
}

bootstrap().catch(err => {
  console.error('[HTTP Bridge] Failed to start:', err);
  process.exit(1);
});

