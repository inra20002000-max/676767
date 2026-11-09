const fs = require('fs');
const content = fs.readFileSync('d:/сайтик/temp_bundle.js', 'utf8');

// Find pxScene, pxPerson, pxNewborn, pxSky, pxCloud
const fns = ['pxScene', 'pxPerson', 'pxNewborn', 'pxSky', 'pxCloud', 'PxR', 'pxPalette'];
for (const fn of fns) {
    const idx = content.indexOf('function ' + fn);
    if (idx !== -1) {
        console.log(`=== ${fn} ===`);
        console.log(content.slice(idx, idx + 1000));
    }
}

// Find PX constants (PX.W, PX.H, PX.G)
const pxConst = content.match(/const\s+PX\s*=\s*\{[^}]+\}/);
if (pxConst) console.log('PX:', pxConst[0]);
