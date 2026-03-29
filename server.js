/**
 * AI Council Deliberation Server - SSE Streaming Backend
 * Port 3003 - Handles real AI-powered council deliberation with streaming
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Readable } = require('stream');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = 3003;
const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://100.116.54.125:1234/v1';
const LM_STUDIO_KEY = process.env.LM_STUDIO_KEY || 'sk-lm-zO7bswIc:WkHEMTUfVNkq5WYNyFOW';
const MODEL_NAME = process.env.MODEL_NAME || 'qwen3.5-28b-a3b';

// In-memory session store for SSE streams
const sessions = new Map();

// ─── COUNCILOR PERSONAS ─────────────────────────────────────────────────────
// Inline councilor data matching the frontend (45 councilors)
const COUNCILORS = [
  { id: 1, name: 'Facilitator', role: 'neutral synthesis', category: 'Original', color: '#8B5CF6', emoji: '⚖️' },
  { id: 2, name: 'Technocrat', role: 'efficiency, data, optimization', category: 'Original', color: '#3B82F6', emoji: '💻' },
  { id: 3, name: 'Ethicist', role: 'morality, human well-being', category: 'Original', color: '#10B981', emoji: '🕊️' },
  { id: 4, name: 'Pragmatist', role: 'cost, feasibility, implementation', category: 'Original', color: '#F59E0B', emoji: '🛠️' },
  { id: 5, name: 'Skeptic', role: "devil's advocate, find flaws", category: 'Original', color: '#EF4444', emoji: '🔍' },
  { id: 6, name: 'Sentinel', role: 'security, threats, safety', category: 'Original', color: '#1F2937', emoji: '🛡️' },
  { id: 7, name: 'Visionary', role: 'innovation, long-term thinking', category: 'Original', color: '#EC4899', emoji: '🔮' },
  { id: 8, name: 'Historian', role: 'lessons from past', category: 'Original', color: '#92400E', emoji: '📜' },
  { id: 9, name: 'Diplomat', role: 'compromise, middle ground', category: 'Original', color: '#6366F1', emoji: '🤝' },
  { id: 10, name: 'Journalist', role: 'facts, investigation, truth', category: 'Original', color: '#14B8A6', emoji: '📰' },
  { id: 11, name: 'Psychologist', role: 'human behavior, motivations', category: 'Original', color: '#A855F7', emoji: '🧠' },
  { id: 12, name: 'Conspiracist', role: 'alternative theories', category: 'Original', color: '#78716C', emoji: '🔎' },
  { id: 13, name: 'Propagandist', role: 'messaging, framing', category: 'Original', color: '#F97316', emoji: '📢' },
  { id: 14, name: 'Moderator', role: 'process, rules, fairness', category: 'Original', color: '#64748B', emoji: '👨⚖️' },
  { id: 15, name: 'Coder', role: 'code quality, technical implementation', category: 'Original', color: '#06B6D4', emoji: '⌨️' },
  { id: 16, name: 'Economist', role: 'financial impact, cost-benefit, ROI', category: 'Business & Strategy', color: '#059669', emoji: '📊' },
  { id: 17, name: 'Product Manager', role: 'product strategy, roadmap, user value', category: 'Business & Strategy', color: '#7C3AED', emoji: '📦' },
  { id: 18, name: 'Marketing Expert', role: 'go-to-market, positioning, brand', category: 'Business & Strategy', color: '#DB2777', emoji: '📣' },
  { id: 19, name: 'Finance Expert', role: 'budget, financial planning, cash flow', category: 'Business & Strategy', color: '#0D9488', emoji: '💰' },
  { id: 20, name: 'Risk Manager', role: 'enterprise risk, mitigation strategies', category: 'Business & Strategy', color: '#DC2626', emoji: '⚠️' },
  { id: 21, name: 'DevOps Engineer', role: 'infrastructure, scalability, deployment', category: 'Technical & Engineering', color: '#2563EB', emoji: '🚀' },
  { id: 22, name: 'Security Expert', role: 'cybersecurity, threat modeling', category: 'Technical & Engineering', color: '#1E3A5F', emoji: '🔒' },
  { id: 23, name: 'Data Scientist', role: 'data analysis, ML/AI implications', category: 'Technical & Engineering', color: '#0891B2', emoji: '📈' },
  { id: 24, name: 'Performance Engineer', role: 'performance optimization, bottlenecks', category: 'Technical & Engineering', color: '#CA8A04', emoji: '⚡' },
  { id: 25, name: 'QA Engineer', role: 'testing strategy, edge cases', category: 'Technical & Engineering', color: '#65A30D', emoji: '✅' },
  { id: 26, name: 'Solutions Architect', role: 'system design, integration patterns', category: 'Technical & Engineering', color: '#4338CA', emoji: '🏗️' },
  { id: 27, name: 'User Advocate', role: 'user experience, accessibility', category: 'User & Community', color: '#0EA5E9', emoji: '👤' },
  { id: 28, name: 'Customer Support', role: 'customer pain points, support burden', category: 'User & Community', color: '#8B5CF6', emoji: '🎧' },
  { id: 29, name: 'Community Manager', role: 'community impact, open source', category: 'User & Community', color: '#22C55E', emoji: '👥' },
  { id: 30, name: 'Accessibility Expert', role: 'WCAG compliance, inclusive design', category: 'User & Community', color: '#D946EF', emoji: '♿' },
  { id: 31, name: 'Legal Counsel', role: 'compliance, regulations, liability', category: 'Compliance & Legal', color: '#1E293B', emoji: '⚖️' },
  { id: 32, name: 'Regulatory Specialist', role: 'regulatory compliance, rules', category: 'Compliance & Legal', color: '#7C2D12', emoji: '📋' },
  { id: 33, name: 'Compliance Officer', role: 'policy enforcement, standards', category: 'Compliance & Legal', color: '#44403C', emoji: '🧾' },
  { id: 34, name: 'Innovation Lead', role: 'creative thinking, R&D', category: 'Innovation & Culture', color: '#F472B6', emoji: '💡' },
  { id: 35, name: 'Culture Officer', role: 'organizational culture, values', category: 'Innovation & Culture', color: '#FB923C', emoji: '🏛️' },
  { id: 36, name: 'Sustainability Expert', role: 'environmental impact, green tech', category: 'Innovation & Culture', color: '#22C55E', emoji: '🌱' },
  { id: 37, name: 'Ethics Officer', role: 'corporate ethics, social responsibility', category: 'Innovation & Culture', color: '#15803D', emoji: '🌍' },
  { id: 38, name: 'Diversity Officer', role: 'DEI, inclusive hiring', category: 'Innovation & Culture', color: '#A21CAF', emoji: '🤲' },
  { id: 39, name: 'Meteorologist', role: 'weather patterns, severe weather', category: 'Weather & Emergency', color: '#0EA5E9', emoji: '🌤️' },
  { id: 40, name: 'Emergency Manager', role: 'public safety, shelter coordination', category: 'Weather & Emergency', color: '#DC2626', emoji: '🚨' },
  { id: 41, name: 'Animal Welfare Specialist', role: 'livestock safety, pet protection', category: 'Weather & Emergency', color: '#CA8A04', emoji: '🐾' },
  { id: 42, name: 'Risk Quantifier', role: 'probability analysis, risk scoring', category: 'Weather & Emergency', color: '#7C3AED', emoji: '📉' },
  { id: 43, name: 'Ground Crew', role: 'real-world experience, local knowledge', category: 'Weather & Emergency', color: '#78716C', emoji: '👷' },
  { id: 44, name: 'Agronomist', role: 'crop science, soil health, fertilizers', category: 'Agriculture & Plant Science', color: '#65A30D', emoji: '🌾' },
  { id: 45, name: 'Plant Pathologist', role: 'plant diseases, pest management', category: 'Agriculture & Plant Science', color: '#84CC16', emoji: '🪴' },
];

const DELIBERATION_MODES = [
  { id: 'PROPOSAL', name: 'Legislative', description: 'Debate → Vote → Enact', icon: '⚖️', color: '#8B5CF6' },
  { id: 'DELIBERATION', name: 'Deliberation', description: 'Roundtable → Summary (No Vote)', icon: '🔄', color: '#3B82F6' },
  { id: 'INQUIRY', name: 'Inquiry', description: 'Q&A → Synthesis', icon: '❓', color: '#10B981' },
  { id: 'RESEARCH', name: 'Research', description: 'Deep Dive → Plan → Investigate → Report', icon: '📚', color: '#F59E0B' },
  { id: 'SWARM', name: 'Swarm', description: 'Decompose → Parallel → Aggregate', icon: '🐝', color: '#EF4444' },
  { id: 'SWARM_CODING', name: 'Swarm Coding', description: 'Architect → Dev Swarm → Code Gen', icon: '⚡', color: '#06B6D4' },
  { id: 'PREDICTION', name: 'Prediction', description: 'Probability & Outcome Analysis', icon: '🔮', color: '#EC4899' },
  { id: 'VISION', name: 'Vision Council', description: 'Image upload & visual analysis', icon: '👁️', color: '#A855F7' },
];

// Mode to system prompt prefix mapping
const MODE_PROMPTS = {
  PROPOSAL: 'As a legislative council, debate this proposal thoroughly. Consider: arguments for, arguments against, unintended consequences, and a recommended course of action. End with a clear stance.',
  DELIBERATION: 'As a roundtable council, deliberate on this matter. Explore multiple perspectives, challenge assumptions, and synthesize insights from diverse viewpoints. Seek common ground.',
  INQUIRY: 'As an inquiry council, investigate this question systematically. Gather facts, examine evidence, and provide a comprehensive analysis with clear conclusions.',
  RESEARCH: 'As a research council, conduct a deep investigation into this topic. Cover: current state, key challenges, strategic options, risks, and a detailed action plan.',
  SWARM: 'As a swarm council, decompose this complex problem into sub-tasks. Each councilor focuses on their domain, then we aggregate findings into a comprehensive solution.',
  SWARM_CODING: 'As a swarm coding council, architect and plan the technical implementation. Cover: architecture, technical approach, potential issues, code quality, and deployment strategy.',
  PREDICTION: 'As a prediction council, analyze the probabilities and potential outcomes. Assign likelihood percentages to scenarios and identify key indicators to watch.',
  VISION: 'As a vision council, analyze this matter with long-term foresight. Consider future implications, emerging trends, and strategic opportunities.',
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getCouncilorById(id) {
  return COUNCILORS.find(c => c.id === id);
}

function getCouncilorSystemPrompt(councilor, mode) {
  const modePrompt = MODE_PROMPTS[mode] || MODE_PROMPTS.DELIBERATION;
  return `You are ${councilor.name}, a councilor with the following specialty: "${councilor.role}".
${modePrompt}
Important: Keep your response to 3-5 sentences. Be direct and opinionated.`;
}

async function queryLMStudio(messages, onToken, signal) {
  return new Promise(async (resolve, reject) => {
    try {
      const postData = JSON.stringify({
        model: MODEL_NAME,
        messages,
        temperature: 0.7,
        max_tokens: 400,
        stream: true,
      });

      const url = new URL(LM_STUDIO_URL + '/chat/completions');
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LM_STUDIO_KEY}`,
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: 120000,
      };

      const protocol = url.protocol === 'https:' ? require('https') : http;
      const req = protocol.request(options, (res) => {
        let buffer = '';
        let fullContent = '';

        res.on('data', (chunk) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                if (onToken) onToken('', true);
                return;
              }
              try {
                const parsed = JSON.parse(data);
                const token = parsed.choices?.[0]?.delta?.content || '';
                if (token) {
                  fullContent += token;
                  if (onToken) onToken(token, false);
                }
              } catch (e) {
                // Skip malformed JSON (common in SSE)
              }
            }
          }
        });

        res.on('end', () => {
          resolve(fullContent || 'Councilor did not provide a response.');
        });

        res.on('error', (err) => {
          if (signal?.aborted) {
            resolve(''); // Normal cancellation
          } else {
            reject(err);
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('LM Studio request timeout'));
      });

      req.on('error', (e) => reject(e));

      if (signal) {
        signal.addEventListener('abort', () => {
          req.destroy();
        });
      }

      req.write(postData);
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

// SSE helper: write JSON event
function sseWrite(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-council-deliberation', port: PORT, timestamp: new Date().toISOString() });
});

// Gateway health (proxy to OpenClaw gateway)
app.get('/api/gateway/health', async (req, res) => {
  try {
    const response = await fetch('http://localhost:18789/health', { timeout: 3000 });
    const data = await response.json();
    res.json({ connected: true, gateway: data });
  } catch (e) {
    res.json({ connected: false, error: e.message });
  }
});

// Get all councilors
app.get('/api/councilors', (req, res) => {
  res.json(COUNCILORS);
});

// Get deliberation modes
app.get('/api/modes', (req, res) => {
  res.json(DELIBERATION_MODES);
});

// Submit motion — starts deliberation session, returns sessionId
app.post('/api/deliberate', async (req, res) => {
  const { motion, mode = 'DELIBERATION', councilors: selectedCouncilorIds = [] } = req.body;

  if (!motion) {
    return res.status(400).json({ error: 'Motion is required' });
  }

  const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Resolve councilor objects
  const selectedCouncilors = selectedCouncilorIds.length > 0
    ? selectedCouncilorIds.map(id => getCouncilorById(Number(id))).filter(Boolean)
    : COUNCILORS.slice(0, 5); // Default: first 5 councilors

  // Cap at 10 councilors for performance
  const councilorsToUse = selectedCouncilors.slice(0, 10);

  const session = {
    id: sessionId,
    motion,
    mode,
    councilors: councilorsToUse,
    responses: [],
    aborted: false,
    abortController: new AbortController(),
    status: 'running',
  };

  sessions.set(sessionId, session);

  // Respond immediately with sessionId
  res.json({ sessionId, motion, mode, councilorCount: councilorsToUse.length });

  // Run deliberation in background
  runDeliberation(session).catch(err => {
    console.error(`[Deliberation ${sessionId}] Error:`, err.message);
    session.status = 'error';
  });
});

// SSE stream endpoint — streams deliberation tokens in real-time
app.get('/api/deliberate/stream', (req, res) => {
  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found. Submit a motion first.' });
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Send initial ping
  sseWrite(res, { type: 'connected', sessionId, motion: session.motion, mode: session.mode });

  // Subscribe to session events
  const listener = (event) => {
    if (!res.writableEnded) {
      sseWrite(res, event);
    }
  };

  session.listeners = session.listeners || [];
  session.listeners.push(listener);

  // Send current status
  sseWrite(res, { type: 'status', status: session.status, councilorCount: session.councilors.length });

  // Cleanup on disconnect
  req.on('close', () => {
    if (session.listeners) {
      session.listeners = session.listeners.filter(l => l !== listener);
    }
  });
});

// ─── DELIBERATION ENGINE ──────────────────────────────────────────────────────

async function runDeliberation(session) {
  const { motion, mode, councilors: councilorsToUse, abortController, listeners = [] } = session;

  function emit(event) {
    for (const l of listeners) l(event);
  }

  try {
    // System message establishing the deliberation context
    emit({ type: 'system', content: `Council deliberation initiated: "${motion}" in ${mode} mode with ${councilorsToUse.length} councilors.` });

    // Short delay before starting
    await new Promise(r => setTimeout(r, 800));

    // Each councilor responds
    for (let i = 0; i < councilorsToUse.length; i++) {
      if (session.aborted) break;

      const councilor = councilorsToUse[i];

      emit({
        type: 'councilor_start',
        councilor: councilor.name,
        councilorId: councilor.id,
        emoji: councilor.emoji,
        color: councilor.color,
        index: i,
      });

      // Typing indicator
      emit({ type: 'typing_start', councilor: councilor.name });

      const systemPrompt = getCouncilorSystemPrompt(councilor, mode);
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Motion under deliberation: "${motion}". Provide your perspective as ${councilor.name}.` },
      ];

      let fullContent = '';
      try {
        fullContent = await queryLMStudio(messages, (token, done) => {
          if (session.aborted) {
            abortController.abort();
            return;
          }
          if (token) {
            fullContent += token;
            emit({
              type: 'token',
              councilor: councilor.name,
              token,
              content: fullContent,
            });
          }
        }, abortController.signal);
      } catch (e) {
        if (e.message.includes('abort') || e.message.includes('timeout')) {
          fullContent = `[Response interrupted]`;
        } else {
          fullContent = `[Error: ${e.message}]`;
        }
      }

      emit({ type: 'typing_end', councilor: councilor.name });
      emit({ type: 'councilor_end', councilor: councilor.name, content: fullContent });

      session.responses.push({ councilor: councilor.name, content: fullContent });

      // Inter-councilor delay
      if (i < councilorsToUse.length - 1 && !session.aborted) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // Calculate consensus (simple heuristic: length of agreement / divergence)
    const avgLength = session.responses.reduce((sum, r) => sum + r.content.length, 0) / Math.max(session.responses.length, 1);
    const consensusScore = Math.min(95, Math.round(50 + (avgLength / 10)));

    // Synthesis
    if (!session.aborted) {
      emit({ type: 'system', content: `Deliberation complete. The council has reached approximately ${consensusScore}% consensus.` });
      emit({ type: 'consensus', score: consensusScore });
      emit({ type: 'done', consensus: consensusScore, responseCount: session.responses.length });
    }

    session.status = 'done';
  } catch (e) {
    session.status = 'error';
    emit({ type: 'error', message: e.message });
  }
}

// ─── SERVER ───────────────────────────────────────────────────────────────────

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🏛️  AI Council Deliberation Server running on port ${PORT}`);
  console.log(`📡  SSE streaming: http://localhost:${PORT}/api/deliberate/stream`);
  console.log(`🤖  LM Studio: ${LM_STUDIO_URL}`);
  console.log(`📋  Model: ${MODEL_NAME}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  for (const [, session] of sessions) {
    session.aborted = true;
    session.abortController.abort();
  }
  server.close();
});
