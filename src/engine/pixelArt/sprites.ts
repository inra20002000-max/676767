/**
 * ASCII Sprite Matrix Parser & Character/Pet/Vehicle Sprite Generator
 * High-contrast pixel rendering for 5 age groups, mobility aids, elderly canes, pets, and vehicles
 */

import type { RGBColor, ScenePerson, PixelPalette, PetType } from '../../types/pixelArt';
import { PixelBuffer, pxMix } from './palette';

export const PX_PEOPLE = {
  M: {
    adult: [
      '..HHHHH..',
      '.HHHHHHH.',
      'HHHHHHHHH',
      'HHSSSSHHH',
      'HSSSSSSSH',
      'SSESSSESS',
      'ScSSSSScS',
      '.SSSmSSS.',
      '..SSSSS..',
      '.BBBBBBB.',
      'BBBBBBBBB',
      'BbBBBBBbB',
      'SbBBBBBbS',
      '..PPPPP..',
      '..PP.PP..',
      '..PP.PP..',
      '..FF.FF..',
    ],
    teen: [
      '..HHHHH..',
      '.HHHHHHH.',
      'HHHHHHHHH',
      'HHSSSSHHH',
      'HSSSSSSSH',
      'SSESSSESS',
      'ScSSSSScS',
      '.SSSmSSS.',
      '..SSSSS..',
      '.BBBBBBB.',
      'BbBBBBBbB',
      'SbBBBBBbS',
      '..PPPPP..',
      '..PP.PP..',
      '..PP.PP..',
      '..FF.FF..',
    ],
    child: [
      '.HHHHH.',
      'HHHHHHH',
      'HHSSSHH',
      'SESSSES',
      'ScSSScS',
      '.SSmSS.',
      '..SSS..',
      '.BBBBB.',
      'BbBBBbB',
      'SbBBBbS',
      '.PPPPP.',
      '.PP.PP.',
      '.FF.FF.',
    ],
    small: [
      '.HHHHH.',
      'HHSSSHH',
      'SESSSES',
      'ScSmScS',
      '.SSSSS.',
      '.BBBBB.',
      'SBBBBBS',
      '.PPPPP.',
      '.PP.PP.',
      '.FF.FF.',
    ],
    baby: [
      '.HHHH.',
      'HSSSSH',
      'SESSES',
      'ScSScS',
      '.SSSS.',
      'BBBBBB',
      'BB..BB',
    ],
  },
  F: {
    adult: [
      '..HHHHH..',
      '.HHHHHHH.',
      'HHHHHHHHH',
      'HHSSSSHHH',
      'HSSSSSSSH',
      'HSESSSESH',
      'HcSSSSScH',
      'HHSSmSSHH',
      'HHHSSSHHH',
      'HBBBBBBBH',
      'BBBBBBBBB',
      'SbBBBBBbS',
      '.DDDDDDD.',
      '.DDDDDDD.',
      'ddddddddd',
      '..S...S..',
      '..F...F..',
    ],
    teen: [
      '..HHHHH..',
      '.HHHHHHH.',
      'HHHHHHHHH',
      'HHSSSSHHH',
      'HSSSSSSSH',
      'HSESSSESH',
      'HcSSSSScH',
      'HHSSmSSHH',
      'HHHSSSHHH',
      'HBBBBBBBH',
      'SbBBBBBbS',
      '.DDDDDDD.',
      'ddddddddd',
      '..S...S..',
      '..F...F..',
    ],
    child: [
      '.HHHHH.',
      'HHHHHHH',
      'HHSSSHH',
      'HESSSEH',
      'HcSSScH',
      'HSSmSSH',
      'H.SSS.H',
      '.BBBBB.',
      'SbBBBbS',
      '.DDDDD.',
      'ddddddd',
      '.S...S.',
      '.F...F.',
    ],
    small: [
      '.HHHHH.',
      'HHSSSHH',
      'HESSSEH',
      'HcSmScH',
      'HSSSSSH',
      '.BBBBB.',
      'SDDDDDS',
      'ddddddd',
      '.S...S.',
      '.F...F.',
    ],
    baby: [
      '.HHHH.',
      'HSSSSH',
      'SESSES',
      'ScSScS',
      '.SSSS.',
      'BBBBBB',
      'BB..BB',
    ],
  },
};

export const PX_NEWBORN = [
  '..WWWWW..',
  '.WWHHHWW.',
  '.WHSSSHW.',
  '.WSESESW.',
  '.WcSSScW.',
  '.WWSSSWW.',
  '.WwWWWwW.',
  '.WWwWwWW.',
  '.WWWwWWW.',
  '..WWWWW..',
  '...WWW...',
];

export const PX_PET: Record<string, string[]> = {
  d: [
    '..BBB........',
    '.EBBBB......T',
    '.EBkBB......T',
    'NBBBBB.....T.',
    '..cBBBBBBBBB.',
    '...BBBBBBBBB.',
    '...BBwwwwBBB.',
    '...B.B...B.B.',
    '...B.B...B.B.',
  ],
  c: [
    'B.B.........',
    'BBB........T',
    'BkBB.......T',
    'NBBB......T.',
    '.BBBBBBBBBT.',
    '..BBBBBBBB..',
    '..BBwwwBBB..',
    '..B.B..B.B..',
  ],
  h: [
    '.B..B..',
    'BBBBBB.',
    'BkBBBBB',
    'NBBBBBB',
    '.wwwww.',
  ],
  r: [
    '.B.....',
    '.BB....',
    '.BB....',
    'BBBB...',
    'kBBBBB.',
    'NBBBBBw',
    '.BBBBBw',
    '..w..w.',
  ],
  b: [
    '..BB...',
    '.BkBB..',
    'cBBBBB.',
    '.BBBww.',
    '..BBT..',
    'yyyyyyy',
    '...y...',
    '...y...',
    '...y...',
    '..yyy..',
  ],
  f: [
    'GGGGGGGGGG',
    'WWWWWWWWWW',
    'WWWoWWWWWW',
    'WWooWWWpWW',
    'WWWoWWWpWW',
    'WWWWWWpWWW',
    'ssssssssss',
    'GGGGGGGGGG',
    '.G......G.',
    '.G......G.',
  ],
};

/**
 * Parses an ASCII sprite matrix into a PixelBuffer
 */
export function pxSprite(matrix: string[], colorMap: Record<string, RGBColor>): PixelBuffer {
  const width = Math.max(...matrix.map((row) => row.length));
  const height = matrix.length;
  const buf = new PixelBuffer(width, height);

  matrix.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const char = row[x];
      if (char !== '.' && colorMap[char]) {
        buf.px(x, y, colorMap[char]);
      }
    }
  });

  return buf;
}

/**
 * Builds a character sprite based on age, gender, role, skin tone, and mobility aids
 */
export function pxPerson(
  person: ScenePerson,
  palette: PixelPalette,
  signatureColors?: [RGBColor, RGBColor]
): PixelBuffer {
  const bracket =
    person.age < 3
      ? 'baby'
      : person.age < 7
      ? 'small'
      : person.age < 13
      ? 'child'
      : person.age < 18
      ? 'teen'
      : 'adult';

  const shirtColor =
    person.role === 'me' && signatureColors
      ? signatureColors[0]
      : palette[person.role] || palette.par;

  const pantsColor =
    person.role === 'me' && signatureColors
      ? signatureColors[1]
      : palette.pants;

  const dressColor =
    person.sex === 'F' && person.role !== 'me' && person.role !== 'mourn'
      ? pxMix(shirtColor, palette.light(shirtColor, 0.4), 0.3)
      : person.sex === 'F'
      ? shirtColor
      : pantsColor;

  const skinColor =
    person.sk != null && palette['sk' + person.sk]
      ? palette['sk' + person.sk]
      : palette.skin;

  const colorMap: Record<string, RGBColor> = {
    H: person.age >= 65 ? palette.hairold : palette.hair,
    S: skinColor,
    E: palette.ol,
    c: pxMix(skinColor, palette.accent, 0.38),
    m: palette.shade(pxMix(skinColor, palette.accent, 0.5), 0.2),
    B: shirtColor,
    b: palette.shade(shirtColor, 0.22),
    P: pantsColor,
    D: dressColor,
    d: palette.shade(dressColor, 0.25),
    F: palette.ol,
  };

  const sexKey = person.sex === 'F' ? 'F' : 'M';
  const baseSprite = pxSprite(PX_PEOPLE[sexKey][bracket], colorMap);

  // 1. Wheelchair Mobility Aid
  if (person.aid === 'w' && bracket !== 'baby') {
    const matrix = PX_PEOPLE[sexKey][bracket];
    const cutY = matrix.findIndex((row) => /[PDd]/.test(row));
    const totalW = baseSprite.w + 4;
    const totalH = cutY + 6;
    const wcBuf = new PixelBuffer(totalW, totalH);
    const metalShade = palette.shade(palette.trunk, 0.1);
    const seatColor = person.sex === 'F' && colorMap.D ? colorMap.D : colorMap.P;

    // Copy upper body
    for (let y = 0; y < cutY; y++) {
      for (let x = 0; x < baseSprite.w; x++) {
        const pixel = baseSprite.get(x, y);
        if (pixel) {
          wcBuf.px(x + 2, y + 1, pixel);
        }
      }
    }

    // Seat & footrest
    wcBuf.rect(3, cutY + 1, baseSprite.w - 2, 2, seatColor);
    wcBuf.rect(4, cutY + 3, 2, 1, seatColor);
    wcBuf.rect(baseSprite.w - 2, cutY + 3, 2, 1, seatColor);
    wcBuf.rect(4, cutY + 4, 2, 1, colorMap.F);
    wcBuf.rect(baseSprite.w - 2, cutY + 4, 2, 1, colorMap.F);
    wcBuf.line(3, cutY + 5, baseSprite.w, cutY + 5, metalShade);

    // Wheels & rims
    for (const wx of [0, totalW - 2]) {
      wcBuf.rect(wx, cutY - 1, 2, 6, palette.ol);
      wcBuf.px(wx + (wx ? 0 : 1), cutY - 2, palette.ol);
      wcBuf.px(wx + (wx ? 0 : 1), cutY + 5, palette.ol);
      wcBuf.px(wx + (wx ? 1 : 0), cutY + 2, metalShade);
    }
    wcBuf.line(1, cutY - 5, 1, cutY - 2, metalShade);
    wcBuf.line(totalW - 2, cutY - 5, totalW - 2, cutY - 2, metalShade);

    return wcBuf;
  }

  // 2. Forearm Crutch Mobility Aid
  if (person.aid === 'c' && bracket !== 'baby') {
    const crutchBuf = new PixelBuffer(baseSprite.w + 2, baseSprite.h);
    crutchBuf.blit(baseSprite, 0, 0, null);
    crutchBuf.line(
      baseSprite.w - 1,
      Math.floor(baseSprite.h * 0.62),
      baseSprite.w + 1,
      baseSprite.h - 2,
      [239, 237, 230]
    );
    crutchBuf.px(baseSprite.w + 1, baseSprite.h - 1, palette.accent || palette.ol);
    return crutchBuf;
  }

  // 3. Elder Walking Cane (Age >= 75 for adults)
  if (person.age >= 75 && bracket === 'adult') {
    const caneBuf = new PixelBuffer(baseSprite.w + 2, baseSprite.h);
    caneBuf.blit(baseSprite, 0, 0, null);
    caneBuf.line(baseSprite.w + 1, 9, baseSprite.w + 1, baseSprite.h - 1, palette.trunk);
    caneBuf.px(baseSprite.w, 9, palette.trunk);
    return caneBuf;
  }

  return baseSprite;
}

/**
 * Newborn swaddled baby sprite
 */
export function pxNewborn(person: ScenePerson, palette: PixelPalette): PixelBuffer {
  const blanketColor = palette.light(palette[person.role] || palette.par, 0.6);
  const skinColor =
    person.sk != null && palette['sk' + person.sk]
      ? palette['sk' + person.sk]
      : palette.skin;

  return pxSprite(PX_NEWBORN, {
    W: blanketColor,
    w: palette.shade(blanketColor, 0.14),
    H: palette.hair,
    S: skinColor,
    E: palette.ol,
    c: pxMix(skinColor, palette.accent, 0.38),
  });
}

/**
 * Pet & domestic animal sprites
 */
export function pxPet(type: PetType | string, palette: PixelPalette): PixelBuffer {
  const key = PX_PET[type] ? type : 'c';

  if (key === 'f') {
    return pxSprite(PX_PET.f, {
      G: palette.ol,
      W: palette.water2 || palette.win,
      o: palette.gold || palette.accent,
      p: palette.grass2,
      s: palette.sand,
    });
  }

  const baseCol: RGBColor =
    key === 'd'
      ? pxMix(palette.trunk, palette.sun || palette.accent, 0.3)
      : key === 'h'
      ? pxMix(palette.gold || palette.sun, palette.trunk, 0.35)
      : key === 'b'
      ? pxMix(palette.grass, palette.sun || palette.accent, 0.25)
      : key === 'r'
      ? palette.light(palette.hairold, 0.3)
      : palette.hairold;

  const shadeCol = palette.shade(baseCol, 0.28);

  return pxSprite(PX_PET[key], {
    B: baseCol,
    E: shadeCol,
    T: baseCol,
    k: palette.ol,
    N: key === 'b' ? palette.gold || palette.accent : palette.ol,
    w: palette.light(baseCol, 0.4),
    c: key === 'b' ? palette.gold || palette.accent : palette.ol,
    y: palette.trunk,
  });
}

/**
 * Passenger car sprite (15x7)
 */
export function pxCar(palette: PixelPalette, bodyColor?: RGBColor): PixelBuffer {
  const col = bodyColor || palette.accent;
  return pxSprite(
    [
      '....CCCCCC....',
      '...CwwCwwwC....',
      '..CCwwCwwwCC...',
      'CCCCCCCCCCCCCCC',
      'CCCCCCCCCCCCCCY',
      'cc.OO.cccc.OO.c',
      '...OO......OO..',
    ],
    {
      C: col,
      c: palette.shade(col, 0.3),
      w: palette.win,
      O: palette.ol,
      Y: palette.gold,
    }
  );
}

/**
 * Motorcycle sprite (14x6)
 */
export function pxMoto(palette: PixelPalette, hasDeliveryBox: boolean = false): PixelBuffer {
  return pxSprite(
    [
      hasDeliveryBox ? 'GGG.......HH..' : '..........HH..',
      hasDeliveryBox ? 'GGG.SSSS..H...' : '....SSSS..H...',
      '..MMMMMMMMMMY.',
      '..O...MM...O..',
      '.OhO......OhO.',
      '..O........O..',
    ],
    {
      M: palette.accent,
      G: palette.gold,
      O: palette.ol,
      S: palette.ol,
      H: palette.metal,
      h: palette.metal,
      Y: palette.gold,
    }
  );
}

/**
 * Pedal bicycle sprite (14x7)
 */
export function pxBike(palette: PixelPalette, frameColor?: RGBColor): PixelBuffer {
  const frame = frameColor || palette.stamp;
  return pxSprite(
    [
      '.......HH.....',
      '....FFFH......',
      '...F...F......',
      '..OFFFOFFFO...',
      '.O.F.OPO.F.O..',
      '..O...O...O...',
      '..............',
    ],
    {
      F: frame,
      H: palette.metal,
      P: palette.gold,
      O: palette.ol,
    }
  );
}
