/**
 * Game configuration constants
 */

// Default game dimensions
export const DEFAULT_WIDTH = 600;
export const FPS = 60;
export const IS_HIDPI = true;
export const IS_IOS = window.navigator.userAgent.indexOf('UIWebViewForStaticFileContent') > -1;
export const IS_MOBILE = window.navigator.userAgent.indexOf('Mobi') > -1 || IS_IOS;
export const IS_TOUCH_ENABLED = 'ontouchstart' in window;

// Game configuration
export const GAME_CONFIG = {
    ACCELERATION: 0.001,
    BG_CLOUD_SPEED: 0.2,
    BOTTOM_PAD: 10,
    CLEAR_TIME: 3000,
    CLOUD_FREQUENCY: 0.5,
    GAMEOVER_CLEAR_TIME: 750,
    GAP_COEFFICIENT: 0.6,
    GRAVITY: 0.6,
    INITIAL_JUMP_VELOCITY: 12,
    MAX_CLOUDS: 6,
    MAX_OBSTACLE_LENGTH: 3,
    MAX_SPEED: 12,
    MIN_JUMP_HEIGHT: 35,
    MOBILE_SPEED_COEFFICIENT: 1.2,
    RESOURCE_TEMPLATE_ID: 'audio-resources',
    SPEED: 6,
    SPEED_DROP_COEFFICIENT: 3,
    ARCADE_MODE_INITIAL_LIVES: 3,
    ARCADE_MODE_SETTING: 'RUNNER_INTERNAL_SETTINGS.arcadeMode',
    AUDIO_VOLUME: 0.1,
    BACKGROUND_CLOUD_SPEED: 0.2,
    BOTTOM_PAD: 10,
    CLEAR_TIME: 3000,
    CLOUD_FREQUENCY: 0.5,
    GAMEOVER_CLEAR_TIME: 750,
    GAP_COEFFICIENT: 0.6,
    GRAVITY: 0.6,
    INITIAL_JUMP_VELOCITY: 12,
    MAX_CLOUDS: 6,
    MAX_OBSTACLE_LENGTH: 3,
    MAX_SPEED: 12,
    MIN_JUMP_HEIGHT: 35,
    MOBILE_SPEED_COEFFICIENT: 1.2,
    RESOURCE_TEMPLATE_ID: 'audio-resources',
    SPEED: 6,
    SPEED_DROP_COEFFICIENT: 3,
    ARCADE_MODE_INITIAL_LIVES: 3,
    ARCADE_MODE_SETTING: 'RUNNER_INTERNAL_SETTINGS.arcadeMode',
    AUDIO_VOLUME: 0.1
};

// Default dimensions
export const DEFAULT_DIMENSIONS = {
    WIDTH: DEFAULT_WIDTH,
    HEIGHT: 150
};

// Game states
export const GAME_STATES = {
    WAITING: 'WAITING',
    RUNNING: 'RUNNING',
    CRASHED: 'CRASHED',
    PAUSED: 'PAUSED'
};

// Sound effects
export const SOUND_EFFECTS = {
    BUTTON_PRESS: 'BUTTON_PRESS',
    COUNT: 'COUNT',
    CRASH: 'CRASH',
    HIT: 'HIT',
    SCORE: 'SCORE'
}; 