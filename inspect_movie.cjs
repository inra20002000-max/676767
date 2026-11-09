const fs = require('fs');
const content = fs.readFileSync('d:/сайтик/temp_bundle.js', 'utf8');

// Find endD, movie, memorial, recap, end-of-life
const idx = content.indexOf('endD');
console.log('endD occurrences:');
let pos = 0;
while ((pos = content.indexOf('endD', pos)) !== -1) {
    console.log('pos:', pos, 'snippet:', content.slice(pos - 50, pos + 200).replace(/\r?\n/g, ' '));
    pos += 4;
}

// Check for movie or replay or film
const movieMatches = content.match(/function\s+[a-zA-Z0-9_$]*(?:Movie|Film|Replay|PlayLife|LifeMovie|Eulogy)[a-zA-Z0-9_$]*\s*\(/gi);
console.log('Movie/Film matches:', movieMatches);
