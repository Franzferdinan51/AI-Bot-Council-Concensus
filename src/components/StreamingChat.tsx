import React, { useState, useEffect } from 'react';
import { measureStreamingText } from '../lib/pretext';

interface Message {
  id: string;
  role: 'councilor' | 'system';
  councilorName?: string;
  content: string;
  timestamp: Date;
}

interface StreamingChatProps {
  messages: Message[];
  containerWidth?: number;
}

export function StreamingChat({ messages, containerWidth = 600 }: StreamingChatProps) {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>({});

  // Pre-measure all complete messages
  useEffect(() => {
    const newHeights: Record<string, number> = {};
    
    messages.forEach((msg) => {
      if (!measuredHeights[msg.id]) {
        const dims = measureStreamingText(msg.content, containerWidth - 32, '15px Inter, system-ui, sans-serif', 22);
        newHeights[msg.id] = dims.height + 32; // padding
      }
    });

    if (Object.keys(newHeights).length > 0) {
      setMeasuredHeights((prev) => ({ ...prev, ...newHeights }));
    }
  }, [messages, containerWidth]);

  // Simulate streaming for demonstration
  useEffect(() => {
    if (messages.length > visibleMessages.length) {
      const newMsg = messages[messages.length - 1];
      
      // If this is a councilor message, stream it token by token
      if (newMsg.role === 'councilor' && !streamingId) {
        setStreamingId(newMsg.id);
        setStreamingContent('');
        
        const words = newMsg.content.split(' ');
        let currentIndex = 0;
        
        const interval = setInterval(() => {
          if (currentIndex < words.length) {
            setStreamingContent((prev) => prev + (prev ? ' ' : '') + words[currentIndex]);
            currentIndex++;
          } else {
            clearInterval(interval);
            setStreamingId(null);
            setStreamingContent('');
            setVisibleMessages((prev) => [...prev, newMsg]);
          }
        }, 50);
        
        return () => clearInterval(interval);
      } else {
        setVisibleMessages(messages);
      }
    }
  }, [messages, visibleMessages.length, streamingId]);

  // Measure streaming content height
  const streamingHeight = streamingContent
    ? measureStreamingText(streamingContent, containerWidth - 32, '15px Inter, system-ui, sans-serif', 22).height + 32
    : 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900">
      {visibleMessages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'councilor' ? 'justify-start' : 'justify-center'}`}
        >
          <div
            className={`max-w-[80%] rounded-lg p-4 ${
              msg.role === 'councilor'
                ? 'bg-gray-800 border border-gray-700'
                : 'bg-blue-900/50 border border-blue-700'
            }`}
            style={{ minHeight: measuredHeights[msg.id] || 60 }}
          >
            {msg.role === 'councilor' && msg.councilorName && (
              <div className="text-xs text-blue-400 mb-1 font-medium">{msg.councilorName}</div>
            )}
            <div className="text-gray-100 text-sm leading-relaxed whitespace-pre-wrap">
              {msg.content}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {msg.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
      ))}

      {/* Streaming message */}
      {streamingId && streamingContent && (
        <div className="flex justify-start">
          <div
            className="max-w-[80%] rounded-lg p-4 bg-gray-800 border border-gray-700"
            style={{ minHeight: streamingHeight }}
          >
            <div className="text-xs text-blue-400 mb-1 font-medium">
              {messages.find((m) => m.id === streamingId)?.councilorName}
            </div>
            <div className="text-gray-100 text-sm leading-relaxed whitespace-pre-wrap">
              {streamingContent}
              <span className="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-4">🏛️</div>
            <div className="text-lg">The Council Chamber awaits</div>
            <div className="text-sm mt-2">Submit a motion to begin deliberation</div>
          </div>
        </div>
      )}
    </div>
  );
}
