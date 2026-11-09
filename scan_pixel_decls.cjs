const fs = require('fs');
const content = fs.readFileSync('d:/сайтик/pixel_engine_decompiled.js', 'utf8');

// List all top-level functions and constants in order
const regex = /(?:const|let|var|function|class)\s+([A-Za-z0-9_$]+)/g;
const decls = [];
let m;
while ((m = regex.exec(content)) !== null) {
    if (m[1].length > 1 && !['null', 'true', 'false', 'undefined', 'this'].includes(m[1])) {
        decls.push({ name: m[1], pos: m.index });
    }
}

// Group into unique top-level declarations
console.log('Unique declarations count:', new Set(decls.map(d => d.name)).size);
console.log('Key declarations in order:');
const seen = new Set();
for (const d of decls) {
    if (!seen.has(d.name)) {
        seen.add(d.name);
        console.log(`- ${d.name} (offset ${d.pos})`);
    }
}
