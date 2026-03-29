import { useState } from 'react';
import { DeliberationModeId, deliberationModes } from '../data/councilors';

interface MotionInputProps {
  onSubmit: (motion: string, mode: DeliberationModeId, selectedCouncilors: number[]) => void;
  disabled?: boolean;
  selectedCouncilors: number[];
}

export function MotionInput({ onSubmit, disabled, selectedCouncilors }: MotionInputProps) {
  const [motion, setMotion] = useState('');
  const [mode, setMode] = useState<DeliberationModeId>('DELIBERATION');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (motion.trim() && selectedCouncilors.length > 0) {
      onSubmit(motion.trim(), mode, selectedCouncilors);
      setMotion('');
    }
  };

  const canSubmit = motion.trim().length > 0 && selectedCouncilors.length > 0;

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-700/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">📜</span>
          <span className="font-semibold text-white">Submit Motion</span>
          {selectedCouncilors.length > 0 && (
            <span className="text-xs bg-purple-500/30 px-2 py-0.5 rounded-full text-purple-300">
              {selectedCouncilors.length} councilors
            </span>
          )}
        </div>
        <span className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Expanded Form */}
      {isExpanded && (
        <form onSubmit={handleSubmit} className="p-4 pt-0 space-y-4">
          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Deliberation Mode
            </label>
            <div className="flex flex-wrap gap-2">
              {deliberationModes.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${
                      mode === m.id
                        ? 'text-white scale-105'
                        : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600'
                    }
                  `}
                  style={{
                    backgroundColor: mode === m.id ? `${m.color}40` : undefined,
                    borderWidth: mode === m.id ? 1 : 0,
                    borderColor: mode === m.id ? m.color : undefined,
                  }}
                >
                  {m.icon} {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Motion Input */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Motion / Proposal
            </label>
            <textarea
              value={motion}
              onChange={(e) => setMotion(e.target.value)}
              placeholder="Enter your motion or proposal for the council to deliberate..."
              disabled={disabled}
              className="w-full h-32 px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none transition-colors disabled:opacity-50"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!canSubmit || disabled}
            className={`
              w-full py-3 rounded-lg font-semibold transition-all
              ${
                canSubmit && !disabled
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/25'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {disabled ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⚙️</span>
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                ⚖️ Submit to Council
              </span>
            )}
          </button>

          {/* Validation Messages */}
          {selectedCouncilors.length === 0 && (
            <p className="text-xs text-amber-500 text-center">
              ⚠️ Select at least one councilor to deliberate
            </p>
          )}
        </form>
      )}
    </div>
  );
}
