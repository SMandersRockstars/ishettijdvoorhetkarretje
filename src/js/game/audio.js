/**
 * Audio manager for game sounds
 */

import { GAME_CONFIG, SOUND_EFFECTS } from './config.js';

export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.masterGainNode = null;
        this.volume = GAME_CONFIG.AUDIO_VOLUME;
        this.enabled = true;
        this.init();
    }

    init() {
        try {
            // Create audio context
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // Create master gain node
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.gain.value = this.volume;
            this.masterGainNode.connect(this.audioContext.destination);
            
            this.loadSounds();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }

    loadSounds() {
        // Load sound effects
        this.loadSound(SOUND_EFFECTS.BUTTON_PRESS, 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        this.loadSound(SOUND_EFFECTS.COUNT, 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        this.loadSound(SOUND_EFFECTS.CRASH, 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        this.loadSound(SOUND_EFFECTS.HIT, 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        this.loadSound(SOUND_EFFECTS.SCORE, 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    }

    loadSound(name, src) {
        if (!this.enabled) return;

        const audio = new Audio();
        audio.src = src;
        audio.preload = 'auto';
        this.sounds[name] = audio;
    }

    playSound(name) {
        if (!this.enabled || !this.sounds[name]) return;

        try {
            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const sound = this.sounds[name];
            sound.currentTime = 0;
            sound.volume = this.volume;
            sound.play().catch(e => {
                console.warn('Failed to play sound:', e);
            });
        } catch (e) {
            console.warn('Error playing sound:', e);
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        if (this.masterGainNode) {
            this.masterGainNode.gain.value = this.volume;
        }
        
        // Update all loaded sounds
        Object.values(this.sounds).forEach(sound => {
            sound.volume = this.volume;
        });
    }

    mute() {
        this.setVolume(0);
    }

    unmute() {
        this.setVolume(GAME_CONFIG.AUDIO_VOLUME);
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }

    // Convenience methods for specific sounds
    playButtonPress() {
        this.playSound(SOUND_EFFECTS.BUTTON_PRESS);
    }

    playCount() {
        this.playSound(SOUND_EFFECTS.COUNT);
    }

    playCrash() {
        this.playSound(SOUND_EFFECTS.CRASH);
    }

    playHit() {
        this.playSound(SOUND_EFFECTS.HIT);
    }

    playScore() {
        this.playSound(SOUND_EFFECTS.SCORE);
    }
} 