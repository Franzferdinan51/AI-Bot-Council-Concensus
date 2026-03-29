import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StreamingChat } from './components/StreamingChat';
import { CouncilorGrid } from './components/CouncilorGrid';
import { MotionInput } from './components/MotionInput';
import { ConsensusMeter } from './components/ConsensusMeter';
import type { Councilor } from './components/CouncilorCard';
import type { DeliberationMode } from './components/MotionInput';

// Demo councilors - 24+ diverse AI personalities
const INITIAL_COUNCILORS: Councilor[] = [
  { id: '1', name: 'Athena', role: 'Strategic Advisor', personality: 'Calculated, wise, favors long-term stability', model: 'MiniMax-M2.7' },
  { id: '2', name: 'Prometheus', role: 'Innovation Catalyst', personality: 'Bold, experimental, challenges the status quo', model: 'glm-5' },
  { id: '3', name: 'Solomon', role: 'Moral Philosopher', personality: 'Ethical, contemplative, weighs justice carefully', model: 'kimi-k2' },
  { id: '4', name: 'Cassandra', role: 'Risk Analyst', personality: 'Cautious, anticipates failure modes, prudent', model: 'MiniMax-M2.7' },
  { id: '5', name: 'Hermes', role: 'Communicator', personality: 'Persuasive, diplomatic, bridges differing views', model: 'glm-4.7' },
  { id: '6', name: 'Medea', role: 'Technical Expert', personality: 'Precise, methodical, demands evidence', model: 'kimi-k2.5' },
  { id: '7', name: 'Atlas', role: 'Systems Thinker', personality: 'Holistic, sees interconnections, integrative', model: 'MiniMax-M2.7' },
  { id: '8', name: 'Sphinx', role: 'Questioner', personality: 'Challenges assumptions, asks the hard questions', model: 'glm-5' },
  { id: '9', name: 'Nike', role: 'Action Officer', personality: 'Decisive, results-oriented, cuts through debate', model: 'MiniMax-M2.7' },
  { id: '10', name: 'Mnemosyne', role: 'Memory Keeper', personality: 'Draws from historical precedent, wise in retrospect', model: 'kimi-k2' },
  { id: '11', name: 'Erebus', role: 'Devil\'s Advocate', personality: 'Challenges consensus, finds flaws, stress-tests', model: 'glm-4.7' },
  { id: '12', name: 'Eos', role: 'Optimist', personality: 'Sees possibilities, believes in potential, encouraging', model: 'MiniMax-M2.7' },
  { id: '13', name: 'Themis', role: 'Justice Keeper', personality: 'Fair, impartial, protects the vulnerable', model: 'kimi-k2.5' },
  { id: '14', name: 'Boreas', role: 'Critical Thinker', personality: 'Analytical, skeptical of claims, evidence-focused', model: 'glm-5' },
  { id: '15', name: 'Hestia', role: 'Community Builder', personality: 'Values consensus, protects group harmony', model: 'MiniMax-M2.7' },
  { id: '16', name: 'Hypatia', role: 'Science Advocate', personality: 'Pro-mknowledge, values research, data-driven', model: 'kimi-k2' },
  { id: '17', name: 'Morpheus', role: 'Scenario Planner', personality: 'Creative futures thinking, explores possibilities', model: 'glm-4.7' },
  { id: '18', name: 'Clio', role: 'Storyteller', personality: 'Narrative-driven, understands context deeply', model: 'MiniMax-M2.7' },
  { id: '19', name: 'Dike', role: 'Rights Defender', personality: 'Protects individual liberties, checks power', model: 'kimi-k2.5' },
  { id: '20', name: 'Kairos', role: 'Opportunist', personality: 'Recognizes timing, knows when to act', model: 'glm-5' },
  { id: '21', name: 'Ananke', role: 'Necessity Voice', personality: 'Pragmatic, acknowledges constraints, realistic', model: 'MiniMax-M2.7' },
  { id: '22', name: 'Hebe', role: 'Youth Advocate', personality: 'Forward-looking, represents future generations', model: 'kimi-k2' },
  { id: '23', name: 'Tyche', role: 'Uncertainty Keeper', personality: 'Acknowledges randomness, probabilistic thinker', model: 'glm-4.7' },
  { id: '24', name: 'Arete', role: 'Excellence Seeker', personality: 'Values quality, excellence in execution', model: 'MiniMax-M2.7' },
];

interface Message {
  id: string;
  role: 'councilor' | 'system';
  councilorName?: string;
  content: string;
  timestamp: Date;
}

// Generate a response from a councilor (demo mode - no actual API call)
function generateCouncilorResponse(
  councilor: Councilor,
  motion: string,
  mode: DeliberationMode
): string {
  const responses: Record<string, string[]> = {
    'legislative': [
      `As ${councilor.role}, I have analyzed this motion carefully. The implications for long-term stability must be weighed against short-term gains. I propose we consider the following amendments...`,
      `${councilor.personality}. Therefore, I ${councilor.id.charCodeAt(0) % 2 === 0 ? 'support' : 'cannot support'} this motion in its current form. The council should deliberate further.`,
      `My analysis indicates this motion aligns with ${councilor.id.charCodeAt(0) % 3 === 0 ? 'fundamental principles of justice and equity' : 'practical considerations of governance'}. I move we proceed to vote.`,
    ],
    'deep-research': [
      `Researching the multidimensional aspects of this query... Initial findings suggest we must consider historical context, current data, and projected outcomes. Shall I compile a comprehensive report?`,
      `Cross-referencing knowledge bases... The evidence points to nuanced conclusions requiring further investigation. I recommend a multi-pronged research approach.`,
      `Synthesizing information from multiple domains. Key insights emerge: this matter is more complex than initially apparent. Extended deliberation is warranted.`,
    ],
    'swarm-coding': [
      `Analyzing requirements for implementation... Architecture design in progress. I will focus on the core modules while coordinating with other councilors on integration.`,
      `Code review indicates potential optimizations. I suggest refactoring the proposed solution to improve modularity and maintainability.`,
      `Testing strategy formulated. I recommend TDD approach with comprehensive edge case coverage. My modules will integrate seamlessly with existing systems.`,
    ],
  };
  
  const pool = responses[mode] || responses['legislative'];
  return pool[parseInt(councilor.id) % pool.length];
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [councilors] = useState<Councilor[]>(INITIAL_COUNCILORS);
  const [activeCouncilorId, setActiveCouncilorId] = useState<string | undefined>();
  const [speakingCouncilorId, setSpeakingCouncilorId] = useState<string | undefined>();
  const [consensus, setConsensus] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [leftWidth, setLeftWidth] = useState(280);
  const [rightWidth, setRightWidth] = useState(320);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const centerWidth = containerRef.current 
    ? containerRef.current.clientWidth - leftWidth - rightWidth - 4
    : 600;

  // Panel resize handlers
  const handleLeftResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftWidth;
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      setLeftWidth(Math.max(200, Math.min(400, startWidth + delta)));
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [leftWidth]);

  const handleRightResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightWidth;
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX;
      setRightWidth(Math.max(280, Math.min(450, startWidth + delta)));
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [rightWidth]);

  // Submit motion to council
  const handleSubmitMotion = useCallback((motion: string, mode: DeliberationMode) => {
    setIsProcessing(true);
    setConsensus(0);
    
    // Add system message
    const systemMsg: Message = {
      id: `system-${Date.now()}`,
      role: 'system',
      content: `Motion submitted: "${motion}" (${mode} mode)`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, systemMsg]);

    // Simulate council deliberation
    let responseCount = 0;
    const totalResponses = Math.min(councilors.length, 8);
    
    // Shuffle councilors for variety
    const shuffledCouncilors = [...councilors]
      .sort(() => Math.random() - 0.5)
      .slice(0, totalResponses);

    shuffledCouncilors.forEach((councilor, index) => {
      setTimeout(() => {
        setActiveCouncilorId(councilor.id);
        setSpeakingCouncilorId(councilor.id);
        
        const response = generateCouncilorResponse(councilor, motion, mode);
        
        const councilorMsg: Message = {
          id: `${councilor.id}-${Date.now()}`,
          role: 'councilor',
          councilorName: `${councilor.name} (${councilor.role})`,
          content: response,
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, councilorMsg]);
        responseCount++;
        
        // Update consensus as responses come in
        const newConsensus = Math.round((responseCount / totalResponses) * 85 + Math.random() * 15);
        setConsensus(Math.min(98, newConsensus));
        
        if (responseCount === totalResponses) {
          setSpeakingCouncilorId(undefined);
          setActiveCouncilorId(undefined);
          setIsProcessing(false);
          
          // Add final system message
          const finalMsg: Message = {
            id: `final-${Date.now()}`,
            role: 'system',
            content: `Council deliberation complete. ${totalResponses} councilors have contributed. Final consensus: ${Math.round(consensus)}%`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, finalMsg]);
        }
      }, 1500 + index * 800);
    });
  }, [councilors, consensus]);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-950 text-gray-100 overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center px-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏛️</span>
          <h1 className="text-lg font-bold">AI Council Chamber</h1>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
            Powered by @chenglou/pretext
          </span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-xs text-gray-500">
            Zero-reflow text measurement
          </span>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </header>

      {/* Main 3-column layout */}
      <div className="flex-1 flex overflow-hidden" ref={containerRef}>
        {/* Left: Councilor Grid */}
        <div
          className="shrink-0 border-r border-gray-800"
          style={{ width: leftWidth }}
        >
          <CouncilorGrid
            councilors={councilors}
            activeCouncilorId={activeCouncilorId}
            speakingCouncilorId={speakingCouncilorId}
            onCouncilorSelect={(c) => setActiveCouncilorId(c.id)}
            containerWidth={leftWidth - 12}
          />
        </div>

        {/* Left resize handle */}
        <div
          className="w-1 bg-gray-800 hover:bg-blue-600 cursor-col-resize transition-colors shrink-0"
          onMouseDown={handleLeftResize}
        />

        {/* Center: Deliberation Chat */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ minWidth: 400 }}>
          <StreamingChat
            messages={messages}
            containerWidth={centerWidth}
          />
        </div>

        {/* Right resize handle */}
        <div
          className="w-1 bg-gray-800 hover:bg-blue-600 cursor-col-resize transition-colors shrink-0"
          onMouseDown={handleRightResize}
        />

        {/* Right: Motion Input + Consensus */}
        <div
          className="shrink-0 border-l border-gray-800 flex flex-col"
          style={{ width: rightWidth }}
        >
          {/* Consensus Meter */}
          <div className="shrink-0">
            <ConsensusMeter
              consensus={consensus}
              phase={isProcessing ? 'deliberating' : consensus > 0 ? 'complete' : 'voting'}
              votes={isProcessing || consensus > 0 ? {
                inFavor: Math.round((consensus / 100) * councilors.length),
                against: Math.round(((100 - consensus) / 100) * councilors.length * 0.3),
                abstain: Math.round(((100 - consensus) / 100) * councilors.length * 0.2),
              } : undefined}
            />
          </div>
          
          {/* Motion Input */}
          <div className="flex-1 overflow-hidden">
            <MotionInput
              onSubmit={handleSubmitMotion}
              isProcessing={isProcessing}
              containerWidth={rightWidth}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="h-8 bg-gray-900 border-t border-gray-800 flex items-center px-4 text-xs text-gray-500 shrink-0">
        <span>Pretext: Canvas测量 ~19ms → 数学计算 ~0.09ms</span>
        <span className="mx-2">•</span>
        <span>No layout reflow during streaming</span>
        <span className="mx-2">•</span>
        <span>Zero-reflow text measurement for AI UIs</span>
      </footer>
    </div>
  );
}
