import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { TimeProvider, useTime } from './contexts/TimeContext';
import { useCoinCursor } from './hooks/useCoinCursor';
import { useSnowfall } from './hooks/useSnowfall';
import { AnnoyingButton } from './components/AnnoyingButton';
import { CatGif } from './components/CatGif';
import { ThemeToggle } from './components/ThemeToggle';
import { SidePanel, SidePanelProvider } from './components/SidePanel';
import { FishMedia } from './components/FishMedia';
import { ContentArea } from './components/ContentArea';

function AppContent() {
  const { theme, currentThemeKey } = useTheme();
  const { isPartyTime } = useTime();

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
          <FishMedia />
        </div>
        <SidePanel />
      </SidePanelProvider>
      <CatGif />
    </>
  );
}

// Separate wrapper so AppContent can consume both ThemeContext and TimeContext
function AppWithTime() {
  const { theme } = useTheme();
  return (
    <TimeProvider theme={theme}>
      <AppContent />
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

