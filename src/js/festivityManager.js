// Festivity Manager - Handles seasonal themes and special month decorations
class FestivityManager {
    constructor() {
        // Cache DOM element references for better performance
        this.cachedElements = null;
        this.backgroundAudio = null; // Store audio element

        this.themes = {
            oeteldonk: {
                name: 'Oeteldonk',
                months: [2], // February - Carnival season
                coinImages: [
                    'assets/oeteldonk-mode/frog-coin.png',
                    'assets/oeteldonk-mode/carnival-coin.png',
                    'assets/oeteldonk-mode/confetti-coin.png',
                    'assets/oeteldonk-mode/mask-coin.png'
                ],
                gifs: {
                    beer: 'assets/default-mode/beer-drinking.gif',
                    cat: 'assets/oeteldonk-mode/oeteldonk-cat.gif',
                    fish: 'assets/default-mode/fish.mp4'
                },
                videos: {
                    subway: 'assets/default-mode/youtube_RbVMiu4ubT0_480x854_h264_opt.mp4',
                    init: 'assets/default-mode/fish.mp4'
                },
                audio: {
                    background: 'assets/oeteldonk-mode/oeteldonk-music.mp3'
                },
                partyImages: [
                    'assets/oeteldonk-mode/oeteldonk-heineken.png',
                    'assets/oeteldonk-mode/oeteldonk-hertog.png',
                    'assets/oeteldonk-mode/oeteldonk-lays.png',
                    'assets/oeteldonk-mode/oeteldonk-boonekamp.png'
                ],
                icon: 'assets/oeteldonk-mode/oeteldonk-cart.png',
                fullCart: 'assets/oeteldonk-mode/oeteldonk-full-cart.png',
                cssClass: 'oeteldonk-theme'
            },
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
                    subway: 'assets/default-mode/youtube_RbVMiu4ubT0_480x854_h264_opt.mp4',
                    init: 'assets/spooktober-mode/halloween-init.mp4'
                },
                audio: {
                    background: 'assets/default-mode/fish-music.mp3' // Fallback to default music
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
            wintersport: {
                name: 'Wintersport',
                months: [3], // March - Ski season
                coinImages: [
                    'assets/wintersport-mode/ski-coin.svg',
                    'assets/wintersport-mode/snowboard-coin.svg',
                    'assets/wintersport-mode/gondel-coin.svg',
                    'assets/wintersport-mode/snowflake-coin.svg'
                ],
                gifs: {
                    beer: 'assets/default-mode/beer-drinking.gif',
                    cat: 'assets/wintersport-mode/vallendeskiboy.gif',
                    fish: 'assets/default-mode/fish.mp4'
                },
                videos: {
                    subway: 'assets/default-mode/youtube_RbVMiu4ubT0_480x854_h264_opt.mp4',
                    init: 'assets/default-mode/fish.mp4'
                },
                audio: {
                    background: 'assets/wintersport-mode/DJ Ötzi - Anton aus Tirol (Not Barocka Remix).mp3'
                },
                partyImages: [
                    'assets/default-mode/heineken.png',
                    'assets/default-mode/hertog_jan.png',
                    'assets/default-mode/lays.png',
                    'assets/default-mode/boonekamp.png'
                ],
                icon: 'assets/wintersport-mode/wintersport-empty-cart.png',
                fullCart: 'assets/wintersport-mode/wintersport-full-cart.png',
                cssClass: 'wintersport-theme'
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
                    subway: 'assets/default-mode/youtube_RbVMiu4ubT0_480x854_h264_opt.mp4',
                    init: 'assets/default-mode/fish.mp4'
                },
                audio: {
                    background: 'assets/default-mode/fish-music.mp3'
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
                cartIcon: document.getElementById('icon')
            };
        }
        return this.cachedElements;
    }

    applyTheme() {
        // Remove existing theme classes
        document.body.classList.remove('oeteldonk-theme', 'halloween-theme', 'christmas-theme', 'wintersport-theme', 'default-theme');

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

        // Handle snowfall effect for wintersport theme
        this.updateSnowfall();

    }

    // Snowfall effect for wintersport theme
    updateSnowfall() {
        // Remove existing snowflakes
        document.querySelectorAll('.snowflake').forEach(el => el.remove());
        if (this.snowInterval) {
            clearInterval(this.snowInterval);
            this.snowInterval = null;
        }

        if (this.currentTheme !== 'wintersport') return;

        const maxFlakes = 40;
        let activeFlakes = 0;

        const createSnowflakeSVG = (size) => {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 64 64');
            svg.setAttribute('width', size);
            svg.setAttribute('height', size);
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('stroke', '#fff');
            g.setAttribute('stroke-width', '3');
            g.setAttribute('stroke-linecap', 'round');
            g.setAttribute('fill', 'none');
            // 6 arms
            for (let i = 0; i < 6; i++) {
                const angle = i * 60;
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', '32'); line.setAttribute('y1', '32');
                const rad = angle * Math.PI / 180;
                line.setAttribute('x2', 32 + Math.cos(rad) * 28);
                line.setAttribute('y2', 32 + Math.sin(rad) * 28);
                g.appendChild(line);
                // branches
                const bRad1 = (angle + 30) * Math.PI / 180;
                const bRad2 = (angle - 30) * Math.PI / 180;
                const mx = 32 + Math.cos(rad) * 16;
                const my = 32 + Math.sin(rad) * 16;
                const branch1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                branch1.setAttribute('x1', mx); branch1.setAttribute('y1', my);
                branch1.setAttribute('x2', mx + Math.cos(bRad1) * 10);
                branch1.setAttribute('y2', my + Math.sin(bRad1) * 10);
                const branch2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                branch2.setAttribute('x1', mx); branch2.setAttribute('y1', my);
                branch2.setAttribute('x2', mx + Math.cos(bRad2) * 10);
                branch2.setAttribute('y2', my + Math.sin(bRad2) * 10);
                g.appendChild(branch1);
                g.appendChild(branch2);
            }
            svg.appendChild(g);
            return svg;
        };

        const spawnFlake = () => {
            if (activeFlakes >= maxFlakes) return;

            const flake = document.createElement('div');
            flake.classList.add('snowflake');

            const size = Math.random() * 30 + 20; // 20px - 50px
            const left = Math.random() * 100;
            const fallDuration = Math.random() * 6 + 5; // 5-11s
            const swayDuration = Math.random() * 4 + 3; // 3-7s
            const opacity = Math.random() * 0.4 + 0.4; // 0.4-0.8

            flake.appendChild(createSnowflakeSVG(size));
            flake.style.left = left + 'vw';
            flake.style.opacity = opacity;
            flake.style.animationDuration = fallDuration + 's, ' + swayDuration + 's';
            flake.style.animationDelay = '0s, ' + (Math.random() * 2) + 's';

            document.body.appendChild(flake);
            activeFlakes++;

            // Remove after animation completes
            setTimeout(() => {
                flake.remove();
                activeFlakes--;
            }, fallDuration * 1000);
        };

        // Spawn initial batch
        for (let i = 0; i < 15; i++) {
            setTimeout(spawnFlake, Math.random() * 2000);
        }

        // Keep spawning
        this.snowInterval = setInterval(spawnFlake, 300);
    }

    // Get background audio source for current theme (with fallback to default)
    getBackgroundAudioSrc() {
        const theme = this.getCurrentTheme();
        if (theme.audio && theme.audio.background) {
            return theme.audio.background;
        }
        // Fallback to default theme's audio
        return this.themes.default.audio.background;
    }

    // Update background audio element (creates new Audio if needed)
    updateBackgroundAudio() {
        const audioSrc = this.getBackgroundAudioSrc();

        // Stop and remove current audio if it exists
        if (this.backgroundAudio) {
            this.backgroundAudio.pause();
            this.backgroundAudio.remove();
            this.backgroundAudio = null;
        }

        // Create new audio element
        this.backgroundAudio = new Audio(audioSrc);
        this.backgroundAudio.loop = true;
        this.backgroundAudio.volume = 0.5;

        // Try to play (may require user interaction)
        this.backgroundAudio.play().catch(() => {
            console.log('Background audio autoplay blocked. User interaction required.');
        });
    }

    // Play background audio (call after user interaction)
    playBackgroundAudio() {
        if (!this.backgroundAudio) {
            this.updateBackgroundAudio();
        }
        this.backgroundAudio.play().catch(() => {});
    }

    updateMediaElements() {
        const theme = this.getCurrentTheme();
        const elements = this.cacheElements();

        // Update beer drinking gif
        if (elements.beerGif) {
            this.updateImageWithFallback(elements.beerGif, theme.gifs.beer, 'assets/default-mode/beer-drinking.gif');
        }

        // Update cat gif (if it exists)
        if (elements.catGif) {
            this.updateImageWithFallback(elements.catGif, theme.gifs.cat, 'assets/default-mode/cat.gif');
        }

        // Update fish - handle both video and gif formats, and both video and img elements
        elements.fishElements.forEach(element => {
            this.updateAnyMediaElement(element, theme.gifs.fish, 'assets/default-mode/fish.mp4');
        });

        // Always keep fish videos muted - audio now comes from background audio
        document.querySelectorAll('.fish video').forEach(video => {
            video.muted = true;
        });

        // Update subway surfers videos (side panels) - update each video element once
        document.querySelectorAll('.side video').forEach(video => {
            this.updateSideVideo(video, theme.videos.subway);
        });

        // Double-check all subway videos are muted
        document.querySelectorAll('.side video').forEach(video => {
            video.muted = true;
            video.volume = 0;
        });

        // Update cart icon (both empty and full cart depending on party time)
        if (elements.cartIcon) {
            if (window.timeManager.isPartyTime()) {
                this.updateImageWithFallback(elements.cartIcon, theme.fullCart, 'assets/default-mode/full_cart.jpg');
            } else {
                this.updateImageWithFallback(elements.cartIcon, theme.icon, 'assets/default-mode/empty_cart.png');
            }
        }

        // Ensure ALL videos on page are muted (audio comes from backgroundAudio)
        document.querySelectorAll('video').forEach(video => {
            video.muted = true;
        });
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

    updateSideVideo(video, newSrc) {
        // Remove all existing sources to avoid multiple load() calls (one per source)
        while (video.firstChild) {
            video.removeChild(video.firstChild);
        }

        const isWebmSrc = newSrc.endsWith('.webm');

        // For non-webm sources, also add a webm variant if one exists alongside it
        if (!isWebmSrc) {
            const webmSrc = newSrc.replace(/(_h264)?\.mp4$/, '_vp9.webm');
            const webmSource = document.createElement('source');
            webmSource.src = webmSrc;
            webmSource.type = 'video/webm';
            video.appendChild(webmSource);
        }

        const mp4Source = document.createElement('source');
        mp4Source.src = newSrc;
        mp4Source.type = isWebmSrc ? 'video/webm' : 'video/mp4';
        video.appendChild(mp4Source);

        video.muted = true;
        video.load(); // Called exactly once per video
        if (video.autoplay) {
            video.play().catch(() => {});
        }
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
                element.src = newSrc;
            } else {
                // img → video: replace img with video
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
            return;
        }

        if (isGif) {
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

            // Force time display to refresh with new theme's icons
            if (window.timeManager) {
                window.timeManager.lastState = null;
                window.timeManager.notifySubscribers();
            }

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

}

// Create global instance
window.festivityManager = new FestivityManager();
