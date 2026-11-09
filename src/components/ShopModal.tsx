import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Check, AlertCircle, Sparkles, DollarSign } from 'lucide-react';
import { SHOP_ITEMS } from '../data/shopItems';
import type { ShopItem, ItemCategory } from '../types/inventory';
import type { CharacterState } from '../types/simulation';
import { soundEngine } from '../engine/soundEngine';

export interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterState;
  onBuyItem: (item: ShopItem, gambleResult?: { won: boolean; deltaUSD: number; message: string }) => void;
  ownedItemIds: string[];
}

const CATEGORIES: { id: ItemCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'Все', icon: '✨' },
  { id: 'housing', label: 'Жилье', icon: '🏢' },
  { id: 'vehicle', label: 'Транспорт', icon: '🚗' },
  { id: 'pet', label: 'Питомцы', icon: '🐕' },
  { id: 'tech', label: 'Технологии', icon: '📱' },
  { id: 'lifestyle', label: 'Лайфстайл', icon: '🏋️' },
  { id: 'vice', label: 'Азарт & 18+', icon: '🎰' },
];

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onClose,
  character,
  onBuyItem,
  ownedItemIds,
}) => {
  const [activeCategory, setActiveCategory] = useState<ItemCategory | 'all'>('all');
  const [lastGambleMessage, setLastGambleMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const playerMoney = Math.max(0, character.wealth.netWorthUSD);

  const filteredItems = SHOP_ITEMS.filter((item) => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  const handlePurchase = (item: ShopItem) => {
    if (playerMoney < item.priceUSD) return;
    if (item.minAge && character.age < item.minAge) return;

    soundEngine.playCash();

    // Handle interactive gamble items
    if (item.id === 'vice_lottery') {
      const roll = Math.random();
      if (roll < 0.03) {
        // Jackpot 10,000$
        const win = 10000;
        setLastGambleMessage(`🎉 ДЖЕКПОТ! Вы сорвали куш +$${win.toLocaleString()}!`);
        onBuyItem(item, { won: true, deltaUSD: win - item.priceUSD, message: 'Сорвал джекпот в лотерее $10,000!' });
      } else if (roll < 0.20) {
        // Double money
        const win = 100;
        setLastGambleMessage(`💵 Выигрыш! Вы выиграли +$${win}!`);
        onBuyItem(item, { won: true, deltaUSD: win - item.priceUSD, message: 'Выиграл в лотерее $100.' });
      } else {
        setLastGambleMessage('😢 Билет оказался пустышкой. Повезет в следующий раз!');
        onBuyItem(item, { won: false, deltaUSD: -item.priceUSD, message: 'Купил лотерейный билет, но ничего не выиграл.' });
      }
      return;
    }

    if (item.id === 'vice_crypto_gamble') {
      const roll = Math.random();
      if (roll >= 0.5) {
        const win = 4000;
        setLastGambleMessage(`🚀 ТУ ЗЕ МУН! Мемкоин вырос в 5 раз! Чистая прибыль +$${win.toLocaleString()}!`);
        onBuyItem(item, { won: true, deltaUSD: win, message: 'Зафиксировал прибыль на мемкоине +$4,000!' });
      } else {
        setLastGambleMessage('📉 РАГПУЛ! Разработчики слили монету, ваши $1,000 сгорели.');
        onBuyItem(item, { won: false, deltaUSD: -item.priceUSD, message: 'Потерял $1,000 на скам-мемкоине.' });
      }
      return;
    }

    if (item.id === 'vice_casino') {
      const roll = Math.random();
      if (roll >= 0.52) {
        const win = 5000;
        setLastGambleMessage(`🎰 ВЫИГРЫШ! Черное выпало! Казино выплачивает +$10,000 (чистыми +$${win.toLocaleString()})!`);
        onBuyItem(item, { won: true, deltaUSD: win, message: 'Выиграл $10,000 в закрытом казино на ставке!' });
      } else {
        setLastGambleMessage('❌ Шарик упал на красное. Ставка $5,000 ушла в пользу заведения.');
        onBuyItem(item, { won: false, deltaUSD: -item.priceUSD, message: 'Проиграл $5,000 в казино.' });
      }
      return;
    }

    // Normal purchase
    setLastGambleMessage(null);
    onBuyItem(item);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-canvas-card border-4 border-black rounded-3xl shadow-neo flex flex-col overflow-hidden text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b-3 border-black bg-purple-950/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400 border-2 border-black flex items-center justify-center text-black font-black text-2xl shadow-neo">
                🛍️
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight font-display text-white">
                  Магазин и имущество
                </h2>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-300">
                  <span>Доступный капитал:</span>
                  <span className="font-mono font-bold text-yellow-300 text-sm bg-black/40 px-2 py-0.5 rounded-lg border border-yellow-500/30">
                    ${Math.round(playerMoney).toLocaleString()} USD
                  </span>
                  <span className="text-gray-400">({character.age} лет)</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-2xl bg-black border-2 border-canvas-border flex items-center justify-center text-gray-400 hover:text-white hover:border-red-500 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Gamble Notification Banner */}
          {lastGambleMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-yellow-400 text-black px-6 py-2.5 font-bold font-sans text-sm flex items-center gap-2 border-b-2 border-black"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{lastGambleMessage}</span>
            </motion.div>
          )}

          {/* Category Tabs */}
          <div className="flex items-center gap-2 p-4 border-b-2 border-canvas-border overflow-x-auto no-scrollbar bg-black/20">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-2xl font-display font-bold text-xs uppercase tracking-wider border-2 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  activeCategory === cat.id
                    ? 'bg-yellow-400 text-black border-black shadow-neo'
                    : 'bg-black/40 text-gray-300 border-canvas-border hover:border-gray-500'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item) => {
              const isOwned = !item.isOneTime && ownedItemIds.includes(item.id);
              const tooYoung = item.minAge ? character.age < item.minAge : false;
              const canAfford = playerMoney >= item.priceUSD;
              const isDisabled = isOwned || tooYoung || !canAfford;

              return (
                <div
                  key={item.id}
                  className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                    isOwned
                      ? 'bg-purple-950/20 border-purple-500/50'
                      : 'bg-black/40 border-canvas-border hover:border-gray-600'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-3xl">{item.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-display font-black text-white text-base">
                              {item.name}
                            </h4>
                            {item.tag && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-yellow-400/20 text-yellow-300 border border-yellow-500/30 font-bold">
                                {item.tag}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stat bonuses preview */}
                    {item.statBonus && (
                      <div className="flex flex-wrap gap-1.5 my-2.5">
                        {item.statBonus.happiness && (
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-yellow-400/10 text-yellow-300 border border-yellow-500/30">
                            +{item.statBonus.happiness} Счастье
                          </span>
                        )}
                        {item.statBonus.health && (
                          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                            item.statBonus.health > 0
                              ? 'bg-emerald-400/10 text-emerald-300 border-emerald-500/30'
                              : 'bg-red-400/10 text-red-300 border-red-500/30'
                          }`}>
                            {item.statBonus.health > 0 ? `+${item.statBonus.health}` : item.statBonus.health} Здоровье
                          </span>
                        )}
                        {item.statBonus.smarts && (
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-400/10 text-cyan-300 border border-cyan-500/30">
                            +{item.statBonus.smarts} Интеллект
                          </span>
                        )}
                        {item.statBonus.social && (
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-pink-400/10 text-pink-300 border border-pink-500/30">
                            +{item.statBonus.social} Связи
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Price & Action Button */}
                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-canvas-border">
                    <div className="font-mono">
                      <span className="text-base font-black text-white">
                        ${item.priceUSD.toLocaleString()}
                      </span>
                      {item.annualUpkeepUSD && (
                        <span className="text-[10px] text-gray-400 block">
                          +$${item.annualUpkeepUSD}/год
                        </span>
                      )}
                    </div>

                    {isOwned ? (
                      <span className="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500 font-bold text-xs flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> В собственности
                      </span>
                    ) : tooYoung ? (
                      <span className="text-[11px] font-mono text-gray-400 bg-gray-800/40 px-2.5 py-1 rounded-lg">
                        С {item.minAge} лет
                      </span>
                    ) : (
                      <button
                        onClick={() => handlePurchase(item)}
                        disabled={isDisabled}
                        className={`px-4 py-2 rounded-xl font-display font-black text-xs uppercase tracking-wide border-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                          canAfford
                            ? 'bg-yellow-400 text-black border-black shadow-neo hover:translate-x-0.5 hover:-translate-y-0.5'
                            : 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Купить</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
