const fs = require('fs');
const content = fs.readFileSync('d:/сайтик/pixel_engine_decompiled.js', 'utf8');

const s = content.indexOf('const MO=');
const e = content.indexOf('const HOME=');
const sub = content.slice(s, e);

const moKeys = [...sub.matchAll(/MO\.([A-Za-z0-9_$]+)\s*=|MO\[['"]([^'"]+)['"]\]\s*=/g)].map(m => m[1] || m[2]);
console.log('Total MO keys found:', moKeys.length);
console.log('MO keys:', moKeys);
