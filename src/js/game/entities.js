/**
 * Game entities - Player, Obstacles, Clouds, etc.
 */

import { GAME_CONFIG } from './config.js';
import { getRandomNum, checkCollision } from './utils.js';

/**
 * Player (TRex) class
 */
export class TRex {
    constructor(canvas, spritePos) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.spritePos = spritePos;
        this.xPos = 0;
        this.yPos = 0;
        this.groundYPos = 0;
        this.width = 44;
        this.height = 47;
        this.drawWidth = 44;
        this.drawHeight = 47;
        this.ducking = false;
        this.jumping = false;
        this.velocity = 0;
        this.currentFrame = 0;
        this.frameCount = 0;
        this.blinkCount = 0;
        this.blinkDelay = 0;
        this.animStartTime = 0;
        this.timer = 0;
        this.runningTime = 0;
        this.config = GAME_CONFIG;
        this.jumpVelocity = 0;
        this.minJumpHeight = 0;
        this.reachedMinHeight = false;
        this.speedDrop = false;
        this.jumpCount = 0;
        this.jumpspotX = 0;
        this.init();
    }

    init() {
        this.groundYPos = this.canvas.height - this.height - this.config.BOTTOM_PAD;
        this.yPos = this.groundYPos;
        this.minJumpHeight = this.groundYPos - this.config.MIN_JUMP_HEIGHT;
        this.draw();
    }

    draw() {
        const centerX = this.xPos + this.width / 2;
        const centerY = this.yPos + this.height / 2;
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        
        if (this.ducking) {
            this.ctx.drawImage(
                this.spritePos.img,
                this.spritePos.x, this.spritePos.y + this.height,
                this.width, this.height,
                -this.width / 2, -this.height / 2,
                this.width, this.height
            );
        } else {
            this.ctx.drawImage(
                this.spritePos.img,
                this.spritePos.x, this.spritePos.y,
                this.width, this.height,
                -this.width / 2, -this.height / 2,
                this.width, this.height
            );
        }
        
        this.ctx.restore();
    }

    update(deltaTime) {
        this.runningTime += deltaTime;
        
        if (this.jumping) {
            this.yPos += this.velocity;
            this.velocity += this.config.GRAVITY;
            
            if (this.yPos >= this.groundYPos) {
                this.yPos = this.groundYPos;
                this.jumping = false;
                this.velocity = 0;
            }
        }
        
        this.draw();
    }

    jump() {
        if (!this.jumping) {
            this.jumping = true;
            this.velocity = -this.config.INITIAL_JUMP_VELOCITY;
        }
    }

    duck() {
        this.ducking = true;
    }

    stand() {
        this.ducking = false;
    }

    getBounds() {
        return {
            x: this.xPos,
            y: this.yPos,
            width: this.width,
            height: this.height
        };
    }
}

/**
 * Obstacle class
 */
export class Obstacle {
    constructor(canvas, spritePos, type, xPos, yPos) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.spritePos = spritePos;
        this.type = type;
        this.xPos = xPos;
        this.yPos = yPos;
        this.width = 0;
        this.height = 0;
        this.drawWidth = 0;
        this.drawHeight = 0;
        this.gap = 0;
        this.speedOffset = 0;
        this.currentFrame = 0;
        this.timer = 0;
        this.remove = false;
        this.collisionBoxes = [];
        this.init();
    }

    init() {
        this.width = this.spritePos.w;
        this.height = this.spritePos.h;
        this.drawWidth = this.width;
        this.drawHeight = this.height;
        this.gap = this.width * GAME_CONFIG.GAP_COEFFICIENT;
    }

    draw() {
        this.ctx.drawImage(
            this.spritePos.img,
            this.spritePos.x, this.spritePos.y,
            this.width, this.height,
            this.xPos, this.yPos,
            this.drawWidth, this.drawHeight
        );
    }

    update(deltaTime, speed) {
        this.xPos -= speed * deltaTime;
        
        if (this.xPos + this.width < 0) {
            this.remove = true;
        }
        
        this.draw();
    }

    getBounds() {
        return {
            x: this.xPos,
            y: this.yPos,
            width: this.width,
            height: this.height
        };
    }
}

/**
 * Cloud class
 */
export class Cloud {
    constructor(canvas, spritePos, xPos, yPos) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.spritePos = spritePos;
        this.xPos = xPos;
        this.yPos = yPos;
        this.width = 46;
        this.height = 14;
        this.remove = false;
        this.cloudGap = getRandomNum(100, 400);
    }

    draw() {
        this.ctx.drawImage(
            this.spritePos.img,
            this.spritePos.x, this.spritePos.y,
            this.width, this.height,
            this.xPos, this.yPos,
            this.width, this.height
        );
    }

    update(deltaTime, speed) {
        this.xPos -= speed * deltaTime * GAME_CONFIG.BG_CLOUD_SPEED;
        
        if (this.xPos + this.width < 0) {
            this.remove = true;
        }
        
        this.draw();
    }
}

/**
 * Horizon class
 */
export class Horizon {
    constructor(canvas, spritePos) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.spritePos = spritePos;
        this.sourceXPos = [2, 602];
        this.sourceYPos = [54];
        this.sourceDimensions = [1200, 12];
        this.xPos = 0;
        this.yPos = 0;
        this.clouds = [];
        this.obstacles = [];
        this.config = GAME_CONFIG;
        this.init();
    }

    init() {
        this.yPos = this.canvas.height - this.sourceDimensions[1];
    }

    draw() {
        this.ctx.drawImage(
            this.spritePos.img,
            this.sourceXPos[0], this.sourceYPos[0],
            this.sourceDimensions[0], this.sourceDimensions[1],
            this.xPos, this.yPos,
            this.sourceDimensions[0], this.sourceDimensions[1]
        );
        
        this.ctx.drawImage(
            this.spritePos.img,
            this.sourceXPos[1], this.sourceYPos[0],
            this.sourceDimensions[0], this.sourceDimensions[1],
            this.xPos + this.sourceDimensions[0], this.yPos,
            this.sourceDimensions[0], this.sourceDimensions[1]
        );
    }

    update(deltaTime, speed) {
        this.xPos -= speed * deltaTime;
        
        if (this.xPos <= -this.sourceDimensions[0]) {
            this.xPos = 0;
        }
        
        this.draw();
    }

    addCloud(cloud) {
        this.clouds.push(cloud);
    }

    addObstacle(obstacle) {
        this.obstacles.push(obstacle);
    }

    updateClouds(deltaTime, speed) {
        this.clouds.forEach(cloud => cloud.update(deltaTime, speed));
        this.clouds = this.clouds.filter(cloud => !cloud.remove);
    }

    updateObstacles(deltaTime, speed) {
        this.obstacles.forEach(obstacle => obstacle.update(deltaTime, speed));
        this.obstacles = this.obstacles.filter(obstacle => !obstacle.remove);
    }
} 