import { useState, useMemo, useEffect, useRef } from 'react';
import { councilors, specialists, CATEGORIES, Category } from '../data/councilors';
import { CouncilorCard } from './CouncilorCard';
import { measureText } from '../lib/pretext';

interface CouncilorGridProps {
  selectedCouncilors: number[];
  onToggleCouncilor: (id: number) => void;
}

const GRID_PANEL_WIDTH = 312; // w-80 = 320px minus padding
const AVATAR_SIZE = 40;
const PADDING = 24;
const CARD_WIDTH = (GRID_PANEL_WIDTH - PADDING - 8) / 2; // 2 columns with gap

export function CouncilorGrid({ selectedCouncilors, onToggleCouncilor }: CouncilorGridProps) {
  const [category, setCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cardHeights, setCardHeights] = useState<Map<number, number>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(GRID_PANEL_WIDTH);

  // Measure container width
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth - PADDING);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const filteredCouncilors = useMemo(() => {
    let filtered = councilors;
    if (category !== 'All') {
      filtered = filtered.filter((c) => c.category === category);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.role.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [category, searchQuery]);

  // Pre-measure ALL councilor cards using pretext — no DOM reflow
  useEffect(() => {
    const halfWidth = (containerWidth - 8) / 2; // 2 columns
    const newHeights = new Map<number, number>();

    councilors.forEach((c) => {
      const text = `${c.name}\n${c.role}`;
      const { height } = measureText(text, halfWidth - 24, 13, 18);
      // Card = avatar row + name + role + padding + border
      newHeights.set(c.id, Math.max(80, height + 48));
    });

    setCardHeights(newHeights);
  }, [containerWidth]);

  // Calculate total grid height for scrollable area
  const gridTotalHeight = useMemo(() => {
    let total = 0;
    for (let i = 0; i < filteredCouncilors.length; i += 2) {
      const rowHeight = Math.max(
        cardHeights.get(filteredCouncilors[i]?.id) || 80,
        cardHeights.get(filteredCouncilors[i + 1]?.id) || 80
      );
      total += rowHeight + 8; // 8px gap
    }
    return total;
  }, [filteredCouncilors, cardHeights]);

  return (
    <div className="h-full flex flex-col bg-gray-900/50 rounded-xl border border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-gray-700/50 bg-gray-900/80 flex-shrink-0">
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span className="text-2xl">🏛️</span>
          AI Council
          <span className="text-xs bg-purple-500/30 px-2 py-0.5 rounded-full ml-auto">
            {councilors.length} + {specialists.length}
          </span>
        </h2>

        {/* Search */}
        <input
          type="text"
          placeholder="Search councilors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
        />

        {/* Category Filter */}
        <div className="flex flex-wrap gap-1 mt-3">
          {CATEGORIES.filter((c) => c !== 'Specialists').map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                category === cat
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Specialist Panel (fixed-height strip) */}
      <div className="p-3 border-b border-gray-700/50 bg-gray-800/30 flex-shrink-0">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Specialist Agents
        </h3>
        <div
          className="flex flex-wrap gap-2"
          style={{ maxHeight: 120, overflowY: 'auto' }}
        >
          {specialists.map((spec) => (
            <div key={spec.id} style={{ width: CARD_WIDTH, minHeight: 72 }}>
              <CouncilorCard
                councilor={spec}
                isSpecialist
                isSelected={false}
                onClick={() => {}}
                minHeight={72}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Councilor Grid - pre-measured heights, no layout shift */}
      <div ref={containerRef} className="flex-1 overflow-y-auto min-h-0">
        <div
          className="p-3 grid gap-2"
          style={{
            gridTemplateColumns: `repeat(2, 1fr)`,
            minHeight: gridTotalHeight || 'auto',
          }}
        >
          {filteredCouncilors.map((councilor) => {
            const height = cardHeights.get(councilor.id) || 80;
            return (
              <div key={councilor.id} style={{ minHeight: height }}>
                <CouncilorCard
                  councilor={councilor}
                  isSelected={selectedCouncilors.includes(councilor.id)}
                  onClick={() => onToggleCouncilor(councilor.id)}
                  minHeight={height}
                />
              </div>
            );
          })}
        </div>

        {filteredCouncilors.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No councilors found matching your criteria
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t border-gray-700/50 bg-gray-900/80 flex-shrink-0">
        <div className="flex justify-between text-xs text-gray-400">
          <span>
            Selected: <strong className="text-white">{selectedCouncilors.length}</strong>
          </span>
          <span>
            Showing: <strong className="text-white">{filteredCouncilors.length}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
