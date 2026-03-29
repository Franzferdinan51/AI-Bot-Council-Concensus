import { useState, useCallback, useEffect, useRef } from 'react';
import {
  CouncilorDrawer,
  StreamingChat,
  ConsensusMeter,
  ModeSelector,
  MotionInput,
  SpecialistPanel,
} from './components';
import { DeliberationModeId, councilors as DEFAULT_COUNCILORS } from './data/councilors';
import { streamDeliberation, submitMotion, checkGatewayHealth, type SSEEvent } from './services/api';

interface Message {
  id: string;
  role: 'councilor' | 'user' | 'system';
  councilorName?: string;
  councilorEmoji?: string;
  councilorColor?: string;
  content: string;
  timestamp: Date;
}

type ControlTabId = 'compose' | 'consensus' | 'specialists';

const controlTabs: Array<{ id: ControlTabId; label: string; description: string }> = [
  { id: 'compose', label: 'Compose', description: 'Draft motions and choose the deliberation mode.' },
  { id: 'consensus', label: 'Consensus', description: 'Track alignment, activity, and council response volume.' },
  { id: 'specialists', label: 'Specialists', description: 'Review expert agents available for deeper analysis.' },
];

function App() {
  const [selectedCouncilors, setSelectedCouncilors] = useState<number[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStreamingId, setCurrentStreamingId] = useState<string | null>(null);
  const [consensus, setConsensus] = useState(0);
  const [deliberationMode, setDeliberationMode] = useState<DeliberationModeId>('DELIBERATION');
  const [isProcessing, setIsProcessing] = useState(false);
  const [councilorDrawerOpen, setCouncilorDrawerOpen] = useState(false);
  const [activeControlTab, setActiveControlTab] = useState<ControlTabId>('compose');
  const [gatewayStatus, setGatewayStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [error, setError] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const status = await checkGatewayHealth();
        if (mounted) setGatewayStatus(status.connected ? 'connected' : 'disconnected');
      } catch { if (mounted) setGatewayStatus('disconnected'); }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  useEffect(() => { return () => { cleanupRef.current?.(); }; }, []);

  const handleToggleCouncilor = useCallback((id: number) => {
    setSelectedCouncilors((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  }, []);

  const handleSpecialistClick = useCallback((specialistId: string) => {
    console.log('Specialist clicked:', specialistId);
  }, []);

  const handleSubmitMotion = useCallback(async (motion: string, mode: DeliberationModeId, selected: number[]) => {
    setError(null);
    setIsProcessing(true);
    setDeliberationMode(mode);
    setConsensus(0);
    setMessages([]);

    cleanupRef.current?.();
    cleanupRef.current = null;

    const userMsg: Message = { id: `user-${Date.now()}`, role: 'user', content: motion, timestamp: new Date() };
    setMessages([userMsg]);

    try {
      const { sessionId } = await submitMotion(motion, mode, selected);

      setMessages((prev) => [
        ...prev,
        { id: `system-${Date.now()}`, role: 'system', content: `Council deliberation initiated with ${selected.length} councilors in ${mode} mode. Connecting to deliberation engine...`, timestamp: new Date() },
      ]);

      let currentCouncilorId: string | null = null;

      cleanupRef.current = streamDeliberation(
        sessionId,
        (event: SSEEvent) => {
          switch (event.type) {
            case 'system':
              setMessages((prev) => [...prev, { id: `system-${Date.now()}`, role: 'system', content: event.content, timestamp: new Date() }]);
              break;
            case 'councilor_start':
              const councilorMsg: Message = {
                id: `councilor-${Date.now()}`,
                role: 'councilor',
                councilorName: event.councilor,
                councilorEmoji: event.emoji,
                councilorColor: event.color,
                content: '',
                timestamp: new Date(),
              };
              currentCouncilorId = councilorMsg.id;
              setCurrentStreamingId(councilorMsg.id);
              setMessages((prev) => [...prev, councilorMsg]);
              break;
            case 'token':
              if (currentCouncilorId) {
                setMessages((prev) => prev.map((m) => m.id === currentCouncilorId ? { ...m, content: event.content } : m));
              }
              break;
            case 'councilor_end':
              setCurrentStreamingId(null);
              currentCouncilorId = null;
              break;
            case 'consensus':
              setConsensus(event.score);
              break;
            case 'done':
              setCurrentStreamingId(null);
              setIsProcessing(false);
              setMessages((prev) => [
                ...prev,
                { id: `synthesis-${Date.now()}`, role: 'system', councilorName: 'Facilitator', councilorEmoji: '⚖️', councilorColor: '#8B5CF6', content: `Deliberation complete. The council has reached ${event.consensus}% consensus across ${event.responseCount} responses.`, timestamp: new Date() },
              ]);
              setConsensus(event.consensus);
              break;
            case 'error':
              setError(`Deliberation error: ${event.message}`);
              setIsProcessing(false);
              setCurrentStreamingId(null);
              break;
          }
        },
        (err: Error) => {
          setError(`Connection error: ${err.message}`);
          setIsProcessing(false);
          setCurrentStreamingId(null);
        }
      );
    } catch (err: any) {
      setError(`Failed to start deliberation: ${err.message}`);
      setIsProcessing(false);
      setMessages((prev) => [...prev, { id: `error-${Date.now()}`, role: 'system', content: `Error: ${err.message}`, timestamp: new Date() }]);
    }
  }, []);

  const modeMeta = (() => {
    const modes: Record<string, { icon: string; name: string; color: string }> = {
      PROPOSAL: { icon: '⚖️', name: 'Legislative', color: '#8B5CF6' },
      DELIBERATION: { icon: '🔄', name: 'Deliberation', color: '#3B82F6' },
      INQUIRY: { icon: '❓', name: 'Inquiry', color: '#10B981' },
      RESEARCH: { icon: '📚', name: 'Research', color: '#F59E0B' },
      SWARM: { icon: '🐝', name: 'Swarm', color: '#EF4444' },
      SWARM_CODING: { icon: '⚡', name: 'Swarm Coding', color: '#06B6D4' },
      PREDICTION: { icon: '🔮', name: 'Prediction', color: '#EC4899' },
      VISION: { icon: '👁️', name: 'Vision Council', color: '#A855F7' },
    };
    return modes[deliberationMode] || modes.DELIBERATION;
  })();

  const councilorResponseCount = messages.filter((m) => m.role === 'councilor').length;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-950 text-white">
      {/* HEADER */}
      <header className="flex-shrink-0 border-b border-gray-700/50 bg-gradient-to-r from-purple-900 via-gray-900 to-blue-900 px-4 py-3">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏛️</span>
            <div>
              <h1 className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-xl font-bold text-transparent">AI Council Chamber</h1>
              <p className="text-xs text-gray-400">Powered by @chenglou/pretext — Zero-reflow text measurement</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${gatewayStatus === 'connected' ? 'bg-green-500 animate-pulse' : gatewayStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`} />
              <span className="text-xs text-gray-400">{gatewayStatus === 'connected' ? 'Gateway Connected' : gatewayStatus === 'disconnected' ? 'Gateway Offline' : 'Checking...'}</span>
            </div>
            <div className="h-8 w-px bg-gray-700" />
            <div className="text-right">
              <div className="text-xs text-gray-400">Active Councilors</div>
              <div className="text-lg font-bold text-purple-400">{selectedCouncilors.length}</div>
            </div>
            <div className="h-8 w-px bg-gray-700" />
            <div className="text-right">
              <div className="text-xs text-gray-400">Deliberation Mode</div>
              <div className="text-sm font-medium" style={{ color: modeMeta.color }}>{modeMeta.icon} {modeMeta.name}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="flex-shrink-0 bg-red-900/50 border-b border-red-700/50 px-4 py-2">
          <div className="mx-auto flex max-w-[1800px] items-center justify-between">
            <span className="text-sm text-red-300">⚠️ {error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200 text-sm">✕ Dismiss</button>
          </div>
        </div>
      )}

      {/* COUNCILOR DRAWER */}
      <CouncilorDrawer open={councilorDrawerOpen} onClose={() => setCouncilorDrawerOpen(false)} selectedCouncilors={selectedCouncilors} onToggleCouncilor={handleToggleCouncilor} />

      {/* FAB */}
      <button type="button" onClick={() => setCouncilorDrawerOpen(true)}
        className="fixed bottom-5 left-5 z-50 inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-2xl shadow-purple-900/50 transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2 focus:ring-offset-gray-950">
        <span className="text-lg">🏛️</span><span>Select Councilors</span>
        <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">{selectedCouncilors.length}</span>
      </button>

      {/* MAIN CONTENT */}
      <main className="mx-auto flex w-full max-w-[1800px] flex-1 overflow-hidden px-4 py-4">
        <div className="flex h-full min-h-0 w-full flex-col gap-4">
          {/* Control Center */}
          <section className="flex-shrink-0 overflow-hidden rounded-xl border border-gray-700/50 bg-gray-900/40 backdrop-blur-sm">
            <div className="flex flex-col gap-4 border-b border-gray-700/50 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-300/80">Control Center</p>
                <h2 className="mt-1 text-lg font-semibold text-white">Integrated deliberation controls</h2>
                <p className="mt-1 text-sm text-gray-400">Manage the motion workflow, inspect consensus, and review specialists.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-purple-200">{selectedCouncilors.length} councilors selected</div>
                <div className="rounded-full border px-3 py-1 text-blue-200" style={{ borderColor: `${modeMeta.color}50`, backgroundColor: `${modeMeta.color}10` }}>{modeMeta.icon} {modeMeta.name}</div>
                <div className="rounded-full border border-gray-700 bg-gray-900/70 px-3 py-1 text-gray-300">{isProcessing ? '⚡ Deliberation in progress' : '✓ Ready for motion'}</div>
              </div>
            </div>
            {/* Tabs */}
            <div className="border-b border-gray-700/50 px-3 py-3">
              <div className="flex flex-wrap gap-2">
                {controlTabs.map((tab) => {
                  const isActive = activeControlTab === tab.id;
                  return (
                    <button key={tab.id} type="button" onClick={() => setActiveControlTab(tab.id)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${isActive ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-900/30' : 'bg-gray-800/70 text-gray-300 hover:bg-gray-700/80'}`}>
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-sm text-gray-400">{controlTabs.find((tab) => tab.id === activeControlTab)?.description}</p>
            </div>
            {/* Tab Content */}
            <div className="p-4">
              {activeControlTab === 'compose' && (
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
                  <MotionInput onSubmit={handleSubmitMotion} disabled={isProcessing} selectedCouncilors={selectedCouncilors} selectedMode={deliberationMode} consensus={consensus} />
                  <ModeSelector selectedMode={deliberationMode} onModeChange={setDeliberationMode} />
                </div>
              )}
              {activeControlTab === 'consensus' && (
                <div className="grid gap-4 xl:grid-cols-[minmax(280px,0.7fr)_minmax(0,1.3fr)]">
                  <ConsensusMeter consensus={consensus} />
                  <div className="rounded-xl border border-gray-700/50 bg-gray-900/40 p-4">
                    <h3 className="text-sm font-semibold text-white">Deliberation Snapshot</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg border border-gray-700/50 bg-gray-950/60 p-3">
                        <div className="text-xs uppercase tracking-wide text-gray-500">Responses</div>
                        <div className="mt-2 text-2xl font-semibold text-white">{councilorResponseCount}</div>
                      </div>
                      <div className="rounded-lg border border-gray-700/50 bg-gray-950/60 p-3">
                        <div className="text-xs uppercase tracking-wide text-gray-500">Streaming</div>
                        <div className="mt-2 text-2xl font-semibold text-white">{currentStreamingId ? 'Live' : 'Idle'}</div>
                      </div>
                      <div className="rounded-lg border border-gray-700/50 bg-gray-950/60 p-3">
                        <div className="text-xs uppercase tracking-wide text-gray-500">Current Mode</div>
                        <div className="mt-2 text-lg font-semibold text-white" style={{ color: modeMeta.color }}>{modeMeta.icon} {modeMeta.name}</div>
                      </div>
                    </div>
                    <div className="mt-4 rounded-lg border border-gray-700/50 bg-gray-950/50 p-4">
                      <p className="text-sm text-gray-300">{messages.length > 0 ? `The chamber has logged ${messages.length} messages in this session.` : 'No deliberation has started yet. Submit a motion from the Compose tab.'}</p>
                    </div>
                  </div>
                </div>
              )}
              {activeControlTab === 'specialists' && <SpecialistPanel onSpecialistClick={handleSpecialistClick} />}
            </div>
          </section>

          {/* Streaming Chat */}
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-700/50 bg-gray-900/30">
            <div className="flex flex-col gap-3 border-b border-gray-700/50 px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Streaming Council Chat</h2>
                <p className="text-sm text-gray-400">Councilor responses stream here in real time as the chamber deliberates.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-300">
                <span className="rounded-full border border-gray-700/70 bg-gray-900/80 px-3 py-1">{messages.length} total messages</span>
                <span className="rounded-full border border-gray-700/70 bg-gray-900/80 px-3 py-1">{councilorResponseCount} council responses</span>
              </div>
            </div>
            <div className="min-h-0 flex-1"><StreamingChat messages={messages} currentStreamingId={currentStreamingId} /></div>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="flex-shrink-0 border-t border-gray-700/50 bg-gray-900/50 px-4 py-2">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>🏛️ {DEFAULT_COUNCILORS.length} Councilors + 6 Specialists</span>
            <span>•</span><span>⚙️ {modeMeta.name} Mode</span>
            {messages.length > 0 && <><span>•</span><span>{councilorResponseCount} Responses</span></>}
          </div>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${gatewayStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span>{gatewayStatus === 'connected' ? 'Gateway Connected' : 'Gateway Disconnected'}</span>
            <span>•</span><span>Pretext Active — No DOM Reflow</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
