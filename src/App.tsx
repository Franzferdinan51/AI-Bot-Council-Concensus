import { useState, useCallback, useEffect } from 'react';
import {
  CouncilorGrid,
  StreamingChat,
  ConsensusMeter,
  ModeSelector,
  MotionInput,
  SpecialistPanel,
} from './components';
import { DeliberationModeId, councilors } from './data/councilors';

interface Message {
  id: string;
  role: 'councilor' | 'user' | 'system';
  councilorName?: string;
  councilorEmoji?: string;
  councilorColor?: string;
  content: string;
  timestamp: Date;
}

function App() {
  // State
  const [selectedCouncilors, setSelectedCouncilors] = useState<number[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStreamingId, setCurrentStreamingId] = useState<string | null>(null);
  const [consensus, setConsensus] = useState(0);
  const [deliberationMode, setDeliberationMode] = useState<DeliberationModeId>('DELIBERATION');
  const [isProcessing, setIsProcessing] = useState(false);

  // Toggle councilor selection
  const handleToggleCouncilor = useCallback((id: number) => {
    setSelectedCouncilors((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  // Simulate streaming response (demo purposes)
  const simulateStream = useCallback(async (msg: Message, fullContent: string) => {
    setCurrentStreamingId(msg.id);
    let currentContent = '';

    // Simulate streaming chunks
    const words = fullContent.split(' ');
    for (let i = 0; i < words.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 30 + Math.random() * 50));
      currentContent += (i > 0 ? ' ' : '') + words[i];
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id ? { ...m, content: currentContent } : m
        )
      );
    }

    setCurrentStreamingId(null);

    // Simulate consensus update
    const newConsensus = Math.floor(50 + Math.random() * 40);
    setConsensus(newConsensus);
  }, []);

  // Handle motion submission
  const handleSubmitMotion = useCallback(
    async (motion: string, mode: DeliberationModeId, selected: number[]) => {
      setIsProcessing(true);
      setDeliberationMode(mode);
      setConsensus(0);
      setMessages([]);

      // Add user message
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: motion,
        timestamp: new Date(),
      };
      setMessages([userMsg]);

      // Wait a bit for UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Add system message about deliberation starting
      const selectedCouncilorData = councilors.filter((c) => selected.includes(c.id));
      const systemMsg: Message = {
        id: `system-${Date.now()}`,
        role: 'system',
        content: `Council deliberation initiated with ${selected.length} councilors in ${mode} mode.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, systemMsg]);

      await new Promise((resolve) => setTimeout(resolve, 800));

      // Simulate responses from councilors
      const responseTemplates = [
        (name: string) => `As the ${name}, I believe this motion raises important considerations that warrant careful analysis. We must weigh the implications carefully.`,
        (name: string) => `${name} here. From my perspective, there are both opportunities and risks to consider. A measured approach would serve us best.`,
        (name: string) => `This is ${name}. I have analyzed the proposal thoroughly. While there are merits, we should address the potential drawbacks before proceeding.`,
        (name: string) => `${name} weighs in: the data suggests we should proceed with caution. Implementation will require careful planning.`,
        (name: string) => `From ${name}'s viewpoint, this aligns with long-term objectives but requires stakeholder buy-in. Consensus building is essential.`,
      ];

      for (let i = 0; i < Math.min(selected.length, 5); i++) {
        const councilor = selectedCouncilorData[i];
        if (!councilor) continue;

        await new Promise((resolve) => setTimeout(resolve, 1000));

        const templateIndex = i % responseTemplates.length;
        const responseContent = responseTemplates[templateIndex](councilor.role);

        const councilorMsg: Message = {
          id: `councilor-${Date.now()}-${i}`,
          role: 'councilor',
          councilorName: councilor.name,
          councilorEmoji: councilor.emoji,
          councilorColor: councilor.color,
          content: '',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, councilorMsg]);
        await simulateStream(councilorMsg, responseContent);
      }

      // Add synthesis
      await new Promise((resolve) => setTimeout(resolve, 500));
      const synthesisMsg: Message = {
        id: `synthesis-${Date.now()}`,
        role: 'system',
        councilorName: 'Facilitator',
        councilorEmoji: '⚖️',
        councilorColor: '#8B5CF6',
        content: `Deliberation complete. The council has reached ${Math.floor(
          50 + Math.random() * 40
        )}% consensus on this matter. Further deliberation may be warranted.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, synthesisMsg]);
      setIsProcessing(false);
    },
    [simulateStream]
  );

  // Handle specialist click
  const handleSpecialistClick = useCallback((specialistId: string) => {
    // Could open a modal or add specialist to council
    console.log('Specialist clicked:', specialistId);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-gradient-to-r from-purple-900 via-gray-900 to-blue-900 border-b border-gray-700/50 px-4 py-3">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏛️</span>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                AI Council Chamber
              </h1>
              <p className="text-xs text-gray-400">
                Powered by @chenglou/pretext — Zero-reflow text measurement
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-gray-400">Active Councilors</div>
              <div className="text-lg font-bold text-purple-400">
                {selectedCouncilors.length}
              </div>
            </div>
            <div className="w-px h-8 bg-gray-700" />
            <div className="text-right">
              <div className="text-xs text-gray-400">Deliberation Mode</div>
              <div className="text-sm font-medium text-blue-400">{deliberationMode}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - 3 Column Layout */}
      <main className="flex-1 flex gap-4 p-4 min-h-0 max-w-[1800px] mx-auto w-full">
        {/* Left Column - Councilor Grid */}
        <div className="w-80 flex-shrink-0">
          <CouncilorGrid
            selectedCouncilors={selectedCouncilors}
            onToggleCouncilor={handleToggleCouncilor}
          />
        </div>

        {/* Center Column - Streaming Chat */}
        <div className="flex-1 flex flex-col min-w-0 rounded-xl border border-gray-700/50 overflow-hidden bg-gray-900/30">
          <StreamingChat messages={messages} currentStreamingId={currentStreamingId} />
        </div>

        {/* Right Column - Controls */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
          <ConsensusMeter consensus={consensus} />

          <SpecialistPanel onSpecialistClick={handleSpecialistClick} />

          <MotionInput
            onSubmit={handleSubmitMotion}
            disabled={isProcessing}
            selectedCouncilors={selectedCouncilors}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 border-t border-gray-700/50 bg-gray-900/50 px-4 py-2">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>
              🏛️ {councilors.length} Councilors + {6} Specialists
            </span>
            <span>•</span>
            <span>⚙️ {deliberationMode} Mode</span>
            {messages.length > 0 && (
              <>
                <span>•</span>
                <span>{messages.filter((m) => m.role === 'councilor').length} Responses</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Pretext Active — No DOM Reflow</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
