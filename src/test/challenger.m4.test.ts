import { describe, it, expect } from 'vitest';
import { generateBirth } from '../engine/simulationCore';
import { stepYear, resolveDecisionChoice, FOCUS_DEFINITIONS } from '../engine/lifeStages';
import { computeLifeArchetype } from '../components/CanvasShareModal';
import { COUNTRIES } from '../data/countries';
import type { FocusType } from '../types/simulation';

describe('Challenger Milestone 4 Adversarial & Stress Testing Suite', () => {
  describe('1. Pacing & 50-Year Rapid Step Stress Test', () => {
    it('executes 50 rapid sequential yearly steps maintaining all mathematical invariants', () => {
      let char = generateBirth({ seed: 777, mode: 'birth' });
      expect(char.age).toBe(0);
      expect(char.isAlive).toBe(true);

      const cooldowns = new Set<string>();
      let yearsAdvanced = 0;
      const allFocuses: FocusType[] = Object.keys(FOCUS_DEFINITIONS) as FocusType[];

      while (yearsAdvanced < 50) {
        if (!char.isAlive) {
          // Rebirth to continue 50-year test
          char = generateBirth({ seed: 777 + yearsAdvanced, mode: 'birth' });
        }

        const focus = allFocuses[yearsAdvanced % allFocuses.length];
        const res = stepYear(char, focus, undefined, cooldowns);
        yearsAdvanced++;

        // Invariant 1: Age advances strictly by 1
        expect(res.nextState.age).toBe(char.age + 1);

        // Invariant 2: Year advances strictly by 1
        expect(res.nextState.year).toBe(char.year + 1);

        // Invariant 3: Core attributes clamped [0, 100]
        expect(res.nextState.stats.health).toBeGreaterThanOrEqual(0);
        expect(res.nextState.stats.health).toBeLessThanOrEqual(100);
        expect(res.nextState.stats.happiness).toBeGreaterThanOrEqual(0);
        expect(res.nextState.stats.happiness).toBeLessThanOrEqual(100);
        expect(res.nextState.stats.smarts).toBeGreaterThanOrEqual(0);
        expect(res.nextState.stats.smarts).toBeLessThanOrEqual(100);
        expect(res.nextState.stats.social).toBeGreaterThanOrEqual(0);
        expect(res.nextState.stats.social).toBeLessThanOrEqual(100);

        // Invariant 4: No NaN or Infinity in financial variables
        expect(Number.isFinite(res.nextState.wealth.incomeUSD)).toBe(true);
        expect(Number.isFinite(res.nextState.wealth.netWorthUSD)).toBe(true);
        expect(Number.isFinite(res.nextState.wealth.worldPct)).toBe(true);
        expect(res.nextState.wealth.worldPct).toBeGreaterThanOrEqual(0);
        expect(res.nextState.wealth.worldPct).toBeLessThanOrEqual(1);

        // Invariant 5: If decision emitted, test immediate choice resolution
        if (res.decision && res.nextState.isAlive) {
          cooldowns.add(res.decision.id);
          expect(res.decision.options.length).toBeGreaterThanOrEqual(2);
          const firstOpt = res.decision.options[0];
          const outcome = resolveDecisionChoice(res.nextState, res.decision, firstOpt.id);
          expect(outcome.outcomeText).toBeTruthy();
          char = outcome.nextState;
        } else {
          char = res.nextState;
        }
      }

      expect(yearsAdvanced).toBe(50);
    });

    it('verifies that decision cards and death properly flag auto-play pause requirements', () => {
      // Run multiple seeds until both decision and death are encountered
      let decisionFound = false;
      let deathFound = false;

      for (let seed = 1000; seed < 1100 && (!decisionFound || !deathFound); seed++) {
        let char = generateBirth({ seed, mode: 'birth' });
        const cooldowns = new Set<string>();

        for (let year = 0; year < 90 && char.isAlive; year++) {
          const res = stepYear(char, 'work', undefined, cooldowns);
          if (res.decision && res.nextState.isAlive) {
            decisionFound = true;
            // Decision requirement: MUST pause auto-play (App.tsx: setIsTurbo(false))
            expect(res.decision.id).toBeTruthy();
            expect(res.decision.title).toBeTruthy();
            expect(res.decision.options.length).toBeGreaterThan(0);
          }
          if (!res.nextState.isAlive) {
            deathFound = true;
            // Death requirement: MUST pause auto-play and provide death cause
            expect(res.nextState.deathCause).toBeDefined();
            expect(res.nextState.deathCause?.ru).toBeTruthy();
            break;
          }
          char = res.nextState;
        }
      }

      expect(decisionFound, 'At least one decision card must be emitted during seeds').toBe(true);
      expect(deathFound, 'At least one death event must occur during seed runs').toBe(true);
    });
  });

  describe('2. Canvas Archetype Generator Stress Test', () => {
    it('evaluates life archetypes across 100 varied characters with valid hex colors and non-empty metadata', () => {
      const knownArchetypes = new Set([
        'Гений из трущоб',
        'Олигарх',
        'Долгожитель',
        'Выживший',
        'Философ',
        'Странник Земли',
      ]);

      const encountered = new Set<string>();

      for (let seed = 1; seed <= 100; seed++) {
        let char = generateBirth({ seed, mode: 'birth' });
        // Simulate arbitrary lifespan
        const ageTarget = (seed * 17) % 95;
        char = {
          ...char,
          age: ageTarget,
          stats: {
            health: (seed * 13) % 101,
            happiness: (seed * 19) % 101,
            smarts: (seed * 23) % 101,
            social: (seed * 29) % 101,
          },
          wealth: {
            ...char.wealth,
            quintile: ((seed % 5) + 1) as 1 | 2 | 3 | 4 | 5,
            incomeUSD: seed * 1200,
            netWorthUSD: seed * 5000,
            worldPct: Math.min(0.99, (seed % 100) / 100),
          },
          flags: {
            ...char.flags,
            ...(seed % 7 === 0 ? { inPrison: true } : {}),
          },
        };

        const archetype = computeLifeArchetype(char);
        expect(knownArchetypes.has(archetype.name)).toBe(true);
        expect(archetype.desc.length).toBeGreaterThan(5);
        expect(archetype.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        encountered.add(archetype.name);
      }

      // Assert diverse distribution
      expect(encountered.size).toBeGreaterThanOrEqual(4);
    });
  });

  describe('3. Multi-Country Baseline Consistency for UI', () => {
    it('verifies all 172 countries have valid Russian names, codes, and demographic markers', () => {
      expect(COUNTRIES.length).toBe(172);

      COUNTRIES.forEach((c) => {
        expect(c.id).toMatch(/^[A-Z]{3}$/);
        expect(c.ru).toBeTruthy();
        expect(c.le).toBeGreaterThan(40);
        expect(c.le).toBeLessThan(95);
        expect(c.b).toBeGreaterThan(0);
        expect(c.pop).toBeGreaterThan(0);
      });
    });
  });
});
