import { useState, useEffect, useRef, useCallback } from 'react';
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

interface StreamingChatProps {
  messages: Message[];
  currentStreamingId: string | null;
}

export function StreamingChat({ messages, currentStreamingId }: StreamingChatProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const [messageHeights, setMessageHeights] = useState<Map<string, number>>(new Map());

  // Measure container width
  useEffect(() => {
    const measureWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth - 32);
      }
    };

    measureWidth();
    window.addEventListener('resize', measureWidth);
    return () => window.removeEventListener('resize', measureWidth);
  }, []);

  // Measure all messages using pretext
  useEffect(() => {
    const newHeights = new Map<string, number>();

    messages.forEach((msg) => {
      const content = msg.content || '...';
      const width = containerWidth - 80; // Account for padding and avatar
      const { height } = measureText(content, width, 15, 22);
      newHeights.set(msg.id, Math.max(60, height + 40));
    });

    setMessageHeights(newHeights);
  }, [messages, containerWidth]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, messageHeights]);

  const isStreaming = (id: string) => currentStreamingId === id;

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
    >
      <div className="p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <span className="text-6xl mb-4">🏛️</span>
            <p className="text-lg font-medium">AI Council Chamber</p>
            <p className="text-sm mt-2">Submit a motion to begin deliberation</p>
          </div>
        )}

        {messages.map((msg) => {
          const height = messageHeights.get(msg.id) || 80;
          const streaming = isStreaming(msg.id);

          return (
            <div
              key={msg.id}
              className="flex gap-3 animate-in slide-in-from-bottom-2 duration-300"
              style={{ minHeight: height }}
            >
              {/* Avatar / Role indicator */}
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl"
                style={{
                  backgroundColor: msg.councilorColor || (msg.role === 'user' ? '#3B82F6' : '#1F2937'),
                }}
              >
                {msg.role === 'user' ? '👤' : msg.councilorEmoji || '🏛️'}
              </div>

              {/* Message content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span
                    className="font-semibold text-sm"
                    style={{ color: msg.councilorColor || '#fff' }}
                  >
                    {msg.role === 'user' ? 'You' : msg.councilorName || 'System'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {streaming && (
                    <span className="flex items-center gap-1 text-xs text-purple-400">
                      <span className="animate-pulse">●</span>
                      Streaming
                    </span>
                  )}
                </div>

                <div
                  className={`prose prose-sm max-w-none text-gray-200 ${
                    streaming ? 'animate-pulse' : ''
                  }`}
                  style={{
                    minHeight: height - 50,
                    lineHeight: '22px',
                  }}
                >
                  {msg.content}
                  {streaming && (
                    <span className="inline-block w-2 h-4 bg-purple-400 ml-1 animate-bounce" />
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
