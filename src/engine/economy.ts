import type { CountryDemographics } from "../types/demographics";
import { COUNTRIES } from "../data/countries";

// ============================================================================
// Statistical Normal Distribution Approximations (Beasley-Springer-Moro)
// ============================================================================

/**
 * Rational Chebyshev / Beasley-Springer-Moro approximation of the inverse
 * standard normal cumulative distribution function Phi^-1(p).
 * Accurate to within 1e-9 across (0, 1).
 */
export function invNorm(p: number): number {
  const a = [
    -39.69683028665376,
    220.9460984245205,
    -275.9285104469687,
    138.357751867269,
    -30.66479806614716,
    2.506628277459239,
  ];
  const b = [
    -54.47609879822406,
    161.5858368580409,
    -155.6989798598866,
    66.80131188771972,
    -13.28068155288572,
  ];
  const c = [
    -0.007784894002430293,
    -0.3223964580411365,
    -2.400758277161838,
    -2.549732539343734,
    4.374664141464968,
    2.938163982698783,
  ];
  const d = [
    0.007784695709041462,
    0.3224671290700398,
    2.445134137142996,
    3.754408661907416,
  ];

  const pLow = 0.02425;
  if (p <= 0) return -8.0;
  if (p >= 1) return 8.0;

  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }

  if (p > 1 - pLow) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return (
      -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }

  const r = p - 0.5;
  const r2 = r * r;
  return (
    (((((a[0] * r2 + a[1]) * r2 + a[2]) * r2 + a[3]) * r2 + a[4]) * r2 + a[5]) *
    r /
    (((((b[0] * r2 + b[1]) * r2 + b[2]) * r2 + b[3]) * r2 + b[4]) * r2 + 1)
  );
}

/**
 * Standard normal cumulative distribution function Phi(z).
 * Accurate to within 7.5e-8.
 */
export function normCdf(z: number): number {
  const a = 1 / (1 + 0.2316419 * Math.abs(z));
  const n =
    0.3989423 *
    Math.exp((-z * z) / 2) *
    a *
    (0.3193815 +
      a * (-0.3565638 + a * (1.781478 + a * (-1.821256 + a * 1.330274))));
  return z > 0 ? 1 - n : n;
}

// ============================================================================
// Lognormal Income Distribution Calibrated by Gini & GDP PPP
// ============================================================================

/**
 * Calculates national income lognormal standard deviation (sigma)
 * calibrated from country Gini index (gi) via:
 * G = 2 * Phi(sigma / sqrt(2)) - 1  =>  sigma = sqrt(2) * Phi^-1((G + 1) / 2).
 * Includes regional informal economy adjustments for developing regions.
 */
export function sigmaOf(country: CountryDemographics): number {
  let gini = country.gi;
  if (
    ["ssa", "sa", "mena"].includes(country.p) ||
    (country.p === "eap" && country.id !== "CHN")
  ) {
    gini += 0.07; // Regional informal economy adjustment
  }
  gini = Math.max(0.22, Math.min(0.68, gini));
  return Math.SQRT2 * invNorm((gini + 1) / 2);
}

/**
 * Country-specific income calibration scaling factor.
 */
export function incK(country: CountryDemographics): number {
  return country.ik ?? 1.0;
}

/**
 * Evaluates individual annual household income in international PPP USD
 * for an individual at a given national quantile p in [0.003, 0.997].
 * E[X] = PPP * 0.9, median = exp(mu), mu = ln(E[X]) - sigma^2 / 2.
 */
export function incomeAt(country: CountryDemographics, quantile: number): number {
  const sigma = sigmaOf(country);
  const clampedP = Math.max(0.003, Math.min(0.997, quantile));
  const scale = incK(country);
  const meanIncome = country.ppp * scale * 0.9;
  return meanIncome * Math.exp(sigma * invNorm(clampedP) - (sigma * sigma) / 2);
}

/**
 * Evaluates national percentile rank [0.0, 1.0] corresponding to a given
 * annual income in international PPP USD.
 */
export function pctOfIncome(country: CountryDemographics, incomePPP: number): number {
  const sigma = sigmaOf(country);
  const scale = incK(country);
  const meanIncome = country.ppp * scale * 0.9;
  const mu = Math.log(Math.max(1, meanIncome)) - (sigma * sigma) / 2;
  return normCdf((Math.log(Math.max(1, incomePPP)) - mu) / sigma);
}

// Global cached population sum across all 172 countries
let cachedTotalGlobalPop = 0;

/**
 * Evaluates global wealth/income percentile rank across all 8 billion humans
 * living on Earth today.
 * Sums country.pop * pctOfIncome(country, incomePPP) / totalGlobalPopulation.
 */
export function worldPct(incomePPP: number): number {
  if (cachedTotalGlobalPop === 0) {
    for (const c of COUNTRIES) {
      cachedTotalGlobalPop += c.pop;
    }
  }
  if (cachedTotalGlobalPop === 0) return 0.5;

  let cumulativePopulationBelow = 0;
  for (const c of COUNTRIES) {
    cumulativePopulationBelow += c.pop * pctOfIncome(c, incomePPP);
  }
  return Math.max(0, Math.min(1, cumulativePopulationBelow / cachedTotalGlobalPop));
}

// ============================================================================
// Purchasing Power Parity (PPP) & Price Level Ratio (PLR)
// ============================================================================

/**
 * Price level ratio (PLR): cost of living relative to international USD.
 */
export function plr(country: CountryDemographics): number {
  return Math.max(0.22, Math.min(1.25, 0.11 * Math.sqrt(country.ppp / 1000)));
}

/**
 * Converts nominal USD to international purchasing power parity (PPP) USD.
 */
export function nominalToPPP(country: CountryDemographics, nominalUSD: number): number {
  return nominalUSD / plr(country);
}

/**
 * Converts international PPP USD to nominal USD.
 */
export function pppToNominal(country: CountryDemographics, pppUSD: number): number {
  return pppUSD * plr(country);
}

// ============================================================================
// Quintiles & Wealth Brackets
// ============================================================================

export interface QuintileBoundaries {
  q1: number; // 20th percentile boundary
  q2: number; // 40th percentile boundary
  q3: number; // 60th percentile boundary
  q4: number; // 80th percentile boundary
}

/**
 * Computes national quintile threshold boundaries for a country.
 */
export function getQuintileBoundaries(country: CountryDemographics): QuintileBoundaries {
  return {
    q1: incomeAt(country, 0.2),
    q2: incomeAt(country, 0.4),
    q3: incomeAt(country, 0.6),
    q4: incomeAt(country, 0.8),
  };
}

/**
 * Maps a percentile in [0.0, 1.0] to a quintile bucket [1..5].
 */
export function getQuintileFromPercentile(percentile: number): number {
  if (percentile <= 0.2) return 1;
  if (percentile <= 0.4) return 2;
  if (percentile <= 0.6) return 3;
  if (percentile <= 0.8) return 4;
  return 5;
}
