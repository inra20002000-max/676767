const fs = require('fs');
const content = fs.readFileSync('d:/сайтик/temp_bundle.js', 'utf8');

const idx = content.indexOf('PX_PAL');
console.log('PX_PAL index:', idx);
if (idx !== -1) {
    console.log('PX_PAL definition snippet:\n', content.slice(idx - 50, idx + 2000));
}

// Also check where pxRGB or pxMix is defined
const rgbIdx = content.indexOf('function pxRGB');
if (rgbIdx !== -1) {
    console.log('pxRGB snippet:\n', content.slice(rgbIdx - 50, rgbIdx + 1500));
}
