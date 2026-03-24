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

// ============ MCP TOOLS REGISTRY ============

const mcpTools = [
  // Health
  {
    name: 'health',
    description: 'Check if AI Council API is running',
    inputSchema: { type: 'object', properties: {} },
  },

  // Councilors
  {
    name: 'list_councilors',
    description: 'List all available AI councilors',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'add_councilor',
    description: 'Add a new councilor',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        role: { type: 'string' },
        enabled: { type: 'boolean' },
      },
      required: ['id', 'name'],
    },
  },
  {
    name: 'update_councilor',
    description: 'Update a councilor',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        enabled: { type: 'boolean' },
      },
      required: ['id'],
    },
  },
  {
    name: 'remove_councilor',
    description: 'Remove a councilor',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },

  // Session
  {
    name: 'get_session',
    description: 'Get current session status',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'start_session',
    description: 'Start a council session',
    inputSchema: {
      type: 'object',
      properties: {
        mode: { type: 'string' },
        topic: { type: 'string' },
      },
    },
  },
  {
    name: 'stop_session',
    description: 'Stop the current session',
    inputSchema: { type: 'object', properties: {} },
  },

  // Ask
  {
    name: 'ask_council',
    description: 'Ask the AI council a question',
    inputSchema: {
      type: 'object',
      properties: {
        question: { type: 'string' },
        mode: { type: 'string' },
      },
      required: ['question'],
    },
  },

  // Providers
  {
    name: 'get_providers',
    description: 'Get configured AI providers',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'update_provider',
    description: 'Update a provider',
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

  // Settings
  {
    name: 'get_settings',
    description: 'Get all settings',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'update_settings',
    description: 'Update settings',
    inputSchema: { type: 'object', properties: {} },
  },

  // UI
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
        soundEnabled: { type: 'boolean' },
      },
    },
  },

  // Audio
  {
    name: 'get_audio_settings',
    description: 'Get audio settings',
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
      },
    },
  },
];

// Handle MCP tool calls
async function handleMCPTool(name, args = {}) {
  const settings = loadSettings();
  
  switch (name) {
    case 'health':
      return { status: 'ok', timestamp: new Date().toISOString(), version: '3.0.0' };
    
    case 'list_councilors':
      return settings.bots || [];
    
    case 'add_councilor':
      const councilor = { ...args, enabled: args.enabled !== false };
      const idx = settings.bots.findIndex(b => b.id === args.id);
      if (idx >= 0) {
        settings.bots[idx] = councilor;
      } else {
        settings.bots.push(councilor);
      }
      saveSettings(settings);
      return { ok: true, councilor };
    
    case 'update_councilor':
      const bot = settings.bots.find(b => b.id === args.id);
      if (!bot) throw new Error('Councilor not found');
      Object.assign(bot, args);
      saveSettings(settings);
      return { ok: true, bot };
    
    case 'remove_councilor':
      settings.bots = settings.bots.filter(b => b.id !== args.id);
      saveSettings(settings);
      return { ok: true };
    
    case 'get_session':
      return sessionState;
    
    case 'start_session':
      sessionState = { mode: args.mode || 'deliberation', topic: args.topic || '', messages: [] };
      return { ok: true, session: sessionState };
    
    case 'stop_session':
      sessionState.messages = [];
      return { ok: true };
    
    case 'ask_council':
      return {
        question: args.question,
        mode: args.mode || 'deliberation',
        response: '[Council deliberation would happen here]',
        timestamp: new Date().toISOString()
      };
    
    case 'get_providers':
      return settings.providers;
    
    case 'update_provider':
      settings.providers[args.name] = { ...settings.providers[args.name], ...args };
      saveSettings(settings);
      return { ok: true, provider: settings.providers[args.name] };
    
    case 'get_settings':
      return settings;
    
    case 'update_settings':
      Object.assign(settings, args);
      saveSettings(settings);
      return { ok: true, settings };
    
    case 'get_ui_settings':
      return settings.ui || {};
    
    case 'update_ui_settings':
      settings.ui = { ...settings.ui, ...args };
      saveSettings(settings);
      return { ok: true, ui: settings.ui };
    
    case 'get_audio_settings':
      return settings.audio || {};
    
    case 'update_audio_settings':
      settings.audio = { ...settings.audio, ...args };
      saveSettings(settings);
      return { ok: true, audio: settings.audio };
    
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

// MCP SSE endpoint for streaming
app.get('/mcp', (req, res) => {
  res.json({ error: 'Use POST for MCP calls' });
});

// ============ REST API ROUTES ============

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '3.0.0'
  });
});

// Get all settings
app.get('/api/settings', (req, res) => {
  const settings = loadSettings();
  res.json(settings);
});

// Update settings
app.put('/api/settings', (req, res) => {
  const current = loadSettings();
  const updates = req.body;
  const newSettings = { ...current, ...updates };
  saveSettings(newSettings);
  res.json({ ok: true, settings: newSettings });
});

// ============ COUNCILOR MANAGEMENT ============

app.get('/api/councilors', (req, res) => {
  const settings = loadSettings();
  res.json(settings.bots || []);
});

app.post('/api/councilors', (req, res) => {
  const settings = loadSettings();
  const councilor = req.body;
  
  const idx = settings.bots.findIndex(b => b.id === councilor.id);
  if (idx >= 0) {
    settings.bots[idx] = councilor;
  } else {
    settings.bots.push(councilor);
  }
  
  saveSettings(settings);
  res.json({ ok: true, councilor });
});

app.patch('/api/councilors/:id', (req, res) => {
  const settings = loadSettings();
  const { id } = req.params;
  const { enabled } = req.body;
  
  const bot = settings.bots.find(b => b.id === id);
  if (bot) {
    bot.enabled = enabled;
    saveSettings(settings);
    res.json({ ok: true, bot });
  } else {
    res.status(404).json({ error: 'Councilor not found' });
  }
});

app.delete('/api/councilors/:id', (req, res) => {
  const settings = loadSettings();
  const { id } = req.params;
  settings.bots = settings.bots.filter(b => b.id !== id);
  saveSettings(settings);
  res.json({ ok: true });
});

// ============ PROVIDER MANAGEMENT ============

app.get('/api/providers', (req, res) => {
  const settings = loadSettings();
  res.json(settings.providers || {});
});

app.put('/api/providers/:name', (req, res) => {
  const settings = loadSettings();
  const { name } = req.params;
  const config = req.body;
  
  settings.providers[name] = { ...settings.providers[name], ...config };
  saveSettings(settings);
  res.json({ ok: true, provider: settings.providers[name] });
});

// ============ UI SETTINGS ============

app.get('/api/ui', (req, res) => {
  const settings = loadSettings();
  res.json(settings.ui || {});
});

app.patch('/api/ui', (req, res) => {
  const settings = loadSettings();
  settings.ui = { ...settings.ui, ...req.body };
  saveSettings(settings);
  res.json({ ok: true, ui: settings.ui });
});

// ============ AUDIO SETTINGS ============

app.get('/api/audio', (req, res) => {
  const settings = loadSettings();
  res.json(settings.audio || {});
});

app.patch('/api/audio', (req, res) => {
  const settings = loadSettings();
  settings.audio = { ...settings.audio, ...req.body };
  saveSettings(settings);
  res.json({ ok: true, audio: settings.audio });
});

// ============ SESSION MANAGEMENT ============

let sessionState = {
  mode: 'deliberation',
  topic: '',
  messages: []
};

app.get('/api/session', (req, res) => res.json(sessionState));

app.post('/api/session/start', (req, res) => {
  const { mode, topic } = req.body;
  sessionState = { mode: mode || 'deliberation', topic: topic || '', messages: [] };
  res.json({ ok: true, session: sessionState });
});

app.post('/api/session/stop', (req, res) => {
  sessionState.messages = [];
  res.json({ ok: true });
});

// ============ ASK THE COUNCIL ============

app.post('/api/ask', async (req, res) => {
  const { question, mode = 'deliberation' } = req.body;
  
  res.json({
    question,
    mode,
    response: '[Council deliberation would happen here]',
    timestamp: new Date().toISOString()
  });
});

// ============ START SERVER ============

app.listen(PORT, () => {
  console.log(`🤖 AI Council API running on port ${PORT}`);
  console.log('');
  console.log('REST Endpoints:');
  console.log('  GET  /api/health');
  console.log('  GET  /api/settings');
  console.log('  PUT  /api/settings');
  console.log('  GET  /api/councilors');
  console.log('  POST /api/councilors');
  console.log('  PATCH /api/councilors/:id');
  console.log('  DELETE /api/councilors/:id');
  console.log('  GET  /api/providers');
  console.log('  PUT  /api/providers/:name');
  console.log('  GET/PATCH /api/ui');
  console.log('  GET/PATCH /api/audio');
  console.log('  GET/POST /api/session');
  console.log('  POST /api/ask');
  console.log('');
  console.log('MCP Endpoint:');
  console.log('  POST /mcp (JSON-RPC)');
  console.log('');
});
