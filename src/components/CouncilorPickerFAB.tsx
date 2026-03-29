import { useState, useRef, useEffect } from 'react';
import { councilors } from '../data/councilors';

interface CouncilorPickerFABProps {
  selectedCouncilors: number[];
  onToggleCouncilor: (id: number) => void;
}

export function CouncilorPickerFAB({ selectedCouncilors, onToggleCouncilor }: CouncilorPickerFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Focus search when opened
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        const fabBtn = document.getElementById('fab-button');
        if (fabBtn && !fabBtn.contains(e.target as Node)) {
          setIsOpen(false);
        }
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filtered = councilors.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q);
  });

  return (
    <>
      {/* FAB Button */}
      <button
        id="fab-button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed bottom-24 right-6 z-50 w-14 h-14 rounded-2xl shadow-2xl
          flex items-center justify-center text-2xl
          transition-all duration-300
          ${isOpen
            ? 'bg-slate-700 text-white rotate-45 shadow-lg'
            : 'bg-gradient-to-br from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500 shadow-purple-500/30 hover:scale-105 submit-btn-glow'
          }
        `}
      >
        {isOpen ? '✕' : '👥'}
      </button>

      {/* Overlay Panel */}
      {isOpen && (
        <div
          ref={overlayRef}
          className="fixed bottom-40 right-6 z-50 w-80 max-h-[60vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-3 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="font-semibold text-sm text-white flex items-center gap-1.5">
                <span>👥</span> Councilor Picker
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {selectedCouncilors.length} selected
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Search */}
          <div className="p-2 border-b border-slate-800 flex-shrink-0">
            <input
              ref={searchRef}
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Quick actions */}
          <div className="px-2 py-1.5 flex gap-1 border-b border-slate-800 flex-shrink-0">
            <button
              onClick={() => councilors.forEach((c) => { if (!selectedCouncilors.includes(c.id)) onToggleCouncilor(c.id); })}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-slate-300 transition-colors"
            >
              Select All
            </button>
            <button
              onClick={() => selectedCouncilors.forEach((id) => onToggleCouncilor(id))}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-slate-300 transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Councilor list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filtered.slice(0, 20).map((c) => {
              const isSelected = selectedCouncilors.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => onToggleCouncilor(c.id)}
                  className={`
                    w-full p-2 rounded-lg flex items-center gap-2 transition-all text-left
                    ${isSelected
                      ? 'bg-slate-800 border border-slate-600'
                      : 'hover:bg-slate-800/50 border border-transparent'
                    }
                  `}
                >
                  <div
                    className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm ${isSelected ? 'councilor-avatar-glow' : ''}`}
                    style={{ backgroundColor: isSelected ? c.color : `${c.color}40` }}
                  >
                    {c.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">{c.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{c.category}</div>
                  </div>
                  {isSelected && (
                    <span className="text-green-400 text-sm">✓</span>
                  )}
                </button>
              );
            })}
            {filtered.length > 20 && (
              <p className="text-center text-xs text-slate-500 py-2">
                +{filtered.length - 20} more — use search
              </p>
            )}
            {filtered.length === 0 && (
              <p className="text-center text-xs text-slate-500 py-4">No matches</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
