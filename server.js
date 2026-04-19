/**
 * AI Council API Server v2.1
 * REST + SSE for live deliberation streaming
 */


import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 3006;
const SSE_CLIENTS = new Set();
const sessions = new Map();

// ─── LLM Integration (MiniMax) ───────────────────────────────────
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
const MINIMAX_API_URL = 'https://api.minimax.chat/v1/text/chatcompletion_pro?GroupId=tuoyunbauVJxbGWRy';

async function callLLM(messages, model = 'MiniMax-M2.7') {
    if (!MINIMAX_API_KEY) {
        return { error: 'No API key configured' };
    }
    
    try {
        const response = await fetch(MINIMAX_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MINIMAX_API_KEY}`
            },
            body: JSON.stringify({
                model: 'MiniMax-M2.7',
                tokens_to_generate: 512,
                temperature: 0.7,
                top_p: 0.95,
                stream: false,
                messages: messages.map(m => ({
                    role: m.role || 'user',
                    name: m.name || m.councilor || 'assistant',
                    content: m.content
                }))
            })
        });
        
        if (!response.ok) {
            const err = await response.text();
            return { error: `API error ${response.status}: ${err}` };
        }
        
        const data = await response.json();
        return { content: data?.choices?.[0]?.messages?.[0]?.text || data?.choices?.[0]?.message?.content || '' };
    } catch (e) {
        return { error: e.message };
    }
}

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
    
    // Auto-start deliberation if enabled (async)
    if (AUTO_DELIBERATION && topic) {
        setTimeout(() => startLLMDeliberation(topic, mode), 1000);
    }
});

// Auto-deliberation with REAL LLM calls
async function startLLMDeliberation(topic, mode) {
    if (!liveSession || liveSession.phase === 'ended') return;
    
    // Get first 5 enabled councilors from file
    let councilors = [];
    try {
        const councilorsData = JSON.parse(readFileSync(join(__dirname, 'councilors.json'), 'utf-8'));
        councilors = councilorsData.filter(c => c.enabled).slice(0, 5);
    } catch (e) {}
    
    const numCouncilors = councilors.length;
    
    // Build context
    const contextMessages = [
        { role: 'system', content: `You are facilitating an AI Council deliberation on the topic: "${topic}".

Council roles:
${councilors.map((c, i) => `${i+1}. ${c.name} (${c.role}): ${c.description || 'A wise councilor'}`).join('\n')}

Rules:
- Each councilor speaks from their unique perspective
- Be concise but thoughtful (100-200 words)
- Stay in character as your assigned role
- Address the topic directly with unique insights
- When High Speaker, summarize and call for vote` },
        { role: 'user', content: `Topic: "${topic}"

Please have each councilor speak in order. Start with ${councilors[0]?.name || 'The Technocrat'}.` }
    ];
    
    // Get opening from first councilor
    const openingMsg = await callLLM([
        ...contextMessages,
        { role: 'user', content: `As ${councilors[0]?.name || 'The Technocrat'}, give your opening statement on: "${topic}". Be concise and speak from your role's perspective.` }
    ]);
    
    if (!openingMsg.error) {
        const msg = {
            id: `msg-${Date.now()}`,
            councilor: councilors[0]?.name || 'The Technocrat',
            role: councilors[0]?.role || 'councilor',
            content: openingMsg.content,
            timestamp: new Date().toISOString(),
            vote: null
        };
        liveSession.messages.push(msg);
        liveSession.stats.messages++;
        sseBroadcast('message', msg);
    }
    
    // Debate rounds
    await new Promise(r => setTimeout(r, 3000));
    
    // Second councilor
    if (liveSession.phase === 'ended') return;
    const msg2 = await callLLM([
        ...contextMessages,
        { role: 'assistant', content: `Opening from ${councilors[0]?.name || 'The Technocrat'}` },
        { role: 'user', content: `As ${councilors[1]?.name || 'The Ethicist'}, respond to the topic: "${topic}". What ethical considerations apply?` }
    ]);
    
    if (!msg2.error) {
        const msg = {
            id: `msg-${Date.now()}`,
            councilor: councilors[1]?.name || 'The Ethicist',
            role: councilors[1]?.role || 'councilor',
            content: msg2.content,
            timestamp: new Date().toISOString(),
            vote: null
        };
        liveSession.messages.push(msg);
        liveSession.stats.messages++;
        sseBroadcast('message', msg);
    }
    
    await new Promise(r => setTimeout(r, 3000));
    
    // Third councilor
    if (liveSession.phase === 'ended') return;
    const msg3 = await callLLM([
        ...contextMessages,
        { role: 'user', content: `As ${councilors[2]?.name || 'The Pragmatist'}, address: "${topic}" from a practical standpoint. What are the real-world implications?` }
    ]);
    
    if (!msg3.error) {
        const msg = {
            id: `msg-${Date.now()}`,
            councilor: councilors[2]?.name || 'The Pragmatist',
            role: councilors[2]?.role || 'councilor',
            content: msg3.content,
            timestamp: new Date().toISOString(),
            vote: null
        };
        liveSession.messages.push(msg);
        liveSession.stats.messages++;
        sseBroadcast('message', msg);
    }
    
    await new Promise(r => setTimeout(r, 3000));
    
    // Fourth councilor (Visionary)
    if (liveSession.phase === 'ended') return;
    const msg4 = await callLLM([
        ...contextMessages,
        { role: 'user', content: `As ${councilors[3]?.name || 'The Visionary'}, look ahead: What future implications does "${topic}" have?` }
    ]);
    
    if (!msg4.error) {
        const msg = {
            id: `msg-${Date.now()}`,
            councilor: councilors[3]?.name || 'The Visionary',
            role: councilors[3]?.role || 'councilor',
            content: msg4.content,
            timestamp: new Date().toISOString(),
            vote: null
        };
        liveSession.messages.push(msg);
        liveSession.stats.messages++;
        sseBroadcast('message', msg);
    }
    
    await new Promise(r => setTimeout(r, 3000));
    
    // High Speaker (summary + call for vote)
    if (liveSession.phase === 'ended') return;
    const summary = await callLLM([
        ...contextMessages,
        { role: 'user', content: `As the High Speaker, summarize the debate on "${topic}" and call for a vote. Be authoritative and clear.` }
    ]);
    
    if (!summary.error) {
        const msg = {
            id: `msg-${Date.now()}`,
            councilor: councilors[4]?.name || 'High Speaker',
            role: 'speaker',
            content: summary.content,
            timestamp: new Date().toISOString(),
            vote: null
        };
        liveSession.messages.push(msg);
        liveSession.stats.messages++;
        sseBroadcast('message', msg);
    }
    
    await new Promise(r => setTimeout(r, 3000));
    
    // Move to voting phase
    if (liveSession.phase !== 'ended') {
        liveSession.phase = 'voting';
        sseBroadcast('phase', { phase: 'voting' });
        
        // Call LLM to get actual vote counts based on deliberation
        await new Promise(r => setTimeout(r, 2000));
        await runActualVoting(topic);
    }
}

// Real voting using LLM to determine votes
async function runActualVoting(topic) {
    if (!liveSession || liveSession.phase === 'ended') return;
    
    // Ask LLM how the council would vote based on the deliberation
    const voteAnalysis = await callLLM([
        { role: 'system', content: 'You are analyzing council voting patterns. Given the deliberation, determine how many yeas and nays there would be. Return ONLY a JSON object: {"yeas": number, "nays": number, "reasoning": "brief explanation"}' },
        { role: 'user', content: `Based on the deliberation about "${topic}" where councilors debated various perspectives, how would the full council vote?

Council summary: ${liveSession.messages.map(m => `${m.councilor}: ${m.content?.substring(0, 100)}...`).join('\n')}

Determine the vote distribution. Consider:
- Technical arguments may favor yeas
- Ethical concerns may create nays
- Pragmatic considerations split the vote
- Visionary perspectives often favor progress

Return JSON with yeas (25-45) and nays (10-30) based on the debate quality.` }
    ]);
    
    let yeas = 32, nays = 18;
    
    // Parse LLM response
    if (!voteAnalysis.error && voteAnalysis.content) {
        try {
            // Try to extract JSON from response
            const jsonMatch = voteAnalysis.content.match(/\{[^{}]*\}/);
            if (jsonMatch) {
                const voteData = JSON.parse(jsonMatch[0]);
                yeas = Math.max(15, Math.min(50, voteData.yeas || 32));
                nays = Math.max(5, Math.min(40, voteData.nays || 18));
            }
        } catch (e) {}
    }
    
    liveSession.stats.yeas = yeas;
    liveSession.stats.nays = nays;
    liveSession.voteData = { yeas, nays, quorum: true, reasoning: voteAnalysis.content?.substring(0, 200) || 'Council majority' };
    
    sseBroadcast('vote', { yeas, nays, total: yeas + nays, reasoning: liveSession.voteData.reasoning });
    
    // End session
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
