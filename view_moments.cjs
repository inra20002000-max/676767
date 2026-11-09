const fs = require('fs');
const content = fs.readFileSync('d:/сайтик/pixel_engine_decompiled.js', 'utf8');

const s = content.indexOf('function pxMoment');
const e = content.indexOf('const HOME=');
console.log('pxMoment slice length:', e - s);

// Let's print the first 4000 chars of pxMoment
console.log(content.slice(s, s + 4000));
