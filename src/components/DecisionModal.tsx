import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  Info,
  Flame,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import type { DecisionCard, DecisionOption } from '../types/events';
import { soundEngine } from '../engine/soundEngine';

export interface DecisionModalProps {
  decision: DecisionCard | null;
  onSelectOption: (optionId: string) => void;
  outcomeAlert?: {
    text: string;
    isRiskFailed: boolean;
    isDeath: boolean;
  } | null;
  onDismissOutcome?: () => void;
}

export const DecisionModal: React.FC<DecisionModalProps> = ({
  decision,
  onSelectOption,
  outcomeAlert,
  onDismissOutcome,
}) => {
  if (!decision && !outcomeAlert) return null;

  const handleChoose = (opt: DecisionOption) => {
    soundEngine.unlock();
    if (opt.riskPercentage && opt.riskPercentage > 30) {
      soundEngine.play('crisis');
    } else {
      soundEngine.play('click');
    }
    onSelectOption(opt.id);
  };

  const getBadgeStyle = (text: string) => {
    if (text.includes('Риск гибели') || text.includes('💀')) {
      return 'bg-red-600 text-white border-black';
    }
    if (text.includes('Риск') || text.includes('⚠️')) {
      return 'bg-neon-pink text-white border-black';
    }
    if (text.includes('18+') || text.includes('🔞')) {
      return 'bg-neon-pink text-white border-black';
    }
    if (text.includes('💰')) {
      return 'bg-neon-yellow text-black border-black';
    }
    if (text.includes('🎓')) {
      return 'bg-neon-cyan text-black border-black';
    }
    if (text.includes('❤️')) {
      return 'bg-neon-lime text-black border-black';
    }
    if (text.includes('😊')) {
      return 'bg-neon-yellow text-black border-black';
    }
    return 'bg-canvas-subtle text-gray-200 border-canvas-border';
  };

  return (
    <AnimatePresence>
      <div
        data-testid="decision-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative w-full max-w-xl my-auto bg-canvas-card border-3 border-black text-white rounded-3xl shadow-[6px_6px_0px_#FFE600] overflow-hidden"
        >
          {/* Top Banner */}
          <div className="bg-neon-yellow text-black px-4 py-2 flex items-center justify-between border-b-3 border-black font-mono font-black text-xs sm:text-sm tracking-wider uppercase select-none">
            <span className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 fill-black stroke-neon-yellow" />
              ЖИЗНЕННЫЙ ВЫБОР & РАЗВИЛКА
            </span>
            {decision?.is18Plus && (
              <span className="bg-neon-pink text-white px-2 py-0.5 rounded text-[11px] font-extrabold flex items-center gap-1">
                <Flame className="w-3 h-3" /> 18+ ВЗРОСЛЫЙ ВЫБОР
              </span>
            )}
          </div>

          {/* Outcome Alert Mode (if displaying result of choice) */}
          {outcomeAlert ? (
            <div className="p-6 sm:p-8 space-y-5">
              <div
                className={`p-4 rounded-2xl border-2 ${
                  outcomeAlert.isDeath
                    ? 'bg-red-950/60 border-red-500 text-red-200'
                    : outcomeAlert.isRiskFailed
                    ? 'bg-neon-pink/15 border-neon-pink text-neon-pink'
                    : 'bg-neon-lime/15 border-neon-lime text-neon-lime'
                }`}
              >
                <div className="font-mono font-black text-xs uppercase mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  {outcomeAlert.isDeath
                    ? '💀 Фатальный исход'
                    : outcomeAlert.isRiskFailed
                    ? '⚠️ Риск не оправдался'
                    : '✨ Успешное решение'}
                </div>
                <div className="text-base sm:text-lg font-display font-bold text-white">
                  {outcomeAlert.text}
                </div>
              </div>

              <button
                type="button"
                onClick={onDismissOutcome}
                className="w-full bg-neon-yellow text-black font-display font-black text-base py-3.5 rounded-xl border-2 border-black shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none cursor-pointer uppercase select-none transition-all"
              >
                Продолжить жизнь
              </button>
            </div>
          ) : decision ? (
            <div className="p-5 sm:p-7 space-y-4">
              {/* Category & Title */}
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-canvas-subtle border border-canvas-border text-neon-cyan text-xs font-mono font-bold uppercase mb-2">
                  Категория: {decision.category}
                </div>
                <h2 className="text-xl sm:text-2xl font-display font-black tracking-tight text-white">
                  {decision.title}
                </h2>
                <p className="text-gray-300 text-xs sm:text-sm font-sans mt-2 leading-relaxed">
                  {decision.prompt}
                </p>
              </div>

              {/* Consequence Badges / Options List */}
              <div className="space-y-2.5 pt-2">
                {decision.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleChoose(opt)}
                    className="w-full text-left bg-canvas-dark hover:bg-canvas-subtle p-3.5 sm:p-4 rounded-2xl border-2 border-black hover:border-neon-cyan shadow-neo-sm hover:shadow-neo transition-all duration-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer select-none group"
                  >
                    <div>
                      <div className="font-display font-black text-sm sm:text-base text-white group-hover:text-neon-cyan transition-colors">
                        {opt.label}
                      </div>
                      {opt.description && (
                        <div className="text-[11px] text-gray-400 font-sans mt-0.5">
                          {opt.description}
                        </div>
                      )}
                    </div>

                    {/* Badges Row */}
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      {opt.badges.map((b, bIdx) => (
                        <span
                          key={bIdx}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border shadow-neo-sm ${getBadgeStyle(
                            b.text
                          )}`}
                        >
                          {b.text}
                        </span>
                      ))}
                      <ArrowRight className="w-4 h-4 text-neon-cyan opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
                    </div>
                  </button>
                ))}
              </div>

              {/* Footnote Citation */}
              {decision.footnote && (
                <div className="pt-2 border-t border-canvas-border/60 flex items-start gap-1.5 text-[11px] font-mono text-neon-cyan/90 bg-neon-cyan/5 p-2.5 rounded-xl">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-neon-cyan" />
                  <span className="leading-tight">{decision.footnote}</span>
                </div>
              )}
            </div>
          ) : null}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DecisionModal;
