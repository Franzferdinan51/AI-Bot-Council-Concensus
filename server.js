/**
 * AI Council API Server v2.0.0
 * Full REST API for AI Senate deliberation engine
 * Run: node server.js
 */

import express from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';

// Load councilors from constants.ts via dynamic import (avoids TS compilation step)
let councilors = [];
try {
  // Dynamic import - works if tsx or ts-node is available, otherwise use fallback
  const mod = await import('./constants.js').catch(() => null) || 
              await import('./dist/constants.js').catch(() => null);
  if (mod?.DEFAULT_BOTS) councilors = mod.DEFAULT_BOTS.map(b => ({ ...b }));
} catch (e) { /* use fallback */ }

// Fallback councilors if constants can't be loaded
if (councilors.length === 0) {
  councilors = [
    { id: 'speaker', name: 'High Speaker', role: 'speaker', model: 'MiniMax-M2.7', color: 'from-amber-500 to-yellow-700', enabled: true, persona: '' },
    { id: 'moderator', name: 'The Facilitator', role: 'moderator', model: 'qwen3.5-plus', color: 'from-cyan-500 to-blue-600', enabled: true, persona: '' },
    { id: 'technocrat', name: 'The Technocrat', role: 'councilor', model: 'MiniMax-M2.7', color: 'from-emerald-500 to-teal-700', enabled: true, persona: '' },
    { id: 'ethicist', name: 'The Ethicist', role: 'councilor', model: 'MiniMax-M2.7', color: 'from-rose-500 to-pink-700', enabled: true, persona: '' },
    { id: 'pragmatist', name: 'The Pragmatist', role: 'councilor', model: 'MiniMax-M2.7', color: 'from-slate-500 to-gray-700', enabled: true, persona: '' },
    { id: 'visionary', name: 'The Visionary', role: 'councilor', model: 'MiniMax-M2.7', color: 'from-violet-500 to-purple-700', enabled: true, persona: '' },
    { id: 'sentinel', name: 'The Sentinel', role: 'councilor', model: 'MiniMax-M2.7', color: 'from-red-600 to-red-900', enabled: true, persona: '' },
  ];
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── In-memory state ────────────────────────────────────────────────────────
let messages = [];
let sessionState = { status: 'idle', mode: 'proposal', topic: null, activeBots: [], votes: [], startedAt: null };
let settings = {};
let healthMetrics = { requests: 0, errors: 0, startTime: Date.now() };

// ─── Helpers ─────────────────────────────────────────────────────────────────
const uuid = () => randomUUID();
const apiKey = process.env.API_KEY || 'council-default-key';
const requireApiKey = (req, res, next) => {
  const key = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  if (key && key !== apiKey) return res.status(401).json({ error: 'Invalid API key' });
  next();
};
const ok = (res, data) => res.json(data);
const created = (res, data) => res.status(201).json(data);
const err = (res, status, msg) => res.status(status).json({ error: msg });

// ─── Health ─────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'ai-council-api', version: '2.0.0' }));
app.get('/api/health', (req, res) => {
  healthMetrics.requests++;
  ok(res, { status: 'ok', version: '2.0.0', uptime: Date.now() - healthMetrics.startTime, requests: healthMetrics.requests, errors: healthMetrics.errors, councilors: councilors.length });
});
app.get('/api/metrics', (req, res) => { healthMetrics.requests++; ok(res, { uptime: Date.now() - healthMetrics.startTime, requests: healthMetrics.requests, errors: healthMetrics.errors }); });

// ─── Councilors ─────────────────────────────────────────────────────────────
app.get('/api/councilors', (req, res) => {
  healthMetrics.requests++;
  let result = [...councilors];
  if (req.query.role) result = result.filter(c => c.role === req.query.role);
  if (req.query.enabled !== undefined) result = result.filter(c => c.enabled === (req.query.enabled === 'true'));
  ok(res, result.map(c => ({ id: c.id, name: c.name, role: c.role, enabled: c.enabled, model: c.model, color: c.color })));
});
app.get('/api/councilors/by-role/:role', (req, res) => { healthMetrics.requests++; ok(res, councilors.filter(c => c.role === req.params.role)); });
app.get('/api/councilors/:id', (req, res) => {
  healthMetrics.requests++;
  const bot = councilors.find(c => c.id === req.params.id || c.name?.toLowerCase() === req.params.id.toLowerCase());
  bot ? ok(res, bot) : err(res, 404, 'Councilor not found');
});
app.post('/api/councilors', requireApiKey, (req, res) => {
  healthMetrics.requests++;
  const { id, name, role, persona, model, color, enabled } = req.body;
  if (!id || !name) return err(res, 400, 'id and name required');
  if (councilors.find(c => c.id === id)) return err(res, 409, 'Already exists');
  councilors.push({ id, name, role: role || 'councilor', persona: persona || '', model: model || 'MiniMax-M2.7', color: color || 'from-slate-500 to-slate-600', enabled: enabled !== false });
  created(res, councilors[councilors.length - 1]);
});
app.patch('/api/councilors/:id', requireApiKey, (req, res) => {
  healthMetrics.requests++;
  const bot = councilors.find(c => c.id === req.params.id || c.name?.toLowerCase() === req.params.id.toLowerCase());
  if (!bot) return err(res, 404, 'Councilor not found');
  const { name, enabled, persona, model, color } = req.body;
  if (name !== undefined) bot.name = name;
  if (enabled !== undefined) bot.enabled = enabled;
  if (persona !== undefined) bot.persona = persona;
  if (model !== undefined) bot.model = model;
  if (color !== undefined) bot.color = color;
  ok(res, bot);
});
app.delete('/api/councilors/:id', requireApiKey, (req, res) => {
  healthMetrics.requests++;
  const idx = councilors.findIndex(c => c.id === req.params.id || c.name?.toLowerCase() === req.params.id.toLowerCase());
  idx === -1 ? err(res, 404, 'Not found') : (councilors.splice(idx, 1), ok(res, { deleted: true }));
});

// ─── Modes ──────────────────────────────────────────────────────────────────
app.get('/api/modes', (req, res) => {
  healthMetrics.requests++;
  ok(res, [
    { id: 'proposal', name: 'Legislative', description: 'Debate → vote → enact' },
    { id: 'deliberation', name: 'Deliberation', description: 'Roundtable discussion → summary' },
    { id: 'inquiry', name: 'Inquiry', description: 'Q&A → synthesis' },
    { id: 'research', name: 'Research', description: 'Deep dive → plan → report' },
    { id: 'swarm', name: 'Swarm', description: 'Decompose → parallel → aggregate' },
    { id: 'swarm_coding', name: 'Swarm Coding', description: 'Architect → dev swarm → code' },
    { id: 'prediction', name: 'Prediction', description: 'Probability & outcome analysis' },
    { id: 'emergency', name: 'Emergency', description: 'Fast triage → rapid response' },
  ]);
});

// ─── Session ─────────────────────────────────────────────────────────────────
app.get('/api/session', (req, res) => { healthMetrics.requests++; ok(res, { ...sessionState, messageCount: messages.length }); });
app.post('/api/session/start', requireApiKey, (req, res) => {
  healthMetrics.requests++;
  const { topic, mode } = req.body;
  messages = [];
  sessionState = { status: 'opening', mode: mode || 'proposal', topic, activeBots: councilors.filter(b => b.enabled), votes: [], startedAt: Date.now() };
  created(res, sessionState);
});
app.post('/api/session/stop', requireApiKey, (req, res) => { healthMetrics.requests++; sessionState.status = 'adjourned'; ok(res, { stopped: true }); });
app.get('/api/session/messages', (req, res) => {
  healthMetrics.requests++;
  let result = messages;
  if (req.query.since) result = result.filter(m => new Date(m.timestamp) > new Date(req.query.since));
  ok(res, result);
});
app.post('/api/ask', requireApiKey, (req, res) => {
  healthMetrics.requests++;
  const { topic, mode, councilorIds } = req.body;
  if (!topic) return err(res, 400, 'topic required');
  const selected = councilorIds ? councilors.filter(c => councilorIds.includes(c.id)) : councilors.filter(c => c.enabled);
  messages.push({ id: uuid(), author: 'User', content: topic, timestamp: Date.now() });
  sessionState.status = 'debating';
  const response = { id: uuid(), author: 'Council', content: `[Deliberation: ${topic}] ${selected.length} councilors engaged.`, timestamp: Date.now() };
  messages.push(response);
  ok(res, { result: response, councilorsEngaged: selected.length });
});

// ─── Voting ──────────────────────────────────────────────────────────────────
app.post('/api/vote', requireApiKey, (req, res) => {
  healthMetrics.requests++;
  const { voterId, choice, confidence, rationale } = req.body;
  if (!voterId || !choice) return err(res, 400, 'voterId and choice required');
  const existing = sessionState.votes.findIndex(v => v.voterId === voterId);
  const vote = { voterId, choice, confidence: confidence || 5, rationale: rationale || '', timestamp: Date.now() };
  existing >= 0 ? (sessionState.votes[existing] = vote, ok(res, { updated: true, vote })) : (sessionState.votes.push(vote), created(res, { recorded: true, vote }));
});
app.get('/api/votes', (req, res) => {
  healthMetrics.requests++;
  const yeas = sessionState.votes.filter(v => v.choice.toUpperCase().includes('YEA')).length;
  const nays = sessionState.votes.length - yeas;
  const avgConf = sessionState.votes.reduce((s, v) => s + (v.confidence || 0), 0) / (sessionState.votes.length || 1);
  ok(res, { votes: sessionState.votes, yeas, nays, avgConfidence: avgConf, total: sessionState.votes.length });
});
app.get('/api/consensus', (req, res) => {
  healthMetrics.requests++;
  const yeas = sessionState.votes.filter(v => v.choice.toUpperCase().includes('YEA')).length;
  const nays = sessionState.votes.length - yeas;
  const total = yeas + nays;
  const margin = total > 0 ? Math.abs(yeas - nays) / total : 1;
  const score = Math.round((margin * 0.7 + 0.3 * (sessionState.votes[0]?.confidence || 5) / 10) * 100);
  let label = 'Divided';
  if (score > 85) label = 'Unanimous';
  else if (score > 65) label = 'Strong Consensus';
  else if (score > 40) label = 'Contentious';
  ok(res, { yeas, nays, consensusScore: score, consensusLabel: label, result: yeas > nays ? 'PASSED' : yeas === nays ? 'TIE' : 'REJECTED' });
});

// ─── Settings ───────────────────────────────────────────────────────────────
app.get('/api/settings', (req, res) => { healthMetrics.requests++; ok(res, { bots: councilors, settings }); });
app.put('/api/settings', requireApiKey, (req, res) => { healthMetrics.requests++; settings = { ...settings, ...req.body }; ok(res, settings); });
app.get('/api/ui', (req, res) => { healthMetrics.requests++; ok(res, settings.ui || {}); });
app.patch('/api/ui', requireApiKey, (req, res) => { healthMetrics.requests++; settings.ui = { ...settings.ui, ...req.body }; ok(res, settings.ui); });
app.get('/api/audio', (req, res) => { healthMetrics.requests++; ok(res, settings.audio || { enabled: false }); });
app.patch('/api/audio', requireApiKey, (req, res) => { healthMetrics.requests++; settings.audio = { ...settings.audio, ...req.body }; ok(res, settings.audio); });

// ─── Providers ───────────────────────────────────────────────────────────────
app.get('/api/providers', (req, res) => {
  healthMetrics.requests++;
  ok(res, { minimax: !!process.env.MINIMAX_API_KEY, openrouter: !!process.env.OPENROUTER_API_KEY, lmstudio: !!process.env.LMSTUDIO_URL, gemini: !!process.env.API_KEY });
});
app.put('/api/providers/:name', requireApiKey, (req, res) => {
  healthMetrics.requests++;
  const { name } = req.params;
  const { apiKey: key, endpoint } = req.body;
  process.env[`${name.toUpperCase()}_API_KEY`] = key;
  if (endpoint) process.env[`${name.toUpperCase()}_URL`] = endpoint;
  ok(res, { updated: name });
});

// ─── Session History ─────────────────────────────────────────────────────────
const savedSessions = new Map();
app.get('/api/sessions', (req, res) => { healthMetrics.requests++; ok(res, [...savedSessions.entries()].map(([n, d]) => ({ name: n, messageCount: d.messages.length, savedAt: d.savedAt }))); });
app.post('/api/sessions', requireApiKey, (req, res) => {
  healthMetrics.requests++;
  const { name } = req.body;
  if (!name) return err(res, 400, 'name required');
  savedSessions.set(name, { messages: [...messages], sessionState: { ...sessionState }, savedAt: Date.now() });
  created(res, { saved: name });
});
app.get('/api/sessions/:name', (req, res) => {
  healthMetrics.requests++;
  const data = savedSessions.get(req.params.name);
  data ? ok(res, data) : err(res, 404, 'Session not found');
});
app.delete('/api/sessions/:name', requireApiKey, (req, res) => {
  healthMetrics.requests++;
  savedSessions.has(req.params.name) ? (savedSessions.delete(req.params.name), ok(res, { deleted: true })) : err(res, 404, 'Not found');
});
app.post('/api/export', (req, res) => {
  healthMetrics.requests++;
  const { format } = req.body;
  if (format === 'text') { res.type('text/plain').send(messages.map(m => `[${m.author}]: ${m.content}`).join('\n\n')); }
  else { ok(res, { session: sessionState, messages, votes: sessionState.votes, councilors }); }
});

// ─── Tool Broker ─────────────────────────────────────────────────────────────
app.get('/api/tools/status', (req, res) => { healthMetrics.requests++; ok(res, { brave: !!process.env.BRAVE_API_KEY, browseros: true }); });

app.post('/api/tools/web-search', async (req, res) => {
  healthMetrics.requests++;
  const { query, count } = req.body;
  if (!query) return err(res, 400, 'query required');
  try {
    const r = await fetch('http://127.0.0.1:9002/mcp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/call', params: { name: 'browseros_web_search', arguments: { query, count: count || 5 } }, id: Date.now() })
    });
    if (r.ok) return ok(res, await r.json());
  } catch (e) { /* BrowserOS unavailable */ }
  ok(res, { results: [{ title: `Search: ${query}`, snippet: 'BrowserOS unavailable' }] });
});

app.post('/api/tools/browser-open', async (req, res) => {
  healthMetrics.requests++;
  const { url } = req.body;
  if (!url) return err(res, 400, 'url required');
  try {
    const r = await fetch('http://127.0.0.1:9002/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/call', params: { name: 'browseros_open', arguments: { url } }, id: Date.now() }) });
    if (r.ok) return ok(res, await r.json());
  } catch (e) { /* fall through */ }
  ok(res, { opened: url, note: 'BrowserOS unavailable' });
});

app.get('/api/tools/browser-active', async (req, res) => {
  try {
    const r = await fetch('http://127.0.0.1:9002/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/call', params: { name: 'browseros_get_active_page', arguments: {} }, id: Date.now() }) });
    if (r.ok) return ok(res, await r.json());
  } catch (e) { /* fall through */ }
  ok(res, { active: false });
});

app.post('/api/tools/browser-content', async (req, res) => {
  try {
    const { page } = req.body;
    const r = await fetch('http://127.0.0.1:9002/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/call', params: { name: 'browseros_get_page_content', arguments: { page: page || 1 } }, id: Date.now() }) });
    if (r.ok) return ok(res, await r.json());
  } catch (e) { /* fall through */ }
  ok(res, { content: '', note: 'BrowserOS unavailable' });
});

app.post('/api/tools/browser-call', async (req, res) => {
  try {
    const { name, arguments: args = {} } = req.body;
    const r = await fetch('http://127.0.0.1:9002/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/call', params: { name: `browseros_${name}`, arguments: args }, id: Date.now() }) });
    if (r.ok) return ok(res, await r.json());
  } catch (e) { /* fall through */ }
  ok(res, { error: 'BrowserOS unavailable' });
});

// ─── MCP Proxy ────────────────────────────────────────────────────────────────
app.post('/mcp', async (req, res) => {
  healthMetrics.requests++;
  const { method, params, id } = req.body;
  if (method === 'tools/list') return res.json({ jsonrpc: '2.0', result: { tools: councilors.map(c => ({ name: c.id, description: c.persona?.substring(0, 80) || c.role })) }, id });
  if (method === 'tools/call') {
    const { name } = params || {};
    return res.json({ jsonrpc: '2.0', result: { ok: true, delegated: true, tool: name }, id });
  }
  res.status(400).json({ jsonrpc: '2.0', error: { code: -32601, message: 'Method not found' }, id });
});

// ─── Webhooks ────────────────────────────────────────────────────────────────
const webhooks = [];
app.post('/api/webhooks', requireApiKey, (req, res) => {
  healthMetrics.requests++;
  const { url, events } = req.body;
  if (!url) return err(res, 400, 'url required');
  const hook = { id: uuid(), url, events: events || ['deliberation_complete'], createdAt: Date.now() };
  webhooks.push(hook);
  created(res, hook);
});
app.get('/api/webhooks', (req, res) => { healthMetrics.requests++; ok(res, webhooks); });
app.delete('/api/webhooks/:id', requireApiKey, (req, res) => {
  healthMetrics.requests++;
  const idx = webhooks.findIndex(h => h.id === req.params.id);
  idx === -1 ? err(res, 404, 'Not found') : (webhooks.splice(idx, 1), ok(res, { deleted: true }));
});

// ─── Error Handler ───────────────────────────────────────────────────────────
app.use((e, req, res) => {
  healthMetrics.errors++;
  console.error(`[ERROR] ${e.message}`);
  res.status(500).json({ error: e.message || 'Internal error' });
});

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.error(`🏛️  AI Council API v2.0.0 running on port ${PORT}`);
  console.error(`📍 ${councilors.length} councilors loaded`);
  console.error(`🔗 API: /api/councilors, /api/session, /api/vote, /api/modes, /api/tools, /api/settings, /api/sessions, /api/webhooks`);
});
