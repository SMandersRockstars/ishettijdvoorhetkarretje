import { useEffect } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { TimeProvider, useTime } from './contexts/TimeContext';
import { CartLocationProvider } from './contexts/CartLocationContext';
import { FlyingGameProvider, useFlyingGame } from './contexts/FlyingGameContext';
import { useCoinCursor } from './hooks/useCoinCursor';
import { useSnowfall } from './hooks/useSnowfall';
import { AnnoyingButton } from './components/AnnoyingButton';
import { CatGif } from './components/CatGif';
import { ThemeToggle } from './components/ThemeToggle';
import { SidePanel, SidePanelProvider } from './components/SidePanel';
import { Fish3D } from './components/Fish3D';
import { ContentArea } from './components/ContentArea';
import { CartMap } from './components/CartMap';
import { FestiveIntro } from './components/FestiveIntro';
import { FlyingImage } from './components/FlyingImage';
import { GameOverlay } from './components/GameOverlay';
import { PartyExplosion } from './components/PartyExplosion';
import { isFriday } from './utils/timeUtils';
import { Fan } from './components/Fan';

function ScreenShake() {
  const game = useFlyingGame();
  if (!game?.screenShake) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 10000,
      animation: 'screenShake 0.3s ease-out',
    }} />
  );
}

function AppContent() {
  const { theme, currentThemeKey } = useTheme();
  const { isPartyTime, testMode, toggleTestMode } = useTime();
  const showCartMap = isFriday();

  // Secret shortcut: Shift+K forces party time on/off so the takeover can be
  // previewed on any day of the week.
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey && e.code === 'KeyK') {
        toggleTestMode();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleTestMode]);

  useCoinCursor({ theme, isPartyTime });
  useSnowfall(currentThemeKey === 'wintersport');

  return (
    <>
      <AnnoyingButton />
      <ThemeToggle />
      <SidePanelProvider>
        <SidePanel />
        <div className="center">
          <Fish3D />
          <ContentArea />
          { showCartMap && <CartMap /> }
        </div>
        <SidePanel />
      </SidePanelProvider>
      <CatGif />
      <FestiveIntro />
      <FlyingImage />
      <GameOverlay />
      <PartyExplosion />
      <ScreenShake />
      <Fan />
    </>
  );
}

// Separate wrapper so AppContent can consume both ThemeContext and TimeContext
function AppWithTime() {
  const { theme } = useTheme();
  return (
    <TimeProvider theme={theme}>
      <CartLocationProvider>
        <FlyingGameProvider>
          <AppContent />
        </FlyingGameProvider>
      </CartLocationProvider>
    </TimeProvider>
  );
}

export default function App() {
  const path = window.location.pathname;

  if (path === '/waarishetkarretje') {
    return (
      <CartLocationProvider>
        <div style={{ backgroundColor: 'black', minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CartMap />
        </div>
      </CartLocationProvider>
    );
  }

  return (
    <ThemeProvider>
      <AppWithTime />
    </ThemeProvider>
  );
}

