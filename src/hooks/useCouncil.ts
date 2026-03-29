import { useState, useCallback, useRef } from 'react';
import { councilAI } from '../lib/api';
import type { Councilor, Message, DeliberationMode } from '../types';

// Full roster of 24 councilors with distinct identities
export const COUNCILORS: Councilor[] = [
  // Core Leadership
  { id: 'chancellor', name: 'Chancellor Prime', emoji: '👑', role: 'Chair', specialty: 'Leadership', color: '#fbbf24', bgColor: 'bg-amber-500/20', borderColor: 'border-amber-500', model: 'gpt-5.4', personality: 'Authoritative, wise, balanced', stance: 'neutral', active: true, speaking: false },
  { id: 'seneschal', name: 'Seneschal', emoji: '⚖️', role: 'Arbiter', specialty: 'Rules & Order', color: '#a78bfa', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-500', model: 'glm-5', personality: 'Formal, precise, fair', stance: 'neutral', active: true, speaking: false },
  
  // Specialist Agents
  { id: 'archmage', name: 'Archmage Codex', emoji: '🔮', role: 'Coder', specialty: 'Software Engineering', color: '#22d3ee', bgColor: 'bg-cyan-500/20', borderColor: 'border-cyan-500', model: 'kimi/k2', personality: 'Technical, innovative, systematic', stance: 'analyze', active: true, speaking: false },
  { id: 'lex', name: 'Lex Emeritus', emoji: '📜', role: 'Legal', specialty: 'Constitutional Law', color: '#f472b6', bgColor: 'bg-pink-500/20', borderColor: 'border-pink-500', model: 'glm-5', personality: 'Precise, cautious, methodical', stance: 'analyze', active: true, speaking: false },
  { id: 'nova', name: 'Nova Stern', emoji: '🔬', role: 'Science', specialty: 'Research & Evidence', color: '#34d399', bgColor: 'bg-emerald-500/20', borderColor: 'border-emerald-500', model: 'MiniMax-M2.7', personality: 'Empirical, curious, rigorous', stance: 'analyze', active: true, speaking: false },
  { id: 'fortuna', name: 'Fortuna', emoji: '💰', role: 'Finance', specialty: 'Economics & Treasury', color: '#facc15', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500', model: 'glm-5', personality: 'Pragmatic, metrics-driven', stance: 'analyze', active: true, speaking: false },
  { id: 'ares', name: 'Ares Vox', emoji: '⚔️', role: 'Military', specialty: 'Defense Strategy', color: '#ef4444', bgColor: 'bg-red-500/20', borderColor: 'border-red-500', model: 'MiniMax-M2.7', personality: 'Strategic, decisive, strong', stance: 'support', active: true, speaking: false },
  { id: 'hygieia', name: 'Hygieia', emoji: '🏥', role: 'Medical', specialty: 'Health & Safety', color: '#4ade80', bgColor: 'bg-green-500/20', borderColor: 'border-green-500', model: 'kimi/k2.5', personality: 'Caring, evidence-based, cautious', stance: 'analyze', active: true, speaking: false },

  // Philosophical Perspectives
  { id: 'solomon', name: 'Solomon', emoji: '🧙', role: 'Philosopher', specialty: 'Ethics & Morality', color: '#c084fc', bgColor: 'bg-violet-500/20', borderColor: 'border-violet-500', model: 'gpt-5.4', personality: 'Deep, contemplative, wise', stance: 'neutral', active: true, speaking: false },
  { id: 'demos', name: 'Demos', emoji: '🗣️', role: 'Populist', specialty: 'Public Opinion', color: '#fb923c', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-500', model: 'MiniMax-M2.7', personality: 'Empathetic, relatable, practical', stance: 'neutral', active: true, speaking: false },
  { id: 'atlantis', name: 'Atlantis', emoji: '🌊', role: 'Visionary', specialty: 'Long-term Planning', color: '#0ea5e9', bgColor: 'bg-sky-500/20', borderColor: 'border-sky-500', model: 'qwen3.5-plus', personality: 'Forward-thinking, bold', stance: 'support', active: true, speaking: false },
  { id: 'ironclad', name: 'Ironclad', emoji: '🛡️', role: 'Security', specialty: 'Risk Assessment', color: '#6b7280', bgColor: 'bg-gray-500/20', borderColor: 'border-gray-500', model: 'MiniMax-M2.7', personality: 'Vigilant, thorough, skeptical', stance: 'neutral', active: true, speaking: false },

  // Additional Councilors (fill to 24+)
  { id: 'chronos', name: 'Chronos', emoji: '⏳', role: 'Historian', specialty: 'Past Precedents', color: '#a1887f', bgColor: 'bg-brown-500/20', borderColor: 'border-brown-500', model: 'glm-5', personality: 'Knowledgeable, comparative', stance: 'neutral', active: true, speaking: false },
  { id: 'logos', name: 'Logos', emoji: '📊', role: 'Analyst', specialty: 'Data Science', color: '#26c6da', bgColor: 'bg-teal-500/20', borderColor: 'border-teal-500', model: 'MiniMax-M2.7', personality: 'Analytical, data-driven', stance: 'analyze', active: true, speaking: false },
  { id: 'harmonia', name: 'Harmonia', emoji: '🎭', role: 'Diplomat', specialty: 'Negotiation', color: '#ec4899', bgColor: 'bg-fuchsia-500/20', borderColor: 'border-fuchsia-500', model: 'gpt-5.4', personality: 'Tactful, balanced, persuasive', stance: 'neutral', active: true, speaking: false },
  { id: 'pyro', name: 'Pyromancer', emoji: '🔥', role: 'Reformer', specialty: 'Change Agent', color: '#f97316', bgColor: 'bg-orange-600/20', borderColor: 'border-orange-600', model: 'qwen3.5-plus', personality: 'Passionate, disruptive, bold', stance: 'support', active: true, speaking: false },
  { id: 'terra', name: 'Terra', emoji: '🌍', role: 'Environmentalist', specialty: 'Sustainability', color: '#22c55e', bgColor: 'bg-green-600/20', borderColor: 'border-green-600', model: 'MiniMax-M2.7', personality: 'Ecological, long-view', stance: 'neutral', active: true, speaking: false },
  { id: 'vesta', name: 'Vesta', emoji: '🏠', role: 'Domestic', specialty: 'Social Welfare', color: '#e879f9', bgColor: 'bg-pink-400/20', borderColor: 'border-pink-400', model: 'glm-5', personality: 'Community-focused, nurturing', stance: 'support', active: true, speaking: false },
  { id: 'prometheus', name: 'Prometheus', emoji: '💡', role: 'Innovator', specialty: 'Technology', color: '#3b82f6', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500', model: 'kimi/k2', personality: 'Inventive, progress-oriented', stance: 'support', active: true, speaking: false },
  { id: 'nemo', name: 'Nemo', emoji: '🐙', role: 'Strategist', specialty: 'Complex Systems', color: '#8b5cf6', bgColor: 'bg-violet-600/20', borderColor: 'border-violet-600', model: 'qwen3.5-plus', personality: 'Holistic, interconnected thinking', stance: 'analyze', active: true, speaking: false },
  { id: 'moses', name: 'Moses', emoji: '📜', role: 'Traditionalist', specialty: 'Heritage & Values', color: '#d97706', bgColor: 'bg-amber-600/20', borderColor: 'border-amber-600', model: 'glm-5', personality: 'Principled, conservative', stance: 'neutral', active: true, speaking: false },
  { id: 'joker', name: 'Joker', emoji: '🃏', role: 'Devils Advocate', specialty: 'Critical Analysis', color: '#dc2626', bgColor: 'bg-red-600/20', borderColor: 'border-red-600', model: 'MiniMax-M2.7', personality: 'Confrontational, challenging', stance: 'oppose', active: true, speaking: false },
  { id: 'oracle', name: 'Oracle', emoji: '🔮', role: 'Forecaster', specialty: 'Prediction Markets', color: '#7c3aed', bgColor: 'bg-indigo-500/20', borderColor: 'border-indigo-500', model: 'qwen3.5-plus', personality: 'Probabilistic, forward-looking', stance: 'analyze', active: true, speaking: false },
  { id: 'gaia', name: 'Gaia', emoji: '🌿', role: 'Biologist', specialty: 'Life Sciences', color: '#10b981', bgColor: 'bg-teal-600/20', borderColor: 'border-teal-600', model: 'kimi/k2.5', personality: 'Life-affirming, interconnected', stance: 'neutral', active: true, speaking: false },
];

const MODE_PROMPTS: Record<DeliberationMode, string> = {
  legislative: 'This is a formal legislative session. Councilors will debate and vote on the motion.',
  research: 'This is a deep research inquiry. Councilors will analyze evidence and provide comprehensive findings.',
  swarm: 'This is a swarm coding session. Councilors will collaborate on implementation strategy.',
};

interface UseCouncilReturn {
  councilors: Councilor[];
  messages: Message[];
  mode: DeliberationMode;
  consensus: number;
  isDeliberating: boolean;
  motion: string;
  activeCouncilors: string[];
  transcript: string;
  
  setMode: (mode: DeliberationMode) => void;
  toggleCouncilor: (id: string) => void;
  submitMotion: (motion: string) => void;
  startDeliberation: () => void;
  clearDeliberation: () => void;
  exportTranscript: () => void;
}

export function useCouncil(): UseCouncilReturn {
  const [councilors, setCouncilors] = useState<Councilor[]>(COUNCILORS);
  const [messages, setMessages] = useState<Message[]>([]);
  const [mode, setMode] = useState<DeliberationMode>('legislative');
  const [consensus, setConsensus] = useState(0);
  const [isDeliberating, setIsDeliberating] = useState(false);
  const [motion, setMotion] = useState('');
  const [transcript, setTranscript] = useState('');
  const [activeCouncilors, setActiveCouncilors] = useState<string[]>(
    COUNCILORS.slice(0, 8).map(c => c.id)
  );
  
  const abortRef = useRef(false);

  const toggleCouncilor = useCallback((id: string) => {
    setCouncilors(prev => prev.map(c => 
      c.id === id ? { ...c, active: !c.active } : c
    ));
    setActiveCouncilors(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const submitMotion = useCallback((motionText: string) => {
    setMotion(motionText);
    setMessages([{
      id: `sys_${Date.now()}`,
      councilorId: 'chancellor',
      councilorName: 'Chancellor Prime',
      councilorEmoji: '👑',
      councilorColor: '#fbbf24',
      role: 'system',
      content: `📋 MOTION SUBMITTED: "${motionText}"\n\nMode: ${mode.toUpperCase()} | Councilors: ${activeCouncilors.length}\n\n${MODE_PROMPTS[mode]}`,
      timestamp: Date.now(),
    }]);
    setTranscript(`[${new Date().toISOString()}] MOTION: "${motionText}"\n`);
  }, [mode, activeCouncilors.length]);

  const startDeliberation = useCallback(async () => {
    if (!motion.trim() || activeCouncilors.length === 0) return;
    
    setIsDeliberating(true);
    setConsensus(0);
    abortRef.current = false;

    const activeList = councilors.filter(c => activeCouncilors.includes(c.id));
    const context = 'Previous councilor statements:\n';

    // Sequential deliberation by each councilor
    for (let i = 0; i < activeList.length && !abortRef.current; i++) {
      const councilor = activeList[i];
      
      // Mark councilor as speaking
      setCouncilors(prev => prev.map(c => 
        c.id === councilor.id ? { ...c, speaking: true } : c
      ));

      // Add thinking message
      const thinkingId = `thinking_${Date.now()}_${i}`;
      setMessages(prev => [...prev, {
        id: thinkingId,
        councilorId: councilor.id,
        councilorName: councilor.name,
        councilorEmoji: councilor.emoji,
        councilorColor: councilor.color,
        role: 'councilor',
        content: '',
        timestamp: Date.now(),
        streaming: true,
      }]);

      let fullResponse = '';
      const messageId = thinkingId;

      try {
        for await (const chunk of councilAI.deliberate(councilor, motion, mode, context)) {
          if (abortRef.current) break;
          
          fullResponse += chunk;
          // Update streaming message
          setMessages(prev => prev.map(m => 
            m.id === messageId ? { ...m, content: fullResponse } : m
          ));
        }
      } catch (e) {
        console.error(`[Council] ${councilor.name} error:`, e);
        fullResponse = `[${councilor.name} is processing their response...]`;
      }

      // Mark councilor as done speaking
      setCouncilors(prev => prev.map(c => 
        c.id === councilor.id ? { ...c, speaking: false } : c
      ));

      // Update transcript
      setTranscript(prev => prev + `\n[${councilor.emoji} ${councilor.name}]\n${fullResponse}\n`);

      // Update consensus based on stance distribution
      const supportCount = activeList.filter(c => 
        ['support', 'analyze'].includes(c.stance)
      ).length;
      setConsensus(Math.round((supportCount / activeList.length) * 100));
    }

    // Final consensus message
    const finalConsensus = consensus || 50;
    setMessages(prev => [...prev, {
      id: `sys_final_${Date.now()}`,
      councilorId: 'chancellor',
      councilorName: 'Chancellor Prime',
      councilorEmoji: '👑',
      councilorColor: '#fbbf24',
      role: 'system',
      content: `🏛️ DELIBERATION CONCLUDED\n\nConsensus Level: ${finalConsensus}%\n\n${finalConsensus >= 70 ? '✅ MOTION PASSES — Strong consensus achieved.' : 
        finalConsensus >= 50 ? '⚖️ MOTION CONTESTED — Divided council.' : 
        '❌ MOTION FAILS — Insufficient support.'}`,
      timestamp: Date.now(),
    }]);

    setIsDeliberating(false);
  }, [motion, activeCouncilors, councilors, mode, consensus]);

  const clearDeliberation = useCallback(() => {
    abortRef.current = true;
    setMessages([]);
    setMotion('');
    setConsensus(0);
    setIsDeliberating(false);
    setTranscript('');
    setCouncilors(prev => prev.map(c => ({ ...c, speaking: false })));
  }, []);

  const exportTranscript = useCallback(() => {
    const fullTranscript = `[AI COUNCIL DELIBERATION TRANSCRIPT]
=====================================
Date: ${new Date().toLocaleString()}
Mode: ${mode.toUpperCase()}
Motion: ${motion}
Councilors: ${councilors.filter(c => activeCouncilors.includes(c.id)).map(c => c.name).join(', ')}
Final Consensus: ${consensus}%

${transcript}
=====================================
END OF TRANSCRIPT`;

    const blob = new Blob([fullTranscript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `council-deliberation-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [transcript, mode, motion, councilors, activeCouncilors, consensus]);

  return {
    councilors,
    messages,
    mode,
    consensus,
    isDeliberating,
    motion,
    activeCouncilors,
    transcript,
    setMode,
    toggleCouncilor,
    submitMotion,
    startDeliberation,
    clearDeliberation,
    exportTranscript,
  };
}
