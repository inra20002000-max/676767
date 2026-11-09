/**
 * Fitzpatrick Skin Tone & Inheritance Engine
 * Deterministic sampling across 17 regional probability vectors
 */

export const SKIN_W: Record<string, number[]> = {
  n: [36, 44, 15, 5, 0, 0],
  m: [3, 17, 42, 30, 8, 0],
  s: [0, 0, 14, 46, 34, 6],
  e: [22, 50, 28, 0, 0, 0],
  se: [0, 8, 44, 40, 8, 0],
  a: [0, 0, 0, 6, 36, 58],
  ha: [0, 0, 6, 32, 44, 18],
  l: [6, 22, 34, 26, 10, 2],
  c: [0, 0, 5, 15, 40, 40],
  ca: [6, 32, 44, 18, 0, 0],
  pa: [0, 0, 4, 24, 46, 26],
  sc: [16, 46, 28, 10, 0, 0],
  in: [0, 4, 30, 46, 20, 0],
  au: [0, 0, 5, 25, 40, 30],
  br: [0, 0, 10, 36, 34, 20],
  co: [0, 10, 36, 38, 16, 0],
  ro: [0, 10, 40, 40, 10, 0],
};

export const SKIN_C: Record<string, string> = {
  e: 'CHN,KOR,PRK,JPN,TWN,HKG,MNG,SGP',
  se: 'VNM,THA,LAO,KHM,MMR,MYS,IDN,PHL,TLS,BRN',
  s: 'IND,PAK,BGD,NPL,LKA,BTN,MDV,MUS',
  ca: 'KAZ,UZB,KGZ,TJK,TKM,AZE,GEO,ARM',
  m: 'TUR,IRN,ISR,AFG',
  c: 'HTI,JAM,DOM,CUB,TTO,GUY,SUR',
  sc: 'ARG,URY,CHL',
  pa: 'PNG,SLB,FJI,VUT',
  ha: 'ETH,ERI,SOM,DJI,SDN',
  n: 'BRA',
};

export const SKIN_CI: Record<string, string> = {};
for (const [regionKey, countries] of Object.entries(SKIN_C)) {
  for (const c of countries.split(',')) {
    SKIN_CI[c.trim()] = regionKey;
  }
}

export const SKIN_G: Record<string, string> = {
  us_black: 'a',
  gb_black: 'a',
  co_afro: 'a',
  ec_afro: 'a',
  za_black: 'a',
  br_negro: 'br',
  us_hisp: 'l',
  us_asian: 'e',
  my_chin: 'e',
  cn_min: 'e',
  cn_hui: 'e',
  jp_zai: 'e',
  us_native: 'in',
  ca_ind: 'in',
  mx_ind: 'in',
  gt_maya: 'in',
  bo_ind: 'in',
  pe_ind: 'in',
  ec_ind: 'in',
  co_ind: 'in',
  cl_mapu: 'in',
  nz_maori: 'in',
  nz_pasi: 'in',
  au_ind: 'au',
  gb_pak: 's',
  gb_ind: 's',
  my_ind: 's',
  lk_tamil: 's',
  za_ind: 's',
  in_adiv: 'ha',
  fr_magh: 'm',
  il_arab: 'm',
  tr_kurd: 'm',
  de_turk: 'm',
  roma: 'ro',
  th_malay: 'se',
  th_hill: 'se',
  vn_min: 'se',
  ru_turk: 'ca',
  ru_cauc: 'ca',
  ru_bud: 'e',
  ru_sakha: 'e',
  za_white: 'n',
  za_col: 'co',
};

const REGION_DEFAULT_SKIN: Record<string, string> = {
  hi: 'n',
  eca: 'n',
  mena: 'm',
  sa: 's',
  eap: 'se',
  ssa: 'a',
  lac: 'l',
};

/**
 * 32-bit FNV-1a Hash Generator
 * Returns a deterministic pseudorandom float in [0, 1)
 */
export function skinU(seed: string | number): number {
  let a = 2166136261;
  const str = String(seed);
  for (let i = 0; i < str.length; i++) {
    a = Math.imul(a ^ str.charCodeAt(i), 16777619) >>> 0;
  }
  a = Math.imul(a ^ (a >>> 13), 2246822507) >>> 0;
  return (a >>> 0) / 4294967296;
}

export const fnv1a = skinU;

/**
 * Resolves the 6-tier Fitzpatrick distribution weight vector
 */
export function skinW(
  countryId: string,
  ethnicGroup?: { g?: string } | null,
  regionCode?: string
): number[] {
  if (ethnicGroup && ethnicGroup.g && SKIN_G[ethnicGroup.g]) {
    const key = SKIN_G[ethnicGroup.g];
    return SKIN_W[key] || SKIN_W.n;
  }

  const cid = countryId ? countryId.toUpperCase() : '';
  if (SKIN_CI[cid]) {
    const key = SKIN_CI[cid];
    return SKIN_W[key] || SKIN_W.n;
  }

  if (regionCode && REGION_DEFAULT_SKIN[regionCode]) {
    const key = REGION_DEFAULT_SKIN[regionCode];
    return SKIN_W[key] || SKIN_W.n;
  }

  return SKIN_W.n;
}

/**
 * Samples a skin tone index (0..5) given a weight distribution and a deterministic seed
 */
export function skinPick(weights: number[], seed: string | number): number {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let n = skinU(seed) * total;
  for (let s = 0; s < 6; s++) {
    n -= weights[s];
    if (n < 0) return s;
  }
  return 5;
}

/**
 * Midpoint skin tone inheritance between two parents
 */
export function skinMid(p1: number, p2: number, seed: string | number): number {
  return skinU(seed) < 0.5 ? Math.floor((p1 + p2) / 2) : Math.ceil((p1 + p2) / 2);
}

/**
 * Samples character skin tone deterministically from country, ethnicity, and seed
 */
export function getCharacterSkin(
  countryId: string,
  seed: string | number,
  ethnicGroup?: { g?: string } | null,
  regionCode?: string
): number {
  const w = skinW(countryId, ethnicGroup, regionCode);
  return skinPick(w, seed);
}

/**
 * Blends offspring skin tone from parents
 */
export function blendOffspringSkin(
  parent1Skin: number,
  parent2Skin: number,
  seed: string | number
): number {
  return skinMid(parent1Skin, parent2Skin, seed);
}
