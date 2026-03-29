import { deliberationModes, DeliberationModeId } from '../data/councilors';

interface ModeSelectorProps {
  selectedMode: DeliberationModeId;
  onModeChange: (mode: DeliberationModeId) => void;
}

export function ModeSelector({ selectedMode, onModeChange }: ModeSelectorProps) {
  const currentMode = deliberationModes.find((m) => m.id === selectedMode);

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
        <span className="text-lg">⚙️</span>
        Deliberation Mode
      </h3>

      {/* Current Mode Display */}
      {currentMode && (
        <div
          className="mb-4 p-3 rounded-lg border-2"
          style={{
            borderColor: currentMode.color,
            backgroundColor: `${currentMode.color}20`,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentMode.icon}</span>
            <div>
              <div className="font-semibold text-white">{currentMode.name}</div>
              <div className="text-xs text-gray-400">{currentMode.description}</div>
            </div>
          </div>
        </div>
      )}

      {/* Mode Grid */}
      <div className="grid grid-cols-2 gap-2">
        {deliberationModes.map((mode) => {
          const isSelected = mode.id === selectedMode;

          return (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={`
                p-2 rounded-lg border-2 transition-all text-left
                ${
                  isSelected
                    ? 'scale-105 shadow-lg'
                    : 'border-gray-700 hover:border-gray-500'
                }
              `}
              style={{
                borderColor: isSelected ? mode.color : undefined,
                backgroundColor: isSelected ? `${mode.color}20` : 'transparent',
              }}
            >
              <div className="flex items-center gap-1 mb-1">
                <span className="text-lg">{mode.icon}</span>
                <span
                  className={`text-xs font-medium ${
                    isSelected ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  {mode.name}
                </span>
              </div>
              <div className="text-[10px] text-gray-500 leading-tight">
                {mode.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
