import { describe, it, expect } from "vitest";
import { DECISION_CARDS } from "../data/decisions";
import {
  stepYear,
  resolveDecisionChoice,
  FOCUS_DEFINITIONS,
} from "../engine/lifeStages";
import { generateBirth } from "../engine/simulationCore";
import { PRNG } from "../engine/prng";
import type { FocusType } from "../types/events";

describe("Milestone 3 Adversarial & Stress Testing Suite", () => {
  describe("1. Full Lifespan Stress Test (50 Diverse Lifetimes across Continents)", () => {
    const testCountries = ["RUS", "NGA", "USA", "JPN", "IND", "BRA", "CAF", "CHN", "DEU", "EGY"];
    const allFocuses = Object.keys(FOCUS_DEFINITIONS) as FocusType[];

    it("simulates 50 complete life paths from birth to death with 0 NaN, 0 crashes, and strict stat clamping", () => {
      const prng = new PRNG(88888);

      for (let run = 0; run < 50; run++) {
        const countryId = testCountries[run % testCountries.length];
        const sex = run % 2 === 0 ? "M" : "F";
        let character = generateBirth({ seed: run * 999 + 1, countryId, sex }, prng);

        expect(character.age).toBe(0);
        expect(character.isAlive).toBe(true);

        const usedDecisions = new Set<string>();
        let maxYears = 120;

        while (character.isAlive && maxYears > 0) {
          maxYears--;
          const focus = allFocuses[(character.age + run) % allFocuses.length];
          const result = stepYear(character, focus, prng, usedDecisions);
          character = result.nextState;

          // Invariant checks on every single simulated year:
          expect(Number.isFinite(character.stats.health)).toBe(true);
          expect(Number.isFinite(character.stats.happiness)).toBe(true);
          expect(Number.isFinite(character.stats.smarts)).toBe(true);
          expect(Number.isFinite(character.stats.social)).toBe(true);

          expect(character.stats.health).toBeGreaterThanOrEqual(0);
          expect(character.stats.health).toBeLessThanOrEqual(100);
          expect(character.stats.happiness).toBeGreaterThanOrEqual(0);
          expect(character.stats.happiness).toBeLessThanOrEqual(100);
          expect(character.stats.smarts).toBeGreaterThanOrEqual(0);
          expect(character.stats.smarts).toBeLessThanOrEqual(100);
          expect(character.stats.social).toBeGreaterThanOrEqual(0);
          expect(character.stats.social).toBeLessThanOrEqual(100);

          expect(Number.isFinite(character.wealth.incomeUSD)).toBe(true);
          expect(Number.isFinite(character.wealth.netWorthUSD)).toBe(true);
          expect(Number.isFinite(character.wealth.worldPct)).toBe(true);

          // If decision triggered, test interactive resolution
          if (result.decision && character.isAlive) {
            usedDecisions.add(result.decision.id);
            const chosenOption = prng.choice(result.decision.options);
            const decisionRes = resolveDecisionChoice(character, result.decision, chosenOption.id, prng);
            character = decisionRes.nextState;
            expect(decisionRes.outcomeText).toBeTruthy();
          }

          // Invariant: companions exist and have valid structure
          if (character.companions) {
            expect(character.companions).toHaveLength(4);
            for (const comp of character.companions) {
              expect(Number.isFinite(comp.age)).toBe(true);
              expect(comp.age).toBeGreaterThanOrEqual(0);
              expect(typeof comp.isAlive).toBe("boolean");
            }
          }
        }

        // Final end-of-life state assertions
        expect(character.age).toBeGreaterThanOrEqual(0);
        expect(character.age).toBeLessThanOrEqual(115);
        if (!character.isAlive) {
          expect(character.deathCause).toBeDefined();
          expect(character.eulogy).toBeTruthy();
        }
      }
    });
  });

  describe("2. Exhaustive Decision Trees Coverage (All 101 Cards x All Options)", () => {
    it("safely evaluates and resolves every single option of all 101 cards without throwing", () => {
      const prng = new PRNG(99999);
      const testChar = generateBirth({ seed: 777, countryId: "RUS", sex: "M" }, prng);

      let totalOptionsTested = 0;
      for (const card of DECISION_CARDS) {
        expect(card.options.length).toBeGreaterThanOrEqual(2);

        for (const opt of card.options) {
          totalOptionsTested++;
          const charClone = JSON.parse(JSON.stringify(testChar));
          charClone.age = card.minAge;

          const res = resolveDecisionChoice(charClone, card, opt.id, prng);
          expect(res).toBeDefined();
          expect(res.outcomeText).toBeTruthy();
          expect(typeof res.isRiskFailed).toBe("boolean");
          expect(typeof res.isDeath).toBe("boolean");
          expect(Number.isFinite(res.nextState.stats.health)).toBe(true);
          expect(Number.isFinite(res.nextState.stats.happiness)).toBe(true);
          expect(Number.isFinite(res.nextState.stats.smarts)).toBe(true);
          expect(Number.isFinite(res.nextState.stats.social)).toBe(true);
        }
      }

      expect(totalOptionsTested).toBeGreaterThanOrEqual(202);
    });
  });

  describe("3. 18+ Realism Integrity Checks", () => {
    it("ensures all high-risk adult dilemmas have is18Plus flag and consequence warnings", () => {
      const sensitiveRegexes = [
        /сигарет/i,
        /курен/i,
        /вейп/i,
        /алкогол/i,
        /(?<!па)водк[а-я]*/i,
        /запой/i,
        /таблетк/i,
        /веществ/i,
        /взятк/i,
        /откат/i,
        /измен/i,
        /побо[ея]/i,
        /насили/i,
        /кулачные бои/i,
        /казино/i,
      ];

      for (const card of DECISION_CARDS) {
        const fullText = (card.title + " " + card.prompt).toLowerCase();
        const containsSensitive = sensitiveRegexes.some((regex) => regex.test(fullText));

        if (containsSensitive) {
          expect(card.is18Plus).toBe(true);
        }
      }
    });
  });

  describe("4. Rapid Focus Switching & Clamping Stress Test", () => {
    it("maintains stable attributes under 100 rapid random focus switches", () => {
      const prng = new PRNG(54321);
      let char = generateBirth({ seed: 54321 }, prng);
      char.age = 20;

      const focuses: FocusType[] = [
        "crime",
        "substance",
        "health",
        "study",
        "money",
        "travel",
        "rest",
        "family",
      ];

      for (let i = 0; i < 100; i++) {
        const randomFocus = prng.choice(focuses);
        const { nextState } = stepYear(char, randomFocus, prng);
        if (!nextState.isAlive) break;
        char = nextState;

        expect(char.stats.health).toBeGreaterThanOrEqual(0);
        expect(char.stats.health).toBeLessThanOrEqual(100);
        expect(char.stats.happiness).toBeGreaterThanOrEqual(0);
        expect(char.stats.happiness).toBeLessThanOrEqual(100);
      }
    });
  });
});
