import { useState, useEffect, useRef } from 'react';
import { DeliberationModeId, deliberationModes } from '../data/councilors';
import { measureText } from '../lib/pretext';

interface MotionInputBottomProps {
  onSubmit: (motion: string, mode: DeliberationModeId, selectedCouncilors: number[]) => void;
  disabled?: boolean;
  selectedCouncilors: number[];
  deliberationMode: DeliberationModeId;
  onModeChange: (mode: DeliberationModeId) => void;
}

const TEXTAREA_WIDTH = 400;
const MIN_LINES = 2;
const MAX_LINES = 6;
const LINE_HEIGHT = 24;

export function MotionInputBottom({
  onSubmit,
  disabled,
  selectedCouncilors,
  deliberationMode,
  onModeChange,
}: MotionInputBottomProps) {
  const [motion, setMotion] = useState('');
  const [textareaHeight, setTextareaHeight] = useState(LINE_HEIGHT * MIN_LINES);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      onSubmit(motion.trim(), deliberationMode, selectedCouncilors);
      setMotion('');
    }
  };

  const canSubmit = motion.trim().length > 0 && selectedCouncilors.length > 0;

  return (
    <footer className="flex-none h-[100px] border-t border-slate-800 bg-slate-900/95 backdrop-blur-sm px-4 py-3">
      <form onSubmit={handleSubmit} className="flex items-end gap-3 h-full max-w-5xl mx-auto">
        {/* Mode chips */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Mode</span>
          <div className="flex flex-wrap gap-1 max-w-[120px]">
            {deliberationModes.slice(0, 3).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onModeChange(m.id)}
                className={`
                  px-1.5 py-0.5 rounded text-[10px] font-medium transition-all whitespace-nowrap
                  ${deliberationMode === m.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'}
                `}
                style={{
                  backgroundColor: deliberationMode === m.id ? `${m.color}30` : undefined,
                  borderWidth: deliberationMode === m.id ? 1 : 0,
                  borderColor: deliberationMode === m.id ? m.color : undefined,
                }}
              >
                {m.icon} {m.name}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-slate-700 flex-shrink-0" />

        {/* Textarea */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-slate-500 uppercase tracking-wider">
              Motion / Proposal
            </label>
            <span className="text-[10px] text-slate-500">
              {motion.length} chars
            </span>
          </div>
          <textarea
            ref={textareaRef}
            value={motion}
            onChange={(e) => setMotion(e.target.value)}
            placeholder="Enter your motion for the council..."
            disabled={disabled}
            style={{ minHeight: textareaHeight, height: textareaHeight }}
            className="
              w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl
              text-sm text-white placeholder-slate-500 resize-none
              focus:outline-none focus:border-purple-500 transition-all duration-200
              disabled:opacity-50
            "
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canSubmit && !disabled) {
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
          />
        </div>

        {/* Submit */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <button
            type="submit"
            disabled={!canSubmit || disabled}
            className={`
              px-5 py-2.5 rounded-xl font-semibold text-sm transition-all btn-ripple
              ${canSubmit && !disabled
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/25 submit-btn-glow'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }
            `}
          >
            {disabled ? (
              <span className="flex items-center gap-1.5">
                <span className="animate-spin text-sm">⚙️</span>
                Processing
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                ⚖️ Submit
              </span>
            )}
          </button>
          {selectedCouncilors.length === 0 ? (
            <span className="text-[10px] text-amber-500">Select councilors</span>
          ) : (
            <span className="text-[10px] text-purple-400">{selectedCouncilors.length} selected</span>
          )}
        </div>
      </form>
    </footer>
  );
}
