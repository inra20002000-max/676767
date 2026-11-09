/**
 * Master Pixel Art Scene Compositor & Canvas Renderer
 * 192x60 micro-resolution layer composition with collision-free family positioning
 */

import type {
  SceneContext,
  SceneModel,
  ScenePerson,
  PixelPalette,
  PeopleLayoutResult,
} from '../../types/pixelArt';
import { PX, PixelBuffer, pxPalette } from './palette';
import { pxPerson, pxPet, pxCar, pxMoto } from './sprites';
import {
  pxSky,
  pxCloud,
  pxBirds,
  pxTree,
  pxTreeKind,
  pxBackdrop,
  pxPole,
  pxFence,
  pxGround,
} from './scenery';
import { pxHome, pxWork, pxFore, SC_PROP } from './housing';
import { pxMoment, pxFuneral, lvRand } from './moments';

/**
 * Collision-free horizontal family positioning on ground line (Y_G = 48)
 */
export function pxPeopleLay(
  model: SceneModel,
  pal: PixelPalette,
  homeBuf: PixelBuffer,
  homeX: number,
  peopleSprites: { p: ScenePerson; s: PixelBuffer }[]
): PeopleLayoutResult {
  const leftClearance = homeX + homeBuf.w + (model.car || model.moto ? 19 : 4);
  const rightBoundary =
    !model.prop || ['none', 'toys', 'bundle'].includes(model.prop)
      ? PX.W - 2
      : 136;

  const petWidth =
    (model.pet ? pxPet(model.pet, pal).w + 2 : 0) +
    (model.pet2 ? pxPet(model.pet2, pal).w + 2 : 0);

  const peopleWidth = peopleSprites.reduce((sum, item) => sum + item.s.w, 0);
  const memberCount = Math.max(0, peopleSprites.length - 1);

  let gap = 3;
  while (gap > 1 && leftClearance + peopleWidth + memberCount * gap + petWidth > rightBoundary) {
    gap--;
  }

  const totalWidth = peopleWidth + memberCount * gap;
  const startX = Math.round(
    Math.max(
      leftClearance,
      Math.min(
        Math.max(86, 108 - totalWidth / 2),
        rightBoundary - totalWidth - petWidth
      )
    )
  );

  return { x: startX, gap, tot: totalWidth };
}

/**
 * Master single-buffer scene compositor
 */
export function pxScene(model: SceneModel, pal: PixelPalette): PixelBuffer {
  // If special narrative moment is active
  if (model.act) {
    const momentLayers = pxMoment(model, pal);
    if (momentLayers) {
      const composite = new PixelBuffer(PX.W, PX.H);
      for (const layerKey of ['sky', 'back', 'mid', 'front'] as const) {
        composite.blit(momentLayers[layerKey], 0, 0, null);
      }
      return composite;
    }
  }

  const prng = lvRand(model.seed);
  const buf = new PixelBuffer(PX.W, PX.H);
  const groundY = PX.G;

  // 1. Sky & Celestial Bodies
  pxSky(buf, model, pal, prng);

  // 2. Fluffy / Gloomy Clouds based on mood
  const cloudCount = model.mood === 'low' ? 5 : model.mood === 'mid' ? 3 : 2;
  for (let i = 0; i < cloudCount; i++) {
    const cx = 14 + ((i + 0.3 + prng() * 0.5) * (PX.W - 28)) / cloudCount;
    const cy = 10 + Math.round(prng() * 12);
    const cWidth = 16 + Math.round(prng() * (model.mood === 'low' ? 22 : 16));
    pxCloud(buf, cx, cy, cWidth, pal, prng, model.mood === 'low');
  }

  // 3. Soaring Birds in High Mood
  if (model.mood === 'high' && !pal.dark) {
    pxBirds(buf, pal, prng);
  }

  // 4. Nomad Yurt / Caravan
  if (model.nomad) {
    const tent = new PixelBuffer(13, 4);
    tent.rect(0, 1, 13, 2, pal.light(pal.wall, 0.3));
    buf.blit(tent, 136, 10, pal.ol);
    for (let u = 112; u < 134; u += 3) {
      buf.px(u, 12, pal.cloud);
    }
  }

  // 5. Mid-distance Backdrop
  pxBackdrop(buf, model, pal, prng);

  // 6. Regional Trees
  if (model.urban) {
    pxTree(buf, 64, groundY, 'round', pal);
    buf.rect(62, groundY - 1, 5, 1, pal.wall3);
  } else {
    for (const treeX of [58, 66]) {
      pxTree(
        buf,
        treeX + Math.round(prng() * 4),
        groundY,
        pxTreeKind(model.region),
        pal
      );
    }
  }

  // 7. Utility Pole, Ground & Fence
  pxPole(buf, 76, pal, model.urban);
  pxGround(buf, model, pal, prng);
  pxFence(buf, model, pal);

  // 8. Workplace Building
  pxWork(buf, model, pal, prng);

  // 9. Housing Structure
  const homeBuf = pxHome(model, pal, prng);
  const homeX = 4;
  buf.blit(homeBuf, homeX, groundY - homeBuf.h, pal.ol);

  // 10. Vehicles
  if (model.car) {
    buf.blit(pxCar(pal, pal.accent), homeX + homeBuf.w + 3, groundY - 6, pal.ol);
  } else if (model.moto) {
    buf.blit(pxMoto(pal, false), homeX + homeBuf.w + 4, groundY - 5, null);
  }

  // 11. Family Characters
  const peopleSprites = model.people.map((p) => ({
    p,
    s: pxPerson(p, pal),
  }));

  const layout = pxPeopleLay(model, pal, homeBuf, homeX, peopleSprites);
  let curX = layout.x;

  for (const { p, s } of peopleSprites) {
    buf.blit(s, curX, groundY - s.h + (p.role === 'me' ? 1 : 0), pal.ol);
    curX += s.w + layout.gap;
  }

  if (peopleSprites.length) {
    curX += 3 - layout.gap;
  }

  // Nomad luggage
  if (model.nomad) {
    const lug = new PixelBuffer(4, 5);
    lug.rect(1, 1, 2, 3, pal.accent);
    buf.blit(lug, curX, groundY - 5, pal.ol);
  }

  // 12. Pets
  for (const petKey of [model.pet, model.pet2]) {
    if (petKey) {
      const petBuf = pxPet(petKey, pal);
      buf.blit(petBuf, curX, groundY - petBuf.h, pal.ol);
      curX += petBuf.w + 2;
    }
  }

  // 13. Foreground Vocation Props
  pxFore(buf, model, pal, prng, curX);

  return buf;
}

/**
 * Multi-layer compositor for parallax animations
 */
export function pxSceneLayers(
  model: SceneModel,
  pal: PixelPalette
): {
  sky: PixelBuffer;
  back: PixelBuffer;
  mid: PixelBuffer;
  front: PixelBuffer;
  people: [number, number];
} {
  if (model.act) {
    const momentLayers = pxMoment(model, pal);
    if (momentLayers) return momentLayers;
  }

  const prng = lvRand(model.seed);
  const groundY = PX.G;
  const createLayer = () => new PixelBuffer(PX.W, PX.H);

  const skyLayer = createLayer();
  const backLayer = createLayer();
  const midLayer = createLayer();
  const frontLayer = createLayer();

  // Sky
  pxSky(skyLayer, model, pal, prng);
  const cloudCount = model.mood === 'low' ? 5 : model.mood === 'mid' ? 3 : 2;
  for (let i = 0; i < cloudCount; i++) {
    const cx = 14 + ((i + 0.3 + prng() * 0.5) * (PX.W - 28)) / cloudCount;
    const cy = 10 + Math.round(prng() * 12);
    const cWidth = 16 + Math.round(prng() * (model.mood === 'low' ? 22 : 16));
    pxCloud(skyLayer, cx, cy, cWidth, pal, prng, model.mood === 'low');
  }

  if (model.mood === 'high' && !pal.dark) {
    pxBirds(skyLayer, pal, prng);
  }

  // Backdrop
  pxBackdrop(backLayer, model, pal, prng);

  // Midground (flora, poles, ground, fence, work, house)
  if (model.urban) {
    pxTree(midLayer, 64, groundY, 'round', pal);
    midLayer.rect(62, groundY - 1, 5, 1, pal.wall3);
  } else {
    for (const treeX of [58, 66]) {
      pxTree(
        midLayer,
        treeX + Math.round(prng() * 4),
        groundY,
        pxTreeKind(model.region),
        pal
      );
    }
  }

  pxPole(midLayer, 76, pal, model.urban);
  pxGround(midLayer, model, pal, prng);
  pxFence(midLayer, model, pal);
  pxWork(midLayer, model, pal, prng);

  const homeBuf = pxHome(model, pal, prng);
  const homeX = 4;
  midLayer.blit(homeBuf, homeX, groundY - homeBuf.h, pal.ol);

  if (model.car) {
    midLayer.blit(pxCar(pal, pal.accent), homeX + homeBuf.w + 3, groundY - 6, pal.ol);
  } else if (model.moto) {
    midLayer.blit(pxMoto(pal, false), homeX + homeBuf.w + 4, groundY - 5, null);
  }

  // Foreground (people, pets, props)
  const peopleSprites = model.people.map((p) => ({
    p,
    s: pxPerson(p, pal),
  }));

  const layout = pxPeopleLay(model, pal, homeBuf, homeX, peopleSprites);
  let curX = layout.x;
  const peopleSpan: [number, number] = [curX, curX + Math.max(0, layout.tot)];

  for (const { p, s } of peopleSprites) {
    frontLayer.blit(s, curX, groundY - s.h + (p.role === 'me' ? 1 : 0), pal.ol);
    curX += s.w + layout.gap;
  }

  if (peopleSprites.length) {
    curX += 3 - layout.gap;
  }

  for (const petKey of [model.pet, model.pet2]) {
    if (petKey) {
      const petBuf = pxPet(petKey, pal);
      frontLayer.blit(petBuf, curX, groundY - petBuf.h, pal.ol);
      curX += petBuf.w + 2;
    }
  }

  pxFore(frontLayer, model, pal, prng, curX);

  return {
    sky: skyLayer,
    back: backLayer,
    mid: midLayer,
    front: frontLayer,
    people: peopleSpan,
  };
}

/**
 * Maps high-level SceneContext into SceneModel
 */
export function contextToSceneModel(context: SceneContext): SceneModel {
  // 1. Time of day / stage
  let stage: 'm' | 'd' | 'e' = 'd';
  if (context.timeOfDay === 'morning') stage = 'm';
  else if (context.timeOfDay === 'evening' || context.timeOfDay === 'night') stage = 'e';
  else {
    stage = context.age < 13 ? 'm' : context.age < 60 ? 'd' : 'e';
  }

  // 2. Region code from country ID
  const cid = (context.countryId || '').toUpperCase();
  const regionMap: Record<string, string> = {
    USA: 'hi', GBR: 'hi', DEU: 'hi', FRA: 'hi', JPN: 'hi', CAN: 'hi', AUS: 'hi', ITA: 'hi', ESP: 'hi',
    RUS: 'eca', UKR: 'eca', POL: 'eca', KAZ: 'eca', UZB: 'eca', BLR: 'eca',
    CHN: 'eap', KOR: 'eap', VNM: 'eap', THA: 'eap', IDN: 'eap', PHL: 'eap',
    IND: 'sa', PAK: 'sa', BGD: 'sa', NPL: 'sa', LKA: 'sa',
    EGY: 'mena', TUR: 'mena', IRN: 'mena', SAU: 'mena', DZA: 'mena', MAR: 'mena',
    NGA: 'ssa', ETH: 'ssa', COD: 'ssa', TZA: 'ssa', KEN: 'ssa', ZAF: 'ssa',
    BRA: 'lac', MEX: 'lac', COL: 'lac', ARG: 'lac', PER: 'lac', CHL: 'lac',
  };
  const region = context.region || regionMap[cid] || 'hi';

  // 3. Housing Tier
  let home = context.homeType;
  if (!home) {
    if (context.wealthQuintile >= 5) home = 'estate';
    else if (context.wealthQuintile >= 4) home = 'villa';
    else if (context.wealthQuintile === 3) home = 'house';
    else if (context.wealthQuintile === 2) home = 'cottage';
    else home = context.urban ? 'flat' : 'hut';
  }

  // 4. People
  const people: ScenePerson[] =
    context.familyMembers && context.familyMembers.length > 0
      ? context.familyMembers
      : [
          {
            role: 'me',
            age: context.age,
            sex: context.sex,
            sk: context.skinTone,
          },
        ];

  // 5. Vocation Prop
  let prop = context.prop;
  if (!prop) {
    if (context.age < 6) {
      prop = 'toys';
    } else if (context.jobId && SC_PROP[context.jobId]) {
      prop = SC_PROP[context.jobId];
    } else {
      prop = 'none';
    }
  }

  return {
    stage,
    mood: context.mood || 'mid',
    urban: context.urban !== undefined ? context.urban : true,
    region,
    home,
    people,
    prop,
    pet: context.petType,
    pet2: context.petType2,
    car: context.vehicleType === 'car',
    moto: context.vehicleType === 'moto',
    bike: context.vehicleType === 'bike',
    war: !!context.war,
    nomad: !!context.nomad,
    seed: context.seed || `${cid}_${context.age}_${context.sex}_${context.wealthQuintile}`,
    act: context.moment,
    rel: context.religionId,
    sk: context.skinTone,
    isDeceased: context.isDeceased,
  };
}

/**
 * Creates an ImageData object from a SceneModel buffer
 */
export function renderSceneToImageData(
  model: SceneModel,
  pal: PixelPalette
): ImageData {
  const buf = pxScene(model, pal);
  const imgData = new ImageData(PX.W, PX.H);

  for (let i = 0; i < buf.d.length; i++) {
    const col = buf.d[i] || [0, 0, 0];
    imgData.data[i * 4] = col[0];
    imgData.data[i * 4 + 1] = col[1];
    imgData.data[i * 4 + 2] = col[2];
    imgData.data[i * 4 + 3] = 255;
  }

  return imgData;
}

/**
 * Master render function directly drawing onto a 2D canvas context
 */
export function renderPixelScene(
  ctx: CanvasRenderingContext2D,
  context: SceneContext | SceneModel,
  theme?: 'light' | 'dark'
): void {
  const pal = pxPalette(theme);
  const model = 'stage' in context ? (context as SceneModel) : contextToSceneModel(context);
  const isDeceased = model.isDeceased ?? (context as SceneContext).isDeceased;

  let sceneBuf: PixelBuffer;

  if (isDeceased) {
    sceneBuf = pxFuneral(model, pal, model.people);
  } else {
    sceneBuf = pxScene(model, pal);
  }

  // Blit onto canvas
  const canvasW = ctx.canvas.width;
  const canvasH = ctx.canvas.height;

  if (canvasW === PX.W && canvasH === PX.H) {
    const imgData = ctx.createImageData(PX.W, PX.H);
    for (let i = 0; i < sceneBuf.d.length; i++) {
      const col = sceneBuf.d[i] || [0, 0, 0];
      imgData.data[i * 4] = col[0];
      imgData.data[i * 4 + 1] = col[1];
      imgData.data[i * 4 + 2] = col[2];
      imgData.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
  } else {
    // High-DPI scaled up rendering via offscreen canvas
    const offscreen =
      typeof document !== 'undefined'
        ? document.createElement('canvas')
        : null;

    if (offscreen) {
      offscreen.width = PX.W;
      offscreen.height = PX.H;
      const offCtx = offscreen.getContext('2d');
      if (offCtx) {
        const imgData = offCtx.createImageData(PX.W, PX.H);
        for (let i = 0; i < sceneBuf.d.length; i++) {
          const col = sceneBuf.d[i] || [0, 0, 0];
          imgData.data[i * 4] = col[0];
          imgData.data[i * 4 + 1] = col[1];
          imgData.data[i * 4 + 2] = col[2];
          imgData.data[i * 4 + 3] = 255;
        }
        offCtx.putImageData(imgData, 0, 0);

        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvasW, canvasH);
        ctx.drawImage(offscreen, 0, 0, canvasW, canvasH);
      }
    } else {
      // Fallback for node canvas test environments
      const imgData = ctx.createImageData(PX.W, PX.H);
      for (let i = 0; i < sceneBuf.d.length; i++) {
        const col = sceneBuf.d[i] || [0, 0, 0];
        imgData.data[i * 4] = col[0];
        imgData.data[i * 4 + 1] = col[1];
        imgData.data[i * 4 + 2] = col[2];
        imgData.data[i * 4 + 3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);
    }
  }
}
