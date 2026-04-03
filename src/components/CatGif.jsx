import { useTheme } from '../contexts/ThemeContext';

export function CatGif() {
  const { theme, initialized } = useTheme();

  if (!initialized) return null;

  return (
    <img
      src={theme.gifs.cat}
      alt="Cat"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '20vw',
        height: '20vh',
        objectFit: 'contain',
        zIndex: 1000,
      }}
    />
  );
}

