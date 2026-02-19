/**
 * AI Council Full API Server
 * Provides complete REST API for agent control
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

// ============ API ROUTES ============

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

// Update settings (for agents!)
app.put('/api/settings', (req, res) => {
  const current = loadSettings();
  const updates = req.body;
  const newSettings = { ...current, ...updates };
  saveSettings(newSettings);
  res.json({ ok: true, settings: newSettings });
});

// ============ COUNCILOR MANAGEMENT ============

// Get all councilors
app.get('/api/councilors', (req, res) => {
  const settings = loadSettings();
  res.json(settings.bots || []);
});

// Add/update councilor
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

// Enable/disable councilor
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

// Delete councilor
app.delete('/api/councilors/:id', (req, res) => {
  const settings = loadSettings();
  const { id } = req.params;
  settings.bots = settings.bots.filter(b => b.id !== id);
  saveSettings(settings);
  res.json({ ok: true });
});

// ============ PROVIDER/API MANAGEMENT ============

// Get API keys (masked)
app.get('/api/providers', (req, res) => {
  const settings = loadSettings();
  const masked = { ...settings.providers };
  
  // Mask API keys
  for (const key in masked) {
    if (masked[key]?.apiKey) {
      masked[key].apiKey = '****' + masked[key].apiKey.slice(-4);
    }
  }
  res.json(masked);
});

// Update provider
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
  
  // This would connect to actual AI service
  // For now return mock response
  res.json({
    question,
    mode,
    response: `[Council deliberation would happen here]`,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🤖 AI Council API running on port ${PORT}`);
  console.log('Endpoints:');
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
});
