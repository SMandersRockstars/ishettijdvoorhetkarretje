// Time Manager - Handles all time-related calculations and state
class TimeManager {
    constructor() {
        this.updateCallbacks = [];
        this.lastState = null;
        this.testMode = false; // Set to true to force party time for testing
        this.config = {
            defaultPartyTime: { hour: 16, minute: 0 },
            overrides: []
        };
    }

    async loadConfig() {
        try {
            const response = await fetch('config.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            this.config = await response.json();
        } catch (e) {
            console.warn('Failed to load config.json, using defaults:', e.message);
        }
    }

    getPartyTime(date) {
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const override = this.config.overrides.find(o => o.date === dateStr);
        if (override) {
            return { hour: override.hour, minute: override.minute };
        }
        return { ...this.config.defaultPartyTime };
    }

    isPartyTime() {
        // Allow test mode override
        if (this.testMode) {
            return true;
        }

        const now = new Date();
        const day = now.getDay();
        const hour = now.getHours();
        const minute = now.getMinutes();

        const { hour: partyHour, minute: partyMinute } = this.getPartyTime(now);
        const pastPartyTime = hour > partyHour || (hour === partyHour && minute >= partyMinute);

        // Check if it's Friday after party time OR before 00:00 on Saturday
        return (day === 5 && pastPartyTime) || (day === 6 && hour < 0);
    }

    getNextPartyTime() {
        const now = new Date();
        const targetTime = new Date(now);

        if (this.isPartyTime()) {
            return targetTime;
        }

        // Find the next Friday
        const day = now.getDay();
        let daysUntilFriday = (5 - day + 7) % 7;

        if (day === 6) {
            daysUntilFriday = 6; // If it's Saturday, next Friday is in 6 days
        }

        targetTime.setDate(targetTime.getDate() + daysUntilFriday);

        const { hour, minute } = this.getPartyTime(targetTime);
        targetTime.setHours(hour, minute, 0, 0);

        return targetTime;
    }

    getTimeState() {
        const isParty = this.isPartyTime();
        const nextPartyTime = this.getNextPartyTime();

        let remainingTimeText;
        if (isParty) {
            remainingTimeText = "HET IS TIJD VOOR HET KARRETJE!";
        } else {
            const remainingTime = nextPartyTime - new Date();
            const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
            const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));

            remainingTimeText = `Nog: ${days}d ${hours}h ${minutes}m voordat het tijd is voor het karretje`;
        }

        return {
            isPartyTime: isParty,
            message: isParty ? "JA" : "NEE",
            remainingTime: remainingTimeText,
            iconSrc: isParty ? (window.festivityManager ? window.festivityManager.getFullCartImage() : "assets/default-mode/full_cart.jpg") : (window.festivityManager ? window.festivityManager.getIcon() : "assets/default-mode/empty_cart.png")
        };
    }

    onUpdate(callback) {
        this.updateCallbacks.push(callback);
    }

    notifySubscribers() {
        const state = this.getTimeState();

        // Only notify if state has actually changed
        if (!this.lastState ||
            this.lastState.isPartyTime !== state.isPartyTime ||
            this.lastState.remainingTime !== state.remainingTime) {

            this.lastState = state;
            this.updateCallbacks.forEach(callback => callback(state));
        }
    }

    startUpdates(intervalMs = 60000) {
        this.notifySubscribers();
        setInterval(() => this.notifySubscribers(), intervalMs);
    }

    // Toggle test mode for debugging
    toggleTestMode() {
        this.testMode = !this.testMode;
        console.log('Test mode:', this.testMode ? 'ENABLED (Party time forced!)' : 'DISABLED');
        this.notifySubscribers(); // Immediately update the display
        return this.testMode;
    }
}

// Create global instance
window.timeManager = new TimeManager();
