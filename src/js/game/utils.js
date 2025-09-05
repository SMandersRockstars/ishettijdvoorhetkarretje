/**
 * Game utilities and helper functions
 */

import { IS_HIDPI, IS_MOBILE } from './config.js';

/**
 * Get random number between min and max
 */
export function getRandomNum(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Check if device is mobile
 */
export function isMobile() {
    return IS_MOBILE;
}

/**
 * Check if device supports touch
 */
export function isTouchEnabled() {
    return 'ontouchstart' in window;
}

/**
 * Get canvas context with proper scaling for HiDPI displays
 */
export function getCanvasContext(canvas) {
    const ctx = canvas.getContext('2d');
    
    if (IS_HIDPI) {
        const devicePixelRatio = window.devicePixelRatio || 1;
        const backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
            ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio || 1;
        
        const ratio = devicePixelRatio / backingStoreRatio;
        
        if (devicePixelRatio !== backingStoreRatio) {
            const oldWidth = canvas.width;
            const oldHeight = canvas.height;
            
            canvas.width = oldWidth * ratio;
            canvas.height = oldHeight * ratio;
            
            canvas.style.width = oldWidth + 'px';
            canvas.style.height = oldHeight + 'px';
            
            ctx.scale(ratio, ratio);
        }
    }
    
    return ctx;
}

/**
 * Debounce function to limit function calls
 */
export function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

/**
 * Throttle function to limit function calls
 */
export function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Format time in MM:SS format
 */
export function formatTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format distance in meters
 */
export function formatDistance(distance) {
    return Math.floor(distance / 10) + 'm';
}

/**
 * Check if two rectangles are colliding
 */
export function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

/**
 * Load image and return promise
 */
export function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

/**
 * Load audio and return promise
 */
export function loadAudio(src) {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.oncanplaythrough = () => resolve(audio);
        audio.onerror = reject;
        audio.src = src;
    });
} 