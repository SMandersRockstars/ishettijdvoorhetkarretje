import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { toggleTheme, isSpecialMonth, currentThemeKey } = useTheme();

  // Visible during special months or when a festive theme is currently active
  const visible = isSpecialMonth || currentThemeKey !== 'default';
  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 10000 }}>
      <button className="toggle-festive-btn" onClick={toggleTheme}>
        🎉 Toggle Festive Mode
      </button>
    </div>
  );
}

