#!/usr/bin/env node
/**
 * AI Council Chamber - Agent API Server
 * Provides REST API endpoints for AI agents to interact with the Council.
 * Optimized for LM Studio local model integration.
 */

import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import http from 'http';

const app = express();
const PORT = process.env.PORT || 3001;
const LM_STUDIO_HOST = process.env.LM_STUDIO_HOST || 'localhost';
const LM_STUDIO_PORT = process.env.LM_STUDIO_PORT || 1234;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory session storage
const sessions = new Map();

// Councilor personas - optimized for available LM Studio models
const COUNCILOR_PERSONAS = {
  speaker: {
    name: "High Speaker",
    role: "speaker",
    model: "jan-v3-4b-base-instruct", // Fast, reliable model
    systemPrompt: "You are the High Speaker of the AI Council. Your role is to synthesize diverse perspectives into clear, actionable recommendations. You remain neutral, fair, and focused on finding the best path forward. Keep responses concise (2-3 sentences)."
  },
  technocrat: {
    name: "The Technocrat",
    role: "councilor",
    model: "jan-v3-4b-base-instruct",
    systemPrompt: "You are The Technocrat. You value efficiency, data, and implementation details. Focus on what is technically feasible. Be concise (2-3 sentences)."
  },
  ethicist: {
    name: "The Ethicist",
    role: "councilor",
    model: "jan-v3-4b-base-instruct",
    systemPrompt: "You are The Ethicist. You prioritize morality and human well-being. Challenge proposals that may cause harm. Be concise (2-3 sentences)."
  },
  pragmatist: {
    name: "The Pragmatist",
    role: "councilor",
    model: "jan-v3-4b-base-instruct",
    systemPrompt: "You are The Pragmatist. You focus on cost, timeline, and immediate implementation. Ask: 'Can we actually do this?' Be concise (2-3 sentences)."
  },
  visionary: {
    name: "The Visionary",
    role: "councilor",
    model: "jan-v3-4b-base-instruct",
    systemPrompt: "You are The Visionary. You see future trends and possibilities. Push for innovation and long-term thinking. Be concise (2-3 sentences)."
  },
  sentinel: {
    name: "The Sentinel",
    role: "councilor",
    model: "jan-v3-4b-base-instruct",
    systemPrompt: "You are The Sentinel. You guard against threats and vulnerabilities. Challenge assumptions and identify risks. Be concise (2-3 sentences)."
  },
  historian: {
    name: "The Historian",
    role: "councilor",
    model: "jan-v3-4b-base-instruct",
    systemPrompt: "You are The Historian. You bring historical precedents and patterns. Ask: 'What happened when we tried this before?' Be concise (2-3 sentences)."
  },
  diplomat: {
    name: "The Diplomat",
    role: "councilor",
    model: "jan-v3-4b-base-instruct",
    systemPrompt: "You are The Diplomat. You seek compromise and consensus. Ensure all voices are heard and find middle ground. Be concise (2-3 sentences)."
  },
  skeptic: {
    name: "The Skeptic",
    role: "councilor",
    model: "jan-v3-4b-base-instruct",
    systemPrompt: "You are The Skeptic. You are the devil's advocate. Find flaws, challenge assumptions, and stress-test ideas. Be concise (2-3 sentences)."
  }
};

const DEFAULT_COUNCIL = [
  "speaker", "technocrat", "ethicist", "pragmatist", 
  "visionary", "sentinel", "historian", "diplomat", "skeptic"
];

/**
 * Query LM Studio using native http module
 */
function queryLMStudio(messages, model = 'jan-v3-4b-base-instruct', maxTokens = 300) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: model,
      messages: messages,
      temperature: 0.7,
      max_tokens: maxTokens,
      stream: false
    });

    const options = {
      hostname: LM_STUDIO_HOST,
      port: LM_STUDIO_PORT,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 30000 // 30 second timeout
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.choices && parsed.choices[0] && parsed.choices[0].message) {
            resolve(parsed.choices[0].message.content);
          } else if (parsed.error) {
            reject(new Error(parsed.error.message || 'LM Studio error'));
          } else {
            reject(new Error('Invalid response from LM Studio'));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Generate a councilor response
 */
async function generateCouncilorResponse(councilorKey, topic, context = "") {
  const councilor = COUNCILOR_PERSONAS[councilorKey];
  if (!councilor) {
    return null;
  }

  try {
    console.log(`[${new Date().toISOString()}] Querying ${councilorKey}...`);
    
    const messages = [
      { role: 'system', content: councilor.systemPrompt },
      { role: 'user', content: `Topic: ${topic}\n\n${context}` }
    ];
    
    const content = await queryLMStudio(messages, councilor.model);
    
    console.log(`[${new Date().toISOString()}] ${councilorKey} responded (${content.length} chars)`);
    
    return {
      author: councilor.name,
      role: councilor.role,
      content: content,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error from ${councilorKey}:`, error.message);
    return {
      author: councilor.name,
      role: councilor.role,
      content: `[Error: ${error.message}]`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Run a deliberation session
 */
async function runDeliberation(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return;

  session.status = 'running';
  session.messages = [];
  
  const { topic, councilors } = session;
  console.log(`[${new Date().toISOString()}] Starting deliberation: "${topic.substring(0, 50)}..."`);

  // Opening
  session.messages.push({
    author: "High Speaker",
    role: "speaker",
    content: `The Council convenes on: "${topic}"`,
    timestamp: new Date().toISOString()
  });

  // Councilor contributions
  for (const key of councilors) {
    if (key === 'speaker') continue;
    const response = await generateCouncilorResponse(key, topic);
    if (response) session.messages.push(response);
  }

  // Synthesis
  const context = session.messages.map(m => `${m.author}: ${m.content}`).join('\n\n');
  const synthesis = await generateCouncilorResponse('speaker', topic, 
    `Synthesize these perspectives into a recommendation:\n\n${context}`, 500
  );
  
  if (synthesis) {
    session.messages.push({
      ...synthesis,
      content: `**COUNCIL RULING**\n\n${synthesis.content}`
    });
  }

  session.status = 'completed';
  session.completedAt = new Date().toISOString();
  console.log(`[${new Date().toISOString()}] Deliberation complete: ${sessionId}`);
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    lm_studio: `${LM_STUDIO_HOST}:${LM_STUDIO_PORT}`,
    timestamp: new Date().toISOString() 
  });
});

// Test LM Studio connectivity
app.get('/test-lm', async (req, res) => {
  try {
    const result = await queryLMStudio([
      { role: 'user', content: 'Say: LM_STUDIO_CONNECTION_OK' }
    ], 'jan-v3-4b-base-instruct', 50);
    res.json({ status: 'ok', response: result });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// Create session
app.post('/api/session', async (req, res) => {
  try {
    const { mode = 'deliberation', topic, councilors = DEFAULT_COUNCIL } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const sessionId = uuidv4();
    const session = {
      sessionId,
      mode,
      topic,
      councilors,
      status: 'pending',
      createdAt: new Date().toISOString(),
      messages: []
    };

    sessions.set(sessionId, session);
    runDeliberation(sessionId);

    res.json({
      sessionId,
      mode,
      topic,
      status: 'running',
      checkStatus: `GET /api/session/${sessionId}`
    });

  } catch (error) {
    console.error('Error creating session:', error);
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
    completedAt: session.completedAt,
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

    console.log(`[${new Date().toISOString()}] Inquiry from ${councilor}: "${question.substring(0, 50)}..."`);
    
    const response = await generateCouncilorResponse(councilor, question);
    
    if (response) {
      res.json({
        question,
        councilor: response.author,
        answer: response.content,
        timestamp: response.timestamp
      });
    } else {
      res.status(500).json({ error: 'Failed to generate response' });
    }

  } catch (error) {
    console.error('Error in inquire:', error);
    res.status(500).json({ error: error.message });
  }
});

// List sessions
app.get('/api/sessions', (req, res) => {
  const sessionList = Array.from(sessions.values()).map(s => ({
    sessionId: s.sessionId,
    mode: s.mode,
    topic: s.topic.substring(0, 50) + '...',
    status: s.status,
    createdAt: s.createdAt
  }));
  
  res.json(sessionList);
});

// Start server
app.listen(PORT, () => {
  console.log(`AI Council API Server running on http://localhost:${PORT}`);
  console.log(`LM Studio: http://${LM_STUDIO_HOST}:${LM_STUDIO_PORT}`);
  console.log('');
  console.log('Endpoints:');
  console.log('  GET  /health              - Health check');
  console.log('  GET  /test-lm             - Test LM Studio connection');
  console.log('  POST /api/session         - Create session');
  console.log('  GET  /api/session/:id     - Get session status');
  console.log('  GET  /api/session/:id/msg - Get messages');
  console.log('  POST /api/inquire         - Direct inquiry');
});
