import { useRef, useEffect, createContext, useContext } from 'react';
import { useTheme } from '../contexts/ThemeContext';

// Shared context — holds the single hidden video and a canvas registry
const SharedVideoContext = createContext(null);

/**
 * Renders one hidden <video> element and runs a single rAF draw loop that
 * blits every frame to all registered canvases.  Wrap both <SidePanel />
 * usages in this provider so the video is decoded only once.
 */
export function SidePanelProvider({ children }) {
  const { theme } = useTheme();
  const videoRef = useRef(null);
  const canvasesRef = useRef(new Set());
  const rafRef = useRef(null);

  // Reload the shared video whenever the theme's source URLs change
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // React has already updated the <source> children in the DOM at this point
    video.load();
    video.play().catch(() => {});
  }, [theme.videos.subway, theme.videos.subwayWebm]);

  // Single shared draw loop — started once, runs for the provider's lifetime
  useEffect(() => {
    const draw = () => {
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        canvasesRef.current.forEach((canvas) => {
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        });
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const registerCanvas = (canvas) => {
    canvasesRef.current.add(canvas);
    return () => canvasesRef.current.delete(canvas);
  };

  return (
    <SharedVideoContext.Provider value={{ registerCanvas }}>
      {/* Hidden single source-of-truth video — decoded once, drawn to N canvases */}
      <video ref={videoRef} autoPlay loop muted playsInline style={{ display: 'none' }}>
        {theme.videos.subwayWebm && (
          <source src={theme.videos.subwayWebm} type="video/webm" />
        )}
        <source src={theme.videos.subway} type="video/mp4" />
      </video>
      {children}
    </SharedVideoContext.Provider>
  );
}

function SidePanelCanvas() {
  const { registerCanvas } = useContext(SharedVideoContext);
  const canvasRef = useRef(null);

  // Keep canvas intrinsic pixel dimensions in sync with its CSS display size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const syncSize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    syncSize();

    const observer = new ResizeObserver(syncSize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  // Register this canvas with the shared draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return registerCanvas(canvas);
  }, [registerCanvas]);

  return (
    <div className="side">
      {/* display:block removes the default inline gap beneath the canvas */}
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}

export function SidePanel() {
  return <SidePanelCanvas />;
}

