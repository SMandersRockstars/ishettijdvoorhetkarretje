// Time Manager - Handles all time-related calculations and state
class TimeManager {
    constructor() {
        this.updateCallbacks = [];
    }

    isPartyTime() {
        const now = new Date();
        const day = now.getDay();
        const hour = now.getHours();
        const minute = now.getMinutes();

        // Check if it's Friday after 16:00 OR before 00:00 on Saturday
        return (day === 5 && hour > 15) || (day === 6 && hour < 0);
    }

    getNextPartyTime() {
        const now = new Date();
        const targetTime = new Date(now);
        
        if (this.isPartyTime()) {
            return targetTime;
        }

        // Find the next Friday 16:00
        const day = now.getDay();
        let daysUntilFriday = (5 - day + 7) % 7;
        
        if (day === 6) {
            daysUntilFriday = 6; // If it's Saturday, next Friday is in 6 days
        }
        
        targetTime.setDate(targetTime.getDate() + daysUntilFriday);
        targetTime.setHours(16, 0, 0, 0);
        
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
        this.updateCallbacks.forEach(callback => callback(state));
    }

    startUpdates(intervalMs = 60000) {
        this.notifySubscribers();
        setInterval(() => this.notifySubscribers(), intervalMs);
    }
}

// Create global instance
window.timeManager = new TimeManager(); 
