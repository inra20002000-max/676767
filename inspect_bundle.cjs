const fs = require('fs');
const content = fs.readFileSync('d:/сайтик/temp_bundle.js', 'utf8');
console.log('Bundle length:', content.length);

// search for scene rendering, pixel art, or canvas drawing in 1in8b
const sceneMatches = content.match(/scene|avatar|city|pixel|palette|street|skyline/gi);
console.log('Keyword counts:', sceneMatches ? sceneMatches.length : 0);

// Find canvas references
const canvasMatches = content.match(/<canvas[^>]*>|getContext\(['"]2d['"]\)/g);
console.log('Canvas usages:', canvasMatches ? canvasMatches.length : 0);

// Look for family scene drawing or illustration
const idx = content.indexOf('Любумбаши');
console.log('Russian text found at:', idx);

// Find some key functions
const fns = content.match(/function\s+[a-zA-Z0-9_$]+\s*\([^)]*\)\s*\{[^}]{0,100}canvas/g);
console.log('Canvas functions:', fns ? fns.slice(0, 5) : 'none');
