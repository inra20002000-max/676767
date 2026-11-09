import React from 'react';
import { Users2 } from 'lucide-react';
import type { CompanionLife } from '../types/events';
import { getCountryFlag } from './BirthLottery';

export interface CompanionLivesCardProps {
  companions: CompanionLife[];
  currentYear?: number;
}

export const CompanionLivesCard: React.FC<CompanionLivesCardProps> = ({
  companions,
}) => {
  if (!companions || companions.length === 0) return null;

  return (
    <div
      data-testid="companion-lives-card"
      className="bg-canvas-card border-3 border-black rounded-3xl p-4 sm:p-6 shadow-neo space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-canvas-border pb-3">
        <div className="flex items-center gap-2">
          <Users2 className="w-4 h-4 text-neon-cyan" />
          <h3 className="font-display font-black text-sm sm:text-base text-white tracking-wide uppercase">
            4 Параллельные жизни сверстников
          </h3>
        </div>
        <span className="text-[11px] font-mono text-gray-400">Рождены в одну секунду на 4 континентах</span>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {companions.map((comp) => {
          const flag = getCountryFlag(comp.countryId);
          const isAlive = comp.isAlive;

          return (
            <div
              key={comp.id}
              className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                isAlive
                  ? 'bg-canvas-dark border-black shadow-neo-sm hover:border-canvas-border'
                  : 'bg-canvas-subtle/50 border-gray-800 opacity-75'
              }`}
            >
              <div>
                {/* Header: Flag, Country & Status */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl" role="img" aria-label={comp.countryRu}>
                      {flag}
                    </span>
                    <span className="text-xs font-mono font-bold text-gray-300 truncate max-w-[100px]">
                      {comp.countryRu}
                    </span>
                  </div>

                  {isAlive ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-neon-lime/15 text-neon-lime border border-neon-lime/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-neon-lime animate-pulse" />
                      ЖИВ
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-900/30 text-red-400 border border-red-500/30">
                      💀 {comp.deathAge ?? comp.age} ЛЕТ
                    </span>
                  )}
                </div>

                {/* Name & Age */}
                <div className="font-display font-black text-white text-sm truncate mb-1">
                  {comp.name}
                </div>
                <div className="text-[11px] font-mono text-neon-yellow mb-2">
                  Возраст: {comp.age} {comp.age === 1 ? 'год' : comp.age < 5 ? 'года' : 'лет'}
                </div>
              </div>

              {/* Latest Milestone or Death Cause */}
              <div className="mt-2 pt-2 border-t border-canvas-border/50 text-[11px] font-sans text-gray-300 leading-snug">
                {comp.isAlive ? (
                  comp.majorMilestone || 'Живёт обычной жизнью в соответствии с местными условиями.'
                ) : (
                  <span className="text-red-400">
                    Причина: {comp.deathCause || 'болезнь или несчастный случай'}.
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompanionLivesCard;
