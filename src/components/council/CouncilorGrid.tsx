import type { Councilor } from '../../types';

interface Props {
  councilors: Councilor[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export function CouncilorGrid({ councilors, selectedIds, onToggle }: Props) {
  return (
    <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          🏛️ Council Roster ({selectedIds.length} seated)
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => councilors.forEach(c => !selectedIds.includes(c.id) && onToggle(c.id))}
            className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-400"
          >
            All
          </button>
          <button
            onClick={() => selectedIds.forEach(id => onToggle(id))}
            className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-400"
          >
            None
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-2 max-h-[280px] overflow-y-auto hide-scrollbar">
        {councilors.map(councilor => {
          const isSelected = selectedIds.includes(councilor.id);
          return (
            <button
              key={councilor.id}
              onClick={() => onToggle(councilor.id)}
              className={`
                relative p-2 rounded-lg border text-left transition-all
                ${isSelected 
                  ? `${councilor.bgColor} ${councilor.borderColor} border-opacity-60` 
                  : 'bg-slate-800/50 border-slate-700/30 opacity-60 hover:opacity-80'
                }
                ${councilor.speaking ? 'ring-2 ring-amber-400/80 ring-offset-1 ring-offset-slate-900' : ''}
              `}
              title={`${councilor.name} — ${councilor.role}`}
            >
              {/* Speaking indicator */}
              {councilor.speaking && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse">
                  <audio />
                </div>
              )}
              
              <div className="text-center">
                <span className="text-xl block">{councilor.emoji}</span>
                <div 
                  className="text-[10px] font-bold mt-1 truncate" 
                  style={{ color: isSelected ? councilor.color : '#9ca3af' }}
                >
                  {councilor.name.split(' ')[0]}
                </div>
                <div className="text-[9px] text-slate-500 truncate">
                  {councilor.role}
                </div>
              </div>
              
              {/* Selection check */}
              {isSelected && (
                <div 
                  className="absolute top-1 left-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px]"
                  style={{ backgroundColor: councilor.color }}
                >
                  ✓
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
