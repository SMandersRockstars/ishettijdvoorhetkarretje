/**
 * Main game engine - coordinates all game components
 */

import { GAME_CONFIG, GAME_STATES, FPS } from './config.js';
import { TRex, Obstacle, Cloud, Horizon } from './entities.js';
import { AudioManager } from './audio.js';
import { InputManager } from './input.js';
import { loadGameImages, getSprite } from './sprites.js';
import { getRandomNum, checkCollision, formatDistance, formatTime } from './utils.js';

export class GameEngine {
    constructor(canvas, container) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.container = container;
        
        // Game state
        this.state = GAME_STATES.WAITING;
        this.score = 0;
        this.highScore = 0;
        this.distance = 0;
        this.time = 0;
        this.speed = GAME_CONFIG.SPEED;
        
        // Game objects
        this.player = null;
        this.horizon = null;
        this.obstacles = [];
        this.clouds = [];
        this.images = null;
        
        // Managers
        this.audio = new AudioManager();
        this.input = null;
        
        // Game loop
        this.lastTime = 0;
        this.animationId = null;
        this.frameCount = 0;
        
        // Obstacle generation
        this.obstacleTimer = 0;
        this.obstacleInterval = 1500;
        this.lastObstacleX = 0;
        
        // Cloud generation
        this.cloudTimer = 0;
        this.cloudInterval = 3000;
        
        this.init();
    }

    async init() {
        try {
            // Load images
            this.images = await loadGameImages();
            
            // Initialize game objects
            this.player = new TRex(this.canvas, getSprite(this.images, 'TRex'));
            this.horizon = new Horizon(this.canvas, getSprite(this.images, 'Horizon'));
            
            // Initialize input manager
            this.input = new InputManager(this);
            
            // Start game loop
            this.gameLoop();
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
        }
    }

    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (this.state === GAME_STATES.RUNNING) {
            this.update(deltaTime);
        }
        
        this.render();
        this.frameCount++;
        
        this.animationId = requestAnimationFrame(this.gameLoop.bind(this));
    }

    update(deltaTime) {
        // Update player
        this.player.update(deltaTime);
        
        // Update horizon
        this.horizon.update(deltaTime, this.speed);
        
        // Update obstacles
        this.updateObstacles(deltaTime);
        
        // Update clouds
        this.updateClouds(deltaTime);
        
        // Update game state
        this.updateGameState(deltaTime);
        
        // Check collisions
        this.checkCollisions();
        
        // Generate new obstacles and clouds
        this.generateObstacles(deltaTime);
        this.generateClouds(deltaTime);
    }

    updateObstacles(deltaTime) {
        this.obstacles.forEach(obstacle => {
            obstacle.update(deltaTime, this.speed);
        });
        
        // Remove off-screen obstacles
        this.obstacles = this.obstacles.filter(obstacle => !obstacle.remove);
    }

    updateClouds(deltaTime) {
        this.clouds.forEach(cloud => {
            cloud.update(deltaTime, this.speed);
        });
        
        // Remove off-screen clouds
        this.clouds = this.clouds.filter(cloud => !cloud.remove);
    }

    updateGameState(deltaTime) {
        this.time += deltaTime;
        this.distance += this.speed * deltaTime;
        
        // Increase speed over time
        this.speed += GAME_CONFIG.ACCELERATION * deltaTime;
        this.speed = Math.min(this.speed, GAME_CONFIG.MAX_SPEED);
    }

    checkCollisions() {
        const playerBounds = this.player.getBounds();
        
        this.obstacles.forEach(obstacle => {
            if (checkCollision(playerBounds, obstacle.getBounds())) {
                this.crash();
            }
        });
    }

    generateObstacles(deltaTime) {
        this.obstacleTimer += deltaTime;
        
        if (this.obstacleTimer >= this.obstacleInterval) {
            this.obstacleTimer = 0;
            
            const x = this.canvas.width + 50;
            const y = this.canvas.height - 100;
            const type = getRandomNum(0, 1) === 0 ? 'small' : 'large';
            const sprite = getSprite(this.images, type === 'small' ? 'ObstacleSmall' : 'ObstacleLarge');
            
            const obstacle = new Obstacle(this.canvas, sprite, type, x, y);
            this.obstacles.push(obstacle);
            
            // Adjust interval based on speed
            this.obstacleInterval = Math.max(500, 1500 - (this.speed * 50));
        }
    }

    generateClouds(deltaTime) {
        this.cloudTimer += deltaTime;
        
        if (this.cloudTimer >= this.cloudInterval) {
            this.cloudTimer = 0;
            
            const x = this.canvas.width + 50;
            const y = getRandomNum(20, 80);
            const sprite = getSprite(this.images, 'Cloud');
            
            const cloud = new Cloud(this.canvas, sprite, x, y);
            this.clouds.push(cloud);
            
            this.cloudInterval = getRandomNum(2000, 5000);
        }
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.ctx.fillStyle = '#f7f7f7';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw horizon
        this.horizon.draw();
        
        // Draw clouds
        this.clouds.forEach(cloud => cloud.draw());
        
        // Draw obstacles
        this.obstacles.forEach(obstacle => obstacle.draw());
        
        // Draw player
        this.player.draw();
        
        // Draw UI
        this.drawUI();
    }

    drawUI() {
        this.ctx.fillStyle = '#535353';
        this.ctx.font = '16px Arial';
        
        // Draw score
        this.ctx.fillText(`Score: ${Math.floor(this.distance / 10)}`, 20, 30);
        
        // Draw high score
        this.ctx.fillText(`High Score: ${this.highScore}`, 20, 50);
        
        // Draw time
        this.ctx.fillText(`Time: ${formatTime(Math.floor(this.time / 1000))}`, 20, 70);
        
        // Draw speed
        this.ctx.fillText(`Speed: ${Math.floor(this.speed)}`, 20, 90);
    }

    // Game control methods
    start() {
        if (this.state === GAME_STATES.WAITING) {
            this.state = GAME_STATES.RUNNING;
            this.audio.playButtonPress();
        }
    }

    jump() {
        if (this.state === GAME_STATES.RUNNING) {
            this.player.jump();
            this.audio.playButtonPress();
        } else if (this.state === GAME_STATES.WAITING) {
            this.start();
        }
    }

    duck() {
        if (this.state === GAME_STATES.RUNNING) {
            this.player.duck();
        }
    }

    stand() {
        if (this.state === GAME_STATES.RUNNING) {
            this.player.stand();
        }
    }

    crash() {
        this.state = GAME_STATES.CRASHED;
        this.audio.playCrash();
        
        // Update high score
        const currentScore = Math.floor(this.distance / 10);
        if (currentScore > this.highScore) {
            this.highScore = currentScore;
        }
        
        // Show game over screen
        this.showGameOver();
    }

    showGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
        
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Score: ${Math.floor(this.distance / 10)}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
        this.ctx.fillText('Press SPACE to restart', this.canvas.width / 2, this.canvas.height / 2 + 40);
    }

    restart() {
        this.state = GAME_STATES.WAITING;
        this.score = 0;
        this.distance = 0;
        this.time = 0;
        this.speed = GAME_CONFIG.SPEED;
        
        // Reset game objects
        this.player = new TRex(this.canvas, getSprite(this.images, 'TRex'));
        this.horizon = new Horizon(this.canvas, getSprite(this.images, 'Horizon'));
        this.obstacles = [];
        this.clouds = [];
        
        this.audio.playButtonPress();
    }

    pause() {
        if (this.state === GAME_STATES.RUNNING) {
            this.state = GAME_STATES.PAUSED;
        } else if (this.state === GAME_STATES.PAUSED) {
            this.state = GAME_STATES.RUNNING;
        }
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.input) {
            this.input.destroy();
        }
    }
} 