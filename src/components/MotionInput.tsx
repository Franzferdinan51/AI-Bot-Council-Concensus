import React, { useState, useEffect } from 'react';
import { measureStreamingText } from '../lib/pretext';

export type DeliberationMode = 'legislative' | 'deep-research' | 'swarm-coding';

interface MotionInputProps {
  onSubmit: (motion: string, mode: DeliberationMode) => void;
  isProcessing?: boolean;
  containerWidth?: number;
}

const MODE_LABELS: Record<DeliberationMode, { label: string; emoji: string; description: string }> = {
  'legislative': {
    label: 'Legislative',
    emoji: '⚖️',
    description: 'Debate & vote on proposals',
  },
  'deep-research': {
    label: 'Deep Research',
    emoji: '🔬',
    description: 'Multi-vector investigation',
  },
  'swarm-coding': {
    label: 'Swarm Coding',
    emoji: '🐝',
    description: 'Parallel software development',
  },
};

const MAX_CHARS = 2000;

export function MotionInput({ onSubmit, isProcessing = false, containerWidth = 320 }: MotionInputProps) {
  const [motion, setMotion] = useState('');
  const [mode, setMode] = useState<DeliberationMode>('legislative');
  const [charCount, setCharCount] = useState(0);
  const [measuredHeight, setMeasuredHeight] = useState(100);

  // Pre-measure textarea content for character count
  useEffect(() => {
    setCharCount(motion.length);
    
    if (motion) {
      const dims = measureStreamingText(motion, containerWidth - 32, '14px Inter, system-ui, sans-serif', 20);
      setMeasuredHeight(Math.min(Math.max(dims.height + 40, 100), 300));
    } else {
      setMeasuredHeight(100);
    }
  }, [motion, containerWidth]);

  const handleSubmit = () => {
    if (motion.trim() && !isProcessing) {
      onSubmit(motion.trim(), mode);
      setMotion('');
    }
  };

  const charCountColor = charCount > MAX_CHARS * 0.9
    ? 'text-red-400'
    : charCount > MAX_CHARS * 0.7
      ? 'text-yellow-400'
      : 'text-gray-500';

  return (
    <div className="p-4 bg-gray-900 border-t border-gray-800">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-200 mb-2">Submit Motion</h3>
        
        {/* Mode selector */}
        <div className="flex gap-2 mb-3">
          {(Object.keys(MODE_LABELS) as DeliberationMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`
                flex-1 px-2 py-1.5 rounded text-xs font-medium transition-all
                ${mode === m
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}
              `}
              title={MODE_LABELS[m].description}
            >
              <span className="mr-1">{MODE_LABELS[m].emoji}</span>
              {MODE_LABELS[m].label}
            </button>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <div className="relative mb-3">
        <textarea
          value={motion}
          onChange={(e) => setMotion(e.target.value.slice(0, MAX_CHARS))}
          placeholder="Enter your motion for the council to deliberate..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gray-100 placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500 transition-colors"
          style={{ minHeight: measuredHeight }}
          disabled={isProcessing}
        />
        <div className={`absolute bottom-2 right-3 text-xs ${charCountColor}`}>
          {charCount}/{MAX_CHARS}
        </div>
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!motion.trim() || isProcessing}
        className={`
          w-full py-3 rounded-lg font-semibold text-sm transition-all
          ${motion.trim() && !isProcessing
            ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'}
        `}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⏳</span>
            Council Deliberating...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>⚖️</span>
            Submit to Council
          </span>
        )}
      </button>
    </div>
  );
}
