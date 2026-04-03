import { useEffect, useRef } from 'react';

function createSnowflakeSVG(size) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 64 64');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('stroke', '#fff');
  g.setAttribute('stroke-width', '3');
  g.setAttribute('stroke-linecap', 'round');
  g.setAttribute('fill', 'none');

  for (let i = 0; i < 6; i++) {
    const angle = i * 60;
    const rad = (angle * Math.PI) / 180;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '32');
    line.setAttribute('y1', '32');
    line.setAttribute('x2', 32 + Math.cos(rad) * 28);
    line.setAttribute('y2', 32 + Math.sin(rad) * 28);
    g.appendChild(line);

    const mx = 32 + Math.cos(rad) * 16;
    const my = 32 + Math.sin(rad) * 16;

    for (const offset of [30, -30]) {
      const bRad = ((angle + offset) * Math.PI) / 180;
      const branch = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      branch.setAttribute('x1', mx);
      branch.setAttribute('y1', my);
      branch.setAttribute('x2', mx + Math.cos(bRad) * 10);
      branch.setAttribute('y2', my + Math.sin(bRad) * 10);
      g.appendChild(branch);
    }
  }

  svg.appendChild(g);
  return svg;
}

export function useSnowfall(isActive) {
  const intervalRef = useRef(null);

  useEffect(() => {
    // Always clean up previous snowflakes when effect re-runs
    document.querySelectorAll('.snowflake').forEach((el) => el.remove());
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isActive) return;

    const maxFlakes = 40;
    let activeFlakes = 0;

    const spawnFlake = () => {
      if (activeFlakes >= maxFlakes) return;

      const flake = document.createElement('div');
      flake.classList.add('snowflake');

      const size = Math.random() * 30 + 20;
      const left = Math.random() * 100;
      const fallDuration = Math.random() * 6 + 5;
      const swayDuration = Math.random() * 4 + 3;
      const opacity = Math.random() * 0.4 + 0.4;

      flake.appendChild(createSnowflakeSVG(size));
      flake.style.left = `${left}vw`;
      flake.style.opacity = opacity;
      flake.style.animationDuration = `${fallDuration}s, ${swayDuration}s`;
      flake.style.animationDelay = `0s, ${Math.random() * 2}s`;

      document.body.appendChild(flake);
      activeFlakes++;

      setTimeout(() => {
        flake.remove();
        activeFlakes--;
      }, fallDuration * 1000);
    };

    // Initial burst
    for (let i = 0; i < 15; i++) {
      setTimeout(spawnFlake, Math.random() * 2000);
    }

    intervalRef.current = setInterval(spawnFlake, 300);

    return () => {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      document.querySelectorAll('.snowflake').forEach((el) => el.remove());
    };
  }, [isActive]);
}

