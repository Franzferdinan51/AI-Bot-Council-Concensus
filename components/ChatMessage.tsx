
import React, { useState } from 'react';
import { Message, AuthorType } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isHuman = message.authorType === AuthorType.HUMAN;
  const isSystem = message.authorType === AuthorType.SYSTEM;
  const [showSources, setShowSources] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  
  const AuthorIcon: React.FC<{ type: AuthorType }> = ({ type }) => {
    switch (type) {
      case AuthorType.GEMINI: // Speaker - Gavel
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400"><path d="M2 21h20v-2H2v2zm12.41-5.17l-2.83-2.83-8.49 8.49-2.83-2.83 8.49-8.49-1.41-1.41-1.42 1.41L3.52 7.76l4.24-4.24 2.42 2.42 1.41-1.41 2.83 2.83 1.41-1.41 2.83 2.83-1.41 1.41 2.83 2.83-1.41 1.41-5.66 5.66z"/></svg>;
      case AuthorType.LM_STUDIO:
      case AuthorType.OPENAI_COMPATIBLE:
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-300"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
      case AuthorType.OPENROUTER:
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-300"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>;
      case AuthorType.HUMAN:
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
      default: // System
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
    }
  };

  if (isSystem) {
      // Special rendering for Vote Tally
      if (message.voteData) {
          const { yeas, nays, result, votes, avgConfidence } = message.voteData;
          const total = yeas + nays;
          const yeaPercent = total > 0 ? (yeas / total) * 100 : 0;
          
          return (
            <div className="flex justify-center my-6 animate-fade-in w-full px-2 md:px-0">
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 md:p-6 max-w-2xl w-full shadow-2xl relative overflow-hidden">
                    {/* Result Stamp */}
                    <div className={`absolute top-4 right-4 md:right-6 text-2xl md:text-3xl font-black border-4 px-2 py-1 transform rotate-[-15deg] opacity-30 select-none ${result === 'PASSED' ? 'text-green-500 border-green-500' : result === 'REJECTED' ? 'text-red-500 border-red-500' : 'text-yellow-500 border-yellow-500'}`}>
                        {result}
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                         <div className="bg-slate-700 p-2 rounded-full"><AuthorIcon type={AuthorType.SYSTEM} /></div>
                         <h3 className="text-slate-200 font-serif text-base md:text-lg tracking-widest uppercase font-bold">Official Roll Call Vote</h3>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-2">
                        <div className="flex justify-between text-xs font-bold uppercase mb-1">
                            <span className="text-green-400">Yeas: {yeas}</span>
                            <span className="text-red-400">Nays: {nays}</span>
                        </div>
                        <div className="h-4 bg-slate-900 rounded-full overflow-hidden flex border border-slate-600">
                            <div style={{ width: `${yeaPercent}%` }} className="bg-gradient-to-r from-green-600 to-green-500 transition-all duration-1000"></div>
                            <div style={{ width: `${100 - yeaPercent}%` }} className="bg-gradient-to-l from-red-600 to-red-500 transition-all duration-1000"></div>
                        </div>
                    </div>
                    
                    {avgConfidence !== undefined && (
                        <div className="mb-6 flex items-center gap-2">
                             <div className="text-[10px] text-slate-500 uppercase">Avg. Confidence:</div>
                             <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                 <div className={`h-full ${avgConfidence > 7 ? 'bg-emerald-500' : avgConfidence > 4 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${avgConfidence * 10}%` }}></div>
                             </div>
                             <div className="text-[10px] text-slate-400 font-mono">{avgConfidence.toFixed(1)}/10</div>
                        </div>
                    )}

                    {/* Individual Votes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {votes.map((v, i) => (
                            <div key={i} className="bg-slate-900/50 p-3 rounded border border-slate-700/50 flex flex-col gap-1">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${v.color}`}></div>
                                        <span className="text-xs font-bold text-slate-300">{v.voter}</span>
                                    </div>
                                    <span className={`text-xs font-black px-2 py-0.5 rounded ${v.choice === 'YEA' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                                        {v.choice} <span className="text-[9px] opacity-70 ml-1">({v.confidence})</span>
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-500 italic leading-tight">"{v.reason}"</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          );
      }

      return (
          <div className="flex justify-center my-4 animate-fade-in px-4">
              <div className="bg-slate-800/50 border border-slate-700 rounded-full px-4 py-1 flex items-center gap-2 shadow-sm max-w-full">
                  <span className="text-slate-500 flex-shrink-0"><AuthorIcon type={AuthorType.SYSTEM} /></span>
                  <span className="text-slate-400 font-mono text-xs uppercase tracking-wider truncate block min-w-0">{message.content}</span>
              </div>
          </div>
      )
  }

  const roleLabel = message.roleLabel || "Member";
  const borderColor = message.color ? message.color : "from-slate-500 to-slate-700";

  // Parse Source Content (clean up text clutter)
  const parts = message.content.split('**Verified Sources:**');
  const mainContent = parts[0].trim();
  const sourceContent = parts.length > 1 ? parts[1].trim() : null;

  return (
    <div className={`flex items-start gap-3 md:gap-4 my-4 md:my-6 ${isHuman ? 'flex-row-reverse' : 'flex-row animate-fade-in-up'}`}>
      <div className={`flex-shrink-0 w-8 h-8 md:w-12 md:h-12 rounded-lg bg-slate-800 flex items-center justify-center border ${isHuman ? 'border-slate-500' : `border-slate-700 shadow-lg`}`}>
         <div className="scale-75 md:scale-100"><AuthorIcon type={message.authorType} /></div>
      </div>
      <div className={`w-full max-w-3xl relative rounded-sm border-l-4 shadow-xl min-w-0 ${isHuman ? 'bg-slate-800 border-slate-500' : 'bg-slate-900 border-l-transparent'}`}>
        {/* Decorative border line for bots */}
        {!isHuman && <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${borderColor}`}></div>}
        
        <div className="p-3 md:p-5 overflow-hidden">
            <div className={`flex items-baseline mb-2 pb-2 border-b border-slate-700 ${isHuman ? 'justify-end' : 'justify-start'}`}>
            <span className={`font-serif font-bold text-[9px] md:text-[10px] tracking-widest uppercase mr-2 bg-clip-text text-transparent bg-gradient-to-r ${borderColor}`}>
                {roleLabel}
            </span>
            <span className="text-sm md:text-lg font-serif font-medium text-slate-200 truncate">{message.author}</span>
            </div>

            {/* Thinking Block */}
            {message.thinking && (
                <div className="mb-4">
                     <button 
                        onClick={() => setShowThinking(!showThinking)}
                        className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-cyan-400 uppercase tracking-widest transition-colors font-bold mb-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showThinking ? 'rotate-90' : ''}`}><polyline points="9 18 15 12 9 6"></polyline></svg>
                        Chain of Thought
                    </button>
                    {showThinking && (
                        <div className="bg-slate-950 p-3 rounded border-l-2 border-cyan-900 text-xs font-mono text-cyan-700/80 whitespace-pre-wrap leading-relaxed animate-fade-in shadow-inner">
                            {message.thinking}
                        </div>
                    )}
                </div>
            )}
            
            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                    {message.attachments.map((att, idx) => {
                        if (att.type === 'file') {
                            if (att.mimeType && att.mimeType.startsWith('image/')) {
                                return <img key={idx} src={`data:${att.mimeType};base64,${att.data}`} className="max-w-xs rounded border border-slate-700 shadow-lg" alt="Evidence" />;
                            } else if (att.mimeType && att.mimeType.startsWith('video/')) {
                                return <video key={idx} controls src={`data:${att.mimeType};base64,${att.data}`} className="max-w-xs rounded border border-slate-700 shadow-lg" />;
                            }
                        } else if (att.type === 'link') {
                            return (
                                <a key={idx} href={att.data} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-700 text-blue-400 hover:text-blue-300 text-xs max-w-full">
                                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                                     <span className="truncate">{att.data}</span>
                                </a>
                            );
                        }
                        return null;
                    })}
                </div>
            )}

            {/* Main Content */}
            <div className="text-slate-300 leading-relaxed font-serif text-sm md:text-md whitespace-pre-wrap break-words min-w-0">
                {mainContent}
            </div>

            {/* Collapsible Sources Section */}
            {sourceContent && (
                <div className="mt-4 pt-3 border-t border-slate-800">
                    <button 
                        onClick={() => setShowSources(!showSources)}
                        className="flex items-center gap-2 text-xs text-amber-500/80 hover:text-amber-400 font-bold uppercase tracking-wider transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${showSources ? 'rotate-90' : ''}`}>
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                        Scanned Data / Sources
                    </button>
                    {showSources && (
                        <div className="mt-2 bg-slate-950/50 p-3 rounded border border-slate-800 text-xs text-slate-400 font-mono whitespace-pre-wrap break-all animate-fade-in">
                            {sourceContent}
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
