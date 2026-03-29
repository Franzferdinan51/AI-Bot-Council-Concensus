import { useState, useEffect, useRef } from 'react';
import { DeliberationModeId, deliberationModes } from '../data/councilors';
import { measureText } from '../lib/pretext';

interface CollapsibleInputProps {
  collapsed: boolean;
  onToggle: () => void;
  onSubmit: (motion: string, mode: DeliberationModeId, selected: number[]) => void;
  disabled?: boolean;
  selectedCouncilors: number[];
  deliberationMode: DeliberationModeId;
  onModeChange: (mode: DeliberationModeId) => void;
}

const TEXTAREA_WIDTH = 580;
const MIN_LINES = 2;
const MAX_LINES = 8;
const LINE_HEIGHT = 22;

export function CollapsibleInput({
  collapsed, onToggle, onSubmit, disabled,
  selectedCouncilors, deliberationMode, onModeChange,
}: CollapsibleInputProps) {
  const [motion, setMotion] = useState('');
  const [mode, setMode] = useState<DeliberationModeId>(deliberationMode);
  const [textareaHeight, setTextareaHeight] = useState(LINE_HEIGHT * MIN_LINES);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setMode(deliberationMode); }, [deliberationMode]);

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

  if (collapsed) {
    return (
      <div className="flex-none border-t border-slate-800 bg-gray-950 flex items-center gap-2 px-4 h-12 z-10">
        <button
          onClick={onToggle}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
          title="Expand input"
        >
          <span className="text-sm">⬆</span>
        </button>
        <div className="flex-1 text-xs text-gray-500 truncate">
          {motion || 'Submit a motion to begin deliberation…'}
        </div>
        <div className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            backgroundColor: `${deliberationModes.find(m => m.id === deliberationMode)?.color}25`,
            color: deliberationModes.find(m => m.id === deliberationMode)?.color,
          }}>
          {deliberationModes.find(m => m.id === deliberationMode)?.icon}{' '}
          {deliberationModes.find(m => m.id === deliberationMode)?.name}
        </div>
        {canSubmit && (
          <button
            onClick={handleSubmit}
            disabled={disabled}
            className="flex-shrink-0 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-semibold text-white transition-colors"
          >
            Submit
          </button>
        )}
      </div>
    );
  }

  return (
    <section className="flex-none border-t border-slate-800 bg-gray-950 transition-all duration-300 z-10 relative">
      <form onSubmit={handleSubmit} className="px-4 py-3 space-y-3">
        <div className="flex gap-3">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={motion}
              onChange={(e) => setMotion(e.target.value)}
              placeholder="Submit a motion for the council to deliberate…"
              disabled={disabled}
              style={{ minHeight: textareaHeight, height: textareaHeight }}
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 resize-none transition-all duration-200 disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-1">
            {deliberationModes.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => { setMode(m.id); onModeChange(m.id); }}
                className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap"
                style={{
                  backgroundColor: mode === m.id ? `${m.color}30` : 'transparent',
                  borderWidth: 1,
                  borderColor: mode === m.id ? `${m.color}60` : '#374151',
                  color: mode === m.id ? m.color : '#6b7280',
                }}
              >
                <span>{m.icon}</span>
                <span>{m.name}</span>
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={!canSubmit || disabled}
            className="flex-shrink-0 px-4 py-2 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{
              background: canSubmit && !disabled ? 'linear-gradient(135deg, #7c3aed, #2563eb)' : undefined,
              color: canSubmit && !disabled ? '#fff' : '#6b7280',
            }}
          >
            {disabled ? (
              <><span className="animate-spin text-sm">⚙️</span><span>Processing…</span></>
            ) : (
              <><span>⚖️</span><span>Submit Motion</span></>
            )}
          </button>
        </div>

        {selectedCouncilors.length === 0 && (
          <p className="text-xs text-amber-500">
            ⚠️ Select at least one councilor from the drawer (bottom-left)
          </p>
        )}
      </form>

      <button
        onClick={onToggle}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-5 flex items-center justify-center z-20"
      >
        <div className="w-10 h-1 bg-gray-700 rounded-full hover:bg-gray-500 transition-colors" />
      </button>
    </section>
  );
}
