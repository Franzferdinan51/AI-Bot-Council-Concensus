
import React, { useState } from 'react';
import { Message, AuthorType } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  RadialBarChart, 
  RadialBar, 
  PolarAngleAxis,
  Cell
} from 'recharts';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isHuman = message.authorType === AuthorType.HUMAN;
  const isSystem = message.authorType === AuthorType.SYSTEM;
  const [showSources, setShowSources] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  
  // --- CODE ARTIFACT COMPONENT ---
  const CodeArtifact: React.FC<{ content: string }> = ({ content }) => {
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      const matches = [...content.matchAll(codeBlockRegex)];

      if (matches.length === 0) return null;

      return (
          <div className="flex flex-col gap-4 mt-4 w-full">
              {matches.map((match, idx) => {
                  const lang = match[1] || 'text';
                  const code = match[2];
                  const isHtml = lang.toLowerCase() === 'html' || lang.toLowerCase() === 'xml';
                  const [showPreview, setShowPreview] = useState(false);

                  return (
                      <div key={idx} className="bg-[#181a1f] rounded-lg border border-slate-700/50 overflow-hidden shadow-xl font-mono text-sm group">
                          {/* Artifact Header */}
                          <div className="flex justify-between items-center bg-[#23252b] px-4 py-2 border-b border-black/20">
                              <div className="flex items-center gap-3">
                                  <div className="flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                      <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                                      <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                                  </div>
                                  <span className="text-xs text-slate-400 font-bold uppercase">{lang}</span>
                              </div>
                              <div className="flex gap-2">
                                  {isHtml && (
                                      <button 
                                          onClick={() => setShowPreview(!showPreview)}
                                          className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${showPreview ? 'bg-indigo-600/80 text-white' : 'bg-slate-700/50 text-slate-400 hover:text-white'}`}
                                      >
                                          {showPreview ? 'Code' : 'Preview'}
                                      </button>
                                  )}
                                  <button 
                                      onClick={() => navigator.clipboard.writeText(code)} 
                                      className="text-slate-500 hover:text-white text-[10px] uppercase font-bold tracking-wider transition-colors"
                                  >
                                      Copy
                                  </button>
                              </div>
                          </div>
                          
                          {/* Artifact Body */}
                          {isHtml && showPreview ? (
                              <div className="bg-white h-96 w-full relative">
                                  <iframe 
                                    srcDoc={code} 
                                    className="w-full h-full border-none" 
                                    sandbox="allow-scripts"
                                    title="Artifact Preview"
                                  />
                              </div>
                          ) : (
                              <div className="p-4 overflow-x-auto bg-[#1e1e1e]">
                                  <pre className="text-blue-200 leading-relaxed"><code className="language-javascript">{code}</code></pre>
                              </div>
                          )}
                      </div>
                  );
              })}
          </div>
      );
  };

  const AuthorIcon: React.FC<{ type: AuthorType }> = ({ type }) => {
    switch (type) {
      case AuthorType.GEMINI: 
        return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400 drop-shadow-md"><path d="M2 21h20v-2H2v2zm12.41-5.17l-2.83-2.83-8.49 8.49-2.83-2.83 8.49-8.49-1.41-1.41-1.42 1.41L3.52 7.76l4.24-4.24 2.42 2.42 1.41-1.41 2.83 2.83 1.41-1.41 2.83 2.83-1.41 1.41 2.83 2.83-1.41 1.41-5.66 5.66z"/></svg>;
      case AuthorType.LM_STUDIO:
      case AuthorType.OPENAI_COMPATIBLE:
        return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
      case AuthorType.OPENROUTER:
        return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>;
      case AuthorType.HUMAN:
        return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
      default: 
        return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
    }
  };

  const roleLabel = message.roleLabel || "Member";
  const borderColor = message.color ? message.color : "from-slate-600 to-slate-700";
  const parts = message.content.split('**Verified Sources:**');
  
  let mainContent = parts[0].trim();
  let thinkingContent = message.thinking;

  const thinkingRegex = /<thinking>([\s\S]*?)<\/thinking>/;
  const thinkMatch = mainContent.match(thinkingRegex);
  
  if (thinkMatch) {
      thinkingContent = thinkMatch[1].trim();
      mainContent = mainContent.replace(thinkingRegex, '').trim();
  }

  const sourceContent = parts.length > 1 ? parts[1].trim() : null;
  const textWithoutCode = mainContent.replace(/```(\w+)?\n([\s\S]*?)```/g, '');
  const hasCode = /```(\w+)?\n([\s\S]*?)```/g.test(mainContent);

  // Re-implementing system message rendering with better styling
  if (isSystem) {
      if (message.voteData) {
          const { yeas, nays, result, votes, avgConfidence, consensusScore, consensusLabel } = message.voteData;
          const radialData = [{ name: 'Consensus', value: consensusScore, fill: consensusScore > 75 ? '#10b981' : consensusScore > 40 ? '#f59e0b' : '#ef4444' }];
          const barData = [{ name: 'YEA', value: yeas, color: '#10b981' }, { name: 'NAY', value: nays, color: '#ef4444' }];

          return (
            <div className="flex justify-center my-8 animate-fade-in w-full px-2 md:px-0">
                <div className="bg-slate-900/90 border border-slate-700/50 rounded-2xl p-6 max-w-3xl w-full shadow-2xl relative overflow-hidden backdrop-blur-md">
                    {/* Decorative Background */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800/30 via-transparent to-transparent pointer-events-none"></div>
                    
                    <div className={`absolute top-6 right-6 text-2xl md:text-3xl font-serif font-black border-4 px-4 py-2 transform rotate-[-10deg] opacity-30 select-none z-0 ${result === 'PASSED' ? 'text-green-500 border-green-500' : result === 'REJECTED' ? 'text-red-500 border-red-500' : 'text-amber-500 border-amber-500'}`}>
                        {result}
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-700/50 pb-4">
                             <div className="bg-slate-800 p-2.5 rounded-xl shadow-inner"><AuthorIcon type={AuthorType.SYSTEM} /></div>
                             <div>
                                 <h3 className="text-slate-200 font-serif text-xl tracking-widest uppercase font-bold">Official Decree</h3>
                                 <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">Roll Call Vote</p>
                             </div>
                        </div>
                        {/* ... Charts Section ... */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                            {/* Consensus Gauge */}
                            <div className="bg-black/20 rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center">
                                <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2 w-full text-center">Consensus</h4>
                                <div className="h-32 w-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" barSize={10} data={radialData} startAngle={180} endAngle={0}>
                                            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                            <RadialBar background dataKey="value" cornerRadius={10} />
                                        </RadialBarChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pt-6">
                                        <span className="text-3xl font-black text-white font-serif">{consensusScore}</span>
                                    </div>
                                </div>
                                <div className={`text-xs font-bold -mt-2 px-3 py-1 rounded-full uppercase tracking-wider ${consensusScore > 80 ? 'bg-emerald-500/20 text-emerald-400' : consensusScore > 50 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {consensusLabel}
                                </div>
                            </div>

                            {/* Vote Tally */}
                            <div className="flex flex-col justify-center gap-4">
                                <div>
                                    <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Tally</h4>
                                    <div className="h-32 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" width={40} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                                                    {barData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                            <div className="bg-white/5 px-4 py-2 border-b border-white/5 text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Member Votes</div>
                            <div className="divide-y divide-white/5 max-h-60 overflow-y-auto">
                                {votes.map((v, i) => (
                                    <div key={i} className="p-3 hover:bg-white/5 transition-colors flex flex-col gap-1">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${v.color}`}></div>
                                                <span className="text-sm font-bold text-slate-200 font-serif">{v.voter}</span>
                                            </div>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${v.choice === 'YEA' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>{v.choice}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 italic pl-4 border-l-2 border-slate-700 ml-1 leading-relaxed">"{v.reason}"</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          );
      }
      
      if (message.predictionData) {
          const { outcome, confidence, timeline, reasoning } = message.predictionData;
          return (
            <div className="flex justify-center my-8 animate-fade-in w-full px-2 md:px-0">
                <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-6 max-w-3xl w-full shadow-[0_0_30px_rgba(99,102,241,0.1)] relative overflow-hidden backdrop-blur-md">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-transparent to-transparent z-0 pointer-events-none"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6 border-b border-indigo-500/20 pb-4">
                             <div className="bg-indigo-950 p-2.5 rounded-xl border border-indigo-500/30"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M2 12h10"/><path d="M9 4v16"/><path d="M3 9l9 6 9-6"/><path d="M12 2v20"/></svg></div>
                             <div>
                                 <h3 className="text-indigo-100 font-serif text-xl tracking-widest uppercase font-bold">Prediction Market</h3>
                                 <p className="text-xs text-indigo-400 uppercase tracking-wider font-mono">Council Forecast</p>
                             </div>
                        </div>
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="flex-shrink-0 w-32 h-32 relative flex items-center justify-center bg-indigo-950/30 rounded-full border border-indigo-500/20">
                                 <span className="text-3xl font-black text-indigo-100 font-serif">{confidence}%</span>
                                 <span className="absolute bottom-6 text-[8px] text-indigo-400 uppercase tracking-widest">Confidence</span>
                            </div>
                            <div className="flex-1 space-y-4">
                                <div>
                                    <h4 className="text-[10px] text-indigo-400/70 font-bold uppercase tracking-widest mb-1">Projected Outcome</h4>
                                    <p className="text-white font-bold text-lg leading-snug font-serif">{outcome}</p>
                                </div>
                                <div>
                                    <h4 className="text-[10px] text-indigo-400/70 font-bold uppercase tracking-widest mb-1">Timeline</h4>
                                    <span className="bg-indigo-500/20 text-indigo-200 text-xs px-3 py-1 rounded-full border border-indigo-500/30 font-mono">{timeline}</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 bg-black/20 rounded-xl p-4 border border-white/5">
                            <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 font-mono">Reasoning</h4>
                            <p className="text-slate-300 text-sm leading-relaxed">{reasoning}</p>
                        </div>
                    </div>
                </div>
            </div>
          );
      }

      // Default System Message
      return (
          <div className="flex justify-center my-4 animate-fade-in px-4">
              <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-sm">
                  <span className="text-slate-500 flex-shrink-0"><AuthorIcon type={AuthorType.SYSTEM} /></span>
                  <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider">{message.content}</span>
              </div>
          </div>
      )
  }

  return (
    <div className={`flex items-start gap-3 md:gap-5 my-6 md:my-8 ${isHuman ? 'flex-row-reverse' : 'flex-row animate-fade-in-up'}`}>
      
      {/* Avatar */}
      <div className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center border shadow-lg ${isHuman ? 'bg-slate-800 border-slate-600' : 'bg-slate-900 border-slate-700'}`}>
         <div className="scale-90"><AuthorIcon type={message.authorType} /></div>
      </div>

      {/* Message Bubble */}
      <div className={`w-full max-w-3xl relative rounded-2xl shadow-xl min-w-0 overflow-hidden ${isHuman ? 'bg-slate-800 border border-slate-600/50 rounded-tr-sm' : 'bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-tl-sm'}`}>
        
        {/* Left Color Line for Bots */}
        {!isHuman && <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${borderColor}`}></div>}
        
        <div className="p-4 md:p-6">
            
            {/* Header */}
            <div className={`flex items-center gap-2 mb-3 pb-3 border-b border-white/5 ${isHuman ? 'justify-end flex-row-reverse' : 'justify-start'}`}>
                <span className={`font-serif font-black text-[10px] tracking-[0.2em] uppercase bg-clip-text text-transparent bg-gradient-to-r ${borderColor}`}>
                    {roleLabel}
                </span>
                <span className="text-sm font-serif font-bold text-slate-100">{message.author}</span>
            </div>

            {/* Thinking Block */}
            {thinkingContent && (
                <div className="mb-4">
                    <button 
                        onClick={() => setShowThinking(!showThinking)} 
                        className={`
                            group flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border
                            ${showThinking 
                                ? 'bg-slate-800 border-slate-600 text-slate-300' 
                                : 'bg-slate-950/50 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-400'}
                        `}
                    >
                        <div className={`w-2 h-2 rounded-full transition-colors ${showThinking ? 'bg-amber-500' : 'bg-slate-700 group-hover:bg-amber-500/50'}`}></div>
                        <span>Thought Process</span>
                    </button>
                    
                    {showThinking && (
                        <div className="mt-3 pl-4 border-l-2 border-amber-500/20 text-xs text-slate-400 font-mono italic whitespace-pre-wrap animate-fade-in bg-black/20 p-3 rounded-r-lg">
                            {thinkingContent}
                        </div>
                    )}
                </div>
            )}
            
            {/* Main Text */}
            <div className={`text-slate-200 leading-7 font-sans text-sm md:text-base whitespace-pre-wrap break-words min-w-0 ${isHuman ? 'text-right' : 'text-left'}`}>
                {hasCode ? textWithoutCode : mainContent}
            </div>
            
            {/* Code Artifacts */}
            {hasCode && <CodeArtifact content={mainContent} />}

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
                <div className={`mt-4 flex flex-wrap gap-2 ${isHuman ? 'justify-end' : 'justify-start'}`}>
                    {message.attachments.map((att, idx) => (
                        <a key={idx} href={att.data} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-950/50 p-2 rounded-lg border border-slate-700/50 text-blue-400 hover:text-blue-300 hover:border-blue-500/30 text-xs max-w-full transition-colors">
                             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path></svg>
                             <span className="truncate">{att.data}</span>
                        </a>
                    ))}
                </div>
            )}

            {sourceContent && (
                <div className="mt-6 pt-4 border-t border-white/5">
                    <button onClick={() => setShowSources(!showSources)} className="flex items-center gap-2 text-[10px] text-amber-500/60 hover:text-amber-400 font-bold uppercase tracking-widest transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${showSources ? 'rotate-90' : ''}`}><polyline points="9 18 15 12 9 6"></polyline></svg>
                        Citations & Data
                    </button>
                    {showSources && <div className="mt-3 bg-black/30 p-4 rounded-lg border border-white/5 text-xs text-slate-400 font-mono whitespace-pre-wrap break-all animate-fade-in shadow-inner">{sourceContent}</div>}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
