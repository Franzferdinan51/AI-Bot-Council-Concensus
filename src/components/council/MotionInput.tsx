import { useState } from 'react';
import type { DeliberationMode } from '../../types';

interface Props {
  mode: DeliberationMode;
  onSubmit: (motion: string) => void;
  onStart: () => void;
  onClear: () => void;
  hasMotion: boolean;
  isDeliberating: boolean;
  activeCount: number;
}

const MODE_ICONS: Record<DeliberationMode, string> = {
  legislative: '⚖️',
  research: '🔬',
  swarm: '🐝',
};

export function MotionInput({ 
  mode, 
  onSubmit, 
  onStart, 
  onClear, 
  hasMotion, 
  isDeliberating,
  activeCount,
}: Props) {
  const [motionText, setMotionText] = useState('');

  const handleSubmit = () => {
    if (!motionText.trim()) return;
    onSubmit(motionText.trim());
    setMotionText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 p-4 space-y-3">
      {/* Mode indicator */}
      <div className="flex items-center gap-2">
        <span className="text-lg">{MODE_ICONS[mode]}</span>
        <span className="text-sm font-medium text-slate-300">
          {mode === 'legislative' ? 'Legislative Session' : 
           mode === 'research' ? 'Deep Research Mode' : 
           'Swarm Coding Mode'}
        </span>
        <div className="flex-1" />
        <span className="text-xs text-slate-500">
          ⌘↵ to submit
        </span>
      </div>

      {/* Motion input */}
      <div className="relative">
        <textarea
          value={motionText}
          onChange={(e) => setMotionText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={mode === 'legislative' 
            ? "Enter your motion or proposal..." 
            : mode === 'research' 
            ? "What should we investigate?" 
            : "What should we build?"}
          disabled={isDeliberating}
          className="w-full bg-slate-800/80 border border-slate-600/50 rounded-xl px-4 py-3 pr-24 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-amber-500/50 transition-colors disabled:opacity-50"
          rows={2}
        />
        
        {/* Character count */}
        <div className="absolute bottom-3 right-20 text-xs text-slate-500">
          {motionText.length}/500
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!motionText.trim() || isDeliberating}
          className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl text-sm font-medium transition-colors"
        >
          📋 Submit Motion
        </button>
        
        <button
          onClick={onStart}
          disabled={!hasMotion || isDeliberating || activeCount === 0}
          className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
        >
          {isDeliberating ? (
            <>
              <span className="animate-pulse">🏛️</span>
              Deliberating...
            </>
          ) : (
            <>
              ▶️ Begin
            </>
          )}
        </button>
        
        {hasMotion && !isDeliberating && (
          <button
            onClick={onClear}
            className="px-3 py-2.5 bg-red-900/30 hover:bg-red-900/50 border border-red-800/50 rounded-xl text-sm transition-colors"
            title="Clear deliberation"
          >
            🗑️
          </button>
        )}
      </div>

      {/* Motion status */}
      {hasMotion && (
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span className="text-amber-400/80">● Motion submitted</span>
          <span>|</span>
          <span>{activeCount} councilors seated</span>
        </div>
      )}
    </div>
  );
}
