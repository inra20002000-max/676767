import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldCheck, HeartHandshake, Flame, Skull, Pill, Wine, Cigarette, AlertCircle } from 'lucide-react';
import { soundEngine } from '../engine/soundEngine';

export interface DisclaimerModalProps {
  isOpen?: boolean;
  onConfirm?: (safeMode: boolean) => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({
  isOpen: controlledIsOpen,
  onConfirm,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const confirmed = localStorage.getItem('one8b_age_confirmed') === 'true';
        if (!confirmed) {
          setInternalOpen(true);
        }
      } catch {
        setInternalOpen(true);
      }
    }
  }, []);

  const isVisible = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;

  const handleConfirm = (safeMode: boolean) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    soundEngine.unlock();
    soundEngine.playClick();
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('one8b_age_confirmed', 'true');
        if (safeMode) {
          localStorage.setItem('one8b_safe_mode', 'true');
        } else {
          localStorage.removeItem('one8b_safe_mode');
        }
      } catch {
        // Storage access error handling
      }
    }
    setInternalOpen(false);
    if (onConfirm) {
      onConfirm(safeMode);
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div
        data-testid="disclaimer-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative w-full max-w-xl my-auto bg-canvas-card border-3 border-black text-white rounded-2xl shadow-[6px_6px_0px_#00F0FF] overflow-hidden"
        >
          {/* Top Hazard Caution Banner */}
          <div className="bg-neon-yellow text-black px-4 py-2 flex items-center justify-between border-b-3 border-black font-mono font-black text-xs sm:text-sm tracking-wider uppercase select-none">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 fill-black stroke-neon-yellow" />
              18+ ВЗРОСЛЫЙ КОНТЕНТ & ДИСКЛЕЙМЕР
            </span>
            <span className="bg-black text-neon-yellow px-2 py-0.5 rounded text-[11px] font-extrabold tracking-widest">
              OFFICIAL GATE
            </span>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            {/* Title */}
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-neon-pink/15 border border-neon-pink/40 text-neon-pink text-xs font-mono font-extrabold uppercase mb-2">
                <Flame className="w-3.5 h-3.5" />
                Статистический реализм 1 в 8 миллиардах
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
                Предупреждение о содержании
              </h2>
            </div>

            {/* Triggers grid */}
            <div className="p-3 bg-canvas-subtle/80 rounded-xl border border-canvas-border space-y-2">
              <div className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-neon-cyan" />
                Возможные триггеры и темы симуляции:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px] font-semibold text-gray-200">
                <span className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded border border-white/10">
                  <Cigarette className="w-3.5 h-3.5 text-orange-400" /> Табак
                </span>
                <span className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded border border-white/10">
                  <Wine className="w-3.5 h-3.5 text-purple-400" /> Алкоголь
                </span>
                <span className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded border border-white/10">
                  <Pill className="w-3.5 h-3.5 text-red-400" /> Вещества
                </span>
                <span className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded border border-white/10">
                  <Skull className="w-3.5 h-3.5 text-gray-400" /> Насилие / Кровь
                </span>
              </div>
              <div className="text-[11px] text-gray-400 leading-snug">
                Включает реалистичные показатели детской смертности, бедности, суицидальных рисков и эпидемиологических причин смерти в 172 странах мира.
              </div>
            </div>

            {/* Educational clause */}
            <div className="text-xs sm:text-[13px] text-gray-300 leading-relaxed bg-black/50 p-3.5 rounded-xl border border-white/10 font-sans space-y-2">
              <p>
                <strong className="text-neon-cyan font-semibold">Отказ от пропаганды и образовательная миссия:</strong> Настоящий симулятор построен на открытых демографических данных ООН (WPP 2024), Всемирной организации здравоохранения (WHO GHE) и Всемирного банка.
              </p>
              <p className="text-gray-400 text-[11px] sm:text-xs">
                Все события, риски и исходы моделируются исключительно в познавательно-статистических целях и не являются пропагандой асоциального поведения или вредных привычек.
              </p>
            </div>

            {/* Helpline banner */}
            <div className="flex items-center gap-2 text-[11px] font-mono text-gray-400 bg-canvas-dark px-3 py-2 rounded-lg border border-white/5">
              <HeartHandshake className="w-4 h-4 text-neon-lime shrink-0" />
              <span>
                Кризисная психологическая помощь: <strong className="text-white">8-800-200-01-22</strong> или <span className="text-neon-cyan">findahelpline.com</span>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                data-testid="btn-disclaimer-confirm"
                id="confirm-18-btn"
                disabled={isSubmitting}
                onClick={() => handleConfirm(false)}
                className="flex-1 bg-neon-lime text-black font-display font-black text-sm sm:text-base py-3.5 px-5 rounded-xl border-3 border-black shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-100 flex items-center justify-center gap-2 cursor-pointer uppercase select-none"
              >
                <span>ПОДТВЕРЖДАЮ (18+) И НАЧАТЬ</span>
                <span className="text-lg">🚀</span>
              </button>

              <button
                type="button"
                data-testid="btn-disclaimer-safe"
                disabled={isSubmitting}
                onClick={() => handleConfirm(true)}
                className="bg-canvas-subtle hover:bg-canvas-border text-neon-cyan font-mono font-bold text-xs sm:text-sm py-3 px-4 rounded-xl border-2 border-neon-cyan/50 shadow-neo hover:border-neon-cyan transition-all duration-100 flex items-center justify-center gap-2 cursor-pointer select-none"
                title="Включает фильтрацию жестких тем (суицид, психоактивные вещества, насилие)"
              >
                <ShieldCheck className="w-4 h-4 text-neon-cyan" />
                <span>Безопасный режим (12+)</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DisclaimerModal;
