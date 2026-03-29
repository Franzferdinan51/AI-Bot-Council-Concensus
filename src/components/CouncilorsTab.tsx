import { useState, useMemo, useEffect, useRef } from 'react';
import { councilors, specialists, CATEGORIES, Category } from '../data/councilors';
import { CouncilorCard } from './CouncilorCard';
import { measureText } from '../lib/pretext';

interface CouncilorsTabProps {
  selectedCouncilors: number[];
  onToggleCouncilor: (id: number) => void;
}

const LINE_HEIGHT = 18;

export function CouncilorsTab({ selectedCouncilors, onToggleCouncilor }: CouncilorsTabProps) {
  const [category, setCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cardHeights, setCardHeights] = useState<Map<number, number>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth - 48);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Pre-measure all councilor cards using pretext
  useEffect(() => {
    const columnWidth = (containerWidth - 24) / 4;
    const newHeights = new Map<number, number>();

    councilors.forEach((c) => {
      const text = `${c.name}\n${c.role}`;
      const { height } = measureText(text, columnWidth - 24, 13, LINE_HEIGHT);
      newHeights.set(c.id, Math.max(80, height + 52));
    });

    setCardHeights(newHeights);
  }, [containerWidth]);

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
          c.role.toLowerCase().includes(query) ||
          c.category.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [category, searchQuery]);

  return (
    <div className="h-full flex flex-col">
      {/* Filters Header */}
      <div className="flex-none p-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Search councilors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-400">
              <strong className="text-white">{selectedCouncilors.length}</strong> selected
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">
              <strong className="text-white">{filteredCouncilors.length}</strong> shown
            </span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mt-3">
          {CATEGORIES.filter((c) => c !== 'Specialists').map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                ${category === cat
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Councilor Grid */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 min-h-0">
        {filteredCouncilors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <span className="text-5xl mb-4">🔍</span>
            <p>No councilors found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(${(containerWidth - 72) / 4}px, 1fr))`,
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
        )}
      </div>

      {/* Specialists Strip */}
      <div className="flex-none p-4 border-t border-slate-800 bg-slate-900/50">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>🔬</span> Specialist Agents
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {specialists.map((spec) => (
            <div
              key={spec.id}
              className="flex-shrink-0 w-48 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{spec.emoji}</span>
                <span className="font-semibold text-sm text-white">{spec.name}</span>
              </div>
              <p className="text-xs text-slate-400">{spec.role}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
