import type {
  CharacterState,
  CharacterStats,
  SimulationSeed,
  YearStepResult,
  LifeStage,
  FocusType,
  LifeHistoryEvent,
} from "../types/simulation";
import type {
  CountryDemographics,
  CauseDefinition,
  AnnualHazardResult,
  CauseOfDeathCode,
} from "../types/demographics";
import { COUNTRIES, COUNTRIES_BY_ID, MORT_G } from "../data/countries";
import { CAUSES, CT, getAgeBand } from "../data/causes";
import { PRNG, defaultPRNG } from "./prng";
import { lifeTable } from "./lifeTable";
import { incomeAt, worldPct, getQuintileFromPercentile } from "./economy";
export type { FamilyState } from "../types/family";
import { generateInitialFamily, stepFamilyYear } from "./familyEngine";

// ============================================================================
// Procedural Name Banks for Major Cultural Groups
// ============================================================================

interface NameBank {
  male: string[];
  female: string[];
  surnames: string[];
}

const NAME_BANKS: Record<string, NameBank> = {
  ru: {
    male: ["Александр", "Дмитрий", "Максим", "Иван", "Сергей", "Михаил", "Артём", "Андрей", "Никита", "Даниил"],
    female: ["Анастасия", "Мария", "Анна", "Дарья", "Елена", "Полина", "Екатерина", "София", "Алиса", "Виктория"],
    surnames: ["Иванов", "Смирнов", "Кузнецов", "Попов", "Васильев", "Петров", "Соколов", "Михайлов", "Новиков", "Фёдоров"],
  },
  en: {
    male: ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles"],
    female: ["Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen"],
    surnames: ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"],
  },
  zh: {
    male: ["Вэй", "Хаожань", "Цзысюань", "Цзюньцзе", "Лэй", "Юй", "Цзе", "Цян", "Мин", "Чжихао"],
    female: ["Фан", "Тин", "Цзин", "Сюин", "Ли", "Син", "Мэй", "Сюэ", "Янь", "Хуэй"],
    surnames: ["Ван", "Ли", "Чжан", "Лю", "Чэнь", "Ян", "Хуан", "Чжао", "У", "Чжоу"],
  },
  hi: {
    male: ["Аарав", "Рахул", "Амит", "Викрам", "Арджун", "Рохан", "Санджай", "Рави", "Суреш", "Дипак"],
    female: ["Прия", "Ананди", "Дивья", "Неха", "Пуджа", "Анита", "Кавита", "Сита", "Гита", "Рия"],
    surnames: ["Шарма", "Верма", "Сингх", "Патель", "Кумар", "Гупта", "Ядав", "Джоши", "Шах", "Реди"],
  },
  ar: {
    male: ["Мухаммад", "Ахмад", "Али", "Омар", "Хасан", "Хусейн", "Ибрахим", "Юсуф", "Тарик", "Халид"],
    female: ["Фатима", "Аиша", "Марьям", "Нур", "Зайнаб", "Лейла", "Сара", "Ясмин", "Худа", "Амина"],
    surnames: ["аль-Гамиди", "аль-Отаиби", "аль-Харби", "аль-Шаммари", "аль-Асад", "Хасан", "Мансур", "Ибрахим"],
  },
  es: {
    male: ["Сантьяго", "Матео", "Себастьян", "Леонардо", "Матиас", "Эмилиано", "Диего", "Мигель", "Алехандро"],
    female: ["София", "Валентина", "Камила", "Изабелла", "Мариана", "Габриэла", "Даниэла", "Лусия", "Мартина"],
    surnames: ["Гонсалес", "Родригес", "Лопес", "Мартинес", "Перес", "Гарсия", "Санчес", "Рамирес", "Торрес"],
  },
  fr: {
    male: ["Габриэль", "Лео", "Рафаэль", "Луи", "Жюль", "Артур", "Адам", "Поль", "Гюго", "Тео"],
    female: ["Эмма", "Жад", "Луиза", "Алиса", "Хлоя", "Лина", "Леа", "Манон", "Роза", "Камилла"],
    surnames: ["Мартен", "Бернар", "Тома", "Пети", "Робер", "Ришар", "Дюран", "Дюбуа", "Моро", "Лоран"],
  },
};

/**
 * Procedurally generates culturally authentic full names.
 */
export function generateCharacterName(country: CountryDemographics, sex: "M" | "F", prng: PRNG): string {
  const culturePrefix = country.nm.split(":")[0].split(",")[0].toLowerCase();
  const bank = NAME_BANKS[culturePrefix] ?? NAME_BANKS.en;
  const firstName = sex === "F" ? prng.choice(bank.female) : prng.choice(bank.male);
  const surname = prng.choice(bank.surnames);

  if (culturePrefix === "ru") {
    // Add Russian feminine suffix for surnames if female
    const femSurname = sex === "F" && (surname.endsWith("ов") || surname.endsWith("ев") || surname.endsWith("ин"))
      ? surname + "а"
      : surname;
    return `${firstName} ${femSurname}`;
  }

  return `${firstName} ${surname}`;
}

// ============================================================================
// Core Character Attribute Clamping
// ============================================================================

/**
 * Strictly clamps stats to [0, 100] range.
 */
export function clampStats(stats: CharacterStats): CharacterStats {
  return {
    health: Math.max(0, Math.min(100, Math.round(stats.health))),
    happiness: Math.max(0, Math.min(100, Math.round(stats.happiness))),
    smarts: Math.max(0, Math.min(100, Math.round(stats.smarts))),
    social: Math.max(0, Math.min(100, Math.round(stats.social))),
  };
}

// ============================================================================
// Birth Lottery Generator
// ============================================================================

/**
 * Generates a newborn character based on empirical demographic probabilities.
 */
export function generateBirth(seed: SimulationSeed, prng: PRNG = defaultPRNG): CharacterState {
  // 1. Pick country
  let country: CountryDemographics;
  if (seed.countryId && COUNTRIES_BY_ID[seed.countryId]) {
    country = COUNTRIES_BY_ID[seed.countryId];
  } else {
    const mode = seed.mode ?? "birth";
    const weights: Record<string, number> = {};
    for (const c of COUNTRIES) {
      weights[c.id] = mode === "pop" ? c.pop : c.b;
    }
    const chosenId = prng.weightedPick(weights);
    country = COUNTRIES_BY_ID[chosenId] ?? COUNTRIES[0];
  }

  // 2. Pick biological sex with sex-ratio-at-birth
  let sex: "M" | "F";
  if (seed.sex) {
    sex = seed.sex;
  } else {
    const maleProb = country.id === "CHN" ? 0.528 : country.id === "IND" ? 0.519 : 0.512;
    sex = prng.boolean(maleProb) ? "M" : "F";
  }

  // 3. Name generation
  const name = generateCharacterName(country, sex, prng);

  // 4. Starting socioeconomic standing
  const percentile = prng.float(0.01, 0.99);
  const quintile = getQuintileFromPercentile(percentile);
  const incomeUSD = incomeAt(country, percentile);
  const globalPct = worldPct(incomeUSD);

  // 5. Initial stats scaled by country development and inequality
  const initialHealth = Math.round(75 + 15 * (1 - country.im / 100) + (quintile - 3) * 2);
  const initialHappiness = Math.round(55 + (country.wh ? (country.wh - 5) * 5 : 0) + (quintile - 3) * 3);
  const initialSmarts = Math.round(45 + country.eys * 1.5 + (quintile - 3) * 2);
  const initialSocial = Math.round(50 + (quintile - 3) * 2);

  const stats = clampStats({
    health: initialHealth,
    happiness: initialHappiness,
    smarts: initialSmarts,
    social: initialSocial,
  });

  const birthYear = seed.year ?? 2026;

  // Generate initial demographic family structure using dedicated character seed
  const familySeed = seed.seed !== undefined ? `${seed.seed}_family` : `${country.id}_${percentile}_family`;
  const family = generateInitialFamily(country, quintile, new PRNG(familySeed));

  const initialHistory: LifeHistoryEvent = {
    age: 0,
    text: `Вы родились в стране: ${country.ru}. Пол: ${sex === "F" ? "женский" : "мужской"}. Семья относится к ${quintile}-му квинтилю дохода.`,
    sourceOrFact: `Ожидаемая продолжительность жизни при рождении: ${country.le.toFixed(1)} лет (ООН WPP 2024).`,
    category: "milestone",
  };

  return {
    id: `char_${prng.int(100000, 999999)}`,
    name,
    age: 0,
    sex,
    country,
    year: birthYear,
    birthYear,
    stage: "baby",
    stats,
    wealth: {
      quintile,
      percentile,
      incomeUSD: Math.round(incomeUSD),
      netWorthUSD: 0,
      worldPct: globalPct,
    },
    flags: {
      smoker: false,
      exSmoker: false,
      alcoholic: false,
      alcControlled: false,
      drug: false,
      refugee: false,
      inPrison: false,
    },
    chronicIllnesses: [],
    conditions: {},
    isAlive: true,
    family,
    householdSize: family.household?.size ?? 1,
    history: [initialHistory],
  };
}

/**
 * Milestone 7 alias for simulation initialization
 */
export const initSimulation = generateBirth;

// ============================================================================
// Annual Mortality Hazard Engine
// ============================================================================

/**
 * Computes annual multi-hazard continuous proportional mortality risks.
 * P(death) = 1 - (1 - p0) * (1 - hz) * (1 - rz).
 */
export function calculateAnnualMortality(character: CharacterState): AnnualHazardResult {
  const age = character.age;
  const country = character.country;
  const lt = lifeTable(country, character.sex);
  const baseQ = age >= 110 ? 1.0 : lt.q[age];

  let s = 1.0;

  // A. Health Status Penalty / Protection
  const expHealth = 85 - (age > 40 ? (age - 40) * 0.45 : 0);
  const agePenalty = 6 + (age > 50 ? (age - 50) * 0.08 : 0);
  const targetHealth = age < 15 ? 80 - age * 0.5 : expHealth - agePenalty;
  const healthDiff = targetHealth - character.stats.health;
  const sensitivity = age < 5 ? 0.02 : 0.03;
  s *= Math.max(0.5, Math.exp(healthDiff * sensitivity));

  // B. Socioeconomic Wealth Gradient
  const regionG = MORT_G[country.p] ?? 0.20;
  const quintile = character.wealth.quintile;
  const meanQuintileFactor = [1, 2, 3, 4, 5].reduce((sum, q) => sum + Math.exp(-regionG * (q - 3)), 0) / 5;
  const wealthFactor = Math.exp(-regionG * (quintile - 3)) / meanQuintileFactor;
  s *= wealthFactor;

  // C. 18+ Tobacco Smoking
  if (age >= 25) {
    const countrySmokeShare = (character.sex === "F" ? country.sf : country.sm) / 100;
    const smokeRR = character.flags.smoker ? 2.6 : character.flags.exSmoker ? 1.25 : 1.0;
    const smokeNormalized = 1 + (2.6 - 1) * 0.3 * countrySmokeShare;
    s *= smokeRR / smokeNormalized;
  }

  // D. 18+ Alcohol Use
  if (age >= 18) {
    const heavyRR = character.sex === "F" ? 6.0 : 3.2;
    const modRR = character.sex === "F" ? 1.7 : 1.2;
    const alcoholRR = character.flags.alcoholic ? heavyRR : character.flags.alcControlled ? modRR : 1.0;
    s *= alcoholRR;
  }

  // E. 18+ Substance Addiction
  if (character.flags.drug && age >= 16) {
    s *= 2.0;
  }

  // F. Chronic Conditions (Hypertension, Diabetes, etc.)
  if (character.conditions) {
    for (const key in character.conditions) {
      if (!character.conditions[key].treated) {
        s *= 1.3;
      }
    }
  } else if (character.chronicIllnesses && character.chronicIllnesses.length > 0) {
    s *= Math.pow(1.3, character.chronicIllnesses.length);
  }

  // G. Social Isolation Penalty
  if (age >= 25 && character.stats.social < 75) {
    s *= 1 + 0.15 * Math.max(0, Math.min(1, (75 - character.stats.social) / 35));
  }

  // H. Clamped Continuous Proportional Hazard
  const clampedS = Math.max(0.25, Math.min(9.0, s));
  const p0 = 1 - Math.pow(1 - baseQ, clampedS);

  // I. Untreated HIV Weibull Hazard (hz)
  let hz = 0;
  if (character.hiv && !character.hiv.onART) {
    const duration = Math.max(0, age - character.hiv.infectedAtAge);
    hz = 1 - Math.exp(Math.pow(duration / 5.41, 0.486) - Math.pow((duration + 1) / 5.41, 0.486));
    hz = Math.max(0, Math.min(0.8, hz));
  }

  // J. High-Risk Motorcycle Hazard (rz)
  let rz = 0;
  if (character.ownsMotorcycle && age >= 15 && age <= 75) {
    const roadShare = (country.road / 100000) / Math.max(0.001, baseQ);
    rz = 1 - Math.pow(1 - baseQ, Math.min(0.4, roadShare * 0.5));
  }

  const combinedProbability = age >= 110 ? 1.0 : 1 - (1 - p0) * (1 - hz) * (1 - rz);

  return {
    p0,
    hz,
    rz,
    combinedProbability: Math.max(0, Math.min(1.0, combinedProbability)),
  };
}

// ============================================================================
// Cause of Death Selection
// ============================================================================

/**
 * Samples a specific cause of death from the 33 categories calibrated to region,
 * age group, and character lifestyle multipliers.
 */
export function selectCauseOfDeath(character: CharacterState, prng: PRNG = defaultPRNG): CauseDefinition {
  const age = character.age;
  const country = character.country;
  const band = getAgeBand(age);
  const baseTable = CT[country.p]?.[band] ?? CT.eca[band];

  const weights: Record<string, number> = { ...baseTable };

  // Lifestyle risk factor adjustments
  if (character.flags.smoker) {
    if (weights.copd) weights.copd *= 3.0;
    if (weights.can) weights.can *= 1.8;
    if (weights.ihd) weights.ihd *= 1.4;
    if (weights.str) weights.str *= 1.4;
  }

  if (character.flags.alcoholic) {
    if (weights.cir) weights.cir *= 6.0;
    if (weights.road) weights.road *= 2.0;
    if (weights.inj) weights.inj *= 2.0;
    if (weights.fall) weights.fall *= 2.0;
    if (weights.hom) weights.hom *= 2.0;
    if (weights.str) weights.str *= 1.3;
  }

  if (character.flags.drug) {
    if (weights.od !== undefined) {
      weights.od = Math.max(weights.od * 20.0, 15);
    } else {
      weights.od = 15;
    }
  }

  if (character.ownsMotorcycle && weights.road) {
    weights.road *= 3.0;
  }

  if (country.war > 0.2) {
    weights.war = (weights.war || 1) * (1 + country.war * 4);
  }

  if (country.hom > 10 && weights.hom) {
    weights.hom *= 1 + country.hom / 15;
  }

  if (character.sex === "F" && age >= 15 && age <= 49 && country.mmr > 20) {
    weights.mat = (weights.mat || 0) + country.mmr / 40;
  }

  if (character.stats.happiness < 20) {
    weights.suic = (weights.suic || 2) * 4.0;
  }

  const chosenCode = prng.weightedPick(weights) as CauseOfDeathCode;
  return CAUSES[chosenCode] ?? CAUSES.ocd;
}

// ============================================================================
// Annual Stepping & Progression
// ============================================================================

/**
 * Determines life stage based on character age and current status.
 */
export function determineLifeStage(age: number, state: CharacterState): LifeStage {
  if (age < 6) return "baby";
  if (state.serveLeft && state.serveLeft > 0) return "service";
  if (age < 18) return "school";
  if (age >= 65 || state.isRetired) return "elder";
  return "adult";
}

/**
 * Advances the simulation by 1 year.
 */
export function stepYear(
  character: CharacterState,
  focus: FocusType = "health",
  prng: PRNG = defaultPRNG
): YearStepResult {
  if (!character.isAlive) {
    return { nextState: character, events: [] };
  }

  // 1. Mortality check
  const mortality = calculateAnnualMortality(character);
  const roll = prng.next();

  if (roll < mortality.combinedProbability) {
    // Character died this year
    const deathCause = selectCauseOfDeath(character, prng);
    const eulogy = `Прожил ${character.age} ${character.age === 1 ? "год" : character.age < 5 ? "года" : "лет"}. Причина смерти: ${deathCause.ru}.`;

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

  // 2. Character survived: advance age
  const nextAge = character.age + 1;
  const nextYear = character.year + 1;

  // 3. Apply annual focus and aging effects to attributes
  let { health, happiness, smarts, social } = character.stats;

  // Aging degradation past age 50
  if (nextAge > 50) {
    health -= 0.5 + (nextAge - 50) * 0.05;
  }

  // Focus modifications
  switch (focus) {
    case "health":
      health += 3;
      smarts -= 1;
      break;
    case "study":
      smarts += 4;
      social -= 1;
      break;
    case "work":
      happiness -= 1;
      smarts += 2;
      break;
    case "family":
      social += 3;
      happiness += 2;
      break;
    case "sports":
      health += 4;
      happiness += 1;
      break;
    case "rest":
      happiness += 3;
      health += 1;
      break;
    case "vice":
      health -= 4;
      happiness += 2;
      if (prng.boolean(0.15)) {
        character.flags.alcoholic = true;
      }
      break;
    default:
      health += 1;
      happiness += 1;
      break;
  }

  const updatedStats = clampStats({ health, happiness, smarts, social });

  // 4. Update life stage
  const stage = determineLifeStage(nextAge, character);

  // 5. Update income and wealth
  let incomeUSD = character.wealth.incomeUSD;
  if (stage === "adult") {
    incomeUSD = Math.round(incomeAt(character.country, character.wealth.percentile));
  } else if (stage === "baby" || stage === "school") {
    incomeUSD = 0;
  }
  const netWorthUSD = character.wealth.netWorthUSD + Math.round(incomeUSD * 0.1);
  const updatedWorldPct = worldPct(incomeUSD > 0 ? incomeUSD : character.wealth.incomeUSD);

  const stepEvent: LifeHistoryEvent = {
    age: nextAge,
    text: `Вам исполнилось ${nextAge} ${nextAge === 1 ? "год" : nextAge < 5 ? "года" : "лет"}. Фокус года: ${focus}.`,
    category: "general",
  };

  // 6. Step demographic family graph and collect lifecycle events
  let updatedFamily = character.family;
  const familyHistoryEvents: LifeHistoryEvent[] = [];
  let updatedQuintile = character.wealth.quintile;

  if (!updatedFamily) {
    updatedFamily = generateInitialFamily(character.country, character.wealth.quintile, () => prng.next());
  }

  const { nextFamily, familyEvents } = stepFamilyYear(
    updatedFamily,
    nextAge,
    character.country,
    () => prng.next()
  );
  updatedFamily = nextFamily;

  for (const famEvtText of familyEvents) {
    familyHistoryEvents.push({
      age: nextAge,
      text: famEvtText,
      category:
        famEvtText.includes("ушел") || famEvtText.includes("скончался") || famEvtText.includes("удар")
          ? "crisis"
          : "milestone",
    });
  }

  // Economic shock if parent dies early (< 15)
  if (nextAge < 15) {
    const dadJustDied = !nextFamily.father.isAlive && (character.family ? character.family.father.isAlive : false);
    const momJustDied = !nextFamily.mother.isAlive && (character.family ? character.family.mother.isAlive : false);
    if (dadJustDied || momJustDied) {
      updatedQuintile = Math.max(1, updatedQuintile - 1);
    }
  }

  const allEvents = [stepEvent, ...familyHistoryEvents];

  const nextState: CharacterState = {
    ...character,
    age: nextAge,
    year: nextYear,
    stage,
    stats: updatedStats,
    wealth: {
      ...character.wealth,
      quintile: updatedQuintile,
      incomeUSD,
      netWorthUSD,
      worldPct: updatedWorldPct,
    },
    family: updatedFamily,
    householdSize: updatedFamily?.household?.size ?? character.householdSize,
    history: [...(character.history ?? []), ...allEvents],
  };

  return { nextState, events: allEvents };
}

/**
 * Milestone 7 alias for annual step progression
 */
export const stepSimulation = stepYear;

