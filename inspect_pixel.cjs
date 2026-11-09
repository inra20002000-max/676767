const fs = require('fs');
const content = fs.readFileSync('d:/сайтик/temp_bundle.js', 'utf8');

// Find pxBitmap and pixel drawing functions
const idx = content.indexOf('function pxBitmap');
if (idx !== -1) {
    console.log('pxBitmap snippet:\n', content.slice(idx, idx + 2500));
}

// Find pixel avatar or street/family rendering
const pxIdx = content.indexOf('pxLayerCanvas');
if (pxIdx !== -1) {
    console.log('pxLayerCanvas snippet:\n', content.slice(pxIdx, pxIdx + 2000));
}
