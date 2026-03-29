import { DeliberationModeId, deliberationModes } from '../data/councilors';

interface SettingsTabProps {
  deliberationMode: DeliberationModeId;
  onModeChange: (mode: DeliberationModeId) => void;
}

export function SettingsTab({ deliberationMode, onModeChange }: SettingsTabProps) {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Deliberation Modes */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <span>⚙️</span> Deliberation Mode
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select how the council will deliberate on your motions
            </p>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {deliberationModes.map((mode) => {
              const isActive = mode.id === deliberationMode;
              return (
                <button
                  key={mode.id}
                  onClick={() => onModeChange(mode.id)}
                  className={`
                    p-4 rounded-xl border text-left transition-all duration-200
                    ${isActive
                      ? 'border-transparent shadow-lg'
                      : 'border-slate-700/50 hover:border-slate-600'
                    }
                  `}
                  style={{
                    backgroundColor: isActive ? `${mode.color}20` : undefined,
                    borderColor: isActive ? mode.color : undefined,
                    boxShadow: isActive ? `0 0 20px ${mode.color}20` : undefined,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{mode.icon}</span>
                    <span className="font-semibold text-sm text-white">{mode.name}</span>
                    {isActive && (
                      <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{
                        backgroundColor: mode.color,
                        color: '#fff',
                      }}>
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 ml-7">{mode.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Gateway Configuration */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <span>🌐</span> Gateway Configuration
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                OpenClaw Gateway URL
              </label>
              <input
                type="text"
                defaultValue="ws://localhost:18789"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                API Key
              </label>
              <input
                type="password"
                defaultValue="••••••••••••"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Auto-connect on load</span>
              <button className="w-10 h-5 bg-purple-600 rounded-full relative">
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full" />
              </button>
            </div>
          </div>
        </div>

        {/* Pretext Info */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📐</span>
            <h3 className="text-sm font-semibold text-slate-300">Pretext Text Measurement</h3>
            <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
              Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            All text measurements use @chenglou/pretext for zero-reflow rendering.
            This prevents content from "popping" as messages stream in.
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-800/50 rounded-lg p-2">
              <div className="text-lg font-bold text-white">~19ms</div>
              <div className="text-[10px] text-slate-500">prepare()</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2">
              <div className="text-lg font-bold text-white">~0.09ms</div>
              <div className="text-[10px] text-slate-500">layout() cached</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2">
              <div className="text-lg font-bold text-white">0</div>
              <div className="text-[10px] text-slate-500">DOM reflow</div>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4 text-center">
          <span className="text-3xl mb-2 block">🏛️</span>
          <h3 className="font-semibold text-white mb-1">AI Council Chamber</h3>
          <p className="text-xs text-slate-500">Alternative Tab-Based Layout</p>
          <p className="text-xs text-slate-600 mt-1">
            45 Councilors • 6 Specialists • {deliberationModes.length} Modes
          </p>
        </div>
      </div>
    </div>
  );
}
