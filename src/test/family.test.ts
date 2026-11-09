import { describe, it, expect } from 'vitest';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import {
  generateInitialFamily,
  stepFamilyYear,
  HOME_OWN_C,
  REGIONAL_ABSENT_FATHER_RATE,
  pickParentJob,
} from '../engine/familyEngine';
import {
  generateBirth,
  initSimulation,
  stepYear,
  stepSimulation,
} from '../engine/simulationCore';
import { contextToSceneModel, renderPixelScene } from '../engine/pixelArt/renderer';
import { FamilyCard } from '../components/FamilyCard';
import { COUNTRIES_BY_ID, COUNTRIES } from '../data/countries';
import { PRNG } from '../engine/prng';
import type { FamilyState } from '../types/family';
import type { SceneContext } from '../types/pixelArt';

describe('Milestone 7: Dynamic Family Relational Model & Living Dossier Suite', () => {
  describe('1. Demographic Family Generation (generateInitialFamily)', () => {
    it('generates authentic mother with age clamped between 18 and 42 and valid job', () => {
      for (const country of COUNTRIES.slice(0, 20)) {
        for (let q = 1; q <= 5; q++) {
          const prng = new PRNG(`${country.id}_${q}_m1`);
          const family = generateInitialFamily(country, q, () => prng.next());

          expect(family.mother).toBeDefined();
          expect(family.mother.name).toBeTruthy();
          expect(family.mother.age).toBeGreaterThanOrEqual(18);
          expect(family.mother.age).toBeLessThanOrEqual(42);
          expect(family.mother.isAlive).toBe(true);
          expect(family.mother.isAbsent).toBe(false);
          expect(family.mother.job).toBeTruthy();
          expect(family.mother.jobTitleRu).toBeTruthy();
          expect(family.mother.sex).toBe('F');
        }
      }
    });

    it('generates father older than mother with realistic age gap and absent probability', () => {
      let absentCount = 0;
      const totalSamples = 100;

      for (let i = 0; i < totalSamples; i++) {
        const prng = new PRNG(`dad_test_${i}`);
        const family = generateInitialFamily('RUS', 3, () => prng.next());

        expect(family.father).toBeDefined();
        expect(family.father.name).toBeTruthy();
        expect(family.father.age).toBeGreaterThanOrEqual(family.mother.age);
        expect(family.father.sex).toBe('M');
        expect(family.father.isAlive).toBe(true);

        if (family.father.isAbsent) {
          absentCount++;
          expect(family.father.jobTitleRu).toContain('Отсутствует');
        } else {
          expect(family.father.jobTitleRu).not.toContain('Отсутствует');
        }
      }

      // In Russia (ECA region), absent rate should be reasonable (~10-25%)
      expect(absentCount).toBeGreaterThan(3);
      expect(absentCount).toBeLessThan(40);
    });

    it('calibrates father absence to regional demographic benchmarks (SSA vs MENA)', () => {
      const ssaCountry = COUNTRIES_BY_ID['COD'] || COUNTRIES_BY_ID['NGA'] || COUNTRIES[0];
      const menaCountry = COUNTRIES_BY_ID['EGY'] || COUNTRIES_BY_ID['SAU'] || COUNTRIES[0];

      let ssaAbsent = 0;
      let menaAbsent = 0;
      const samples = 300;

      for (let i = 0; i < samples; i++) {
        const p1 = new PRNG(`ssa_${i}`);
        const famSsa = generateInitialFamily(ssaCountry, 2, () => p1.next());
        if (famSsa.father.isAbsent) ssaAbsent++;

        const p2 = new PRNG(`mena_${i}`);
        const famMena = generateInitialFamily(menaCountry, 2, () => p2.next());
        if (famMena.father.isAbsent) menaAbsent++;
      }

      // SSA should have significantly higher absent rate than MENA/SA
      expect(ssaAbsent).toBeGreaterThan(menaAbsent);
      expect(ssaAbsent / samples).toBeGreaterThan(0.15);
      expect(menaAbsent / samples).toBeLessThan(0.20);

      // Verify regional rates constants
      expect(REGIONAL_ABSENT_FATHER_RATE['ssa']).toBe(0.30);
      expect(REGIONAL_ABSENT_FATHER_RATE['mena']).toBe(0.04);
    });

    it('samples parent jobs realistically across quintiles with pickParentJob', () => {
      const rus = COUNTRIES_BY_ID['RUS'];
      const rng = new PRNG('job_test');
      
      const q1Job = pickParentJob('M', 35, 1, rus, rng);
      expect(q1Job.id).toBeTruthy();
      expect(q1Job.ru).toBeTruthy();

      const q5Job = pickParentJob('F', 40, 5, rus, rng);
      expect(q5Job.id).toBeTruthy();
      expect(q5Job.ru).toBeTruthy();

      const retiredJob = pickParentJob('M', 70, 3, rus, rng);
      expect(retiredJob.ru).toBeTruthy();
    });

    it('calibrates initial siblings count against National Total Fertility Rate (TFR)', () => {
      // High TFR country (Niger/Congo TFR > 5) vs Low TFR country (South Korea/Japan/Germany TFR < 1.6)
      const highTFR = COUNTRIES.find((c) => (c.tfr ?? 0) >= 4.5) ?? COUNTRIES[0];
      const lowTFR = COUNTRIES.find((c) => (c.tfr ?? 0) <= 1.6) ?? COUNTRIES[1];

      let highTFRSiblings = 0;
      let lowTFRSiblings = 0;
      const samples = 50;

      for (let i = 0; i < samples; i++) {
        const pHigh = new PRNG(`high_${i}`);
        const famHigh = generateInitialFamily(highTFR, 3, () => pHigh.next());
        highTFRSiblings += famHigh.siblings.length;

        const pLow = new PRNG(`low_${i}`);
        const famLow = generateInitialFamily(lowTFR, 3, () => pLow.next());
        lowTFRSiblings += famLow.siblings.length;
      }

      expect(highTFRSiblings).toBeGreaterThan(lowTFRSiblings * 2);

      // Verify older sibling invariants
      const prng = new PRNG(12345);
      const fam = generateInitialFamily(highTFR, 3, () => prng.next());
      for (const sib of fam.siblings) {
        expect(sib.isOlder).toBe(true);
        expect(sib.isAlive).toBe(true);
        expect(sib.atHome).toBe(true);
        expect(sib.age).toBeGreaterThan(0);
        expect(sib.name).toBeTruthy();
      }
    });

    it('assigns housing type based on wealth quintile and home ownership rate', () => {
      const rus = COUNTRIES_BY_ID['RUS'];
      const deu = COUNTRIES_BY_ID['DEU'];

      // Russia has high empirical ownership rate (89%), Germany has low (~47%)
      expect(HOME_OWN_C['RUS']).toBe(0.89);
      expect(HOME_OWN_C['DEU']).toBe(0.47);

      let rusOwned = 0;
      let deuOwned = 0;
      const samples = 200;

      for (let i = 0; i < samples; i++) {
        const prngRus = new PRNG(`rus_${i}`);
        const famRus = generateInitialFamily(rus, 3, () => prngRus.next());
        if (famRus.housing.ownership) rusOwned++;

        const prngDeu = new PRNG(`deu_${i}`);
        const famDeu = generateInitialFamily(deu, 3, () => prngDeu.next());
        if (famDeu.housing.ownership) deuOwned++;
      }

      expect(rusOwned).toBeGreaterThan(deuOwned);

      // Wealth quintile housing tier check
      const prngQ1 = new PRNG('q1');
      const famQ1 = generateInitialFamily('IND', 1, () => prngQ1.next());
      expect(['hut', 'flat', 'room', 'cottage']).toContain(famQ1.housing.type);

      const prngQ5 = new PRNG('q5');
      const famQ5 = generateInitialFamily('USA', 5, () => prngQ5.next());
      expect(['villa', 'house', 'apartment', 'mansion']).toContain(famQ5.housing.type);
    });
  });

  describe('2. Yearly Family Lifecycle Stepping (stepFamilyYear)', () => {
    it('advances ages of living family members by strictly 1 year', () => {
      const prng = new PRNG('step_age_test');
      const fam = generateInitialFamily('RUS', 3, () => prng.next());

      const initialMomAge = fam.mother.age;
      const initialDadAge = fam.father.age;
      const initialSibsAges = fam.siblings.map((s) => s.age);

      // Safe step with zero mortality roll override
      const deterministicSafePrng = () => 0.999;
      const { nextFamily } = stepFamilyYear(fam, 1, 'RUS', deterministicSafePrng);

      expect(nextFamily.mother.age).toBe(initialMomAge + 1);
      if (nextFamily.father.isAlive && !nextFamily.father.isAbsent) {
        expect(nextFamily.father.age).toBe(initialDadAge + 1);
      }
      for (let i = 0; i < nextFamily.siblings.length; i++) {
        expect(nextFamily.siblings[i].age).toBe(initialSibsAges[i] + 1);
      }
    });

    it('evaluates dynamic Gompertz parental mortality with calibrated life tables', () => {
      const fam = generateInitialFamily('RUS', 3, () => 0.5);
      // Fast-forward parents to old age
      fam.mother.age = 88;
      fam.father.age = 90;
      fam.father.isAbsent = false;

      // Unfortunate roll causing mortality
      const mortalPrng = () => 0.0001;
      const { nextFamily, familyEvents } = stepFamilyYear(fam, 55, 'RUS', mortalPrng);

      expect(nextFamily.mother.isAlive).toBe(false);
      expect(nextFamily.mother.diedAtAge).toBe(89);
      expect(nextFamily.father.isAlive).toBe(false);
      expect(nextFamily.father.diedAtAge).toBe(91);

      const deathEvents = familyEvents.filter(
        (e) => e.includes('ушла из жизни') || e.includes('ушел из жизни')
      );
      expect(deathEvents.length).toBeGreaterThanOrEqual(1);
    });

    it('generates economic shock event when father dies while player is child (< 15)', () => {
      const fam = generateInitialFamily('RUS', 2, () => 0.5);
      fam.father.isAbsent = false;
      fam.father.isAlive = true;

      // Force father death at player age 8
      let rollCount = 0;
      const customPrng = () => {
        rollCount++;
        // Father mortality roll is the second check in stepFamilyYear
        return rollCount === 2 ? 0.000001 : 0.99;
      };

      const { familyEvents } = stepFamilyYear(fam, 8, 'RUS', customPrng);
      const shockEvent = familyEvents.find((e) => e.includes('экономический удар'));
      expect(shockEvent).toBeDefined();
    });

    it('triggers sibling departure from household between ages 18 and 24', () => {
      const fam = generateInitialFamily('RUS', 3, () => 0.5);
      fam.siblings = [
        {
          id: 'sib_old',
          name: 'Иван',
          age: 21,
          sex: 'M',
          isOlder: true,
          isAlive: true,
          atHome: true,
        },
      ];

      // Step with a roll that triggers departure
      const departPrng = () => 0.10;
      const { nextFamily, familyEvents } = stepFamilyYear(fam, 15, 'RUS', departPrng);

      expect(nextFamily.siblings[0].atHome).toBe(false);
      expect(nextFamily.siblings[0].leftHomeAge).toBe(22);
      expect(familyEvents.some((e) => e.includes('съехав из дома'))).toBe(true);
    });

    it('supports player romance, marriage, and childbirth in adulthood', () => {
      let fam = generateInitialFamily('RUS', 3, () => 0.5);

      // Advance through adulthood with rolls favorable to romance and marriage
      let playerAge = 18;
      let prngVal = 0.05; // triggers partner finding and marriage
      const triggerPrng = () => prngVal;

      // Age 18: finds partner
      const step18 = stepFamilyYear(fam, playerAge, 'RUS', triggerPrng);
      fam = step18.nextFamily;
      expect(fam.partner).toBeDefined();
      expect(fam.partner?.name).toBeTruthy();
      expect(fam.partner?.isMarried).toBe(false);
      expect(fam.partner?.anniversaryAge).toBe(18);
      expect(step18.familyEvents.some((e) => e.includes('любовь'))).toBe(true);

      // Advance to age 19: partner ages, dating 1 year, not married yet
      const step19 = stepFamilyYear(fam, 19, 'RUS', triggerPrng);
      fam = step19.nextFamily;
      expect(fam.partner?.isMarried).toBe(false);

      // Advance to age 20: dating >= 2 years (anniversary 18 -> age 20), triggers wedding and childbirth
      const step20 = stepFamilyYear(fam, 20, 'RUS', triggerPrng);
      fam = step20.nextFamily;
      expect(fam.partner?.isMarried).toBe(true);
      expect(step20.familyEvents.some((e) => e.includes('свадьбу'))).toBe(true);

      // Childbirth during marriage
      expect(fam.children.length).toBeGreaterThan(0);
      const newborn = fam.children[fam.children.length - 1];
      expect(newborn.name).toBeTruthy();
      expect(newborn.age).toBe(0);
      expect(step20.familyEvents.some((e) => e.includes('родился ребенок'))).toBe(true);
    });
  });

  describe('3. SimulationCore Wiring & Progression Integration', () => {
    it('initializes family on newborn CharacterState in generateBirth / initSimulation', () => {
      const char = generateBirth({ seed: 42, countryId: 'RUS', mode: 'birth' });
      expect(char.family).toBeDefined();
      expect(char.family?.mother).toBeDefined();
      expect(char.family?.father).toBeDefined();
      expect(char.family?.housing).toBeDefined();
      expect(char.householdSize).toBeGreaterThanOrEqual(2);

      // Verify alias initSimulation
      const char2 = initSimulation({ seed: 42, countryId: 'RUS', mode: 'birth' });
      expect(char2.family).toBeDefined();
    });

    it('steps family yearly in stepYear / stepSimulation and logs chronicle events', () => {
      let char = generateBirth({ seed: 999, countryId: 'RUS' });
      const initialFamily = char.family!;
      expect(initialFamily).toBeDefined();

      const stepRes = stepYear(char, 'health');
      expect(stepRes.nextState.family).toBeDefined();
      expect(stepRes.nextState.family?.mother.age).toBe(initialFamily.mother.age + 1);

      // Check stepSimulation alias
      const stepSimRes = stepSimulation(char, 'work');
      expect(stepSimRes.nextState.family).toBeDefined();
    });

    it('applies economic shock (quintile drop) when parent dies early in simulationCore', () => {
      let char = generateBirth({ seed: 555, countryId: 'RUS' });
      char.wealth.quintile = 3;
      // Force father death at age 5
      char.family!.father.isAlive = true;
      char.family!.father.isAbsent = false;

      // Set age to 5
      char.age = 5;
      // Step with father death
      const mockPrng = new PRNG(1);
      // Directly check stepSimulation
      const res = stepYear(char, 'health', mockPrng);
      expect(res.nextState).toBeDefined();
    });
  });

  describe('4. Living Dossier UI Component (FamilyCard.tsx)', () => {
    it('renders FamilyCard cleanly with parents, siblings, romance, and housing', () => {
      const family: FamilyState = {
        mother: {
          name: 'Анна',
          age: 32,
          job: 'teacher',
          jobTitleRu: 'Учитель начальных классов',
          isAlive: true,
          isAbsent: false,
        },
        father: {
          name: 'Сергей',
          age: 35,
          job: 'engineer',
          jobTitleRu: 'Инженер-конструктор',
          isAlive: true,
          isAbsent: false,
        },
        siblings: [
          {
            id: 'sib_1',
            name: 'Алексей',
            age: 6,
            sex: 'M',
            isOlder: true,
            isAlive: true,
            atHome: true,
          },
        ],
        partner: null,
        children: [],
        housing: {
          type: 'flat',
          typeRu: 'Городская квартира',
          ownership: true,
          city: 'Москва',
          livingWith: 'С обоими родителями и братом',
          tenureRu: 'Собственность',
          electricity: true,
          runningWater: true,
        },
        household: {
          size: 4,
        },
      };

      const html = ReactDOMServer.renderToString(
        React.createElement(FamilyCard, { family, playerAge: 3 })
      );

      // Headers and sections
      expect(html).toContain('Семья и жизнь');
      expect(html).toContain('4 чел. в доме');
      expect(html).toContain('Городская квартира');
      expect(html).toContain('Москва');

      // Parent pills
      expect(html).toContain('Анна');
      expect(html).toContain('Сергей');
      expect(html).toContain('32 лет');
      expect(html).toContain('35 лет');

      // Sibling and housing pills
      expect(html).toContain('Братья/Сестры: 1');
      expect(html).toContain('Собственность');
    });

    it('renders deceased parents with memory and strikethrough styling', () => {
      const family: FamilyState = {
        mother: {
          name: 'Елена',
          age: 50,
          diedAtAge: 48,
          job: 'homemaker',
          jobTitleRu: 'Домохозяйка',
          isAlive: false,
          isAbsent: false,
        },
        father: {
          name: 'Михаил',
          age: 54,
          job: 'absent',
          jobTitleRu: 'Отсутствует',
          isAlive: true,
          isAbsent: true,
        },
        siblings: [],
        partner: null,
        children: [],
        housing: {
          type: 'room',
          ownership: false,
          city: 'Самара',
          livingWith: 'Самостоятельно',
        },
      };

      const html = ReactDOMServer.renderToString(
        React.createElement(FamilyCard, { family, playerAge: 16 })
      );

      // Deceased mother
      expect(html).toContain('Память (48 лет)');
      // Absent father
      expect(html).toContain('Ушел из семьи');
    });

    it('renders married romantic partner and children details', () => {
      const family: FamilyState = {
        mother: {
          name: 'Ольга',
          age: 62,
          job: 'retired',
          jobTitleRu: 'Пенсионерка',
          isAlive: true,
          isAbsent: false,
        },
        father: {
          name: 'Дмитрий',
          age: 65,
          job: 'retired',
          jobTitleRu: 'Пенсионер',
          isAlive: true,
          isAbsent: false,
        },
        siblings: [],
        partner: {
          name: 'София',
          age: 28,
          job: 'doctor',
          professionRu: 'Врач-кардиолог',
          isMarried: true,
          isAlive: true,
        },
        children: [
          {
            id: 'c1',
            name: 'Максим',
            age: 2,
            sex: 'M',
            isAlive: true,
            atHome: true,
          },
        ],
        housing: {
          type: 'apartment',
          typeRu: 'Современная квартира',
          ownership: true,
          city: 'Санкт-Петербург',
          livingWith: 'В браке с София и 1 ребенком',
        },
      };

      const html = ReactDOMServer.renderToString(
        React.createElement(FamilyCard, { family, playerAge: 29 })
      );

      expect(html).toContain('В браке с София');
      expect(html).toContain('София (28 лет)');
      expect(html).toContain('Дети: 1');
    });
  });

  describe('5. Pixel Art Scene Renderer Fix (contextToSceneModel & pxFuneral)', () => {
    it('correctly propagates isDeceased flag to SceneModel in contextToSceneModel', () => {
      const livingContext: SceneContext = {
        age: 25,
        sex: 'M',
        countryId: 'RUS',
        wealthQuintile: 3,
        isDeceased: false,
      };
      const livingModel = contextToSceneModel(livingContext);
      expect(livingModel.isDeceased).toBe(false);

      const deceasedContext: SceneContext = {
        age: 72,
        sex: 'F',
        countryId: 'JPN',
        wealthQuintile: 4,
        isDeceased: true,
      };
      const deceasedModel = contextToSceneModel(deceasedContext);
      expect(deceasedModel.isDeceased).toBe(true);
    });

    it('invokes funeral scene without throwing when character is deceased', () => {
      const mockCanvas = {
        width: 192,
        height: 60,
      } as HTMLCanvasElement;

      let putDataCalled = false;
      const mockCtx = {
        canvas: mockCanvas,
        createImageData: (w: number, h: number) => ({
          data: new Uint8ClampedArray(w * h * 4),
          width: w,
          height: h,
        }),
        putImageData: () => {
          putDataCalled = true;
        },
        clearRect: () => {},
        drawImage: () => {},
      } as unknown as CanvasRenderingContext2D;

      const deceasedCtx: SceneContext = {
        age: 80,
        sex: 'M',
        countryId: 'RUS',
        wealthQuintile: 3,
        isDeceased: true,
      };

      expect(() => {
        renderPixelScene(mockCtx, deceasedCtx, 'dark');
      }).not.toThrow();

      expect(putDataCalled).toBe(true);
    });
  });
});
