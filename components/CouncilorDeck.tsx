
import React from 'react';
import { BotConfig } from '../types';

interface CouncilorDeckProps {
  councilors: BotConfig[];
  activeBotIds: string[]; // IDs of the bots currently thinking/speaking
  onCouncilorClick?: (botId: string) => void;
}

const CouncilorDeck: React.FC<CouncilorDeckProps> = ({ councilors, activeBotIds, onCouncilorClick }) => {
  return (
    <div className="flex gap-2 md:gap-4 p-2 md:p-4 overflow-x-auto bg-slate-900/80 border-b border-slate-800 backdrop-blur-sm z-20 scrollbar-hide">
      {councilors.map((bot) => {
        const isActive = activeBotIds.includes(bot.id);
        const isSpeaker = bot.role === 'speaker';
        const isSpecialist = bot.role === 'specialist';
        const isModerator = bot.role === 'moderator';
        
        let badgeColor = 'text-slate-400';
        let roleName = 'COUNCILOR';
        
        if (isSpeaker) {
            badgeColor = 'text-amber-500';
            roleName = 'SPEAKER';
        } else if (isModerator) {
            badgeColor = 'text-cyan-400';
            roleName = 'MODERATOR';
        } else if (isSpecialist) {
            badgeColor = 'text-purple-400';
            roleName = 'AGENT';
        }

        return (
          <div 
            key={bot.id} 
            onClick={() => onCouncilorClick && onCouncilorClick(bot.id)}
            className={`
                relative flex-shrink-0 w-36 md:w-48 p-2 md:p-3 rounded-lg border transition-all duration-300 cursor-pointer
                ${isActive ? 'border-amber-400 scale-105 shadow-lg shadow-amber-900/20' : 'border-slate-700 opacity-80 hover:opacity-100 hover:border-slate-500'}
                bg-slate-800 group
            `}
          >
            {isActive && (
                <div className="absolute -top-1 -right-1 w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full animate-ping"></div>
            )}
            
            <div className={`h-1 w-full rounded-full mb-1.5 md:mb-2 bg-gradient-to-r ${bot.color}`}></div>
            
            <div className="flex justify-between items-start mb-0.5 md:mb-1">
                <span className={`text-[9px] md:text-xs font-bold uppercase tracking-wider ${badgeColor}`}>
                    {roleName}
                </span>
                {bot.authorType === 'lmstudio' && <span className="text-[9px] md:text-[10px] text-blue-400 border border-blue-900 px-1 rounded">LOCAL</span>}
                {bot.authorType === 'openrouter' && <span className="text-[9px] md:text-[10px] text-emerald-400 border border-emerald-900 px-1 rounded">CLOUD</span>}
            </div>
            
            <h3 className="text-white text-xs md:text-base font-serif font-medium truncate" title={bot.name}>{bot.name}</h3>
            <p className="text-[9px] md:text-[10px] text-slate-500 truncate mt-0.5">{bot.model}</p>
            
            {isActive && (
                <div className="mt-1 md:mt-2 text-[10px] md:text-xs text-amber-200 font-mono flex items-center gap-1">
                    <span className="animate-pulse">Thinking...</span>
                </div>
            )}

            {/* Hover hint for Private Counsel */}
            <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                <span className="text-[10px] font-bold text-white uppercase tracking-wider border border-white/50 px-2 py-1 rounded">Private Whisper</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CouncilorDeck;
