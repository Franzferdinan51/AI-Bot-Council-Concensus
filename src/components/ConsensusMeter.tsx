import { useEffect, useState } from 'react';

interface ConsensusMeterProps {
  consensus: number; // 0-100
  label?: string;
  thresholds?: {
    low: number;
    medium: number;
    high: number;
  };
}

export function ConsensusMeter({
  consensus,
  label = 'Consensus',
  thresholds = { low: 33, medium: 66, high: 85 },
}: ConsensusMeterProps) {
  const [displayConsensus, setDisplayConsensus] = useState(0);
  const [animatedColor, setAnimatedColor] = useState('#EF4444');

  // Animate the consensus value
  useEffect(() => {
    const duration = 800;
    const start = displayConsensus;
    const diff = consensus - start;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayConsensus(Math.round(start + diff * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [consensus]);

  // Update color based on consensus level
  useEffect(() => {
    let color = '#EF4444'; // Red
    if (displayConsensus >= thresholds.high) {
      color = '#22C55E'; // Green
    } else if (displayConsensus >= thresholds.medium) {
      color = '#F59E0B'; // Amber
    } else if (displayConsensus >= thresholds.low) {
      color = '#EF4444'; // Red
    }
    setAnimatedColor(color);
  }, [displayConsensus, thresholds]);

  const getStatusText = () => {
    if (displayConsensus >= thresholds.high) return 'Strong Consensus';
    if (displayConsensus >= thresholds.medium) return 'Moderate Agreement';
    if (displayConsensus >= thresholds.low) return 'Divided Opinion';
    return 'No Consensus';
  };

  const getPulseClass = () => {
    if (displayConsensus >= thresholds.high) return 'animate-pulse';
    return '';
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <span
          className={`text-2xl font-bold ${getPulseClass()}`}
          style={{ color: animatedColor }}
        >
          {displayConsensus}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${displayConsensus}%`,
            backgroundColor: animatedColor,
            boxShadow: `0 0 10px ${animatedColor}50`,
          }}
        />
      </div>

      {/* Status text */}
      <div className="mt-2 flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: animatedColor }}
        />
        <span className="text-xs text-gray-400">{getStatusText()}</span>
      </div>

      {/* Threshold markers */}
      <div className="mt-3 flex justify-between text-[10px] text-gray-500">
        <span>0%</span>
        <span className="text-amber-500">{thresholds.low}%</span>
        <span className="text-green-500">{thresholds.high}%</span>
        <span>100%</span>
      </div>
    </div>
  );
}
