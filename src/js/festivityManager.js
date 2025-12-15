// Festivity Manager - Handles seasonal themes and special month decorations
class FestivityManager {
    constructor() {
        // Cache DOM element references for better performance
        this.cachedElements = null;
        this.backgroundAudio = null; // Store audio element

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
                    beer: 'assets/default-mode/beer-drinking.gif',
                    cat: 'assets/default-mode/cat.gif',
                    fish: 'assets/default-mode/fish.mp4'
                },
                videos: {
                    subway: 'assets/default-mode/youtube_RbVMiu4ubT0_480x854_h264.mp4',
                    init: 'assets/spooktober-mode/halloween-init.mp4'
                },
                partyImages: [
                    'assets/default-mode/heineken.png',
                    'assets/default-mode/hertog_jan.png',
                    'assets/default-mode/lays.png',
                    'assets/default-mode/boonekamp.png'
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
                    beer: 'assets/christmas-mode/beer-drinking.gif',
                    cat: 'assets/christmas-mode/christmas-cat.gif',
                    fish: 'assets/christmas-mode/christmas-fish.gif'
                },
                videos: {
                    subway: 'assets/christmas-mode/christmas-subway.mp4',
                    init: 'assets/christmas-mode/christmas-subway.mp4'
                },
                audio: {
                    background: 'assets/christmas-mode/Funkytown (Christmas).mp3'
                },
                partyImages: [
                    'assets/christmas-mode/christmas-heineken.png',
                    'assets/christmas-mode/christmas-hertog.png',
                    'assets/christmas-mode/christmas-lays.png',
                    'assets/christmas-mode/christmas-boonekamp.png'
                ],
                icon: 'assets/christmas-mode/empty_cart.png',
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

    cacheElements() {
        if (!this.cachedElements) {
            // For fish, look for both video sources AND img elements (in case they were replaced)
            const fishVideoSources = document.querySelectorAll('video source[src*="fish.mp4"], video source[src*="fish.gif"]');
            const fishImgs = document.querySelectorAll('.fish img');
            const allFishElements = [...fishVideoSources, ...fishImgs];

            this.cachedElements = {
                beerGif: document.getElementById('beer-drinking-gif'),
                catGif: document.getElementById('cat-gif') || document.querySelector('img[src*="cat.gif"]'),
                fishElements: allFishElements,
                subwayVideos: document.querySelectorAll('.side video source'),
                cartIcon: document.getElementById('icon'),
                mainInitVideo: document.getElementById('main-init-video')
            };
        }
        return this.cachedElements;
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

        // Clear cached elements to force refresh
        this.cachedElements = null;

        // Update gifs and videos
        this.updateMediaElements();

        // Update background audio
        this.updateBackgroundAudio();
    }

    updateBackgroundAudio() {
        const theme = this.getCurrentTheme();

        // Stop and remove current audio if it exists
        if (this.backgroundAudio) {
            this.backgroundAudio.pause();
            this.backgroundAudio.remove();
            this.backgroundAudio = null;
        }

        // If theme has background audio, create and play it
        if (theme.audio && theme.audio.background) {
            console.log('Playing background audio:', theme.audio.background);
            this.backgroundAudio = new Audio(theme.audio.background);
            this.backgroundAudio.loop = true;
            this.backgroundAudio.volume = 0.5; // Set volume to 50%

            // Play audio (may require user interaction)
            this.backgroundAudio.play().catch(e => {
                console.log('Background audio autoplay blocked. User interaction required:', e);
            });
        } else {
            console.log('No background audio for theme:', theme.name);
        }
    }

    updateMediaElements() {
        const theme = this.getCurrentTheme();
        const elements = this.cacheElements();

        console.log('Updating media elements for theme:', theme.name);
        console.log('Found elements:', {
            beerGif: !!elements.beerGif,
            catGif: !!elements.catGif,
            fishElements: elements.fishElements.length,
            subwayVideos: elements.subwayVideos.length
        });

        // Update beer drinking gif
        if (elements.beerGif) {
            this.updateImageWithFallback(elements.beerGif, theme.gifs.beer, 'assets/default-mode/beer-drinking.gif');
        }

        // Update cat gif (if it exists)
        if (elements.catGif) {
            console.log('Updating cat gif to:', theme.gifs.cat);
            this.updateImageWithFallback(elements.catGif, theme.gifs.cat, 'assets/default-mode/cat.gif');
        } else {
            console.log('Cat gif element not found');
        }

        // Update fish - handle both video and gif formats, and both video and img elements
        console.log('Updating', elements.fishElements.length, 'fish elements to:', theme.gifs.fish);
        elements.fishElements.forEach(element => {
            this.updateAnyMediaElement(element, theme.gifs.fish, 'assets/default-mode/fish.mp4');
        });

        // Unmute fish videos in default mode (for default fish.mp4 audio), keep muted in festive modes
        const shouldMuteFish = theme.name !== 'Default';
        document.querySelectorAll('.fish video').forEach(video => {
            video.muted = shouldMuteFish;
        });

        // Update subway surfers videos (side panels) - handle both video and gif formats
        console.log('Updating', elements.subwayVideos.length, 'subway videos to:', theme.videos.subway);
        elements.subwayVideos.forEach(videoSource => {
            this.updateMediaElement(videoSource, theme.videos.subway, 'assets/default-mode/youtube_RbVMiu4ubT0_480x854_h264.mp4');
        });

        // Double-check all subway videos are muted
        document.querySelectorAll('.side video').forEach(video => {
            console.log('Subway video muted state:', video.muted, 'src:', video.querySelector('source')?.src);
            video.muted = true;
            video.volume = 0;
        });

        // Update cart icon
        if (elements.cartIcon && !window.timeManager.isPartyTime()) {
            this.updateImageWithFallback(elements.cartIcon, theme.icon, 'assets/default-mode/empty_cart.png');
        }

        // Update or hide init video based on theme
        const mainInitVideo = document.getElementById('main-init-video');
        if (mainInitVideo) {
            if (theme.name === 'Default') {
                // Hide init video in default mode
                console.log('Hiding init video for default mode');
                mainInitVideo.style.display = 'none';
            } else {
                // Update init video for festive modes
                console.log('Updating init video to:', theme.videos.init);
                const source = mainInitVideo.querySelector('source');
                if (source) {
                    source.src = theme.videos.init;
                    mainInitVideo.muted = false; // Init video should have sound in festive mode
                    mainInitVideo.load();
                    mainInitVideo.style.display = 'block';
                    mainInitVideo.play().catch(e => console.log('Init video play failed:', e));
                }
            }
        }
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
            // Ensure video stays muted (especially important for subway videos)
            video.muted = true;
            video.setAttribute('muted', ''); // Set both property and attribute
            video.load(); // Reload the video element
            // Ensure muted stays set after load
            video.muted = true;
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

    updateAnyMediaElement(element, newSrc, fallbackSrc) {
        const isGif = newSrc.toLowerCase().endsWith('.gif');

        // Check if element is an img tag
        if (element.tagName === 'IMG') {
            if (isGif) {
                // img → img: just update src
                console.log('Updating img src to:', newSrc);
                element.src = newSrc;
            } else {
                // img → video: replace img with video
                console.log('Replacing img with video:', newSrc);
                const video = document.createElement('video');
                video.autoplay = true;
                video.loop = true;
                video.muted = true;
                video.playsInline = true;
                video.className = element.className;
                video.style.width = '100%';
                video.style.height = '100%';
                video.style.objectFit = 'fill';

                const source = document.createElement('source');
                source.src = newSrc;
                source.type = 'video/mp4';
                video.appendChild(source);

                element.parentElement.replaceChild(video, element);
                video.load();
                video.play().catch(e => console.log('Video autoplay failed:', e));
            }
        } else {
            // It's a source element, use the existing logic
            this.updateMediaElement(element, newSrc, fallbackSrc);
        }
    }

    updateMediaElement(sourceElement, newSrc, fallbackSrc) {
        const isGif = newSrc.toLowerCase().endsWith('.gif');
        const video = sourceElement.parentElement;

        if (!video || video.tagName !== 'VIDEO') {
            console.warn('updateMediaElement: Invalid video element', sourceElement);
            return;
        }

        if (isGif) {
            console.log('Replacing video with GIF:', newSrc);
            // Replace video with img element for GIFs
            const img = document.createElement('img');
            img.src = newSrc;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'fill';
            img.style.position = 'relative';

            // Copy classes from video
            if (video.className) {
                img.className = video.className;
            }

            // Replace video with img
            video.parentElement.replaceChild(img, video);
            console.log('Successfully replaced video with img for:', newSrc);

            // Add error handling
            img.onerror = () => {
                console.warn(`Failed to load GIF: ${newSrc}, using fallback`);
                // Fall back to default video if GIF fails
                const fallbackVideo = document.createElement('video');
                fallbackVideo.autoplay = true;
                fallbackVideo.loop = true;
                fallbackVideo.muted = true;
                fallbackVideo.playsInline = true;
                fallbackVideo.className = img.className;
                fallbackVideo.style.width = '100%';
                fallbackVideo.style.height = '100%';
                fallbackVideo.style.objectFit = 'fill';

                const source = document.createElement('source');
                source.src = fallbackSrc;
                source.type = 'video/mp4';
                fallbackVideo.appendChild(source);

                img.parentElement.replaceChild(fallbackVideo, img);
                fallbackVideo.load();
                fallbackVideo.play().catch(e => console.log('Fallback video autoplay failed:', e));
            };
        } else {
            // Use existing video update logic for MP4s
            this.updateVideoWithFallback(sourceElement, newSrc, fallbackSrc);
        }
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


    // Hide main init video when switching themes (if it exists)
    hideMainInitVideo() {
        const elements = this.cacheElements();
        if (elements.mainInitVideo) {
            elements.mainInitVideo.remove();
            // Clear cache after removal
            this.cachedElements.mainInitVideo = null;
        }
    }
}

// Create global instance
window.festivityManager = new FestivityManager();
