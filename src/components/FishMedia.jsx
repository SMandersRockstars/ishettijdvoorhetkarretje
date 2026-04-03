import { useTheme } from '../contexts/ThemeContext';

export function FishMedia() {
  const { theme } = useTheme();
  const isGif = theme.gifs.fish.toLowerCase().endsWith('.gif');

  return (
    <div className="fish">
      {isGif ? (
        <img
          // key forces re-render when src changes between themes
          key={theme.gifs.fish}
          src={theme.gifs.fish}
          alt="Fish"
          style={{ width: '100%', height: '100%', objectFit: 'fill' }}
        />
      ) : (
        <video key={theme.gifs.fish} autoPlay loop muted playsInline>
          <source src={theme.gifs.fish} type="video/mp4" />
        </video>
      )}
    </div>
  );
}

