
import React, { useRef, useEffect, useState } from 'react';
import { Message, BotConfig, SessionMode, SessionStatus, AuthorType } from '../types';
import ChatMessage from './ChatMessage';
import MessageInput from './MessageInput';
import CouncilorDeck from './CouncilorDeck';

interface ChatWindowProps {
  messages: Message[];
  activeBots: BotConfig[]; // All enabled bots
  thinkingBotIds: string[]; // IDs of the bots currently processing
  onSendMessage: (content: string, attachments: any[], mode: SessionMode) => void;
  statusText: string;
  currentTopic: string | null;
  sessionMode: SessionMode;
  onModeChange: (mode: SessionMode) => void;
  sessionStatus: SessionStatus;
  debateHeat: number; // -1 (Hostile) to 1 (Peaceful)
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

const ChatWindow: React.FC<ChatWindowProps> = ({ 
    messages, activeBots, thinkingBotIds, onSendMessage, statusText, currentTopic, sessionMode, onModeChange, sessionStatus, 
    debateHeat, onClearSession, onStopSession, onPauseSession, onOpenLiveSession, onCouncilorClick, enableCodingMode,
    onToggleSettings
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showShortcuts, setShowShortcuts] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, thinkingBotIds, viewMode]);
  
  const isSessionActive = thinkingBotIds.length > 0 || sessionStatus !== SessionStatus.IDLE && sessionStatus !== SessionStatus.ADJOURNED;
  const isPaused = sessionStatus === SessionStatus.PAUSED;
  const voteHistory = messages.filter(m => m.voteData);

  const getModeColor = (mode: SessionMode) => {
       switch(mode) {
          case 'proposal': return "text-amber-500";
          case 'deliberation': return "text-purple-500";
          case 'inquiry': return "text-cyan-500";
          case 'research': return "text-emerald-500";
          case 'swarm': return "text-orange-500";
          case 'swarm_coding': return "text-pink-500";
          default: return "text-slate-500";
      }
  };

  const downloadTranscript = () => {
      let text = `# High AI Council - Official Record\n`;
      text += `Date: ${new Date().toLocaleString()}\n`;
      text += `Mode: ${sessionMode}\n`;
      if (currentTopic) text += `Topic: ${currentTopic}\n\n`;
      text += `---\n\n`;

      messages.forEach(msg => {
          if (msg.voteData) {
              text += `\n[VOTE TALLY]: ${msg.voteData.result} (Y: ${msg.voteData.yeas}, N: ${msg.voteData.nays})\n`;
              msg.voteData.votes.forEach(v => {
                  text += `  - ${v.voter}: ${v.choice} (${v.reason})\n`;
              });
              text += `\n`;
          } else {
              const label = msg.roleLabel ? `[${msg.roleLabel}]` : '';
              text += `**${msg.author}** ${label}:\n${msg.content}\n\n`;
          }
      });

      const blob = new Blob([text], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `council-record-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 relative overflow-y-auto">
        {/* Background Overlay */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')]"></div>
        
        {/* IMMERSIVE HEADER: Padding applied directly to header to cover notch */}
        <header className="bg-slate-900 border-b border-amber-900/50 shadow-lg z-20 shrink-0 relative transition-all duration-300 pt-[env(safe-area-inset-top)]">
            <div className="flex items-center justify-between px-2 md:px-4 h-14 md:h-16 w-full max-w-7xl mx-auto">
                
                {/* LEFT */}
                <div className="flex items-center justify-start gap-2 w-24 md:w-40 shrink-0">
                     <button 
                        onClick={onOpenLiveSession}
                        className="flex items-center gap-1.5 bg-slate-800 border border-amber-900/50 hover:border-amber-500 text-amber-500 px-2 md:px-3 py-1.5 rounded shadow-sm transition-all hover:scale-105 active:scale-95 group"
                        title="Live Audience"
                     >
                         <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 group-hover:bg-amber-400"></span>
                        </span>
                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest hidden sm:inline">Live</span>
                     </button>
    
                    <button 
                        onClick={downloadTranscript}
                        title="Export Record"
                        className="hidden md:flex text-slate-400 hover:text-emerald-400 transition-colors items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 py-1.5 rounded hover:bg-slate-800"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </button>
                    
                    {/* View Toggle */}
                    <div className="flex bg-slate-800 rounded p-0.5 border border-slate-700 ml-2">
                         <button 
                            onClick={() => setViewMode('list')}
                            className={`p-1 rounded ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}
                            title="List View"
                         >
                             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                         </button>
                         <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-1 rounded ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}
                            title="Grid View"
                         >
                             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                         </button>
                    </div>
                </div>
    
                {/* CENTER */}
                <div className="flex-1 flex flex-col items-center justify-center min-w-0 px-2 text-center">
                    <div className="flex items-center justify-center gap-2 w-full">
                         <h1 className={`${getModeColor(sessionMode)} hidden sm:block font-serif text-sm md:text-lg font-bold tracking-widest uppercase whitespace-nowrap`}>High AI Council <span className="text-[8px] bg-amber-600 text-white px-1.5 py-0.5 rounded ml-2">v3.0</span></h1>
                         
                         {isSessionActive && (
                            <div className="flex items-center gap-1 ml-0 sm:ml-2 sm:border-l border-slate-700 sm:pl-2">
                                <button onClick={onPauseSession} title={isPaused ? "Resume" : "Pause"} className={`p-1 rounded hover:bg-slate-800 transition-colors ${isPaused ? 'text-green-400' : 'text-yellow-400'}`}>
                                    {isPaused ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>}
                                </button>
                                <button onClick={onStopSession} title="Stop Session" className="p-1 text-red-400 hover:text-red-300 hover:bg-slate-800 rounded transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>
                                </button>
                            </div>
                        )}
                    </div>
    
                    <div className="flex items-center justify-center w-full max-w-[240px] md:max-w-md gap-2 mt-0.5">
                        <p className="text-slate-400 text-[10px] md:text-xs font-mono truncate text-center opacity-90 w-full">
                            {currentTopic ? currentTopic : statusText}
                        </p>
                    </div>
                </div>
    
                {/* RIGHT */}
                <div className="flex items-center justify-end gap-2 w-24 md:w-40 shrink-0">
                     <button 
                        onClick={onClearSession}
                        title="Start New Session"
                        className="bg-amber-700 hover:bg-amber-600 text-white shadow-md transition-colors flex items-center justify-center gap-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider px-2 md:px-3 py-1.5 rounded whitespace-nowrap"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        <span className="hidden sm:inline">New</span>
                    </button>
                    
                    {/* SETTINGS TOGGLE */}
                    <button 
                        onClick={onToggleSettings}
                        title="Settings"
                        className="bg-slate-800 text-slate-400 hover:text-white transition-colors flex items-center justify-center p-2 rounded hover:bg-slate-700"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-4.44a2 2 0 0 0-2 2v.78a2 2 0 0 1-.59 1.4l-4.12 4.12a2 2 0 0 0 0 2.82l4.12 4.12a2 2 0 0 1 .59 1.4v.78a2 2 0 0 0 2 2h4.44a2 2 0 0 0 2-2v-.78a2 2 0 0 1 .59-1.4l4.12-4.12a2 2 0 0 0 0-2.82l-4.12-4.12a2 2 0 0 1-.59-1.4V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>

                    {/* KEYBOARD SHORTCUTS */}
                    <button 
                        onClick={() => setShowShortcuts(!showShortcuts)}
                        title="Keyboard Shortcuts"
                        className="bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors flex items-center justify-center p-2 rounded hover:bg-slate-700"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M8 12h.001M12 12h.001M16 12h.001M7 16h10"/></svg>
                    </button>

                    {/* SOUND TOGGLE */}
                    <button 
                        title="Toggle Sound"
                        className="bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors flex items-center justify-center p-2 rounded hover:bg-slate-700"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                    </button>

                    <button 
                        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        className="text-slate-400 hover:text-amber-400 transition-colors flex items-center justify-center p-1.5 rounded hover:bg-slate-800"
                        title="Legislative Record"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    </button>
                </div>
            </div>
        </header>
        
        {/* Visual Deck of Councilors */}
        <CouncilorDeck councilors={activeBots} activeBotIds={thinkingBotIds} onCouncilorClick={onCouncilorClick} />

        {/* Quick Actions Toolbar */}
        <div className="bg-slate-900/80 border-b border-slate-800 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Quick:</span>
                <button onClick={onClearSession} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition-colors">+ New</button>
                <button onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition-colors">
                    {viewMode === 'list' ? '▦ Grid' : '☰ List'}
                </button>
                <button onClick={onOpenLiveSession} className="text-xs bg-amber-900/50 hover:bg-amber-800 text-amber-400 px-2 py-1 rounded transition-colors">📡 Live</button>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-amber-600">💡 Tip: Click a councilor for private consultation</span>
            </div>
        </div>

      <div className="flex-1 overflow-y-auto p-2 md:p-8 relative z-0 min-h-0 bg-slate-950/50">
        <div className={`mx-auto pb-4 ${viewMode === 'grid' ? 'max-w-7xl' : 'max-w-5xl'}`}>
          {viewMode === 'list' ? (
              // LIST VIEW
              <>
                  {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                  ))}
              </>
          ) : (
              // GRID VIEW
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
                  {messages.map((msg) => (
                      <div key={msg.id} className={`${(msg.authorType === AuthorType.HUMAN || msg.authorType === AuthorType.SYSTEM) ? 'col-span-full' : 'col-span-1'}`}>
                          <ChatMessage message={msg} />
                      </div>
                  ))}
              </div>
          )}
          
          {thinkingBotIds.length > 0 && (
             <div className="flex flex-col items-center justify-center my-8 animate-pulse">
                 <div className="text-slate-500 font-serif text-xs md:text-sm italic">
                    {thinkingBotIds.length > 1 ? "Councilors are deliberating..." : "The Council is deliberating..."}
                 </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* PAUSED OVERLAY */}
      {isPaused && (
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-20 flex items-center justify-center pointer-events-none">
              <div className="bg-slate-900 border border-amber-500/50 px-6 py-4 rounded shadow-2xl flex items-center gap-4 pointer-events-auto mx-4">
                  <span className="text-amber-500 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  </span>
                  <div>
                      <h3 className="text-white font-serif font-bold uppercase tracking-widest text-sm md:text-base">Session Paused</h3>
                      <p className="text-slate-400 text-xs hidden md:block">The Council is waiting. Click play to resume.</p>
                  </div>
                  <button onClick={onPauseSession} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded font-bold uppercase text-xs transition-colors">Resume</button>
              </div>
          </div>
      )}

      {/* Legislative Record Sidebar */}
      <div className={`absolute top-0 right-0 h-full w-full md:w-80 bg-slate-900 shadow-2xl transform transition-transform duration-300 z-30 border-l border-slate-700 ${isHistoryOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          {/* Sidebar Header: safe-area padding applied here */}
          <div className="bg-slate-900 border-b border-slate-700 pt-[env(safe-area-inset-top)]">
              <div className="p-4 flex justify-between items-center h-14 md:h-16">
                  <h2 className="text-amber-500 font-serif font-bold uppercase tracking-wider text-sm">Legislative Record</h2>
                  <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-white px-2 py-1">✕ Close</button>
              </div>
          </div>
          <div className="p-4 overflow-y-auto h-full space-y-4 pb-20">
              {voteHistory.length === 0 ? (
                  <p className="text-slate-500 text-xs italic text-center mt-10">No motions recorded yet.</p>
              ) : (
                  voteHistory.map((msg, idx) => (
                      <div key={idx} className="bg-slate-800 p-3 rounded border border-slate-700 relative overflow-hidden shadow-lg">
                           <div className={`absolute top-0 left-0 w-1 h-full ${msg.voteData?.result === 'PASSED' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                           <h3 className="text-white text-xs font-bold mb-1 pl-2 truncate">{msg.voteData?.topic || "Unknown Motion"}</h3>
                           <div className="flex justify-between items-center pl-2">
                               <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${msg.voteData?.result === 'PASSED' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                                   {msg.voteData?.result}
                               </span>
                               <span className="text-slate-400 font-mono text-[10px]">
                                   Y:{msg.voteData?.yeas} / N:{msg.voteData?.nays}
                               </span>
                           </div>
                      </div>
                  ))
              )}
          </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowShortcuts(false)}>
              <div className="bg-slate-900 border border-amber-600/50 rounded-xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-amber-500 font-serif font-bold uppercase tracking-wider">Keyboard Shortcuts</h2>
                      <button onClick={() => setShowShortcuts(false)} className="text-slate-400 hover:text-white">✕</button>
                  </div>
                  <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                          <span className="text-slate-300">Send Message</span>
                          <span className="bg-slate-800 px-2 py-1 rounded text-slate-400 font-mono text-xs">Ctrl + Enter</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-slate-300">Close Settings</span>
                          <span className="bg-slate-800 px-2 py-1 rounded text-slate-400 font-mono text-xs">Esc</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-slate-300">Toggle History</span>
                          <span className="bg-slate-800 px-2 py-1 rounded text-slate-400 font-mono text-xs">Alt + H</span>
                      </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-700">
                      <p className="text-slate-500 text-xs">More shortcuts coming soon!</p>
                  </div>
              </div>
          </div>
      )}

      {/* Model Routing Status */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Routing:</span>
          <span className="text-xs text-amber-400 font-mono">Auto-detect</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Consensus:</span>
          <span className="text-xs text-emerald-400 font-mono">70%</span>
        </div>
      </div>

      <MessageInput 
        onSendMessage={onSendMessage} 
        isLoading={isSessionActive && !isPaused} 
        statusText={statusText}
        enableCodingMode={enableCodingMode}
        currentMode={sessionMode}
        onModeChange={onModeChange}
      />
    </div>
  );
};

export default ChatWindow;
