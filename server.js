/**
 * AI Council API Server v2.1
 * REST + SSE for live deliberation streaming
 */

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 3001;
const SSE_CLIENTS = new Set();

// ─── SSE BROADCAST ───────────────────────────────────────────
function sseBroadcast(eventType, data) {
    const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    SSE_CLIENTS.forEach(res => res.write(payload));
}

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        viewers: SSE_CLIENTS.size
    });
});

// ─── SSE ENDPOINT — live deliberation stream ──────────────────
app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Send initial connection event
    res.write(`event: connected\ndata: ${JSON.stringify({ viewerId: Date.now(), viewers: SSE_CLIENTS.size + 1 })}\n\n`);

    SSE_CLIENTS.add(res);
    sseBroadcast('viewer_count', { count: SSE_CLIENTS.size });

    req.on('close', () => {
        SSE_CLIENTS.delete(res);
        sseBroadcast('viewer_count', { count: SSE_CLIENTS.size });
    });
});

// ─── SESSION EVENTS — frontend pushes events here ────────────
let liveSession = {
    id: null,
    topic: null,
    mode: null,
    phase: 'idle',
    startedAt: null,
    messages: [],
    councilors: [],
    voteData: null,
    stats: { messages: 0, yeas: 0, nays: 0 }
};

// Start a new deliberation session
app.post('/api/session/start', (req, res) => {
    const { topic, mode, councilors } = req.body;
    liveSession = {
        id: `session-${Date.now()}`,
        topic,
        mode,
        phase: 'opening',
        startedAt: Date.now(),
        messages: [],
        councilors: councilors || [],
        voteData: null,
        stats: { messages: 0, yeas: 0, nays: 0 }
    };
    sseBroadcast('session_start', liveSession);
    res.json({ ok: true, sessionId: liveSession.id });
});

// Push a deliberation event (message, status, vote, etc.)
app.post('/api/session/event', (req, res) => {
    const { type, data } = req.body;
    
    switch (type) {
        case 'message':
            liveSession.messages.push(data);
            liveSession.stats.messages++;
            sseBroadcast('message', data);
            break;
            
        case 'phase':
            liveSession.phase = data.phase;
            sseBroadcast('phase', data);
            break;
            
        case 'thinking':
            liveSession.councilors = liveSession.councilors.map(c => 
                c.id === data.id ? { ...c, thinking: data.thinking } : c
            );
            sseBroadcast('thinking', data);
            break;
            
        case 'councilor_start':
            liveSession.councilors = liveSession.councilors.map(c => 
                c.id === data.id ? { ...c, status: 'speaking', speaking: true } : c
            );
            sseBroadcast('councilor_start', data);
            break;
            
        case 'councilor_end':
            liveSession.councilors = liveSession.councilors.map(c => 
                c.id === data.id ? { ...c, status: 'done', speaking: false } : c
            );
            sseBroadcast('councilor_end', data);
            break;
            
        case 'vote':
            liveSession.voteData = data;
            liveSession.stats.yeas = data.yeas || 0;
            liveSession.stats.nays = data.nays || 0;
            sseBroadcast('vote', data);
            break;
            
        case 'prediction':
            sseBroadcast('prediction', data);
            break;
            
        case 'end':
            liveSession.phase = 'adjourned';
            sseBroadcast('session_end', { sessionId: liveSession.id });
            break;
    }
    
    res.json({ ok: true });
});

// Get current session state (for late joiners)
app.get('/api/session', (req, res) => {
    const elapsed = liveSession.startedAt ? Date.now() - liveSession.startedAt : 0;
    res.json({ 
        ...liveSession, 
        elapsed,
        viewerCount: SSE_CLIENTS.size 
    });
});

// Get messages so far
app.get('/api/session/messages', (req, res) => {
    res.json({ messages: liveSession.messages });
});

// Get councilors status
app.get('/api/session/councilors', (req, res) => {
    res.json({ councilors: liveSession.councilors });
});

// Clear session
app.post('/api/session/clear', (req, res) => {
    liveSession = {
        id: null,
        topic: null,
        mode: null,
        phase: 'idle',
        startedAt: null,
        messages: [],
        councilors: [],
        voteData: null,
        stats: { messages: 0, yeas: 0, nays: 0 }
    };
    sseBroadcast('session_clear', {});
    res.json({ ok: true });
});

// ─── Get councilors list ─────────────────────────────────────
app.get('/api/councilors', (req, res) => {
    try {
        const settings = require('./constants').DEFAULT_BOTS;
        res.json(settings.map(b => ({
            id: b.id,
            name: b.name,
            role: b.role,
            enabled: b.enabled,
            model: b.model,
            color: b.color
        })));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ─── LEGACY endpoints (for CLI) ──────────────────────────────
app.get('/api/status', (req, res) => {
    res.json({
        mode: liveSession.mode,
        activeCouncilors: liveSession.councilors.length,
        messageCount: liveSession.messages.length
    });
});


// ── MODES LIST ───────────────────────────────────────────────────────────────
app.get('/api/modes', (req, res) => {
    res.json({
        modes: [
            { id: 'proposal', label: 'Legislate', icon: '⚖️', description: 'Debate + vote on proposals' },
            { id: 'deliberation', label: 'Deliberate', icon: '⚖️', description: 'Deep roundtable discussion' },
            { id: 'inquiry', label: 'Inquiry', icon: '🔍', description: 'Rapid-fire Q&A' },
            { id: 'research', label: 'Deep Research', icon: '📊', description: 'Recursive multi-round investigation' },
            { id: 'swarm', label: 'Swarm Hive', icon: '🐝', description: 'Parallel task decomposition' },
            { id: 'swarm_coding', label: 'Swarm Coding', icon: '⚡', description: 'Full software engineering workflow' },
            { id: 'prediction', label: 'Prediction', icon: '🎯', description: 'Superforecasting with probability' },
            { id: 'government', label: 'Legislature', icon: '🏛️', description: 'Full legislative process (5 phases)' },
            { id: 'inspector', label: 'Inspector', icon: '🔬', description: 'Deep visual + data analysis' },
        ],
        total: 13,
        version: '3.0.0'
    });
});

// ── ASK (ONE-SHOT) ──────────────────────────────────────────────────────────
app.post('/api/ask', (req, res) => {
    const { question, mode, councilors } = req.body;
    if (!question) return res.status(400).json({ error: 'question is required' });
    // Start session and respond immediately with session ID
    const sessionId = `ask-${Date.now()}`;
    sessions.set(sessionId, {
        id: sessionId,
        topic: question,
        mode: mode || 'deliberation',
        councilors: councilors || [],
        status: 'starting',
        messages: [],
        createdAt: new Date().toISOString()
    });
    // TODO: wire to actual deliberation engine via SSE push
    res.json({ sessionId, status: 'started', topic: question, mode: mode || 'deliberation' });
});

// ── INSPECTOR MODE ──────────────────────────────────────────────────────────
app.post('/api/vision/inspect', async (req, res) => {
    const { image, topic, mode } = req.body;
    if (!image && !topic) return res.status(400).json({ error: 'image or topic required' });
    // Forward to React app's deliberation engine
    // The React app handles the actual vision processing via SSE + Gemini API
    res.json({
        sessionId: `insp-${Date.now()}`,
        status: 'started',
        topic: topic || 'Inspect attached image',
        mode: 'inspector',
        note: 'Inspector mode runs through the React app UI. Open http://localhost:3002 and select Inspector mode.'
    });
});

// ── GOVERNMENT / LEGISLATURE MODE ─────────────────────────────────────────
app.post('/api/session/government', (req, res) => {
    res.json({
        sessionId: `gov-${Date.now()}`,
        status: 'started',
        mode: 'government',
        note: 'Government mode runs through the React app UI. Open http://localhost:3002 and select Legislature mode.'
    });
});

// ── PREDICTION MODE ─────────────────────────────────────────────────────────
app.post('/api/session/prediction', (req, res) => {
    res.json({
        sessionId: `pred-${Date.now()}`,
        status: 'started',
        mode: 'prediction',
        note: 'Prediction mode runs through the React app UI. Open http://localhost:3002 and select Prediction mode.'
    });
});

// ── SWARM DECOMPOSITION ───────────────────────────────────────────────────
app.post('/api/session/swarm', (req, res) => {
    res.json({
        sessionId: `swarm-${Date.now()}`,
        status: 'started',
        mode: 'swarm',
        note: 'Swarm mode runs through the React app UI. Open http://localhost:3002 and select Swarm Hive mode.'
    });
});

app.listen(PORT, () => {
    console.log(`🤖 AI Council API v2.1 running on port ${PORT}`);
    console.log(`   SSE: http://localhost:${PORT}/api/events`);
    console.log(`   REST: http://localhost:${PORT}/api/session/*`);
});
