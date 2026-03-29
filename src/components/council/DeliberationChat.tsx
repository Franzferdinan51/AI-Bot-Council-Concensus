import { useEffect, useRef } from 'react';
import type { Message } from '../../types';

interface Props {
  messages: Message[];
  isDeliberating: boolean;
}

export function DeliberationChat({ messages, isDeliberating }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-700/30">
        <div className="text-center text-slate-500 p-8">
          <div className="text-5xl mb-4">🏛️</div>
          <div className="text-lg font-medium">The Council Chamber awaits</div>
          <div className="text-sm mt-2">Submit a motion to begin deliberation</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto hide-scrollbar bg-slate-900/50 rounded-xl border border-slate-700/30 p-4 space-y-4"
    >
      {messages.map(msg => {
        const isUser = msg.role === 'user';
        const isSystem = msg.role === 'system';
        
        if (isSystem) {
          return (
            <div key={msg.id} className="flex justify-center">
              <div className="bg-slate-800/80 rounded-xl px-4 py-3 text-center max-w-[90%] border border-slate-700/50">
                <div className="text-sm text-slate-300 whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          );
        }

        if (isUser) {
          return (
            <div key={msg.id} className="flex justify-end">
              <div className="bg-amber-600/90 rounded-2xl rounded-br-md px-4 py-3 max-w-[80%]">
                <div className="text-sm text-white font-medium mb-1">You</div>
                <div className="text-sm text-white/90 whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          );
        }

        // Councilor message
        return (
          <div key={msg.id} className="flex items-start gap-3">
            {/* Avatar */}
            <div 
              className="flex-none w-10 h-10 rounded-full flex items-center justify-center text-lg"
              style={{ backgroundColor: msg.councilorColor + '20', border: `2px solid ${msg.councilorColor}` }}
            >
              {msg.councilorEmoji}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span 
                  className="text-sm font-bold"
                  style={{ color: msg.councilorColor }}
                >
                  {msg.councilorName}
                </span>
                {msg.streaming && (
                  <span className="text-xs text-amber-400 animate-pulse">● Speaking...</span>
                )}
              </div>
              <div 
                className="rounded-2xl rounded-tl-md px-4 py-3"
                style={{ backgroundColor: msg.councilorColor + '15', borderLeft: `3px solid ${msg.councilorColor}` }}
              >
                <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                  {msg.streaming && (
                    <span className="inline-block w-2 h-4 bg-amber-400 ml-1 animate-pulse" />
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Loading indicator */}
      {isDeliberating && (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-lg animate-pulse">
            🏛️
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div 
                key={i}
                className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      )}
      
      <div ref={bottomRef} />
    </div>
  );
}
