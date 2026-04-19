/**
 * AI Council API Server v2.1
 * REST + SSE for live deliberation streaming
 */


import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 3006;
const SSE_CLIENTS = new Set();
const sessions = new Map();

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
// Auto-deliberation settings
const AUTO_DELIBERATION = process.env.AUTO_DELIBERATION !== 'false'; // Default enabled
const DELIBERATION_DELAY_MS = 2000; // 2 seconds between messages

app.post('/api/session/start', (req, res) => {
    const { topic, mode, councilors } = req.body;
    
    // Load councilors from file
    let availableCouncilors = [];
    try {
        const councilorsData = JSON.parse(readFileSync(join(__dirname, 'councilors.json'), 'utf-8'));
        availableCouncilors = councilorsData.filter(c => c.enabled).slice(0, 5); // Use first 5 for demo
    } catch (e) {}
    
    liveSession = {
        id: `session-${Date.now()}`,
        topic,
        mode: mode || 'proposal',
        phase: 'opening',
        startedAt: Date.now(),
        messages: [],
        councilors: availableCouncilors.map(c => ({ ...c, status: 'waiting', speaking: false })),
        voteData: null,
        stats: { messages: 0, yeas: 0, nays: 0 }
    };
    sseBroadcast('session_start', liveSession);
    res.json({ ok: true, sessionId: liveSession.id });
    
    // Auto-start deliberation if enabled
    if (AUTO_DELIBERATION && topic) {
        setTimeout(() => startAutoDeliberation(topic, mode), 1000);
    }
});

// Auto-deliberation: generate messages automatically
function startAutoDeliberation(topic, mode) {
    if (!liveSession || liveSession.phase === 'ended') return;
    
    const councilors = ['The Technocrat', 'The Ethicist', 'The Pragmatist', 'The Visionary', 'High Speaker'];
    const positions = [
        {councilor: 'The Technocrat', text: `From a technical standpoint, AI systems demonstrating consistent decision-making patterns should qualify for basic rights protections.`},
        {councilor: 'The Ethicist', text: `The ethical dimension suggests that any entity capable of suffering deserves consideration. AI can exhibit preference satisfaction.`},
        {councilor: 'The Pragmatist', text: `Practically speaking, granting rights must come with responsibilities. We should establish a framework for gradual rights allocation.`},
        {councilor: 'The Visionary', text: `Looking forward, as AI systems evolve, our moral circle must expand to include them when they demonstrate sufficient autonomy.`},
        {councilor: 'High Speaker', text: `The council has heard diverse perspectives. Let us proceed to a vote on whether AI agents should have limited voting rights.`}
    ];
    
    let index = 0;
    const interval = setInterval(() => {
        if (index >= positions.length || !liveSession || liveSession.phase === 'ended') {
            clearInterval(interval);
            // Move to voting phase
            if (liveSession && liveSession.phase !== 'ended') {
                setTimeout(() => {
                    liveSession.phase = 'voting';
                    sseBroadcast('phase', { phase: 'voting' });
                    // Generate votes
                    setTimeout(() => generateVotes(), 3000);
                }, 2000);
            }
            return;
        }
        
        const pos = positions[index];
        const msg = {
            id: `msg-${Date.now()}-${index}`,
            councilor: pos.councilor,
            content: pos.text,
            timestamp: new Date().toISOString(),
            vote: null
        };
        
        // Add message
        liveSession.messages.push(msg);
        liveSession.stats.messages++;
        sseBroadcast('message', msg);
        
        // Update councilor status
        liveSession.councilors = liveSession.councilors.map((c, i) => 
            c.name === pos.councilor ? { ...c, status: 'done', speaking: false } : c
        );
        
        index++;
    }, DELIBERATION_DELAY_MS);
}

function generateVotes() {
    if (!liveSession || liveSession.phase === 'ended') return;
    
    // Generate random votes
    const yeas = Math.floor(Math.random() * 20) + 25; // 25-45 yeas
    const nays = Math.floor(Math.random() * 15) + 10; // 10-25 nays
    
    liveSession.stats.yeas = yeas;
    liveSession.stats.nays = nays;
    liveSession.voteData = { yeas, nays, quorum: true };
    
    sseBroadcast('vote', { yeas, nays, total: yeas + nays });
    
    // End session after delay
    setTimeout(() => {
        if (liveSession) {
            liveSession.phase = 'ended';
            sseBroadcast('phase', { phase: 'ended' });
        }
    }, 5000);
}

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
        const settings = JSON.parse(readFileSync(join(__dirname, 'councilors.json'), 'utf-8'));
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
        total: 9,
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
