const fs = require('fs');
const content = fs.readFileSync('d:/сайтик/temp_bundle.js', 'utf8');

const s = content.indexOf('SKIN_W=');
const e = content.indexOf('function skinMe');
console.log(content.slice(s, e));
