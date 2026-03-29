import { useState, useMemo } from 'react';
import { councilors, CATEGORIES, Category, Councilor } from '../data/councilors';

interface CouncilorDrawerProps {
  open: boolean;
  onClose: () => void;
  selectedCouncilors: number[];
  onToggleCouncilor: (id: number) => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  'All': '🌐',
  'Original': '⚖️',
  'Business & Strategy': '📊',
  'Technical & Engineering': '💻',
  'User & Community': '👥',
  'Compliance & Legal': '⚖️',
  'Innovation & Culture': '💡',
  'Weather & Emergency': '🌤️',
  'Agriculture & Plant Science': '🌾',
  'Specialists': '🔬',
};

export function CouncilorDrawer({
  open, onClose, selectedCouncilors, onToggleCouncilor,
}: CouncilorDrawerProps) {
  const [filter, setFilter] = useState<Category>('All');
  const [search, setSearch] = useState('');
  const [detailCouncilor, setDetailCouncilor] = useState<Councilor | null>(null);

  const filtered = useMemo(() => {
    return councilors.filter((c) => {
      const matchesCategory = filter === 'All' || c.category === filter;
      const matchesSearch = !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.role.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [filter, search]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-80 bg-gray-900 border-l border-gray-700 z-50 flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex-none flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-lg">👥</span>
            <span className="font-semibold text-sm text-white">Councilors</span>
            <span className="text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded-full">
              {selectedCouncilors.length}/{councilors.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="flex-none px-4 py-2 border-b border-gray-800">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search councilors…"
            className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Category filter */}
        <div className="flex-none px-4 py-2 border-b border-gray-800 overflow-x-auto scrollbar-none">
          <div className="flex gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat as Category)}
                className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap"
                style={{
                  backgroundColor: filter === cat ? '#7c3aed33' : 'transparent',
                  borderWidth: 1,
                  borderColor: filter === cat ? '#7c3aed60' : '#374151',
                  color: filter === cat ? '#a78bfa' : '#6b7280',
                }}
              >
                <span>{CATEGORY_EMOJI[cat] || '•'}</span>
                <span>{cat}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Councilor list */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {filtered.length === 0 && (
            <div className="text-center text-gray-500 py-8 text-sm">No councilors match your search</div>
          )}
          {filtered.map((councilor) => {
            const isSelected = selectedCouncilors.includes(councilor.id);
            return (
              <button
                key={councilor.id}
                onClick={() => setDetailCouncilor(councilor)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
                  isSelected ? 'bg-purple-900/30' : 'hover:bg-gray-800'
                }`}
              >
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm"
                  style={{
                    backgroundColor: councilor.color,
                    boxShadow: isSelected ? `0 0 0 2px #1f2937, 0 0 0 4px ${councilor.color}` : undefined,
                  }}
                >
                  {councilor.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white truncate">{councilor.name}</span>
                    {isSelected && (
                      <span className="flex-shrink-0 text-purple-400 text-[10px]">✓</span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-500 truncate">{councilor.role}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleCouncilor(councilor.id); }}
                  className={`flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                    isSelected ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {isSelected ? '✓' : '+'}
                </button>
              </button>
            );
          })}
        </div>

        {/* Select All / Clear */}
        <div className="flex-none px-4 py-2 border-t border-gray-700 flex gap-2">
          <button
            onClick={() => {
              if (filter === 'All') {
                selectedCouncilors.length === councilors.length
                  ? selectedCouncilors.forEach(id => onToggleCouncilor(id))
                  : councilors.forEach(c => { if (!selectedCouncilors.includes(c.id)) onToggleCouncilor(c.id); });
              } else {
                const catCouncilors = councilors.filter(c => c.category === filter);
                const allSelected = catCouncilors.every(c => selectedCouncilors.includes(c.id));
                if (allSelected) {
                  catCouncilors.forEach(c => { if (selectedCouncilors.includes(c.id)) onToggleCouncilor(c.id); });
                } else {
                  catCouncilors.forEach(c => { if (!selectedCouncilors.includes(c.id)) onToggleCouncilor(c.id); });
                }
              }
            }}
            className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-medium text-gray-300 transition-colors"
          >
            {filter === 'All' && selectedCouncilors.length === councilors.length ? 'Clear All' :
              filter === 'All' ? 'Select All' :
              filtered.every(c => selectedCouncilors.includes(c.id)) ? `Clear ${filter}` : `Select ${filter}`}
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {detailCouncilor && (
        <>
          <div className="fixed inset-0 bg-black/60 z-60 backdrop-blur-sm" onClick={() => setDetailCouncilor(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-70 bg-gray-900 border border-gray-700 rounded-2xl p-5 w-72 shadow-2xl">
            <div className="flex flex-col items-center mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3"
                style={{
                  backgroundColor: detailCouncilor.color,
                  boxShadow: `0 0 0 3px #1f2937, 0 0 0 5px ${detailCouncilor.color}`,
                }}
              >
                {detailCouncilor.emoji}
              </div>
              <h3 className="font-bold text-white text-base">{detailCouncilor.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{detailCouncilor.role}</p>
              <span className="mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: `${detailCouncilor.color}25`, color: detailCouncilor.color }}>
                {detailCouncilor.category}
              </span>
            </div>
            <p className="text-sm text-gray-400 text-center mb-4 leading-relaxed">
              {detailCouncilor.description}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { onToggleCouncilor(detailCouncilor.id); setDetailCouncilor(null); }}
                className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-all ${
                  selectedCouncilors.includes(detailCouncilor.id)
                    ? 'bg-red-900/50 hover:bg-red-800/50 text-red-300 border border-red-800'
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                {selectedCouncilors.includes(detailCouncilor.id) ? 'Remove from Council' : 'Add to Council'}
              </button>
              <button
                onClick={() => setDetailCouncilor(null)}
                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm text-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
