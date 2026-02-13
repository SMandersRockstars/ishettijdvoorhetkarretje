// Main Application - Initializes and coordinates all components
document.addEventListener('DOMContentLoaded', async () => {
    // Video optimization with Intersection Observer
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                // Play video when visible
                video.play().catch(() => {
                    // Ignore errors if autoplay is blocked
                });
            } else {
                // Pause video when not visible to save resources
                video.pause();
            }
        });
    }, {
        threshold: 0.25, // Start playing when 25% visible
        rootMargin: '50px' // Start loading slightly before visible
    });

    // Observe all lazy videos
    document.querySelectorAll('.lazy-video').forEach(video => {
        videoObserver.observe(video);
    });

    // Initialize time display
    const timeDisplay = {
        elements: {
            message: document.getElementById('message'),
            content: document.getElementById('content'),
            icon: document.getElementById('icon'),
            remainingTime: document.getElementById('remaining-time'),
            waitingContent: document.getElementById('waiting-content'),
            beerDrinkingGif: document.getElementById('beer-drinking-gif')
        },

        updateDisplay(state) {
            this.elements.message.textContent = state.message;
            this.elements.content.className = `content ${state.isPartyTime ? 'yes' : 'no'}`;
            this.elements.icon.src = state.iconSrc;
            this.elements.remainingTime.textContent = state.remainingTime;

            // Show/hide waiting content based on party time
            if (this.elements.waitingContent) {
                this.elements.waitingContent.style.display = state.isPartyTime ? 'none' : 'block';
            }
            const waitingText = document.getElementById('waiting-text');
            if (waitingText && !state.isPartyTime) {
                const nextParty = window.timeManager.getNextPartyTime();
                const timeStr = `${String(nextParty.getHours()).padStart(2, '0')}:${String(nextParty.getMinutes()).padStart(2, '0')}`;
                waitingText.textContent = `Speel Karretje the game!!!!! terwijl je wacht tot het vrijdag ${timeStr} is!`;
            }
            this.elements.beerDrinkingGif.style.display = state.isPartyTime ? 'block' : 'none';
        },

        initialize() {
            // Subscribe to time updates
            window.timeManager.onUpdate((state) => {
                this.updateDisplay(state);
            });
        }
    };

    // Initialize and apply festivity theme first
    if (window.festivityManager) {
        // Auto-apply theme based on current month
        const monthTheme = window.festivityManager.detectCurrentTheme();
        window.festivityManager.setTheme(monthTheme);
    }
    
    // Initialize components
    timeDisplay.initialize();
    window.coinCursor.initialize();
    
    // Load config and start the time updates
    await window.timeManager.loadConfig();
    window.timeManager.startUpdates();
}); 