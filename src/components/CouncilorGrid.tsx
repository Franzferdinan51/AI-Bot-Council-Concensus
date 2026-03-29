import { useState, useMemo } from 'react';
import { councilors, specialists, CATEGORIES, Category } from '../data/councilors';
import { CouncilorCard } from './CouncilorCard';

interface CouncilorGridProps {
  selectedCouncilors: number[];
  onToggleCouncilor: (id: number) => void;
}

export function CouncilorGrid({ selectedCouncilors, onToggleCouncilor }: CouncilorGridProps) {
  const [category, setCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <div className="h-full flex flex-col bg-gray-900/50 rounded-xl border border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-gray-700/50 bg-gray-900/80">
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

      {/* Specialist Panel */}
      <div className="p-3 border-b border-gray-700/50 bg-gray-800/30">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Specialist Agents
        </h3>
        <div className="flex flex-wrap gap-2">
          {specialists.map((spec) => (
            <CouncilorCard
              key={spec.id}
              councilor={spec}
              isSpecialist
              isSelected={false}
              onClick={() => {}}
            />
          ))}
        </div>
      </div>

      {/* Councilor Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-2">
          {filteredCouncilors.map((councilor) => (
            <CouncilorCard
              key={councilor.id}
              councilor={councilor}
              isSelected={selectedCouncilors.includes(councilor.id)}
              onClick={() => onToggleCouncilor(councilor.id)}
            />
          ))}
        </div>

        {filteredCouncilors.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No councilors found matching your criteria
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t border-gray-700/50 bg-gray-900/80">
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
