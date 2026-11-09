/**
 * Pixel Art & Dynamic Scene Generator Type Definitions
 * 192x60 micro-resolution canvas architecture for Life Simulator
 */

export type RGBColor = [number, number, number];

export type Theme = 'light' | 'dark';

export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';

export type WeatherType = 'clear' | 'clouds' | 'rain' | 'snow';

export type Mood = 'low' | 'mid' | 'high';

export type FitzpatrickSkin = 0 | 1 | 2 | 3 | 4 | 5;

export type PetType = 'd' | 'c' | 'h' | 'r' | 'b' | 'f';

export type VehicleType = 'car' | 'moto' | 'bike';

export type HousingType =
  | 'tent'
  | 'prison'
  | 'hut'
  | 'cottage'
  | 'flat'
  | 'small'
  | 'house'
  | 'villa'
  | 'mansion'
  | 'estate';

export type WorkplaceProp =
  | 'office'
  | 'factory'
  | 'school'
  | 'clinic'
  | 'dome'
  | 'rocket'
  | 'crane'
  | 'flag'
  | 'pole';

export type ForegroundProp =
  | 'crops'
  | 'herd'
  | 'boat'
  | 'stall'
  | 'laundry'
  | 'bench'
  | 'sign'
  | 'truck'
  | 'train'
  | 'moto'
  | 'easel'
  | 'mic'
  | 'bundle'
  | 'toys'
  | 'none';

export type PersonRole = 'me' | 'pt' | 'par' | 'kid' | 'sib' | 'inlaw' | 'mourn';

export interface ScenePerson {
  role: PersonRole | string;
  age: number;
  sex: 'M' | 'F';
  aid?: 'w' | 'c' | string; // 'w' = wheelchair, 'c' = crutch/walking cane
  sk?: number; // Fitzpatrick scale 0..5
  gen?: number;
  tc?: number;
  step?: number;
  pil?: number;
  gk?: boolean;
  w?: string;
  hand?: [number, number];
  lhand?: [number, number];
  ox?: number;
  hw?: number;
}

export interface SceneContext {
  age: number;
  sex: 'M' | 'F';
  countryId: string;
  wealthQuintile: number;
  homeType?: string;
  familyMembers?: ScenePerson[];
  petType?: PetType;
  petType2?: PetType;
  vehicleType?: VehicleType;
  timeOfDay?: TimeOfDay;
  weather?: WeatherType;
  moment?: string;
  isDeceased?: boolean;
  religionId?: string;
  urban?: boolean;
  jobId?: string;
  prop?: string;
  mood?: Mood;
  war?: boolean;
  seed?: string;
  skinTone?: number;
  nomad?: boolean;
  region?: string;
}

export interface SceneModel {
  stage: 'm' | 'd' | 'e';
  mood: Mood;
  urban: boolean;
  region: string; // UN WPP regional code: hi, eca, mena, sa, eap, ssa, lac
  home: string;
  people: ScenePerson[];
  prop: string;
  pet?: string;
  pet2?: string;
  car: boolean;
  moto: boolean;
  bike?: boolean;
  war?: boolean;
  nomad?: boolean;
  seed: string;
  act?: string; // Vignette key, e.g. "born", "wed", "grad"
  rel?: string; // Cultural religion e.g. "M", "H", "S", "C", "B"
  fl?: string; // Flair e.g. "sa", "eas"
  sk?: number; // Character skin tone
}

export interface PixelBufferInterface {
  readonly w: number;
  readonly h: number;
  readonly d: (RGBColor | null)[];
  readonly width: number;
  readonly height: number;
  readonly data: (RGBColor | null)[];
  px(x: number, y: number, color: RGBColor | null): void;
  set(x: number, y: number, color: RGBColor | null): void;
  get(x: number, y: number): RGBColor | null;
  rect(x: number, y: number, w: number, h: number, color: RGBColor): void;
  disc(cx: number, cy: number, radius: number, color: RGBColor): void;
  line(x0: number, y0: number, x1: number, y1: number, color: RGBColor): void;
  dither(x: number, y: number, color: RGBColor, threshold: number): void;
  blit(src: PixelBufferInterface, destX: number, destY: number, outlineColor?: RGBColor | null): void;
}

export interface PixelPalette {
  dark: boolean;
  sky: {
    m: [RGBColor, RGBColor];
    d: [RGBColor, RGBColor];
    e: [RGBColor, RGBColor];
  };
  sun: RGBColor;
  sunhi: RGBColor;
  star: RGBColor | null;
  cloud: RGBColor;
  cloudsh: RGBColor;
  cloudlow: RGBColor;
  cloudlowsh: RGBColor;
  far1: RGBColor;
  far2: RGBColor;
  hill1: RGBColor;
  hill2: RGBColor;
  grass: RGBColor;
  grass2: RGBColor;
  grasshi: RGBColor;
  soil: RGBColor;
  soil2: RGBColor;
  stone: RGBColor;
  pave: RGBColor;
  pave2: RGBColor;
  road: RGBColor;
  roadline: RGBColor;
  sand: RGBColor;
  sand2: RGBColor;
  water: RGBColor;
  water2: RGBColor;
  wall: RGBColor;
  wall2: RGBColor;
  wall3: RGBColor;
  roof: RGBColor;
  roof2: RGBColor;
  thatch: RGBColor;
  thatch2: RGBColor;
  mud: RGBColor;
  brick: RGBColor;
  win: RGBColor;
  winlit: RGBColor;
  ol: RGBColor;
  tree: RGBColor;
  tree2: RGBColor;
  treehi: RGBColor;
  trunk: RGBColor;
  skin: RGBColor;
  sk0: RGBColor;
  sk1: RGBColor;
  sk2: RGBColor;
  sk3: RGBColor;
  sk4: RGBColor;
  sk5: RGBColor;
  hair: RGBColor;
  hairold: RGBColor;
  pants: RGBColor;
  me: RGBColor;
  pt: RGBColor;
  kid: RGBColor;
  par: RGBColor;
  sib: RGBColor;
  inlaw: RGBColor;
  metal: RGBColor;
  crane: RGBColor;
  smoke: RGBColor;
  accent: RGBColor;
  stamp: RGBColor;
  gold: RGBColor;
  lit: boolean;
  shade(col: RGBColor, factor: number): RGBColor;
  light(col: RGBColor, factor: number): RGBColor;
  [key: string]: any;
}

export interface MomentCast {
  all: ScenePerson[];
  me: ScenePerson;
  pt: ScenePerson[];
  kids: ScenePerson[];
  gk: ScenePerson[];
  par: ScenePerson[];
  sib: ScenePerson[];
  inlaw: ScenePerson[];
  sk?: number | null;
}

export interface MomentContext {
  m: SceneModel;
  P: PixelPalette;
  R: () => number;
  a: string[];
  sky: PixelBufferInterface;
  back: PixelBufferInterface;
  mid: PixelBufferInterface;
  front: PixelBufferInterface;
  span: [number, number] | null;
  cast: MomentCast;
}

export type MomentFn = (mc: MomentContext) => void;

export interface PeopleLayoutResult {
  x: number;
  gap: number;
  tot: number;
}
