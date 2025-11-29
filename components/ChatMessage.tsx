
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
                  
                  // Preview state
                  const [showPreview, setShowPreview] = useState(false);

                  return (
                      <div key={idx} className="bg-[#1e1e1e] rounded-lg border border-slate-700 overflow-hidden shadow-2xl font-mono text-sm">
                          {/* Artifact Header */}
                          <div className="flex justify-between items-center bg-[#2d2d2d] px-4 py-2 border-b border-black/20">
                              <div className="flex items-center gap-2">
                                  <div className="flex gap-1.5">
                                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                                  </div>
                                  <span className="text-xs text-slate-400 font-bold uppercase ml-2">{lang}</span>
                              </div>
                              <div className="flex gap-2">
                                  {isHtml && (
                                      <button 
                                          onClick={() => setShowPreview(!showPreview)}
                                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${showPreview ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                                      >
                                          {showPreview ? 'Show Code' : 'Preview'}
                                      </button>
                                  )}
                                  <button 
                                      onClick={() => navigator.clipboard.writeText(code)} 
                                      className="text-slate-400 hover:text-white text-[10px] uppercase font-bold tracking-wider"
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
                              <div className="p-4 overflow-x-auto">
                                  <pre className="text-blue-300"><code className="language-javascript">{code}</code></pre>
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
      if (message.voteData) {
          const { yeas, nays, result, votes, avgConfidence, consensusScore, consensusLabel } = message.voteData;
          
          // Recharts Data Construction
          const radialData = [
              { name: 'Consensus', value: consensusScore, fill: consensusScore > 75 ? '#10b981' : consensusScore > 40 ? '#f59e0b' : '#ef4444' }
          ];

          const barData = [
              { name: 'YEA', value: yeas, color: '#10b981' },
              { name: 'NAY', value: nays, color: '#ef4444' },
          ];

          return (
            <div className="flex justify-center my-6 animate-fade-in w-full px-2 md:px-0">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 md:p-6 max-w-2xl w-full shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 opacity-50 z-0"></div>
                    <div className={`absolute top-4 right-4 md:right-6 text-xl md:text-3xl font-black border-4 px-3 py-1 transform rotate-[-12deg] opacity-40 select-none z-10 transition-all group-hover:opacity-100 ${result === 'PASSED' ? 'text-green-500 border-green-500' : result === 'REJECTED' ? 'text-red-500 border-red-500' : 'text-amber-500 border-amber-500'}`}>
                        {result}
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                             <div className="bg-slate-700 p-2 rounded-full shadow-inner"><AuthorIcon type={AuthorType.SYSTEM} /></div>
                             <div>
                                 <h3 className="text-slate-200 font-serif text-lg tracking-widest uppercase font-bold">Roll Call Vote</h3>
                                 <p className="text-xs text-slate-500 uppercase tracking-wider">Session Resolution</p>
                             </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            
                            {/* Consensus Gauge using Recharts */}
                            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 flex flex-col items-center justify-center relative overflow-hidden">
                                <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 w-full text-center">Consensus Score</h4>
                                <div className="h-32 w-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadialBarChart 
                                            cx="50%" 
                                            cy="50%" 
                                            innerRadius="60%" 
                                            outerRadius="80%" 
                                            barSize={10} 
                                            data={radialData} 
                                            startAngle={180} 
                                            endAngle={0}
                                        >
                                            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                            <RadialBar
                                                background
                                                dataKey="value"
                                                cornerRadius={10}
                                            />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff', fontSize: '12px' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                        </RadialBarChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                                        <span className="text-2xl font-black text-white">{consensusScore}</span>
                                        <span className="text-[8px] text-slate-400 uppercase">/100</span>
                                    </div>
                                </div>
                                <div className={`text-xs font-bold -mt-4 px-2 py-0.5 rounded uppercase ${consensusScore > 80 ? 'bg-emerald-900/30 text-emerald-400' : consensusScore > 50 ? 'bg-amber-900/30 text-amber-400' : 'bg-red-900/30 text-red-400'}`}>
                                    {consensusLabel || "Divided"}
                                </div>
                            </div>

                            {/* Vote Tally using Recharts */}
                            <div className="flex flex-col justify-center gap-3">
                                <div>
                                    <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Vote Tally</h4>
                                    <div className="h-32 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" width={40} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                                                <Tooltip 
                                                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff', fontSize: '12px' }}
                                                />
                                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                                    {barData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                
                                {/* Avg Confidence (Simple Bar) */}
                                {avgConfidence !== undefined && (
                                    <div className="mt-2">
                                         <div className="text-[10px] text-slate-500 uppercase mb-1 flex justify-between">
                                            <span>Avg. Confidence</span>
                                            <span className="text-slate-300 font-bold">{avgConfidence.toFixed(1)}/10</span>
                                         </div>
                                         <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                                             <div className={`h-full ${avgConfidence > 7 ? 'bg-blue-500' : avgConfidence > 4 ? 'bg-yellow-500' : 'bg-orange-500'}`} style={{ width: `${avgConfidence * 10}%` }}></div>
                                         </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="bg-slate-900/30 rounded border border-slate-700/50 overflow-hidden">
                            <div className="bg-slate-900/50 px-3 py-2 border-b border-slate-700/50 text-xs font-bold text-slate-400 uppercase tracking-wider">Member Breakdown</div>
                            <div className="divide-y divide-slate-800 max-h-60 overflow-y-auto">
                                {votes.map((v, i) => (
                                    <div key={i} className="p-3 hover:bg-slate-800/50 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${v.color}`}></div>
                                                <span className="text-sm font-bold text-slate-200">{v.voter}</span>
                                            </div>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${v.choice === 'YEA' ? 'bg-green-950 text-green-400 border-green-900' : 'bg-red-950 text-red-400 border-red-900'}`}>{v.choice}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 italic pl-4 border-l-2 border-slate-700 ml-1">"{v.reason}"</p>
                                    </div>
                                ))}
                            </div>
                        </div>
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
  const parts = message.content.split('**Verified Sources:**');
  const mainContent = parts[0].trim();
  const sourceContent = parts.length > 1 ? parts[1].trim() : null;

  // If content contains code blocks, we strip them from the text view because the CodeArtifact component handles them
  const textWithoutCode = mainContent.replace(/```(\w+)?\n([\s\S]*?)```/g, '');
  const hasCode = /```(\w+)?\n([\s\S]*?)```/g.test(mainContent);

  return (
    <div className={`flex items-start gap-3 md:gap-4 my-4 md:my-6 ${isHuman ? 'flex-row-reverse' : 'flex-row animate-fade-in-up'}`}>
      <div className={`flex-shrink-0 w-8 h-8 md:w-12 md:h-12 rounded-lg bg-slate-800 flex items-center justify-center border ${isHuman ? 'border-slate-500' : `border-slate-700 shadow-lg`}`}>
         <div className="scale-75 md:scale-100"><AuthorIcon type={message.authorType} /></div>
      </div>
      <div className={`w-full max-w-3xl relative rounded-sm border-l-4 shadow-xl min-w-0 ${isHuman ? 'bg-slate-800 border-slate-500' : 'bg-slate-900 border-l-transparent'}`}>
        {!isHuman && <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${borderColor}`}></div>}
        
        <div className="p-3 md:p-5 overflow-hidden">
            <div className={`flex items-baseline mb-2 pb-2 border-b border-slate-700 ${isHuman ? 'justify-end' : 'justify-start'}`}>
            <span className={`font-serif font-bold text-[9px] md:text-[10px] tracking-widest uppercase mr-2 bg-clip-text text-transparent bg-gradient-to-r ${borderColor}`}>
                {roleLabel}
            </span>
            <span className="text-sm md:text-lg font-serif font-medium text-slate-200 truncate">{message.author}</span>
            </div>

            {message.thinking && (
                <div className="mb-3">
                    <button 
                        onClick={() => setShowThinking(!showThinking)} 
                        className={`
                            flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                            ${showThinking 
                                ? 'bg-slate-800 text-slate-300' 
                                : 'bg-slate-900 text-slate-500 hover:bg-slate-800 hover:text-slate-400'}
                        `}
                    >
                        {showThinking ? (
                             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                        ) : (
                             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        )}
                        <span>Thinking Process</span>
                    </button>
                    
                    {showThinking && (
                        <div className="mt-2 ml-2 pl-4 border-l-2 border-slate-800 text-xs text-slate-400 font-mono italic whitespace-pre-wrap animate-fade-in">
                            {message.thinking}
                        </div>
                    )}
                </div>
            )}
            
            {/* Text Content (Simplified if code exists) */}
            <div className="text-slate-300 leading-relaxed font-serif text-sm md:text-md whitespace-pre-wrap break-words min-w-0">
                {hasCode ? textWithoutCode : mainContent}
            </div>
            
            {/* Render Code Artifacts */}
            {hasCode && <CodeArtifact content={mainContent} />}

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {message.attachments.map((att, idx) => (
                        <a key={idx} href={att.data} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-700 text-blue-400 hover:text-blue-300 text-xs max-w-full">
                             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path></svg>
                             <span className="truncate">{att.data}</span>
                        </a>
                    ))}
                </div>
            )}

            {sourceContent && (
                <div className="mt-4 pt-3 border-t border-slate-800">
                    <button onClick={() => setShowSources(!showSources)} className="flex items-center gap-2 text-xs text-amber-500/80 hover:text-amber-400 font-bold uppercase tracking-wider transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${showSources ? 'rotate-90' : ''}`}><polyline points="9 18 15 12 9 6"></polyline></svg>
                        Scanned Data / Sources
                    </button>
                    {showSources && <div className="mt-2 bg-slate-950/50 p-3 rounded border border-slate-800 text-xs text-slate-400 font-mono whitespace-pre-wrap break-all animate-fade-in">{sourceContent}</div>}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
