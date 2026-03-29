import React from 'react';
import { CouncilorCard, Councilor } from './CouncilorCard';

interface CouncilorGridProps {
  councilors: Councilor[];
  activeCouncilorId?: string;
  speakingCouncilorId?: string;
  onCouncilorSelect?: (councilor: Councilor) => void;
  containerWidth?: number;
}

export function CouncilorGrid({
  councilors,
  activeCouncilorId,
  speakingCouncilorId,
  onCouncilorSelect,
  containerWidth = 280,
}: CouncilorGridProps) {
  // Calculate grid columns based on container width
  const columns = containerWidth > 300 ? 2 : 1;
  const cardWidth = (containerWidth - 16 - (columns - 1) * 12) / columns;

  return (
    <div className="h-full overflow-y-auto p-3 bg-gray-950">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-300">Council Members</h2>
        <span className="text-xs text-gray-500">{councilors.length} seated</span>
      </div>
      
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {councilors.map((councilor) => (
          <CouncilorCard
            key={councilor.id}
            councilor={{
              ...councilor,
              isSpeaking: councilor.id === speakingCouncilorId,
            }}
            isActive={councilor.id === activeCouncilorId}
            onSelect={onCouncilorSelect}
            containerWidth={cardWidth}
          />
        ))}
      </div>
    </div>
  );
}
