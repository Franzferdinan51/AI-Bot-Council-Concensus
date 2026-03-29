import React, { useEffect, useState } from 'react';

interface ConsensusMeterProps {
  consensus: number; // 0-100
  votes?: {
    inFavor: number;
    against: number;
    abstain: number;
  };
  phase?: 'voting' | 'deliberating' | 'complete';
}

export function ConsensusMeter({ consensus, votes, phase = 'complete' }: ConsensusMeterProps) {
  const [displayConsensus, setDisplayConsensus] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animate consensus changes
  useEffect(() => {
    if (consensus !== displayConsensus) {
      setIsAnimating(true);
      const diff = consensus - displayConsensus;
      const step = diff > 0 ? 1 : -1;
      const interval = setInterval(() => {
        setDisplayConsensus((prev) => {
          const next = prev + step;
          if ((step > 0 && next >= consensus) || (step < 0 && next <= consensus)) {
            clearInterval(interval);
            setIsAnimating(false);
            return consensus;
          }
          return next;
        });
      }, 20);
      return () => clearInterval(interval);
    }
  }, [consensus, displayConsensus]);

  // Color transitions based on consensus level
  const getColor = (value: number) => {
    if (value < 33) return { bg: 'bg-red-500', text: 'text-red-400', glow: 'shadow-red-500/50' };
    if (value < 66) return { bg: 'bg-yellow-500', text: 'text-yellow-400', glow: 'shadow-yellow-500/50' };
    return { bg: 'bg-green-500', text: 'text-green-400', glow: 'shadow-green-500/50' };
  };

  const colors = getColor(displayConsensus);

  // Phase indicator
  const phaseLabels = {
    voting: { text: 'Voting in Progress', emoji: '🗳️' },
    deliberating: { text: 'Council Delibering', emoji: '💭' },
    complete: { text: 'Consensus Reached', emoji: '✓' },
  };

  return (
    <div className="p-4 bg-gray-900 border-t border-gray-800">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">Consensus Meter</span>
        <span className={`text-xs ${colors.text} flex items-center gap-1`}>
          <span>{phaseLabels[phase].emoji}</span>
          {phaseLabels[phase].text}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative mb-3">
        <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.bg} transition-all duration-300 ease-out ${isAnimating ? '' : ''}`}
            style={{ width: `${displayConsensus}%` }}
          />
        </div>
        
        {/* Percentage display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-bold ${colors.text}`}>
            {displayConsensus}%
          </span>
        </div>
      </div>

      {/* Glow effect */}
      <div
        className={`h-1 rounded-full ${colors.bg} opacity-60 blur-sm mb-3`}
        style={{ width: `${displayConsensus}%`, marginLeft: `${100 - displayConsensus}%` }}
      />

      {/* Vote breakdown */}
      {votes && (
        <div className="flex justify-between text-xs">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-400">In Favor: {votes.inFavor}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-gray-400">Against: {votes.against}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-500" />
            <span className="text-gray-400">Abstain: {votes.abstain}</span>
          </div>
        </div>
      )}
    </div>
  );
}
