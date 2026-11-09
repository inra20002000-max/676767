import { describe, it, expect, beforeEach } from "vitest";
import { lifeTable, clearLifeTableCache, OLDEST } from "../engine/lifeTable";
import { COUNTRIES_BY_ID } from "../data/countries";
import type { CountryDemographics } from "../types/demographics";

describe("Life Table Calibrator (Gompertz-Makeham 50-Step Bisection)", () => {
  beforeEach(() => {
    clearLifeTableCache();
  });

  it("converges to target life expectancy within 1e-5 precision for benchmark countries", () => {
    const testCases: { id: string; sex: "M" | "F" }[] = [
      { id: "RUS", sex: "M" },
      { id: "RUS", sex: "F" },
      { id: "USA", sex: "M" },
      { id: "USA", sex: "F" },
      { id: "CHN", sex: "M" },
      { id: "CHN", sex: "F" },
      { id: "IND", sex: "M" },
      { id: "IND", sex: "F" },
      { id: "NGA", sex: "M" },
      { id: "NGA", sex: "F" },
      { id: "JPN", sex: "M" },
      { id: "JPN", sex: "F" },
      { id: "CAF", sex: "M" },
      { id: "CAF", sex: "F" },
    ];

    for (const { id, sex } of testCases) {
      const country = COUNTRIES_BY_ID[id];
      expect(country).toBeDefined();

      const result = lifeTable(country, sex);
      const targetE0 = sex === "F" ? country.le + country.gap * 0.49 : country.le - country.gap * 0.51;

      expect(result.q).toHaveLength(111);
      expect(result.l).toHaveLength(112);
      expect(result.e0).toBeCloseTo(targetE0, 4);

      // Verify numerical integration matches target within 1e-4
      let survivorship = 1.0;
      let integratedE0 = 0.0;
      for (let y = 0; y <= 110; y++) {
        const deaths = survivorship * result.q[y];
        integratedE0 += (y === 0) ? (survivorship - 0.85 * deaths) : (survivorship - 0.5 * deaths);
        survivorship -= deaths;
      }
      expect(integratedE0).toBeCloseTo(targetE0, 4);
    }
  });

  it("enforces infant mortality boundaries and sex scale factor", () => {
    const rus = COUNTRIES_BY_ID["RUS"];
    const maleLT = lifeTable(rus, "M");
    const femLT = lifeTable(rus, "F");

    // Male infant mortality has sexScale 1.08, Female has 0.92
    const expectedMaleQ0 = Math.min(0.25, (rus.im / 1000) * 1.08);
    const expectedFemQ0 = Math.min(0.25, (rus.im / 1000) * 0.92);

    expect(maleLT.q[0]).toBeCloseTo(expectedMaleQ0, 6);
    expect(femLT.q[0]).toBeCloseTo(expectedFemQ0, 6);
    expect(maleLT.q[0]).toBeGreaterThan(femLT.q[0]);

    // High infant mortality country cap at 0.25
    const syntheticHighIm: CountryDemographics = {
      ...rus,
      id: "TEST_HIGH_IM",
      im: 350, // Extremely high, should cap at 0.25
      u5: 450,
    };
    const highLT = lifeTable(syntheticHighIm, "M");
    expect(highLT.q[0]).toBeLessThanOrEqual(0.25);
  });

  it("enforces guaranteed termination at age 110", () => {
    const country = COUNTRIES_BY_ID["USA"];
    const lt = lifeTable(country, "M");

    // q[110] must be exactly 1.0 (certain death)
    expect(lt.q[110]).toBe(1.0);

    // Survivorship l_0 is 1.0
    expect(lt.l[0]).toBe(1.0);

    // After age 110, survivorship l[111] must drop to zero (l[111] = l[110] * (1 - 1.0) = 0)
    expect(lt.l[111]).toBe(0.0);
  });

  it("exhibits adult mortality increase and proper Gompertz-Makeham dynamics", () => {
    const country = COUNTRIES_BY_ID["JPN"];
    const lt = lifeTable(country, "F");

    // Adulthood mortality increases monotonically with age
    expect(lt.q[80]).toBeGreaterThan(lt.q[60]);
    expect(lt.q[60]).toBeGreaterThan(lt.q[40]);
    expect(lt.q[40]).toBeGreaterThan(lt.q[20]);

    // Check old-age deceleration helper
    const decel100M = OLDEST(100, "M");
    const decel105M = OLDEST(105, "M");
    expect(decel100M).toBe(0.5);
    expect(decel105M).toBeGreaterThan(decel100M);
    expect(decel105M).toBeLessThanOrEqual(0.7);
  });

  it("caches calibrated life tables for identical country and sex", () => {
    const country = COUNTRIES_BY_ID["DEU"];
    const lt1 = lifeTable(country, "M");
    const lt2 = lifeTable(country, "M");

    // Exact same reference from cache
    expect(lt1).toBe(lt2);

    clearLifeTableCache();
    const lt3 = lifeTable(country, "M");
    expect(lt3).not.toBe(lt1);
    expect(lt3.e0).toBeCloseTo(lt1.e0, 6);
  });

  it("generates detailed age-by-age life table records with remaining life expectancy", () => {
    const country = COUNTRIES_BY_ID["RUS"];
    const lt = lifeTable(country, "M");

    expect(lt.records).toBeDefined();
    expect(lt.records).toHaveLength(111);

    const rec0 = lt.records![0];
    expect(rec0.age).toBe(0);
    expect(rec0.lx).toBe(1.0);
    expect(rec0.ex).toBeCloseTo(lt.e0, 2);

    const rec65 = lt.records![65];
    expect(rec65.age).toBe(65);
    expect(rec65.ex).toBeGreaterThan(5);
    expect(rec65.ex).toBeLessThan(rec0.ex);
  });
});
