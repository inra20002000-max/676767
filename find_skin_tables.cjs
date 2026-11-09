const fs = require('fs');
const content = fs.readFileSync('d:/сайтик/temp_bundle.js', 'utf8');

for (const name of ['SKIN_W', 'SKIN_CI', 'SC_PROP']) {
    const idx = content.indexOf('const ' + name);
    if (idx !== -1) {
        console.log(`=== ${name} ===`);
        console.log(content.slice(idx, idx + 1000));
    } else {
        const idx2 = content.indexOf(name + '=');
        console.log(`${name} as assignment:`, idx2 !== -1 ? content.slice(idx2, idx2 + 500) : 'not found');
    }
}
