import { describe, it, expect } from "vitest";
import { DEMOGRAPHIC_EVENTS } from "../data/events";
import { selectDemographicEvents } from "../engine/lifeStages";
import { generateBirth } from "../engine/simulationCore";
import { PRNG } from "../engine/prng";
import type { AgeBracket } from "../types/events";

describe("Milestone 3: Demographic Events Catalog & Selection", () => {
  describe("Catalog Integrity & Realism", () => {
    it("contains an extensive catalog of demographic events", () => {
      expect(DEMOGRAPHIC_EVENTS.length).toBeGreaterThanOrEqual(30);
    });

    it("has unique IDs for every demographic event", () => {
      const ids = new Set<string>();
      for (const evt of DEMOGRAPHIC_EVENTS) {
        expect(ids.has(evt.id)).toBe(false);
        ids.add(evt.id);
      }
    });

    it("covers all 8 designated age brackets", () => {
      const requiredBrackets: AgeBracket[] = [
        "0-5",
        "6-12",
        "13-17",
        "18-24",
        "25-34",
        "35-49",
        "50-64",
        "65+",
      ];

      const foundBrackets = new Set(DEMOGRAPHIC_EVENTS.map((e) => e.ageBracket));
      for (const bracket of requiredBrackets) {
        expect(foundBrackets.has(bracket)).toBe(true);
      }
    });

    it("validates that all events have valid probabilities and non-empty text", () => {
      for (const evt of DEMOGRAPHIC_EVENTS) {
        expect(evt.title).toBeTruthy();
        expect(evt.text).toBeTruthy();
        expect(evt.triggerProbability).toBeGreaterThan(0);
        expect(evt.triggerProbability).toBeLessThanOrEqual(1.0);
        if (evt.minAge !== undefined && evt.maxAge !== undefined) {
          expect(evt.minAge).toBeLessThanOrEqual(evt.maxAge);
        }
      }
    });

    it("includes institutional citations (UN, WHO, World Bank, ILO, UNESCO) on key events", () => {
      const eventsWithFootnotes = DEMOGRAPHIC_EVENTS.filter((e) => !!e.footnote);
      expect(eventsWithFootnotes.length).toBeGreaterThanOrEqual(15);

      const hasWHO = eventsWithFootnotes.some((e) => e.footnote!.includes("ВОЗ"));
      const hasUNICEF = eventsWithFootnotes.some((e) => e.footnote!.includes("ЮНИСЕФ"));
      const hasUNESCO = eventsWithFootnotes.some((e) => e.footnote!.includes("ЮНЕСКО"));
      const hasILO = eventsWithFootnotes.some((e) => e.footnote!.includes("МОТ"));
      const hasWorldBank = eventsWithFootnotes.some((e) => e.footnote!.includes("Всемирный банк"));

      expect(hasWHO).toBe(true);
      expect(hasUNICEF).toBe(true);
      expect(hasUNESCO).toBe(true);
      expect(hasILO).toBe(true);
      expect(hasWorldBank).toBe(true);
    });

    it("correctly identifies and flags 18+ adult realism events", () => {
      const adultEvents = DEMOGRAPHIC_EVENTS.filter((e) => e.is18Plus);
      expect(adultEvents.length).toBeGreaterThanOrEqual(6);

      const adultTitles = adultEvents.map((e) => e.title.toLowerCase());
      expect(adultTitles.some((t) => t.includes("сигарет") || t.includes("18+"))).toBe(true);
      expect(adultTitles.some((t) => t.includes("веществ") || t.includes("клубный"))).toBe(true);
      expect(adultTitles.some((t) => t.includes("ездо") || t.includes("навеселе"))).toBe(true);
    });
  });

  describe("Event Selection & Filtering Engine", () => {
    it("selects only events matching the character's age", () => {
      const prng = new PRNG(42);
      const babyChar = generateBirth({ seed: 42, countryId: "NGA", sex: "M" }, prng);
      babyChar.age = 1;

      const events = selectDemographicEvents(babyChar, prng, 5);
      for (const evt of events) {
        expect(evt.minAge ?? 0).toBeLessThanOrEqual(1);
        expect(evt.maxAge ?? 120).toBeGreaterThanOrEqual(1);
      }
    });

    it("respects poverty and regional condition triggers", () => {
      const prng = new PRNG(101);
      // Wealthy Japanese baby (quintile 5)
      const richChar = generateBirth({ seed: 101, countryId: "JPN", sex: "F" }, prng);
      richChar.wealth.quintile = 5;
      richChar.age = 2;

      const events = selectDemographicEvents(richChar, prng, 10);
      // Malnutrition requires low quintile in ssa/sa
      const hasMalnutrition = events.some((e) => e.id === "evt_inf_malnutrition");
      expect(hasMalnutrition).toBe(false);
    });

    it("selects child labor event for poor children in agrarian countries", () => {
      const prng = new PRNG(202);
      // Poor child in Chad (TCD has agr > 70%)
      const poorFarmKid = generateBirth({ seed: 202, countryId: "TCD", sex: "M" }, prng);
      poorFarmKid.wealth.quintile = 1;
      poorFarmKid.age = 9;

      let triggeredCount = 0;
      for (let i = 0; i < 50; i++) {
        const testPRNG = new PRNG(i * 100);
        const events = selectDemographicEvents(poorFarmKid, testPRNG, 5);
        if (events.some((e) => e.id === "evt_kid_labor_farm")) {
          triggeredCount++;
        }
      }
      expect(triggeredCount).toBeGreaterThan(5);
    });
  });
});
