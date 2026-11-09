/**
 * Architecture, Housing Tiers, Workplace Backdrops & Foreground Vocation Props
 * 9 residential tiers, 9 workplace backdrops, and 13 vocation props
 */

import type { RGBColor, SceneModel, PixelPalette } from '../../types/pixelArt';
import { PX, PixelBuffer, pxMix } from './palette';
import { pxSprite, pxMoto } from './sprites';

export const SC_PROP: Record<string, string> = {
  shelter: 'factory',
  pilot: 'office',
  cabin: 'office',
  farm: 'crops',
  farmhand: 'crops',
  agbiz: 'crops',
  agtech: 'crops',
  herder: 'herd',
  fisher: 'boat',
  seafarer: 'boat',
  construct: 'crane',
  miner: 'crane',
  factory: 'factory',
  garment: 'factory',
  artisan: 'stall',
  mechanic: 'stall',
  electric: 'pole',
  engineer: 'office',
  vendor: 'stall',
  domestic: 'laundry',
  driver: 'truck',
  delivery: 'moto',
  shop: 'stall',
  cook: 'stall',
  guard: 'office',
  hair: 'stall',
  care: 'clinic',
  clerk: 'office',
  callc: 'office',
  teacher: 'school',
  nurse: 'clinic',
  police: 'flag',
  soldier: 'flag',
  civil: 'office',
  finance: 'office',
  dev: 'office',
  doctor: 'clinic',
  lawyer: 'office',
  prof: 'school',
  creator: 'easel',
  artist: 'easel',
  writer: 'office',
  designer: 'office',
  owner: 'stall',
  mp: 'dome',
  leader: 'dome',
  astro: 'rocket',
  athlete: 'flag',
  coach: 'flag',
  trainer: 'flag',
  musician: 'mic',
  idol: 'mic',
  actor: 'mic',
  dancer: 'mic',
  homemaker: 'laundry',
  retired: 'bench',
  student: 'school',
  service: 'flag',
  seeking: 'sign',
  prison: 'none',
  cleaner: 'laundry',
  warehouse: 'truck',
  childcare: 'school',
  healthtech: 'clinic',
  social: 'office',
  salesagent: 'office',
  welder: 'crane',
  clergy: 'dome',
  boardpro: 'school',
  progamer: 'office',
  hotel: 'office',
  journalist: 'office',
  anchor: 'office',
  producer: 'office',
  traindrv: 'train',
  railway: 'train',
  logimgr: 'truck',
};

export const pxCurtain = (pal: PixelPalette, isLit: boolean): RGBColor =>
  isLit
    ? pal.shade(pal.winlit, 0.3)
    : pal.dark
    ? pxMix(pal.win, pal.accent, 0.3)
    : pal.light(pal.accent, 0.55);

/**
 * Procedural multi-pane window with reflection, curtains, and sill
 */
export function pxWindow(
  buf: PixelBuffer,
  x: number,
  y: number,
  pal: PixelPalette,
  wallCol: RGBColor,
  isLit: boolean,
  hasSill: boolean = true,
  width: number = 4
): void {
  const winGlass = isLit ? pal.winlit : pal.win;
  const frameCol = pal.light(pal.trunk, pal.dark ? 0.1 : 0.25);
  const curtainCol = pxCurtain(pal, isLit);

  buf.rect(x - 1, y - 1, width + 2, 5, frameCol);
  buf.rect(x, y, width, 3, winGlass);
  buf.px(x + 1, y, pal.light(winGlass, 0.4));
  buf.px(x + width - 2, y + 1, pal.light(winGlass, 0.25));

  // Curtains
  buf.px(x, y, curtainCol);
  buf.px(x + width - 1, y, curtainCol);
  buf.px(x, y + 1, curtainCol);
  buf.px(x + width - 1, y + 1, curtainCol);

  if (hasSill) {
    buf.rect(x - 1, y + 4, width + 2, 1, pal.light(wallCol, 0.35));
    buf.rect(x - 1, y + 5, width + 2, 1, pal.shade(wallCol, 0.2));
  }
}

/**
 * Core procedural house generator with pitched roof, walls, chimney, and optional wings
 */
export function pxHouse(
  pal: PixelPalette,
  w: number,
  h: number,
  roofH: number,
  roofCol: RGBColor,
  wallCol: RGBColor,
  opts: {
    chimney?: boolean;
    lit?: boolean;
    wing?: number;
    thatch?: boolean;
    noWin?: boolean;
  } = {}
): PixelBuffer {
  const totalW = w + 4 + (opts.wing || 0);
  const totalH = h + roofH;
  const buf = new PixelBuffer(totalW, totalH);
  const roofMid = 2 + w / 2 - 0.5;

  // Roof triangle
  for (let r = 0; r < roofH; r++) {
    const span = Math.round(((r + 1) * (w / 2 + 2)) / roofH);
    const leftX = Math.ceil(roofMid - span);
    const rightX = Math.floor(roofMid + span);

    for (let rx = leftX; rx <= rightX; rx++) {
      const tileCol =
        r === roofH - 1
          ? pal.shade(roofCol, 0.3)
          : r % 2
          ? pal.shade(roofCol, 0.12)
          : (rx + r) % 4
          ? roofCol
          : pal.light(roofCol, 0.12);
      buf.px(rx, r, tileCol);
    }

    if (r < roofH - 1) {
      buf.px(leftX, r, pal.light(roofCol, 0.22));
      buf.px(rightX, r, pal.shade(roofCol, 0.2));
    }
  }

  // Thatch roof weave shadow
  if (opts.thatch) {
    for (let r = 0; r < roofH; r++) {
      for (let rx = 0; rx < buf.w; rx++) {
        if (buf.get(rx, r) && (rx + r * 2) % 3 === 0) {
          buf.px(rx, r, pal.thatch2);
        }
      }
    }
  }

  // Wall rectangle
  buf.rect(2, roofH, w, h, wallCol);
  buf.rect(2 + w - 2, roofH, 2, h, pal.shade(wallCol, 0.1));
  buf.rect(2, roofH, w, 1, pal.shade(wallCol, 0.22));

  // Thatch wall texture
  if (opts.thatch) {
    for (let wy = roofH + 3; wy < roofH + h - 1; wy += 3) {
      for (let wx = 4; wx < w; wx += 4) {
        buf.px(wx, wy, pal.shade(wallCol, 0.18));
      }
    }
  }

  // Brick Chimney
  if (opts.chimney) {
    buf.rect(w - 2, 1, 3, roofH, pal.brick);
    buf.rect(w - 3, 0, 5, 1, pal.shade(pal.brick, 0.2));
  }

  // Wing extension
  if (opts.wing) {
    buf.rect(w + 2, roofH + 4, opts.wing, h - 4, wallCol);
    buf.rect(w + 2 + opts.wing - 2, roofH + 4, 2, h - 4, pal.shade(wallCol, 0.1));
    buf.rect(w + 2, roofH + 4, opts.wing, 1, pal.shade(roofCol, 0.25));
  }

  // Door and Window
  if (!opts.noWin) {
    const doorX = 4;
    const doorY = roofH + h - 7;
    buf.rect(doorX, doorY, 5, 7, pal.trunk);
    buf.px(doorX + 3, doorY + 4, pal.gold);

    const winX = w - 7;
    const winY = roofH + 3;
    pxWindow(buf, winX, winY, pal, wallCol, !!opts.lit);
  }

  return buf;
}

/**
 * 9 residential housing tiers
 */
export function pxHome(model: SceneModel, pal: PixelPalette, prng: () => number): PixelBuffer {
  const isLit = pal.lit || model.stage === 'e';

  switch (model.home) {
    case 'tent': {
      // 26x14 refugee relief canvas tent
      const buf = new PixelBuffer(26, 14);
      for (let y = 1; y < 14; y++) {
        const span = y;
        for (let x = 13 - span; x < 13 + span; x++) {
          buf.px(
            x,
            y,
            y === 9 || y === 10
              ? pal.stamp
              : x < 13
              ? pal.light(pal.wall2, 0.25)
              : pal.wall2
          );
        }
      }
      for (let y = 7; y < 14; y++) {
        const span = 1 + ((y - 7) >> 1);
        for (let x = 13 - span; x < 13 + span; x++) {
          buf.px(x, y, pal.ol);
        }
      }
      buf.px(12, 0, pal.trunk);
      buf.px(13, 0, pal.trunk);
      return buf;
    }

    case 'prison': {
      // 42x24 concrete cell block with barred windows & barbed wire
      const buf = new PixelBuffer(42, 24);
      buf.rect(0, 4, 42, 20, pal.wall3);
      buf.rect(0, 4, 42, 1, pal.light(pal.wall3, 0.15));

      // Barbed wire
      for (let x = 0; x < 42; x++) {
        buf.px(x, 2 + ((x >> 1) % 2), pal.ol);
      }

      // Barred cell windows
      for (let i = 0; i < 4; i++) {
        buf.rect(4 + i * 10, 9, 5, 5, pal.ol);
        for (let b = 1; b < 5; b += 2) {
          buf.rect(4 + i * 10 + b, 9, 1, 5, pal.metal);
        }
      }
      buf.rect(17, 18, 6, 6, pal.shade(pal.wall3, 0.35));
      return buf;
    }

    case 'hut':
      return pxHouse(pal, 18, 9, 10, pal.thatch, pal.mud, { thatch: true, noWin: true });

    case 'flat': {
      // 30x40 apartment block with 5 window floors, fire escapes, water tank
      const buf = new PixelBuffer(30, 40);
      buf.rect(0, 2, 30, 38, pal.wall);
      buf.rect(26, 2, 4, 38, pal.shade(pal.wall, 0.1));
      buf.rect(0, 2, 30, 1, pal.shade(pal.wall, 0.25));
      buf.rect(4, 0, 6, 2, pal.wall2);
      buf.rect(20, 0, 3, 2, pal.metal);

      for (let floor = 0; floor < 5; floor++) {
        const fy = 5 + floor * 6;
        buf.rect(0, fy + 4, 30, 1, pal.shade(pal.wall, 0.12));

        for (let winIdx = 0; winIdx < 4; winIdx++) {
          const winLit = isLit && prng() < 0.5;
          const winCol = winLit ? pal.winlit : pal.win;
          const wx = 3 + winIdx * 7;
          buf.rect(wx - 1, fy - 1, 6, 5, pal.shade(pal.wall, 0.16));
          buf.rect(wx, fy, 4, 3, winCol);
          buf.px(wx, fy, pal.light(winCol, 0.3));
          buf.px(wx + 3, fy, pxCurtain(pal, winLit));

          // Fire escape rails
          if (prng() < 0.3) {
            buf.rect(wx - 1, fy + 2, 6, 1, pal.metal);
            buf.px(wx - 1, fy + 3, pal.metal);
            buf.px(wx + 4, fy + 3, pal.metal);
            if (prng() < 0.5) {
              buf.px(wx + 1 + Math.floor(prng() * 2), fy + 1, pal.tree);
            }
          }
        }
      }

      // Security entrance
      buf.rect(11, 33, 8, 1, pal.accent);
      buf.rect(11, 34, 8, 6, pal.shade(pal.wall, 0.3));
      buf.rect(12, 34, 6, 6, pal.ol);
      buf.rect(13, 35, 4, 4, isLit ? pal.winlit : pal.win);
      buf.rect(15, 35, 1, 4, pal.shade(pal.wall, 0.3));
      return buf;
    }

    case 'small':
    case 'cottage':
      return pxHouse(pal, 17, 10, 8, pal.roof, pal.wall, { lit: isLit });

    case 'house':
      return pxHouse(pal, 26, 13, 10, pal.roof, pal.wall, { chimney: true, lit: isLit });

    case 'villa': {
      const buf = pxHouse(pal, 32, 15, 11, pal.roof, pal.wall, {
        chimney: true,
        lit: isLit,
        wing: 12,
      });
      // Garden shrubs along foundation
      for (let x = 0; x < buf.w; x++) {
        buf.px(x, buf.h - 1, pal.tree2);
        if (x % 3) buf.px(x, buf.h - 2, pal.tree);
      }
      return buf;
    }

    case 'mansion':
    case 'estate': {
      const isEstate = model.home === 'estate';
      const w = isEstate ? 36 : 32;
      const h = isEstate ? 28 : 21;
      const roofH = 11;
      const buf = pxHouse(pal, w, h, roofH, pal.roof2, pal.wall, {
        chimney: true,
        lit: isLit,
        wing: isEstate ? 12 : 10,
      });

      const floorRows = isEstate
        ? [
            [0, roofH + 10],
            [1, roofH + 17],
          ]
        : [[0, roofH + 10]];

      for (const [c, fy] of floorRows) {
        buf.rect(2, fy - 2, w, 1, pal.shade(pal.wall, 0.18));
        for (let u = 0; u < 4; u++) {
          pxWindow(
            buf,
            4 + u * Math.round((w - 8) / 3),
            fy,
            pal,
            pal.wall,
            isLit && (u + c) % 2 === 1,
            false
          );
        }
      }

      if (isEstate) {
        // Entrance columns
        const midX = Math.round(2 + w / 2) - 1;
        for (const colX of [-4, 4]) {
          buf.rect(midX + colX, roofH + h - 7, 1, 7, pal.wall2);
        }
        for (let x = 0; x < buf.w; x++) {
          buf.px(x, buf.h - 1, pal.tree2);
          if (x % 4) buf.px(x, buf.h - 2, pal.tree);
          if (x % 6 === 1) buf.px(x, buf.h - 3, pal.treehi);
        }
        // Perimeter lantern piers
        for (const lx of [1, buf.w - 2]) {
          buf.rect(lx, buf.h - 6, 1, 5, pal.ol);
          buf.px(lx, buf.h - 7, isLit ? pal.winlit : pal.gold);
        }
      } else {
        for (let x = 0; x < buf.w; x++) {
          buf.px(x, buf.h - 1, pal.tree2);
          if (x % 3) buf.px(x, buf.h - 2, pal.tree);
        }
      }

      return buf;
    }

    default:
      return pxHouse(pal, 20, 11, 9, pal.roof, pal.wall, { lit: isLit });
  }
}

/**
 * 9 workplace buildings
 */
export function pxWork(
  buf: PixelBuffer,
  model: SceneModel,
  pal: PixelPalette,
  prng: () => number
): void {
  const groundY = PX.G;
  const isLit = pal.lit || model.stage === 'e';

  switch (model.prop) {
    case 'office': {
      const bW = 22;
      const bH = 42;
      const r = new PixelBuffer(bW, bH);
      r.rect(0, 2, bW, bH - 2, pal.wall3);
      r.rect(bW - 4, 2, 4, bH - 2, pal.shade(pal.wall3, 0.12));
      r.rect(10, 0, 1, 2, pal.metal);

      for (let wy = 6; wy < 34; wy += 4) {
        for (let wx = 2; wx < 18; wx += 4) {
          const litWin = isLit && prng() < 0.45;
          r.rect(wx, wy, 3, 2, litWin ? pal.winlit : pal.win);
        }
      }
      r.rect(7, 35, 8, 7, pal.ol);
      r.rect(8, 36, 6, 6, pal.win);
      buf.blit(r, 164, groundY - 42, pal.ol);
      buf.px(174, groundY - 45, pal.accent);
      return;
    }

    case 'factory': {
      const r = new PixelBuffer(40, 20);
      for (let i = 0; i < 3; i++) {
        for (let l = 0; l < 5; l++) {
          const c = Math.round(((l + 1) * 12) / 5);
          r.rect(i * 12 + 12 - c, l, c, 1, pal.wall2);
          r.px(i * 12 + 11, l, pal.win);
        }
      }
      r.rect(0, 5, 40, 15, pal.wall2);
      r.rect(0, 9, 40, 2, pal.win);
      r.rect(4, 13, 8, 7, pal.shade(pal.wall2, 0.35));
      buf.blit(r, 140, groundY - 20, pal.ol);

      // Brick smokestack & smoke
      buf.rect(176, groundY - 34, 5, 34, pal.brick);
      buf.rect(176, groundY - 30, 5, 2, pal.wall);
      buf.rect(176, groundY - 34, 5, 1, pal.shade(pal.brick, 0.3));
      for (let i = 0; i < 4; i++) {
        buf.disc(
          180 + i * 3,
          groundY - 38 - i * 3,
          2 + (i >> 1),
          i % 2 ? pal.smoke : pal.light(pal.smoke, 0.15)
        );
      }
      return;
    }

    case 'school': {
      const r = pxHouse(pal, 34, 16, 8, pal.stamp, pal.wall, { lit: false });
      r.rect(18, 4, 3, 3, pal.wall);
      r.px(19, 5, pal.ol);
      buf.blit(r, 146, groundY - r.h, pal.ol);
      buf.line(164, groundY - r.h - 1, 164, groundY - r.h - 12, pal.metal);
      buf.rect(165, groundY - r.h - 12, 6, 4, pal.stamp);
      return;
    }

    case 'clinic': {
      const r = new PixelBuffer(32, 22);
      r.rect(0, 2, 32, 20, pal.wall);
      r.rect(0, 2, 32, 1, pal.shade(pal.wall, 0.2));
      r.rect(28, 2, 4, 20, pal.shade(pal.wall, 0.1));

      // Red cross symbol
      r.rect(14, 4, 4, 10, pal.accent);
      r.rect(11, 7, 10, 4, pal.accent);

      for (const wx of [3, 23]) {
        r.rect(wx, 8, 5, 4, pal.win);
      }
      r.rect(13, 15, 6, 7, pal.ol);
      r.rect(14, 16, 4, 6, pal.win);
      buf.blit(r, 148, groundY - 22, pal.ol);
      return;
    }

    case 'dome': {
      const r = new PixelBuffer(46, 28);
      r.disc(23, 13, 9, pal.wall2);
      r.rect(13, 13, 21, 3, pal.wall2);
      for (let i = 16; i < 31; i += 3) {
        r.rect(i, 8, 1, 6, pal.light(pal.wall2, 0.15));
      }
      r.rect(2, 15, 42, 2, pal.wall);
      r.rect(4, 17, 38, 11, pal.wall);
      for (let i = 6; i < 42; i += 4) {
        r.rect(i, 18, 2, 10, pal.shade(pal.wall, 0.15));
      }
      r.rect(19, 21, 8, 7, pal.ol);
      buf.blit(r, 142, groundY - 28, pal.ol);
      buf.line(165, groundY - 29, 165, groundY - 38, pal.metal);
      buf.rect(166, groundY - 38, 5, 3, pal.accent);
      return;
    }

    case 'rocket': {
      for (let y = groundY - 40; y < groundY; y++) {
        buf.px(176, y, pal.metal);
        buf.px(181, y, pal.metal);
        if ((y & 3) === 0) {
          buf.line(176, y, 181, y + 3, pal.metal);
        }
      }
      const r = pxSprite(
        [
          '..A..',
          '.AAA.',
          '.WWW.',
          'WWWWW',
          'WWOWW',
          'WWWWW',
          'WWWWW',
          'WWWWW',
          'WWWWW',
          'WWWWW',
          'WWWWW',
          'WWWWW',
          'WWWWW',
          'WWWWW',
          'WWWWW',
          'WWWWW',
          'WWWWW',
          'WWWWW',
          'WWWWW',
          'AWWWA',
          'AWWWA',
          'A...A',
        ],
        { A: pal.accent, W: pal.wall, O: pal.win }
      );
      buf.blit(r, 168, groundY - r.h - 2, pal.ol);
      buf.rect(164, groundY - 2, 20, 2, pal.wall3);
      return;
    }

    case 'crane': {
      const r = new PixelBuffer(24, 18);
      for (let y = 0; y < 18; y += 5) r.rect(0, y, 24, 1, pal.wall3);
      for (let x = 0; x < 24; x += 6) r.rect(x, 0, 1, 18, pal.wall3);
      r.rect(0, 10, 24, 8, pal.wall2);
      buf.blit(r, 138, groundY - 18, pal.ol);

      for (let y = groundY - 42; y < groundY; y++) {
        buf.px(168, y, pal.crane);
        buf.px(171, y, pal.crane);
        if ((y & 3) === 0) buf.line(168, y, 171, y + 3, pal.crane);
      }
      buf.rect(146, groundY - 43, 46, 2, pal.crane);
      buf.rect(150, groundY - 46, 6, 3, pal.wall3);
      buf.line(186, groundY - 41, 186, groundY - 28, pal.ol);
      buf.rect(183, groundY - 28, 7, 3, pal.wall3);
      return;
    }

    case 'flag': {
      const r = pxHouse(pal, 22, 12, 4, pal.wall3, pal.wall2, { lit: false });
      buf.blit(r, 146, groundY - r.h, pal.ol);
      buf.line(178, groundY - 1, 178, groundY - 26, pal.metal);
      [3, 5, 7, 5, 3].forEach((width, l) =>
        buf.rect(179, groundY - 26 + l, width, 1, pal.accent)
      );
      return;
    }

    case 'pole': {
      buf.rect(170, groundY - 34, 2, 34, pal.trunk);
      buf.rect(163, groundY - 31, 16, 1, pal.trunk);
      buf.rect(165, groundY - 22, 6, 6, pal.metal);
      buf.px(167, groundY - 20, pal.gold);
      for (let y = groundY - 18; y < groundY; y += 3) {
        buf.rect(172, y, 2, 1, pal.metal);
      }
      return;
    }

    default:
      return;
  }
}

/**
 * 13 foreground vocation props
 */
export function pxFore(
  buf: PixelBuffer,
  model: SceneModel,
  pal: PixelPalette,
  _prng: () => number,
  startX: number
): void {
  const groundY = PX.G;

  switch (model.prop) {
    case 'crops': {
      buf.rect(132, groundY, 60, 10, pal.soil);
      for (let r = 0; r < 4; r++) {
        buf.rect(132, groundY + 2 + r * 3, 60, 1, pal.soil2);
      }
      for (let r = 0; r < 4; r++) {
        for (let i = 134 + (r % 2) * 2; i < 190; i += 4) {
          const l = groundY + 1 + r * 3;
          buf.px(i, l, pal.tree2);
          buf.px(i - 1, l - 1, pal.tree);
          buf.px(i + 1, l - 1, pal.tree);
          buf.px(i, l - 2, r ? pal.tree : pal.treehi);
        }
      }
      return;
    }

    case 'herd': {
      const sheep = pxSprite(
        [
          '.WWWW...',
          'WWWWWWK.',
          'WWWWWWKK',
          'WWWWWW..',
          '.K..K...',
        ],
        { W: pal.light(pal.wall, 0.4), K: pal.ol }
      );
      for (const hx of [140, 156, 172]) {
        buf.blit(sheep, hx, groundY - 5, null);
      }
      return;
    }

    case 'boat': {
      buf.rect(128, groundY, 64, PX.H - groundY, pal.water);
      for (let x = 128; x < PX.W; x++) {
        buf.px(x, groundY, pal.water2);
        if ((x * 7) % 11 < 2) {
          buf.px(x, groundY + 4 + (x % 3) * 3, pal.water2);
        }
      }
      const boat = pxSprite(
        [
          '........M.......',
          '.......MSS......',
          '.......MSSS.....',
          '.......MSSSS....',
          '.......MSSSSS...',
          'HHHHHHHHHHHHHHHH',
          '.hhhhhhhhhhhhhh.',
          '..hhhhhhhhhhhh..',
        ],
        {
          M: pal.trunk,
          S: pal.wall,
          H: pal.brick,
          h: pal.shade(pal.brick, 0.3),
        }
      );
      buf.blit(boat, 150, groundY - 5, pal.ol);
      return;
    }

    case 'stall': {
      const stallBuf = new PixelBuffer(34, 16);
      for (let x = 0; x < 34; x++) {
        const awningCol = ((x >> 2) % 2) ? pal.wall : pal.accent;
        stallBuf.rect(x, 0, 1, 3, awningCol);
        if (x % 4 < 2) stallBuf.px(x, 3, awningCol);
      }
      stallBuf.rect(1, 4, 1, 12, pal.trunk);
      stallBuf.rect(32, 4, 1, 12, pal.trunk);
      stallBuf.rect(2, 9, 30, 2, pal.trunk);
      stallBuf.rect(4, 11, 26, 5, pal.shade(pal.trunk, 0.2));

      // Fruit wares
      for (let x = 4; x < 30; x += 3) {
        stallBuf.px(x, 8, [pal.gold, pal.tree, pal.accent][Math.floor(x / 3) % 3]);
      }
      buf.blit(stallBuf, 142, groundY - 16, pal.ol);
      return;
    }

    case 'laundry': {
      buf.line(140, groundY - 1, 140, groundY - 18, pal.trunk);
      buf.line(184, groundY - 1, 184, groundY - 18, pal.trunk);
      for (let r = 140; r <= 184; r++) {
        const u = (r - 140) / 44;
        buf.px(r, Math.round(groundY - 17 + 4 * u * (1 - u) * 3), pal.ol);
      }
      [pal.stamp, pal.gold, pal.accent, pal.light(pal.wall, 0.3), pal.stamp].forEach(
        (color, idx) => {
          const lx = 145 + idx * 8;
          const u = (lx - 140) / 44;
          const ly = Math.round(groundY - 16 + 4 * u * (1 - u) * 3);
          buf.rect(lx, ly, 5, 6 + (idx % 2) * 2, color);
        }
      );
      return;
    }

    case 'bench': {
      buf.blit(
        pxSprite(
          [
            'BBBBBBBBBBBB',
            '............',
            'BBBBBBBBBBBB',
            'b..........b',
            'b..........b',
          ],
          { B: pal.trunk, b: pal.ol }
        ),
        150,
        groundY - 5,
        null
      );
      buf.line(170, groundY - 1, 170, groundY - 20, pal.metal);
      buf.rect(168, groundY - 22, 5, 2, pal.metal);
      buf.px(170, groundY - 20, pal.gold);
      return;
    }

    case 'sign': {
      buf.line(160, groundY - 1, 160, groundY - 18, pal.trunk);
      buf.blit(
        pxSprite(
          [
            'SSSSSSSSS.',
            'SSSSSSSSSS',
            'SSSSSSSSS.',
          ],
          { S: pal.stamp }
        ),
        161,
        groundY - 18,
        pal.ol
      );
      buf.blit(
        pxSprite(
          [
            '.SSSSSSSSS',
            'SSSSSSSSSS',
            '.SSSSSSSSS',
          ],
          { S: pal.stamp }
        ),
        150,
        groundY - 12,
        pal.ol
      );
      return;
    }

    case 'truck': {
      buf.blit(
        pxSprite(
          [
            'WWWWWWWWWWWW......',
            'WWWWWWWWWWWWCCCC..',
            'WWWWWWWWWWWWCwwCC.',
            'WWWWWWWWWWWWCCCCCC',
            'WWWWWWWWWWWWCCCCCY',
            'cc.OO.cccccc.OO.cc',
            '...OO........OO...',
          ],
          {
            W: pal.wall2,
            C: pal.accent,
            c: pal.shade(pal.wall2, 0.3),
            w: pal.win,
            O: pal.ol,
            Y: pal.gold,
          }
        ),
        150,
        groundY - 7,
        pal.ol
      );
      return;
    }

    case 'train': {
      buf.rect(138, groundY - 1, 48, 1, pal.metal);
      buf.blit(
        pxSprite(
          [
            '....CCCCCCCCCCCCCCCCC.',
            '...CCwwCCwwCCwwCCwwCCC',
            '..CCCwwCCwwCCwwCCwwCCC',
            '.CCCCCCCCCCCCCCCCCCCCC',
            'YCCCCCCCCCCCCCCCCCCCCC',
            'AAAAAAAAAAAAAAAAAAAAAA',
            '..OO..OO.......OO..OO.',
          ],
          {
            C: pal.accent,
            w: pal.win,
            Y: pal.gold,
            A: pal.shade(pal.accent, 0.3),
            O: pal.ol,
          }
        ),
        148,
        groundY - 8,
        pal.ol
      );
      return;
    }

    case 'moto': {
      buf.blit(pxMoto(pal, true), 156, groundY - 5, null);
      return;
    }

    case 'easel': {
      buf.line(152, groundY - 1, 158, groundY - 20, pal.trunk);
      buf.line(164, groundY - 1, 158, groundY - 20, pal.trunk);
      buf.line(158, groundY - 20, 158, groundY - 1, pal.trunk);
      buf.blit(
        pxSprite(
          [
            'WWWWWWWWWW',
            'WWWWWWWWWW',
            'WWSSWWGGWW',
            'WSSSWGGGWW',
            'WWWWTTTTWW',
            'WWWTTTTTTW',
            'WWWWWWWWWW',
          ],
          {
            W: pal.light(pal.wall, 0.3),
            S: pal.sky.d[0],
            G: pal.gold,
            T: pal.tree,
          }
        ),
        153,
        groundY - 17,
        pal.ol
      );
      return;
    }

    case 'mic': {
      buf.blit(
        pxSprite(
          [
            'AAAAAAAAAA',
            'AKKKKKKKKA',
            'AKKkkkkKKA',
            'AKkKKKKkKA',
            'AKkKKKKkKA',
            'AKKkkkkKKA',
            'AKKKKKKKKA',
            'AAAAAAAAAA',
          ],
          { A: pal.wall3, K: pal.ol, k: pal.metal }
        ),
        146,
        groundY - 8,
        pal.ol
      );
      buf.line(164, groundY - 1, 164, groundY - 17, pal.metal);
      buf.line(161, groundY - 1, 167, groundY - 1, pal.metal);
      buf.rect(163, groundY - 20, 3, 3, pal.ol);
      buf.blit(
        pxSprite(
          [
            '..H..',
            '..N..',
            '..N..',
            '..N..',
            '..N..',
            '..N..',
            '.BBB.',
            'BBBBB',
            'BBOBB',
            'BBBBB',
            '.BBB.',
            'BBBBB',
            'BBBBB',
            '.BBB.',
          ],
          { H: pal.ol, N: pal.trunk, B: pal.gold, O: pal.ol }
        ),
        172,
        groundY - 14,
        pal.ol
      );
      return;
    }

    case 'bundle': {
      buf.blit(
        pxSprite(
          [
            '.GG.',
            'GGGG',
            'GGGG',
            '.GG.',
          ],
          { G: pal.thatch }
        ),
        startX + 2,
        groundY - 4,
        pal.ol
      );
      return;
    }

    case 'toys': {
      buf.disc(startX + 4, groundY - 2, 2, pal.accent);
      buf.px(startX + 3, groundY - 3, pal.light(pal.accent, 0.4));
      return;
    }

    default:
      return;
  }
}
