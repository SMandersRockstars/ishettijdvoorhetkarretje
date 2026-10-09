import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { themes, detectCurrentTheme, isSpecialMonth } from '../utils/themes';

const ThemeContext = createContext(null);

const BASE_VOLUME = 0.5;
const DUCKED_VOLUME = 0.06;
const THEME_RECHECK_MS = 60_000;

export function ThemeProvider({ children }) {
  // The theme that the calendar implies right now. Re-checked on an interval so a
  // tab that sits open on an office monitor over the weekend / across a month
  // boundary does not keep a dead festivity forever.
  const [detectedThemeKey, setDetectedThemeKey] = useState(detectCurrentTheme);
  // Explicit user choice ("Toggle Festive Mode" → 'default'). `null` = follow the calendar.
  const [overrideKey, setOverrideKey] = useState(null);

  const currentThemeKey = overrideKey ?? detectedThemeKey;
  const theme = themes[currentThemeKey] ?? themes.default;
  const isFestive = currentThemeKey !== 'default';

  const [initialized, setInitialized] = useState(false);
  const [ducked, setDucked] = useState(false);
  const audioRef = useRef(null);

  // Apply theme CSS class to body whenever theme changes
  useEffect(() => {
    const allClasses = Object.values(themes).map((t) => t.cssClass);
    document.body.classList.remove(...allClasses);
    document.body.classList.add(theme.cssClass);
  }, [theme.cssClass]);

  // Keep the detected theme in sync with the calendar
  useEffect(() => {
    const id = setInterval(() => setDetectedThemeKey(detectCurrentTheme()), THEME_RECHECK_MS);
    return () => clearInterval(id);
  }, []);

  // Manage background audio — only start after user initializes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (!initialized) return;

    const audio = new Audio(theme.audio.background);
    audio.loop = true;
    audio.volume = ducked ? DUCKED_VOLUME : BASE_VOLUME;
    audioRef.current = audio;
    audio.play().catch(() => {
      // Autoplay may still be blocked; user interaction should have unlocked it
    });

    return () => {
      audio.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme.audio.background, initialized]);

  // Duck (don't stop) the music while something else needs the speakers,
  // e.g. the festive intro clip.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = ducked ? DUCKED_VOLUME : BASE_VOLUME;
  }, [ducked]);

  const toggleTheme = useCallback(() => {
    setOverrideKey((key) => (key === null ? 'default' : null));
  }, []);

  const initialize = useCallback(() => setInitialized(true), []);

  return (
    <ThemeContext.Provider
      value={{
        currentThemeKey,
        theme,
        initialized,
        initialize,
        toggleTheme,
        ducked,
        setDucked,
        isSpecialMonth: isSpecialMonth(),
        isFestive,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
