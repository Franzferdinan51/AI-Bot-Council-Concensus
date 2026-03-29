interface ConsensusMeterProps {
  consensus: number;
}

export function ConsensusMeter({ consensus }: ConsensusMeterProps) {
  const getColor = () => {
    if (consensus >= 85) return '#22C55E';
    if (consensus >= 66) return '#F59E0B';
    if (consensus >= 33) return '#F97316';
    if (consensus > 0) return '#EF4444';
    return '#6B7280';
  };

  const getStatus = () => {
    if (consensus >= 85) return 'Strong Consensus';
    if (consensus >= 66) return 'Moderate Agreement';
    if (consensus >= 33) return 'Divided Opinion';
    if (consensus > 0) return 'Building Consensus';
    return 'Awaiting Deliberation';
  };

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Consensus Meter</h3>
        <span className="text-2xl font-bold" style={{ color: getColor() }}>
          {consensus}%
        </span>
      </div>
      <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${consensus}%`, backgroundColor: getColor() }}
        />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getColor() }} />
        <span className="text-xs text-gray-400">{getStatus()}</span>
      </div>
    </div>
  );
}
