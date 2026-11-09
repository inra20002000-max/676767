import React, { useState } from 'react';
import type { LifeStage, LifeHistoryEvent } from '../types/simulation';

export interface LifeGridProps {
  currentAge: number;
  isAlive: boolean;
  history?: LifeHistoryEvent[];
  maxYears?: number; // Defaults to 100
}

interface CellData {
  age: number;
  stage: LifeStage;
  eventText?: string;
  isLived: boolean;
  isCurrent: boolean;
  isDeath: boolean;
}

export const LifeGrid: React.FC<LifeGridProps> = ({
  currentAge,
  isAlive,
  history = [],
  maxYears = 100,
}) => {
  const [selectedAge, setSelectedAge] = useState<number | null>(null);

  // Group events by age
  const eventsByAge: Record<number, string[]> = {};
  history.forEach((evt) => {
    if (!eventsByAge[evt.age]) {
      eventsByAge[evt.age] = [];
    }
    eventsByAge[evt.age].push(evt.text);
  });

  const getStageForAge = (age: number): LifeStage => {
    if (age <= 5) return 'baby';
    if (age <= 17) return 'school';
    if (age <= 21) return 'service';
    if (age <= 64) return 'adult';
    return 'elder';
  };

  const getStageColor = (stage: LifeStage): string => {
    switch (stage) {
      case 'baby':
        return 'bg-neon-cyan text-black';
      case 'school':
        return 'bg-blue-500 text-white';
      case 'kidwork':
        return 'bg-amber-500 text-black';
      case 'service':
        return 'bg-red-500 text-white';
      case 'adult':
        return 'bg-neon-lime text-black';
      case 'elder':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const cells: CellData[] = Array.from({ length: maxYears }, (_, i) => {
    const age = i;
    const isLived = age <= currentAge;
    const isCurrent = age === currentAge && isAlive;
    const isDeath = age === currentAge && !isAlive;
    const stage = getStageForAge(age);
    const eventTexts = eventsByAge[age];
    const eventText = eventTexts ? eventTexts.join(' • ') : undefined;

    return {
      age,
      stage,
      eventText,
      isLived,
      isCurrent,
      isDeath,
    };
  });

  const selectedCell = selectedAge !== null ? cells[selectedAge] : null;

  return (
    <div className="bg-canvas-card border-3 border-black rounded-3xl p-4 sm:p-6 shadow-neo space-y-4">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-canvas-border pb-3">
        <div>
          <div className="text-xs font-mono font-black text-neon-cyan uppercase tracking-wider">
            100-ЛЕТНЯЯ МАТРИЦА ЖИЗНИ (10×10)
          </div>
          <div className="text-sm font-display font-black text-white">
            Прожито: <span className="text-neon-yellow">{Math.min(maxYears, currentAge)}</span> из {maxYears} лет
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
          <span className="flex items-center gap-1 bg-canvas-dark px-1.5 py-0.5 rounded border border-black">
            <span className="w-2 h-2 rounded-full bg-neon-cyan" /> 0-5 Малыш
          </span>
          <span className="flex items-center gap-1 bg-canvas-dark px-1.5 py-0.5 rounded border border-black">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> 6-17 Учёба
          </span>
          <span className="flex items-center gap-1 bg-canvas-dark px-1.5 py-0.5 rounded border border-black">
            <span className="w-2 h-2 rounded-full bg-red-500" /> 18-21 Служба
          </span>
          <span className="flex items-center gap-1 bg-canvas-dark px-1.5 py-0.5 rounded border border-black">
            <span className="w-2 h-2 rounded-full bg-neon-lime" /> 22-64 Зрелость
          </span>
          <span className="flex items-center gap-1 bg-canvas-dark px-1.5 py-0.5 rounded border border-black">
            <span className="w-2 h-2 rounded-full bg-purple-500" /> 65+ Мудрость
          </span>
        </div>
      </div>

      {/* 10x10 Matrix Grid */}
      <div
        data-testid="life-grid"
        className="grid grid-cols-10 gap-1 sm:gap-1.5 select-none w-full max-w-lg mx-auto"
      >
        {cells.map((cell) => {
          let cellStyle = 'bg-canvas-subtle/50 border border-canvas-border text-gray-500';
          if (cell.isDeath) {
            cellStyle = 'bg-red-600 text-white font-black border-2 border-black animate-pulse shadow-neo-sm';
          } else if (cell.isCurrent) {
            cellStyle = `${getStageColor(
              cell.stage
            )} font-black border-2 border-white ring-2 ring-neon-cyan ring-offset-1 ring-offset-black animate-pulse shadow-neo-sm`;
          } else if (cell.isLived) {
            cellStyle = `${getStageColor(cell.stage)} font-bold border border-black opacity-90`;
          }

          const isSelected = selectedAge === cell.age;

          return (
            <button
              key={cell.age}
              type="button"
              onClick={() => setSelectedAge(cell.age === selectedAge ? null : cell.age)}
              title={`Возраст: ${cell.age}${cell.eventText ? ` — ${cell.eventText}` : ''}`}
              className={`aspect-square rounded-md sm:rounded-lg flex items-center justify-center text-[10px] sm:text-xs transition-all duration-150 cursor-pointer ${cellStyle} ${
                isSelected ? 'scale-110 ring-2 ring-white z-10' : 'hover:scale-105'
              }`}
            >
              {cell.isDeath ? '💀' : cell.age}
            </button>
          );
        })}
      </div>

      {/* Interactive Year Inspector Card */}
      {selectedCell && (
        <div className="bg-canvas-dark p-3.5 rounded-2xl border-2 border-neon-cyan/40 text-xs text-gray-200 animate-fadeIn">
          <div className="flex items-center justify-between font-mono font-bold text-neon-cyan mb-1">
            <span>Возраст: {selectedCell.age} {selectedCell.age === 1 ? 'год' : selectedCell.age < 5 ? 'года' : 'лет'}</span>
            <span className="uppercase text-[10px] text-gray-400">
              {selectedCell.isLived ? (selectedCell.isDeath ? 'Год гибели' : 'Прожитый год') : 'Будущее'}
            </span>
          </div>
          <div className="text-gray-300 font-sans leading-relaxed">
            {selectedCell.eventText || (selectedCell.isLived ? 'Спокойный год без критических потрясений.' : 'Еще не прожитый год.')}
          </div>
        </div>
      )}
    </div>
  );
};

export default LifeGrid;
