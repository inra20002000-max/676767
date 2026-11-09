import type { CharacterState, CharacterStats, LifeHistoryEvent } from "./simulation";
import type { CauseOfDeathCode } from "./demographics";

// ============================================================================
// Life Stages & Progression
// ============================================================================

export type LifeStage =
  | "baby"     // Ages 0-5
  | "school"   // Ages 6-17 (Formal education track)
  | "kidwork"  // Ages 6-17 (Child labor in high agrarian / low resource context)
  | "service"  // Ages 18-24 (Mandatory military or civil service)
  | "adult"    // Ages 18-64 (Career, family, active adult life)
  | "elder";   // Ages 65+ (Retirement, golden years)

// ============================================================================
// 15 Strategic Annual Focuses
// ============================================================================

export type FocusType =
  | "study"      // 🎓 Focus on academics, research & skills (+smarts, -happiness)
  | "work"       // 💼 Corporate/manual labor grind (+income, +smarts, -happiness, -health)
  | "health"     // 🥗 Fitness, nutrition & recovery (+health, +happiness)
  | "social"     // 🤝 Networking, friendships & partying (+social, +happiness)
  | "crime"      // 🥷 High-risk illegal ventures (+money, risk of prison/violence)
  | "substance"  // 🚬 Vices, nightlife & escapism (+happiness, -health, addiction risk)
  | "family"     // 🏡 Household care, children & relatives (+social, +happiness, -money)
  | "hobby"      // 🎨 Passion projects, crafts & gaming (+happiness, +smarts)
  | "military"   // 🪖 Defense, discipline & tactical training (+health, military risk)
  | "religion"   // 🕊️ Spiritual practice, inner peace & community (+happiness, +social)
  | "politics"   // 🗳️ Activism, local leadership & debate (+social, +smarts, conflict risk)
  | "travel"     // ✈️ Global wandering & cultural exploration (+happiness, +smarts, -money)
  | "art"        // 🎭 Creative expression & storytelling (+happiness, +smarts)
  | "money"      // 💰 Investments, frugality & trading (+netWorth, -health)
  | "rest";      // 🛌 Relaxation, sleep & burnout recovery (+health, +happiness)

export interface FocusDefinition {
  id: FocusType;
  labelRu: string;
  icon: string;
  descriptionRu: string;
  effectsSummaryRu: string;
  statDeltas: Partial<CharacterStats>;
  moneyMultiplier?: number;
  riskFactor?: number;
}

// ============================================================================
// Consequence Badges (Neo-Brutalist Visual Indicators for Gen Z & Gen Alpha)
// ============================================================================

export type BadgeType = "stat" | "money" | "risk" | "health" | "warning";

export interface ConsequenceBadge {
  text: string; // e.g. "+15 🎓", "-10 💰", "⚠️ Риск 35%", "18+ 🔞", "💀 Риск гибели"
  type: BadgeType;
}

// ============================================================================
// Decision Cards & Interactive Branching Dilemmas
// ============================================================================

export type DecisionCategory =
  | "education"
  | "career"
  | "health"
  | "social"
  | "risk_18plus"
  | "ethics"
  | "family"
  | "lifestyle"
  | "military"
  | "crime"
  | "substance"
  | "art"
  | "religion"
  | "travel"
  | "politics";

export interface DecisionOption {
  id: string;
  label: string;
  description?: string;
  statDeltas?: Partial<CharacterStats>;
  wealthDelta?: number; // One-time balance adjustment in USD PPP
  wealthMultiplier?: number; // Percentage multiplier e.g. 1.15
  riskPercentage?: number; // 0 to 100 chance of negative failure outcome
  riskStatDeltas?: Partial<CharacterStats>;
  riskWealthDelta?: number;
  riskDeath?: boolean;
  riskDeathCause?: CauseOfDeathCode;
  riskOutcomeDescription?: string;
  outcomeDescription?: string;
  badges: ConsequenceBadge[];
  flagModifiers?: Record<string, boolean | number>;
}

export interface DecisionCard {
  id: string;
  title: string;
  prompt: string;
  category: DecisionCategory;
  minAge: number;
  maxAge: number;
  triggerCondition?: (state: CharacterState) => boolean;
  is18Plus?: boolean;
  options: DecisionOption[];
  footnote?: string; // Institutional demographic citation (UN / WHO / World Bank)
}

// ============================================================================
// Demographic Events (Probabilistic Real-World Life Occurrences)
// ============================================================================

export type AgeBracket =
  | "0-5"
  | "6-12"
  | "13-17"
  | "18-24"
  | "25-34"
  | "35-49"
  | "50-64"
  | "65+";

export interface DemographicEvent {
  id: string;
  title: string;
  text: string;
  ageBracket: AgeBracket;
  minAge?: number;
  maxAge?: number;
  triggerProbability: number; // 0.0 to 1.0 baseline yearly probability
  condition?: (state: CharacterState) => boolean;
  effects?: {
    stats?: Partial<CharacterStats>;
    wealthUSD?: number;
    flags?: Record<string, boolean | number>;
    illness?: string;
  };
  footnote?: string; // Authoritative citation (UN, WHO, ILO, World Bank)
  is18Plus?: boolean;
  icon?: string;
}

// ============================================================================
// Parallel Companion Lives (4 babies born at the exact same moment)
// ============================================================================

export interface CompanionLife {
  id: string;
  name: string;
  countryId: string;
  countryRu: string;
  region: string;
  sex: "M" | "F";
  age: number;
  isAlive: boolean;
  currentStage: LifeStage;
  deathCause?: string;
  deathAge?: number;
  majorMilestone?: string;
  avatarColor: string;
  yearlyNotes?: string[];
}

// ============================================================================
// Simulation Step Result with Decisions & Companions
// ============================================================================

export interface EnhancedYearStepResult {
  nextState: CharacterState;
  events: LifeHistoryEvent[];
  triggeredDemographicEvents?: DemographicEvent[];
  decision?: DecisionCard;
  companionUpdates?: {
    companionId: string;
    text: string;
    isAlive: boolean;
    stage: LifeStage;
  }[];
}
