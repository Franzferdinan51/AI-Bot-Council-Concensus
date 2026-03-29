import { useEffect, useState } from 'react';

interface ConsensusTabProps {
  consensus: number;
  messages: Array<{
    id: string;
    role: 'councilor' | 'user' | 'system';
    councilorName?: string;
    councilorEmoji?: string;
    councilorColor?: string;
    content: string;
    timestamp: Date;
  }>;
}

export function ConsensusTab({ consensus, messages }: ConsensusTabProps) {
  const [displayConsensus, setDisplayConsensus] = useState(0);
  const [animatedColor, setAnimatedColor] = useState('#EF4444');
  const [pulseClass, setPulseClass] = useState('');

  useEffect(() => {
    const duration = 800;
    const start = displayConsensus;
    const diff = consensus - start;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayConsensus(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [consensus]);

  useEffect(() => {
    if (displayConsensus >= 85) {
      setAnimatedColor('#22C55E');
      setPulseClass('animate-pulse');
    } else if (displayConsensus >= 66) {
      setAnimatedColor('#F59E0B');
      setPulseClass('');
    } else if (displayConsensus >= 33) {
      setAnimatedColor('#F97316');
      setPulseClass('');
    } else {
      setAnimatedColor('#EF4444');
      setPulseClass('');
    }
  }, [displayConsensus]);

  const getStatusText = () => {
    if (displayConsensus >= 85) return 'Strong Consensus — Ready for Action';
    if (displayConsensus >= 66) return 'Moderate Agreement — Proceed with Caution';
    if (displayConsensus >= 33) return 'Divided Opinion — Further Deliberation Needed';
    return 'No Consensus — Continue Debate';
  };

  const getStatusIcon = () => {
    if (displayConsensus >= 85) return '✅';
    if (displayConsensus >= 66) return '⚠️';
    if (displayConsensus >= 33) return '🔄';
    return '❌';
  };

  const gaugeSize = 240;
  const strokeWidth = 16;
  const radius = (gaugeSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcAngle = (displayConsensus / 100) * 270;
  const dashOffset = circumference - (arcAngle / 360) * circumference;

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Large Consensus Gauge */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-8 flex flex-col items-center">
          <h2 className="text-lg font-semibold text-white mb-6">Council Consensus</h2>

          {/* SVG Gauge */}
          <div className="relative" style={{ width: gaugeSize, height: gaugeSize }}>
            <svg
              width={gaugeSize}
              height={gaugeSize}
              className="transform -rotate-[135deg]"
            >
              <circle
                cx={gaugeSize / 2}
                cy={gaugeSize / 2}
                r={radius}
                fill="none"
                stroke="#1E293B"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={0}
                strokeLinecap="round"
              />
              <circle
                cx={gaugeSize / 2}
                cy={gaugeSize / 2}
                r={radius}
                fill="none"
                stroke={animatedColor}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                style={{
                  filter: `drop-shadow(0 0 12px ${animatedColor}60)`,
                  transition: 'stroke-dashoffset 0.5s ease-out, stroke 0.3s ease',
                }}
              />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl mb-1">{getStatusIcon()}</span>
              <span
                className={`text-5xl font-bold ${pulseClass}`}
                style={{ color: animatedColor }}
              >
                {displayConsensus}%
              </span>
              <span className="text-xs text-slate-400 mt-1">
                {messages.filter((m) => m.role === 'councilor').length} councilors deliberated
              </span>
            </div>
          </div>

          {/* Status text */}
          <div className="mt-6 text-center">
            <p className="text-white font-medium">{getStatusText()}</p>
            <div className="mt-3 flex items-center gap-2 justify-center">
              <div
                className="h-1 w-16 rounded-full consensus-bar-shimmer"
                style={{ backgroundColor: animatedColor }}
              />
              <span className="text-xs text-slate-500">Consensus Level</span>
            </div>
          </div>
        </div>

        {/* Threshold Guide */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Consensus Thresholds</h3>
          <div className="space-y-2">
            {[
              { min: 85, color: '#22C55E', label: 'Strong Consensus', desc: 'Ready for action' },
              { min: 66, color: '#F59E0B', label: 'Moderate', desc: 'Proceed with caution' },
              { min: 33, color: '#F97316', label: 'Divided', desc: 'Further deliberation' },
              { min: 0, color: '#EF4444', label: 'No Consensus', desc: 'Continue debate' },
            ].map((t) => (
              <div key={t.min} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
                <span className="text-sm text-white flex-1">{t.label}</span>
                <span className="text-xs text-slate-500">{t.desc}</span>
                <span className="text-xs font-mono text-slate-400">≥{t.min}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Deliberation History */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <span>📜</span> Deliberation History
            </h3>
          </div>
          <div className="divide-y divide-slate-800/50 max-h-80 overflow-y-auto">
            {messages.filter((m) => m.role === 'councilor').length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <span className="text-3xl mb-2 block">🏛️</span>
                <p>No deliberation history yet</p>
                <p className="text-xs mt-1">Submit a motion to begin</p>
              </div>
            ) : (
              messages
                .filter((m) => m.role === 'councilor')
                .map((msg) => (
                  <div key={msg.id} className="p-3 flex items-start gap-3">
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                      style={{ backgroundColor: msg.councilorColor || '#1E293B' }}
                    >
                      {msg.councilorEmoji || '🏛️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold" style={{ color: msg.councilorColor }}>
                          {msg.councilorName}
                        </span>
                        <span className="text-xs text-slate-500">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{msg.content}</p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
