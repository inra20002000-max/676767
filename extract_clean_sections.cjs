const fs = require('fs');
const content = fs.readFileSync('d:/сайтик/pixel_engine_decompiled.js', 'utf8');

function extractBetween(startStr, endStr) {
    const s = content.indexOf(startStr);
    if (s === -1) return `NOT FOUND: ${startStr}`;
    const e = content.indexOf(endStr, s);
    if (e === -1) return content.slice(s, s + 3000);
    return content.slice(s, e);
}

// Write out section 1: Skin & Model
fs.writeFileSync('d:/сайтик/spec_section_1_skin_model.js', extractBetween('const SKIN_G', 'const PX='), 'utf8');

// Write out section 2: PX, Palettes, PxR, Sprites
fs.writeFileSync('d:/сайтик/spec_section_2_palette_sprites.js', extractBetween('const PX=', 'function pxSky'), 'utf8');

// Write out section 3: Environment, Sky, Clouds, Backdrop, Trees, Ground
fs.writeFileSync('d:/сайтик/spec_section_3_environment.js', extractBetween('function pxSky', 'function pxCurtain'), 'utf8');

// Write out section 4: Houses, Buildings, Vehicles, Work
fs.writeFileSync('d:/сайтик/spec_section_4_architecture.js', extractBetween('const pxCurtain', 'function pxPeopleLay'), 'utf8');

// Write out section 5: People Layout, Scene, Funeral, Caption
fs.writeFileSync('d:/сайтик/spec_section_5_scene.js', extractBetween('function pxPeopleLay', 'function pxMoment'), 'utf8');

// Write out section 6: Moments & FX
fs.writeFileSync('d:/сайтик/spec_section_6_moments.js', extractBetween('function pxMoment', 'const HOME='), 'utf8');

console.log('Sections 1-6 written successfully.');
