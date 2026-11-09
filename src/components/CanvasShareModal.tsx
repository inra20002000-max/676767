import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, X, Sparkles, Check } from 'lucide-react';
import type { CharacterState } from '../types/simulation';
import { getCountryFlag } from './BirthLottery';
import { soundEngine } from '../engine/soundEngine';

export interface CanvasShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterState;
}

export type CanvasFormat = 'story' | 'post'; // 'story' is 9:16 (1080x1920), 'post' is 1:1 (1080x1080)

export function computeLifeArchetype(character: CharacterState): {
  name: string;
  desc: string;
  color: string;
} {
  const { age, stats, wealth, flags } = character;
  if (wealth.quintile === 1 && (stats.smarts > 70 || wealth.netWorthUSD > 50000)) {
    return { name: 'Гений из трущоб', desc: 'Преодолел нищету силой интеллекта', color: '#00F0FF' };
  }
  if (wealth.worldPct > 0.92 || wealth.netWorthUSD > 150000) {
    return { name: 'Олигарх', desc: 'Вошел в элиту мирового богатства', color: '#FFE600' };
  }
  if (age >= 80) {
    return { name: 'Долгожитель', desc: 'Преодолел все демографические пороги', color: '#39FF14' };
  }
  if (flags.inPrison || flags.alcoholic || flags.smoker) {
    return { name: 'Выживший', desc: 'Боролся со стихией и превратностями судьбы', color: '#FF007F' };
  }
  if (stats.smarts >= 75) {
    return { name: 'Философ', desc: 'Посвятил жизнь поиску истины', color: '#00F0FF' };
  }
  return { name: 'Странник Земли', desc: '1 из 8 миллиардов уникальных жизней', color: '#39FF14' };
}

export const CanvasShareModal: React.FC<CanvasShareModalProps> = ({
  isOpen,
  onClose,
  character,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [format, setFormat] = useState<CanvasFormat>('story');
  const [copied, setCopied] = useState(false);

  const archetype = computeLifeArchetype(character);
  const flag = getCountryFlag(character.country.id);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isStory = format === 'story';
    const width = 1080;
    const height = isStory ? 1920 : 1080;

    canvas.width = width;
    canvas.height = height;

    // 1. Background fill
    ctx.fillStyle = '#0D0F17';
    ctx.fillRect(0, 0, width, height);

    // Subtle neo cyber grid pattern
    ctx.strokeStyle = '#1C2136';
    ctx.lineWidth = 2;
    const gridSize = 60;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 2. Thick Neo-Brutalist Frame
    const padding = 50;
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 10;
    ctx.strokeRect(padding, padding, width - padding * 2, height - padding * 2);

    // Inner black shadow border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.strokeRect(padding + 10, padding + 10, width - padding * 2 - 20, height - padding * 2 - 20);

    // 3. Header Badge & Watermark
    ctx.fillStyle = '#FFE600';
    ctx.fillRect(padding + 30, padding + 30, 360, 60);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 28px "JetBrains Mono", monospace';
    ctx.fillText('1in8b.life · РЕКАП ЖИЗНИ', padding + 50, padding + 72);

    // Archetype Badge
    ctx.fillStyle = archetype.color;
    ctx.fillRect(width - padding - 360, padding + 30, 330, 60);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px "JetBrains Mono", monospace';
    ctx.fillText(archetype.name.toUpperCase(), width - padding - 340, padding + 70);

    // 4. Character Profile Section
    const profileY = isStory ? 220 : 170;

    // Flag & Country
    ctx.font = '72px sans-serif';
    ctx.fillText(flag, padding + 40, profileY + 70);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 64px "Cabinet Grotesk", sans-serif';
    ctx.fillText(character.name, padding + 150, profileY + 50);

    ctx.fillStyle = '#00F0FF';
    ctx.font = 'bold 32px "JetBrains Mono", monospace';
    ctx.fillText(
      `${character.country.ru.toUpperCase()} · ${character.sex === 'M' ? 'МУЖЧИНА' : 'ЖЕНЩИНА'}`,
      padding + 150,
      profileY + 95
    );

    // 5. Giant Age at Death Display
    const ageY = isStory ? 410 : 310;
    ctx.fillStyle = '#161926';
    ctx.fillRect(padding + 40, ageY, width - (padding + 40) * 2, isStory ? 260 : 180);
    ctx.strokeStyle = '#39FF14';
    ctx.lineWidth = 6;
    ctx.strokeRect(padding + 40, ageY, width - (padding + 40) * 2, isStory ? 260 : 180);

    ctx.fillStyle = '#FFE600';
    ctx.font = 'bold 24px "JetBrains Mono", monospace';
    ctx.fillText('ПРОЖИТО НА ЗЕМЛЕ', padding + 80, ageY + 55);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 110px "Cabinet Grotesk", sans-serif';
    const ageText = `${character.age}`;
    ctx.fillText(ageText, padding + 80, ageY + (isStory ? 175 : 145));

    ctx.fillStyle = '#39FF14';
    ctx.font = 'bold 36px "JetBrains Mono", monospace';
    ctx.fillText(
      character.age === 1 ? 'ГОД' : character.age < 5 ? 'ГОДА' : 'ЛЕТ',
      padding + 80 + ctx.measureText(ageText).width + 30,
      ageY + (isStory ? 170 : 140)
    );

    if (character.deathCause) {
      ctx.fillStyle = '#FF007F';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(
        `Причина смерти: ${character.deathCause.ru}`,
        padding + 80,
        ageY + (isStory ? 225 : 170)
      );
    }

    // 6. Four Core Stat Meters
    const statsY = isStory ? 730 : 540;
    const statBars = [
      { label: '❤️ Здоровье', val: character.stats.health, color: '#39FF14' },
      { label: '💛 Счастье', val: character.stats.happiness, color: '#FFE600' },
      { label: '💙 Интеллект', val: character.stats.smarts, color: '#00F0FF' },
      { label: '💜 Отношения', val: character.stats.social, color: '#8A2BE2' },
    ];

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px "JetBrains Mono", monospace';
    ctx.fillText('ИТОГОВЫЕ ХАРАКТЕРИСТИКИ', padding + 40, statsY);

    statBars.forEach((stat, i) => {
      const rowY = statsY + 45 + i * (isStory ? 75 : 55);

      ctx.fillStyle = '#E2E8F0';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(stat.label, padding + 40, rowY + 22);

      // Meter background
      const barX = padding + 280;
      const barWidth = width - barX - padding - 140;
      ctx.fillStyle = '#000000';
      ctx.fillRect(barX, rowY, barWidth, 30);
      ctx.strokeStyle = '#2A3048';
      ctx.lineWidth = 3;
      ctx.strokeRect(barX, rowY, barWidth, 30);

      // Meter fill
      ctx.fillStyle = stat.color;
      const fillW = Math.max(0, Math.min(barWidth, (stat.val / 100) * barWidth));
      ctx.fillRect(barX + 2, rowY + 2, fillW - 4, 26);

      // Number value
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px "JetBrains Mono", monospace';
      ctx.fillText(`${stat.val}%`, barX + barWidth + 25, rowY + 24);
    });

    // 7. Global Benchmarking Percentiles
    const benchY = isStory ? 1110 : 810;
    ctx.fillStyle = '#161926';
    ctx.fillRect(padding + 40, benchY, width - (padding + 40) * 2, isStory ? 240 : 160);
    ctx.strokeStyle = '#FFE600';
    ctx.lineWidth = 5;
    ctx.strokeRect(padding + 40, benchY, width - (padding + 40) * 2, isStory ? 240 : 160);

    ctx.fillStyle = '#FFE600';
    ctx.font = 'bold 26px "JetBrains Mono", monospace';
    ctx.fillText('СРАВНЕНИЕ С ЧЕЛОВЕЧЕСТВОМ (8.1 МЛРД)', padding + 70, benchY + 50);

    const longevityPct = Math.round((character.longevityPercentile ?? 0.5) * 100);
    const wealthTop = Math.max(0.1, (100 - character.wealth.worldPct * 100)).toFixed(1);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '30px sans-serif';
    ctx.fillText(
      `• Прожил(а) дольше ${longevityPct}% жителей Земли`,
      padding + 70,
      benchY + (isStory ? 115 : 95)
    );
    ctx.fillText(
      `• Состояние: $${character.wealth.netWorthUSD.toLocaleString()} (Топ ${wealthTop}% мира)`,
      padding + 70,
      benchY + (isStory ? 175 : 135)
    );

    // 8. Story-specific extra: Lifetime Epitaph
    if (isStory) {
      const epitaphY = 1420;
      ctx.fillStyle = '#1C2136';
      ctx.fillRect(padding + 40, epitaphY, width - (padding + 40) * 2, 280);
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 4;
      ctx.strokeRect(padding + 40, epitaphY, width - (padding + 40) * 2, 280);

      ctx.fillStyle = '#00F0FF';
      ctx.font = 'bold 24px "JetBrains Mono", monospace';
      ctx.fillText('ЭПИТАФИЯ И НАСЛЕДИЕ', padding + 70, epitaphY + 50);

      ctx.fillStyle = '#E2E8F0';
      ctx.font = 'italic 28px sans-serif';
      const quote = `"${character.eulogy || 'Прожил достойную человеческую жизнь среди миллиардов.'}"`;

      // Simple multi-line wrap
      const words = quote.split(' ');
      let line = '';
      let lineY = epitaphY + 110;
      words.forEach((w) => {
        const testLine = line + w + ' ';
        if (ctx.measureText(testLine).width > width - (padding + 70) * 2) {
          ctx.fillText(line, padding + 70, lineY);
          line = w + ' ';
          lineY += 45;
        } else {
          line = testLine;
        }
      });
      ctx.fillText(line, padding + 70, lineY);
    }

    // 9. Footer Watermark
    ctx.fillStyle = '#718096';
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillText('СГЕНЕРИРОВАНО НА 1IN8B.LIFE · OPEN DEMOGRAPHIC SIMULATOR', padding + 40, height - padding - 20);
  }, [character, format, archetype, flag]);

  useEffect(() => {
    if (isOpen) {
      renderCanvas();
    }
  }, [isOpen, format, renderCanvas]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    soundEngine.unlock();
    soundEngine.play('click');

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `1in8b-${character.name.toLowerCase().replace(/\s+/g, '_')}-${format}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    soundEngine.unlock();
    soundEngine.play('click');

    if (navigator.share && canvas.toBlob) {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          const file = new File([blob], `1in8b-story.png`, { type: 'image/png' });
          await navigator.share({
            title: `История жизни: ${character.name}`,
            text: `Я прожил жизнь в симуляторе 1in8b.life! Возраст: ${character.age} лет в стране ${character.country.ru}.`,
            files: [file],
          });
        } catch {
          handleDownload();
        }
      });
    } else {
      // Fallback
      handleDownload();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        data-testid="canvas-share-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-2xl bg-canvas-card border-3 border-black text-white rounded-3xl shadow-[6px_6px_0px_#00F0FF] p-5 sm:p-7 space-y-4 my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-canvas-border pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-neon-cyan" />
              <h2 className="font-display font-black text-lg sm:text-xl text-white uppercase">
                Экспорт карточки жизни
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl border border-canvas-border hover:bg-canvas-subtle text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Format Switcher */}
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setFormat('story')}
              className={`px-4 py-2 rounded-xl font-mono text-xs font-bold border-2 transition-all cursor-pointer ${
                format === 'story'
                  ? 'bg-neon-cyan text-black border-black shadow-neo-sm'
                  : 'bg-canvas-dark text-gray-400 border-canvas-border hover:text-white'
              }`}
            >
              📱 9:16 (Story / TikTok / Reels)
            </button>
            <button
              type="button"
              onClick={() => setFormat('post')}
              className={`px-4 py-2 rounded-xl font-mono text-xs font-bold border-2 transition-all cursor-pointer ${
                format === 'post'
                  ? 'bg-neon-yellow text-black border-black shadow-neo-sm'
                  : 'bg-canvas-dark text-gray-400 border-canvas-border hover:text-white'
              }`}
            >
              🖼️ 1:1 (Post / Square)
            </button>
          </div>

          {/* Canvas Live Preview Container */}
          <div className="flex justify-center bg-black/70 p-3 rounded-2xl border-2 border-black max-h-[50vh] overflow-y-auto">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto max-h-[46vh] rounded-lg shadow-neo border border-white/20"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 bg-neon-lime text-black font-display font-black text-sm sm:text-base py-3.5 rounded-2xl border-3 border-black shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer uppercase select-none"
            >
              <Download className="w-5 h-5 stroke-[2.5]" />
              <span>Скачать PNG</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="flex-1 bg-neon-cyan text-black font-display font-black text-sm sm:text-base py-3.5 rounded-2xl border-3 border-black shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer uppercase select-none"
            >
              {copied ? <Check className="w-5 h-5 text-black" /> : <Share2 className="w-5 h-5" />}
              <span>{copied ? 'Сохранено!' : 'Поделиться'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CanvasShareModal;
