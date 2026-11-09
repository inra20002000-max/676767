import type { CountryDemographics, LifeTableResult, LifeTableRecord } from "../types/demographics";
import { R514 } from "../data/countries";

// Internal life table cache
const LT_CACHE = new Map<string, LifeTableResult>();

/**
 * Clears cached life tables (primarily for testing and cache reset).
 */
export function clearLifeTableCache(): void {
  LT_CACHE.clear();
}

/**
 * Old-age mortality deceleration factor past age 100.
 */
export const OLDEST = (age: number, sex: "M" | "F"): number =>
  Math.min(0.7, (sex === "F" ? 0.39 : 0.5) * Math.exp(0.15 * (age - 100)));

/**
 * Exact 50-step numerical bisection Gompertz-Makeham life table calibrator.
 * Solves parameter b such that integrated e_0 matches country target life expectancy
 * within 10^-12 precision, properly accounting for infant (im) and under-5 (u5) mortality.
 */
export function lifeTable(country: CountryDemographics, sex: "M" | "F"): LifeTableResult {
  const cacheKey = `${country.id}_${sex}`;
  const cached = LT_CACHE.get(cacheKey);
  if (cached) return cached;

  // 1. Target life expectancy for specified sex
  const targetE0 = sex === "F" ? country.le + country.gap * 0.49 : country.le - country.gap * 0.51;
  const sexScale = sex === "F" ? 0.92 : 1.08;

  // 2. Infant mortality rate (age 0)
  const q0 = Math.min(0.25, (country.im / 1000) * sexScale);

  // 3. Under-5 mortality (ages 1 to 4)
  const u5Rate = Math.min(0.35, Math.max(q0 + 0.0005, (country.u5 / 1000) * sexScale));
  const childHazard = -Math.log((1 - u5Rate) / (1 - q0));
  const childMortalities = [0.4, 0.27, 0.19, 0.14].map((w) => 1 - Math.exp(-childHazard * w));

  // 4. Gompertz-Makeham baseline shape parameters
  const c = 0.00025 + 0.000028 * country.u5;
  const f = Math.max(0.085, Math.min(0.112, 0.112 - 0.00016 * country.u5));

  // 5. Adolescent mortality (ages 5 to 14)
  const r514Adjustment = R514[country.id] ?? 0.2;
  const qAdolescent = 1 - Math.pow(1 - Math.min(0.2, (r514Adjustment * country.u5 / 1000) * sexScale), 0.1);

  // 6. Integrator evaluator for trial parameter b
  const evaluateLifeExpectancy = (b: number) => {
    const q = new Float64Array(111);
    q[0] = q0;
    for (let y = 1; y <= 4; y++) {
      q[y] = childMortalities[y - 1];
    }
    for (let y = 5; y <= 110; y++) {
      if (y === 110) {
        q[y] = 1.0; // Inevitable mortality at age 110
      } else if (y < 15) {
        q[y] = qAdolescent;
      } else {
        const hazard = Math.max(c + b * Math.exp(f * (y + 0.5)), OLDEST(y, sex));
        q[y] = Math.min(1.0, 1 - Math.exp(-hazard));
      }
    }

    // Integrate life expectancy: e_0 = sum(l_x - a_x * d_x)
    let survivorship = 1.0;
    let expectedYears = 0.0;
    for (let y = 0; y <= 110; y++) {
      const deaths = survivorship * q[y];
      expectedYears += (y === 0) ? (survivorship - 0.85 * deaths) : (survivorship - 0.5 * deaths);
      survivorship -= deaths;
    }
    return { q, e0: expectedYears };
  };

  // 7. 50-step binary search bisection on ln(b)
  let lowLogB = Math.log(1e-8);
  let highLogB = Math.log(0.05);
  let finalResult: { q: Float64Array; e0: number } = null!;

  for (let step = 0; step < 50; step++) {
    const midLogB = (lowLogB + highLogB) / 2;
    finalResult = evaluateLifeExpectancy(Math.exp(midLogB));
    if (finalResult.e0 > targetE0) {
      lowLogB = midLogB;
    } else {
      highLogB = midLogB;
    }
  }

  // 8. Survivorship array l_x (length 112, l_0 = 1.0)
  const l = new Float64Array(112);
  l[0] = 1.0;
  for (let y = 0; y <= 110; y++) {
    l[y + 1] = l[y] * (1 - finalResult.q[y]);
  }

  // 9. Life table records with ex for each age
  const records: LifeTableRecord[] = [];
  for (let y = 0; y <= 110; y++) {
    let remYears = 0;
    const curL = l[y];
    if (curL > 0) {
      let tempL = curL;
      for (let age = y; age <= 110; age++) {
        const d = tempL * finalResult.q[age];
        remYears += (age === y) ? (tempL - (age === 0 ? 0.85 : 0.5) * d) : (tempL - 0.5 * d);
        tempL -= d;
      }
      remYears /= curL;
    }
    records.push({
      age: y,
      qx: finalResult.q[y],
      lx: l[y],
      ex: remYears,
    });
  }

  const result: LifeTableResult = {
    q: finalResult.q,
    l,
    e0: finalResult.e0,
    records,
  };

  LT_CACHE.set(cacheKey, result);
  return result;
}
