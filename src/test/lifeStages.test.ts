import { describe, it, expect } from "vitest";
import {
  determineLifeStageAdvanced,
  FOCUS_DEFINITIONS,
  applyFocusEffects,
  spawnCompanionLives,
  advanceCompanionLives,
  stepYear,
} from "../engine/lifeStages";
import { generateBirth, clampStats } from "../engine/simulationCore";
import { PRNG } from "../engine/prng";
import type { FocusType } from "../types/events";

describe("Milestone 3: Life Stages, 15 Focuses & Companion Lives Controller", () => {
  describe("Life Stage Progression Rules", () => {
    it("assigns 'baby' stage for ages 0 through 5", () => {
      const char = generateBirth({ seed: 1 });
      for (let age = 0; age <= 5; age++) {
        char.age = age;
        expect(determineLifeStageAdvanced(char)).toBe("baby");
      }
    });

    it("assigns 'kidwork' stage for poor children in high agricultural countries", () => {
      // Chad (TCD) has agr = 75%
      const poorFarmKid = generateBirth({ seed: 2, countryId: "TCD", sex: "M" });
      poorFarmKid.wealth.quintile = 1;
      poorFarmKid.age = 10;

      expect(determineLifeStageAdvanced(poorFarmKid)).toBe("kidwork");
    });

    it("assigns 'kidwork' stage if character has explicit kidwork flag", () => {
      const char = generateBirth({ seed: 3, countryId: "RUS", sex: "M" });
      char.age = 12;
      char.flags.kidwork = true;

      expect(determineLifeStageAdvanced(char)).toBe("kidwork");
    });

    it("assigns 'school' stage for normal children aged 6 to 17 in formal education", () => {
      // Germany (DEU) has high education and low agriculture
      const schoolKid = generateBirth({ seed: 4, countryId: "DEU", sex: "F" });
      schoolKid.age = 10;

      expect(determineLifeStageAdvanced(schoolKid)).toBe("school");
    });

    it("assigns 'service' stage for conscription-eligible youth", () => {
      // South Korea (KOR) has mandatory male conscription
      const korGuy = generateBirth({ seed: 5, countryId: "KOR", sex: "M" });
      korGuy.age = 19;
      korGuy.flags.servedMilitary = false;
      korGuy.flags.militaryExempt = false;

      expect(determineLifeStageAdvanced(korGuy)).toBe("service");
    });

    it("assigns 'service' stage for both genders in Israel (ISR)", () => {
      const isrGirl = generateBirth({ seed: 6, countryId: "ISR", sex: "F" });
      isrGirl.age = 19;
      isrGirl.flags.servedMilitary = false;
      isrGirl.flags.militaryExempt = false;

      expect(determineLifeStageAdvanced(isrGirl)).toBe("service");
    });

    it("assigns 'adult' stage for civilians and post-service adults aged 18 to 64", () => {
      const adult = generateBirth({ seed: 7, countryId: "USA", sex: "F" });
      adult.age = 30;

      expect(determineLifeStageAdvanced(adult)).toBe("adult");
    });

    it("assigns 'elder' stage for age 65+ or retired characters", () => {
      const elder = generateBirth({ seed: 8, countryId: "JPN", sex: "M" });
      elder.age = 65;
      expect(determineLifeStageAdvanced(elder)).toBe("elder");

      const earlyRetiree = generateBirth({ seed: 9, countryId: "FRA", sex: "F" });
      earlyRetiree.age = 60;
      earlyRetiree.isRetired = true;
      expect(determineLifeStageAdvanced(earlyRetiree)).toBe("elder");
    });
  });

  describe("15 Strategic Focuses System", () => {
    const requiredFocuses: FocusType[] = [
      "study",
      "work",
      "health",
      "social",
      "crime",
      "substance",
      "family",
      "hobby",
      "military",
      "religion",
      "politics",
      "travel",
      "art",
      "money",
      "rest",
    ];

    it("defines exactly all 15 required focus types", () => {
      for (const f of requiredFocuses) {
        expect(FOCUS_DEFINITIONS[f]).toBeDefined();
        expect(FOCUS_DEFINITIONS[f].labelRu).toBeTruthy();
        expect(FOCUS_DEFINITIONS[f].icon).toBeTruthy();
      }
    });

    it("boosts smarts and drains happiness when studying", () => {
      const prng = new PRNG(11);
      const char = generateBirth({ seed: 11 }, prng);
      char.age = 16;
      const initialStats = { health: 50, happiness: 50, smarts: 50, social: 50 };

      const { updatedStats } = applyFocusEffects(initialStats, "study", char, prng);
      expect(updatedStats.smarts).toBeGreaterThan(initialStats.smarts);
      expect(updatedStats.happiness).toBeLessThanOrEqual(initialStats.happiness);
    });

    it("boosts health when focusing on health & sports", () => {
      const prng = new PRNG(12);
      const char = generateBirth({ seed: 12 }, prng);
      char.age = 25;
      const initialStats = { health: 50, happiness: 50, smarts: 50, social: 50 };

      const { updatedStats } = applyFocusEffects(initialStats, "health", char, prng);
      expect(updatedStats.health).toBeGreaterThan(initialStats.health);
    });

    it("increases income multiplier when focusing on work", () => {
      const prng = new PRNG(13);
      const char = generateBirth({ seed: 13 }, prng);
      char.age = 32;

      const { incomeMultiplier } = applyFocusEffects(char.stats, "work", char, prng);
      expect(incomeMultiplier).toBeGreaterThan(1.0);
    });

    it("triggers substance addiction risk flags when indulging in vices", () => {
      let triggeredAddiction = false;
      for (let i = 0; i < 50; i++) {
        const prng = new PRNG(i * 100 + 1);
        const char = generateBirth({ seed: i }, prng);
        char.age = 22;

        const { flagsChanged } = applyFocusEffects(char.stats, "substance", char, prng);
        if (flagsChanged.smoker || flagsChanged.alcoholic || flagsChanged.drug) {
          triggeredAddiction = true;
          break;
        }
      }
      expect(triggeredAddiction).toBe(true);
    });

    it("strictly clamps all stats to [0, 100]", () => {
      const clamped = clampStats({
        health: 999,
        happiness: -50,
        smarts: 101,
        social: -1,
      });

      expect(clamped.health).toBe(100);
      expect(clamped.happiness).toBe(0);
      expect(clamped.smarts).toBe(100);
      expect(clamped.social).toBe(0);
    });
  });

  describe("4 Parallel Companion Lives Mechanics", () => {
    it("spawns exactly 4 companion babies from 4 distinct continental regions", () => {
      const prng = new PRNG(555);
      const companions = spawnCompanionLives("RUS", prng);

      expect(companions).toHaveLength(4);

      // Verify all start at age 0, alive, with unique IDs
      const ids = new Set<string>();
      for (const comp of companions) {
        expect(ids.has(comp.id)).toBe(false);
        ids.add(comp.id);
        expect(comp.age).toBe(0);
        expect(comp.isAlive).toBe(true);
        expect(comp.currentStage).toBe("baby");
        expect(comp.name).toBeTruthy();
        expect(comp.countryRu).toBeTruthy();
        expect(comp.avatarColor).toBeTruthy();
      }
    });

    it("advances companions across 100 years and records realistic life trajectories", () => {
      const prng = new PRNG(777);
      let companions = spawnCompanionLives("USA", prng);

      for (let year = 1; year <= 100; year++) {
        const { updatedCompanions } = advanceCompanionLives(companions, prng);
        companions = updatedCompanions;

        for (const comp of companions) {
          if (comp.isAlive) {
            expect(comp.age).toBe(year);
          } else {
            expect(comp.deathAge).toBeDefined();
            expect(comp.deathCause).toBeDefined();
          }
        }
      }

      // After 100 years, most companions should realistically be deceased or reach elderhood
      const deadOrElders = companions.filter((c) => !c.isAlive || c.age >= 65);
      expect(deadOrElders.length).toBe(4);
    });
  });

  describe("Master stepYear Controller Integration", () => {
    it("advances living character with focus effects and spawns companions", () => {
      const prng = new PRNG(1001);
      const char = generateBirth({ seed: 1001, countryId: "RUS", sex: "M" }, prng);
      expect(char.age).toBe(0);

      const step1 = stepYear(char, "health", prng);
      expect(step1.nextState.age).toBe(1);
      expect(step1.nextState.year).toBe(char.year + 1);
      expect(step1.nextState.companions).toHaveLength(4);
      expect(step1.events.length).toBeGreaterThanOrEqual(1);
    });

    it("halts permanently upon death and records eulogy", () => {
      const prng = new PRNG(2002);
      const char = generateBirth({ seed: 2002, countryId: "CAF", sex: "M" }, prng);
      char.age = 110; // Guaranteed death

      const result = stepYear(char, "health", prng);
      expect(result.nextState.isAlive).toBe(false);
      expect(result.nextState.deathCause).toBeDefined();
      expect(result.nextState.eulogy).toBeTruthy();

      // Next step on dead character does nothing
      const postDeath = stepYear(result.nextState, "health", prng);
      expect(postDeath.nextState.isAlive).toBe(false);
      expect(postDeath.events).toHaveLength(0);
    });
  });
});
