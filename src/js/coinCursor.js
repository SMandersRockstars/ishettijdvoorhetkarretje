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
            throttleDelay: 80, // Increased throttling for better performance
            maxCoins: 100, // Max coins on screen at once
            fadeStart: 1500,
            fadeOut: 500
        };

        // Object pooling for coins
        this.activeCoins = [];
        this.animationFrameId = null;

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
        // Throttle coin creation for better performance
        const now = Date.now();
        if (this.lastCoinTime && now - this.lastCoinTime < this.config.throttleDelay) {
            return;
        }

        // Limit total coins on screen
        if (this.activeCoins.length >= this.config.maxCoins) {
            return;
        }

        const currentImages = this.getCurrentImages();

        // Calculate movement speed for dynamic coin count (reduced max)
        let coinCount = 1; // Base count reduced
        if (this.lastMousePos) {
            const distance = Math.sqrt(
                Math.pow(e.clientX - this.lastMousePos.x, 2) +
                Math.pow(e.clientY - this.lastMousePos.y, 2)
            );
            // Reduced coin counts for better performance
            if (distance > 50) coinCount = Math.floor(Math.random() * 2) + 2; // 2-3 coins
            else if (distance > 20) coinCount = Math.floor(Math.random() * 2) + 1; // 1-2 coins
        }

        // Store current mouse position
        this.lastMousePos = { x: e.clientX, y: e.clientY };
        this.lastCoinTime = now;

        // Create coins immediately without setTimeout delays
        for (let i = 0; i < coinCount; i++) {
            const imageUrl = currentImages[this.coinCounter % currentImages.length];
            this.coinCounter++;
            this.createCoin(e.clientX, e.clientY, imageUrl);
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

        // Use transform for hardware acceleration instead of left/top
        coin.style.position = 'fixed';
        coin.style.willChange = 'transform, opacity';

        // Physics properties stored with the coin
        const coinData = {
            element: coin,
            posX: startX,
            posY: startY,
            vx: (Math.random() - 0.5) * this.config.velocityXRange,
            vy: this.config.baseVelocityY - (Math.random() * this.config.velocityRange),
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10,
            createdAt: Date.now(),
            opacity: 1
        };

        document.body.appendChild(coin);
        this.activeCoins.push(coinData);

        // Start centralized animation loop if not running
        if (!this.animationFrameId) {
            this.startAnimationLoop();
        }
    }

    startAnimationLoop() {
        const animate = () => {
            // Batch update all coins in a single RAF
            for (let i = this.activeCoins.length - 1; i >= 0; i--) {
                const coinData = this.activeCoins[i];
                const elapsed = Date.now() - coinData.createdAt;

                // Update physics
                coinData.posX += coinData.vx;
                coinData.posY += coinData.vy;
                coinData.vy += this.config.gravity;
                coinData.rotation += coinData.rotationSpeed;

                // Handle fade out
                if (elapsed > this.config.fadeStart) {
                    const fadeProgress = (elapsed - this.config.fadeStart) / this.config.fadeOut;
                    coinData.opacity = Math.max(0, 1 - fadeProgress);
                }

                // Check if coin should be removed
                if (elapsed > this.config.fadeStart + this.config.fadeOut ||
                    !this.isCoinVisible(coinData.posX, coinData.posY)) {
                    this.removeCoinByIndex(i);
                    continue;
                }

                // Apply transform using translate3d for hardware acceleration
                coinData.element.style.transform =
                    `translate3d(${coinData.posX}px, ${coinData.posY}px, 0) rotate(${coinData.rotation}deg)`;
                coinData.element.style.opacity = coinData.opacity;
            }

            // Continue loop if there are active coins
            if (this.activeCoins.length > 0) {
                this.animationFrameId = requestAnimationFrame(animate);
            } else {
                this.animationFrameId = null;
            }
        };

        this.animationFrameId = requestAnimationFrame(animate);
    }

    isCoinVisible(x, y) {
        return y < window.innerHeight + 100 &&
               x > -50 &&
               x < window.innerWidth + 50;
    }

    removeCoinByIndex(index) {
        const coinData = this.activeCoins[index];
        if (coinData && document.body.contains(coinData.element)) {
            document.body.removeChild(coinData.element);
        }
        this.activeCoins.splice(index, 1);
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

}

// Create global instance
window.coinCursor = new CoinCursor(); 