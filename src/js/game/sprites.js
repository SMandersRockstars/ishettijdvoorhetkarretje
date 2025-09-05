/**
 * Sprites and image management for the game
 */

// Sprite positions and dimensions
export const SPRITE_POSITIONS = {
    TRex: {
        x: 1338,
        y: 2,
        w: 44,
        h: 47
    },
    TRexDuck: {
        x: 1338,
        y: 49,
        w: 44,
        h: 47
    },
    Cloud: {
        x: 86,
        y: 2,
        w: 46,
        h: 14
    },
    Horizon: {
        x: 2,
        y: 54,
        w: 1200,
        h: 12
    },
    ObstacleSmall: {
        x: 228,
        y: 2,
        w: 17,
        h: 35
    },
    ObstacleLarge: {
        x: 332,
        y: 2,
        w: 25,
        h: 50
    }
};

// Image sources - using external URLs instead of base64 data
export const IMAGE_SOURCES = {
    sprites: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABLAAAAAMAgMAAAAPCKxBAAAABlBMVEX///9TU1NYzE1OAAAAAXRSTlMAQObYZgAAALJJREFUeF7t1EEKAyEMhtEvMNm7sPfJEVyY+1+ltLgYAsrQCtWhbxEhQvgxIJtSZypxa/WGshgzKdbq/UihMFMlt3o/CspEYoihIMaAb6mCvM6C+BTAeyo+wN4yykV/6pVfkdLpVyI1hh7GJ6QunUoLEQlQglNP2nkQkeF8+ei9cLxMue1qxVRfk1Ej0s6AEGWfVOk0QUtnK5Xo0Lac6wpdtnQqB6VxomPaz+dgF1PaqqmeWJlz1jYUaSIAAAAASUVORK5CYII='
};

// Load all game images
export async function loadGameImages() {
    const images = {};
    
    try {
        // Load main spritesheet
        images.sprites = await loadImage(IMAGE_SOURCES.sprites);
        
        // Create sprite objects with loaded image
        Object.keys(SPRITE_POSITIONS).forEach(key => {
            const sprite = SPRITE_POSITIONS[key];
            images[key] = {
                img: images.sprites,
                x: sprite.x,
                y: sprite.y,
                w: sprite.w,
                h: sprite.h
            };
        });
        
        return images;
    } catch (error) {
        console.error('Failed to load game images:', error);
        throw error;
    }
}

// Helper function to load an image
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// Get sprite by name
export function getSprite(images, name) {
    return images[name] || null;
}

// Draw sprite on canvas
export function drawSprite(ctx, sprite, x, y, width, height) {
    if (!sprite || !sprite.img) return;
    
    ctx.drawImage(
        sprite.img,
        sprite.x, sprite.y,
        sprite.w, sprite.h,
        x, y,
        width || sprite.w,
        height || sprite.h
    );
} 