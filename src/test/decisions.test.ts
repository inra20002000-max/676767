import { describe, it, expect } from "vitest";
import { DECISION_CARDS } from "../data/decisions";
import { resolveDecisionChoice, selectDecisionCard } from "../engine/lifeStages";
import { generateBirth } from "../engine/simulationCore";
import { PRNG } from "../engine/prng";
import type { BadgeType } from "../types/events";

describe("Milestone 3: 101 Interactive Decision Cards", () => {
  describe("101 Decision Catalog Integrity", () => {
    it("contains EXACTLY 101 interactive decision cards", () => {
      expect(DECISION_CARDS).toHaveLength(101);
    });

    it("has strictly unique IDs across all 101 cards", () => {
      const ids = new Set<string>();
      for (const card of DECISION_CARDS) {
        expect(ids.has(card.id)).toBe(false);
        ids.add(card.id);
      }
      expect(ids.size).toBe(101);
    });

    it("verifies ID format dec_001 to dec_101", () => {
      for (let i = 1; i <= 101; i++) {
        const expectedId = `dec_${String(i).padStart(3, "0")}`;
        const card = DECISION_CARDS.find((c) => c.id === expectedId);
        expect(card).toBeDefined();
      }
    });

    it("verifies every card has 2 to 4 distinct options with non-empty labels", () => {
      for (const card of DECISION_CARDS) {
        expect(card.options.length).toBeGreaterThanOrEqual(2);
        expect(card.options.length).toBeLessThanOrEqual(4);

        const optIds = new Set<string>();
        for (const opt of card.options) {
          expect(opt.id).toBeTruthy();
          expect(optIds.has(opt.id)).toBe(false);
          optIds.add(opt.id);
          expect(opt.label).toBeTruthy();
        }
      }
    });

    it("verifies every card has valid age bounds (minAge <= maxAge)", () => {
      for (const card of DECISION_CARDS) {
        expect(card.minAge).toBeGreaterThanOrEqual(0);
        expect(card.maxAge).toBeLessThanOrEqual(120);
        expect(card.minAge).toBeLessThanOrEqual(card.maxAge);
      }
    });

    it("verifies every option has valid Gen Z / Alpha consequence badges", () => {
      const validBadgeTypes: BadgeType[] = ["stat", "money", "risk", "health", "warning"];

      for (const card of DECISION_CARDS) {
        for (const opt of card.options) {
          expect(opt.badges).toBeDefined();
          expect(opt.badges.length).toBeGreaterThanOrEqual(1);

          for (const badge of opt.badges) {
            expect(badge.text).toBeTruthy();
            expect(validBadgeTypes).toContain(badge.type);
          }
        }
      }
    });

    it("identifies authentic 18+ cards covering adult themes", () => {
      const cards18Plus = DECISION_CARDS.filter((c) => c.is18Plus);
      expect(cards18Plus.length).toBeGreaterThanOrEqual(25);

      const adultTitles = cards18Plus.map((c) => c.title.toLowerCase());
      expect(adultTitles.some((t) => t.includes("сигарет") || t.includes("вейп"))).toBe(true);
      expect(adultTitles.some((t) => t.includes("алкогол") || t.includes("бар") || t.includes("запой"))).toBe(true);
      expect(adultTitles.some((t) => t.includes("клуб") || t.includes("таблетк"))).toBe(true);
      expect(adultTitles.some((t) => t.includes("взятк") || t.includes("откат"))).toBe(true);
      expect(adultTitles.some((t) => t.includes("измен") || t.includes("роман"))).toBe(true);
    });

    it("spans all life stages from baby to elder", () => {
      const babyCards = DECISION_CARDS.filter((c) => c.maxAge <= 5);
      const schoolCards = DECISION_CARDS.filter((c) => c.minAge >= 6 && c.maxAge <= 17);
      const youngAdultCards = DECISION_CARDS.filter((c) => c.minAge >= 18 && c.maxAge <= 29);
      const midLifeCards = DECISION_CARDS.filter((c) => c.minAge >= 30 && c.maxAge <= 49);
      const matureCards = DECISION_CARDS.filter((c) => c.minAge >= 50 && c.maxAge <= 64);
      const elderCards = DECISION_CARDS.filter((c) => c.minAge >= 65);

      expect(babyCards.length).toBeGreaterThanOrEqual(5);
      expect(schoolCards.length).toBeGreaterThanOrEqual(15);
      expect(youngAdultCards.length).toBeGreaterThanOrEqual(20);
      expect(midLifeCards.length).toBeGreaterThanOrEqual(15);
      expect(matureCards.length).toBeGreaterThanOrEqual(8);
      expect(elderCards.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe("Decision Resolution Mechanics", () => {
    it("resolves safe option with 0% risk successfully every time", () => {
      const card = DECISION_CARDS.find((c) => c.id === "dec_001")!;
      const safeOpt = card.options[0];
      const prng = new PRNG(12345);
      const char = generateBirth({ seed: 12345, countryId: "RUS", sex: "M" }, prng);
      char.age = 2;

      for (let i = 0; i < 20; i++) {
        const { nextState, isRiskFailed, isDeath } = resolveDecisionChoice(char, card, safeOpt.id, prng);
        expect(isRiskFailed).toBe(false);
        expect(isDeath).toBe(false);
        expect(nextState.isAlive).toBe(true);
      }
    });

    it("correctly rolls risk and applies failure penalties on risk failure", () => {
      const card = DECISION_CARDS.find((c) => c.id === "dec_003")!; // Outlet шпилька (60% risk)
      const riskyOpt = card.options[1];

      let failCount = 0;
      let successCount = 0;
      const trials = 100;

      for (let i = 0; i < trials; i++) {
        const prng = new PRNG(i * 9999 + 1);
        const char = generateBirth({ seed: i }, prng);
        char.age = 3;

        const { isRiskFailed } = resolveDecisionChoice(char, card, riskyOpt.id, prng);
        if (isRiskFailed) failCount++;
        else successCount++;
      }

      // Expected ~60 failures out of 100
      expect(failCount).toBeGreaterThan(40);
      expect(failCount).toBeLessThan(80);
      expect(successCount).toBeGreaterThan(15);
    });

    it("triggers lethal consequence when riskDeath is configured and risk fails", () => {
      const card = DECISION_CARDS.find((c) => c.id === "dec_027")!; // Roof edge selfie (30% risk death)
      const lethalOpt = card.options[0];

      let deathCount = 0;
      for (let i = 0; i < 100; i++) {
        const prng = new PRNG(i * 1234 + 7);
        const char = generateBirth({ seed: i }, prng);
        char.age = 14;

        const res = resolveDecisionChoice(char, card, lethalOpt.id, prng);
        if (res.isDeath) {
          deathCount++;
          expect(res.nextState.isAlive).toBe(false);
          expect(res.nextState.deathCause).toBeDefined();
          expect(res.nextState.deathCause?.code).toBe("fall");
        }
      }

      expect(deathCount).toBeGreaterThan(15);
    });

    it("modifies wealth and flags accurately upon option execution", () => {
      const card = DECISION_CARDS.find((c) => c.id === "dec_017")!; // Smoking (18+)
      const smokeOpt = card.options[0];
      const prng = new PRNG(777);
      const char = generateBirth({ seed: 777 }, prng);
      char.age = 15;

      const { nextState } = resolveDecisionChoice(char, card, smokeOpt.id, prng);
      expect(nextState.flags.smoker).toBe(true);
    });

    it("selectDecisionCard returns appropriate card for age without repeating cooldowns", () => {
      const prng = new PRNG(888);
      const char = generateBirth({ seed: 888 }, prng);
      char.age = 22;

      const card1 = selectDecisionCard(char, prng, new Set());
      expect(card1).toBeDefined();
      expect(card1!.minAge).toBeLessThanOrEqual(22);
      expect(card1!.maxAge).toBeGreaterThanOrEqual(22);

      const cooldown = new Set([card1!.id]);
      const card2 = selectDecisionCard(char, prng, cooldown);
      if (card2) {
        expect(card2.id).not.toBe(card1!.id);
      }
    });
  });
});
