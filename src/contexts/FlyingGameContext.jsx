import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const HIGH_SCORE_KEY = 'karretje_duckhunt_highscore';
const ROUND_DURATION = 10000; // 10s per round
const INITIAL_TARGETS = 3;
const MAX_ROUNDS = 3;

function getHighScore() {
  try {
    return parseInt(localStorage.getItem(HIGH_SCORE_KEY), 10) || 0;
  } catch {
    return 0;
  }
}

function setHighScore(score) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, score);
  } catch { /* silently ignore */ }
}

function getSpeedMultiplier(round) {
  return 1 + (round - 1) * 0.3;
}

function getMissCost(round) {
  return round >= 3 ? 1 : 0;
}

const FlyingGameContext = createContext(null);

export function FlyingGameProvider({ children }) {
  const [highScore, setHighScoreState] = useState(getHighScore);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [round, setRound] = useState(1);
  const [combo, setCombo] = useState(0);
  const [roundTimeLeft, setRoundTimeLeft] = useState(ROUND_DURATION);
  const [screenShake, setScreenShake] = useState(false);
  const [scorePopups, setScorePopups] = useState([]);
  const [roundTransition, setRoundTransition] = useState(null);
  const [activeTargetIds, setActiveTargetIds] = useState([]);
  const roundRef = useRef(1);
  const livesRef = useRef(3);

  useEffect(() => {
    roundRef.current = round;
  }, [round]);

  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  const updateHighScore = useCallback((s) => {
    if (s > highScore) {
      setHighScoreState(s);
      setHighScore(s);
    }
  }, [highScore]);

  const startGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setRound(1);
    setCombo(0);
    setRoundTimeLeft(ROUND_DURATION);
    setActiveTargetIds([]);
    setGameOver(false);
    roundRef.current = 1;
    livesRef.current = 3;
    setIsPlaying(true);
  }, []);

  const endGame = useCallback(() => {
    updateHighScore(score);
    setIsPlaying(false);
    setGameOver(true);
    setActiveTargetIds([]);
  }, [score, updateHighScore]);

  const nextRound = useCallback(() => {
    setRound(prev => prev + 1);
    setRoundTimeLeft(ROUND_DURATION);
    setActiveTargetIds([]);
  }, []);

  const addScorePopup = useCallback((x, y, text) => {
    const id = Date.now() + Math.random();
    setScorePopups(prev => [...prev, { id, x, y, text }]);
    setTimeout(() => {
      setScorePopups(prev => prev.filter(p => p.id !== id));
    }, 1000);
  }, []);

  const triggerScreenShake = useCallback(() => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 300);
  }, []);

  const registerTarget = useCallback((id) => {
    setActiveTargetIds(prev => [...prev, id]);
  }, []);

  const unregisterTarget = useCallback((id) => {
    setActiveTargetIds(prev => prev.filter(tid => tid !== id));
  }, []);

  const recordHit = useCallback((x, y) => {
    const newCombo = combo + 1;
    const multiplier = Math.min(newCombo, 5);
    const points = 100 * multiplier;
    setScore(prev => prev + points);
    setCombo(newCombo);
    addScorePopup(x, y, `+${points} (${multiplier}x)`);
    return points;
  }, [combo, addScorePopup]);

  const recordMiss = useCallback(() => {
    const cost = getMissCost(roundRef.current);
    setCombo(0);
    setScore(prev => Math.max(0, prev - 50));
    if (cost > 0) {
      setLives(prev => {
        const newLives = prev - cost;
        livesRef.current = newLives;
        if (newLives <= 0) {
          setTimeout(() => endGame(), 500);
        }
        return newLives;
      });
    }
  }, [endGame]);

  // Round timer
  useEffect(() => {
    if (!isPlaying || roundTransition) return;
    if (roundTimeLeft <= 0) {
      if (round >= MAX_ROUNDS) {
        endGame();
      } else {
        setRoundTransition({ round, allHit: false });
        setTimeout(() => {
          setRoundTransition(null);
          nextRound();
        }, 1500);
      }
      return;
    }
    const timer = setTimeout(() => setRoundTimeLeft(prev => prev - 100), 100);
    return () => clearTimeout(timer);
  }, [isPlaying, roundTimeLeft, round, roundTransition, nextRound, endGame]);

  const spawnNextTarget = useCallback(() => {
    if (!isPlaying) return null;
    const id = `${roundRef.current}-${Date.now()}-${Math.random()}`;
    registerTarget(id);
    return id;
  }, [isPlaying, registerTarget]);

  return (
    <FlyingGameContext.Provider
      value={{
        isPlaying,
        gameOver,
        score,
        lives,
        round,
        combo,
        highScore,
        roundTimeLeft,
        roundDuration: ROUND_DURATION,
        initialTargets: INITIAL_TARGETS,
        speedMultiplier: getSpeedMultiplier(round),
        screenShake,
        scorePopups,
        roundTransition,
        activeTargetIds,
        startGame,
        endGame,
        recordHit,
        recordMiss,
        spawnNextTarget,
        unregisterTarget,
      }}
    >
      {children}
    </FlyingGameContext.Provider>
  );
}

export function useFlyingGame() {
  return useContext(FlyingGameContext);
}
