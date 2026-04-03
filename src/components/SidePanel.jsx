import { useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

function SidePanelVideo() {
  const { theme } = useTheme();
  const videoRef = useRef(null);

  // IntersectionObserver — play only when visible
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) video.play().catch(() => {});
          else video.pause();
        });
      },
      { threshold: 0.25, rootMargin: '50px' }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="side">
      {/* key forces remount (and therefore reload) when the video source changes */}
      <video key={theme.videos.subway} ref={videoRef} autoPlay loop muted playsInline>
        {theme.videos.subwayWebm && (
          <source src={theme.videos.subwayWebm} type="video/webm" />
        )}
        <source src={theme.videos.subway} type="video/mp4" />
      </video>
    </div>
  );
}

export function SidePanel() {
  return <SidePanelVideo />;
}

