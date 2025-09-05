// Festivity Manager - Handles seasonal themes and special month decorations
class FestivityManager {
    constructor() {
        this.themes = {
            halloween: {
                name: 'Halloween',
                months: [10], // October
                coinImages: [
                    'assets/spooktober-mode/pumpkin-coin.png',
                    'assets/spooktober-mode/ghost-coin.png',
                    'assets/spooktober-mode/bat-coin.png',
                    'assets/spooktober-mode/skull-coin.png'
                ],
                gifs: {
                    beer: 'assets/spooktober-mode/halloween-beer.gif',
                    cat: 'assets/spooktober-mode/halloween-cat.gif',
                    fish: 'assets/spooktober-mode/halloween-fish.mp4'
                },
                videos: {
                    subway: 'assets/spooktober-mode/halloween-subway.mp4',
                    init: 'assets/spooktober-mode/halloween-init.mp4'
                },
                partyImages: [
                    'assets/spooktober-mode/halloween-heineken.png',
                    'assets/spooktober-mode/halloween-hertog.png',
                    'assets/spooktober-mode/halloween-lays.png',
                    'assets/spooktober-mode/halloween-boonekamp.png'
                ],
                icon: 'assets/spooktober-mode/halloween-cart.png',
                fullCart: 'assets/spooktober-mode/halloween-full-cart.png',
                cssClass: 'halloween-theme'
            },
            christmas: {
                name: 'Christmas',
                months: [12], // December
                coinImages: [
                    'assets/christmas-mode/snowflake-coin.png',
                    'assets/christmas-mode/gift-coin.png',
                    'assets/christmas-mode/star-coin.png',
                    'assets/christmas-mode/ornament-coin.png'
                ],
                gifs: {
                    beer: 'assets/christmas-mode/christmas-beer.gif',
                    cat: 'assets/christmas-mode/christmas-cat.gif',
                    fish: 'assets/christmas-mode/christmas-fish.mp4'
                },
                videos: {
                    subway: 'assets/christmas-mode/christmas-subway.mp4',
                    init: 'assets/christmas-mode/christmas-init.mp4'
                },
                partyImages: [
                    'assets/christmas-mode/christmas-heineken.png',
                    'assets/christmas-mode/christmas-hertog.png',
                    'assets/christmas-mode/christmas-lays.png',
                    'assets/christmas-mode/christmas-boonekamp.png'
                ],
                icon: 'assets/christmas-mode/christmas-cart.png',
                fullCart: 'assets/christmas-mode/christmas-full-cart.jpg',
                cssClass: 'christmas-theme'
            },
            default: {
                name: 'Default',
                months: [],
                coinImages: ['assets/default-mode/coin.png', 'assets/default-mode/coin2.png'],
                gifs: {
                    beer: 'assets/default-mode/beer-drinking.gif',
                    cat: 'assets/default-mode/cat.gif',
                    fish: 'assets/default-mode/fish.mp4'
                },
                videos: {
                    subway: 'assets/default-mode/youtube_RbVMiu4ubT0_480x854_h264.mp4',
                    init: 'assets/default-mode/fish.mp4'
                },
                partyImages: [
                    'assets/default-mode/heineken.png',
                    'assets/default-mode/hertog_jan.png',
                    'assets/default-mode/lays.png',
                    'assets/default-mode/boonekamp.png'
                ],
                icon: 'assets/default-mode/empty_cart.png',
                fullCart: 'assets/default-mode/full_cart.jpg',
                cssClass: 'default-theme'
            }
        };
        
        // Now that themes is defined, detect the current theme
        this.currentTheme = this.detectCurrentTheme();
    }

    detectCurrentTheme() {
        const currentMonth = new Date().getMonth() + 1; // getMonth() returns 0-11, we want 1-12
        
        for (const [themeName, theme] of Object.entries(this.themes)) {
            if (theme.months.includes(currentMonth)) {
                return themeName;
            }
        }
        
        return 'default';
    }

    getCurrentTheme() {
        return this.themes[this.currentTheme];
    }

    getCoinImages() {
        return this.getCurrentTheme().coinImages;
    }

    getPartyImages() {
        return this.getCurrentTheme().partyImages;
    }

    getGif(type) {
        const theme = this.getCurrentTheme();
        return theme.gifs[type] || this.themes.default.gifs[type];
    }

    getVideo(type) {
        const theme = this.getCurrentTheme();
        return theme.videos[type] || this.themes.default.videos[type];
    }

    getFullCartImage() {
        const theme = this.getCurrentTheme();
        return theme.fullCart || 'assets/default-mode/full_cart.jpg';
    }

    getIcon() {
        return this.getCurrentTheme().icon;
    }

    getCssClass() {
        return this.getCurrentTheme().cssClass;
    }

    applyTheme() {
        // Remove existing theme classes
        document.body.classList.remove('halloween-theme', 'christmas-theme', 'default-theme');
        
        // Add current theme class
        document.body.classList.add(this.getCssClass());
        
        // Update coin cursor images
        if (window.coinCursor) {
            window.coinCursor.updateImages();
        }
        
        // Update gifs and videos
        this.updateMediaElements();
        
        // Force update all videos
        this.updateAllVideos();
    }

    updateMediaElements() {
        const theme = this.getCurrentTheme();
        
        // Update beer drinking gif
        const beerGif = document.getElementById('beer-drinking-gif');
        if (beerGif) {
            this.updateImageWithFallback(beerGif, theme.gifs.beer, 'assets/default-mode/beer-drinking.gif');
        }
        
        // Update cat gif (if it exists)
        const catGif = document.querySelector('img[src*="cat.gif"]');
        if (catGif) {
            this.updateImageWithFallback(catGif, theme.gifs.cat, 'assets/default-mode/cat.gif');
        }
        
        // Update fish videos
        const fishVideos = document.querySelectorAll('video source[src*="fish.mp4"]');
        fishVideos.forEach(video => {
            this.updateVideoWithFallback(video, theme.gifs.fish, 'assets/default-mode/fish.mp4');
        });
        
        // Update subway surfers videos (side panels)
        const subwayVideos = document.querySelectorAll('.side video source');
        console.log('Found subway videos:', subwayVideos.length);
        subwayVideos.forEach(video => {
            console.log('Updating subway video from:', video.src, 'to:', theme.videos.subway);
            this.updateVideoWithFallback(video, theme.videos.subway, 'assets/default-mode/youtube_RbVMiu4ubT0_480x854_h264.mp4');
        });
        
        // Update cart icon
        const cartIcon = document.getElementById('icon');
        if (cartIcon && !window.timeManager.isPartyTime()) {
            this.updateImageWithFallback(cartIcon, theme.icon, 'assets/default-mode/empty_cart.png');
        }
        
        // Don't show festive init video automatically - only after init button click
    }

    updateImageWithFallback(imgElement, newSrc, fallbackSrc) {
        const originalSrc = imgElement.src;
        imgElement.src = newSrc;
        
        // Add error handling
        imgElement.onerror = () => {
            console.warn(`Failed to load image: ${newSrc}, using fallback: ${fallbackSrc}`);
            imgElement.src = fallbackSrc;
            imgElement.onerror = null; // Prevent infinite loop
        };
    }

    updateVideoWithFallback(videoElement, newSrc, fallbackSrc) {
        const originalSrc = videoElement.src;
        videoElement.src = newSrc;
        
        // Force video to reload with new source
        const video = videoElement.parentElement;
        if (video && video.tagName === 'VIDEO') {
            video.load(); // Reload the video element
            // Restart playback if it was playing
            if (video.autoplay) {
                video.play().catch(e => console.log('Video autoplay failed:', e));
            }
        }
        
        // Add error handling
        videoElement.onerror = () => {
            console.warn(`Failed to load video: ${newSrc}, using fallback: ${fallbackSrc}`);
            videoElement.src = fallbackSrc;
            if (video) {
                video.load(); // Reload with fallback
                if (video.autoplay) {
                    video.play().catch(e => console.log('Video autoplay failed:', e));
                }
            }
            videoElement.onerror = null; // Prevent infinite loop
        };
    }

    // Method to manually set theme (useful for testing)
    setTheme(themeName) {
        if (this.themes[themeName]) {
            this.currentTheme = themeName;
            this.applyTheme();
            
            // Force coin cursor to refresh its images
            if (window.coinCursor) {
                window.coinCursor.updateImages();
            }
            
            // Hide main init video when switching themes
            this.hideMainInitVideo();
            
            // Update toggle button visibility
            if (typeof updateToggleButtonVisibility === 'function') {
                updateToggleButtonVisibility();
            }
        }
    }

    // Method to check if we're in a special month (any month with a festive theme)
    isSpecialMonth() {
        const currentMonth = new Date().getMonth() + 1; // getMonth() returns 0-11, we want 1-12
        
        // Check if current month matches any festive theme
        for (const [themeName, theme] of Object.entries(this.themes)) {
            if (themeName !== 'default' && theme.months.includes(currentMonth)) {
                return true;
            }
        }
        return false;
    }

    // Toggle between festive theme and default theme
    toggleTheme() {
        if (this.isSpecialMonth()) {
            // If we're in a special month, toggle between festive and default
            this.currentTheme = this.currentTheme === 'default' ? this.detectCurrentTheme() : 'default';
        } else {
            // If we're not in a special month, just apply default
            this.currentTheme = 'default';
        }
        this.applyTheme();
        return this.currentTheme;
    }

    // Get the appropriate theme based on month and toggle state
    getAppropriateTheme() {
        const monthTheme = this.detectCurrentTheme();
        return this.isSpecialMonth() ? monthTheme : 'default';
    }

    // Force update all videos on the page
    updateAllVideos() {
        const theme = this.getCurrentTheme();
        
        // Update all video sources
        const allVideos = document.querySelectorAll('video');
        allVideos.forEach(video => {
            const source = video.querySelector('source');
            if (source) {
                // Determine what type of video this is based on current src
                let newSrc = source.src;
                if (source.src.includes('youtube_RbVMiu4ubT0') || source.src.includes('subway')) {
                    newSrc = theme.videos.subway;
                } else if (source.src.includes('fish.mp4') || source.src.includes('init')) {
                    newSrc = theme.gifs.fish;
                }
                
                if (newSrc !== source.src) {
                    console.log('Updating video from:', source.src, 'to:', newSrc);
                    this.updateVideoWithFallback(source, newSrc, 'assets/default-mode/youtube_RbVMiu4ubT0_480x854_h264.mp4');
                }
            }
        });
    }

    // Hide main init video when switching themes (if it exists)
    hideMainInitVideo() {
        const mainVideo = document.getElementById('main-init-video');
        if (mainVideo) {
            mainVideo.remove();
        }
    }
}

// Create global instance
window.festivityManager = new FestivityManager();
