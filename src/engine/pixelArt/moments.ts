/**
 * 40 Life Moment Vignettes, Particle Shaders & Cultural Funeral Rites
 * Procedural narrative scenes with confetti, petals, rain, snow, and lanterns
 */

import type {
  RGBColor,
  ScenePerson,
  SceneModel,
  PixelPalette,
  MomentContext,
  MomentCast,
  MomentFn,
} from '../../types/pixelArt';
import { PX, PixelBuffer, pxMix, pxRGB } from './palette';
import { PX_PEOPLE, pxSprite, pxPerson, pxPet, pxCar } from './sprites';
import { pxTree, pxCloud, pxSky, pxHills, pxBackdrop, pxGround } from './scenery';
import { pxHouse } from './housing';

export const MO_CX = 96;

/**
 * 32-bit pseudorandom generator for moments
 */
export function lvRand(seed: string | number): () => number {
  let a = 2166136261;
  const str = String(seed);
  for (let i = 0; i < str.length; i++) {
    a ^= str.charCodeAt(i);
    a = Math.imul(a, 16777619);
  }
  return () => {
    a ^= a << 13;
    a ^= a >>> 17;
    a ^= a << 5;
    return ((a >>> 0) % 100000) / 100000;
  };
}

// ---------------------------------------------------------------------------
// Particle FX Shaders
// ---------------------------------------------------------------------------

export function fxConfetti(mc: MomentContext, count: number = 26, maxY: number = PX.G - 2): void {
  const colors: RGBColor[] = [
    mc.P.accent,
    mc.P.gold,
    mc.P.stamp,
    mc.P.water,
    mc.P.light(mc.P.accent, 0.4),
  ];
  for (let s = 0; s < count; s++) {
    const x = Math.floor(mc.R() * PX.W);
    const y = Math.floor(2 + mc.R() * (maxY - 2));
    const col = colors[s % colors.length];
    mc.front.px(x, y, col);
    if (s % 3 === 0) {
      mc.front.px(x + 1, y, col);
    }
  }
}

export function fxPetals(mc: MomentContext, count: number = 20, customCol?: RGBColor): void {
  const P = mc.P;
  const colors: RGBColor[] = customCol
    ? [customCol]
    : [P.light(P.accent, 0.55), P.light(P.wall, 0.85), P.light(P.accent, 0.7)];

  for (let i = 0; i < count; i++) {
    const x = Math.floor(mc.R() * PX.W);
    const y = Math.floor(mc.R() * (PX.G - 4));
    const col = colors[i % colors.length];
    mc.front.px(x, y, col);
    if (i % 4 === 0) {
      mc.front.px(x + 1, y + 1, col);
    }
  }
}

export function fxRain(mc: MomentContext, count: number = 70): void {
  const rainCol = mc.P.light(mc.P.win, 0.35);
  for (let i = 0; i < count; i++) {
    const x = Math.floor(mc.R() * (PX.W + 10));
    const y = Math.floor(mc.R() * PX.H);
    mc.front.px(x, y, rainCol);
    mc.front.px(x - 1, y + 1, rainCol);
    mc.front.px(x - 1, y + 2, pxMix(rainCol, mc.P.win, 0.5));
  }
}

export function fxSnow(mc: MomentContext, count: number = 45): void {
  const snowCol = mc.P.light(mc.P.wall, 0.9);
  for (let i = 0; i < count; i++) {
    mc.front.px(Math.floor(mc.R() * PX.W), Math.floor(mc.R() * PX.H), snowCol);
  }
}

export function fxSpark(mc: MomentContext, x: number, y: number, count: number = 4): void {
  const sparkCol = mc.P.light(mc.P.gold, 0.4);
  for (let i = 0; i < count; i++) {
    const sx = Math.floor(x + (mc.R() - 0.5) * 30);
    const sy = Math.floor(y + (mc.R() - 0.5) * 14);
    mc.front.px(sx, sy, sparkCol);
    mc.front.px(sx - 1, sy, sparkCol);
    mc.front.px(sx + 1, sy, sparkCol);
    mc.front.px(sx, sy - 1, sparkCol);
    mc.front.px(sx, sy + 1, sparkCol);
  }
}

export function fxHeart(mc: MomentContext, x: number, y: number, col?: RGBColor): void {
  const heartCol = col || mc.P.light(mc.P.accent, 0.2);
  const heart = pxSprite(['HH.HH', 'HHHHH', '.HHH.', '..H..'], { H: heartCol });
  mc.front.blit(heart, x, y, null);
  mc.front.px(x + 1, y, mc.P.light(heartCol, 0.5));
}

export function fxNote(mc: MomentContext, x: number, y: number): void {
  const noteCol = mc.P.ol;
  const note = pxSprite(['..N.', '..N.', '.NN.', 'NNN.'], { N: noteCol });
  mc.front.blit(note, x, y, null);
}

export function fxLanterns(
  mc: MomentContext,
  y: number = 16,
  startX: number = 0,
  endX: number = PX.W,
  targetLayer?: any
): void {
  const layer = targetLayer || mc.mid;
  const P = mc.P;
  for (let x = startX; x < endX; x++) {
    const u = (x - startX) / Math.max(1, endX - startX);
    const sagY = Math.round(y + 5 * Math.sin(u * Math.PI));
    layer.px(x, sagY, P.ol);

    if ((x - startX) % 9 === 4) {
      const colors: RGBColor[] = [
        pxRGB('#F2A23A'),
        pxRGB('#E85A4F'),
        pxRGB('#F6D365'),
      ];
      const col = colors[Math.floor((x - startX) / 9) % 3];
      layer.rect(x - 1, sagY + 1, 3, 4, col);
      layer.px(x, sagY + 2, P.light(col, 0.5));
      for (let dy = -3; dy <= 6; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          if (dx * dx + dy * dy < 18) {
            layer.dither(x + dx, sagY + 2 + dy, P.light(col, 0.4), 0.15);
          }
        }
      }
    }
  }
}

export function fxStars(mc: MomentContext, count: number = 40, targetLayer?: any): void {
  const layer = targetLayer || mc.sky;
  for (let i = 0; i < count; i++) {
    const x = Math.floor(mc.R() * PX.W);
    const y = Math.floor(mc.R() * 36);
    const col = pxRGB(i % 6 ? '#E2E8F0' : '#FFF4CF');
    layer.px(x, y, col);
    if (i % 9 === 0) {
      layer.px(x - 1, y, pxRGB('#9AA6C0'));
      layer.px(x + 1, y, pxRGB('#9AA6C0'));
    }
  }
}

// ---------------------------------------------------------------------------
// Moment Helper Functions
// ---------------------------------------------------------------------------

export function moCast(model: SceneModel): MomentCast {
  const all = (model.people || []).filter((p) => p && p.age >= 0);
  const me = all.find((p) => p.role === 'me') || { role: 'me', sex: 'F', age: 30 };
  const filterRole = (r: string) => all.filter((p) => p.role === r);

  return {
    all,
    me,
    pt: filterRole('pt'),
    kids: filterRole('kid').filter((p) => !p.gk),
    gk: filterRole('kid').filter((p) => p.gk),
    par: filterRole('par'),
    sib: filterRole('sib'),
    inlaw: filterRole('inlaw'),
    sk: me.sk != null ? me.sk : model.sk,
  };
}

export function moGen(
  mc: MomentContext,
  role: string,
  sex?: 'M' | 'F',
  age: number = 25,
  gen: number = 1
): ScenePerson {
  const baseSk = mc.cast.sk;
  const sk =
    baseSk == null
      ? 2
      : Math.max(0, Math.min(5, baseSk + (mc.R() < 0.6 ? 0 : mc.R() < 0.5 ? -1 : 1)));

  return {
    role,
    sex: sex || (mc.R() < 0.5 ? 'F' : 'M'),
    age: Math.max(0, Math.round(age)),
    sk,
    gen,
    tc: Math.floor(mc.R() * 7),
  };
}

const moNavy = (P: PixelPalette): RGBColor => pxMix(P.ol, pxRGB('#33507A'), 0.55);
const moWhite = (P: PixelPalette): RGBColor => P.light(P.wall, P.dark ? 0.35 : 0.8);
const moGenCol = (P: PixelPalette, tc: number): RGBColor =>
  [
    P.gold,
    P.stamp,
    P.light(P.accent, 0.25),
    P.water,
    P.light(P.tree, 0.05),
    P.light(P.wall3, 0.05),
    pxMix(P.sib, P.accent, 0.4),
  ][tc % 7];

export function moFig(
  person: ScenePerson,
  pal: PixelPalette,
  opts: {
    top?: RGBColor;
    bot?: RGBColor;
    dress?: RGBColor;
    hair?: RGBColor;
    bald?: boolean;
    beard?: boolean;
    pose?: 'sit' | 'walk' | 'up' | 'wave' | 'hold' | string;
    hat?: 'grad' | 'chef' | 'party' | 'turban' | 'veil' | 'straw' | string;
    cap?: RGBColor;
    bun?: RGBColor;
  } = {}
): PixelBuffer & { hand: [number, number]; lhand: [number, number]; ox: number; hw: number } {
  if (person.aid) {
    const base = pxPerson(person, pal);
    (base as any).hand = [base.w - 2, Math.round(base.h * 0.55)];
    (base as any).lhand = [0, Math.round(base.h * 0.55)];
    (base as any).ox = 0;
    (base as any).hw = base.w;
    return base as any;
  }

  const sex = person.sex === 'F' ? 'F' : 'M';
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

  let matrix: string[] = PX_PEOPLE[sex][bracket].slice();

  const eyeRow = matrix.findIndex((row) => row.includes('E'));
  if (opts.bald && bracket !== 'baby') {
    matrix = matrix.map((row, idx) =>
      row.replace(/H/g, idx < eyeRow ? 'S' : '.')
    );
  }

  const topCol =
    opts.top ||
    (person.gen && person.tc != null
      ? moGenCol(pal, person.tc)
      : pal[person.role] || pal.par);
  const botCol = opts.bot || pal.pants;
  const dressCol =
    opts.dress ||
    (sex === 'F'
      ? opts.top || person.role === 'me'
        ? topCol
        : pxMix(topCol, pal.light(topCol, 0.4), 0.3)
      : botCol);

  const skinCol =
    person.sk != null && pal['sk' + person.sk]
      ? pal['sk' + person.sk]
      : pal.skin;

  const colorMap: Record<string, RGBColor> = {
    H: opts.hair || (person.age >= 65 ? pal.hairold : pal.hair),
    S: skinCol,
    E: pal.ol,
    c: pxMix(skinCol, pal.accent, 0.38),
    m: pal.shade(pxMix(skinCol, pal.accent, 0.5), 0.2),
    B: topCol,
    b: pal.shade(topCol, 0.22),
    P: botCol,
    D: dressCol,
    d: pal.shade(dressCol, 0.25),
    F: pal.ol,
  };

  const pose = bracket === 'baby' ? '' : opts.pose || '';
  let sprite = pxSprite(matrix, colorMap);
  let ox = 0;

  // Arm poses: wave / up
  if (pose === 'up' || pose === 'wave') {
    const cutArm = new PixelBuffer(sprite.w + 2, sprite.h);
    cutArm.blit(sprite, 1, 0, null);
    ox = 1;
    cutArm.px(0, 4, skinCol);
    cutArm.px(cutArm.w - 1, 4, skinCol);
    sprite = cutArm;
  }

  // Hold newborn baby bundle
  if (pose === 'hold') {
    const bundleCol = opts.bun || pal.light(pal.kid, 0.55);
    const bundle = pxSprite(
      [
        '.WWW.',
        'WSSSW',
        'WWWWW',
        '.WWW.',
      ],
      { W: bundleCol, S: pal.light(skinCol, 0.1) }
    );
    sprite.blit(bundle, Math.floor((sprite.w - 5) / 2), sprite.h - 9, null);
  }

  const result: any = opts.hat ? moHat(sprite, opts.hat, pal, opts.cap) : sprite;
  result.hand = [result.w - 1, result.h - 4];
  result.lhand = [0, result.h - 4];
  result.ox = ox;
  result.hw = bracket === 'adult' || bracket === 'teen' ? 9 : bracket === 'baby' ? 6 : 7;
  return result;
}

export function moHat(
  fig: PixelBuffer,
  hat: string,
  pal: PixelPalette,
  customColor?: RGBColor
): PixelBuffer {
  const topPad =
    hat === 'chef' || hat === 'party'
      ? 4
      : hat === 'turban'
      ? 3
      : hat === 'grad'
      ? 2
      : 1;
  const sidePad = hat === 'straw' || hat === 'grad' ? 2 : 0;
  const buf = new PixelBuffer(fig.w + sidePad * 2, fig.h + topPad);
  buf.blit(fig, sidePad, topPad, null);

  const cx = Math.floor(buf.w / 2);

  if (hat === 'grad') {
    const capCol = customColor || moNavy(pal);
    buf.rect(sidePad, topPad - 2, fig.w, 2, capCol);
    buf.px(cx, topPad - 3, pal.gold);
    buf.line(cx, topPad - 2, cx + 3, topPad, pal.gold);
  } else if (hat === 'party') {
    const col = customColor || pal.accent;
    buf.px(cx, 0, pal.gold);
    buf.rect(cx - 1, 1, 3, 1, col);
    buf.rect(cx - 2, 2, 5, 2, col);
  } else if (hat === 'chef') {
    buf.rect(sidePad + 1, topPad - 4, fig.w - 2, 4, moWhite(pal));
  } else if (hat === 'veil') {
    buf.rect(sidePad, topPad, fig.w, 1, moWhite(pal));
    buf.line(sidePad, topPad, sidePad - 1, topPad + 10, moWhite(pal));
    buf.line(sidePad + fig.w - 1, topPad, sidePad + fig.w, topPad + 10, moWhite(pal));
  }

  return buf;
}

export function moRow(
  mc: MomentContext,
  figures: { p: ScenePerson; s: PixelBuffer; dy?: number; gap?: number }[],
  centerX: number = MO_CX,
  groundY: number = PX.G,
  gap: number = 2
): number[] {
  const totalW = figures.reduce(
    (sum, fig) => sum + fig.s.w + (fig.gap != null ? fig.gap : gap),
    -gap
  );
  let startX = Math.round(centerX - totalW / 2);
  const xs: number[] = [];

  for (const fig of figures) {
    xs.push(startX);
    mc.front.blit(fig.s, startX, groundY - fig.s.h + (fig.dy || 0), mc.P.ol);
    startX += fig.s.w + (fig.gap != null ? fig.gap : gap);
  }

  moSpan(mc, Math.round(centerX - totalW / 2), Math.round(centerX + totalW / 2));
  return xs;
}

export function moSpan(mc: MomentContext, leftX: number, rightX: number): void {
  if (mc.span) {
    mc.span = [Math.min(mc.span[0], leftX), Math.max(mc.span[1], rightX)];
  } else {
    mc.span = [leftX, rightX];
  }
  mc.span = [Math.max(0, mc.span[0]), Math.min(PX.W, mc.span[1])];
}

export function moRoom(
  mc: MomentContext,
  opts: {
    wall?: RGBColor;
    floor?: 'tile' | 'wood' | 'mud' | 'mat';
    win?: [number, number][];
    frames?: number[];
    lamp?: number;
    plain?: boolean;
    view?: string;
  } = {}
): void {
  const P = mc.P;
  const groundY = PX.G;
  const wallCol = opts.wall || P.wall;

  mc.sky.rect(0, 0, PX.W, PX.H, wallCol);
  mc.mid.rect(0, 0, PX.W, groundY, wallCol);

  // Wallpaper texture
  for (let y = 2; y < groundY - 9; y++) {
    for (let x = (y % 6 < 3 ? 0 : 3); x < PX.W; x += 6) {
      if (y % 3 === 0) mc.mid.px(x, y, P.shade(wallCol, 0.05));
    }
  }

  // Baseboard
  if (!opts.plain) {
    mc.mid.rect(0, groundY - 9, PX.W, 8, P.shade(wallCol, 0.08));
    mc.mid.rect(0, groundY - 9, PX.W, 1, P.light(wallCol, 0.3));
  }
  mc.mid.rect(0, groundY - 2, PX.W, 2, P.shade(P.trunk, 0.1));

  // Floor
  const floorType = opts.floor || 'wood';
  const floorCol: RGBColor =
    floorType === 'tile'
      ? P.light(P.pave, 0.2)
      : floorType === 'mud'
      ? P.soil
      : floorType === 'mat'
      ? P.light(P.thatch, 0.2)
      : P.light(P.trunk, 0.25);

  mc.mid.rect(0, groundY, PX.W, PX.H - groundY, floorCol);
  for (let y = groundY + 2; y < PX.H; y += 3) {
    mc.mid.rect(0, y, PX.W, 1, P.shade(floorCol, 0.12));
  }

  // Windows
  for (const [winX, winW] of opts.win || []) {
    moWindow(mc, winX, 8, winW, 22, opts.view || 'd');
  }

  // Picture frames
  for (const fx of opts.frames || []) {
    mc.mid.rect(fx, 12, 9, 7, P.trunk);
    mc.mid.rect(fx + 1, 13, 7, 5, P.light(P.win, 0.2));
    mc.mid.rect(fx + 2, 15, 3, 3, P.tree);
    mc.mid.px(fx + 6, 14, P.sun);
  }

  // Floor lamp
  if (opts.lamp != null) {
    const lx = opts.lamp;
    mc.mid.rect(lx, groundY - 20, 1, 18, P.metal);
    mc.mid.rect(lx - 3, groundY - 25, 7, 5, P.light(P.gold, 0.35));
    mc.mid.rect(lx - 2, groundY - 2, 5, 1, P.metal);
  }
}

export function moWindow(
  mc: MomentContext,
  x: number,
  y: number,
  w: number,
  h: number,
  view: string = 'd'
): void {
  const P = mc.P;
  const frameCol = P.light(P.trunk, P.dark ? 0.1 : 0.3);
  const skyTop: RGBColor =
    view === 'night'
      ? pxRGB('#26335A')
      : view === 'dusk'
      ? pxRGB('#E9A27F')
      : P.sky.d[0];
  const skyBot: RGBColor =
    view === 'night'
      ? pxRGB('#4A4E78')
      : view === 'dusk'
      ? pxRGB('#F7D49B')
      : P.sky.d[1];

  mc.mid.rect(x - 1, y - 1, w + 2, h + 2, frameCol);
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      mc.mid.px(x + dx, y + dy, pxMix(skyTop, skyBot, dy / h));
    }
  }

  if (view === 'night') {
    mc.mid.disc(x + w - 5, y + 4, 2, pxRGB('#FFF4CF'));
    for (let i = 0; i < 4; i++) {
      mc.mid.px(
        Math.floor(x + 2 + mc.R() * (w - 4)),
        Math.floor(y + 2 + mc.R() * (h / 2)),
        pxRGB('#E8ECF2')
      );
    }
  }

  // Window mullions & sill
  mc.mid.rect(x + (w >> 1), y, 1, h, frameCol);
  mc.mid.rect(x, y + (h >> 1), w, 1, frameCol);
  mc.mid.rect(x - 1, y + h + 1, w + 2, 1, P.light(frameCol, 0.2));

  // Curtains
  const curtainCol = view === 'night' ? P.shade(P.accent, 0.2) : P.light(P.accent, 0.5);
  mc.mid.rect(x - 3, y - 2, 3, h + 4, curtainCol);
  mc.mid.rect(x + w, y - 2, 3, h + 4, curtainCol);
}

export function moTable(
  mc: MomentContext,
  x: number,
  w: number,
  groundY: number = PX.G,
  opts: { cloth?: boolean } = {}
): void {
  const P = mc.P;
  const tableCol = opts.cloth ? moWhite(P) : P.light(P.trunk, 0.15);
  const tableY = groundY - 10;

  mc.front.rect(x, tableY, w, 2, tableCol);
  mc.front.rect(x, tableY + 2, w, 1, P.shade(tableCol, 0.2));

  if (opts.cloth) {
    mc.front.rect(x, tableY + 3, w, 3, tableCol);
    for (let dx = 0; dx < w; dx += 3) {
      mc.front.px(x + dx, tableY + 5, P.shade(tableCol, 0.15));
    }
  }

  // Legs
  mc.front.rect(x + 1, tableY + 3, 1, groundY - tableY - 3, P.shade(P.trunk, 0.2));
  mc.front.rect(x + w - 2, tableY + 3, 1, groundY - tableY - 3, P.shade(P.trunk, 0.2));
}

export function moCake(mc: MomentContext, x: number, groundY: number = PX.G, candleCount: number = 3): void {
  const P = mc.P;
  const cakeY = groundY - 10;
  const cakeFrosting = P.light(P.wall, 0.8);
  const cakeBody = P.light(P.accent, 0.5);

  mc.front.rect(x, cakeY - 4, 9, 4, cakeFrosting);
  mc.front.rect(x, cakeY - 5, 9, 1, cakeBody);
  mc.front.px(x + 2, cakeY - 3, P.accent);
  mc.front.px(x + 6, cakeY - 2, P.accent);
  mc.front.rect(x, cakeY - 1, 9, 1, P.shade(cakeFrosting, 0.12));

  for (let i = 0; i < Math.min(4, candleCount); i++) {
    const cx = x + 1 + i * 2;
    mc.front.px(cx, cakeY - 6, P.light(P.gold, 0.3));
    mc.front.px(cx, cakeY - 7, P.light(P.gold, 0.3));
    mc.front.px(cx, cakeY - 8, pxRGB('#FFB43A'));
  }
}

export function moBunting(
  mc: MomentContext,
  y: number,
  startX: number = 0,
  endX: number = PX.W,
  targetLayer?: any
): void {
  const layer = targetLayer || mc.mid;
  const P = mc.P;
  const colors: RGBColor[] = [P.accent, P.gold, P.stamp, P.light(P.accent, 0.4), P.water];
  for (let x = startX; x < endX; x++) {
    const u = (x - startX) / Math.max(1, endX - startX);
    const sagY = Math.round(y + 4 * Math.sin(u * Math.PI));
    layer.px(x, sagY, P.ol);
    if ((x - startX) % 6 === 2) {
      const col = colors[Math.floor((x - startX) / 6) % colors.length];
      layer.rect(x - 1, sagY + 1, 3, 1, col);
      layer.px(x, sagY + 2, col);
    }
  }
}

export function moBalloons(mc: MomentContext, x: number, y: number, count: number = 3): void {
  const P = mc.P;
  const colors: RGBColor[] = [P.accent, P.gold, P.water, P.stamp];
  for (let i = 0; i < count; i++) {
    const bx = x + i * 4 - (i % 2);
    const by = y - (i % 2) * 3;
    const col = colors[i % colors.length];
    mc.front.disc(bx, by, 2, col);
    mc.front.px(bx - 1, by - 1, P.light(col, 0.5));
    mc.front.line(bx, by + 3, x + 4, y + 12, P.light(P.ol, 0.4));
  }
}

export function moFlowers(
  mc: MomentContext,
  x: number,
  y: number,
  targetLayer?: any,
  count: number = 3,
  col?: RGBColor
): void {
  const layer = targetLayer || mc.front;
  const P = mc.P;
  for (let i = 0; i < count; i++) {
    const fx = x + i * 2;
    const fy = y - (i % 2);
    layer.line(fx, fy, fx, y + 3, P.tree2);
    layer.px(fx, fy - 1, col || [P.accent, P.gold, P.light(P.wall, 0.8)][i % 3]);
  }
}

export function moVase(mc: MomentContext, x: number, groundY: number = PX.G): void {
  const P = mc.P;
  mc.front.rect(x, groundY - 1, 8, 1, P.light(P.trunk, 0.1));
  mc.front.rect(x + 1, groundY, 1, PX.G - groundY, P.trunk);
  mc.front.rect(x + 6, groundY, 1, PX.G - groundY, P.trunk);
  mc.front.rect(x + 3, groundY - 4, 2, 3, P.light(P.water, 0.4));
  moFlowers(mc, x + 2, groundY - 6, mc.front, 3);
}

export function moBed(
  mc: MomentContext,
  x: number,
  w: number,
  groundY: number = PX.G,
  occupant?: PixelBuffer | null,
  opts: { hosp?: boolean; blanket?: RGBColor } = {}
): void {
  const P = mc.P;
  const layer = mc.front;
  const frameCol = opts.hosp ? P.light(P.metal, 0.35) : P.shade(P.trunk, 0.05);
  const sheetCol = moWhite(P);
  const blanketCol =
    opts.blanket ||
    (opts.hosp ? P.light(P.water, 0.55) : P.light(P.accent, 0.45));

  // Headboard & footboard
  layer.rect(x, groundY - 12, 2, 12, frameCol);
  layer.rect(x + w - 2, groundY - 5, 2, 5, frameCol);
  layer.rect(x + 2, groundY, w - 4, 3, sheetCol);

  // Pillow
  layer.rect(x + 2, groundY - 4, 8, 4, sheetCol);
  layer.rect(x + 2, groundY - 1, 8, 1, P.shade(sheetCol, 0.1));

  // Occupant upper body
  if (occupant) {
    layer.blit(occupant, x + 4, groundY - occupant.h + 2, P.ol);
  }

  // Blanket
  layer.rect(x + 3, groundY - 1, w - 5, 4, blanketCol);
  layer.rect(x + 3, groundY - 1, w - 5, 1, P.light(blanketCol, 0.3));
  layer.rect(x + 3, groundY + 2, w - 5, 1, P.shade(blanketCol, 0.15));

  // Hospital IV drip stand
  if (opts.hosp) {
    layer.rect(x + w + 3, groundY - 22, 1, 22, P.metal);
    layer.rect(x + w + 1, groundY - 22, 5, 1, P.metal);
    layer.rect(x + w + 2, groundY - 21, 3, 5, P.light(P.water2 || P.win, 0.4));
    layer.line(x + w + 3, groundY - 16, x + w - 6, groundY - 2, P.light(P.metal, 0.3));
  }
}

export function moSky(mc: MomentContext, stage: string = 'd', targetLayer?: any): void {
  const layer = targetLayer || mc.sky;
  const P = mc.P;

  if (stage === 'night') {
    const topCol = pxRGB(P.dark ? '#0E1526' : '#1E2A4A');
    const botCol = pxRGB(P.dark ? '#28304A' : '#4A4E78');
    for (let y = 0; y < PX.H; y++) {
      for (let x = 0; x < PX.W; x++) {
        layer.dither(x, y, pxMix(topCol, botCol, Math.min(1, y / PX.G)), 1);
      }
    }
    fxStars(mc, 30, layer);
    return;
  }

  pxSky(layer, Object.assign({}, mc.m, { stage }), P, mc.R);
}

export function moGrass(mc: MomentContext, targetLayer?: any, groundY: number = PX.G): void {
  const layer = targetLayer || mc.mid;
  const P = mc.P;
  layer.rect(0, groundY, PX.W, PX.H - groundY, P.grass);
  layer.rect(0, groundY, PX.W, 1, P.grasshi);
}

export function moPave(mc: MomentContext, targetLayer?: any): void {
  const layer = targetLayer || mc.mid;
  const P = mc.P;
  layer.rect(0, PX.G, PX.W, PX.H - PX.G, P.pave);
  for (let y = PX.G + 3; y < PX.H; y += 4) {
    layer.rect(0, y, PX.W, 1, P.pave2);
  }
}

// ---------------------------------------------------------------------------
// 40 Special Life Moments Engine (`MO`)
// ---------------------------------------------------------------------------

export const MO: Record<string, MomentFn> = {
  born: (mc) => {
    const P = mc.P;
    const cast = mc.cast;
    const isUrban = mc.m.urban && !['hut', 'tent'].includes(mc.m.home);
    const mom = cast.par.find((p) => p.sex === 'F') || moGen(mc, 'par', 'F', 28);
    const dad = cast.par.find((p) => p.sex === 'M');

    moRoom(mc, {
      wall: isUrban ? pxMix(P.wall, P.light(P.water, 0.6), 0.3) : P.wall,
      floor: isUrban ? 'tile' : 'wood',
      win: [[22, 26], [150, 22]],
    });

    const momFig = moFig(mom, P, { pose: 'hold', bun: P.light(P.me, 0.55) });
    moBed(mc, 72, 44, PX.G - 10, momFig, { hosp: isUrban });
    fxHeart(mc, 79, PX.G - 22);

    if (dad) {
      const dadFig = moFig(dad, P, { pose: 'wave' });
      mc.front.blit(dadFig, 122, PX.G - dadFig.h, P.ol);
      moSpan(mc, 72, 134);
    }
    moVase(mc, 56, PX.G - 10);
  },

  baby: (mc) => {
    const P = mc.P;
    const cast = mc.cast;
    moRoom(mc, { win: [[28, 22]], frames: [136, 150], lamp: 170 });

    const meHolding = moFig(cast.me, P, { pose: 'hold', bun: P.light(P.kid, 0.55) });
    const familyRow = [
      { p: cast.me, s: meHolding, dy: 1 },
      ...cast.pt.map((p) => ({ p, s: moFig(p, P, { pose: 'wave' }) })),
    ];
    moRow(mc, familyRow, MO_CX - 10);

    // Baby crib
    const cribX = MO_CX + 24;
    mc.front.rect(cribX, PX.G - 11, 18, 1, P.trunk);
    for (let x = 0; x < 18; x += 3) {
      mc.front.rect(cribX + x, PX.G - 11, 1, 11, P.trunk);
    }
    mc.front.rect(cribX, PX.G - 4, 18, 1, P.trunk);
    fxHeart(mc, cribX + 7, PX.G - 18);
  },

  school: (mc) => {
    const P = mc.P;
    const cast = mc.cast;
    moRoom(mc, {
      wall: P.light(P.wall, 0.1),
      floor: 'wood',
      win: [[130, 24]],
    });

    // Classroom chalkboard
    mc.mid.rect(20, 10, 44, 22, P.ol);
    mc.mid.rect(21, 11, 42, 20, pxRGB('#284534'));
    mc.mid.rect(26, 18, 12, 1, P.light(P.wall, 0.8));
    mc.mid.rect(26, 22, 18, 1, P.light(P.wall, 0.8));

    // Desks & students
    const student = moFig(cast.me, P, { pose: 'sit' });
    moRow(mc, [{ p: cast.me, s: student }], 84, PX.G, 4);

    const teacher = moGen(mc, 'par', 'F', 38);
    const teacherFig = moFig(teacher, P, { pose: 'wave' });
    mc.front.blit(teacherFig, 140, PX.G - teacherFig.h, P.ol);
  },

  grad: (mc) => {
    const P = mc.P;
    const cast = mc.cast;
    moSky(mc, 'd');
    moGrass(mc);

    // University campus pillars
    for (const colX of [30, 50, 140, 160]) {
      mc.mid.rect(colX, 10, 8, PX.G - 10, P.wall2);
      mc.mid.rect(colX - 2, 8, 12, 2, P.light(P.wall2, 0.2));
    }

    const gradMe = moFig(cast.me, P, { hat: 'grad', top: moNavy(P) });
    const peers = [
      ...cast.pt.map((p) => ({ p, s: moFig(p, P, { hat: 'grad' }) })),
      { p: cast.me, s: gradMe },
    ];
    moRow(mc, peers, MO_CX);
    fxConfetti(mc, 32);
  },

  pass: (mc) => {
    moRoom(mc, { win: [[24, 22]], frames: [140] });
    const meFig = moFig(mc.cast.me, mc.P, { pose: 'up' });
    moRow(mc, [{ p: mc.cast.me, s: meFig }], MO_CX);
    fxSpark(mc, MO_CX, 20, 6);
  },

  study: (mc) => {
    moRoom(mc, { lamp: 110, win: [[30, 22]], view: 'night' });
    const meFig = moFig(mc.cast.me, mc.P, { pose: 'sit' });
    moRow(mc, [{ p: mc.cast.me, s: meFig }], 80);
    moTable(mc, 70, 30, PX.G, { cloth: false });
  },

  wed: (mc) => {
    const P = mc.P;
    const cast = mc.cast;
    moSky(mc, 'd');
    moGrass(mc);

    // Wedding floral arbor arch
    const archX = MO_CX - 16;
    mc.mid.rect(archX, 12, 32, 2, P.trunk);
    mc.mid.rect(archX, 14, 2, PX.G - 14, P.trunk);
    mc.mid.rect(archX + 30, 14, 2, PX.G - 14, P.trunk);
    for (let x = archX - 2; x <= archX + 32; x += 4) {
      mc.mid.disc(x, 12, 3, P.tree);
      mc.mid.px(x, 11, P.light(P.accent, 0.6));
    }

    const meWed = moFig(cast.me, P, {
      dress: cast.me.sex === 'F' ? moWhite(P) : undefined,
      hat: cast.me.sex === 'F' ? 'veil' : undefined,
    });
    const partner = cast.pt[0] || moGen(mc, 'pt', cast.me.sex === 'F' ? 'M' : 'F', cast.me.age);
    const partnerWed = moFig(partner, P, {
      dress: partner.sex === 'F' ? moWhite(P) : undefined,
      hat: partner.sex === 'F' ? 'veil' : undefined,
    });

    moRow(mc, [{ p: cast.me, s: meWed }, { p: partner, s: partnerWed }], MO_CX, PX.G, 4);
    fxPetals(mc, 28);
    fxHeart(mc, MO_CX - 3, 22);
  },

  date: (mc) => {
    moSky(mc, 'dusk');
    moPave(mc);
    const partner = mc.cast.pt[0] || moGen(mc, 'pt', 'M', mc.cast.me.age);
    const row = [
      { p: mc.cast.me, s: moFig(mc.cast.me, mc.P, { pose: 'sit' }) },
      { p: partner, s: moFig(partner, mc.P, { pose: 'sit' }) },
    ];
    moRow(mc, row, MO_CX, PX.G, 16);
    moTable(mc, MO_CX - 12, 24, PX.G, { cloth: true });
    fxHeart(mc, MO_CX - 3, 24);
  },

  anniv: (mc) => {
    moRoom(mc, { win: [[24, 20]], frames: [144] });
    const partner = mc.cast.pt[0] || moGen(mc, 'pt', 'M', mc.cast.me.age);
    moRow(
      mc,
      [
        { p: mc.cast.me, s: moFig(mc.cast.me, mc.P) },
        { p: partner, s: moFig(partner, mc.P) },
      ],
      MO_CX,
      PX.G,
      8
    );
    fxSpark(mc, MO_CX, 26, 6);
  },

  cake: (mc) => {
    moRoom(mc, { win: [[30, 20]] });
    moBunting(mc, 12, 10, PX.W - 10);
    moBalloons(mc, 26, 18, 3);
    moBalloons(mc, 160, 18, 3);

    const meFig = moFig(mc.cast.me, mc.P, { hat: 'party' });
    moRow(mc, [{ p: mc.cast.me, s: meFig }], MO_CX);
    moTable(mc, MO_CX - 16, 32, PX.G, { cloth: true });
    moCake(mc, MO_CX - 4, PX.G);
    fxConfetti(mc, 24);
  },

  meal: (mc) => {
    moRoom(mc, { win: [[24, 22]], frames: [140] });
    const cast = mc.cast;
    const diners = [
      { p: cast.me, s: moFig(cast.me, mc.P) },
      ...cast.pt.map((p) => ({ p, s: moFig(p, mc.P) })),
      ...cast.kids.slice(0, 3).map((p) => ({ p, s: moFig(p, mc.P) })),
    ];
    moRow(mc, diners, MO_CX, PX.G, 6);
    moTable(mc, MO_CX - 28, 56, PX.G, { cloth: true });
  },

  bed: (mc) => {
    moRoom(mc, { win: [[24, 22]], view: 'night', lamp: 150 });
    const meFig = moFig(mc.cast.me, mc.P);
    moBed(mc, 74, 44, PX.G - 10, meFig);
  },

  play: (mc) => {
    moSky(mc, 'd');
    moGrass(mc);
    const kid = mc.cast.kids[0] || moGen(mc, 'kid', 'M', 6);
    moRow(
      mc,
      [
        { p: mc.cast.me, s: moFig(mc.cast.me, mc.P, { pose: 'wave' }) },
        { p: kid, s: moFig(kid, mc.P, { pose: 'up' }) },
      ],
      MO_CX,
      PX.G,
      12
    );
    // Ball
    mc.front.disc(MO_CX + 18, PX.G - 4, 3, mc.P.accent);
  },

  hosp: (mc) => {
    moRoom(mc, { floor: 'tile', win: [[24, 22]], plain: true });
    const patientFig = moFig(mc.cast.me, mc.P);
    moBed(mc, 70, 46, PX.G - 10, patientFig, { hosp: true });
  },

  loss: (mc) => {
    moSky(mc, 'night');
    moGrass(mc);
    // Headstones
    for (const hx of [50, 96, 142]) {
      mc.mid.rect(hx - 4, PX.G - 12, 8, 12, mc.P.wall2);
      mc.mid.disc(hx, PX.G - 12, 4, mc.P.wall2);
    }
    const mourner = moFig(mc.cast.me, mc.P, { top: mc.P.ol });
    moRow(mc, [{ p: mc.cast.me, s: mourner }], MO_CX);
    fxRain(mc, 40);
  },

  mem: (mc) => {
    moSky(mc, 'dusk');
    moGrass(mc);
    mc.mid.rect(MO_CX - 8, PX.G - 20, 16, 20, mc.P.wall2);
    mc.mid.rect(MO_CX - 6, PX.G - 18, 12, 14, mc.P.metal);
    moFlowers(mc, MO_CX - 12, PX.G - 2, mc.front, 5);
    const meFig = moFig(mc.cast.me, mc.P);
    moRow(mc, [{ p: mc.cast.me, s: meFig }], MO_CX + 28);
  },

  friends: (mc) => {
    moSky(mc, 'd');
    moGrass(mc);
    const peers = [
      { p: mc.cast.me, s: moFig(mc.cast.me, mc.P) },
      ...mc.cast.sib.slice(0, 2).map((p) => ({ p, s: moFig(p, mc.P, { pose: 'wave' }) })),
    ];
    if (peers.length === 1) {
      peers.push({ p: moGen(mc, 'sib', 'F', mc.cast.me.age), s: moFig(moGen(mc, 'sib'), mc.P) });
    }
    moRow(mc, peers, MO_CX, PX.G, 6);
  },

  walk: (mc) => {
    moSky(mc, 'd');
    moPave(mc);
    pxTree(mc.mid, 34, PX.G, 'round', mc.P);
    pxTree(mc.mid, 158, PX.G, 'round', mc.P);
    const meWalk = moFig(mc.cast.me, mc.P, { pose: 'walk' });
    moRow(mc, [{ p: mc.cast.me, s: meWalk }], MO_CX);
  },

  work: (mc) => {
    moRoom(mc, { win: [[140, 24]], floor: 'tile' });
    const meWork = moFig(mc.cast.me, mc.P, { pose: 'sit' });
    moRow(mc, [{ p: mc.cast.me, s: meWork }], 76);
    moTable(mc, 66, 30, PX.G, { cloth: false });
    // Computer screen
    mc.front.rect(74, PX.G - 16, 8, 6, mc.P.metal);
    mc.front.rect(75, PX.G - 15, 6, 4, mc.P.winlit);
  },

  trip: (mc) => {
    // Tropical beach
    const P = mc.P;
    moSky(mc, 'd');
    mc.mid.rect(0, PX.G - 6, PX.W, PX.H - PX.G + 6, P.sand);
    mc.mid.rect(0, PX.G - 12, PX.W, 6, P.water);
    for (let x = 0; x < PX.W; x += 4) {
      mc.mid.px(x, PX.G - 12, P.water2);
    }
    pxTree(mc.mid, 28, PX.G - 4, 'palm', P);
    pxTree(mc.mid, 164, PX.G - 4, 'palm', P);
    const meBeach = moFig(mc.cast.me, P, { hat: 'straw' });
    moRow(mc, [{ p: mc.cast.me, s: meBeach }], MO_CX);
  },

  fly: (mc) => {
    moSky(mc, 'm');
    moPave(mc);
    // Airplane climbing
    const plane = pxSprite(
      [
        '...........WW...',
        '..........WWWW..',
        'WWWWWWWWWWWWWWWW',
        '..WWWWWWWWWW....',
        '......WW........',
      ],
      { W: mc.P.wall }
    );
    mc.sky.blit(plane, 130, 14, mc.P.ol);
    const meTravel = moFig(mc.cast.me, mc.P);
    moRow(mc, [{ p: mc.cast.me, s: meTravel }], 60);
  },

  back: (mc) => {
    moSky(mc, 'dusk');
    pxHills(mc.mid, mc.P, mc.R, 0.04, PX.G - 6, 12, mc.P.hill1);
    const meHiker = moFig(mc.cast.me, mc.P, { hat: 'straw' });
    moRow(mc, [{ p: mc.cast.me, s: meHiker }], MO_CX);
  },

  home: (mc) => {
    moSky(mc, 'd');
    moGrass(mc);
    // New house backdrop
    const house = pxHouse(mc.P, 26, 14, 10, mc.P.roof, mc.P.wall, { chimney: true });
    mc.mid.blit(house, 40, PX.G - house.h, mc.P.ol);
    const meHome = moFig(mc.cast.me, mc.P, { pose: 'wave' });
    moRow(mc, [{ p: mc.cast.me, s: meHome }], 110);
    fxSpark(mc, 110, 28, 4);
  },

  car: (mc) => {
    moSky(mc, 'd');
    moPave(mc);
    const carBuf = pxCar(mc.P, mc.P.accent);
    mc.front.blit(carBuf, MO_CX - 12, PX.G - 7, mc.P.ol);
    const meDriver = moFig(mc.cast.me, mc.P, { pose: 'wave' });
    mc.front.blit(meDriver, MO_CX + 14, PX.G - meDriver.h, mc.P.ol);
    fxSpark(mc, MO_CX - 4, PX.G - 10, 4);
  },

  pet: (mc) => {
    moSky(mc, 'd');
    moGrass(mc);
    const petBuf = pxPet('d', mc.P);
    const mePet = moFig(mc.cast.me, mc.P);
    moRow(mc, [{ p: mc.cast.me, s: mePet }], MO_CX - 10);
    mc.front.blit(petBuf, MO_CX + 8, PX.G - petBuf.h, mc.P.ol);
    fxHeart(mc, MO_CX + 4, PX.G - 16);
  },

  grand: (mc) => {
    moRoom(mc, { frames: [30, 140] });
    const elderMe = moFig(mc.cast.me, mc.P, { pose: 'sit' });
    const kid = mc.cast.gk[0] || mc.cast.kids[0] || moGen(mc, 'kid', 'F', 4);
    const kidFig = moFig(kid, mc.P, { pose: 'wave' });
    moRow(
      mc,
      [
        { p: mc.cast.me, s: elderMe },
        { p: kid, s: kidFig },
      ],
      MO_CX,
      PX.G,
      10
    );
    fxHeart(mc, MO_CX - 2, 26);
  },

  phone: (mc) => {
    moRoom(mc, { win: [[24, 20]] });
    const mePhone = moFig(mc.cast.me, mc.P, { pose: 'hold' });
    moRow(mc, [{ p: mc.cast.me, s: mePhone }], MO_CX);
    // Sound wave notes
    fxNote(mc, MO_CX + 8, 22);
  },

  photos: (mc) => {
    moRoom(mc, { frames: [30, 60, 120, 150] });
    const mePhoto = moFig(mc.cast.me, mc.P, { pose: 'sit' });
    moRow(mc, [{ p: mc.cast.me, s: mePhoto }], MO_CX);
    fxSpark(mc, MO_CX, 26, 4);
  },

  garden: (mc) => {
    moSky(mc, 'd');
    moGrass(mc);
    for (let x = 30; x <= 160; x += 18) {
      moFlowers(mc, x, PX.G - 4, mc.mid, 3);
    }
    const meGardener = moFig(mc.cast.me, mc.P, { hat: 'straw' });
    moRow(mc, [{ p: mc.cast.me, s: meGardener }], MO_CX);
  },

  help: (mc) => {
    moSky(mc, 'd');
    moPave(mc);
    // Relief boxes
    mc.front.rect(MO_CX + 14, PX.G - 6, 8, 6, mc.P.trunk);
    mc.front.rect(MO_CX + 24, PX.G - 6, 8, 6, mc.P.trunk);
    const meHelper = moFig(mc.cast.me, mc.P, { pose: 'wave' });
    moRow(mc, [{ p: mc.cast.me, s: meHelper }], MO_CX - 8);
    fxHeart(mc, MO_CX + 18, PX.G - 14);
  },

  fest: (mc) => {
    moSky(mc, 'night');
    moPave(mc);
    fxLanterns(mc, 14, 0, PX.W);
    const meFest = moFig(mc.cast.me, mc.P, { pose: 'wave' });
    moRow(mc, [{ p: mc.cast.me, s: meFest }], MO_CX);
    fxSpark(mc, MO_CX, 28, 6);
  },

  stars: (mc) => {
    moSky(mc, 'night');
    moGrass(mc);
    fxStars(mc, 50);
    // Shooting star
    mc.sky.line(110, 8, 146, 20, pxRGB('#FFF4CF'));
    const meStar = moFig(mc.cast.me, mc.P, { pose: 'sit' });
    moRow(mc, [{ p: mc.cast.me, s: meStar }], MO_CX);
  },

  rain: (mc) => {
    moSky(mc, 'd');
    moPave(mc);
    // Puddle ripples
    mc.mid.rect(60, PX.G + 3, 22, 2, mc.P.water2);
    mc.mid.rect(120, PX.G + 4, 18, 2, mc.P.water2);
    const meRain = moFig(mc.cast.me, mc.P, { pose: 'walk' });
    moRow(mc, [{ p: mc.cast.me, s: meRain }], MO_CX);
    fxRain(mc, 60);
  },

  talk: (mc) => {
    moSky(mc, 'dusk');
    moPave(mc);
    const peer = mc.cast.pt[0] || mc.cast.sib[0] || moGen(mc, 'sib', 'F', mc.cast.me.age);
    const row = [
      { p: mc.cast.me, s: moFig(mc.cast.me, mc.P, { pose: 'sit' }) },
      { p: peer, s: moFig(peer, mc.P, { pose: 'sit' }) },
    ];
    moRow(mc, row, MO_CX, PX.G, 14);
  },

  mil: (mc) => {
    moSky(mc, 'd');
    moPave(mc);
    // Flagpole
    mc.mid.line(150, PX.G - 1, 150, PX.G - 32, mc.P.metal);
    mc.mid.rect(151, PX.G - 32, 8, 5, mc.P.accent);
    const meMil = moFig(mc.cast.me, mc.P, { top: mc.P.tree2 });
    moRow(mc, [{ p: mc.cast.me, s: meMil }], 80);
  },

  award: (mc) => {
    moRoom(mc, { win: [[24, 20]] });
    // Podium
    mc.mid.rect(MO_CX - 12, PX.G - 8, 24, 8, mc.P.wall2);
    mc.mid.rect(MO_CX - 10, PX.G - 8, 20, 1, mc.P.gold);
    const meAward = moFig(mc.cast.me, mc.P, { pose: 'up' });
    moRow(mc, [{ p: mc.cast.me, s: meAward }], MO_CX, PX.G - 8);
    fxSpark(mc, MO_CX, 20, 8);
  },

  shop: (mc) => {
    moRoom(mc, { floor: 'tile', win: [[140, 20]] });
    // Vegetable fruit bins
    mc.mid.rect(30, PX.G - 8, 36, 8, mc.P.trunk);
    for (let x = 32; x < 64; x += 3) {
      mc.mid.px(x, PX.G - 9, [mc.P.accent, mc.P.gold, mc.P.tree][(x / 3) % 3]);
    }
    const meShop = moFig(mc.cast.me, mc.P);
    moRow(mc, [{ p: mc.cast.me, s: meShop }], 100);
  },

  flee: (mc) => {
    moSky(mc, 'night');
    moPave(mc);
    // Barbed wire border fence
    for (let x = 0; x < PX.W; x++) {
      mc.mid.px(x, PX.G - 8, mc.P.ol);
      if (x % 8 === 0) mc.mid.rect(x, PX.G - 14, 1, 14, mc.P.metal);
    }
    const meRefugee = moFig(mc.cast.me, mc.P, { pose: 'walk' });
    moRow(mc, [{ p: mc.cast.me, s: meRefugee }], 60);
  },

  citizen: (mc) => {
    moRoom(mc, { win: [[24, 20]] });
    // National flag on wall
    mc.mid.rect(MO_CX - 12, 10, 24, 14, mc.P.accent);
    mc.mid.rect(MO_CX - 12, 14, 24, 6, mc.P.wall);
    const meCitizen = moFig(mc.cast.me, mc.P, { pose: 'up' });
    moRow(mc, [{ p: mc.cast.me, s: meCitizen }], MO_CX);
    fxSpark(mc, MO_CX, 26, 6);
  },

  hobby: (mc) => {
    moRoom(mc, { win: [[30, 22]], frames: [140] });
    const meHobby = moFig(mc.cast.me, mc.P);
    moRow(mc, [{ p: mc.cast.me, s: meHobby }], 70);
    // Easel with canvas painting
    mc.front.line(90, PX.G - 1, 94, PX.G - 20, mc.P.trunk);
    mc.front.line(98, PX.G - 1, 94, PX.G - 20, mc.P.trunk);
    mc.front.rect(88, PX.G - 18, 12, 9, mc.P.wall);
    mc.front.rect(90, PX.G - 16, 8, 5, mc.P.tree);
    mc.front.px(94, PX.G - 15, mc.P.sun);
  },

  pvBack: (mc) => {
    // Studio photo backdrop
    moSky(mc, 'd');
    mc.sky.disc(MO_CX, 24, 18, mc.P.light(mc.P.wall, 0.4));
    const meModel = moFig(mc.cast.me, mc.P, { pose: 'wave' });
    moRow(mc, [{ p: mc.cast.me, s: meModel }], MO_CX);
    fxSpark(mc, MO_CX, 22, 6);
  },
};

// ---------------------------------------------------------------------------
// Cultural Funeral Rites
// ---------------------------------------------------------------------------

export function pxFuneral(
  model: SceneModel,
  pal: PixelPalette,
  mourners: ScenePerson[] = []
): PixelBuffer {
  const prng = lvRand(model.seed + 'funeral');
  const buf = new PixelBuffer(PX.W, PX.H);
  const groundY = PX.G;
  const altarX = 96;

  pxSky(buf, model, pal, prng);
  for (let i = 0; i < 2; i++) {
    pxCloud(
      buf,
      30 + i * 110 + prng() * 20,
      12 + Math.round(prng() * 8),
      18 + Math.round(prng() * 10),
      pal,
      prng,
      false
    );
  }
  pxBackdrop(buf, model, pal, prng);
  pxGround(buf, model, pal, prng);

  const rel = model.rel || '';
  const isMuslim = rel === 'M';
  const isHinduSikh = rel === 'H' || rel === 'S';
  const isSecular = !isMuslim && rel !== 'J';
  const isBuddhist = !isMuslim && rel !== 'C' && rel !== 'J' && (rel === 'B' || model.fl === 'eas');

  const stoneCol = pal.light(pal.wall, pal.dark ? 0.1 : 0.5);
  const garlandCol =
    isHinduSikh || model.fl === 'sa'
      ? pal.gold
      : model.fl === 'eas'
      ? pal.light(pal.wall, 0.6)
      : pal.light(pal.wall, 0.45);

  // Base platform
  buf.rect(altarX - 16, groundY - 7, 32, 7, pal.shade(pal.trunk, 0.15));
  buf.rect(altarX - 17, groundY - 8, 34, 2, stoneCol);
  buf.rect(altarX - 16, groundY - 6, 32, 1, pal.shade(stoneCol, 0.2));

  if (isMuslim) {
    // White shrouded earthen bier mound
    const shroudCol = pal.light(pal.wall, pal.dark ? 0.55 : 0.85);
    buf.rect(altarX - 18, groundY - 9, 36, 1, pal.shade(pal.trunk, 0.05));
    buf.rect(altarX - 13, groundY - 12, 27, 3, shroudCol);
    buf.disc(altarX - 13, groundY - 11, 2, shroudCol);
    buf.rect(altarX - 12, groundY - 13, 24, 1, pal.light(shroudCol, 0.4));
    for (const sx of [altarX - 8, altarX, altarX + 8]) {
      buf.rect(sx, groundY - 12, 1, 3, pal.shade(shroudCol, 0.18));
    }
  } else {
    // Memorial photo / portrait frame
    buf.rect(altarX - 7, groundY - 25, 14, 17, pal.ol);
    buf.rect(altarX - 6, groundY - 24, 12, 15, pal.light(pal.wall2, 0.3));
    buf.rect(altarX - 3, groundY - 13, 6, 4, pal.me);
    buf.disc(
      altarX,
      groundY - 17,
      2,
      model.sk != null && pal['sk' + model.sk] ? pal['sk' + model.sk] : pal.skin
    );
    buf.rect(altarX - 2, groundY - 20, 5, 2, model.people?.[0]?.age && model.people[0].age >= 65 ? pal.hairold : pal.hair);

    if (isHinduSikh) {
      // Marigold flower garland around frame
      for (let k = 0; k <= 16; k++) {
        const fy = groundY - 24 + k;
        buf.px(altarX - 8, fy, k % 2 ? pal.gold : pal.accent);
        buf.px(altarX + 7, fy, k % 2 ? pal.accent : pal.gold);
      }
      for (let k = 0; k < 7; k++) {
        buf.px(altarX - 6 + k * 2, groundY - 8, k % 2 ? pal.gold : pal.accent);
      }
    } else {
      // Black mourning ribbon across frame corners
      buf.line(altarX - 7, groundY - 22, altarX - 4, groundY - 25, pal.ol);
      buf.line(altarX + 6, groundY - 22, altarX + 3, groundY - 25, pal.ol);
    }

    if (rel === 'C') {
      // Christian cross
      buf.rect(altarX, groundY - 31, 1, 5, pal.ol);
      buf.rect(altarX - 1, groundY - 30, 3, 1, pal.ol);
    }
  }

  // Floral wreaths
  if (isSecular) {
    for (let k = 0; k < 6; k++) {
      buf.disc(Math.floor(altarX - 14 + k * 1.5), groundY - 9 - (k % 2), 1, garlandCol);
      buf.disc(Math.floor(altarX + 7 + k * 1.5), groundY - 9 - (k % 2), 1, garlandCol);
    }
  }

  // Candles / Oil lamps (diyas)
  if (isHinduSikh) {
    for (const cx of [altarX - 19, altarX + 18]) {
      buf.rect(cx - 1, groundY - 2, 3, 2, pal.shade(pal.trunk, 0.1));
      buf.px(cx, groundY - 3, pal.gold);
      buf.px(cx, groundY - 4, pal.sunhi);
    }
  } else if (!isMuslim) {
    for (const cx of [altarX - 19, altarX + 18]) {
      buf.rect(cx, groundY - 6, 1, 6, pal.light(pal.wall, 0.5));
      buf.px(cx, groundY - 7, pal.gold);
      buf.px(cx, groundY - 8, pal.sunhi);
    }
  }

  // Buddhist incense altar with curling smoke
  if (isBuddhist) {
    buf.rect(altarX - 2, groundY - 7, 5, 2, pal.shade(pal.metal, 0.1));
    for (const ix of [altarX - 1, altarX, altarX + 1]) {
      buf.px(ix, groundY - 8, pal.trunk);
      buf.px(ix, groundY - 9, pal.trunk);
      buf.px(ix, groundY - 10, pal.accent);
    }
    for (const [sx, sy] of [
      [1, 12],
      [2, 14],
      [4, 16],
      [5, 18],
    ]) {
      buf.px(altarX + sx, groundY - sy, pal.smoke);
    }
  }

  // Mourning robes color
  pal.mourn = isMuslim
    ? pal.light(pal.wall, pal.dark ? 0.45 : 0.8)
    : pal.dark
    ? pal.light(pal.ol, 0.28)
    : pal.light(pal.ol, 0.16);

  // Position mourners on left and right sides
  const mournList = mourners.length ? mourners : model.people || [];
  const sprites = mournList.map((p) =>
    pxPerson(Object.assign({}, p, { role: 'mourn' }), pal)
  );

  let leftX = altarX - 23;
  for (let i = 0; i < sprites.length; i += 2) {
    const s = sprites[i];
    leftX -= s.w;
    if (leftX < 2) break;
    buf.blit(s, leftX, groundY - s.h, pal.ol);
    leftX -= 3;
  }

  let rightX = altarX + 23;
  for (let i = 1; i < sprites.length; i += 2) {
    const s = sprites[i];
    if (rightX + s.w > PX.W - 2) break;
    buf.blit(s, rightX, groundY - s.h, pal.ol);
    rightX += s.w + 3;
  }

  return buf;
}

/**
 * Dispatches and renders a life moment vignette into 4 composite layers
 */
export function pxMoment(
  model: SceneModel,
  pal: PixelPalette
): {
  sky: PixelBuffer;
  back: PixelBuffer;
  mid: PixelBuffer;
  front: PixelBuffer;
  people: [number, number];
} | null {
  const actKey = String(model.act || '').split(':')[0];
  const handler = MO[actKey];
  if (!handler) return null;

  const prng = lvRand(String(model.seed || '') + model.act);
  const createLayer = () => new PixelBuffer(PX.W, PX.H);

  const mc: MomentContext = {
    m: model,
    P: pal,
    R: prng,
    a: String(model.act || '').split(':').slice(1),
    sky: createLayer(),
    back: createLayer(),
    mid: createLayer(),
    front: createLayer(),
    span: null,
    cast: moCast(model),
  };

  handler(mc);

  return {
    sky: mc.sky as PixelBuffer,
    back: mc.back as PixelBuffer,
    mid: mc.mid as PixelBuffer,
    front: mc.front as PixelBuffer,
    people: mc.span || [78, 114],
  };
}
