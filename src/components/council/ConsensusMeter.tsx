interface Props {
  consensus: number;
  isDeliberating: boolean;
}

export function ConsensusMeter({ consensus, isDeliberating }: Props) {
  const getStatus = () => {
    if (consensus >= 80) return { label: 'Strong Consensus', color: '#22c55e', bg: 'bg-green-500' };
    if (consensus >= 60) return { label: 'Consensus Building', color: '#84cc16', bg: 'bg-lime-500' };
    if (consensus >= 40) return { label: 'Divided Council', color: '#facc15', bg: 'bg-yellow-500' };
    if (consensus >= 20) return { label: 'Strong Opposition', color: '#f97316', bg: 'bg-orange-500' };
    return { label: 'Motion Fails', color: '#ef4444', bg: 'bg-red-500' };
  };

  const status = getStatus();

  return (
    <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          📊 Consensus Meter
        </h3>
        {isDeliberating && (
          <span className="text-xs text-amber-400 animate-pulse">● Deliberating</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden mb-2">
        <div 
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
          style={{ 
            width: `${consensus}%`, 
            backgroundColor: status.color,
            boxShadow: `0 0 12px ${status.color}60`
          }}
        />
        {/* Animated shine */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          style={{ animation: 'shine 2s infinite' }}
        />
      </div>

      {/* Percentage */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span 
            className="text-2xl font-bold"
            style={{ color: status.color }}
          >
            {consensus}%
          </span>
          <span 
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: status.color + '20', color: status.color }}
          >
            {status.label}
          </span>
        </div>
        
        {/* Vote indicators */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-green-400 flex items-center gap-1">
            <span>✓</span>
            <span>{Math.round(consensus * 0.8)}%</span>
          </span>
          <span className="text-red-400 flex items-center gap-1">
            <span>✗</span>
            <span>{Math.round((100 - consensus) * 0.8)}%</span>
          </span>
        </div>
      </div>

      {/* Scale markers */}
      <div className="flex justify-between mt-2 text-[10px] text-slate-600">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>

      <style>{`
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
