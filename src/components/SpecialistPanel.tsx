import { specialists } from '../data/councilors';

interface SpecialistPanelProps {
  onSpecialistClick: (specialistId: string) => void;
}

export function SpecialistPanel({ onSpecialistClick }: SpecialistPanelProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white">Available Specialists</h3>
      <div className="grid grid-cols-2 gap-3">
        {specialists.map((specialist) => (
          <button
            key={specialist.id}
            onClick={() => onSpecialistClick(specialist.id)}
            className="flex items-start gap-3 p-3 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:bg-gray-700/50 hover:border-gray-600/50 transition-all text-left"
          >
            <div
              className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg"
              style={{ backgroundColor: `${specialist.color}30` }}
            >
              {specialist.emoji}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-white">{specialist.name}</div>
              <div className="text-xs text-gray-400">{specialist.role}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
