import { useState, useEffect, useCallback, useRef } from 'react';
import maikeldekar from '../assets/maikeldekar.png';
import { useTheme } from '../contexts/ThemeContext';
import { useTime } from '../contexts/TimeContext';

const DEFAULT_IMAGE_SRC = maikeldekar;

const TRAIL_CONFIG = {
  throttleMs: 100,
  gravity: 0.4,
  baseVelocityY: -6,
  velocityRange: 4,
  velocityXRange: 6,
  fadeStart: 1200,
  fadeOut: 400,
};

/**
 * Returns a position just outside one of the four screen edges.
 * cssX/cssY are CSS strings for left/top; numX/numY are numeric proxies for angle calculation.
 */
function getRandomEdgePosition(size) {
  const side = Math.floor(Math.random() * 4); // 0:left 1:right 2:top 3:bottom
  const pos = 10 + Math.random() * 80;        // 10%–90% along the edge

  switch (side) {
    case 0: return { cssX: `calc(-${size}px - 20px)`, cssY: `${pos}vh`, numX: -20, numY: pos, side };
    case 1: return { cssX: `calc(100vw + 20px)`,      cssY: `${pos}vh`, numX: 120, numY: pos, side };
    case 2: return { cssX: `${pos}vw`, cssY: `calc(-${size}px - 20px)`, numX: pos, numY: -20, side };
    case 3: return { cssX: `${pos}vw`, cssY: `calc(100vh + 20px)`,      numX: pos, numY: 120, side };
    default: return { cssX: `calc(-${size}px - 20px)`, cssY: '50vh', numX: -20, numY: 50, side: 0 };
  }
}

export function FlyingImage({ src = DEFAULT_IMAGE_SRC, size = 400 }) {
  const [fly, setFly] = useState(null);
  const imgRef = useRef(null);
  const { theme } = useTheme();
  const { isPartyTime } = useTime();
  const themeRef = useRef({ theme, isPartyTime });

  useEffect(() => {
    themeRef.current = { theme, isPartyTime };
  }, [theme, isPartyTime]);

  const startFly = useCallback(() => {
    // Clamp to 50% of the viewport so it fits on mobile
    const effectiveSize = Math.min(size, window.innerWidth * 0.5);
    const start = getRandomEdgePosition(effectiveSize);
    // Pick an exit side that differs from the entry side
    let end;
    do { end = getRandomEdgePosition(effectiveSize); } while (end.side === start.side);

    const duration = 2500 + Math.random() * 2000; // 2.5 – 4.5 s

    // Rotate the image to face the direction of travel (using numeric proxies)
    const dx = end.numX - start.numX;
    const dy = end.numY - start.numY;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    setFly({ start, end, duration, angle, phase: 'start', effectiveSize });
  }, [size]);

  // Fire once shortly after mount, then every 20 seconds
  useEffect(() => {
    const initial = setTimeout(startFly, 1000);
    const interval = setInterval(startFly, 20000);
    return () => { clearTimeout(initial); clearInterval(interval); };
  }, [startFly]);

  useEffect(() => {
    if (!fly) return;

    if (fly.phase === 'start') {
      // Wait two animation frames so the browser paints the start position
      // before we switch to the transition, avoiding an instant jump.
      let raf;
      const outer = requestAnimationFrame(() => {
        raf = requestAnimationFrame(() => {
          setFly(prev => prev ? { ...prev, phase: 'fly' } : null);
        });
      });
      return () => { cancelAnimationFrame(outer); cancelAnimationFrame(raf); };
    }

    if (fly.phase === 'fly') {
      const timer = setTimeout(() => setFly(null), fly.duration + 500);
      return () => clearTimeout(timer);
    }
  }, [fly?.phase]);

  // Particle trail while flying
  useEffect(() => {
    if (fly?.phase !== 'fly') return;

    const activeParticles = [];
    let animFrameId = null;
    let lastSpawnTime = 0;
    let particleCounter = 0;
    const angleRad = fly.angle * (Math.PI / 180);

    function spawnParticle(x, y, imageUrl) {
      const el = document.createElement('img');
      el.src = imageUrl;
      el.classList.add(themeRef.current.isPartyTime ? 'party-coin' : 'coin');
      el.style.cssText = 'position:fixed;top:0;left:0;will-change:transform,opacity;';
      const data = {
        element: el,
        posX: x - 15,
        posY: y - 15,
        vx: (Math.random() - 0.5) * TRAIL_CONFIG.velocityXRange,
        vy: TRAIL_CONFIG.baseVelocityY - Math.random() * TRAIL_CONFIG.velocityRange,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        createdAt: Date.now(),
        opacity: 1,
      };
      document.body.appendChild(el);
      activeParticles.push(data);
    }

    const loop = () => {
      const now = Date.now();

      // Spawn new particles from the trailing edge of the image
      if (imgRef.current && now - lastSpawnTime > TRAIL_CONFIG.throttleMs) {
        const rect = imgRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        // Back = center offset opposite to direction of travel
        const backX = cx - Math.cos(angleRad) * (rect.width / 2);
        const backY = cy - Math.sin(angleRad) * (rect.height / 2);

        const { theme: t, isPartyTime: party } = themeRef.current;
        const images = party ? t.partyImages : t.coinImages;
        const count = Math.floor(Math.random() * 3) + 2; // 2–4 per spawn
        for (let i = 0; i < count; i++) {
          spawnParticle(backX, backY, images[particleCounter % images.length]);
          particleCounter++;
        }
        lastSpawnTime = now;
      }

      // Animate existing particles
      for (let i = activeParticles.length - 1; i >= 0; i--) {
        const p = activeParticles[i];
        const elapsed = now - p.createdAt;
        p.posX += p.vx;
        p.posY += p.vy;
        p.vy += TRAIL_CONFIG.gravity;
        p.rotation += p.rotationSpeed;
        if (elapsed > TRAIL_CONFIG.fadeStart) {
          p.opacity = Math.max(0, 1 - (elapsed - TRAIL_CONFIG.fadeStart) / TRAIL_CONFIG.fadeOut);
        }
        if (elapsed > TRAIL_CONFIG.fadeStart + TRAIL_CONFIG.fadeOut || p.posY > window.innerHeight + 100) {
          if (document.body.contains(p.element)) document.body.removeChild(p.element);
          activeParticles.splice(i, 1);
          continue;
        }
        p.element.style.transform = `translate3d(${p.posX}px, ${p.posY}px, 0) rotate(${p.rotation}deg)`;
        p.element.style.opacity = p.opacity;
      }

      animFrameId = requestAnimationFrame(loop);
    };

    animFrameId = requestAnimationFrame(loop);

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      activeParticles.forEach(p => {
        if (document.body.contains(p.element)) document.body.removeChild(p.element);
      });
      activeParticles.length = 0;
    };
  }, [fly?.phase, fly?.angle]);

  if (!fly) return null;

  const { start, end, duration, angle, phase, effectiveSize } = fly;
  const cssX = phase === 'fly' ? end.cssX : start.cssX;
  const cssY = phase === 'fly' ? end.cssY : start.cssY;

  return (
    <img
      ref={imgRef}
      src={src}
      alt="Flying object"
      style={{
        position: 'fixed',
        left: cssX,
        top: cssY,
        width: `${effectiveSize}px`,
        height: 'auto',
        transform: `rotate(${angle}deg)`,
        transition: phase === 'fly'
          ? `left ${duration}ms linear, top ${duration}ms linear`
          : 'none',
        zIndex: 9997,
        pointerEvents: 'none',
      }}
    />
  );
}
