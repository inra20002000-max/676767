const fs = require('fs');
const content = fs.readFileSync('d:/сайтик/pixel_engine_decompiled.js', 'utf8');

const s = content.indexOf('function pxBackdrop');
const e = content.indexOf('function pxHouse');
console.log(content.slice(s, e));
