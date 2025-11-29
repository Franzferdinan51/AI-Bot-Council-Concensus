
import React, { useRef, useEffect, useState } from 'react';
import type { Message, BotConfig } from '../types';
import ChatMessage from './ChatMessage';
import MessageInput from './MessageInput';
import CouncilorDeck from './CouncilorDeck';

interface ChatWindowProps {
  messages: Message[];
  activeBots: BotConfig[]; // All enabled bots
  thinkingBotId: string | null; // ID of the bot currently processing
  onSendMessage: (content: string) => void;
  statusText: string;
  currentTopic: string | null;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, activeBots, thinkingBotId, onSendMessage, statusText, currentTopic }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, thinkingBotId]);
  
  const isSessionActive = thinkingBotId !== null;
  const voteHistory = messages.filter(m => m.voteData);

  return (
    <div className="flex flex-col h-full bg-slate-950 relative overflow-hidden">
        {/* Background Overlay for texture */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')]"></div>
        
        {/* Council Header */}
        <div className="bg-slate-900 border-b border-amber-900/50 p-2 shadow-lg z-10 flex flex-col items-center relative">
            <h1 className="text-amber-500 font-serif text-lg md:text-xl font-bold tracking-widest uppercase mb-1">High AI Council</h1>
            {currentTopic && (
                <div className="flex items-center gap-2 animate-fade-in max-w-[70%] md:max-w-full">
                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    <p className="text-slate-300 text-xs font-mono truncate">MOTION: <span className="text-white font-bold">"{currentTopic}"</span></p>
                </div>
            )}
            
            {/* History Toggle Button */}
            <button 
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className="absolute right-4 top-3 text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                <span className="hidden md:inline">Log</span>
            </button>
        </div>
        
        {/* Visual Deck of Councilors */}
        <CouncilorDeck councilors={activeBots} activeBotId={thinkingBotId} />

      <div className="flex-1 overflow-y-auto p-2 md:p-8 relative z-0">
        <div className="max-w-5xl mx-auto pb-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          
          {thinkingBotId && (
             <div className="flex flex-col items-center justify-center my-8 animate-pulse">
                 <div className="text-slate-500 font-serif text-xs md:text-sm italic">The Council is deliberating...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

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
                               <span className="text-[10px] text-slate-400 font-mono">
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
        isLoading={isSessionActive} 
        statusText={statusText}
      />
    </div>
  );
};

export default ChatWindow;
