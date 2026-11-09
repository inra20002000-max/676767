const fs = require('fs');
const content = fs.readFileSync('d:/сайтик/temp_bundle.js', 'utf8');

// Find where sceneModel or sceneAt is defined and where the family pixel art is generated
const sceneIdx = content.indexOf('function sceneModel');
if (sceneIdx !== -1) {
    console.log('=== sceneModel ===');
    console.log(content.slice(sceneIdx, sceneIdx + 2000));
}
