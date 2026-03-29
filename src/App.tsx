import { useState, useCallback, useEffect } from 'react';
import {
  StreamingChat,
  MotionInput,
  Drawer,
} from './components';
import { DeliberationModeId, deliberationModes, councilors } from './data/councilors';

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState<'connected' | 'disconnected'>('connected');

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

  // Simulate gateway status check
  useEffect(() => {
    const checkGateway = () => {
      setGatewayStatus('connected');
    };
    checkGateway();
    const interval = setInterval(checkGateway, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen h-[100dvh] flex flex-col bg-gray-950 text-white overflow-hidden">
      {/* Drawer Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        selectedCouncilors={selectedCouncilors}
        onToggleCouncilor={handleToggleCouncilor}
      />

      {/* Header - Fixed Top */}
      <header className="flex-shrink-0 h-[60px] bg-gradient-to-r from-purple-900 via-gray-900 to-blue-900 border-b border-gray-700/50 z-30">
        <div className="h-full flex items-center justify-between px-4 max-w-[2000px] mx-auto">
          {/* Left: Logo/Title */}
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏛️</span>
            <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent hidden sm:block">
              AI Council Chamber
            </h1>
          </div>

          {/* Center: Mode Selector Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {deliberationModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setDeliberationMode(mode.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all
                  ${deliberationMode === mode.id
                    ? 'scale-105 shadow-lg'
                    : 'hover:bg-gray-700/50 text-gray-400 hover:text-white'
                  }
                `}
                style={{
                  backgroundColor: deliberationMode === mode.id ? `${mode.color}30` : undefined,
                  borderWidth: deliberationMode === mode.id ? 1 : 0,
                  borderColor: deliberationMode === mode.id ? mode.color : undefined,
                }}
              >
                <span>{mode.icon}</span>
                <span className="hidden md:inline">{mode.name}</span>
              </button>
            ))}
          </div>

          {/* Right: Gateway Status + Settings */}
          <div className="flex items-center gap-3">
            {/* Active Councilors Count */}
            <div className="text-right hidden sm:block">
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Councilors</div>
              <div className="text-sm font-bold text-purple-400">{selectedCouncilors.length}</div>
            </div>

            <div className="w-px h-6 bg-gray-700 hidden sm:block" />

            {/* Gateway Status */}
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  gatewayStatus === 'connected'
                    ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50'
                    : 'bg-red-500'
                }`}
              />
              <span className="text-xs text-gray-400 hidden sm:inline">
                {gatewayStatus === 'connected' ? 'Gateway' : 'Offline'}
              </span>
            </div>

            {/* Settings Gear */}
            <button className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Hero StreamingChat */}
      <main className="flex-1 overflow-hidden relative">
        <StreamingChat messages={messages} currentStreamingId={currentStreamingId} />

        {/* Floating Councilors Button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className={`
            fixed left-4 bottom-[140px] z-30
            flex items-center gap-2 px-4 py-3 rounded-full
            bg-gradient-to-r from-purple-600 to-blue-600
            text-white font-semibold shadow-xl shadow-purple-500/30
            hover:from-purple-500 hover:to-blue-500
            transition-all hover:scale-105 active:scale-95
            ${drawerOpen ? 'translate-x-[340px] opacity-0 pointer-events-none' : ''}
          `}
        >
          <span className="text-xl">👥</span>
          <span>Councilors</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
            {councilors.length}
          </span>
        </button>
      </main>

      {/* Bottom Input Bar - Fixed */}
      <footer className="flex-shrink-0 bg-gray-900/95 border-t border-gray-700/50 z-20">
        <div className="max-w-[1200px] mx-auto px-4 py-4">
          <MotionInput
            onSubmit={handleSubmitMotion}
            disabled={isProcessing}
            selectedCouncilors={selectedCouncilors}
            selectedMode={deliberationMode}
            consensus={consensus}
          />
        </div>
      </footer>
    </div>
  );
}

export default App;
