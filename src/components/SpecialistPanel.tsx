import { specialists } from '../data/councilors';

interface SpecialistPanelProps {
  onSpecialistClick?: (specialistId: string) => void;
}

export function SpecialistPanel({ onSpecialistClick }: SpecialistPanelProps) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
        <span className="text-lg">🎯</span>
        Specialist Agents
      </h3>

      <div className="space-y-2">
        {specialists.map((spec) => (
          <button
            key={spec.id}
            onClick={() => onSpecialistClick?.(spec.id)}
            className="w-full p-3 rounded-lg border border-gray-700/50 bg-gray-900/30 hover:bg-gray-800/50 hover:border-gray-600 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                style={{ backgroundColor: `${spec.color}30` }}
              >
                {spec.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white text-sm">{spec.name}</div>
                <div className="text-xs text-gray-400">{spec.role}</div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-gray-400">→</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500 line-clamp-2">{spec.description}</p>
          </button>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700/50">
        <p className="text-xs text-gray-500 text-center">
          Specialists provide deep expertise on demand
        </p>
      </div>
    </div>
  );
}
