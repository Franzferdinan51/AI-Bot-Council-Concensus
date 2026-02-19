/**
 * AI Council API Server
 * Provides REST endpoints for CLI and external access
 */

const express = require('express');
const cors = require('cors');
const { generateResponse } = require('./src/services/aiService');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// In-memory session (simplified for CLI)
let session = {
    mode: 'deliberation',
    messages: [],
    councilors: []
};

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get councilors
app.get('/api/councilors', (req, res) => {
    const settings = require('./constants').DEFAULT_BOTS;
    res.json(settings.map(b => ({
        id: b.id,
        name: b.name,
        role: b.role,
        enabled: b.enabled,
        model: b.model
    })));
});

// Get session status
app.get('/api/status', (req, res) => {
    res.json({
        mode: session.mode,
        activeCouncilors: session.councilors.length,
        messageCount: session.messages.length
    });
});

// Clear session
app.post('/api/clear', (req, res) => {
    session = { mode: session.mode, messages: [], councilors: [] };
    res.json({ ok: true });
});

// Ask the council
app.post('/api/deliberate', async (req, res) => {
    const { question, mode = 'deliberation' } = req.body;
    session.mode = mode;
    
    try {
        // Simplified - just get one response for CLI
        const result = await generateResponse(question, mode);
        session.messages.push({ question, result, mode, timestamp: new Date() });
        res.json({ result, mode, question });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`🤖 AI Council API running on port ${PORT}`);
});
