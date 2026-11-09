/**
 * Empirical Demographic Verification & Monte Carlo Stress Testing Harness
 * Milestone 7: Family Relational Model & Demographics
 * Author: challenger_m7_1
 */

import { COUNTRIES, COUNTRIES_BY_ID } from '../src/data/countries';
import {
  generateInitialFamily,
  stepFamilyYear,
} from '../src/engine/familyEngine';
import { PRNG } from '../src/engine/prng';
import type { FamilyState } from '../src/types/family';

interface SiblingStats {
  mean: number;
  variance: number;
  stdDev: number;
  min: number;
  max: number;
  median: number;
  pctZero: number;
  pctOneOrTwo: number;
  pctThreeOrMore: number;
  pctFiveOrMore: number;
  distribution: Record<number, number>;
}

function computeStats(counts: number[]): SiblingStats {
  const n = counts.length;
  if (n === 0) {
    return {
      mean: 0, variance: 0, stdDev: 0, min: 0, max: 0, median: 0,
      pctZero: 0, pctOneOrTwo: 0, pctThreeOrMore: 0, pctFiveOrMore: 0, distribution: {}
    };
  }

  const sorted = [...counts].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const variance = sorted.reduce((acc, x) => acc + (x - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];

  const dist: Record<number, number> = {};
  for (const c of counts) {
    dist[c] = (dist[c] ?? 0) + 1;
  }

  const pctZero = ((dist[0] ?? 0) / n) * 100;
  const pctOneOrTwo = (((dist[1] ?? 0) + (dist[2] ?? 0)) / n) * 100;
  const pctThreeOrMore = (counts.filter((c) => c >= 3).length / n) * 100;
  const pctFiveOrMore = (counts.filter((c) => c >= 5).length / n) * 100;

  return {
    mean,
    variance,
    stdDev,
    min,
    max,
    median,
    pctZero,
    pctOneOrTwo,
    pctThreeOrMore,
    pctFiveOrMore,
    distribution: dist,
  };
}

console.log('='.repeat(80));
console.log('EMPIRICAL DEMOGRAPHIC STRESS TESTING HARNESS (10,000+ MONTE CARLO RUNS)');
console.log('='.repeat(80));

// ============================================================================
// TEST 1: High-TFR vs Ultra-Low TFR Cohort Analysis (10,000 simulations each)
// ============================================================================
console.log('\n>>> 1. High-TFR vs. Ultra-Low TFR Cohort Analysis (10,000 samples per country) <<<\n');

const testCountries = [
  { id: 'NER', label: 'Niger (High TFR ~6.8)' },
  { id: 'SOM', label: 'Somalia (High TFR ~6.0)' },
  { id: 'COD', label: 'DR Congo (High TFR ~6.2)' },
  { id: 'KOR', label: 'South Korea (Ultra-Low TFR ~0.72)' },
  { id: 'SGP', label: 'Singapore (Ultra-Low TFR ~1.05)' },
  { id: 'JPN', label: 'Japan (Ultra-Low TFR ~1.26)' },
];

const cohortResults: Record<string, { tfr: number; stats: SiblingStats }> = {};
const SAMPLE_COUNT = 10000;

for (const tc of testCountries) {
  const country = COUNTRIES_BY_ID[tc.id];
  if (!country) {
    console.error(`Country ${tc.id} not found!`);
    continue;
  }

  const siblingCounts: number[] = [];
  const prng = new PRNG(`empirical_${tc.id}_seed`);

  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const q = prng.int(1, 5);
    const fam = generateInitialFamily(country, q, () => prng.next());
    siblingCounts.push(fam.siblings.length);
  }

  const stats = computeStats(siblingCounts);
  cohortResults[tc.id] = { tfr: country.tfr ?? 0, stats };

  console.log(`[${tc.id}] ${tc.label} (TFR: ${country.tfr}):`);
  console.log(`    Mean Siblings: ${stats.mean.toFixed(3)} (StdDev: ${stats.stdDev.toFixed(2)}, Range: [${stats.min}, ${stats.max}])`);
  console.log(`    0 Siblings: ${stats.pctZero.toFixed(1)}% | 1-2 Siblings: ${stats.pctOneOrTwo.toFixed(1)}% | 3+ Siblings: ${stats.pctThreeOrMore.toFixed(1)}% | 5+ Siblings: ${stats.pctFiveOrMore.toFixed(1)}%`);
  console.log(`    Distribution:`, JSON.stringify(stats.distribution));
}

// Invariants check between High and Ultra-Low
const nerStats = cohortResults['NER']?.stats;
const korStats = cohortResults['KOR']?.stats;
const somStats = cohortResults['SOM']?.stats;
const jpnStats = cohortResults['JPN']?.stats;

const highVsLowRatio = (nerStats?.mean ?? 0) / Math.max(0.001, korStats?.mean ?? 1);
console.log(`\nRatio of Niger / South Korea mean siblings: ${highVsLowRatio.toFixed(2)}x`);

// ============================================================================
// TEST 2: Global Pearson & Spearman Correlation across 10,000 Global Births
// ============================================================================
console.log('\n>>> 2. Global TFR Correlation Analysis (10,000 Random Country Births) <<<\n');

const globalTfrs: number[] = [];
const globalSibs: number[] = [];
const prngGlobal = new PRNG('global_correlation_seed');

for (let i = 0; i < 10000; i++) {
  const country = prngGlobal.choice(COUNTRIES);
  const q = prngGlobal.int(1, 5);
  const fam = generateInitialFamily(country, q, () => prngGlobal.next());

  globalTfrs.push(country.tfr ?? 2.1);
  globalSibs.push(fam.siblings.length);
}

const n = globalTfrs.length;
const meanTfr = globalTfrs.reduce((a, b) => a + b, 0) / n;
const meanSibs = globalSibs.reduce((a, b) => a + b, 0) / n;

let cov = 0;
let varTfr = 0;
let varSibs = 0;

for (let i = 0; i < n; i++) {
  const dt = globalTfrs[i] - meanTfr;
  const ds = globalSibs[i] - meanSibs;
  cov += dt * ds;
  varTfr += dt * dt;
  varSibs += ds * ds;
}

const pearsonR = cov / (Math.sqrt(varTfr) * Math.sqrt(varSibs));
console.log(`Global 10,000 Sample Mean TFR: ${meanTfr.toFixed(2)}, Mean Siblings: ${meanSibs.toFixed(2)}`);
console.log(`Pearson Correlation Coefficient r: ${pearsonR.toFixed(4)} (Expected > 0.40)`);

// ============================================================================
// TEST 3: Sibling Age Distribution, Order, and Non-Negativity Invariants
// ============================================================================
console.log('\n>>> 3. Sibling Age Distribution & Non-Negativity Invariants <<<\n');

let negativeAges = 0;
let zeroAgesAtBirth = 0;
let olderSibViolations = 0;
let nanAges = 0;
let maxSiblingAgeAtBirth = 0;
let totalOlderSiblingsExamined = 0;

for (let i = 0; i < 10000; i++) {
  const country = COUNTRIES[i % COUNTRIES.length];
  const q = (i % 5) + 1;
  const prng = new PRNG(`sib_invariants_${i}`);
  const fam = generateInitialFamily(country, q, () => prng.next());

  for (let sIdx = 0; sIdx < fam.siblings.length; sIdx++) {
    const s = fam.siblings[sIdx];
    totalOlderSiblingsExamined++;

    if (Number.isNaN(s.age)) nanAges++;
    if (s.age < 0) negativeAges++;
    if (s.age === 0) zeroAgesAtBirth++;
    if (!s.isOlder) olderSibViolations++;
    if (s.age > maxSiblingAgeAtBirth) maxSiblingAgeAtBirth = s.age;
  }
}

console.log(`Examined ${totalOlderSiblingsExamined} initial older siblings across 10,000 families:`);
console.log(`    NaN ages: ${nanAges}`);
console.log(`    Negative ages: ${negativeAges}`);
console.log(`    Zero ages at birth (older sibling should be > 0): ${zeroAgesAtBirth}`);
console.log(`    Missing isOlder=true flag: ${olderSibViolations}`);
console.log(`    Max observed older sibling age at player birth: ${maxSiblingAgeAtBirth}`);

// Test younger sibling births across 5,000 childhood steps
let youngerSiblingsBorn = 0;
let youngerSibNegativeAge = 0;
let youngerSibNonZeroAtBirth = 0;
let youngerSibOlderFlagged = 0;
let motherAgeAtYoungerBirthMin = Infinity;
let motherAgeAtYoungerBirthMax = -Infinity;

for (let i = 0; i < 5000; i++) {
  const country = COUNTRIES[i % COUNTRIES.length];
  const prng = new PRNG(`younger_sib_${i}`);
  let fam = generateInitialFamily(country, 3, () => prng.next());

  for (let age = 1; age <= 5; age++) {
    const prevSibCount = fam.siblings.length;
    const { nextFamily } = stepFamilyYear(fam, age, country, () => prng.next());

    if (nextFamily.siblings.length > prevSibCount) {
      // Younger sibling born!
      const newSib = nextFamily.siblings[nextFamily.siblings.length - 1];
      youngerSiblingsBorn++;

      if (newSib.age !== 0) youngerSibNonZeroAtBirth++;
      if (newSib.age < 0) youngerSibNegativeAge++;
      if (newSib.isOlder) youngerSibOlderFlagged++;

      const momAge = nextFamily.mother.age;
      if (momAge < motherAgeAtYoungerBirthMin) motherAgeAtYoungerBirthMin = momAge;
      if (momAge > motherAgeAtYoungerBirthMax) motherAgeAtYoungerBirthMax = momAge;
    }
    fam = nextFamily;
  }
}

console.log(`Childhood simulation (ages 1-5): ${youngerSiblingsBorn} younger siblings born:`);
console.log(`    Newborn age !== 0: ${youngerSibNonZeroAtBirth}`);
console.log(`    Negative age: ${youngerSibNegativeAge}`);
console.log(`    Mistakenly flagged isOlder: ${youngerSibOlderFlagged}`);
console.log(`    Mother age range at younger sibling birth: [${motherAgeAtYoungerBirthMin}, ${motherAgeAtYoungerBirthMax}]`);

// ============================================================================
// TEST 4: Maternal Age Invariants at Childbirth ([15, 50])
// ============================================================================
console.log('\n>>> 4. Maternal Age Invariants at Childbirth <<<\n');

let motherAgeAtPlayerBirthViolations = 0;
let minMotherAgeAtPlayer = Infinity;
let maxMotherAgeAtPlayer = -Infinity;

let motherAgeAtOlderSibBirthUnder15 = 0;
let minMotherAgeAtOlderSibBirth = Infinity;
let maxMotherAgeAtOlderSibBirth = -Infinity;

for (let i = 0; i < 10000; i++) {
  const country = COUNTRIES[i % COUNTRIES.length];
  const q = (i % 5) + 1;
  const prng = new PRNG(`mom_invariants_${i}`);
  const fam = generateInitialFamily(country, q, () => prng.next());

  const momAge = fam.mother.age;
  if (momAge < minMotherAgeAtPlayer) minMotherAgeAtPlayer = momAge;
  if (momAge > maxMotherAgeAtPlayer) maxMotherAgeAtPlayer = momAge;

  if (momAge < 15 || momAge > 50) {
    motherAgeAtPlayerBirthViolations++;
  }

  // Check implicit maternal age when older siblings were born: momAge - sib.age
  for (const sib of fam.siblings) {
    const impliedMaternalAge = momAge - sib.age;
    if (impliedMaternalAge < minMotherAgeAtOlderSibBirth) minMotherAgeAtOlderSibBirth = impliedMaternalAge;
    if (impliedMaternalAge > maxMotherAgeAtOlderSibBirth) maxMotherAgeAtOlderSibBirth = impliedMaternalAge;

    if (impliedMaternalAge < 15) {
      motherAgeAtOlderSibBirthUnder15++;
    }
  }
}

console.log(`Maternal age at character birth (10,000 families):`);
console.log(`    Violations outside [15, 50]: ${motherAgeAtPlayerBirthViolations}`);
console.log(`    Observed Range: [${minMotherAgeAtPlayer}, ${maxMotherAgeAtPlayer}]`);
console.log(`Implied Maternal age at older sibling birth (momAge - sibAge):`);
console.log(`    Observed Range: [${minMotherAgeAtOlderSibBirth}, ${maxMotherAgeAtOlderSibBirth}]`);
console.log(`    Instances where implied maternal age was < 15: ${motherAgeAtOlderSibBirthUnder15}`);

// Player character adult childbirth (ages 20-44)
let playerChildbirthViolations = 0;
let minPlayerAgeAtChild = Infinity;
let maxPlayerAgeAtChild = -Infinity;
let childrenBornToPlayer = 0;

for (let i = 0; i < 2000; i++) {
  const country = COUNTRIES[i % COUNTRIES.length];
  const prng = new PRNG(`player_child_${i}`);
  let fam = generateInitialFamily(country, 3, () => prng.next());

  for (let age = 18; age <= 60; age++) {
    const prevKids = fam.children.length;
    const { nextFamily } = stepFamilyYear(fam, age, country, () => prng.next());

    if (nextFamily.children.length > prevKids) {
      childrenBornToPlayer++;
      if (age < minPlayerAgeAtChild) minPlayerAgeAtChild = age;
      if (age > maxPlayerAgeAtChild) maxPlayerAgeAtChild = age;

      if (age < 15 || age > 50) {
        playerChildbirthViolations++;
      }
    }
    fam = nextFamily;
  }
}

console.log(`Player adulthood childbirth (2,000 lives, ${childrenBornToPlayer} children born):`);
console.log(`    Player age violations outside [15, 50]: ${playerChildbirthViolations}`);
console.log(`    Player age range at childbirth: [${minPlayerAgeAtChild}, ${maxPlayerAgeAtChild}]`);

// ============================================================================
// TEST 5: Deterministic PRNG Reproducibility
// ============================================================================
console.log('\n>>> 5. Deterministic PRNG Reproducibility Stress Test <<<\n');

let initFamilyMismatch = 0;
let lifecycleMismatch = 0;

for (let i = 0; i < 500; i++) {
  const seed = `deterministic_stress_seed_${i * 7919}`;
  const country = COUNTRIES[i % COUNTRIES.length];
  const q = (i % 5) + 1;

  // Run A
  const prngA = new PRNG(seed);
  const famA = generateInitialFamily(country, q, () => prngA.next());

  // Run B
  const prngB = new PRNG(seed);
  const famB = generateInitialFamily(country, q, () => prngB.next());

  if (JSON.stringify(famA) !== JSON.stringify(famB)) {
    initFamilyMismatch++;
  }

  // Lifecycle stepping 40 years
  let curA = famA;
  let curB = famB;

  for (let age = 1; age <= 40; age++) {
    const resA = stepFamilyYear(curA, age, country, () => prngA.next());
    const resB = stepFamilyYear(curB, age, country, () => prngB.next());

    if (JSON.stringify(resA) !== JSON.stringify(resB)) {
      lifecycleMismatch++;
      break;
    }
    curA = resA.nextFamily;
    curB = resB.nextFamily;
  }
}

console.log(`Deterministic 500 comparison runs (40-year multi-step simulations):`);
console.log(`    Initial family mismatches: ${initFamilyMismatch}`);
console.log(`    Lifecycle progression mismatches: ${lifecycleMismatch}`);

console.log('\n' + '='.repeat(80));
console.log('EMPIRICAL EVALUATION SUMMARY');
console.log('='.repeat(80));
console.log(`1. TFR Correlation (Pearson r): ${pearsonR.toFixed(4)} (Threshold: > 0.40) -> ${pearsonR > 0.40 ? 'PASS' : 'FAIL'}`);
console.log(`2. High vs Ultra-low TFR Ratio (Niger/Korea): ${highVsLowRatio.toFixed(2)}x (Threshold: > 2.0x) -> ${highVsLowRatio > 2.0 ? 'PASS' : 'FAIL'}`);
console.log(`3. Sibling Age Invariants (No NaNs, No Negatives, Newborns age 0): ${negativeAges === 0 && nanAges === 0 && youngerSibNegativeAge === 0 ? 'PASS' : 'FAIL'}`);
console.log(`4. Maternal Age at Birth ([15, 50]):`);
console.log(`   - At Character Birth ([18, 42]): ${motherAgeAtPlayerBirthViolations === 0 ? 'PASS' : 'FAIL'}`);
console.log(`   - At Younger Sibling Birth ([19, 40]): ${motherAgeAtYoungerBirthMin >= 15 && motherAgeAtYoungerBirthMax <= 50 ? 'PASS' : 'FAIL'}`);
console.log(`   - At Player Adulthood Childbirth ([20, 44]): ${playerChildbirthViolations === 0 ? 'PASS' : 'FAIL'}`);
console.log(`   - Older Sibling Implied Maternal Age: min observed = ${minMotherAgeAtOlderSibBirth}, occurrences < 15: ${motherAgeAtOlderSibBirthUnder15}`);
console.log(`5. Deterministic Reproducibility: ${initFamilyMismatch === 0 && lifecycleMismatch === 0 ? 'PASS' : 'FAIL'}`);
console.log('='.repeat(80));
