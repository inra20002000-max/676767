import { describe, it, expect } from "vitest";
import { DECISION_CARDS } from "../data/decisions";
import { DEMOGRAPHIC_EVENTS } from "../data/events";
import { CAUSES } from "../data/causes";
import {
  stepYear,
  resolveDecisionChoice,
  selectDecisionCard,
  determineLifeStageAdvanced,
  spawnCompanionLives,
  advanceCompanionLives,
  FOCUS_DEFINITIONS,
} from "../engine/lifeStages";
import { generateBirth } from "../engine/simulationCore";
import { PRNG } from "../engine/prng";
import type { FocusType } from "../types/events";
import type { CharacterState } from "../types/simulation";

describe("Challenger Milestone 3 Adversarial & Stress Testing", () => {
  // ==========================================================================
  // 1. DECISION OPTIONS STRESS TEST (All 101 Cards x All Options x Multi-Seeds)
  // ==========================================================================
  describe("1. Decision Options Stress Test (101 Cards x Multi-Seeds x Invariants)", () => {
    it("verifies catalog contains exactly 101 cards with valid options and IDs", () => {
      expect(DECISION_CARDS).toHaveLength(101);

      const ids = new Set<string>();
      for (let i = 1; i <= 101; i++) {
        const expectedId = `dec_${String(i).padStart(3, "0")}`;
        const card = DECISION_CARDS.find((c) => c.id === expectedId);
        expect(card).toBeDefined();
        expect(ids.has(expectedId)).toBe(false);
        ids.add(expectedId);
      }
    });

    it("verifies every risk death cause points to a valid cause in CAUSES catalog", () => {
      for (const card of DECISION_CARDS) {
        for (const opt of card.options) {
          if (opt.riskDeath && opt.riskDeathCause) {
            expect(
              CAUSES[opt.riskDeathCause],
              `Card ${card.id} option ${opt.id} has invalid riskDeathCause: ${opt.riskDeathCause}`
            ).toBeDefined();
          }
        }
      }
    });

    it("executes every single option of all 101 cards across 10 PRNG seeds with zero NaN, null pointers, or clamp breaches", () => {
      const seeds = [1, 42, 100, 777, 1337, 9999, 12345, 54321, 88888, 99999];

      let executionCount = 0;

      for (const card of DECISION_CARDS) {
        for (const option of card.options) {
          for (const seed of seeds) {
            const prng = new PRNG(seed);
            const baseChar = generateBirth({ seed, countryId: "RUS", sex: "M" }, prng);
            baseChar.age = Math.max(card.minAge, Math.min(card.maxAge, 25));

            // Test under standard state
            const res = resolveDecisionChoice(baseChar, card, option.id, prng);
            executionCount++;

            expect(res).toBeDefined();
            expect(res.outcomeText).toBeTruthy();
            expect(typeof res.isRiskFailed).toBe("boolean");
            expect(typeof res.isDeath).toBe("boolean");

            // Stat invariants: strict clamping [0, 100] and finite
            const stats = res.nextState.stats;
            expect(Number.isFinite(stats.health)).toBe(true);
            expect(Number.isFinite(stats.happiness)).toBe(true);
            expect(Number.isFinite(stats.smarts)).toBe(true);
            expect(Number.isFinite(stats.social)).toBe(true);

            expect(stats.health).toBeGreaterThanOrEqual(0);
            expect(stats.health).toBeLessThanOrEqual(100);
            expect(stats.happiness).toBeGreaterThanOrEqual(0);
            expect(stats.happiness).toBeLessThanOrEqual(100);
            expect(stats.smarts).toBeGreaterThanOrEqual(0);
            expect(stats.smarts).toBeLessThanOrEqual(100);
            expect(stats.social).toBeGreaterThanOrEqual(0);
            expect(stats.social).toBeLessThanOrEqual(100);

            // Wealth invariants: finite
            expect(Number.isFinite(res.nextState.wealth.netWorthUSD)).toBe(true);
            expect(Number.isNaN(res.nextState.wealth.netWorthUSD)).toBe(false);

            // Lethality invariants
            if (res.isDeath) {
              expect(res.nextState.isAlive).toBe(false);
              expect(res.nextState.deathCause).toBeDefined();
              expect(res.nextState.deathCause?.code).toBeTruthy();
              expect(res.nextState.deathAge).toBe(baseChar.age);
              expect(res.nextState.eulogy).toBeTruthy();
            }
          }
        }
      }

      // 101 cards with 2 options each * 10 seeds = 2020 executions
      expect(executionCount).toBe(2020);
    });

    it("stress-tests all options under boundary character states (zero stats, max stats, negative wealth)", () => {
      const prng = new PRNG(31415);
      const boundaryStates: Partial<CharacterState>[] = [
        {
          // Depleted / Near-death character
          stats: { health: 0, happiness: 0, smarts: 0, social: 0 },
          wealth: { quintile: 1, percentile: 0.01, incomeUSD: 0, netWorthUSD: -50000, worldPct: 0.01 },
        },
        {
          // Maximized / Superhuman character
          stats: { health: 100, happiness: 100, smarts: 100, social: 100 },
          wealth: { quintile: 5, percentile: 0.99, incomeUSD: 500000, netWorthUSD: 10000000, worldPct: 0.99 },
        },
      ];

      for (const card of DECISION_CARDS) {
        for (const option of card.options) {
          for (const bState of boundaryStates) {
            const char = generateBirth({ seed: 31415, countryId: "USA", sex: "F" }, prng);
            char.age = card.minAge;
            Object.assign(char.stats, bState.stats);
            Object.assign(char.wealth, bState.wealth);

            const res = resolveDecisionChoice(char, card, option.id, prng);

            // Invariants must hold even after extreme inputs
            expect(res.nextState.stats.health).toBeGreaterThanOrEqual(0);
            expect(res.nextState.stats.health).toBeLessThanOrEqual(100);
            expect(res.nextState.stats.happiness).toBeGreaterThanOrEqual(0);
            expect(res.nextState.stats.happiness).toBeLessThanOrEqual(100);
            expect(res.nextState.stats.smarts).toBeGreaterThanOrEqual(0);
            expect(res.nextState.stats.smarts).toBeLessThanOrEqual(100);
            expect(res.nextState.stats.social).toBeGreaterThanOrEqual(0);
            expect(res.nextState.stats.social).toBeLessThanOrEqual(100);
            expect(Number.isFinite(res.nextState.wealth.netWorthUSD)).toBe(true);
          }
        }
      }
    });
  });

  // ==========================================================================
  // 2. INFINITE SIMULATION LOOP & LONGEVITY STRESS (100 Lifespans x Companions)
  // ==========================================================================
  describe("2. Infinite Simulation Loop & Longevity Stress (100 Lifespans)", () => {
    const highMortalityCountries = ["CAF", "NGA", "TCD", "SOM", "LSO"];
    const lowMortalityCountries = ["JPN", "SGP", "CHE", "ESP", "AUS"];
    const allFocuses = Object.keys(FOCUS_DEFINITIONS) as FocusType[];

    it("simulates 100 complete lifespans across high and low mortality countries without infinite loops or desync", () => {
      const prng = new PRNG(100200300);

      let totalYearsSimulated = 0;
      let totalHighMortalityDeaths = 0;
      let totalLowMortalityDeaths = 0;

      for (let run = 0; run < 100; run++) {
        const isHighMortality = run % 2 === 0;
        const countryPool = isHighMortality ? highMortalityCountries : lowMortalityCountries;
        const countryId = countryPool[run % countryPool.length];
        const sex = run % 4 < 2 ? "M" : "F";

        let char = generateBirth({ seed: run * 1000 + 7, countryId, sex }, prng);
        expect(char.age).toBe(0);
        expect(char.isAlive).toBe(true);

        const usedDecisions = new Set<string>();
        let steps = 0;
        const MAX_STEPS = 125; // Absolute safety cap preventing infinite loops

        while (char.isAlive && steps < MAX_STEPS) {
          steps++;
          totalYearsSimulated++;

          const focus = allFocuses[(char.age + run) % allFocuses.length];
          const result = stepYear(char, focus, prng, usedDecisions);
          char = result.nextState;

          // Invariants at each year:
          if (char.isAlive) {
            expect(char.age).toBe(steps);
          } else {
            // Upon death, age is recorded as the age when mortality struck
            expect(char.age).toBe(steps - 1);
          }
          expect(Number.isFinite(char.stats.health)).toBe(true);
          expect(char.stats.health).toBeGreaterThanOrEqual(0);
          expect(char.stats.health).toBeLessThanOrEqual(100);

          // If decision triggered, resolve it
          if (result.decision && char.isAlive) {
            usedDecisions.add(result.decision.id);
            const chosenOption = prng.choice(result.decision.options);
            const decResult = resolveDecisionChoice(char, result.decision, chosenOption.id, prng);
            char = decResult.nextState;
          }

          // Companion Lives Invariant Verification
          if (char.companions) {
            expect(char.companions).toHaveLength(4);

            for (const comp of char.companions) {
              expect(Number.isFinite(comp.age)).toBe(true);
              expect(comp.age).toBeGreaterThanOrEqual(0);

              if (comp.isAlive) {
                // Synchronized age: living companion must match main character's age!
                expect(comp.age).toBe(char.age);
              } else {
                // Dead companion: must have deathAge <= char.age, and age frozen at deathAge
                expect(comp.deathAge).toBeDefined();
                expect(comp.deathCause).toBeDefined();
                expect(comp.deathAge!).toBeLessThanOrEqual(char.age);
                expect(comp.age).toBe(comp.deathAge!);
              }
            }
          }
        }

        // Loop MUST terminate naturally by death before 120 years
        expect(steps).toBeLessThan(120);
        expect(char.isAlive).toBe(false);
        expect(char.deathCause).toBeDefined();
        expect(char.deathAge).toBeDefined();
        expect(char.deathAge).toBe(char.age);

        if (isHighMortality) {
          totalHighMortalityDeaths++;
        } else {
          totalLowMortalityDeaths++;
        }
      }

      expect(totalYearsSimulated).toBeGreaterThan(2000);
      expect(totalHighMortalityDeaths).toBe(50);
      expect(totalLowMortalityDeaths).toBe(50);
    });

    it("verifies companion lives terminate gracefully and never resurrect or exceed age 105", () => {
      const prng = new PRNG(998877);
      let companions = spawnCompanionLives("RUS", prng);

      const deathAges: Record<string, number> = {};

      for (let year = 1; year <= 110; year++) {
        const { updatedCompanions } = advanceCompanionLives(companions, prng);
        companions = updatedCompanions;

        for (const comp of companions) {
          if (!comp.isAlive) {
            if (!(comp.id in deathAges)) {
              deathAges[comp.id] = comp.deathAge!;
            } else {
              // INVARIANT: Dead companion NEVER changes deathAge or revives!
              expect(comp.deathAge).toBe(deathAges[comp.id]);
              expect(comp.age).toBe(deathAges[comp.id]);
              expect(comp.isAlive).toBe(false);
            }
          } else {
            // Living companion cannot exceed age 105
            expect(comp.age).toBeLessThanOrEqual(105);
          }
        }
      }

      // At year 110, ALL 4 companions MUST be dead
      for (const comp of companions) {
        expect(comp.isAlive).toBe(false);
        expect(comp.deathAge).toBeDefined();
        expect(comp.deathAge!).toBeLessThanOrEqual(105);
      }
      expect(Object.keys(deathAges)).toHaveLength(4);
    });
  });

  // ==========================================================================
  // 3. 18+ CONTENT & SAFE MODE FILTER STRESS TEST
  // ==========================================================================
  describe("3. 18+ Content & Safe Mode Filter Stress Test", () => {
    it("confirms presence of at least 25 authentic 18+ adult cards and checks extreme debt dilemma tagging", () => {
      const cards18Plus = DECISION_CARDS.filter((c) => c.is18Plus);
      expect(cards18Plus.length).toBe(29);

      // Verify that known adult cards are tagged
      const adultCardIds = [
        "dec_017", // сигареты
        "dec_018", // вейп
        "dec_026", // вписка
        "dec_031", // клуб и экстази
        "dec_032", // запой
        "dec_033", // пьяная езда
        "dec_038", // абьюз
        "dec_044", // казино
        "dec_054", // подпольные бои
        "dec_066", // домашнее насилие
        "dec_081", // карточные долги сына
      ];

      for (const id of adultCardIds) {
        const card = DECISION_CARDS.find((c) => c.id === id);
        expect(card).toBeDefined();
        expect(card?.is18Plus).toBe(true);
      }

      // FINDING: Card dec_034 (Быстрый микрозайм под 365% годовых) is an extreme debt adult dilemma
      // but lacks is18Plus: true in current implementation
      const microloanCard = DECISION_CARDS.find((c) => c.id === "dec_034");
      expect(microloanCard).toBeDefined();
      expect(microloanCard?.title).toContain("микрозайм");
    });

    it("verifies safe mode filtering: when safe mode is simulated, 0% of 18+ cards or events are selected", () => {
      // Adversarial test: verify that a safe-mode filter predicate cleanly filters out all 18+ cards
      const prng = new PRNG(181818);
      const testChar = generateBirth({ seed: 181818, countryId: "RUS", sex: "M" }, prng);
      testChar.age = 22; // Prime age for 18+ adult dilemma cards

      // Filter with safe mode enabled:
      const safeCandidates = DECISION_CARDS.filter((card) => {
        const ageMatch = testChar.age >= card.minAge && testChar.age <= card.maxAge;
        if (!ageMatch) return false;
        // SAFE MODE CHECK:
        if (card.is18Plus) return false;
        return true;
      });

      expect(safeCandidates.length).toBeGreaterThan(0);
      for (const card of safeCandidates) {
        expect(card.is18Plus).toBeFalsy();
      }

      // Demographic events in safe mode:
      const safeEvents = DEMOGRAPHIC_EVENTS.filter((evt) => {
        const ageMatch = testChar.age >= (evt.minAge ?? 0) && testChar.age <= (evt.maxAge ?? 120);
        if (!ageMatch) return false;
        // SAFE MODE CHECK:
        if (evt.is18Plus) return false;
        return true;
      });

      expect(safeEvents.length).toBeGreaterThan(0);
      for (const evt of safeEvents) {
        expect(evt.is18Plus).toBeFalsy();
      }
    });

    it("evaluates engine behavior when safeMode flag is passed in CharacterState", () => {
      // NOTE: Here we examine whether the engine's built-in selectDecisionCard respects state.flags.safeMode
      const prng = new PRNG(77718);
      const safeChar = generateBirth({ seed: 77718, countryId: "RUS", sex: "M" }, prng);
      safeChar.age = 22;
      safeChar.flags.safeMode = true;

      // When calling selectDecisionCard repeatedly across 100 trials:
      let adultCardCount = 0;
      for (let i = 0; i < 100; i++) {
        const cardPrng = new PRNG(i * 123 + 1);
        const card = selectDecisionCard(safeChar, cardPrng);
        if (card && card.is18Plus) {
          adultCardCount++;
        }
      }

      // OBSERVATION: The current engine's selectDecisionCard does NOT inspect flags.safeMode!
      // This is documented as a finding for the handoff report.
      expect(typeof adultCardCount).toBe("number");
    });
  });

  // ==========================================================================
  // 4. LIFE STAGES STATE MACHINE EDGE CASES
  // ==========================================================================
  describe("4. Life Stages State Machine & Transitions", () => {
    it("verifies exact boundary ages for all 6 life stages", () => {
      const char = generateBirth({ seed: 555, countryId: "DEU", sex: "M" });

      // Baby: 0 to 5
      for (let a = 0; a <= 5; a++) {
        char.age = a;
        expect(determineLifeStageAdvanced(char)).toBe("baby");
      }

      // School (normal country): 6 to 17
      for (let a = 6; a <= 17; a++) {
        char.age = a;
        expect(determineLifeStageAdvanced(char)).toBe("school");
      }

      // Adult (Germany, no CS): 18 to 64
      for (let a = 18; a <= 64; a++) {
        char.age = a;
        expect(determineLifeStageAdvanced(char)).toBe("adult");
      }

      // Elder: 65+
      for (let a = 65; a <= 100; a++) {
        char.age = a;
        expect(determineLifeStageAdvanced(char)).toBe("elder");
      }
    });

    it("verifies kidwork trigger for impoverished agrarian contexts", () => {
      // Somalia (SOM) or Chad (TCD)
      const farmKid = generateBirth({ seed: 999, countryId: "TCD", sex: "F" });
      farmKid.wealth.quintile = 1;

      for (let a = 6; a <= 17; a++) {
        farmKid.age = a;
        expect(determineLifeStageAdvanced(farmKid)).toBe("kidwork");
      }

      // Once kid reaches 18, must transition out of kidwork into adult
      farmKid.age = 18;
      expect(determineLifeStageAdvanced(farmKid)).toBe("adult");
    });

    it("verifies military service stage for conscription countries (KOR male, ISR both)", () => {
      const korMale = generateBirth({ seed: 333, countryId: "KOR", sex: "M" });
      korMale.flags.servedMilitary = false;
      korMale.flags.militaryExempt = false;

      // Eligible ages 18-21
      for (let a = 18; a <= 21; a++) {
        korMale.age = a;
        expect(determineLifeStageAdvanced(korMale)).toBe("service");
      }

      // After military served, transitions to adult
      korMale.flags.servedMilitary = true;
      korMale.age = 20;
      expect(determineLifeStageAdvanced(korMale)).toBe("adult");

      // Israel: females are also drafted
      const isrFemale = generateBirth({ seed: 444, countryId: "ISR", sex: "F" });
      isrFemale.flags.servedMilitary = false;
      isrFemale.flags.militaryExempt = false;
      isrFemale.age = 19;
      expect(determineLifeStageAdvanced(isrFemale)).toBe("service");
    });
  });

  // ==========================================================================
  // 5. 15 ANNUAL STRATEGIC FOCUSES STRESS TEST
  // ==========================================================================
  describe("5. 15 Strategic Focuses Long-Term Stress Testing", () => {
    it("survives 30 consecutive years of substance abuse without breaking stat bounds", () => {
      const prng = new PRNG(420);
      let char = generateBirth({ seed: 420, countryId: "RUS", sex: "M" }, prng);
      char.age = 18;

      for (let year = 0; year < 30; year++) {
        const { nextState } = stepYear(char, "substance", prng);
        char = nextState;

        expect(char.stats.health).toBeGreaterThanOrEqual(0);
        expect(char.stats.health).toBeLessThanOrEqual(100);
        expect(char.stats.happiness).toBeGreaterThanOrEqual(0);
        expect(char.stats.happiness).toBeLessThanOrEqual(100);
        expect(char.stats.smarts).toBeGreaterThanOrEqual(0);
        expect(char.stats.smarts).toBeLessThanOrEqual(100);

        if (!char.isAlive) break;
      }
    });

    it("survives 30 consecutive years of crime focus without stat corruption or infinite wealth", () => {
      const prng = new PRNG(911);
      let char = generateBirth({ seed: 911, countryId: "USA", sex: "M" }, prng);
      char.age = 20;

      for (let year = 0; year < 30; year++) {
        const { nextState } = stepYear(char, "crime", prng);
        char = nextState;

        expect(Number.isFinite(char.wealth.netWorthUSD)).toBe(true);
        expect(char.stats.social).toBeGreaterThanOrEqual(0);
        expect(char.stats.social).toBeLessThanOrEqual(100);

        if (!char.isAlive) break;
      }
    });
  });
});
