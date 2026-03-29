import { useEffect, useRef, useState } from 'react';
import { CanvasParticleBackground } from './CanvasParticleBackground';
import { CanvasMessageRenderer } from './CanvasMessageRenderer';
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [containerWidth, setContainerWidth] = useState(800);
  const [messageHeights, setMessageHeights] = useState<Map<string, number>>(new Map());
  const streamingMeasurers = useRef<Map<string, ReturnType<typeof createStreamingMeasurer>>>(new Map());

  // Measure container dimensions
  useEffect(() => {
    const measureSize = () => {
      if (scrollContainerRef.current) {
        const rect = scrollContainerRef.current.getBoundingClientRect();
        setContainerSize({
          width: scrollContainerRef.current.clientWidth,
          height: scrollContainerRef.current.clientHeight,
        });
        setContainerWidth(scrollContainerRef.current.clientWidth);
      }
    };
    measureSize();
    window.addEventListener('resize', measureSize);
    return () => window.removeEventListener('resize', measureSize);
  }, []);



  // Pre-measure completed messages using pretext (for scroll height)
  useEffect(() => {
    const contentWidth = Math.max(containerWidth - 120, 200);

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

  // Streaming measurer update
  useEffect(() => {
    if (!currentStreamingId) return;

    const msg = messages.find((m) => m.id === currentStreamingId);
    if (!msg || !msg.content) return;

    const contentWidth = Math.max(containerWidth - 120, 200);

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
    if (containerSize.width === 0) return;
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
  }, [messages, messageHeights, containerSize]);


  return (
    <div
      ref={scrollContainerRef}
      className="relative h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
      style={{
        background: 'linear-gradient(180deg, rgba(15,23,42,1) 0%, rgba(30,41,59,0.5) 100%)',
      }}
    >
      {/* Particle Background — scrolls with content */}
      <CanvasParticleBackground />

      {/* Canvas Message Renderer — scrolls with content, offset by scrollTop */}
      <CanvasMessageRenderer
        messages={messages}
        currentStreamingId={currentStreamingId}
        containerWidth={containerSize.width}
        containerHeight={messages.length > 0 ? undefined : containerSize.height}
      />

      {/* DOM layer for scroll height reservation + empty state */}
      <div className="relative z-10 max-w-3xl mx-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[70vh] text-center">
            <span className="text-7xl mb-6 opacity-40 animate-pulse">🏛️</span>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              AI Council Chamber
            </h2>
            <p className="text-slate-400 max-w-md mt-3">
              Submit a motion using the input below to begin deliberation with the council.
            </p>
            <div className="mt-8 flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <span>Canvas particle text — powered by @chenglou/pretext</span>
            </div>
          </div>
        )}

        {/* Invisible height reservation */}
        <div className="space-y-6">
          {messages.map((msg) => {
            const height = messageHeights.get(msg.id) || 80;
            return (
              <div
                key={msg.id}
                style={{ minHeight: height, opacity: 0, pointerEvents: 'none', height: 1 }}
                aria-hidden="true"
              />
            );
          })}
        </div>
      </div>

      {/* Streaming indicator */}
      {currentStreamingId && (
        <div className="fixed bottom-28 right-6 z-30 flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 rounded-full border border-purple-500/30 shadow-lg shadow-purple-500/10 backdrop-blur-sm">
          <span className="flex gap-0.5">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
          <span className="text-xs text-purple-300 font-medium">Council deliberating...</span>
        </div>
      )}
    </div>
  );
}
