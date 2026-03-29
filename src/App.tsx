import { useState, useEffect } from 'react';
import { useCouncil } from './hooks/useCouncil';
import { CouncilorGrid } from './components/council/CouncilorGrid';
import { DeliberationChat } from './components/council/DeliberationChat';
import { MotionInput } from './components/council/MotionInput';
import { ConsensusMeter } from './components/council/ConsensusMeter';
import { ModeSelector } from './components/council/ModeSelector';
import type { DeliberationMode } from './types';

function App() {
  const {
    councilors,
    messages,
    mode,
    consensus,
    isDeliberating,
    motion,
    activeCouncilors,
    setMode,
    toggleCouncilor,
    submitMotion,
    startDeliberation,
    clearDeliberation,
    exportTranscript,
  } = useCouncil();

  const [gatewayStatus, setGatewayStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Check gateway status
  useEffect(() => {
    const checkGateway = async () => {
      try {
        const res = await fetch('http://localhost:18789/health', { method: 'GET' });
        setGatewayStatus(res.ok ? 'connected' : 'disconnected');
      } catch {
        setGatewayStatus('disconnected');
      }
    };
    checkGateway();
    const interval = setInterval(checkGateway, 30000);
    return () => clearInterval(interval);
  }, []);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleExport = () => {
    exportTranscript();
  };

  return (
    <div className="h-full h-[100dvh] flex flex-col bg-[#0a0c10] text-white font-sans overflow-hidden">
      {/* ═══ HEADER ═══ */}
      <header className="flex-none bg-[#0a0c10] border-b border-slate-800/80">
        <div className="px-4 py-3 flex items-center justify-between">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <span className="text-lg">☰</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏛️</span>
              <div>
                <h1 className="text-lg font-bold text-amber-500 leading-tight">AI Council Chamber</h1>
                <div className="text-[10px] text-slate-500">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {' '}
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>

          {/* Center: Gateway status */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${
              gatewayStatus === 'connected' 
                ? 'bg-green-500/15 text-green-400' 
                : gatewayStatus === 'checking'
                ? 'bg-yellow-500/15 text-yellow-400'
                : 'bg-red-500/15 text-red-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                gatewayStatus === 'connected' 
                  ? 'bg-green-400 animate-pulse' 
                  : gatewayStatus === 'checking'
                  ? 'bg-yellow-400 animate-pulse'
                  : 'bg-red-400'
              }`} />
              {gatewayStatus === 'connected' ? 'Gateway' : gatewayStatus === 'checking' ? '...' : 'Offline'}
            </div>
            
            <div className="h-4 w-px bg-slate-700 mx-1" />
            
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-blue-500/15 text-blue-400">
              <span>💻</span>
              <span>OpenClaw</span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={handleExport}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors flex items-center gap-1.5"
                title="Export transcript"
              >
                📥 Export
              </button>
            )}
            <div className="relative">
              <button className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
                <span className="text-lg">⚙️</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1 flex overflow-hidden">
        {/* ─── LEFT SIDEBAR ─── */}
        <aside className={`
          ${sidebarOpen ? 'w-80' : 'w-0'} 
          flex-none transition-all duration-300 overflow-hidden
          bg-[#0a0c10] border-r border-slate-800/80
          flex flex-col gap-3 p-3
        `}>
          {/* Mode Selector */}
          <ModeSelector 
            mode={mode} 
            onChange={(m) => setMode(m as DeliberationMode)} 
            disabled={isDeliberating}
          />

          {/* Councilor Roster */}
          <div className="flex-1 overflow-hidden">
            <CouncilorGrid
              councilors={councilors}
              selectedIds={activeCouncilors}
              onToggle={toggleCouncilor}
            />
          </div>

          {/* Consensus Meter */}
          <ConsensusMeter 
            consensus={consensus} 
            isDeliberating={isDeliberating} 
          />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-800/60 rounded-lg p-2">
              <div className="text-lg font-bold text-amber-400">{councilors.length}</div>
              <div className="text-[10px] text-slate-500 uppercase">Council</div>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-2">
              <div className="text-lg font-bold text-cyan-400">{activeCouncilors.length}</div>
              <div className="text-[10px] text-slate-500 uppercase">Seated</div>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-2">
              <div className="text-lg font-bold text-green-400">{messages.filter(m => m.role === 'councilor').length}</div>
              <div className="text-[10px] text-slate-500 uppercase">Spoken</div>
            </div>
          </div>
        </aside>

        {/* ─── MAIN PANEL ─── */}
        <section className="flex-1 flex flex-col overflow-hidden p-3 gap-3">
          {/* Motion Input */}
          <div className="flex-none">
            <MotionInput
              mode={mode}
              onSubmit={submitMotion}
              onStart={startDeliberation}
              onClear={clearDeliberation}
              hasMotion={!!motion}
              isDeliberating={isDeliberating}
              activeCount={activeCouncilors.length}
            />
          </div>

          {/* Deliberation Chat */}
          <DeliberationChat 
            messages={messages} 
            isDeliberating={isDeliberating} 
          />
        </section>

        {/* ─── RIGHT SIDEBAR (Current Motion + Speakers) ─── */}
        {sidebarOpen && (
          <aside className="w-64 flex-none bg-[#0a0c10] border-l border-slate-800/80 p-3 overflow-y-auto hide-scrollbar">
            {/* Current Motion */}
            {motion && (
              <div className="mb-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  📋 Current Motion
                </h3>
                <div className="bg-slate-800/60 rounded-xl p-3 border border-amber-500/30">
                  <div className="text-sm text-amber-300 italic">"{motion}"</div>
                </div>
              </div>
            )}

            {/* Speaking Now */}
            <div className="mb-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                🗣️ Speaking
              </h3>
              <div className="space-y-2">
                {councilors.filter(c => c.speaking).map(c => (
                  <div 
                    key={c.id}
                    className="bg-slate-800/60 rounded-lg p-2 border-l-2"
                    style={{ borderColor: c.color }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{c.emoji}</span>
                      <div>
                        <div className="text-xs font-bold" style={{ color: c.color }}>{c.name}</div>
                        <div className="text-[10px] text-slate-500">{c.role}</div>
                      </div>
                    </div>
                    <div className="mt-1.5 h-1 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full animate-pulse"
                        style={{ width: '60%', backgroundColor: c.color }}
                      />
                    </div>
                  </div>
                ))}
                {councilors.filter(c => c.speaking).length === 0 && (
                  <div className="text-xs text-slate-600 text-center py-4">
                    {isDeliberating ? 'Waiting for next speaker...' : 'No one speaking'}
                  </div>
                )}
              </div>
            </div>

            {/* Queue */}
            <div className="mb-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                📜 Council Roster
              </h3>
              <div className="space-y-1">
                {councilors
                  .filter(c => activeCouncilors.includes(c.id))
                  .slice(0, 12)
                  .map((c, i) => (
                    <div 
                      key={c.id}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${c.speaking ? 'bg-slate-700/80' : 'hover:bg-slate-800/60'}`}
                    >
                      <span className="text-sm w-6 text-center">{i + 1}</span>
                      <span className="text-base">{c.emoji}</span>
                      <span className="text-xs text-slate-300 truncate flex-1">{c.name}</span>
                      {c.speaking && <span className="text-amber-400 text-xs">●</span>}
                    </div>
                  ))}
              </div>
              {activeCouncilors.length > 12 && (
                <div className="text-[10px] text-slate-600 text-center mt-1">
                  +{activeCouncilors.length - 12} more
                </div>
              )}
            </div>

            {/* Session Info */}
            <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                📊 Session Stats
              </h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mode</span>
                  <span className="text-slate-300 capitalize">{mode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Messages</span>
                  <span className="text-slate-300">{messages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Councilors</span>
                  <span className="text-slate-300">{activeCouncilors.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Consensus</span>
                  <span style={{ color: consensus >= 50 ? '#22c55e' : '#ef4444' }}>{consensus}%</span>
                </div>
              </div>
            </div>
          </aside>
        )}
      </main>

      {/* ═══ STATUS BAR ═══ */}
      <footer className="flex-none bg-[#0a0c10] border-t border-slate-800/80 px-4 py-1.5">
        <div className="flex items-center justify-between text-[10px] text-slate-600">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="text-amber-500">🏛️</span>
              AI Council Chamber v2.0
            </span>
            <span>|</span>
            <span>Routing via OpenClaw Gateway</span>
          </div>
          <div className="flex items-center gap-4">
            <span>ws://localhost:18789</span>
            <span className={gatewayStatus === 'connected' ? 'text-green-500' : 'text-red-500'}>
              {gatewayStatus.toUpperCase()}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
