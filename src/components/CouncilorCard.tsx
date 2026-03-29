import { Councilor, Specialist } from '../data/councilors';

interface CouncilorCardProps {
  councilor: Councilor | Specialist;
  isSpecialist?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export function CouncilorCard({
  councilor,
  isSpecialist = false,
  isSelected = false,
  onClick,
}: CouncilorCardProps) {
  const borderColor = isSelected ? councilor.color : 'transparent';

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-lg p-3 h-full flex flex-col transition-all duration-200 hover:scale-105 ${isSelected ? 'councilor-active-glow' : 'hover:shadow-lg'}`}
      style={{
        backgroundColor: `${councilor.color}${isSelected ? 'FF' : '99'}`,
        borderWidth: isSelected ? 2 : 0,
        borderColor: borderColor,
        boxShadow: isSelected
          ? `0 0 25px ${councilor.color}60, 0 0 50px ${councilor.color}30`
          : '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <span className="text-2xl flex-shrink-0">{councilor.emoji}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white text-sm truncate drop-shadow-sm">
            {councilor.name}
          </h3>
          <p className="text-xs text-white/80 leading-tight break-words">{councilor.role}</p>
          {isSpecialist && (
            <span className="inline-block mt-1 px-1.5 py-0.5 bg-white/20 rounded text-[10px] text-white font-medium">
              SPECIALIST
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
