import { describe, it, expect } from "vitest";
import {
  invNorm,
  normCdf,
  sigmaOf,
  incomeAt,
  pctOfIncome,
  worldPct,
  plr,
  nominalToPPP,
  pppToNominal,
  getQuintileBoundaries,
  getQuintileFromPercentile,
} from "../engine/economy";
import { COUNTRIES_BY_ID } from "../data/countries";

describe("Economy Engine (Log-Normal Gini Calibration & World Percentiles)", () => {
  describe("Statistical Normal Approximations", () => {
    it("computes accurate standard normal CDF values", () => {
      expect(normCdf(0)).toBeCloseTo(0.5, 5);
      expect(normCdf(-1.96)).toBeCloseTo(0.025, 3);
      expect(normCdf(1.96)).toBeCloseTo(0.975, 3);
      expect(normCdf(2.576)).toBeCloseTo(0.995, 3);
    });

    it("computes accurate inverse normal CDF values", () => {
      expect(invNorm(0.5)).toBeCloseTo(0.0, 5);
      expect(invNorm(0.025)).toBeCloseTo(-1.96, 2);
      expect(invNorm(0.975)).toBeCloseTo(1.96, 2);
      expect(invNorm(0.001)).toBeLessThan(-3.0);
      expect(invNorm(0.999)).toBeGreaterThan(3.0);
    });

    it("satisfies round-trip inversion invNorm(normCdf(z)) ≈ z", () => {
      const testZ = [-2.5, -1.5, -0.8, 0, 0.4, 1.2, 2.0, 2.8];
      for (const z of testZ) {
        const p = normCdf(z);
        const zReconstructed = invNorm(p);
        expect(zReconstructed).toBeCloseTo(z, 4);
      }
    });
  });

  describe("Gini Inversion & Sigma", () => {
    it("produces strictly positive standard deviation calibrated from Gini", () => {
      const rus = COUNTRIES_BY_ID["RUS"];
      const usa = COUNTRIES_BY_ID["USA"];
      const zaf = COUNTRIES_BY_ID["ZAF"]; // Very high Gini

      const rusSigma = sigmaOf(rus);
      const usaSigma = sigmaOf(usa);
      const zafSigma = sigmaOf(zaf);

      expect(rusSigma).toBeGreaterThan(0.3);
      expect(usaSigma).toBeGreaterThan(rusSigma); // USA higher Gini than RUS
      expect(zafSigma).toBeGreaterThan(usaSigma); // ZAF highest inequality
    });

    it("includes regional informal economy adjustment for SSA/SA/MENA/EAP", () => {
      const ind = COUNTRIES_BY_ID["IND"]; // sa region
      const sigma = sigmaOf(ind);
      expect(sigma).toBeGreaterThan(0.5);
    });
  });

  describe("Income Sampling at National Quantiles", () => {
    it("is strictly monotonic across quantiles", () => {
      const country = COUNTRIES_BY_ID["RUS"];
      const p10 = incomeAt(country, 0.1);
      const p25 = incomeAt(country, 0.25);
      const p50 = incomeAt(country, 0.5);
      const p75 = incomeAt(country, 0.75);
      const p90 = incomeAt(country, 0.9);

      expect(p10).toBeGreaterThan(0);
      expect(p25).toBeGreaterThan(p10);
      expect(p50).toBeGreaterThan(p25);
      expect(p75).toBeGreaterThan(p50);
      expect(p90).toBeGreaterThan(p75);
    });

    it("satisfies round-trip consistency pctOfIncome(country, incomeAt(country, p)) ≈ p", () => {
      const country = COUNTRIES_BY_ID["USA"];
      const quantiles = [0.1, 0.25, 0.5, 0.75, 0.9];

      for (const q of quantiles) {
        const income = incomeAt(country, q);
        const calculatedPercentile = pctOfIncome(country, income);
        expect(calculatedPercentile).toBeCloseTo(q, 2);
      }
    });

    it("computes quintile boundaries correctly", () => {
      const country = COUNTRIES_BY_ID["CHN"];
      const bounds = getQuintileBoundaries(country);

      expect(bounds.q1).toBeLessThan(bounds.q2);
      expect(bounds.q2).toBeLessThan(bounds.q3);
      expect(bounds.q3).toBeLessThan(bounds.q4);
    });

    it("maps percentile to correct quintile bucket 1..5", () => {
      expect(getQuintileFromPercentile(0.05)).toBe(1);
      expect(getQuintileFromPercentile(0.2)).toBe(1);
      expect(getQuintileFromPercentile(0.35)).toBe(2);
      expect(getQuintileFromPercentile(0.5)).toBe(3);
      expect(getQuintileFromPercentile(0.75)).toBe(4);
      expect(getQuintileFromPercentile(0.95)).toBe(5);
    });
  });

  describe("Global Wealth Percentiles Across All 8 Billion Humans (worldPct)", () => {
    it("correctly ranks low, middle, and high incomes globally", () => {
      // Extremely low poverty income ($500 PPP) should be bottom 10-15% globally
      const lowRank = worldPct(500);
      expect(lowRank).toBeGreaterThan(0.0);
      expect(lowRank).toBeLessThan(0.20);

      // Global median income (~$5,000 - $10,000 PPP)
      const midRank = worldPct(8000);
      expect(midRank).toBeGreaterThan(0.40);
      expect(midRank).toBeLessThan(0.75);

      // High income ($60,000 PPP) should be in the global top ~10-15%
      const highRank = worldPct(60000);
      expect(highRank).toBeGreaterThan(0.85);
      expect(highRank).toBeLessThanOrEqual(1.0);
    });

    it("is strictly monotonic with income", () => {
      const incomes = [1000, 3000, 10000, 30000, 80000];
      for (let i = 0; i < incomes.length - 1; i++) {
        expect(worldPct(incomes[i + 1])).toBeGreaterThan(worldPct(incomes[i]));
      }
    });

    it("clamps safely at extreme bounds", () => {
      expect(worldPct(0)).toBeCloseTo(0.0, 1);
      expect(worldPct(10000000)).toBeCloseTo(1.0, 2);
    });
  });

  describe("Purchasing Power Parity (PPP) & Price Level Ratio", () => {
    it("computes reasonable price level ratios", () => {
      const usa = COUNTRIES_BY_ID["USA"];
      const ind = COUNTRIES_BY_ID["IND"];

      const usaPlr = plr(usa);
      const indPlr = plr(ind);

      expect(usaPlr).toBeGreaterThan(indPlr);
      expect(indPlr).toBeGreaterThanOrEqual(0.22);
      expect(usaPlr).toBeLessThanOrEqual(1.25);
    });

    it("supports reversible currency conversions nominalToPPP and pppToNominal", () => {
      const country = COUNTRIES_BY_ID["RUS"];
      const originalPPP = 15000;
      const nominal = pppToNominal(country, originalPPP);
      const reconstructedPPP = nominalToPPP(country, nominal);

      expect(reconstructedPPP).toBeCloseTo(originalPPP, 4);
    });
  });
});
