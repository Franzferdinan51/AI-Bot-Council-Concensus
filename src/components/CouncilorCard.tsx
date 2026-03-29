import { Councilor, Specialist } from '../data/councilors';
import { useEffect, useState } from 'react';
import { measureText } from '../lib/pretext';

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
  const [measuredHeight, setMeasuredHeight] = useState(80);
  const containerWidth = 200;

  useEffect(() => {
    const text = `${councilor.name}\n${councilor.role}`;
    const { height } = measureText(text, containerWidth, 13, 18);
    setMeasuredHeight(Math.max(80, height + 50));
  }, [councilor.name, councilor.role, containerWidth]);

  const borderColor = isSelected ? councilor.color : 'transparent';
  const bgOpacity = isSelected ? '100' : '60';

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-lg p-3 transition-all duration-200 hover:scale-105 hover:shadow-lg"
      style={{
        minHeight: measuredHeight,
        backgroundColor: `${councilor.color}${isSelected ? 'FF' : '99'}`,
        borderWidth: isSelected ? 2 : 0,
        borderColor: borderColor,
        boxShadow: isSelected
          ? `0 0 20px ${councilor.color}50`
          : '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <div className="flex items-start gap-2">
        <span className="text-2xl">{councilor.emoji}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm truncate drop-shadow-sm">
            {councilor.name}
          </h3>
          <p className="text-xs text-white/80 truncate">{councilor.role}</p>
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
