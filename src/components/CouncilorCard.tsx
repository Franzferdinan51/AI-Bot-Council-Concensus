import React, { useState, useEffect } from 'react';
import { getCouncilorCardHeight } from '../lib/pretext';

export interface Councilor {
  id: string;
  name: string;
  role: string;
  personality: string;
  avatar?: string;
  model?: string;
  isActive?: boolean;
  isSpeaking?: boolean;
}

interface CouncilorCardProps {
  councilor: Councilor;
  isActive?: boolean;
  onSelect?: (councilor: Councilor) => void;
  containerWidth?: number;
}

export function CouncilorCard({ councilor, isActive = false, onSelect, containerWidth = 200 }: CouncilorCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [measuredHeight, setMeasuredHeight] = useState(120);

  // Animated entrance
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), Math.random() * 500);
    return () => clearTimeout(timer);
  }, []);

  // Pre-measure card content
  useEffect(() => {
    const dims = getCouncilorCardHeight(
      councilor.name,
      councilor.role,
      councilor.personality,
      containerWidth - 16
    );
    setMeasuredHeight(dims.height + 60); // padding + avatar
  }, [councilor, containerWidth]);

  // Generate avatar color from name
  const avatarColor = `hsl(${councilor.name.charCodeAt(0) * 13 % 360}, 60%, 50%)`;

  return (
    <div
      onClick={() => onSelect?.(councilor)}
      className={`
        relative rounded-lg p-3 cursor-pointer transition-all duration-300
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        ${isActive ? 'bg-blue-900/50 border-2 border-blue-500' : 'bg-gray-800 border border-gray-700 hover:border-gray-600'}
        ${councilor.isSpeaking ? 'ring-2 ring-green-400 animate-pulse' : ''}
      `}
      style={{ minHeight: measuredHeight }}
    >
      {/* Speaking indicator */}
      {councilor.isSpeaking && (
        <div className="absolute top-2 right-2 flex gap-0.5">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-green-400 rounded-full animate-bounce"
              style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      )}

      {/* Avatar */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: avatarColor }}
        >
          {councilor.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-100 truncate">{councilor.name}</div>
          <div className="text-xs text-gray-400 truncate">{councilor.role}</div>
        </div>
      </div>

      {/* Personality */}
      <div className="text-xs text-gray-400 leading-relaxed line-clamp-2">
        {councilor.personality}
      </div>

      {/* Model badge */}
      {councilor.model && (
        <div className="mt-2">
          <span className="inline-block px-2 py-0.5 bg-gray-700 rounded text-[10px] text-gray-400">
            {councilor.model}
          </span>
        </div>
      )}
    </div>
  );
}
