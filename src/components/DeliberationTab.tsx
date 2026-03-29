import { useEffect, useRef, useState, useCallback } from 'react';
import { ParticleBackground } from './ParticleBackground';
import { measureText, createStreamingMeasurer } from '../lib/pretext';

interface Message {
  id: string;
  role: 'councilor' | 'user' | 'system';
  councilorName?: string;
  councilorEmoji?: string;
  councilorColor?: string;
  content: string;
  timestamp: Date;
}

interface DeliberationTabProps {
  messages: Message[];
  currentStreamingId: string | null;
}

export function DeliberationTab({ messages, currentStreamingId }: DeliberationTabProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const [messageHeights, setMessageHeights] = useState<Map<string, number>>(new Map());
  const streamingMeasurers = useRef<Map<string, ReturnType<typeof createStreamingMeasurer>>>(new Map());

  // Measure container width
  useEffect(() => {
    const measureWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth - 48);
      }
    };
    measureWidth();
    window.addEventListener('resize', measureWidth);
    return () => window.removeEventListener('resize', measureWidth);
  }, []);

  // Pre-measure completed messages using pretext
  useEffect(() => {
    const contentWidth = Math.max(containerWidth - 80, 200);

    messages.forEach((msg) => {
      if (msg.content && msg.id !== currentStreamingId) {
        const { height } = measureText(msg.content, contentWidth, 15, 22);
        const reservedHeight = Math.max(70, height + 52);
        setMessageHeights((prev) => {
          const next = new Map(prev);
          next.set(msg.id, reservedHeight);
          return next;
        });
      }
    });
  }, [messages, containerWidth, currentStreamingId]);

  // Update streaming message height in real-time — no reflow
  useEffect(() => {
    if (!currentStreamingId) {
      streamingMeasurers.current.delete(currentStreamingId || '');
      return;
    }

    const msg = messages.find((m) => m.id === currentStreamingId);
    if (!msg || !msg.content) return;

    const contentWidth = Math.max(containerWidth - 80, 200);

    if (!streamingMeasurers.current.has(currentStreamingId)) {
      streamingMeasurers.current.set(
        currentStreamingId,
        createStreamingMeasurer(contentWidth, 15, 22)
      );
    }

    const measurer = streamingMeasurers.current.get(currentStreamingId)!;
    const streamingHeight = measurer.append(msg.content);
    const reservedHeight = Math.max(70, streamingHeight + 52);

    setMessageHeights((prev) => {
      const next = new Map(prev);
      next.set(currentStreamingId, reservedHeight);
      return next;
    });
  }, [messages, currentStreamingId, containerWidth]);

  // Auto-scroll
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, messageHeights]);

  const isStreaming = useCallback((id: string) => currentStreamingId === id, [currentStreamingId]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
      style={{
        background: 'linear-gradient(180deg, rgba(15,23,42,1) 0%, rgba(30,41,59,0.5) 100%)',
      }}
    >
      {/* Particle Background */}
      <ParticleBackground />

      <div className="relative z-10 max-w-3xl mx-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <span className="text-7xl mb-6 opacity-50">🏛️</span>
            <h2 className="text-2xl font-bold text-white mb-2">AI Council Chamber</h2>
            <p className="text-slate-400 max-w-md">
              Submit a motion using the input below to begin deliberation with the council.
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <span>Powered by @chenglou/pretext — Zero-reflow text measurement</span>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const height = messageHeights.get(msg.id) || 80;
          const streaming = isStreaming(msg.id);
          const isUser = msg.role === 'user';
          const isSystem = msg.role === 'system';

          return (
            <div
              key={msg.id}
              className={`flex gap-4 message-enter ${isUser ? 'flex-row-reverse' : ''}`}
              style={{ minHeight: height }}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-lg ${msg.role === 'councilor' ? 'councilor-avatar-glow' : ''}`}
                style={{
                  backgroundColor: msg.councilorColor || (isUser ? '#3B82F6' : '#1E293B'),
                  boxShadow: msg.councilorColor ? `0 0 20px ${msg.councilorColor}30` : undefined,
                }}
              >
                {isUser ? '👤' : msg.councilorEmoji || '🏛️'}
              </div>

              {/* Content */}
              <div className={`flex-1 min-w-0 ${isUser ? 'text-right' : ''}`}>
                {/* Header */}
                <div className={`flex items-baseline gap-2 mb-2 ${isUser ? 'flex-row-reverse' : ''}`}>
                  <span
                    className="font-semibold text-sm"
                    style={{ color: msg.councilorColor || '#fff' }}
                  >
                    {isUser ? 'You' : msg.councilorName || 'System'}
                  </span>
                  <span className="text-xs text-slate-500">{formatTime(msg.timestamp)}</span>
                  {streaming && (
                    <span className="flex items-center gap-1 text-xs text-purple-400">
                      <span className="animate-pulse">●</span>
                      <span className="shimmer-text px-1.5 py-0.5 rounded">Thinking…</span>
                    </span>
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`
                    inline-block text-left px-4 py-3 rounded-2xl text-sm leading-relaxed
                    ${isUser ? 'bg-blue-600 text-white rounded-tr-sm' : ''}
                    ${isSystem ? 'bg-slate-800/80 text-slate-200 border border-slate-700/50 shimmer-text' : ''}
                    ${msg.role === 'councilor' ? 'bg-slate-800/60 text-slate-200 border border-slate-700/30' : ''}
                  `}
                  style={{
                    minHeight: height - 52,
                    maxWidth: '100%',
                  }}
                >
                  {msg.content}
                  {streaming && (
                    <span className="inline-block w-2 h-3.5 bg-purple-400 ml-1 animate-bounce vertical-align-middle" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
