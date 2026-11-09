/**
 * Dynamic Family Relational Model & Living Dossier Types
 * Milestone 7: Demographic family graph, parental relationships, siblings, romance & housing
 */

import './simulation';
import './pixelArt';

export type Gender = 'M' | 'F';

export type RelativeBondLevel = 'estranged' | 'distant' | 'normal' | 'warm' | 'inseparable';

export interface BaseFamilyMember {
  id: string;
  name: string;
  sex: Gender;
  age: number;
  isAlive: boolean;
  alive?: boolean; // alias for compatibility
  diedAtAge?: number;
  deathCause?: string;
  deathYear?: number;
  bond?: number; // 0 to 100
  bondLevel?: RelativeBondLevel;
}

export interface ParentMember {
  name: string;
  age: number;
  job: string;
  isAlive: boolean;
  isAbsent: boolean;
  id?: string;
  sex?: Gender;
  alive?: boolean; // alias
  role?: 'mother' | 'father' | 'stepmother' | 'stepfather';
  jobTitleRu?: string;
  isInPrison?: boolean;
  isRetired?: boolean;
  diedAtAge?: number;
  deathCause?: string;
  deathYear?: number;
  bond?: number;
  bondLevel?: RelativeBondLevel;
}

export interface SiblingMember {
  id: string;
  name: string;
  age: number;
  sex: Gender;
  isOlder: boolean;
  isAlive: boolean;
  atHome: boolean;
  alive?: boolean; // alias
  birthOrder?: 'older' | 'younger' | 'twin';
  ageOffset?: number;
  leftHomeAge?: number;
  isMarried?: boolean;
  occupation?: string;
  diedAtAge?: number;
  deathCause?: string;
  bond?: number;
  bondLevel?: RelativeBondLevel;
}

export interface RomanticPartner {
  name: string;
  age: number;
  job: string;
  isMarried: boolean;
  id?: string;
  sex?: Gender;
  isAlive?: boolean;
  alive?: boolean;
  relationshipType?: 'dating' | 'civil_union' | 'married' | 'divorced' | 'widowed';
  anniversaryAge?: number;
  marriageAge?: number;
  profession?: string;
  professionRu?: string;
  isCohabiting?: boolean;
  diedAtAge?: number;
  deathCause?: string;
  bond?: number;
  bondLevel?: RelativeBondLevel;
}

export interface ChildMember {
  id: string;
  name: string;
  age: number;
  sex: Gender;
  isAlive?: boolean;
  alive?: boolean;
  atHome?: boolean;
  birthYear?: number;
  playerAgeAtBirth?: number;
  isAdopted?: boolean;
  education?: string;
  job?: string;
  diedAtAge?: number;
  deathCause?: string;
}

export interface HousingState {
  type: string;
  ownership: boolean; // true = owned, false = rented
  city: string;
  livingWith: string;
  typeRu?: string;
  tenure?: 'owned' | 'rented' | 'family_owned' | 'state_provided' | 'informal' | string;
  tenureRu?: string;
  setting?: 'urban_capital' | 'urban_city' | 'small_town' | 'village' | 'slum' | string;
  settingRu?: string;
  electricity?: boolean;
  runningWater?: boolean;
  livingWithDescriptionRu?: string;
}

export interface HouseholdInfo {
  size: number;
  membersLivingTogether?: {
    mother?: boolean;
    father?: boolean;
    siblingsCount?: number;
    partner?: boolean;
    childrenCount?: number;
    grandparentsCount?: number;
  };
}

export interface FamilyState {
  mother: ParentMember;
  father: ParentMember;
  siblings: SiblingMember[];
  partner?: RomanticPartner | null;
  children: ChildMember[];
  housing: HousingState;
  household?: HouseholdInfo;
}

export interface FamilyStepResult {
  nextFamily: FamilyState;
  familyEvents: string[];
}

declare module './simulation' {
  interface CharacterState {
    family?: FamilyState;
  }
}

declare module './pixelArt' {
  interface SceneModel {
    isDeceased?: boolean;
  }
}
