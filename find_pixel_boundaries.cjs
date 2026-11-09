const fs = require('fs');
const content = fs.readFileSync('d:/сайтик/temp_bundle.js', 'utf8');

// Find all occurrences of the functions from pxBitmap to pxBouquet
const startIdx = content.indexOf('function pxBitmap');
const endIdx = content.indexOf('function pxBouquet');

console.log('startIdx (pxBitmap):', startIdx);
console.log('endIdx (pxBouquet):', endIdx);

// Let's see what is after pxBouquet
const afterBouquet = content.slice(endIdx, endIdx + 2000);
// Let's find where the pixel art module ends
console.log('After pxBouquet:\n', afterBouquet);

// Let's find where the pixel art section starts before pxBitmap
const beforeBitmap = content.slice(Math.max(0, startIdx - 3000), startIdx);
console.log('Before pxBitmap (last 1000 chars):\n', beforeBitmap.slice(-1000));
