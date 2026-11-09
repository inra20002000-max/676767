import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  Smile,
  Brain,
  Users,
  DollarSign,
  Pause,
  FastForward,
  Plus,
  Sparkles,
  Globe2,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import type { CharacterState, FocusType, LifeStage } from '../types/simulation';
import type { SceneContext, Mood, VehicleType, TimeOfDay, ScenePerson } from '../types/pixelArt';
import { FOCUS_DEFINITIONS } from '../engine/lifeStages';
import { soundEngine } from '../engine/soundEngine';
import { getCountryFlag } from './BirthLottery';
import LifeGrid from './LifeGrid';
import ChronicleFeed from './ChronicleFeed';
import CompanionLivesCard from './CompanionLivesCard';
import PixelArtScene from './PixelArtScene';
import FamilyCard from './FamilyCard';

export interface LifeDashboardProps {
  character: CharacterState;
  onAdvanceYear: () => void;
  isTurbo: boolean;
  onToggleTurbo: (enabled: boolean) => void;
  currentFocus: FocusType;
  onSelectFocus: (focus: FocusType) => void;
}

const STAGE_LABELS: Record<LifeStage, { label: string; color: string }> = {
  baby: { label: '0-5 Младенчество', color: 'bg-neon-cyan text-black' },
  school: { label: '6-17 Школа', color: 'bg-blue-500 text-white' },
  kidwork: { label: '6-17 Детский труд', color: 'bg-amber-500 text-black' },
  service: { label: '18-21 Служба', color: 'bg-red-500 text-white' },
  adult: { label: '22-64 Зрелость', color: 'bg-neon-lime text-black' },
  elder: { label: '65+ Старость', color: 'bg-purple-500 text-white' },
};

const ALL_15_FOCUSES: FocusType[] = [
  'study',
  'work',
  'health',
  'social',
  'crime',
  'substance',
  'family',
  'hobby',
  'military',
  'religion',
  'politics',
  'travel',
  'art',
  'money',
  'rest',
];

export const LifeDashboard: React.FC<LifeDashboardProps> = ({
  character,
  onAdvanceYear,
  isTurbo,
  onToggleTurbo,
  currentFocus,
  onSelectFocus,
}) => {
  const [hoveredFocus, setHoveredFocus] = useState<FocusType | null>(null);

  const flag = getCountryFlag(character.country.id);
  const stageInfo = STAGE_LABELS[character.stage] ?? STAGE_LABELS.adult;

  // Global wealth calculation
  const topWealthPct = Math.max(0.1, (100 - character.wealth.worldPct * 100)).toFixed(1);

  const handleStepClick = () => {
    soundEngine.unlock();
    soundEngine.play('step');
    onAdvanceYear();
  };

  const handleTurboClick = () => {
    soundEngine.unlock();
    soundEngine.play('click');
    onToggleTurbo(!isTurbo);
  };

  const activeFocusDef =
    (hoveredFocus && FOCUS_DEFINITIONS[hoveredFocus]) ||
    FOCUS_DEFINITIONS[currentFocus] ||
    FOCUS_DEFINITIONS.health;

  const sceneContext: SceneContext = useMemo(() => {
    let homeType: string | undefined;
    if (character.flags?.inPrison) homeType = 'prison';
    else if (character.flags?.refugee) homeType = 'tent';
    else if (character.wealth.quintile >= 5) homeType = 'estate';
    else if (character.wealth.quintile >= 4) homeType = 'villa';
    else if (character.wealth.quintile === 3) homeType = 'house';
    else if (character.wealth.quintile === 2) homeType = 'cottage';
    else homeType = character.country.urb > 50 ? 'flat' : 'hut';

    const mood: Mood =
      character.stats.happiness < 35
        ? 'low'
        : character.stats.happiness > 70
        ? 'high'
        : 'mid';

    let vehicleType: VehicleType | undefined;
    if (character.flags?.ownsMotorcycle || character.ownsMotorcycle) {
      vehicleType = 'moto';
    } else if (character.wealth.quintile >= 4 && character.age >= 18) {
      vehicleType = 'car';
    }

    const timeOfDay: TimeOfDay =
      character.age < 13 ? 'morning' : character.age < 60 ? 'day' : 'evening';

    let moment: string | undefined;
    if (!character.isAlive) {
      // Deceased handled via isDeceased flag
    } else if (character.age === 0) {
      moment = 'born';
    } else if (character.age === 1) {
      moment = 'baby';
    } else if (character.age === 18 && character.stage === 'service') {
      moment = 'mil';
    } else if (character.age === 18) {
      moment = 'grad';
    } else if (character.married && character.age >= 20 && character.age <= 22) {
      moment = 'wed';
    }

    // Map living household family members for pixel art scene
    let familyMembers: ScenePerson[] | undefined;
    if (character.family) {
      const members: ScenePerson[] = [
        { role: 'me', age: character.age, sex: character.sex }
      ];
      if (character.age < 20) {
        if (character.family.mother.isAlive) {
          members.push({ role: 'par', age: character.family.mother.age, sex: 'F' });
        }
        if (character.family.father.isAlive && !character.family.father.isAbsent) {
          members.push({ role: 'par', age: character.family.father.age, sex: 'M' });
        }
        for (const sib of character.family.siblings) {
          if (sib.isAlive && sib.atHome) {
            members.push({ role: 'sib', age: sib.age, sex: sib.sex });
          }
        }
      } else {
        if (character.family.partner && character.family.partner.isAlive && character.family.partner.isCohabiting) {
          members.push({
            role: 'pt',
            age: character.family.partner.age,
            sex: character.family.partner.sex || (character.sex === 'M' ? 'F' : 'M'),
          });
        }
        for (const child of character.family.children) {
          if (child.isAlive && child.atHome) {
            members.push({ role: 'kid', age: child.age, sex: child.sex });
          }
        }
      }
      familyMembers = members;
    }

    return {
      age: character.age,
      sex: character.sex,
      countryId: character.country.id,
      wealthQuintile: character.wealth.quintile,
      homeType,
      familyMembers,
      vehicleType,
      timeOfDay,
      mood,
      urban: character.country.urb > 50,
      region: character.country.p,
      jobId: character.currentJob,
      isDeceased: !character.isAlive,
      moment,
      seed: `${character.id || character.name}_${character.birthYear}_${character.age}`,
    };
  }, [character]);

  const sceneCaption = useMemo(() => {
    if (!character.isAlive) {
      return `Вечная память · ${character.country.ru} (${character.age} лет)`;
    }
    const jobText = character.currentJob ? ` · ${character.currentJob}` : '';
    const homeText = character.flags?.inPrison
      ? 'В заключении'
      : character.flags?.refugee
      ? 'Лагерь беженцев'
      : character.wealth.quintile >= 4
      ? 'Собственный особняк'
      : character.wealth.quintile >= 3
      ? 'Семейный дом'
      : character.country.urb > 50
      ? 'Городская квартира'
      : 'Сельское жильё';
    return `${character.country.ru} · ${homeText}${jobText} (${character.age} лет)`;
  }, [character]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5">
      {/* Top Hero Bar: Kinetic Age Odometer, Country & Pacing Controls */}
      <div className="bg-canvas-card border-3 border-black rounded-3xl p-5 sm:p-7 shadow-[6px_6px_0px_#00F0FF] relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Character Identity & Stage */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xl select-none" role="img" aria-label={character.country.ru}>
                {flag}
              </span>
              <span className="font-display font-black text-xl sm:text-2xl text-white">
                {character.name}
              </span>
              <span className="text-xs font-mono text-gray-400">
                · {character.country.ru}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase border border-black shadow-neo-sm ${stageInfo.color}`}
              >
                {stageInfo.label}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-gray-300">
              <span>Год: <strong className="text-neon-cyan">{character.year}</strong></span>
              <span>·</span>
              <span>Пол: <strong>{character.sex === 'M' ? 'Мужской' : 'Женский'}</strong></span>
              {character.currentJob && (
                <>
                  <span>·</span>
                  <span className="text-neon-yellow">Профессия: {character.currentJob}</span>
                </>
              )}
            </div>
          </div>

          {/* Kinetic Age Odometer & Pacing Action Buttons */}
          <div className="flex items-center gap-3 self-start lg:self-auto">
            {/* Age Display */}
            <div className="bg-black border-2 border-neon-cyan px-4 py-2 rounded-2xl shadow-neo flex flex-col items-center justify-center min-w-[90px]">
              <span className="text-[10px] font-mono text-neon-cyan font-bold uppercase tracking-widest">
                ВОЗРАСТ
              </span>
              <motion.span
                key={character.age}
                initial={{ scale: 1.25, color: '#FFE600' }}
                animate={{ scale: 1, color: '#FFFFFF' }}
                transition={{ duration: 0.2 }}
                className="font-mono font-black text-2xl sm:text-3xl leading-none"
              >
                {character.age}
              </motion.span>
              <span className="text-[10px] font-mono text-gray-400">
                {character.age === 1 ? 'ГОД' : character.age < 5 ? 'ГОДА' : 'ЛЕТ'}
              </span>
            </div>

            {/* +1 ГОД BUTTON */}
            <button
              type="button"
              data-testid="age-step-btn"
              onClick={handleStepClick}
              disabled={!character.isAlive}
              className="bg-neon-lime text-black font-display font-black text-sm sm:text-base px-5 py-3.5 rounded-2xl border-3 border-black shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-100 flex items-center gap-2 cursor-pointer uppercase select-none disabled:opacity-50"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>+1 ГОД</span>
            </button>

            {/* TURBO AUTO-PLAY TOGGLE */}
            <button
              type="button"
              data-testid="turbo-toggle"
              onClick={handleTurboClick}
              disabled={!character.isAlive}
              aria-label={isTurbo ? 'Остановить турбо-режим' : 'Запустить турбо-режим'}
              className={`font-display font-black text-xs sm:text-sm px-4 py-3.5 rounded-2xl border-3 border-black shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-100 flex items-center gap-2 cursor-pointer uppercase select-none ${
                isTurbo
                  ? 'bg-neon-pink text-white animate-pulse'
                  : 'bg-neon-yellow text-black'
              }`}
            >
              {isTurbo ? (
                <>
                  <Pause className="w-4 h-4 fill-white stroke-neon-pink" />
                  <span>ТУРБО: ВКЛ</span>
                </>
              ) : (
                <>
                  <FastForward className="w-4 h-4 fill-black stroke-neon-yellow" />
                  <span>ТУРБО 0.3s</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4 Dynamic Attribute Bars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-4 border-t border-canvas-border">
          {/* Health */}
          <div className="bg-canvas-dark p-3 rounded-2xl border border-canvas-border">
            <div className="flex justify-between items-center text-xs font-mono mb-1.5">
              <span className="flex items-center gap-1.5 text-neon-lime font-bold">
                <Heart className="w-3.5 h-3.5 fill-neon-lime/20" /> Здоровье
              </span>
              <span className="font-bold text-white">{character.stats.health}%</span>
            </div>
            <div className="w-full h-2.5 bg-black rounded-full overflow-hidden border border-black/80">
              <motion.div
                className="h-full bg-neon-lime"
                animate={{ width: `${character.stats.health}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>

          {/* Happiness */}
          <div className="bg-canvas-dark p-3 rounded-2xl border border-canvas-border">
            <div className="flex justify-between items-center text-xs font-mono mb-1.5">
              <span className="flex items-center gap-1.5 text-neon-yellow font-bold">
                <Smile className="w-3.5 h-3.5 fill-neon-yellow/20" /> Счастье
              </span>
              <span className="font-bold text-white">{character.stats.happiness}%</span>
            </div>
            <div className="w-full h-2.5 bg-black rounded-full overflow-hidden border border-black/80">
              <motion.div
                className="h-full bg-neon-yellow"
                animate={{ width: `${character.stats.happiness}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>

          {/* Smarts */}
          <div className="bg-canvas-dark p-3 rounded-2xl border border-canvas-border">
            <div className="flex justify-between items-center text-xs font-mono mb-1.5">
              <span className="flex items-center gap-1.5 text-neon-cyan font-bold">
                <Brain className="w-3.5 h-3.5 fill-neon-cyan/20" /> Интеллект
              </span>
              <span className="font-bold text-white">{character.stats.smarts}%</span>
            </div>
            <div className="w-full h-2.5 bg-black rounded-full overflow-hidden border border-black/80">
              <motion.div
                className="h-full bg-neon-cyan"
                animate={{ width: `${character.stats.smarts}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>

          {/* Social */}
          <div className="bg-canvas-dark p-3 rounded-2xl border border-canvas-border">
            <div className="flex justify-between items-center text-xs font-mono mb-1.5">
              <span className="flex items-center gap-1.5 text-purple-400 font-bold">
                <Users className="w-3.5 h-3.5 fill-purple-400/20" /> Отношения
              </span>
              <span className="font-bold text-white">{character.stats.social}%</span>
            </div>
            <div className="w-full h-2.5 bg-black rounded-full overflow-hidden border border-black/80">
              <motion.div
                className="h-full bg-purple-400"
                animate={{ width: `${character.stats.social}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>
        </div>

        {/* Financial & Global Wealth Percentile Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 mt-3 border-t border-canvas-border/60">
          <div className="bg-canvas-dark/80 px-3.5 py-2.5 rounded-xl border border-canvas-border flex items-center justify-between">
            <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-neon-lime" /> Доход (PPP):
            </span>
            <span className="font-mono font-bold text-white text-sm">
              ${character.wealth.incomeUSD.toLocaleString()} / год
            </span>
          </div>

          <div className="bg-canvas-dark/80 px-3.5 py-2.5 rounded-xl border border-canvas-border flex items-center justify-between">
            <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-neon-yellow" /> Состояние (Net Worth):
            </span>
            <span className="font-mono font-bold text-white text-sm">
              ${character.wealth.netWorthUSD.toLocaleString()}
            </span>
          </div>

          <div className="bg-canvas-dark/80 px-3.5 py-2.5 rounded-xl border border-canvas-border flex items-center justify-between">
            <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
              <Globe2 className="w-3.5 h-3.5 text-neon-cyan" /> В мире:
            </span>
            <span className="font-mono font-black text-neon-yellow text-xs sm:text-sm">
              Топ {topWealthPct}% населения Земли
            </span>
          </div>
        </div>
      </div>

      {/* Living Procedural Pixel Art Illustration */}
      <PixelArtScene
        context={sceneContext}
        caption={sceneCaption}
        className="w-full"
      />

      {/* Living Demographic Family & Relational Dossier */}
      {character.family && (
        <FamilyCard family={character.family} playerAge={character.age} />
      )}

      {/* Strategic Annual Focus Selector (All 15 Focuses) */}
      <div className="bg-canvas-card border-3 border-black rounded-3xl p-4 sm:p-6 shadow-neo space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-canvas-border pb-2.5">
          <div>
            <div className="text-xs font-mono font-black text-neon-yellow uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Стратегический фокус года (15 направлений)
            </div>
            <div className="text-xs text-gray-300 font-sans">
              Выберите приоритет развития на следующий год жизни:
            </div>
          </div>

          {/* Active Focus Effect Summary */}
          {activeFocusDef && (
            <div className="bg-black text-neon-cyan px-3 py-1 rounded-xl border border-neon-cyan text-xs font-mono font-bold">
              {activeFocusDef.icon} {activeFocusDef.effectsSummaryRu}
            </div>
          )}
        </div>

        {/* 15 Focus Pills Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-15 gap-1.5">
          {ALL_15_FOCUSES.map((focusKey) => {
            const def = FOCUS_DEFINITIONS[focusKey];
            if (!def) return null;
            const isSelected = currentFocus === focusKey;
            const isSubstanceOrCrime = focusKey === 'substance' || focusKey === 'crime';

            return (
              <button
                key={focusKey}
                type="button"
                onClick={() => {
                  soundEngine.unlock();
                  soundEngine.play('click');
                  onSelectFocus(focusKey);
                }}
                onMouseEnter={() => setHoveredFocus(focusKey)}
                onMouseLeave={() => setHoveredFocus(null)}
                title={`${def.labelRu}: ${def.effectsSummaryRu}`}
                className={`p-2 rounded-xl border-2 flex flex-col items-center justify-center text-center transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-neon-yellow text-black border-black shadow-neo-sm scale-105'
                    : isSubstanceOrCrime
                    ? 'bg-canvas-dark text-gray-200 border-neon-pink/40 hover:border-neon-pink hover:text-white'
                    : 'bg-canvas-dark text-gray-300 border-black hover:border-neon-cyan hover:text-white'
                }`}
              >
                <span className="text-lg mb-0.5">{def.icon}</span>
                <span className="text-[10px] font-mono font-bold leading-tight truncate w-full">
                  {def.labelRu.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Detailed Description Tooltip */}
        {activeFocusDef && (
          <div className="text-[11px] font-sans text-gray-400 bg-canvas-dark p-2.5 rounded-xl border border-canvas-border flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-neon-yellow shrink-0" />
            <span>
              <strong>{activeFocusDef.labelRu}:</strong> {activeFocusDef.descriptionRu}
            </span>
          </div>
        )}
      </div>

      {/* Grid & Chronicle Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: 10x10 Matrix (5 cols) */}
        <div className="lg:col-span-5">
          <LifeGrid
            currentAge={character.age}
            isAlive={character.isAlive}
            history={character.history}
          />
        </div>

        {/* Right: Chronicle Feed (7 cols) */}
        <div className="lg:col-span-7">
          <ChronicleFeed events={character.history ?? []} />
        </div>
      </div>

      {/* 4 Parallel Companion Lives */}
      {character.companions && character.companions.length > 0 && (
        <CompanionLivesCard companions={character.companions} />
      )}
    </div>
  );
};

export default LifeDashboard;
