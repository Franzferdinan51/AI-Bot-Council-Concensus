const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const sessions = new Map();

// Councilor personas
const COUNCILORS = {
  speaker: { name: "High Speaker", role: "speaker", model: "jan-v2-vl-max_moe" },
  technocrat: { name: "The Technocrat", role: "councilor", model: "gpt-oss-20b" },
  ethicist: { name: "The Ethicist", role: "councilor", model: "qwen3-next-80b-a3b-thinking" },
  pragmatist: { name: "The Pragmatist", role: "councilor", model: "gpt-oss-20b" },
  visionary: { name: "The Visionary", role: "councilor", model: "qwen3-next-80b-a3b-thinking" },
  sentinel: { name: "The Sentinel", role: "councilor", model: "jan-v2-vl-max_moe" },
  skeptic: { name: "The Skeptic", role: "councilor", model: "qwen3-next-80b-a3b-thinking" }
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-council-agent-api', timestamp: new Date().toISOString() });
});

// Create session
app.post('/api/session', async (req, res) => {
  try {
    const { mode = 'deliberation', topic, councilors = ['speaker', 'technocrat', 'ethicist', 'skeptic'] } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const sessionId = uuidv4();
    const session = {
      sessionId,
      mode,
      topic,
      councilors,
      status: 'created',
      createdAt: new Date().toISOString(),
      messages: []
    };

    sessions.set(sessionId, session);

    res.json({
      sessionId,
      mode,
      topic,
      status: 'created',
      message: 'Session created successfully'
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get session
app.get('/api/session/:sessionId', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json({
    sessionId: session.sessionId,
    mode: session.mode,
    topic: session.topic,
    status: session.status,
    createdAt: session.createdAt,
    messageCount: session.messages.length
  });
});

// Get messages
app.get('/api/session/:sessionId/messages', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json(session.messages);
});

// Direct inquiry
app.post('/api/inquire', async (req, res) => {
  try {
    const { question, councilor = 'speaker' } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const persona = COUNCILORS[councilor] || COUNCILORS.speaker;

    res.json({
      question,
      councilor: persona.name,
      answer: `[This is a test response from ${persona.name}. In production, this would connect to LM Studio at localhost:1234]`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`AI Council Agent API running on http://localhost:${PORT}`);
});
