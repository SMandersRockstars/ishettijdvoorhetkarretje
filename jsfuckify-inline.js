const { JSFuck } = require('jsfuck');
const fs = require('fs');

// Extract the inline JS from index.html
const inlineJS = `
function init() {
    const button = document.querySelector('.annoying-button');
    button.remove();
    const catGifSrc = window.festivityManager ? window.festivityManager.getGif('cat') : 'assets/default-mode/cat.gif';
    const gif = document.createElement('img');
    gif.src = catGifSrc;
    gif.id = 'cat-gif';
    gif.style.position = 'fixed';
    gif.style.bottom = '0px';
    gif.style.left = '0px';
    gif.style.width = document.body.clientWidth * 0.2 + 'px';
    gif.style.height = document.body.clientHeight * 0.2 + 'px';
    gif.style.zIndex = '1000';
    document.body.appendChild(gif);
    if (window.festivityManager) {
        window.festivityManager.cachedElements = null;
        window.festivityManager.playBackgroundAudio();
    }
}

let annoyingButton = null;
let mousePos = { x: 0, y: 0 };
let rafPending = false;

document.addEventListener('DOMContentLoaded', () => {
    annoyingButton = document.querySelector('.annoying-button');
});

addEventListener('mousemove', (e) => {
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
    if (!rafPending && annoyingButton) {
        rafPending = true;
        requestAnimationFrame(() => {
            if (!annoyingButton || !document.body.contains(annoyingButton)) {
                rafPending = false;
                return;
            }
            const top = mousePos.y - annoyingButton.clientHeight / 2;
            const left = mousePos.x - annoyingButton.clientWidth / 2;
            annoyingButton.style.top = top + 'px';
            annoyingButton.style.left = left + 'px';
            rafPending = false;
        });
    }
});

function toggleFestiveTheme() {
    if (window.festivityManager) {
        const newTheme = window.festivityManager.toggleTheme();
        updateToggleButtonVisibility();
        if (window.festivityManager.backgroundAudio) {
            window.festivityManager.backgroundAudio.play().catch(() => {});
        }
    } else {
        console.error('Festivity manager not available');
    }
}

function updateToggleButtonVisibility() {
    const themeTesting = document.getElementById('theme-testing');
    if (themeTesting && window.festivityManager) {
        const currentTheme = window.festivityManager.getCurrentTheme();
        if (window.festivityManager.isSpecialMonth() || currentTheme.name !== 'Default') {
            themeTesting.style.display = 'block';
        } else {
            themeTesting.style.display = 'none';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const themeTesting = document.getElementById('theme-testing');
    if (themeTesting && window.festivityManager) {
        if (window.festivityManager.isSpecialMonth()) {
            themeTesting.style.display = 'block';
        } else {
            themeTesting.style.display = 'none';
        }
    }
});
`;

console.log('Encoding inline JS...');
console.log(`  Input: ${(inlineJS.length / 1024).toFixed(1)} KB`);

const start = Date.now();
const output = JSFuck.encode(inlineJS);
const elapsed = ((Date.now() - start) / 1000).toFixed(1);

fs.writeFileSync('src/js/jsfucked/inline.js', output);

const outMB = (output.length / 1024 / 1024).toFixed(2);
const ratio = (output.length / inlineJS.length).toFixed(0);
console.log(`  Output: ${outMB} MB (${ratio}x expansion) [${elapsed}s]`);
