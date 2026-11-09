/**
 * Procedural Scenery & Environmental Rendering Engine
 * Sky gradients, clouds, celestial bodies, regional flora, utility infrastructure, and terrain
 */

import type { RGBColor, SceneModel, PixelPalette, PixelBufferInterface } from '../../types/pixelArt';
import { PX, PX_BAYER, PixelBuffer, pxMix } from './palette';

/**
 * Renders atmospheric sky gradient, dithering, sun/moon, and stars
 */
export function pxSky(
  buf: PixelBufferInterface,
  model: SceneModel,
  pal: PixelPalette,
  prng: () => number
): void {
  const stage = model.stage || 'd';
  const isLowMood = model.mood === 'low';

  const rawSky = pal.sky[stage] || pal.sky.d;
  const topCol: RGBColor = isLowMood ? pxMix(rawSky[0], pal.cloudlow, 0.35) : rawSky[0];
  const botCol: RGBColor = isLowMood ? pxMix(rawSky[1], pal.cloudlow, 0.35) : rawSky[1];

  const stops: RGBColor[] = [0, 1, 2, 3, 4].map((i) => pxMix(topCol, botCol, i / 4));

  for (let y = 0; y < PX.G; y++) {
    const norm = (y / (PX.G - 6)) * 4;
    const band = Math.min(3, Math.floor(norm));
    const frac = Math.min(1, norm - band);
    const ditherFrac = band < 3 ? Math.max(0, (frac - 0.7) / 0.3) : 0;

    for (let x = 0; x < PX.W; x++) {
      const bayerVal = PX_BAYER[(y & 3) * 4 + (x & 3)];
      buf.px(x, y, ditherFrac > bayerVal ? stops[band + 1] : stops[band]);
    }
  }

  // Night stars (if dark theme and not gloomy)
  if (pal.star && !isLowMood) {
    for (let i = 0; i < 14; i++) {
      buf.px(Math.floor(prng() * PX.W), Math.floor(prng() * 22), pal.star);
    }
  }

  // Celestial Body (Sun / Moon)
  const posMap: Record<string, [number, number, number]> = {
    m: [30, 14, 4],
    d: [98, 9, 4],
    e: [166, 21, 5],
  };
  const [cx, cy, r] = posMap[stage] || posMap.d;

  const sunBase = isLowMood ? pxMix(pal.sun, pal.cloudlow, 0.55) : pal.sun;
  const skyUnder = buf.get(cx, cy - r - 3) || sunBase;

  buf.disc(cx, cy, r + 2, pxMix(sunBase, skyUnder, 0.6));
  buf.disc(cx, cy, r + 1, pxMix(sunBase, skyUnder, 0.3));
  buf.disc(cx, cy, r, sunBase);
  buf.disc(cx - 1, cy - 1, r - 2, isLowMood ? sunBase : pal.sunhi);
}

/**
 * Procedural fluffy or overcast clouds
 */
export function pxCloud(
  buf: PixelBufferInterface,
  cx: number,
  cy: number,
  width: number,
  pal: PixelPalette,
  prng: () => number,
  isLowMood: boolean
): void {
  const cBuf = new PixelBuffer(width + 8, 14);
  const numPuffs = 3 + Math.floor(width / 8);
  const cloudColor = isLowMood ? pal.cloudlow : pal.cloud;
  const shadowColor = isLowMood ? pal.cloudlowsh : pal.cloudsh;

  for (let u = 0; u < numPuffs; u++) {
    const puffX = 4 + ((u + 0.5) * width) / numPuffs;
    const puffR = 2 + Math.round(prng() * 2) + (u > 0 && u < numPuffs - 1 ? 1 : 0);
    cBuf.disc(puffX, 12 - puffR, puffR, cloudColor);
  }

  cBuf.rect(4, 10, width, 3, cloudColor);

  // Clear bottom baseline row
  for (let x = 0; x < cBuf.w; x++) {
    cBuf.d[13 * cBuf.w + x] = null;
  }

  // Underside shading
  for (let x = 0; x < cBuf.w; x++) {
    if (cBuf.get(x, 12)) cBuf.px(x, 12, shadowColor);
    if (cBuf.get(x, 11) && prng() < 0.5) cBuf.px(x, 11, shadowColor);
  }

  buf.blit(cBuf, Math.round(cx - cBuf.w / 2), cy - 12, null);
}

/**
 * Soaring V-shaped birds in high-mood clear skies
 */
export function pxBirds(buf: PixelBufferInterface, pal: PixelPalette, prng: () => number): void {
  for (let i = 0; i < 3; i++) {
    const x = Math.round(60 + prng() * 70);
    const y = Math.round(6 + prng() * 12);
    buf.px(x - 1, y - 1, pal.ol);
    buf.px(x, y, pal.ol);
    buf.px(x + 1, y - 1, pal.ol);
  }
}

/**
 * Procedural distant building with windows and antennas
 */
export function pxBuilding(
  buf: PixelBufferInterface,
  x: number,
  w: number,
  h: number,
  groundY: number,
  wallCol: RGBColor,
  winCol: RGBColor,
  prng: () => number,
  opts: { step?: boolean; antenna?: boolean; lit?: RGBColor } = {}
): void {
  const topY = groundY - h;
  buf.rect(x, topY, w, h, wallCol);
  buf.rect(x, topY, w, 1, pxMix(wallCol, [255, 255, 255], 0.12));

  if (opts.step && w > 7) {
    buf.rect(x + 2, topY - 3, w - 4, 3, wallCol);
  }
  if (opts.antenna) {
    const antX = x + (w >> 1);
    const antTop = topY - (opts.step ? 3 : 0) - 5;
    const antBot = topY - (opts.step ? 3 : 0);
    buf.line(antX, antTop, antX, antBot, wallCol);
  }

  // Windows grid
  for (let wy = topY + 2; wy < groundY - 2; wy += 3) {
    for (let wx = x + 1; wx < x + w - 1; wx += 2) {
      if (prng() < 0.7) {
        const col = opts.lit && prng() < 0.4 ? opts.lit : winCol;
        buf.px(wx, wy, col);
      }
    }
  }
}

/**
 * Rolling sine-wave hills
 */
export function pxHills(
  buf: PixelBufferInterface,
  _pal: PixelPalette,
  prng: () => number,
  freq: number,
  groundY: number,
  amp: number,
  hillCol: RGBColor,
  rimCol?: RGBColor | null
): void {
  const phase1 = prng() * 6;
  const phase2 = prng() * 6;

  for (let x = 0; x < PX.W; x++) {
    const yTop = Math.round(
      groundY -
        amp * (0.6 + 0.4 * Math.sin(x * freq + phase1)) -
        amp * 0.35 * Math.sin(x * freq * 2.7 + phase2)
    );
    for (let y = yTop; y < PX.G; y++) {
      buf.px(x, y, hillCol);
    }
    if (rimCol) {
      buf.px(x, yTop, rimCol);
    }
  }
}

/**
 * Regional tree type mapping
 */
export function pxTreeKind(region: string): 'pine' | 'palm' | 'acacia' | 'round' {
  if (region === 'ssa') return 'acacia';
  if (['mena', 'lac', 'sa', 'eap'].includes(region)) return 'palm';
  if (region === 'hi' || region === 'eca') return 'pine';
  return 'round';
}

/**
 * Procedural regional tree rendering
 */
export function pxTree(
  buf: PixelBufferInterface,
  x: number,
  groundY: number,
  kind: 'pine' | 'palm' | 'acacia' | 'round',
  pal: PixelPalette
): void {
  if (kind === 'pine') {
    for (let row = 0; row < 9; row++) {
      const radius = 1 + (row >> 1);
      for (let dx = -radius; dx <= radius; dx++) {
        buf.px(x + dx, groundY - 12 + row, dx < 0 ? pal.tree2 : pal.tree);
      }
    }
    buf.rect(x, groundY - 3, 1, 3, pal.trunk);
    buf.px(x, groundY - 12, pal.treehi);
    return;
  }

  if (kind === 'palm') {
    for (let i = 0; i < 11; i++) {
      const tx = x + Math.round(Math.sin(i / 4) * 1.5);
      const ty = groundY - 1 - i;
      buf.px(tx, ty, i % 3 ? pal.trunk : pal.shade(pal.trunk, 0.3));
    }
    const crownX = x + Math.round(Math.sin(10 / 4) * 1.5);
    const crownY = groundY - 12;
    const fronds: [number, number][] = [
      [-5, 3],
      [-4, -1],
      [0, -3],
      [4, -1],
      [5, 3],
    ];
    for (const [fx, fy] of fronds) {
      buf.line(crownX, crownY, crownX + fx, crownY + fy, pal.tree);
    }
    buf.px(crownX, crownY, pal.tree2);
    return;
  }

  if (kind === 'acacia') {
    buf.line(x, groundY - 1, x, groundY - 8, pal.trunk);
    buf.line(x, groundY - 6, x - 3, groundY - 9, pal.trunk);
    buf.line(x, groundY - 6, x + 3, groundY - 9, pal.trunk);
    buf.rect(x - 7, groundY - 11, 15, 2, pal.tree);
    buf.rect(x - 5, groundY - 12, 11, 1, pal.treehi);
    buf.rect(x - 6, groundY - 9, 13, 1, pal.tree2);
    return;
  }

  // Round deciduous tree
  buf.rect(x, groundY - 4, 1, 4, pal.trunk);
  buf.disc(x, groundY - 8, 4, pal.tree);
  buf.disc(x + 1, groundY - 7, 2, pal.tree2);
  buf.px(x - 2, groundY - 10, pal.treehi);
  buf.px(x - 1, groundY - 11, pal.treehi);
}

/**
 * Mid-distance backdrop (urban skyline or rolling hills)
 */
export function pxBackdrop(
  buf: PixelBufferInterface,
  model: SceneModel,
  pal: PixelPalette,
  prng: () => number
): void {
  const groundY = PX.G;

  if (model.urban) {
    // Far layer buildings
    let curX = -4;
    while (curX < PX.W) {
      const bW = 6 + Math.round(prng() * 9);
      const bH = 10 + Math.round(prng() * 17);
      pxBuilding(
        buf,
        curX,
        bW,
        bH,
        groundY - 2,
        pal.far1,
        pxMix(pal.far1, pal.wall, 0.35),
        prng,
        { step: prng() < 0.3, antenna: prng() < 0.25 }
      );
      curX += bW + 1 + Math.round(prng() * 3);
    }

    // Near layer buildings
    curX = 10 + Math.round(prng() * 10);
    while (curX < PX.W) {
      const bW = 9 + Math.round(prng() * 9);
      const bH = 13 + Math.round(prng() * 15);

      // MENA minaret / dome silhouette
      if (model.region === 'mena' && prng() < 0.35) {
        buf.rect(curX, groundY - 10, 14, 10, pal.far2);
        buf.disc(curX + 7, groundY - 11, 5, pal.far2);
        buf.rect(curX + 16, groundY - 24, 3, 24, pal.far2);
        buf.rect(curX + 15, groundY - 25, 5, 1, pal.far2);
        buf.px(curX + 17, groundY - 27, pal.far2);
        curX += 22;
        continue;
      }

      const litColor = pal.lit
        ? pal.winlit
        : model.stage === 'e'
        ? pxMix(pal.winlit, pal.far2, 0.4)
        : undefined;

      pxBuilding(
        buf,
        curX,
        bW,
        bH,
        groundY - 1,
        pal.far2,
        pxMix(pal.far2, pal.win, 0.5),
        prng,
        { step: prng() < 0.25, lit: litColor }
      );

      // Rooftop water tank
      if (prng() < 0.2) {
        buf.rect(curX + 2, groundY - 1 - bH - 6, 5, 4, pal.far2);
        buf.line(curX + 3, groundY - 1 - bH - 2, curX + 3, groundY - 1 - bH, pal.far2);
        buf.line(curX + 5, groundY - 1 - bH - 2, curX + 5, groundY - 1 - bH, pal.far2);
      }

      curX += bW + 8 + Math.round(prng() * 16);
    }
  } else if (model.region === 'mena') {
    // Desert dunes
    const skyHorizon = pal.sky[model.stage || 'd']?.[1] || pal.sky.d[1];
    pxHills(buf, pal, prng, 0.035, groundY - 6, 8, pxMix(pal.sand, skyHorizon, 0.35), null);
    pxHills(buf, pal, prng, 0.05, groundY - 1, 5, pal.sand, pal.light(pal.sand, 0.2));
  } else {
    // Rolling hills
    pxHills(buf, pal, prng, 0.04, groundY - 10, 8, pal.hill1, pal.light(pal.hill1, 0.15));

    // Distant hilltop trees
    for (let i = 0; i < 18; i++) {
      const tx = Math.floor(prng() * PX.W);
      const ty = Math.floor(groundY - 6 - prng() * 8);
      const pixel = buf.get(tx, ty);
      if (pixel && pixel[0] === pal.hill1[0]) {
        buf.px(tx, ty, pal.tree2);
        buf.px(tx + 1, ty, pal.tree);
        buf.px(tx, ty - 1, pal.tree);
      }
    }

    pxHills(buf, pal, prng, 0.06, groundY - 2, 5, pal.hill2, pal.light(pal.hill2, 0.15));

    // Terraced rice paddies in South / East Asia
    if (model.region === 'sa' || model.region === 'eap') {
      for (let step = 1; step < 4; step++) {
        for (let tx = 0; tx < PX.W; tx++) {
          const ty = groundY - 2 - step * 2;
          if (buf.get(tx, ty) && buf.get(tx, ty - 1) && (tx + step) % 3) {
            buf.px(tx, ty, pal.light(pal.hill2, 0.25));
          }
        }
      }
    }
  }

  // War zone smoke plumes
  if (model.war) {
    for (const [smokeX, smokeCount] of [
      [120, 7],
      [138, 5],
    ]) {
      for (let i = smokeCount - 1; i >= 0; i--) {
        const sx = smokeX + i * 2 + Math.round(Math.sin(i) * 2);
        const sy = groundY - 8 - i * 4;
        const sr = 2 + (i >> 1);
        buf.disc(sx, sy, sr, pal.shade(pal.smoke, 0.15));
        buf.disc(sx - 1, sy - 1, sr - 1, i % 2 ? pal.smoke : pal.light(pal.smoke, 0.1));
      }
    }
  }
}

/**
 * Utility pole with crossarms, insulators, and catenary sagging wires
 */
export function pxPole(buf: PixelBufferInterface, x: number, pal: PixelPalette, isUrban: boolean): void {
  const poleColor = isUrban ? pal.metal : pal.trunk;
  const topY = PX.G - 30;

  buf.rect(x, topY, 2, 30, poleColor);
  buf.rect(x + 1, topY, 1, 30, pal.shade(poleColor, 0.25));
  buf.rect(x - 5, topY + 3, 12, 1, poleColor);
  buf.rect(x - 3, topY + 7, 8, 1, poleColor);

  // Insulators
  for (const insX of [-5, 6]) {
    buf.px(x + insX, topY + 2, pal.wall2);
  }

  // Catenary sagging cables
  const wireCol = pxMix(pal.ol, pal.sky.d[1], 0.4);
  for (const [armX, armY] of [
    [-5, 3],
    [6, 3],
  ]) {
    for (let cx = 0; cx < PX.W; cx++) {
      const span = cx < x + armX ? [-40, x + armX] : [x + armX, PX.W + 60];
      const u = (cx - span[0]) / (span[1] - span[0]);
      const sagY = Math.round(topY + armY + 16 * u * (1 - u));
      buf.px(cx, sagY, wireCol);
    }
  }
}

/**
 * Perimeter fence
 */
export function pxFence(buf: PixelBufferInterface, model: SceneModel, pal: PixelPalette): void {
  if (!model.urban && model.region === 'mena') return;
  const groundY = PX.G;
  const fenceCol = model.urban ? pal.metal : pal.trunk;
  const endX = model.prop === 'boat' ? 126 : PX.W;

  for (let x = 0; x < endX; x++) {
    buf.px(x, groundY - 4, fenceCol);
    if (!model.urban) {
      buf.px(x, groundY - 2, fenceCol);
    }
    if (x % 6 === 0) {
      buf.rect(x, groundY - 5, 1, 5, pal.shade(fenceCol, 0.2));
    }
  }
}

/**
 * Surface ground, sidewalks, roads, and subsoil
 */
export function pxGround(
  buf: PixelBufferInterface,
  model: SceneModel,
  pal: PixelPalette,
  prng: () => number
): void {
  const groundY = PX.G;
  const width = PX.W;
  const height = PX.H;

  if (model.urban) {
    buf.rect(0, groundY, width, 3, pal.pave);
    for (let x = 0; x < width; x += 7) {
      buf.px(x, groundY + 1, pal.pave2);
    }
    buf.rect(0, groundY + 3, width, 1, pal.pave2);
    buf.rect(0, groundY + 4, width, height - groundY - 4, pal.road);

    // Dashed road lines
    for (let x = 3; x < width; x += 12) {
      buf.rect(x, groundY + 8, 6, 1, pal.roadline);
    }

    // Asphalt specks
    for (let x = 0; x < width; x++) {
      if (prng() < 0.08) {
        buf.px(x, Math.floor(groundY + 5 + prng() * 6), pal.shade(pal.road, 0.25));
      }
    }
    return;
  }

  // Rural terrain
  const isDesert = model.region === 'mena';
  const topCol = isDesert ? pal.sand : pal.grass;
  const shadeCol = isDesert ? pal.sand2 : pal.grass2;
  const soilCol = isDesert ? pal.sand2 : pal.soil;
  const deepSoilCol = isDesert ? pal.shade(pal.sand2, 0.2) : pal.soil2;

  buf.rect(0, groundY, width, 2, topCol);
  buf.rect(0, groundY, width, 1, isDesert ? pal.light(pal.sand, 0.2) : pal.grasshi);
  buf.rect(0, groundY + 2, width, height - groundY - 2, soilCol);

  for (let x = 0; x < width; x++) {
    if (prng() < 0.5) buf.px(x, groundY + 2, shadeCol);
    if (prng() < 0.12) {
      buf.px(
        x,
        Math.floor(groundY + 3 + prng() * (height - groundY - 4)),
        prng() < 0.5 ? deepSoilCol : pal.stone
      );
    }
    if (!isDesert && prng() < 0.22) {
      buf.px(x, groundY - 1, shadeCol);
      if (prng() < 0.4) buf.px(x, groundY - 2, topCol);
    }
  }

  buf.rect(0, height - 1, width, 1, deepSoilCol);
}
