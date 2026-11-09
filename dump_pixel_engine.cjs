const fs = require('fs');
const content = fs.readFileSync('d:/сайтик/temp_bundle.js', 'utf8');

// Find exact boundaries
const startIdx = content.indexOf('const SKIN_G');
const endIdx = content.indexOf('function pxBouquet');

console.log('Extracting from', startIdx, 'to', endIdx);
const slice = content.slice(startIdx, endIdx + 3000);

fs.writeFileSync('d:/сайтик/pixel_engine_decompiled.js', slice, 'utf8');
console.log('Saved pixel_engine_decompiled.js, size:', slice.length);
