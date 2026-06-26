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
import { FishMedia } from './components/FishMedia';
import { ContentArea } from './components/ContentArea';
import { CartMap } from './components/CartMap';
import { FlyingImage } from './components/FlyingImage';
import { GameOverlay } from './components/GameOverlay';
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
  const { isPartyTime } = useTime();
  const showCartMap = isFriday();

  useCoinCursor({ theme, isPartyTime });
  useSnowfall(currentThemeKey === 'wintersport');

  return (
    <>
      <AnnoyingButton />
      <ThemeToggle />
      <SidePanelProvider>
        <SidePanel />
        <div className="center">
          <FishMedia />
          <ContentArea />
          {showCartMap && <CartMap />}
          <FishMedia />
        </div>
        <SidePanel />
      </SidePanelProvider>
      <CatGif />
      <FlyingImage />
      <GameOverlay />
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

