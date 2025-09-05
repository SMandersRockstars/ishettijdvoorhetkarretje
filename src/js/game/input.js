/**
 * Input manager for keyboard and touch controls
 */

import { isMobile, isTouchEnabled, throttle } from './utils.js';

export class InputManager {
    constructor(game) {
        this.game = game;
        this.keys = {};
        this.touchStartY = 0;
        this.touchStartX = 0;
        this.touchEndY = 0;
        this.touchEndX = 0;
        this.minSwipeDistance = 30;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Touch events
        if (isTouchEnabled()) {
            document.addEventListener('touchstart', this.handleTouchStart.bind(this));
            document.addEventListener('touchend', this.handleTouchEnd.bind(this));
            document.addEventListener('touchmove', this.handleTouchMove.bind(this));
        }
        
        // Mouse events (for desktop)
        if (!isMobile()) {
            document.addEventListener('mousedown', this.handleMouseDown.bind(this));
            document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        }
    }

    handleKeyDown(event) {
        this.keys[event.code] = true;
        
        switch (event.code) {
            case 'Space':
            case 'ArrowUp':
                event.preventDefault();
                this.game.jump();
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.game.duck();
                break;
            case 'KeyP':
                event.preventDefault();
                this.game.togglePause();
                break;
            case 'KeyR':
                event.preventDefault();
                this.game.restart();
                break;
        }
    }

    handleKeyUp(event) {
        this.keys[event.code] = false;
        
        switch (event.code) {
            case 'ArrowDown':
                event.preventDefault();
                this.game.stand();
                break;
        }
    }

    handleTouchStart(event) {
        event.preventDefault();
        const touch = event.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
    }

    handleTouchEnd(event) {
        event.preventDefault();
        const touch = event.changedTouches[0];
        this.touchEndX = touch.clientX;
        this.touchEndY = touch.clientY;
        
        this.handleSwipe();
    }

    handleTouchMove(event) {
        event.preventDefault();
    }

    handleMouseDown(event) {
        event.preventDefault();
        this.game.jump();
    }

    handleMouseUp(event) {
        event.preventDefault();
    }

    handleSwipe() {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > this.minSwipeDistance) {
            if (Math.abs(deltaY) > Math.abs(deltaX)) {
                // Vertical swipe
                if (deltaY < 0) {
                    // Swipe up
                    this.game.jump();
                } else {
                    // Swipe down
                    this.game.duck();
                }
            } else {
                // Horizontal swipe
                if (deltaX > 0) {
                    // Swipe right
                    this.game.jump();
                } else {
                    // Swipe left
                    this.game.duck();
                }
            }
        } else {
            // Tap
            this.game.jump();
        }
    }

    isKeyPressed(keyCode) {
        return this.keys[keyCode] || false;
    }

    destroy() {
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        document.removeEventListener('keyup', this.handleKeyUp.bind(this));
        document.removeEventListener('touchstart', this.handleTouchStart.bind(this));
        document.removeEventListener('touchend', this.handleTouchEnd.bind(this));
        document.removeEventListener('touchmove', this.handleTouchMove.bind(this));
        document.removeEventListener('mousedown', this.handleMouseDown.bind(this));
        document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    }
} 