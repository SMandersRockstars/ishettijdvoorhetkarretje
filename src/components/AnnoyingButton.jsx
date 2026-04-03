import { useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export function AnnoyingButton() {
  const { initialize, initialized } = useTheme();
  const btnRef = useRef(null);
  const rafRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (initialized) return;

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };

      if (!rafRef.current && btnRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          if (btnRef.current) {
            const btn = btnRef.current;
            btn.style.top = `${mouseRef.current.y - btn.clientHeight / 2}px`;
            btn.style.left = `${mouseRef.current.x - btn.clientWidth / 2}px`;
          }
          rafRef.current = null;
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [initialized]);

  if (initialized) return null;

  return (
    <button
      ref={btnRef}
      className="annoying-button"
      style={{ fontSize: '2em' }}
      onClick={initialize}
    >
      Klik hier voor de volledige ervaring
    </button>
  );
}

