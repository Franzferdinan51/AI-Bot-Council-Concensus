import { DeliberationModeId, deliberationModes } from '../data/councilors';

interface ModeSelectorProps {
  selectedMode: DeliberationModeId;
  onModeChange: (mode: DeliberationModeId) => void;
}

export function ModeSelector({ selectedMode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Deliberation Mode
      </label>
      <div className="grid grid-cols-2 gap-2">
        {deliberationModes.map((mode) => {
          const isActive = selectedMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id as DeliberationModeId)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left
                ${isActive
                  ? 'ring-2 shadow-lg'
                  : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-400'
                }
              `}
              style={{
                backgroundColor: isActive ? `${mode.color}20` : undefined,
                borderColor: isActive ? mode.color : '#374151',
                ringColor: isActive ? mode.color : undefined,
              }}
            >
              <span className="text-base">{mode.icon}</span>
              <div>
                <div className={isActive ? 'text-white' : 'text-gray-300'}>{mode.name}</div>
                <div className={`text-[10px] ${isActive ? 'text-gray-300' : 'text-gray-500'}`}>
                  {mode.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
