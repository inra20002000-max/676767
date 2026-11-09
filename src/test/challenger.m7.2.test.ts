/**
 * Adversarial Verification & Empirical Stress Test Suite: Milestone 7
 * 1,000 Full Life Courses (100,000 Annual Steps), Gompertz Parental Mortality Dynamics,
 * Deceased State Permanence, Partner & Child Lifecycle, Edge Cases, Memory & UI Safety
 * Author: challenger_m7_2
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import {
  generateBirth,
  stepYear,
} from '../engine/simulationCore';
import {
  generateInitialFamily,
  stepFamilyYear,
} from '../engine/familyEngine';
import {
  contextToSceneModel,
  renderPixelScene,
  pxPeopleLay,
  pxScene,
  pxSceneLayers,
} from '../engine/pixelArt/renderer';
import { PX, PixelBuffer, pxPalette } from '../engine/pixelArt/palette';
import { pxFuneral } from '../engine/pixelArt/moments';
import { FamilyCard } from '../components/FamilyCard';
import { COUNTRIES } from '../data/countries';
import { lifeTable } from '../engine/lifeTable';
import { PRNG } from '../engine/prng';
import type { CharacterState, FocusType } from '../types/simulation';
import type { FamilyState } from '../types/family';
import type { SceneContext, ScenePerson } from '../types/pixelArt';

/**
 * Creates a mock HTMLCanvasElement and 2D rendering context for headless testing.
 */
function createMockCanvas(width: number = PX.W, height: number = PX.H) {
  const canvas = {
    width,
    height,
  } as HTMLCanvasElement;

  let putImageDataCalls = 0;
  let lastImageData: ImageData | null = null;

  const ctx = {
    canvas,
    createImageData: (w: number, h: number) => ({
      data: new Uint8ClampedArray(w * h * 4),
      width: w,
      height: h,
    }),
    putImageData: (imgData: ImageData) => {
      putImageDataCalls++;
      lastImageData = imgData;
    },
    clearRect: () => {},
    drawImage: () => {},
    fillRect: () => {},
    getImageData: (_sx: number, _sy: number, sw: number, sh: number) => ({
      data: new Uint8ClampedArray(sw * sh * 4),
      width: sw,
      height: sh,
    }),
  } as unknown as CanvasRenderingContext2D;

  return {
    canvas,
    ctx,
    getPutCalls: () => putImageDataCalls,
    getLastImageData: () => lastImageData,
  };
}

/**
 * Replicates the exact household member mapping used in LifeDashboard.tsx
 */
function mapHouseholdMembersForScene(character: CharacterState): ScenePerson[] {
  if (!character.family) {
    return [{ role: 'me', age: character.age, sex: character.sex }];
  }

  const members: ScenePerson[] = [
    { role: 'me', age: character.age, sex: character.sex },
  ];

  if (character.age < 20) {
    if (character.family.mother.isAlive) {
      members.push({ role: 'par', age: character.family.mother.age, sex: 'F' });
    }
    if (character.family.father.isAlive && !character.family.father.isAbsent) {
      members.push({ role: 'par', age: character.family.father.age, sex: 'M' });
    }
    for (const sib of character.family.siblings) {
      if (sib.isAlive && sib.atHome) {
        members.push({ role: 'sib', age: sib.age, sex: sib.sex });
      }
    }
  } else {
    if (
      character.family.partner &&
      character.family.partner.isAlive &&
      character.family.partner.isCohabiting
    ) {
      members.push({
        role: 'pt',
        age: character.family.partner.age,
        sex: character.family.partner.sex || (character.sex === 'M' ? 'F' : 'M'),
      });
    }
    for (const child of character.family.children) {
      if (child.isAlive && child.atHome) {
        members.push({ role: 'kid', age: child.age, sex: child.sex });
      }
    }
  }

  return members;
}

/**
 * Validates a PixelBuffer for NaN, undefined, or out-of-bounds RGB coordinates.
 * Optimized for performance: checks all pixels in pure JS without creating millions of test runner assertion frames.
 */
function assertPixelBufferPurity(buf: PixelBuffer, description: string): void {
  expect(buf.w, `${description} width`).toBe(PX.W);
  expect(buf.h, `${description} height`).toBe(PX.H);
  expect(buf.d.length, `${description} buffer length`).toBe(PX.W * PX.H);

  let invalidCount = 0;
  let firstError = '';
  for (let i = 0; i < buf.d.length; i++) {
    const px = buf.d[i];
    if (px !== null && px !== undefined) {
      if (!Array.isArray(px) || px.length !== 3) {
        invalidCount++;
        if (!firstError) firstError = `Pixel ${i} not RGB array`;
        continue;
      }
      const [r, g, b] = px;
      if (
        !Number.isFinite(r) ||
        !Number.isFinite(g) ||
        !Number.isFinite(b) ||
        Number.isNaN(r) ||
        Number.isNaN(g) ||
        Number.isNaN(b) ||
        r < 0 ||
        r > 255 ||
        g < 0 ||
        g > 255 ||
        b < 0 ||
        b > 255
      ) {
        invalidCount++;
        if (!firstError) firstError = `Pixel ${i} invalid RGB [${r},${g},${b}]`;
      }
    }
  }
  expect(invalidCount, `${description}: ${firstError}`).toBe(0);
}

/**
 * Cycle detection to ensure zero circular object references.
 */
function hasCircularReference(obj: any, seen = new WeakSet()): boolean {
  if (obj && typeof obj === 'object') {
    if (seen.has(obj)) return true;
    seen.add(obj);
    for (const key of Object.keys(obj)) {
      if (hasCircularReference(obj[key], seen)) return true;
    }
  }
  return false;
}

describe('Challenger M7-2: Empirical Family Engine Multi-Decade Stress Suite', () => {
  const FOCUS_CYCLES: FocusType[] = [
    'health',
    'study',
    'work',
    'family',
    'sports',
    'rest',
    'vice',
  ];

  // ==========================================================================
  // ADVERSARIAL TEST 1: 1,000 MULTI-DECADE LIFE COURSES (100,000 ANNUAL STEPS)
  // ==========================================================================
  describe('1. 1,000 Multi-Decade Life Courses (100,000 Annual Steps) Empirical Stress Test', () => {
    it('executes 1,000 full life courses (100,000 annual steps): verifies Gompertz mortality monotonicity, deceased state permanence, partner/child dynamics, and memory stability', () => {
      const TOTAL_LIVES = 1000;
      const TARGET_YEARS_PER_LIFE = 100;
      const EXPECTED_TOTAL_STEPS = TOTAL_LIVES * TARGET_YEARS_PER_LIFE;

      let totalAnnualStepsSimulated = 0;
      let circularReferenceCount = 0;
      let deceasedResurrectionCount = 0;
      let deceasedNameMutationCount = 0;
      let deceasedJobMutationCount = 0;
      let mortalityNonMonotonicViolations = 0;

      let motherDeaths = 0;
      let fatherDeaths = 0;
      let partnerDeaths = 0;
      let partnerFormations = 0;
      let marriages = 0;
      let totalChildrenBorn = 0;
      let childrenMovedOut = 0;
      let maxParentAgeObserved = 0;

      const motherDeathAges: number[] = [];
      const fatherDeathAges: number[] = [];

      const proc = (globalThis as unknown as { process?: { memoryUsage: () => { heapUsed: number } } }).process;
      const initialHeap = proc ? proc.memoryUsage().heapUsed : 0;

      for (let lifeIdx = 0; lifeIdx < TOTAL_LIVES; lifeIdx++) {
        const country = COUNTRIES[lifeIdx % COUNTRIES.length];
        const sex = lifeIdx % 2 === 0 ? 'M' : 'F';
        const seedValue = `emp_life_${lifeIdx}_${country.id}_${sex}`;
        const prng = new PRNG(seedValue);

        // Step 0: Generate initial character & family
        let character = generateBirth({ countryId: country.id, sex, seed: seedValue }, prng);
        expect(character.family).toBeDefined();
        expect(character.family).not.toBeNull();

        // Track deceased parent states across character lifespan
        let motherDeathSnapshot = { name: '', job: '', diedAtAge: -1 };
        let fatherDeathSnapshot = { name: '', job: '', diedAtAge: -1 };

        const ltF = lifeTable(country, 'F');
        const ltM = lifeTable(country, 'M');

        // Verify Gompertz-Makeham mortality risk monotonicity across adult ages [18, 110]
        for (let a = 18; a < 110; a++) {
          if (ltF.q[a + 1] < ltF.q[a]) mortalityNonMonotonicViolations++;
          if (ltM.q[a + 1] < ltM.q[a]) mortalityNonMonotonicViolations++;
        }

        // Run multi-decade annual progression: 100 steps (character age 1 to 100)
        for (let yearStep = 1; yearStep <= TARGET_YEARS_PER_LIFE; yearStep++) {
          // Advance family directly via stepFamilyYear to test the engine without early character death cutoffs
          const prevFam = character.family!;
          const prevMotherAge = prevFam.mother.age;
          const prevFatherAge = prevFam.father.age;

          const { nextFamily } = stepFamilyYear(
            prevFam,
            yearStep,
            country,
            () => prng.next()
          );

          totalAnnualStepsSimulated++;
          character.family = nextFamily;
          character.age = yearStep;

          // 1. Check for circular object references
          if (hasCircularReference(nextFamily)) {
            circularReferenceCount++;
          }

          // 2. Parental mortality & deceased state permanence checks
          // Mother
          if (!prevFam.mother.isAlive) {
            // Already dead previously
            if (nextFamily.mother.isAlive) {
              deceasedResurrectionCount++;
            }
            if (nextFamily.mother.name !== motherDeathSnapshot.name) {
              deceasedNameMutationCount++;
            }
            if (nextFamily.mother.job !== motherDeathSnapshot.job) {
              deceasedJobMutationCount++;
            }
          } else if (!nextFamily.mother.isAlive) {
            // Just died this year
            motherDeaths++;
            motherDeathAges.push(nextFamily.mother.age);
            motherDeathSnapshot = {
              name: nextFamily.mother.name,
              job: nextFamily.mother.job,
              diedAtAge: nextFamily.mother.age,
            };
          } else {
            // Still alive: age must increase by 1
            expect(nextFamily.mother.age).toBe(prevMotherAge + 1);
            if (nextFamily.mother.age > maxParentAgeObserved) {
              maxParentAgeObserved = nextFamily.mother.age;
            }
          }

          // Father
          if (!prevFam.father.isAbsent) {
            if (!prevFam.father.isAlive) {
              // Already dead previously
              if (nextFamily.father.isAlive) {
                deceasedResurrectionCount++;
              }
              if (nextFamily.father.name !== fatherDeathSnapshot.name) {
                deceasedNameMutationCount++;
              }
              if (nextFamily.father.job !== fatherDeathSnapshot.job) {
                deceasedJobMutationCount++;
              }
            } else if (!nextFamily.father.isAlive) {
              // Just died this year
              fatherDeaths++;
              fatherDeathAges.push(nextFamily.father.age);
              fatherDeathSnapshot = {
                name: nextFamily.father.name,
                job: nextFamily.father.job,
                diedAtAge: nextFamily.father.age,
              };
            } else {
              // Still alive: age must increase by 1
              expect(nextFamily.father.age).toBe(prevFatherAge + 1);
              if (nextFamily.father.age > maxParentAgeObserved) {
                maxParentAgeObserved = nextFamily.father.age;
              }
            }
          }

          // 3. Partner mortality & permanence checks
          if (nextFamily.partner) {
            if (!prevFam.partner) {
              partnerFormations++;
            } else {
              if (nextFamily.partner.isMarried && !prevFam.partner.isMarried) {
                marriages++;
              }
              if (!prevFam.partner.isAlive && nextFamily.partner.isAlive) {
                deceasedResurrectionCount++;
              }
              if (prevFam.partner.isAlive && !nextFamily.partner.isAlive) {
                partnerDeaths++;
              }
            }
          }

          // 4. Children aging and moving out checks
          for (let cIdx = 0; cIdx < nextFamily.children.length; cIdx++) {
            const child = nextFamily.children[cIdx];
            const prevChild = prevFam.children[cIdx];
            if (prevChild) {
              expect(child.age).toBe(prevChild.age + 1);
              if (prevChild.atHome && !child.atHome) {
                childrenMovedOut++;
              }
            }
          }

          // Count newborn children
          if (nextFamily.children.length > prevFam.children.length) {
            totalChildrenBorn += (nextFamily.children.length - prevFam.children.length);
          }

          // 5. Invariant Checks
          expect(Number.isFinite(nextFamily.housing.ownership ? 1 : 0)).toBe(true);
          expect(nextFamily.household).toBeDefined();
          expect(nextFamily.household!.size).toBeGreaterThanOrEqual(1);
        }

        // Post-100 year assertions: parents who started at age 20-45 are now 120-145 -> must all be dead
        expect(character.family!.mother.isAlive, `Mother in life ${lifeIdx} must be deceased by player age 100`).toBe(false);
        if (!character.family!.father.isAbsent) {
          expect(character.family!.father.isAlive, `Father in life ${lifeIdx} must be deceased by player age 100`).toBe(false);
        }
      }

      const finalHeap = proc ? proc.memoryUsage().heapUsed : 0;
      const heapDeltaMB = (finalHeap - initialHeap) / (1024 * 1024);

      // Compute mortality statistics
      const avgMomDeathAge = motherDeathAges.reduce((a, b) => a + b, 0) / Math.max(1, motherDeathAges.length);
      const avgDadDeathAge = fatherDeathAges.reduce((a, b) => a + b, 0) / Math.max(1, fatherDeathAges.length);

      console.log('=== 1,000 LIFE COURSES EMPIRICAL STRESS TEST REPORT ===');
      console.log(`Total Simulated Life Courses: ${TOTAL_LIVES}`);
      console.log(`Total Annual Steps: ${totalAnnualStepsSimulated} (Exact 100,000 steps)`);
      console.log(`Circular References Detected: ${circularReferenceCount}`);
      console.log(`Deceased Resurrections: ${deceasedResurrectionCount}`);
      console.log(`Posthumous Name Mutations: ${deceasedNameMutationCount}`);
      console.log(`Posthumous Job Mutations: ${deceasedJobMutationCount}`);
      console.log(`Mortality Non-Monotonic Violations: ${mortalityNonMonotonicViolations}`);
      console.log(`Mother Deaths: ${motherDeaths} (Avg death age: ${avgMomDeathAge.toFixed(1)} yrs)`);
      console.log(`Father Deaths: ${fatherDeaths} (Avg death age: ${avgDadDeathAge.toFixed(1)} yrs)`);
      console.log(`Maximum Parent Age Observed: ${maxParentAgeObserved} yrs (bounded <= 110)`);
      console.log(`Partners Formed: ${partnerFormations}, Marriages: ${marriages}, Partner Deaths: ${partnerDeaths}`);
      console.log(`Children Born: ${totalChildrenBorn}, Children Moved Out (18+): ${childrenMovedOut}`);
      console.log(`Net Heap Growth across 100,000 steps: ${heapDeltaMB.toFixed(2)} MB`);

      // Authoritative Acceptance Assertions
      expect(totalAnnualStepsSimulated).toBe(EXPECTED_TOTAL_STEPS);
      expect(circularReferenceCount).toBe(0);
      expect(deceasedResurrectionCount).toBe(0);
      expect(deceasedNameMutationCount).toBe(0);
      expect(deceasedJobMutationCount).toBe(0);
      expect(mortalityNonMonotonicViolations).toBe(0);
      expect(maxParentAgeObserved).toBeLessThanOrEqual(110);
      expect(motherDeaths).toBe(TOTAL_LIVES); // 100% of mothers die by player age 100
      expect(avgMomDeathAge).toBeGreaterThan(60);
      expect(avgMomDeathAge).toBeLessThan(90);
      expect(avgDadDeathAge).toBeGreaterThan(55);
      expect(avgDadDeathAge).toBeLessThan(90);
      expect(marriages).toBeGreaterThan(300);
      expect(totalChildrenBorn).toBeGreaterThan(500);
      expect(childrenMovedOut).toBeGreaterThan(300);
      expect(heapDeltaMB).toBeLessThan(60);
    });
  });

  // ==========================================================================
  // ADVERSARIAL TEST 2: BOUNDARY CONDITIONS & EXTREME EDGE CASES
  // ==========================================================================
  describe('2. Boundary Conditions & Extreme Edge Cases', () => {
    it('handles extreme centenarian lifespans (player reaching 105 to 115 years old) safely without exceptions or NaN', () => {
      const prng = new PRNG('centenarian_edge_case');
      for (const country of COUNTRIES.slice(0, 15)) {
        let fam = generateInitialFamily(country, 3, () => prng.next());

        for (let age = 1; age <= 115; age++) {
          const { nextFamily } = stepFamilyYear(fam, age, country, () => prng.next());
          fam = nextFamily;

          expect(fam).toBeDefined();
          expect(Number.isFinite(fam.housing.ownership ? 1 : 0)).toBe(true);
          expect(fam.household!.size).toBeGreaterThanOrEqual(1);

          if (age >= 105) {
            // Player is 105+, parents died long ago
            expect(fam.mother.isAlive).toBe(false);
            expect(fam.mother.diedAtAge).toBeDefined();
            expect(fam.mother.diedAtAge!).toBeLessThanOrEqual(110);
            if (!fam.father.isAbsent) {
              expect(fam.father.isAlive).toBe(false);
              expect(fam.father.diedAtAge).toBeDefined();
              expect(fam.father.diedAtAge!).toBeLessThanOrEqual(110);
            }
          }
        }
      }
    });

    it('handles player dying before parents (infant/child mortality) with family graph intact', () => {
      const prng = new PRNG('player_predeceased');
      // Simulate 50 infant/child deaths (ages 0 to 8)
      for (let i = 0; i < 50; i++) {
        const country = COUNTRIES[i % COUNTRIES.length];
        let char = generateBirth({ countryId: country.id, seed: `infant_${i}` }, prng);
        expect(char.family).toBeDefined();

        // Step 1 to 5 years
        const deathAge = (i % 5);
        for (let a = 1; a <= deathAge; a++) {
          char = stepYear(char, 'health', prng).nextState;
        }

        // Force death
        char.isAlive = false;
        char.deathAge = char.age;

        // Verify family graph is intact and parents are young and alive
        expect(char.family).toBeDefined();
        expect(char.family!.mother.isAlive).toBe(true);
        expect(char.family!.mother.age).toBeLessThanOrEqual(50);
        expect(char.family!.housing).toBeDefined();

        // Verify scene mapping for deceased infant succeeds
        const scenePersons = mapHouseholdMembersForScene(char);
        expect(scenePersons.length).toBeGreaterThanOrEqual(1);
        expect(scenePersons[0].role).toBe('me');
      }
    });

    it('handles early childhood orphan state (both parents dying before character age 10)', () => {
      const prng = new PRNG('early_orphan_edge_case');
      for (const country of COUNTRIES.slice(0, 10)) {
        let fam = generateInitialFamily(country, 2, () => prng.next());

        // Simulate both parents dying when character is age 3
        fam.mother.isAlive = false;
        fam.mother.diedAtAge = fam.mother.age;
        fam.father.isAlive = false;
        fam.father.isAbsent = false;
        fam.father.diedAtAge = fam.father.age;

        // Step family through childhood and into adulthood (ages 4 to 25)
        for (let age = 4; age <= 25; age++) {
          const { nextFamily, familyEvents } = stepFamilyYear(fam, age, country, () => prng.next());
          fam = nextFamily;

          expect(fam.mother.isAlive).toBe(false);
          expect(fam.father.isAlive).toBe(false);

          if (age < 20) {
            expect(fam.household!.membersLivingTogether?.mother).toBe(false);
            expect(fam.household!.membersLivingTogether?.father).toBe(false);
            expect(fam.housing.livingWith).toBeTruthy();
          } else {
            // Independent adulthood
            expect(fam.household!.size).toBeGreaterThanOrEqual(1);
          }
        }
      }
    });
  });

  // ==========================================================================
  // ADVERSARIAL TEST 3: PIXELART SCENE SAFETY & FUNERAL TRIGGER
  // ==========================================================================
  describe('3. PixelArtScene Household Members Safety & Funeral Scene Trigger', () => {
    it('household members passed to PixelArtScene never cause NaN, bounds overflow, or array exceptions', () => {
      const palDark = pxPalette('dark');
      const palLight = pxPalette('light');

      for (let i = 0; i < 100; i++) {
        const country = COUNTRIES[i % COUNTRIES.length];
        const prng = new PRNG(`pixel_safety_${i}`);
        let character = generateBirth({ countryId: country.id, seed: `pseed_${i}` }, prng);

        const targetAges = [0, 5, 12, 18, 25, 40, 70];
        const targetAge = targetAges[i % targetAges.length];

        while (character.isAlive && character.age < targetAge) {
          character = stepYear(character, 'family', prng).nextState;
        }

        const members = mapHouseholdMembersForScene(character);
        expect(members.length).toBeGreaterThanOrEqual(1);
        expect(members[0].role).toBe('me');

        const sceneContext: SceneContext = {
          age: character.age,
          sex: character.sex,
          countryId: character.country.id,
          wealthQuintile: character.wealth.quintile,
          familyMembers: members,
          isDeceased: !character.isAlive,
          urban: character.country.urb > 50,
          region: character.country.p,
          seed: `scene_seed_${i}`,
        };

        const sceneModel = contextToSceneModel(sceneContext);

        const homeBuf = new PixelBuffer(28, 20);
        const peopleSprites = sceneModel.people.map((p) => ({
          p,
          s: new PixelBuffer(9, 17),
        }));

        const layout = pxPeopleLay(sceneModel, palDark, homeBuf, 4, peopleSprites);
        expect(Number.isFinite(layout.x)).toBe(true);
        expect(Number.isFinite(layout.gap)).toBe(true);
        expect(Number.isFinite(layout.tot)).toBe(true);

        const sceneBuf = pxScene(sceneModel, i % 2 === 0 ? palDark : palLight);
        assertPixelBufferPurity(sceneBuf, `Scene ${i} (age ${character.age})`);

        const layers = pxSceneLayers(sceneModel, palDark);
        assertPixelBufferPurity(layers.sky, `Sky Layer ${i}`);
        assertPixelBufferPurity(layers.back, `Back Layer ${i}`);
        assertPixelBufferPurity(layers.mid, `Mid Layer ${i}`);
        assertPixelBufferPurity(layers.front, `Front Layer ${i}`);

        const mock = createMockCanvas();
        expect(() => {
          renderPixelScene(mock.ctx, sceneContext, 'dark');
        }).not.toThrow();
        expect(mock.getPutCalls()).toBe(1);
      }
    });

    it('triggers pxFuneral when isDeceased is true, rendering mourners across cultural traditions', () => {
      const mock = createMockCanvas();
      const pal = pxPalette('dark');

      const religiousTraditions = [
        { countryId: 'RUS', rel: 'C', name: 'Christian' },
        { countryId: 'EGY', rel: 'M', name: 'Muslim' },
        { countryId: 'IND', rel: 'H', name: 'Hindu' },
        { countryId: 'THA', rel: 'B', name: 'Buddhist' },
        { countryId: 'FRA', rel: 'J', name: 'Secular' },
      ];

      for (const trad of religiousTraditions) {
        const deceasedContext: SceneContext = {
          age: 75,
          sex: 'M',
          countryId: trad.countryId,
          religionId: trad.rel,
          wealthQuintile: 3,
          isDeceased: true,
          familyMembers: [
            { role: 'pt', age: 72, sex: 'F' },
            { role: 'kid', age: 45, sex: 'M' },
            { role: 'kid', age: 40, sex: 'F' },
            { role: 'sib', age: 70, sex: 'M' },
          ],
          seed: `funeral_${trad.countryId}`,
        };

        const model = contextToSceneModel(deceasedContext);
        expect(model.isDeceased).toBe(true);

        const funeralBuf = pxFuneral(model, pal, model.people);
        assertPixelBufferPurity(funeralBuf, `Funeral ${trad.name}`);

        renderPixelScene(mock.ctx, deceasedContext, 'dark');
        expect(mock.getPutCalls()).toBeGreaterThan(0);
      }
    });

    it('funeral scene survives when character dies with 0 surviving family members (alone)', () => {
      const mock = createMockCanvas();
      const pal = pxPalette('dark');

      const lonelyDeathContext: SceneContext = {
        age: 98,
        sex: 'F',
        countryId: 'JPN',
        wealthQuintile: 1,
        isDeceased: true,
        familyMembers: [],
        seed: 'lonely_death_japan',
      };

      const model = contextToSceneModel(lonelyDeathContext);
      expect(model.isDeceased).toBe(true);

      const buf = pxFuneral(model, pal, []);
      assertPixelBufferPurity(buf, 'Lonely Funeral Buffer');

      expect(() => {
        renderPixelScene(mock.ctx, lonelyDeathContext, 'dark');
      }).not.toThrow();
    });

    it('verifies that living scene vs deceased funeral scene produce completely different buffers', () => {
      const baseContext: SceneContext = {
        age: 65,
        sex: 'M',
        countryId: 'RUS',
        wealthQuintile: 3,
        familyMembers: [{ role: 'me', age: 65, sex: 'M' }],
        seed: 'diff_test_seed',
      };

      const livingModel = contextToSceneModel({ ...baseContext, isDeceased: false });
      const deceasedModel = contextToSceneModel({ ...baseContext, isDeceased: true });

      const pal = pxPalette('dark');
      const livingBuf = pxScene(livingModel, pal);
      const funeralBuf = pxFuneral(deceasedModel, pal, deceasedModel.people);

      let diffPixels = 0;
      for (let i = 0; i < livingBuf.d.length; i++) {
        const p1 = livingBuf.d[i];
        const p2 = funeralBuf.d[i];
        if (JSON.stringify(p1) !== JSON.stringify(p2)) {
          diffPixels++;
        }
      }
      expect(diffPixels).toBeGreaterThan(1500);
    });
  });

  // ==========================================================================
  // ADVERSARIAL TEST 4: FAMILYCARD ACCORDION & ZERO-OVERFLOW SSR RENDERING
  // ==========================================================================
  describe('4. FamilyCard Component SSR & Layout Resilience', () => {
    it('renders FamilyCard cleanly under diverse extreme family structures without NaN or SSR errors', () => {
      const testCases: { name: string; age: number; family: FamilyState }[] = [
        {
          name: 'Newborn absent father',
          age: 0,
          family: {
            mother: { name: 'Мария Иванова', age: 24, job: 'cashier', jobTitleRu: 'Кассир', isAlive: true, isAbsent: false },
            father: { name: 'Алексей Иванов', age: 28, job: 'absent', jobTitleRu: 'Отсутствует / ушел из семьи', isAlive: true, isAbsent: true },
            siblings: [
              { id: 's1', name: 'Дмитрий', age: 5, sex: 'M', isOlder: true, isAlive: true, atHome: true },
              { id: 's2', name: 'Анна', age: 3, sex: 'F', isOlder: true, isAlive: true, atHome: true },
              { id: 's3', name: 'Елена', age: 1, sex: 'F', isOlder: true, isAlive: true, atHome: true },
              { id: 's4', name: 'Максим', age: 7, sex: 'M', isOlder: true, isAlive: false, atHome: false, diedAtAge: 2 },
            ],
            partner: null,
            children: [],
            housing: { type: 'flat', typeRu: 'Комната', ownership: false, city: 'Москва', livingWith: 'С матерью и 3 родственниками' },
            household: { size: 5 },
          },
        },
        {
          name: 'Elder with deceased parents and children',
          age: 72,
          family: {
            mother: { name: 'Екатерина', age: 95, job: 'retired', jobTitleRu: 'Пенсионерка', isAlive: false, isAbsent: false, diedAtAge: 82 },
            father: { name: 'Владимир', age: 98, job: 'retired', jobTitleRu: 'Пенсионер', isAlive: false, isAbsent: false, diedAtAge: 76 },
            siblings: [],
            partner: { name: 'Ольга', age: 70, job: 'retired', professionRu: 'Врач на пенсии', isMarried: true, isAlive: true, isCohabiting: true },
            children: [
              { id: 'c1', name: 'Сергей', age: 48, sex: 'M', isAlive: true, atHome: false },
              { id: 'c2', name: 'Татьяна', age: 45, sex: 'F', isAlive: true, atHome: false },
              { id: 'c3', name: 'Михаил', age: 38, sex: 'M', isAlive: true, atHome: true },
            ],
            housing: { type: 'apartment', typeRu: 'Квартира', ownership: true, city: 'Новосибирск', livingWith: 'В браке с Ольга и 1 ребенком' },
            household: { size: 3 },
          },
        },
        {
          name: 'Complete child orphan',
          age: 9,
          family: {
            mother: { name: 'Амина', age: 32, job: 'cleaner', jobTitleRu: 'Уборщица', isAlive: false, isAbsent: false, diedAtAge: 30 },
            father: { name: 'Тарик', age: 36, job: 'laborer', jobTitleRu: 'Разнорабочий', isAlive: false, isAbsent: false, diedAtAge: 34 },
            siblings: [],
            partner: null,
            children: [],
            housing: { type: 'hut', typeRu: 'Сельская хижина', ownership: false, city: 'Провинция', livingWith: 'Самостоятельно' },
            household: { size: 1 },
          },
        },
      ];

      for (const tc of testCases) {
        const html = ReactDOMServer.renderToString(
          React.createElement(FamilyCard, { family: tc.family, playerAge: tc.age })
        );

        expect(html).toContain('data-testid="family-card"');
        expect(html).toContain('data-testid="family-accordion-toggle"');
        expect(html).toContain('data-testid="mother-preview-pill"');
        expect(html).toContain('data-testid="father-preview-pill"');
        expect(html).toContain('data-testid="siblings-preview-pill"');
        expect(html).toContain('data-testid="romance-preview-pill"');
        expect(html).toContain('data-testid="housing-preview-pill"');

        expect(html.includes('NaN')).toBe(false);
        expect(html.includes('undefined')).toBe(false);
        expect(html.includes('null')).toBe(false);
      }
    });
  });
});
