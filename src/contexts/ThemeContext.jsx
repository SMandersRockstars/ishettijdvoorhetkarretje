import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { themes, detectCurrentTheme, isSpecialMonth } from '../utils/themes';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [currentThemeKey, setCurrentThemeKey] = useState(detectCurrentTheme);
  const [initialized, setInitialized] = useState(false);
  const audioRef = useRef(null);

  const theme = themes[currentThemeKey];

  // Apply theme CSS class to body whenever theme changes
  useEffect(() => {
    const allClasses = Object.values(themes).map((t) => t.cssClass);
    document.body.classList.remove(...allClasses);
    document.body.classList.add(theme.cssClass);
  }, [currentThemeKey, theme.cssClass]);

  // Manage background audio — only start after user initializes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (!initialized) return;

    const audio = new Audio(theme.audio.background);
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;
    audio.play().catch(() => {
      // Autoplay may still be blocked; user interaction should have unlocked it
    });

    return () => {
      audio.pause();
    };
  }, [currentThemeKey, initialized]);

  const toggleTheme = () => {
    setCurrentThemeKey((key) => {
      if (isSpecialMonth()) {
        return key === 'default' ? detectCurrentTheme() : 'default';
      }
      return 'default';
    });
  };

  const initialize = () => setInitialized(true);

  return (
    <ThemeContext.Provider
      value={{
        currentThemeKey,
        theme,
        initialized,
        initialize,
        toggleTheme,
        isSpecialMonth: isSpecialMonth(),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

