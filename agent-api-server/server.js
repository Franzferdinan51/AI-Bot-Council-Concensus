#!/usr/bin/env node
/**
 * AI Council Chamber - Agent API Server
 * 
 * Provides REST API endpoints for AI agents to interact with the Council.
 * This server acts as a bridge between programmatic agents and the AI Council Chamber.
 */

import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory session storage (use Redis/DB for production)
const sessions = new Map();

/**
 * Councilor personas configuration
 * Matches the frontend constants.ts
 */
const COUNCILOR_PERSONAS = {
  speaker: {
    name: "High Speaker",
    role: "speaker",
    model: "jan-v2-vl-max_moe",
    systemPrompt: "You are the High Speaker of the AI Council. Your role is to synthesize diverse perspectives into clear, actionable recommendations. You remain neutral, fair, and focused on finding the best path forward."
  },
  technocrat: {
    name: "The Technocrat",
    role: "councilor",
    model: "gpt-oss-20b",
    systemPrompt: "You are The Technocrat. You value efficiency, data, and implementation details above all. You focus on what is technically feasible and optimal."
  },
  ethicist: {
    name: "The Ethicist",
    role: "councilor",
    model: "qwen3-next-80b-a3b-thinking",
    systemPrompt: "You are The Ethicist. You prioritize morality, human well-being, and the greater good. You challenge proposals that may cause harm or violate principles."
  },
  pragmatist: {
    name: "The Pragmatist",
    role: "councilor",
    model: "gpt-oss-20b",
    systemPrompt: "You are The Pragmatist. You focus on cost, timeline, and immediate implementation. You ask: 'Can we actually do this?'"
  },
  visionary: {
    name: "The Visionary",
    role: "councilor",
    model: "qwen3-next-80b-a3b-thinking",
    systemPrompt: "You are The Visionary. You see future trends and possibilities. You push for innovation and long-term thinking."
  },
  sentinel: {
    name: "The Sentinel",
    role: "councilor",
    model: "jan-v2-vl-max_moe",
    systemPrompt: "You are The Sentinel. You guard against threats and vulnerabilities. You challenge assumptions and identify risks others miss."
  },
  historian: {
    name: "The Historian",
    role: "councilor",
    model: "qwen3-next-80b-a3b-thinking",
    systemPrompt: "You are The Historian. You bring historical precedents and patterns. You ask: 'What happened when we tried this before?'"
  },
  diplomat: {
    name: "The Diplomat",
    role: "councilor",
    model: "gpt-oss-20b",
    systemPrompt: "You are The Diplomat. You seek compromise and consensus. You ensure all voices are heard and find middle ground."
  },
  skeptic: {
    name: "The Skeptic",
    role: "councilor",
    model: "qwen3-next-80b-a3b-thinking",
    systemPrompt: "You are The Skeptic. You are the devil's advocate. You find flaws, challenge assumptions, and stress-test ideas."
  },
  conspiracist: {
    name: "The Conspiracist",
    role: "councilor",
    model: "jan-v3-4b-base-instruct",
    systemPrompt: "You are The Conspiracist. You consider hidden motives and alternative explanations. You ask: 'What aren't we being told?'"
  },
  journalist: {
    name: "The Journalist",
    role: "councilor",
    model: "gpt-oss-20b",
    systemPrompt: "You are The Journalist. You seek facts and evidence. You demand transparency and accountability."
  },
  psychologist: {
    name: "The Psychologist",
    role: "councilor",
    model: "qwen3-next-80b-a3b-thinking",
    systemPrompt: "You are The Psychologist. You understand human behavior and motivation. You consider how decisions affect people emotionally."
  },
  coder: {
    name: "Specialist Coder",
    role: "specialist",
    model: "qwen3-coder-next",
    systemPrompt: "You are the Specialist Coder. You provide expert analysis on software development, architecture, and technical implementation."
  },
  legal: {
    name: "Specialist Legal",
    role: "specialist",
    model: "jan-v2-vl-max_moe",
    systemPrompt: "You are the Specialist Legal. You provide expert analysis on law, compliance, and liability."
  }
};

// Default council composition
const DEFAULT_COUNCIL = [
  "speaker",
  "technocrat",
  "ethicist",
  "pragmatist",
  "visionary",
  "sentinel",
  "historian",
  "diplomat",
  "skeptic"
];

/**
 * Generate a councilor response using LM Studio
 */
async function generateCouncilorResponse(councilorKey, topic, context = "") {
  const councilor = COUNCILOR_PERSONAS[councilorKey];
  if (!councilor) {
    return null;
  }

  try {
    const response = await fetch('http://localhost:1234/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: councilor.model,
        messages: [
          { role: 'system', content: councilor.systemPrompt },
          { role: 'user', content: `Topic: ${topic}\n\n${context}` }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`LM Studio error: ${response.status}`);
    }

    const data = await response.json();
    return {
      author: councilor.name,
      role: councilor.role,
      content: data.choices[0].message.content,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error generating response for ${councilorKey}:`, error);
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

  const { topic, councilors, mode } = session;

  // Add opening message from Speaker
  session.messages.push({
    author: "High Speaker",
    role: "speaker",
    content: `The Council is now in session. We shall deliberate on: "${topic}"`,
    timestamp: new Date().toISOString()
  });

  // Generate responses from each councilor
  for (const councilorKey of councilors) {
    if (councilorKey === 'speaker') continue;
    
    const response = await generateCouncilorResponse(councilorKey, topic);
    if (response) {
      session.messages.push(response);
    }
  }

  // Generate Speaker synthesis
  const context = session.messages.map(m => `${m.author}: ${m.content}`).join('\n\n');
  const speakerResponse = await generateCouncilorResponse('speaker', topic, 
    `Based on the following council deliberation, provide a final synthesis and recommendation:\n\n${context}`
  );
  
  if (speakerResponse) {
    session.messages.push({
      ...speakerResponse,
      content: `**FINAL RULING**\n\n${speakerResponse.content}`
    });
  }

  session.status = 'completed';
  session.completedAt = new Date().toISOString();
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create new session
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

    // Start deliberation asynchronously
    runDeliberation(sessionId);

    res.json({
      sessionId,
      mode,
      topic,
      status: 'pending',
      message: 'Session created. Use GET /api/session/{id} to check status.'
    });

  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get session status
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

// Get session messages
app.get('/api/session/:sessionId/messages', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json(session.messages);
});

// Direct inquiry endpoint
app.post('/api/inquire', async (req, res) => {
  try {
    const { question, councilor = 'speaker' } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

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

// List all sessions (for debugging)
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
  console.log(`
╔══════════════════════════════════════════════════════════╗
║  AI Council Chamber - Agent API Server                   ║
║                                                          ║
║  Server running on http://localhost:${PORT}              ║
║                                                          ║
║  Endpoints:                                              ║
║    GET  /health                 - Health check           ║
║    POST /api/session            - Create session         ║
║    GET  /api/session/:id        - Get session status     ║
║    GET  /api/session/:id/messages - Get messages         ║
║    POST /api/inquire            - Direct inquiry         ║
║                                                          ║
║  Requires LM Studio running on http://localhost:1234     ║
╚══════════════════════════════════════════════════════════╝
  `);
});
