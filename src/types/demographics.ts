// ============================================================================
// Geographic, Demographic & Mortality Types
// ============================================================================

export type RegionCode = "sa" | "mena" | "ssa" | "lac" | "eap" | "eca" | "hi";

export interface ConscriptionRules {
  durationMonths: number;
  minAge: number;
  exemptionFlag: string;
}

export interface CountryDemographics {
  id: string;               // ISO 3166-1 alpha-3 country code (e.g. 'RUS', 'USA')
  ru: string;               // Localized Russian country name
  ko: string;               // Korean country name
  p: RegionCode;            // Regional cluster (sa, mena, ssa, lac, eap, eca, hi)
  nm: string;               // Name generator cultural tag (e.g. 'ru:85,ca:15', 'en')
  rel: string;              // Religious distribution string (e.g. 'C70,N16,M12,B0.5,O1.5')
  sp: string;               // Comma-separated popular national sports
  b: number;                // Annual live births (weight in birth lottery)
  pop: number;              // Total population in thousands
  le: number;               // Total life expectancy at birth in years (e0)
  gap: number;              // Female-to-male life expectancy gap in years
  u5: number;               // Under-5 mortality rate per 1,000 live births
  im: number;               // Infant mortality rate (< 1 year) per 1,000 live births
  ppp: number;              // GDP per capita in current international PPP dollars
  gi: number;               // Gini index of income inequality (0.00 to 1.00)
  tfr: number;              // Total fertility rate (births per woman)
  mmr: number;              // Maternal mortality ratio per 100,000 live births
  urb: number;              // Urbanization rate (0 to 100%)
  agr: number;              // Agricultural share of employment (0 to 100%)
  hiv: number;              // Adult HIV prevalence rate (0 to 100%)
  hom: number;              // Homicide rate per 100,000 population
  road: number;             // Road traffic fatality rate per 100,000 population
  mal: number;              // Malaria endemicity factor (0.00 to 1.00)
  net: number;              // Internet penetration percentage (0 to 100%)
  ter: number;              // Tertiary education enrollment rate (0 to 100%)
  eys: number;              // Expected years of schooling
  sm: number;               // Male smoking prevalence (0 to 100%)
  sf: number;               // Female smoking prevalence (0 to 100%)
  oop: number;              // Out-of-pocket health spending share (0 to 100%)
  cm: number;               // Child marriage prevalence under 18 (0 to 100%)
  wh: number | null;        // World Happiness Report ladder score (0.00 to 10.00)
  cs: [number, number, string] | null; // Mandatory conscription [months, min_age, flag]
  war: number;              // Conflict / violence risk factor (0.00 to 1.00)
  mig: string;              // Top emigration destinations (comma-separated ISO3)
  haz: string;              // Natural hazard flags ('Q', 'D', 'F', 'E', 'S', 'H')
  ik?: number;              // Optional income calibration multiplier
}

// 33 WHO & Global Health Causes of Death
export type CauseOfDeathCode =
  | "neo" | "lri" | "diar" | "mal" | "tb" | "hiv" | "oinf" | "nut" | "cong"
  | "ihd" | "str" | "can" | "copd" | "dia" | "kid" | "dem" | "cir" | "ocd"
  | "road" | "hom" | "war" | "drown" | "fall" | "fire" | "inj" | "od"
  | "mat" | "geno" | "disa" | "covid" | "epid" | "pol" | "suic";

export type CauseCategory =
  | "communicable"
  | "ncd"
  | "injury"
  | "maternal"
  | "violence_18plus"
  | "environmental";

export interface CauseDefinition {
  code: CauseOfDeathCode;
  ru: string;
  ko: string;
  en?: string;
  category: CauseCategory;
  note?: string | null;
}

export type CauseOfDeath = CauseDefinition;

export type CauseProbabilities = Partial<Record<CauseOfDeathCode, number>>;

export interface LifeTableRecord {
  age: number;
  qx: number; // Annual death probability q_x for age x in [0..110]
  lx: number; // Proportion of survivors l_x (l_0 = 1.0)
  ex: number; // Expected remaining life years e_x
}

export interface LifeTableResult {
  q: Float64Array; // Length 111: Annual death probability q_x for age x in [0..110]
  l: Float64Array; // Length 112: Survivorship l_x where l_0 = 1.0, l_{x+1} = l_x * (1 - q_x)
  e0: number;      // Calibrated life expectancy at birth
  records?: LifeTableRecord[];
}

export interface AnnualHazardResult {
  p0: number;                  // Baseline mortality hazard modified by health & lifestyle
  hz: number;                  // Competing untreated HIV hazard
  rz: number;                  // Competing road / vehicular hazard
  combinedProbability: number; // 1 - (1 - p0) * (1 - hz) * (1 - rz)
}
