import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Heart,
  Users,
  Briefcase,
  Activity,
  Dice5,
  Sparkles,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import type { CharacterState } from '../types/simulation';
import type { FamilyState } from '../types/family';
import { soundEngine } from '../engine/soundEngine';

export interface ActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterState;
  onExecuteAction: (result: {
    title: string;
    description: string;
    success: boolean;
    statDeltas?: { health?: number; happiness?: number; smarts?: number; social?: number };
    moneyDeltaUSD?: number;
    updatedFamily?: FamilyState;
    flagsUpdate?: Record<string, boolean>;
  }) => void;
}

export const ActionsModal: React.FC<ActionsModalProps> = ({
  isOpen,
  onClose,
  character,
  onExecuteAction,
}) => {
  const [activeTab, setActiveTab] = useState<'love' | 'family' | 'career' | 'health' | 'risk'>('love');
  const [feedback, setFeedback] = useState<{ text: string; success: boolean } | null>(null);

  if (!isOpen) return null;

  const playerMoney = Math.max(0, character.wealth.netWorthUSD);
  const family = character.family;
  const partner = family?.partner;
  const isMarried = partner?.isMarried ?? false;
  const hasPartner = !!partner && partner.isAlive;

  const handleAction = (actionFn: () => void) => {
    soundEngine.playClick();
    actionFn();
  };

  // --------------------------------------------------------------------------
  // LOVE & RELATIONSHIPS ACTIONS
  // --------------------------------------------------------------------------
  const actionFindLove = () => {
    if (character.age < 16) {
      setFeedback({ text: 'Вы еще слишком молоды для поиска серьезных отношений (с 16 лет).', success: false });
      return;
    }
    const roll = Math.random();
    if (roll > 0.4) {
      const partnerNames = character.sex === 'M'
        ? ['Анна', 'София', 'Мария', 'Елена', 'Виктория', 'Алиса', 'Дарья', 'Лейла', 'Фатима', 'Мэй']
        : ['Александр', 'Дмитрий', 'Максим', 'Артем', 'Иван', 'Михаил', 'Даниил', 'Омар', 'Лиам', 'Ноа'];
      const chosenName = partnerNames[Math.floor(Math.random() * partnerNames.length)];
      const partnerAge = Math.max(16, character.age + Math.floor(Math.random() * 5) - 2);

      const newPartner = {
        name: chosenName,
        age: partnerAge,
        job: 'Специалист',
        professionRu: 'Специалист',
        isMarried: false,
        isAlive: true,
        anniversaryAge: character.age,
        isCohabiting: character.age >= 20,
      };

      const updatedFamily: FamilyState = family
        ? { ...family, partner: newPartner }
        : {
            mother: { name: 'Мать', age: character.age + 25, job: 'Рабочий', professionRu: 'Рабочий', isAlive: true, isAbsent: false },
            father: { name: 'Отец', age: character.age + 27, job: 'Служащий', professionRu: 'Служащий', isAlive: true, isAbsent: false },
            siblings: [],
            partner: newPartner,
            children: [],
            housing: { type: 'flat', ownership: true, city: character.city || 'Город' },
          };

      soundEngine.playSuccess();
      setFeedback({ text: `❤️ Вы встретили замечательного человека: ${chosenName} (${partnerAge} лет)!`, success: true });
      onExecuteAction({
        title: 'Новая любовь',
        description: `Вы познакомились с ${chosenName} и начали встречаться.`,
        success: true,
        statDeltas: { happiness: 18, social: 12 },
        updatedFamily,
      });
    } else {
      setFeedback({ text: '💔 Свидание прошло неловко. Взаимной искры не возникло.', success: false });
      onExecuteAction({
        title: 'Неудачное свидание',
        description: 'Вы сходили на свидание, но продолжения не последовало.',
        success: false,
        statDeltas: { happiness: -4 },
      });
    }
  };

  const actionMarry = (luxury: boolean) => {
    if (!partner || isMarried) return;
    const cost = luxury ? 4000 : 300;
    if (playerMoney < cost) {
      setFeedback({ text: `Недостаточно средств на свадьбу ($${cost} USD).`, success: false });
      return;
    }

    const updatedFamily: FamilyState = {
      ...family!,
      partner: {
        ...partner,
        isMarried: true,
        marriageAge: character.age,
      },
    };

    soundEngine.playSuccess();
    setFeedback({
      text: luxury
        ? `💍 Роскошная свадьба! Вы и ${partner.name} официально муж и жена!`
        : `💍 Вы тихо расписались в ЗАГСе с ${partner.name}!`,
      success: true,
    });

    onExecuteAction({
      title: 'Свадьба!',
      description: luxury
        ? `Шикарная свадьба с ${partner.name} в присутствии всех друзей и родственников!`
        : `Скромная роспись с ${partner.name}. Вы теперь официально женаты.`,
      success: true,
      moneyDeltaUSD: -cost,
      statDeltas: { happiness: luxury ? 30 : 15, social: luxury ? 20 : 8 },
      updatedFamily,
    });
  };

  const actionDivorce = () => {
    if (!partner) return;
    const updatedFamily: FamilyState = {
      ...family!,
      partner: null,
    };

    soundEngine.playDeathTone();
    setFeedback({ text: `💔 Вы расстались с ${partner.name}. Ваши пути разошлись.`, success: false });
    onExecuteAction({
      title: 'Разрыв отношений',
      description: `Отношения с ${partner.name} подошли к концу.`,
      success: true,
      statDeltas: { happiness: -15, social: -5 },
      updatedFamily,
    });
  };

  const actionHaveBaby = () => {
    if (!partner || character.age < 18 || character.age > 48) {
      setFeedback({ text: 'Завести ребенка можно в зрелом возрасте при наличии партнера.', success: false });
      return;
    }

    const babySex: 'M' | 'F' = Math.random() > 0.5 ? 'M' : 'F';
    const babyNames = babySex === 'M'
      ? ['Лев', 'Марк', 'Тимофей', 'Матвей', 'Роман', 'Ярослав', 'Лука']
      : ['Ева', 'Мия', 'Варвара', 'Василиса', 'Оливия', 'Эмилия'];
    const chosenBabyName = babyNames[Math.floor(Math.random() * babyNames.length)];

    const newChild = {
      id: `child_${Date.now()}`,
      name: chosenBabyName,
      age: 0,
      sex: babySex,
      isAlive: true,
    };

    const updatedFamily: FamilyState = {
      ...family!,
      children: [...(family?.children || []), newChild],
    };

    soundEngine.playSuccess();
    setFeedback({ text: `👶 Поздравляем! У вас родился ${babySex === 'M' ? 'сын' : 'дочь'} — ${chosenBabyName}!`, success: true });
    onExecuteAction({
      title: 'Рождение ребенка',
      description: `В вашей семье пополнение: малыш ${chosenBabyName} появился на свет!`,
      success: true,
      statDeltas: { happiness: 25, social: 15 },
      updatedFamily,
    });
  };

  // --------------------------------------------------------------------------
  // CAREER & MONEY ACTIONS
  // --------------------------------------------------------------------------
  const actionAskRaise = () => {
    if (character.age < 18 || !character.currentJob) {
      setFeedback({ text: 'Для просьбы о прибавке нужна постоянная работа.', success: false });
      return;
    }

    const roll = Math.random();
    if (roll > 0.45) {
      soundEngine.playCash();
      const bonusUSD = Math.round(character.wealth.incomeUSD * 0.25);
      setFeedback({ text: `🎉 УСПЕХ! Начальник оценил вашу работу и поднял зарплату на 25% (+${bonusUSD}$/год)!`, success: true });
      onExecuteAction({
        title: 'Повышение оклада',
        description: 'Ваш оклад увеличен на 25% благодаря успешным переговорам.',
        success: true,
        statDeltas: { happiness: 12, social: 8 },
        moneyDeltaUSD: bonusUSD,
      });
    } else if (roll > 0.15) {
      setFeedback({ text: 'Начальник сослался на сложный финансовый квартал и вежливо отказал.', success: false });
      onExecuteAction({
        title: 'Отказ в прибавке',
        description: 'Руководство заморозило индексацию зарплат.',
        success: false,
        statDeltas: { happiness: -4 },
      });
    } else {
      soundEngine.playDeathTone();
      setFeedback({ text: '⚠️ Скандал! Начальник посчитал вас наглым и уволил одним днем!', success: false });
      onExecuteAction({
        title: 'Увольнение',
        description: 'Разговор о зарплате перерос в конфликт, вас уволили с работы.',
        success: false,
        statDeltas: { happiness: -18, social: -10 },
      });
    }
  };

  // --------------------------------------------------------------------------
  // RISK & GAMBLE ACTIONS
  // --------------------------------------------------------------------------
  const actionUndergroundPoker = () => {
    if (playerMoney < 500) {
      setFeedback({ text: 'Для входа в игру нужно минимум $500 USD.', success: false });
      return;
    }

    const roll = Math.random();
    if (roll < 0.12) {
      // Jackpot
      const win = 3500;
      soundEngine.playCash();
      setFeedback({ text: `🔥 ФЛЕШ-РОЯЛЬ! Вы обыграли всех за столом и забрали банк +$${win.toLocaleString()}!`, success: true });
      onExecuteAction({
        title: 'Триумф в покере',
        description: `Сорвал банк в подпольном покере на +$${win}!`,
        success: true,
        moneyDeltaUSD: win,
        statDeltas: { happiness: 20 },
      });
    } else if (roll < 0.50) {
      // Double
      const win = 600;
      soundEngine.playCash();
      setFeedback({ text: `💵 Чистая победа! Собрали две пары и выиграли +$${win}!`, success: true });
      onExecuteAction({
        title: 'Выигрыш в покере',
        description: `Выиграл в покер +$${win}.`,
        success: true,
        moneyDeltaUSD: win,
        statDeltas: { happiness: 10 },
      });
    } else {
      // Lose
      soundEngine.playDeathTone();
      setFeedback({ text: '❌ Блеф не удался. Ваши $500 ушли сопернику.', success: false });
      onExecuteAction({
        title: 'Проигрыш в покере',
        description: 'Проиграл $500 за покерным столом.',
        success: false,
        moneyDeltaUSD: -500,
        statDeltas: { happiness: -8 },
      });
    }
  };

  const actionSkydive = () => {
    if (playerMoney < 300) {
      setFeedback({ text: 'Прыжок с парашютом стоит $300 USD.', success: false });
      return;
    }
    soundEngine.playSuccess();
    setFeedback({ text: '🪂 Невероятный адреналин! Свободное падение с высоты 4 000 метров!', success: true });
    onExecuteAction({
      title: 'Прыжок с парашютом',
      description: 'Испытал дикий восторг в свободном падении.',
      success: true,
      moneyDeltaUSD: -300,
      statDeltas: { happiness: 28, health: 5 },
    });
  };

  // --------------------------------------------------------------------------
  // HEALTH & WELLNESS ACTIONS
  // --------------------------------------------------------------------------
  const actionDoctorCheckup = () => {
    if (playerMoney < 400) {
      setFeedback({ text: 'Прием врача и анализы стоят $400 USD.', success: false });
      return;
    }
    soundEngine.playSuccess();
    setFeedback({ text: '🩺 Врач провел осмотр, выписал витамины и укрепил ваш иммунитет (+15 Здоровья)!', success: true });
    onExecuteAction({
      title: 'Медицинский чекап',
      description: 'Прошел курс витаминов и консультацию терапевта.',
      success: true,
      moneyDeltaUSD: -400,
      statDeltas: { health: 15, happiness: 5 },
    });
  };

  const actionQuitBadHabit = () => {
    if (!character.flags.smoker && !character.flags.alcoholic) {
      setFeedback({ text: 'У вас нет вредных привычек (курения или алкоголизма)!', success: true });
      return;
    }

    soundEngine.playSuccess();
    setFeedback({ text: '💪 Вы проявили железную волю и завязали с вредными привычками!', success: true });
    onExecuteAction({
      title: 'Отказ от зависимостей',
      description: 'Бросил курить и употреблять спиртное. Организм говорит спасибо!',
      success: true,
      statDeltas: { health: 22, happiness: 10 },
      flagsUpdate: { smoker: false, alcoholic: false, exSmoker: true, alcControlled: true },
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl max-h-[90vh] bg-canvas-card border-4 border-black rounded-3xl shadow-neo flex flex-col overflow-hidden text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b-3 border-black bg-pink-950/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-500 border-2 border-black flex items-center justify-center text-black font-black text-2xl shadow-neo">
                ⚡
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight font-display text-white">
                  Действия персонажа
                </h2>
                <p className="text-xs text-gray-300">
                  Выбирайте свою судьбу: любовь, карьера, семья, здоровье и рискованные решения.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-2xl bg-black border-2 border-canvas-border flex items-center justify-center text-gray-400 hover:text-white hover:border-red-500 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Feedback Banner */}
          {feedback && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={`px-6 py-3 font-bold font-sans text-sm flex items-center gap-2 border-b-2 border-black ${
                feedback.success ? 'bg-emerald-400 text-black' : 'bg-red-400 text-black'
              }`}
            >
              {feedback.success ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
              <span>{feedback.text}</span>
            </motion.div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 p-4 border-b-2 border-canvas-border overflow-x-auto no-scrollbar bg-black/20">
            {[
              { id: 'love', label: 'Любовь и брак', icon: '❤️' },
              { id: 'career', label: 'Работа и доход', icon: '💼' },
              { id: 'health', label: 'Здоровье и спорт', icon: '🏋️' },
              { id: 'risk', label: 'Азарт и драйв', icon: '🎲' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setFeedback(null);
                }}
                className={`px-4 py-2 rounded-2xl font-display font-bold text-xs uppercase tracking-wider border-2 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-pink-500 text-black border-black shadow-neo'
                    : 'bg-black/40 text-gray-300 border-canvas-border hover:border-gray-500'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* LOVE TAB */}
            {activeTab === 'love' && (
              <div className="space-y-4">
                {/* Status Card */}
                <div className="p-4 rounded-2xl bg-black/40 border-2 border-canvas-border flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400 uppercase font-mono block">Текущий статус</span>
                    <span className="text-base font-bold text-white">
                      {hasPartner
                        ? `${isMarried ? '💍 В браке' : '❤️ В отношениях'} с ${partner.name} (${partner.age} лет)`
                        : 'Холост / одиноки'}
                    </span>
                  </div>
                  {hasPartner && (
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-500/40 font-mono font-bold">
                      {partner.professionRu || partner.job}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {!hasPartner ? (
                    <button
                      onClick={() => handleAction(actionFindLove)}
                      className="p-4 rounded-2xl bg-black/50 border-2 border-canvas-border hover:border-pink-500 text-left transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 text-pink-400 font-bold mb-1">
                        <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Искать любовь / Свидание</span>
                      </div>
                      <p className="text-xs text-gray-400 leading-snug">
                        Попробовать найти вторую половинку через приложения или в компании друзей.
                      </p>
                    </button>
                  ) : (
                    <>
                      {!isMarried ? (
                        <>
                          <button
                            onClick={() => handleAction(() => actionMarry(false))}
                            className="p-4 rounded-2xl bg-black/50 border-2 border-canvas-border hover:border-emerald-500 text-left transition-all cursor-pointer group"
                          >
                            <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                              <span>💍</span>
                              <span>Скромная роспись в ЗАГСе ($300)</span>
                            </div>
                            <p className="text-xs text-gray-400 leading-snug">
                              Тихо расписаться без лишнего шума и стать официальными супругами.
                            </p>
                          </button>

                          <button
                            onClick={() => handleAction(() => actionMarry(true))}
                            className="p-4 rounded-2xl bg-black/50 border-2 border-canvas-border hover:border-yellow-500 text-left transition-all cursor-pointer group"
                          >
                            <div className="flex items-center gap-2 text-yellow-400 font-bold mb-1">
                              <span>✨</span>
                              <span>Пышная свадьба с гостями ($4,000)</span>
                            </div>
                            <p className="text-xs text-gray-400 leading-snug">
                              Праздник на весь город! Дает максимум счастья (+30) и укрепляет связи (+20).
                            </p>
                          </button>
                        </>
                      ) : null}

                      <button
                        onClick={() => handleAction(actionHaveBaby)}
                        className="p-4 rounded-2xl bg-black/50 border-2 border-canvas-border hover:border-cyan-500 text-left transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1">
                          <span>👶</span>
                          <span>Завести ребенка</span>
                        </div>
                        <p className="text-xs text-gray-400 leading-snug">
                          Решиться на пополнение в семье. Добавляет малыша в семейное древо.
                        </p>
                      </button>

                      <button
                        onClick={() => handleAction(actionDivorce)}
                        className="p-4 rounded-2xl bg-black/50 border-2 border-canvas-border hover:border-red-500 text-left transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 text-red-400 font-bold mb-1">
                          <span>💔</span>
                          <span>{isMarried ? 'Оформить развод' : 'Разорвать отношения'}</span>
                        </div>
                        <p className="text-xs text-gray-400 leading-snug">
                          Поставить точку в совместной истории и снова стать свободным человеком.
                        </p>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* CAREER TAB */}
            {activeTab === 'career' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-black/40 border-2 border-canvas-border flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400 uppercase font-mono block">Текущая работа</span>
                    <span className="text-base font-bold text-white">
                      {character.jobName || 'Безработный / Студент'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400 uppercase font-mono block">Доход в год</span>
                    <span className="text-base font-bold text-emerald-400 font-mono">
                      ${Math.round(character.wealth.incomeUSD).toLocaleString()} USD
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleAction(actionAskRaise)}
                    className="p-4 rounded-2xl bg-black/50 border-2 border-canvas-border hover:border-yellow-400 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 text-yellow-400 font-bold mb-1">
                      <span>💼</span>
                      <span>Попросить начальника о прибавке</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-snug">
                      Шанс 45% получить +25% к окладу! Но есть 10% риск быть уволенным за наглость.
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* HEALTH TAB */}
            {activeTab === 'health' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleAction(actionDoctorCheckup)}
                    className="p-4 rounded-2xl bg-black/50 border-2 border-canvas-border hover:border-emerald-400 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                      <span>🩺</span>
                      <span>Чекап у терапевта ($400)</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-snug">
                      Комплексный осмотр и витамины. Дает +15 к здоровью и снижает риски инфаркта.
                    </p>
                  </button>

                  <button
                    onClick={() => handleAction(actionQuitBadHabit)}
                    className="p-4 rounded-2xl bg-black/50 border-2 border-canvas-border hover:border-cyan-400 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1">
                      <span>🚭</span>
                      <span>Бросить курить и алкоголь</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-snug">
                      Проявить силу воли и избавиться от пагубных зависимостей навсегда.
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* RISK TAB */}
            {activeTab === 'risk' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleAction(actionUndergroundPoker)}
                    className="p-4 rounded-2xl bg-black/50 border-2 border-canvas-border hover:border-red-500 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 text-red-400 font-bold mb-1">
                      <span>🃏</span>
                      <span>Подпольный покер ($500)</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-snug">
                      Игра на выбывание с местными шулерами. 12% сорвать куш +$3,500!
                    </p>
                  </button>

                  <button
                    onClick={() => handleAction(actionSkydive)}
                    className="p-4 rounded-2xl bg-black/50 border-2 border-canvas-border hover:border-yellow-400 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 text-yellow-400 font-bold mb-1">
                      <span>🪂</span>
                      <span>Прыжок с парашютом ($300)</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-snug">
                      Мощнейший впрыск дофамина и адреналина (+28 к счастью).
                    </p>
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
