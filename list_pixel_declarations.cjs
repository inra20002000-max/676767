const fs = require('fs');
const content = fs.readFileSync('d:/сайтик/temp_bundle.js', 'utf8');

// Find all function names and const names between 5890000 and 6280000
const sub = content.slice(5890000, 6280000);
console.log('Sub length:', sub.length);

const items = [];
const regex = /(function\s+([A-Za-z0-9_$]+)|(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=)/g;
let m;
while ((m = regex.exec(sub)) !== null) {
    items.push({
        type: m[1] ? 'func' : 'var',
        name: m[2] || m[3],
        pos: 5890000 + m.index
    });
}

console.log('Total declarations found:', items.length);
console.log(items.map(it => `${it.type} ${it.name} @ ${it.pos}`));
