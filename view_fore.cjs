const fs = require('fs');
const content = fs.readFileSync('d:/сайтик/pixel_engine_decompiled.js', 'utf8');

const s = content.indexOf('function pxFore');
const e = content.indexOf('function pxPeopleLay');
console.log(content.slice(s, e));
