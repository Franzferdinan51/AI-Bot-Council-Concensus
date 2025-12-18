
import React from 'react';
import { BotConfig } from '../types';

interface CouncilorDeckProps {
  councilors: BotConfig[];
  activeBotIds: string[]; // IDs of the bots currently thinking/speaking
  onCouncilorClick?: (botId: string) => void;
}

const CouncilorDeck: React.FC<CouncilorDeckProps> = ({ councilors, activeBotIds, onCouncilorClick }) => {
  return (
    <div className="flex gap-3 px-4 py-3 overflow-x-auto bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800/50 z-20 scrollbar-hide items-center h-28 shrink-0">
      {councilors.map((bot) => {
        const isActive = activeBotIds.includes(bot.id);
        const isSpeaker = bot.role === 'speaker';
        const isModerator = bot.role === 'moderator';
        const isSpecialist = bot.role === 'specialist';
        
        let roleColor = 'text-slate-400';
        let roleLabel = 'COUNCILOR';
        let borderColor = 'border-slate-700/50';
        let bgGradient = 'from-slate-800/40 to-slate-900/40';

        if (isSpeaker) {
            roleColor = 'text-amber-500';
            roleLabel = 'SPEAKER';
            borderColor = 'border-amber-600/30';
            bgGradient = 'from-amber-900/10 to-slate-900/40';
        } else if (isModerator) {
            roleColor = 'text-cyan-400';
            roleLabel = 'MODERATOR';
            borderColor = 'border-cyan-600/30';
        } else if (isSpecialist) {
            roleColor = 'text-purple-400';
            roleLabel = 'AGENT';
            borderColor = 'border-purple-600/30';
        }

        if (isActive) {
            borderColor = 'border-amber-400/80';
            bgGradient = 'from-slate-800 to-slate-900';
        }

        return (
          <div 
            key={bot.id} 
            onClick={() => onCouncilorClick && onCouncilorClick(bot.id)}
            className={`
                relative flex-shrink-0 w-44 h-20 p-2.5 rounded-xl border backdrop-blur-sm transition-all duration-300 cursor-pointer group overflow-hidden
                ${borderColor} bg-gradient-to-br ${bgGradient}
                ${isActive ? 'scale-105 shadow-[0_0_15px_rgba(245,158,11,0.2)] z-10' : 'hover:border-slate-500 hover:bg-slate-800/60 opacity-90'}
            `}
          >
            {/* Active Glow Pulse */}
            {isActive && (
                <div className="absolute inset-0 bg-amber-500/5 animate-pulse"></div>
            )}
            
            {/* Top Bar Status */}
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-amber-400 animate-ping' : `bg-slate-600 group-hover:bg-${bot.color.split('-')[1]}-400`}`}></div>
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${roleColor} opacity-90`}>
                        {roleLabel}
                    </span>
                </div>
                {isActive && <span className="text-[8px] text-amber-300 font-mono animate-pulse">THINKING</span>}
            </div>
            
            {/* Name & Model */}
            <div className="flex flex-col justify-center h-10">
                <h3 className="text-slate-100 text-xs font-serif font-bold truncate tracking-wide leading-tight group-hover:text-white transition-colors">
                    {bot.name}
                </h3>
                <div className="flex items-center gap-1 mt-0.5">
                    <p className="text-[9px] text-slate-500 truncate font-mono">{bot.model}</p>
                    {bot.authorType === 'lmstudio' && <span className="w-1 h-1 rounded-full bg-blue-500"></span>}
                </div>
            </div>

            {/* Bottom Gradient Line */}
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${bot.color} opacity-50 group-hover:opacity-100 transition-opacity`}></div>

            {/* Hover hint for Private Counsel */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                <div className="border border-white/20 bg-white/5 rounded-full px-3 py-1 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Consult</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CouncilorDeck;
