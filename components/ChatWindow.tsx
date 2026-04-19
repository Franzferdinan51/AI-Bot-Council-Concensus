/**
 * ChatWindow — AI Senate Command Center
 * Redesigned: command center with councilor status panel + live chamber
 */
import React, { useRef, useEffect, useState } from 'react';
import { Message, BotConfig, SessionMode, SessionStatus, AuthorType } from '../types';
import ChatMessage from './ChatMessage';
import MessageInput from './MessageInput';

interface ChatWindowProps {
  messages: Message[];
  activeBots: BotConfig[];
  thinkingBotIds: string[];
  onSendMessage: (content: string, attachments: any[], mode: SessionMode) => void;
  statusText: string;
  currentTopic: string | null;
  sessionStartedAt: number | null;
  sessionMode: SessionMode;
  onModeChange: (mode: SessionMode) => void;
  sessionStatus: SessionStatus;
  debateHeat: number;
  onClearSession: () => void;
  onStopSession: () => void;
  onPauseSession: () => void;
  onOpenLiveSession: () => void;
  onCouncilorClick: (id: string) => void;
  enableCodingMode?: boolean;
  settings?: any;
  onSettingsChange?: any;
  onToggleSettings?: () => void;
}

const MODES: { id: SessionMode; label: string; icon: string }[] = [
  { id: SessionMode.PROPOSAL, label: 'Proposal', icon: '📜' },
  { id: SessionMode.DELIBERATION, label: 'Deliberation', icon: '⚖️' },
  { id: SessionMode.INQUIRY, label: 'Inquiry', icon: '🔍' },
  { id: SessionMode.RESEARCH, label: 'Research', icon: '📊' },
  { id: SessionMode.SWARM, label: 'Swarm', icon: '🐝' },
  { id: SessionMode.SWARM_CODING, label: 'Swarm Code', icon: '⚡' },
  { id: SessionMode.PREDICTION, label: 'Prediction', icon: '🎯' },
  { id: SessionMode.GOVERNMENT, label: 'Legislature', icon: '🏛️' },
  { id: SessionMode.INSPECTOR, label: 'Inspector', icon: '🔬' },
];

const PHASE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  idle:       { label: 'AWAITING MOTION', color: '#94a3b8', bg: 'rgba(30,41,59,0.5)',  border: '#334155', dot: '#64748b' },
  opening:    { label: 'OPENING',         color: '#fbbf24', bg: 'rgba(120,53,15,0.4)', border: '#d97706', dot: '#fbbf24' },
  debating:   { label: 'IN SESSION',      color: '#22d3ee', bg: 'rgba(8,22,36,0.4)',  border: '#0891b2', dot: '#22d3ee' },
  reconciling:{ label: 'RECONCILING',    color: '#60a5fa', bg: 'rgba(28,48,86,0.4)', border: '#2563eb', dot: '#60a5fa' },
  voting:     { label: 'VOTING',          color: '#c084fc', bg: 'rgba(55,0,89,0.4)',  border: '#7c3aed', dot: '#c084fc' },
  resolving:  { label: 'RESOLVING',        color: '#34d399', bg: 'rgba(4,55,44,0.4)',  border: '#059669', dot: '#34d399' },
  enacting:   { label: 'ENACTING',         color: '#4ade80', bg: 'rgba(5,46,22,0.4)',  border: '#16a34a', dot: '#4ade80' },
  adjourned:  { label: 'ADJOURNED',        color: '#94a3b8', bg: 'rgba(30,41,59,0.5)',  border: '#334155', dot: '#64748b' },
  paused:     { label: 'PAUSED',           color: '#facc15', bg: 'rgba(50,46,0,0.4)',  border: '#ca8a04', dot: '#facc15' },
};

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

const BotColorMap: Record<string, string> = {
  '#3b82f6': '37,99,235',   // blue
  '#ef4444': '239,68,68',   // red
  '#22c55e': '34,197,94',   // green
  '#f59e0b': '245,158,11',  // amber
  '#a855f7': '168,85,247',  // purple
  '#06b6d4': '6,182,212',   // cyan
  '#ec4899': '236,72,153',  // pink
  '#f97316': '249,115,22',  // orange
};

function getRgb(color: string): string {
  return BotColorMap[color] || '100,116,139';
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages, activeBots, thinkingBotIds, onSendMessage, statusText, currentTopic,
  sessionStartedAt, sessionMode, onModeChange, sessionStatus, debateHeat,
  onClearSession, onStopSession, onPauseSession, onOpenLiveSession, onCouncilorClick,
  enableCodingMode, onToggleSettings
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [livePanelOpen, setLivePanelOpen] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (sessionStartedAt && sessionStatus !== SessionStatus.IDLE && sessionStatus !== SessionStatus.ADJOURNED) {
      const tick = () => setElapsedSeconds(Math.floor((Date.now() - sessionStartedAt) / 1000));
      tick();
      const id = setInterval(tick, 1000);
      return () => clearInterval(id);
    } else {
      setElapsedSeconds(0);
    }
  }, [sessionStartedAt, sessionStatus]);

  function formatElapsed(s: number) {
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    if (m < 60) return `${m}:${String(rem).padStart(2, '0')}`;
    const h = Math.floor(m / 60);
    return `${h}:${String(m % 60).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, thinkingBotIds]);

  const isSessionActive = thinkingBotIds.length > 0 || (sessionStatus !== SessionStatus.IDLE && sessionStatus !== SessionStatus.ADJOURNED);
  const isPaused = sessionStatus === SessionStatus.PAUSED;
  const phaseCfg = PHASE_CONFIG[sessionStatus] || PHASE_CONFIG.IDLE;
  const voteHistory = messages.filter(m => m.voteData);
  const speakingCouncilors = activeBots.filter(b => thinkingBotIds.includes(b.id));
  const heatLevel = Math.round((debateHeat + 1) * 2.5);

  const downloadTranscript = () => {
    let text = `# High AI Council - Official Record\n`;
    text += `Date: ${new Date().toLocaleString()}\nMode: ${sessionMode}\n`;
    if (currentTopic) text += `Topic: ${currentTopic}\n\n`;
    text += `---\n\n`;
    messages.forEach(msg => {
      if (msg.voteData) {
        text += `\n[VOTE TALLY]: ${msg.voteData.result} (Y: ${msg.voteData.yeas}, N: ${msg.voteData.nays})\n`;
        msg.voteData.votes.forEach(v => { text += `  - ${v.voter}: ${v.choice} (${v.reason})\n`; });
        text += `\n`;
      } else {
        const label = msg.roleLabel ? `[${msg.roleLabel}]` : '';
        text += `**${msg.author}** ${label}:\n${msg.content}\n\n`;
      }
    });
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `council-record-${Date.now()}.md`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 relative overflow-hidden">

      {/* ═══════════════ COMMAND BAR ═══════════════ */}
      <header className="shrink-0 bg-slate-900/95 border-b border-slate-700/50 z-30">
        <div className="flex items-center h-12 px-4 gap-3">

          {/* BRAND + LIVE BADGE */}
          <div className="flex items-center gap-2 shrink-0">
            <h1 className="font-serif text-sm font-bold text-amber-500 tracking-widest uppercase hidden md:block">
              High AI Council
            </h1>
            <div className="w-px h-5 bg-slate-700 hidden md:block" />
            <button
              onClick={() => setLivePanelOpen(v => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wider transition-all ${
                isSessionActive
                  ? 'bg-red-900/40 border-red-700/60 text-red-400'
                  : 'bg-slate-800 border-slate-700/50 text-slate-400 hover:border-slate-600'
              }`}
              style={isSessionActive ? { boxShadow: '0 0 8px rgba(239,68,68,0.3)' } : {}}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isSessionActive ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`} />
              {isSessionActive ? '🔴 LIVE' : 'LIVE'}
            </button>
          </div>

          {/* MODE TABS */}
          <div className="flex-1 flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
            {MODES.map(mode => {
              const isActive = sessionMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => onModeChange(mode.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-amber-900/40 text-amber-400 border border-amber-600/50'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  <span>{mode.icon}</span>
                  <span className="hidden lg:inline">{mode.label}</span>
                </button>
              );
            })}
          </div>

          {/* RIGHT CONTROLS */}
          <div className="flex items-center gap-1 shrink-0">
            {isSessionActive && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 rounded border border-slate-700/50">
                <span className="text-[10px] text-slate-500 uppercase font-bold">⏱</span>
                <span className="text-xs font-mono font-bold text-amber-400">{formatElapsed(elapsedSeconds)}</span>
              </div>
            )}
            {isSessionActive && (
              <div className="flex items-center gap-0.5">
                <button onClick={onPauseSession}
                  className={`p-1.5 rounded transition-colors ${isPaused ? 'bg-green-900/40 text-green-400 hover:bg-green-800' : 'bg-yellow-900/30 text-yellow-400 hover:bg-yellow-800/40'}`}
                  title={isPaused ? "Resume" : "Pause"}>
                  {isPaused
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  }
                </button>
                <button onClick={onStopSession} className="p-1.5 rounded bg-red-900/30 text-red-400 hover:bg-red-800/50 transition-colors" title="Stop">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>
                </button>
              </div>
            )}
            <button onClick={downloadTranscript} className="p-1.5 rounded text-slate-500 hover:text-emerald-400 hover:bg-slate-800 transition-colors" title="Export">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
            <button onClick={onToggleSettings} className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition-colors" title="Settings">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-4.44a2 2 0 0 0-2 2v.78a2 2 0 0 1-.59 1.4l-4.12 4.12a2 2 0 0 0 0 2.82l4.12 4.12a2 2 0 0 1 .59 1.4v.78a2 2 0 0 0 2 2h4.44a2 2 0 0 0 2-2v-.78a2 2 0 0 1 .59-1.4l4.12-4.12a2 2 0 0 0 0-2.82l-4.12-4.12a2 2 0 0 1-.59-1.4V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button onClick={() => setIsHistoryOpen(v => !v)} className={`p-1.5 rounded transition-colors ${isHistoryOpen ? 'text-amber-400 bg-slate-800' : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800'}`} title="Vote Record">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </button>
            <button onClick={onClearSession} className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-700/80 hover:bg-amber-600 text-white rounded text-[10px] font-bold uppercase tracking-wider transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span className="hidden sm:inline">New</span>
            </button>
          </div>
        </div>

        {/* SESSION STATUS STRIP */}
        {isSessionActive && (
          <div className="flex items-center gap-3 px-4 py-1.5 text-[10px] font-mono uppercase tracking-widest border-t"
            style={{ backgroundColor: phaseCfg.bg, color: phaseCfg.color, borderColor: `${phaseCfg.border}50` }}>
            <span className={`h-1.5 w-1.5 rounded-full ${isSessionActive && !isPaused ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: phaseCfg.dot }} />
            <span className="font-black">
              {isPaused ? '⏸ PAUSED' : sessionStatus === SessionStatus.VOTING ? '📊 VOTING IN PROGRESS' : phaseCfg.label}
            </span>
            <span style={{ color: '#475569' }}>•</span>
            <span className="text-slate-400 truncate max-w-xs">{currentTopic || 'No topic set'}</span>
            {speakingCouncilors.length > 0 && (
              <>
                <span style={{ color: '#475569' }}>•</span>
                <span className="text-cyan-400">{speakingCouncilors.map(b => b.name).join(', ')}</span>
              </>
            )}
            <span style={{ color: '#475569' }}>•</span>
            <span className="text-slate-400">{messages.length} msgs</span>
            {debateHeat !== 0 && (
              <>
                <span style={{ color: '#475569' }}>•</span>
                <span style={{ color: debateHeat > 0 ? '#fb923c' : '#60a5fa' }}>
                  {debateHeat > 0 ? '🔥' : '❄️'} {Math.abs(Math.round(debateHeat * 100))}%
                </span>
              </>
            )}
            {isPaused && (
              <button onClick={onPauseSession} className="ml-auto text-yellow-400 hover:text-yellow-300 underline text-[9px] uppercase font-bold">Resume →</button>
            )}
          </div>
        )}
      </header>

      {/* ═══════════════ MAIN 3-COLUMN GRID ═══════════════ */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── LEFT: Councilor Status Panel ── */}
        <div className="w-48 lg:w-56 shrink-0 bg-slate-900/50 border-r border-slate-800/50 overflow-y-auto">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Council</h2>
              <span className="text-[10px] text-amber-600 font-mono font-bold">{activeBots.length}</span>
            </div>

            <div className="space-y-1.5">
              {activeBots.map(bot => {
                const isThinking = thinkingBotIds.includes(bot.id);
                const rgb = getRgb(bot.color);
                return (
                  <button
                    key={bot.id}
                    onClick={() => onCouncilorClick(bot.id)}
                    className="w-full text-left p-2 rounded-lg border transition-all duration-200 group"
                    style={{
                      backgroundColor: isThinking ? `rgba(${rgb},0.12)` : 'rgba(30,41,59,0.4)',
                      borderColor: isThinking ? `rgba(${rgb},0.5)` : 'rgba(51,65,85,0.5)',
                      boxShadow: isThinking ? `0 0 8px rgba(${rgb},0.2)` : 'none',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative shrink-0">
                        <div style={{ backgroundColor: isThinking ? `rgb(${rgb})` : '#475569', boxShadow: isThinking ? `0 0 6px rgba(${rgb},0.8)` : 'none' }}
                          className={`w-2.5 h-2.5 rounded-full ${isThinking ? 'animate-pulse' : ''}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold text-slate-200 truncate group-hover:text-white transition-colors">{bot.name}</div>
                        <div className="text-[9px] text-slate-500 capitalize truncate">{bot.role}</div>
                      </div>
                    </div>
                    {isThinking && (
                      <div className="mt-1.5 flex items-center gap-1">
                        <div className="h-0.5 flex-1 bg-slate-700 rounded overflow-hidden">
                          <div className="h-full rounded animate-pulse" style={{ width: '60%', backgroundColor: `rgb(${rgb})` }} />
                        </div>
                        <span className="text-[8px] font-bold uppercase tracking-wider animate-pulse" style={{ color: `rgb(${rgb})` }}>...</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Consensus meter */}
            <div className="mt-4 p-2.5 rounded-lg border" style={{ backgroundColor: 'rgba(30,41,59,0.4)', borderColor: 'rgba(51,65,85,0.5)' }}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Consensus</span>
                <span className="text-[10px] font-mono font-bold" style={{ color: '#34d399' }}>70%</span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded overflow-hidden">
                <div className="h-full rounded transition-all duration-500" style={{ width: '70%', background: 'linear-gradient(to right, #059669, #34d399)' }} />
              </div>
            </div>

            {/* Heat meter */}
            <div className="mt-2 p-2.5 rounded-lg border" style={{ backgroundColor: 'rgba(30,41,59,0.4)', borderColor: 'rgba(51,65,85,0.5)' }}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Debate Heat</span>
                <span className="text-[10px] font-mono font-bold"
                  style={{ color: debateHeat > 0 ? '#fb923c' : debateHeat < 0 ? '#60a5fa' : '#94a3b8' }}>
                  {debateHeat > 0 ? '🔥' : debateHeat < 0 ? '❄️' : '—'} {Math.abs(Math.round(debateHeat * 100))}%
                </span>
              </div>
              <div className="flex gap-0.5">
                {[0,1,2,3,4].map(i => (
                  <div key={i} className="h-1.5 flex-1 rounded-sm transition-colors"
                    style={{ backgroundColor: i < heatLevel ? (debateHeat > 0 ? '#f97316' : '#3b82f6') : '#334155' }} />
                ))}
              </div>
            </div>

            {/* Quick stats grid */}
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <div className="p-2 rounded-lg border text-center" style={{ backgroundColor: 'rgba(30,41,59,0.4)', borderColor: 'rgba(51,65,85,0.5)' }}>
                <div className="text-sm font-black text-white">{messages.length}</div>
                <div className="text-[8px] text-slate-500 uppercase tracking-wider">Messages</div>
              </div>
              <div className="p-2 rounded-lg border text-center" style={{ backgroundColor: 'rgba(30,41,59,0.4)', borderColor: 'rgba(51,65,85,0.5)' }}>
                <div className="text-sm font-black text-white">{formatElapsed(elapsedSeconds)}</div>
                <div className="text-[8px] text-slate-500 uppercase tracking-wider">Elapsed</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CENTER: Message Stream ── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.map(msg => (
                <ChatMessage key={msg.id} message={msg} />
              ))}

              {/* Thinking indicator */}
              {thinkingBotIds.length > 0 && (
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="flex items-center gap-2 text-slate-500">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs font-serif italic">
                      {speakingCouncilors.length > 1
                        ? `${speakingCouncilors.map(b => b.name).join(' & ')} are deliberating...`
                        : `${speakingCouncilors[0]?.name || 'The Council'} is deliberating...`}
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* INPUT BAR */}
          <div className="shrink-0 border-t border-slate-800/50 bg-slate-900/80">
            <MessageInput
              onSendMessage={onSendMessage}
              isLoading={isSessionActive && !isPaused}
              statusText={statusText}
              enableCodingMode={enableCodingMode}
              currentMode={sessionMode}
              onModeChange={onModeChange}
            />
          </div>
        </div>

        {/* ── RIGHT: Live Chamber Panel ── */}
        {livePanelOpen && (
          <div className="w-72 xl:w-80 shrink-0 bg-slate-900/50 border-l border-slate-800/50 overflow-y-auto">
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-amber-500">📡 Live Chamber</h2>
                <button onClick={() => setLivePanelOpen(false)} className="text-slate-600 hover:text-slate-400 text-xs transition-colors">✕</button>
              </div>

              {/* Phase indicator */}
              <div className="p-2.5 rounded-lg border mb-3" style={{ backgroundColor: phaseCfg.bg, borderColor: `${phaseCfg.border}80`, color: phaseCfg.color }}>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${isSessionActive && !isPaused ? 'animate-pulse' : ''}`} style={{ backgroundColor: phaseCfg.dot }} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {isPaused ? '⏸ PAUSED' : phaseCfg.label}
                  </span>
                </div>
                {currentTopic && (
                  <p className="mt-1 text-[9px] opacity-70 truncate pl-4">{currentTopic}</p>
                )}
              </div>

              {/* Currently speaking */}
              <div className="mb-3">
                <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Speaking Now</h3>
                {speakingCouncilors.length === 0 ? (
                  <p className="text-[10px] text-slate-600 italic">No one speaking</p>
                ) : (
                  <div className="space-y-1">
                    {speakingCouncilors.map(bot => {
                      const rgb = getRgb(bot.color);
                      return (
                        <div key={bot.id} className="flex items-center gap-2 p-1.5 rounded border"
                          style={{ backgroundColor: `rgba(${rgb},0.08)`, borderColor: `rgba(${rgb},0.3)` }}>
                          <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: `rgb(${rgb})` }} />
                          <span className="text-[11px] font-bold truncate" style={{ color: `rgb(${rgb})` }}>{bot.name}</span>
                          <span className="ml-auto text-[9px] animate-pulse" style={{ color: `rgba(${rgb},0.6)` }}>typing...</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent messages feed */}
              <div className="mb-3">
                <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Recent</h3>
                <div className="space-y-0.5">
                  {messages.slice(-8).reverse().map(msg => (
                    <div key={msg.id} className="flex items-start gap-1.5 py-1 border-b border-slate-800/30 last:border-0">
                      <span className="text-[9px] font-bold text-amber-600 shrink-0 mt-0.5">{msg.author.charAt(0)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-bold text-slate-300 truncate">{msg.author}</span>
                          {thinkingBotIds.includes(msg.authorId || '') && (
                            <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse shrink-0" />
                          )}
                        </div>
                        <p className="text-[9px] text-slate-500 truncate">{msg.content.replace(/[*_`#]/g, '')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vote summary */}
              {voteHistory.length > 0 && (
                <div className="mb-3">
                  <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Votes</h3>
                  <div className="space-y-1">
                    {voteHistory.slice(-3).reverse().map((msg, i) => {
                      if (!msg.voteData) return null;
                      const v = msg.voteData;
                      return (
                        <div key={i} className="p-2 rounded border" style={{ backgroundColor: 'rgba(30,41,59,0.4)', borderColor: 'rgba(51,65,85,0.5)' }}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-bold text-slate-400 truncate">{msg.author}</span>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                              v.result === 'PASSED' ? 'bg-green-900/50 text-green-400' :
                              v.result === 'REJECTED' ? 'bg-red-900/50 text-red-400' :
                              'bg-amber-900/50 text-amber-400'
                            }`}>{v.result}</span>
                          </div>
                          <div className="flex gap-3 text-[9px]">
                            <span className="text-green-400">✓ {v.yeas}</span>
                            <span className="text-red-400">✗ {v.nays}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Full-screen live button */}
              <button
                onClick={onOpenLiveSession}
                className={`w-full py-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all ${
                  isSessionActive
                    ? 'bg-red-900/40 border-red-700/50 text-red-400'
                    : 'bg-slate-800 border-slate-700/50 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {isSessionActive ? '📡 Open Full Live View' : '📡 Live Chamber'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Vote History Sidebar ── */}

      {/* ── Vote History Sidebar ── */}
      {isHistoryOpen && (
        <div className="absolute top-0 right-0 h-full w-80 bg-slate-900 shadow-2xl transform transition-transform z-40 border-l border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-700 flex justify-between items-center">
            <h2 className="text-amber-500 font-serif font-bold uppercase tracking-wider text-sm">Legislative Record</h2>
            <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-white px-2 py-1 text-xs transition-colors">✕ Close</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {voteHistory.length === 0 ? (
              <p className="text-slate-500 text-xs italic text-center mt-10">No motions recorded yet.</p>
            ) : (
              voteHistory.map((msg, idx) => (
                <div key={idx} className="p-3 rounded-lg border relative overflow-hidden" style={{ backgroundColor: 'rgba(30,41,59,0.6)', borderColor: 'rgba(51,65,85,0.8)' }}>
                  <div className="absolute top-0 left-0 w-1 h-full rounded-l" style={{ backgroundColor: msg.voteData?.result === 'PASSED' ? '#22c55e' : '#ef4444' }} />
                  <h3 className="text-white text-xs font-bold mb-1 pl-2 truncate">{msg.voteData?.topic || msg.author}</h3>
                  <div className="flex justify-between items-center pl-2">
                    <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                      msg.voteData?.result === 'PASSED' ? 'bg-green-900/50 text-green-400' :
                      msg.voteData?.result === 'REJECTED' ? 'bg-red-900/50 text-red-400' :
                      'bg-amber-900/50 text-amber-400'
                    }`}>{msg.voteData?.result}</span>
                    <span className="text-slate-400 font-mono text-[10px]">Y:{msg.voteData?.yeas} / N:{msg.voteData?.nays}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowShortcuts(false)}>
          <div className="bg-slate-900 border border-amber-600/50 rounded-xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-amber-500 font-serif font-bold uppercase tracking-wider">Keyboard Shortcuts</h2>
              <button onClick={() => setShowShortcuts(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-300">Send Message</span><span className="bg-slate-800 px-2 py-1 rounded text-slate-400 font-mono text-xs">Ctrl + Enter</span></div>
              <div className="flex justify-between"><span className="text-slate-300">Close Settings</span><span className="bg-slate-800 px-2 py-1 rounded text-slate-400 font-mono text-xs">Esc</span></div>
              <div className="flex justify-between"><span className="text-slate-300">Toggle Live Panel</span><span className="bg-slate-800 px-2 py-1 rounded text-slate-400 font-mono text-xs">Alt + L</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
