#!/usr/bin/env node
/**
 * AI Council CLI v3 — Full-featured command-line interface
 * 
 * Installation:
 *   npm install -g  (from this directory)
 *   OR: alias council="node /path/to/cli.js"
 * 
 * Environment:
 *   COUNCIL_API   API base URL (default: http://localhost:3006)
 *   COUNCIL_KEY   API key (optional)
 */

const API = process.env.COUNCIL_API || 'http://localhost:3006';
const API_KEY = process.env.COUNCIL_KEY || '';
const args = process.argv.slice(2);

// ─── API HELPERS ─────────────────────────────────────────────────────────────

async function api(path, method = 'GET', body = null) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { 'Authorization': `Bearer ${API_KEY}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`HTTP ${res.status}: ${txt}`);
  }
  return res.json();
}

async function apiText(path, method = 'GET', body = null) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { 'Authorization': `Bearer ${API_KEY}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`HTTP ${res.status}: ${txt}`);
  }
  return res.text();
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

function p(json) { console.log(JSON.stringify(json, null, 2)); }
function pjson(j) { console.log(JSON.stringify(j, null, 2)); }
function info(msg) { console.log('\x1b[36mℹ\x1b[0m', msg); }
function ok(msg) { console.log('\x1b[32m✓\x1b[0m', msg); }
function err(msg) { console.error('\x1b[31m✗\x1b[0m', msg); }
function warn(msg) { console.log('\x1b[33m⚠\x1b[0m', msg); }
function section(msg) { console.log('\n\x1b[1m' + msg + '\x1b[0m'); }
function stripHtml(text) {
  return String(text || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

// ─── MODES ───────────────────────────────────────────────────────────────────

const MODES = [
  { id: 'proposal',     label: 'Legislate',      icon: '⚖️',  desc: 'Debate + vote on proposals' },
  { id: 'deliberation', label: 'Deliberate',      icon: '⚖️',  desc: 'Deep roundtable discussion' },
  { id: 'inquiry',      label: 'Inquiry',         icon: '🔍',  desc: 'Rapid-fire Q&A' },
  { id: 'research',     label: 'Deep Research',   icon: '📊',  desc: 'Recursive multi-round investigation' },
  { id: 'swarm',        label: 'Swarm Hive',       icon: '🐝',  desc: 'Parallel task decomposition' },
  { id: 'swarm_coding', label: 'Swarm Coding',    icon: '⚡',  desc: 'Full software engineering workflow' },
  { id: 'prediction',   label: 'Prediction',      icon: '🎯',  desc: 'Superforecasting with probability' },
  { id: 'government',   label: 'Legislature',     icon: '🏛️', desc: 'Full legislative process (5 phases)' },
  { id: 'inspector',    label: 'Inspector',        icon: '🔬', desc: 'Deep visual + data analysis (use with --image)' },
];

const MODE_MAP = Object.fromEntries(MODES.map(m => [m.id, m]));

// ─── COMMANDS ────────────────────────────────────────────────────────────────

async function cmdHealth() {
  const data = await api('/api/health');
  ok(`AI Council API is healthy (v${data.version || '?'})`);
  if (data.viewers !== undefined) info(`${data.viewers} viewer(s) connected`);
}

async function cmdStatus() {
  const data = await api('/api/status');
  console.log('\n\x1b[1m🤖 AI Council Status\x1b[0m');
  console.log(`  Version:  ${data.version || '?'}`);
  console.log(`  Uptime:   ${data.uptime ? Math.floor(data.uptime / 60) + 'm' : '?'}`);
  console.log(`  Requests: ${data.metrics?.totalRequests || 0}`);
  console.log(`  Mode:     ${data.currentMode || 'idle'}`);
  console.log(`  Session:  ${data.sessionActive ? '🟢 active' : '🔴 idle'}`);
}

async function cmdListModes() {
  section('🎭 13 Deliberation Modes');
  for (const m of MODES) {
    console.log(`  ${m.icon} ${m.id.padEnd(14)} ${m.desc}`);
  }
}

async function cmdListCouncilors() {
  const data = await api('/api/councilors');
  const bots = data.councilors || data.bots || data || [];
  console.log(`\n\x1b[1m👥 ${bots.length} Councilors\x1b[0m`);
  for (const b of bots) {
    const enabled = b.enabled === false ? '\x1b[31m[disabled]\x1b[0m' : '';
    const role = b.role ? `\x1b[2m(${b.role})\x1b[0m` : '';
    console.log(`  \x1b[36m${(b.name || b.id).padEnd(20)}\x1b[0m ${role} ${enabled}`);
  }
}

async function cmdAsk(question, opts = {}) {
  const mode = opts.mode || 'deliberation';
  const councilors = opts.councilors;
  const image = opts.image;

  info(`Starting ${MODE_MAP[mode]?.label || mode} session...`);
  console.log(`  Topic: ${question}\n`);

  try {
    // Start session
    const sessionRes = await api('/api/session/start', 'POST', {
      mode,
      topic: question,
      ...(councilors ? { councilors } : {}),
    });

    const sessionId = sessionRes.sessionId || sessionRes.id;
    if (sessionId) info(`Session: ${sessionId}`);

    // Poll for completion (SSE would be better but CLI-friendly polling)
    let messages = [];
    let attempts = 0;
    const maxAttempts = 60; // ~2 minutes

    while (attempts < maxAttempts) {
      await sleep(2000);
      attempts++;

      try {
        const msgRes = await api('/api/session/messages');
        messages = msgRes.messages || msgRes || [];
        const lastMsg = messages[messages.length - 1];

        if (lastMsg) {
          // Show latest message
          const role = lastMsg.roleLabel || lastMsg.author || '';
          const content = stripHtml(lastMsg.content || '');
          if (content) {
            console.log(`\x1b[2m[${role}]\x1b[0m ${content.substring(0, 300)}${content.length > 300 ? '...' : ''}`);
          }

          // Check for vote/prediction/inspection data
          if (lastMsg.voteData) {
            const { yeas, nays, result } = lastMsg.voteData;
            console.log(`\n\x1b[1m🗳️ VOTE RESULT: ${result} — Y:${yeas} / N:${nays}\x1b[0m`);
          }
          if (lastMsg.predictionData) {
            const pd = lastMsg.predictionData;
            console.log(`\n\x1b[1m🎯 FORECAST: ${pd.probability || pd.outcome || 'Generated'}\x1b[0m`);
            if (pd.confidence) console.log(`  Confidence: ${pd.confidence}`);
            if (pd.timeline) console.log(`  Timeline: ${pd.timeline}`);
          }
        }

        // Check if session ended
        const statusRes = await api('/api/session').catch(() => ({}));
        const status = statusRes.status || statusRes.sessionStatus || '';
        if (['adjourned', 'completed', 'idle', 'ADJOURNED', 'IDLE'].includes(status)) {
          ok('Session complete');
          break;
        }
      } catch (e) {
        // Session may have ended
        if (attempts > 3) break;
      }
    }

    if (attempts >= maxAttempts) warn('Session timed out');

  } catch (e) {
    if (e.message.includes('401') || e.message.includes('403')) {
      err('API key required. Set COUNCIL_KEY env var.');
    } else {
      err(`Session error: ${e.message}`);
    }
  }
}

async function cmdInspect(imagePath, question, opts = {}) {
  // Read and encode image
  let imageData = imagePath;

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    info(`Fetching image from ${imagePath}`);
    try {
      const res = await fetch(imagePath);
      const buf = await res.arrayBuffer();
      const b64 = Buffer.from(buf).toString('base64');
      const mime = res.headers.get('content-type') || 'image/jpeg';
      imageData = `data:${mime};base64,${b64}`;
    } catch (e) {
      err(`Failed to fetch image: ${e.message}`);
      process.exit(1);
    }
  } else {
    // Local file
    const fs = await import('fs');
    if (!fs.existsSync(imagePath)) {
      err(`Image not found: ${imagePath}`);
      process.exit(1);
    }
    const buf = fs.readFileSync(imagePath);
    const ext = imagePath.split('.').pop().toLowerCase();
    const mime = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' }[ext] || 'image/jpeg';
    imageData = `data:${mime};base64,${buf.toString('base64')}`;
  }

  info('Sending to Inspector mode...');
  try {
    const res = await api('/api/vision/inspect', 'POST', {
      image: imageData,
      topic: question || 'Analyze this image in detail',
      mode: 'inspector',
    });
    console.log('\n' + stripHtml(res.content || res.response || JSON.stringify(res)));
  } catch (e) {
    err(`Inspector error: ${e.message}`);
  }
}

async function cmdGovernment(topic, opts = {}) {
  info('Starting Legislature session...');
  try {
    const res = await api('/api/session/start', 'POST', {
      mode: 'government',
      topic,
    });
    const sessionId = res.sessionId || res.id;
    info(`Session: ${sessionId}`);

    // Poll
    for (let i = 0; i < 60; i++) {
      await sleep(2500);
      try {
        const msgs = await api('/api/session/messages');
        const last = (msgs.messages || msgs || []).slice(-1)[0];
        if (last) {
          const c = stripHtml(last.content || '');
          if (c) console.log(`\x1b[2m[${last.roleLabel || last.author}]\x1b[0m ${c.substring(0, 250)}`);
        }
        const status = await api('/api/session').catch(() => ({}));
        if (['adjourned', 'IDLE', 'idle'].includes(status.status || '')) { ok('Legislative session complete'); break; }
      } catch { break; }
    }
  } catch (e) { err(`Government mode error: ${e.message}`); }
}

async function cmdVote(topic, opts = {}) {
  // Run a proposal session and cast votes
  info(`Legislating on: ${topic}`);
  try {
    const res = await api('/api/session/start', 'POST', {
      mode: 'proposal',
      topic,
    });
    const sessionId = res.sessionId || res.id;
    info(`Session: ${sessionId}`);
    // Poll for vote result
    for (let i = 0; i < 45; i++) {
      await sleep(3000);
      try {
        const msgs = await api('/api/session/messages');
        const msgsArr = msgs.messages || msgs || [];
        const last = msgsArr[msgsArr.length - 1];
        if (last?.voteData) {
          const { yeas, nays, result, consensusScore } = last.voteData;
          section('🗳️ VOTE RESULT');
          console.log(`  Outcome: ${result}`);
          console.log(`  Yea: ${yeas} | Nay: ${nays}`);
          console.log(`  Consensus: ${consensusScore}%`);
          break;
        }
        if (i % 5 === 0 && last) {
          const c = stripHtml(last.content || '').substring(0, 200);
          if (c) console.log(`\x1b[2m... ${c}`);
        }
        const status = await api('/api/session').catch(() => ({}));
        if (['adjourned', 'IDLE', 'idle'].includes(status.status || '')) { ok('Vote complete'); break; }
      } catch { break; }
    }
  } catch (e) { err(`Vote error: ${e.message}`); }
}

async function cmdPredict(topic, opts = {}) {
  info(`Forecasting: ${topic}`);
  try {
    const res = await api('/api/session/start', 'POST', {
      mode: 'prediction',
      topic,
    });
    const sessionId = res.sessionId || res.id;
    info(`Session: ${sessionId}`);
    for (let i = 0; i < 45; i++) {
      await sleep(3000);
      try {
        const msgs = await api('/api/session/messages');
        const msgsArr = msgs.messages || msgs || [];
        const last = msgsArr[msgsArr.length - 1];
        if (last?.predictionData) {
          const pd = last.predictionData;
          section('🎯 FORECAST');
          if (pd.summary) console.log(`  ${pd.summary}`);
          if (pd.probability) console.log(`  Probability: ${pd.probability}`);
          if (pd.timeline) console.log(`  Timeline: ${pd.timeline}`);
          if (pd.confidence) console.log(`  Confidence: ${pd.confidence}`);
          if (pd.best_case) console.log(`  🌱 Best: ${pd.best_case}`);
          if (pd.worst_case) console.log(`  🔥 Worst: ${pd.worst_case}`);
          break;
        }
        if (i % 5 === 0 && last) {
          const c = stripHtml(last.content || '').substring(0, 200);
          if (c) console.log(`\x1b[2m... ${c}`);
        }
        const status = await api('/api/session').catch(() => ({}));
        if (['adjourned', 'IDLE', 'idle'].includes(status.status || '')) { ok('Forecast complete'); break; }
      } catch { break; }
    }
  } catch (e) { err(`Prediction error: ${e.message}`); }
}

async function cmdClear() {
  await api('/api/session/clear', 'POST');
  ok('Session cleared');
}

async function cmdEvents() {
  info('Subscribing to SSE stream...');
  const res = await fetch(`${API}/api/events`);
  if (!res.ok) { err(`SSE error: HTTP ${res.status}`); return; }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            const name = data.name || data.event || 'event';
            const content = stripHtml(data.content || JSON.stringify(data).substring(0, 100));
            console.log(`\x1b[36m[${name}]\x1b[0m ${content}`);
          } catch {}
        }
      }
    }
  } catch (e) {
    if (e.name !== 'AbortError') err(`SSE error: ${e.message}`);
  }
}

async function cmdMCP() {
  info('Starting MCP server (stdio)...');
  // Run the MCP server directly
  const { spawn } = await import('child_process');
  const mcpPath = `${API}/../mcp-server.mjs`.replace('/api/../', '/');
  const child = spawn('node', [mcpPath], { stdio: 'inherit' });
  child.on('exit', (code) => process.exit(code || 0));
}

// ─── UTILS ─────────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── MAIN ENTRY ────────────────────────────────────────────────────────────

async function main() {
  if (args.length === 0) {
    printUsage();
    return;
  }

  const cmd = args[0];

  // Parse global flags
  let question = '';
  let mode = '';
  let image = '';
  let rawArgs = [];

  // Collect args until we hit a flag
  for (let i = 1; i < args.length; i++) {
    const a = args[i];
    if (a === '--') { rawArgs = args.slice(i + 1); break; }
    if (a.startsWith('--')) break;
    question += (question ? ' ' : '') + a;
  }

  // Parse flags from remaining args + rawArgs
  const allArgs = [...args.slice(1), ...rawArgs];
  for (let i = 0; i < allArgs.length; i++) {
    const a = allArgs[i];
    if (a === '-m' || a === '--mode') mode = allArgs[++i] || '';
    else if (a === '-i' || a === '--image') image = allArgs[++i] || '';
    else if (a === '--inspector' || a === '-I') mode = 'inspector';
    else if (a === '--government') mode = 'government';
    else if (a === '--predict' || a === '-p') mode = 'prediction';
    else if (a === '--vote') mode = 'proposal';
  }

  try {
    switch (cmd) {
      case '-h': case '--help': printUsage(); break;
      case 'health': await cmdHealth(); break;
      case 'status': await cmdStatus(); break;
      case 'modes': await cmdListModes(); break;
      case 'councilors': await cmdListCouncilors(); break;
      case 'ask': await cmdAsk(question, { mode }); break;
      case 'inspect': await cmdInspect(image || question, ''); break;
      case 'legislate': case 'gov': await cmdGovernment(question, { mode }); break;
      case 'vote': await cmdVote(question, { mode }); break;
      case 'predict': await cmdPredict(question, { mode }); break;
      case 'sse': await cmdEvents(); break;
      case 'mcp': await cmdMCP(); break;
      case 'clear': await cmdClear(); break;
      case 'version': case '-v':
        console.log('AI Council CLI v3.0.0');
        break;
      default:
        if (cmd.startsWith('-')) {
          err(`Unknown flag: ${cmd}`);
        } else {
          // Treat unknown commands as "ask"
          await cmdAsk(cmd + (question ? ' ' + question : ''), { mode });
        }
    }
  } catch (e) {
    err(e.message);
    if (process.env.DEBUG) console.error(e);
    process.exit(1);
  }
}

function printUsage() {
  console.log(`
\x1b[1m🤖 AI Council CLI v3\x1b[0m

\x1b[33mUSAGE:\x1b[0m
  council [command] [options] [--] [question...]

\x1b[33mCOMMANDS:\x1b[0m
  health                      Check API health
  status                      Show server status
  modes                       List all 13 deliberation modes
  councilors                  List all councilors
  ask <topic>                 Start deliberation (default mode)
  inspect [image] <topic>     Deep visual analysis (Inspector mode)
  legislate <topic>           Full legislative process
  vote <topic>                Debate + roll call vote
  predict <topic>             Superforecasting with probability
  sse                         Stream live SSE events
  mcp                         Start MCP server (stdio mode)
  clear                       Clear current session

\x1b[33mOPTIONS:\x1b[0m
  -m, --mode <mode>          Deliberation mode (proposal/deliberation/inquiry/
                              research/swarm/swarm_coding/prediction/government/
                              inspector)
  -i, --image <path|url>    Image file or URL (for Inspector/Vision modes)
  -I, --inspector            Shortcut: use Inspector mode
  --gov                       Shortcut: use Legislature mode
  -p, --predict              Shortcut: use Prediction mode
  -v, --version              Show version

\x1b[33mEXAMPLES:\x1b[0m
  council ask "Should AI have rights?"
  council -m prediction "Will GPT-6 be released in 2026?"
  council -i screenshot.png "Analyze this screenshot"
  council legislate "The AI Act should require safety tests"
  council vote "Should we ban lethal autonomous weapons?"

\x1b[33mENVIRONMENT:\x1b[0m
  COUNCIL_API   API base URL  (default: http://localhost:3006)
  COUNCIL_KEY   API key       (optional)

\x1b[33mMODES:\x1b[0m
  ${MODES.map(m => `${m.icon} ${m.id.padEnd(14)} ${m.desc}`).join('\n  ')}
`);
}

main();
