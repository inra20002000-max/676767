const fs = require('fs');
const content = fs.readFileSync('d:/сайтик/temp_bundle.js', 'utf8');

// Find PX_PEOPLE, PX_NEWBORN, PX_PAL, PX_PET, and sprite definitions
const defs = ['PX_PEOPLE', 'PX_NEWBORN', 'PX_PAL', 'PX_PET', 'pxSprite'];
for (const d of defs) {
    const idx = content.indexOf(d);
    if (idx !== -1) {
        console.log(`=== ${d} ===`);
        console.log(content.slice(idx, idx + 800));
    }
}
