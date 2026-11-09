const fs = require('fs');
const content = fs.readFileSync('d:/сайтик/temp_bundle.js', 'utf8');

const start = 5950000;
const end = 6030000;
const sub = content.slice(start, end);

const items = [];
const regex = /(function\s+([A-Za-z0-9_$]+)|(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=|class\s+([A-Za-z0-9_$]+))/g;
let m;
while ((m = regex.exec(sub)) !== null) {
    const name = m[2] || m[3] || m[4];
    items.push({
        name,
        type: m[2] ? 'func' : (m[4] ? 'class' : 'var'),
        pos: start + m.index
    });
}

console.log(items.filter(it => it.name.length > 2 || it.name.startsWith('px') || it.name.startsWith('PX')));
