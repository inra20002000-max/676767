const fs = require('fs');
const content = fs.readFileSync('d:/сайтик/temp_bundle.js', 'utf8');

const matches = [...content.matchAll(/bike|bicycle|velo/gi)];
console.log('Bike matches:', matches.length);
for (const m of matches.slice(0, 5)) {
    const idx = m.index;
    console.log(content.slice(Math.max(0, idx - 50), idx + 100));
}
