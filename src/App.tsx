import { useState, useCallback, useEffect, useRef } from 'react';
import { CouncilorDrawer } from './components/CouncilorDrawer';
import { CollapsibleInput } from './components/CollapsibleInput';
import { deliberationModes, DeliberationModeId, councilors, Councilor } from './data/councilors';
import { measureText, createStreamingMeasurer } from './lib/pretext';

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
  const [selectedCouncilors, setSelectedCouncilors] = useState<number[]>([1, 2, 3, 4, 5]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStreamingId, setCurrentStreamingId] = useState<string | null>(null);
  const [consensus, setConsensus] = useState(0);
  const [deliberationMode, setDeliberationMode] = useState<DeliberationModeId>('DELIBERATION');
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputCollapsed, setInputCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);

  // Refs for scroll
  const chatEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const [messageHeights, setMessageHeights] = useState<Map<string, number>>(new Map());
  const streamingMeasurers = useRef<Map<string, ReturnType<typeof createStreamingMeasurer>>>(new Map());

  // Measure container width
  useEffect(() => {
    const measureWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth - 32);
      }
    };
    measureWidth();
    window.addEventListener('resize', measureWidth);
    return () => window.removeEventListener('resize', measureWidth);
  }, []);

  // Measure messages via pretext
  useEffect(() => {
    const contentWidth = Math.min(containerWidth - 80, 640);
    messages.forEach((msg) => {
      if (msg.content) {
        const { height } = measureText(msg.content, contentWidth, 15, 22);
        const reservedHeight = Math.max(70, height + 52);
        setMessageHeights((prev) => {
          const next = new Map(prev);
          next.set(msg.id, reservedHeight);
          return next;
        });
      }
    });
  }, [messages, containerWidth]);

  // Update streaming heights without reflow
  useEffect(() => {
    if (!currentStreamingId) return;
    const msg = messages.find((m) => m.id === currentStreamingId);
    if (!msg || !msg.content) return;

    const contentWidth = Math.min(containerWidth - 80, 640);
    if (!streamingMeasurers.current.has(currentStreamingId)) {
      streamingMeasurers.current.set(currentStreamingId, createStreamingMeasurer(contentWidth, 15, 22));
    }
    const measurer = streamingMeasurers.current.get(currentStreamingId)!;
    const h = measurer.append(msg.content);
    const reservedHeight = Math.max(70, h + 52);
    setMessageHeights((prev) => {
      const next = new Map(prev);
      next.set(currentStreamingId, reservedHeight);
      return next;
    });
  }, [messages, currentStreamingId, containerWidth]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, messageHeights]);

  // Simulate streaming
  const simulateStream = useCallback(async (msg: Message, fullContent: string) => {
    setCurrentStreamingId(msg.id);
    let currentContent = '';
    const words = fullContent.split(' ');
    for (let i = 0; i < words.length; i++) {
      await new Promise((r) => setTimeout(r, 25 + Math.random() * 60));
      currentContent += (i > 0 ? ' ' : '') + words[i];
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, content: currentContent } : m));
    }
    setCurrentStreamingId(null);
    streamingMeasurers.current.delete(msg.id);
    setConsensus(Math.floor(50 + Math.random() * 40));
  }, []);

  // Toggle councilor selection
  const handleToggleCouncilor = useCallback((id: number) => {
    setSelectedCouncilors((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  // Handle motion submission
  const handleSubmitMotion = useCallback(
    async (motion: string, mode: DeliberationModeId, selected: number[]) => {
      setIsProcessing(true);
      setDeliberationMode(mode);
      setConsensus(0);
      setMessages([]);

      const userMsg: Message = { id: `user-${Date.now()}`, role: 'user', content: motion, timestamp: new Date() };
      setMessages([userMsg]);
      await new Promise((r) => setTimeout(r, 500));

      const selectedData = councilors.filter((c: Councilor) => selected.includes(c.id));
      const systemMsg: Message = {
        id: `system-${Date.now()}`, role: 'system',
        content: `Council deliberation initiated with ${selected.length} councilors in ${mode} mode.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, systemMsg]);
      await new Promise((r) => setTimeout(r, 800));

      const templates = [
        (r: string) => `As the ${r}, this motion raises important considerations that warrant careful analysis. We must weigh the implications carefully.`,
        (r: string) => `${r} here. From my perspective, there are both opportunities and risks to consider. A measured approach would serve us best.`,
        (r: string) => `This is ${r}. I have analyzed the proposal thoroughly. While there are merits, we should address potential drawbacks before proceeding.`,
        (r: string) => `${r} weighs in: the data suggests proceeding with caution. Implementation will require careful planning.`,
        (r: string) => `From ${r}'s viewpoint, this aligns with long-term objectives but requires stakeholder buy-in. Consensus building is essential.`,
      ];

      for (let i = 0; i < Math.min(selected.length, 5); i++) {
        const councilor = selectedData[i];
        if (!councilor) continue;
        await new Promise((r) => setTimeout(r, 1000));
        const councilorMsg: Message = {
          id: `councilor-${Date.now()}-${i}`, role: 'councilor',
          councilorName: councilor.name, councilorEmoji: councilor.emoji,
          councilorColor: councilor.color, content: '', timestamp: new Date(),
        };
        setMessages((prev) => [...prev, councilorMsg]);
        await simulateStream(councilorMsg, templates[i % templates.length](councilor.role));
      }

      await new Promise((r) => setTimeout(r, 500));
      const synthesisMsg: Message = {
        id: `synthesis-${Date.now()}`, role: 'system',
        councilorName: 'Facilitator', councilorEmoji: '⚖️', councilorColor: '#8B5CF6',
        content: `Deliberation complete. The council has reached ${Math.floor(50 + Math.random() * 40)}% consensus on this matter.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, synthesisMsg]);
      setIsProcessing(false);
    },
    [simulateStream]
  );

  const currentModeData = deliberationModes.find((m) => m.id === deliberationMode);

  return (
    <div className="h-screen h-[100dvh] flex flex-col bg-gray-950 text-white overflow-hidden">
      {/* Minimal Header — 48px */}
      <header className="flex-none h-12 flex items-center justify-between px-4 border-b border-slate-800 bg-gray-950/90 backdrop-blur-sm z-20">
        {/* Left */}
        <div className="flex items-center gap-2">
          <span className="text-xl">🦞</span>
          <span className="font-bold text-sm text-gray-100">AI Council</span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Mode badge — clickable */}
          <button
            onClick={() => setModeDropdownOpen(!modeDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:bg-gray-800"
            style={{
              backgroundColor: currentModeData ? `${currentModeData.color}25` : '#1f2937',
              borderWidth: 1,
              borderColor: currentModeData ? `${currentModeData.color}50` : '#374151',
            }}
          >
            <span>{currentModeData?.icon}</span>
            <span style={{ color: currentModeData?.color }}>{currentModeData?.name}</span>
          </button>

          {/* Councilor count */}
          <span className="text-xs text-gray-500">
            <span className="text-purple-400 font-semibold">{selectedCouncilors.length}</span> active
          </span>

          {/* Settings */}
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors">
            ⚙️
          </button>
        </div>
      </header>

      {/* Mode Dropdown */}
      {modeDropdownOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setModeDropdownOpen(false)} />
          <div className="absolute top-12 right-4 z-30 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-2 min-w-[220px]">
            <div className="text-xs text-gray-500 px-2 pb-2 mb-1 border-b border-gray-700">Deliberation Mode</div>
            {deliberationModes.map((m) => (
              <button
                key={m.id}
                onClick={() => { setDeliberationMode(m.id); setModeDropdownOpen(false); }}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-sm transition-colors ${m.id === deliberationMode ? 'bg-gray-800' : 'hover:bg-gray-800'}`}
              >
                <span className="text-base">{m.icon}</span>
                <div>
                  <div className="font-medium" style={{ color: m.color }}>{m.name}</div>
                  <div className="text-xs text-gray-500">{m.description}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Main Chat Area */}
      <main ref={containerRef} className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Empty State */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <span className="text-5xl mb-4 opacity-50">🏛️</span>
              <p className="text-base font-medium text-gray-400">Submit a motion below to begin deliberation</p>
              <p className="text-sm text-gray-600 mt-2">The council awaits your proposal</p>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => {
            const height = messageHeights.get(msg.id) || 80;
            const streaming = currentStreamingId === msg.id;

            return (
              <div key={msg.id} className="flex gap-3" style={{ minHeight: height }}>
                {/* Avatar */}
                <div
                  className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-lg mt-0.5"
                  style={{ backgroundColor: msg.councilorColor || (msg.role === 'user' ? '#3B82F6' : '#1f2937') }}
                >
                  {msg.role === 'user' ? '👤' : msg.councilorEmoji || '🏛️'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1.5">
                    <span className="font-semibold text-sm" style={{ color: msg.councilorColor || '#fff' }}>
                      {msg.role === 'user' ? 'You' : msg.councilorName || 'System'}
                    </span>
                    <span className="text-xs text-gray-600">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {streaming && (
                      <span className="flex items-center gap-1 text-xs text-purple-400">
                        <span className="animate-pulse">●</span>
                        <span>Streaming</span>
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-200 leading-relaxed" style={{ minHeight: height - 52 }}>
                    {msg.content}
                    {streaming && <span className="inline-block w-2 h-3.5 bg-purple-400 ml-0.5 animate-pulse align-middle rounded-sm" />}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={chatEndRef} />
        </div>
      </main>

      {/* Consensus mini-meter */}
      {isProcessing && (
        <div className="flex-none px-4 py-2 border-t border-slate-800/50 bg-gray-950/50">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 whitespace-nowrap">
                Building consensus…
                <span className="ml-2 text-purple-400 font-semibold">{consensus}%</span>
              </span>
              <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 rounded-full"
                  style={{ width: `${consensus}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Bottom Input */}
      <CollapsibleInput
        collapsed={inputCollapsed}
        onToggle={() => setInputCollapsed(!inputCollapsed)}
        onSubmit={handleSubmitMotion}
        disabled={isProcessing}
        selectedCouncilors={selectedCouncilors}
        deliberationMode={deliberationMode}
        onModeChange={setDeliberationMode}
      />

      {/* Councilor Drawer */}
      <CouncilorDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        selectedCouncilors={selectedCouncilors}
        onToggleCouncilor={handleToggleCouncilor}
      />

      {/* Floating: Councilors button — bottom left */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-20 left-4 z-30 flex items-center gap-1.5 px-3 py-2 bg-gray-800 border border-gray-700 rounded-full text-xs font-medium text-gray-300 shadow-lg hover:bg-gray-700 transition-all"
      >
        <span>👥</span>
        <span>Councilors</span>
        <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{selectedCouncilors.length}</span>
      </button>

      {/* FAB — bottom right */}
      <button
        onClick={() => { setInputCollapsed(false); setDrawerOpen(false); }}
        className="fixed bottom-20 right-4 z-30 w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full shadow-lg shadow-purple-500/25 flex items-center justify-center text-lg hover:scale-110 transition-transform"
      >
        ⚡
      </button>
    </div>
  );
}

export default App;
