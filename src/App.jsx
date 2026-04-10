import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { TimeProvider, useTime } from './contexts/TimeContext';
import { CartLocationProvider } from './contexts/CartLocationContext';
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
import { isFriday } from './utils/timeUtils';

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
    </>
  );
}

// Separate wrapper so AppContent can consume both ThemeContext and TimeContext
function AppWithTime() {
  const { theme } = useTheme();
  return (
    <TimeProvider theme={theme}>
      <CartLocationProvider>
        <AppContent />
      </CartLocationProvider>
    </TimeProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppWithTime />
    </ThemeProvider>
  );
}

