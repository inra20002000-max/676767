const fs = require('fs');
const content = fs.readFileSync('d:/сайтик/temp_bundle.js', 'utf8');

// Find all occurrences of PX_
const matches = [...content.matchAll(/const\s+(PX[A-Z0-9_]*)\s*=/g)];
console.log('PX constants found:', matches.map(m => m[1]));

// Let's find functions starting with px
const fnMatches = [...content.matchAll(/function\s+(px[A-Za-z0-9_]+)\s*\(/g)];
console.log('px functions found:', fnMatches.map(m => m[1]));

// Let's find classes
const classMatches = [...content.matchAll(/class\s+(Px[A-Za-z0-9_]+)/g)];
console.log('Px classes found:', classMatches.map(m => m[1]));
