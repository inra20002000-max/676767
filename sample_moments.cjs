const fs = require('fs');
const content = fs.readFileSync('d:/сайтик/pixel_engine_decompiled.js', 'utf8');

for (const k of ['born', 'grad', 'wed', 'cake', 'hosp', 'trip', 'fest']) {
    const idx = content.indexOf(`MO.${k}=`);
    if (idx !== -1) {
        console.log(`=== MO.${k} ===`);
        console.log(content.slice(idx, idx + 1200));
    }
}
