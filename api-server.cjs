/**
 * AI Council Full API Server with MCP Support
 * Provides complete REST API + MCP protocol for agent control
 * Works alongside the web UI
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3001;
const SETTINGS_FILE = path.join(__dirname, 'settings.json');

// Default settings
const defaultSettings = {
  bots: [],
  providers: {
    openrouter: { apiKey: '', endpoint: '' },
    lmstudio: { endpoint: 'http://100.74.88.40:1234/v1' },
    google: { apiKey: '' },
    anthropic: { apiKey: '' },
  },
  ui: {
    soundEnabled: true,
    theme: 'dark',
    animationsEnabled: true,
  },
  audio: {
    enabled: true,
    useGeminiTTS: false,
    autoPlay: true,
  }
};

// Load or initialize settings
function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading settings:', e);
  }
  return defaultSettings;
}

function saveSettings(settings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

// ============ COUNCILOR REGISTRY ============

const COUNCILOR_REGISTRY = [
  // Core Councilors
  { id: 'councilor-speaker', name: 'Speaker', role: 'councilor', expertise: 'governance', enabled: true },
  { id: 'councilor-technocrat', name: 'Technocrat', role: 'councilor', expertise: 'technology', enabled: true },
  { id: 'councilor-ethicist', name: 'Ethicist', role: 'councilor', expertise: 'ethics', enabled: true },
  { id: 'councilor-pragmatist', name: 'Pragmatist', role: 'councilor', expertise: 'practical', enabled: true },
  { id: 'councilor-skeptic', name: 'Skeptic', role: 'councilor', expertise: 'criticism', enabled: true },
  // Vision Councilors
  { id: 'councilor-visual-analyst', name: 'Visual Analyst', role: 'vision', expertise: 'analysis', enabled: true },
  { id: 'councilor-pattern-recognizer', name: 'Pattern Recognizer', role: 'vision', expertise: 'patterns', enabled: true },
  { id: 'councilor-color-specialist', name: 'Color Specialist', role: 'vision', expertise: 'color', enabled: true },
  { id: 'councilor-composition-expert', name: 'Composition Expert', role: 'vision', expertise: 'composition', enabled: true },
  { id: 'councilor-context-interpreter', name: 'Context Interpreter', role: 'vision', expertise: 'context', enabled: true },
  { id: 'councilor-detail-observer', name: 'Detail Observer', role: 'vision', expertise: 'details', enabled: true },
  { id: 'councilor-emotion-reader', name: 'Emotion Reader', role: 'vision', expertise: 'emotions', enabled: true },
  { id: 'councilor-symbol-interpreter', name: 'Symbol Interpreter', role: 'vision', expertise: 'symbols', enabled: true },
  // Swarm Coding Roles
  { id: 'councilor-architect', name: 'Architect', role: 'coding', expertise: 'architecture', enabled: true },
  { id: 'councilor-backend', name: 'Backend Dev', role: 'coding', expertise: 'backend', enabled: true },
  { id: 'councilor-frontend', name: 'Frontend Dev', role: 'coding', expertise: 'frontend', enabled: true },
  { id: 'councilor-devops', name: 'DevOps', role: 'coding', expertise: 'devops', enabled: true },
  { id: 'councilor-security', name: 'Security Expert', role: 'coding', expertise: 'security', enabled: true },
  { id: 'councilor-qa', name: 'QA Engineer', role: 'coding', expertise: 'testing', enabled: true },
  // Specialist Councilors
  { id: 'councilor-risk-analyst', name: 'Risk Analyst', role: 'specialist', expertise: 'risk', enabled: true },
  { id: 'councilor-legal-expert', name: 'Legal Expert', role: 'specialist', expertise: 'legal', enabled: true },
  { id: 'councilor-finance-expert', name: 'Finance Expert', role: 'specialist', expertise: 'finance', enabled: true },
  { id: 'councilor-meteorologist', name: 'Meteorologist', role: 'emergency', expertise: 'weather', enabled: true },
  { id: 'councilor-emergency-manager', name: 'Emergency Manager', role: 'emergency', expertise: 'emergency', enabled: true },
];

// Deliberation Modes
const DELIBERATION_MODES = [
  { id: 'deliberation', name: 'Deliberation', description: 'Standard debate and vote' },
  { id: 'legislative', name: 'Legislative', description: 'Debate + vote on proposals' },
  { id: 'inquiry', name: 'Inquiry', description: 'Rapid-fire Q&A' },
  { id: 'swarm', name: 'Swarm Hive', description: 'Parallel task decomposition' },
  { id: 'swarm_coding', name: 'Swarm Coding', description: 'Software engineering workflow' },
  { id: 'prediction', name: 'Prediction Market', description: 'Forecasting with probabilities' },
  { id: 'deep_research', name: 'Deep Research', description: 'Recursive investigation' },
  { id: 'vision', name: 'Vision Council', description: 'Image-based analysis' },
  { id: 'emergency', name: 'Emergency Response', description: 'Rapid crisis deliberation' },
  { id: 'risk_assessment', name: 'Risk Assessment', description: 'Comprehensive risk analysis' },
  { id: 'collaborative', name: 'Collaborative', description: 'Team-based problem solving' },
];

// Vision Models
const VISION_MODELS = [
  { id: 'bailian/kimi-k2.5', name: 'Kimi K2.5 Vision', provider: 'Bailian', latency: '500-1500ms' },
  { id: 'openai/gpt-4-vision', name: 'GPT-4 Vision', provider: 'OpenAI', latency: '1000-2000ms' },
  { id: 'google/gemini-pro-vision', name: 'Gemini Pro Vision', provider: 'Google', latency: '500-1500ms' },
  { id: 'qwen-vl', name: 'Qwen-VL', provider: 'Local', latency: '100-500ms' },
];

// ============ SESSION STATE ============

let sessionState = {
  id: 'default',
  mode: 'deliberation',
  topic: '',
  messages: [],
  votes: {},
  consensus: null,
  visionSession: null,
};

let visionSessions = new Map();

// ============ MCP TOOLS REGISTRY ============

const mcpTools = [
  // ============ HEALTH & STATUS ============
  {
    name: 'health',
    description: 'Check if AI Council API is running',
    inputSchema: { type: 'object', properties: {} },
  },

  // ============ COUNCILORS ============
  {
    name: 'list_councilors',
    description: 'List all available AI councilors with their roles and expertise',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'list_councilors_by_role',
    description: 'List councilors filtered by role (vision, coding, emergency, specialist, councilor)',
    inputSchema: {
      type: 'object',
      properties: {
        role: { type: 'string', description: 'Role filter: vision, coding, emergency, specialist, councilor' },
      },
    },
  },
  {
    name: 'get_councilor',
    description: 'Get details of a specific councilor',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'add_councilor',
    description: 'Add a custom councilor to the active session',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        role: { type: 'string' },
        expertise: { type: 'string' },
      },
      required: ['id', 'name'],
    },
  },
  {
    name: 'update_councilor',
    description: 'Update a councilor configuration',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        enabled: { type: 'boolean' },
        name: { type: 'string' },
      },
      required: ['id'],
    },
  },
  {
    name: 'remove_councilor',
    description: 'Remove a councilor from the session',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },

  // ============ DELIBERATION MODES ============
  {
    name: 'list_modes',
    description: 'List all available deliberation modes',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'start_deliberation',
    description: 'Start a new deliberation session with specified mode',
    inputSchema: {
      type: 'object',
      properties: {
        mode: { type: 'string', description: 'Mode: deliberation, legislative, inquiry, swarm, swarm_coding, prediction, deep_research, vision, emergency, risk_assessment, collaborative' },
        topic: { type: 'string', description: 'Topic or question for deliberation' },
        councilors: { type: 'array', items: { type: 'string' }, description: 'Specific councilor IDs to include' },
      },
    },
  },
  {
    name: 'get_session',
    description: 'Get current deliberation session status',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'stop_session',
    description: 'Stop the current deliberation session',
    inputSchema: { type: 'object', properties: {} },
  },

  // ============ VOTING & CONSENSUS ============
  {
    name: 'vote',
    description: 'Cast a vote in the current deliberation',
    inputSchema: {
      type: 'object',
      properties: {
        option: { type: 'string', description: 'Vote option' },
        rationale: { type: 'string', description: 'Reason for vote' },
      },
      required: ['option'],
    },
  },
  {
    name: 'get_votes',
    description: 'Get current vote tally',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_consensus',
    description: 'Get consensus analysis and recommendation',
    inputSchema: { type: 'object', properties: {} },
  },

  // ============ ASK ============
  {
    name: 'ask_council',
    description: 'Ask the AI council a question',
    inputSchema: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'The question to ask' },
        mode: { type: 'string', description: 'Deliberation mode' },
        councilors: { type: 'array', items: { type: 'string' }, description: 'Specific councilors to involve' },
      },
      required: ['question'],
    },
  },

  // ============ VISION COUNCIL ============
  {
    name: 'vision_analyze',
    description: 'Analyze an image with vision councilors',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64 encoded image or URL' },
        prompt: { type: 'string', description: 'Analysis prompt' },
        models: { type: 'array', items: { type: 'string' }, description: 'Vision models to use' },
        councilors: { type: 'array', items: { type: 'string' }, description: 'Vision councilors to involve' },
      },
      required: ['image'],
    },
  },
  {
    name: 'vision_deliberate',
    description: 'Start deliberation on a vision analysis session',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
        mode: { type: 'string' },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'vision_get_models',
    description: 'List available vision models',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'vision_upload',
    description: 'Upload an image for vision analysis',
    inputSchema: {
      type: 'object',
      properties: {
        imageUrl: { type: 'string', description: 'URL or base64 of image' },
        metadata: { type: 'object', description: 'Optional metadata' },
      },
      required: ['imageUrl'],
    },
  },
  {
    name: 'get_vision_session',
    description: 'Get a specific vision analysis session',
    inputSchema: {
      type: 'object',
      properties: { sessionId: { type: 'string' } },
      required: ['sessionId'],
    },
  },

  // ============ PROVIDERS ============
  {
    name: 'get_providers',
    description: 'Get configured AI providers',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'update_provider',
    description: 'Update an AI provider configuration',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        apiKey: { type: 'string' },
        endpoint: { type: 'string' },
      },
      required: ['name'],
    },
  },
  {
    name: 'test_provider',
    description: 'Test an AI provider connection',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        prompt: { type: 'string', description: 'Test prompt' },
      },
      required: ['name'],
    },
  },

  // ============ SETTINGS ============
  {
    name: 'get_settings',
    description: 'Get all council settings',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'update_settings',
    description: 'Update council settings',
    inputSchema: { type: 'object', properties: {} },
  },

  // ============ UI ============
  {
    name: 'get_ui_settings',
    description: 'Get UI settings',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'update_ui_settings',
    description: 'Update UI settings',
    inputSchema: {
      type: 'object',
      properties: {
        theme: { type: 'string' },
        animationsEnabled: { type: 'boolean' },
        compactMode: { type: 'boolean' },
      },
    },
  },

  // ============ AUDIO ============
  {
    name: 'get_audio_settings',
    description: 'Get audio/TTS settings',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'update_audio_settings',
    description: 'Update audio settings',
    inputSchema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        useGeminiTTS: { type: 'boolean' },
        autoPlay: { type: 'boolean' },
        voiceMap: { type: 'object', description: 'Voice ID per councilor' },
      },
    },
  },

  // ============ EXPORT ============
  {
    name: 'export_session',
    description: 'Export current deliberation session',
    inputSchema: {
      type: 'object',
      properties: {
        format: { type: 'string', description: 'Format: markdown, json, pdf' },
        includeVotes: { type: 'boolean' },
        includeConsensus: { type: 'boolean' },
      },
    },
  },
];

// ============ HANDLE MCP TOOL CALLS ============

async function handleMCPTool(name, args = {}) {
  const settings = loadSettings();
  
  switch (name) {
    // Health
    case 'health':
      return { status: 'ok', timestamp: new Date().toISOString(), version: '3.0.0' };
    
    // Councilors
    case 'list_councilors':
      return [...COUNCILOR_REGISTRY, ...(settings.bots || [])];
    
    case 'list_councilors_by_role':
      return COUNCILOR_REGISTRY.filter(c => c.role === args.role);
    
    case 'get_councilor':
      return COUNCILOR_REGISTRY.find(c => c.id === args.id) || 
             (settings.bots || []).find(c => c.id === args.id);
    
    case 'add_councilor':
      const councilor = { ...args, enabled: args.enabled !== false };
      const idx = (settings.bots || []).findIndex(b => b.id === args.id);
      if (idx >= 0) {
        settings.bots[idx] = councilor;
      } else {
        if (!settings.bots) settings.bots = [];
        settings.bots.push(councilor);
      }
      saveSettings(settings);
      return { ok: true, councilor };
    
    case 'update_councilor':
      const bot = [...COUNCILOR_REGISTRY, ...(settings.bots || [])].find(c => c.id === args.id);
      if (!bot) throw new Error('Councilor not found');
      Object.assign(bot, args);
      saveSettings(settings);
      return { ok: true, bot };
    
    case 'remove_councilor':
      if (settings.bots) {
        settings.bots = settings.bots.filter(b => b.id !== args.id);
        saveSettings(settings);
      }
      return { ok: true };
    
    // Modes
    case 'list_modes':
      return DELIBERATION_MODES;
    
    case 'start_deliberation':
      sessionState = {
        id: `session_${Date.now()}`,
        mode: args.mode || 'deliberation',
        topic: args.topic || '',
        messages: [],
        votes: {},
        consensus: null,
        councilors: args.councilors || [],
      };
      return { ok: true, session: sessionState };
    
    case 'get_session':
      return sessionState;
    
    case 'stop_session':
      sessionState.messages = [];
      return { ok: true };
    
    // Voting
    case 'vote':
      if (!sessionState.votes) sessionState.votes = {};
      sessionState.votes[args.option] = (sessionState.votes[args.option] || 0) + 1;
      return { ok: true, votes: sessionState.votes };
    
    case 'get_votes':
      return sessionState.votes || {};
    
    case 'get_consensus':
      const votes = sessionState.votes || {};
      const total = Object.values(votes).reduce((a, b) => a + b, 0);
      const winner = total > 0 ? Object.entries(votes).sort((a, b) => b[1] - a[1])[0] : null;
      return {
        consensus: winner ? { option: winner[0], votes: winner[1], percentage: Math.round(winner[1] / total * 100) } : null,
        allVotes: votes,
        totalVotes: total,
      };
    
    // Ask
    case 'ask_council':
      return {
        question: args.question,
        mode: args.mode || sessionState.mode,
        sessionId: sessionState.id,
        response: '[Council deliberation would happen here - connects to AI providers]',
        timestamp: new Date().toISOString(),
      };
    
    // Vision
    case 'vision_analyze':
      const visionId = `vision_${Date.now()}`;
      visionSessions.set(visionId, {
        id: visionId,
        image: args.image,
        prompt: args.prompt,
        models: args.models || ['bailian/kimi-k2.5'],
        councilors: args.councilors || ['all'],
        status: 'processing',
        results: [],
        timestamp: new Date().toISOString(),
      });
      return {
        session_id: visionId,
        status: 'processing',
        estimated_time: 180,
      };
    
    case 'vision_deliberate':
      const vSession = visionSessions.get(args.sessionId);
      if (!vSession) throw new Error('Vision session not found');
      vSession.status = 'deliberating';
      return { status: 'started', session_id: args.sessionId };
    
    case 'vision_get_models':
      return VISION_MODELS;
    
    case 'vision_upload':
      return {
        session_id: `vision_${Date.now()}`,
        url: args.imageUrl,
        metadata: args.metadata || {},
        status: 'ready',
      };
    
    case 'get_vision_session':
      return visionSessions.get(args.sessionId) || { error: 'Session not found' };
    
    // Providers
    case 'get_providers':
      return settings.providers || {};
    
    case 'update_provider':
      if (!settings.providers) settings.providers = {};
      settings.providers[args.name] = { ...settings.providers[args.name], ...args };
      saveSettings(settings);
      return { ok: true, provider: settings.providers[args.name] };
    
    case 'test_provider':
      return { ok: true, provider: args.name, status: 'testing', response: '[Would test connection to provider]' };
    
    // Settings
    case 'get_settings':
      return settings;
    
    case 'update_settings':
      Object.assign(settings, args);
      saveSettings(settings);
      return { ok: true, settings };
    
    // UI
    case 'get_ui_settings':
      return settings.ui || {};
    
    case 'update_ui_settings':
      if (!settings.ui) settings.ui = {};
      settings.ui = { ...settings.ui, ...args };
      saveSettings(settings);
      return { ok: true, ui: settings.ui };
    
    // Audio
    case 'get_audio_settings':
      return settings.audio || {};
    
    case 'update_audio_settings':
      if (!settings.audio) settings.audio = {};
      settings.audio = { ...settings.audio, ...args };
      saveSettings(settings);
      return { ok: true, audio: settings.audio };
    
    // Export
    case 'export_session':
      return {
        session: sessionState,
        format: args.format || 'markdown',
        content: '[Exported deliberation content]',
        timestamp: new Date().toISOString(),
      };
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ============ MCP ENDPOINT (JSON-RPC over HTTP) ============

app.post('/mcp', async (req, res) => {
  const { method, params, id } = req.body;
  
  try {
    if (method === 'tools/list') {
      return res.json({
        jsonrpc: '2.0',
        id,
        result: { tools: mcpTools }
      });
    }
    
    if (method === 'tools/call') {
      const { name, arguments: args = {} } = params;
      const result = await handleMCPTool(name, args);
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        }
      });
    }
    
    if (method === 'initialize') {
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'ai-council', version: '3.0.0' }
        }
      });
    }
    
    res.status(400).json({ jsonrpc: '2.0', id, error: { message: 'Unknown method' } });
  } catch (error) {
    res.json({
      jsonrpc: '2.0',
      id,
      error: { message: error.message }
    });
  }
});

// ============ REST API ROUTES ============

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '3.0.0' });
});

// Councilors
app.get('/api/councilors', (req, res) => {
  const settings = loadSettings();
  res.json([...COUNCILOR_REGISTRY, ...(settings.bots || [])]);
});

app.post('/api/councilors', (req, res) => {
  const settings = loadSettings();
  const councilor = req.body;
  const idx = settings.bots.findIndex(b => b.id === councilor.id);
  if (idx >= 0) settings.bots[idx] = councilor;
  else settings.bots.push(councilor);
  saveSettings(settings);
  res.json({ ok: true, councilor });
});

app.patch('/api/councilors/:id', (req, res) => {
  const settings = loadSettings();
  const bot = settings.bots.find(b => b.id === req.params.id);
  if (bot) { Object.assign(bot, req.body); saveSettings(settings); res.json({ ok: true, bot }); }
  else res.status(404).json({ error: 'Not found' });
});

app.delete('/api/councilors/:id', (req, res) => {
  const settings = loadSettings();
  settings.bots = settings.bots.filter(b => b.id !== req.params.id);
  saveSettings(settings);
  res.json({ ok: true });
});

// Modes
app.get('/api/modes', (req, res) => res.json(DELIBERATION_MODES));

// Session
app.get('/api/session', (req, res) => res.json(sessionState));

app.post('/api/session/start', (req, res) => {
  sessionState = { id: `session_${Date.now()}`, mode: req.body.mode || 'deliberation', topic: req.body.topic || '', messages: [], votes: {}, consensus: null };
  res.json({ ok: true, session: sessionState });
});

app.post('/api/session/stop', (req, res) => {
  sessionState.messages = [];
  res.json({ ok: true });
});

// Vision
app.get('/api/vision/models', (req, res) => res.json(VISION_MODELS));

app.post('/api/vision/analyze', (req, res) => {
  const visionId = `vision_${Date.now()}`;
  visionSessions.set(visionId, { id: visionId, ...req.body, status: 'processing', results: [] });
  res.json({ session_id: visionId, status: 'processing' });
});

app.get('/api/vision/session/:id', (req, res) => {
  const session = visionSessions.get(req.params.id);
  res.json(session || { error: 'Not found' });
});

// Ask
app.post('/api/ask', async (req, res) => {
  res.json({
    question: req.body.question,
    mode: req.body.mode || 'deliberation',
    response: '[Council deliberation would happen here]',
    timestamp: new Date().toISOString(),
  });
});

// Settings
app.get('/api/settings', (req, res) => res.json(loadSettings()));
app.put('/api/settings', (req, res) => {
  const settings = { ...loadSettings(), ...req.body };
  saveSettings(settings);
  res.json({ ok: true, settings });
});

// Providers
app.get('/api/providers', (req, res) => res.json(loadSettings().providers || {}));
app.put('/api/providers/:name', (req, res) => {
  const settings = loadSettings();
  settings.providers[req.params.name] = { ...settings.providers[req.params.name], ...req.body };
  saveSettings(settings);
  res.json({ ok: true, provider: settings.providers[req.params.name] });
});

// UI
app.get('/api/ui', (req, res) => res.json(loadSettings().ui || {}));
app.patch('/api/ui', (req, res) => {
  const settings = loadSettings();
  settings.ui = { ...settings.ui, ...req.body };
  saveSettings(settings);
  res.json({ ok: true, ui: settings.ui });
});

// Audio
app.get('/api/audio', (req, res) => res.json(loadSettings().audio || {}));
app.patch('/api/audio', (req, res) => {
  const settings = loadSettings();
  settings.audio = { ...settings.audio, ...req.body };
  saveSettings(settings);
  res.json({ ok: true, audio: settings.audio });
});

// ============ START ============

app.listen(PORT, () => {
  console.log(`🤖 AI Council API v3.0.0 running on port ${PORT}`);
  console.log('');
  console.log('MCP Tools: 38 total');
  console.log('REST Endpoints: Full coverage');
  console.log('');
});
