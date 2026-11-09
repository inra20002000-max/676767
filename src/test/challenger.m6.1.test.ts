import { describe, it, expect } from 'vitest';
import { COUNTRIES } from '../data/countries';
import {
  SKIN_W,
  skinPick,
  getCharacterSkin,
  blendOffspringSkin,
  skinW,
} from '../engine/pixelArt/skinTones';
import {
  PX,
  PixelBuffer,
  pxPalette,
} from '../engine/pixelArt/palette';
import {
  MO,
  pxMoment,
  pxFuneral,
} from '../engine/pixelArt/moments';
import {
  pxScene,
  pxSceneLayers,
  contextToSceneModel,
  renderPixelScene,
} from '../engine/pixelArt/renderer';
import type { SceneContext, SceneModel, ScenePerson } from '../types/pixelArt';

// Helper validator for PixelBuffer integrity
function assertPixelBufferIntegrity(
  buf: PixelBuffer,
  contextName: string,
  expectedWidth = PX.W,
  expectedHeight = PX.H
) {
  expect(buf.w, `${contextName} buffer width`).toBe(expectedWidth);
  expect(buf.h, `${contextName} buffer height`).toBe(expectedHeight);
  expect(buf.d.length, `${contextName} buffer pixel array length`).toBe(expectedWidth * expectedHeight);

  let invalidPixelCount = 0;
  let firstError = '';

  for (let i = 0; i < buf.d.length; i++) {
    const px = buf.d[i];
    if (px !== null && px !== undefined) {
      if (!Array.isArray(px) || px.length !== 3) {
        invalidPixelCount++;
        if (!firstError) firstError = `Malformed pixel at index ${i}: ${JSON.stringify(px)}`;
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
        invalidPixelCount++;
        if (!firstError) firstError = `Invalid RGB at index ${i}: [${r}, ${g}, ${b}]`;
      }
    }
  }

  expect(invalidPixelCount, `${contextName} had invalid pixels: ${firstError}`).toBe(0);
}

describe('Challenger M6 Adversarial Stress Test Suite', () => {
  // =========================================================================
  // 1. Fitzpatrick Skin Genetics Across All 172 Countries
  // =========================================================================
  describe('1. 172-Country Fitzpatrick Scale & Genetic Blending', () => {
    it('verifies deterministic behavior with identical seeds for all 172 countries', () => {
      expect(COUNTRIES.length).toBe(172);

      const testSeeds = [
        'alpha_seed_1',
        'fixed_seed_42',
        1337,
        'country_deterministic_run',
        'seed_99999',
      ];

      for (const country of COUNTRIES) {
        for (const seed of testSeeds) {
          const skin1 = getCharacterSkin(country.id, seed, null, country.p);
          const skin2 = getCharacterSkin(country.id, seed, null, country.p);
          const skin3 = getCharacterSkin(country.id, seed, null, country.p);

          // Invariant 1: Strictly deterministic
          expect(skin1).toBe(skin2);
          expect(skin2).toBe(skin3);

          // Invariant 2: Within 6-tier Fitzpatrick bounds [0, 5]
          expect(skin1).toBeGreaterThanOrEqual(0);
          expect(skin1).toBeLessThanOrEqual(5);
          expect(Number.isInteger(skin1)).toBe(true);
        }
      }
    });

    it('verifies statistical convergence of skin tone sampling against theoretical distributions', () => {
      // Test all 17 regional distribution vectors in SKIN_W
      const vectorKeys = Object.keys(SKIN_W);
      expect(vectorKeys.length).toBe(17);

      const SAMPLE_SIZE = 10000;

      for (const key of vectorKeys) {
        const weights = SKIN_W[key];
        expect(weights.length).toBe(6);
        const weightSum = weights.reduce((a, b) => a + b, 0);
        expect(weightSum).toBe(100);

        const counts = [0, 0, 0, 0, 0, 0];
        for (let i = 0; i < SAMPLE_SIZE; i++) {
          const seed = `sim_${key}_${i * 31 + 7}`;
          const picked = skinPick(weights, seed);
          counts[picked]++;
        }

        // Verify frequency convergence to within +/- 2.5% tolerance
        for (let tone = 0; tone < 6; tone++) {
          const theoreticalFreq = weights[tone] / 100;
          const empiricalFreq = counts[tone] / SAMPLE_SIZE;

          if (weights[tone] === 0) {
            expect(counts[tone], `Key ${key} tone ${tone} weight is 0 so count must be 0`).toBe(0);
          } else {
            const delta = Math.abs(empiricalFreq - theoreticalFreq);
            expect(
              delta,
              `Key ${key} tone ${tone}: expected freq ${theoreticalFreq}, observed ${empiricalFreq} (delta ${delta})`
            ).toBeLessThan(0.025);
          }
        }
      }
    });

    it('verifies multiracial child blending across all pairwise combinations of parent tones (36 pairs)', () => {
      // 6 x 6 = 36 pairwise parent combinations
      for (let p1 = 0; p1 <= 5; p1++) {
        for (let p2 = 0; p2 <= 5; p2++) {
          const minP = Math.min(p1, p2);
          const maxP = Math.max(p1, p2);
          const mean = (p1 + p2) / 2;
          const floorMid = Math.floor(mean);
          const ceilMid = Math.ceil(mean);

          const observedOutcomes = new Set<number>();

          // Test across 50 diverse seeds for this pair
          for (let s = 0; s < 50; s++) {
            const seed = `pair_${p1}_${p2}_${s}`;
            const childSkin = blendOffspringSkin(p1, p2, seed);

            // Invariant 1: Offspring tone strictly in [0, 5]
            expect(childSkin).toBeGreaterThanOrEqual(0);
            expect(childSkin).toBeLessThanOrEqual(5);
            expect(Number.isInteger(childSkin)).toBe(true);

            // Invariant 2: Offspring tone strictly within parent boundaries
            expect(childSkin).toBeGreaterThanOrEqual(minP);
            expect(childSkin).toBeLessThanOrEqual(maxP);

            // Invariant 3: Offspring tone must equal floor(mid) or ceil(mid)
            expect([floorMid, ceilMid]).toContain(childSkin);

            observedOutcomes.add(childSkin);
          }

          if (p1 === p2) {
            // When parents have identical skin tone, child MUST have that exact tone
            expect(observedOutcomes.size).toBe(1);
            expect(observedOutcomes.has(p1)).toBe(true);
          } else if ((p1 + p2) % 2 === 1) {
            // When sum is odd, both floor and ceil midpoints should be producible
            expect(observedOutcomes.has(floorMid)).toBe(true);
            expect(observedOutcomes.has(ceilMid)).toBe(true);
          } else {
            // When sum is even, midpoint is exact integer
            expect(observedOutcomes.size).toBe(1);
            expect(observedOutcomes.has(mean)).toBe(true);
          }
        }
      }
    });
  });

  // =========================================================================
  // 2. Stress-Test All 40 Life Moments & 5 Funeral Rites
  // =========================================================================
  describe('2. 40 Life Moments (MO) & 5 Cultural Funeral Rites Buffer Stress', () => {
    const momentKeys = Object.keys(MO);

    it('verifies all 40+ life moments exist and are functions', () => {
      expect(momentKeys.length).toBeGreaterThanOrEqual(40);
      for (const k of momentKeys) {
        expect(typeof MO[k]).toBe('function');
      }
    });

    it('stress-tests all 40 life moments with zero NaN, zero undefined, and strict buffer bounds', () => {
      const themes: ('light' | 'dark')[] = ['light', 'dark'];

      const testModels: Partial<SceneModel>[] = [
        // Full family model
        {
          stage: 'd',
          mood: 'high',
          urban: true,
          region: 'hi',
          home: 'house',
          prop: 'none',
          seed: 'moment_stress_full',
          people: [
            { role: 'me', age: 28, sex: 'F', sk: 2 },
            { role: 'pt', age: 30, sex: 'M', sk: 3 },
            { role: 'kid', age: 4, sex: 'F', sk: 2 },
            { role: 'kid', age: 1, sex: 'M', sk: 3 },
            { role: 'par', age: 60, sex: 'F', sk: 2 },
            { role: 'sib', age: 25, sex: 'M', sk: 2 },
          ],
        },
        // Minimal/solo character model
        {
          stage: 'e',
          mood: 'low',
          urban: false,
          region: 'ssa',
          home: 'hut',
          prop: 'craft',
          seed: 'moment_stress_solo',
          people: [{ role: 'me', age: 72, sex: 'M', sk: 5 }],
        },
        // Empty family list edge case
        {
          stage: 'm',
          mood: 'mid',
          urban: true,
          region: 'eap',
          home: 'flat',
          prop: 'none',
          seed: 'moment_stress_orphan',
          people: [],
        },
      ];

      for (const momentKey of momentKeys) {
        for (const theme of themes) {
          const pal = pxPalette(theme);

          for (const baseModel of testModels) {
            const model: SceneModel = {
              stage: baseModel.stage || 'd',
              mood: baseModel.mood || 'mid',
              urban: baseModel.urban ?? true,
              region: baseModel.region || 'hi',
              home: baseModel.home || 'house',
              people: baseModel.people ? [...baseModel.people] : [],
              prop: baseModel.prop || 'none',
              seed: `${baseModel.seed}_${momentKey}_${theme}`,
              act: momentKey,
              car: false,
              moto: false,
            };

            const layers = pxMoment(model, pal);
            expect(layers, `Moment "${momentKey}" must return layer object`).not.toBeNull();

            if (layers) {
              assertPixelBufferIntegrity(layers.sky, `MO[${momentKey}] sky (${theme})`);
              assertPixelBufferIntegrity(layers.back, `MO[${momentKey}] back (${theme})`);
              assertPixelBufferIntegrity(layers.mid, `MO[${momentKey}] mid (${theme})`);
              assertPixelBufferIntegrity(layers.front, `MO[${momentKey}] front (${theme})`);

              // Check composite scene render for this moment
              const sceneBuf = pxScene(model, pal);
              assertPixelBufferIntegrity(sceneBuf, `pxScene with MO[${momentKey}] (${theme})`);
            }
          }
        }
      }
    });

    it('stress-tests all 5 cultural funeral rites with zero NaN and valid RGB pixel buffers', () => {
      // 5 rites:
      // 1. Christian / Western cross: rel = 'C'
      // 2. Islamic Janazah white shroud: rel = 'M'
      // 3. Hindu / Sikh cremation pyre & marigold: rel = 'H' or 'S'
      // 4. Buddhist monastic incense: rel = 'B'
      // 5. East Asian white wreath: fl = 'eas' or secular
      const funeralScenarios = [
        { name: 'Christian Rite', rel: 'C', fl: 'hi', region: 'hi' },
        { name: 'Islamic Janazah', rel: 'M', fl: 'mena', region: 'mena' },
        { name: 'Hindu / Sikh Rite', rel: 'H', fl: 'sa', region: 'sa' },
        { name: 'Buddhist Monastic', rel: 'B', fl: 'eap', region: 'eap' },
        { name: 'East Asian Wreath', rel: '', fl: 'eas', region: 'eap' },
        { name: 'Secular / Non-religious', rel: '', fl: 'sec', region: 'hi' },
        { name: 'Jewish Memorial', rel: 'J', fl: 'hi', region: 'hi' },
      ];

      const themes: ('light' | 'dark')[] = ['light', 'dark'];

      for (const scenario of funeralScenarios) {
        for (const theme of themes) {
          const pal = pxPalette(theme);

          // Vary mourner lists: 0 mourners, 1 mourner, 8 mourners
          const mournerSets: ScenePerson[][] = [
            [],
            [{ role: 'pt', age: 40, sex: 'M', sk: 2 }],
            [
              { role: 'pt', age: 70, sex: 'F', sk: 3 },
              { role: 'kid', age: 45, sex: 'M', sk: 3 },
              { role: 'kid', age: 42, sex: 'F', sk: 2 },
              { role: 'gk', age: 18, sex: 'F', sk: 2 },
              { role: 'gk', age: 15, sex: 'M', sk: 3 },
              { role: 'sib', age: 68, sex: 'M', sk: 3 },
            ],
          ];

          for (let mIdx = 0; mIdx < mournerSets.length; mIdx++) {
            const mourners = mournerSets[mIdx];
            const model: SceneModel = {
              stage: 'e',
              mood: 'low',
              urban: true,
              region: scenario.region,
              home: 'flat',
              people: mourners,
              prop: 'none',
              seed: `funeral_${scenario.name}_${theme}_m${mIdx}`,
              rel: scenario.rel,
              fl: scenario.fl,
              sk: 3,
              car: false,
              moto: false,
            };

            const funeralBuf = pxFuneral(model, pal, mourners);
            assertPixelBufferIntegrity(
              funeralBuf,
              `pxFuneral [${scenario.name}] (theme=${theme}, mourners=${mourners.length})`
            );
          }
        }
      }
    });
  });

  // =========================================================================
  // 3. Edge Cases: Age 0, Age 110, Missing Family, Invalid Codes, Quintiles
  // =========================================================================
  describe('3. Edge Cases & Boundary Stress Testing', () => {
    it('renders character age 0 (newborn bundle) across multiple regions without error', () => {
      const pal = pxPalette('light');
      for (const country of ['NGA', 'JPN', 'BRA', 'USA', 'IND', 'NOR']) {
        const ctx: SceneContext = {
          age: 0,
          sex: 'F',
          countryId: country,
          wealthQuintile: 3,
          urban: true,
        };
        const model = contextToSceneModel(ctx);
        expect(model.people[0].age).toBe(0);

        const buf = pxScene(model, pal);
        assertPixelBufferIntegrity(buf, `Age 0 render for ${country}`);
      }
    });

    it('renders character age 110 (supercentenarian with walking cane and elder hair) without error', () => {
      const pal = pxPalette('dark');
      for (const country of ['ITA', 'JPN', 'FRA', 'RUS', 'CAN']) {
        const ctx: SceneContext = {
          age: 110,
          sex: 'M',
          countryId: country,
          wealthQuintile: 4,
          urban: false,
          timeOfDay: 'evening',
        };
        const model = contextToSceneModel(ctx);
        expect(model.people[0].age).toBe(110);

        const buf = pxScene(model, pal);
        assertPixelBufferIntegrity(buf, `Age 110 render for ${country}`);
      }
    });

    it('handles missing or undefined familyMembers gracefully', () => {
      const pal = pxPalette('light');
      const testContexts: SceneContext[] = [
        { age: 25, sex: 'M', countryId: 'USA', wealthQuintile: 3, familyMembers: undefined },
        { age: 25, sex: 'M', countryId: 'USA', wealthQuintile: 3, familyMembers: [] },
        {
          age: 40,
          sex: 'F',
          countryId: 'DEU',
          wealthQuintile: 2,
          // Family with null/undefined entries
          familyMembers: [
            { role: 'me', age: 40, sex: 'F' },
            undefined as any,
            { role: 'pt', age: 42, sex: 'M' },
          ].filter(Boolean),
        },
      ];

      for (let i = 0; i < testContexts.length; i++) {
        const model = contextToSceneModel(testContexts[i]);
        expect(model.people.length).toBeGreaterThan(0);
        const buf = pxScene(model, pal);
        assertPixelBufferIntegrity(buf, `Missing family test #${i}`);
      }
    });

    it('gracefully handles invalid, empty, or malicious country codes with fallback', () => {
      const invalidCountryCodes = [
        '',
        'INVALID',
        'XYZ',
        '12345',
        '__$$',
        'null',
        'undefined',
        'a'.repeat(200),
      ];

      for (const cid of invalidCountryCodes) {
        const w = skinW(cid);
        expect(w, `skinW for ${cid} must return fallback weights`).toBeDefined();
        expect(w.length).toBe(6);
        expect(w.reduce((a, b) => a + b, 0)).toBe(100);

        const ctx: SceneContext = {
          age: 30,
          sex: 'F',
          countryId: cid,
          wealthQuintile: 3,
        };
        const model = contextToSceneModel(ctx);
        expect(model.region).toBe('hi'); // Default region fallback

        const buf = pxScene(model, pxPalette('light'));
        assertPixelBufferIntegrity(buf, `Invalid country code "${cid}" render`);
      }
    });

    it('resiliently handles extreme wealth quintiles (0, 10, -5, NaN, 999)', () => {
      const extremeQuintiles = [0, 10, -5, -1, 6, 99, 999, NaN];

      for (const q of extremeQuintiles) {
        const ctx: SceneContext = {
          age: 35,
          sex: 'M',
          countryId: 'SWE',
          wealthQuintile: q,
          urban: true,
        };
        const model = contextToSceneModel(ctx);
        expect(model.home).toBeTruthy();

        const buf = pxScene(model, pxPalette('dark'));
        assertPixelBufferIntegrity(buf, `Extreme quintile ${q} render`);
      }
    });

    it('resiliently handles unrecognized jobs, vehicles, pets, and unknown moment strings', () => {
      const strangeContext: SceneContext = {
        age: 29,
        sex: 'M',
        countryId: 'BRA',
        wealthQuintile: 3,
        jobId: 'intergalactic_overlord_nonexistent',
        vehicleType: 'hyperloop_capsule' as any,
        petType: 't_rex' as any,
        petType2: 'dragon' as any,
        moment: 'supernova_explosion_nonexistent:xyz',
        mood: 'wild_mood' as any,
        timeOfDay: 'dimension_x' as any,
      };

      const model = contextToSceneModel(strangeContext);
      expect(model.prop).toBe('none'); // Safe fallback

      const pal = pxPalette('light');
      const buf = pxScene(model, pal);
      assertPixelBufferIntegrity(buf, 'Strange parameters scene buffer');

      // Parallax layer compositor
      const layers = pxSceneLayers(model, pal);
      assertPixelBufferIntegrity(layers.sky, 'Strange params sky layer');
      assertPixelBufferIntegrity(layers.back, 'Strange params back layer');
      assertPixelBufferIntegrity(layers.mid, 'Strange params mid layer');
      assertPixelBufferIntegrity(layers.front, 'Strange params front layer');
    });

    it('validates mock canvas rendering path with renderPixelScene', () => {
      // Mock Canvas 2D context
      const mockImageData = {
        data: new Uint8ClampedArray(PX.W * PX.H * 4),
        width: PX.W,
        height: PX.H,
      };

      const mockCtx: any = {
        canvas: { width: PX.W, height: PX.H },
        createImageData: () => mockImageData,
        putImageData: (imgData: any) => {
          expect(imgData.data.length).toBe(PX.W * PX.H * 4);
          // Check that alpha channel is 255 for all pixels
          for (let i = 3; i < imgData.data.length; i += 4) {
            expect(imgData.data[i]).toBe(255);
          }
        },
        clearRect: () => {},
        drawImage: () => {},
      };

      // Test standard scene
      renderPixelScene(mockCtx, {
        age: 22,
        sex: 'F',
        countryId: 'RUS',
        wealthQuintile: 3,
      });

      // Test deceased funeral scene
      renderPixelScene(mockCtx, {
        age: 85,
        sex: 'M',
        countryId: 'EGY',
        wealthQuintile: 2,
        isDeceased: true,
        religionId: 'M',
      });
    });
  });
});
