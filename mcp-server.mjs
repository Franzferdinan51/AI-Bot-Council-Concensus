import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const COUNCIL_API = process.env.COUNCIL_API || 'http://localhost:3001';

const server = new Server(
  { name: 'ai-council-mcp', version: '3.1.0' },
  { capabilities: { tools: {} } }
);

const tools = [
  { name: 'health', description: 'Check if AI Council API is running', inputSchema: { type: 'object', properties: {} } },
  { name: 'get_status', description: 'Get server status, uptime, and metrics', inputSchema: { type: 'object', properties: {} } },
  { name: 'get_metrics', description: 'Get request counts, latency, errors', inputSchema: { type: 'object', properties: {} } },
  { name: 'get_health', description: 'Detailed health check with component status', inputSchema: { type: 'object', properties: {} } },

  { name: 'list_councilors', description: 'List all AI councilors', inputSchema: { type: 'object', properties: {} } },
  { name: 'list_councilors_by_role', description: 'List councilors filtered by role', inputSchema: { type: 'object', properties: { role: { type: 'string' } } } },
  { name: 'get_councilor', description: 'Get details of a specific councilor', inputSchema: { type: 'object', properties: { id: { type: 'string' } } } },
  { name: 'add_councilor', description: 'Add a custom councilor', inputSchema: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, role: { type: 'string' }, expertise: { type: 'string' } }, required: ['id', 'name'] } },
  { name: 'update_councilor', description: 'Update councilor config', inputSchema: { type: 'object', properties: { id: { type: 'string' }, enabled: { type: 'boolean' } } } },
  { name: 'remove_councilor', description: 'Remove councilor', inputSchema: { type: 'object', properties: { id: { type: 'string' } } } },

  { name: 'list_modes', description: 'List deliberation modes', inputSchema: { type: 'object', properties: {} } },
  { name: 'start_deliberation', description: 'Start new deliberation session', inputSchema: { type: 'object', properties: { mode: { type: 'string' }, topic: { type: 'string' }, councilors: { type: 'array', items: { type: 'string' } } } } },
  { name: 'get_session', description: 'Get session status', inputSchema: { type: 'object', properties: {} } },
  { name: 'stop_session', description: 'Stop current session', inputSchema: { type: 'object', properties: {} } },
  { name: 'start_session', description: 'Start new council session', inputSchema: { type: 'object', properties: { mode: { type: 'string' }, topic: { type: 'string' } } } },

  { name: 'vote', description: 'Cast vote in deliberation', inputSchema: { type: 'object', properties: { option: { type: 'string' }, rationale: { type: 'string' } }, required: ['option'] } },
  { name: 'get_votes', description: 'Get vote tally', inputSchema: { type: 'object', properties: {} } },
  { name: 'get_consensus', description: 'Get consensus analysis', inputSchema: { type: 'object', properties: {} } },

  { name: 'ask_council', description: 'Ask the AI council a question', inputSchema: { type: 'object', properties: { question: { type: 'string' }, prompt: { type: 'string' }, mode: { type: 'string' }, councilors: { type: 'array', items: { type: 'string' } } } } },

  { name: 'vision_analyze', description: 'Analyze image with vision councilors', inputSchema: { type: 'object', properties: { image: { type: 'string' }, prompt: { type: 'string' }, models: { type: 'array', items: { type: 'string' } }, councilors: { type: 'array', items: { type: 'string' } } }, required: ['image'] } },
  { name: 'vision_deliberate', description: 'Start deliberation on vision session', inputSchema: { type: 'object', properties: { sessionId: { type: 'string' }, mode: { type: 'string' } }, required: ['sessionId'] } },
  { name: 'vision_get_models', description: 'List available vision models', inputSchema: { type: 'object', properties: {} } },
  { name: 'vision_upload', description: 'Upload image for analysis', inputSchema: { type: 'object', properties: { imageUrl: { type: 'string' }, metadata: { type: 'object' } }, required: ['imageUrl'] } },
  { name: 'get_vision_session', description: 'Get vision analysis session', inputSchema: { type: 'object', properties: { sessionId: { type: 'string' } } } },

  { name: 'get_providers', description: 'Get configured AI providers', inputSchema: { type: 'object', properties: {} } },
  { name: 'update_provider', description: 'Update provider config', inputSchema: { type: 'object', properties: { name: { type: 'string' }, apiKey: { type: 'string' }, endpoint: { type: 'string' } }, required: ['name'] } },
  { name: 'test_provider', description: 'Test provider connection', inputSchema: { type: 'object', properties: { name: { type: 'string' }, prompt: { type: 'string' } }, required: ['name'] } },

  { name: 'get_settings', description: 'Get all settings', inputSchema: { type: 'object', properties: {} } },
  { name: 'update_settings', description: 'Update settings', inputSchema: { type: 'object', properties: {} } },
  { name: 'get_ui_settings', description: 'Get UI settings', inputSchema: { type: 'object', properties: {} } },
  { name: 'update_ui_settings', description: 'Update UI settings', inputSchema: { type: 'object', properties: { theme: { type: 'string' }, animationsEnabled: { type: 'boolean' }, compactMode: { type: 'boolean' } } } },
  { name: 'get_audio_settings', description: 'Get audio/TTS settings', inputSchema: { type: 'object', properties: {} } },
  { name: 'update_audio_settings', description: 'Update audio settings', inputSchema: { type: 'object', properties: { enabled: { type: 'boolean' }, useGeminiTTS: { type: 'boolean' }, autoPlay: { type: 'boolean' }, voiceMap: { type: 'object' } } } },

  { name: 'export_session', description: 'Export deliberation', inputSchema: { type: 'object', properties: { format: { type: 'string' }, includeVotes: { type: 'boolean' }, includeConsensus: { type: 'boolean' } } } },
  { name: 'save_session', description: 'Save deliberation to disk', inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
  { name: 'load_session', description: 'Load saved deliberation', inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
  { name: 'list_sessions', description: 'List saved sessions', inputSchema: { type: 'object', properties: {} } },
  { name: 'delete_session', description: 'Delete saved session', inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },

  { name: 'delegate_to', description: 'Delegate task to councilor', inputSchema: { type: 'object', properties: { councilorId: { type: 'string' }, task: { type: 'string' } }, required: ['councilorId', 'task'] } },
  { name: 'coordinate_agents', description: 'Coordinate multiple agents', inputSchema: { type: 'object', properties: { agents: { type: 'array', items: { type: 'string' } }, task: { type: 'string' } }, required: ['agents', 'task'] } },
  { name: 'get_agent_status', description: 'Get active agent status', inputSchema: { type: 'object', properties: {} } },

  { name: 'list_resources', description: 'List available resources', inputSchema: { type: 'object', properties: {} } },
  { name: 'read_resource', description: 'Read a resource', inputSchema: { type: 'object', properties: { uri: { type: 'string' } }, required: ['uri'] } },
  { name: 'subscribe_resource', description: 'Subscribe to resource updates', inputSchema: { type: 'object', properties: { uri: { type: 'string' } }, required: ['uri'] } },

  { name: 'set_api_key', description: 'Set API key', inputSchema: { type: 'object', properties: { key: { type: 'string' } }, required: ['key'] } },
  { name: 'validate_token', description: 'Validate API token', inputSchema: { type: 'object', properties: { token: { type: 'string' } }, required: ['token'] } },
  { name: 'get_rate_limits', description: 'Get rate limit status', inputSchema: { type: 'object', properties: {} } },

  { name: 'register_webhook', description: 'Register webhook', inputSchema: { type: 'object', properties: { url: { type: 'string' }, events: { type: 'array', items: { type: 'string' } } }, required: ['url'] } },
  { name: 'list_webhooks', description: 'List webhooks', inputSchema: { type: 'object', properties: {} } },
  { name: 'delete_webhook', description: 'Delete webhook', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },

  { name: 'tool_broker_status', description: 'Check AI Council internal tool broker status (Brave/BrowserOS)', inputSchema: { type: 'object', properties: {} } },
  { name: 'web_search', description: 'Search the web via Brave Search from inside AI Council', inputSchema: { type: 'object', properties: { query: { type: 'string' }, count: { type: 'number' } }, required: ['query'] } },
  { name: 'browser_open', description: 'Open URL in BrowserOS from inside AI Council', inputSchema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] } },
  { name: 'browser_get_active_page', description: 'Get active BrowserOS page', inputSchema: { type: 'object', properties: {} } },
  { name: 'browser_get_page_content', description: 'Extract BrowserOS page content', inputSchema: { type: 'object', properties: { page: { type: 'number' } }, required: ['page'] } },

  { name: 'subscribe_deliberation', description: 'Subscribe to SSE stream', inputSchema: { type: 'object', properties: { sessionId: { type: 'string' } }, required: ['sessionId'] } },
  { name: 'push_context', description: 'Add context', inputSchema: { type: 'object', properties: { context: { type: 'string' } }, required: ['context'] } },
  { name: 'get_context_window', description: 'Get context window', inputSchema: { type: 'object', properties: {} } },
  { name: 'clear_context', description: 'Clear all context', inputSchema: { type: 'object', properties: {} } },
  { name: 'get_audit_log', description: 'Get audit log', inputSchema: { type: 'object', properties: { limit: { type: 'number' } } } },
  { name: 'export_audit_log', description: 'Export audit log', inputSchema: { type: 'object', properties: { format: { type: 'string' } } } },
];

async function callAPI(endpoint, options = {}) {
  const url = `${COUNCIL_API}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function callMCPTool(method, params) {
  const res = await fetch(`${COUNCIL_API}/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: Date.now() }),
  });
  return res.json();
}

async function getBrowserOSTools() {
  try {
    const data = await callAPI('/api/tools/browser-tools');
    const browserTools = data.tools || [];
    return browserTools.map((t) => ({
      name: `browseros_${t.name}`,
      description: `[BrowserOS] ${t.description || t.name}`,
      inputSchema: t.inputSchema || { type: 'object', properties: {} }
    }));
  } catch {
    return [];
  }
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  const browserTools = await getBrowserOSTools();
  return { tools: [...tools, ...browserTools] };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  try {
    let result;
    switch (name) {
      case 'health': result = await callAPI('/api/health'); break;
      case 'get_status': result = await callMCPTool('tools/call', { name: 'get_status', arguments: {} }); break;
      case 'get_metrics': result = await callMCPTool('tools/call', { name: 'get_metrics', arguments: {} }); break;
      case 'get_health': result = await callMCPTool('tools/call', { name: 'get_health', arguments: {} }); break;

      case 'list_councilors': result = await callAPI('/api/councilors'); break;
      case 'list_councilors_by_role': result = await callMCPTool('tools/call', { name: 'list_councilors_by_role', arguments: args }); break;
      case 'get_councilor': result = await callMCPTool('tools/call', { name: 'get_councilor', arguments: args }); break;
      case 'add_councilor': result = await callAPI('/api/councilors', { method: 'POST', body: JSON.stringify(args) }); break;
      case 'update_councilor': result = await callAPI(`/api/councilors/${args.id}`, { method: 'PATCH', body: JSON.stringify(args) }); break;
      case 'remove_councilor': result = await callAPI(`/api/councilors/${args.id}`, { method: 'DELETE' }); break;

      case 'list_modes': result = await callAPI('/api/modes'); break;
      case 'start_deliberation': result = await callAPI('/api/session/start', { method: 'POST', body: JSON.stringify(args) }); break;
      case 'get_session': result = await callAPI('/api/session'); break;
      case 'stop_session': result = await callAPI('/api/session/stop', { method: 'POST' }); break;
      case 'start_session': result = await callAPI('/api/session/start', { method: 'POST', body: JSON.stringify(args) }); break;

      case 'vote': result = await callMCPTool('tools/call', { name: 'vote', arguments: args }); break;
      case 'get_votes': result = await callMCPTool('tools/call', { name: 'get_votes', arguments: {} }); break;
      case 'get_consensus': result = await callMCPTool('tools/call', { name: 'get_consensus', arguments: {} }); break;

      case 'ask_council': result = await callAPI('/api/ask', { method: 'POST', body: JSON.stringify(args) }); break;

      case 'vision_analyze': result = await callAPI('/api/vision/analyze', { method: 'POST', body: JSON.stringify(args) }); break;
      case 'vision_deliberate': result = await callMCPTool('tools/call', { name: 'vision_deliberate', arguments: args }); break;
      case 'vision_get_models': result = await callAPI('/api/vision/models'); break;
      case 'vision_upload': result = await callMCPTool('tools/call', { name: 'vision_upload', arguments: args }); break;
      case 'get_vision_session': result = await callAPI(`/api/vision/session/${args.sessionId}`); break;

      case 'get_providers': result = await callAPI('/api/providers'); break;
      case 'update_provider': result = await callAPI(`/api/providers/${args.name}`, { method: 'PUT', body: JSON.stringify(args) }); break;
      case 'test_provider': result = await callMCPTool('tools/call', { name: 'test_provider', arguments: args }); break;

      case 'get_settings': result = await callAPI('/api/settings'); break;
      case 'update_settings': result = await callAPI('/api/settings', { method: 'PUT', body: JSON.stringify(args) }); break;
      case 'get_ui_settings': result = await callAPI('/api/ui'); break;
      case 'update_ui_settings': result = await callAPI('/api/ui', { method: 'PATCH', body: JSON.stringify(args) }); break;
      case 'get_audio_settings': result = await callAPI('/api/audio'); break;
      case 'update_audio_settings': result = await callAPI('/api/audio', { method: 'PATCH', body: JSON.stringify(args) }); break;

      case 'export_session': result = await callMCPTool('tools/call', { name: 'export_session', arguments: args }); break;
      case 'save_session': result = await callMCPTool('tools/call', { name: 'save_session', arguments: args }); break;
      case 'load_session': result = await callMCPTool('tools/call', { name: 'load_session', arguments: args }); break;
      case 'list_sessions': result = await callMCPTool('tools/call', { name: 'list_sessions', arguments: {} }); break;
      case 'delete_session': result = await callMCPTool('tools/call', { name: 'delete_session', arguments: args }); break;

      case 'delegate_to': result = await callMCPTool('tools/call', { name: 'delegate_to', arguments: args }); break;
      case 'coordinate_agents': result = await callMCPTool('tools/call', { name: 'coordinate_agents', arguments: args }); break;
      case 'get_agent_status': result = await callMCPTool('tools/call', { name: 'get_agent_status', arguments: {} }); break;

      case 'list_resources': result = await callMCPTool('tools/call', { name: 'list_resources', arguments: {} }); break;
      case 'read_resource': result = await callMCPTool('tools/call', { name: 'read_resource', arguments: args }); break;
      case 'subscribe_resource': result = await callMCPTool('tools/call', { name: 'subscribe_resource', arguments: args }); break;

      case 'set_api_key': result = await callMCPTool('tools/call', { name: 'set_api_key', arguments: args }); break;
      case 'validate_token': result = await callMCPTool('tools/call', { name: 'validate_token', arguments: args }); break;
      case 'get_rate_limits': result = await callMCPTool('tools/call', { name: 'get_rate_limits', arguments: {} }); break;

      case 'register_webhook': result = await callMCPTool('tools/call', { name: 'register_webhook', arguments: args }); break;
      case 'list_webhooks': result = await callMCPTool('tools/call', { name: 'list_webhooks', arguments: {} }); break;
      case 'delete_webhook': result = await callMCPTool('tools/call', { name: 'delete_webhook', arguments: args }); break;

      case 'tool_broker_status': result = await callAPI('/api/tools/status'); break;
      case 'web_search': result = await callAPI('/api/tools/web-search', { method: 'POST', body: JSON.stringify(args) }); break;
      case 'browser_open': result = await callAPI('/api/tools/browser-open', { method: 'POST', body: JSON.stringify(args) }); break;
      case 'browser_get_active_page': result = await callAPI('/api/tools/browser-active'); break;
      case 'browser_get_page_content': result = await callAPI('/api/tools/browser-content', { method: 'POST', body: JSON.stringify(args) }); break;

      case 'subscribe_deliberation': result = await callMCPTool('tools/call', { name: 'subscribe_deliberation', arguments: args }); break;
      case 'push_context': result = await callMCPTool('tools/call', { name: 'push_context', arguments: args }); break;
      case 'get_context_window': result = await callMCPTool('tools/call', { name: 'get_context_window', arguments: {} }); break;
      case 'clear_context': result = await callMCPTool('tools/call', { name: 'clear_context', arguments: {} }); break;
      case 'get_audit_log': result = await callMCPTool('tools/call', { name: 'get_audit_log', arguments: args }); break;
      case 'export_audit_log': result = await callMCPTool('tools/call', { name: 'export_audit_log', arguments: args }); break;

      default:
        if (name.startsWith('browseros_')) {
          const browserToolName = name.replace(/^browseros_/, '');
          result = await callAPI('/api/tools/browser-call', { method: 'POST', body: JSON.stringify({ name: browserToolName, arguments: args }) });
          break;
        }
        throw new Error(`Unknown tool: ${name}`);
    }
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
});

async function main() {
  console.error('🏛️ AI Council MCP v3.1.0 starting...');
  console.error(`📍 Connecting to: ${COUNCIL_API}`);
  console.error(`🔧 Base tools: ${tools.length}`);
  await server.connect(new StdioServerTransport());
  console.error('✅ AI Council MCP connected');
}

main().catch(e => { console.error(e); process.exit(1); });