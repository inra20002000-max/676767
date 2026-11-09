import { describe, it, expect, vi } from 'vitest';
import {
  PX,
  PX_BAYER,
  PX_PAL,
  pxRGB,
  pxMix,
  PixelBuffer,
  pxPalette,
} from '../engine/pixelArt/palette';
import {
  SKIN_W,
  SKIN_C,
  SKIN_CI,
  SKIN_G,
  skinU,
  skinW,
  skinPick,
  skinMid,
  getCharacterSkin,
  blendOffspringSkin,
} from '../engine/pixelArt/skinTones';
import {
  PX_PEOPLE,
  PX_NEWBORN,
  PX_PET,
  pxSprite,
  pxPerson,
  pxNewborn,
  pxPet,
  pxCar,
  pxMoto,
  pxBike,
} from '../engine/pixelArt/sprites';
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
} from '../engine/pixelArt/scenery';
import {
  pxHouse,
  pxHome,
  pxWork,
  pxFore,
  SC_PROP,
} from '../engine/pixelArt/housing';
import {
  MO,
  pxMoment,
  pxFuneral,
  fxConfetti,
  fxPetals,
  fxRain,
  fxSnow,
  fxSpark,
  fxHeart,
  fxNote,
  fxLanterns,
  fxStars,
  lvRand,
} from '../engine/pixelArt/moments';
import {
  pxPeopleLay,
  pxScene,
  pxSceneLayers,
  contextToSceneModel,
  renderPixelScene,
} from '../engine/pixelArt/renderer';
import type { SceneContext, SceneModel, MomentContext } from '../types/pixelArt';

describe('Pixel Art Engine: Palette & Color Arithmetic', () => {
  it('defines the standard 192x60 canvas resolution and Y=48 baseline', () => {
    expect(PX.W).toBe(192);
    expect(PX.H).toBe(60);
    expect(PX.G).toBe(48);
  });

  it('provides a 16-element normalized Bayer 4x4 matrix', () => {
    expect(PX_BAYER.length).toBe(16);
    expect(PX_BAYER[0]).toBeCloseTo(0.5 / 16, 5);
    expect(PX_BAYER[15]).toBeCloseTo(5.5 / 16, 5);
    for (const val of PX_BAYER) {
      expect(val).toBeGreaterThan(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('defines 60+ color tokens in both light and dark themes', () => {
    const lightTokens = Object.keys(PX_PAL.light);
    const darkTokens = Object.keys(PX_PAL.dark);
    expect(lightTokens.length).toBeGreaterThanOrEqual(60);
    expect(darkTokens.length).toBeGreaterThanOrEqual(60);

    // Key demographic and atmospheric tokens
    for (const token of [
      'sky', 'sun', 'sunhi', 'cloud', 'grass', 'soil', 'pave', 'road',
      'wall', 'roof', 'win', 'ol', 'tree', 'trunk', 'skin',
      'sk0', 'sk1', 'sk2', 'sk3', 'sk4', 'sk5', 'hair', 'hairold',
      'me', 'pt', 'kid', 'par', 'sib', 'inlaw', 'accent', 'gold'
    ]) {
      expect(PX_PAL.light).toHaveProperty(token);
      expect(PX_PAL.dark).toHaveProperty(token);
    }
  });

  it('converts hex strings to RGB triples correctly', () => {
    expect(pxRGB('#000000')).toEqual([0, 0, 0]);
    expect(pxRGB('#FFFFFF')).toEqual([255, 255, 255]);
    expect(pxRGB('#1F8A80')).toEqual([31, 138, 128]);
    expect(pxRGB('#FFE39A')).toEqual([255, 227, 154]);
  });

  it('interpolates colors linearly with pxMix', () => {
    const c1: [number, number, number] = [0, 0, 0];
    const c2: [number, number, number] = [100, 200, 50];
    expect(pxMix(c1, c2, 0)).toEqual([0, 0, 0]);
    expect(pxMix(c1, c2, 1)).toEqual([100, 200, 50]);
    expect(pxMix(c1, c2, 0.5)).toEqual([50, 100, 25]);
  });

  it('resolves palette helper methods shade and light', () => {
    const pal = pxPalette('dark');
    expect(pal.dark).toBe(true);
    const red: [number, number, number] = [200, 50, 50];
    const shaded = pal.shade(red, 0.5);
    const lighted = pal.light(red, 0.5);
    expect(shaded[0]).toBeLessThan(red[0]);
    expect(lighted[0]).toBeGreaterThan(red[0]);
  });

  it('implements PixelBuffer pixel operations and clipping', () => {
    const buf = new PixelBuffer(10, 10);
    expect(buf.width).toBe(10);
    expect(buf.height).toBe(10);
    expect(buf.get(0, 0)).toBeNull();

    // Set & get within bounds
    buf.px(2, 3, [255, 0, 0]);
    expect(buf.get(2, 3)).toEqual([255, 0, 0]);

    // Out of bounds clipping
    buf.px(-1, 0, [0, 255, 0]);
    buf.px(10, 5, [0, 255, 0]);
    buf.px(5, 12, [0, 255, 0]);
    expect(buf.get(-1, 0)).toBeNull();
    expect(buf.get(10, 5)).toBeNull();

    // Primitives: rect, disc, line
    buf.rect(1, 1, 3, 2, [0, 0, 255]);
    expect(buf.get(1, 1)).toEqual([0, 0, 255]);
    expect(buf.get(3, 2)).toEqual([0, 0, 255]);

    buf.disc(5, 5, 2, [100, 100, 100]);
    expect(buf.get(5, 5)).toEqual([100, 100, 100]);

    buf.line(0, 0, 5, 0, [50, 50, 50]);
    expect(buf.get(0, 0)).toEqual([50, 50, 50]);
    expect(buf.get(3, 0)).toEqual([50, 50, 50]);
  });

  it('performs sprite blitting with automatic 1px outline', () => {
    const dest = new PixelBuffer(10, 10);
    const src = new PixelBuffer(3, 3);
    src.px(1, 1, [255, 255, 255]); // Single center pixel

    dest.blit(src, 3, 3, [0, 0, 0]); // Blit with black outline
    expect(dest.get(4, 4)).toEqual([255, 255, 255]); // Core pixel
    expect(dest.get(3, 4)).toEqual([0, 0, 0]); // Left outline
    expect(dest.get(5, 4)).toEqual([0, 0, 0]); // Right outline
    expect(dest.get(4, 3)).toEqual([0, 0, 0]); // Top outline
    expect(dest.get(4, 5)).toEqual([0, 0, 0]); // Bottom outline
  });
});

describe('Pixel Art Engine: Fitzpatrick Skin Tones & Inheritance', () => {
  it('ensures all 17 regional distribution vectors sum to 100', () => {
    const regions = Object.keys(SKIN_W);
    expect(regions.length).toBe(17);
    for (const region of regions) {
      const vector = SKIN_W[region];
      expect(vector.length).toBe(6);
      const sum = vector.reduce((a, b) => a + b, 0);
      expect(sum).toBe(100);
    }
  });

  it('correctly maps major countries and sub-ethnic groups', () => {
    expect(SKIN_CI.CHN).toBe('e');
    expect(SKIN_CI.IND).toBe('s');
    expect(SKIN_CI.TUR).toBe('m');
    expect(SKIN_CI.BRA).toBe('n');
    expect(SKIN_CI.ETH).toBe('ha');

    expect(SKIN_C.e).toContain('CHN');
    expect(SKIN_C.s).toContain('IND');

    expect(SKIN_G.us_black).toBe('a');
    expect(SKIN_G.us_hisp).toBe('l');
    expect(SKIN_G.za_white).toBe('n');
    expect(SKIN_G.ru_sakha).toBe('e');
    expect(SKIN_G.roma).toBe('ro');
  });

  it('produces deterministic pseudorandom floats with 32-bit FNV-1a hash', () => {
    const val1 = skinU('seed123');
    const val2 = skinU('seed123');
    const val3 = skinU('seed456');

    expect(val1).toBe(val2);
    expect(val1).not.toBe(val3);
    expect(val1).toBeGreaterThanOrEqual(0);
    expect(val1).toBeLessThan(1);
  });

  it('samples valid Fitzpatrick skin tones (0..5)', () => {
    for (let i = 0; i < 50; i++) {
      const tone = skinPick(SKIN_W.e, `seed_${i}`);
      expect(tone).toBeGreaterThanOrEqual(0);
      expect(tone).toBeLessThanOrEqual(5);
    }
  });

  it('determines geographically grounded skin tones', () => {
    // East Asia (CHN, JPN) has high density at sk0..sk2
    const eastAsianTone = getCharacterSkin('CHN', 'test_seed_1');
    expect([0, 1, 2]).toContain(eastAsianTone);

    // Sub-Saharan Africa (NGA, COD) has high density at sk4..sk5
    const ssaWeights = skinW('NGA', null, 'ssa');
    const ssaTone = skinPick(ssaWeights, 'test_seed_2');
    expect([3, 4, 5]).toContain(ssaTone);
  });

  it('blends parental skin tones via midpoint genetics', () => {
    expect(skinMid(0, 4, 0.5)).toBe(2);
    expect(skinMid(1, 5, 0.5)).toBe(3);

    // Parent 1 (sk1) + Parent 2 (sk5) -> Midpoint should be 3
    const childTone = blendOffspringSkin(1, 5, 'seed_child');
    expect(childTone).toBe(3);

    // Parent 1 (sk2) + Parent 2 (sk3) -> Midpoint should be 2 or 3
    const childTone2 = blendOffspringSkin(2, 3, 'seed_child_2');
    expect([2, 3]).toContain(childTone2);
  });
});

describe('Pixel Art Engine: ASCII Sprites & Characters', () => {
  it('contains ASCII matrices for 5 age groups for both genders', () => {
    for (const sex of ['M', 'F'] as const) {
      expect(PX_PEOPLE[sex].baby.length).toBe(7);
      expect(PX_PEOPLE[sex].small.length).toBe(10);
      expect(PX_PEOPLE[sex].child.length).toBe(13);
      if (sex === 'M') {
        expect(PX_PEOPLE.M.teen.length).toBe(16);
      } else {
        expect(PX_PEOPLE.F.teen.length).toBe(15);
      }
      expect(PX_PEOPLE[sex].adult.length).toBe(17);
    }
  });

  it('decodes ASCII matrices into valid PixelBuffers with pxSprite', () => {
    const pal = pxPalette('dark');
    const testMatrix = [
      '..H..',
      '.HHH.',
      'SSESS',
      '.BBB.',
    ];
    const sprite = pxSprite(testMatrix, {
      H: pal.hair,
      S: pal.skin,
      E: pal.ol,
      B: pal.me,
    });
    expect(sprite.w).toBe(5);
    expect(sprite.h).toBe(4);
    expect(sprite.get(2, 0)).toEqual(pal.hair);
    expect(sprite.get(2, 2)).toEqual(pal.ol);
    expect(sprite.get(0, 0)).toBeNull(); // Transparent dot
  });

  it('generates character sprites across life stages with appropriate hair and cane', () => {
    const pal = pxPalette('dark');

    // Child
    const childSprite = pxPerson({ role: 'me', age: 10, sex: 'M', sk: 2 }, pal);
    expect(childSprite.h).toBe(13);

    // Adult
    const adultSprite = pxPerson({ role: 'me', age: 30, sex: 'M', sk: 2 }, pal);
    expect(adultSprite.h).toBe(17);
    expect(adultSprite.w).toBe(9);

    // Elder (Age 65+ silver hair)
    const elderSprite = pxPerson({ role: 'me', age: 68, sex: 'M', sk: 2 }, pal);
    expect(elderSprite.get(4, 0)).toEqual(pal.hairold);

    // Elder with cane (Age 75+ adult has cane extending width)
    const caneSprite = pxPerson({ role: 'me', age: 80, sex: 'M', sk: 2 }, pal);
    expect(caneSprite.w).toBe(11); // 9 + 2px cane margin
  });

  it('generates mobility aid variations: wheelchair and crutch', () => {
    const pal = pxPalette('dark');

    // Wheelchair
    const wcSprite = pxPerson({ role: 'me', age: 25, sex: 'M', aid: 'w' }, pal);
    expect(wcSprite.w).toBe(13); // 9 + 4px wheelchair chassis

    // Crutch
    const crutchSprite = pxPerson({ role: 'me', age: 25, sex: 'M', aid: 'c' }, pal);
    expect(crutchSprite.w).toBe(11); // 9 + 2px crutch
  });

  it('renders newborn baby swaddle', () => {
    expect(PX_NEWBORN.length).toBe(11);
    expect(PX_NEWBORN[0].length).toBe(9);

    const pal = pxPalette('dark');
    const baby = pxNewborn({ role: 'kid', age: 0, sex: 'F', sk: 1 }, pal);
    expect(baby.w).toBe(9);
    expect(baby.h).toBe(11);
  });

  it('renders all 6 domestic pet species', () => {
    expect(PX_PET.d.length).toBeGreaterThan(0);
    expect(PX_PET.c.length).toBeGreaterThan(0);
    expect(PX_PET.h.length).toBeGreaterThan(0);
    expect(PX_PET.r.length).toBeGreaterThan(0);
    expect(PX_PET.b.length).toBeGreaterThan(0);
    expect(PX_PET.f.length).toBeGreaterThan(0);

    const pal = pxPalette('dark');
    for (const petKey of ['d', 'c', 'h', 'r', 'b', 'f']) {
      const pet = pxPet(petKey, pal);
      expect(pet.w).toBeGreaterThan(0);
      expect(pet.h).toBeGreaterThan(0);
    }
  });

  it('renders vehicle sprites (car, moto, bike)', () => {
    const pal = pxPalette('dark');
    const car = pxCar(pal);
    expect(car.w).toBe(15);
    expect(car.h).toBe(7);

    const moto = pxMoto(pal, false);
    expect(moto.w).toBe(14);
    expect(moto.h).toBe(6);

    const bike = pxBike(pal);
    expect(bike.w).toBe(14);
    expect(bike.h).toBe(7);
  });
});

describe('Pixel Art Engine: Scenery & Architecture', () => {
  it('renders sky gradients and sun discs', () => {
    const pal = pxPalette('dark');
    const buf = new PixelBuffer(PX.W, PX.H);
    const model = contextToSceneModel({ age: 25, sex: 'M', countryId: 'USA', wealthQuintile: 3 });
    const prng = lvRand('test_sky');

    pxSky(buf, model, pal, prng);
    // Baseline sky top pixel
    expect(buf.get(0, 0)).not.toBeNull();
    // Sun disc at cx=98, cy=9 for day
    expect(buf.get(98, 9)).not.toBeNull();
  });

  it('places regional trees based on demographic zone', () => {
    expect(pxTreeKind('ssa')).toBe('acacia');
    expect(pxTreeKind('mena')).toBe('palm');
    expect(pxTreeKind('hi')).toBe('pine');
    expect(pxTreeKind('eca')).toBe('pine');
    expect(pxTreeKind('other')).toBe('round');

    const pal = pxPalette('dark');
    const buf = new PixelBuffer(PX.W, PX.H);
    pxTree(buf, 50, PX.G, 'pine', pal);
    expect(buf.get(50, PX.G - 3)).toEqual(pal.trunk);
  });

  it('renders all 9 residential housing tiers', () => {
    const pal = pxPalette('dark');
    const prng = lvRand('test_housing');

    const tiers = ['tent', 'prison', 'hut', 'cottage', 'small', 'flat', 'house', 'villa', 'mansion', 'estate'];
    for (const tier of tiers) {
      const model: SceneModel = {
        stage: 'd',
        mood: 'mid',
        urban: true,
        region: 'hi',
        home: tier,
        people: [],
        prop: 'none',
        car: false,
        moto: false,
        seed: 'home_seed',
      };
      const homeBuf = pxHome(model, pal, prng);
      expect(homeBuf.w).toBeGreaterThan(10);
      expect(homeBuf.h).toBeGreaterThan(5);
    }
  });

  it('renders all 9 workplace buildings', () => {
    const pal = pxPalette('dark');
    const prng = lvRand('test_work');

    const workplaces = ['office', 'factory', 'school', 'clinic', 'dome', 'rocket', 'crane', 'flag', 'pole'];
    for (const wp of workplaces) {
      const buf = new PixelBuffer(PX.W, PX.H);
      const model: SceneModel = {
        stage: 'd',
        mood: 'mid',
        urban: true,
        region: 'hi',
        home: 'flat',
        people: [],
        prop: wp,
        car: false,
        moto: false,
        seed: 'work_seed',
      };
      pxWork(buf, model, pal, prng);
      // Verify building has been blitted on the right side
      let nonNullCount = 0;
      for (let x = 138; x < PX.W; x++) {
        for (let y = 0; y < PX.G; y++) {
          if (buf.get(x, y)) nonNullCount++;
        }
      }
      expect(nonNullCount).toBeGreaterThan(0);
    }
  });

  it('maps over 70 vocation keys in SC_PROP to valid props', () => {
    const jobs = Object.keys(SC_PROP);
    expect(jobs.length).toBeGreaterThanOrEqual(60);
    for (const job of jobs) {
      const prop = SC_PROP[job];
      expect(typeof prop).toBe('string');
      expect(prop.length).toBeGreaterThan(0);
    }
  });

  it('renders scenery backdrop elements (clouds, birds, backdrop, poles, fence, ground)', () => {
    const pal = pxPalette('dark');
    const buf = new PixelBuffer(PX.W, PX.H);
    const prng = lvRand('test_scenery');
    const model = contextToSceneModel({ age: 25, sex: 'M', countryId: 'USA', wealthQuintile: 3 });

    pxCloud(buf, 20, 10, 16, pal, prng, false);
    pxBirds(buf, pal, prng);
    pxBackdrop(buf, model, pal, prng);
    pxPole(buf, 100, pal, true);
    pxFence(buf, model, pal);
    pxGround(buf, model, pal, prng);

    expect(buf.get(20, 10)).not.toBeNull();
    expect(buf.get(100, PX.G - 5)).not.toBeNull();
  });

  it('renders structural pxHouse and vocation props pxFore directly', () => {
    const pal = pxPalette('dark');
    const prng = lvRand('test_struct');
    const houseBuf = pxHouse(pal, 20, 14, 6, pal.roof, pal.wall);
    expect(houseBuf.w).toBeGreaterThanOrEqual(20);
    expect(houseBuf.h).toBeGreaterThanOrEqual(20);

    const foreBuf = new PixelBuffer(PX.W, PX.H);
    const model = contextToSceneModel({ age: 25, sex: 'M', countryId: 'USA', wealthQuintile: 3 });
    model.prop = 'crops';
    pxFore(foreBuf, model, pal, prng, 140);
    expect(foreBuf.w).toBe(PX.W);
  });
});

describe('Pixel Art Engine: Special Moments, Particles & Funerals', () => {
  it('contains at least 40 special life moments in MO', () => {
    const momentKeys = Object.keys(MO);
    expect(momentKeys.length).toBeGreaterThanOrEqual(40);
    for (const key of ['born', 'grad', 'wed', 'cake', 'hosp', 'trip', 'fest', 'stars']) {
      expect(MO).toHaveProperty(key);
    }
  });

  it('executes particle shaders into buffer', () => {
    const pal = pxPalette('dark');
    const prng = lvRand('test_fx');
    const mc: MomentContext = {
      m: {
        stage: 'd',
        mood: 'high',
        urban: true,
        region: 'hi',
        home: 'house',
        people: [],
        prop: 'none',
        car: false,
        moto: false,
        seed: 'fx_seed',
      },
      P: pal,
      R: prng,
      a: [],
      sky: new PixelBuffer(PX.W, PX.H),
      back: new PixelBuffer(PX.W, PX.H),
      mid: new PixelBuffer(PX.W, PX.H),
      front: new PixelBuffer(PX.W, PX.H),
      span: null,
      cast: { all: [], me: { role: 'me', sex: 'M', age: 25 }, pt: [], kids: [], gk: [], par: [], sib: [], inlaw: [] },
    };

    fxConfetti(mc, 10);
    fxPetals(mc, 10);
    fxRain(mc, 10);
    fxSnow(mc, 10);
    fxSpark(mc, 50, 20, 2);
    fxHeart(mc, 60, 20);
    fxNote(mc, 70, 20);
    fxLanterns(mc, 15, 0, 50);
    fxStars(mc, 10);

    // Verify front layer has non-null pixels from particles
    const hasFrontPixels = mc.front.data.some((p) => p !== null);
    expect(hasFrontPixels).toBe(true);
  });

  it('dispatches life moment vignette and produces 4 composite layers', () => {
    const pal = pxPalette('dark');
    const model: SceneModel = {
      stage: 'd',
      mood: 'high',
      urban: true,
      region: 'hi',
      home: 'house',
      people: [{ role: 'me', age: 0, sex: 'M' }],
      prop: 'none',
      car: false,
      moto: false,
      seed: 'moment_seed',
      act: 'born',
    };

    const layers = pxMoment(model, pal);
    expect(layers).not.toBeNull();
    if (layers) {
      expect(layers.sky.w).toBe(PX.W);
      expect(layers.front.h).toBe(PX.H);
      expect(layers.people[0]).toBeLessThanOrEqual(layers.people[1]);
    }
  });

  it('renders cultural funeral services across all 5 traditions', () => {
    const pal = pxPalette('dark');
    for (const rel of ['M', 'C', 'H', 'B', 'secular']) {
      const model: SceneModel = {
        stage: 'e',
        mood: 'low',
        urban: true,
        region: 'hi',
        home: 'house',
        people: [{ role: 'me', age: 75, sex: 'M' }],
        prop: 'none',
        car: false,
        moto: false,
        seed: `funeral_${rel}`,
        rel,
      };
      const funeralBuf = pxFuneral(model, pal);
      expect(funeralBuf.w).toBe(PX.W);
      expect(funeralBuf.h).toBe(PX.H);
      // Altar center at X=96 should be populated
      expect(funeralBuf.get(96, PX.G - 7)).not.toBeNull();
    }
  });
});

describe('Pixel Art Engine: Scene Compositor & Canvas Renderer', () => {
  it('calculates dynamic collision-free family positioning', () => {
    const pal = pxPalette('dark');
    const model: SceneModel = {
      stage: 'd',
      mood: 'mid',
      urban: true,
      region: 'hi',
      home: 'house',
      people: [],
      prop: 'none',
      car: false,
      moto: false,
      seed: 'fam_seed',
    };
    const homeBuf = new PixelBuffer(26, 23);
    const peopleSprites = [
      { p: { role: 'me', age: 30, sex: 'M' as const }, s: pxPerson({ role: 'me', age: 30, sex: 'M' }, pal) },
      { p: { role: 'pt', age: 29, sex: 'F' as const }, s: pxPerson({ role: 'pt', age: 29, sex: 'F' }, pal) },
      { p: { role: 'kid', age: 5, sex: 'M' as const }, s: pxPerson({ role: 'kid', age: 5, sex: 'M' }, pal) },
    ];

    const layout = pxPeopleLay(model, pal, homeBuf, 4, peopleSprites);
    expect(layout.x).toBeGreaterThan(4 + 26); // Clear of house
    expect(layout.gap).toBeGreaterThanOrEqual(1);
    expect(layout.tot).toBeGreaterThan(0);
  });

  it('composes a full 192x60 procedural scene buffer', () => {
    const pal = pxPalette('dark');
    const model: SceneModel = {
      stage: 'd',
      mood: 'high',
      urban: true,
      region: 'hi',
      home: 'house',
      people: [
        { role: 'me', age: 25, sex: 'M', sk: 2 },
        { role: 'pt', age: 24, sex: 'F', sk: 2 },
      ],
      prop: 'crops',
      pet: 'd',
      car: true,
      moto: false,
      seed: 'full_scene_seed',
    };

    const sceneBuf = pxScene(model, pal);
    expect(sceneBuf.w).toBe(192);
    expect(sceneBuf.h).toBe(60);
    expect(sceneBuf.data.length).toBe(192 * 60);

    // Verify critical elements: sky, ground, house, family
    expect(sceneBuf.get(10, 10)).not.toBeNull(); // Sky
    expect(sceneBuf.get(10, PX.G + 5)).not.toBeNull(); // Ground
  });

  it('renders multi-layer scene layers cleanly', () => {
    const pal = pxPalette('dark');
    const model: SceneModel = {
      stage: 'd',
      mood: 'mid',
      urban: false,
      region: 'ssa',
      home: 'hut',
      people: [{ role: 'me', age: 20, sex: 'M' }],
      prop: 'herd',
      car: false,
      moto: false,
      seed: 'layers_seed',
    };

    const layers = pxSceneLayers(model, pal);
    expect(layers.sky.w).toBe(192);
    expect(layers.back.w).toBe(192);
    expect(layers.mid.w).toBe(192);
    expect(layers.front.w).toBe(192);
    expect(layers.people[0]).toBeLessThan(layers.people[1]);
  });

  it('executes renderPixelScene onto a canvas 2D context', () => {
    const mockContext: any = {
      canvas: { width: 192, height: 60 },
      createImageData: vi.fn((w, h) => ({
        width: w,
        height: h,
        data: new Uint8ClampedArray(w * h * 4),
      })),
      putImageData: vi.fn(),
      drawImage: vi.fn(),
      clearRect: vi.fn(),
      imageSmoothingEnabled: true,
    };

    const context: SceneContext = {
      age: 28,
      sex: 'F',
      countryId: 'FRA',
      wealthQuintile: 4,
    };

    renderPixelScene(mockContext as CanvasRenderingContext2D, context, 'dark');
    expect(mockContext.createImageData).toHaveBeenCalledWith(192, 60);
    expect(mockContext.putImageData).toHaveBeenCalled();
  });
});
