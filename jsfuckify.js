const { JSFuck } = require('jsfuck');
const fs = require('fs');
const path = require('path');

const files = [
    'src/js/timeManager.js',
    'src/js/festivityManager.js',
    'src/js/coinCursor.js',
    'src/js/main.js',
];

const outDir = 'src/js/jsfucked';
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

let totalIn = 0;
let totalOut = 0;

for (const file of files) {
    const basename = path.basename(file);
    console.log(`\nEncoding ${basename}...`);
    const input = fs.readFileSync(file, 'utf-8');
    console.log(`  Input: ${(input.length / 1024).toFixed(1)} KB`);

    const start = Date.now();
    const output = JSFuck.encode(input, true); // true = wrap with eval so it executes
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    const outPath = path.join(outDir, basename);
    fs.writeFileSync(outPath, output);

    const ratio = (output.length / input.length).toFixed(0);
    const outMB = (output.length / 1024 / 1024).toFixed(2);
    console.log(`  Output: ${outMB} MB (${ratio}x expansion) [${elapsed}s]`);

    totalIn += input.length;
    totalOut += output.length;
}

console.log(`\n=== TOTAL ===`);
console.log(`Input:  ${(totalIn / 1024).toFixed(1)} KB`);
console.log(`Output: ${(totalOut / 1024 / 1024).toFixed(2)} MB`);
console.log(`Ratio:  ${(totalOut / totalIn).toFixed(0)}x`);
console.log(`\nFiles written to ${outDir}/`);
