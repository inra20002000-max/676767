import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Skull,
  Share2,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Heart,
  Smile,
  Brain,
  Users,
  Award,
  BookOpen,
} from 'lucide-react';
import type { CharacterState } from '../types/simulation';
import { soundEngine } from '../engine/soundEngine';
import { getCountryFlag } from './BirthLottery';
import { computeLifeArchetype } from './CanvasShareModal';
import LifeGrid from './LifeGrid';

export interface MemorialScreenProps {
  character: CharacterState;
  onRestartLife: () => void;
  onOpenShareModal: () => void;
}

export const MemorialScreen: React.FC<MemorialScreenProps> = ({
  character,
  onRestartLife,
  onOpenShareModal,
}) => {
  const flag = getCountryFlag(character.country.id);
  const archetype = computeLifeArchetype(character);

  const longevityPct = Math.round((character.longevityPercentile ?? 0.5) * 100);
  const wealthTop = Math.max(0.1, (100 - character.wealth.worldPct * 100)).toFixed(1);

  // Play death sound and speak eulogy once upon mounting
  useEffect(() => {
    soundEngine.unlock();
    soundEngine.play('death');

    const eulogyText =
      character.eulogy ||
      `Прожил(а) ${character.age} ${
        character.age === 1 ? 'год' : character.age < 5 ? 'года' : 'лет'
      } в стране ${character.country.ru}. Причина: ${
        character.deathCause?.ru || 'естественные причины'
      }.`;
    soundEngine.speakDeath(eulogyText);
  }, [character.age, character.country.ru, character.deathCause, character.eulogy]);

  const handleRestart = () => {
    soundEngine.unlock();
    soundEngine.play('click');
    onRestartLife();
  };

  const handleShare = () => {
    soundEngine.unlock();
    soundEngine.play('click');
    onOpenShareModal();
  };

  return (
    <div
      data-testid="death-screen"
      className="w-full max-w-4xl mx-auto space-y-6"
    >
      {/* Neo-brutalist Memorial Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-canvas-card border-3 border-black rounded-3xl p-6 sm:p-8 shadow-[6px_6px_0px_#FF007F] relative overflow-hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white font-mono font-black text-xs uppercase border border-black shadow-neo-sm">
              <Skull className="w-4 h-4" />
              ЖИЗНЕННЫЙ ПУТЬ ЗАВЕРШЁН
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-black font-mono font-black text-xs uppercase border border-black shadow-neo-sm"
              style={{ backgroundColor: archetype.color }}
            >
              АРХЕТИП: {archetype.name}
            </span>
          </div>

          <span className="text-xs font-mono text-gray-400">
            {character.birthYear} — {character.year}
          </span>
        </div>

        {/* Character Title & Death Statement */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl" role="img" aria-label={character.country.ru}>
              {flag}
            </span>
            <div>
              <h1 className="text-3xl sm:text-5xl font-display font-black tracking-tight text-white">
                {character.name}
              </h1>
              <div className="text-xs sm:text-sm font-mono text-neon-cyan uppercase">
                {character.country.ru} · {character.sex === 'M' ? 'Мужчина' : 'Женщина'}
              </div>
            </div>
          </div>

          <div className="p-4 bg-canvas-dark rounded-2xl border-2 border-black/80 mt-4">
            <div className="text-xs font-mono text-red-400 font-bold uppercase mb-1">
              Официальное медицинское свидетельство:
            </div>
            <div className="text-lg sm:text-xl font-display font-black text-white">
              Скончался(лась) в возрасте <span className="text-neon-yellow">{character.age}</span>{' '}
              {character.age === 1 ? 'года' : character.age < 5 ? 'лет' : 'лет'}.
            </div>
            <div className="text-sm font-sans text-gray-300 mt-1">
              Причина смерти: <strong className="text-neon-pink">{character.deathCause?.ru || 'Естественная старость'}</strong>
            </div>
          </div>
        </div>

        {/* Global Benchmarking Cards (Longevity, Wealth, Archetype) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-canvas-dark p-4 rounded-2xl border border-canvas-border shadow-neo-sm">
            <div className="flex items-center gap-1.5 text-xs font-mono text-gray-400 mb-1">
              <TrendingUp className="w-4 h-4 text-neon-lime" />
              <span>Долголетие в мире</span>
            </div>
            <div className="text-2xl font-mono font-black text-neon-lime">
              {longevityPct}%
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5 leading-snug">
              Прожил(а) дольше {longevityPct}% всех когда-либо рождённых людей Земли.
            </div>
          </div>

          <div className="bg-canvas-dark p-4 rounded-2xl border border-canvas-border shadow-neo-sm">
            <div className="flex items-center gap-1.5 text-xs font-mono text-gray-400 mb-1">
              <DollarSign className="w-4 h-4 text-neon-yellow" />
              <span>Глобальное богатство</span>
            </div>
            <div className="text-2xl font-mono font-black text-neon-yellow">
              Топ {wealthTop}%
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5 leading-snug">
              Итоговый капитал: ${character.wealth.netWorthUSD.toLocaleString()} (PPP).
            </div>
          </div>

          <div className="bg-canvas-dark p-4 rounded-2xl border border-canvas-border shadow-neo-sm">
            <div className="flex items-center gap-1.5 text-xs font-mono text-gray-400 mb-1">
              <Award className="w-4 h-4 text-neon-cyan" />
              <span>Судьба и статус</span>
            </div>
            <div className="text-xl font-display font-black text-white truncate">
              {archetype.name}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5 leading-snug">
              {archetype.desc}
            </div>
          </div>
        </div>

        {/* Personalized Epitaph */}
        <div className="bg-canvas-dark/90 p-5 rounded-2xl border-2 border-neon-cyan/40 mb-6">
          <div className="text-xs font-mono text-neon-cyan font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            Эпитафия и след в истории:
          </div>
          <p className="text-gray-200 font-sans text-sm sm:text-base italic leading-relaxed">
            "{character.eulogy || 'Жизнь, прожитая среди 8 миллиардов судеб на планете Земля.'}"
          </p>
        </div>

        {/* Lifetime Final Attributes */}
        <div className="bg-canvas-dark p-4 rounded-2xl border border-canvas-border mb-6">
          <div className="text-xs font-mono text-gray-400 font-bold uppercase mb-3">
            Финальные показатели личности на момент ухода:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-neon-lime" />
              <span className="text-xs font-mono">Здоровье: <strong>{character.stats.health}%</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Smile className="w-4 h-4 text-neon-yellow" />
              <span className="text-xs font-mono">Счастье: <strong>{character.stats.happiness}%</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-neon-cyan" />
              <span className="text-xs font-mono">Ум: <strong>{character.stats.smarts}%</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-mono">Отношения: <strong>{character.stats.social}%</strong></span>
            </div>
          </div>
        </div>

        {/* Life Matrix at Death */}
        <div className="mb-6">
          <LifeGrid
            currentAge={character.age}
            isAlive={false}
            history={character.history}
          />
        </div>

        {/* Action Buttons: Share & Restart */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <button
            type="button"
            data-testid="share-card-btn"
            onClick={handleShare}
            className="w-full sm:flex-1 bg-neon-cyan text-black font-display font-black text-base sm:text-lg py-4 rounded-2xl border-3 border-black shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer uppercase select-none"
          >
            <Share2 className="w-5 h-5" />
            <span>ПОДЕЛИТЬСЯ ИСТОРИЕЙ ЖИЗНИ</span>
          </button>

          <button
            type="button"
            onClick={handleRestart}
            className="w-full sm:flex-1 bg-neon-lime text-black font-display font-black text-base sm:text-lg py-4 rounded-2xl border-3 border-black shadow-neo-lime hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer uppercase select-none"
          >
            <RefreshCw className="w-5 h-5" />
            <span>РОДИТЬСЯ ЗАНОВО</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default MemorialScreen;
