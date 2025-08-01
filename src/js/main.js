// Main Application - Initializes and coordinates all components
document.addEventListener('DOMContentLoaded', () => {
    // Initialize time display
    const timeDisplay = {
        elements: {
            message: document.getElementById('message'),
            content: document.getElementById('content'),
            icon: document.getElementById('icon'),
            remainingTime: document.getElementById('remaining-time'),
            beerDrinkingGif: document.getElementById('beer-drinking-gif')
        },

        updateDisplay(state) {
            this.elements.message.textContent = state.message;
            this.elements.content.className = `content ${state.isPartyTime ? 'yes' : 'no'}`;
            this.elements.icon.src = state.iconSrc;
            this.elements.remainingTime.textContent = state.remainingTime;
            this.elements.beerDrinkingGif.style.display = state.isPartyTime ? 'block' : 'none';
        },

        initialize() {
            // Subscribe to time updates
            window.timeManager.onUpdate((state) => {
                this.updateDisplay(state);
            });
        }
    };

    // Initialize components
    timeDisplay.initialize();
    window.coinCursor.initialize();
    
    // Start the time updates
    window.timeManager.startUpdates();
}); 