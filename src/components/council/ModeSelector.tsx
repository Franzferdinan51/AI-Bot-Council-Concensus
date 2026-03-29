import type { DeliberationMode } from '../../types';

interface Props {
  mode: DeliberationMode;
  onChange: (mode: DeliberationMode) => void;
  disabled?: boolean;
}

const MODES: { id: DeliberationMode; emoji: string; name: string; desc: string }[] = [
  { id: 'legislative', emoji: '⚖️', name: 'Legislative', desc: 'Formal debate & voting' },
  { id: 'research', emoji: '🔬', name: 'Deep Research', desc: 'Multi-vector investigation' },
  { id: 'swarm', emoji: '🐝', name: 'Swarm Coding', desc: 'Parallel implementation' },
];

export function ModeSelector({ mode, onChange, disabled }: Props) {
  return (
    <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 p-3">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        Session Mode
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            disabled={disabled}
            className={`
              p-3 rounded-xl border text-center transition-all
              ${mode === m.id
                ? 'bg-amber-500/20 border-amber-500/60 text-white'
                : 'bg-slate-800/50 border-slate-700/30 text-slate-400 hover:bg-slate-800 hover:border-slate-600'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="text-2xl mb-1">{m.emoji}</div>
            <div className="text-xs font-semibold">{m.name}</div>
            <div className="text-[10px] mt-0.5 opacity-70">{m.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
