document.addEventListener('DOMContentLoaded', () => {
    // Define asset sets
    const coinImages = ['assets/coin.png', 'assets/coin2.png'];
    const partyImages = [
        'assets/heineken.png', 
        'assets/hertog_jan.png', 
        'assets/lays.png', 
        'assets/boonekamp.png',     
    ];
    
    let coinCounter = 0;
    
    // Constants for physics and timing
    const PHYSICS = {
        gravity: 0.5,
        baseVelocityY: -8,
        velocityRange: 5,
        velocityXRange: 8
    };
    
    const TIMING = {
        coinDelay: 50,
        fadeStart: 1500,
        fadeOut: 500
    };
    
    // Check if it's Friday after 15:30 OR before 00:00 on Saturday (party time!)
    function isPartyTime() {
        const now = new Date();
        const day = now.getDay();
        const hour = now.getHours();
        const minute = now.getMinutes();
        
        // Check if it's Friday after 15:30 OR before 00:00 on Saturday
        return (day === 5 && (hour > 15 || (hour === 15 && minute >= 30))) || 
               (day === 6 && hour < 0);
    }
    
    // Get current image set based on time and day
    function getCurrentImages() {
        return isPartyTime() ? partyImages : coinImages;
    }
    
    // Track mouse movement and create coins
    document.addEventListener('mousemove', (e) => {
        const currentImages = getCurrentImages();
        const coinCount = Math.floor(Math.random() * 2) + 1; // 1-2 coins
        
        for (let i = 0; i < coinCount; i++) {
            setTimeout(() => {
                const imageUrl = currentImages[coinCounter % currentImages.length];
                coinCounter++;
                createCoin(e.clientX, e.clientY, imageUrl);
            }, i * TIMING.coinDelay);
        }
    });
    
    function createCoin(x, y, imageUrl) {
        // Create coin element
        const coin = document.createElement('img');
        coin.src = imageUrl;
        coin.classList.add(isPartyTime() ? 'party-coin' : 'coin');
        
        // Initial position (centered on cursor)
        const startX = x - 15;
        const startY = y - 15;
        coin.style.left = startX + 'px';
        coin.style.top = startY + 'px';
        
        // Physics properties
        const physics = {
            posX: startX,
            posY: startY,
            vx: (Math.random() - 0.5) * PHYSICS.velocityXRange,
            vy: PHYSICS.baseVelocityY - (Math.random() * PHYSICS.velocityRange),
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10
        };
        
        document.body.appendChild(coin);
        animateAndCleanup(coin, physics);
    }
    
    function animateAndCleanup(coin, physics) {
        // Start animation
        function animate() {
            // Update physics
            physics.posX += physics.vx;
            physics.posY += physics.vy;
            physics.vy += PHYSICS.gravity;
            physics.rotation += physics.rotationSpeed;
            
            // Apply to element
            coin.style.left = physics.posX + 'px';
            coin.style.top = physics.posY + 'px';
            coin.style.transform = `rotate(${physics.rotation}deg)`;
            
            // Continue if coin is still visible
            if (isCoinVisible(physics.posX, physics.posY)) {
                requestAnimationFrame(animate);
            } else {
                removeCoin(coin);
            }
        }
        
        // Start fade out timer
        setTimeout(() => {
            coin.style.opacity = '0';
            setTimeout(() => removeCoin(coin), TIMING.fadeOut);
        }, TIMING.fadeStart);
        
        requestAnimationFrame(animate);
    }
    
    function isCoinVisible(x, y) {
        return y < window.innerHeight + 100 && 
               x > -50 && 
               x < window.innerWidth + 50;
    }
    
    function removeCoin(coin) {
        if (document.body.contains(coin)) {
            document.body.removeChild(coin);
        }
    }
});