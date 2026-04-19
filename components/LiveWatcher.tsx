/**
 * LiveWatcher — Full-screen live deliberation viewer
 * Subscribes to SSE stream and shows real-time council activity
 */

import React, { useEffect, useRef, useState } from 'react';
import { useLiveSession, LiveMessage } from '../hooks/useLiveSession';

interface LiveWatcherProps {
    onClose: () => void;
}

const PHASE_LABELS: Record<string, string> = {
    idle: 'AWAITING MOTION',
    opening: 'OPENING',
    debating: 'DEBATING',
    voting: 'VOTING',
    resolving: 'RESOLVING',
    adjourned: 'ADJOURNED',
    paused: 'PAUSED'
};

const PHASE_COLORS: Record<string, string> = {
    idle: 'text-slate-500',
    opening: 'text-amber-400',
    debating: 'text-cyan-400',
    voting: 'text-purple-400',
    resolving: 'text-emerald-400',
    adjourned: 'text-slate-400',
    paused: 'text-yellow-400'
};

function formatElapsed(ms: number): string {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function LiveMessageCard({ msg }: { msg: LiveMessage; key?: React.Key }) {
    const isSystem = msg.authorType === 'system';
    const isVote = !!msg.voteData;
    const isPrediction = !!msg.predictionData;

    if (isVote && msg.voteData) {
        const v = msg.voteData;
        return (
            <div className="bg-slate-900/80 border border-purple-600/40 rounded-lg p-3 my-2 animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-purple-400 text-xs font-bold uppercase tracking-wider">📊 Vote Tallied</span>
                    <span className={`text-xs font-black px-2 py-0.5 rounded ${
                        v.result === 'PASSED' ? 'bg-green-900/50 text-green-400' :
                        v.result === 'REJECTED' ? 'bg-red-900/50 text-red-400' :
                        'bg-amber-900/50 text-amber-400'
                    }`}>{v.result}</span>
                </div>
                <div className="flex gap-4 mb-2">
                    <div className="text-center">
                        <div className="text-2xl font-black text-green-400">{v.yeas}</div>
                        <div className="text-[10px] text-slate-500 uppercase">Yeas</div>
                    </div>
                    <div className="text-slate-700 text-2xl">/</div>
                    <div className="text-center">
                        <div className="text-2xl font-black text-red-400">{v.nays}</div>
                        <div className="text-[10px] text-slate-500 uppercase">Nays</div>
                    </div>
                    {v.consensusScore !== undefined && (
                        <div className="text-center ml-auto">
                            <div className="text-xl font-black text-amber-400">{v.consensusScore}%</div>
                            <div className="text-[10px] text-slate-500 uppercase">{v.consensusLabel}</div>
                        </div>
                    )}
                </div>
                {v.votes && (
                    <div className="space-y-1 mt-2">
                        {v.votes.slice(0, 5).map((vote: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                                <span className={`w-8 text-right font-bold ${
                                    vote.choice === 'YEA' ? 'text-green-400' : 'text-red-400'
                                }`}>{vote.choice}</span>
                                <span className="text-slate-300 truncate flex-1">{vote.voter}</span>
                                <span className="text-slate-500 text-[10px]">{vote.reason?.substring(0, 40)}...</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (isPrediction && msg.predictionData) {
        const p = msg.predictionData;
        return (
            <div className="bg-slate-900/80 border border-cyan-600/40 rounded-lg p-3 my-2 animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider">🎯 Forecast</span>
                    <span className="bg-cyan-900/50 text-cyan-300 text-xs font-black px-2 py-0.5 rounded">{p.confidence}% confidence</span>
                </div>
                <div className="text-white font-bold text-sm mb-1">{p.outcome}</div>
                <div className="text-slate-400 text-xs italic">{p.timeline}</div>
                {p.reasoning && <div className="text-slate-500 text-[10px] mt-1">{p.reasoning.substring(0, 100)}...</div>}
            </div>
        );
    }

    return (
        <div className={`my-1.5 animate-fade-in ${isSystem ? 'bg-slate-900/40 border-l-2 border-amber-600/50 pl-3 py-1' : ''}`}>
            <div className="flex items-baseline gap-2 mb-0.5">
                <span className={`text-xs font-bold uppercase tracking-wider ${
                    isSystem ? 'text-amber-500' : 'text-slate-300'
                }`} style={{ fontFamily: 'Cinzel, serif' }}>
                    {msg.author}
                </span>
                {msg.roleLabel && (
                    <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-widest">
                        {msg.roleLabel}
                    </span>
                )}
                <span className="text-[9px] text-slate-600 ml-auto">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
                </span>
            </div>
            <div className={`text-sm leading-relaxed ${isSystem ? 'text-amber-200/70 italic' : 'text-slate-200'}`}>
                {msg.thinking && (
                    <div className="text-[10px] text-cyan-500 italic mb-1 border-l border-cyan-600 pl-2">
                        🤔 {msg.thinking.substring(0, 80)}...
                    </div>
                )}
                <span className={msg.thinking ? 'text-slate-400' : ''}>{msg.content}</span>
            </div>
        </div>
    );
}

export default function LiveWatcher({ onClose }: LiveWatcherProps) {
    const session = useLiveSession();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [filterCouncilor, setFilterCouncilor] = useState<string | null>(null);
    const [autoScroll, setAutoScroll] = useState(true);

    const visibleMessages = filterCouncilor
        ? session.messages.filter(m => m.author === filterCouncilor)
        : session.messages;

    useEffect(() => {
        if (autoScroll && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [session.messages, autoScroll]);

    const speakingCouncilors = session.councilors.filter(c => c.status === 'speaking');
    const doneCouncilors = session.councilors.filter(c => c.status === 'done');
    const idleCouncilors = session.councilors.filter(c => c.status === 'idle');

    const scrollMessages = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        setAutoScroll(atBottom);
    };

    return (
        <div className="fixed inset-0 z-[60] bg-[#050810] flex flex-col overflow-hidden animate-fade-in">
            
            {/* ── HEADER ─────────────────────────────────────── */}
            <div className="shrink-0 bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Pulse indicator */}
                    <div className="relative flex items-center gap-1.5">
                        <span className={`relative flex h-2.5 w-2.5`}>
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                session.connected ? 'bg-green-400' : 'bg-red-400'
                            }`}></span>
                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                                session.connected ? 'bg-green-500' : 'bg-red-500'
                            }`}></span>
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                            {session.connected ? 'LIVE' : 'RECONNECTING'}
                        </span>
                    </div>

                    <div className="h-4 w-px bg-slate-700"></div>

                    {/* Phase */}
                    <div className={`font-serif font-bold text-xs uppercase tracking-widest ${PHASE_COLORS[session.phase]}`}>
                        {PHASE_LABELS[session.phase] || session.phase.toUpperCase()}
                    </div>

                    {session.topic && (
                        <>
                            <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>
                            <div className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-[300px] hidden md:block">
                                {session.topic.substring(0, 60)}{session.topic.length > 60 ? '...' : ''}
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-3 text-xs">
                        <div className="text-center">
                            <div className="text-amber-400 font-black text-sm">{session.stats.messages}</div>
                            <div className="text-slate-600 text-[9px] uppercase">Msgs</div>
                        </div>
                        {session.stats.yeas > 0 && (
                            <>
                                <div className="text-center">
                                    <div className="text-green-400 font-black text-sm">{session.stats.yeas}</div>
                                    <div className="text-slate-600 text-[9px] uppercase">Yeas</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-red-400 font-black text-sm">{session.stats.nays}</div>
                                    <div className="text-slate-600 text-[9px] uppercase">Nays</div>
                                </div>
                            </>
                        )}
                        <div className="text-center">
                            <div className="text-slate-400 font-mono text-sm">{formatElapsed(session.elapsed)}</div>
                            <div className="text-slate-600 text-[9px] uppercase">Elapsed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-slate-400 font-black text-sm">{session.viewerCount}</div>
                            <div className="text-slate-600 text-[9px] uppercase">👁</div>
                        </div>
                    </div>

                    <button 
                        onClick={onClose}
                        className="bg-slate-800 hover:bg-red-900/50 border border-slate-700 hover:border-red-700 text-slate-400 hover:text-red-300 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all"
                    >
                        ✕ Close
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden min-h-0">
                
                {/* ── LEFT PANEL: Councilor Activity ─────────── */}
                <div className="w-48 shrink-0 bg-slate-950 border-r border-slate-800 overflow-y-auto hidden md:block">
                    <div className="p-3">
                        <div className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mb-2">Council Chamber</div>
                        
                        {speakingCouncilors.length > 0 && (
                            <div className="mb-3">
                                <div className="text-[9px] text-cyan-600 uppercase tracking-widest mb-1">Speaking</div>
                                {speakingCouncilors.map(c => (
                                    <div key={c.id} className="flex items-center gap-1.5 py-1">
                                        <span className="animate-pulse h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                                        <div className="min-w-0">
                                            <div className="text-[10px] text-cyan-300 truncate font-bold">{c.name}</div>
                                            <div className="text-[9px] text-slate-600">{c.role}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mb-3">
                            <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">Present ({idleCouncilors.length})</div>
                            {idleCouncilors.map(c => (
                                <div key={c.id} className="flex items-center gap-1.5 py-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0"></span>
                                    <button 
                                        onClick={() => setFilterCouncilor(filterCouncilor === c.name ? null : c.name)}
                                        className={`text-[10px] truncate font-bold transition-colors ${
                                            filterCouncilor === c.name ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        {c.name}
                                    </button>
                                </div>
                            ))}
                        </div>

                        {doneCouncilors.length > 0 && (
                            <div className="mb-3">
                                <div className="text-[9px] text-emerald-700 uppercase tracking-widest mb-1">Spoken ({doneCouncilors.length})</div>
                                {doneCouncilors.map(c => (
                                    <div key={c.id} className="flex items-center gap-1.5 py-1 opacity-60">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-700 shrink-0"></span>
                                        <button
                                            onClick={() => setFilterCouncilor(filterCouncilor === c.name ? null : c.name)}
                                            className={`text-[10px] truncate font-bold transition-colors ${
                                                filterCouncilor === c.name ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                                            }`}
                                        >
                                            {c.name}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {filterCouncilor && (
                            <button 
                                onClick={() => setFilterCouncilor(null)}
                                className="w-full text-[9px] bg-amber-900/30 text-amber-500 border border-amber-800/50 rounded py-1 uppercase tracking-wider hover:bg-amber-900/50 transition-colors"
                            >
                                Clear Filter
                            </button>
                        )}
                    </div>
                </div>

                {/* ── MAIN: Message Stream ──────────────────────── */}
                <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                    
                    {/* Phase progress bar */}
                    <div className="shrink-0 h-1 flex bg-slate-900">
                        {['opening', 'debating', 'voting', 'resolving', 'adjourned'].map((phase, i) => {
                            const phases = ['opening', 'debating', 'voting', 'resolving', 'adjourned'];
                            const currentIdx = phases.indexOf(session.phase);
                            const phaseIdx = phases.indexOf(phase);
                            const isActive = phaseIdx <= currentIdx && session.phase !== 'idle';
                            return (
                                <div 
                                    key={phase}
                                    className={`flex-1 transition-colors ${
                                        isActive 
                                            ? phase === 'debating' ? 'bg-cyan-500' :
                                              phase === 'voting' ? 'bg-purple-500' :
                                              phase === 'opening' ? 'bg-amber-500' :
                                              phase === 'resolving' ? 'bg-emerald-500' :
                                              'bg-slate-600'
                                            : 'bg-slate-800'
                                    } ${i < phases.length - 1 ? 'border-r border-black' : ''}`}
                                />
                            );
                        })}
                    </div>

                    {/* Messages */}
                    <div 
                        className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin"
                        onScroll={scrollMessages}
                    >
                        {session.phase === 'idle' && session.messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="text-slate-600 font-serif text-lg mb-2">Chamber Silent</div>
                                <div className="text-slate-700 text-xs">Waiting for deliberation to begin...</div>
                                <div className="text-slate-800 text-xs mt-4 flex items-center gap-1.5">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-700 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-800"></span>
                                    </span>
                                    Connected, awaiting session
                                </div>
                            </div>
                        ) : (
                            <>
                                {session.phase !== 'idle' && session.messages.length === 0 && (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="flex items-center gap-2 text-cyan-500 animate-pulse">
                                            <span className="h-2 w-2 rounded-full bg-cyan-500 animate-ping"></span>
                                            <span className="text-xs font-serif uppercase tracking-widest">Session Opening...</span>
                                        </div>
                                    </div>
                                )}
                                {visibleMessages.map(msg => (
                                    <LiveMessageCard key={msg.id} msg={msg} />
                                ))}
                                {speakingCouncilors.length > 0 && (
                                    <div className="flex items-center gap-2 py-2 text-cyan-500 animate-pulse">
                                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
                                        <span className="text-[10px] uppercase tracking-widest">
                                            {speakingCouncilors.map(c => c.name).join(', ')} {speakingCouncilors.length === 1 ? 'is' : 'are'} deliberating...
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message input at bottom */}
                    <div className="shrink-0 border-t border-slate-800 bg-slate-950 p-3">
                        <div className="flex items-center gap-2 text-[10px] text-slate-600">
                            <span className={`h-1.5 w-1.5 rounded-full ${session.connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <span>Live stream • {session.messages.length} messages</span>
                            {filterCouncilor && <span>• Filtered: {filterCouncilor}</span>}
                            {autoScroll ? (
                                <button onClick={() => setAutoScroll(false)} className="ml-auto text-amber-600 hover:text-amber-400 transition-colors">Auto-scroll ON</button>
                            ) : (
                                <button onClick={() => { setAutoScroll(true); messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }} className="ml-auto text-slate-600 hover:text-slate-400 transition-colors">↓ Scroll to bottom</button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── RIGHT PANEL: Vote/Session Summary ───────── */}
                <div className="w-64 shrink-0 bg-slate-950 border-l border-slate-800 overflow-y-auto hidden lg:block">
                    <div className="p-3">
                        <div className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mb-3">Session Summary</div>

                        {/* Vote Result */}
                        {session.voteData && (
                            <div className="mb-4">
                                <div className="text-[10px] text-purple-500 uppercase tracking-widest mb-2">Final Vote</div>
                                <div className={`rounded-lg p-3 border ${
                                    session.voteData.result === 'PASSED' ? 'border-green-700 bg-green-950/30' :
                                    session.voteData.result === 'REJECTED' ? 'border-red-700 bg-red-950/30' :
                                    'border-amber-700 bg-amber-950/30'
                                }`}>
                                    <div className="text-center mb-2">
                                        <div className={`text-lg font-black ${
                                            session.voteData.result === 'PASSED' ? 'text-green-400' :
                                            session.voteData.result === 'REJECTED' ? 'text-red-400' :
                                            'text-amber-400'
                                        }`}>{session.voteData.result}</div>
                                    </div>
                                    <div className="flex justify-center gap-6">
                                        <div className="text-center">
                                            <div className="text-xl font-black text-green-400">{session.voteData.yeas}</div>
                                            <div className="text-[9px] text-slate-500 uppercase">Yeas</div>
                                        </div>
                                        <div className="text-slate-700 text-xl">/</div>
                                        <div className="text-center">
                                            <div className="text-xl font-black text-red-400">{session.voteData.nays}</div>
                                            <div className="text-[9px] text-slate-500 uppercase">Nays</div>
                                        </div>
                                    </div>
                                    {session.voteData.consensusScore !== undefined && (
                                        <div className="mt-2 text-center">
                                            <div className="text-amber-400 text-xs font-bold">{session.voteData.consensusLabel}</div>
                                            <div className="text-slate-500 text-[9px]">Confidence: {session.voteData.avgConfidence}/10</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Councilor status grid */}
                        <div className="mb-4">
                            <div className="text-[10px] text-slate-600 uppercase tracking-widest mb-2">Councilors ({session.councilors.length})</div>
                            <div className="space-y-1">
                                {session.councilors.map(c => (
                                    <div key={c.id} className="flex items-center gap-2 py-0.5">
                                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                            c.status === 'speaking' ? 'bg-cyan-400 animate-pulse' :
                                            c.status === 'done' ? 'bg-emerald-700' :
                                            'bg-slate-700'
                                        }`}></span>
                                        <span className={`text-[10px] truncate ${c.status === 'speaking' ? 'text-cyan-300 font-bold' : c.status === 'done' ? 'text-slate-500' : 'text-slate-500'}`}>
                                            {c.name}
                                        </span>
                                        <span className="text-[9px] text-slate-700 ml-auto truncate">{c.role}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-900 rounded p-2 text-center">
                                <div className="text-amber-400 font-black text-lg">{session.stats.messages}</div>
                                <div className="text-[9px] text-slate-600 uppercase">Messages</div>
                            </div>
                            <div className="bg-slate-900 rounded p-2 text-center">
                                <div className="text-slate-400 font-mono text-lg">{formatElapsed(session.elapsed)}</div>
                                <div className="text-[9px] text-slate-600 uppercase">Duration</div>
                            </div>
                            <div className="bg-slate-900 rounded p-2 text-center">
                                <div className="text-cyan-400 font-black text-lg">{speakingCouncilors.length}</div>
                                <div className="text-[9px] text-slate-600 uppercase">Active</div>
                            </div>
                            <div className="bg-slate-900 rounded p-2 text-center">
                                <div className="text-slate-400 font-black text-lg">{session.viewerCount}</div>
                                <div className="text-[9px] text-slate-600 uppercase">👁 Viewers</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
