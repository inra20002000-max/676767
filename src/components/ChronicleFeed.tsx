import React from 'react';
import {
  BookOpen,
  Sparkles,
  AlertTriangle,
  Skull,
  HelpCircle,
  Clock,
  HeartPulse,
  Info,
} from 'lucide-react';
import type { LifeHistoryEvent } from '../types/simulation';

export interface ChronicleFeedProps {
  events: LifeHistoryEvent[];
}

export const ChronicleFeed: React.FC<ChronicleFeedProps> = ({ events }) => {
  // Sort reverse chronological: newest events first
  const reversedEvents = [...events].reverse();

  const getCategoryBadge = (category?: string) => {
    switch (category) {
      case 'milestone':
        return {
          label: 'Веха жизни',
          color: 'bg-neon-lime text-black border-black',
          icon: <Sparkles className="w-3 h-3" />,
        };
      case 'crisis':
        return {
          label: 'Кризис / 18+',
          color: 'bg-neon-pink text-white border-black',
          icon: <AlertTriangle className="w-3 h-3" />,
        };
      case 'death':
        return {
          label: 'Финал',
          color: 'bg-red-600 text-white border-black',
          icon: <Skull className="w-3 h-3" />,
        };
      case 'decision':
        return {
          label: 'Выбор',
          color: 'bg-neon-yellow text-black border-black',
          icon: <HelpCircle className="w-3 h-3" />,
        };
      case 'health':
        return {
          label: 'Здоровье',
          color: 'bg-neon-cyan text-black border-black',
          icon: <HeartPulse className="w-3 h-3" />,
        };
      default:
        return {
          label: 'Хроника',
          color: 'bg-canvas-subtle text-gray-300 border-canvas-border',
          icon: <Clock className="w-3 h-3" />,
        };
    }
  };

  return (
    <div className="bg-canvas-card border-3 border-black rounded-3xl p-4 sm:p-6 shadow-neo flex flex-col h-full max-h-[600px]">
      {/* Feed Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-canvas-border">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-neon-yellow" />
          <h3 className="font-display font-black text-sm sm:text-base text-white tracking-wide uppercase">
            Летопись жизни ({events.length})
          </h3>
        </div>
        <span className="text-[11px] font-mono text-gray-400">Свежие события сверху</span>
      </div>

      {/* Events List */}
      <div
        data-testid="chronicle-feed"
        className="flex-1 overflow-y-auto space-y-3 pr-1.5 custom-scrollbar"
      >
        {reversedEvents.length === 0 ? (
          <div className="text-center py-8 text-xs font-mono text-gray-400">
            Летопись пуста. Начните жизнь, чтобы писать историю.
          </div>
        ) : (
          reversedEvents.map((evt, idx) => {
            const badge = getCategoryBadge(evt.category);
            const is18Plus =
              evt.category === 'crisis' ||
              evt.text.includes('18+') ||
              evt.text.includes('алкогол') ||
              evt.text.includes('табак') ||
              evt.text.includes('веществ');

            return (
              <div
                key={`${evt.age}-${idx}-${evt.text.slice(0, 15)}`}
                className="bg-canvas-dark p-3.5 rounded-2xl border-2 border-black/80 hover:border-canvas-border transition-all shadow-neo-sm relative overflow-hidden"
              >
                {/* Event Metadata Row */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-black text-neon-cyan px-2 py-0.5 rounded font-mono font-black text-[11px] border border-neon-cyan/40">
                      {evt.age} {evt.age === 1 ? 'ГОД' : evt.age < 5 ? 'ГОДА' : 'ЛЕТ'}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${badge.color}`}
                    >
                      {badge.icon}
                      {badge.label}
                    </span>
                  </div>

                  {is18Plus && (
                    <span className="bg-neon-pink/20 text-neon-pink border border-neon-pink/40 px-1.5 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider">
                      🔞 18+
                    </span>
                  )}
                </div>

                {/* Event Text */}
                <p className="text-gray-200 text-xs sm:text-sm font-sans leading-relaxed">
                  {evt.text}
                </p>

                {/* Institutional Footnote / Scientific Fact */}
                {evt.sourceOrFact && (
                  <div className="mt-2 pt-2 border-t border-canvas-border/60 flex items-start gap-1.5 text-[11px] font-mono text-neon-cyan/90 bg-neon-cyan/5 p-2 rounded-xl">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-neon-cyan" />
                    <span className="leading-tight">{evt.sourceOrFact}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChronicleFeed;
