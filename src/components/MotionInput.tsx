import { useState, useEffect, useRef } from 'react';
import { DeliberationModeId, deliberationModes } from '../data/councilors';
import { measureText } from '../lib/pretext';

interface MotionInputProps {
  onSubmit: (motion: string, mode: DeliberationModeId, selectedCouncilors: number[]) => void;
  disabled?: boolean;
  selectedCouncilors: number[];
  selectedMode?: DeliberationModeId;
  consensus?: number;
}

const TEXTAREA_WIDTH = 600; // max-width for centered input
const MIN_LINES = 3;
const MAX_LINES = 8;
const LINE_HEIGHT = 22;

export function MotionInput({
  onSubmit,
  disabled,
  selectedCouncilors,
  selectedMode = 'DELIBERATION',
  consensus = 0,
}: MotionInputProps) {
  const [motion, setMotion] = useState('');
  const [mode, setMode] = useState<DeliberationModeId>(selectedMode);
  const [textareaHeight, setTextareaHeight] = useState(LINE_HEIGHT * MIN_LINES);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update mode when prop changes
  useEffect(() => {
    setMode(selectedMode);
  }, [selectedMode]);

  // Pre-measure textarea height as user types — no resize jump
  useEffect(() => {
    if (!motion) {
      setTextareaHeight(LINE_HEIGHT * MIN_LINES);
      return;
    }

    const { height } = measureText(motion, TEXTAREA_WIDTH, 15, LINE_HEIGHT);
    const numLines = Math.max(MIN_LINES, Math.min(MAX_LINES, Math.ceil(height / LINE_HEIGHT) + 1));
    setTextareaHeight(numLines * LINE_HEIGHT);
  }, [motion]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (motion.trim() && selectedCouncilors.length > 0) {
      onSubmit(motion.trim(), mode, selectedCouncilors);
      setMotion('');
    }
  };

  const canSubmit = motion.trim().length > 0 && selectedCouncilors.length > 0;
  const currentMode = deliberationModes.find((m) => m.id === mode);

  // Consensus meter colors
  const getConsensusColor = () => {
    if (consensus >= 85) return '#22C55E';
    if (consensus >= 66) return '#F59E0B';
    if (consensus >= 33) return '#EF4444';
    return '#6B7280';
  };

  const getConsensusStatus = () => {
    if (consensus >= 85) return 'Strong Consensus';
    if (consensus >= 66) return 'Moderate Agreement';
    if (consensus >= 33) return 'Divided Opinion';
    if (consensus > 0) return 'Building Consensus';
    return 'Awaiting Deliberation';
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-end">
      {/* Left: Mode + Consensus */}
      <div className="flex-shrink-0 flex flex-col gap-3 lg:w-48">
        {/* Mode Selector */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Mode
          </label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as DeliberationModeId)}
            disabled={disabled}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
          >
            {deliberationModes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.icon} {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Consensus Meter - Inline */}
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Consensus</span>
            <span
              className={`text-sm font-bold ${consensus > 0 ? 'animate-pulse' : ''}`}
              style={{ color: getConsensusColor() }}
            >
              {consensus}%
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${consensus}%`,
                backgroundColor: getConsensusColor(),
              }}
            />
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: getConsensusColor() }}
            />
            <span className="text-[10px] text-gray-500">{getConsensusStatus()}</span>
          </div>
        </div>
      </div>

      {/* Center: Textarea */}
      <form onSubmit={handleSubmit} className="flex-1 flex gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={motion}
            onChange={(e) => setMotion(e.target.value)}
            placeholder="Enter your motion or proposal for the council to deliberate..."
            disabled={disabled}
            style={{ minHeight: textareaHeight, height: textareaHeight }}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none transition-all duration-200 disabled:opacity-50"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!canSubmit || disabled}
          className={`
            flex-shrink-0 px-6 py-3 rounded-xl font-semibold transition-all
            ${canSubmit && !disabled
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/25 hover:scale-105 active:scale-95'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {disabled ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⚙️</span>
              <span className="hidden sm:inline">Processing...</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="text-xl">⚖️</span>
              <span className="hidden sm:inline">Submit</span>
            </span>
          )}
        </button>
      </form>

      {/* Right: Selected Count */}
      <div className="flex-shrink-0 flex flex-col items-center justify-end lg:w-24">
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">
            {selectedCouncilors.length}
          </div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wide">
            Selected
          </div>
        </div>
        {selectedCouncilors.length === 0 && (
          <p className="text-[10px] text-amber-500 mt-1 text-center">
            ⚠️ Select councilors
          </p>
        )}
      </div>
    </div>
  );
}
