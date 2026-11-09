import type { CountryDemographics, CauseOfDeath } from "./demographics";
import type { CompanionLife } from "./events";

// ============================================================================
// Simulation Seeds & Inputs
// ============================================================================

export interface SimulationSeed {
  seed: string | number;
  countryId?: string;
  sex?: "M" | "F";
  mode?: "birth" | "pop";
  year?: number;
}

// ============================================================================
// Life Stages & Annual Focus Categories
// ============================================================================

export type LifeStage = "baby" | "school" | "kidwork" | "service" | "adult" | "elder";

export type FocusType =
  | "study"
  | "work"
  | "health"
  | "social"
  | "crime"
  | "substance"
  | "family"
  | "hobby"
  | "military"
  | "religion"
  | "politics"
  | "travel"
  | "art"
  | "money"
  | "rest"
  // Legacy aliases for backward compatibility:
  | "romance"
  | "hobbies"
  | "wealth"
  | "sports"
  | "spirituality"
  | "adventure"
  | "social_life"
  | "creativity"
  | "vice";

// ============================================================================
// Core Character Attributes & Stats
// ============================================================================

export interface CharacterStats {
  health: number;    // 0 to 100 (Physical fitness & health resistance)
  happiness: number; // 0 to 100 (Mental well-being & emotional health)
  smarts: number;    // 0 to 100 (Knowledge, education & cognitive capacity)
  social: number;    // 0 to 100 (Family, friendship & community bonds)
}

// ============================================================================
// Socioeconomic & Financial Tracking
// ============================================================================

export interface WealthState {
  quintile: number;   // 1 (poorest 20%) to 5 (richest 20%)
  percentile: number; // National income percentile [0.0, 1.0]
  incomeUSD: number;  // Current annual income in international PPP USD
  netWorthUSD: number;// Accumulated net worth in international PPP USD
  worldPct: number;   // Global wealth/income percentile across 8 billion humans
}

// ============================================================================
// Lifestyle & Risk Flags (including 18+ Realism Loops)
// ============================================================================

export interface LifestyleFlags {
  smoker: boolean;
  exSmoker: boolean;
  alcoholic: boolean;
  alcControlled: boolean;
  drug: boolean;
  refugee: boolean;
  inPrison: boolean;
  ownsMotorcycle?: boolean;
  hasTreatedCondition?: boolean;
  [key: string]: boolean | number | undefined;
}

// ============================================================================
// Chronic Conditions & HIV Progression
// ============================================================================

export interface HealthCondition {
  treated: boolean;
  onsetAge: number;
}

export interface HIVState {
  infectedAtAge: number;
  onART: boolean;
}

// ============================================================================
// Chronicle Events & Decision Cards
// ============================================================================

export interface LifeHistoryEvent {
  age: number;
  text: string;
  sourceOrFact?: string | null;
  category?: "milestone" | "health" | "crisis" | "decision" | "general" | "death";
}

export interface DecisionChoice {
  key: string;
  label: string;
  note?: string | null;
  effect?: Partial<CharacterStats>;
}

export interface DecisionCard {
  id: string;
  question: string;
  about?: string;
  fact?: string | null;
  choices: DecisionChoice[];
}

// ============================================================================
// Comprehensive Character State (M2 ↔ M3 ↔ M4 Contract)
// ============================================================================

export interface CharacterState {
  id: string;
  name: string;
  age: number;
  sex: "M" | "F";
  country: CountryDemographics;
  city?: string;
  year: number;
  birthYear: number;
  stage: LifeStage;
  stats: CharacterStats;
  wealth: WealthState;
  flags: LifestyleFlags;
  chronicIllnesses: string[];
  conditions?: Record<string, HealthCondition>;
  hiv?: HIVState | null;
  isAlive: boolean;
  deathCause?: CauseOfDeath;
  deathAge?: number;
  currentJob?: string;
  jobName?: string;
  education?: string;
  educationLevel?: number;
  inSchool?: boolean;
  partnered?: boolean;
  married?: boolean;
  children?: number;
  householdSize?: number;
  ownsMotorcycle?: boolean;
  serveLeft?: number;
  isRetired?: boolean;
  eulogy?: string;
  longevityPercentile?: number;
  wealthPercentile?: number;
  history?: LifeHistoryEvent[];
  companions?: CompanionLife[];
}

// ============================================================================
// Step Function Contract
// ============================================================================

export interface YearStepResult {
  nextState: CharacterState;
  events: LifeHistoryEvent[];
  decision?: DecisionCard;
}
