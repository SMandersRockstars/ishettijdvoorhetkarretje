import { createContext, useContext, useState, useEffect } from 'react';
import { computeTimeState } from '../utils/timeUtils';
import config from '../config.json';

const TimeContext = createContext(null);

export function TimeProvider({ children }) {
  const [testMode, setTestMode] = useState(false);
  const [timeState, setTimeState] = useState(() => computeTimeState(config, false));

  useEffect(() => {
    function update() {
      setTimeState(computeTimeState(config, testMode));
    }
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [testMode]);

  return (
    <TimeContext.Provider
      value={{
        ...timeState,
        testMode,
        toggleTestMode: () => setTestMode((t) => !t),
      }}
    >
      {children}
    </TimeContext.Provider>
  );
}

export function useTime() {
  return useContext(TimeContext);
}

