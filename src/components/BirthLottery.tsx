import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Globe2,
  RefreshCw,
  ArrowRight,
  Heart,
  Smile,
  Brain,
  Users,
  TrendingUp,
  Baby,
  DollarSign,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import type { CountryDemographics } from '../types/demographics';
import type { CharacterState } from '../types/simulation';
import { COUNTRIES } from '../data/countries';
import { generateBirth } from '../engine/simulationCore';
import { soundEngine } from '../engine/soundEngine';

export const ISO3_TO_FLAG: Record<string, string> = {
  AFG: '🇦🇫', ALB: '🇦🇱', DZA: '🇩🇿', AND: '🇦🇩', AGO: '🇦🇴', ARG: '🇦🇷', ARM: '🇦🇲', AUS: '🇦🇺',
  AUT: '🇦🇹', AZE: '🇦🇿', BHS: '🇧🇸', BHR: '🇧🇭', BGD: '🇧🇩', BLR: '🇧🇾', BEL: '🇧🇪', BLZ: '🇧🇿',
  BEN: '🇧🇯', BTN: '🇧🇹', BOL: '🇧🇴', BIH: '🇧🇦', BWA: '🇧🇼', BRA: '🇧🇷', BRN: '🇧🇳', BGR: '🇧🇬',
  BFA: '🇧🇫', BDI: '🇧🇮', KHM: '🇰🇭', CMR: '🇨🇲', CAN: '🇨🇦', CAF: '🇨🇫', TCD: '🇹🇩', CHL: '🇨🇱',
  CHN: '🇨🇳', COL: '🇨🇴', COG: '🇨🇬', CRI: '🇨🇷', CIV: '🇨🇮', HRV: '🇭🇷', CUB: '🇨🇺', CYP: '🇨🇾',
  CZE: '🇨🇿', COD: '🇨🇩', DNK: '🇩🇰', DOM: '🇩🇴', ECU: '🇪🇨', EGY: '🇪🇬', SLV: '🇸🇻', GNQ: '🇬🇶',
  ERI: '🇪🇷', EST: '🇪🇪', ETH: '🇪🇹', FIN: '🇫🇮', FRA: '🇫🇷', GAB: '🇬🇦', GMB: '🇬🇲', GEO: '🇬🇪',
  DEU: '🇩🇪', GHA: '🇬🇭', GRC: '🇬🇷', GTM: '🇬🇹', GIN: '🇬🇳', GNB: '🇬🇼', GUY: '🇬🇾', HTI: '🇭🇹',
  HND: '🇭🇳', HUN: '🇭🇺', ISL: '🇮🇸', IND: '🇮🇳', IDN: '🇮🇩', IRN: '🇮🇷', IRQ: '🇮🇶', IRL: '🇮🇪',
  ISR: '🇮🇱', ITA: '🇮🇹', JAM: '🇯🇲', JPN: '🇯🇵', JOR: '🇯🇴', KAZ: '🇰🇿', KEN: '🇰🇪', PRK: '🇰🇵',
  KOR: '🇰🇷', KWT: '🇰🇼', KGZ: '🇰🇬', LAO: '🇱🇦', LVA: '🇱🇻', LBN: '🇱🇧', LSO: '🇱🇸', LBR: '🇱🇷',
  LBY: '🇱🇾', LTU: '🇱🇹', LUX: '🇱🇺', MDG: '🇲🇬', MWI: '🇲🇼', MYS: '🇲🇾', MDV: '🇲🇻', MLI: '🇲🇱',
  MLT: '🇲🇹', MRT: '🇲🇷', MUS: '🇲🇺', MEX: '🇲🇽', MDA: '🇲🇩', MCO: '🇲🇨', MNG: '🇲🇳', MNE: '🇲🇪',
  MAR: '🇲🇦', MOZ: '🇲🇿', MMR: '🇲🇲', NAM: '🇳🇦', NPL: '🇳🇵', NLD: '🇳🇱', NZL: '🇳🇿', NIC: '🇳🇮',
  NER: '🇳🇪', NGA: '🇳🇬', MKD: '🇲🇰', NOR: '🇳🇴', OMN: '🇴🇲', PAK: '🇵🇰', PAN: '🇵🇦', PNG: '🇵🇬',
  PRY: '🇵🇾', PER: '🇵🇪', PHL: '🇵🇭', POL: '🇵🇱', PRT: '🇵🇹', QAT: '🇶🇦', ROU: '🇷🇴', RUS: '🇷🇺',
  RWA: '🇷🇼', SAU: '🇸🇦', SEN: '🇸🇳', SRB: '🇷🇸', SLE: '🇸🇱', SGP: '🇸🇬', SVK: '🇸🇰', SVN: '🇸🇮',
  SOM: '🇸🇴', ZAF: '🇿🇦', SSD: '🇸🇸', ESP: '🇪🇸', LKA: '🇱🇰', SDN: '🇸🇩', SUR: '🇸🇷', SWE: '🇸🇪',
  CHE: '🇨🇭', SYR: '🇸🇾', TWN: '🇹🇼', TJK: '🇹🇯', TZA: '🇹🇿', THA: '🇹🇭', TLS: '🇹🇱', TGO: '🇹🇬',
  TTO: '🇹🇹', TUN: '🇹🇳', TUR: '🇹🇷', TKM: '🇹🇲', UGA: '🇺🇬', UKR: '🇺🇦', ARE: '🇦🇪', GBR: '🇬🇧',
  USA: '🇺🇸', URY: '🇺🇾', UZB: '🇺🇿', VEN: '🇻🇪', VNM: '🇻🇳', YEM: '🇾🇪', ZMB: '🇿🇲', ZWE: '🇿🇼'
};

export function getCountryFlag(iso3: string): string {
  return ISO3_TO_FLAG[iso3.toUpperCase()] ?? '🌐';
}

export const REGION_NAMES: Record<string, string> = {
  sa: 'Южная Азия',
  mena: 'Ближний Восток и Сев. Африка',
  ssa: 'Африка южнее Сахары',
  lac: 'Латинская Америка',
  eap: 'Восточная Азия и Океания',
  eca: 'Европа и Центральная Азия',
  hi: 'Высокий доход (ОЭСР)',
};

const SORTED_COUNTRIES_BY_BIRTHS = [...COUNTRIES].sort((a, b) => b.b - a.b);

export function getGlobalBirthRank(countryId: string): number {
  const index = SORTED_COUNTRIES_BY_BIRTHS.findIndex((c) => c.id === countryId);
  return index >= 0 ? index + 1 : 1;
}

export interface BirthLotteryProps {
  onStartLife: (character: CharacterState) => void;
  initialCharacter?: CharacterState;
}

export const BirthLottery: React.FC<BirthLotteryProps> = ({
  onStartLife,
  initialCharacter,
}) => {
  const [character, setCharacter] = useState<CharacterState>(() => {
    return (
      initialCharacter ??
      generateBirth({
        seed: Math.floor(Math.random() * 1000000),
        mode: 'birth',
      })
    );
  });

  const [samplingMode, setSamplingMode] = useState<'birth' | 'pop'>('birth');
  const [isSpinning, setIsSpinning] = useState(false);

  const country: CountryDemographics = character.country;
  const flag = getCountryFlag(country.id);
  const birthRank = useMemo(() => getGlobalBirthRank(country.id), [country.id]);
  const regionName = REGION_NAMES[country.p] ?? country.p;

  const handleRollAgain = () => {
    setIsSpinning(true);
    soundEngine.unlock();
    soundEngine.play('click');

    setTimeout(() => {
      const nextChar = generateBirth({
        seed: Math.floor(Math.random() * 1000000),
        mode: samplingMode,
      });
      setCharacter(nextChar);
      setIsSpinning(false);
      soundEngine.play('step');
    }, 150);
  };

  const handleStartLife = () => {
    soundEngine.unlock();
    soundEngine.play('milestone');

    const conditionsText = `Ожидаемая продолжительность жизни: ${country.le.toFixed(
      1
    )} лет. Доход на душу: $${Math.round(country.ppp).toLocaleString()} в год.`;
    soundEngine.speakBirth(country.ru, conditionsText);

    onStartLife(character);
  };

  const quintileDescription = (q: number) => {
    switch (q) {
      case 1:
        return 'Самые бедные 20% (бедность)';
      case 2:
        return 'Низший средний класс';
      case 3:
        return 'Средний класс';
      case 4:
        return 'Зажиточный слой';
      case 5:
        return 'Топ 20% богатейших граждан';
      default:
        return 'Средний класс';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Neo-brutalist Header / Lottery Banner */}
      <div className="bg-canvas-card border-3 border-black rounded-3xl p-6 sm:p-8 shadow-[6px_6px_0px_#00F0FF] relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neon-yellow text-black font-mono font-black text-xs uppercase border border-black shadow-neo-sm">
              <Sparkles className="w-3.5 h-3.5" />
              ЛОТЕРЕЯ РОЖДЕНИЯ
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-canvas-subtle text-neon-cyan font-mono font-bold text-xs uppercase border border-canvas-border">
              <Globe2 className="w-3.5 h-3.5" />
              1 ИЗ 8,142,000,000
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-canvas-dark p-1 rounded-xl border border-canvas-border">
            <button
              type="button"
              onClick={() => setSamplingMode('birth')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                samplingMode === 'birth'
                  ? 'bg-neon-cyan text-black border border-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              По рождаемости
            </button>
            <button
              type="button"
              onClick={() => setSamplingMode('pop')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                samplingMode === 'pop'
                  ? 'bg-neon-cyan text-black border border-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              По населению
            </button>
          </div>
        </div>

        <h1 className="text-2xl sm:text-4xl font-display font-black tracking-tight text-white mb-2">
          ВЫ РОДИЛИСЬ: <span className="text-neon-cyan">{character.name}</span>
        </h1>
        <p className="text-gray-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
          Судьба распорядилась бросить жребий в глобальном распределении человечества. Реальные вероятности ООН WPP 2024 и ВОЗ.
        </p>
      </div>

      {/* Main Country Reveal & Character Dossier Card */}
      <motion.div
        key={character.id}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-12 gap-5"
      >
        {/* Country Highlight Card (7 cols) */}
        <div className="md:col-span-7 bg-canvas-card border-3 border-black rounded-3xl p-5 sm:p-7 shadow-[6px_6px_0px_#FFE600] flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4">
            {/* Country Flag & Names */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-4xl sm:text-5xl select-none" role="img" aria-label={country.ru}>
                    {flag}
                  </span>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-display font-black text-white leading-tight">
                      {country.ru}
                    </h2>
                    <div className="text-xs font-mono text-neon-yellow font-bold uppercase tracking-wider">
                      {regionName} · {country.id}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-1 bg-black text-neon-cyan border border-neon-cyan rounded-xl text-xs font-mono font-black shadow-neo-sm">
                  #{birthRank} В МИРЕ
                </span>
                <div className="text-[10px] text-gray-400 font-mono mt-1">по числу рождений</div>
              </div>
            </div>

            {/* Empirical Demographic Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
              <div className="bg-canvas-dark p-3 rounded-xl border border-canvas-border">
                <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-mono">
                  <TrendingUp className="w-3.5 h-3.5 text-neon-lime" />
                  <span>Жизнь (e0)</span>
                </div>
                <div className="text-base sm:text-lg font-mono font-black text-white mt-0.5">
                  {country.le.toFixed(1)} <span className="text-xs text-gray-400 font-normal">лет</span>
                </div>
              </div>

              <div className="bg-canvas-dark p-3 rounded-xl border border-canvas-border">
                <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-mono">
                  <Baby className="w-3.5 h-3.5 text-neon-pink" />
                  <span>Млад. смертность</span>
                </div>
                <div className="text-base sm:text-lg font-mono font-black text-white mt-0.5">
                  {country.im.toFixed(1)} <span className="text-xs text-gray-400 font-normal">/ 1к</span>
                </div>
              </div>

              <div className="bg-canvas-dark p-3 rounded-xl border border-canvas-border">
                <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-mono">
                  <DollarSign className="w-3.5 h-3.5 text-neon-yellow" />
                  <span>ВВП (PPP)</span>
                </div>
                <div className="text-base sm:text-lg font-mono font-black text-white mt-0.5">
                  ${Math.round(country.ppp).toLocaleString()}
                </div>
              </div>

              <div className="bg-canvas-dark p-3 rounded-xl border border-canvas-border">
                <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-mono">
                  <Users className="w-3.5 h-3.5 text-neon-cyan" />
                  <span>Население</span>
                </div>
                <div className="text-base sm:text-lg font-mono font-black text-white mt-0.5">
                  {(country.pop / 1000).toFixed(1)} <span className="text-xs text-gray-400 font-normal">млн</span>
                </div>
              </div>

              <div className="bg-canvas-dark p-3 rounded-xl border border-canvas-border">
                <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-mono">
                  <Globe2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Рождений / год</span>
                </div>
                <div className="text-base sm:text-lg font-mono font-black text-white mt-0.5">
                  {(country.b / 1000).toFixed(1)} <span className="text-xs text-gray-400 font-normal">тыс.</span>
                </div>
              </div>

              <div className="bg-canvas-dark p-3 rounded-xl border border-canvas-border">
                <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-mono">
                  <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
                  <span>Индекс Джини</span>
                </div>
                <div className="text-base sm:text-lg font-mono font-black text-white mt-0.5">
                  {(country.gi * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-canvas-border text-xs text-gray-400 flex items-center justify-between">
            <span>Источник данных: UN WPP 2024 / WHO GHE</span>
            <span className="font-mono text-neon-cyan">Год старта: {character.year}</span>
          </div>
        </div>

        {/* Character Biological & Social Dossier (5 cols) */}
        <div className="md:col-span-5 bg-canvas-card border-3 border-black rounded-3xl p-5 sm:p-7 shadow-[6px_6px_0px_#39FF14] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-black text-neon-lime uppercase tracking-wider">
                ДОСЬЕ НОВОРОЖДЕННОГО
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-black text-white border border-white/20">
                Пол: {character.sex === 'M' ? 'Мужской ♂' : 'Женский ♀'}
              </span>
            </div>

            <div className="text-xl font-display font-black text-white mb-1">
              {character.name}
            </div>
            <div className="text-xs text-gray-300 font-sans mb-4">
              Семья:{' '}
              <span className="font-mono text-neon-yellow font-bold">
                {quintileDescription(character.wealth.quintile)}
              </span>
            </div>

            {/* Baseline 4 Attributes */}
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="flex items-center gap-1 text-neon-lime">
                    <Heart className="w-3.5 h-3.5 fill-neon-lime/20" /> Здоровье
                  </span>
                  <span className="font-bold text-white">{character.stats.health} / 100</span>
                </div>
                <div className="w-full h-2.5 bg-canvas-dark rounded-full overflow-hidden border border-black">
                  <div
                    className="h-full bg-neon-lime transition-all duration-300"
                    style={{ width: `${character.stats.health}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="flex items-center gap-1 text-neon-yellow">
                    <Smile className="w-3.5 h-3.5 fill-neon-yellow/20" /> Счастье
                  </span>
                  <span className="font-bold text-white">{character.stats.happiness} / 100</span>
                </div>
                <div className="w-full h-2.5 bg-canvas-dark rounded-full overflow-hidden border border-black">
                  <div
                    className="h-full bg-neon-yellow transition-all duration-300"
                    style={{ width: `${character.stats.happiness}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="flex items-center gap-1 text-neon-cyan">
                    <Brain className="w-3.5 h-3.5 fill-neon-cyan/20" /> Интеллект
                  </span>
                  <span className="font-bold text-white">{character.stats.smarts} / 100</span>
                </div>
                <div className="w-full h-2.5 bg-canvas-dark rounded-full overflow-hidden border border-black">
                  <div
                    className="h-full bg-neon-cyan transition-all duration-300"
                    style={{ width: `${character.stats.smarts}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="flex items-center gap-1 text-purple-400">
                    <Users className="w-3.5 h-3.5 fill-purple-400/20" /> Отношения
                  </span>
                  <span className="font-bold text-white">{character.stats.social} / 100</span>
                </div>
                <div className="w-full h-2.5 bg-canvas-dark rounded-full overflow-hidden border border-black">
                  <div
                    className="h-full bg-purple-400 transition-all duration-300"
                    style={{ width: `${character.stats.social}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-canvas-dark p-3 rounded-xl border border-canvas-border text-[11px] text-gray-400 leading-snug">
            💡 Стартовые параметры рассчитаны на основе младенческой смертности, ожидаемых лет обучения и национального неравенства.
          </div>
        </div>
      </motion.div>

      {/* Action Buttons: Start Life & Reroll */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={handleRollAgain}
          disabled={isSpinning}
          className="w-full sm:w-auto bg-canvas-card hover:bg-canvas-subtle text-white font-mono text-sm font-bold px-6 py-4 rounded-2xl border-3 border-black shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-100 flex items-center justify-center gap-2 cursor-pointer select-none"
        >
          <RefreshCw className={`w-4 h-4 text-neon-cyan ${isSpinning ? 'animate-spin' : ''}`} />
          <span>КРУТИТЬ ЗАНОВО (ДРУГАЯ СУДЬБА)</span>
        </button>

        <button
          type="button"
          data-testid="birth-btn"
          onClick={handleStartLife}
          className="w-full sm:w-auto bg-neon-lime text-black font-display font-black text-lg sm:text-xl px-10 py-4 rounded-2xl border-3 border-black shadow-neo-lime hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-100 flex items-center justify-center gap-3 cursor-pointer uppercase select-none"
        >
          <span>РОДИТЬСЯ НА СВЕТ</span>
          <ArrowRight className="w-6 h-6 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};

export default BirthLottery;
