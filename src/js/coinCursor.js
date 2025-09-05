// Coin Cursor - Handles the interactive coin effects
class CoinCursor {
    constructor() {
        this.coinImages = window.festivityManager ? window.festivityManager.getCoinImages() : ['assets/default-mode/coin.png', 'assets/default-mode/coin2.png'];
        this.partyImages = window.festivityManager ? window.festivityManager.getPartyImages() : [
            'assets/default-mode/heineken.png', 
            'assets/default-mode/hertog_jan.png', 
            'assets/default-mode/lays.png', 
            'assets/default-mode/boonekamp.png',     
        ];
        
        this.coinCounter = 0;
        this.preloadedImages = new Map(); // Cache for preloaded images
        this.config = {
            gravity: 0.5,
            baseVelocityY: -8,
            velocityRange: 5,
            velocityXRange: 8,
            coinDelay: 20, // Reduced from 50ms to 20ms for faster spawning
            fadeStart: 1500,
            fadeOut: 500
        };
        
        // Preload images for better performance
        this.preloadImages();
    }

    initialize() {
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    }

    preloadImages() {
        // Preload all coin and party images
        const allImages = [...this.coinImages, ...this.partyImages];
        allImages.forEach(imageSrc => {
            if (!this.preloadedImages.has(imageSrc)) {
                const img = new Image();
                img.onload = () => {
                    this.preloadedImages.set(imageSrc, img);
                };
                img.src = imageSrc;
            }
        });
    }

    handleMouseMove(e) {
        // Reduced throttling for more coins
        if (this.lastCoinTime && Date.now() - this.lastCoinTime < 20) {
            return; // Skip if less than 20ms since last coin creation (reduced from 30ms)
        }
        
        const currentImages = this.getCurrentImages();
        
        // Calculate movement speed for dynamic coin count
        let coinCount = 2; // Base count
        if (this.lastMousePos) {
            const distance = Math.sqrt(
                Math.pow(e.clientX - this.lastMousePos.x, 2) + 
                Math.pow(e.clientY - this.lastMousePos.y, 2)
            );
            // More coins for faster movement
            if (distance > 50) coinCount = Math.floor(Math.random() * 6) + 3; // 3-8 coins
            else if (distance > 20) coinCount = Math.floor(Math.random() * 4) + 2; // 2-5 coins
        } else {
            coinCount = Math.floor(Math.random() * 4) + 2; // 2-5 coins
        }
        
        // Store current mouse position
        this.lastMousePos = { x: e.clientX, y: e.clientY };
        
        for (let i = 0; i < coinCount; i++) {
            setTimeout(() => {
                const imageUrl = currentImages[this.coinCounter % currentImages.length];
                this.coinCounter++;
                this.createCoin(e.clientX, e.clientY, imageUrl);
                this.lastCoinTime = Date.now();
            }, i * this.config.coinDelay);
        }
    }

    getCurrentImages() {
        // Use festivity manager if available, otherwise fall back to old logic
        if (window.festivityManager) {
            return window.timeManager.isPartyTime() ? window.festivityManager.getPartyImages() : window.festivityManager.getCoinImages();
        }
        return window.timeManager.isPartyTime() ? this.partyImages : this.coinImages;
    }

    createCoin(x, y, imageUrl) {
        const coin = document.createElement('img');
        
        // Use preloaded image if available, otherwise fallback to src
        if (this.preloadedImages.has(imageUrl)) {
            coin.src = this.preloadedImages.get(imageUrl).src;
        } else {
            coin.src = imageUrl;
        }
        
        coin.classList.add(window.timeManager.isPartyTime() ? 'party-coin' : 'coin');
        
        // Initial position (centered on cursor)
        const startX = x - 15;
        const startY = y - 15;
        coin.style.left = startX + 'px';
        coin.style.top = startY + 'px';
        
        // Physics properties
        const physics = {
            posX: startX,
            posY: startY,
            vx: (Math.random() - 0.5) * this.config.velocityXRange,
            vy: this.config.baseVelocityY - (Math.random() * this.config.velocityRange),
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10
        };
        
        document.body.appendChild(coin);
        this.animateAndCleanup(coin, physics);
    }

    animateAndCleanup(coin, physics) {
        const animate = () => {
            // Update physics
            physics.posX += physics.vx;
            physics.posY += physics.vy;
            physics.vy += this.config.gravity;
            physics.rotation += physics.rotationSpeed;
            
            // Apply to element
            coin.style.left = physics.posX + 'px';
            coin.style.top = physics.posY + 'px';
            coin.style.transform = `rotate(${physics.rotation}deg)`;
            
            // Continue if coin is still visible
            if (this.isCoinVisible(physics.posX, physics.posY)) {
                requestAnimationFrame(animate);
            } else {
                this.removeCoin(coin);
            }
        };
        
        // Start fade out timer
        setTimeout(() => {
            coin.style.opacity = '0';
            setTimeout(() => this.removeCoin(coin), this.config.fadeOut);
        }, this.config.fadeStart);
        
        requestAnimationFrame(animate);
    }

    isCoinVisible(x, y) {
        return y < window.innerHeight + 100 && 
               x > -50 && 
               x < window.innerWidth + 50;
    }

    removeCoin(coin) {
        if (document.body.contains(coin)) {
            document.body.removeChild(coin);
        }
    }

    // Update images when theme changes
    updateImages() {
        this.coinImages = window.festivityManager ? window.festivityManager.getCoinImages() : ['assets/default-mode/coin.png', 'assets/default-mode/coin2.png'];
        this.partyImages = window.festivityManager ? window.festivityManager.getPartyImages() : [
            'assets/default-mode/heineken.png', 
            'assets/default-mode/hertog_jan.png', 
            'assets/default-mode/lays.png', 
            'assets/default-mode/boonekamp.png'
        ];
        
        // Preload new images
        this.preloadImages();
    }

    // Clean up all coins (useful for theme changes)
    cleanupAllCoins() {
        const coins = document.querySelectorAll('.coin, .party-coin');
        coins.forEach(coin => this.removeCoin(coin));
    }
}

// Create global instance
window.coinCursor = new CoinCursor(); 