/**
 * Dynamic Family Relational Model & Demographic Lifecycle Engine
 * Milestone 7: Calibrated family generation, TFR-based siblings, Gompertz parental mortality & housing
 */

import type { CountryDemographics } from '../types/demographics';
import type {
  FamilyState,
  ParentMember,
  SiblingMember,
  ChildMember,
  HousingState,
  HouseholdInfo,
  FamilyStepResult,
  Gender,
} from '../types/family';
import { COUNTRIES, COUNTRIES_BY_ID } from '../data/countries';
import { JOBS } from '../data/jobs';
import { CAUSES } from '../data/causes';
import { lifeTable } from './lifeTable';
import { PRNG, defaultPRNG } from './prng';
import { generateCharacterName } from './simulationCore';

// ============================================================================
// Empirical Demographic Constants
// ============================================================================

/**
 * National home ownership rates (empirical data from 1in8b / World Bank / Eurostat / OECD)
 */
export const HOME_OWN_C: Record<string, number> = {
  RUS: 0.89,
  CHN: 0.89,
  POL: 0.87,
  IND: 0.87,
  BRA: 0.70,
  USA: 0.65,
  GBR: 0.64,
  FRA: 0.63,
  JPN: 0.61,
  DEU: 0.47,
  NGA: 0.65,
  COD: 0.60,
  IDN: 0.84,
  MEX: 0.68,
  ITA: 0.74,
  ESP: 0.76,
  CAN: 0.66,
  AUS: 0.66,
  TUR: 0.58,
  KOR: 0.57,
};

/**
 * Regional baseline absent father / single mother probabilities
 */
export const REGIONAL_ABSENT_FATHER_RATE: Record<string, number> = {
  ssa: 0.30,
  lac: 0.26,
  na: 0.22,
  eca: 0.14,
  eap: 0.09,
  sa: 0.05,
  mena: 0.04,
  hi: 0.18,
};

/**
 * Helper to adapt either function () => number or PRNG instance
 */
function toPRNG(prng?: (() => number) | PRNG): PRNG {
  if (!prng) return defaultPRNG;
  if (prng instanceof PRNG) return prng;
  const adapter = Object.create(PRNG.prototype);
  adapter.next = prng;
  adapter.float = (min: number = 0, max: number = 1) => min + (max - min) * prng();
  adapter.int = (min: number, max: number) => {
    const l = Math.ceil(min);
    const h = Math.floor(max);
    return Math.floor(l + (h - l + 1) * prng());
  };
  adapter.choice = <T>(arr: T[]): T => arr[Math.floor(prng() * arr.length)];
  adapter.boolean = (prob: number = 0.5) => prng() < prob;
  adapter.weightedPick = (weights: Record<string, number>): string => {
    let total = 0;
    for (const k in weights) total += weights[k];
    let threshold = prng() * total;
    for (const k in weights) {
      threshold -= weights[k];
      if (threshold <= 0) return k;
    }
    return Object.keys(weights)[0];
  };
  return adapter;
}

/**
 * Resolves a CountryDemographics object from ID or object
 */
function resolveCountry(countryOrId: string | CountryDemographics): CountryDemographics {
  if (typeof countryOrId === 'string') {
    return COUNTRIES_BY_ID[countryOrId] ?? COUNTRIES[0];
  }
  return countryOrId;
}

// ============================================================================
// Parental Job Assignment Matrix
// ============================================================================

/**
 * Assigns an authentic occupation based on sex, age, wealth quintile, and country economy
 */
export function pickParentJob(
  sex: Gender,
  age: number,
  quintile: number,
  country: CountryDemographics,
  rng: PRNG
): { id: string; ru: string } {
  // Elder retirement check
  if (age >= 65 && rng.boolean(0.7)) {
    return { id: 'retired', ru: sex === 'F' ? 'Пенсионерка' : 'Пенсионер' };
  }

  // Female labor force participation check
  if (sex === 'F') {
    // Patriarchal or low female employment regions have high homemaker rate
    const isMenaOrSa = country.p === 'mena' || country.p === 'sa';
    const homemakerChance = isMenaOrSa
      ? (quintile <= 3 ? 0.65 : 0.40)
      : (quintile === 1 ? 0.35 : quintile === 5 ? 0.20 : 0.15);

    if (rng.boolean(homemakerChance)) {
      return { id: 'homemaker', ru: 'Домохозяйка' };
    }
  }

  // Filter jobs by gender ratio and wealth quintile suitability
  const allJobs = Object.values(JOBS);
  const eligible = allJobs.filter((job) => {
    // Gender affinity
    if (sex === 'F' && job.femaleRatio < 0.2) return false;
    if (sex === 'M' && job.maleRatio < 0.2) return false;

    // Quintile tier matching
    const qMid = (quintile - 0.5) / 5.0; // 0.1, 0.3, 0.5, 0.7, 0.9
    const inRange =
      qMid >= job.incomeQuantileLow - 0.15 && qMid <= job.incomeQuantileHigh + 0.15;
    return inRange;
  });

  if (eligible.length > 0) {
    const chosen = rng.choice(eligible);
    return { id: chosen.id, ru: chosen.ru };
  }

  // Fallback defaults by quintile
  if (quintile <= 1) {
    return sex === 'F'
      ? { id: 'cleaner', ru: 'Уборщица / работница сферы услуг' }
      : { id: 'laborer', ru: 'Разнорабочий / подсобный рабочий' };
  }
  if (quintile <= 2) {
    return sex === 'F'
      ? { id: 'cashier', ru: 'Кассир / продавец' }
      : { id: 'driver', ru: 'Водитель / экспедитор' };
  }
  if (quintile <= 3) {
    return sex === 'F'
      ? { id: 'nurse', ru: 'Медицинская сестра / фельдшер' }
      : { id: 'technician', ru: 'Слесарь-механик / техник' };
  }
  if (quintile <= 4) {
    return sex === 'F'
      ? { id: 'teacher', ru: 'Учитель / преподаватель' }
      : { id: 'engineer', ru: 'Инженер / специалист' };
  }
  return sex === 'F'
    ? { id: 'manager', ru: 'Руководитель подразделения / врач' }
    : { id: 'director', ru: 'Генеральный директор / предприниматель' };
}

// ============================================================================
// Initial Family Generation
// ============================================================================

/**
 * Generates an authentic family relational model at character birth (Age 0)
 */
export function generateInitialFamily(
  countryOrId: string | CountryDemographics,
  wealthQuintile: number,
  prngInput?: (() => number) | PRNG
): FamilyState {
  const country = resolveCountry(countryOrId);
  const rng = toPRNG(prngInput);

  // 1. Mother age: sampled from maternal birth distribution, clamped [18, 42]
  // Box-Muller normal approximation around mean 27, stdev 4.2
  const u1 = Math.max(1e-7, rng.next());
  const u2 = rng.next();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  const momAge = Math.max(18, Math.min(42, Math.round(27 + z0 * 4.2)));

  // Mother occupation
  const momJob = pickParentJob('F', momAge, wealthQuintile, country, rng);
  const mother: ParentMember = {
    name: generateCharacterName(country, 'F', rng),
    age: momAge,
    job: momJob.id,
    jobTitleRu: momJob.ru,
    isAlive: true,
    alive: true,
    isAbsent: false,
    role: 'mother',
    sex: 'F',
    bond: rng.int(75, 95),
    bondLevel: 'warm',
  };

  // 2. Father age: Mother + 2-5 yrs (developed) or 3-7 yrs (developing)
  const dadAgeGap = country.ppp > 20000 ? rng.int(2, 5) : rng.int(3, 7);
  const dadAge = momAge + dadAgeGap;

  // Absent father probability (10-35% based on regional demographics and quintile)
  const baseAbsentRate = REGIONAL_ABSENT_FATHER_RATE[country.p] ?? 0.14;
  const quintileMod =
    wealthQuintile <= 1 ? 1.35 : wealthQuintile <= 2 ? 1.15 : wealthQuintile >= 4 ? 0.75 : 1.0;
  const isAbsent = rng.boolean(Math.min(0.40, Math.max(0.04, baseAbsentRate * quintileMod)));

  let dadJob = { id: 'absent', ru: 'Отсутствует / ушел из семьи' };
  if (!isAbsent) {
    dadJob = pickParentJob('M', dadAge, wealthQuintile, country, rng);
  }

  const father: ParentMember = {
    name: generateCharacterName(country, 'M', rng),
    age: dadAge,
    job: dadJob.id,
    jobTitleRu: dadJob.ru,
    isAlive: true, // alive even if absent unless died later
    alive: true,
    isAbsent,
    role: 'father',
    sex: 'M',
    bond: isAbsent ? rng.int(5, 25) : rng.int(65, 90),
    bondLevel: isAbsent ? 'estranged' : 'warm',
  };

  // 3. Siblings: derived from country Total Fertility Rate (TFR - 1)
  // Poisson sample around max(0, tfr - 1)
  const lambda = Math.max(0, (country.tfr ?? 2.1) - 1.0);
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1.0;
  do {
    k++;
    p *= Math.max(1e-7, rng.next());
  } while (p > L && k < 12);
  const targetSiblings = Math.max(0, Math.min(8, k - 1));

  // Distribute into older siblings born before player
  const olderCount =
    targetSiblings > 0 ? rng.int(0, Math.ceil(targetSiblings * 0.75)) : 0;

  const siblings: SiblingMember[] = [];
  for (let i = 0; i < olderCount; i++) {
    const sibSex: Gender = rng.boolean(0.5) ? 'M' : 'F';
    const sibAge = 1 + i * 2 + rng.int(0, 2);
    siblings.push({
      id: `sib_${i + 1}`,
      name: generateCharacterName(country, sibSex, rng),
      age: sibAge,
      sex: sibSex,
      isOlder: true,
      isAlive: true,
      alive: true,
      atHome: true,
      birthOrder: 'older',
      bond: rng.int(60, 90),
      bondLevel: 'normal',
    });
  }

  // 4. Housing & Settlement status
  const baseOwnRate = HOME_OWN_C[country.id] ?? 0.68;
  const isUrban = country.urb > 50;
  const ownProb = isUrban
    ? Math.max(0.2, baseOwnRate * 0.85)
    : Math.min(0.96, baseOwnRate * 1.15);
  const isOwned = rng.boolean(ownProb);

  let houseType = 'apartment';
  let houseTypeRu = 'Квартира';

  if (!isUrban) {
    if (wealthQuintile <= 1 && country.ppp < 5000) {
      houseType = 'hut';
      houseTypeRu = 'Сельская хижина';
    } else if (wealthQuintile <= 2) {
      houseType = 'cottage';
      houseTypeRu = 'Деревенский дом';
    } else {
      houseType = 'house';
      houseTypeRu = 'Частный дом';
    }
  } else {
    if (wealthQuintile <= 1) {
      houseType = 'flat';
      houseTypeRu = 'Комната / муниципальное жилье';
    } else if (wealthQuintile <= 3) {
      houseType = 'flat';
      houseTypeRu = 'Городская квартира';
    } else if (wealthQuintile === 4) {
      houseType = rng.boolean(0.4) ? 'house' : 'apartment';
      houseTypeRu = houseType === 'house' ? 'Коттедж в пригороде' : 'Современная квартира';
    } else {
      houseType = 'villa';
      houseTypeRu = 'Элитная недвижимость / пентхаус';
    }
  }

  const cityName = isUrban ? `${country.ru} (Город)` : `${country.ru} (Провинция)`;
  const livingWithRu = isAbsent
    ? olderCount > 0
      ? `С матерью и ${olderCount} ${olderCount === 1 ? 'родственником' : 'родственниками'}`
      : 'С матерью-одиночкой'
    : olderCount > 0
    ? `С обоими родителями и ${olderCount} ${olderCount === 1 ? 'родственником' : 'родственниками'}`
    : 'С обоими родителями';

  const housing: HousingState = {
    type: houseType,
    typeRu: houseTypeRu,
    ownership: isOwned,
    city: cityName,
    livingWith: livingWithRu,
    tenure: isOwned ? 'owned' : 'rented',
    tenureRu: isOwned ? 'Собственность' : 'Аренда',
    setting: isUrban ? 'urban_city' : 'village',
    settingRu: isUrban ? 'Город' : 'Сельская местность',
    electricity: isUrban || country.ppp > 7000 || rng.boolean(0.7),
    runningWater: isUrban || country.ppp > 9000 || rng.boolean(0.6),
    livingWithDescriptionRu: livingWithRu,
  };

  const householdSize = 1 + 1 + (isAbsent ? 0 : 1) + olderCount;
  const household: HouseholdInfo = {
    size: householdSize,
    membersLivingTogether: {
      mother: true,
      father: !isAbsent,
      siblingsCount: olderCount,
      partner: false,
      childrenCount: 0,
      grandparentsCount: 0,
    },
  };

  return {
    mother,
    father,
    siblings,
    partner: null,
    children: [],
    housing,
    household,
  };
}

// ============================================================================
// Yearly Family Lifecycle Stepping
// ============================================================================

/**
 * Advances the family relational model by 1 year.
 * Handles dynamic mortality (Gompertz qx), sibling departure (18-24),
 * economic shocks on early parent loss, and player adult milestones (romance, children).
 */
export function stepFamilyYear(
  currentFamily: FamilyState,
  characterAge: number,
  countryOrId: string | CountryDemographics,
  prngInput?: (() => number) | PRNG
): FamilyStepResult {
  const country = resolveCountry(countryOrId);
  const rng = toPRNG(prngInput);
  const familyEvents: string[] = [];

  // Deep clone to preserve immutability
  const nextFamily: FamilyState = {
    mother: { ...currentFamily.mother },
    father: { ...currentFamily.father },
    siblings: currentFamily.siblings.map((s) => ({ ...s })),
    partner: currentFamily.partner ? { ...currentFamily.partner } : null,
    children: currentFamily.children.map((c) => ({ ...c })),
    housing: { ...currentFamily.housing },
    household: currentFamily.household
      ? {
          ...currentFamily.household,
          membersLivingTogether: { ...currentFamily.household.membersLivingTogether },
        }
      : undefined,
  };

  const ltFemale = lifeTable(country, 'F');
  const ltMale = lifeTable(country, 'M');

  // 1. MOTHER AGING & GOMPERTZ MORTALITY
  if (nextFamily.mother.isAlive) {
    nextFamily.mother.age += 1;
    const momMortalityRate = ltFemale.q[Math.min(110, nextFamily.mother.age)] ?? 0.01;
    if (rng.next() < momMortalityRate) {
      nextFamily.mother.isAlive = false;
      nextFamily.mother.alive = false;
      nextFamily.mother.diedAtAge = nextFamily.mother.age;
      const cause = nextFamily.mother.age < 50 ? CAUSES.can.ru : CAUSES.ihd.ru;
      nextFamily.mother.deathCause = cause;
      familyEvents.push(
        `Мама ушла из жизни в возрасте ${nextFamily.mother.age} лет (${cause}).`
      );
      if (characterAge < 15) {
        familyEvents.push('Потеря матери в юном возрасте стала тяжелейшим потрясением для семьи.');
      }
    }
  }

  // 2. FATHER AGING & GOMPERTZ MORTALITY
  if (nextFamily.father.isAlive && !nextFamily.father.isAbsent) {
    nextFamily.father.age += 1;
    const dadMortalityRate = ltMale.q[Math.min(110, nextFamily.father.age)] ?? 0.01;
    if (rng.next() < dadMortalityRate) {
      nextFamily.father.isAlive = false;
      nextFamily.father.alive = false;
      nextFamily.father.diedAtAge = nextFamily.father.age;
      const cause = nextFamily.father.age < 55 ? CAUSES.inj.ru : CAUSES.ihd.ru;
      nextFamily.father.deathCause = cause;
      familyEvents.push(
        `Отец ушел из жизни в возрасте ${nextFamily.father.age} лет (${cause}).`
      );
      if (characterAge < 15) {
        familyEvents.push(
          'Смерть отца нанесла сокрушительный экономический удар по благосостоянию семьи.'
        );
      }
    }
  }

  // 3. SIBLINGS AGING, MORTALITY & DEPARTURE
  for (const sib of nextFamily.siblings) {
    if (!sib.isAlive) continue;
    sib.age += 1;

    // Sibling Mortality check via life table
    const lt = sib.sex === 'F' ? ltFemale : ltMale;
    const sibMortalityRate = lt.q[Math.min(110, sib.age)] ?? 0.005;
    if (rng.next() < sibMortalityRate) {
      sib.isAlive = false;
      sib.alive = false;
      sib.atHome = false;
      sib.diedAtAge = sib.age;
      const cause = sib.age < 5 ? CAUSES.lri.ru : CAUSES.inj.ru;
      sib.deathCause = cause;
      familyEvents.push(
        sib.age < 5
          ? `Младший(ая) брат/сестра ${sib.name} скончался(лась) в раннем детстве (${sib.age} лет).`
          : `Брат/сестра ${sib.name} ушел(ла) из жизни в возрасте ${sib.age} лет.`
      );
      continue;
    }

    // Sibling Departure from Home (Ages 18-24)
    if (sib.atHome && sib.age >= 18) {
      // Departure probability scales with age: 18 -> 15%, 21 -> 40%, 24 -> 75%
      const leaveProb = Math.min(0.85, 0.15 + (sib.age - 18) * 0.12);
      if (rng.next() < leaveProb) {
        sib.atHome = false;
        sib.leftHomeAge = sib.age;
        familyEvents.push(
          `${sib.name} (${sib.sex === 'M' ? 'брат' : 'сестра'}) вырос(ла) и начал(а) самостоятельную жизнь, съехав из дома.`
        );
      }
    }
  }

  // 4. POTENTIAL YOUNGER SIBLING BIRTH (when player is young, ages 1-5, and mother <= 40)
  if (
    characterAge >= 1 &&
    characterAge <= 5 &&
    nextFamily.mother.isAlive &&
    nextFamily.mother.age <= 40 &&
    nextFamily.siblings.length < Math.max(1, Math.round(country.tfr + 1))
  ) {
    const annualBirthChance = (country.tfr ?? 2.1) * 0.07;
    if (rng.next() < annualBirthChance) {
      const newSex: Gender = rng.boolean(0.5) ? 'M' : 'F';
      const newSib: SiblingMember = {
        id: `sib_young_${characterAge}_${Date.now() % 10000}`,
        name: generateCharacterName(country, newSex, rng),
        age: 0,
        sex: newSex,
        isOlder: false,
        isAlive: true,
        alive: true,
        atHome: true,
        birthOrder: 'younger',
        bond: 80,
        bondLevel: 'warm',
      };
      nextFamily.siblings.push(newSib);
      familyEvents.push(
        `В семье пополнение! Родился(лась) ${newSex === 'M' ? 'младший брат' : 'младшая сестра'} ${newSib.name}.`
      );
    }
  }

  // 5. ADULTHOOD: ROMANCE & PARTNER PROGRESSION
  if (characterAge >= 18) {
    if (!nextFamily.partner) {
      // Chance of finding a romantic partner between 18 and 38
      const findPartnerChance = characterAge <= 28 ? 0.22 : characterAge <= 38 ? 0.14 : 0.06;
      if (rng.next() < findPartnerChance) {
        const partnerSex: Gender = rng.boolean(0.5) ? 'M' : 'F';
        const partnerAge = Math.max(18, characterAge + rng.int(-2, 3));
        const partnerJob = pickParentJob(partnerSex, partnerAge, 3, country, rng);
        nextFamily.partner = {
          name: generateCharacterName(country, partnerSex, rng),
          age: partnerAge,
          job: partnerJob.id,
          professionRu: partnerJob.ru,
          isMarried: false,
          isAlive: true,
          alive: true,
          relationshipType: 'dating',
          anniversaryAge: characterAge,
          isCohabiting: characterAge >= 22,
          bond: rng.int(70, 95),
          bondLevel: 'warm',
        };
        familyEvents.push(`Вы встретили свою любовь — ${nextFamily.partner.name}.`);
      }
    } else if (nextFamily.partner.isAlive) {
      // Partner ages
      nextFamily.partner.age += 1;

      // Potential marriage if dating >= 2 years and age >= 20
      if (
        !nextFamily.partner.isMarried &&
        characterAge >= 20 &&
        characterAge - (nextFamily.partner.anniversaryAge ?? characterAge) >= 2
      ) {
        if (rng.next() < 0.35) {
          nextFamily.partner.isMarried = true;
          nextFamily.partner.marriageAge = characterAge;
          nextFamily.partner.relationshipType = 'married';
          familyEvents.push(
            `Вы сыграли свадьбу с ${nextFamily.partner.name}! Семейный статус: В браке 💍.`
          );
        }
      }

      // Partner mortality check
      const ptLt = nextFamily.partner.sex === 'M' ? ltMale : ltFemale;
      const ptMortality = ptLt.q[Math.min(110, nextFamily.partner.age)] ?? 0.01;
      if (rng.next() < ptMortality) {
        nextFamily.partner.isAlive = false;
        nextFamily.partner.alive = false;
        nextFamily.partner.diedAtAge = nextFamily.partner.age;
        familyEvents.push(
          `Ваш(а) партнер(ша) ${nextFamily.partner.name} ушел(ла) из жизни в возрасте ${nextFamily.partner.age} лет.`
        );
      }
    }
  }

  // 6. EXISTING CHILDREN AGING & LEAVING HOME
  for (const child of nextFamily.children) {
    if (!child.isAlive) continue;
    child.age += 1;
    if (child.atHome && child.age >= 18 && rng.next() < 0.25) {
      child.atHome = false;
      familyEvents.push(
        `Ваш(а) ${child.sex === 'M' ? 'сын' : 'дочь'} ${child.name} вырос(ла) и начал(а) жить отдельно.`
      );
    }
  }

  // 7. ADULTHOOD: CHILDBIRTH (newborn is born at age 0)
  if (
    characterAge >= 20 &&
    characterAge <= 44 &&
    nextFamily.partner &&
    nextFamily.partner.isMarried &&
    nextFamily.partner.isAlive &&
    nextFamily.children.length < Math.max(1, Math.round(country.tfr ?? 2.1))
  ) {
    const childChance = characterAge <= 30 ? 0.30 : characterAge <= 38 ? 0.20 : 0.10;
    if (rng.next() < childChance) {
      const childSex: Gender = rng.boolean(0.5) ? 'M' : 'F';
      const child: ChildMember = {
        id: `child_${nextFamily.children.length + 1}`,
        name: generateCharacterName(country, childSex, rng),
        age: 0,
        sex: childSex,
        isAlive: true,
        alive: true,
        atHome: true,
        playerAgeAtBirth: characterAge,
      };
      nextFamily.children.push(child);
      familyEvents.push(
        `У вас родился ребенок — ${childSex === 'M' ? 'сын' : 'дочь'} ${child.name}! 🍼`
      );
    }
  }

  // 8. DYNAMIC LIVING WITH & HOUSEHOLD SIZE CALCULATION
  const livingSiblingsAtHome = nextFamily.siblings.filter((s) => s.isAlive && s.atHome);
  const livingChildrenAtHome = nextFamily.children.filter((c) => c.isAlive && c.atHome);

  let householdSize = 1; // player
  let livingWithDescription = '';

  if (characterAge < 20) {
    if (nextFamily.mother.isAlive) householdSize++;
    if (nextFamily.father.isAlive && !nextFamily.father.isAbsent) householdSize++;
    householdSize += livingSiblingsAtHome.length;

    const parentsPart =
      nextFamily.mother.isAlive && nextFamily.father.isAlive && !nextFamily.father.isAbsent
        ? 'С обоими родителями'
        : nextFamily.mother.isAlive
        ? 'С матерью'
        : nextFamily.father.isAlive && !nextFamily.father.isAbsent
        ? 'С отцом'
        : 'Самостоятельно';

    livingWithDescription =
      livingSiblingsAtHome.length > 0
        ? `${parentsPart} и ${livingSiblingsAtHome.length} ${
            livingSiblingsAtHome.length === 1 ? 'родственником' : 'родственниками'
          }`
        : parentsPart;
  } else {
    // Independent adulthood
    if (nextFamily.partner && nextFamily.partner.isAlive && nextFamily.partner.isCohabiting) {
      householdSize++;
      livingWithDescription = nextFamily.partner.isMarried
        ? `В браке с ${nextFamily.partner.name}`
        : `С партнером (${nextFamily.partner.name})`;
    } else {
      livingWithDescription = 'Самостоятельно (один)';
    }

    if (livingChildrenAtHome.length > 0) {
      householdSize += livingChildrenAtHome.length;
      livingWithDescription += ` и ${livingChildrenAtHome.length} ${
        livingChildrenAtHome.length === 1 ? 'ребенком' : 'детьми'
      }`;
    }
  }

  nextFamily.housing.livingWith = livingWithDescription;
  nextFamily.housing.livingWithDescriptionRu = livingWithDescription;

  nextFamily.household = {
    size: householdSize,
    membersLivingTogether: {
      mother: characterAge < 20 && nextFamily.mother.isAlive,
      father: characterAge < 20 && nextFamily.father.isAlive && !nextFamily.father.isAbsent,
      siblingsCount: characterAge < 20 ? livingSiblingsAtHome.length : 0,
      partner:
        characterAge >= 20 &&
        !!(nextFamily.partner && nextFamily.partner.isAlive && nextFamily.partner.isCohabiting),
      childrenCount: livingChildrenAtHome.length,
      grandparentsCount: 0,
    },
  };

  return { nextFamily, familyEvents };
}
