import type {
  CharacterState,
  CharacterStats,
  LifeStage,
  FocusType,
  LifeHistoryEvent,
} from "../types/simulation";
import type {
  FocusDefinition,
  DemographicEvent,
  DecisionCard,
  CompanionLife,
  EnhancedYearStepResult,
} from "../types/events";
import { COUNTRIES, COUNTRIES_BY_ID } from "../data/countries";
import { CAUSES } from "../data/causes";
import { PRNG, defaultPRNG } from "./prng";
import {
  clampStats,
  calculateAnnualMortality,
  selectCauseOfDeath,
  generateCharacterName,
} from "./simulationCore";
import { incomeAt, worldPct } from "./economy";
import { DEMOGRAPHIC_EVENTS } from "../data/events";
import { DECISION_CARDS } from "../data/decisions";

// ============================================================================
// 15 Strategic Annual Focus Definitions
// ============================================================================

export const FOCUS_DEFINITIONS: Record<FocusType, FocusDefinition> = {
  study: {
    id: "study",
    labelRu: "Учёба и знания",
    icon: "🎓",
    descriptionRu: "Углубленное образование, чтение книг, освоение сложных дисциплин и ремесел.",
    effectsSummaryRu: "+5 🎓 Ум, -1 😊 Счастье, -1 🤝 Отношения",
    statDeltas: { smarts: 5, happiness: -1, social: -1 },
  },
  work: {
    id: "work",
    labelRu: "Трудовой упор",
    icon: "💼",
    descriptionRu: "Переработки, сверхурочные смены и профессиональный рост.",
    effectsSummaryRu: "+15% 💰 Доход, +2 🎓 Ум, -2 😊 Счастье, -1 ❤️ Здоровье",
    statDeltas: { smarts: 2, happiness: -2, health: -1 },
    moneyMultiplier: 1.15,
  },
  health: {
    id: "health",
    labelRu: "Здоровье и спорт",
    icon: "🥗",
    descriptionRu: "Здоровый сон, физические упражнения, диета и регулярные медосмотры.",
    effectsSummaryRu: "+5 ❤️ Здоровье, +2 😊 Счастье, -1 🎓 Ум",
    statDeltas: { health: 5, happiness: 2, smarts: -1 },
  },
  social: {
    id: "social",
    labelRu: "Друзья и нетворкинг",
    icon: "🤝",
    descriptionRu: "Встречи с друзьями, шумные компании, новые знакомства и укрепление связей.",
    effectsSummaryRu: "+5 🤝 Отношения, +3 😊 Счастье, -1 🎓 Ум",
    statDeltas: { social: 5, happiness: 3, smarts: -1 },
  },
  crime: {
    id: "crime",
    labelRu: "Теневые схемы и криминал",
    icon: "🥷",
    descriptionRu: "Нелегальный заработок, серый рынок и рискованные авантюры в обход закона.",
    effectsSummaryRu: "+30% 💰 Доход, +1 🎓 Ум, -3 🤝 Отношения, ⚠️ Риск ареста",
    statDeltas: { smarts: 1, happiness: -2, social: -3 },
    moneyMultiplier: 1.30,
    riskFactor: 0.20,
  },
  substance: {
    id: "substance",
    labelRu: "Гедонизм и ночная жизнь (18+)",
    icon: "🚬",
    descriptionRu: "Алкоголь, клубы, табак и безудержный эскапизм от проблем.",
    effectsSummaryRu: "+4 😊 Счастье, -4 ❤️ Здоровье, -2 🎓 Ум, ⚠️ Риск зависимости",
    statDeltas: { happiness: 4, health: -4, smarts: -2 },
    riskFactor: 0.25,
  },
  family: {
    id: "family",
    labelRu: "Семья и дети",
    icon: "🏡",
    descriptionRu: "Забота о детях, родителях, домашний уют и семейные традиции.",
    effectsSummaryRu: "+4 🤝 Отношения, +3 😊 Счастье, -5% 💰 Расходы на быт",
    statDeltas: { social: 4, happiness: 3 },
    moneyMultiplier: 0.95,
  },
  hobby: {
    id: "hobby",
    labelRu: "Хобби и увлечения",
    icon: "🎮",
    descriptionRu: "Видеоигры, кулинария, моделирование, коллекционирование и отдых для души.",
    effectsSummaryRu: "+5 😊 Счастье, +2 🎓 Ум, +1 🤝 Отношения",
    statDeltas: { happiness: 5, smarts: 2, social: 1 },
  },
  military: {
    id: "military",
    labelRu: "Военная подготовка",
    icon: "🪖",
    descriptionRu: "Строгая армейская дисциплина, физические марш-броски и тактические учения.",
    effectsSummaryRu: "+4 ❤️ Здоровье, +2 🎓 Ум, -3 😊 Счастье, ⚠️ Риск травм",
    statDeltas: { health: 4, smarts: 2, happiness: -3 },
    riskFactor: 0.15,
  },
  religion: {
    id: "religion",
    labelRu: "Духовность и вера",
    icon: "🕊️",
    descriptionRu: "Молитвы, медитации, посещение храма и поиск внутреннего мира.",
    effectsSummaryRu: "+4 😊 Счастье, +2 🤝 Отношения, +1 ❤️ Здоровье",
    statDeltas: { happiness: 4, social: 2, health: 1 },
  },
  politics: {
    id: "politics",
    labelRu: "Политика и активизм",
    icon: "🗳️",
    descriptionRu: "Участие в выборах, дебатах, профсоюзах и борьба за общественные интересы.",
    effectsSummaryRu: "+4 🤝 Отношения, +3 🎓 Ум, -2 😊 Счастье, ⚠️ Риск конфликтов",
    statDeltas: { social: 4, smarts: 3, happiness: -2 },
    riskFactor: 0.15,
  },
  travel: {
    id: "travel",
    labelRu: "Путешествия по миру",
    icon: "✈️",
    descriptionRu: "Поездки в другие города и страны, изучение новых культур и расширение кругозора.",
    effectsSummaryRu: "+6 😊 Счастье, +3 🎓 Ум, -15% 💰 Затраты на поездки",
    statDeltas: { happiness: 6, smarts: 3 },
    moneyMultiplier: 0.85,
  },
  art: {
    id: "art",
    labelRu: "Искусство и творчество",
    icon: "🎭",
    descriptionRu: "Живопись, музыка, писательство, театр и выражение внутреннего мира.",
    effectsSummaryRu: "+5 😊 Счастье, +3 🎓 Ум, +2 🤝 Отношения",
    statDeltas: { happiness: 5, smarts: 3, social: 2 },
    moneyMultiplier: 0.95,
  },
  money: {
    id: "money",
    labelRu: "Инвестиции и капитал",
    icon: "💰",
    descriptionRu: "Экономия, инвестиции в акции, облигации и управление личными финансами.",
    effectsSummaryRu: "+20% 💰 Рост капитала, +1 🎓 Ум, -2 ❤️ Здоровье, -2 😊 Счастье",
    statDeltas: { smarts: 1, health: -2, happiness: -2 },
    moneyMultiplier: 1.20,
  },
  rest: {
    id: "rest",
    labelRu: "Покой и восстановление",
    icon: "🛌",
    descriptionRu: "Медленный образ жизни, долгие прогулки, сон и восстановление нервной системы.",
    effectsSummaryRu: "+3 ❤️ Здоровье, +4 😊 Счастье, -1 🎓 Ум",
    statDeltas: { health: 3, happiness: 4, smarts: -1 },
  },
  // Legacy aliases:
  romance: {
    id: "social",
    labelRu: "Романтика",
    icon: "❤️",
    descriptionRu: "Поиск любви и свидания.",
    effectsSummaryRu: "+5 🤝 Отношения, +3 😊 Счастье",
    statDeltas: { social: 5, happiness: 3 },
  },
  hobbies: {
    id: "hobby",
    labelRu: "Хобби",
    icon: "🎨",
    descriptionRu: "Увлечения и творчество.",
    effectsSummaryRu: "+5 😊 Счастье, +2 🎓 Ум",
    statDeltas: { happiness: 5, smarts: 2 },
  },
  wealth: {
    id: "money",
    labelRu: "Богатство",
    icon: "💰",
    descriptionRu: "Накопление активов.",
    effectsSummaryRu: "+20% 💰 Доход, -2 ❤️ Здоровье",
    statDeltas: { smarts: 1, health: -2, happiness: -2 },
    moneyMultiplier: 1.20,
  },
  sports: {
    id: "health",
    labelRu: "Спорт",
    icon: "⚽",
    descriptionRu: "Физические тренировки.",
    effectsSummaryRu: "+5 ❤️ Здоровье, +2 😊 Счастье",
    statDeltas: { health: 5, happiness: 2 },
  },
  spirituality: {
    id: "religion",
    labelRu: "Духовность",
    icon: "🕊️",
    descriptionRu: "Внутренний покой.",
    effectsSummaryRu: "+4 😊 Счастье, +2 🤝 Отношения",
    statDeltas: { happiness: 4, social: 2 },
  },
  adventure: {
    id: "travel",
    labelRu: "Приключения",
    icon: "🏕️",
    descriptionRu: "Путешествия и риск.",
    effectsSummaryRu: "+6 😊 Счастье, +3 🎓 Ум",
    statDeltas: { happiness: 6, smarts: 3 },
    moneyMultiplier: 0.85,
  },
  social_life: {
    id: "social",
    labelRu: "Общение",
    icon: "🤝",
    descriptionRu: "Социальные связи.",
    effectsSummaryRu: "+5 🤝 Отношения, +3 😊 Счастье",
    statDeltas: { social: 5, happiness: 3 },
  },
  creativity: {
    id: "art",
    labelRu: "Творчество",
    icon: "🎭",
    descriptionRu: "Креативное самовыражение.",
    effectsSummaryRu: "+5 😊 Счастье, +3 🎓 Ум",
    statDeltas: { happiness: 5, smarts: 3 },
  },
  vice: {
    id: "substance",
    labelRu: "Пороки (18+)",
    icon: "🚬",
    descriptionRu: "Вредные привычки.",
    effectsSummaryRu: "+4 😊 Счастье, -4 ❤️ Здоровье",
    statDeltas: { happiness: 4, health: -4, smarts: -2 },
  },
};

// ============================================================================
// Life Stage Transitions
// ============================================================================

/**
 * Evaluates the character's life stage using empirical demographic logic:
 * - 'baby': ages 0-5
 * - 'kidwork': ages 6-17 if high agricultural context (agr > 30%), low tertiary (ter < 10),
 *              lowest wealth quintile (quintile === 1 in agrarian countries), or flag kidwork === true.
 * - 'school': ages 6-17 in normal conditions.
 * - 'service': ages 18-64 if active conscription / military service.
 * - 'adult': ages 18-64 in normal working/civilian life.
 * - 'elder': ages 65+ (or retired).
 */
export function determineLifeStageAdvanced(character: CharacterState): LifeStage {
  const age = character.age;

  if (age < 6) {
    return "baby";
  }

  if (age >= 65 || character.isRetired) {
    return "elder";
  }

  // Active military or national service
  if (character.serveLeft && character.serveLeft > 0) {
    return "service";
  }

  // Childhood / Adolescence track (6 to 17)
  if (age < 18) {
    const isAgrarian = character.country.agr > 30;
    const isVeryPoor = character.wealth.quintile === 1;
    const isLowSchooling = character.country.eys < 8;
    const hasKidworkFlag = !!character.flags.kidwork;

    if (hasKidworkFlag || (isVeryPoor && (isAgrarian || isLowSchooling))) {
      return "kidwork";
    }

    return "school";
  }

  // Check for conscription call-up in countries with mandatory service
  const country = character.country;
  if (
    age >= 18 &&
    age <= 21 &&
    country.cs !== null &&
    !character.flags.servedMilitary &&
    !character.flags.militaryExempt
  ) {
    // Check gender requirement: Israel calls both; others predominantly male
    const isSubjectToDraft = country.id === "ISR" || character.sex === "M";
    if (isSubjectToDraft) {
      return "service";
    }
  }

  return "adult";
}

/**
 * Backward-compatible helper for simulationCore
 */
export function determineLifeStage(age: number, state: CharacterState): LifeStage {
  const tempState = { ...state, age };
  return determineLifeStageAdvanced(tempState);
}

// ============================================================================
// Focus Application System
// ============================================================================

export function applyFocusEffects(
  stats: CharacterStats,
  focus: FocusType,
  character: CharacterState,
  prng: PRNG
): { updatedStats: CharacterStats; incomeMultiplier: number; flagsChanged: Record<string, boolean> } {
  const def = FOCUS_DEFINITIONS[focus] ?? FOCUS_DEFINITIONS.health;
  let { health, happiness, smarts, social } = stats;

  health += def.statDeltas.health ?? 0;
  happiness += def.statDeltas.happiness ?? 0;
  smarts += def.statDeltas.smarts ?? 0;
  social += def.statDeltas.social ?? 0;

  const flagsChanged: Record<string, boolean> = {};

  // Risk rolls associated with high-risk focuses
  if (focus === "crime" && prng.boolean(0.12)) {
    flagsChanged.inPrison = true;
    happiness -= 15;
    social -= 10;
  }

  if (focus === "substance") {
    if (prng.boolean(0.20)) {
      flagsChanged.smoker = true;
    }
    if (prng.boolean(0.15)) {
      flagsChanged.alcoholic = true;
    }
    if (prng.boolean(0.08)) {
      flagsChanged.drug = true;
    }
  }

  if (focus === "military" && prng.boolean(0.10)) {
    health -= 8;
    happiness -= 4;
  }

  // Aging degradation past age 50
  if (character.age > 50) {
    const ageFactor = (character.age - 50) * 0.08;
    health -= 0.6 + ageFactor;
  }

  const updatedStats = clampStats({ health, happiness, smarts, social });
  const incomeMultiplier = def.moneyMultiplier ?? 1.0;

  return { updatedStats, incomeMultiplier, flagsChanged };
}

// ============================================================================
// 4 Parallel Companion Lives Generator & Simulator
// ============================================================================

const CONTINENTAL_REPRESENTATIVES: Record<string, string[]> = {
  africa: ["NGA", "EGY", "ETH", "COD", "KEN", "ZAF"],
  asia: ["IND", "CHN", "IDN", "JPN", "BGD", "PAK"],
  americas: ["BRA", "USA", "MEX", "COL", "ARG", "CAN"],
  europe: ["DEU", "GBR", "FRA", "RUS", "ITA", "ESP"],
};

const AVATAR_COLORS = ["#00F0FF", "#FF0055", "#FFE600", "#00FF66", "#A855F7"];

/**
 * Spawns 4 companion babies from 4 distinct global regions.
 */
export function spawnCompanionLives(userCountryId: string, prng: PRNG = defaultPRNG): CompanionLife[] {
  const regions = ["africa", "asia", "americas", "europe"];
  const companions: CompanionLife[] = [];

  regions.forEach((regionKey, idx) => {
    const candidateCodes = CONTINENTAL_REPRESENTATIVES[regionKey];
    // Filter out user's own country if in list, otherwise pick from list
    const filtered = candidateCodes.filter((c) => c !== userCountryId);
    const chosenId = prng.choice(filtered.length > 0 ? filtered : candidateCodes);
    const country = COUNTRIES_BY_ID[chosenId] ?? COUNTRIES[0];

    const maleProb = country.id === "CHN" ? 0.528 : country.id === "IND" ? 0.519 : 0.512;
    const sex = prng.boolean(maleProb) ? "M" : "F";
    const name = generateCharacterName(country, sex, prng);

    companions.push({
      id: `comp_${idx + 1}`,
      name,
      countryId: country.id,
      countryRu: country.ru,
      region: country.p,
      sex,
      age: 0,
      isAlive: true,
      currentStage: "baby",
      avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
      yearlyNotes: [`Родился(лась) в ту же секунду в стране ${country.ru}.`],
    });
  });

  return companions;
}

/**
 * Advances all living companion lives by 1 year.
 */
export function advanceCompanionLives(
  companions: CompanionLife[],
  prng: PRNG = defaultPRNG
): { updatedCompanions: CompanionLife[]; updates: { companionId: string; text: string; isAlive: boolean; stage: LifeStage }[] } {
  const updatedCompanions: CompanionLife[] = [];
  const updates: { companionId: string; text: string; isAlive: boolean; stage: LifeStage }[] = [];

  for (const comp of companions) {
    if (!comp.isAlive) {
      updatedCompanions.push(comp);
      continue;
    }

    const country = COUNTRIES_BY_ID[comp.countryId] ?? COUNTRIES[0];
    const currentAge = comp.age;

    // 1. Annual mortality calculation for companion based on national life tables
    let annualDeathProb = 0.002;
    if (currentAge === 0) {
      annualDeathProb = Math.min(0.20, (country.im / 1000) * (comp.sex === "M" ? 1.15 : 0.95));
    } else if (currentAge < 5) {
      annualDeathProb = Math.min(0.08, ((country.u5 - country.im) / 4000));
    } else if (currentAge < 15) {
      annualDeathProb = 0.001 * (1 + country.u5 / 100);
    } else if (currentAge < 50) {
      annualDeathProb = 0.002 + (1 - country.le / 90) * 0.006;
    } else if (currentAge < 75) {
      annualDeathProb = 0.015 + (currentAge - 50) * 0.003;
    } else {
      annualDeathProb = 0.08 + (currentAge - 75) * 0.018;
    }

    const roll = prng.next();
    if (roll < annualDeathProb || currentAge >= 105) {
      // Companion died this year
      let cause = "инфекционное заболевание";
      if (currentAge === 0) {
        cause = "осложнения при рождении";
      } else if (currentAge < 5) {
        cause = country.mal > 0.3 ? "малярия" : "пневмония";
      } else if (currentAge < 30) {
        cause = country.road > 18 ? "дорожно-транспортное происшествие" : "несчастный случай";
      } else if (currentAge < 70) {
        cause = "сердечно-сосудистое заболевание";
      } else {
        cause = "естественная старость";
      }

      const deathNote = `${comp.name} (${comp.countryRu}, ${currentAge} лет) скончался(лась). Причина: ${cause}.`;

      updatedCompanions.push({
        ...comp,
        isAlive: false,
        deathCause: cause,
        deathAge: currentAge,
        majorMilestone: `Умер(ла) в возрасте ${currentAge} лет (${cause})`,
        yearlyNotes: [...(comp.yearlyNotes ?? []), deathNote],
      });

      updates.push({
        companionId: comp.id,
        text: deathNote,
        isAlive: false,
        stage: comp.currentStage,
      });

      continue;
    }

    // Companion survived: advance age
    const nextAge = currentAge + 1;
    let stage: LifeStage = "baby";

    if (nextAge < 6) {
      stage = "baby";
    } else if (nextAge < 18) {
      stage = country.agr > 30 ? "kidwork" : "school";
    } else if (nextAge < 65) {
      stage = country.cs && nextAge >= 18 && nextAge <= 20 ? "service" : "adult";
    } else {
      stage = "elder";
    }

    let milestone: string | undefined = undefined;
    if (nextAge === 1) {
      milestone = `${comp.name} (${comp.countryRu}) сделал(а) первые шаги.`;
    } else if (nextAge === 6) {
      milestone = stage === "kidwork"
        ? `${comp.name} (${comp.countryRu}, 6 лет) помогает родителям в поле.`
        : `${comp.name} (${comp.countryRu}, 6 лет) пошел(ла) в начальную школу.`;
    } else if (nextAge === 14) {
      milestone = `${comp.name} (${comp.countryRu}, 14 лет) успешно сдал(а) школьные тесты.`;
    } else if (nextAge === 18) {
      milestone = stage === "service"
        ? `${comp.name} (${comp.countryRu}, 18 лет) призван(а) на военную службу.`
        : `${comp.name} (${comp.countryRu}, 18 лет) начал(а) самостоятельную жизнь.`;
    } else if (nextAge === 25) {
      milestone = `${comp.name} (${comp.countryRu}, 25 лет) создал(а) семью.`;
    } else if (nextAge === 40) {
      milestone = `${comp.name} (${comp.countryRu}, 40 лет) достиг(ла) профессиональной стабильности.`;
    } else if (nextAge === 65) {
      milestone = `${comp.name} (${comp.countryRu}, 65 лет) вышел(ла) на пенсию.`;
    }

    const updatedNotes = milestone
      ? [...(comp.yearlyNotes ?? []), milestone]
      : (comp.yearlyNotes ?? []);

    updatedCompanions.push({
      ...comp,
      age: nextAge,
      currentStage: stage,
      majorMilestone: milestone ?? comp.majorMilestone,
      yearlyNotes: updatedNotes,
    });

    if (milestone) {
      updates.push({
        companionId: comp.id,
        text: milestone,
        isAlive: true,
        stage,
      });
    }
  }

  return { updatedCompanions, updates };
}

// ============================================================================
// Demographic Events Selector
// ============================================================================

export function selectDemographicEvents(
  state: CharacterState,
  prng: PRNG = defaultPRNG,
  maxEvents: number = 2
): DemographicEvent[] {
  const eligible = DEMOGRAPHIC_EVENTS.filter((evt) => {
    const ageMatch = state.age >= (evt.minAge ?? 0) && state.age <= (evt.maxAge ?? 120);
    if (!ageMatch) return false;
    if (evt.condition && !evt.condition(state)) return false;
    return true;
  });

  const selected: DemographicEvent[] = [];
  for (const evt of eligible) {
    if (selected.length >= maxEvents) break;
    if (prng.boolean(evt.triggerProbability)) {
      selected.push(evt);
    }
  }

  return selected;
}

// ============================================================================
// Interactive Decision Card Selector & Resolver
// ============================================================================

export function selectDecisionCard(
  state: CharacterState,
  prng: PRNG = defaultPRNG,
  cooldownIds: Set<string> = new Set()
): DecisionCard | undefined {
  const candidates = DECISION_CARDS.filter((card) => {
    if (cooldownIds.has(card.id)) return false;
    const ageMatch = state.age >= card.minAge && state.age <= card.maxAge;
    if (!ageMatch) return false;
    if (card.triggerCondition && !card.triggerCondition(state)) return false;
    return true;
  });

  if (candidates.length === 0) return undefined;
  return prng.choice(candidates);
}

export function resolveDecisionChoice(
  state: CharacterState,
  card: DecisionCard,
  optionId: string,
  prng: PRNG = defaultPRNG
): { nextState: CharacterState; outcomeText: string; isRiskFailed: boolean; isDeath: boolean } {
  const option = card.options.find((o) => o.id === optionId) ?? card.options[0];
  const riskChance = option.riskPercentage ?? 0;
  const isRiskFailed = riskChance > 0 && prng.float(0, 100) < riskChance;

  if (isRiskFailed) {
    // Risk failed outcome
    if (option.riskDeath) {
      const cause = CAUSES[option.riskDeathCause ?? "inj"] ?? CAUSES.inj;
      const deathState: CharacterState = {
        ...state,
        isAlive: false,
        deathCause: cause,
        deathAge: state.age,
        eulogy: `Погиб(ла) в возрасте ${state.age} лет. Причина: ${cause.ru}.`,
      };
      return {
        nextState: deathState,
        outcomeText: option.riskOutcomeDescription ?? "Несчастный случай привел к фатальному исходу.",
        isRiskFailed: true,
        isDeath: true,
      };
    }

    const appliedStatDeltas = option.riskStatDeltas ?? option.statDeltas ?? {};
    const updatedStats = clampStats({
      health: state.stats.health + (appliedStatDeltas.health ?? 0),
      happiness: state.stats.happiness + (appliedStatDeltas.happiness ?? 0),
      smarts: state.stats.smarts + (appliedStatDeltas.smarts ?? 0),
      social: state.stats.social + (appliedStatDeltas.social ?? 0),
    });

    const updatedNetWorth = state.wealth.netWorthUSD + (option.riskWealthDelta ?? 0);
    const nextState: CharacterState = {
      ...state,
      stats: updatedStats,
      wealth: {
        ...state.wealth,
        netWorthUSD: updatedNetWorth,
      },
    };

    return {
      nextState,
      outcomeText: option.riskOutcomeDescription ?? "Риск не оправдался, возникли серьезные осложнения.",
      isRiskFailed: true,
      isDeath: false,
    };
  }

  // Successful or standard outcome
  const statDeltas = option.statDeltas ?? {};
  const updatedStats = clampStats({
    health: state.stats.health + (statDeltas.health ?? 0),
    happiness: state.stats.happiness + (statDeltas.happiness ?? 0),
    smarts: state.stats.smarts + (statDeltas.smarts ?? 0),
    social: state.stats.social + (statDeltas.social ?? 0),
  });

  let netWorthUSD = state.wealth.netWorthUSD + (option.wealthDelta ?? 0);
  if (option.wealthMultiplier) {
    netWorthUSD = Math.round(netWorthUSD * option.wealthMultiplier);
  }

  const updatedFlags = {
    ...state.flags,
    ...(option.flagModifiers ?? {}),
  };

  const nextState: CharacterState = {
    ...state,
    stats: updatedStats,
    wealth: {
      ...state.wealth,
      netWorthUSD,
    },
    flags: updatedFlags,
  };

  return {
    nextState,
    outcomeText: option.outcomeDescription ?? "Вы приняли решение и справились с последствиями.",
    isRiskFailed: false,
    isDeath: false,
  };
}

// ============================================================================
// Master Step Year Engine (M3 Core Controller)
// ============================================================================

export function stepYear(
  character: CharacterState,
  focus: FocusType = "health",
  prng: PRNG = defaultPRNG,
  cooldownDecisionIds: Set<string> = new Set()
): EnhancedYearStepResult {
  if (!character.isAlive) {
    return { nextState: character, events: [] };
  }

  // 1. Mortality check via empirical multi-hazard engine
  const mortality = calculateAnnualMortality(character);
  const roll = prng.next();

  if (roll < mortality.combinedProbability) {
    // Character died this year
    const deathCause = selectCauseOfDeath(character, prng);
    const eulogy = `Прожил(а) ${character.age} ${character.age === 1 ? "год" : character.age < 5 ? "года" : "лет"}. Причина смерти: ${deathCause.ru}.`;

    const deathEvent: LifeHistoryEvent = {
      age: character.age,
      text: `Смерть в возрасте ${character.age} лет. Причина: ${deathCause.ru}.`,
      sourceOrFact: deathCause.note ?? null,
      category: "death",
    };

    const nextState: CharacterState = {
      ...character,
      isAlive: false,
      deathCause,
      deathAge: character.age,
      eulogy,
      longevityPercentile: Math.min(0.99, character.age / Math.max(1, character.country.le)),
      wealthPercentile: character.wealth.worldPct,
      history: [...(character.history ?? []), deathEvent],
    };

    return { nextState, events: [deathEvent] };
  }

  // 2. Character survived: advance age and year
  const nextAge = character.age + 1;
  const nextYear = character.year + 1;

  // Initialize companion lives if not yet spawned
  let companions = character.companions;
  if (!companions || companions.length === 0) {
    companions = spawnCompanionLives(character.country.id, prng);
  }

  // Advance companion lives in parallel
  const { updatedCompanions, updates: companionUpdates } = advanceCompanionLives(companions, prng);

  // 3. Apply 15 Focuses & aging degradation
  const { updatedStats, incomeMultiplier, flagsChanged } = applyFocusEffects(
    character.stats,
    focus,
    character,
    prng
  );

  // 4. Update life stage dynamically
  const tempForStage: CharacterState = {
    ...character,
    age: nextAge,
    stats: updatedStats,
    flags: { ...character.flags, ...flagsChanged },
  };
  const stage = determineLifeStageAdvanced(tempForStage);

  // 5. Update income and accumulated wealth
  let incomeUSD = character.wealth.incomeUSD;
  if (stage === "adult") {
    incomeUSD = Math.round(incomeAt(character.country, character.wealth.percentile) * incomeMultiplier);
  } else if (stage === "kidwork") {
    incomeUSD = Math.round(incomeAt(character.country, 0.1) * 0.4);
  } else if (stage === "service") {
    incomeUSD = Math.round(incomeAt(character.country, 0.2) * 0.5);
  } else if (stage === "baby" || stage === "school") {
    incomeUSD = 0;
  } else if (stage === "elder") {
    incomeUSD = Math.round(incomeAt(character.country, character.wealth.percentile) * 0.6);
  }

  const netWorthUSD = character.wealth.netWorthUSD + Math.round(incomeUSD * 0.12);
  const updatedWorldPct = worldPct(incomeUSD > 0 ? incomeUSD : character.wealth.incomeUSD);

  // 6. Select and execute triggered demographic events
  const newEvents: LifeHistoryEvent[] = [];
  const focusDef = FOCUS_DEFINITIONS[focus] ?? FOCUS_DEFINITIONS.health;
  const stepEvent: LifeHistoryEvent = {
    age: nextAge,
    text: `Вам исполнилось ${nextAge} ${nextAge === 1 ? "год" : nextAge < 5 ? "года" : "лет"}. Фокус года: ${focusDef.labelRu}.`,
    category: "general",
  };
  newEvents.push(stepEvent);

  const triggeredDemographic = selectDemographicEvents(tempForStage, prng, 2);
  for (const demoEvt of triggeredDemographic) {
    newEvents.push({
      age: nextAge,
      text: demoEvt.text,
      sourceOrFact: demoEvt.footnote ?? null,
      category: demoEvt.is18Plus ? "crisis" : "milestone",
    });

    if (demoEvt.effects?.stats) {
      updatedStats.health = Math.max(0, Math.min(100, updatedStats.health + (demoEvt.effects.stats.health ?? 0)));
      updatedStats.happiness = Math.max(0, Math.min(100, updatedStats.happiness + (demoEvt.effects.stats.happiness ?? 0)));
      updatedStats.smarts = Math.max(0, Math.min(100, updatedStats.smarts + (demoEvt.effects.stats.smarts ?? 0)));
      updatedStats.social = Math.max(0, Math.min(100, updatedStats.social + (demoEvt.effects.stats.social ?? 0)));
    }
  }

  // 7. Select interactive decision card
  const decision = selectDecisionCard(tempForStage, prng, cooldownDecisionIds);

  const nextState: CharacterState = {
    ...character,
    age: nextAge,
    year: nextYear,
    stage,
    stats: clampStats(updatedStats),
    wealth: {
      ...character.wealth,
      incomeUSD,
      netWorthUSD,
      worldPct: updatedWorldPct,
    },
    flags: {
      ...character.flags,
      ...flagsChanged,
    },
    companions: updatedCompanions,
    history: [...(character.history ?? []), ...newEvents],
  };

  return {
    nextState,
    events: newEvents,
    triggeredDemographicEvents: triggeredDemographic,
    decision,
    companionUpdates,
  };
}
