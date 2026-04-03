import { useEffect, useRef } from 'react';

const COIN_CONFIG = {
  gravity: 0.5,
  baseVelocityY: -8,
  velocityRange: 5,
  velocityXRange: 8,
  throttleDelay: 80,
  maxCoins: 100,
  fadeStart: 1500,
  fadeOut: 500,
};

export function useCoinCursor({ theme, isPartyTime }) {
  // Keep latest values accessible inside the stable event listener without re-registering
  const stateRef = useRef({ theme, isPartyTime });
  useEffect(() => {
    stateRef.current = { theme, isPartyTime };
  }, [theme, isPartyTime]);

  useEffect(() => {
    const activeCoins = [];
    let animFrameId = null;
    let lastCoinTime = 0;
    let lastMousePos = null;
    let coinCounter = 0;

    function startLoop() {
      const animate = () => {
        for (let i = activeCoins.length - 1; i >= 0; i--) {
          const cd = activeCoins[i];
          const elapsed = Date.now() - cd.createdAt;

          cd.posX += cd.vx;
          cd.posY += cd.vy;
          cd.vy += COIN_CONFIG.gravity;
          cd.rotation += cd.rotationSpeed;

          if (elapsed > COIN_CONFIG.fadeStart) {
            const fp = (elapsed - COIN_CONFIG.fadeStart) / COIN_CONFIG.fadeOut;
            cd.opacity = Math.max(0, 1 - fp);
          }

          const gone =
            elapsed > COIN_CONFIG.fadeStart + COIN_CONFIG.fadeOut ||
            cd.posY > window.innerHeight + 100 ||
            cd.posX < -50 ||
            cd.posX > window.innerWidth + 50;

          if (gone) {
            if (document.body.contains(cd.element)) document.body.removeChild(cd.element);
            activeCoins.splice(i, 1);
            continue;
          }

          cd.element.style.transform = `translate3d(${cd.posX}px, ${cd.posY}px, 0) rotate(${cd.rotation}deg)`;
          cd.element.style.opacity = cd.opacity;
        }

        if (activeCoins.length > 0) {
          animFrameId = requestAnimationFrame(animate);
        } else {
          animFrameId = null;
        }
      };
      animFrameId = requestAnimationFrame(animate);
    }

    function createCoin(x, y, imageUrl) {
      const coin = document.createElement('img');
      coin.src = imageUrl;
      coin.classList.add(stateRef.current.isPartyTime ? 'party-coin' : 'coin');
      coin.style.position = 'fixed';
      coin.style.top = '0';
      coin.style.left = '0';
      coin.style.willChange = 'transform, opacity';

      const coinData = {
        element: coin,
        posX: x - 15,
        posY: y - 15,
        vx: (Math.random() - 0.5) * COIN_CONFIG.velocityXRange,
        vy: COIN_CONFIG.baseVelocityY - Math.random() * COIN_CONFIG.velocityRange,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        createdAt: Date.now(),
        opacity: 1,
      };

      document.body.appendChild(coin);
      activeCoins.push(coinData);

      if (!animFrameId) startLoop();
    }

    function handleMouseMove(e) {
      const now = Date.now();
      if (now - lastCoinTime < COIN_CONFIG.throttleDelay) return;
      if (activeCoins.length >= COIN_CONFIG.maxCoins) return;

      const { theme: t, isPartyTime: party } = stateRef.current;
      const images = party ? t.partyImages : t.coinImages;

      let coinCount = 1;
      if (lastMousePos) {
        const dx = e.clientX - lastMousePos.x;
        const dy = e.clientY - lastMousePos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 50) coinCount = Math.floor(Math.random() * 2) + 2;
        else if (dist > 20) coinCount = Math.floor(Math.random() * 2) + 1;
      }

      lastMousePos = { x: e.clientX, y: e.clientY };
      lastCoinTime = now;

      for (let i = 0; i < coinCount; i++) {
        createCoin(e.clientX, e.clientY, images[coinCounter % images.length]);
        coinCounter++;
      }
    }

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
      }
      activeCoins.forEach((cd) => {
        if (document.body.contains(cd.element)) document.body.removeChild(cd.element);
      });
      activeCoins.length = 0;
    };
  }, []); // Intentionally empty — stateRef always has current values
}

