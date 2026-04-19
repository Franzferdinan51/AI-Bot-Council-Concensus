#!/usr/bin/env node
/**
 * AI Council Chamber - Agent API Server (Bailian Edition)
 * Configured for Alibaba Bailian models ONLY
 */

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3001;

// Bailian Configuration
const BAILIAN_API_KEY = process.env.BAILIAN_API_KEY || 'sk-sp-e1b3a679b93047978549f49bfcf73480';
const BAILIAN_ENDPOINT = process.env.BAILIAN_ENDPOINT || 'https://coding-intl.dashscope.aliyuncs.com/v1';

// Model mapping for Bailian
const MODEL_MAP = {
  speaker: 'qwen3.5-plus',
  technocrat: 'MiniMax-M2.5',
  ethicist: 'MiniMax-M2.5',
  pragmatist: 'MiniMax-M2.5',
  skeptic: 'qwen3.5-plus',
  sentinel: 'qwen3.5-plus',
  historian: 'MiniMax-M2.5',
  diplomat: 'MiniMax-M2.5',
  journalist: 'MiniMax-M2.5',
  psychologist: 'MiniMax-M2.5',
  conspiracist: 'glm-5',
  propagmatist: 'glm-5',
  visionary: 'qwen3.5-plus',
  moderator: 'MiniMax-M2.5',
  coder: 'qwen3-coder-plus'
};

// Middleware
app.use(cors());
app.use(express.json());

// In-memory session storage
const sessions = new Map();

// Councilor personas
const COUNCILOR_PERSONAS = {
  speaker: { name: "High Speaker", role: "speaker", model: MODEL_MAP.speaker },
  technocrat: { name: "The Technocrat", role: "councilor", model: MODEL_MAP.technocrat },
  ethicist: { name: "The Ethicist", role: "councilor", model: MODEL_MAP.ethicist },
  pragmatist: { name: "The Pragmatist", role: "councilor", model: MODEL_MAP.pragmatist },
  skeptic: { name: "The Skeptic", role: "councilor", model: MODEL_MAP.skeptic },
  sentinel: { name: "The Sentinel", role: "councilor", model: MODEL_MAP.sentinel },
  historian: { name: "The Historian", role: "councilor", model: MODEL_MAP.historian },
  diplomat: { name: "The Diplomat", role: "councilor", model: MODEL_MAP.diplomat },
  journalist: { name: "The Journalist", role: "councilor", model: MODEL_MAP.journalist },
  psychologist: { name: "The Psychologist", role: "councilor", model: MODEL_MAP.psychologist },
  conspiracist: { name: "The Conspiracist", role: "councilor", model: MODEL_MAP.conspiracist },
  propagmatist: { name: "The Propagmatist", role: "councilor", model: MODEL_MAP.propagmatist },
  visionary: { name: "The Visionary", role: "councilor", model: MODEL_MAP.visionary },
  moderator: { name: "The Moderator", role: "councilor", model: MODEL_MAP.moderator },
  coder: { name: "The Coder", role: "councilor", model: MODEL_MAP.coder }
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    provider: 'bailian',
    timestamp: new Date().toISOString() 
  });
});

// Get councilors
app.get('/api/councilors', (req, res) => {
  res.json(Object.values(COUNCILOR_PERSONAS));
});

// Get session status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    provider: 'bailian',
    councilors: Object.keys(COUNCILOR_PERSONAS).length
  });
});

// Simple inquiry endpoint
app.post('/api/inquire', async (req, res) => {
  try {
    const { question, councilor = 'speaker' } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question required' });
    }
    
    const persona = COUNCILOR_PERSONAS[councilor] || COUNCILOR_PERSONAS.speaker;
    
    // Call Bailian API
    const response = await fetch(`${BAILIAN_ENDPOINT}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BAILIAN_API_KEY}`
      },
      body: JSON.stringify({
        model: persona.model,
        messages: [
          { role: 'system', content: `You are ${persona.name}. ${persona.systemPrompt || 'Provide concise, helpful answers.'}` },
          { role: 'user', content: question }
        ],
        max_tokens: 500
      })
    });
    
    const data = await response.json();
    
    res.json({
      answer: data.choices?.[0]?.message?.content || 'No response',
      councilor: persona.name,
      model: persona.model
    });
  } catch (error) {
    console.error('Inquiry error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🏛️  AI Council API Server (Bailian) running on http://localhost:${PORT}`);
  console.log(`   Provider: Alibaba Bailian`);
  console.log(`   Councilors: ${Object.keys(COUNCILOR_PERSONAS).length}`);
});
