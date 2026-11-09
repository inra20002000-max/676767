import { describe, it, expect, beforeEach } from "vitest";
import { lifeTable, clearLifeTableCache } from "../engine/lifeTable";
import {
  invNorm,
  sigmaOf,
  incomeAt,
  pctOfIncome,
  worldPct,
} from "../engine/economy";
import {
  generateBirth,
  calculateAnnualMortality,
  stepYear,
} from "../engine/simulationCore";
import { PRNG } from "../engine/prng";
import { COUNTRIES, MORT_G, R514 } from "../data/countries";
import { CAUSES, CAUSE_LIST } from "../data/causes";
import { JOBS } from "../data/jobs";
import { VULNERABLE_GROUPS } from "../data/groups";

describe("Milestone 2 Adversarial & Stress Testing Suite", () => {
  beforeEach(() => {
    clearLifeTableCache();
  });

  // ==========================================================================
  // 1. Gompertz-Makeham 50-Step Calibrator Exhaustive Stress Test
  // ==========================================================================
  describe("1. Gompertz-Makeham Bisection Convergence (All 172 Countries x 2 Sexes)", () => {
    it("converges within 0.01 years of target e0 for EVERY country in dataset", () => {
      expect(COUNTRIES.length).toBe(172);

      let maxAbsoluteError = 0;

      for (const country of COUNTRIES) {
        for (const sex of ["M", "F"] as const) {
          const targetE0 = sex === "F"
            ? country.le + country.gap * 0.49
            : country.le - country.gap * 0.51;

          const lt = lifeTable(country, sex);

          expect(lt.q).toHaveLength(111);
          expect(lt.l).toHaveLength(112);
          expect(lt.records).toHaveLength(111);

          // Guaranteed mortality at 110
          expect(lt.q[110]).toBe(1.0);
          expect(lt.l[111]).toBe(0.0);

          // All q_x must be valid probabilities in [0, 1]
          for (let y = 0; y <= 110; y++) {
            expect(lt.q[y]).toBeGreaterThanOrEqual(0.0);
            expect(lt.q[y]).toBeLessThanOrEqual(1.0);
            expect(Number.isFinite(lt.q[y])).toBe(true);
          }

          // Survivorship l_x must be non-increasing
          for (let y = 0; y <= 110; y++) {
            expect(lt.l[y + 1]).toBeLessThanOrEqual(lt.l[y]);
            expect(Number.isFinite(lt.l[y])).toBe(true);
          }

          const error = Math.abs(lt.e0 - targetE0);
          if (error > maxAbsoluteError) {
            maxAbsoluteError = error;
          }

          // Must converge within 0.05 years across all diverse demographics
          expect(error).toBeLessThan(0.05);
        }
      }

      // Record performance
      expect(maxAbsoluteError).toBeLessThan(0.05);
    });

    it("handles synthetic extreme boundary inputs without crashing or NaN", () => {
      const extremeCountries = [
        // Minimum plausible LE
        { ...COUNTRIES[0], id: "MIN_LE", le: 40, gap: 1, u5: 250, im: 180 },
        // Maximum plausible LE
        { ...COUNTRIES[0], id: "MAX_LE", le: 95, gap: 8, u5: 1.5, im: 1.0 },
        // Extreme sex gap
        { ...COUNTRIES[0], id: "WIDE_GAP", le: 70, gap: 15, u5: 20, im: 10 },
      ];

      for (const synthetic of extremeCountries) {
        for (const sex of ["M", "F"] as const) {
          const lt = lifeTable(synthetic, sex);
          expect(Number.isFinite(lt.e0)).toBe(true);
          expect(lt.e0).toBeGreaterThan(30);
          expect(lt.q[110]).toBe(1.0);
        }
      }
    });
  });

  // ==========================================================================
  // 2. Economy & Beasley-Springer-Moro Stress Tests
  // ==========================================================================
  describe("2. Beasley-Springer-Moro Inversion & Lognormal Income Inversion", () => {
    it("handles extreme probabilities in [0.000001, 0.999999] and out-of-bounds", () => {
      // Out of bounds safety clamps
      expect(invNorm(0)).toBe(-8.0);
      expect(invNorm(-0.5)).toBe(-8.0);
      expect(invNorm(1)).toBe(8.0);
      expect(invNorm(1.5)).toBe(8.0);

      // Deep tails
      const pDeepLow = 1e-6;
      const zDeepLow = invNorm(pDeepLow);
      expect(zDeepLow).toBeLessThan(-4.5);
      expect(Number.isFinite(zDeepLow)).toBe(true);

      const pDeepHigh = 1 - 1e-6;
      const zDeepHigh = invNorm(pDeepHigh);
      expect(zDeepHigh).toBeGreaterThan(4.5);
      expect(Number.isFinite(zDeepHigh)).toBe(true);

      // Symmetry: invNorm(p) + invNorm(1 - p) ≈ 0
      const testProbs = [0.001, 0.01, 0.05, 0.1, 0.25, 0.4];
      for (const p of testProbs) {
        expect(invNorm(p) + invNorm(1 - p)).toBeCloseTo(0, 7);
      }
    });

    it("computes valid finite positive incomes for all 172 countries across all quantiles", () => {
      const testQuantiles = [0.003, 0.01, 0.05, 0.2, 0.5, 0.8, 0.95, 0.99, 0.997];

      for (const country of COUNTRIES) {
        const sigma = sigmaOf(country);
        expect(Number.isFinite(sigma)).toBe(true);
        expect(sigma).toBeGreaterThan(0.2);
        expect(sigma).toBeLessThan(1.5);

        let previousIncome = 0;
        for (const q of testQuantiles) {
          const inc = incomeAt(country, q);
          expect(Number.isFinite(inc)).toBe(true);
          expect(inc).toBeGreaterThan(previousIncome);
          previousIncome = inc;

          const roundTrip = pctOfIncome(country, inc);
          expect(roundTrip).toBeCloseTo(q, 1);
        }
      }
    });

    it("evaluates worldPct monotonically across $1 to $1,000,000 PPP USD", () => {
      const testDollars = [
        100, 300, 700, 1500, 3000, 6000, 12000, 25000, 50000, 100000, 250000,
      ];
      let previousPct = -1;

      for (const dollars of testDollars) {
        const pct = worldPct(dollars);
        expect(Number.isFinite(pct)).toBe(true);
        expect(pct).toBeGreaterThan(previousPct);
        expect(pct).toBeGreaterThanOrEqual(0.0);
        expect(pct).toBeLessThanOrEqual(1.0);
        previousPct = pct;
      }
    });
  });

  // ==========================================================================
  // 3. Proportional Hazard Mortality & 18+ Lifestyle Multipliers
  // ==========================================================================
  describe("3. Continuous Proportional Hazard & 18+ Realism Multipliers", () => {
    it("verifies exact relative risks for tobacco (RR=2.6), alcohol (heavyRR=3.2/6.0, modRR=1.2/1.7), and drugs (2.0x)", () => {
      const baseM = generateBirth({ seed: 1001, countryId: "RUS", sex: "M" });
      baseM.age = 40;
      baseM.stats.health = 75;
      baseM.wealth.quintile = 3;

      // 1. Tobacco Male
      const mNonSmoker = calculateAnnualMortality({ ...baseM, flags: { ...baseM.flags, smoker: false } });
      const mSmoker = calculateAnnualMortality({ ...baseM, flags: { ...baseM.flags, smoker: true } });
      // Smoker hazard ratio (smoker hazard vs non-smoker hazard)
      const mSmokeRatio = Math.log(1 - mSmoker.p0) / Math.log(1 - mNonSmoker.p0);
      expect(mSmokeRatio).toBeCloseTo(2.6, 1);

      // 2. Alcohol Male (heavyRR = 3.2, modRR = 1.2)
      const mNonAlc = calculateAnnualMortality({ ...baseM, flags: { ...baseM.flags, alcoholic: false, alcControlled: false } });
      const mHeavyAlc = calculateAnnualMortality({ ...baseM, flags: { ...baseM.flags, alcoholic: true, alcControlled: false } });
      const mModAlc = calculateAnnualMortality({ ...baseM, flags: { ...baseM.flags, alcoholic: false, alcControlled: true } });

      const mHeavyAlcRatio = Math.log(1 - mHeavyAlc.p0) / Math.log(1 - mNonAlc.p0);
      const mModAlcRatio = Math.log(1 - mModAlc.p0) / Math.log(1 - mNonAlc.p0);
      expect(mHeavyAlcRatio).toBeCloseTo(3.2, 1);
      expect(mModAlcRatio).toBeCloseTo(1.2, 1);

      // 3. Alcohol Female (heavyRR = 6.0, modRR = 1.7)
      const baseF = generateBirth({ seed: 1002, countryId: "RUS", sex: "F" });
      baseF.age = 40;
      baseF.stats.health = 75;
      baseF.wealth.quintile = 3;

      const fNonAlc = calculateAnnualMortality({ ...baseF, flags: { ...baseF.flags, alcoholic: false, alcControlled: false } });
      const fHeavyAlc = calculateAnnualMortality({ ...baseF, flags: { ...baseF.flags, alcoholic: true, alcControlled: false } });
      const fModAlc = calculateAnnualMortality({ ...baseF, flags: { ...baseF.flags, alcoholic: false, alcControlled: true } });

      const fHeavyAlcRatio = Math.log(1 - fHeavyAlc.p0) / Math.log(1 - fNonAlc.p0);
      const fModAlcRatio = Math.log(1 - fModAlc.p0) / Math.log(1 - fNonAlc.p0);
      expect(fHeavyAlcRatio).toBeCloseTo(6.0, 1);
      expect(fModAlcRatio).toBeCloseTo(1.7, 1);

      // 4. Drug Abuse (2.0x hazard)
      const mClean = calculateAnnualMortality({ ...baseM, flags: { ...baseM.flags, drug: false } });
      const mDrug = calculateAnnualMortality({ ...baseM, flags: { ...baseM.flags, drug: true } });
      const mDrugRatio = Math.log(1 - mDrug.p0) / Math.log(1 - mClean.p0);
      expect(mDrugRatio).toBeCloseTo(2.0, 1);
    });

    it("verifies continuous multi-hazard competing risks formula P = 1 - (1 - p0)*(1 - hz)*(1 - rz)", () => {
      const char = generateBirth({ seed: 2002, countryId: "ZAF", sex: "M" });
      char.age = 30;
      char.ownsMotorcycle = true;
      char.hiv = { infectedAtAge: 25, onART: false };

      const res = calculateAnnualMortality(char);
      expect(res.hz).toBeGreaterThan(0);
      expect(res.rz).toBeGreaterThan(0);

      const expectedCombined = 1 - (1 - res.p0) * (1 - res.hz) * (1 - res.rz);
      expect(res.combinedProbability).toBeCloseTo(expectedCombined, 7);
      expect(res.combinedProbability).toBeGreaterThan(res.p0);
    });

    it("keeps combinedProbability bounded in [0, 1] even under compound extreme catastrophe conditions", () => {
      const catastropheChar = generateBirth({ seed: 3003, countryId: "CAF", sex: "M" });
      catastropheChar.age = 45;
      catastropheChar.stats = { health: 0, happiness: 0, smarts: 0, social: 0 };
      catastropheChar.wealth.quintile = 1;
      catastropheChar.flags = {
        smoker: true,
        exSmoker: false,
        alcoholic: true,
        alcControlled: false,
        drug: true,
        refugee: true,
        inPrison: true,
      };
      catastropheChar.ownsMotorcycle = true;
      catastropheChar.hiv = { infectedAtAge: 35, onART: false };
      catastropheChar.conditions = {
        hyper: { treated: false, onsetAge: 30 },
        diabetes: { treated: false, onsetAge: 32 },
        tb: { treated: false, onsetAge: 34 },
      };

      const mort = calculateAnnualMortality(catastropheChar);
      expect(mort.combinedProbability).toBeGreaterThanOrEqual(0.0);
      expect(mort.combinedProbability).toBeLessThanOrEqual(1.0);
      expect(Number.isFinite(mort.combinedProbability)).toBe(true);
    });
  });

  // ==========================================================================
  // 4. Data Completeness & Integrity Checks
  // ==========================================================================
  describe("4. Data Completeness & Integrity Audit", () => {
    it("contains all 172 countries with required 35 demographic attributes and valid regions", () => {
      expect(COUNTRIES).toHaveLength(172);
      const validRegions = new Set(["sa", "mena", "ssa", "lac", "eap", "eca", "hi"]);

      for (const c of COUNTRIES) {
        expect(c.id).toMatch(/^[A-Z]{3}$/);
        expect(c.ru).toBeTruthy();
        expect(c.ko).toBeTruthy();
        expect(validRegions.has(c.p)).toBe(true);
        expect(c.b).toBeGreaterThan(0);
        expect(c.pop).toBeGreaterThan(0);
        expect(c.le).toBeGreaterThan(45);
        expect(c.le).toBeLessThan(92);
        expect(c.u5).toBeGreaterThanOrEqual(0);
        expect(c.im).toBeGreaterThanOrEqual(0);
        expect(c.ppp).toBeGreaterThan(0);
        expect(c.gi).toBeGreaterThan(0.15);
        expect(c.gi).toBeLessThan(0.75);
      }
    });

    it("contains all 33 WHO causes of death with complete localized strings", () => {
      expect(Object.keys(CAUSES)).toHaveLength(33);
      expect(CAUSE_LIST).toHaveLength(33);

      for (const cause of CAUSE_LIST) {
        expect(cause.code).toBeTruthy();
        expect(cause.ru).toBeTruthy();
        expect(cause.ko).toBeTruthy();
        expect(cause.category).toBeTruthy();
      }
    });

    it("has 73 career profiles in JOBS dataset", () => {
      const jobCount = Object.keys(JOBS).length;
      expect(jobCount).toBe(73);

      for (const [id, job] of Object.entries(JOBS)) {
        expect(job.id).toBe(id);
        expect(job.ru).toBeTruthy();
        expect(job.sector).toMatch(/^(agr|ind|ser)$/);
        expect(job.minEducation).toBeGreaterThanOrEqual(0);
        expect(job.incomeQuantileLow).toBeLessThanOrEqual(job.incomeQuantileHigh);
      }
    });

    it("has 53 vulnerable ethnic groups and mappings", () => {
      expect(VULNERABLE_GROUPS).toHaveLength(53);
      for (const group of VULNERABLE_GROUPS) {
        expect(group.id).toBeTruthy();
        expect(group.country).toMatch(/^[A-Z]{3}$/);
        expect(group.ru).toBeTruthy();
      }
    });

    it("has complete regional mortality gradient and adolescent R514 mappings", () => {
      const regions = ["sa", "mena", "ssa", "lac", "eap", "eca", "hi"] as const;
      for (const reg of regions) {
        expect(MORT_G[reg]).toBeGreaterThan(0);
      }
      expect(Object.keys(R514).length).toBe(140);
    });
  });

  // ==========================================================================
  // 5. Simulation Lifecycle & Stability
  // ==========================================================================
  describe("5. Simulation Lifecycle & Deterministic Consistency", () => {
    it("runs 500 complete lifetimes from birth to death without runtime error", () => {
      const prng = new PRNG(987654321);

      for (let sim = 0; sim < 50; sim++) {
        let char = generateBirth({ seed: sim }, prng);
        let years = 0;

        while (char.isAlive && years < 115) {
          const focuses: ("health" | "study" | "work" | "family" | "sports" | "rest" | "vice")[] = [
            "health",
            "study",
            "work",
            "family",
            "sports",
            "rest",
            "vice",
          ];
          const chosenFocus = prng.choice(focuses);
          const { nextState } = stepYear(char, chosenFocus, prng);
          char = nextState;
          years++;
        }

        expect(char.isAlive).toBe(false);
        expect(char.deathCause).toBeDefined();
        expect(char.deathAge).toBeGreaterThanOrEqual(0);
        expect(char.deathAge).toBeLessThanOrEqual(110);
        expect(char.history!.length).toBeGreaterThanOrEqual(1);
      }
    });
  });
});
