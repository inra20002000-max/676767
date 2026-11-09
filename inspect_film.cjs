const fs = require('fs');
const content = fs.readFileSync('d:/сайтик/temp_bundle.js', 'utf8');

// Find playEnding and filmPost, filmAudio, makeFilm
const fns = ['playEnding', 'makeFilm', 'filmAudio', 'filmPost', 'endingData'];
for (const fn of fns) {
    const idx = content.indexOf('function ' + fn);
    if (idx !== -1) {
        console.log(`=== ${fn} ===`);
        console.log(content.slice(idx, idx + 1200));
    }
}
