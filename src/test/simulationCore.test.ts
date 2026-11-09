import { describe, it, expect } from "vitest";
import {
  generateBirth,
  calculateAnnualMortality,
  selectCauseOfDeath,
  clampStats,
  determineLifeStage,
  stepYear,
} from "../engine/simulationCore";
import { PRNG } from "../engine/prng";

describe("Simulation Core (Birth Lottery, Multi-Hazard Mortality, Stepping)", () => {
  describe("Birth Lottery", () => {
    it("is completely deterministic given the same seed", () => {
      const prng1 = new PRNG(424242);
      const prng2 = new PRNG(424242);

      const char1 = generateBirth({ seed: 424242 }, prng1);
      const char2 = generateBirth({ seed: 424242 }, prng2);

      expect(char1.country.id).toBe(char2.country.id);
      expect(char1.sex).toBe(char2.sex);
      expect(char1.name).toBe(char2.name);
      expect(char1.stats).toEqual(char2.stats);
      expect(char1.wealth).toEqual(char2.wealth);
    });

    it("respects explicit country and sex overrides", () => {
      const prng = new PRNG(12345);
      const char = generateBirth(
        { seed: 12345, countryId: "JPN", sex: "F" },
        prng
      );

      expect(char.country.id).toBe("JPN");
      expect(char.sex).toBe("F");
      expect(char.age).toBe(0);
      expect(char.stage).toBe("baby");
      expect(char.isAlive).toBe(true);
    });

    it("initializes stats strictly within [0, 100]", () => {
      const prng = new PRNG(999);
      for (let i = 0; i < 50; i++) {
        const char = generateBirth({ seed: i }, prng);
        expect(char.stats.health).toBeGreaterThanOrEqual(0);
        expect(char.stats.health).toBeLessThanOrEqual(100);
        expect(char.stats.happiness).toBeGreaterThanOrEqual(0);
        expect(char.stats.happiness).toBeLessThanOrEqual(100);
        expect(char.stats.smarts).toBeGreaterThanOrEqual(0);
        expect(char.stats.smarts).toBeLessThanOrEqual(100);
        expect(char.stats.social).toBeGreaterThanOrEqual(0);
        expect(char.stats.social).toBeLessThanOrEqual(100);
      }
    });

    it("assigns valid socioeconomic quintile [1..5] and world percentile", () => {
      const prng = new PRNG(777);
      const char = generateBirth({ seed: 777 }, prng);

      expect(char.wealth.quintile).toBeGreaterThanOrEqual(1);
      expect(char.wealth.quintile).toBeLessThanOrEqual(5);
      expect(char.wealth.percentile).toBeGreaterThanOrEqual(0.0);
      expect(char.wealth.percentile).toBeLessThanOrEqual(1.0);
      expect(char.wealth.worldPct).toBeGreaterThanOrEqual(0.0);
      expect(char.wealth.worldPct).toBeLessThanOrEqual(1.0);
    });
  });

  describe("Annual Mortality Multi-Hazard Check", () => {
    it("increases mortality hazard for unhealthy characters", () => {
      const baseChar = generateBirth({ seed: 1, countryId: "RUS", sex: "M" });
      baseChar.age = 45;

      const healthyChar = {
        ...baseChar,
        stats: { ...baseChar.stats, health: 95 },
      };
      const unhealthyChar = {
        ...baseChar,
        stats: { ...baseChar.stats, health: 30 },
      };

      const healthyMort = calculateAnnualMortality(healthyChar);
      const unhealthyMort = calculateAnnualMortality(unhealthyChar);

      expect(unhealthyMort.combinedProbability).toBeGreaterThan(
        healthyMort.combinedProbability
      );
    });

    it("reflects socioeconomic wealth gradient (poorer has higher hazard)", () => {
      const baseChar = generateBirth({ seed: 2, countryId: "USA", sex: "M" });
      baseChar.age = 50;

      const richChar = {
        ...baseChar,
        wealth: { ...baseChar.wealth, quintile: 5 },
      };
      const poorChar = {
        ...baseChar,
        wealth: { ...baseChar.wealth, quintile: 1 },
      };

      const richMort = calculateAnnualMortality(richChar);
      const poorMort = calculateAnnualMortality(poorChar);

      expect(poorMort.combinedProbability).toBeGreaterThan(
        richMort.combinedProbability
      );
    });

    it("elevates mortality for 18+ tobacco smokers (RR ≈ 2.6)", () => {
      const baseChar = generateBirth({ seed: 3, countryId: "RUS", sex: "M" });
      baseChar.age = 40;

      const nonSmoker = {
        ...baseChar,
        flags: { ...baseChar.flags, smoker: false },
      };
      const smoker = {
        ...baseChar,
        flags: { ...baseChar.flags, smoker: true },
      };

      const nonSmokerMort = calculateAnnualMortality(nonSmoker);
      const smokerMort = calculateAnnualMortality(smoker);

      expect(smokerMort.combinedProbability).toBeGreaterThan(
        nonSmokerMort.combinedProbability * 1.5
      );
    });

    it("elevates mortality for 18+ alcoholics", () => {
      const baseChar = generateBirth({ seed: 4, countryId: "RUS", sex: "M" });
      baseChar.age = 35;

      const nonAlcoholic = {
        ...baseChar,
        flags: { ...baseChar.flags, alcoholic: false },
      };
      const alcoholic = {
        ...baseChar,
        flags: { ...baseChar.flags, alcoholic: true },
      };

      const nonAlcMort = calculateAnnualMortality(nonAlcoholic);
      const alcMort = calculateAnnualMortality(alcoholic);

      expect(alcMort.combinedProbability).toBeGreaterThan(
        nonAlcMort.combinedProbability * 2.0
      );
    });

    it("elevates mortality 2x for substance abuse / narcotics", () => {
      const baseChar = generateBirth({ seed: 5, countryId: "USA", sex: "M" });
      baseChar.age = 28;

      const cleanChar = {
        ...baseChar,
        flags: { ...baseChar.flags, drug: false },
      };
      const drugChar = {
        ...baseChar,
        flags: { ...baseChar.flags, drug: true },
      };

      const cleanMort = calculateAnnualMortality(cleanChar);
      const drugMort = calculateAnnualMortality(drugChar);

      expect(drugMort.combinedProbability).toBeGreaterThan(
        cleanMort.combinedProbability * 1.5
      );
    });

    it("elevates hazard 1.3x for untreated conditions", () => {
      const baseChar = generateBirth({ seed: 6, countryId: "CHN", sex: "M" });
      baseChar.age = 55;

      const healthyChar = {
        ...baseChar,
        conditions: { hypertension: { treated: true, onsetAge: 50 } },
      };
      const untreatedChar = {
        ...baseChar,
        conditions: { hypertension: { treated: false, onsetAge: 50 } },
      };

      const treatedMort = calculateAnnualMortality(healthyChar);
      const untreatedMort = calculateAnnualMortality(untreatedChar);

      expect(untreatedMort.combinedProbability).toBeGreaterThan(
        treatedMort.combinedProbability
      );
    });

    it("guarantees 100% mortality at age 110", () => {
      const baseChar = generateBirth({ seed: 7, countryId: "JPN", sex: "F" });
      baseChar.age = 110;

      const mort = calculateAnnualMortality(baseChar);
      expect(mort.combinedProbability).toBe(1.0);
    });
  });

  describe("Cause of Death Selector", () => {
    it("selects valid cause from 33 catalog matching context", () => {
      const prng = new PRNG(101);
      const char = generateBirth({ seed: 101, countryId: "RUS", sex: "M" });
      char.age = 65;

      const cause = selectCauseOfDeath(char, prng);
      expect(cause).toBeDefined();
      expect(cause.code).toBeDefined();
      expect(cause.ru).toBeTruthy();
      expect(cause.category).toBeTruthy();
    });

    it("strongly triggers overdose for drug users", () => {
      const prng = new PRNG(202);
      const char = generateBirth({ seed: 202, countryId: "USA", sex: "M" });
      char.age = 25;
      char.flags.drug = true;

      let odCount = 0;
      const trials = 100;
      for (let i = 0; i < trials; i++) {
        const cause = selectCauseOfDeath(char, prng);
        if (cause.code === "od") odCount++;
      }
      expect(odCount).toBeGreaterThan(15);
    });
  });

  describe("Annual Progression & Stat Clamping", () => {
    it("clamps stats strictly to [0, 100] via clampStats", () => {
      const clamped = clampStats({
        health: 150,
        happiness: -25,
        smarts: 105,
        social: -5,
      });

      expect(clamped.health).toBe(100);
      expect(clamped.happiness).toBe(0);
      expect(clamped.smarts).toBe(100);
      expect(clamped.social).toBe(0);
    });

    it("transitions life stages accurately across ages", () => {
      const char = generateBirth({ seed: 303 });
      expect(determineLifeStage(2, char)).toBe("baby");
      expect(determineLifeStage(10, char)).toBe("school");
      expect(determineLifeStage(25, char)).toBe("adult");
      expect(determineLifeStage(70, char)).toBe("elder");
    });

    it("advances living character year-by-year with focus effects", () => {
      const prng = new PRNG(404);
      let char = generateBirth({ seed: 404, countryId: "RUS", sex: "F" }, prng);
      const initialAge = char.age;

      const { nextState, events } = stepYear(char, "study", prng);
      expect(nextState.age).toBe(initialAge + 1);
      expect(nextState.year).toBe(char.year + 1);
      expect(events.length).toBeGreaterThanOrEqual(1);
    });

    it("handles death termination and permanently stops progression", () => {
      const prng = new PRNG(505);
      const char = generateBirth({ seed: 505, countryId: "CAF", sex: "M" }, prng);
      // Force extreme age guaranteed to die
      char.age = 110;

      const step1 = stepYear(char, "health", prng);
      expect(step1.nextState.isAlive).toBe(false);
      expect(step1.nextState.deathCause).toBeDefined();
      expect(step1.nextState.eulogy).toBeTruthy();

      // Subsequent steps do nothing to dead character
      const step2 = stepYear(step1.nextState, "health", prng);
      expect(step2.nextState.isAlive).toBe(false);
      expect(step2.nextState.age).toBe(110);
      expect(step2.events).toHaveLength(0);
    });
  });
});
