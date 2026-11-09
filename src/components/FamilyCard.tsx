import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  ChevronDown,
  Home,
  Heart,
  Briefcase,
  Baby,
} from 'lucide-react';
import type { FamilyState } from '../types/family';

export interface FamilyCardProps {
  family: FamilyState;
  playerAge: number;
}

export const FamilyCard: React.FC<FamilyCardProps> = ({ family, playerAge }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const aliveSibs = family.siblings.filter((s) => s.isAlive);
  const deceasedSibs = family.siblings.filter((s) => !s.isAlive);
  const aliveChildren = family.children.filter((c) => c.isAlive);
  const householdSize = family.household?.size ?? (1 + (family.mother.isAlive ? 1 : 0) + (family.father.isAlive && !family.father.isAbsent ? 1 : 0) + aliveSibs.filter(s => s.atHome).length);

  // Marital / Relationship summary string
  const maritalStatusText = family.partner
    ? family.partner.isMarried
      ? `В браке с ${family.partner.name}`
      : `В отношениях с ${family.partner.name}`
    : playerAge >= 18
    ? 'Холост / не в браке'
    : 'Детство';

  return (
    <div
      data-testid="family-card"
      className="bg-canvas-card border-3 border-black rounded-3xl p-5 shadow-neo transition-all duration-150"
    >
      {/* Header with Quick Info & Expand Toggle */}
      <div
        data-testid="family-accordion-toggle"
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border-2 border-purple-500 flex items-center justify-center text-purple-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-black text-white text-base tracking-wide uppercase">
                Семья и жизнь
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500 text-purple-300 font-mono text-[10px] font-bold">
                {`${householdSize} чел. в доме`}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-sans mt-0.5">
              {family.housing.typeRu || family.housing.type} • {family.housing.city}
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-label={isExpanded ? 'Свернуть семью' : 'Развернуть семью'}
          className="w-8 h-8 rounded-xl bg-black border-2 border-canvas-border flex items-center justify-center text-gray-300 hover:text-white hover:border-purple-400 transition-all cursor-pointer"
        >
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </button>
      </div>

      {/* Compact Quick Summary Pill Row (Always Visible) */}
      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-canvas-border/60">
        {/* Mother preview */}
        <span
          data-testid="mother-preview-pill"
          className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border flex items-center gap-1.5 ${
            family.mother.isAlive
              ? 'bg-canvas-dark text-white border-canvas-border'
              : 'bg-black text-gray-500 border-red-900/50 line-through'
          }`}
        >
          👩 Мать:{' '}
          {family.mother.isAlive
            ? `${family.mother.name} (${family.mother.age} лет)`
            : `Память (${family.mother.diedAtAge || family.mother.age} лет)`}
        </span>

        {/* Father preview */}
        <span
          data-testid="father-preview-pill"
          className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border flex items-center gap-1.5 ${
            family.father.isAbsent
              ? 'bg-black text-amber-400 border-amber-900/60'
              : family.father.isAlive
              ? 'bg-canvas-dark text-white border-canvas-border'
              : 'bg-black text-gray-500 border-red-900/50 line-through'
          }`}
        >
          👨 Отец:{' '}
          {family.father.isAbsent
            ? 'Ушел из семьи'
            : family.father.isAlive
            ? `${family.father.name} (${family.father.age} лет)`
            : `Память (${family.father.diedAtAge || family.father.age} лет)`}
        </span>

        {/* Siblings count */}
        <span
          data-testid="siblings-preview-pill"
          className="px-2.5 py-1 rounded-xl bg-canvas-dark text-neon-cyan border border-canvas-border text-xs font-mono font-bold"
        >
          {`👶 Братья/Сестры: ${aliveSibs.length}`}
        </span>

        {/* Marital / Romance Status */}
        <span
          data-testid="romance-preview-pill"
          className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border ${
            family.partner
              ? family.partner.isMarried
                ? 'bg-neon-pink/20 text-neon-pink border-neon-pink'
                : 'bg-purple-900/30 text-purple-300 border-purple-500'
              : 'bg-canvas-dark text-gray-400 border-canvas-border'
          }`}
        >
          {family.partner
            ? `${family.partner.isMarried ? '💍' : '❤️'} ${maritalStatusText} (${family.partner.age} лет)`
            : `👤 ${maritalStatusText}`}
        </span>

        {/* Children preview */}
        {aliveChildren.length > 0 && (
          <span
            data-testid="children-preview-pill"
            className="px-2.5 py-1 rounded-xl bg-neon-yellow/10 text-neon-yellow border border-neon-yellow/40 text-xs font-mono font-bold"
          >
            {`🍼 Дети: ${aliveChildren.length}`}
          </span>
        )}

        {/* Housing preview */}
        <span
          data-testid="housing-preview-pill"
          className="px-2.5 py-1 rounded-xl bg-canvas-dark text-gray-300 border border-canvas-border text-xs font-mono"
        >
          🏠 {family.housing.ownership ? 'Собственность' : 'Аренда'}
        </span>
      </div>

      {/* Expanded Accordion Body */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            data-testid="family-accordion-body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden space-y-4 mt-4 pt-4 border-t border-canvas-border"
          >
            {/* 1. Parents Section */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-mono font-black uppercase text-gray-400 tracking-wider">
                Родители
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Mother Card */}
                <div
                  data-testid="mother-card"
                  className="bg-canvas-dark p-3.5 rounded-2xl border border-canvas-border flex items-start justify-between"
                >
                  <div className="space-y-1">
                    <div className="font-mono font-bold text-sm text-white flex items-center gap-1.5">
                      <span>{family.mother.name}</span>
                      <span className="text-xs text-gray-400">(Мать)</span>
                    </div>
                    <div className="text-xs text-gray-300 font-sans flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-neon-cyan shrink-0" />
                      <span>{family.mother.jobTitleRu || family.mother.job}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      data-testid="mother-status-badge"
                      className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold ${
                        family.mother.isAlive
                          ? 'bg-neon-lime/20 text-neon-lime border border-neon-lime/40'
                          : 'bg-red-500/20 text-red-400 border border-red-500/40 line-through'
                      }`}
                    >
                      {family.mother.isAlive ? `${family.mother.age} лет` : 'Умерла'}
                    </span>
                  </div>
                </div>

                {/* Father Card */}
                <div
                  data-testid="father-card"
                  className="bg-canvas-dark p-3.5 rounded-2xl border border-canvas-border flex items-start justify-between"
                >
                  <div className="space-y-1">
                    <div className="font-mono font-bold text-sm text-white flex items-center gap-1.5">
                      <span>{family.father.name}</span>
                      <span className="text-xs text-gray-400">(Отец)</span>
                    </div>
                    <div className="text-xs text-gray-300 font-sans flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-neon-cyan shrink-0" />
                      <span>{family.father.jobTitleRu || family.father.job}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      data-testid="father-status-badge"
                      className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold ${
                        family.father.isAbsent
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : family.father.isAlive
                          ? 'bg-neon-lime/20 text-neon-lime border border-neon-lime/40'
                          : 'bg-red-500/20 text-red-400 border border-red-500/40 line-through'
                      }`}
                    >
                      {family.father.isAbsent
                        ? 'Ушел из семьи'
                        : family.father.isAlive
                        ? `${family.father.age} лет`
                        : 'Умер'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Siblings Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-mono font-black uppercase text-gray-400 tracking-wider">
                  Братья и сёстры ({family.siblings.length})
                </h4>
                {deceasedSibs.length > 0 && (
                  <span className="text-[10px] font-mono text-gray-500">
                    {deceasedSibs.length} умерло
                  </span>
                )}
              </div>

              {family.siblings.length === 0 ? (
                <div className="bg-canvas-dark p-3 rounded-2xl border border-canvas-border text-xs font-mono text-gray-400 text-center">
                  Единственный ребенок в семье
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {family.siblings.map((sib) => (
                    <div
                      key={sib.id}
                      data-testid={`sibling-item-${sib.id}`}
                      className="bg-canvas-dark p-3 rounded-2xl border border-canvas-border flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-mono font-bold text-white flex items-center gap-1.5">
                          <span>{sib.name}</span>
                          <span className="text-[10px] text-gray-400 font-normal">
                            ({sib.sex === 'M' ? 'Брат' : 'Сестра'})
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {!sib.isAlive
                            ? 'Скончался(лась)'
                            : sib.atHome
                            ? 'Живет с вами в доме'
                            : 'Живет отдельно (съехал)'}
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                            !sib.isAlive
                              ? 'bg-red-500/10 text-red-400 line-through'
                              : sib.atHome
                              ? 'bg-neon-cyan/20 text-neon-cyan'
                              : 'bg-gray-800 text-gray-300'
                          }`}
                        >
                          {!sib.isAlive
                            ? `Умер(ла) в ${sib.diedAtAge || sib.age}`
                            : `${sib.age} лет`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Romantic Partner & Children Section */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-mono font-black uppercase text-gray-400 tracking-wider">
                Личная жизнь и брак
              </h4>

              <div className="bg-canvas-dark p-3.5 rounded-2xl border border-canvas-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-neon-pink" />
                    <span className="font-mono font-bold text-white text-sm">
                      {family.partner
                        ? `${family.partner.name} (${family.partner.age} лет)`
                        : playerAge >= 18
                        ? 'В настоящее время не в отношениях'
                        : 'Слишком юный возраст для брака'}
                    </span>
                  </div>

                  {family.partner && (
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        family.partner.isMarried
                          ? 'bg-neon-lime/20 text-neon-lime border border-neon-lime/50'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                      }`}
                    >
                      {family.partner.isMarried ? 'В браке 💍' : 'Отношения ❤️'}
                    </span>
                  )}
                </div>

                {family.partner && family.partner.professionRu && (
                  <div className="text-xs text-gray-400 font-sans flex items-center gap-1.5 pl-6">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                    <span>Профессия: {family.partner.professionRu}</span>
                  </div>
                )}
              </div>

              {/* Children List (if any) */}
              {family.children.length > 0 && (
                <div className="space-y-1.5 pl-1">
                  <span className="text-[10px] font-mono uppercase text-gray-400 font-bold">
                    Дети ({family.children.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {family.children.map((child) => (
                      <div
                        key={child.id}
                        className="bg-black/60 p-2.5 rounded-xl border border-canvas-border flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-1.5">
                          <Baby className="w-3.5 h-3.5 text-neon-yellow" />
                          <span className="font-mono font-bold text-white">
                            {child.name} ({child.sex === 'M' ? 'Сын' : 'Дочь'})
                          </span>
                        </div>
                        <span className="font-mono text-neon-yellow font-bold">
                          {child.age} лет {child.atHome ? '(с вами)' : '(съехал)'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Housing & Living Conditions Section */}
            <div
              data-testid="housing-dossier"
              className="bg-black/70 p-4 rounded-2xl border border-canvas-border space-y-3"
            >
              <div className="flex items-center justify-between border-b border-canvas-border/60 pb-2">
                <div className="flex items-center gap-2 text-xs font-mono font-black text-neon-yellow uppercase">
                  <Home className="w-4 h-4" />
                  <span>Жилищное досье и быт</span>
                </div>
                <span className="text-[11px] font-mono text-gray-400">
                  {family.housing.city}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Тип дома:</span>
                  <strong className="text-white">
                    {family.housing.typeRu || family.housing.type}
                  </strong>
                </div>

                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Форма владения:</span>
                  <strong className={family.housing.ownership ? 'text-neon-lime' : 'text-amber-400'}>
                    {family.housing.tenureRu || (family.housing.ownership ? 'Собственность' : 'Аренда')}
                  </strong>
                </div>

                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">С кем живете:</span>
                  <strong className="text-white truncate block" title={family.housing.livingWith}>
                    {family.housing.livingWith || 'С семьей'}
                  </strong>
                </div>

                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Коммуникации:</span>
                  <strong className="text-white">
                    {family.housing.electricity !== false ? '⚡ Свет' : '❌ Без света'},{' '}
                    {family.housing.runningWater !== false ? '💧 Вода' : '❌ Без воды'}
                  </strong>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FamilyCard;
