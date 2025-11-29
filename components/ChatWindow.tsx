
import React, { useRef, useEffect, useState } from 'react';
import { Message, BotConfig, SessionMode, SessionStatus } from '../types';
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
  sessionStatus: SessionStatus;
  onClearSession: () => void;
  onStopSession: () => void;
  onPauseSession: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
    messages, activeBots, thinkingBotIds, onSendMessage, statusText, currentTopic, sessionMode, sessionStatus, 
    onClearSession, onStopSession, onPauseSession 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, thinkingBotIds]);
  
  const isSessionActive = thinkingBotIds.length > 0 || sessionStatus !== SessionStatus.IDLE && sessionStatus !== SessionStatus.ADJOURNED;
  const isPaused = sessionStatus === SessionStatus.PAUSED;
  const voteHistory = messages.filter(m => m.voteData);

  const getModeLabel = (mode: SessionMode) => {
      switch(mode) {
          case 'proposal': return "Legislative Session";
          case 'deliberation': return "Deliberation";
          case 'inquiry': return "Council Inquiry";
          case 'research': return "Deep Research";
          case 'swarm': return "Swarm Hive";
          default: return "Council Session";
      }
  };

  const getModeColor = (mode: SessionMode) => {
       switch(mode) {
          case 'proposal': return "text-amber-500";
          case 'deliberation': return "text-purple-500";
          case 'inquiry': return "text-cyan-500";
          case 'research': return "text-emerald-500";
          case 'swarm': return "text-orange-500";
          default: return "text-slate-500";
      }
  };

  const downloadTranscript = () => {
      let text = `# High AI Council - Official Record\n`;
      text += `Date: ${new Date().toLocaleString()}\n`;
      text += `Mode: ${getModeLabel(sessionMode)}\n`;
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
    <div className="flex flex-col h-full bg-slate-950 relative overflow-hidden">
        {/* Background Overlay for texture */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')]"></div>
        
        {/* Council Header - Responsive Layout */}
        <div className="bg-slate-900 border-b border-amber-900/50 p-2 shadow-lg z-10 flex flex-wrap md:flex-nowrap justify-between items-center gap-2">
            
            {/* Left Controls */}
            <div className="flex items-center gap-2 order-2 md:order-1 flex-1 md:flex-none justify-start">
                <button 
                    onClick={downloadTranscript}
                    title="Download Official Record"
                    className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded hover:bg-slate-800"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    <span className="hidden sm:inline">Export</span>
                </button>
            </div>

            {/* Center Title & Status */}
            <div className="flex flex-col items-center flex-1 order-1 md:order-2 min-w-[200px] text-center w-full md:w-auto">
                <h1 className={`${getModeColor(sessionMode)} font-serif text-lg md:text-xl font-bold tracking-widest uppercase mb-1 whitespace-nowrap`}>High AI Council</h1>
                <div className="flex items-center justify-center gap-2">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border whitespace-nowrap ${isSessionActive ? 'text-amber-300 border-amber-800 bg-amber-900/20' : 'text-slate-500 border-slate-700'}`}>
                        {getModeLabel(sessionMode)}
                    </span>
                    {isSessionActive && (
                        <div className="flex gap-1">
                            <button onClick={onPauseSession} title={isPaused ? "Resume" : "Pause"} className={`p-1 rounded ${isPaused ? 'text-green-400 border border-green-800 bg-green-900/20' : 'text-yellow-400 hover:text-yellow-300'}`}>
                                {isPaused ? <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>}
                            </button>
                            <button onClick={onStopSession} title="Stop Session" className="p-1 text-red-400 hover:text-red-300">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>
                            </button>
                        </div>
                    )}
                </div>
                {currentTopic && (
                    <div className="flex items-center gap-2 animate-fade-in mt-1 justify-center max-w-full">
                        {!isPaused && isSessionActive && <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>}
                        {isPaused && <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-yellow-500"></span>}
                        <p className="text-slate-300 text-xs font-mono truncate max-w-[200px] md:max-w-xs">TOPIC: <span className="text-white font-bold">"{currentTopic}"</span></p>
                    </div>
                )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2 order-3 justify-end flex-1 md:flex-none">
                 <button 
                    onClick={onClearSession}
                    title="Start New Session (Clear History)"
                    className="text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded hover:bg-slate-800"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    <span className="hidden sm:inline">New</span>
                </button>

                <button 
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    className="text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded hover:bg-slate-800"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    <span className="hidden sm:inline">Log</span>
                </button>
            </div>
        </div>
        
        {/* Visual Deck of Councilors */}
        <CouncilorDeck councilors={activeBots} activeBotIds={thinkingBotIds} />

      <div className="flex-1 overflow-y-auto p-2 md:p-8 relative z-0">
        <div className="max-w-5xl mx-auto pb-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          
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
              <div className="bg-slate-900 border border-amber-500/50 px-6 py-4 rounded shadow-2xl flex items-center gap-4 pointer-events-auto">
                  <span className="text-amber-500 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  </span>
                  <div>
                      <h3 className="text-white font-serif font-bold uppercase tracking-widest">Session Paused</h3>
                      <p className="text-slate-400 text-xs">The Council is waiting. Click play to resume.</p>
                  </div>
                  <button onClick={onPauseSession} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded font-bold uppercase text-xs transition-colors">Resume</button>
              </div>
          </div>
      )}

      {/* Legislative Record Sidebar */}
      <div className={`absolute top-0 right-0 h-full w-full md:w-80 bg-slate-900 shadow-2xl transform transition-transform duration-300 z-30 border-l border-slate-700 ${isHistoryOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900">
              <h2 className="text-amber-500 font-serif font-bold uppercase tracking-wider text-sm">Legislative Record</h2>
              <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-white px-2 py-1">✕ Close</button>
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

      <MessageInput 
        onSendMessage={onSendMessage} 
        isLoading={isSessionActive && !isPaused} 
        statusText={statusText}
      />
    </div>
  );
};

export default ChatWindow;
