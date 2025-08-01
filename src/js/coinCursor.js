// Coin Cursor - Handles the interactive coin effects
class CoinCursor {
    constructor() {
        this.coinImages = ['assets/coin.png', 'assets/coin2.png'];
        this.partyImages = [
            'assets/heineken.png', 
            'assets/hertog_jan.png', 
            'assets/lays.png', 
            'assets/boonekamp.png',     
        ];
        
        this.coinCounter = 0;
        this.config = {
            gravity: 0.5,
            baseVelocityY: -8,
            velocityRange: 5,
            velocityXRange: 8,
            coinDelay: 50,
            fadeStart: 1500,
            fadeOut: 500
        };
    }

    initialize() {
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    }

    handleMouseMove(e) {
        const currentImages = this.getCurrentImages();
        const coinCount = Math.floor(Math.random() * 2) + 1; // 1-2 coins
        
        for (let i = 0; i < coinCount; i++) {
            setTimeout(() => {
                const imageUrl = currentImages[this.coinCounter % currentImages.length];
                this.coinCounter++;
                this.createCoin(e.clientX, e.clientY, imageUrl);
            }, i * this.config.coinDelay);
        }
    }

    getCurrentImages() {
        return window.timeManager.isPartyTime() ? this.partyImages : this.coinImages;
    }

    createCoin(x, y, imageUrl) {
        const coin = document.createElement('img');
        coin.src = imageUrl;
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
}

// Create global instance
window.coinCursor = new CoinCursor(); 